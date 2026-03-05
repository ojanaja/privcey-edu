// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ModuleItem = {
    id: string
    title: string
    description?: string | null
    tryout_id: string
    subject?: { name: string } | null
    tryout?: { title: string } | null
}

type QuestionItem = {
    id: string
    difficulty: 'easy' | 'medium' | 'hard'
}

const authState: { user: { id: string } | null } = {
    user: { id: 'u-1' },
}

const quizStoreState = { score: 0 }
const initGameMock = vi.fn()
const resetGameMock = vi.fn()

const moduleResult: { data: ModuleItem[] | null } = { data: [] }
const questionResultByTryout: Record<string, QuestionItem[] | null> = {}

let pendingQuestionPromise: Promise<{ data: QuestionItem[] | null }> | null = null
let resolvePendingQuestion: ((v: { data: QuestionItem[] | null }) => void) | null = null

const fromMock = vi.fn()

const useQuizGameStoreMock = Object.assign(
    () => ({ initGame: initGameMock, resetGame: resetGameMock }),
    { getState: () => quizStoreState },
)

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={className} {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/stores/auth-store', () => ({
    useAuthStore: () => authState,
}))

vi.mock('@/stores/quiz-game-store', () => ({
    useQuizGameStore: useQuizGameStoreMock,
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({ from: fromMock }),
}))

vi.mock('@/components/ui', () => ({
    GlassCard: ({ children, className, onClick }: React.HTMLAttributes<HTMLDivElement>) => (
        <div className={className} onClick={onClick}>{children}</div>
    ),
    Badge: ({ children }: React.HTMLAttributes<HTMLSpanElement>) => <span>{children}</span>,
    LoadingSpinner: ({ className }: { className?: string }) => <div data-testid="loading" className={className}>Loading</div>,
    Button: ({ children, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type="button" onClick={onClick}>{children}</button>
    ),
}))

vi.mock('@/components/quiz-game/quiz-game', () => ({
    QuizGame: ({ onExit, onPlayAgain }: { onExit: () => void; onPlayAgain: () => void }) => (
        <div data-testid="quiz-game">
            <button type="button" onClick={onExit}>Exit Game</button>
            <button type="button" onClick={onPlayAgain}>Play Again</button>
        </div>
    ),
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            strengthensPage: {
                title: 'Strengthens',
                subtitle: 'Subtitle',
                howToPlay: 'How to play',
                howToPlayDesc: 'Play description',
                best: 'Best',
                modulesPlayed: 'modules played',
                noQuizGames: 'No quiz games',
                noQuizGamesDesc: 'No games description',
                preparingQuiz: 'Preparing quiz',
                loadingQuestions: 'Loading questions',
            },
        },
    }),
}))

