import { create } from 'zustand';
import type { Question, StudentAnswer } from '@/types/database';

const STORAGE_KEY = 'privcey-exam-backup';

function saveToStorage(state: {
    tryoutId: string | null;
    attemptId: string | null;
    answers: Map<string, string>;
    flaggedQuestions: Set<string>;
    timeRemaining: number;
    startedAt: number | null;
}) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                tryoutId: state.tryoutId,
                attemptId: state.attemptId,
                answers: Array.from(state.answers.entries()),
                flaggedQuestions: Array.from(state.flaggedQuestions),
                timeRemaining: state.timeRemaining,
                startedAt: state.startedAt,
                savedAt: Date.now(),
            })
        );
    } catch {
    }
}

function loadFromStorage(): {
    tryoutId: string;
    attemptId: string;
    answers: Map<string, string>;
    flaggedQuestions: Set<string>;
    timeRemaining: number;
    startedAt: number;
} | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (Date.now() - data.savedAt > 4 * 60 * 60 * 1000) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return {
            tryoutId: data.tryoutId,
            attemptId: data.attemptId,
            answers: new Map(data.answers),
            flaggedQuestions: new Set(data.flaggedQuestions),
            timeRemaining: data.timeRemaining,
            startedAt: data.startedAt,
        };
    } catch {
        return null;
    }
}

function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {

    }
}

interface ExamState {
    tryoutId: string | null;
    attemptId: string | null;
    questions: Question[];
    duration: number;
    startedAt: number | null;

    currentIndex: number;
    answers: Map<string, string>;
    timeRemaining: number;
    isStarted: boolean;
    isSubmitted: boolean;
    flaggedQuestions: Set<string>;

    setExam: (tryoutId: string, attemptId: string, questions: Question[], duration: number) => void;
    restoreFromBackup: (questions: Question[]) => boolean;
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
    startedAt: null,
    currentIndex: 0,
    answers: new Map(),
    timeRemaining: 0,
    isStarted: false,
    isSubmitted: false,
    flaggedQuestions: new Set(),

    setExam: (tryoutId, attemptId, questions, duration) => {
        set({
            tryoutId,
            attemptId,
            questions,
            duration,
            timeRemaining: duration,
            startedAt: null,
            currentIndex: 0,
            answers: new Map(),
            isStarted: false,
            isSubmitted: false,
            flaggedQuestions: new Set(),
        });
    },

    restoreFromBackup: (questions: Question[]) => {
        const backup = loadFromStorage();
        if (!backup || !backup.attemptId) return false;
        const elapsed = Math.floor((Date.now() - backup.startedAt) / 1000);
        const originalDuration = backup.timeRemaining + elapsed; 
        const remaining = Math.max(0, backup.timeRemaining - Math.floor((Date.now() - (backup.startedAt + (originalDuration - backup.timeRemaining) * 1000)) / 1000));

        set({
            tryoutId: backup.tryoutId,
            attemptId: backup.attemptId,
            questions,
            answers: backup.answers,
            flaggedQuestions: backup.flaggedQuestions,
            timeRemaining: Math.max(0, backup.timeRemaining),
            startedAt: backup.startedAt,
            isStarted: true,
            isSubmitted: false,
            currentIndex: 0,
        });
        return true;
    },

    setAnswer: (questionId, answer) =>
        set((state) => {
            const newAnswers = new Map(state.answers);
            newAnswers.set(questionId, answer);
            saveToStorage({ ...state, answers: newAnswers });
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
            saveToStorage({ ...state, flaggedQuestions: newFlagged });
            return { flaggedQuestions: newFlagged };
        }),

    tick: () =>
        set((state) => {
            if (state.startedAt && state.duration) {
                const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
                const remaining = Math.max(0, state.duration - elapsed);
                return { timeRemaining: remaining };
            }
            return { timeRemaining: Math.max(0, state.timeRemaining - 1) };
        }),

    startExam: () => {
        const startedAt = Date.now();
        set((state) => {
            saveToStorage({ ...state, startedAt });
            return { isStarted: true, startedAt };
        });
    },

    submitExam: () => {
        clearStorage();
        set({ isSubmitted: true });
    },

    resetExam: () => {
        clearStorage();
        set({
            tryoutId: null,
            attemptId: null,
            questions: [],
            duration: 0,
            startedAt: null,
            currentIndex: 0,
            answers: new Map(),
            timeRemaining: 0,
            isStarted: false,
            isSubmitted: false,
            flaggedQuestions: new Set(),
        });
    },

    getAnswersSummary: () => {
        const state = get();
        const answered = state.answers.size;
        const unanswered = state.questions.length - answered;
        const flagged = state.flaggedQuestions.size;
        return { answered, unanswered, flagged };
    },
}));
