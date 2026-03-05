// @vitest-environment jsdom

import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const soundsMock = {
    countdownGo: vi.fn(),
    countdownTick: vi.fn(),
    timeWarning: vi.fn(),
    timeUp: vi.fn(),
    newQuestion: vi.fn(),
    optionSelect: vi.fn(),
    correct: vi.fn(),
    incorrect: vi.fn(),
    streak: vi.fn(),
    masterRank: vi.fn(),
    gameComplete: vi.fn(),
}

const startCountdownMock = vi.fn()
const startQuestionMock = vi.fn()
const tickTimerMock = vi.fn()
const selectAnswerMock = vi.fn()
const nextQuestionMock = vi.fn()
const getTotalCorrectMock = vi.fn()
const getAccuracyMock = vi.fn()
const getMaxPointsMock = vi.fn()

type QuizState = {
    moduleId: string | null
    moduleTitle: string
    questions: Array<Record<string, unknown>>
    timePerQuestion: number
    phase: 'lobby' | 'countdown' | 'playing' | 'feedback' | 'results'
    currentIndex: number
    timeRemaining: number
    score: number
    streak: number
    bestStreak: number
    results: Array<Record<string, unknown>>
    selectedAnswer: string | null
    isAnswerLocked: boolean
}

const state: QuizState = {
    moduleId: 'm-1',
    moduleTitle: 'Module A',
    questions: [],
    timePerQuestion: 20,
    phase: 'lobby',
    currentIndex: 0,
    timeRemaining: 20,
    score: 0,
    streak: 0,
    bestStreak: 0,
    results: [],
    selectedAnswer: null,
    isAnswerLocked: false,
}

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/stores/quiz-game-store', () => ({
    useQuizGameStore: () => ({
        ...state,
        initGame: vi.fn(),
        startCountdown: startCountdownMock,
        startQuestion: startQuestionMock,
        selectAnswer: selectAnswerMock,
        tickTimer: tickTimerMock,
        timeUp: vi.fn(),
        nextQuestion: nextQuestionMock,
        showResults: vi.fn(),
        resetGame: vi.fn(),
        getTotalCorrect: getTotalCorrectMock,
        getAccuracy: getAccuracyMock,
        getMaxPoints: getMaxPointsMock,
    }),
}))

vi.mock('@/components/ui', () => ({
    GlassCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            quizGame: {
                go: 'Go!',
                streak: 'Streak',
                correctFeedback: 'Correct!',
                incorrectFeedback: 'Incorrect!',
                correctAnswerIs: 'Correct answer is',
                explanationLabel: 'Explanation',
                continueButton: 'Continue',
                rankMaster: 'Master',
                rankGreat: 'Great',
                rankGood: 'Good',
                rankKeepGoing: 'Keep Going',
                totalScore: 'Total Score',
                accuracy: 'Accuracy',
                correctLabel: 'Correct',
                bestStreak: 'Best Streak',
                avgTime: 'Avg Time',
                reviewAnswers: 'Review Answers',
                correctTooltip: 'Correct',
                unansweredTooltip: 'Unanswered',
                incorrectTooltip: 'Incorrect',
                playAgain: 'Play Again',
                backButton: 'Back',
            },
        },
    }),
}))

vi.mock('@/lib/sounds', () => ({
    sounds: soundsMock,
}))

function makeQuestion(overrides?: Partial<Record<string, unknown>>) {
    return {
        id: 'q-1',
        question_text: 'Question text',
        question_image_url: 'https://img.test/q.png',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        option_e: 'Option E',
        correct_answer: 'B',
        explanation: 'Because B is correct',
        ...overrides,
    }
}

