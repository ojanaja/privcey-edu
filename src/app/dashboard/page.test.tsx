// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type UserState = {
    id: string
    full_name: string
    class_id: string | null
    payment_status: 'active' | 'expired' | 'pending'
}

type ProfileStreak = {
    streak_count: number | null
    last_activity_at: string | null
} | null

type AttemptItem = {
    id: string
    score?: number | null
    total_correct: number
    total_wrong: number
    total_unanswered: number
    tryout?: {
        title?: string
        subject?: { name?: string; icon?: string | null } | null
    } | null
}

const authState: { user: UserState | null } = {
    user: {
        id: 'student-1',
        full_name: 'John Student',
        class_id: 'class-1',
        payment_status: 'active',
    },
}

const queryState = {
    profile: { data: null as ProfileStreak },
    announcements: { data: [] as Array<Record<string, unknown>> | null },
    attempts: { data: [] as AttemptItem[] | null },
    tryouts: { data: [] as Array<Record<string, unknown>> | null },
    allAttemptScores: { data: [] as Array<{ score: number | null }> | null },
    subjects: { count: 0 as number | null },
    throwOnAnnouncements: false,
}

const fromMock = vi.fn()
const profileUpdateMock = vi.fn()
const profileUpdateEqMock = vi.fn()

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
    createClient: () => ({ from: fromMock }),
}))

vi.mock('@/components/ui', () => ({
    GlassCard: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
    StatCard: ({ label, value }: { label: string; value: number | string }) => <div>{label}: {value}</div>,
    Badge: ({ children }: React.HTMLAttributes<HTMLSpanElement>) => <span>{children}</span>,
    ScoreRing: ({ score }: { score: number }) => <div data-testid="score-ring">ScoreRing:{score}</div>,
}))

vi.mock('@/components/ui/announcement-banner', () => ({
    AnnouncementBanner: ({ announcements }: { announcements: unknown[] }) => (
        <div data-testid="announcement-banner">Announcements:{announcements.length}</div>
    ),
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            common: { loading: 'Loading', minutes: 'minutes' },
            payment: {
                dashboardBanner: 'Payment Required Banner',
                dashboardBannerDesc: 'Please renew now',
                payNow: 'Pay now',
            },
            studentDashboard: {
                welcome: 'Welcome',
                accountActive: 'Account active',
                renewPayment: 'Please renew',
                totalTryout: 'Total Tryout',
                avgScore: 'Average Score',
                bestScore: 'Best Score',
                streakLabel: 'Study Streak',
                streakDays: 'Days',
                recentScores: 'Recent Scores',
                viewAll: 'View all',
                noScoresYet: 'No scores yet',
                avgPerformance: 'Average Performance',
                excellent: 'Excellent',
                good: 'Good',
                keepLearning: 'Keep Learning',
                upcomingTryouts: 'Upcoming Tryouts',
                noSchedule: 'No schedule',
                quickActions: 'Quick Actions',
                doTryout: 'Do Tryout',
                dailyExercise: 'Daily Exercise',
            },
        },
    }),
}))

