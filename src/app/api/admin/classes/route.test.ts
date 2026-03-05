import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}))

function buildSupabaseMock(options?: {
    user?: { id: string } | null
    role?: string | null
    classesResult?: { data: Array<Record<string, unknown>> | null; error: { message: string } | null }
    profilesForCount?: Array<{ class_id: string | null }> | null
    tutorsResult?: Array<{ id: string; full_name: string }> | null
    insertResult?: { data: Record<string, unknown> | null; error: { message: string } | null }
    updateResult?: { data: Record<string, unknown> | null; error: { message: string } | null }
    deleteError?: { message: string } | null
    studentCount?: number | null
}) {
    const user = options?.user === undefined ? { id: 'admin-1' } : options.user
    const role = options?.role === undefined ? 'admin' : options.role
    const classesResult =
        options?.classesResult ?? {
            data: [{ id: 'class-1', name: 'A', tutor_id: 'tutor-1' }],
            error: null,
        }
    const profilesForCount =
        options?.profilesForCount === undefined
            ? [{ class_id: 'class-1' }, { class_id: 'class-1' }]
            : options.profilesForCount
    const tutorsResult =
        options?.tutorsResult === undefined
            ? [{ id: 'tutor-1', full_name: 'Tutor One' }]
            : options.tutorsResult
    const insertResult =
        options?.insertResult ?? {
            data: { id: 'class-new', name: 'New Class' },
            error: null,
        }
    const updateResult =
        options?.updateResult ?? {
            data: { id: 'class-1', name: 'Updated Class' },
            error: null,
        }
    const deleteError = options?.deleteError ?? null
    const studentCount = options?.studentCount ?? 0

    const profileSingle = vi.fn().mockResolvedValue({ data: role ? { role } : null })
    const authGetUser = vi.fn().mockResolvedValue({ data: { user } })

    const classGroupsGet = {
        select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(classesResult),
        }),
    }

    const studentCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: studentCount }),
    })

    const studentsQuery = {
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                not: vi.fn().mockResolvedValue({ data: profilesForCount }),
            }),
        }),
    }

    const tutorQuery = {
        select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: tutorsResult }),
        }),
    }

    const classGroupsInsert = {
        insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(insertResult),
            }),
        }),
    }

    const classGroupsUpdate = {
        update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue(updateResult),
                }),
            }),
        }),
    }

    const classGroupsDelete = {
        delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: deleteError }),
        }),
    }

    const from = vi.fn((table: string) => {
        if (table === 'profiles') {
            return {
                select: vi.fn((cols: string, optionsArg?: { count?: 'exact'; head?: true }) => {
                    if (optionsArg?.head) return studentCountSelect()
                    if (cols === 'role') {
                        return {
                            eq: vi.fn().mockReturnValue({ single: profileSingle }),
                        }
                    }
                    if (cols === 'class_id') return studentsQuery.select()
                    if (cols === 'id, full_name') return tutorQuery.select()
                    throw new Error(`Unexpected profiles select: ${cols}`)
                }),
            }
        }

        if (table === 'class_groups') {
            return {
                ...classGroupsGet,
                ...classGroupsInsert,
                ...classGroupsUpdate,
                ...classGroupsDelete,
            }
        }

        throw new Error(`Unexpected table: ${table}`)
    })

    return {
        auth: { getUser: authGetUser },
        from,
        classGroupsInsert,
        classGroupsUpdate,
    }
}

