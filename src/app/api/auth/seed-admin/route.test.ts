import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
    createClient: createClientMock,
}))

function buildAdminSupabase(options?: {
    existingProfile?: { id: string; email: string; role: string } | null
    authError?: { message: string } | null
    profileError?: { message: string } | null
}) {
    const existingProfile =
        options?.existingProfile === undefined
            ? null
            : options.existingProfile
    const authError = options?.authError ?? null
    const profileError = options?.profileError ?? null

    const selectSingle = vi.fn().mockResolvedValue({ data: existingProfile })
    const updateEq = vi.fn().mockResolvedValue({ error: profileError })
    const createUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-new-1', email: 'admin@example.com' } },
        error: authError,
    })

    const from = vi.fn((table: string) => {
        if (table !== 'profiles') {
            throw new Error(`Unexpected table: ${table}`)
        }

        return {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        single: selectSingle,
                    }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: updateEq,
            }),
        }
    })

    return {
        auth: { admin: { createUser } },
        from,
        createUser,
        updateEq,
    }
}

function buildRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/auth/seed-admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })
}

describe('POST /api/auth/seed-admin', () => {
    const originalEnv = process.env

    beforeEach(() => {
        vi.clearAllMocks()
        process.env = {
            ...originalEnv,
            SEED_SECRET: 'seed-secret',
            SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
            NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it('returns 403 when seed secret is missing in environment', async () => {
        delete process.env.SEED_SECRET
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'seed-secret',
                email: 'admin@example.com',
                password: 'Password1',
                fullName: 'Admin',
            }),
        )

        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Invalid or missing seed secret' })
    })

    it('returns 403 when provided seed secret is invalid', async () => {
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'wrong-secret',
                email: 'admin@example.com',
                password: 'Password1',
                fullName: 'Admin',
            }),
        )

        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Invalid or missing seed secret' })
    })

    it('returns 400 when required fields are missing', async () => {
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'seed-secret',
                email: '',
                password: '',
                fullName: '',
            }),
        )

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'email, password, and fullName are required' })
    })

    it('returns 400 when password is too short', async () => {
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'seed-secret',
                email: 'admin@example.com',
                password: '12345',
                fullName: 'Admin',
            }),
        )

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Password minimal 6 karakter' })
    })

    it('returns 500 when service role key is not configured', async () => {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'seed-secret',
                email: 'admin@example.com',
                password: 'Password1',
                fullName: 'Admin',
            }),
        )

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured on server' })
    })

    it('returns 409 when super admin already exists', async () => {
        const adminSupabase = buildAdminSupabase({
            existingProfile: { id: 'admin-1', email: 'existing@example.com', role: 'admin' },
        })
        createClientMock.mockReturnValue(adminSupabase)
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'seed-secret',
                email: 'admin@example.com',
                password: 'Password1',
                fullName: 'Admin',
            }),
        )

        expect(res.status).toBe(409)
        expect(await res.json()).toEqual({ error: 'Super admin sudah ada: existing@example.com' })
    })

    it('returns 500 when auth user creation fails', async () => {
        const adminSupabase = buildAdminSupabase({
            authError: { message: 'auth create failed' },
        })
        createClientMock.mockReturnValue(adminSupabase)
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'seed-secret',
                email: 'admin@example.com',
                password: 'Password1',
                fullName: 'Admin',
            }),
        )

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'Failed to create auth user: auth create failed' })
    })

    it('returns 500 when profile update fails', async () => {
        const adminSupabase = buildAdminSupabase({
            profileError: { message: 'profile update failed' },
        })
        createClientMock.mockReturnValue(adminSupabase)
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'seed-secret',
                email: 'admin@example.com',
                password: 'Password1',
                fullName: 'Admin',
            }),
        )

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'Profile created but update failed: profile update failed' })
    })

    it('creates super admin successfully', async () => {
        const adminSupabase = buildAdminSupabase()
        createClientMock.mockReturnValue(adminSupabase)
        const { POST } = await import('./route')

        const res = await POST(
            buildRequest({
                seedSecret: 'seed-secret',
                email: 'admin@example.com',
                password: 'Password1',
                fullName: 'Admin Name',
            }),
        )
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body).toEqual({
            success: true,
            message: 'Super admin berhasil dibuat!',
            user: {
                id: 'admin-new-1',
                email: 'admin@example.com',
                fullName: 'Admin Name',
                role: 'admin',
            },
        })

        expect(adminSupabase.createUser).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'admin@example.com',
                password: 'Password1',
                user_metadata: expect.objectContaining({
                    full_name: 'Admin Name',
                    role: 'admin',
                }),
            }),
        )
        expect(adminSupabase.updateEq).toHaveBeenCalledWith('id', 'admin-new-1')
    })
})
