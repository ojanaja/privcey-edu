import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}));

describe('attendance route', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('POST returns 401 when unauthenticated', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        });

        const { POST } = await import('@/app/api/attendance/route');
        const response = await POST(
            new Request('http://localhost/api/attendance', {
                method: 'POST',
                body: JSON.stringify({ activity_type: 'tryout' }),
            }),
        );

        expect(response.status).toBe(401);
    });

    it('POST validates required activity_type', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        });

        const { POST } = await import('@/app/api/attendance/route');
        const response = await POST(
            new Request('http://localhost/api/attendance', {
                method: 'POST',
                body: JSON.stringify({}),
            }),
        );

        expect(response.status).toBe(400);
    });

    it('POST returns 500 on insert error and 200 on success', async () => {
        const insert = vi
            .fn()
            .mockResolvedValueOnce({ error: { message: 'insert failed' } })
            .mockResolvedValueOnce({ error: null });

        createClientMock
            .mockResolvedValueOnce({
                auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
                from: vi.fn().mockReturnValue({ insert }),
            })
            .mockResolvedValueOnce({
                auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
                from: vi.fn().mockReturnValue({ insert }),
            });

        const { POST } = await import('@/app/api/attendance/route');

        const failed = await POST(
            new Request('http://localhost/api/attendance', {
                method: 'POST',
                body: JSON.stringify({ activity_type: 'tryout', activity_id: '', activity_title: '' }),
            }),
        );
        expect(failed.status).toBe(500);

        const ok = await POST(
            new Request('http://localhost/api/attendance', {
                method: 'POST',
                body: JSON.stringify({ activity_type: 'tryout', activity_id: 'id1', activity_title: 'title' }),
            }),
        );
        expect(ok.status).toBe(200);
    });

    it('GET returns 401 when unauthenticated', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        });

        const { GET } = await import('@/app/api/attendance/route');
        const response = await GET(new Request('http://localhost/api/attendance'));

        expect(response.status).toBe(401);
    });

    it('GET returns 403 for student role or missing profile', async () => {
        const makeClient = (profile: unknown) => ({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: vi.fn((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: profile }),
                            }),
                        }),
                    };
                }
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                };
            }),
        });

        createClientMock
            .mockResolvedValueOnce(makeClient({ role: 'student' }))
            .mockResolvedValueOnce(makeClient(null));

        const { GET } = await import('@/app/api/attendance/route');

        const student = await GET(new Request('http://localhost/api/attendance'));
        expect(student.status).toBe(403);

        const missing = await GET(new Request('http://localhost/api/attendance'));
        expect(missing.status).toBe(403);
    });

    it('GET returns 500 on query error and 200 with data on success', async () => {
        const makeClient = (result: { data: unknown; error: unknown }) => ({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: vi.fn((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
                            }),
                        }),
                    };
                }
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue(result),
                        }),
                    }),
                };
            }),
        });

        createClientMock
            .mockResolvedValueOnce(
                makeClient({ data: null, error: { message: 'db error' } }),
            )
            .mockResolvedValueOnce(
                makeClient({ data: [{ id: 'log-1' }], error: null }),
            );

        const { GET } = await import('@/app/api/attendance/route');

        const failed = await GET(new Request('http://localhost/api/attendance?limit=5'));
        expect(failed.status).toBe(500);

        const ok = await GET(new Request('http://localhost/api/attendance?limit=5'));
        expect(ok.status).toBe(200);
        const body = await ok.json();
        expect(body).toEqual([{ id: 'log-1' }]);
    });

    it('GET uses default limit when query param is missing', async () => {
        const limitSpy = vi.fn().mockResolvedValue({ data: [{ id: 'log-2' }], error: null });
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: vi.fn((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
                            }),
                        }),
                    };
                }
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: limitSpy,
                        }),
                    }),
                };
            }),
        });

        const { GET } = await import('@/app/api/attendance/route');
        const ok = await GET(new Request('http://localhost/api/attendance'));

        expect(ok.status).toBe(200);
        expect(limitSpy).toHaveBeenCalledWith(100);
    });
});
