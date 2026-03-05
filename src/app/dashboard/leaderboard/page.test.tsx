// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type LeaderboardRow = {
    student_id: string
    full_name: string
    avg_score: number
    total_attempts: number
    class_name: string | null
}

type FallbackRow = {
    student_id: string
    score: number
    student: { full_name?: string; class?: { name?: string } | null } | null
}

const authState = {
    user: { id: 'me-1' },
}

const leaderboardResult: {
    data: LeaderboardRow[] | null
    error: { message: string } | null
} = {
    data: null,
    error: null,
}

const fallbackResult: {
    data: FallbackRow[] | null
} = {
    data: null,
}

const fromMock = vi.fn()

vi.mock('next/link', () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
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
    GlassCard: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
    LoadingSpinner: ({ className }: { className?: string }) => <div data-testid="loading" className={className}>Loading</div>,
    Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type="button" onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            leaderboardPage: {
                title: 'Leaderboard',
                loadError: 'Load error',
                tryoutCount: 'tryouts',
                you: 'You',
                fullRanking: 'Full Ranking',
                noData: 'No data yet',
                previous: 'Previous',
                page: 'Page',
                next: 'Next',
            },
        },
    }),
}))

describe('app/dashboard/leaderboard/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = { id: 'me-1' }

        const leaderboardRangeMock = vi.fn(async () => ({
            data: leaderboardResult.data,
            error: leaderboardResult.error,
        }))
        const leaderboardSelectMock = vi.fn(() => ({ range: leaderboardRangeMock }))

        const fallbackRangeMock = vi.fn(async () => ({ data: fallbackResult.data }))
        const fallbackNotMock = vi.fn(() => ({ range: fallbackRangeMock }))
        const fallbackEqMock = vi.fn(() => ({ not: fallbackNotMock }))
        const fallbackSelectMock = vi.fn(() => ({ eq: fallbackEqMock }))

        fromMock.mockImplementation((table: string) => {
            if (table === 'leaderboard_view') {
                return { select: leaderboardSelectMock }
            }
            if (table === 'tryout_attempts') {
                return { select: fallbackSelectMock }
            }
            return { select: vi.fn() }
        })
    })

    afterEach(() => {
        cleanup()
    })

    it('renders loading first then leaderboard entries with podium and pagination', async () => {
        leaderboardResult.error = null
        leaderboardResult.data = Array.from({ length: 20 }).map((_, idx) => ({
            student_id: idx === 1 ? 'me-1' : `s-${idx}`,
            full_name: `Student ${idx}`,
            avg_score: idx === 0 ? 90 : idx === 1 ? 65 : idx === 2 ? 40 : 70,
            total_attempts: idx + 1,
            class_name: idx % 2 === 0 ? 'Class A' : null,
        }))
        fallbackResult.data = null

        const { default: LeaderboardPage } = await import('./page')
        render(<LeaderboardPage />)

        expect(screen.getByTestId('loading')).toBeTruthy()

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeTruthy()
            expect(screen.getByText('Full Ranking')).toBeTruthy()
            expect(screen.getByText('Page 1')).toBeTruthy()
            expect(screen.getAllByText('You').length).toBeGreaterThan(0)
        })

        fireEvent.click(screen.getByRole('button', { name: /next/i }))

        await waitFor(() => {
            expect(screen.getByText('Page 2')).toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: /previous/i }))

        await waitFor(() => {
            expect(screen.getByText('Page 1')).toBeTruthy()
        })
    })

    it('uses fallback query when leaderboard view is unavailable', async () => {
        leaderboardResult.error = { message: 'view missing' }
        leaderboardResult.data = null
        fallbackResult.data = [
            {
                student_id: 'f-1',
                score: 80,
                student: { full_name: 'Fallback One', class: { name: 'Class X' } },
            },
            {
                student_id: 'f-1',
                score: 100,
                student: { full_name: 'Fallback One', class: { name: 'Class X' } },
            },
            {
                student_id: 'f-2',
                score: 50,
                student: null,
            },
        ]

        const { default: LeaderboardPage } = await import('./page')
        render(<LeaderboardPage />)

        await waitFor(() => {
            expect(screen.getByText('Fallback One')).toBeTruthy()
            expect(screen.getByText('Unknown')).toBeTruthy()
            expect(screen.queryByText(/page 1/i)).toBeNull()
        })
    })

    it('shows empty state when leaderboard has no entries', async () => {
        leaderboardResult.error = null
        leaderboardResult.data = []
        fallbackResult.data = null

        const { default: LeaderboardPage } = await import('./page')
        render(<LeaderboardPage />)

        await waitFor(() => {
            expect(screen.getByText('No data yet')).toBeTruthy()
        })
    })

    it('handles null data from leaderboard view without crashing', async () => {
        leaderboardResult.error = null
        leaderboardResult.data = null
        fallbackResult.data = null

        const { default: LeaderboardPage } = await import('./page')
        render(<LeaderboardPage />)

        await waitFor(() => {
            expect(screen.getByText('No data yet')).toBeTruthy()
        })
    })

    it('handles fallback query with null result', async () => {
        leaderboardResult.error = { message: 'view missing' }
        leaderboardResult.data = null
        fallbackResult.data = null

        const { default: LeaderboardPage } = await import('./page')
        render(<LeaderboardPage />)

        await waitFor(() => {
            expect(screen.getByText('No data yet')).toBeTruthy()
            expect(screen.getByText('Page 1')).toBeTruthy()
        })
    })

    it('handles sparse podium entry from direct leaderboard data', async () => {
        leaderboardResult.error = null
        const sparseRows = [
            {
                student_id: 's-1',
                full_name: 'Sparse One',
                avg_score: 88,
                total_attempts: 3,
                class_name: 'Class S',
            },
            {
                student_id: 's-2',
                full_name: 'Sparse Two',
                avg_score: 72,
                total_attempts: 2,
                class_name: null,
            },
        ] as LeaderboardRow[]
            ; (sparseRows as unknown[]).length = 3
        leaderboardResult.data = sparseRows
        fallbackResult.data = null

        const { default: LeaderboardPage } = await import('./page')
        render(<LeaderboardPage />)

        await waitFor(() => {
            expect(screen.getAllByText('Sparse One').length).toBeGreaterThan(0)
            expect(screen.queryByText(/page 1/i)).toBeNull()
        })
    })

    it('shows translated error message when fetching throws', async () => {
        const throwingFromMock = vi.fn(() => {
            throw new Error('boom')
        })
        fromMock.mockImplementation(throwingFromMock)

        const { default: LeaderboardPage } = await import('./page')
        render(<LeaderboardPage />)

        await waitFor(() => {
            expect(screen.getByText('Load error')).toBeTruthy()
        })
    })
})
