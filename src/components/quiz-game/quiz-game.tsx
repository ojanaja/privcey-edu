'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizGameStore } from '@/stores/quiz-game-store';
import { cn } from '@/lib/utils';
import { GlassCard, Badge, Button } from '@/components/ui';
import {
    Timer,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Flame,
    Star,
    Target,
    Sparkles,
    Brain,
    Clock,
    TrendingUp,
} from 'lucide-react';
import type { Question } from '@/types/database';
import { useTranslation } from '@/lib/i18n';
import { sounds } from '@/lib/sounds';

function CountdownOverlay({ onComplete }: { onComplete: () => void }) {
    const { t } = useTranslation();
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count === 0) {
            sounds.countdownGo();
            onComplete();
            return;
        }
        sounds.countdownTick();
        const t = setTimeout(() => setCount(count - 1), 800);
        return () => clearTimeout(t);
    }, [count, onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={count}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex flex-col items-center gap-4"
                >
                    {count > 0 ? (
                        <span className="text-9xl font-black text-accent-1 drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]">
                            {count}
                        </span>
                    ) : (
                        <span className="text-6xl font-black text-accent-1">{t.quizGame.go}</span>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

function TimerBar({ timeRemaining, timeTotal }: { timeRemaining: number; timeTotal: number }) {
    const fraction = timeRemaining / timeTotal;
    const isUrgent = fraction <= 0.25;
    const isWarning = fraction <= 0.5 && !isUrgent;

    return (
        <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
            <motion.div
                className={cn(
                    'h-full rounded-full transition-colors duration-300',
                    isUrgent
                        ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                        : isWarning
                            ? 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                            : 'bg-accent-1 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                )}
                initial={false}
                animate={{ width: `${fraction * 100}%` }}
                transition={{ duration: 0.3, ease: 'linear' }}
            />
        </div>
    );
}

function StreakIndicator({ streak }: { streak: number }) {
    const { t } = useTranslation();
    if (streak < 2) return null;

    return (
        <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30"
        >
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{streak}x {t.quizGame.streak}</span>
        </motion.div>
    );
}

const OPTION_CONFIGS = [
    { key: 'A', color: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', hoverBg: 'hover:bg-red-500/20', activeBg: 'bg-red-500/30', icon: '▲' },
    { key: 'B', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', hoverBg: 'hover:bg-blue-500/20', activeBg: 'bg-blue-500/30', icon: '◆' },
    { key: 'C', color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', hoverBg: 'hover:bg-yellow-500/20', activeBg: 'bg-yellow-500/30', icon: '●' },
    { key: 'D', color: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', hoverBg: 'hover:bg-green-500/20', activeBg: 'bg-green-500/30', icon: '■' },
    { key: 'E', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', hoverBg: 'hover:bg-purple-500/20', activeBg: 'bg-purple-500/30', icon: '★' },
];

function QuestionCard({
    question,
    index,
    total,
}: {
    question: Question;
    index: number;
    total: number;
}) {
    const { selectAnswer, selectedAnswer, isAnswerLocked, timeRemaining, timePerQuestion, score, streak } =
        useQuizGameStore();

    const prevTimeRef = useRef(timeRemaining);
    useEffect(() => {
        if (timeRemaining <= 5 && timeRemaining > 0 && prevTimeRef.current !== timeRemaining) {
            sounds.timeWarning();
        }
        if (timeRemaining === 0 && prevTimeRef.current > 0) {
            sounds.timeUp();
        }
        prevTimeRef.current = timeRemaining;
    }, [timeRemaining]);

    useEffect(() => {
        sounds.newQuestion();
    }, [index]);

    const options = [
        { key: 'A', text: question.option_a },
        { key: 'B', text: question.option_b },
        { key: 'C', text: question.option_c },
        { key: 'D', text: question.option_d },
        ...(question.option_e ? [{ key: 'E', text: question.option_e }] : []),
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl mx-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Badge variant="info">
                        {index + 1} / {total}
                    </Badge>
                    <StreakIndicator streak={streak} />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-1/10 border border-accent-1/20">
                        <Star className="w-4 h-4 text-accent-1" />
                        <span className="text-sm font-bold text-accent-1">{score.toLocaleString()}</span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border",
                        timeRemaining <= 5 ? "bg-red-500/10 border-red-500/30" : "bg-foreground/5 border-foreground/10"
                    )}>
                        <Timer className={cn("w-4 h-4", timeRemaining <= 5 ? "text-red-400 animate-pulse" : "text-foreground/60")} />
                        <span className={cn("text-sm font-bold tabular-nums", timeRemaining <= 5 ? "text-red-400" : "text-foreground/70")}>
                            {timeRemaining}s
                        </span>
                    </div>
                </div>
            </div>

            {/* Timer Bar */}
            <TimerBar timeRemaining={timeRemaining} timeTotal={timePerQuestion} />

            {/* Question */}
            <GlassCard hoverable={false} padding="lg" className="mt-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-1/20 flex items-center justify-center shrink-0">
                        <Brain className="w-5 h-5 text-accent-1" />
                    </div>
                    <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">
                        {question.question_text}
                    </p>
                </div>
                {question.question_image_url && (
                    <div className="mt-4 rounded-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={question.question_image_url}
                            alt="Question"
                            className="w-full max-h-60 object-contain"
                        />
                    </div>
                )}
            </GlassCard>

            {/* Options Grid */}
            <div className={cn(
                "grid gap-3",
                options.length <= 4 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2"
            )}>
                {options.map((opt, idx) => {
                    const config = OPTION_CONFIGS[idx];
                    const isSelected = selectedAnswer === opt.key;

                    return (
                        <motion.button
                            key={opt.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            onClick={() => {
                                sounds.optionSelect();
                                selectAnswer(opt.key);
                            }}
                            disabled={isAnswerLocked}
                            className={cn(
                                'relative flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200',
                                'bg-linear-to-br',
                                config.color,
                                config.border,
                                !isAnswerLocked && config.hoverBg,
                                !isAnswerLocked && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
                                isAnswerLocked && 'cursor-default opacity-60',
                                isSelected && `${config.activeBg} opacity-100 ring-2 ring-foreground/20`,
                            )}
                        >
                            <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0">
                                <span className="text-lg font-bold text-foreground/60">{config.icon}</span>
                            </div>
                            <span className="text-sm md:text-base font-medium text-foreground flex-1">
                                {opt.text}
                            </span>
                            <span className="text-xs font-bold text-foreground/40 px-2 py-1 rounded-lg bg-foreground/5">
                                {opt.key}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}

function FeedbackScreen() {
    const { t } = useTranslation();
    const { results, questions, currentIndex, nextQuestion, streak } = useQuizGameStore();
    const lastResult = results[results.length - 1];
    const currentQ = questions[currentIndex];
    const isCorrect = lastResult?.isCorrect;

    useEffect(() => {
        if (isCorrect) {
            sounds.correct();
            if (streak >= 2) {
                setTimeout(() => sounds.streak(), 200);
            }
        } else {
            sounds.incorrect();
        }
        const t = setTimeout(() => nextQuestion(), 3000);
        return () => clearTimeout(t);
    }, [nextQuestion]);

    const correctOptionText = currentQ
        ? {
            A: currentQ.option_a,
            B: currentQ.option_b,
            C: currentQ.option_c,
            D: currentQ.option_d,
            E: currentQ.option_e || '',
        }[lastResult?.correctAnswer] || ''
        : '';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] gap-6"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                    'w-28 h-28 rounded-full flex items-center justify-center',
                    isCorrect
                        ? 'bg-green-500/20 shadow-[0_0_60px_rgba(34,197,94,0.3)]'
                        : 'bg-red-500/20 shadow-[0_0_60px_rgba(239,68,68,0.3)]'
                )}
            >
                {isCorrect ? (
                    <CheckCircle2 className="w-14 h-14 text-green-400" />
                ) : (
                    <XCircle className="w-14 h-14 text-red-400" />
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
            >
                <h2 className={cn('text-3xl font-black mb-2', isCorrect ? 'text-green-400' : 'text-red-400')}>
                    {isCorrect ? t.quizGame.correctFeedback : t.quizGame.incorrectFeedback}
                </h2>

                {isCorrect && lastResult && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                        className="flex items-center justify-center gap-2 text-accent-1"
                    >
                        <Star className="w-5 h-5" />
                        <span className="text-xl font-bold">+{lastResult.points}</span>
                    </motion.div>
                )}

                {!isCorrect && (
                    <div className="mt-3 px-6 py-3 rounded-xl bg-foreground/5 border border-foreground/10">
                        <p className="text-xs text-foreground/40 mb-1">{t.quizGame.correctAnswerIs}</p>
                        <p className="text-sm font-semibold text-foreground">
                            {lastResult?.correctAnswer}. {correctOptionText}
                        </p>
                    </div>
                )}

                {currentQ?.explanation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-3 px-6 py-3 rounded-xl bg-accent-1/5 border border-accent-1/10 max-w-md"
                    >
                        <p className="text-xs text-accent-1/60 mb-1">{t.quizGame.explanationLabel}</p>
                        <p className="text-xs text-foreground/60">{currentQ.explanation}</p>
                    </motion.div>
                )}

                {streak >= 2 && isCorrect && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30"
                    >
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-bold text-orange-400">{streak}x {t.quizGame.streak} 🔥</span>
                    </motion.div>
                )}
            </motion.div>

            <button
                onClick={nextQuestion}
                className="mt-2 text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
            >
                {t.quizGame.continueButton}
            </button>
        </motion.div>
    );
}

function ResultsScreen({ onPlayAgain, onExit }: { onPlayAgain: () => void; onExit: () => void }) {
    const { t } = useTranslation();
    const { score, results, bestStreak, getTotalCorrect, getAccuracy, moduleTitle, questions } =
        useQuizGameStore();

    const totalCorrect = getTotalCorrect();
    const accuracy = getAccuracy();
    const totalQuestions = questions.length;

    useEffect(() => {
        if (accuracy >= 90) {
            sounds.masterRank();
        } else {
            sounds.gameComplete();
        }
    }, []);

    const getRank = () => {
        if (accuracy >= 90) return { title: t.quizGame.rankMaster, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
        if (accuracy >= 70) return { title: t.quizGame.rankGreat, color: 'text-green-400', bg: 'bg-green-500/20' };
        if (accuracy >= 50) return { title: t.quizGame.rankGood, color: 'text-blue-400', bg: 'bg-blue-500/20' };
        return { title: t.quizGame.rankKeepGoing, color: 'text-orange-400', bg: 'bg-orange-500/20' };
    };

    const rank = getRank();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto"
        >
            {/* Celebration Header */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-center mb-8"
            >
                <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className={cn('inline-flex items-center gap-2 px-6 py-3 rounded-2xl mb-4', rank.bg)}
                >
                    <Sparkles className={cn('w-6 h-6', rank.color)} />
                    <span className={cn('text-2xl font-black', rank.color)}>{rank.title}</span>
                </motion.div>
                <p className="text-foreground/40 text-sm">{moduleTitle}</p>
            </motion.div>

            {/* Score */}
            <GlassCard hoverable={false} padding="lg" className="text-center mb-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                >
                    <p className="text-foreground/40 text-xs uppercase tracking-wider mb-2">{t.quizGame.totalScore}</p>
                    <p className="text-5xl font-black text-accent-1 mb-1">{score.toLocaleString()}</p>
                </motion.div>
            </GlassCard>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Target, label: t.quizGame.accuracy, value: `${accuracy}%`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { icon: CheckCircle2, label: t.quizGame.correctLabel, value: `${totalCorrect}/${totalQuestions}`, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { icon: Flame, label: t.quizGame.bestStreak, value: `${bestStreak}x`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    { icon: Clock, label: t.quizGame.avgTime, value: `${results.length > 0 ? (results.reduce((a, r) => a + r.timeSpent, 0) / results.length).toFixed(1) : 0}s`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                    >
                        <GlassCard hoverable={false} padding="sm" className="text-center">
                            <div className={cn('w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center', stat.bg)}>
                                <stat.icon className={cn('w-5 h-5', stat.color)} />
                            </div>
                            <p className="text-lg font-bold text-foreground">{stat.value}</p>
                            <p className="text-xs text-foreground/40">{stat.label}</p>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {/* Question Review */}
            <GlassCard hoverable={false} padding="md" className="mb-6">
                <h3 className="text-sm font-semibold text-foreground/60 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t.quizGame.reviewAnswers}
                </h3>
                <div className="flex flex-wrap gap-2">
                    {results.map((r, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.03 }}
                            className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border',
                                r.isCorrect
                                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                    : r.selectedAnswer === null
                                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30'
                                        : 'bg-red-500/20 border-red-500/30 text-red-400'
                            )}
                            title={r.isCorrect ? t.quizGame.correctTooltip : r.selectedAnswer === null ? t.quizGame.unansweredTooltip : t.quizGame.incorrectTooltip}
                        >
                            {i + 1}
                        </motion.div>
                    ))}
                </div>
            </GlassCard>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button onClick={onPlayAgain} variant="primary" size="lg" className="flex-1">
                    <RotateCcw className="w-4 h-4" />
                    {t.quizGame.playAgain}
                </Button>
                <Button onClick={onExit} variant="outline" size="lg" className="flex-1">
                    {t.quizGame.backButton}
                </Button>
            </div>
        </motion.div>
    );
}

export function QuizGame({
    onExit,
    onPlayAgain,
}: {
    onExit: () => void;
    onPlayAgain: () => void;
}) {
    const { phase, questions, currentIndex, startCountdown, startQuestion, tickTimer } =
        useQuizGameStore();

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (phase === 'lobby') {
            startCountdown();
        }
    }, [phase, startCountdown]);

    useEffect(() => {
        if (phase === 'playing') {
            timerRef.current = setInterval(() => tickTimer(), 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, tickTimer]);

    const handleCountdownComplete = useCallback(() => {
        startQuestion();
    }, [startQuestion]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8">
            <AnimatePresence mode="wait">
                {phase === 'countdown' && (
                    <CountdownOverlay key="countdown" onComplete={handleCountdownComplete} />
                )}

                {phase === 'playing' && questions[currentIndex] && (
                    <QuestionCard
                        key={`q-${currentIndex}`}
                        question={questions[currentIndex]}
                        index={currentIndex}
                        total={questions.length}
                    />
                )}

                {phase === 'feedback' && <FeedbackScreen key="feedback" />}

                {phase === 'results' && (
                    <ResultsScreen key="results" onPlayAgain={onPlayAgain} onExit={onExit} />
                )}
            </AnimatePresence>
        </div>
    );
}
