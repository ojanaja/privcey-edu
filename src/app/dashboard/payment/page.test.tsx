// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()
const authState: { user: { payment_status?: string } | null } = {
    user: { payment_status: 'inactive' },
}

const fetchMock = vi.fn()

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
}))

vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
    },
}))

vi.mock('@/stores/auth-store', () => ({
    useAuthStore: () => authState,
}))

vi.mock('@/components/ui', () => ({
    GlassCard: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
    Button: ({ children, onClick, className, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type="button" onClick={onClick} className={className} disabled={disabled}>{children}</button>
    ),
    Badge: ({ children }: React.HTMLAttributes<HTMLSpanElement>) => <span>{children}</span>,
    LoadingSpinner: ({ className }: { className?: string }) => <div className={className}>Loading...</div>,
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            payment: {
                alreadyActive: 'Already Active',
                alreadyActiveDesc: 'Your account is active',
                backToDashboard: 'Back to Dashboard',
                title: 'Payment',
                subtitle: 'Activate your account',
                monthlyFee: 'Monthly fee',
                benefit1: 'Benefit 1',
                benefit2: 'Benefit 2',
                benefit3: 'Benefit 3',
                benefit4: 'Benefit 4',
                secureNote: 'Secure payment',
                payWithQris: 'Pay with QRIS',
                generatingQris: 'Generating QRIS',
                successTitle: 'Payment Success',
                successDesc: 'Success description',
                startLearning: 'Start Learning',
                expiredTitle: 'Expired',
                expiredDesc: 'QR expired',
                tryAgain: 'Try Again',
                errorTitle: 'Payment Error',
                errorDesc: 'Default error',
                scanQris: 'Scan QRIS',
                scanQrisDesc: 'Scan with app',
                totalPayment: 'Total payment',
                remaining: 'remaining',
                waitingPayment: 'Waiting payment',
                supportedApps: 'Supported Apps',
                payLater: 'Pay Later',
            },
        },
    }),
}))

