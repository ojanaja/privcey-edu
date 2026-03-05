import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}));

describe('questions route', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('returns 401 when unauthenticated', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        });

        const { GET } = await import('@/app/api/questions/route');
        const res = await GET(new Request('http://localhost/api/questions?tryout_id=x') as never);
        expect(res.status).toBe(401);
    });

    it('returns 400 when tryout_id missing or invalid', async () => {
        const baseClient = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        };
        createClientMock
            .mockResolvedValueOnce(baseClient)
            .mockResolvedValueOnce(baseClient);

        const { GET } = await import('@/app/api/questions/route');

        const missing = await GET(new Request('http://localhost/api/questions') as never);
        expect(missing.status).toBe(400);

        const invalid = await GET(
            new Request('http://localhost/api/questions?tryout_id=not-a-uuid') as never,
        );
        expect(invalid.status).toBe(400);
    });

    it('returns staff full question payload and handles db error', async () => {
        const fullSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                order: vi
                    .fn()
                    .mockResolvedValueOnce({ data: null, error: { message: 'db fail' } })
                    .mockResolvedValueOnce({ data: [{ id: 'q1', correct_answer: 'A' }], error: null }),
            }),
        });

        const from = vi.fn((table: string) => {
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
                        }),
                    }),
                };
            }
            return { select: fullSelect };
        });

        createClientMock
            .mockResolvedValueOnce({
                auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
                from,
            })
            .mockResolvedValueOnce({
                auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
                from,
            });

        const { GET } = await import('@/app/api/questions/route');
        const url = 'http://localhost/api/questions?tryout_id=123e4567-e89b-12d3-a456-426614174000';

        const failed = await GET(new Request(url) as never);
        expect(failed.status).toBe(500);

        const ok = await GET(new Request(url) as never);
        expect(ok.status).toBe(200);
        const body = await ok.json();
        expect(body.questions).toEqual([{ id: 'q1', correct_answer: 'A' }]);
    });

    it('returns student-safe payload and handles db error', async () => {
        const safeSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                order: vi
                    .fn()
                    .mockResolvedValueOnce({ data: null, error: { message: 'db fail' } })
                    .mockResolvedValueOnce({ data: [{ id: 'q1', option_a: 'A' }], error: null }),
            }),
        });

        const from = vi.fn((table: string) => {
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { role: 'student' } }),
                        }),
                    }),
                };
            }
            return { select: safeSelect };
        });

        createClientMock
            .mockResolvedValueOnce({
                auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
                from,
            })
            .mockResolvedValueOnce({
                auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
                from,
            });

        const { GET } = await import('@/app/api/questions/route');
        const url = 'http://localhost/api/questions?tryout_id=123e4567-e89b-12d3-a456-426614174000';

        const failed = await GET(new Request(url) as never);
        expect(failed.status).toBe(500);

        const ok = await GET(new Request(url) as never);
        expect(ok.status).toBe(200);
        const body = await ok.json();
        expect(body.questions).toEqual([{ id: 'q1', option_a: 'A' }]);
    });
});
