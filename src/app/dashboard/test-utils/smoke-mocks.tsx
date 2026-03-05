// @vitest-environment jsdom

import React from 'react'
import { vi } from 'vitest'
import { id } from '@/lib/i18n/id'

function makeSupabaseChain(result: { data?: any; count?: number | null; error?: any } = {}) {
    const payload = { data: [], count: 0, error: null, ...result }
    const methods = new Set([
        'select',
        'eq',
        'in',
        'not',
        'or',
        'gte',
        'gt',
        'lt',
        'order',
        'limit',
        'range',
        'update',
        'insert',
        'delete',
    ])

    const proxy = new Proxy(
        {},
        {
            get(_, prop: string | symbol) {
                if (prop === 'single') return () => Promise.resolve({ data: null, error: null })
                if (prop === 'maybeSingle') return () => Promise.resolve({ data: null, error: null })
                if (prop === 'then') return (resolve: (value: any) => any) => Promise.resolve(resolve(payload))
                if (methods.has(String(prop))) return () => proxy
                return proxy
            },
        }
    )

    return proxy
}

export const authState = {
    user: {
        id: 'u-1',
        full_name: 'Test User',
        email: 'test@example.com',
        class_id: null,
        role: 'student',
        is_active: true,
        payment_status: 'active',
    } as any,
}

export const examState = {
    setExam: vi.fn(),
    isStarted: false,
    attemptId: null as string | null,
}

export const useParamsMock = vi.fn(() => ({ id: 'tryout-1' }))

export const createClientMock = vi.fn(() => ({
    from: vi.fn(() => makeSupabaseChain()),
}))

vi.mock('next/navigation', () => ({
    useParams: () => useParamsMock(),
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    usePathname: () => '/dashboard',
    useSearchParams: () => ({ get: vi.fn(() => null) }),
}))

vi.mock('next/link', () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

vi.mock('next/image', () => ({
    default: ({ alt, src, fill: _fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
        <img alt={alt} src={String(src)} {...props} />
    ),
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Line: () => <div />,
    PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Pie: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Cell: () => <div />,
    RadarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PolarGrid: () => <div />,
    PolarAngleAxis: () => <div />,
    PolarRadiusAxis: () => <div />,
    Radar: () => <div />,
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({ t: id, locale: 'id' }),
}))

vi.mock('@/stores/auth-store', () => ({
    useAuthStore: () => authState,
}))

vi.mock('@/stores/exam-store', () => ({
    useExamStore: () => examState,
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => createClientMock(),
}))

vi.mock('@/components/ui', () => ({
    GlassCard: ({ children, hoverable: _hoverable, padding: _padding, ...props }: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean; padding?: string }) => <div {...props}>{children}</div>,
    StatCard: ({ label, value }: { label: string; value: any }) => <div>{label}:{String(value)}</div>,
    Badge: ({ children, variant: _variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => <span {...props}>{children}</span>,
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    LoadingSpinner: ({ className }: { className?: string }) => <div data-testid="loading" className={className}>Loading</div>,
    ScoreRing: ({ score }: { score: number }) => <div>score:{score}</div>,
}))

vi.mock('@/components/exam/exam-interface', () => ({
    ExamInterface: () => <div data-testid="exam-interface">Exam Interface</div>,
}))

export function resetDashboardSmokeEnv() {
    vi.clearAllMocks()

    authState.user = {
        id: 'u-1',
        full_name: 'Test User',
        email: 'test@example.com',
        class_id: null,
        role: 'student',
        is_active: true,
        payment_status: 'active',
    }

    examState.isStarted = false
    examState.attemptId = null
    useParamsMock.mockReturnValue({ id: 'tryout-1' })

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/admin/classes')) {
            return { ok: true, json: async () => ({ classes: [] }) } as Response
        }
        if (url.includes('/api/admin/users')) {
            return { ok: true, json: async () => ({ users: [] }) } as Response
        }
        if (url.includes('/api/questions')) {
            return { ok: true, json: async () => ({ questions: [] }) } as Response
        }
        return { ok: true, json: async () => ({}) } as Response
    }))

    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.stubGlobal('alert', vi.fn())
    vi.stubGlobal('open', vi.fn())
}
