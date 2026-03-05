import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuizGameStore } from '@/stores/quiz-game-store';

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

describe('quiz game store', () => {
    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        useQuizGameStore.getState().resetGame();
    });

    it('initializes and moves through countdown to playing', () => {
        useQuizGameStore.getState().initGame('m1', 'Module 1', questions, 20);
        expect(useQuizGameStore.getState().moduleId).toBe('m1');
        expect(useQuizGameStore.getState().phase).toBe('lobby');

        useQuizGameStore.getState().startCountdown();
        expect(useQuizGameStore.getState().phase).toBe('countdown');

        useQuizGameStore.getState().startQuestion();
        expect(useQuizGameStore.getState().phase).toBe('playing');
        expect(useQuizGameStore.getState().timeRemaining).toBe(20);
    });

    it('handles correct and incorrect answers, locking behavior, and results', () => {
        useQuizGameStore.getState().initGame('m1', 'Module 1', questions, 20);
        useQuizGameStore.getState().startQuestion();

        const firstCorrect = useQuizGameStore.getState().questions[0].correct_answer;
        useQuizGameStore.getState().selectAnswer(firstCorrect);

        expect(useQuizGameStore.getState().phase).toBe('feedback');
        expect(useQuizGameStore.getState().isAnswerLocked).toBe(true);
        expect(useQuizGameStore.getState().results.length).toBe(1);
        expect(useQuizGameStore.getState().results[0].isCorrect).toBe(true);
        expect(useQuizGameStore.getState().score).toBeGreaterThan(0);

        const firstScore = useQuizGameStore.getState().score;
        useQuizGameStore.getState().selectAnswer('Z');
        expect(useQuizGameStore.getState().score).toBe(firstScore);

        useQuizGameStore.getState().nextQuestion();
        useQuizGameStore.getState().startQuestion();

        const secondWrong = useQuizGameStore.getState().questions[1].correct_answer === 'A' ? 'B' : 'A';
        useQuizGameStore.getState().selectAnswer(secondWrong);

        expect(useQuizGameStore.getState().results[1].isCorrect).toBe(false);
        expect(useQuizGameStore.getState().streak).toBe(0);

        useQuizGameStore.getState().nextQuestion();
        expect(useQuizGameStore.getState().phase).toBe('results');

        expect(useQuizGameStore.getState().getTotalCorrect()).toBe(1);
        expect(useQuizGameStore.getState().getAccuracy()).toBe(50);
        expect(useQuizGameStore.getState().getMaxPoints()).toBeGreaterThan(0);
    });

    it('counts down and handles timeout path', () => {
        useQuizGameStore.getState().initGame('m1', 'Module 1', questions, 1);

        useQuizGameStore.getState().tickTimer();
        expect(useQuizGameStore.getState().timeRemaining).toBe(1);

        useQuizGameStore.getState().startQuestion();
        useQuizGameStore.getState().tickTimer();

        expect(useQuizGameStore.getState().timeRemaining).toBe(0);
        expect(useQuizGameStore.getState().phase).toBe('feedback');
        expect(useQuizGameStore.getState().results[0].selectedAnswer).toBeNull();

        useQuizGameStore.getState().timeUp();
        expect(useQuizGameStore.getState().results.length).toBe(1);

        useQuizGameStore.getState().showResults();
        expect(useQuizGameStore.getState().phase).toBe('results');

        useQuizGameStore.getState().resetGame();
        expect(useQuizGameStore.getState().moduleId).toBeNull();
        expect(useQuizGameStore.getState().results.length).toBe(0);
        expect(useQuizGameStore.getState().getAccuracy()).toBe(0);
    });

    it('ticks timer without timeout when time remains', () => {
        useQuizGameStore.getState().initGame('m1', 'Module 1', questions, 3);
        useQuizGameStore.getState().startQuestion();

        useQuizGameStore.getState().tickTimer();

        expect(useQuizGameStore.getState().timeRemaining).toBe(2);
        expect(useQuizGameStore.getState().phase).toBe('playing');
        expect(useQuizGameStore.getState().results.length).toBe(0);
    });
});
