import { describe, expect, it, vi } from 'vitest'

const updateSessionMock = vi.fn()

vi.mock('@/lib/supabase/middleware', () => ({
    updateSession: updateSessionMock,
}))

describe('proxy', () => {
    it('delegates request handling to updateSession', async () => {
        const request = { url: 'http://localhost/dashboard' } as never
        const response = { ok: true }
        updateSessionMock.mockResolvedValue(response)

        const { proxy } = await import('./proxy')
        const result = await proxy(request)

        expect(updateSessionMock).toHaveBeenCalledTimes(1)
        expect(updateSessionMock).toHaveBeenCalledWith(request)
        expect(result).toBe(response)
    })

    it('exports expected matcher config', async () => {
        const { config } = await import('./proxy')

        expect(config.matcher).toEqual([
            '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
        ])
    })
})
