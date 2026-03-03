'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Register page now redirects to login.
 * With Google-only auth, sign-up and sign-in are handled by the same OAuth flow.
 * New users are automatically registered on first Google sign-in
 * via the `handle_new_user()` database trigger.
 */
export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/auth/login');
    }, [router]);

    return null;
}
