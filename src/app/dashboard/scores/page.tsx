'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, Badge, LoadingSpinner, ScoreRing } from '@/components/ui';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { TryOutAttempt } from '@/types/database';
import { formatDate, getScoreColor } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';

export default function ScoresPage() {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [attempts, setAttempts] = useState<TryOutAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const fetchScores = async () => {
            const { data } = await supabase
                .from('tryout_attempts')
                .select('*, tryout:tryouts(*, subject:subjects(*))')
                .eq('student_id', user.id)
                .eq('is_submitted', true)
                .order('finished_at', { ascending: true });

            if (data) setAttempts(data);
            setIsLoading(false);
        };

        fetchScores();
    }, [user]);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    const scores = attempts.map((a) => a.score || 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;
    const latestTrend =
        scores.length >= 2 ? scores[scores.length - 1] - scores[scores.length - 2] : 0;

    const chartData = attempts.map((a) => ({
        name: a.tryout?.title?.slice(0, 15) || 'Try Out',
        score: Math.round(a.score || 0),
        date: a.finished_at ? formatDate(a.finished_at) : '',
    }));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-8">
                <BarChart3 className="w-6 h-6 text-accent-1" />
                {t.scoresPage.title}
            </h1>

            {/* Score Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <GlassCard hoverable={false} padding="md" className="text-center">
                    <ScoreRing score={avgScore} size={100} strokeWidth={6} />
                    <p className="text-xs text-foreground/40 mt-2">{t.scoresPage.avgLabel}</p>
                </GlassCard>
                <GlassCard hoverable={false} padding="md" className="text-center flex flex-col items-center justify-center">
                    <p className={`text-3xl font-bold ${getScoreColor(bestScore)}`}>{bestScore}</p>
                    <p className="text-xs text-foreground/40 mt-1">{t.scoresPage.bestLabel}</p>
                </GlassCard>
                <GlassCard hoverable={false} padding="md" className="text-center flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-foreground">{attempts.length}</p>
                    <p className="text-xs text-foreground/40 mt-1">{t.scoresPage.totalLabel}</p>
                </GlassCard>
                <GlassCard hoverable={false} padding="md" className="text-center flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1">
                        {latestTrend >= 0 ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                        )}
                        <p className={`text-2xl font-bold ${latestTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {latestTrend >= 0 ? '+' : ''}{Math.round(latestTrend)}
                        </p>
                    </div>
                    <p className="text-xs text-foreground/40 mt-1">{t.scoresPage.trendLabel}</p>
                </GlassCard>
            </div>

            {/* Score Chart */}
            {chartData.length > 1 && (
                <GlassCard hoverable={false} padding="md" className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t.scoresPage.trendline}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                            <XAxis
                                dataKey="name"
                                stroke="var(--card-border)"
                                tick={{ fill: 'var(--foreground)', fontSize: 11 }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                stroke="var(--card-border)"
                                tick={{ fill: 'var(--foreground)', fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--tooltip-bg)',
                                    border: '1px solid var(--tooltip-border)',
                                    borderRadius: '12px',
                                    color: 'var(--tooltip-color)',
                                    fontSize: '12px',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#scoreGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            {/* Score History Table */}
            <GlassCard hoverable={false} padding="md">
                <h2 className="text-lg font-semibold text-foreground mb-4">{t.scoresPage.scoreHistory}</h2>
                {attempts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-foreground/40 border-b border-foreground/5">
                                    <th className="pb-3 font-medium">{t.scoresPage.tryoutColumn}</th>
                                    <th className="pb-3 font-medium">{t.scoresPage.subjectColumn}</th>
                                    <th className="pb-3 font-medium text-center">{t.scoresPage.correctColumn}</th>
                                    <th className="pb-3 font-medium text-center">{t.scoresPage.wrongColumn}</th>
                                    <th className="pb-3 font-medium text-center">{t.scoresPage.emptyColumn}</th>
                                    <th className="pb-3 font-medium text-center">{t.scoresPage.scoreColumn}</th>
                                    <th className="pb-3 font-medium">{t.scoresPage.dateColumn}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {[...attempts].reverse().map((attempt) => (
                                    <tr key={attempt.id} className="border-b border-foreground/[0.03]">
                                        <td className="py-3 text-foreground font-medium">
                                            {attempt.tryout?.title}
                                        </td>
                                        <td className="py-3">
                                            <Badge variant="info">{attempt.tryout?.subject?.name}</Badge>
                                        </td>
                                        <td className="py-3 text-center text-green-400">
                                            {attempt.total_correct}
                                        </td>
                                        <td className="py-3 text-center text-red-400">
                                            {attempt.total_wrong}
                                        </td>
                                        <td className="py-3 text-center text-foreground/30">
                                            {attempt.total_unanswered}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`font-bold ${getScoreColor(attempt.score || 0)}`}>
                                                {Math.round(attempt.score || 0)}
                                            </span>
                                        </td>
                                        <td className="py-3 text-foreground/40 text-xs">
                                            {attempt.finished_at ? formatDate(attempt.finished_at) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-foreground/30">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{t.scoresPage.noHistory}</p>
                    </div>
                )}
            </GlassCard>
        </motion.div>
    );
}
