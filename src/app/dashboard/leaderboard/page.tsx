'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, Badge, LoadingSpinner } from '@/components/ui';
import { Trophy, Medal, Star, Crown } from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface LeaderboardEntry {
    student_id: string;
    full_name: string;
    avg_score: number;
    total_attempts: number;
    class_name: string | null;
}

export default function LeaderboardPage() {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const fetchLeaderboard = async () => {
            const { data } = await supabase
                .from('tryout_attempts')
                .select(`
          student_id,
          score,
          student:profiles!inner(full_name, class_id, class:class_groups(name))
        `)
                .eq('is_submitted', true)
                .not('score', 'is', null);

            if (data) {
                const studentMap = new Map<string, {
                    full_name: string;
                    scores: number[];
                    class_name: string | null;
                }>();

                data.forEach((row: any) => {
                    const existing = studentMap.get(row.student_id);
                    if (existing) {
                        existing.scores.push(row.score);
                    } else {
                        studentMap.set(row.student_id, {
                            full_name: row.student?.full_name || 'Unknown',
                            scores: [row.score],
                            class_name: row.student?.class?.name || null,
                        });
                    }
                });

                const leaderboard: LeaderboardEntry[] = Array.from(studentMap.entries())
                    .map(([id, data]) => ({
                        student_id: id,
                        full_name: data.full_name,
                        avg_score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
                        total_attempts: data.scores.length,
                        class_name: data.class_name,
                    }))
                    .sort((a, b) => b.avg_score - a.avg_score);

                setEntries(leaderboard);
            }

            setIsLoading(false);
        };

        fetchLeaderboard();
    }, []);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    const rankIcons = [
        <Crown key="1" className="w-5 h-5 text-yellow-400" />,
        <Medal key="2" className="w-5 h-5 text-gray-300" />,
        <Medal key="3" className="w-5 h-5 text-amber-600" />,
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-8">
                <Trophy className="w-6 h-6 text-yellow-400" />
                {t.leaderboardPage.title}
            </h1>

            {entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 0, 2].map((idx) => {
                        const entry = entries[idx];
                        if (!entry) return null;
                        const isFirst = idx === 0;
                        const isMe = entry.student_id === user?.id;

                        return (
                            <motion.div
                                key={entry.student_id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.15 }}
                                className={cn(isFirst && 'order-2', idx === 1 && 'order-1', idx === 2 && 'order-3')}
                            >
                                <GlassCard
                                    hoverable={false}
                                    padding="md"
                                    className={cn(
                                        'text-center',
                                        isFirst && 'ring-2 ring-yellow-400/30 bg-yellow-400/5',
                                        isMe && 'ring-2 ring-accent-1/40'
                                    )}
                                >
                                    <div className="mb-3">{rankIcons[idx === 0 ? 0 : idx === 1 ? 1 : 2]}</div>
                                    <div className={cn(
                                        'w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg',
                                        isFirst ? 'bg-yellow-400/20 text-yellow-400' : 'bg-accent-1/20 text-accent-1'
                                    )}>
                                        {getInitials(entry.full_name)}
                                    </div>
                                    <p className="text-sm font-semibold text-foreground truncate">{entry.full_name}</p>
                                    {entry.class_name && (
                                        <p className="text-[10px] text-foreground/30">{entry.class_name}</p>
                                    )}
                                    <p className={cn(
                                        'text-2xl font-bold mt-2',
                                        entry.avg_score >= 80 ? 'text-green-400' : entry.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                    )}>
                                        {entry.avg_score}
                                    </p>
                                    <p className="text-[10px] text-foreground/30">{entry.total_attempts} {t.leaderboardPage.tryoutCount}</p>
                                    {isMe && <Badge variant="info" className="mt-2">{t.leaderboardPage.you}</Badge>}
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <GlassCard hoverable={false} padding="md">
                <h2 className="text-lg font-semibold text-foreground mb-4">{t.leaderboardPage.fullRanking}</h2>
                {entries.length > 0 ? (
                    <div className="space-y-2">
                        {entries.map((entry, idx) => {
                            const isMe = entry.student_id === user?.id;
                            return (
                                <motion.div
                                    key={entry.student_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={cn(
                                        'flex items-center gap-4 py-3 px-4 rounded-xl',
                                        isMe ? 'bg-accent-1/10 border border-accent-1/20' : 'bg-foreground/[0.01] border border-foreground/[0.03]'
                                    )}
                                >
                                    <span className={cn(
                                        'w-8 text-center font-bold text-sm',
                                        idx < 3 ? 'text-yellow-400' : 'text-foreground/30'
                                    )}>
                                        #{idx + 1}
                                    </span>
                                    <div className="w-9 h-9 rounded-full bg-accent-1/15 flex items-center justify-center text-accent-1 text-sm font-bold">
                                        {getInitials(entry.full_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {entry.full_name}
                                            {isMe && <span className="text-accent-1 ml-2">({t.leaderboardPage.you})</span>}
                                        </p>
                                        <p className="text-[11px] text-foreground/30">{entry.class_name || '-'} · {entry.total_attempts} {t.leaderboardPage.tryoutCount}</p>
                                    </div>
                                    <span className={cn(
                                        'text-lg font-bold',
                                        entry.avg_score >= 80 ? 'text-green-400' : entry.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                    )}>
                                        {entry.avg_score}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-foreground/30">
                        <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{t.leaderboardPage.noData}</p>
                    </div>
                )}
            </GlassCard>
        </motion.div>
    );
}
