'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, Badge, Button, LoadingSpinner } from '@/components/ui';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExQuestion {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    option_e: string | null;
    correct_answer: string;
    explanation: string | null;
    order_number: number;
}

export default function LatsolExercisePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { user } = useAuthStore();
    const [exerciseId, setExerciseId] = useState<string | null>(null);
    const [exerciseTitle, setExerciseTitle] = useState('');
    const [questions, setQuestions] = useState<ExQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, string>>(new Map());
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        params.then((p) => setExerciseId(p.id));
    }, [params]);

    useEffect(() => {
        if (!exerciseId) return;
        const supabase = createClient();

        const fetchData = async () => {
            const { data: exercise } = await supabase
                .from('daily_exercises')
                .select('title, subject:subjects(name)')
                .eq('id', exerciseId)
                .single();

            if (exercise) setExerciseTitle(exercise.title);

            const { data: qData } = await supabase
                .from('daily_exercise_questions')
                .select('*')
                .eq('exercise_id', exerciseId)
                .order('order_number');

            if (qData) setQuestions(qData);
            setIsLoading(false);
        };

        fetchData();
    }, [exerciseId]);

    const currentQuestion = questions[currentIndex];
    const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;

    const handleSelect = (questionId: string, answer: string) => {
        if (isSubmitted) return;
        setAnswers((prev) => {
            const newMap = new Map(prev);
            newMap.set(questionId, answer);
            return newMap;
        });
    };

    const handleSubmit = async () => {
        setIsSubmitted(true);

        if (user && exerciseId) {
            const supabase = createClient();
            await supabase.from('attendance_logs').insert({
                student_id: user.id,
                activity_type: 'tryout',
                activity_id: exerciseId,
                activity_title: `Latsol: ${exerciseTitle}`,
            });
        }
    };

    const totalCorrect = questions.filter(
        (q) => answers.get(q.id) === q.correct_answer
    ).length;
    const score = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    if (questions.length === 0) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard hoverable={false} className="text-center py-16">
                    <h3 className="text-lg font-medium text-foreground/50 mb-2">Belum Ada Soal</h3>
                    <p className="text-sm text-foreground/30">Latihan ini belum memiliki soal.</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => (window.location.href = '/dashboard/latsol')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                </GlassCard>
            </motion.div>
        );
    }

    if (isSubmitted) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="max-w-2xl mx-auto">
                    <GlassCard hoverable={false} padding="lg" className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-foreground mb-1">Latihan Selesai!</h2>
                        <p className="text-foreground/40 text-sm mb-4">{exerciseTitle}</p>
                        <div className="text-4xl font-bold text-accent-1 mb-2">{score}</div>
                        <p className="text-foreground/40 text-sm">
                            {totalCorrect} benar dari {questions.length} soal
                        </p>
                    </GlassCard>

                    <div className="space-y-4">
                        {questions.map((q, idx) => {
                            const selected = answers.get(q.id);
                            const isCorrect = selected === q.correct_answer;

                            return (
                                <GlassCard key={q.id} hoverable={false} padding="md">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span
                                            className={cn(
                                                'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                                                isCorrect
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                            )}
                                        >
                                            {idx + 1}
                                        </span>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{q.question_text}</p>
                                    </div>
                                    <div className="space-y-2 ml-10">
                                        {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
                                            const key = `option_${opt.toLowerCase()}` as keyof ExQuestion;
                                            const text = q[key] as string | null;
                                            if (!text) return null;
                                            const isSelectedOpt = selected === opt;
                                            const isCorrectOpt = q.correct_answer === opt;

                                            return (
                                                <div
                                                    key={opt}
                                                    className={cn(
                                                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs border',
                                                        isCorrectOpt
                                                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                                            : isSelectedOpt && !isCorrectOpt
                                                                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                                                : 'border-foreground/5 text-foreground/40'
                                                    )}
                                                >
                                                    <span className="font-bold w-5">{opt}.</span>
                                                    <span className="flex-1">{text}</span>
                                                    {isCorrectOpt && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                                                    {isSelectedOpt && !isCorrectOpt && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {q.explanation && (
                                        <div className="mt-3 ml-10 p-3 rounded-lg bg-accent-1/10 border border-accent-1/20">
                                            <p className="text-xs text-accent-1 font-medium mb-1">Pembahasan:</p>
                                            <p className="text-xs text-foreground/60">{q.explanation}</p>
                                        </div>
                                    )}
                                </GlassCard>
                            );
                        })}
                    </div>

                    <div className="mt-6 text-center">
                        <Button
                            variant="outline"
                            onClick={() => (window.location.href = '/dashboard/latsol')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Daftar Latihan
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-lg font-bold text-foreground">{exerciseTitle}</h1>
                    <p className="text-foreground/40 text-xs">
                        Soal {currentIndex + 1} dari {questions.length}
                    </p>
                </div>
                <Button variant="danger" size="sm" onClick={handleSubmit}>
                    Selesai & Lihat Hasil
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion?.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <GlassCard hoverable={false} padding="lg">
                                <div className="flex items-start gap-3 mb-6">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-1/20 text-accent-1 flex items-center justify-center text-sm font-bold">
                                        {currentIndex + 1}
                                    </span>
                                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
                                        {currentQuestion?.question_text}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
                                        const key = `option_${opt.toLowerCase()}` as keyof ExQuestion;
                                        const text = currentQuestion?.[key] as string | null;
                                        if (!text) return null;
                                        const isSelected = currentAnswer === opt;

                                        return (
                                            <motion.button
                                                key={opt}
                                                onClick={() =>
                                                    currentQuestion && handleSelect(currentQuestion.id, opt)
                                                }
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                                                    isSelected
                                                        ? 'bg-accent-1/20 border-accent-1/50 text-white'
                                                        : 'bg-foreground/[0.02] border-foreground/[0.06] text-foreground/70 hover:bg-foreground/[0.05] hover:border-foreground/[0.1]'
                                                )}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span
                                                    className={cn(
                                                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                                                        isSelected
                                                            ? 'bg-accent-1 text-white'
                                                            : 'bg-foreground/5 text-foreground/40'
                                                    )}
                                                >
                                                    {opt}
                                                </span>
                                                <span className="text-sm">{text}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-foreground/5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                        disabled={currentIndex === 0}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentIndex(Math.min(currentIndex + 1, questions.length - 1))
                                        }
                                        disabled={currentIndex === questions.length - 1}
                                    >
                                        Selanjutnya
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="lg:w-56 flex-shrink-0">
                    <GlassCard hoverable={false} padding="md" className="lg:sticky lg:top-6">
                        <h3 className="text-sm font-medium text-foreground/60 mb-3">Navigasi</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => {
                                const isAnswered = answers.has(q.id);
                                const isCurrent = idx === currentIndex;

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={cn(
                                            'w-9 h-9 rounded-lg text-xs font-medium transition-all',
                                            isCurrent
                                                ? 'bg-accent-1 text-foreground ring-2 ring-accent-1/50'
                                                : isAnswered
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-foreground/5 text-foreground/40 border border-foreground/[0.06] hover:bg-foreground/10'
                                        )}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-foreground/5 space-y-1 text-[10px] text-foreground/40">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/30" />
                                Dijawab ({answers.size})
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded bg-foreground/5 border border-foreground/[0.06]" />
                                Belum ({questions.length - answers.size})
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </motion.div>
    );
}