describe('app/dashboard/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = {
            id: 'student-1',
            full_name: 'John Student',
            class_id: 'class-1',
            payment_status: 'active',
        }

        queryState.profile.data = {
            streak_count: 3,
            last_activity_at: new Date().toISOString(),
        }
        queryState.announcements.data = []
        queryState.attempts.data = []
        queryState.tryouts.data = []
        queryState.allAttemptScores.data = []
        queryState.subjects.count = 0
        queryState.throwOnAnnouncements = false

        profileUpdateEqMock.mockResolvedValue({ error: null })
        profileUpdateMock.mockReturnValue({ eq: profileUpdateEqMock })

        fromMock.mockImplementation((table: string) => {
            if (table === 'profiles') {
                const singleMock = vi.fn(async () => ({ data: queryState.profile.data }))
                const eqSelectMock = vi.fn(() => ({ single: singleMock }))
                const selectMock = vi.fn(() => ({ eq: eqSelectMock }))
                return { select: selectMock, update: profileUpdateMock }
            }

            if (table === 'announcements') {
                if (queryState.throwOnAnnouncements) {
                    throw new Error('announcements boom')
                }
                const limitMock = vi.fn(async () => ({ data: queryState.announcements.data }))
                const orderMock = vi.fn(() => ({ limit: limitMock }))
                const orMock = vi.fn(() => ({ order: orderMock }))
                const eqMock = vi.fn(() => ({ or: orMock }))
                const selectMock = vi.fn(() => ({ eq: eqMock }))
                return { select: selectMock }
            }

            if (table === 'tryout_attempts') {
                const selectMock = vi.fn((selectValue: string) => {
                    if (selectValue === 'score') {
                        const eqSubmittedMock = vi.fn(async () => ({ data: queryState.allAttemptScores.data }))
                        const eqStudentMock = vi.fn(() => ({ eq: eqSubmittedMock }))
                        return { eq: eqStudentMock }
                    }

                    const limitMock = vi.fn(async () => ({ data: queryState.attempts.data }))
                    const orderMock = vi.fn(() => ({ limit: limitMock }))
                    const eqSubmittedMock = vi.fn(() => ({ order: orderMock }))
                    const eqStudentMock = vi.fn(() => ({ eq: eqSubmittedMock }))
                    return { eq: eqStudentMock }
                })
                return { select: selectMock }
            }

            if (table === 'tryouts') {
                const limitMock = vi.fn(async () => ({ data: queryState.tryouts.data }))
                const orderMock = vi.fn(() => ({ limit: limitMock }))
                const gteMock = vi.fn(() => ({ order: orderMock }))
                const eqMock = vi.fn(() => ({ gte: gteMock }))
                const selectMock = vi.fn(() => ({ eq: eqMock }))
                return { select: selectMock }
            }

            if (table === 'subjects') {
                const selectMock = vi.fn(async () => ({ count: queryState.subjects.count }))
                return { select: selectMock }
            }

            return { select: vi.fn() }
        })
    })

    afterEach(() => {
        cleanup()
    })

    it('keeps loading and does not query when user is null', async () => {
        authState.user = null
        const { default: StudentDashboard } = await import('./page')

        render(<StudentDashboard />)

        expect(screen.getByText('Loading')).toBeTruthy()
        expect(fromMock).not.toHaveBeenCalled()
    })

    it('renders populated dashboard for active account and does not show payment banner', async () => {
        queryState.attempts.data = [
            {
                id: 'a-1',
                score: 90,
                total_correct: 45,
                total_wrong: 5,
                total_unanswered: 0,
                tryout: { title: 'Tryout Alpha', subject: { name: 'Math', icon: '📘' } },
            },
            {
                id: 'a-2',
                score: 65,
                total_correct: 30,
                total_wrong: 15,
                total_unanswered: 5,
                tryout: { title: 'Tryout Beta', subject: { name: 'Science', icon: '🧪' } },
            },
            {
                id: 'a-3',
                score: 40,
                total_correct: 20,
                total_wrong: 20,
                total_unanswered: 10,
                tryout: { title: 'Tryout Gamma', subject: { name: 'English', icon: '📝' } },
            },
        ]
        queryState.tryouts.data = [
            { id: 'to-1', title: 'TO 1', subject: { name: 'Math' }, duration_minutes: 90 },
        ]
        queryState.announcements.data = [{ id: 'ann-1' }]
        queryState.allAttemptScores.data = [{ score: 90 }, { score: 70 }, { score: 80 }]
        queryState.subjects.count = 8

        const { default: StudentDashboard } = await import('./page')
        render(<StudentDashboard />)

        await waitFor(() => {
            expect(screen.queryByText('Loading')).toBeNull()
        })

        expect(screen.getByText('Welcome, John! 👋')).toBeTruthy()
        expect(screen.getByText('Account active')).toBeTruthy()
        expect(screen.queryByText('Payment Required Banner')).toBeNull()
        expect(screen.getByTestId('announcement-banner')).toHaveTextContent('Announcements:1')
        expect(screen.getByText('Tryout Alpha')).toBeTruthy()
        expect(screen.getByText('Tryout Beta')).toBeTruthy()
        expect(screen.getByText('Tryout Gamma')).toBeTruthy()
        expect(screen.getByText('TO 1')).toBeTruthy()
        expect(screen.getByTestId('score-ring')).toHaveTextContent('ScoreRing:80')
        expect(screen.getByText('Excellent')).toBeTruthy()

        expect(profileUpdateEqMock).not.toHaveBeenCalled()
    })

    it('renders inactive account banner and empty sections with keep learning branch', async () => {
        authState.user = {
            id: 'student-1',
            full_name: 'Jane Doe',
            class_id: null,
            payment_status: 'expired',
        }
        queryState.attempts.data = []
        queryState.tryouts.data = []
        queryState.announcements.data = []
        queryState.allAttemptScores.data = [{ score: 50 }]
        queryState.subjects.count = null

        const { default: StudentDashboard } = await import('./page')
        render(<StudentDashboard />)

        await waitFor(() => {
            expect(screen.queryByText('Loading')).toBeNull()
        })

        expect(screen.getByText('Welcome, Jane! 👋')).toBeTruthy()
        expect(screen.getByText('Please renew')).toBeTruthy()
        expect(screen.getByText('Payment Required Banner')).toBeTruthy()
        expect(screen.getByText('No scores yet')).toBeTruthy()
        expect(screen.getByText('No schedule')).toBeTruthy()
        expect(screen.getByText('Keep Learning')).toBeTruthy()
        expect(screen.getByTestId('score-ring')).toHaveTextContent('ScoreRing:50')
    })

    it('increments streak when last activity was yesterday', async () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        queryState.profile.data = {
            streak_count: 4,
            last_activity_at: yesterday.toISOString(),
        }
        queryState.allAttemptScores.data = [{ score: 60 }, { score: 70 }]

        const { default: StudentDashboard } = await import('./page')
        render(<StudentDashboard />)

        await waitFor(() => {
            expect(profileUpdateEqMock).toHaveBeenCalledTimes(1)
        })

        const updatePayload = profileUpdateMock.mock.calls[0]?.[0]
        expect(updatePayload).toEqual(
            expect.objectContaining({
                streak_count: 5,
                last_activity_at: expect.any(String),
            }),
        )
        expect(screen.getByText('Good')).toBeTruthy()
    })

    it('resets streak to 1 when last activity is older and handles missing profile', async () => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 3)

        queryState.profile.data = {
            streak_count: 9,
            last_activity_at: oldDate.toISOString(),
        }
        queryState.allAttemptScores.data = [{ score: null }]

        const { default: StudentDashboard } = await import('./page')
        const first = render(<StudentDashboard />)

        await waitFor(() => {
            expect(profileUpdateEqMock).toHaveBeenCalledTimes(1)
        })

        let updatePayload = profileUpdateMock.mock.calls[0]?.[0]
        expect(updatePayload).toEqual(
            expect.objectContaining({
                streak_count: 1,
                last_activity_at: expect.any(String),
            }),
        )

        first.unmount()

        queryState.profile.data = null
        profileUpdateEqMock.mockClear()
        render(<StudentDashboard />)

        await waitFor(() => {
            expect(screen.queryByText('Loading')).toBeNull()
        })

        expect(profileUpdateEqMock).not.toHaveBeenCalled()
    })

    it('shows error message when fetching throws', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        queryState.throwOnAnnouncements = true

        const { default: StudentDashboard } = await import('./page')
        render(<StudentDashboard />)

        await waitFor(() => {
            expect(screen.getByText('Gagal memuat data dashboard. Silakan refresh halaman.')).toBeTruthy()
        })

        consoleSpy.mockRestore()
    })

    it('handles recent attempt fallback icon and null score values', async () => {
        queryState.attempts.data = [
            {
                id: 'a-fallback',
                score: null,
                total_correct: 0,
                total_wrong: 0,
                total_unanswered: 10,
                tryout: null,
            },
        ]
        queryState.allAttemptScores.data = [{ score: null }]

        const { default: StudentDashboard } = await import('./page')
        render(<StudentDashboard />)

        await waitFor(() => {
            expect(screen.queryByText('Loading')).toBeNull()
        })

        expect(screen.getByText('📝')).toBeTruthy()
        expect(screen.getByText('0/10')).toBeTruthy()
        expect(screen.getByText('0')).toBeTruthy()
    })

    it('handles null list payloads and empty score list stats branch', async () => {
        queryState.announcements.data = null
        queryState.attempts.data = null
        queryState.tryouts.data = null
        queryState.allAttemptScores.data = []
        queryState.subjects.count = null

        const { default: StudentDashboard } = await import('./page')
        render(<StudentDashboard />)

        await waitFor(() => {
            expect(screen.queryByText('Loading')).toBeNull()
        })

        expect(screen.getByTestId('announcement-banner')).toHaveTextContent('Announcements:0')
        expect(screen.getByText('No scores yet')).toBeTruthy()
        expect(screen.getByText('No schedule')).toBeTruthy()
        expect(screen.getByTestId('score-ring')).toHaveTextContent('ScoreRing:0')
        expect(screen.getByText('Keep Learning')).toBeTruthy()
    })

    it('handles null streak metadata and null all-attempt scores payload', async () => {
        queryState.profile.data = {
            streak_count: null,
            last_activity_at: null,
        }
        queryState.allAttemptScores.data = null

        const { default: StudentDashboard } = await import('./page')
        render(<StudentDashboard />)

        await waitFor(() => {
            expect(screen.queryByText('Loading')).toBeNull()
        })

        const updatePayload = profileUpdateMock.mock.calls[0]?.[0]
        expect(updatePayload).toEqual(
            expect.objectContaining({
                streak_count: 1,
                last_activity_at: expect.any(String),
            }),
        )
        expect(screen.getByTestId('score-ring')).toHaveTextContent('ScoreRing:0')
    })
})
