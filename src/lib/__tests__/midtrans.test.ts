import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';

const ORIGINAL_ENV = process.env;

describe('midtrans', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.env = {
            ...ORIGINAL_ENV,
            NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
            MIDTRANS_SERVER_KEY: 'server-key',
            MIDTRANS_IS_PRODUCTION: 'false',
        };
        vi.stubGlobal('fetch', vi.fn());
    });

    it('creates QRIS charge using sandbox URL', async () => {
        const payload = { transaction_id: 'tx-1' };
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => payload,
        } as Response);

        const { createQrisCharge } = await import('@/lib/midtrans');
        const result = await createQrisCharge({
            orderId: 'ORDER-1',
            grossAmount: 25000,
            customerName: 'John',
            customerEmail: 'john@example.com',
        });

        expect(result).toBe(payload);
        expect(fetch).toHaveBeenCalledWith(
            'https://api.sandbox.midtrans.com/v2/charge',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: `Basic ${Buffer.from('server-key:').toString('base64')}`,
                }),
            }),
        );
    });

    it('throws on QRIS charge error response', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'upstream error',
        } as Response);

        const { createQrisCharge } = await import('@/lib/midtrans');

        await expect(
            createQrisCharge({
                orderId: 'ORDER-2',
                grossAmount: 50000,
                customerName: 'Jane',
                customerEmail: 'jane@example.com',
            }),
        ).rejects.toThrow('Midtrans API error: 500 - upstream error');
    });

    it('gets transaction status using production URL', async () => {
        process.env.MIDTRANS_IS_PRODUCTION = 'true';
        const payload = { order_id: 'ORDER-3' };
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => payload,
        } as Response);

        const { getTransactionStatus } = await import('@/lib/midtrans');
        const result = await getTransactionStatus('ORDER-3');

        expect(result).toBe(payload);
        expect(fetch).toHaveBeenCalledWith(
            'https://api.midtrans.com/v2/ORDER-3/status',
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Basic ${Buffer.from('server-key:').toString('base64')}`,
                }),
            }),
        );
    });

    it('throws on transaction status error response', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 404,
            text: async () => 'not found',
        } as Response);

        const { getTransactionStatus } = await import('@/lib/midtrans');

        await expect(getTransactionStatus('UNKNOWN')).rejects.toThrow(
            'Midtrans status error: 404 - not found',
        );
    });

    it('verifies Midtrans signature hash', async () => {
        const { verifySignature } = await import('@/lib/midtrans');
        const signature = verifySignature('ORDER-1', '200', '10000', 'secret-key');
        const expected = crypto
            .createHash('sha512')
            .update('ORDER-120010000secret-key')
            .digest('hex');

        expect(signature).toBe(expected);
    });
});
