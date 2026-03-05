// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const nextThemesProviderMock = vi.fn(
    ({ children }: { children: React.ReactNode }) => <div data-testid="next-themes-provider">{children}</div>,
)

vi.mock('next-themes', () => ({
    ThemeProvider: (props: { children: React.ReactNode }) => nextThemesProviderMock(props),
}))

describe('components/ThemeProvider', () => {
    afterEach(() => {
        cleanup()
    })

    it('renders children via next-themes provider with expected props', async () => {
        const { ThemeProvider } = await import('./theme-provider')

        render(
            <ThemeProvider>
                <div>Theme Content</div>
            </ThemeProvider>,
        )

        expect(screen.getByTestId('next-themes-provider')).toBeTruthy()
        expect(screen.getByText('Theme Content')).toBeTruthy()
        expect(nextThemesProviderMock).toHaveBeenCalledWith(
            expect.objectContaining({
                attribute: 'class',
                defaultTheme: 'dark',
                enableSystem: true,
            }),
        )
    })
})
