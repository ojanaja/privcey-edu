// @vitest-environment jsdom

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './error-boundary'

describe('ErrorBoundary', () => {
    it('renders default error UI and recovers after reset', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        function ThrowOnce() {
            const hasThrownRef = React.useRef<boolean | null>(null)
            if (hasThrownRef.current === null) {
                hasThrownRef.current = true
                throw new Error('boom')
            }
            return <div>Recovered Child</div>
        }

        render(
            <ErrorBoundary>
                <ThrowOnce />
            </ErrorBoundary>,
        )

        expect(screen.getByText('Terjadi Kesalahan')).toBeTruthy()
        expect(screen.getByText('boom')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
        expect(await screen.findByText('Terjadi Kesalahan')).toBeTruthy()

        consoleErrorSpy.mockRestore()
    })

    it('renders provided fallback when child throws', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        function ThrowAlways() {
            throw new Error('always')
            return null
        }

        render(
            <ErrorBoundary fallback={<div>Custom Fallback</div>}>
                <ThrowAlways />
            </ErrorBoundary>,
        )

        expect(screen.getByText('Custom Fallback')).toBeTruthy()
        consoleErrorSpy.mockRestore()
    })

    it('shows default error description when message is empty', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        function ThrowEmptyMessage() {
            throw new Error('')
            return null
        }

        render(
            <ErrorBoundary>
                <ThrowEmptyMessage />
            </ErrorBoundary>,
        )

        expect(screen.getByText('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')).toBeTruthy()
        consoleErrorSpy.mockRestore()
    })
})
