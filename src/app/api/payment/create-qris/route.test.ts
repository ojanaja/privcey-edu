import { beforeEach, describe, expect, it, vi } from 'vitest'

const createQrisChargeMock = vi.fn()
const createClientMock = vi.fn()
const createSupabaseClientMock = vi.fn()

vi.mock('@/lib/midtrans', () => ({
    createQrisCharge: createQrisChargeMock,
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}))

vi.mock('@supabase/supabase-js', () => ({
    createClient: createSupabaseClientMock,
}))

vi.mock('@/lib/env', () => ({
    env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    },
    serverEnv: {
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
        MIDTRANS_SERVER_KEY: 'midtrans-key',
        MIDTRANS_IS_PRODUCTION: 'false',
    },
}))

type UserResult = { user: { id: string } | null }
type ProfileResult = {
    data: { id: string; full_name: string | null; email: string } | null
    error: unknown
}
type ExistingResult = {
    data:
    | {
        order_id: string
        amount: number
        qris_url: string
        expires_at: string
    }
    | null
    error: unknown
}
type InsertResult = { error: unknown }

function buildSupabaseMock(options?: {
    userResult?: UserResult
    profileResult?: ProfileResult
    existingResult?: ExistingResult
    insertResult?: InsertResult
}) {
    const userResult = options?.userResult ?? { user: { id: 'student-1' } }
    const profileResult =
        options?.profileResult ?? {
            data: { id: 'student-1', full_name: 'Student Name', email: 'student@example.com' },
            error: null,
        }
    const existingResult = options?.existingResult ?? { data: null, error: null }
    const insertResult = options?.insertResult ?? { error: null }

    const authGetUser = vi.fn().mockResolvedValue({ data: userResult })
    const profileSingle = vi.fn().mockResolvedValue(profileResult)
    const paymentMaybeSingle = vi.fn().mockResolvedValue(existingResult)
    const paymentInsert = vi.fn().mockResolvedValue(insertResult)

    const paymentSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: paymentMaybeSingle,
    }

    const profileSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: profileSingle,
    }

    const paymentTable = {
        select: vi.fn().mockReturnValue(paymentSelectBuilder),
        insert: paymentInsert,
    }

    const profileTable = {
        select: vi.fn().mockReturnValue(profileSelectBuilder),
    }

    const from = vi.fn((table: string) => {
        if (table === 'profiles') return profileTable
        if (table === 'payment_transactions') return paymentTable
        throw new Error(`Unexpected table: ${table}`)
    })

    return {
        auth: { getUser: authGetUser },
        from,
        paymentInsert,
    }
}

