import { createClient } from '@/lib/supabase/server';
import { getTransactionStatus } from '@/lib/midtrans';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = request.nextUrl.searchParams.get('order_id');
    if (!orderId) {
        return NextResponse.json({ error: 'order_id required' }, { status: 400 });
    }

    const { data: tx } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .eq('student_id', user.id)
        .single();

    if (!tx) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.status === 'settlement') {
        return NextResponse.json({ status: 'settlement', paid_at: tx.paid_at });
    }

    if (tx.status === 'pending') {
        try {
            const midtransStatus = await getTransactionStatus(orderId);

            if (midtransStatus.transaction_status === 'settlement') {
                return NextResponse.json({
                    status: 'settlement',
                    paid_at: midtransStatus.settlement_time || new Date().toISOString(),
                });
            }

            if (midtransStatus.transaction_status === 'expire') {
                return NextResponse.json({ status: 'expire' });
            }

            if (midtransStatus.transaction_status === 'cancel' || midtransStatus.transaction_status === 'deny') {
                return NextResponse.json({ status: midtransStatus.transaction_status });
            }
        } catch {
            return NextResponse.json({ status: tx.status });
        }
    }

    return NextResponse.json({
        status: tx.status,
        expires_at: tx.expires_at,
    });
}
