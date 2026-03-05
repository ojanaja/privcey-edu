import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';

export async function GET() {
    const hasServerKey = Boolean(serverEnv.MIDTRANS_SERVER_KEY);
    const isProduction = serverEnv.MIDTRANS_IS_PRODUCTION === 'true';
    const isReady = hasServerKey;

    const payload = {
        ok: isReady,
        midtrans: {
            configured: isReady,
            has_server_key: hasServerKey,
            mode: isProduction ? 'production' : 'sandbox',
        },
    };

    return NextResponse.json(payload, {
        status: isReady ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
