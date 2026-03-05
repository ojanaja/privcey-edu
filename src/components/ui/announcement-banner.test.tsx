// @vitest-environment jsdom

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Announcement } from '@/types/database'

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props}>{children}</div>
        ),
    },
}))

function buildAnnouncement(overrides: Partial<Announcement>): Announcement {
    return {
        id: 'a1',
        title: 'Title',
        content: 'Content',
        type: 'info',
        is_active: true,
        target_class_id: null,
        created_by: 'admin-1',
        created_at: '2026-01-01T00:00:00.000Z',
        expires_at: null,
        ...overrides,
    }
}

describe('AnnouncementBanner', () => {
    it('renders null when there are no active announcements', async () => {
        const { AnnouncementBanner } = await import('./announcement-banner')
        const { container } = render(
            <AnnouncementBanner
                announcements={[
                    buildAnnouncement({ is_active: false }),
                ]}
            />,
        )

        expect(container.firstChild).toBeNull()
    })

    it('renders all announcement types and supports dismiss', async () => {
        const { AnnouncementBanner } = await import('./announcement-banner')
        const announcements: Announcement[] = [
            buildAnnouncement({ id: 'info', type: 'info', title: 'Info' }),
            buildAnnouncement({ id: 'warn', type: 'warning', title: 'Warning' }),
            buildAnnouncement({ id: 'ok', type: 'success', title: 'Success' }),
            buildAnnouncement({ id: 'urgent', type: 'urgent', title: 'Urgent' }),
        ]

        render(<AnnouncementBanner announcements={announcements} />)

        expect(screen.getByText('Info')).toBeTruthy()
        expect(screen.getByText('Warning')).toBeTruthy()
        expect(screen.getByText('Success')).toBeTruthy()
        const urgentTitle = screen.getByText('Urgent')
        expect(urgentTitle).toBeTruthy()

        const urgentContainer = urgentTitle.closest('div[class*="animate-pulse-glow"]')
        expect(urgentContainer).toBeTruthy()

        const dismissButtons = screen.getAllByRole('button')
        fireEvent.click(dismissButtons[0])

        expect(screen.queryByText('Info')).toBeNull()
        expect(screen.getByText('Warning')).toBeTruthy()
    })
})
