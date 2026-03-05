// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let localeValue: 'en' | 'id' = 'en'
const setLocaleMock = vi.fn()

vi.mock('@/lib/i18n', () => ({
    useLanguageStore: () => ({
        locale: localeValue,
        setLocale: setLocaleMock,
    }),
}))

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    it('renders placeholder when not mounted', async () => {
        const { LanguageSwitcher } = await import('./language-switcher')
        const html = renderToStaticMarkup(<LanguageSwitcher />)
        expect(html).toContain('w-9 h-9')
    })

    it('toggles en to id', async () => {
        localeValue = 'en'
        const { LanguageSwitcher } = await import('./language-switcher')

        render(<LanguageSwitcher />)

        const button = await screen.findByRole('button')
        expect(button.getAttribute('title')).toBe('Switch to Bahasa Indonesia')
        expect(screen.getByText('en')).toBeTruthy()

        fireEvent.click(button)
        expect(setLocaleMock).toHaveBeenCalledWith('id')
    })

    it('toggles id to en', async () => {
        localeValue = 'id'
        const { LanguageSwitcher } = await import('./language-switcher')

        render(<LanguageSwitcher />)

        const button = await screen.findByRole('button')
        expect(button.getAttribute('title')).toBe('Switch to English')
        expect(screen.getByText('id')).toBeTruthy()

        fireEvent.click(button)
        expect(setLocaleMock).toHaveBeenCalledWith('en')
    })
})
