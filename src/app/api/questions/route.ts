import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tryoutId = searchParams.get('tryout_id');

    if (!tryoutId) {
        return NextResponse.json({ error: 'tryout_id is required' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tryoutId)) {
        return NextResponse.json({ error: 'Invalid tryout_id format' }, { status: 400 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isStaff = profile?.role === 'admin' || profile?.role === 'tutor';

    if (isStaff) {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('tryout_id', tryoutId)
            .order('order_number', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ questions: data });
    }

    const { data, error } = await supabase
        .from('questions')
        .select('id, tryout_id, question_text, question_image_url, option_a, option_b, option_c, option_d, option_e, difficulty, order_number')
        .eq('tryout_id', tryoutId)
        .order('order_number', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ questions: data });
}
