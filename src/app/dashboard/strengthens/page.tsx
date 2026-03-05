'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { useQuizGameStore } from '@/stores/quiz-game-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, Badge, LoadingSpinner, Button } from '@/components/ui';
import { QuizGame } from '@/components/quiz-game/quiz-game';
import {
    Zap,
    Gamepad2,
    Trophy,
    Flame,
    Star,
    Brain,
    Sparkles,
    Play,
    Clock,
    Target,
    ChevronRight,
    ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StrengthensModule, Question } from '@/types/database';
import { useTranslation } from '@/lib/i18n';

type PageView = 'lobby' | 'playing';

export default function StrengthensPage() {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const { initGame, resetGame } = useQuizGameStore();
    const [modules, setModules] = useState<StrengthensModule[]>([]);
    const [moduleQuestions, setModuleQuestions] = useState<Record<string, Question[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<PageView>('lobby');
    const [selectedModule, setSelectedModule] = useState<StrengthensModule | null>(null);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [highScores, setHighScores] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const fetchData = async () => {
            const { data: moduleData } = await supabase
                .from('strengthens_modules')
                .select('*, subject:subjects(*), tryout:tryouts(*)')
                .eq('is_active', true);

            setModules(moduleData || []);

            setIsLoading(false);
        };

        fetchData();
    }, [user]);

    const loadQuestions = useCallback(async (mod: StrengthensModule) => {
        if (moduleQuestions[mod.id]) return moduleQuestions[mod.id];

        setLoadingQuestions(true);
        const supabase = createClient();

        const { data } = await supabase
            .from('questions')
            .select('*')
            .eq('tryout_id', mod.tryout_id)
            .order('order_number');

        const questions = (data || []) as Question[];
        setModuleQuestions((prev) => ({ ...prev, [mod.id]: questions }));
        setLoadingQuestions(false);
        return questions;
    }, [moduleQuestions]);

    const handleStartGame = useCallback(async (mod: StrengthensModule) => {
        setSelectedModule(mod);
        const questions = await loadQuestions(mod);

        if (questions.length === 0) return;

        const avgDifficulty = questions.reduce((acc, q) => {
            if (q.difficulty === 'easy') return acc + 1;
            if (q.difficulty === 'medium') return acc + 2;
            return acc + 3;
        }, 0) / questions.length;

        const timePerQuestion = avgDifficulty <= 1.5 ? 15 : avgDifficulty <= 2.5 ? 20 : 25;

        initGame(mod.id, mod.title, questions, timePerQuestion);
        setView('playing');
    }, [loadQuestions, initGame]);

    const handleExit = useCallback(() => {
        const store = useQuizGameStore.getState();
        if (selectedModule && store.score > 0) {
            setHighScores((prev) => ({
                ...prev,
                [selectedModule.id]: Math.max(prev[selectedModule.id] || 0, store.score),
            }));
        }
        resetGame();
        setView('lobby');
        setSelectedModule(null);
    }, [selectedModule, resetGame]);

    const handlePlayAgain = useCallback(async () => {
        const currentModule = selectedModule as StrengthensModule;
        const store = useQuizGameStore.getState();
        if (store.score > 0) {
            setHighScores((prev) => ({
                ...prev,
                [currentModule.id]: Math.max(prev[currentModule.id] || 0, store.score),
            }));
        }
        await handleStartGame(currentModule);
    }, [selectedModule, handleStartGame]);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    if (view === 'playing') {
        return <QuizGame onExit={handleExit} onPlayAgain={handlePlayAgain} />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="mb-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-3 mb-2"
                >
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <Gamepad2 className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">
                            {t.strengthensPage.title}
                        </h1>
                        <p className="text-foreground/40 text-xs">
                            {t.strengthensPage.subtitle}
                        </p>
                    </div>
                </motion.div>
            </div>

            <GlassCard hoverable={false} padding="sm" className="mb-6 bg-linear-to-r from-accent-1/5 to-purple-500/5 border-accent-1/10">
                <div className="flex items-start gap-3 px-2">
                    <Sparkles className="w-5 h-5 text-accent-1 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-accent-1 mb-1">{t.strengthensPage.howToPlay}</p>
                        <p className="text-xs text-foreground/50">
                            {t.strengthensPage.howToPlayDesc}
                        </p>
                    </div>
                </div>
            </GlassCard>

            {Object.keys(highScores).length > 0 && (
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 shrink-0">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-400">
                            {t.strengthensPage.best} {Math.max(...Object.values(highScores)).toLocaleString()} pts
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 shrink-0">
                        <Star className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">
                            {Object.keys(highScores).length} {t.strengthensPage.modulesPlayed}
                        </span>
                    </div>
                </div>
            )}

            {modules.length > 0 ? (
                <div className="grid gap-4">
                    {modules.map((mod, idx) => {
                        const questionCount = moduleQuestions[mod.id]?.length;
                        const bestScore = highScores[mod.id];
                        const hasPlayed = bestScore !== undefined;

                        return (
                            <motion.div
                                key={mod.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                            >
                                <GlassCard
                                    className={cn(
                                        'cursor-pointer group border-foreground/5',
                                        'hover:border-accent-1/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]',
                                        'transition-all duration-300'
                                    )}
                                    padding="md"
                                    onClick={() => handleStartGame(mod)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300',
                                            'bg-linear-to-br from-accent-1/20 to-purple-500/10',
                                            'group-hover:from-accent-1/30 group-hover:to-purple-500/20',
                                            'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                        )}>
                                            <Brain className="w-7 h-7 text-accent-1 group-hover:scale-110 transition-transform" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-foreground truncate">
                                                    {mod.title}
                                                </h3>
                                                {hasPlayed && (
                                                    <Badge variant="success" className="shrink-0">
                                                        <Trophy className="w-3 h-3 mr-1" />
                                                        {bestScore.toLocaleString()}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap">
                                                {mod.subject && (
                                                    <Badge variant="info">{mod.subject.name}</Badge>
                                                )}
                                                {mod.tryout && (
                                                    <span className="text-[10px] text-foreground/30">
                                                        {mod.tryout.title}
                                                    </span>
                                                )}
                                            </div>

                                            {mod.description && (
                                                <p className="text-xs text-foreground/40 mt-1.5 line-clamp-1">
                                                    {mod.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className={cn(
                                            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                                            'bg-accent-1/10 group-hover:bg-accent-1/20',
                                            'transition-all duration-300',
                                            'group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                        )}>
                                            <Play className="w-5 h-5 text-accent-1 group-hover:scale-110 transition-transform" />
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <GlassCard hoverable={false} className="text-center py-16">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Gamepad2 className="w-16 h-16 text-foreground/15 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-foreground/50 mb-2">{t.strengthensPage.noQuizGames}</h3>
                    <p className="text-sm text-foreground/30 max-w-sm mx-auto">
                        {t.strengthensPage.noQuizGamesDesc}
                    </p>
                </GlassCard>
            )}

            <AnimatePresence>
                {loadingQuestions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    >
                        <GlassCard hoverable={false} padding="lg" className="text-center">
                            <div className="relative mx-auto mb-4">
                                <div className="w-16 h-16 border-2 border-foreground/10 rounded-full" />
                                <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-accent-1 rounded-full animate-spin" />
                                <Gamepad2 className="absolute inset-0 m-auto w-6 h-6 text-accent-1" />
                            </div>
                            <p className="text-sm font-semibold text-foreground/60">{t.strengthensPage.preparingQuiz}</p>
                            <p className="text-xs text-foreground/30 mt-1">{t.strengthensPage.loadingQuestions}</p>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
