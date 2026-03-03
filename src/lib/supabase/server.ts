import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client.
 * Uses Supavisor connection pooling automatically via the Supabase JS client
 * which routes through the REST API (PostgREST) that already uses Supavisor.
 * For direct DB connections, use DATABASE_URL with pgbouncer=true (port 6543).
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
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
            db: {
                schema: 'public',
            },
            global: {
                headers: {
                    'x-connection-pool': 'supavisor',
                },
            },
        }
    );
}
