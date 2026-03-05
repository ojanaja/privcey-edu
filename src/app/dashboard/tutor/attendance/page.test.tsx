// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type AttendanceLog = {
    id: string
    activity_type: string
    activity_title?: string | null
    timestamp: string
    student?: { full_name?: string | null; email?: string | null } | null
}

const queryState: { data: AttendanceLog[] | null } = { data: [] }
const fromMock = vi.fn()

let capturedCsv = ''
let createObjectURLMock: ReturnType<typeof vi.fn>

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({ from: fromMock }),
}))

vi.mock('@/components/ui', () => ({
    Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    LoadingSpinner: ({ className }: { className?: string }) => <div data-testid="loading" className={className}>Loading</div>,
}))

vi.mock('@/lib/utils', () => ({
    formatDateTime: (value: string) => `fmt:${value}`,
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            common: {
                student: 'Student',
                status: 'Status',
                title: 'Title',
                duration: 'Duration',
                exportCsv: 'Export CSV',
            },
            tutorAttendance: {
                title: 'Tutor Attendance',
                subtitle: 'Track attendance logs',
                searchPlaceholder: 'Search logs',
                noData: 'No attendance data',
            },
            adminAttendance: {
                csvHeaders: {
                    studentName: 'Student Name',
                    email: 'Email',
                    activity: 'Activity',
                    title: 'Activity Title',
                    time: 'Time',
                },
            },
        },
    }),
}))

describe('app/dashboard/tutor/attendance/page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        capturedCsv = ''

        createObjectURLMock = vi.fn(() => 'blob:mock-url')
            ; (globalThis.URL as unknown as { createObjectURL: typeof createObjectURLMock }).createObjectURL = createObjectURLMock

        class MockBlob {
            constructor(parts: BlobPart[]) {
                capturedCsv = String(parts[0])
            }
        }
        vi.stubGlobal('Blob', MockBlob)

        fromMock.mockImplementation((table: string) => {
            if (table === 'attendance_logs') {
                const limitMock = vi.fn(async () => ({ data: queryState.data }))
                const orderMock = vi.fn(() => ({ limit: limitMock }))
                const selectMock = vi.fn(() => ({ order: orderMock }))
                return { select: selectMock }
            }
            return { select: vi.fn() }
        })
    })

    afterEach(() => {
        cleanup()
    })

    it('shows loading initially and then renders fetched rows', async () => {
        queryState.data = [
            {
                id: 'log-1',
                activity_type: 'tryout',
                activity_title: 'Tryout Session',
                timestamp: '2026-03-01T10:00:00.000Z',
                student: { full_name: 'Alice', email: 'alice@example.com' },
            },
            {
                id: 'log-2',
                activity_type: 'vod_watch',
                activity_title: 'Video Session',
                timestamp: '2026-03-02T10:00:00.000Z',
                student: { full_name: 'Bob', email: 'bob@example.com' },
            },
        ]

        const { default: TutorAttendancePage } = await import('./page')

        render(<TutorAttendancePage />)

        expect(screen.getByTestId('loading')).toBeTruthy()

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).toBeNull()
        })

        expect(screen.getByText('Tutor Attendance')).toBeTruthy()
        expect(screen.getByText('Alice')).toBeTruthy()
        expect(screen.getByText('Bob')).toBeTruthy()
        expect(screen.getByText('Try Out')).toBeTruthy()
        expect(screen.getByText('Video')).toBeTruthy()
        expect(screen.getByText('fmt:2026-03-01T10:00:00.000Z')).toBeTruthy()
    })

    it('filters by search term and shows empty state when no match', async () => {
        queryState.data = [
            {
                id: 'log-3',
                activity_type: 'live_class',
                activity_title: 'Live Math',
                timestamp: '2026-03-03T10:00:00.000Z',
                student: { full_name: 'Charlie', email: 'charlie@example.com' },
            },
        ]

        const { default: TutorAttendancePage } = await import('./page')

        render(<TutorAttendancePage />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).toBeNull()
        })

        expect(screen.getByText('Charlie')).toBeTruthy()

        fireEvent.change(screen.getByPlaceholderText('Search logs'), {
            target: { value: 'Physics' },
        })

        await waitFor(() => {
            expect(screen.getByText('No attendance data')).toBeTruthy()
        })
    })

    it('handles null API payload and keeps empty state', async () => {
        queryState.data = null
        const { default: TutorAttendancePage } = await import('./page')

        render(<TutorAttendancePage />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).toBeNull()
        })

        expect(screen.getByText('No attendance data')).toBeTruthy()
    })

    it('exports CSV with fallback values and unknown activity label', async () => {
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })

        queryState.data = [
            {
                id: 'log-4',
                activity_type: 'custom_activity',
                activity_title: null,
                timestamp: '2026-03-04T10:00:00.000Z',
                student: { full_name: '', email: '' },
            },
        ]

        const { default: TutorAttendancePage } = await import('./page')

        render(<TutorAttendancePage />)

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).toBeNull()
        })

        fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))

        expect(createObjectURLMock).toHaveBeenCalledTimes(1)
        expect(clickSpy).toHaveBeenCalledTimes(1)
        expect(capturedCsv).toContain('Student Name,Email,Activity,Activity Title,Time')
        expect(capturedCsv).toContain('"-","-","custom_activity","-","fmt:2026-03-04T10:00:00.000Z"')

        clickSpy.mockRestore()
    })
})
