import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    const body = await request.json();
    const { email, password, fullName, seedSecret } = body;

    const expectedSecret = process.env.SEED_SECRET;
    if (!expectedSecret || seedSecret !== expectedSecret) {
        return NextResponse.json(
            { error: 'Invalid or missing seed secret' },
            { status: 403 }
        );
    }

    if (!email || !password || !fullName) {
        return NextResponse.json(
            { error: 'email, password, and fullName are required' },
            { status: 400 }
        );
    }

    if (password.length < 6) {
        return NextResponse.json(
            { error: 'Password minimal 6 karakter' },
            { status: 400 }
        );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json(
            { error: 'SUPABASE_SERVICE_ROLE_KEY not configured on server' },
            { status: 500 }
        );
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'admin')
        .limit(1)
        .single();

    if (existingProfile) {
        return NextResponse.json(
            { error: `Super admin sudah ada: ${existingProfile.email}` },
            { status: 409 }
        );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: 'admin',
        },
    });

    if (authError) {
        return NextResponse.json(
            { error: `Failed to create auth user: ${authError.message}` },
            { status: 500 }
        );
    }

    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            role: 'admin',
            is_active: true,
            payment_status: 'active',
            payment_expires_at: null,
        })
        .eq('id', authData.user.id);

    if (profileError) {
        return NextResponse.json(
            { error: `Profile created but update failed: ${profileError.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        message: 'Super admin berhasil dibuat!',
        user: {
            id: authData.user.id,
            email: authData.user.email,
            fullName,
            role: 'admin',
        },
    });
}
