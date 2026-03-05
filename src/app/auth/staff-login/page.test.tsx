// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()
const refreshMock = vi.fn()
const signInWithPasswordMock = vi.fn()
const signOutMock = vi.fn()
const singleMock = vi.fn()

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
    }),
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}))

vi.mock('@/components/ui', () => ({
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button {...props}>{children}</button>
    ),
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: signInWithPasswordMock,
            signOut: signOutMock,
        },
        from: () => ({
            select: () => ({
                eq: () => ({ single: singleMock }),
            }),
        }),
    }),
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            auth: {
                staffLogin: {
                    title: 'Staff Login',
                    subtitle: 'For admin and tutor only',
                    wrongCredentials: 'Wrong credentials',
                    accessDenied: 'Access denied',
                    emailPlaceholder: 'name@example.com',
                    passwordPlaceholder: 'password',
                    loginButton: 'Login',
                    isStudent: 'Are you a student?',
                    loginWithGoogle: 'Login with Google',
                },
            },
            common: {
                email: 'Email',
                password: 'Password',
            },
        },
    }),
}))

describe('app/auth/staff-login/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        signOutMock.mockResolvedValue(undefined)
        signInWithPasswordMock.mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
        })
        singleMock.mockResolvedValue({ data: { role: 'admin' } })
    })

    afterEach(() => {
        cleanup()
    })

    it('renders and toggles password visibility', async () => {
        const { default: StaffLoginPage } = await import('./page')

        render(<StaffLoginPage />)

        const passwordInput = screen.getByPlaceholderText('password') as HTMLInputElement
        expect(passwordInput.type).toBe('password')

        const toggleButton = screen.getAllByRole('button').find((button) =>
            button.className.includes('absolute right-3'),
        ) as HTMLButtonElement

        fireEvent.click(toggleButton)
        expect(passwordInput.type).toBe('text')
    })

    it('shows wrong credentials message on auth error', async () => {
        signInWithPasswordMock.mockResolvedValue({
            data: { user: null },
            error: { message: 'invalid' },
        })

        const { default: StaffLoginPage } = await import('./page')

        render(<StaffLoginPage />)

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'admin@site.com' } })
        fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'secret' } })
        fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form') as HTMLFormElement)

        expect(await screen.findByText('Wrong credentials')).toBeTruthy()
        expect(pushMock).not.toHaveBeenCalled()
    })

    it('does not redirect when auth returns no user without error', async () => {
        signInWithPasswordMock.mockResolvedValue({
            data: { user: null },
            error: null,
        })

        const { default: StaffLoginPage } = await import('./page')

        render(<StaffLoginPage />)

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'staff@site.com' } })
        fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'secret' } })
        fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form') as HTMLFormElement)

        await waitFor(() => {
            expect(pushMock).not.toHaveBeenCalled()
            expect(signOutMock).not.toHaveBeenCalled()
        })
    })

    it('denies non-staff role and signs out', async () => {
        singleMock.mockResolvedValue({ data: { role: 'student' } })

        const { default: StaffLoginPage } = await import('./page')

        render(<StaffLoginPage />)

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'staff@site.com' } })
        fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'secret' } })
        fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form') as HTMLFormElement)

        expect(await screen.findByText('Access denied')).toBeTruthy()
        await waitFor(() => {
            expect(signOutMock).toHaveBeenCalledTimes(1)
        })
        expect(pushMock).not.toHaveBeenCalled()
    })

    it('routes admin to admin dashboard', async () => {
        singleMock.mockResolvedValue({ data: { role: 'admin' } })

        const { default: StaffLoginPage } = await import('./page')

        render(<StaffLoginPage />)

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'admin@site.com' } })
        fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'secret' } })
        fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form') as HTMLFormElement)

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith('/dashboard/admin')
            expect(refreshMock).toHaveBeenCalledTimes(1)
        })
    })

    it('routes tutor to tutor dashboard', async () => {
        singleMock.mockResolvedValue({ data: { role: 'tutor' } })

        const { default: StaffLoginPage } = await import('./page')

        render(<StaffLoginPage />)

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'tutor@site.com' } })
        fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'secret' } })
        fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form') as HTMLFormElement)

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith('/dashboard/tutor')
            expect(refreshMock).toHaveBeenCalledTimes(1)
        })
    })
})
