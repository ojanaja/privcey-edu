// @vitest-environment jsdom

import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import '@/app/dashboard/test-utils/smoke-mocks'
import { resetDashboardSmokeEnv } from '@/app/dashboard/test-utils/smoke-mocks'

describe('app/dashboard/vod/vod-client', () => {
    beforeEach(() => {
        resetDashboardSmokeEnv()
    })

    afterEach(() => {
        cleanup()
    })

    it('renders without crashing', async () => {
        const { VodClientPage } = await import('./vod-client')
        const commonSubject = { id: 's-1', name: 'Math', icon: '📘', created_at: '', updated_at: '' }

        const { container } = render(
            <VodClientPage
                initialVods={[
                    {
                        id: 'v-1',
                        title: 'Video 1',
                        youtube_url: 'https://youtube.com/watch?v=abc',
                        youtube_id: 'abc',
                        thumbnail_url: null,
                        duration: '10:00',
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
