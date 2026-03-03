import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attempt_id, answers } = body;

    if (!attempt_id || !answers) {
        return NextResponse.json({ error: 'attempt_id and answers required' }, { status: 400 });
    }

    const { data: attempt } = await supabase
        .from('tryout_attempts')
        .select('*, tryout:tryouts(*)')
        .eq('id', attempt_id)
        .eq('student_id', user.id)
        .single();

    if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.is_submitted) {
        return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
    }

    const { data: questions } = await supabase
        .from('questions')
        .select('id, correct_answer')
        .eq('tryout_id', attempt.tryout_id);

    if (!questions) {
        return NextResponse.json({ error: 'No questions found' }, { status: 400 });
    }

    const questionMap = new Map(questions.map((q) => [q.id, q.correct_answer]));
    let correctCount = 0;
    const studentAnswers = [];

    for (const [questionId, selectedAnswer] of Object.entries(answers)) {
        const correctAnswer = questionMap.get(questionId);
        const isCorrect = correctAnswer === selectedAnswer;
        if (isCorrect) correctCount++;

        studentAnswers.push({
            attempt_id,
            question_id: questionId,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
        });
    }

    if (studentAnswers.length > 0) {
        await supabase.from('student_answers').upsert(studentAnswers, {
            onConflict: 'attempt_id,question_id',
        });
    }

    const score = questions.length > 0
        ? Math.round((correctCount / questions.length) * 100)
        : 0;

    const { error } = await supabase
        .from('tryout_attempts')
        .update({
            is_submitted: true,
            score,
            finished_at: new Date().toISOString(),
        })
        .eq('id', attempt_id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('score_history').insert({
        student_id: user.id,
        tryout_id: attempt.tryout_id,
        attempt_id,
        score,
    });

    await supabase.from('attendance_logs').insert({
        student_id: user.id,
        activity_type: 'tryout',
        activity_id: attempt.tryout_id,
        activity_title: attempt.tryout?.title,
    });

    return NextResponse.json({
        success: true,
        score,
        correct: correctCount,
        total: questions.length,
    });
}
