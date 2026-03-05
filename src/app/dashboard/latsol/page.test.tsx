import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

let mockData: unknown

const fromMock = vi.fn()
const createClientMock = vi.fn(async () => ({ from: fromMock }))

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => createClientMock(),
}))

vi.mock('./latsol-client', () => ({
    LatsolClientPage: ({ initialExercises }: { initialExercises: unknown[] }) => (
        <div data-testid="latsol-client">{initialExercises.length}</div>
    ),
}))

describe('dashboard/latsol/page', () => {
    beforeEach(() => {
        const limitMock = vi.fn(async () => ({ data: mockData }))
        const orderMock = vi.fn(() => ({ limit: limitMock }))
        const eqMock = vi.fn(() => ({ order: orderMock }))
        const selectMock = vi.fn(() => ({ eq: eqMock }))
        fromMock.mockReturnValue({ select: selectMock })
    })

    it('renders LatsolClientPage with fetched data', async () => {
        mockData = [{ id: '1' }]
        const { default: LatsolPage, revalidate } = await import('./page')

        const html = renderToStaticMarkup(await LatsolPage())

        expect(revalidate).toBe(300)
        expect(html).toContain('data-testid="latsol-client"')
        expect(html).toContain('>1<')
    })

    it('falls back to empty list when data is nullish', async () => {
        mockData = undefined
        const { default: LatsolPage } = await import('./page')

        const html = renderToStaticMarkup(await LatsolPage())

        expect(html).toContain('>0<')
    })
})
