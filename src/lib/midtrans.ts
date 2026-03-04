import { serverEnv } from '@/lib/env';

const SANDBOX_URL = 'https://api.sandbox.midtrans.com/v2';
const PRODUCTION_URL = 'https://api.midtrans.com/v2';

function getBaseUrl() {
    return serverEnv.MIDTRANS_IS_PRODUCTION === 'true' ? PRODUCTION_URL : SANDBOX_URL;
}

function getAuthHeader() {
    return 'Basic ' + Buffer.from(serverEnv.MIDTRANS_SERVER_KEY + ':').toString('base64');
}

export interface MidtransChargeResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_status: string;
    fraud_status: string;
    actions?: Array<{
        name: string;
        method: string;
        url: string;
    }>;
    expiry_time?: string;
}

export interface MidtransStatusResponse {
    status_code: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_status: string;
    fraud_status: string;
    settlement_time?: string;
}

export async function createQrisCharge(params: {
    orderId: string;
    grossAmount: number;
    customerName: string;
    customerEmail: string;
}): Promise<MidtransChargeResponse> {
    const response = await fetch(`${getBaseUrl()}/charge`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: getAuthHeader(),
        },
        body: JSON.stringify({
            payment_type: 'qris',
            transaction_details: {
                order_id: params.orderId,
                gross_amount: params.grossAmount,
            },
            customer_details: {
                first_name: params.customerName,
                email: params.customerEmail,
            },
            qris: {
                acquirer: 'gopay',
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Midtrans API error: ${response.status} - ${errorBody}`);
    }

    return response.json();
}

export async function getTransactionStatus(orderId: string): Promise<MidtransStatusResponse> {
    const response = await fetch(`${getBaseUrl()}/${orderId}/status`, {
        headers: {
            Accept: 'application/json',
            Authorization: getAuthHeader(),
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Midtrans status error: ${response.status} - ${errorBody}`);
    }

    return response.json();
}

export function verifySignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
    const crypto = require('crypto');
    return crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest('hex');
}
