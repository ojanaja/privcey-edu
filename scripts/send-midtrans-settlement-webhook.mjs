import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
    try {
        const envPath = resolve(process.cwd(), '.env.local');
        const envContent = readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && value && !process.env[key]) {
                process.env[key] = value;
            }
        }
    } catch {
        // noop
    }
}

function getArg(name) {
    const index = process.argv.indexOf(name);
    if (index === -1) return undefined;
    return process.argv[index + 1];
}

function required(value, message) {
    if (!value) {
        console.error(`❌ ${message}`);
        process.exit(1);
    }
    return value;
}

async function main() {
    loadEnv();

    const orderId = getArg('--order-id') || process.env.ORDER_ID;
    const transactionId = getArg('--transaction-id') || process.env.TRANSACTION_ID || `manual-${Date.now()}`;
    const grossAmount = getArg('--gross-amount') || process.env.GROSS_AMOUNT || '70000.00';
    const webhookUrl =
        getArg('--webhook-url') ||
        process.env.WEBHOOK_URL ||
        (process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/payment/webhook`
            : 'http://localhost:3000/api/payment/webhook');
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    required(orderId, 'Missing order ID. Use --order-id <ORDER_ID>');
    required(serverKey, 'Missing MIDTRANS_SERVER_KEY in environment');

    const statusCode = '200';
    const settlementTime = new Date().toISOString();
    const signatureKey = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest('hex');

    const payload = {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        transaction_id: transactionId,
        settlement_time: settlementTime,
        payment_type: 'qris',
    };

    console.log('➡️ Sending settlement webhook...');
    console.log(`   URL: ${webhookUrl}`);
    console.log(`   ORDER_ID: ${orderId}`);

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log(`⬅️ Status: ${response.status}`);
    console.log(`⬅️ Body: ${text}`);

    if (!response.ok) {
        process.exit(1);
    }

    console.log('✅ Settlement webhook sent successfully.');
}

main().catch((error) => {
    console.error('❌ Failed to send webhook:', error?.message || error);
    process.exit(1);
});
