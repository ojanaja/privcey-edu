// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Attempt = {
    id: string
    score?: number | null
    total_correct: number
    total_wrong: number
    total_unanswered: number
    finished_at?: string | null
    tryout?: { title?: string; subject?: { name?: string } }
}

const authState: { user: { id: string } | null } = {
    user: { id: 'student-1' },
}

const queryState: {
    data: Attempt[] | null
    error: unknown
    count: number | null
} = {
    data: null,
    error: null,
    count: 0,
}

const fromMock = vi.fn()
const rangeMock = vi.fn(async () => ({
    data: queryState.data,
    error: queryState.error,
    count: queryState.count,
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
    },
}))

vi.mock('@/stores/auth-store', () => ({
    useAuthStore: () => authState,
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: fromMock,
    }),
}))

vi.mock('@/components/ui', () => ({
    GlassCard: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
    Badge: ({ children }: React.HTMLAttributes<HTMLSpanElement>) => <span>{children}</span>,
    LoadingSpinner: ({ className }: { className?: string }) => <div data-testid="loading" className={className}>Loading</div>,
    ScoreRing: ({ score }: { score: number }) => <div data-testid="score-ring">score:{score}</div>,
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            scoresPage: {
                title: 'Scores',
                avgLabel: 'Average',
                bestLabel: 'Best',
                totalLabel: 'Total',
                trendLabel: 'Trend',
                trendline: 'Trendline',
                scoreHistory: 'Score History',
                tryoutColumn: 'Tryout',
                subjectColumn: 'Subject',
                correctColumn: 'Correct',
                wrongColumn: 'Wrong',
                emptyColumn: 'Empty',
                scoreColumn: 'Score',
                dateColumn: 'Date',
                noHistory: 'No history yet',
            },
        },
    }),
}))

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive">{children}</div>,
    AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div data-testid="area" />,
    CartesianGrid: () => <div data-testid="grid" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    Tooltip: () => <div data-testid="tooltip" />,
    LineChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
}))

describe('app/dashboard/scores/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = { id: 'student-1' }
        queryState.data = null
        queryState.error = null
        queryState.count = 0

        const orderMock = vi.fn(() => ({ range: rangeMock }))
        const eqSubmittedMock = vi.fn(() => ({ order: orderMock }))
        const eqStudentMock = vi.fn(() => ({ eq: eqSubmittedMock }))
        const selectMock = vi.fn(() => ({ eq: eqStudentMock }))

        fromMock.mockImplementation((table: string) => {
            if (table === 'tryout_attempts') {
                return { select: selectMock }
            }
            return { select: vi.fn() }
        })
    })

    afterEach(() => {
        cleanup()
    })

    it('keeps loading when user is missing', async () => {
        authState.user = null
        const { default: ScoresPage } = await import('./page')

        render(<ScoresPage />)

        expect(screen.getByTestId('loading')).toBeTruthy()
        expect(fromMock).not.toHaveBeenCalled()
    })

    it('shows error state when query returns error', async () => {
        queryState.error = { message: 'fail' }
        queryState.data = []
        queryState.count = 0

        const { default: ScoresPage } = await import('./page')
        render(<ScoresPage />)

        await waitFor(() => {
            expect(screen.getByText('Gagal memuat data skor. Silakan refresh halaman.')).toBeTruthy()
        })
    })

    it('renders scores, trendline, table and paginates', async () => {
        queryState.data = [
            {
                id: 'a1',
                score: 60,
                total_correct: 30,
                total_wrong: 10,
                total_unanswered: 0,
                finished_at: '2026-01-01T00:00:00.000Z',
                tryout: { title: 'Tryout A', subject: { name: 'Math' } },
            },
            {
                id: 'a2',
                score: 80,
                total_correct: 35,
                total_wrong: 5,
                total_unanswered: 0,
                finished_at: null,
                tryout: { title: 'Tryout B', subject: { name: 'Science' } },
            },
        ]
        queryState.error = null
        queryState.count = 21

        const { default: ScoresPage } = await import('./page')
        render(<ScoresPage />)

        await waitFor(() => {
            expect(screen.getByText('Scores')).toBeTruthy()
            expect(screen.getByText('Score History')).toBeTruthy()
            expect(screen.getByTestId('area-chart')).toBeTruthy()
            expect(screen.getByText('+20')).toBeTruthy()
            expect(screen.getByText('Tryout A')).toBeTruthy()
            expect(screen.getByText('Tryout B')).toBeTruthy()
        })

        expect(rangeMock).toHaveBeenCalledWith(0, 19)
        expect(screen.getByText('1–20 dari 21')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: /next/i }))

        await waitFor(() => {
            expect(rangeMock).toHaveBeenCalledWith(20, 39)
            expect(screen.getByText('21–21 dari 21')).toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: /prev/i }))

        await waitFor(() => {
            expect(screen.getByText('1–20 dari 21')).toBeTruthy()
        })
    })

    it('renders no-history state and negative trend branch', async () => {
        queryState.data = [
            {
                id: 'n1',
                score: 90,
                total_correct: 45,
                total_wrong: 5,
                total_unanswered: 0,
                finished_at: '2026-01-01T00:00:00.000Z',
                tryout: { title: 'Tryout X', subject: { name: 'History' } },
            },
            {
                id: 'n2',
                score: 70,
                total_correct: 35,
                total_wrong: 15,
                total_unanswered: 0,
                finished_at: '2026-01-02T00:00:00.000Z',
                tryout: { title: 'Tryout Y', subject: { name: 'History' } },
            },
        ]
        queryState.error = null
        queryState.count = null

        const { default: ScoresPage } = await import('./page')
        render(<ScoresPage />)

        await waitFor(() => {
            expect(screen.getByText('-20')).toBeTruthy()
            expect(screen.queryByText(/dari/i)).toBeNull()
        })
    })

    it('renders empty attempt state without chart', async () => {
        queryState.data = []
        queryState.error = null
        queryState.count = 0

        const { default: ScoresPage } = await import('./page')
        render(<ScoresPage />)

        await waitFor(() => {
            expect(screen.getByText('No history yet')).toBeTruthy()
            expect(screen.queryByTestId('area-chart')).toBeNull()
        })
    })

    it('handles null data payload by keeping attempts empty', async () => {
        queryState.data = null
        queryState.error = null
        queryState.count = 0

        const { default: ScoresPage } = await import('./page')
        render(<ScoresPage />)

        await waitFor(() => {
            expect(screen.getByText('No history yet')).toBeTruthy()
            expect(screen.queryByTestId('area-chart')).toBeNull()
        })
    })

    it('handles optional attempt fields with fallback values', async () => {
        queryState.data = [
            {
                id: 'f1',
                total_correct: 0,
                total_wrong: 1,
                total_unanswered: 2,
                finished_at: null,
                tryout: {},
            },
            {
                id: 'f2',
                score: 50,
                total_correct: 20,
                total_wrong: 20,
                total_unanswered: 0,
                finished_at: '2026-01-03T00:00:00.000Z',
                tryout: { title: 'Tryout C', subject: { name: 'Geo' } },
            },
        ]
        queryState.error = null
        queryState.count = 2

        const { default: ScoresPage } = await import('./page')
        render(<ScoresPage />)

        await waitFor(() => {
            expect(screen.getByText('Tryout C')).toBeTruthy()
            expect(screen.getAllByText('0').length).toBeGreaterThan(0)
            expect(screen.getByText('-')).toBeTruthy()
        })
    })
})
