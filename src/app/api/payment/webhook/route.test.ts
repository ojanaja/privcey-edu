import { beforeEach, describe, expect, it, vi } from 'vitest'

const verifySignatureMock = vi.fn()
const createClientMock = vi.fn()

vi.mock('@/lib/midtrans', () => ({
    verifySignature: verifySignatureMock,
}))

vi.mock('@supabase/supabase-js', () => ({
    createClient: createClientMock,
}))

vi.mock('@/lib/env', () => ({
    env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    },
    serverEnv: {
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
        MIDTRANS_SERVER_KEY: 'midtrans-secret',
    },
}))

type TransactionRow = {
    id: string
    student_id: string | null
}

function buildWebhookSupabase(options?: {
    transaction?: TransactionRow
    transactionError?: unknown
    profileError?: unknown
}) {
    const transaction = options?.transaction ?? { id: 'tx-1', student_id: null }
    const transactionError = options?.transactionError ?? null
    const profileError = options?.profileError ?? null

    const txSingle = vi.fn().mockResolvedValue({ data: transaction, error: transactionError })
    const txSelect = vi.fn().mockReturnValue({ single: txSingle })
    const txEq = vi.fn().mockReturnValue({ select: txSelect })
    const txUpdate = vi.fn().mockReturnValue({ eq: txEq })

    const profileEq = vi.fn().mockResolvedValue({ error: profileError })
    const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq })

    const from = vi.fn((table: string) => {
        if (table === 'payment_transactions') {
            return { update: txUpdate }
        }
        if (table === 'profiles') {
            return { update: profileUpdate }
        }
        throw new Error(`Unexpected table: ${table}`)
    })

    return {
        from,
        txUpdate,
        profileUpdate,
    }
}

function buildRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/payment/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })
}

describe('POST /api/payment/webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        verifySignatureMock.mockReturnValue('valid-signature')
    })

    it('returns 403 when signature is invalid', async () => {
        const supabase = buildWebhookSupabase()
        createClientMock.mockReturnValue(supabase)

        const { POST } = await import('./route')
        const response = await POST(
            buildRequest({
                order_id: 'ORDER-1',
                status_code: '200',
                gross_amount: '100000',
                signature_key: 'wrong-signature',
                transaction_status: 'pending',
            }),
        )
        const body = await response.json()

        expect(response.status).toBe(403)
        expect(body).toEqual({ error: 'Invalid signature' })
    })

    it.each([
        ['capture', 'accept', 'settlement'],
        ['settlement', undefined, 'settlement'],
        ['capture', 'challenge', 'deny'],
        ['pending', undefined, 'pending'],
        ['expire', undefined, 'expire'],
        ['cancel', undefined, 'cancel'],
        ['deny', undefined, 'deny'],
        ['refund', undefined, 'refund'],
        ['partial_refund', undefined, 'refund'],
        ['unknown_status', undefined, 'pending'],
    ])(
        'maps status %s (%s) to %s',
        async (transactionStatus, fraudStatus, expectedStatus) => {
            const supabase = buildWebhookSupabase({
                transaction: { id: 'tx-1', student_id: null },
            })
            createClientMock.mockReturnValue(supabase)

            const { POST } = await import('./route')
            const response = await POST(
                buildRequest({
                    order_id: 'ORDER-2',
                    status_code: '200',
                    gross_amount: '100000',
                    signature_key: 'valid-signature',
                    transaction_status: transactionStatus,
                    fraud_status: fraudStatus,
                    settlement_time: '2030-01-01T00:00:00.000Z',
                }),
            )
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body).toEqual({ success: true })

            expect(supabase.txUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: expectedStatus,
                }),
            )
        },
    )

    it('returns 500 when transaction update fails', async () => {
        const supabase = buildWebhookSupabase({
            transaction: null as never,
            transactionError: { message: 'update failed' },
        })
        createClientMock.mockReturnValue(supabase)

        const { POST } = await import('./route')
        const response = await POST(
            buildRequest({
                order_id: 'ORDER-3',
                status_code: '200',
                gross_amount: '100000',
                signature_key: 'valid-signature',
                transaction_status: 'pending',
            }),
        )
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body).toEqual({ error: 'Transaction update failed' })
    })

    it('activates profile when settlement is received and student exists', async () => {
        const supabase = buildWebhookSupabase({
            transaction: { id: 'tx-2', student_id: 'student-2' },
        })
        createClientMock.mockReturnValue(supabase)

        const { POST } = await import('./route')
        const response = await POST(
            buildRequest({
                order_id: 'ORDER-4',
                status_code: '200',
                gross_amount: '100000',
                signature_key: 'valid-signature',
                transaction_status: 'settlement',
            }),
        )

        expect(response.status).toBe(200)
        expect(supabase.profileUpdate).toHaveBeenCalledTimes(1)
        expect(supabase.profileUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                payment_status: 'active',
                payment_expires_at: expect.any(String),
                updated_at: expect.any(String),
            }),
        )
    })

    it('still succeeds when profile activation update fails', async () => {
        const supabase = buildWebhookSupabase({
            transaction: { id: 'tx-3', student_id: 'student-3' },
            profileError: { message: 'profile update failed' },
        })
        createClientMock.mockReturnValue(supabase)

        const { POST } = await import('./route')
        const response = await POST(
            buildRequest({
                order_id: 'ORDER-5',
                status_code: '200',
                gross_amount: '100000',
                signature_key: 'valid-signature',
                transaction_status: 'settlement',
            }),
        )
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ success: true })
        expect(supabase.profileUpdate).toHaveBeenCalledTimes(1)
    })

    it('returns 500 when body parsing throws', async () => {
        const supabase = buildWebhookSupabase()
        createClientMock.mockReturnValue(supabase)

        const { POST } = await import('./route')
        const response = await POST(
            new Request('http://localhost/api/payment/webhook', {
                method: 'POST',
                body: '{invalid-json',
            }),
        )
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body).toEqual({ error: 'Internal server error' })
    })
})
