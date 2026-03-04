/**
 * Runtime environment variable validation.
 * Imported at the top of next.config.ts to fail fast during build if env vars are missing.
 */

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `❌ Missing required environment variable: ${name}\n` +
            `   Please add it to your .env.local file or deployment environment.`
        );
    }
    return value;
}

function optionalEnv(name: string, fallback: string): string {
    return process.env[name] || fallback;
}

export const env = {
    NEXT_PUBLIC_SUPABASE_URL: requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
} as const;

export const serverEnv = {
    SUPABASE_SERVICE_ROLE_KEY: optionalEnv('SUPABASE_SERVICE_ROLE_KEY', ''),
    MIDTRANS_SERVER_KEY: optionalEnv('MIDTRANS_SERVER_KEY', ''),
    MIDTRANS_IS_PRODUCTION: optionalEnv('MIDTRANS_IS_PRODUCTION', 'false'),
} as const;
