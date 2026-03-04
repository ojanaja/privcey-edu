import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized', status: 401 };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 };

    return { error: null, status: 200 };
}

export async function GET() {
    try {
        const supabase = await createClient();
        const auth = await verifyAdmin(supabase);
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const { data: classes, error } = await supabase
            .from('class_groups')
            .select('*')
            .order('name');

        if (error) {
            console.error('[admin/classes GET]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: profiles } = await supabase
            .from('profiles')
            .select('class_id')
            .eq('role', 'student')
            .not('class_id', 'is', null);

        const countMap: Record<string, number> = {};
        if (profiles) {
            for (const p of profiles) {
                if (p.class_id) {
                    countMap[p.class_id] = (countMap[p.class_id] || 0) + 1;
                }
            }
        }

        const tutorIds = classes?.filter((c) => c.tutor_id).map((c) => c.tutor_id) || [];
        let tutorMap: Record<string, string> = {};
        if (tutorIds.length > 0) {
            const { data: tutors } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', tutorIds);
            if (tutors) {
                tutorMap = Object.fromEntries(tutors.map((t) => [t.id, t.full_name]));
            }
        }

        const enriched = (classes || []).map((c) => ({
            ...c,
            student_count: countMap[c.id] || 0,
            tutor_name: c.tutor_id ? tutorMap[c.tutor_id] || null : null,
        }));

        return NextResponse.json({ classes: enriched });
    } catch (err) {
        console.error('[admin/classes GET] Unexpected:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const auth = await verifyAdmin(supabase);
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const body = await request.json();
        const { name, description, max_students, tutor_id } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Nama kelas wajib diisi' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('class_groups')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                max_students: max_students || 25,
                tutor_id: tutor_id || null,
            })
            .select()
            .single();

        if (error) {
            console.error('[admin/classes POST]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ class: data });
    } catch (err) {
        console.error('[admin/classes POST] Unexpected:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const auth = await verifyAdmin(supabase);
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const body = await request.json();
        const { id, name, description, max_students, tutor_id } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID kelas wajib' }, { status: 400 });
        }

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Nama kelas wajib diisi' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('class_groups')
            .update({
                name: name.trim(),
                description: description?.trim() || null,
                max_students: max_students || 25,
                tutor_id: tutor_id || null,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[admin/classes PUT]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ class: data });
    } catch (err) {
        console.error('[admin/classes PUT] Unexpected:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const auth = await verifyAdmin(supabase);
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID kelas wajib' }, { status: 400 });
        }

        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', id);

        if (count && count > 0) {
            return NextResponse.json(
                { error: `Kelas masih memiliki ${count} siswa. Pindahkan siswa terlebih dahulu.` },
                { status: 400 }
            );
        }

        const { error } = await supabase.from('class_groups').delete().eq('id', id);

        if (error) {
            console.error('[admin/classes DELETE]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/classes DELETE] Unexpected:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
