// @vitest-environment jsdom

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: replaceMock,
    }),
}))

describe('app/auth/register/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('redirects to login on mount', async () => {
        const { default: RegisterPage } = await import('./page')

        const { container } = render(<RegisterPage />)

        await waitFor(() => {
            expect(replaceMock).toHaveBeenCalledWith('/auth/login')
        })

        expect(container.firstChild).toBeNull()
    })
})
