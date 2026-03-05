// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const usePathnameMock = vi.fn()
const pushMock = vi.fn()
const signOutMock = vi.fn()

const authState: {
    user: { role: 'student' | 'admin' | 'tutor'; full_name: string; email: string } | null
} = {
    user: {
        role: 'student',
        full_name: 'John Doe',
        email: 'john@example.com',
    },
}

vi.mock('next/navigation', () => ({
    usePathname: () => usePathnameMock(),
    useRouter: () => ({ push: pushMock }),
}))

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
        auth: {
            signOut: signOutMock,
        },
    }),
}))

vi.mock('@/components/theme-toggle', () => ({
    ThemeToggle: () => <button type="button">Theme</button>,
}))

vi.mock('@/components/language-switcher', () => ({
    LanguageSwitcher: () => <button type="button">Language</button>,
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            nav: {
                dashboard: 'Dashboard',
                tryout: 'Tryout',
                dailyExercise: 'Daily Exercise',
                emod: 'E-Module',
                videoLearning: 'Video Learning',
                liveClass: 'Live Class',
                myScores: 'My Scores',
                leaderboard: 'Leaderboard',
                strengthens: 'Strengthens',
                overview: 'Overview',
                users: 'Users',
                students: 'Students',
                classes: 'Classes',
                questionBank: 'Question Bank',
                content: 'Content',
                attendance: 'Attendance',
                announcements: 'Announcements',
                analytics: 'Analytics',
                studentScores: 'Student Scores',
                logout: 'Logout',
                adminPanel: 'Admin Panel',
                tutorPanel: 'Tutor Panel',
                studentPortal: 'Student Portal',
            },
        },
    }),
}))

describe('components/layout/Sidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        usePathnameMock.mockReturnValue('/dashboard')
        authState.user = {
            role: 'student',
            full_name: 'John Doe',
            email: 'john@example.com',
        }
        signOutMock.mockResolvedValue(undefined)
    })

    afterEach(() => {
        cleanup()
    })

    it('renders student navigation and profile info', async () => {
        const { Sidebar } = await import('./sidebar')

        render(<Sidebar />)

        expect(screen.getByText('Student Portal')).toBeTruthy()
        expect(screen.getByText('Daily Exercise')).toBeTruthy()
        expect(screen.getByText('John Doe')).toBeTruthy()
        expect(screen.getByText('john@example.com')).toBeTruthy()
        expect(screen.getByText('JD')).toBeTruthy()
    })

    it('renders admin navigation for admin user', async () => {
        authState.user = {
            role: 'admin',
            full_name: 'Admin User',
            email: 'admin@example.com',
        }

        const { Sidebar } = await import('./sidebar')

        render(<Sidebar />)

        expect(screen.getByText('Admin Panel')).toBeTruthy()
        expect(screen.getByText('Users')).toBeTruthy()
        expect(screen.queryByText('Daily Exercise')).toBeNull()
    })

    it('marks nested route as active for non-root items', async () => {
        usePathnameMock.mockReturnValue('/dashboard/tryout/123')

        const { Sidebar } = await import('./sidebar')

        render(<Sidebar />)

        const tryoutLink = screen.getByRole('link', { name: /tryout/i })
        expect(tryoutLink.className).toContain('text-accent-1')
    })

    it('toggles mobile sidebar open and close', async () => {
        const { Sidebar } = await import('./sidebar')

        const { container } = render(<Sidebar />)
        const aside = container.querySelector('aside')

        expect(aside?.className).toContain('-translate-x-full')

        const toggleButton = container.querySelector('button.lg\\:hidden') as HTMLButtonElement
        fireEvent.click(toggleButton)

        expect(aside?.className).toContain('translate-x-0')

        const overlay = container.querySelector('div.bg-black\\/50') as HTMLDivElement
        fireEvent.click(overlay)

        expect(aside?.className).toContain('-translate-x-full')
    })

    it('closes mobile sidebar when navigation link is clicked', async () => {
        usePathnameMock.mockReturnValue('/dashboard/tryout')
        const { Sidebar } = await import('./sidebar')

        const { container } = render(<Sidebar />)
        const aside = container.querySelector('aside')
        const toggleButton = container.querySelector('button.lg\\:hidden') as HTMLButtonElement

        fireEvent.click(toggleButton)
        expect(aside?.className).toContain('translate-x-0')

        fireEvent.click(screen.getByRole('link', { name: /tryout/i }))
        expect(aside?.className).toContain('-translate-x-full')
    })

    it('logs out student and redirects to student login', async () => {
        const { Sidebar } = await import('./sidebar')

        render(<Sidebar />)

        fireEvent.click(screen.getByRole('button', { name: /logout/i }))

        await waitFor(() => {
            expect(signOutMock).toHaveBeenCalledTimes(1)
            expect(pushMock).toHaveBeenCalledWith('/auth/login')
        })
    })

    it('logs out tutor/admin and redirects to staff login', async () => {
        authState.user = {
            role: 'tutor',
            full_name: 'Tutor User',
            email: 'tutor@example.com',
        }

        const { Sidebar } = await import('./sidebar')

        render(<Sidebar />)

        fireEvent.click(screen.getByRole('button', { name: /logout/i }))

        await waitFor(() => {
            expect(signOutMock).toHaveBeenCalledTimes(1)
            expect(pushMock).toHaveBeenCalledWith('/auth/staff-login')
        })
    })

    it('shows loading placeholders when user is null', async () => {
        authState.user = null

        const { Sidebar } = await import('./sidebar')

        render(<Sidebar />)

        expect(screen.getByText('..')).toBeTruthy()
        expect(screen.getByText('Loading...')).toBeTruthy()
    })
})
