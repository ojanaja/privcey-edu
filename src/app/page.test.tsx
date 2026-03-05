import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('./landing-client', () => ({
    default: function MockLandingClient() {
        return <div data-testid="landing-client">Landing Client</div>
    },
}))

describe('app/page', () => {
    it('exports expected metadata', async () => {
        const { metadata } = await import('./page')

        expect(metadata.title).toBe('Privcey Edu — Platform E-Learning Premium')
        expect(metadata.description).toContain('Platform e-learning all-in-one')
        expect(metadata.openGraph?.type).toBe('website')
        expect(Array.isArray(metadata.keywords)).toBe(true)
        expect(metadata.keywords).toContain('privcey edu')
    })

    it('renders LandingClient component', async () => {
        const { default: LandingPage } = await import('./page')
        const html = renderToStaticMarkup(<LandingPage />)

        expect(html).toContain('data-testid="landing-client"')
        expect(html).toContain('Landing Client')
    })
})
