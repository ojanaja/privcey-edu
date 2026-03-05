// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()
const fromMock = vi.fn()
const upsertMock = vi.fn()
const updateEqMock = vi.fn()
const submitExamMock = vi.fn()
const startExamMock = vi.fn()
const setAnswerMock = vi.fn()
const goToQuestionMock = vi.fn()
const nextQuestionMock = vi.fn()
const prevQuestionMock = vi.fn()
const toggleFlagMock = vi.fn()
const tickMock = vi.fn()

const examState: {
    questions: Array<Record<string, unknown>>
    currentIndex: number
    answers: Map<string, string>
    timeRemaining: number
    isStarted: boolean
    isSubmitted: boolean
    flaggedQuestions: Set<string>
    attemptId: string | null
    tryoutId: string | null
    duration: number
} = {
    questions: [],
    currentIndex: 0,
    answers: new Map(),
    timeRemaining: 900,
    isStarted: false,
    isSubmitted: false,
    flaggedQuestions: new Set(),
    attemptId: 'attempt-1',
    tryoutId: 'tryout-1',
    duration: 900,
}

const useExamStoreMock = Object.assign(
    vi.fn(() => ({
        ...examState,
        setAnswer: setAnswerMock,
        goToQuestion: goToQuestionMock,
        nextQuestion: nextQuestionMock,
        prevQuestion: prevQuestionMock,
        toggleFlag: toggleFlagMock,
        tick: tickMock,
        startExam: startExamMock,
        submitExam: submitExamMock,
    })),
    {
        getState: vi.fn(() => ({ duration: examState.duration })),
    },
)

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}))

