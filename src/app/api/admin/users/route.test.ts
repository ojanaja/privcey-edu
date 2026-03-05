import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}))

vi.mock('@supabase/supabase-js', () => ({
    createClient: createAdminClientMock,
}))

function createAwaitableQuery<T>(result: T) {
    const promise = Promise.resolve(result) as Promise<T> & {
        eq: ReturnType<typeof vi.fn>
        or: ReturnType<typeof vi.fn>
    }
    promise.eq = vi.fn().mockReturnValue(promise)
    promise.or = vi.fn().mockReturnValue(promise)
    return promise
}

function buildServerSupabase(options?: {
    user?: { id: string } | null
    role?: string | null
    joinResult?: { data: Array<Record<string, unknown>> | null; error: { message: string } | null }
    fallbackResult?: { data: Array<Record<string, unknown>> | null; error: { message: string } | null }
    patchResult?: { data: Record<string, unknown> | null; error: { message: string } | null }
}) {
    const user = options?.user === undefined ? { id: 'admin-1' } : options.user
    const role = options?.role === undefined ? 'admin' : options.role
    const joinResult = options?.joinResult ?? { data: [{ id: 'u1' }], error: null }
    const fallbackResult = options?.fallbackResult ?? { data: [{ id: 'u1-fb' }], error: null }
    const patchResult = options?.patchResult ?? { data: { id: 'u2' }, error: null }

    const authGetUser = vi.fn().mockResolvedValue({ data: { user } })
    const roleSingle = vi.fn().mockResolvedValue({ data: role ? { role } : null })

    const joinQuery = createAwaitableQuery(joinResult)
    const fallbackQuery = createAwaitableQuery(fallbackResult)

    const profilesSelect = vi.fn((cols: string) => {
        if (cols === 'role') {
            return {
                eq: vi.fn().mockReturnValue({ single: roleSingle }),
            }
        }

        if (cols === '*, class_groups(name)') {
            return {
                order: vi.fn().mockReturnValue(joinQuery),
            }
        }

        if (cols === '*') {
            return {
                order: vi.fn().mockReturnValue(fallbackQuery),
            }
        }

        throw new Error(`Unexpected profiles select: ${cols}`)
    })

    const patchSingle = vi.fn().mockResolvedValue(patchResult)

    const profilesTable = {
        select: profilesSelect,
        update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({ single: patchSingle }),
            }),
        }),
    }

    const from = vi.fn((table: string) => {
        if (table === 'profiles') return profilesTable
        throw new Error(`Unexpected table: ${table}`)
    })

    return {
        auth: { getUser: authGetUser },
        from,
        joinQuery,
        fallbackQuery,
        profilesTable,
    }
}

function buildAdminSupabase(options?: {
    createUserError?: { message: string } | null
    profileError?: { message: string } | null
}) {
    const createUserError = options?.createUserError ?? null
    const profileError = options?.profileError ?? null

    const createUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'new-user-1' } },
        error: createUserError,
    })

    const profileUpdateEq = vi.fn().mockResolvedValue({ error: profileError })
    const profileSelectSingle = vi.fn().mockResolvedValue({
        data: { id: 'new-user-1', full_name: 'New Tutor', role: 'tutor' },
    })

    const from = vi.fn((table: string) => {
        if (table === 'profiles') {
            return {
                update: vi.fn().mockReturnValue({ eq: profileUpdateEq }),
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({ single: profileSelectSingle }),
                }),
            }
        }
        throw new Error(`Unexpected admin table: ${table}`)
    })

    return {
        auth: { admin: { createUser } },
        from,
        createUser,
        profileUpdateEq,
    }
}

