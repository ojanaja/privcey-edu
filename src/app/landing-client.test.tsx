// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            landing: {
                login: 'Login',
                register: 'Register',
                premiumPlatform: 'Premium Platform',
                heroTitle1: 'Learn Better',
                heroTitle2: 'Every Day',
                heroDescription: 'Learning platform description',
                startNow: 'Start Now',
                haveAccount: 'Already have account?',
                activeStudents: 'Active Students',
                classes: 'Classes',
                questionBank: 'Question Bank',
                satisfaction: 'Satisfaction',
                featuresTitle: 'Platform Features',
                featuresHighlight: 'For You',
                featuresDescription: 'Feature section description',
                readyToJoin: 'Ready to Join?',
                joinDescription: 'Join description',
                registerFree: 'Register Free',
                copyright: '© Privcey Edu',
                features: {
                    tryout: { title: 'Tryout', description: 'Tryout desc' },
                    vod: { title: 'VOD', description: 'VOD desc' },
                    emod: { title: 'E-Module', description: 'E-Module desc' },
                    scoreTracker: { title: 'Score Tracker', description: 'Score desc' },
                    strengthens: { title: 'Strengthens', description: 'Strengthens desc' },
                    leaderboard: { title: 'Leaderboard', description: 'Leaderboard desc' },
                },
            },
        },
    }),
}))

describe('app/landing-client', () => {
    afterEach(() => {
        cleanup()
    })

    it('renders hero, stats, features and footer', async () => {
        const { default: LandingClient } = await import('./landing-client')

        render(<LandingClient />)

        expect(screen.getByText('Privcey Edu')).toBeTruthy()
        expect(screen.getByText('Premium Platform')).toBeTruthy()
        expect(screen.getByText('Learn Better')).toBeTruthy()
        expect(screen.getByText('Every Day')).toBeTruthy()
        expect(screen.getByText('Platform Features')).toBeTruthy()
        expect(screen.getByText('Ready to Join?')).toBeTruthy()
        expect(screen.getByText('© Privcey Edu')).toBeTruthy()
    })

    it('renders authentication call-to-action links', async () => {
        const { default: LandingClient } = await import('./landing-client')

        render(<LandingClient />)

        const loginLinks = screen.getAllByRole('link', { name: /login|already have account\?/i })
        const registerLinks = screen.getAllByRole('link', { name: /register|start now|register free/i })

        expect(loginLinks.some((link) => link.getAttribute('href') === '/auth/login')).toBe(true)
        expect(registerLinks.some((link) => link.getAttribute('href') === '/auth/register')).toBe(true)
    })
})
