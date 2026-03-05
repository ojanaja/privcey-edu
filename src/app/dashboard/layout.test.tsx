import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/components/layout/dashboard-layout', () => ({
    DashboardLayout: ({ children }: { children: React.ReactNode }) => (
        <section data-testid="dashboard-layout">{children}</section>
    ),
}))

vi.mock('@/components/error-boundary', () => ({
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
        <section data-testid="error-boundary">{children}</section>
    ),
}))

describe('app/dashboard/layout', () => {
    it('wraps children with DashboardLayout and ErrorBoundary', async () => {
        const { default: DashboardRootLayout } = await import('./layout')

        const html = renderToStaticMarkup(
            <DashboardRootLayout>
                <div>Child Content</div>
            </DashboardRootLayout>,
        )

        expect(html).toContain('data-testid="dashboard-layout"')
        expect(html).toContain('data-testid="error-boundary"')
        expect(html).toContain('Child Content')

        expect(html.indexOf('dashboard-layout')).toBeLessThan(html.indexOf('error-boundary'))
    })
})
