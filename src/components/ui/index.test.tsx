// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
        p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    },
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            ui: {
                scoreRingLabel: 'Score',
            },
        },
    }),
}))

describe('components/ui/index', () => {
    afterEach(() => {
        cleanup()
    })

    it('renders GlassCard with default and custom styles', async () => {
        const { GlassCard } = await import('./index')

        const { container } = render(<GlassCard className="my-card">Card Content</GlassCard>)

        const card = container.firstElementChild as HTMLDivElement
        expect(card.className).toContain('glass-card')
        expect(card.className).toContain('p-6')
        expect(card.className).toContain('my-card')
    })

    it('renders GlassCard non-hoverable with large padding', async () => {
        const { GlassCard } = await import('./index')

        const { container } = render(
            <GlassCard hoverable={false} padding="lg">
                Large Card
            </GlassCard>,
        )

        const card = container.firstElementChild as HTMLDivElement
        expect(card.className).toContain('glass')
        expect(card.className).toContain('p-8')
    })

    it('renders Button variants, size and loading state', async () => {
        const { Button } = await import('./index')

        render(
            <Button variant="danger" size="lg" isLoading>
                Save
            </Button>,
        )

        const button = screen.getByRole('button', { name: /save/i })
        expect(button).toBeTruthy()
        expect(button).toHaveProperty('disabled', true)
        expect(button.className).toContain('bg-red-500/20')
        expect(button.className).toContain('px-8')
        expect(button.querySelector('svg')).toBeTruthy()
    })

    it('renders Input with label and error', async () => {
        const { Input } = await import('./index')

        render(<Input label="Email" error="Invalid email" placeholder="you@example.com" />)

        expect(screen.getByText('Email')).toBeTruthy()
        expect(screen.getByText('Invalid email')).toBeTruthy()
        expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy()
    })

    it('renders Badge variant class', async () => {
        const { Badge } = await import('./index')

        render(<Badge variant="info">Info</Badge>)

        const badge = screen.getByText('Info')
        expect(badge.className).toContain('bg-blue-500/15')
    })

    it('renders ScoreRing across score color branches', async () => {
        const { ScoreRing } = await import('./index')

        const { rerender, container } = render(<ScoreRing score={90} />)
        let circles = container.querySelectorAll('circle')
        expect(circles[1]?.getAttribute('stroke')).toBe('#22c55e')
        expect(screen.getByText('90')).toBeTruthy()
        expect(screen.getByText('Score')).toBeTruthy()

        rerender(<ScoreRing score={65} />)
        circles = container.querySelectorAll('circle')
        expect(circles[1]?.getAttribute('stroke')).toBe('#eab308')

        rerender(<ScoreRing score={40} />)
        circles = container.querySelectorAll('circle')
        expect(circles[1]?.getAttribute('stroke')).toBe('#ef4444')
    })

    it('renders LoadingSpinner and EmptyState', async () => {
        const { LoadingSpinner, EmptyState } = await import('./index')

        const { rerender } = render(<LoadingSpinner className="my-spinner" />)
        const spinnerRoot = document.querySelector('.my-spinner') as HTMLDivElement
        expect(spinnerRoot).toBeTruthy()

        rerender(
            <EmptyState
                icon={<span>⚡</span>}
                title="No Data"
                description="Please add one"
                action={<button type="button">Create</button>}
            />,
        )

        expect(screen.getByText('No Data')).toBeTruthy()
        expect(screen.getByText('Please add one')).toBeTruthy()
        expect(screen.getByRole('button', { name: /create/i })).toBeTruthy()

        rerender(<EmptyState title="Only Title" />)
        expect(screen.getByText('Only Title')).toBeTruthy()
    })

    it('renders StatCard with trend branches', async () => {
        const { StatCard } = await import('./index')

        const { rerender } = render(
            <StatCard
                label="Users"
                value={42}
                icon={<span>👤</span>}
                trend={{ value: 12, isPositive: true }}
            />,
        )

        expect(screen.getByText('Users')).toBeTruthy()
        expect(screen.getByText('42')).toBeTruthy()
        expect(screen.getByText('↑ 12%')).toBeTruthy()

        rerender(
            <StatCard
                label="Revenue"
                value="100K"
                icon={<span>💰</span>}
                trend={{ value: 3, isPositive: false }}
            />,
        )

        expect(screen.getByText('↓ 3%')).toBeTruthy()

        rerender(<StatCard label="No Trend" value="N/A" icon={<span>—</span>} />)
        expect(screen.getByText('No Trend')).toBeTruthy()
    })
})
