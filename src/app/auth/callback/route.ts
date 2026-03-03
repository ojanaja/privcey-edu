import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const meta = user.user_metadata;
                const updates: Record<string, string> = {};

                if (meta?.avatar_url) {
                    updates.avatar_url = meta.avatar_url;
                }
                if (meta?.full_name || meta?.name) {
                    updates.full_name = meta.full_name || meta.name;
                }

                if (Object.keys(updates).length > 0) {
                    await supabase
                        .from('profiles')
                        .update(updates)
                        .eq('id', user.id);
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
}