describe('app/dashboard/payment/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = { payment_status: 'inactive' }
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        cleanup()
    })

    it('renders active account shortcut and navigates back', async () => {
        authState.user = { payment_status: 'active' }
        const { default: PaymentPage } = await import('./page')

        render(<PaymentPage />)

        expect(screen.getByText('Already Active')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }))
        expect(pushMock).toHaveBeenCalledWith('/dashboard')
    })

    it('creates QRIS payment and shows pending view with qr image', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                transaction: {
                    qris_url: 'https://example.com/qris.png',
                    order_id: 'ORDER-1',
                    expires_at: '2099-01-01T00:10:00.000Z',
                    status: 'pending',
                },
            }),
        })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getAllByRole('button', { name: /back to dashboard/i })[0])
        expect(pushMock).toHaveBeenCalledWith('/dashboard')

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Scan QRIS')).toBeTruthy()
            expect(screen.getByAltText('QRIS Payment')).toBeTruthy()
            expect(fetchMock).toHaveBeenCalledWith('/api/payment/create-qris', { method: 'POST' })
        })

        fireEvent.click(screen.getByRole('button', { name: /pay later/i }))
        expect(pushMock).toHaveBeenCalledWith('/dashboard')
    })

    it('shows loading state immediately while creating payment', async () => {
        fetchMock.mockImplementationOnce(() => new Promise(() => { }))

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        expect(screen.getByText('Generating QRIS')).toBeTruthy()
    })

    it('handles create payment error, supports back and retry to idle', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Cannot create payment' }),
        })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Payment Error')).toBeTruthy()
            expect(screen.getByText('Cannot create payment')).toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }))
        expect(pushMock).toHaveBeenCalledWith('/dashboard')

        fireEvent.click(screen.getByRole('button', { name: /try again/i }))

        await waitFor(() => {
            expect(screen.getByText('Payment')).toBeTruthy()
        })
    })

    it('expires from countdown and allows restarting payment', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                transaction: {
                    qris_url: null,
                    order_id: 'ORDER-2',
                    expires_at: '2000-01-01T00:00:00.000Z',
                    status: 'pending',
                },
            }),
        })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Expired')).toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: /try again/i }))

        await waitFor(() => {
            expect(screen.getByText('Payment')).toBeTruthy()
        })
    })

    it('handles polling cancel status and shows declined error', async () => {
        const setIntervalSpy = vi
            .spyOn(globalThis, 'setInterval')
            .mockImplementation(((callback: TimerHandler) => {
                Promise.resolve().then(() => {
                    if (typeof callback === 'function') callback()
                })
                return 1 as unknown as NodeJS.Timeout
            }) as typeof setInterval)

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    transaction: {
                        qris_url: 'https://example.com/qris.png',
                        order_id: 'ORDER-3',
                        expires_at: '2099-01-01T00:10:00.000Z',
                        status: 'pending',
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'cancel' }),
            })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Payment Error')).toBeTruthy()
            expect(screen.getByText('Payment was declined')).toBeTruthy()
        })

        setIntervalSpy.mockRestore()
    })

    it('handles polling deny status and unknown status fallback', async () => {
        const setIntervalSpy = vi
            .spyOn(globalThis, 'setInterval')
            .mockImplementation(((callback: TimerHandler) => {
                if (typeof callback === 'function') Promise.resolve().then(() => callback())
                return 1 as unknown as NodeJS.Timeout
            }) as typeof setInterval)

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    transaction: {
                        qris_url: 'https://example.com/qris-deny.png',
                        order_id: 'ORDER-DENY',
                        expires_at: '2099-01-01T00:10:00.000Z',
                        status: 'pending',
                    },
                }),
            })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'deny' }) })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)
        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Payment Error')).toBeTruthy()
            expect(screen.getByText('Payment was declined')).toBeTruthy()
        })

        cleanup()
        fetchMock.mockReset()
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    transaction: {
                        qris_url: 'https://example.com/qris-unknown.png',
                        order_id: 'ORDER-UNKNOWN',
                        expires_at: '2099-01-01T00:10:00.000Z',
                        status: 'pending',
                    },
                }),
            })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'pending' }) })

        render(<PaymentPage />)
        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Scan QRIS')).toBeTruthy()
            expect(screen.queryByText('Payment Error')).toBeNull()
            expect(screen.queryByText('Expired')).toBeNull()
        })

        setIntervalSpy.mockRestore()
    })

    it('handles polling settlement status and allows start learning', async () => {
        const setIntervalSpy = vi
            .spyOn(globalThis, 'setInterval')
            .mockImplementation(((callback: TimerHandler) => {
                Promise.resolve().then(() => {
                    if (typeof callback === 'function') callback()
                })
                return 1 as unknown as NodeJS.Timeout
            }) as typeof setInterval)

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    transaction: {
                        qris_url: 'https://example.com/qris.png',
                        order_id: 'ORDER-4',
                        expires_at: '2099-01-01T00:10:00.000Z',
                        status: 'pending',
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'settlement' }),
            })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Payment Success')).toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: /start learning/i }))

        setIntervalSpy.mockRestore()
    })

    it('handles direct settlement from create response', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                transaction: {
                    qris_url: 'https://example.com/qris.png',
                    order_id: 'ORDER-5',
                    expires_at: '2099-01-01T00:10:00.000Z',
                    status: 'settlement',
                },
            }),
        })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))
        await waitFor(() => expect(screen.getByText('Payment Success')).toBeTruthy())
    })

    it('shows default error description when error message is empty', async () => {
        fetchMock.mockRejectedValueOnce(new Error(''))

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Payment Error')).toBeTruthy()
            expect(screen.getByText('Default error')).toBeTruthy()
        })
    })

    it('uses fallback error messages for API and non-Error throws', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)
        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Failed to create payment')).toBeTruthy()
        })

        cleanup()
        fetchMock.mockReset()
        fetchMock.mockRejectedValueOnce('string-error')

        render(<PaymentPage />)
        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Something went wrong')).toBeTruthy()
        })
    })

    it('handles cleanup branches when interval refs are falsy', async () => {
        const intervalSpy = vi.spyOn(globalThis, 'setInterval').mockReturnValue(0 as unknown as NodeJS.Timeout)

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                transaction: {
                    qris_url: 'https://example.com/qris-cleanup.png',
                    order_id: 'ORDER-CLEANUP',
                    expires_at: '2099-01-01T00:10:00.000Z',
                    status: 'pending',
                },
            }),
        })

        const { default: PaymentPage } = await import('./page')
        const view = render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))
        await waitFor(() => {
            expect(screen.getByText('Scan QRIS')).toBeTruthy()
        })

        view.unmount()

        intervalSpy.mockRestore()
    })

    it('handles polling failure warning branch', async () => {
        const setIntervalSpy = vi
            .spyOn(globalThis, 'setInterval')
            .mockImplementation(((callback: TimerHandler) => {
                if (typeof callback === 'function') Promise.resolve().then(() => callback())
                return 1 as unknown as NodeJS.Timeout
            }) as typeof setInterval)

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    transaction: {
                        qris_url: 'https://example.com/qris2.png',
                        order_id: 'ORDER-6',
                        expires_at: '2099-01-01T00:10:00.000Z',
                        status: 'pending',
                    },
                }),
            })
            .mockRejectedValueOnce(new Error('poll failed'))

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))
        await waitFor(() => expect(screen.getByText('Scan QRIS')).toBeTruthy())

        await waitFor(() => {
            expect(warnSpy).toHaveBeenCalled()
        })

        warnSpy.mockRestore()
        setIntervalSpy.mockRestore()
    })

    it('handles polling expire status branch', async () => {
        const setIntervalSpy = vi
            .spyOn(globalThis, 'setInterval')
            .mockImplementation(((callback: TimerHandler) => {
                if (typeof callback === 'function') Promise.resolve().then(() => callback())
                return 1 as unknown as NodeJS.Timeout
            }) as typeof setInterval)

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    transaction: {
                        qris_url: 'https://example.com/qris3.png',
                        order_id: 'ORDER-7',
                        expires_at: '2099-01-01T00:10:00.000Z',
                        status: 'pending',
                    },
                }),
            })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'expire' }) })

        const { default: PaymentPage } = await import('./page')
        render(<PaymentPage />)

        fireEvent.click(screen.getByRole('button', { name: /pay with qris/i }))

        await waitFor(() => {
            expect(screen.getByText('Expired')).toBeTruthy()
        })

        setIntervalSpy.mockRestore()
    })
})
