import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

let mockData: unknown

const fromMock = vi.fn()
const createClientMock = vi.fn(async () => ({ from: fromMock }))

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => createClientMock(),
}))

vi.mock('./vod-client', () => ({
    VodClientPage: ({ initialVods }: { initialVods: unknown[] }) => (
        <div data-testid="vod-client">{initialVods.length}</div>
    ),
}))

describe('dashboard/vod/page', () => {
    beforeEach(() => {
        const orderMock = vi.fn(async () => ({ data: mockData }))
        const eqMock = vi.fn(() => ({ order: orderMock }))
        const selectMock = vi.fn(() => ({ eq: eqMock }))
        fromMock.mockReturnValue({ select: selectMock })
    })

    it('renders VodClientPage with fetched data', async () => {
        mockData = [{ id: '1' }]
        const { default: VodPage, revalidate } = await import('./page')

        const html = renderToStaticMarkup(await VodPage())

        expect(revalidate).toBe(300)
        expect(html).toContain('data-testid="vod-client"')
        expect(html).toContain('>1<')
    })

    it('falls back to empty list when data is nullish', async () => {
        mockData = undefined
        const { default: VodPage } = await import('./page')

        const html = renderToStaticMarkup(await VodPage())

        expect(html).toContain('>0<')
    })
})
