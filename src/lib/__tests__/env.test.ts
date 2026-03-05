import { beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = process.env;

describe('env', () => {
    beforeEach(() => {
        vi.resetModules();
        process.env = { ...ORIGINAL_ENV };
    });

    it('loads required and optional environment values', async () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        delete process.env.MIDTRANS_SERVER_KEY;
        delete process.env.MIDTRANS_IS_PRODUCTION;

        const { env, serverEnv } = await import('@/lib/env');

        expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example.supabase.co');
        expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('anon-key');
        expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBe('');
        expect(serverEnv.MIDTRANS_SERVER_KEY).toBe('');
        expect(serverEnv.MIDTRANS_IS_PRODUCTION).toBe('false');
    });

    it('throws when required variables are missing', async () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        await expect(import('@/lib/env')).rejects.toThrow(
            'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL',
        );
    });
});
