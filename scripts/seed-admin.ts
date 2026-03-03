import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createInterface } from 'readline';

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
    }
}

function ask(question: string, defaultValue?: string): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.trim() || defaultValue || '');
        });
    });
}

async function main() {
    loadEnv();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        console.error('   Set them in .env.local or as environment variables');
        process.exit(1);
    }

    console.log('\n🔧 Privcey Edu — Seed Super Admin\n');

    const email = process.env.ADMIN_EMAIL || await ask('Email admin');
    const password = process.env.ADMIN_PASSWORD || await ask('Password (min 6 karakter)');
    const fullName = process.env.ADMIN_NAME || await ask('Nama lengkap', 'Super Admin');

    if (!email || !password) {
        console.error('Email dan password wajib diisi');
        process.exit(1);
    }
    if (password.length < 6) {
        console.error('Password minimal 6 karakter');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existing } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'admin')
        .limit(1)
        .single();

    if (existing) {
        console.log(`Super admin sudah ada: ${existing.email}`);
        const proceed = await ask('Tetap buat admin baru? (y/N)', 'N');
        if (proceed.toLowerCase() !== 'y') {
            console.log('Dibatalkan.');
            process.exit(0);
        }
    }

    console.log('\n Membuat super admin...');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: 'admin',
        },
    });

    if (authError) {
        console.error(`Gagal membuat user: ${authError.message}`);
        process.exit(1);
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'admin',
            is_active: true,
            payment_status: 'active',
            payment_expires_at: null,
        })
        .eq('id', authData.user.id);

    if (profileError) {
        console.error(`User dibuat tapi profile update gagal: ${profileError.message}`);
    }

    console.log('\n Super admin berhasil dibuat!');
    console.log(`   Email    : ${email}`);
    console.log(`   Password : ${password}`);
    console.log(`   Name     : ${fullName}`);
    console.log(`   ID       : ${authData.user.id}`);
    console.log(`\n Login di: /auth/staff-login\n`);
}

main().catch(console.error);
