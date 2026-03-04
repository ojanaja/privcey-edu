'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamStore } from '@/stores/exam-store';
import { formatTimer, cn } from '@/lib/utils';
import { Button, Badge, GlassCard } from '@/components/ui';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    Send,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

export function ExamInterface() {
    const {
        questions,
        currentIndex,
        answers,
        timeRemaining,
        isStarted,
        isSubmitted,
        flaggedQuestions,
        attemptId,
        tryoutId,
        setAnswer,
        goToQuestion,
        nextQuestion,
        prevQuestion,
        toggleFlag,
        tick,
        startExam,
        submitExam,
    } = useExamStore();

    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useTranslation();
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const hasAutoSubmitted = useRef(false);

    const currentQuestion = questions[currentIndex];
    const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;

    const handleSubmit = useCallback(async () => {
        if (!attemptId || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const supabase = createClient();

            const answerEntries = Array.from(answers.entries());
            if (answerEntries.length > 0) {
                const answerRows = answerEntries.map(([questionId, selectedAnswer]) => ({
                    attempt_id: attemptId,
                    question_id: questionId,
                    selected_answer: selectedAnswer,
                    answered_at: new Date().toISOString(),
                }));

                const { error: answerError } = await supabase
                    .from('student_answers')
                    .upsert(answerRows, { onConflict: 'attempt_id,question_id' });

                if (answerError) {
                    console.error('Failed to save answers (batch), falling back to individual:', answerError);
                    for (const row of answerRows) {
                        await supabase.from('student_answers').upsert(row, { onConflict: 'attempt_id,question_id' });
                    }
                }
            }

            const { error: submitError } = await supabase
                .from('tryout_attempts')
                .update({ is_submitted: true })
                .eq('id', attemptId);

            if (submitError) {
                console.error('Failed to submit attempt:', submitError);
            }

            submitExam();
        } catch (err) {
            console.error('Submit failed:', err);
        } finally {
            setIsSubmitting(false);
            setShowConfirm(false);
        }
    }, [attemptId, answers, isSubmitting, submitExam]);

    useEffect(() => {
        if (isStarted && !isSubmitted && timeRemaining > 0) {
            timerRef.current = setInterval(() => tick(), 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }

        if (timeRemaining === 0 && isStarted && !isSubmitted && !hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            handleSubmit();
        }
    }, [isStarted, isSubmitted, timeRemaining, handleSubmit, tick]);

    if (!isStarted) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="max-w-md w-full text-center" padding="lg">
                    <div className="text-4xl mb-4">📝</div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{t.exam.readyTitle}</h2>
                    <p className="text-foreground/50 text-sm mb-2">{questions.length} {t.exam.questionsCount}</p>
                    <p className="text-foreground/50 text-sm mb-6">
                        {t.exam.durationLabel} {formatTimer(useExamStore.getState().duration)}
                    </p>
                    <Button onClick={startExam} size="lg" className="w-full">
                        {t.exam.startExam}
                    </Button>
                </GlassCard>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="max-w-md w-full text-center" padding="lg">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{t.exam.examDone}</h2>
                    <p className="text-foreground/50 text-sm mb-4">
                        {t.exam.answersCollected}
                    </p>
                    <div className="flex gap-3 text-sm text-foreground/40 justify-center mb-6">
                        <span>{t.exam.answeredCount} {answers.size}</span>
                        <span>{t.exam.emptyCount} {questions.length - answers.size}</span>
                    </div>
                    <Button onClick={() => router.push('/dashboard/tryout')} className="w-full">
                        {t.exam.backToTryoutList}
                    </Button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Badge variant={timeRemaining < 300 ? 'danger' : 'info'}>
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {formatTimer(timeRemaining)}
                        </Badge>
                        <span className="text-sm text-foreground/40">
                            {t.exam.questionProgress} {currentIndex + 1} / {questions.length}
                        </span>
                    </div>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowConfirm(true)}
                    >
                        <Send className="w-3.5 h-3.5" />
                        {t.exam.submitButton}
                    </Button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion?.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="flex-1"
                    >
                        <GlassCard hoverable={false} padding="lg" className="h-full flex flex-col">
                            <div className="flex items-start gap-3 mb-6">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-1/20 text-accent-1 flex items-center justify-center text-sm font-bold">
                                    {currentIndex + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
                                        {currentQuestion?.question_text}
                                    </p>
                                    {currentQuestion?.question_image_url && (
                                        <Image
                                            src={currentQuestion.question_image_url}
                                            alt={t.exam.questionImage}
                                            width={600}
                                            height={400}
                                            className="mt-4 rounded-xl max-w-full max-h-64 object-contain"
                                            unoptimized
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 flex-1">
                                {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
                                    const optionKey = `option_${opt.toLowerCase()}` as keyof typeof currentQuestion;
                                    const optionText = currentQuestion?.[optionKey] as string | null;
                                    if (!optionText) return null;

                                    const isSelected = currentAnswer === opt;

                                    return (
                                        <motion.button
                                            key={opt}
                                            onClick={() => currentQuestion && setAnswer(currentQuestion.id, opt)}
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
                                            <span className="text-sm">{optionText}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-foreground/5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={prevQuestion}
                                    disabled={currentIndex === 0}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {t.exam.prevButton}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => currentQuestion && toggleFlag(currentQuestion.id)}
                                    className={cn(
                                        currentQuestion && flaggedQuestions.has(currentQuestion.id) && 'text-yellow-400'
                                    )}
                                >
                                    <Flag className="w-4 h-4" />
                                    {currentQuestion && flaggedQuestions.has(currentQuestion.id) ? t.exam.flagged : t.exam.flag}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={nextQuestion}
                                    disabled={currentIndex === questions.length - 1}
                                >
                                    {t.exam.nextButton}
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </GlassCard>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="lg:w-64 flex-shrink-0">
                <GlassCard hoverable={false} padding="md" className="lg:sticky lg:top-6">
                    <h3 className="text-sm font-medium text-foreground/60 mb-4">{t.exam.questionNav}</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = answers.has(q.id);
                            const isFlagged = flaggedQuestions.has(q.id);
                            const isCurrent = idx === currentIndex;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => goToQuestion(idx)}
                                    className={cn(
                                        'w-10 h-10 rounded-lg text-xs font-medium transition-all relative',
                                        isCurrent
                                            ? 'bg-accent-1 text-foreground ring-2 ring-accent-1/50'
                                            : isAnswered
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-foreground/5 text-foreground/40 border border-foreground/[0.06] hover:bg-foreground/10'
                                    )}
                                >
                                    {idx + 1}
                                    {isFlagged && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-foreground/5 space-y-2 text-xs text-foreground/40">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
                            {t.common.answered} ({answers.size})
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-foreground/5 border border-foreground/[0.06]" />
                            {t.common.notYet} ({questions.length - answers.size})
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-yellow-400" />
                            {t.common.flagged} ({flaggedQuestions.size})
                        </div>
                    </div>
                </GlassCard>
            </div>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GlassCard hoverable={false} padding="lg" className="max-w-sm w-full mx-4">
                                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-foreground text-center mb-2">
                                    {t.exam.submitConfirmTitle}
                                </h3>
                                <div className="text-sm text-foreground/50 text-center mb-6 space-y-1">
                                    <p>{t.exam.submitConfirmAnswered} {answers.size} / {questions.length}</p>
                                    <p>{t.exam.submitConfirmUnanswered} {questions.length - answers.size}</p>
                                    <p>{t.exam.submitConfirmTime} {formatTimer(timeRemaining)}</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        className="flex-1"
                                        onClick={() => setShowConfirm(false)}
                                    >
                                        {t.common.cancel}
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        isLoading={isSubmitting}
                                        onClick={handleSubmit}
                                    >
                                        {t.exam.yesSubmit}
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
