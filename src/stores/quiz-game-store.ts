import { create } from 'zustand';
import type { Question } from '@/types/database';

export type GamePhase = 'lobby' | 'countdown' | 'playing' | 'feedback' | 'results';

export interface QuizGameResult {
    questionId: string;
    selectedAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
    points: number;
}

interface QuizGameState {
    moduleId: string | null;
    moduleTitle: string;
    questions: Question[];
    timePerQuestion: number;

    phase: GamePhase;
    currentIndex: number;
    timeRemaining: number;
    score: number;
    streak: number;
    bestStreak: number;
    results: QuizGameResult[];

    selectedAnswer: string | null;
    isAnswerLocked: boolean;

    initGame: (moduleId: string, moduleTitle: string, questions: Question[], timePerQuestion?: number) => void;
    startCountdown: () => void;
    startQuestion: () => void;
    selectAnswer: (answer: string) => void;
    tickTimer: () => void;
    timeUp: () => void;
    nextQuestion: () => void;
    showResults: () => void;
    resetGame: () => void;

    getTotalCorrect: () => number;
    getAccuracy: () => number;
    getMaxPoints: () => number;
}

const POINTS_BASE = 1000;
const STREAK_BONUS = 200;

function calculatePoints(timeRemaining: number, timePerQuestion: number, streak: number): number {
    const timeFraction = timeRemaining / timePerQuestion;
    const basePoints = Math.round(POINTS_BASE * (0.5 + 0.5 * timeFraction));
    const streakBonus = streak >= 2 ? STREAK_BONUS * Math.min(streak - 1, 5) : 0;
    return basePoints + streakBonus;
}

export const useQuizGameStore = create<QuizGameState>((set, get) => ({
    moduleId: null,
    moduleTitle: '',
    questions: [],
    timePerQuestion: 20,

    phase: 'lobby',
    currentIndex: 0,
    timeRemaining: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    results: [],

    selectedAnswer: null,
    isAnswerLocked: false,

    initGame: (moduleId, moduleTitle, questions, timePerQuestion = 20) => {
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        set({
            moduleId,
            moduleTitle,
            questions: shuffled,
            timePerQuestion,
            phase: 'lobby',
            currentIndex: 0,
            timeRemaining: timePerQuestion,
            score: 0,
            streak: 0,
            bestStreak: 0,
            results: [],
            selectedAnswer: null,
            isAnswerLocked: false,
        });
    },

    startCountdown: () => set({ phase: 'countdown' }),

    startQuestion: () => {
        const { timePerQuestion } = get();
        set({
            phase: 'playing',
            timeRemaining: timePerQuestion,
            selectedAnswer: null,
            isAnswerLocked: false,
        });
    },

    selectAnswer: (answer) => {
        const state = get();
        if (state.isAnswerLocked || state.phase !== 'playing') return;

        const currentQ = state.questions[state.currentIndex];
        const isCorrect = answer === currentQ.correct_answer;
        const timeSpent = state.timePerQuestion - state.timeRemaining;
        const newStreak = isCorrect ? state.streak + 1 : 0;
        const points = isCorrect ? calculatePoints(state.timeRemaining, state.timePerQuestion, newStreak) : 0;

        const result: QuizGameResult = {
            questionId: currentQ.id,
            selectedAnswer: answer,
            correctAnswer: currentQ.correct_answer,
            isCorrect,
            timeSpent,
            points,
        };

        set({
            selectedAnswer: answer,
            isAnswerLocked: true,
            phase: 'feedback',
            score: state.score + points,
            streak: newStreak,
            bestStreak: Math.max(state.bestStreak, newStreak),
            results: [...state.results, result],
        });
    },

    tickTimer: () => {
        const state = get();
        if (state.phase !== 'playing') return;
        const newTime = Math.max(0, state.timeRemaining - 1);
        set({ timeRemaining: newTime });
        if (newTime === 0) {
            get().timeUp();
        }
    },

    timeUp: () => {
        const state = get();
        if (state.isAnswerLocked) return;

        const currentQ = state.questions[state.currentIndex];
        const result: QuizGameResult = {
            questionId: currentQ.id,
            selectedAnswer: null,
            correctAnswer: currentQ.correct_answer,
            isCorrect: false,
            timeSpent: state.timePerQuestion,
            points: 0,
        };

        set({
            isAnswerLocked: true,
            phase: 'feedback',
            streak: 0,
            results: [...state.results, result],
        });
    },

    nextQuestion: () => {
        const state = get();
        const nextIdx = state.currentIndex + 1;
        if (nextIdx >= state.questions.length) {
            set({ phase: 'results' });
        } else {
            set({
                currentIndex: nextIdx,
                phase: 'countdown',
            });
        }
    },

    showResults: () => set({ phase: 'results' }),

    resetGame: () =>
        set({
            moduleId: null,
            moduleTitle: '',
            questions: [],
            phase: 'lobby',
            currentIndex: 0,
            timeRemaining: 0,
            score: 0,
            streak: 0,
            bestStreak: 0,
            results: [],
            selectedAnswer: null,
            isAnswerLocked: false,
        }),

    getTotalCorrect: () => get().results.filter((r) => r.isCorrect).length,

    getAccuracy: () => {
        const results = get().results;
        if (results.length === 0) return 0;
        return Math.round((results.filter((r) => r.isCorrect).length / results.length) * 100);
    },

    getMaxPoints: () => {
        const { questions, timePerQuestion } = get();
        return questions.length * calculatePoints(timePerQuestion, timePerQuestion, 5);
    },
}));
