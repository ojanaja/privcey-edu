import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { student_id, payment_status } = body;

    if (!student_id || !payment_status) {
        return NextResponse.json({ error: 'student_id and payment_status required' }, { status: 400 });
    }

    const expiresAt =
        payment_status === 'active'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null;

    const { error } = await supabase
        .from('profiles')
        .update({
            payment_status,
            payment_expires_at: expiresAt,
        })
        .eq('id', student_id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
