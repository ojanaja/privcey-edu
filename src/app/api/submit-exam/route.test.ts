import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}));

describe('submit-exam route', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('returns 401 when unauthenticated', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        });

        const { POST } = await import('@/app/api/submit-exam/route');
        const res = await POST(new Request('http://localhost/api/submit-exam', { method: 'POST', body: '{}' }));
        expect(res.status).toBe(401);
    });

    it('returns 400 when payload is invalid', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        });

        const { POST } = await import('@/app/api/submit-exam/route');
        const res = await POST(new Request('http://localhost/api/submit-exam', { method: 'POST', body: '{}' }));
        expect(res.status).toBe(400);
    });

    it('returns 404 when attempt is not found', async () => {
        const from = vi.fn(() => ({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null }),
                    }),
                }),
            }),
        }));

        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from,
        });

        const { POST } = await import('@/app/api/submit-exam/route');
        const res = await POST(
            new Request('http://localhost/api/submit-exam', {
                method: 'POST',
                body: JSON.stringify({ attempt_id: 'a1', answers: { q1: 'A' } }),
            }),
        );
        expect(res.status).toBe(404);
    });

    it('returns 400 when already submitted or no questions', async () => {
        const fromSubmitted = vi.fn((table: string) => {
            if (table === 'tryout_attempts') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { is_submitted: true } }),
                            }),
                        }),
                    }),
                };
            }
            return { select: vi.fn() };
        });

        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: fromSubmitted,
        });

        const { POST } = await import('@/app/api/submit-exam/route');

        const alreadySubmitted = await POST(
            new Request('http://localhost/api/submit-exam', {
                method: 'POST',
                body: JSON.stringify({ attempt_id: 'a1', answers: { q1: 'A' } }),
            }),
        );
        expect(alreadySubmitted.status).toBe(400);

        const fromNoQuestions = vi.fn((table: string) => {
            if (table === 'tryout_attempts') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { is_submitted: false, tryout_id: 't1', tryout: { title: 'Tryout' } },
                                }),
                            }),
                        }),
                    }),
                };
            }
            if (table === 'questions') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: null }),
                    }),
                };
            }
            return { upsert: vi.fn(), update: vi.fn(), insert: vi.fn() };
        });

        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: fromNoQuestions,
        });

        const noQuestions = await POST(
            new Request('http://localhost/api/submit-exam', {
                method: 'POST',
                body: JSON.stringify({ attempt_id: 'a1', answers: { q1: 'A' } }),
            }),
        );
        expect(noQuestions.status).toBe(400);
    });

    it('returns 500 on update error and 200 on success (with and without answers upsert)', async () => {
        const upsert = vi.fn().mockResolvedValue({});
        const insert = vi.fn().mockResolvedValue({});
        const update = vi
            .fn()
            .mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ error: { message: 'update fail' } }) })
            .mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ error: null }) })
            .mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ error: null }) });

        const baseFrom = vi.fn((table: string) => {
            if (table === 'tryout_attempts') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { is_submitted: false, tryout_id: 't1', tryout: { title: 'Tryout A' } },
                                }),
                            }),
                        }),
                    }),
                    update,
                };
            }
            if (table === 'questions') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: [
                                { id: 'q1', correct_answer: 'A' },
                                { id: 'q2', correct_answer: 'B' },
                            ],
                        }),
                    }),
                };
            }
            if (table === 'student_answers') {
                return { upsert };
            }
            return { insert };
        });

        createClientMock
            .mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }, from: baseFrom })
            .mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }, from: baseFrom })
            .mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }, from: baseFrom });

        const { POST } = await import('@/app/api/submit-exam/route');

        const failed = await POST(
            new Request('http://localhost/api/submit-exam', {
                method: 'POST',
                body: JSON.stringify({ attempt_id: 'a1', answers: { q1: 'A', q2: 'B' } }),
            }),
        );
        expect(failed.status).toBe(500);

        const okWithAnswers = await POST(
            new Request('http://localhost/api/submit-exam', {
                method: 'POST',
                body: JSON.stringify({ attempt_id: 'a1', answers: { q1: 'A', q2: 'A' } }),
            }),
        );
        expect(okWithAnswers.status).toBe(200);
        const body1 = await okWithAnswers.json();
        expect(body1.success).toBe(true);
        expect(body1.total).toBe(2);

        const okWithoutAnswers = await POST(
            new Request('http://localhost/api/submit-exam', {
                method: 'POST',
                body: JSON.stringify({ attempt_id: 'a1', answers: {} }),
            }),
        );
        expect(okWithoutAnswers.status).toBe(200);
    });

    it('returns score 0 when questions list is empty array', async () => {
        const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
        const insert = vi.fn().mockResolvedValue({});

        const from = vi.fn((table: string) => {
            if (table === 'tryout_attempts') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { is_submitted: false, tryout_id: 't1', tryout: { title: 'Tryout A' } },
                                }),
                            }),
                        }),
                    }),
                    update,
                };
            }
            if (table === 'questions') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [] }),
                    }),
                };
            }
            if (table === 'student_answers') {
                return { upsert: vi.fn().mockResolvedValue({}) };
            }
            return { insert };
        });

        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from,
        });

        const { POST } = await import('@/app/api/submit-exam/route');
        const res = await POST(
            new Request('http://localhost/api/submit-exam', {
                method: 'POST',
                body: JSON.stringify({ attempt_id: 'a1', answers: {} }),
            }),
        );

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.score).toBe(0);
    });
});
