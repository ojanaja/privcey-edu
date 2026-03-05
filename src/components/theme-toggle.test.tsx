// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let themeValue = 'dark'
const setThemeMock = vi.fn()

vi.mock('next-themes', () => ({
    useTheme: () => ({
        theme: themeValue,
        setTheme: setThemeMock,
    }),
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            theme: {
                lightMode: 'Switch to light mode',
                darkMode: 'Switch to dark mode',
            },
        },
    }),
}))

describe('ThemeToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    it('renders placeholder when not mounted', async () => {
        const { ThemeToggle } = await import('./theme-toggle')
        const html = renderToStaticMarkup(<ThemeToggle />)
        expect(html).toContain('w-9 h-9')
    })

    it('toggles dark to light', async () => {
        themeValue = 'dark'
        const { ThemeToggle } = await import('./theme-toggle')

        render(<ThemeToggle />)

        const button = await screen.findByRole('button')
        expect(button.getAttribute('title')).toBe('Switch to light mode')

        fireEvent.click(button)
        expect(setThemeMock).toHaveBeenCalledWith('light')
    })

    it('toggles light to dark', async () => {
        themeValue = 'light'
        const { ThemeToggle } = await import('./theme-toggle')

        render(<ThemeToggle />)

        const button = await screen.findByRole('button')
        expect(button.getAttribute('title')).toBe('Switch to dark mode')

        fireEvent.click(button)
        expect(setThemeMock).toHaveBeenCalledWith('dark')
    })
})