describe('admin/classes route', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('GET returns 401 when unauthenticated', async () => {
        const supabase = buildSupabaseMock({ user: null })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET()
        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('GET returns 403 when non-admin', async () => {
        const supabase = buildSupabaseMock({ role: 'student' })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET()
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Forbidden' })
    })

    it('GET returns 500 when classes query fails', async () => {
        const supabase = buildSupabaseMock({
            classesResult: { data: null, error: { message: 'classes failed' } },
        })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET()
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'classes failed' })
    })

    it('GET enriches classes with student count and tutor name', async () => {
        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET()
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body.classes).toEqual([
            expect.objectContaining({
                id: 'class-1',
                student_count: 2,
                tutor_name: 'Tutor One',
            }),
        ])
    })

    it('GET handles missing profiles and tutors branches', async () => {
        const supabase = buildSupabaseMock({
            classesResult: { data: [{ id: 'class-2', name: 'B', tutor_id: null }], error: null },
            profilesForCount: null,
            tutorsResult: null,
        })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET()
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body.classes[0]).toEqual(
            expect.objectContaining({ student_count: 0, tutor_name: null }),
        )
    })

    it('GET handles tutor lookup with empty tutor result and null classes', async () => {
        const noTutorName = buildSupabaseMock({
            classesResult: { data: [{ id: 'class-3', name: 'C', tutor_id: 'tutor-missing' }], error: null },
            tutorsResult: null,
        })
        createClientMock.mockResolvedValue(noTutorName)
        const { GET } = await import('./route')

        const withMissingTutor = await GET()
        expect(withMissingTutor.status).toBe(200)
        expect((await withMissingTutor.json()).classes[0]).toEqual(
            expect.objectContaining({ tutor_name: null }),
        )

        const noClasses = buildSupabaseMock({
            classesResult: { data: null, error: null },
        })
        createClientMock.mockResolvedValue(noClasses)
        const empty = await GET()
        expect(empty.status).toBe(200)
        expect(await empty.json()).toEqual({ classes: [] })
    })

    it('GET handles empty student profiles array', async () => {
        const supabase = buildSupabaseMock({
            classesResult: { data: [{ id: 'class-4', name: 'D', tutor_id: 'tutor-4' }], error: null },
            profilesForCount: [],
            tutorsResult: [{ id: 'tutor-4', full_name: 'Tutor Four' }],
        })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET()
        expect(res.status).toBe(200)
        expect((await res.json()).classes[0]).toEqual(
            expect.objectContaining({ student_count: 0, tutor_name: 'Tutor Four' }),
        )
    })

    it('GET handles profile entries without class_id and missing tutor rows', async () => {
        const supabase = buildSupabaseMock({
            classesResult: { data: [{ id: 'class-5', name: 'E', tutor_id: 'tutor-5' }], error: null },
            profilesForCount: [{ class_id: null }],
            tutorsResult: null,
        })
        createClientMock.mockResolvedValue(supabase)
        const { GET } = await import('./route')

        const res = await GET()
        expect(res.status).toBe(200)
        expect((await res.json()).classes[0]).toEqual(
            expect.objectContaining({ student_count: 0, tutor_name: null }),
        )
    })

    it('GET handles unexpected error', async () => {
        createClientMock.mockRejectedValue(new Error('boom'))
        const { GET } = await import('./route')

        const res = await GET()
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'Error: boom' })
    })

    it('POST validates required name', async () => {
        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const res = await POST(new Request('http://localhost/api/admin/classes', {
            method: 'POST',
            body: JSON.stringify({ name: '   ' }),
        }) as never)

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Nama kelas wajib diisi' })
    })

    it('POST returns auth error when requester is not admin', async () => {
        const supabase = buildSupabaseMock({ role: 'student' })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const res = await POST(new Request('http://localhost/api/admin/classes', {
            method: 'POST',
            body: JSON.stringify({ name: 'Class' }),
        }) as never)

        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Forbidden' })
    })

    it('POST creates class and applies defaults', async () => {
        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const res = await POST(new Request('http://localhost/api/admin/classes', {
            method: 'POST',
            body: JSON.stringify({ name: ' Kelas A ', description: '  ', max_students: 0, tutor_id: '' }),
        }) as never)
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body).toEqual({ class: { id: 'class-new', name: 'New Class' } })
        expect(supabase.classGroupsInsert.insert.mock.calls[0][0]).toEqual({
            name: 'Kelas A',
            description: null,
            max_students: 25,
            tutor_id: null,
        })
    })

    it('POST returns 500 when insert fails', async () => {
        const supabase = buildSupabaseMock({
            insertResult: { data: null, error: { message: 'insert fail' } },
        })
        createClientMock.mockResolvedValue(supabase)
        const { POST } = await import('./route')

        const res = await POST(new Request('http://localhost/api/admin/classes', {
            method: 'POST',
            body: JSON.stringify({ name: 'Kelas A' }),
        }) as never)

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'insert fail' })
    })

    it('PUT validates id and name and returns success', async () => {
        const supabase = buildSupabaseMock()
        createClientMock.mockResolvedValue(supabase)
        const { PUT } = await import('./route')

        const noId = await PUT(new Request('http://localhost/api/admin/classes', {
            method: 'PUT',
            body: JSON.stringify({ name: 'Class' }),
        }) as never)
        expect(noId.status).toBe(400)

        const noName = await PUT(new Request('http://localhost/api/admin/classes', {
            method: 'PUT',
            body: JSON.stringify({ id: 'class-1', name: '   ' }),
        }) as never)
        expect(noName.status).toBe(400)

        const ok = await PUT(new Request('http://localhost/api/admin/classes', {
            method: 'PUT',
            body: JSON.stringify({ id: 'class-1', name: ' Updated ', description: '', max_students: 0, tutor_id: '' }),
        }) as never)
        expect(ok.status).toBe(200)
        expect(await ok.json()).toEqual({ class: { id: 'class-1', name: 'Updated Class' } })
    })

    it('PUT returns auth error when requester is not admin', async () => {
        const supabase = buildSupabaseMock({ role: 'student' })
        createClientMock.mockResolvedValue(supabase)
        const { PUT } = await import('./route')

        const res = await PUT(new Request('http://localhost/api/admin/classes', {
            method: 'PUT',
            body: JSON.stringify({ id: 'class-1', name: 'Class' }),
        }) as never)

        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Forbidden' })
    })

    it('PUT returns 500 on update error', async () => {
        const supabase = buildSupabaseMock({
            updateResult: { data: null, error: { message: 'update fail' } },
        })
        createClientMock.mockResolvedValue(supabase)
        const { PUT } = await import('./route')

        const res = await PUT(new Request('http://localhost/api/admin/classes', {
            method: 'PUT',
            body: JSON.stringify({ id: 'class-1', name: 'Class' }),
        }) as never)

        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'update fail' })
    })

    it('DELETE validates id and student dependency', async () => {
        const supabase = buildSupabaseMock({ studentCount: 3 })
        createClientMock.mockResolvedValue(supabase)
        const { DELETE } = await import('./route')

        const noId = await DELETE(new Request('http://localhost/api/admin/classes', {
            method: 'DELETE',
        }) as never)
        expect(noId.status).toBe(400)

        const blocked = await DELETE(new Request('http://localhost/api/admin/classes?id=class-1', {
            method: 'DELETE',
        }) as never)
        expect(blocked.status).toBe(400)
        expect(await blocked.json()).toEqual({
            error: 'Kelas masih memiliki 3 siswa. Pindahkan siswa terlebih dahulu.',
        })
    })

    it('DELETE returns auth error when requester is not admin', async () => {
        const supabase = buildSupabaseMock({ role: 'student' })
        createClientMock.mockResolvedValue(supabase)
        const { DELETE } = await import('./route')

        const res = await DELETE(new Request('http://localhost/api/admin/classes?id=class-1', {
            method: 'DELETE',
        }) as never)

        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({ error: 'Forbidden' })
    })

    it('DELETE returns 500 on delete error and success otherwise', async () => {
        const failSupabase = buildSupabaseMock({ studentCount: 0, deleteError: { message: 'delete fail' } })
        createClientMock.mockResolvedValue(failSupabase)
        const { DELETE } = await import('./route')

        const fail = await DELETE(new Request('http://localhost/api/admin/classes?id=class-1', {
            method: 'DELETE',
        }) as never)
        expect(fail.status).toBe(500)
        expect(await fail.json()).toEqual({ error: 'delete fail' })

        const okSupabase = buildSupabaseMock({ studentCount: 0, deleteError: null })
        createClientMock.mockResolvedValue(okSupabase)
        const ok = await DELETE(new Request('http://localhost/api/admin/classes?id=class-1', {
            method: 'DELETE',
        }) as never)

        expect(ok.status).toBe(200)
        expect(await ok.json()).toEqual({ success: true })
    })

    it('handles POST/PUT/DELETE unexpected errors', async () => {
        createClientMock.mockRejectedValue(new Error('unexpected'))
        const { POST, PUT, DELETE } = await import('./route')

        const post = await POST(new Request('http://localhost/api/admin/classes', {
            method: 'POST',
            body: JSON.stringify({ name: 'A' }),
        }) as never)
        expect(post.status).toBe(500)

        const put = await PUT(new Request('http://localhost/api/admin/classes', {
            method: 'PUT',
            body: JSON.stringify({ id: '1', name: 'A' }),
        }) as never)
        expect(put.status).toBe(500)

        const del = await DELETE(new Request('http://localhost/api/admin/classes?id=1', {
            method: 'DELETE',
        }) as never)
        expect(del.status).toBe(500)
    })
})
