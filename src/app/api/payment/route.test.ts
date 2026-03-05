import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}))

type UserResult = { user: { id: string } | null }
type AdminProfileResult = { data: { role: string } | null }
type UpdateResult = { error: { message: string } | null }

function buildSupabaseMock(options?: {
    userResult?: UserResult
    adminProfileResult?: AdminProfileResult
    updateResult?: UpdateResult
}) {
    const userResult = options?.userResult ?? { user: { id: 'admin-1' } }
    const adminProfileResult = options?.adminProfileResult ?? { data: { role: 'admin' } }
    const updateResult = options?.updateResult ?? { error: null }

    const authGetUser = vi.fn().mockResolvedValue({ data: userResult })
    const profileSelectSingle = vi.fn().mockResolvedValue(adminProfileResult)
    const profileUpdateEq = vi.fn().mockResolvedValue(updateResult)

    const profilesTable = {
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: profileSelectSingle }),
        }),
        update: vi.fn().mockReturnValue({ eq: profileUpdateEq }),
    }

    const from = vi.fn((table: string) => {
        if (table === 'profiles') {
            return profilesTable
        }
        throw new Error(`Unexpected table: ${table}`)
    })

    return {
        auth: { getUser: authGetUser },
        from,
        profilesTable,
        profileUpdateEq,
    }
}

function buildRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })
}

describe('POST /api/payment', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 401 when unauthenticated', async () => {
        const supabase = buildSupabaseMock({ userResult: { user: null } })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST(buildRequest({ student_id: 'student-1', payment_status: 'active' }))
        const body = await response.json()

        expect(response.status).toBe(401)
        expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('returns 403 when admin profile is missing', async () => {
        const supabase = buildSupabaseMock({ adminProfileResult: { data: null } })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST(buildRequest({ student_id: 'student-1', payment_status: 'active' }))
        const body = await response.json()

        expect(response.status).toBe(403)
        expect(body).toEqual({ error: 'Forbidden' })
    })

    it('returns 403 when user is not admin', async () => {
        const supabase = buildSupabaseMock({ adminProfileResult: { data: { role: 'student' } } })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST(buildRequest({ student_id: 'student-1', payment_status: 'active' }))
        const body = await response.json()

        expect(response.status).toBe(403)
        expect(body).toEqual({ error: 'Forbidden' })
    })

    it('returns 400 when student_id is missing', async () => {
        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST(buildRequest({ payment_status: 'active' }))
        const body = await response.json()

        expect(response.status).toBe(400)
        expect(body).toEqual({ error: 'student_id and payment_status required' })
    })

    it('returns 400 when payment_status is missing', async () => {
        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST(buildRequest({ student_id: 'student-1' }))
        const body = await response.json()

        expect(response.status).toBe(400)
        expect(body).toEqual({ error: 'student_id and payment_status required' })
    })

    it('returns 500 when profile update fails', async () => {
        const supabase = buildSupabaseMock({ updateResult: { error: { message: 'update failed' } } })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST(buildRequest({ student_id: 'student-1', payment_status: 'active' }))
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body).toEqual({ error: 'update failed' })
    })

    it('updates to active status with expiry and returns success', async () => {
        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST(buildRequest({ student_id: 'student-1', payment_status: 'active' }))
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ success: true })

        const updateArg = supabase.profilesTable.update.mock.calls[0][0]
        expect(updateArg).toEqual(
            expect.objectContaining({
                payment_status: 'active',
                payment_expires_at: expect.any(String),
            }),
        )
        expect(supabase.profileUpdateEq).toHaveBeenCalledWith('id', 'student-1')
    })

    it('updates to non-active status with null expiry', async () => {
        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST(buildRequest({ student_id: 'student-1', payment_status: 'inactive' }))
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ success: true })

        const updateArg = supabase.profilesTable.update.mock.calls[0][0]
        expect(updateArg).toEqual({
            payment_status: 'inactive',
            payment_expires_at: null,
        })
    })
})
