import { create } from 'zustand';
import type { Question, StudentAnswer } from '@/types/database';

interface ExamState {
    tryoutId: string | null;
    attemptId: string | null;
    questions: Question[];
    duration: number;

    currentIndex: number;
    answers: Map<string, string>;
    timeRemaining: number;
    isStarted: boolean;
    isSubmitted: boolean;
    flaggedQuestions: Set<string>;

    setExam: (tryoutId: string, attemptId: string, questions: Question[], duration: number) => void;
    setAnswer: (questionId: string, answer: string) => void;
    goToQuestion: (index: number) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    toggleFlag: (questionId: string) => void;
    tick: () => void;
    startExam: () => void;
    submitExam: () => void;
    resetExam: () => void;
    getAnswersSummary: () => { answered: number; unanswered: number; flagged: number };
}

export const useExamStore = create<ExamState>((set, get) => ({
    tryoutId: null,
    attemptId: null,
    questions: [],
    duration: 0,
    currentIndex: 0,
    answers: new Map(),
    timeRemaining: 0,
    isStarted: false,
    isSubmitted: false,
    flaggedQuestions: new Set(),

    setExam: (tryoutId, attemptId, questions, duration) =>
        set({
            tryoutId,
            attemptId,
            questions,
            duration,
            timeRemaining: duration,
            currentIndex: 0,
            answers: new Map(),
            isStarted: false,
            isSubmitted: false,
            flaggedQuestions: new Set(),
        }),

    setAnswer: (questionId, answer) =>
        set((state) => {
            const newAnswers = new Map(state.answers);
            newAnswers.set(questionId, answer);
            return { answers: newAnswers };
        }),

    goToQuestion: (index) =>
        set((state) => ({
            currentIndex: Math.max(0, Math.min(index, state.questions.length - 1)),
        })),

    nextQuestion: () =>
        set((state) => ({
            currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
        })),

    prevQuestion: () =>
        set((state) => ({
            currentIndex: Math.max(state.currentIndex - 1, 0),
        })),

    toggleFlag: (questionId) =>
        set((state) => {
            const newFlagged = new Set(state.flaggedQuestions);
            if (newFlagged.has(questionId)) {
                newFlagged.delete(questionId);
            } else {
                newFlagged.add(questionId);
            }
            return { flaggedQuestions: newFlagged };
        }),

    tick: () =>
        set((state) => ({
            timeRemaining: Math.max(0, state.timeRemaining - 1),
        })),

    startExam: () => set({ isStarted: true }),
    submitExam: () => set({ isSubmitted: true }),

    resetExam: () =>
        set({
            tryoutId: null,
            attemptId: null,
            questions: [],
            duration: 0,
            currentIndex: 0,
            answers: new Map(),
            timeRemaining: 0,
            isStarted: false,
            isSubmitted: false,
            flaggedQuestions: new Set(),
        }),

    getAnswersSummary: () => {
        const state = get();
        const answered = state.answers.size;
        const unanswered = state.questions.length - answered;
        const flagged = state.flaggedQuestions.size;
        return { answered, unanswered, flagged };
    },
}));