describe('POST /api/payment/create-qris', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        createSupabaseClientMock.mockReturnValue({
            from: vi.fn().mockReturnValue({
                insert: vi.fn().mockResolvedValue({ error: null }),
            }),
        })
    })

    it('returns 401 when unauthenticated', async () => {
        const supabase = buildSupabaseMock({ userResult: { user: null } })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(401)
        expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('returns 404 when profile is missing', async () => {
        const supabase = buildSupabaseMock({
            profileResult: { data: null, error: { message: 'not found' } },
        })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(404)
        expect(body).toEqual({ error: 'Profile not found' })
    })

    it('returns existing pending transaction when available', async () => {
        const expiresAt = '2030-01-01T00:00:00.000Z'
        const supabase = buildSupabaseMock({
            existingResult: {
                data: {
                    order_id: 'ORDER-EXISTING',
                    gross_amount: 70000,
                    qris_url: 'https://midtrans.example/existing',
                    expires_at: expiresAt,
                    status: 'pending',
                },
                error: null,
            },
        })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.transaction).toEqual({
            order_id: 'ORDER-EXISTING',
            gross_amount: 70000,
            qris_url: 'https://midtrans.example/existing',
            expires_at: expiresAt,
            status: 'pending',
        })
        expect(createQrisChargeMock).not.toHaveBeenCalled()
        expect(supabase.paymentInsert).not.toHaveBeenCalled()
    })

    it('creates a new qris payment and stores transaction', async () => {
        createQrisChargeMock.mockResolvedValue({
            transaction_id: 'trx-123',
            actions: [{ name: 'generate-qr-code', url: 'https://midtrans.example/new-qr' }],
            expiry_time: '2030-01-01 00:00:00',
        })

        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.transaction.order_id).toContain('PRIVCEY-')
        expect(body.transaction.gross_amount).toBe(70000)
        expect(body.transaction.qris_url).toBe('https://midtrans.example/new-qr')
        expect(body.transaction.expires_at).toBe('2030-01-01 00:00:00')
        expect(body.transaction.status).toBe('pending')

        expect(supabase.paymentInsert).toHaveBeenCalledTimes(1)
        expect(supabase.paymentInsert.mock.calls[0][0]).toMatchObject({
            student_id: 'student-1',
            gross_amount: 70000,
            status: 'pending',
            payment_type: 'qris',
            midtrans_transaction_id: 'trx-123',
            qris_url: 'https://midtrans.example/new-qr',
            expires_at: '2030-01-01 00:00:00',
        })
    })

    it('handles optional qris url and expiry fallbacks', async () => {
        createQrisChargeMock.mockResolvedValue({
            transaction_id: 'trx-456',
            actions: [{ name: 'other-action', url: 'https://ignore.example' }],
        })

        const supabase = buildSupabaseMock({
            profileResult: {
                data: { id: 'student-1', full_name: null, email: 'fallback@example.com' },
                error: null,
            },
        })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.transaction.qris_url).toBeNull()
        expect(body.transaction.expires_at).toBeUndefined()

        expect(createQrisChargeMock).toHaveBeenCalledWith(
            expect.objectContaining({ customerName: 'fallback@example.com' }),
        )
    })

    it('returns 500 when storing transaction fails', async () => {
        createQrisChargeMock.mockResolvedValue({
            transaction_id: 'trx-789',
            actions: [{ name: 'generate-qr-code', url: 'https://midtrans.example/fail' }],
            expiry_time: '2030-01-01 00:00:00',
        })

        const supabase = buildSupabaseMock({
            insertResult: { error: { message: 'insert failed' } },
        })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body).toEqual({ error: 'Failed to save transaction' })
    })

    it('retries insert with service role when blocked by RLS', async () => {
        createQrisChargeMock.mockResolvedValue({
            transaction_id: 'trx-rls',
            actions: [{ name: 'generate-qr-code', url: 'https://midtrans.example/rls' }],
            expiry_time: '2030-01-01 00:00:00',
        })

        const serviceInsert = vi.fn().mockResolvedValue({ error: null })
        const serviceFrom = vi.fn().mockReturnValue({ insert: serviceInsert })
        createSupabaseClientMock.mockReturnValue({ from: serviceFrom })

        const supabase = buildSupabaseMock({
            insertResult: { error: { message: 'new row violates row-level security policy', code: '42501' } },
        })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(createSupabaseClientMock).toHaveBeenCalledTimes(1)
        expect(serviceFrom).toHaveBeenCalledWith('payment_transactions')
        expect(serviceInsert).toHaveBeenCalledTimes(1)
    })

    it('returns 500 when provider throws', async () => {
        createQrisChargeMock.mockRejectedValue(new Error('midtrans down'))

        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body).toEqual({ error: 'Failed to create payment. Please try again.' })
    })

    it('returns config error when MIDTRANS_SERVER_KEY is missing', async () => {
        createQrisChargeMock.mockRejectedValue(new Error('Missing MIDTRANS_SERVER_KEY environment variable'))

        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const response = await POST()
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body).toEqual({ error: 'Payment configuration error: MIDTRANS_SERVER_KEY is not set' })
    })
})
