import { beforeEach, describe, expect, it, vi } from 'vitest';

const createBrowserClientMock = vi.fn();

vi.mock('@supabase/ssr', () => ({
    createBrowserClient: createBrowserClientMock,
}));

describe('supabase browser client', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    });

    it('creates browser client with public env values', async () => {
        const instance = { tag: 'browser-client' };
        createBrowserClientMock.mockReturnValueOnce(instance);

        const { createClient } = await import('@/lib/supabase/client');
        const result = createClient();

        expect(createBrowserClientMock).toHaveBeenCalledWith(
            'https://example.supabase.co',
            'anon-key',
        );
        expect(result).toBe(instance);
    });
});
