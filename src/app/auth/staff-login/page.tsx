'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function StaffLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { t } = useTranslation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(t.auth.staffLogin.wrongCredentials);
            setIsLoading(false);
            return;
        }

        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profile?.role !== 'admin' && profile?.role !== 'tutor') {
                await supabase.auth.signOut();
                setError(t.auth.staffLogin.accessDenied);
                setIsLoading(false);
                return;
            }

            const dest = profile.role === 'admin' ? '/dashboard/admin' : '/dashboard/tutor';
            router.push(dest);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="bg-mesh" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-7 h-7 text-blue-500" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-1">{t.auth.staffLogin.title}</h1>
                    <p className="text-foreground/35 text-xs">{t.auth.staffLogin.subtitle}</p>
                </div>

                <div className="rounded-2xl bg-foreground/3 border border-foreground/6 p-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-foreground/50">{t.common.email}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/25" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.auth.staffLogin.emailPlaceholder}
                                    required
                                    autoComplete="email"
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-foreground/4 border border-foreground/8 rounded-lg text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-blue-500/40 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-foreground/50">{t.common.password}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/25" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.auth.staffLogin.passwordPlaceholder}
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-foreground/4 border border-foreground/8 rounded-lg text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-blue-500/40 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/50"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" isLoading={isLoading} className="w-full" size="md">
                            {t.auth.staffLogin.loginButton}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-foreground/20 text-[11px] mt-4">
                    {t.auth.staffLogin.isStudent} <a href="/auth/login" className="text-blue-500/60 hover:text-blue-500 transition-colors">{t.auth.staffLogin.loginWithGoogle}</a>
                </p>
            </motion.div>
        </div>
    );
}
