'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useExamStore } from '@/stores/exam-store';
import { createClient } from '@/lib/supabase/client';
import { ExamInterface } from '@/components/exam/exam-interface';
import { GlassCard, Button, LoadingSpinner, Badge, ScoreRing } from '@/components/ui';
import { motion } from 'framer-motion';
import { Clock, Target, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { TryOut, Question, TryOutAttempt } from '@/types/database';
import { formatDateTime } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function TryOutDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const { setExam, isStarted, attemptId } = useExamStore();
    const [tryout, setTryout] = useState<TryOut | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [previousAttempt, setPreviousAttempt] = useState<TryOutAttempt | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);

    const tryoutId = params.id as string;

    useEffect(() => {
        if (!user || !tryoutId) return;
        const supabase = createClient();

        const fetchData = async () => {
            const { data: tryoutData } = await supabase
                .from('tryouts')
                .select('*, subject:subjects(*)')
                .eq('id', tryoutId)
                .single();

            if (tryoutData) setTryout(tryoutData);

            const { data: attemptData } = await supabase
                .from('tryout_attempts')
                .select('*')
                .eq('tryout_id', tryoutId)
                .eq('student_id', user.id)
                .eq('is_submitted', true)
                .order('finished_at', { ascending: false })
                .limit(1);

            if (attemptData && attemptData.length > 0) {
                setPreviousAttempt(attemptData[0]);
            }

            try {
                const res = await fetch(`/api/questions?tryout_id=${tryoutId}`);
                const json = await res.json();
                if (json.questions) setQuestions(json.questions);
            } catch (err) {
                console.error('Failed to fetch questions:', err);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [user, tryoutId]);

    const handleStartExam = async () => {
        if (!user || !tryout) return;
        setIsStarting(true);

        const supabase = createClient();

        const { data: attempt, error } = await supabase
            .from('tryout_attempts')
            .insert({
                tryout_id: tryoutId,
                student_id: user.id,
            })
            .select()
            .single();

        if (error || !attempt) {
            setIsStarting(false);
            return;
        }

        await supabase.from('attendance_logs').insert({
            student_id: user.id,
            activity_type: 'tryout',
            activity_id: tryoutId,
            activity_title: tryout.title,
        });

        setExam(tryoutId, attempt.id, questions, tryout.duration_minutes * 60);
        setIsStarting(false);
    };

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    if (!tryout) {
        return (
            <GlassCard hoverable={false} className="text-center py-16">
                <p className="text-foreground/50">{t.tryoutDetail.notFound}</p>
                <Link href="/dashboard/tryout">
                    <Button variant="ghost" className="mt-4">
                        <ArrowLeft className="w-4 h-4" /> {t.common.back}
                    </Button>
                </Link>
            </GlassCard>
        );
    }

    if (isStarted || attemptId) {
        return <ExamInterface />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Link
                href="/dashboard/tryout"
                className="inline-flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground/60 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                {t.tryoutDetail.backToList}
            </Link>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <GlassCard hoverable={false} padding="lg">
                        <div className="flex items-start gap-4 mb-6">
                            <span className="text-4xl">{tryout.subject?.icon || '📝'}</span>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground mb-2">{tryout.title}</h1>
                                <div className="flex items-center gap-3">
                                    <Badge variant="info">{tryout.subject?.name}</Badge>
                                    <Badge>{questions.length} {t.tryoutDetail.questionsCount}</Badge>
                                </div>
                            </div>
                        </div>

                        {tryout.description && (
                            <p className="text-foreground/50 text-sm mb-6">{tryout.description}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-3 rounded-xl bg-foreground/[0.02] border border-foreground/[0.04]">
                                <Clock className="w-5 h-5 text-accent-1 mx-auto mb-1" />
                                <p className="text-sm font-medium text-foreground">{tryout.duration_minutes} {t.common.minutes}</p>
                                <p className="text-[10px] text-foreground/30">{t.tryoutDetail.durationLabel}</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-foreground/[0.02] border border-foreground/[0.04]">
                                <Target className="w-5 h-5 text-accent-1 mx-auto mb-1" />
                                <p className="text-sm font-medium text-foreground">{tryout.passing_grade}</p>
                                <p className="text-[10px] text-foreground/30">{t.tryoutDetail.passingGrade}</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-foreground/[0.02] border border-foreground/[0.04]">
                                <FileText className="w-5 h-5 text-accent-1 mx-auto mb-1" />
                                <p className="text-sm font-medium text-foreground">{questions.length}</p>
                                <p className="text-[10px] text-foreground/30">{t.tryoutDetail.totalQuestions}</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-foreground/[0.02] border border-foreground/[0.04]">
                                <CheckCircle2 className="w-5 h-5 text-accent-1 mx-auto mb-1" />
                                <p className="text-sm font-medium text-foreground">
                                    {previousAttempt ? t.tryoutDetail.done : t.tryoutDetail.notDone}
                                </p>
                                <p className="text-[10px] text-foreground/30">{t.tryoutDetail.attempted}</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleStartExam}
                            isLoading={isStarting}
                            size="lg"
                            className="w-full"
                            disabled={questions.length === 0}
                        >
                            {previousAttempt ? t.tryoutDetail.retake : t.tryoutDetail.startExam}
                        </Button>

                        {questions.length === 0 && (
                            <p className="text-xs text-yellow-400/60 text-center mt-2">
                                {t.tryoutDetail.noQuestions}
                            </p>
                        )}
                    </GlassCard>
                </div>

                <div>
                    {previousAttempt ? (
                        <GlassCard hoverable={false} padding="md" className="text-center">
                            <h3 className="text-sm font-medium text-foreground/50 mb-4">{t.tryoutDetail.previousResults}</h3>
                            <ScoreRing score={previousAttempt.score || 0} size={140} />
                            <div className="mt-4 space-y-2 text-sm text-foreground/40">
                                <div className="flex justify-between">
                                    <span>{t.common.correct}</span>
                                    <span className="text-green-400">{previousAttempt.total_correct}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t.common.incorrect}</span>
                                    <span className="text-red-400">{previousAttempt.total_wrong}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t.common.unanswered}</span>
                                    <span className="text-foreground/30">{previousAttempt.total_unanswered}</span>
                                </div>
                            </div>
                            {previousAttempt.finished_at && (
                                <p className="text-[10px] text-foreground/20 mt-4">
                                    {t.tryoutDetail.finishedAt} {formatDateTime(previousAttempt.finished_at)}
                                </p>
                            )}
                            {(previousAttempt.score || 0) < tryout.passing_grade && (
                                <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                    <p className="text-xs text-yellow-400">
                                        {t.tryoutDetail.strengthensAvailable}
                                    </p>
                                    <Link
                                        href="/dashboard/strengthens"
                                        className="text-xs text-accent-1 hover:underline mt-1 inline-block"
                                    >
                                        {t.tryoutDetail.openStrengthens}
                                    </Link>
                                </div>
                            )}
                        </GlassCard>
                    ) : (
                        <GlassCard hoverable={false} padding="md" className="text-center">
                            <div className="py-8 text-foreground/20">
                                <FileText className="w-10 h-10 mx-auto mb-2" />
                                <p className="text-sm">{t.tryoutDetail.neverAttempted}</p>
                                <p className="text-xs mt-1">
                                    {t.tryoutDetail.clickStartExam}
                                </p>
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