describe('app/dashboard/strengthens/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = { id: 'u-1' }
        quizStoreState.score = 0
        moduleResult.data = []
        pendingQuestionPromise = null
        resolvePendingQuestion = null
        Object.keys(questionResultByTryout).forEach((key) => delete questionResultByTryout[key])

        fromMock.mockImplementation((table: string) => {
            if (table === 'strengthens_modules') {
                const eqMock = vi.fn(async () => ({ data: moduleResult.data }))
                const selectMock = vi.fn(() => ({ eq: eqMock }))
                return { select: selectMock }
            }

            if (table === 'questions') {
                const orderMock = vi.fn(async () => {
                    if (pendingQuestionPromise) return pendingQuestionPromise
                    return {
                        data: Object.prototype.hasOwnProperty.call(questionResultByTryout, '__active')
                            ? questionResultByTryout.__active
                            : [],
                    }
                })
                const eqMock = vi.fn((_: string, tryoutId: string) => {
                    questionResultByTryout.__active = Object.prototype.hasOwnProperty.call(questionResultByTryout, tryoutId)
                        ? questionResultByTryout[tryoutId]
                        : []
                    return { order: orderMock }
                })
                const selectMock = vi.fn(() => ({ eq: eqMock }))
                return { select: selectMock }
            }

            return { select: vi.fn() }
        })
    })

    afterEach(() => {
        cleanup()
    })

    it('keeps loading when user is null', async () => {
        authState.user = null
        const { default: StrengthensPage } = await import('./page')

        render(<StrengthensPage />)

        expect(screen.getByTestId('loading')).toBeTruthy()
        expect(fromMock).not.toHaveBeenCalled()
    })

    it('renders empty-state when no modules are available', async () => {
        moduleResult.data = []
        const { default: StrengthensPage } = await import('./page')

        render(<StrengthensPage />)

        await waitFor(() => {
            expect(screen.getByText('No quiz games')).toBeTruthy()
            expect(screen.getByText('No games description')).toBeTruthy()
        })
    })

    it('handles null modules payload from API', async () => {
        moduleResult.data = null
        const { default: StrengthensPage } = await import('./page')

        render(<StrengthensPage />)

        await waitFor(() => {
            expect(screen.getByText('No quiz games')).toBeTruthy()
        })
    })

    it('shows loading overlay while questions are loading', async () => {
        moduleResult.data = [
            { id: 'm1', title: 'Module One', tryout_id: 't1', subject: { name: 'Math' }, tryout: { title: 'TO-1' } },
        ]

        pendingQuestionPromise = new Promise((resolve) => {
            resolvePendingQuestion = resolve
        })

        const { default: StrengthensPage } = await import('./page')
        render(<StrengthensPage />)

        await waitFor(() => {
            expect(screen.getByText('Module One')).toBeTruthy()
        })

        fireEvent.click(screen.getByText('Module One'))

        await waitFor(() => {
            expect(screen.getByText('Preparing quiz')).toBeTruthy()
            expect(screen.getByText('Loading questions')).toBeTruthy()
        })

        resolvePendingQuestion?.({ data: [{ id: 'q1', difficulty: 'medium' }] })

        await waitFor(() => {
            expect(screen.getByTestId('quiz-game')).toBeTruthy()
            expect(screen.queryByText('Preparing quiz')).toBeNull()
        })
    })

    it('does not start game when selected module has zero questions', async () => {
        moduleResult.data = [{ id: 'm0', title: 'Module Zero', tryout_id: 't0' }]
        questionResultByTryout.t0 = []

        const { default: StrengthensPage } = await import('./page')
        render(<StrengthensPage />)

        await waitFor(() => expect(screen.getByText('Module Zero')).toBeTruthy())
        fireEvent.click(screen.getByText('Module Zero'))

        await waitFor(() => {
            expect(initGameMock).not.toHaveBeenCalled()
            expect(screen.queryByTestId('quiz-game')).toBeNull()
        })
    })

    it('handles null questions payload as empty questions', async () => {
        moduleResult.data = [{ id: 'mn', title: 'Module Null', tryout_id: 'tn' }]
        questionResultByTryout.tn = null

        const { default: StrengthensPage } = await import('./page')
        render(<StrengthensPage />)

        await waitFor(() => expect(screen.getByText('Module Null')).toBeTruthy())
        fireEvent.click(screen.getByText('Module Null'))

        await waitFor(() => {
            expect(initGameMock).not.toHaveBeenCalled()
            expect(screen.queryByTestId('quiz-game')).toBeNull()
        })
    })

    it('starts game with correct timer for easy/medium/hard difficulties', async () => {
        moduleResult.data = [
            { id: 'm-easy', title: 'Easy Mod', tryout_id: 'te', description: 'Easy description' },
            { id: 'm-med', title: 'Med Mod', tryout_id: 'tm' },
            { id: 'm-hard', title: 'Hard Mod', tryout_id: 'th' },
        ]
        questionResultByTryout.te = [{ id: 'qe', difficulty: 'easy' }]
        questionResultByTryout.tm = [{ id: 'qm', difficulty: 'medium' }]
        questionResultByTryout.th = [{ id: 'qh', difficulty: 'hard' }]

        const { default: StrengthensPage } = await import('./page')

        const view1 = render(<StrengthensPage />)
        await waitFor(() => expect(screen.getByText('Easy Mod')).toBeTruthy())
        expect(screen.getByText('Easy description')).toBeTruthy()
        fireEvent.click(screen.getByText('Easy Mod'))
        await waitFor(() => {
            expect(initGameMock).toHaveBeenCalledWith('m-easy', 'Easy Mod', questionResultByTryout.te, 15)
        })
        view1.unmount()

        const view2 = render(<StrengthensPage />)
        await waitFor(() => expect(screen.getByText('Med Mod')).toBeTruthy())
        fireEvent.click(screen.getByText('Med Mod'))
        await waitFor(() => {
            expect(initGameMock).toHaveBeenCalledWith('m-med', 'Med Mod', questionResultByTryout.tm, 20)
        })
        view2.unmount()

        render(<StrengthensPage />)
        await waitFor(() => expect(screen.getByText('Hard Mod')).toBeTruthy())
        fireEvent.click(screen.getByText('Hard Mod'))
        await waitFor(() => {
            expect(initGameMock).toHaveBeenCalledWith('m-hard', 'Hard Mod', questionResultByTryout.th, 25)
            expect(screen.getByTestId('quiz-game')).toBeTruthy()
        })
    })

    it('handles exit and play-again with highscore updates and cached questions', async () => {
        moduleResult.data = [{ id: 'm1', title: 'Module One', tryout_id: 't1', subject: { name: 'Math' }, tryout: { title: 'TO-1' } }]
        questionResultByTryout.t1 = [{ id: 'q1', difficulty: 'medium' }]

        const { default: StrengthensPage } = await import('./page')
        render(<StrengthensPage />)

        await waitFor(() => expect(screen.getByText('Module One')).toBeTruthy())
        fireEvent.click(screen.getByText('Module One'))

        await waitFor(() => expect(screen.getByTestId('quiz-game')).toBeTruthy())

        quizStoreState.score = 120
        fireEvent.click(screen.getByRole('button', { name: 'Exit Game' }))

        await waitFor(() => {
            expect(resetGameMock).toHaveBeenCalled()
            expect(screen.getByText(/Best 120 pts/)).toBeTruthy()
            expect(screen.getByText(/1 modules played/)).toBeTruthy()
            expect(screen.getByText('120')).toBeTruthy()
        })

        fireEvent.click(screen.getByText('Module One'))
        await waitFor(() => expect(screen.getByTestId('quiz-game')).toBeTruthy())

        quizStoreState.score = 150
        fireEvent.click(screen.getByRole('button', { name: 'Play Again' }))

        await waitFor(() => {
            expect(initGameMock).toHaveBeenCalled()
        })

        fireEvent.click(screen.getByRole('button', { name: 'Exit Game' }))

        await waitFor(() => {
            expect(screen.getByText(/Best 150 pts/)).toBeTruthy()
        })

        const questionCalls = fromMock.mock.calls.filter((c) => c[0] === 'questions')
        expect(questionCalls.length).toBe(1)
    })

    it('play-again with zero score keeps existing highscore', async () => {
        moduleResult.data = [{ id: 'm3', title: 'Module Three', tryout_id: 't3' }]
        questionResultByTryout.t3 = [{ id: 'q3', difficulty: 'medium' }]

        const { default: StrengthensPage } = await import('./page')
        render(<StrengthensPage />)

        await waitFor(() => expect(screen.getByText('Module Three')).toBeTruthy())
        fireEvent.click(screen.getByText('Module Three'))
        await waitFor(() => expect(screen.getByTestId('quiz-game')).toBeTruthy())

        quizStoreState.score = 110
        fireEvent.click(screen.getByRole('button', { name: 'Exit Game' }))
        await waitFor(() => expect(screen.getByText(/Best 110 pts/)).toBeTruthy())

        fireEvent.click(screen.getByText('Module Three'))
        await waitFor(() => expect(screen.getByTestId('quiz-game')).toBeTruthy())
        quizStoreState.score = 0
        fireEvent.click(screen.getByRole('button', { name: 'Play Again' }))
        fireEvent.click(screen.getByRole('button', { name: 'Exit Game' }))

        await waitFor(() => {
            expect(screen.getByText(/Best 110 pts/)).toBeTruthy()
        })
    })

    it('play-again with positive score updates highscore branch', async () => {
        moduleResult.data = [{ id: 'm4', title: 'Module Four', tryout_id: 't4' }]
        questionResultByTryout.t4 = [{ id: 'q4', difficulty: 'medium' }]

        const { default: StrengthensPage } = await import('./page')
        render(<StrengthensPage />)

        await waitFor(() => expect(screen.getByText('Module Four')).toBeTruthy())
        fireEvent.click(screen.getByText('Module Four'))
        await waitFor(() => expect(screen.getByTestId('quiz-game')).toBeTruthy())

        quizStoreState.score = 95
        fireEvent.click(screen.getByRole('button', { name: 'Play Again' }))
        fireEvent.click(screen.getByRole('button', { name: 'Exit Game' }))

        await waitFor(() => {
            expect(screen.getByText(/Best 95 pts/)).toBeTruthy()
        })
    })

    it('exits without highscore update when score is zero', async () => {
        moduleResult.data = [{ id: 'm2', title: 'Module Two', tryout_id: 't2' }]
        questionResultByTryout.t2 = [{ id: 'q2', difficulty: 'easy' }]
        quizStoreState.score = 0

        const { default: StrengthensPage } = await import('./page')
        render(<StrengthensPage />)

        await waitFor(() => expect(screen.getByText('Module Two')).toBeTruthy())
        fireEvent.click(screen.getByText('Module Two'))

        await waitFor(() => expect(screen.getByTestId('quiz-game')).toBeTruthy())
        fireEvent.click(screen.getByRole('button', { name: 'Exit Game' }))

        await waitFor(() => {
            expect(screen.queryByText(/Best/)).toBeNull()
        })
    })
})
