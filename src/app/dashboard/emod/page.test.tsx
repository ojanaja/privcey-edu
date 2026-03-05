import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

let mockData: unknown

const fromMock = vi.fn()
const createClientMock = vi.fn(async () => ({ from: fromMock }))

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => createClientMock(),
}))

vi.mock('./emod-client', () => ({
    EmodClientPage: ({ initialEmods }: { initialEmods: unknown[] }) => (
        <div data-testid="emod-client">{initialEmods.length}</div>
    ),
}))

describe('dashboard/emod/page', () => {
    beforeEach(() => {
        const orderMock = vi.fn(async () => ({ data: mockData }))
        const eqMock = vi.fn(() => ({ order: orderMock }))
        const selectMock = vi.fn(() => ({ eq: eqMock }))
        fromMock.mockReturnValue({ select: selectMock })
    })

    it('renders EmodClientPage with fetched data', async () => {
        mockData = [{ id: '1' }, { id: '2' }]
        const { default: EmodPage, revalidate } = await import('./page')

        const html = renderToStaticMarkup(await EmodPage())

        expect(revalidate).toBe(300)
        expect(html).toContain('data-testid="emod-client"')
        expect(html).toContain('>2<')
    })

    it('falls back to empty list when data is nullish', async () => {
        mockData = null
        const { default: EmodPage } = await import('./page')

        const html = renderToStaticMarkup(await EmodPage())

        expect(html).toContain('>0<')
    })
})
