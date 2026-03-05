import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();
const getTransactionStatusMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}));

vi.mock('@/lib/midtrans', () => ({
    getTransactionStatus: getTransactionStatusMock,
}));

describe('payment status route', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('returns 401 when unauthenticated', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        });

        const { GET } = await import('@/app/api/payment/status/route');
        const res = await GET({ nextUrl: new URL('http://localhost/api/payment/status?order_id=o1') } as never);
        expect(res.status).toBe(401);
    });

    it('validates order_id and missing tx', async () => {
        createClientMock
            .mockResolvedValueOnce({
                auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            })
            .mockResolvedValueOnce({
                auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: null }),
                            }),
                        }),
                    }),
                }),
            });

        const { GET } = await import('@/app/api/payment/status/route');

        const missingOrder = await GET({ nextUrl: new URL('http://localhost/api/payment/status') } as never);
        expect(missingOrder.status).toBe(400);

        const notFound = await GET({ nextUrl: new URL('http://localhost/api/payment/status?order_id=o1') } as never);
        expect(notFound.status).toBe(404);
    });

    it('returns settlement directly from local tx', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { status: 'settlement', paid_at: 'now' } }),
                        }),
                    }),
                }),
            }),
        });

        const { GET } = await import('@/app/api/payment/status/route');
        const res = await GET({ nextUrl: new URL('http://localhost/api/payment/status?order_id=o1') } as never);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('settlement');
    });

    it('handles pending midtrans statuses and fallback catch', async () => {
        const pendingClient = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { status: 'pending', expires_at: 'later' },
                            }),
                        }),
                    }),
                }),
            }),
        };

        createClientMock
            .mockResolvedValueOnce(pendingClient)
            .mockResolvedValueOnce(pendingClient)
            .mockResolvedValueOnce(pendingClient)
            .mockResolvedValueOnce(pendingClient)
            .mockResolvedValueOnce(pendingClient);

        getTransactionStatusMock
            .mockResolvedValueOnce({ transaction_status: 'settlement', settlement_time: 'settled-at' })
            .mockResolvedValueOnce({ transaction_status: 'expire' })
            .mockResolvedValueOnce({ transaction_status: 'deny' })
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce({ transaction_status: 'pending' });

        const { GET } = await import('@/app/api/payment/status/route');
        const url = { nextUrl: new URL('http://localhost/api/payment/status?order_id=o1') } as never;

        const settled = await GET(url);
        expect((await settled.json()).status).toBe('settlement');

        const expired = await GET(url);
        expect((await expired.json()).status).toBe('expire');

        const denied = await GET(url);
        expect((await denied.json()).status).toBe('deny');

        const fallback = await GET(url);
        expect((await fallback.json()).status).toBe('pending');

        const defaultPending = await GET(url);
        expect((await defaultPending.json()).expires_at).toBe('later');
    });

    it('handles cancel status and settlement without settlement_time', async () => {
        const pendingClient = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { status: 'pending', expires_at: 'later' },
                            }),
                        }),
                    }),
                }),
            }),
        };

        createClientMock
            .mockResolvedValueOnce(pendingClient)
            .mockResolvedValueOnce(pendingClient);

        getTransactionStatusMock
            .mockResolvedValueOnce({ transaction_status: 'cancel' })
            .mockResolvedValueOnce({ transaction_status: 'settlement' });

        const { GET } = await import('@/app/api/payment/status/route');
        const url = { nextUrl: new URL('http://localhost/api/payment/status?order_id=o1') } as never;

        const cancelled = await GET(url);
        expect((await cancelled.json()).status).toBe('cancel');

        const settledNoTime = await GET(url);
        const body = await settledNoTime.json();
        expect(body.status).toBe('settlement');
        expect(typeof body.paid_at).toBe('string');
    });

    it('returns local status payload for non-pending transactions', async () => {
        createClientMock.mockResolvedValueOnce({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { status: 'expire', expires_at: 'x' } }),
                        }),
                    }),
                }),
            }),
        });

        const { GET } = await import('@/app/api/payment/status/route');
        const res = await GET({ nextUrl: new URL('http://localhost/api/payment/status?order_id=o1') } as never);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ status: 'expire', expires_at: 'x' });
    });
});
