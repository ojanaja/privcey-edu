import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized', status: 401, user: null };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403, user: null };

    return { error: null, status: 200, user };
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const auth = await verifyAdmin(supabase);
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const search = searchParams.get('search');

        let query = supabase
            .from('profiles')
            .select('*, class_groups(name)')
            .order('created_at', { ascending: false });

        if (role && role !== 'all') {
            query = query.eq('role', role);
        }

        if (search && search.trim()) {
            const sanitized = search.trim().replace(/[%_\\]/g, '\\$&');
            query = query.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
        }

        let { data, error } = await query;

        if (error) {
            console.error('[admin/users GET] Query with join failed, trying without join:', error.message);
            let fallbackQuery = supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (role && role !== 'all') {
                fallbackQuery = fallbackQuery.eq('role', role);
            }

            if (search && search.trim()) {
                const sanitized = search.trim().replace(/[%_\\]/g, '\\$&');
                fallbackQuery = fallbackQuery.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
            }

            const fallback = await fallbackQuery;
            if (fallback.error) {
                console.error('[admin/users GET] Fallback also failed:', fallback.error);
                return NextResponse.json({ error: fallback.error.message }, { status: 500 });
            }
            data = fallback.data;
        }

        return NextResponse.json({ users: data });
    } catch (err) {
        console.error('[admin/users GET] Unexpected error:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const auth = await verifyAdmin(supabase);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
        return NextResponse.json(
            { error: 'email, password, dan fullName wajib diisi' },
            { status: 400 }
        );
    }

    if (password.length < 8) {
        return NextResponse.json(
            { error: 'Password minimal 8 karakter dan harus mengandung huruf dan angka' },
            { status: 400 }
        );
    }

    const validRoles = ['admin', 'tutor'];
    const targetRole = validRoles.includes(role) ? role : 'tutor';

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json(
            { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
            { status: 500 }
        );
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: targetRole,
        },
    });

    if (authError) {
        return NextResponse.json(
            { error: `Gagal membuat user: ${authError.message}` },
            { status: 500 }
        );
    }

    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            role: targetRole,
            is_active: true,
            payment_status: 'active',
            payment_expires_at: null,
        })
        .eq('id', authData.user.id);

    if (profileError) {
        return NextResponse.json(
            { error: `User dibuat tapi gagal set role: ${profileError.message}` },
            { status: 500 }
        );
    }

    const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .select('*, class_groups(name)')
        .eq('id', authData.user.id)
        .single();

    return NextResponse.json({ user: newProfile }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const auth = await verifyAdmin(supabase);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { userId, role, classId, isActive, paymentStatus, paymentExpiresAt } = body;

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (userId === auth.user!.id && role && role !== 'admin') {
        return NextResponse.json(
            { error: 'Tidak dapat mengubah role sendiri' },
            { status: 400 }
        );
    }

    const updates: Record<string, unknown> = {};
    if (role !== undefined) updates.role = role;
    if (classId !== undefined) updates.class_id = classId;
    if (isActive !== undefined) updates.is_active = isActive;
    if (paymentStatus !== undefined) updates.payment_status = paymentStatus;
    if (paymentExpiresAt !== undefined) updates.payment_expires_at = paymentExpiresAt;

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
}