describe('components/quiz-game/QuizGame', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.moduleId = 'm-1'
        state.moduleTitle = 'Module A'
        state.questions = [makeQuestion(), makeQuestion({ id: 'q-2', question_text: 'Second question', question_image_url: null, option_e: null, explanation: null })]
        state.timePerQuestion = 20
        state.phase = 'lobby'
        state.currentIndex = 0
        state.timeRemaining = 20
        state.score = 1200
        state.streak = 0
        state.bestStreak = 3
        state.results = []
        state.selectedAnswer = null
        state.isAnswerLocked = false

        getTotalCorrectMock.mockReturnValue(1)
        getAccuracyMock.mockReturnValue(80)
        getMaxPointsMock.mockReturnValue(3000)
    })

    afterEach(() => {
        cleanup()
        vi.useRealTimers()
    })

    it('starts countdown automatically when phase is lobby', async () => {
        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        expect(startCountdownMock).toHaveBeenCalledTimes(1)
    })

    it('runs countdown overlay and starts question when completed', async () => {
        state.phase = 'countdown'

        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        expect(screen.getByText('3')).toBeTruthy()
        await waitFor(() => {
            expect(startQuestionMock).toHaveBeenCalledTimes(1)
        }, { timeout: 4000 })
        expect(soundsMock.countdownTick).toHaveBeenCalled()
        expect(soundsMock.countdownGo).toHaveBeenCalledTimes(1)
    })

    it('renders playing question and handles option selection, warning sounds and timer tick', async () => {
        vi.useFakeTimers()
        state.phase = 'playing'
        state.currentIndex = 0
        state.selectedAnswer = 'A'
        state.streak = 3
        state.timeRemaining = 6
        state.isAnswerLocked = false

        const { QuizGame } = await import('./quiz-game')

        const { rerender } = render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        expect(screen.getByText('Question text')).toBeTruthy()
        expect(screen.getByText('Option E')).toBeTruthy()
        expect(screen.getByText('3x Streak')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: /Option B/i }))
        expect(soundsMock.optionSelect).toHaveBeenCalledTimes(1)
        expect(selectAnswerMock).toHaveBeenCalledWith('B')

        vi.advanceTimersByTime(1000)
        expect(tickTimerMock).toHaveBeenCalledTimes(1)

        state.timeRemaining = 4
        rerender(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)
        expect(soundsMock.timeWarning).toHaveBeenCalled()

        state.timeRemaining = 0
        rerender(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)
        expect(soundsMock.timeUp).toHaveBeenCalledTimes(1)

        state.currentIndex = 1
        state.questions[1] = makeQuestion({ id: 'q-2', question_text: 'Second question', option_e: null, question_image_url: null })
        rerender(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)
        expect(screen.queryByText('Option E')).toBeNull()
        expect(soundsMock.newQuestion).toHaveBeenCalled()
    })

    it('covers playing state branches for low streak and locked answers', async () => {
        state.phase = 'playing'
        state.currentIndex = 0
        state.streak = 1
        state.timeRemaining = 18
        state.isAnswerLocked = true

        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        expect(screen.queryByText(/x Streak/i)).toBeNull()
        const optionButton = screen.getByRole('button', { name: /Option A/i }) as HTMLButtonElement
        expect(optionButton.disabled).toBe(true)
        fireEvent.click(optionButton)
        expect(selectAnswerMock).toHaveBeenCalledTimes(0)
    })

    it('renders feedback screen for correct answer and advances automatically', async () => {
        vi.useFakeTimers()
        state.phase = 'feedback'
        state.streak = 3
        state.currentIndex = 0
        state.results = [
            {
                questionId: 'q-1',
                selectedAnswer: 'B',
                correctAnswer: 'B',
                isCorrect: true,
                timeSpent: 5,
                points: 1300,
            },
        ]

        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        expect(screen.getByText('Correct!')).toBeTruthy()
        expect(screen.getByText('+1300')).toBeTruthy()
        expect(screen.getByText('Because B is correct')).toBeTruthy()
        expect(screen.getByText('3x Streak 🔥')).toBeTruthy()

        act(() => {
            vi.advanceTimersByTime(3200)
        })
        expect(nextQuestionMock).toHaveBeenCalled()
        expect(soundsMock.correct).toHaveBeenCalledTimes(1)
        expect(soundsMock.streak).toHaveBeenCalledTimes(1)
    })

    it('handles correct feedback without streak bonus branch', async () => {
        vi.useFakeTimers()
        state.phase = 'feedback'
        state.streak = 1
        state.currentIndex = 0
        state.results = [
            {
                questionId: 'q-1',
                selectedAnswer: 'B',
                correctAnswer: 'B',
                isCorrect: true,
                timeSpent: 7,
                points: 900,
            },
        ]

        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        act(() => {
            vi.advanceTimersByTime(3200)
        })

        expect(soundsMock.correct).toHaveBeenCalled()
        expect(soundsMock.streak).toHaveBeenCalledTimes(0)
    })

    it('renders feedback screen for incorrect answer with correct option text', async () => {
        state.phase = 'feedback'
        state.streak = 0
        state.currentIndex = 0
        state.results = [
            {
                questionId: 'q-1',
                selectedAnswer: null,
                correctAnswer: 'B',
                isCorrect: false,
                timeSpent: 20,
                points: 0,
            },
        ]

        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        expect(screen.getByText('Incorrect!')).toBeTruthy()
        expect(screen.getByText('B. Option B')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: /continue/i }))
        expect(nextQuestionMock).toHaveBeenCalled()
        expect(soundsMock.incorrect).toHaveBeenCalledTimes(1)
    })

    it('handles feedback when current question is missing', async () => {
        state.phase = 'feedback'
        state.currentIndex = 99
        state.results = [
            {
                questionId: 'q-x',
                selectedAnswer: 'A',
                correctAnswer: 'B',
                isCorrect: false,
                timeSpent: 20,
                points: 0,
            },
        ]

        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        expect(screen.getByText('Incorrect!')).toBeTruthy()
        expect(screen.getByText(/^B\.\s*$/)).toBeTruthy()
    })

    it('handles feedback fallback when answer key is E but option_e is empty', async () => {
        state.phase = 'feedback'
        state.currentIndex = 1
        state.results = [
            {
                questionId: 'q-2',
                selectedAnswer: 'A',
                correctAnswer: 'E',
                isCorrect: false,
                timeSpent: 20,
                points: 0,
            },
        ]

        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)

        expect(screen.getByText('Incorrect!')).toBeTruthy()
        expect(screen.getByText(/^E\.\s*$/)).toBeTruthy()
    })

    it('renders results with master rank and review states then triggers actions', async () => {
        state.phase = 'results'
        state.results = [
            { isCorrect: true, selectedAnswer: 'A', timeSpent: 2, points: 1000 },
            { isCorrect: false, selectedAnswer: null, timeSpent: 20, points: 0 },
            { isCorrect: false, selectedAnswer: 'A', timeSpent: 8, points: 0 },
        ]
        state.bestStreak = 4
        state.score = 2600
        getAccuracyMock.mockReturnValue(95)
        getTotalCorrectMock.mockReturnValue(1)

        const onExit = vi.fn()
        const onPlayAgain = vi.fn()
        const { QuizGame } = await import('./quiz-game')

        render(<QuizGame onExit={onExit} onPlayAgain={onPlayAgain} />)

        expect(screen.getByText('Master')).toBeTruthy()
        expect(screen.getByText('2,600')).toBeTruthy()
        expect(screen.getByText('95%')).toBeTruthy()
        expect(screen.getByText('1/2')).toBeTruthy()
        expect(screen.getByText('4x')).toBeTruthy()
        expect(screen.getByText('10.0s')).toBeTruthy()

        expect(soundsMock.masterRank).toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByRole('button', { name: /play again/i }))
        fireEvent.click(screen.getByRole('button', { name: /^back$/i }))
        expect(onPlayAgain).toHaveBeenCalledTimes(1)
        expect(onExit).toHaveBeenCalledTimes(1)
    })

    it('covers remaining rank branches and empty average time in results', async () => {
        const onExit = vi.fn()
        const onPlayAgain = vi.fn()
        const { QuizGame } = await import('./quiz-game')

        state.phase = 'results'
        state.results = []

        getAccuracyMock.mockReturnValue(75)
        let { rerender } = render(<QuizGame onExit={onExit} onPlayAgain={onPlayAgain} />)
        expect(screen.getByText('Great')).toBeTruthy()
        expect(screen.getByText('0s')).toBeTruthy()
        expect(soundsMock.gameComplete).toHaveBeenCalled()

        getAccuracyMock.mockReturnValue(55)
        rerender(<QuizGame onExit={onExit} onPlayAgain={onPlayAgain} />)
        expect(screen.getByText('Good')).toBeTruthy()

        getAccuracyMock.mockReturnValue(30)
        rerender(<QuizGame onExit={onExit} onPlayAgain={onPlayAgain} />)
        expect(screen.getByText('Keep Going')).toBeTruthy()
    })

    it('cleans timer in non-playing cleanup path after phase transition', async () => {
        vi.useFakeTimers()
        state.phase = 'playing'

        const { QuizGame } = await import('./quiz-game')

        const { rerender, unmount } = render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)
        act(() => {
            vi.advanceTimersByTime(1000)
        })

        state.phase = 'results'
        rerender(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)
        unmount()
    })

    it('handles playing cleanup branch when interval handle is null', async () => {
        const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockReturnValue(null as unknown as ReturnType<typeof setInterval>)
        state.phase = 'playing'

        const { QuizGame } = await import('./quiz-game')

        const { unmount } = render(<QuizGame onExit={vi.fn()} onPlayAgain={vi.fn()} />)
        unmount()

        setIntervalSpy.mockRestore()
    })
})
