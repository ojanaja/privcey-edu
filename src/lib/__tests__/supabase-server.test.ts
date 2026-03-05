import { beforeEach, describe, expect, it, vi } from 'vitest';

const createServerClientMock = vi.fn();
const cookiesMock = vi.fn();

vi.mock('@supabase/ssr', () => ({
    createServerClient: createServerClientMock,
}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
}));

describe('supabase server client', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    });

    it('creates server client and forwards cookie operations', async () => {
        const getAll = vi.fn(() => [{ name: 'token', value: 'abc' }]);
        const set = vi.fn();

        cookiesMock.mockResolvedValueOnce({ getAll, set });
        const clientInstance = { tag: 'server-client' };
        createServerClientMock.mockReturnValueOnce(clientInstance);

        const { createClient } = await import('@/lib/supabase/server');
        const result = await createClient();

        expect(result).toBe(clientInstance);
        expect(createServerClientMock).toHaveBeenCalledOnce();

        const options = createServerClientMock.mock.calls[0][2];
        expect(options.db.schema).toBe('public');
        expect(options.global.headers['x-connection-pool']).toBe('supavisor');

        expect(options.cookies.getAll()).toEqual([{ name: 'token', value: 'abc' }]);
        options.cookies.setAll([{ name: 'token', value: 'new', options: { path: '/' } }]);
        expect(set).toHaveBeenCalledWith('token', 'new', { path: '/' });
    });

    it('swallows cookie set errors in setAll', async () => {
        const getAll = vi.fn(() => []);
        const set = vi.fn(() => {
            throw new Error('read-only cookie store');
        });

        cookiesMock.mockResolvedValueOnce({ getAll, set });
        createServerClientMock.mockReturnValueOnce({});

        const { createClient } = await import('@/lib/supabase/server');
        await createClient();

        const options = createServerClientMock.mock.calls[0][2];
        expect(() =>
            options.cookies.setAll([{ name: 'token', value: 'new', options: { path: '/' } }]),
        ).not.toThrow();
    });
});
