// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import '@/app/dashboard/test-utils/smoke-mocks'
import { resetDashboardSmokeEnv } from '@/app/dashboard/test-utils/smoke-mocks'

describe('app/dashboard/latsol/[id]/page', () => {
    beforeEach(() => {
        resetDashboardSmokeEnv()
    })

    afterEach(() => {
        cleanup()
    })

    it('renders without crashing', async () => {
        const { default: Page } = await import('./page')
        render(<Page params={Promise.resolve({ id: 'ex-1' })} />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).toBeNull()
        })
    })
})
