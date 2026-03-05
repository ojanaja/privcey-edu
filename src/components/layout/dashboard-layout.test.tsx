// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const setUserMock = vi.fn()
const setLoadingMock = vi.fn()

const authState = {
    user: null,
    isLoading: false,
    setUser: setUserMock,
    setLoading: setLoadingMock,
}

vi.mock('@/stores/auth-store', () => ({
    useAuthStore: () => authState,
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: createClientMock,
}))

vi.mock('./sidebar', () => ({
    Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}))

vi.mock('@/components/ui', () => ({
    LoadingSpinner: ({ className }: { className?: string }) => (
        <div data-testid="loading-spinner" className={className}>Loading Spinner</div>
    ),
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props}>{children}</div>
        ),
    },
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: { common: { loading: 'Loading...' } },
    }),
}))

function makeSupabaseClient(options?: {
    authUser?: { id: string } | null
    profile?: Record<string, unknown> | null
    getUserReject?: boolean
}) {
    const authUser = options?.authUser === undefined ? { id: 'user-1' } : options.authUser
    const profile = options?.profile === undefined ? { id: 'user-1', full_name: 'Student Name' } : options.profile

    const getUser = options?.getUserReject
        ? vi.fn().mockRejectedValue(new Error('getUser failed'))
        : vi.fn().mockResolvedValue({ data: { user: authUser } })

    const single = vi.fn().mockResolvedValue({ data: profile })
    const from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single }),
        }),
    })

    return {
        auth: { getUser },
        from,
    }
}

describe('components/layout/DashboardLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = null
        authState.isLoading = false
    })

    afterEach(() => {
        cleanup()
    })

    it('renders loading state when auth store is loading', async () => {
        authState.isLoading = true
        createClientMock.mockReturnValue(makeSupabaseClient())

        const { DashboardLayout } = await import('./dashboard-layout')

        render(
            <DashboardLayout>
                <div>Child Content</div>
            </DashboardLayout>,
        )

        expect(screen.getByTestId('loading-spinner')).toBeTruthy()
        expect(screen.getByText('Loading...')).toBeTruthy()
    })

    it('renders layout shell and children when not loading', async () => {
        authState.isLoading = false
        createClientMock.mockReturnValue(makeSupabaseClient())

        const { DashboardLayout } = await import('./dashboard-layout')

        render(
            <DashboardLayout>
                <div>Child Content</div>
            </DashboardLayout>,
        )

        expect(screen.getByTestId('sidebar')).toBeTruthy()
        expect(screen.getByText('Child Content')).toBeTruthy()
    })

    it('fetches profile and sets user when auth user exists', async () => {
        authState.isLoading = false
        createClientMock.mockReturnValue(
            makeSupabaseClient({
                authUser: { id: 'auth-1' },
                profile: { id: 'auth-1', full_name: 'Profile User' },
            }),
        )

        const { DashboardLayout } = await import('./dashboard-layout')

        render(
            <DashboardLayout>
                <div>Child</div>
            </DashboardLayout>,
        )

        await waitFor(() => {
            expect(setUserMock).toHaveBeenCalledWith({ id: 'auth-1', full_name: 'Profile User' })
        })
    })

    it('sets user null when auth user does not exist', async () => {
        authState.isLoading = false
        createClientMock.mockReturnValue(makeSupabaseClient({ authUser: null }))

        const { DashboardLayout } = await import('./dashboard-layout')

        render(
            <DashboardLayout>
                <div>Child</div>
            </DashboardLayout>,
        )

        await waitFor(() => {
            expect(setUserMock).toHaveBeenCalledWith(null)
        })
    })

    it('handles fetch errors by setting user null', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        authState.isLoading = false
        createClientMock.mockReturnValue(makeSupabaseClient({ getUserReject: true }))

        const { DashboardLayout } = await import('./dashboard-layout')

        render(
            <DashboardLayout>
                <div>Child</div>
            </DashboardLayout>,
        )

        await waitFor(() => {
            expect(setUserMock).toHaveBeenCalledWith(null)
        })

        expect(consoleErrorSpy).toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })
})
