// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type TutorUser = {
    id: string
    full_name: string
}

type TryoutRow = { id: string }

type AttemptRow = {
    id: string
    score: number | null
    student?: { full_name?: string | null; email?: string | null } | null
    tryout?: { title?: string | null; passing_grade?: number | null } | null
}

const authState: { user: TutorUser | null } = {
    user: { id: 'tutor-1', full_name: 'Tutor Prime' },
}

const mockData = {
    tryouts: [] as TryoutRow[] | null,
    attempts: [] as AttemptRow[] | null,
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
            tutorScores: {
                title: 'Tutor Scores',
                subtitle: 'attempts',
                searchPlaceholder: 'Search attempts',
                passed: 'Passed',
                failed: 'Failed',
                noData: 'No score data',
            },
            common: {
                student: 'Student',
                score: 'Score',
                status: 'Status',
            },
        },
    }),
}))

vi.mock('@/components/ui', () => ({
    LoadingSpinner: ({ className }: { className?: string }) => <div data-testid="loading-spinner" className={className}>Loading</div>,
    Badge: ({ children, variant }: { children: React.ReactNode; variant: string }) => (
        <span data-testid={`badge-${variant}`}>{children}</span>
    ),
}))

describe('app/dashboard/tutor/scores/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = { id: 'tutor-1', full_name: 'Tutor Prime' }
        mockData.tryouts = []
        mockData.attempts = []

        fromMock.mockImplementation((table: string) => {
            if (table === 'tryouts') {
                const eqMock = vi.fn(async () => ({ data: mockData.tryouts }))
                const selectMock = vi.fn(() => ({ eq: eqMock }))
                return { select: selectMock }
            }

            if (table === 'tryout_attempts') {
                const orderMock = vi.fn(async () => ({ data: mockData.attempts }))
                const eqMock = vi.fn(() => ({ order: orderMock }))
                const inMock = vi.fn(() => ({ eq: eqMock }))
                const selectMock = vi.fn(() => ({ in: inMock }))
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
        const { default: TutorScoresPage } = await import('./page')

        render(<TutorScoresPage />)

        expect(screen.getByTestId('loading-spinner')).toBeTruthy()
        expect(fromMock).not.toHaveBeenCalled()
    })

    it('renders empty state when tutor has no tryouts and skips attempts query', async () => {
        mockData.tryouts = []
        const { default: TutorScoresPage } = await import('./page')

        render(<TutorScoresPage />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('Tutor Scores')).toBeTruthy()
        expect(screen.getByText('0 attempts')).toBeTruthy()
        expect(screen.getByText('No score data')).toBeTruthy()

        const calledTables = fromMock.mock.calls.map((call) => call[0])
        expect(calledTables).toEqual(['tryouts'])
    })

    it('renders fallback empty state when tryouts payload is null', async () => {
        mockData.tryouts = null
        const { default: TutorScoresPage } = await import('./page')

        render(<TutorScoresPage />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('0 attempts')).toBeTruthy()
        expect(screen.getByText('No score data')).toBeTruthy()
    })

    it('renders passed and failed attempts with score and fallback branches', async () => {
        mockData.tryouts = [{ id: 'to-1' }]
        mockData.attempts = [
            { id: 'a-1', score: 85, student: { full_name: 'Alice' }, tryout: { title: 'Math A', passing_grade: 80 } },
            { id: 'a-2', score: null, student: { full_name: 'Bob' }, tryout: { title: 'Math B', passing_grade: null } },
        ]

        const { default: TutorScoresPage } = await import('./page')
        render(<TutorScoresPage />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('2 attempts')).toBeTruthy()
        expect(screen.getByText('Alice')).toBeTruthy()
        expect(screen.getByText('Math A')).toBeTruthy()
        expect(screen.getByText('85')).toBeTruthy()
        expect(screen.getByText('Passed')).toBeTruthy()

        expect(screen.getByText('Bob')).toBeTruthy()
        expect(screen.getByText('Math B')).toBeTruthy()
        expect(screen.getByText('-')).toBeTruthy()
        expect(screen.getByText('Failed')).toBeTruthy()

        expect(screen.getByTestId('badge-success')).toBeTruthy()
        expect(screen.getByTestId('badge-danger')).toBeTruthy()
    })

    it('filters attempts by student or tryout title and shows empty state for unmatched search', async () => {
        mockData.tryouts = [{ id: 'to-1' }]
        mockData.attempts = [
            { id: 'a-1', score: 90, student: { full_name: 'Alice' }, tryout: { title: 'Physics' } },
            { id: 'a-2', score: 70, student: { full_name: 'Budi' }, tryout: { title: 'Chemistry' } },
        ]

        const { default: TutorScoresPage } = await import('./page')
        render(<TutorScoresPage />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        const input = screen.getByPlaceholderText('Search attempts') as HTMLInputElement

        fireEvent.change(input, { target: { value: 'alice' } })
        expect(screen.getByText('Alice')).toBeTruthy()
        expect(screen.queryByText('Budi')).toBeNull()

        fireEvent.change(input, { target: { value: 'chem' } })
        expect(screen.getByText('Budi')).toBeTruthy()
        expect(screen.queryByText('Alice')).toBeNull()

        fireEvent.change(input, { target: { value: 'zzz' } })
        expect(screen.getByText('No score data')).toBeTruthy()
    })

    it('keeps empty attempts when attempts payload is null', async () => {
        mockData.tryouts = [{ id: 'to-1' }]
        mockData.attempts = null

        const { default: TutorScoresPage } = await import('./page')
        render(<TutorScoresPage />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).toBeNull()
        })

        expect(screen.getByText('0 attempts')).toBeTruthy()
        expect(screen.getByText('No score data')).toBeTruthy()
    })
})
