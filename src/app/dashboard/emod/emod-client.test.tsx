// @vitest-environment jsdom

import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import '@/app/dashboard/test-utils/smoke-mocks'
import { resetDashboardSmokeEnv } from '@/app/dashboard/test-utils/smoke-mocks'

describe('app/dashboard/emod/emod-client', () => {
    beforeEach(() => {
        resetDashboardSmokeEnv()
    })

    afterEach(() => {
        cleanup()
    })

    it('renders without crashing', async () => {
        const { EmodClientPage } = await import('./emod-client')
        const commonSubject = { id: 's-1', name: 'Math', icon: '📘', created_at: '', updated_at: '' }

        const { container } = render(
            <EmodClientPage
                initialEmods={[
                    {
                        id: 'e-1',
                        title: 'Module 1',
                        drive_url: 'https://example.com/mod',
                        chapter: '1',
                        order: 1,
                        is_active: true,
                        created_by: 'u-1',
                        created_at: '',
                        updated_at: '',
                        description: null,
                        subject_id: 's-1',
                        subject: commonSubject,
                    },
                ] as any}
            />
        )

        expect(container.firstChild).toBeTruthy()
    })
})