describe('admin/users route', () => {
    const originalEnv = process.env

    beforeEach(() => {
        vi.clearAllMocks()
        process.env = {
            ...originalEnv,
            SUPABASE_SERVICE_ROLE_KEY: 'service-key',
            NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        }
    })

    it('GET returns 401 when unauthenticated', async () => {
        const supabase = buildServerSupabase({ user: null })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET(new Request('http://localhost/api/admin/users') as never)
        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('GET returns 403 for non-admin', async () => {
        const supabase = buildServerSupabase({ role: 'student' })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET(new Request('http://localhost/api/admin/users') as never)
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Forbidden' })
    })

    it('GET returns users with role and sanitized search filters', async () => {
        const supabase = buildServerSupabase({ joinResult: { data: [{ id: 'u1' }], error: null } })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET(new Request('http://localhost/api/admin/users?role=tutor&search=a%25_b') as never)
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body).toEqual({ users: [{ id: 'u1' }] })
        expect(supabase.joinQuery.eq).toHaveBeenCalledWith('role', 'tutor')
        expect(supabase.joinQuery.or).toHaveBeenCalledWith('full_name.ilike.%a\\%\\_b%,email.ilike.%a\\%\\_b%')
    })

    it('GET falls back to non-join query when join fails', async () => {
        const supabase = buildServerSupabase({
            joinResult: { data: null, error: { message: 'join failed' } },
            fallbackResult: { data: [{ id: 'fallback' }], error: null },
        })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET(new Request('http://localhost/api/admin/users?role=all&search=abc') as never)
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ users: [{ id: 'fallback' }] })
        expect(supabase.fallbackQuery.or).toHaveBeenCalledWith('full_name.ilike.%abc%,email.ilike.%abc%')
    })

    it('GET fallback also applies role filter when role is specific', async () => {
        const supabase = buildServerSupabase({
            joinResult: { data: null, error: { message: 'join failed' } },
            fallbackResult: { data: [{ id: 'fallback-role' }], error: null },
        })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET(new Request('http://localhost/api/admin/users?role=tutor') as never)
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ users: [{ id: 'fallback-role' }] })
        expect(supabase.fallbackQuery.eq).toHaveBeenCalledWith('role', 'tutor')
    })

    it('GET returns 500 when fallback also fails', async () => {
        const supabase = buildServerSupabase({
            joinResult: { data: null, error: { message: 'join failed' } },
            fallbackResult: { data: null, error: { message: 'fallback failed' } },
        })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET(new Request('http://localhost/api/admin/users') as never)
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'fallback failed' })
    })

    it('GET handles unexpected error', async () => {
        createClientMock.mockRejectedValue(new Error('unexpected get'))
        const { GET } = await import('./route')

        const res = await GET(new Request('http://localhost/api/admin/users') as never)
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'Error: unexpected get' })
    })

    it('POST validates required fields and password length', async () => {
        const supabase = buildServerSupabase()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const missing = await POST(new Request('http://localhost/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email: '', password: '', fullName: '' }),
        }) as never)
        expect(missing.status).toBe(400)

        const shortPass = await POST(new Request('http://localhost/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email: 'a@b.com', password: 'short', fullName: 'A' }),
        }) as never)
        expect(shortPass.status).toBe(400)
    })

    it('POST returns auth error for non-admin requester', async () => {
        const supabase = buildServerSupabase({ role: 'student' })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const res = await POST(new Request('http://localhost/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email: 'a@b.com', password: 'Password1', fullName: 'A' }),
        }) as never)

        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Forbidden' })
    })

    it('POST returns 500 when service role key missing', async () => {
        const supabase = buildServerSupabase()
        createClientMock.mockResolvedValue(supabase)
        delete process.env.SUPABASE_SERVICE_ROLE_KEY

        const { POST } = await import('./route')
        const res = await POST(new Request('http://localhost/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email: 'a@b.com', password: 'Password1', fullName: 'A' }),
        }) as never)

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' })
    })

    it('POST returns 500 when auth user creation fails', async () => {
        const supabase = buildServerSupabase()
        const adminSupabase = buildAdminSupabase({ createUserError: { message: 'auth failed' } })
        createClientMock.mockResolvedValue(supabase)
        createAdminClientMock.mockReturnValue(adminSupabase)

        const { POST } = await import('./route')
        const res = await POST(new Request('http://localhost/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email: 'a@b.com', password: 'Password1', fullName: 'A', role: 'invalid-role' }),
        }) as never)

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'Gagal membuat user: auth failed' })
        expect(adminSupabase.createUser).toHaveBeenCalledWith(
            expect.objectContaining({
                user_metadata: expect.objectContaining({ role: 'tutor' }),
            }),
        )
    })

    it('POST returns 500 when profile update fails after user creation', async () => {
        const supabase = buildServerSupabase()
        const adminSupabase = buildAdminSupabase({ profileError: { message: 'profile failed' } })
        createClientMock.mockResolvedValue(supabase)
        createAdminClientMock.mockReturnValue(adminSupabase)

        const { POST } = await import('./route')
        const res = await POST(new Request('http://localhost/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email: 'a@b.com', password: 'Password1', fullName: 'A', role: 'admin' }),
        }) as never)

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'User dibuat tapi gagal set role: profile failed' })
    })

    it('POST creates user and returns 201', async () => {
        const supabase = buildServerSupabase()
        const adminSupabase = buildAdminSupabase()
        createClientMock.mockResolvedValue(supabase)
        createAdminClientMock.mockReturnValue(adminSupabase)

        const { POST } = await import('./route')
        const res = await POST(new Request('http://localhost/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email: 'a@b.com', password: 'Password1', fullName: 'A', role: 'admin' }),
        }) as never)
        const body = await res.json()

        expect(res.status).toBe(201)
        expect(body.user).toEqual({ id: 'new-user-1', full_name: 'New Tutor', role: 'tutor' })
    })

    it('PATCH validates input and self-role guard, then updates', async () => {
        const supabase = buildServerSupabase()
        createClientMock.mockResolvedValue(supabase)
        const { PATCH } = await import('./route')

        const missingUserId = await PATCH(new Request('http://localhost/api/admin/users', {
            method: 'PATCH',
            body: JSON.stringify({ role: 'tutor' }),
        }) as never)
        expect(missingUserId.status).toBe(400)

        const selfRole = await PATCH(new Request('http://localhost/api/admin/users', {
            method: 'PATCH',
            body: JSON.stringify({ userId: 'admin-1', role: 'tutor' }),
        }) as never)
        expect(selfRole.status).toBe(400)

        const ok = await PATCH(new Request('http://localhost/api/admin/users', {
            method: 'PATCH',
            body: JSON.stringify({
                userId: 'user-2',
                role: 'tutor',
                classId: 'class-1',
                isActive: true,
                paymentStatus: 'active',
                paymentExpiresAt: '2030-01-01T00:00:00.000Z',
            }),
        }) as never)
        expect(ok.status).toBe(200)
        expect(await ok.json()).toEqual({ user: { id: 'u2' } })
    })

    it('PATCH returns auth error for non-admin requester', async () => {
        const supabase = buildServerSupabase({ role: 'student' })
        createClientMock.mockResolvedValue(supabase)
        const { PATCH } = await import('./route')

        const res = await PATCH(new Request('http://localhost/api/admin/users', {
            method: 'PATCH',
            body: JSON.stringify({ userId: 'user-2' }),
        }) as never)

        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Forbidden' })
    })

    it('PATCH returns 500 on update error', async () => {
        const supabase = buildServerSupabase({
            patchResult: { data: null, error: { message: 'patch fail' } },
        })
        createClientMock.mockResolvedValue(supabase)
        const { PATCH } = await import('./route')

        const res = await PATCH(new Request('http://localhost/api/admin/users', {
            method: 'PATCH',
            body: JSON.stringify({ userId: 'user-3' }),
        }) as never)

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'patch fail' })
    })
})
