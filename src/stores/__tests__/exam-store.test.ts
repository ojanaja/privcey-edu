// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExamStore } from '@/stores/exam-store';

function createStorageMock() {
    const storage = new Map<string, string>();
    return {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
            storage.set(key, value);
        },
        removeItem: (key: string) => {
            storage.delete(key);
        },
        clear: () => {
            storage.clear();
        },
    };
}

const questions = [
    {
        id: 'q1',
        tryout_id: 't1',
        question_text: 'Question 1',
        question_image_url: null,
        option_a: 'A1',
        option_b: 'B1',
        option_c: 'C1',
        option_d: 'D1',
        option_e: null,
        correct_answer: 'A' as const,
        explanation: null,
        difficulty: 'easy' as const,
        order_number: 1,
    },
    {
        id: 'q2',
        tryout_id: 't1',
        question_text: 'Question 2',
        question_image_url: null,
        option_a: 'A2',
        option_b: 'B2',
        option_c: 'C2',
        option_d: 'D2',
        option_e: null,
        correct_answer: 'B' as const,
        explanation: null,
        difficulty: 'medium' as const,
        order_number: 2,
    },
];

describe('exam store', () => {
    beforeEach(() => {
        vi.resetModules();
        const localStorageMock = createStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            configurable: true,
        });
        window.localStorage.clear();
        useExamStore.getState().resetExam();
    });

    it('sets exam and handles navigation boundaries', () => {
        useExamStore.getState().setExam('t1', 'a1', questions, 120);
        expect(useExamStore.getState().timeRemaining).toBe(120);

        useExamStore.getState().goToQuestion(100);
        expect(useExamStore.getState().currentIndex).toBe(1);

        useExamStore.getState().prevQuestion();
        expect(useExamStore.getState().currentIndex).toBe(0);

        useExamStore.getState().prevQuestion();
        expect(useExamStore.getState().currentIndex).toBe(0);

        useExamStore.getState().nextQuestion();
        expect(useExamStore.getState().currentIndex).toBe(1);

        useExamStore.getState().nextQuestion();
        expect(useExamStore.getState().currentIndex).toBe(1);
    });

    it('tracks answers, flags, and summary', () => {
        useExamStore.getState().setExam('t1', 'a1', questions, 120);

        useExamStore.getState().setAnswer('q1', 'A');
        useExamStore.getState().toggleFlag('q2');
        useExamStore.getState().toggleFlag('q2');
        useExamStore.getState().toggleFlag('q1');

        const summary = useExamStore.getState().getAnswersSummary();
        expect(summary.answered).toBe(1);
        expect(summary.unanswered).toBe(1);
        expect(summary.flagged).toBe(1);
    });

    it('starts, ticks, submits, and resets exam', () => {
        vi.spyOn(Date, 'now').mockReturnValue(10_000);

        useExamStore.getState().setExam('t1', 'a1', questions, 120);
        useExamStore.getState().startExam();

        expect(useExamStore.getState().isStarted).toBe(true);
        expect(useExamStore.getState().startedAt).toBe(10_000);

        vi.spyOn(Date, 'now').mockReturnValue(40_000);
        useExamStore.getState().tick();
        expect(useExamStore.getState().timeRemaining).toBe(90);

        useExamStore.getState().submitExam();
        expect(useExamStore.getState().isSubmitted).toBe(true);

        useExamStore.getState().resetExam();
        expect(useExamStore.getState().tryoutId).toBeNull();
        expect(useExamStore.getState().answers.size).toBe(0);
    });

    it('restores from backup and handles invalid/expired backup', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(10_000);
        useExamStore.getState().setExam('t1', 'a1', questions, 120);
        useExamStore.getState().startExam();
        useExamStore.getState().setAnswer('q1', 'A');

        vi.resetModules();

        const { useExamStore: restoredStore } = await import('@/stores/exam-store');
        const restored = restoredStore.getState().restoreFromBackup(questions);
        expect(restored).toBe(true);
        expect(restoredStore.getState().answers.get('q1')).toBe('A');

        localStorage.setItem(
            'privcey-exam-backup',
            JSON.stringify({
                tryoutId: 't1',
                attemptId: 'a1',
                answers: [],
                flaggedQuestions: [],
                timeRemaining: 10,
                startedAt: 10_000,
                savedAt: 10_000 - 5 * 60 * 60 * 1000,
            }),
        );

        const expired = restoredStore.getState().restoreFromBackup(questions);
        expect(expired).toBe(false);

        localStorage.setItem('privcey-exam-backup', '{bad json');
        const invalid = restoredStore.getState().restoreFromBackup(questions);
        expect(invalid).toBe(false);
    });

    it('ticks fallback branch without start metadata', () => {
        useExamStore.getState().setExam('t1', 'a1', questions, 120);
        useExamStore.setState({ timeRemaining: 2, startedAt: null, duration: 0 });

        useExamStore.getState().tick();
        expect(useExamStore.getState().timeRemaining).toBe(1);

        useExamStore.getState().tick();
        expect(useExamStore.getState().timeRemaining).toBe(0);
    });

    it('returns false when no backup is present', () => {
        window.localStorage.removeItem('privcey-exam-backup');
        const restored = useExamStore.getState().restoreFromBackup(questions);
        expect(restored).toBe(false);
    });
});
