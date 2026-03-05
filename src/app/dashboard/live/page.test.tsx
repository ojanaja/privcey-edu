import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

let mockData: unknown

const fromMock = vi.fn()
const createClientMock = vi.fn(async () => ({ from: fromMock }))

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => createClientMock(),
}))

vi.mock('./live-client', () => ({
    LiveClientPage: ({ initialClasses }: { initialClasses: unknown[] }) => (
        <div data-testid="live-client">{initialClasses.length}</div>
    ),
}))

describe('dashboard/live/page', () => {
    beforeEach(() => {
        const orderMock = vi.fn(async () => ({ data: mockData }))
        const eqMock = vi.fn(() => ({ order: orderMock }))
        const selectMock = vi.fn(() => ({ eq: eqMock }))
        fromMock.mockReturnValue({ select: selectMock })
    })

    it('renders LiveClientPage with fetched data', async () => {
        mockData = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
        const { default: LiveClassPage, revalidate } = await import('./page')

        const html = renderToStaticMarkup(await LiveClassPage())

        expect(revalidate).toBe(300)
        expect(html).toContain('data-testid="live-client"')
        expect(html).toContain('>3<')
    })

    it('falls back to empty list when data is nullish', async () => {
        mockData = null
        const { default: LiveClassPage } = await import('./page')

        const html = renderToStaticMarkup(await LiveClassPage())

        expect(html).toContain('>0<')
    })
})
