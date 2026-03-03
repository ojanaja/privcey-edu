'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, Badge, LoadingSpinner, Button } from '@/components/ui';
import { BookOpen, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import type { DailyExercise } from '@/types/database';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function LatsolPage() {
    const { user } = useAuthStore();
    const [exercises, setExercises] = useState<DailyExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const fetchExercises = async () => {
            const { data } = await supabase
                .from('daily_exercises')
                .select('*, subject:subjects(*)')
                .eq('is_active', true)
                .order('date', { ascending: false })
                .limit(20);

            if (data) setExercises(data);
            setIsLoading(false);
        };

        fetchExercises();
    }, [user]);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    const today = new Date().toISOString().split('T')[0];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-accent-1" />
                    Latihan Soal Harian
                </h1>
                <p className="text-foreground/40 text-sm mt-1">Asah kemampuanmu setiap hari</p>
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
                                            {isToday && <Badge variant="success">Hari ini</Badge>}
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
                                            Kerjakan
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
                    <h3 className="text-lg font-medium text-foreground/50 mb-2">Belum Ada Latihan</h3>
                    <p className="text-sm text-foreground/30">Latihan harian akan muncul di sini setiap hari.</p>
                </GlassCard>
            )}
        </motion.div>
    );
}