vi.mock('next/image', () => ({
    default: ({ alt, src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
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

vi.mock('@/stores/exam-store', () => ({
    useExamStore: useExamStoreMock,
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: fromMock,
    }),
}))

vi.mock('@/components/ui', () => ({
    Button: ({ children, isLoading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) => (
        <button disabled={Boolean(isLoading) || props.disabled} {...props}>{children}</button>
    ),
    Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    GlassCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: {
            exam: {
                readyTitle: 'Ready for exam?',
                questionsCount: 'questions',
                durationLabel: 'Duration:',
                startExam: 'Start Exam',
                examDone: 'Exam submitted',
                answersCollected: 'Your answers are saved.',
                answeredCount: 'Answered:',
                emptyCount: 'Unanswered:',
                backToTryoutList: 'Back to tryout list',
                questionProgress: 'Question',
                submitButton: 'Submit',
                questionImage: 'Question image',
                prevButton: 'Prev',
                nextButton: 'Next',
                flag: 'Flag',
                flagged: 'Flagged',
                questionNav: 'Question Navigation',
                submitConfirmTitle: 'Submit now?',
                submitConfirmAnswered: 'Answered:',
                submitConfirmUnanswered: 'Unanswered:',
                submitConfirmTime: 'Time Left:',
                yesSubmit: 'Yes, submit',
            },
            common: {
                answered: 'Answered',
                notYet: 'Not yet',
                flagged: 'Flagged',
                cancel: 'Cancel',
            },
        },
    }),
}))

describe('components/exam/ExamInterface', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        examState.questions = [
            {
                id: 'q1',
                question_text: 'Question 1 text',
                question_image_url: 'https://img.test/q1.png',
                option_a: 'Option A',
                option_b: 'Option B',
                option_c: null,
                option_d: null,
                option_e: null,
            },
            {
                id: 'q2',
                question_text: 'Question 2 text',
                question_image_url: null,
                option_a: 'Second A',
                option_b: 'Second B',
                option_c: null,
                option_d: null,
                option_e: null,
            },
        ]
        examState.currentIndex = 0
        examState.answers = new Map()
        examState.timeRemaining = 900
        examState.isStarted = false
        examState.isSubmitted = false
        examState.flaggedQuestions = new Set()
        examState.attemptId = 'attempt-1'
        examState.tryoutId = 'tryout-1'
        examState.duration = 900

        upsertMock.mockResolvedValue({ error: null })
        updateEqMock.mockResolvedValue({ error: null })
        fromMock.mockImplementation((table: string) => {
            if (table === 'student_answers') return { upsert: upsertMock }
            if (table === 'tryout_attempts') return { update: () => ({ eq: updateEqMock }) }
            return {}
        })
    })

    afterEach(() => {
        cleanup()
    })

    it('renders pre-start card and starts exam', async () => {
        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        expect(screen.getByText('Ready for exam?')).toBeTruthy()
        expect(screen.getByText('2 questions')).toBeTruthy()
        expect(screen.getByText('Duration: 15:00')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: /start exam/i }))
        expect(startExamMock).toHaveBeenCalledTimes(1)
    })

    it('renders submitted state and navigates back to tryout list', async () => {
        examState.isStarted = true
        examState.isSubmitted = true
        examState.answers = new Map([['q1', 'A']])

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        expect(screen.getByText('Exam submitted')).toBeTruthy()
        expect(screen.getByText('Answered: 1')).toBeTruthy()
        expect(screen.getByText('Unanswered: 1')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: /back to tryout list/i }))
        expect(pushMock).toHaveBeenCalledWith('/dashboard/tryout')
    })

    it('renders active exam UI and handles navigation actions', async () => {
        examState.isStarted = true
        examState.timeRemaining = 240
        examState.flaggedQuestions = new Set(['q1'])

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        expect(screen.getByText('Question 1 / 2')).toBeTruthy()
        expect(screen.getByText('Question 1 text')).toBeTruthy()
        expect(screen.getByRole('img', { name: 'Question image' })).toBeTruthy()
        expect(screen.getByText('Question Navigation')).toBeTruthy()
        expect(screen.getByText('Flagged')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: /option a/i }))
        expect(setAnswerMock).toHaveBeenCalledWith('q1', 'A')

        fireEvent.click(screen.getByRole('button', { name: /prev/i }))
        expect(prevQuestionMock).toHaveBeenCalledTimes(0)

        fireEvent.click(screen.getByRole('button', { name: /next/i }))
        expect(nextQuestionMock).toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByRole('button', { name: /flagged/i }))
        expect(toggleFlagMock).toHaveBeenCalledWith('q1')

        fireEvent.click(screen.getByRole('button', { name: '2' }))
        expect(goToQuestionMock).toHaveBeenCalledWith(1)
    })

    it('handles active state when current question is missing', async () => {
        examState.isStarted = true
        examState.questions = []
        examState.currentIndex = 0

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        expect(screen.getByText('Question 1 / 0')).toBeTruthy()
        expect(screen.getByText('Question Navigation')).toBeTruthy()
    })

    it('opens submit confirmation and can cancel it', async () => {
        examState.isStarted = true

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        fireEvent.click(screen.getByRole('button', { name: /submit/i }))
        expect(screen.getByText('Submit now?')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

        await waitFor(() => {
            expect(screen.queryByText('Submit now?')).toBeNull()
        })
    })

    it('keeps confirmation open when clicking inside modal content', async () => {
        examState.isStarted = true

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        fireEvent.click(screen.getByRole('button', { name: /submit/i }))
        expect(screen.getByText('Submit now?')).toBeTruthy()

        fireEvent.click(screen.getByText('Submit now?'))
        expect(screen.getByText('Submit now?')).toBeTruthy()
    })

    it('closes confirmation when clicking backdrop', async () => {
        examState.isStarted = true

        const { ExamInterface } = await import('./exam-interface')

        const { container } = render(<ExamInterface />)

        fireEvent.click(screen.getByRole('button', { name: /submit/i }))
        expect(screen.getByText('Submit now?')).toBeTruthy()

        const backdrop = container.querySelector('div.fixed.inset-0') as HTMLDivElement
        fireEvent.click(backdrop)

        await waitFor(() => {
            expect(screen.queryByText('Submit now?')).toBeNull()
        })
    })

    it('submits answers through supabase and marks exam submitted', async () => {
        examState.isStarted = true
        examState.answers = new Map([
            ['q1', 'A'],
            ['q2', 'B'],
        ])

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        fireEvent.click(screen.getByRole('button', { name: /submit/i }))
        fireEvent.click(screen.getByRole('button', { name: /yes, submit/i }))

        await waitFor(() => {
            expect(upsertMock).toHaveBeenCalled()
            expect(updateEqMock).toHaveBeenCalledWith('id', 'attempt-1')
            expect(submitExamMock).toHaveBeenCalledTimes(1)
        })
    })

    it('returns early and does not submit when attemptId is missing', async () => {
        examState.isStarted = true
        examState.attemptId = null
        examState.answers = new Map([['q1', 'A']])

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        fireEvent.click(screen.getByRole('button', { name: /submit/i }))
        fireEvent.click(screen.getByRole('button', { name: /yes, submit/i }))

        await waitFor(() => {
            expect(fromMock).not.toHaveBeenCalled()
            expect(submitExamMock).not.toHaveBeenCalled()
        })
    })

    it('falls back to per-row upsert and logs submit update error', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        examState.isStarted = true
        examState.answers = new Map([
            ['q1', 'A'],
            ['q2', 'B'],
        ])

        const dynamicUpsert = vi
            .fn()
            .mockResolvedValueOnce({ error: { message: 'batch failed' } })
            .mockResolvedValue({ error: null })
        const dynamicUpdateEq = vi.fn().mockResolvedValue({ error: { message: 'submit failed' } })

        fromMock.mockImplementation((table: string) => {
            if (table === 'student_answers') return { upsert: dynamicUpsert }
            if (table === 'tryout_attempts') return { update: () => ({ eq: dynamicUpdateEq }) }
            return {}
        })

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        fireEvent.click(screen.getByRole('button', { name: /submit/i }))
        fireEvent.click(screen.getByRole('button', { name: /yes, submit/i }))

        await waitFor(() => {
            expect(dynamicUpsert).toHaveBeenCalledTimes(3)
            expect(dynamicUpdateEq).toHaveBeenCalledWith('id', 'attempt-1')
            expect(submitExamMock).toHaveBeenCalledTimes(1)
        })

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to save answers (batch), falling back to individual:',
            { message: 'batch failed' },
        )
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to submit attempt:', { message: 'submit failed' })
        consoleErrorSpy.mockRestore()
    })

    it('logs submit failure when supabase operation throws', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        examState.isStarted = true
        examState.answers = new Map([['q1', 'A']])

        fromMock.mockImplementation((table: string) => {
            if (table === 'student_answers') return { upsert: upsertMock }
            if (table === 'tryout_attempts') {
                return {
                    update: () => {
                        throw new Error('update crashed')
                    },
                }
            }
            return {}
        })

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        fireEvent.click(screen.getByRole('button', { name: /submit/i }))
        fireEvent.click(screen.getByRole('button', { name: /yes, submit/i }))

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled()
        })
        expect(submitExamMock).not.toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })

    it('auto-submits when timer reaches zero', async () => {
        examState.isStarted = true
        examState.isSubmitted = false
        examState.timeRemaining = 0
        examState.answers = new Map()

        const { ExamInterface } = await import('./exam-interface')

        render(<ExamInterface />)

        await waitFor(() => {
            expect(submitExamMock).toHaveBeenCalledTimes(1)
        })
    })

    it('runs timer tick and clears interval on unmount', async () => {
        vi.useFakeTimers()
        examState.isStarted = true
        examState.isSubmitted = false
        examState.timeRemaining = 120

        const { ExamInterface } = await import('./exam-interface')

        const { unmount } = render(<ExamInterface />)

        vi.advanceTimersByTime(1000)
        expect(tickMock).toHaveBeenCalledTimes(1)

        unmount()
        vi.advanceTimersByTime(2000)
        expect(tickMock).toHaveBeenCalledTimes(1)
        vi.useRealTimers()
    })

    it('handles timer cleanup safely when interval handle is null', async () => {
        const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockReturnValue(null as unknown as ReturnType<typeof setInterval>)
        examState.isStarted = true
        examState.isSubmitted = false
        examState.timeRemaining = 120

        const { ExamInterface } = await import('./exam-interface')

        const { unmount } = render(<ExamInterface />)
        unmount()

        setIntervalSpy.mockRestore()
    })
})
