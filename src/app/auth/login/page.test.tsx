// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const searchParamsGetMock = vi.fn()
const signInWithOAuthMock = vi.fn()

vi.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: searchParamsGetMock,
    }),
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithOAuth: signInWithOAuthMock,
        },
    }),
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}))

vi.mock('@/components/ui', () => ({
    GlassCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Button: ({ children, isLoading, onClick }: { children: React.ReactNode; isLoading?: boolean; onClick?: () => void }) => (
        <button type="button" onClick={onClick} disabled={Boolean(isLoading)}>
            {children}
        </button>
    ),
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            auth: {
                login: {
                    subtitle: 'Subtitle',
                    googleError: 'Google login failed',
                    authError: 'Auth callback error',
                    title: 'Welcome Back',
                    continueWithGoogle: 'Continue with Google',
                    disclaimer: 'By continuing you agree.',
                },
            },
        },
    }),
}))

describe('app/auth/login/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        searchParamsGetMock.mockReturnValue(null)
        signInWithOAuthMock.mockResolvedValue({ error: null })
    })

    afterEach(() => {
        cleanup()
    })

    it('renders login content', async () => {
        const { default: LoginPage } = await import('./page')

        render(<LoginPage />)

        expect(screen.getByText('Privcey Edu')).toBeTruthy()
        expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy()
    })

    it('shows auth callback error from search params', async () => {
        searchParamsGetMock.mockReturnValue('oauth_error')

        const { default: LoginPage } = await import('./page')

        render(<LoginPage />)

        expect(screen.getByText('Auth callback error')).toBeTruthy()
    })

    it('starts google oauth flow with expected params', async () => {
        const { default: LoginPage } = await import('./page')

        render(<LoginPage />)

        fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

        await waitFor(() => {
            expect(signInWithOAuthMock).toHaveBeenCalledWith({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })
        })
    })

    it('shows google error when oauth request fails', async () => {
        signInWithOAuthMock.mockResolvedValue({ error: { message: 'failed' } })

        const { default: LoginPage } = await import('./page')

        render(<LoginPage />)

        fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

        expect(await screen.findByText('Google login failed')).toBeTruthy()
    })
})
