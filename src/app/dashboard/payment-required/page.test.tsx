// @vitest-environment jsdom

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}))

vi.mock('@/components/ui', () => ({
    GlassCard: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" {...props}>{children}</button>,
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            paymentRequired: {
                title: 'Payment Required',
                description: 'Please activate your account first',
                whatsappMessage: 'Halo admin, saya ingin aktivasi akun',
                contactAdmin: 'Contact Admin',
                backToDashboard: 'Back to Dashboard',
            },
            payment: {
                payWithQris: 'Pay with QRIS',
            },
        },
    }),
}))

describe('app/dashboard/payment-required/page', () => {
    it('renders title, description, and action links', async () => {
        const { default: PaymentRequiredPage } = await import('./page')

        render(<PaymentRequiredPage />)

        expect(screen.getByText('Payment Required')).toBeTruthy()
        expect(screen.getByText('Please activate your account first')).toBeTruthy()

        const payLink = screen.getByRole('link', { name: /pay with qris/i })
        expect(payLink.getAttribute('href')).toBe('/dashboard/payment')

        const backLink = screen.getByRole('link', { name: /back to dashboard/i })
        expect(backLink.getAttribute('href')).toBe('/dashboard')

        const whatsappLink = screen.getByRole('link', { name: /contact admin/i })
        expect(whatsappLink.getAttribute('href')).toContain('https://wa.me/62XXXXXXXXXX?text=')
        expect(whatsappLink.getAttribute('target')).toBe('_blank')
        expect(whatsappLink.getAttribute('rel')).toBe('noreferrer')
    })
})
