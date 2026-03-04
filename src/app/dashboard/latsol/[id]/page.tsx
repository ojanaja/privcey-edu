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
    Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

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
    const { t } = useTranslation();
    const [exerciseId, setExerciseId] = useState<string | null>(null);
    const [exerciseTitle, setExerciseTitle] = useState('');
    const [questions, setQuestions] = useState<ExQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, string>>(new Map());
    const [reasons, setReasons] = useState<Map<string, string>>(new Map());
    const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());
    const [isFinished, setIsFinished] = useState(false);
    const [showReasonWarning, setShowReasonWarning] = useState(false);

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
    const currentReason = currentQuestion ? reasons.get(currentQuestion.id) : '';
    const isCurrentChecked = currentQuestion ? checkedQuestions.has(currentQuestion.id) : false;
    const isCurrentCorrect = currentQuestion ? answers.get(currentQuestion.id) === currentQuestion.correct_answer : false;
    const isLastQuestion = currentIndex === questions.length - 1;
    const allChecked = questions.length > 0 && questions.every((q) => checkedQuestions.has(q.id));

    const handleSelect = (questionId: string, answer: string) => {
        if (checkedQuestions.has(questionId)) return;
        setShowReasonWarning(false);
        setAnswers((prev) => {
            const newMap = new Map(prev);
            newMap.set(questionId, answer);
            return newMap;
        });
    };

    const handleReasonChange = (questionId: string, reason: string) => {
        if (checkedQuestions.has(questionId)) return;
        setShowReasonWarning(false);
        setReasons((prev) => {
            const newMap = new Map(prev);
            newMap.set(questionId, reason);
            return newMap;
        });
    };

    const isFullyAnswered = (questionId: string) => {
        return answers.has(questionId) && (reasons.get(questionId) || '').trim().length > 0;
    };

    const handleCheckAnswer = () => {
        if (!currentQuestion) return;
        if (!isFullyAnswered(currentQuestion.id)) {
            setShowReasonWarning(true);
            return;
        }
        setCheckedQuestions((prev) => {
            const newSet = new Set(prev);
            newSet.add(currentQuestion.id);
            return newSet;
        });
    };

    const handleNextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setShowReasonWarning(false);
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleFinish = async () => {
        setIsFinished(true);

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
                    <h3 className="text-lg font-medium text-foreground/50 mb-2">{t.latsol.noQuestions}</h3>
                    <p className="text-sm text-foreground/30">{t.latsol.noQuestionsDesc}</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => (window.location.href = '/dashboard/latsol')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t.common.back}
                    </Button>
                </GlassCard>
            </motion.div>
        );
    }

    if (isFinished) {
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
                        <h2 className="text-xl font-bold text-foreground mb-1">{t.latsol.exerciseComplete}</h2>
                        <p className="text-foreground/40 text-sm mb-4">{exerciseTitle}</p>
                        <div className="text-4xl font-bold text-accent-1 mb-2">{score}</div>
                        <p className="text-foreground/40 text-sm">
                            {totalCorrect} {t.latsol.correctOf} {questions.length} {t.latsol.questionOf.toLowerCase()}
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
                                                'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
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
                                    {reasons.get(q.id) && (
                                        <div className="mt-3 ml-10 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                            <p className="text-xs text-blue-400 font-medium mb-1">{t.latsol.yourReason}</p>
                                            <p className="text-xs text-foreground/60 whitespace-pre-wrap">{reasons.get(q.id)}</p>
                                        </div>
                                    )}
                                    {q.explanation && (
                                        <div className="mt-3 ml-10 p-3 rounded-lg bg-accent-1/10 border border-accent-1/20">
                                            <p className="text-xs text-accent-1 font-medium mb-1">{t.latsol.discussionLabel}</p>
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
                            {t.latsol.backToList}
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
                        {t.latsol.questionOf} {currentIndex + 1} / {questions.length}
                    </p>
                </div>
                {allChecked && (
                    <Button variant="danger" size="sm" onClick={handleFinish}>
                        <Send className="w-3.5 h-3.5" />
                        {t.latsol.finishAndView}
                    </Button>
                )}
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
                                    <span className={cn(
                                        'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                                        isCurrentChecked
                                            ? isCurrentCorrect
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                            : 'bg-accent-1/20 text-accent-1'
                                    )}>
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
                                        const isCorrectOpt = currentQuestion?.correct_answer === opt;

                                        if (isCurrentChecked) {
                                            return (
                                                <div
                                                    key={opt}
                                                    className={cn(
                                                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left',
                                                        isCorrectOpt
                                                            ? 'bg-green-500/10 border-green-500/30'
                                                            : isSelected && !isCorrectOpt
                                                                ? 'bg-red-500/10 border-red-500/30'
                                                                : 'bg-foreground/[0.02] border-foreground/[0.06]'
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                                                            isCorrectOpt
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : isSelected && !isCorrectOpt
                                                                    ? 'bg-red-500/20 text-red-400'
                                                                    : 'bg-foreground/5 text-foreground/40'
                                                        )}
                                                    >
                                                        {opt}
                                                    </span>
                                                    <span className={cn(
                                                        'text-sm flex-1',
                                                        isCorrectOpt
                                                            ? 'text-green-300'
                                                            : isSelected && !isCorrectOpt
                                                                ? 'text-red-300'
                                                                : 'text-foreground/40'
                                                    )}>{text}</span>
                                                    {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                                    {isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400" />}
                                                </div>
                                            );
                                        }

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
                                                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
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

                                {currentAnswer && (
                                    <div className="mt-4">
                                        <label className="text-sm font-medium text-foreground/70 mb-2 block">
                                            {t.latsol.reasonLabel} <span className="text-red-400">*</span>
                                        </label>
                                        <textarea
                                            value={currentReason || ''}
                                            onChange={(e) =>
                                                currentQuestion && handleReasonChange(currentQuestion.id, e.target.value)
                                            }
                                            placeholder={t.latsol.reasonPlaceholder}
                                            rows={3}
                                            readOnly={isCurrentChecked}
                                            className={cn(
                                                'w-full rounded-xl border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none resize-none transition-all',
                                                isCurrentChecked
                                                    ? 'bg-foreground/[0.04] border-foreground/[0.08] cursor-not-allowed opacity-70'
                                                    : 'bg-foreground/[0.02] focus:ring-2 focus:ring-accent-1/50',
                                                showReasonWarning && !isCurrentChecked && !(currentReason || '').trim()
                                                    ? 'border-red-500/50 ring-2 ring-red-500/20'
                                                    : !isCurrentChecked ? 'border-foreground/[0.06]' : ''
                                            )}
                                        />
                                        {showReasonWarning && !isCurrentChecked && !(currentReason || '').trim() && (
                                            <p className="text-xs text-red-400 mt-1">{t.latsol.reasonRequired}</p>
                                        )}
                                    </div>
                                )}

                                {isCurrentChecked && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mt-4"
                                    >
                                        {isCurrentCorrect ? (
                                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                    <p className="text-sm font-semibold text-green-400">{t.latsol.answerCorrect}</p>
                                                </div>
                                                {currentQuestion?.explanation && (
                                                    <p className="text-xs text-foreground/60 mt-2">{currentQuestion.explanation}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <XCircle className="w-5 h-5 text-red-400" />
                                                    <p className="text-sm font-semibold text-red-400">{t.latsol.answerWrong}</p>
                                                </div>
                                                <p className="text-xs text-foreground/50 mt-1">
                                                    {t.latsol.correctAnswerIs}{' '}
                                                    <span className="font-bold text-green-400">{currentQuestion?.correct_answer}</span>
                                                </p>
                                                {currentQuestion?.explanation && (
                                                    <div className="mt-3 pt-3 border-t border-red-500/10">
                                                        <p className="text-xs text-accent-1 font-medium mb-1">{t.latsol.discussionLabel}</p>
                                                        <p className="text-xs text-foreground/60">{currentQuestion.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-foreground/5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowReasonWarning(false);
                                            setCurrentIndex(Math.max(0, currentIndex - 1));
                                        }}
                                        disabled={currentIndex === 0}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        {t.common.previous}
                                    </Button>

                                    {!isCurrentChecked ? (
                                        <Button
                                            size="sm"
                                            onClick={handleCheckAnswer}
                                            disabled={!currentAnswer}
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            {t.latsol.checkAnswer}
                                        </Button>
                                    ) : isLastQuestion ? (
                                        <Button size="sm" onClick={handleFinish}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {t.latsol.finishAndView}
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={handleNextQuestion}>
                                            {t.latsol.nextQuestion}
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="lg:w-56 shrink-0">
                    <GlassCard hoverable={false} padding="md" className="lg:sticky lg:top-6">
                        <h3 className="text-sm font-medium text-foreground/60 mb-3">{t.latsol.navigation}</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => {
                                const isCurrent = idx === currentIndex;
                                const isChecked = checkedQuestions.has(q.id);
                                const isCorrect = answers.get(q.id) === q.correct_answer;
                                const hasAnswer = answers.has(q.id);

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            setShowReasonWarning(false);
                                            setCurrentIndex(idx);
                                        }}
                                        className={cn(
                                            'w-9 h-9 rounded-lg text-xs font-medium transition-all',
                                            isCurrent && 'ring-2 ring-accent-1/50',
                                            isChecked && isCorrect
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : isChecked && !isCorrect
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    : isCurrent
                                                        ? 'bg-accent-1 text-foreground'
                                                        : hasAnswer
                                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
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
                                {t.common.correct} ({questions.filter((q) => checkedQuestions.has(q.id) && answers.get(q.id) === q.correct_answer).length})
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/30" />
                                {t.common.incorrect} ({questions.filter((q) => checkedQuestions.has(q.id) && answers.get(q.id) !== q.correct_answer).length})
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded bg-yellow-500/20 border border-yellow-500/30" />
                                {t.latsol.inProgress} ({questions.filter((q) => answers.has(q.id) && !checkedQuestions.has(q.id)).length})
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded bg-foreground/5 border border-foreground/[0.06]" />
                                {t.common.notYet} ({questions.filter((q) => !answers.has(q.id)).length})
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </motion.div>
    );
}
