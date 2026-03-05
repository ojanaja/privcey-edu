// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/font/google', () => ({
    Inter: () => ({ variable: '--font-inter' }),
}))

vi.mock('@vercel/analytics/next', () => ({
    Analytics: () => <div data-testid="analytics" />,
}))

vi.mock('@/components/theme-provider', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="theme-provider">{children}</div>
    ),
}))

vi.mock('@/components/error-boundary', () => ({
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="error-boundary">{children}</div>
    ),
}))

describe('app/layout', () => {
    afterEach(() => {
        cleanup()
    })

    it('renders root layout wrappers and children', async () => {
        const { default: RootLayout } = await import('./layout')

        render(
            <RootLayout>
                <div>App Content</div>
            </RootLayout>,
        )

        expect(screen.getByTestId('theme-provider')).toBeTruthy()
        expect(screen.getByTestId('error-boundary')).toBeTruthy()
        expect(screen.getByTestId('analytics')).toBeTruthy()
        expect(screen.getByText('App Content')).toBeTruthy()
    })

    it('exports metadata', async () => {
        const { metadata } = await import('./layout')

        expect(metadata.title).toBe('Privcey Edu — E-Learning Platform')
        expect(metadata.openGraph?.locale).toBe('id_ID')
    })
})
