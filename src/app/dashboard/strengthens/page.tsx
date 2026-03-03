'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, Badge, LoadingSpinner, Button } from '@/components/ui';
import { Zap, BookOpen, ArrowRight, Lock } from 'lucide-react';
import type { StrengthensModule, TryOutAttempt } from '@/types/database';
import Link from 'next/link';

export default function StrengthensPage() {
    const { user } = useAuthStore();
    const [modules, setModules] = useState<StrengthensModule[]>([]);
    const [failedTryouts, setFailedTryouts] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const fetchData = async () => {
            const { data: moduleData } = await supabase
                .from('strengthens_modules')
                .select('*, subject:subjects(*), tryout:tryouts(*)')
                .eq('is_active', true);

            if (moduleData) setModules(moduleData);

            const { data: attempts } = await supabase
                .from('tryout_attempts')
                .select('tryout_id, score, tryout:tryouts(passing_grade)')
                .eq('student_id', user.id)
                .eq('is_submitted', true);

            if (attempts) {
                const failed = new Set<string>();
                attempts.forEach((a: any) => {
                    if (a.score < (a.tryout?.passing_grade || 70)) {
                        failed.add(a.tryout_id);
                    }
                });
                setFailedTryouts(failed);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [user]);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    const availableModules = modules.filter((m) => failedTryouts.has(m.tryout_id));
    const lockedModules = modules.filter((m) => !failedTryouts.has(m.tryout_id));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    STRENGTHENS
                </h1>
                <p className="text-foreground/40 text-sm mt-1">
                    Modul penguatan otomatis berdasarkan hasil Try Out kamu.
                    Muncul saat skor di bawah KKM.
                </p>
            </div>

            <GlassCard hoverable={false} padding="sm" className="mb-6 bg-yellow-500/5 border-yellow-500/10">
                <div className="flex items-center gap-3 px-2">
                    <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-xs text-yellow-300/70">
                        Modul ini terbuka otomatis jika nilai Try Out kamu di bawah KKM.
                        Pelajari materi ini untuk memperbaiki nilaimu!
                    </p>
                </div>
            </GlassCard>

            {availableModules.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Modul Terbuka ({availableModules.length})
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {availableModules.map((mod, idx) => (
                            <motion.div
                                key={mod.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <GlassCard className="border-yellow-500/20 bg-yellow-500/5" padding="md">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-yellow-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-foreground mb-1">{mod.title}</h3>
                                            <Badge variant="warning">{mod.subject?.name}</Badge>
                                            {mod.description && (
                                                <p className="text-xs text-foreground/40 mt-2">{mod.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    {mod.content_url && (
                                        <a
                                            href={mod.content_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-4 flex items-center gap-2 text-sm text-accent-1 hover:text-accent-2 transition-colors"
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            Buka Materi
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {lockedModules.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-foreground/40 mb-4 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Modul Terkunci ({lockedModules.length})
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4 opacity-50">
                        {lockedModules.map((mod) => (
                            <GlassCard key={mod.id} hoverable={false} padding="md">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center">
                                        <Lock className="w-4 h-4 text-foreground/30" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-foreground/50">{mod.title}</h3>
                                        <p className="text-[10px] text-foreground/20 mt-1">
                                            Terbuka jika nilai Try Out di bawah KKM
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {modules.length === 0 && (
                <GlassCard hoverable={false} className="text-center py-16">
                    <Zap className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground/50 mb-2">Belum Ada Modul</h3>
                    <p className="text-sm text-foreground/30">Modul STRENGTHENS akan ditambahkan oleh tutor.</p>
                </GlassCard>
            )}
        </motion.div>
    );
}
