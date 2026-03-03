'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { StatCard, LoadingSpinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/lib/i18n';
import { FileText, Users, CheckCircle2, Clock } from 'lucide-react';

export default function TutorDashboard() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        myTryouts: 0,
        totalAttempts: 0,
        totalQuestions: 0,
    });
    const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const fetchStats = async () => {
            const { data: tryouts } = await supabase
                .from('tryouts')
                .select('id')
                .eq('created_by', user.id);

            const tryoutIds = tryouts?.map((t) => t.id) || [];

            let totalAttempts = 0;
            let totalQuestions = 0;

            if (tryoutIds.length > 0) {
                const { count: attemptCount } = await supabase
                    .from('tryout_attempts')
                    .select('*', { count: 'exact', head: true })
                    .in('tryout_id', tryoutIds);

                totalAttempts = attemptCount || 0;

                const { count: questionCount } = await supabase
                    .from('questions')
                    .select('*', { count: 'exact', head: true })
                    .in('tryout_id', tryoutIds);

                totalQuestions = questionCount || 0;

                const { data: recent } = await supabase
                    .from('tryout_attempts')
                    .select('*, student:profiles(full_name), tryout:tryouts(title)')
                    .in('tryout_id', tryoutIds)
                    .eq('is_submitted', true)
                    .order('finished_at', { ascending: false })
                    .limit(10);

                if (recent) setRecentAttempts(recent);
            }

            setStats({
                myTryouts: tryoutIds.length,
                totalAttempts,
                totalQuestions,
            });

            setIsLoading(false);
        };

        fetchStats();
    }, [user]);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                    {t.tutorDashboard.hello}, {user?.full_name?.split(' ')[0]} 👋
                </h1>
                <p className="text-foreground/40 text-sm mt-1">{t.tutorDashboard.subtitle}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard
                    label={t.tutorDashboard.myTryouts}
                    value={stats.myTryouts}
                    icon={<FileText className="w-5 h-5" />}
                />
                <StatCard
                    label={t.tutorDashboard.totalAttempts}
                    value={stats.totalAttempts}
                    icon={<Users className="w-5 h-5" />}
                />
                <StatCard
                    label={t.tutorDashboard.questionBank}
                    value={stats.totalQuestions}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                />
            </div>

            <div className="admin-card p-6">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-1" />
                    {t.tutorDashboard.recentAttempts}
                </h2>
                {recentAttempts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full admin-table">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left">{t.common.student}</th>
                                    <th className="px-4 py-3 text-left">Try Out</th>
                                    <th className="px-4 py-3 text-center">{t.common.score}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAttempts.map((attempt) => (
                                    <tr key={attempt.id}>
                                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                                            {attempt.student?.full_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground/50">
                                            {attempt.tryout?.title}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold text-sm ${(attempt.score || 0) >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                                                {attempt.score ?? '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-foreground/30 text-sm">
                        {t.tutorDashboard.noAttempts}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
