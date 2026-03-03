-- Add UNIQUE constraint on student_answers(attempt_id, question_id)
-- Required for upsert operations (onConflict: 'attempt_id,question_id')
-- Without this, upsert fails silently and answers are never saved.

-- First, remove any duplicate rows (keep the latest one per attempt+question)
DELETE FROM student_answers a
USING student_answers b
WHERE a.attempt_id = b.attempt_id
  AND a.question_id = b.question_id
  AND a.id < b.id;

-- Now add the constraint
ALTER TABLE student_answers
  ADD CONSTRAINT student_answers_attempt_question_unique
  UNIQUE (attempt_id, question_id);
