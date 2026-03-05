// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type TutorUser = {
    id: string
    full_name: string
}

type TryoutRow = { id: string }
type RecentAttemptRow = {
    id: string
    score: number | null
    student?: { full_name?: string | null } | null
    tryout?: { title?: string | null } | null
}

const authState: { user: TutorUser | null } = {
    user: { id: 'tutor-1', full_name: 'Tutor Prime' },
}

const mockData = {
    tryouts: [] as TryoutRow[] | null,
    attemptCount: 0 as number | null,
    questionCount: 0 as number | null,
    recent: [] as RecentAttemptRow[] | null,
}

const fromMock = vi.fn()

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}))

vi.mock('@/stores/auth-store', () => ({
    useAuthStore: () => authState,
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({ from: fromMock }),
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            tutorDashboard: {
                hello: 'Hello',
                subtitle: 'Tutor subtitle',
                myTryouts: 'My Tryouts',
                totalAttempts: 'Total Attempts',
                questionBank: 'Question Bank',
                recentAttempts: 'Recent Attempts',
                noAttempts: 'No attempts yet',
            },
            common: {
                student: 'Student',
                score: 'Score',
            },
        },
    }),
}))

vi.mock('@/components/ui', () => ({
    LoadingSpinner: ({ className }: { className?: string }) => <div data-testid="loading-spinner" className={className}>Loading</div>,
    StatCard: ({ label, value }: { label: string; value: number }) => (
        <div data-testid="stat-card">{label}: {value}</div>
    ),
}))

describe('app/dashboard/tutor/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = { id: 'tutor-1', full_name: 'Tutor Prime' }
        mockData.tryouts = []
        mockData.attemptCount = 0
        mockData.questionCount = 0
        mockData.recent = []

        fromMock.mockImplementation((table: string) => {
            if (table === 'tryouts') {
                const eqMock = vi.fn(async () => ({ data: mockData.tryouts }))
                const selectMock = vi.fn(() => ({ eq: eqMock }))
                return { select: selectMock }
            }

            if (table === 'tryout_attempts') {
                const selectMock = vi.fn((_: string, options?: { count?: 'exact'; head?: boolean }) => {
                    if (options?.count === 'exact' && options?.head) {
                        const inMock = vi.fn(async () => ({ count: mockData.attemptCount }))
                        return { in: inMock }
                    }

                    const limitMock = vi.fn(async () => ({ data: mockData.recent }))
                    const orderMock = vi.fn(() => ({ limit: limitMock }))
                    const eqMock = vi.fn(() => ({ order: orderMock }))
                    const inMock = vi.fn(() => ({ eq: eqMock }))
                    return { in: inMock }
                })

                return { select: selectMock }
            }

            if (table === 'questions') {
                const selectMock = vi.fn((_: string, options?: { count?: 'exact'; head?: boolean }) => {
                    if (options?.count === 'exact' && options?.head) {
                        const inMock = vi.fn(async () => ({ count: mockData.questionCount }))
                        return { in: inMock }
                    }
                    return { in: vi.fn() }
                })
                return { select: selectMock }
            }

            return { select: vi.fn() }
        })
    })

    afterEach(() => {
        cleanup()
    })

    it('keeps loading state when user is null', async () => {
        authState.user = null
        const { default: TutorDashboard } = await import('./page')

        render(<TutorDashboard />)

        expect(screen.getByTestId('loading-spinner')).toBeTruthy()
        expect(fromMock).not.toHaveBeenCalled()
    })

    it('renders zero stats and empty attempts when tutor has no tryouts', async () => {
        mockData.tryouts = []
        const { default: TutorDashboard } = await import('./page')

        render(<TutorDashboard />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('Hello, Tutor 👋')).toBeTruthy()
        expect(screen.getByText('My Tryouts: 0')).toBeTruthy()
        expect(screen.getByText('Total Attempts: 0')).toBeTruthy()
        expect(screen.getByText('Question Bank: 0')).toBeTruthy()
        expect(screen.getByText('No attempts yet')).toBeTruthy()

        const calledTables = fromMock.mock.calls.map((call) => call[0])
        expect(calledTables).toEqual(['tryouts'])
    })

    it('falls back to empty tryout ids when tryouts payload is null', async () => {
        mockData.tryouts = null
        const { default: TutorDashboard } = await import('./page')

        render(<TutorDashboard />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('My Tryouts: 0')).toBeTruthy()
        expect(screen.getByText('Total Attempts: 0')).toBeTruthy()
        expect(screen.getByText('Question Bank: 0')).toBeTruthy()
        expect(screen.getByText('No attempts yet')).toBeTruthy()
    })

    it('renders stats and recent attempts when tryouts exist', async () => {
        mockData.tryouts = [{ id: 'to-1' }, { id: 'to-2' }]
        mockData.attemptCount = 7
        mockData.questionCount = 24
        mockData.recent = [
            { id: 'a-1', score: 88, student: { full_name: 'Alice' }, tryout: { title: 'Tryout Alpha' } },
            { id: 'a-2', score: null, student: { full_name: 'Bob' }, tryout: { title: 'Tryout Beta' } },
        ]

        const { default: TutorDashboard } = await import('./page')
        const { container } = render(<TutorDashboard />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('My Tryouts: 2')).toBeTruthy()
        expect(screen.getByText('Total Attempts: 7')).toBeTruthy()
        expect(screen.getByText('Question Bank: 24')).toBeTruthy()
        expect(screen.getByText('Alice')).toBeTruthy()
        expect(screen.getByText('Tryout Alpha')).toBeTruthy()
        expect(screen.getByText('88')).toBeTruthy()
        expect(screen.getByText('Bob')).toBeTruthy()
        expect(screen.getByText('Tryout Beta')).toBeTruthy()
        expect(screen.getByText('-')).toBeTruthy()

        expect(container.querySelector('.text-green-400')).toBeTruthy()
        expect(container.querySelector('.text-red-400')).toBeTruthy()
    })

    it('keeps empty-state when recent attempts payload is null', async () => {
        mockData.tryouts = [{ id: 'to-1' }]
        mockData.attemptCount = 3
        mockData.questionCount = 12
        mockData.recent = null

        const { default: TutorDashboard } = await import('./page')
        render(<TutorDashboard />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('My Tryouts: 1')).toBeTruthy()
        expect(screen.getByText('Total Attempts: 3')).toBeTruthy()
        expect(screen.getByText('Question Bank: 12')).toBeTruthy()
        expect(screen.getByText('No attempts yet')).toBeTruthy()
    })

    it('falls back counts to zero when count payload is null', async () => {
        mockData.tryouts = [{ id: 'to-1' }]
        mockData.attemptCount = null
        mockData.questionCount = null
        mockData.recent = []

        const { default: TutorDashboard } = await import('./page')
        render(<TutorDashboard />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('My Tryouts: 1')).toBeTruthy()
        expect(screen.getByText('Total Attempts: 0')).toBeTruthy()
        expect(screen.getByText('Question Bank: 0')).toBeTruthy()
    })
})
