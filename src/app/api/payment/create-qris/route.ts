import { createClient } from '@/lib/supabase/server';
import { createQrisCharge } from '@/lib/midtrans';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env, serverEnv } from '@/lib/env';

const MONTHLY_FEE = 70000;

export async function POST() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, payment_status')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: existingTx } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('student_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingTx) {
        return NextResponse.json({
            success: true,
            transaction: {
                order_id: existingTx.order_id,
                qris_url: existingTx.qris_url,
                gross_amount: existingTx.gross_amount,
                expires_at: existingTx.expires_at,
                status: existingTx.status,
            },
        });
    }

    const orderId = `PRIVCEY-${user.id.slice(0, 8)}-${Date.now()}`;

    try {
        const chargeResponse = await createQrisCharge({
            orderId,
            grossAmount: MONTHLY_FEE,
            customerName: profile.full_name || profile.email,
            customerEmail: profile.email,
        });

        const qrisAction = chargeResponse.actions?.find(
            (a) => a.name === 'generate-qr-code'
        );
        const qrisUrl = qrisAction?.url || null;

        const paymentPayload = {
            student_id: user.id,
            order_id: orderId,
            gross_amount: MONTHLY_FEE,
            payment_type: 'qris',
            status: 'pending' as const,
            midtrans_transaction_id: chargeResponse.transaction_id,
            qris_url: qrisUrl,
            expires_at: chargeResponse.expiry_time || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        };

        const { error: insertError } = await supabase
            .from('payment_transactions')
            .insert(paymentPayload);

        if (insertError) {
            const isRlsError =
                insertError.code === '42501' ||
                insertError.message.toLowerCase().includes('row-level security');

            if (isRlsError && serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
                const serviceSupabase = createSupabaseClient(
                    env.NEXT_PUBLIC_SUPABASE_URL,
                    serverEnv.SUPABASE_SERVICE_ROLE_KEY
                );

                const { error: serviceInsertError } = await serviceSupabase
                    .from('payment_transactions')
                    .insert(paymentPayload);

                if (serviceInsertError) {
                    console.error('Failed to save payment transaction via service role:', serviceInsertError);
                    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
                }
            } else {
                console.error('Failed to save payment transaction:', insertError);
                return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            transaction: {
                order_id: orderId,
                qris_url: qrisUrl,
                gross_amount: MONTHLY_FEE,
                expires_at: chargeResponse.expiry_time,
                status: 'pending',
            },
        });
    } catch (err) {
        console.error('Midtrans charge error:', err);

        if (err instanceof Error && err.message.includes('MIDTRANS_SERVER_KEY')) {
            return NextResponse.json(
                { error: 'Payment configuration error: MIDTRANS_SERVER_KEY is not set' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create payment. Please try again.' },
            { status: 500 }
        );
    }
}
