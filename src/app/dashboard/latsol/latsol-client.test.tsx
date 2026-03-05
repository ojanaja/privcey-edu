// @vitest-environment jsdom

import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import '@/app/dashboard/test-utils/smoke-mocks'
import { resetDashboardSmokeEnv } from '@/app/dashboard/test-utils/smoke-mocks'

describe('app/dashboard/latsol/latsol-client', () => {
    beforeEach(() => {
        resetDashboardSmokeEnv()
    })

    afterEach(() => {
        cleanup()
    })

    it('renders without crashing', async () => {
        const { LatsolClientPage } = await import('./latsol-client')
        const commonSubject = { id: 's-1', name: 'Math', icon: '📘', created_at: '', updated_at: '' }

        const { container } = render(
            <LatsolClientPage
                initialExercises={[
                    {
                        id: 'd-1',
                        title: 'Exercise 1',
                        description: null,
                        date: new Date().toISOString().split('T')[0],
                        order: 1,
                        is_active: true,
                        created_by: 'u-1',
                        created_at: '',
                        updated_at: '',
                        subject_id: 's-1',
                        subject: commonSubject,
                    },
                ] as any}
            />
        )

        expect(container.firstChild).toBeTruthy()
    })
})
