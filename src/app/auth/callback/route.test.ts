import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServerClientMock = vi.fn()
const cookiesMock = vi.fn()

vi.mock('@supabase/ssr', () => ({
    createServerClient: createServerClientMock,
}))

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
}))

function buildSupabaseMock(options?: {
    exchangeError?: { message: string } | null
    user?: { id: string; user_metadata?: Record<string, string | undefined> } | null
}) {
    const exchangeError = options?.exchangeError ?? null
    const user = options?.user ?? null

    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: exchangeError })
    const getUser = vi.fn().mockResolvedValue({ data: { user } })
    const profileUpdateEq = vi.fn().mockResolvedValue({ error: null })

    const supabase = {
        auth: {
            exchangeCodeForSession,
            getUser,
        },
        from: vi.fn().mockReturnValue({
            update: vi.fn().mockReturnValue({
                eq: profileUpdateEq,
            }),
        }),
    }

    return {
        supabase,
        exchangeCodeForSession,
        getUser,
        profileUpdateEq,
    }
}

describe('GET /auth/callback', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    })

    it('redirects to login error when code is missing', async () => {
        const { GET } = await import('./route')

        const response = await GET(new Request('https://app.example.com/auth/callback'))

        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('https://app.example.com/auth/login?error=auth')
        expect(createServerClientMock).not.toHaveBeenCalled()
    })

    it('redirects to login error when code exchange fails', async () => {
        const cookieStore = { getAll: vi.fn().mockReturnValue([]), set: vi.fn() }
        cookiesMock.mockResolvedValue(cookieStore)

        const { supabase, exchangeCodeForSession } = buildSupabaseMock({
            exchangeError: { message: 'invalid code' },
        })
        createServerClientMock.mockReturnValue(supabase)

        const { GET } = await import('./route')
        const response = await GET(new Request('https://app.example.com/auth/callback?code=abc'))

        expect(exchangeCodeForSession).toHaveBeenCalledWith('abc')
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('https://app.example.com/auth/login?error=auth')
    })

    it('redirects to next path on successful exchange even when user is null', async () => {
        const cookieStore = { getAll: vi.fn().mockReturnValue([]), set: vi.fn() }
        cookiesMock.mockResolvedValue(cookieStore)

        const { supabase, getUser } = buildSupabaseMock({ user: null })
        createServerClientMock.mockReturnValue(supabase)

        const { GET } = await import('./route')
        const response = await GET(
            new Request('https://app.example.com/auth/callback?code=abc&next=/dashboard/payment'),
        )

        expect(getUser).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('https://app.example.com/dashboard/payment')
    })

    it('uses default next path and skips profile update when metadata has no updatable fields', async () => {
        const cookieStore = { getAll: vi.fn().mockReturnValue([]), set: vi.fn() }
        cookiesMock.mockResolvedValue(cookieStore)

        const { supabase, profileUpdateEq } = buildSupabaseMock({
            user: { id: 'user-1', user_metadata: {} },
        })
        createServerClientMock.mockReturnValue(supabase)

        const { GET } = await import('./route')
        const response = await GET(new Request('https://app.example.com/auth/callback?code=abc'))

        expect(profileUpdateEq).not.toHaveBeenCalled()
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('https://app.example.com/dashboard')
    })

    it('updates profile using avatar and fallback name metadata then redirects', async () => {
        const cookieStore = { getAll: vi.fn().mockReturnValue([]), set: vi.fn() }
        cookiesMock.mockResolvedValue(cookieStore)

        const { supabase, profileUpdateEq } = buildSupabaseMock({
            user: {
                id: 'user-2',
                user_metadata: {
                    avatar_url: 'https://cdn.example/avatar.png',
                    name: 'Fallback Name',
                },
            },
        })
        createServerClientMock.mockReturnValue(supabase)

        const { GET } = await import('./route')
        const response = await GET(
            new Request('https://app.example.com/auth/callback?code=abc&next=/dashboard/live'),
        )

        expect(supabase.from).toHaveBeenCalledWith('profiles')
        const updateCallArg = (supabase.from.mock.results[0].value.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
        expect(updateCallArg).toEqual({
            avatar_url: 'https://cdn.example/avatar.png',
            full_name: 'Fallback Name',
        })
        expect(profileUpdateEq).toHaveBeenCalledWith('id', 'user-2')
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('https://app.example.com/dashboard/live')
    })

    it('covers cookie setAll catch branch when cookieStore.set throws', async () => {
        const cookieStore = {
            getAll: vi.fn().mockReturnValue([]),
            set: vi.fn(() => {
                throw new Error('cannot set cookie')
            }),
        }
        cookiesMock.mockResolvedValue(cookieStore)

        const { supabase } = buildSupabaseMock({ user: null })
        createServerClientMock.mockReturnValue(supabase)

        const { GET } = await import('./route')
        await GET(new Request('https://app.example.com/auth/callback?code=abc'))

        const config = createServerClientMock.mock.calls[0][2] as {
            cookies: {
                getAll: () => Array<unknown>
                setAll: (cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) => void
            }
        }

        expect(config.cookies.getAll()).toEqual([])
        expect(cookieStore.getAll).toHaveBeenCalledTimes(1)

        expect(() => {
            config.cookies.setAll([
                { name: 'sb-test', value: '1', options: {} },
            ])
        }).not.toThrow()
        expect(cookieStore.set).toHaveBeenCalledTimes(1)
    })
})
