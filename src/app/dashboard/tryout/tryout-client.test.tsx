// @vitest-environment jsdom

import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import '@/app/dashboard/test-utils/smoke-mocks'
import { resetDashboardSmokeEnv } from '@/app/dashboard/test-utils/smoke-mocks'

describe('app/dashboard/tryout/tryout-client', () => {
    beforeEach(() => {
        resetDashboardSmokeEnv()
    })

    afterEach(() => {
        cleanup()
    })

    it('renders without crashing', async () => {
        const { TryoutClientPage } = await import('./tryout-client')
        const commonSubject = { id: 's-1', name: 'Math', icon: '📘', created_at: '', updated_at: '' }

        const { container } = render(
            <TryoutClientPage
                initialTryouts={[
                    {
                        id: 't-1',
                        title: 'Tryout 1',
                        description: null,
                        duration_minutes: 60,
                        passing_grade: 70,
                        is_active: true,
                        created_by: 'u-1',
                        created_at: '',
                        updated_at: '',
                        class_id: null,
                        start_time: null,
                        end_time: null,
                        subject_id: 's-1',
                        subject: commonSubject,
                    },
                ] as any}
            />
        )

        expect(container.firstChild).toBeTruthy()
    })
})
