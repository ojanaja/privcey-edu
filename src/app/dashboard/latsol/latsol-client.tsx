'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Badge, Button } from '@/components/ui';
import { BookOpen, Calendar } from 'lucide-react';
import type { DailyExercise } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';

export function LatsolClientPage({ initialExercises }: { initialExercises: DailyExercise[] }) {
    const { t } = useTranslation();
    const [exercises] = useState<DailyExercise[]>(initialExercises);

    const today = new Date().toISOString().split('T')[0];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-accent-1" />
                    {t.latsol.title}
                </h1>
                <p className="text-foreground/40 text-sm mt-1">{t.latsol.subtitle}</p>
            </div>

            {exercises.length > 0 ? (
                <div className="space-y-4">
                    {exercises.map((exercise, idx) => {
                        const isToday = exercise.date === today;
                        return (
                            <motion.div
                                key={exercise.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <GlassCard className="flex items-center gap-4" padding="md">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${isToday ? 'bg-accent-1/20' : 'bg-foreground/5'
                                        }`}>
                                        {exercise.subject?.icon || '📝'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-foreground">{exercise.title}</h3>
                                            {isToday && <Badge variant="success">{t.common.today}</Badge>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-foreground/30">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(exercise.date)}
                                            </span>
                                            <Badge variant="info">{exercise.subject?.name}</Badge>
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/latsol/${exercise.id}`}>
                                        <Button variant={isToday ? 'primary' : 'outline'} size="sm">
                                            {t.latsol.doExercise}
                                        </Button>
                                    </Link>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <GlassCard hoverable={false} className="text-center py-16">
                    <Calendar className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground/50 mb-2">{t.latsol.noExercises}</h3>
                    <p className="text-sm text-foreground/30">{t.latsol.noExercisesDesc}</p>
                </GlassCard>
            )}
        </motion.div>
    );
}
