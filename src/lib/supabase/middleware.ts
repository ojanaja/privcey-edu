import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
    const isPublicPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api');

    if (!user && !isAuthPage && !isPublicPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        return NextResponse.redirect(url);
    }

    if (user && isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, payment_status, is_active')
            .eq('id', user.id)
            .single();

        if (profile) {
            if (!profile.is_active) {
                const url = request.nextUrl.clone();
                url.pathname = '/blocked';
                return NextResponse.redirect(url);
            }

            if (
                request.nextUrl.pathname.startsWith('/dashboard/admin') &&
                profile.role !== 'admin'
            ) {
                const url = request.nextUrl.clone();
                url.pathname = '/dashboard';
                return NextResponse.redirect(url);
            }

            if (
                request.nextUrl.pathname.startsWith('/dashboard/tutor') &&
                profile.role !== 'tutor' &&
                profile.role !== 'admin'
            ) {
                const url = request.nextUrl.clone();
                url.pathname = '/dashboard';
                return NextResponse.redirect(url);
            }

            if (profile.role === 'student') {
                const { data: fullProfile } = await supabase
                    .from('profiles')
                    .select('payment_expires_at')
                    .eq('id', user.id)
                    .single();

                if (fullProfile?.payment_expires_at) {
                    const expiresAt = new Date(fullProfile.payment_expires_at);
                    if (expiresAt < new Date() && profile.payment_status === 'active') {
                        await supabase
                            .from('profiles')
                            .update({ payment_status: 'expired' })
                            .eq('id', user.id);
                        profile.payment_status = 'expired';
                    }
                }
            }

            const premiumPaths = ['/dashboard/tryout', '/dashboard/emod', '/dashboard/vod', '/dashboard/live'];
            const isPremiumPath = premiumPaths.some(p => request.nextUrl.pathname.startsWith(p));

            if (profile.role === 'student' && (profile.payment_status === 'expired' || profile.payment_status === 'pending') && isPremiumPath) {
                const url = request.nextUrl.clone();
                url.pathname = '/dashboard/payment-required';
                return NextResponse.redirect(url);
            }
        }
    }

    return supabaseResponse;
}
