'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, StatCard, Badge, ScoreRing } from '@/components/ui';
import { AnnouncementBanner } from '@/components/ui/announcement-banner';
import {
    FileText,
    BookOpen,
    BarChart3,
    Trophy,
    Clock,
    TrendingUp,
    Target,
    Zap,
    CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import type { Announcement, TryOutAttempt, TryOut } from '@/types/database';
import { useTranslation } from '@/lib/i18n';

export default function StudentDashboard() {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [recentAttempts, setRecentAttempts] = useState<TryOutAttempt[]>([]);
    const [upcomingTryouts, setUpcomingTryouts] = useState<TryOut[]>([]);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        avgScore: 0,
        bestScore: 0,
        totalSubjects: 0,
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const fetchData = async () => {
            try {
                const [announcementRes, attemptRes, tryoutRes, allAttemptsRes, subjectRes] = await Promise.all([
                    supabase
                        .from('announcements')
                        .select('*')
                        .eq('is_active', true)
                        .or(`target_class_id.is.null,target_class_id.eq.${user.class_id}`)
                        .order('created_at', { ascending: false })
                        .limit(5),
                    supabase
                        .from('tryout_attempts')
                        .select('*, tryout:tryouts(*, subject:subjects(*))')
                        .eq('student_id', user.id)
                        .eq('is_submitted', true)
                        .order('finished_at', { ascending: false })
                        .limit(5),
                    supabase
                        .from('tryouts')
                        .select('*, subject:subjects(*)')
                        .eq('is_active', true)
                        .gte('end_time', new Date().toISOString())
                        .order('start_time', { ascending: true })
                        .limit(3),
                    supabase
                        .from('tryout_attempts')
                        .select('score')
                        .eq('student_id', user.id)
                        .eq('is_submitted', true),
                    supabase
                        .from('subjects')
                        .select('*', { count: 'exact', head: true }),
                ]);

                if (announcementRes.data) setAnnouncements(announcementRes.data);
                if (attemptRes.data) setRecentAttempts(attemptRes.data);
                if (tryoutRes.data) setUpcomingTryouts(tryoutRes.data);

                if (allAttemptsRes.data && allAttemptsRes.data.length > 0) {
                    const scores = allAttemptsRes.data.map((a) => a.score || 0);
                    setStats({
                        totalAttempts: scores.length,
                        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
                        bestScore: Math.round(Math.max(...scores)),
                        totalSubjects: subjectRes.count || 0,
                    });
                }
            } catch (err) {
                console.error('[Dashboard] Failed to fetch data:', err);
                setError('Gagal memuat data dashboard. Silakan refresh halaman.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                    {t.studentDashboard.welcome}, {user?.full_name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-foreground/40 text-sm">
                    {user?.payment_status === 'active'
                        ? t.studentDashboard.accountActive
                        : t.studentDashboard.renewPayment}
                </p>
            </motion.div>

            {user?.payment_status !== 'active' && (
                <motion.div variants={item} className="mb-6">
                    <Link href="/dashboard/payment">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-accent-1/10 to-accent-2/10 border border-accent-1/20 hover:border-accent-1/40 transition-all cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent-1/20 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-accent-1" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{t.payment.dashboardBanner}</p>
                                    <p className="text-xs text-foreground/40">{t.payment.dashboardBannerDesc}</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-accent-1 group-hover:translate-x-1 transition-transform">
                                {t.payment.payNow} →
                            </span>
                        </div>
                    </Link>
                </motion.div>
            )}

            {error && (
                <motion.div variants={item} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </motion.div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center text-foreground/40 text-sm">{t.common.loading}</div>
                </div>
            ) : (
                <>
                    <AnnouncementBanner announcements={announcements} />

                    <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            label={t.studentDashboard.totalTryout}
                            value={stats.totalAttempts}
                            icon={<FileText className="w-5 h-5" />}
                        />
                        <StatCard
                            label={t.studentDashboard.avgScore}
                            value={stats.avgScore}
                            icon={<BarChart3 className="w-5 h-5" />}
                            trend={stats.avgScore > 0 ? { value: 5, isPositive: true } : undefined}
                        />
                        <StatCard
                            label={t.studentDashboard.bestScore}
                            value={stats.bestScore}
                            icon={<Trophy className="w-5 h-5" />}
                        />
                        <StatCard
                            label={t.studentDashboard.subjects}
                            value={stats.totalSubjects}
                            icon={<BookOpen className="w-5 h-5" />}
                        />
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <motion.div variants={item} className="lg:col-span-2">
                            <GlassCard hoverable={false} padding="md">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-accent-1" />
                                        {t.studentDashboard.recentScores}
                                    </h2>
                                    <Link
                                        href="/dashboard/scores"
                                        className="text-xs text-accent-1 hover:text-accent-2 transition-colors"
                                    >
                                        {t.studentDashboard.viewAll} →
                                    </Link>
                                </div>

                                {recentAttempts.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentAttempts.map((attempt, idx) => (
                                            <motion.div
                                                key={attempt.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="flex items-center justify-between py-3 px-4 rounded-xl bg-foreground/[0.02] border border-foreground/[0.04]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">
                                                        {attempt.tryout?.subject?.icon || '📝'}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {attempt.tryout?.title}
                                                        </p>
                                                        <p className="text-xs text-foreground/40">
                                                            {attempt.tryout?.subject?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`text-lg font-bold ${(attempt.score || 0) >= 80
                                                            ? 'text-green-400'
                                                            : (attempt.score || 0) >= 60
                                                                ? 'text-yellow-400'
                                                                : 'text-red-400'
                                                            }`}
                                                    >
                                                        {Math.round(attempt.score || 0)}
                                                    </p>
                                                    <p className="text-[10px] text-foreground/30">
                                                        {attempt.total_correct}/{attempt.total_correct + attempt.total_wrong + attempt.total_unanswered}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-foreground/30 text-sm">
                                        <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        {t.studentDashboard.noScoresYet}
                                    </div>
                                )}
                            </GlassCard>
                        </motion.div>

                        <motion.div variants={item} className="space-y-6">
                            <GlassCard hoverable={false} padding="md" className="text-center">
                                <h3 className="text-sm font-medium text-foreground/50 mb-4">{t.studentDashboard.avgPerformance}</h3>
                                <ScoreRing score={stats.avgScore} size={140} />
                                <p className="text-xs text-foreground/30 mt-3">
                                    {stats.avgScore >= 80
                                        ? t.studentDashboard.excellent
                                        : stats.avgScore >= 60
                                            ? t.studentDashboard.good
                                            : t.studentDashboard.keepLearning}
                                </p>
                            </GlassCard>

                            <GlassCard hoverable={false} padding="md">
                                <h3 className="text-sm font-medium text-foreground/50 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {t.studentDashboard.upcomingTryouts}
                                </h3>
                                {upcomingTryouts.length > 0 ? (
                                    <div className="space-y-2">
                                        {upcomingTryouts.map((tryout) => (
                                            <Link
                                                key={tryout.id}
                                                href={`/dashboard/tryout/${tryout.id}`}
                                                className="block py-2.5 px-3 rounded-lg bg-foreground/[0.02] border border-foreground/[0.04] hover:bg-foreground/[0.05] transition-all"
                                            >
                                                <p className="text-sm text-foreground font-medium">{tryout.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="info">{tryout.subject?.name}</Badge>
                                                    <span className="text-[10px] text-foreground/30">
                                                        {tryout.duration_minutes} {t.common.minutes}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-foreground/30 text-center py-4">
                                        {t.studentDashboard.noSchedule}
                                    </p>
                                )}
                            </GlassCard>

                            <GlassCard hoverable={false} padding="md">
                                <h3 className="text-sm font-medium text-foreground/50 mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    {t.studentDashboard.quickActions}
                                </h3>
                                <div className="space-y-2">
                                    <Link
                                        href="/dashboard/tryout"
                                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-accent-1/10 border border-accent-1/20 hover:bg-accent-1/15 transition-all text-accent-1 text-sm"
                                    >
                                        <FileText className="w-4 h-4" />
                                        {t.studentDashboard.doTryout}
                                    </Link>
                                    <Link
                                        href="/dashboard/latsol"
                                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-foreground/[0.02] border border-foreground/[0.04] hover:bg-foreground/[0.05] transition-all text-foreground/60 text-sm"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        {t.studentDashboard.dailyExercise}
                                    </Link>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                </>
            )
            }
        </motion.div >
    );
}
