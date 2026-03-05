// @vitest-environment jsdom

import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import '@/app/dashboard/test-utils/smoke-mocks'
import { resetDashboardSmokeEnv } from '@/app/dashboard/test-utils/smoke-mocks'

describe('app/dashboard/live/live-client', () => {
    beforeEach(() => {
        resetDashboardSmokeEnv()
    })

    afterEach(() => {
        cleanup()
    })

    it('renders without crashing', async () => {
        const { LiveClientPage } = await import('./live-client')
        const commonSubject = { id: 's-1', name: 'Math', icon: '📘', created_at: '', updated_at: '' }

        const { container } = render(
            <LiveClientPage
                initialClasses={[
                    {
                        id: 'l-1',
                        title: 'Live 1',
                        meet_url: 'https://meet.example.com',
                        scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
                        is_active: true,
                        created_at: '',
                        updated_at: '',
                        description: null,
                        subject_id: 's-1',
                        tutor_id: 'u-1',
                        subject: commonSubject,
                        tutor: { full_name: 'Tutor A' },
                    },
                ] as any}
            />
        )

        expect(container.firstChild).toBeTruthy()
    })
})
