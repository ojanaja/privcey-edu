'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge } from '@/components/ui';
import { FileText, Clock, Target, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { TryOut } from '@/types/database';
import { formatDateTime } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export function TryoutClientPage({ initialTryouts }: { initialTryouts: TryOut[] }) {
    const { t } = useTranslation();
    const [tryouts] = useState<TryOut[]>(initialTryouts);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <FileText className="w-6 h-6 text-accent-1" />
                        {t.tryoutList.title}
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">
                        {t.tryoutList.subtitle}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                {(['all', 'active', 'completed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filter === f
                            ? 'bg-accent-1/20 text-accent-1 border border-accent-1/30'
                            : 'text-foreground/40 hover:text-foreground/60 border border-transparent'
                            }`}
                    >
                        {f === 'all' ? t.tryoutList.filterAll : f === 'active' ? t.tryoutList.filterActive : t.tryoutList.filterCompleted}
                    </button>
                ))}
            </div>

            {tryouts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tryouts.map((tryout, idx) => (
                        <motion.div
                            key={tryout.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link href={`/dashboard/tryout/${tryout.id}`}>
                                <GlassCard className="h-full cursor-pointer group" padding="md">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-2xl">{tryout.subject?.icon || '📝'}</span>
                                        <Badge variant="info">{tryout.subject?.name}</Badge>
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-accent-1 transition-colors">
                                        {tryout.title}
                                    </h3>
                                    {tryout.description && (
                                        <p className="text-xs text-foreground/40 mb-4 line-clamp-2">
                                            {tryout.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-foreground/30">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {tryout.duration_minutes} {t.common.minutes}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Target className="w-3.5 h-3.5" />
                                            {t.tryoutList.passingGrade} {tryout.passing_grade}
                                        </span>
                                    </div>
                                    {tryout.start_time && (
                                        <p className="text-[10px] text-foreground/20 mt-3">
                                            {t.tryoutList.startTime} {formatDateTime(tryout.start_time)}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-end mt-3 text-accent-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t.tryoutList.doTryout} <ChevronRight className="w-3.5 h-3.5" />
                                    </div>
                                </GlassCard>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <GlassCard hoverable={false} className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground/50 mb-2">{t.tryoutList.noTryouts}</h3>
                    <p className="text-sm text-foreground/30">
                        {t.tryoutList.noTryoutsDesc}
                    </p>
                </GlassCard>
            )}
        </motion.div>
    );
}
