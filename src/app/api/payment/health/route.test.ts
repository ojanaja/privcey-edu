import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockServerEnv = vi.hoisted(() => ({
    MIDTRANS_SERVER_KEY: '',
    MIDTRANS_IS_PRODUCTION: 'false',
}));

vi.mock('@/lib/env', () => ({
    serverEnv: mockServerEnv,
}));

describe('GET /api/payment/health', () => {
    beforeEach(() => {
        mockServerEnv.MIDTRANS_SERVER_KEY = '';
        mockServerEnv.MIDTRANS_IS_PRODUCTION = 'false';
    });

    it('returns 503 when Midtrans server key is missing', async () => {
        const { GET } = await import('./route');

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(body).toEqual({
            ok: false,
            midtrans: {
                configured: false,
                has_server_key: false,
                mode: 'sandbox',
            },
        });
    });

    it('returns 200 when Midtrans server key is configured in sandbox mode', async () => {
        mockServerEnv.MIDTRANS_SERVER_KEY = 'SB-Mid-server-xxxxx';

        const { GET } = await import('./route');
        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            ok: true,
            midtrans: {
                configured: true,
                has_server_key: true,
                mode: 'sandbox',
            },
        });
    });

    it('returns production mode when MIDTRANS_IS_PRODUCTION is true', async () => {
        mockServerEnv.MIDTRANS_SERVER_KEY = 'Mid-server-prod';
        mockServerEnv.MIDTRANS_IS_PRODUCTION = 'true';

        const { GET } = await import('./route');
        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.midtrans.mode).toBe('production');
    });
});
