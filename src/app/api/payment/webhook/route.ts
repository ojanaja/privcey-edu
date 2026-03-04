import { NextResponse } from 'next/server';
import { verifySignature } from '@/lib/midtrans';
import { serverEnv } from '@/lib/env';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            order_id,
            status_code,
            gross_amount,
            signature_key,
            transaction_status,
            fraud_status,
            transaction_id,
            settlement_time,
        } = body;

        const expectedSignature = verifySignature(
            order_id,
            status_code,
            gross_amount,
            serverEnv.MIDTRANS_SERVER_KEY
        );

        if (signature_key !== expectedSignature) {
            console.error('Invalid Midtrans signature for order:', order_id);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        const supabase = createSupabaseClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            serverEnv.SUPABASE_SERVICE_ROLE_KEY
        );

        let paymentStatus: string;
        if (transaction_status === 'capture' || transaction_status === 'settlement') {
            if (fraud_status === 'accept' || !fraud_status) {
                paymentStatus = 'settlement';
            } else {
                paymentStatus = 'deny';
            }
        } else if (transaction_status === 'pending') {
            paymentStatus = 'pending';
        } else if (transaction_status === 'expire') {
            paymentStatus = 'expire';
        } else if (transaction_status === 'cancel') {
            paymentStatus = 'cancel';
        } else if (transaction_status === 'deny') {
            paymentStatus = 'deny';
        } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
            paymentStatus = 'refund';
        } else {
            paymentStatus = 'pending';
        }

        const { data: tx, error: txError } = await supabase
            .from('payment_transactions')
            .update({
                status: paymentStatus,
                midtrans_transaction_id: transaction_id,
                paid_at: paymentStatus === 'settlement' ? (settlement_time || new Date().toISOString()) : null,
                updated_at: new Date().toISOString(),
            })
            .eq('order_id', order_id)
            .select('student_id')
            .single();

        if (txError) {
            console.error('Failed to update payment transaction:', txError);
            return NextResponse.json({ error: 'Transaction update failed' }, { status: 500 });
        }

        if (paymentStatus === 'settlement' && tx?.student_id) {
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    payment_status: 'active',
                    payment_expires_at: expiresAt,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', tx.student_id);

            if (profileError) {
                console.error('Failed to activate student:', profileError);
            } else {
                console.log(`Student ${tx.student_id} activated via QRIS payment ${order_id}`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Webhook processing error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
