import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';

describe('auth store', () => {
    it('updates user and loading state', () => {
        useAuthStore.getState().setLoading(true);
        expect(useAuthStore.getState().isLoading).toBe(true);

        useAuthStore.getState().setUser({
            id: 'u-1',
            email: 'a@b.com',
            full_name: 'User One',
            role: 'student',
            class_id: null,
            avatar_url: null,
            is_active: true,
            payment_status: 'pending',
            payment_expires_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        expect(useAuthStore.getState().user?.id).toBe('u-1');
        expect(useAuthStore.getState().isLoading).toBe(false);
    });
});
