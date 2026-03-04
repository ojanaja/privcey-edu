'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from './sidebar';
import { LoadingSpinner } from '@/components/ui';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, setUser, setLoading } = useAuthStore();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const supabase = createClient();
                const {
                    data: { user: authUser },
                } = await supabase.auth.getUser();

                if (authUser) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', authUser.id)
                        .single();

                    setUser(profile);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('[DashboardLayout] Failed to fetch profile:', err);
                setUser(null);
            }
        };

        fetchProfile();
    }, [setUser]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <LoadingSpinner className="mb-4" />
                    <p className="text-foreground/40 text-sm">{t.common.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="lg:ml-64 overflow-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
