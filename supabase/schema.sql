-- =============================================================
-- PRIVCEY EDU - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- ENUM TYPES
-- =========================
CREATE TYPE user_role AS ENUM ('student', 'tutor', 'admin');
CREATE TYPE payment_status AS ENUM ('active', 'expired', 'pending');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE answer_option AS ENUM ('A', 'B', 'C', 'D', 'E');
CREATE TYPE announcement_type AS ENUM ('info', 'warning', 'success', 'urgent');
CREATE TYPE activity_type AS ENUM ('vod_watch', 'live_class', 'tryout', 'emod_access', 'daily_exercise');

-- =========================
-- TABLES
-- =========================

-- Class Groups (max 4 classes)
CREATE TABLE class_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  tutor_id UUID,
  max_students INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'student',
  class_id UUID REFERENCES class_groups(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  payment_status payment_status DEFAULT 'pending',
  payment_expires_at TIMESTAMPTZ,
  streak_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for tutor_id after profiles table exists
ALTER TABLE class_groups ADD CONSTRAINT fk_tutor FOREIGN KEY (tutor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT
);

-- Try Outs
CREATE TABLE tryouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES class_groups(id) ON DELETE SET NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  passing_grade INTEGER NOT NULL DEFAULT 70,
  is_active BOOLEAN DEFAULT true,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions (Bank Soal)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tryout_id UUID NOT NULL REFERENCES tryouts(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT,
  correct_answer answer_option NOT NULL,
  explanation TEXT,
  difficulty difficulty_level DEFAULT 'medium',
  order_number INTEGER NOT NULL DEFAULT 0
);

-- Try Out Attempts
CREATE TABLE tryout_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tryout_id UUID NOT NULL REFERENCES tryouts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  total_correct INTEGER DEFAULT 0,
  total_wrong INTEGER DEFAULT 0,
  total_unanswered INTEGER DEFAULT 0,
  is_submitted BOOLEAN DEFAULT false
);

-- Student Answers
CREATE TABLE student_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES tryout_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer answer_option,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  UNIQUE (attempt_id, question_id)
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  target_class_id UUID REFERENCES class_groups(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Attendance Logs (Silent Attendance)
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  activity_id TEXT,
  activity_title TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER
);

-- STRENGTHENS Modules
CREATE TABLE strengthens_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  tryout_id UUID NOT NULL REFERENCES tryouts(id) ON DELETE CASCADE,
  content_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Exercises (Latsol Harian)
CREATE TABLE daily_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES class_groups(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Exercise Questions (reuse questions structure)
CREATE TABLE daily_exercise_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES daily_exercises(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT,
  correct_answer answer_option NOT NULL,
  explanation TEXT,
  order_number INTEGER NOT NULL DEFAULT 0
);

-- Score History (LBE Score Tracker)
CREATE TABLE score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tryout_id UUID NOT NULL REFERENCES tryouts(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_class ON profiles(class_id);
CREATE INDEX idx_profiles_payment ON profiles(payment_status);
CREATE INDEX idx_tryouts_subject ON tryouts(subject_id);
CREATE INDEX idx_tryouts_class ON tryouts(class_id);
CREATE INDEX idx_questions_tryout ON questions(tryout_id);
CREATE INDEX idx_attempts_student ON tryout_attempts(student_id);
CREATE INDEX idx_attempts_tryout ON tryout_attempts(tryout_id);
CREATE INDEX idx_answers_attempt ON student_answers(attempt_id);
CREATE INDEX idx_attendance_student ON attendance_logs(student_id);
CREATE INDEX idx_attendance_type ON attendance_logs(activity_type);
CREATE INDEX idx_score_history_student ON score_history(student_id);

-- =========================
-- ROW LEVEL SECURITY
-- =========================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryout_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE strengthens_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_exercise_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read profiles, admins can update
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Class Groups: Everyone can read, admins can manage
CREATE POLICY "Class groups viewable by all" ON class_groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage class groups" ON class_groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Subjects: Everyone can read
CREATE POLICY "Subjects viewable by all" ON subjects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage subjects" ON subjects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Tryouts: Students see active ones, admins/tutors see all
CREATE POLICY "Students see active tryouts" ON tryouts
  FOR SELECT USING (
    is_active = true OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY "Admins and tutors manage tryouts" ON tryouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

-- Questions: Students see during attempts, admins/tutors see all
CREATE POLICY "Questions viewable by authenticated" ON questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and tutors manage questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

-- Attempts: Students see own, admins/tutors see all
CREATE POLICY "Students see own attempts" ON tryout_attempts
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY "Students can create attempts" ON tryout_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own attempts" ON tryout_attempts
  FOR UPDATE USING (student_id = auth.uid());

-- Student Answers
CREATE POLICY "Students manage own answers" ON student_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tryout_attempts
      WHERE tryout_attempts.id = student_answers.attempt_id
      AND tryout_attempts.student_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

-- Announcements: Everyone can read active ones
CREATE POLICY "Active announcements viewable" ON announcements
  FOR SELECT USING (
    is_active = true OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY "Admins manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

-- Attendance Logs
CREATE POLICY "Students see own attendance" ON attendance_logs
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY "System can insert attendance" ON attendance_logs
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- STRENGTHENS Modules
CREATE POLICY "Strengthens viewable by authenticated" ON strengthens_modules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage strengthens" ON strengthens_modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

-- Daily Exercises
CREATE POLICY "Daily exercises viewable" ON daily_exercises
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage daily exercises" ON daily_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY "Daily exercise questions viewable" ON daily_exercise_questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage daily exercise questions" ON daily_exercise_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

-- Score History
CREATE POLICY "Students see own scores" ON score_history
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

-- Only the auto_grade_attempt trigger (SECURITY DEFINER) can insert scores.
-- No direct client-side INSERT is allowed.
CREATE POLICY "Only system can insert scores" ON score_history
  FOR INSERT WITH CHECK (false);

-- =========================
-- FUNCTIONS & TRIGGERS
-- =========================

-- Auto-create profile on signup (supports Google OAuth metadata)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    'student',  -- ALWAYS default to student; admin/tutor set via admin API only
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-grade on submit
CREATE OR REPLACE FUNCTION auto_grade_attempt()
RETURNS TRIGGER AS $$
DECLARE
  total_q INTEGER;
  correct_count INTEGER;
  wrong_count INTEGER;
  unanswered_count INTEGER;
  calc_score DECIMAL(5,2);
BEGIN
  IF NEW.is_submitted = true AND OLD.is_submitted = false THEN
    -- Count correct answers
    SELECT COUNT(*) INTO correct_count
    FROM student_answers sa
    JOIN questions q ON sa.question_id = q.id
    WHERE sa.attempt_id = NEW.id AND sa.selected_answer = q.correct_answer;

    -- Count total questions
    SELECT COUNT(*) INTO total_q
    FROM questions WHERE tryout_id = NEW.tryout_id;

    -- Count answered wrong
    SELECT COUNT(*) INTO wrong_count
    FROM student_answers sa
    JOIN questions q ON sa.question_id = q.id
    WHERE sa.attempt_id = NEW.id
      AND sa.selected_answer IS NOT NULL
      AND sa.selected_answer != q.correct_answer;

    unanswered_count := total_q - correct_count - wrong_count;

    IF total_q > 0 THEN
      calc_score := (correct_count::DECIMAL / total_q::DECIMAL) * 100;
    ELSE
      calc_score := 0;
    END IF;

    NEW.score := calc_score;
    NEW.total_correct := correct_count;
    NEW.total_wrong := wrong_count;
    NEW.total_unanswered := unanswered_count;
    NEW.finished_at := NOW();

    -- Update is_correct for all answers
    UPDATE student_answers sa
    SET is_correct = (sa.selected_answer = q.correct_answer)
    FROM questions q
    WHERE sa.question_id = q.id AND sa.attempt_id = NEW.id;

    -- Insert into score_history
    INSERT INTO score_history (student_id, tryout_id, score)
    VALUES (NEW.student_id, NEW.tryout_id, calc_score);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_attempt_submit
  BEFORE UPDATE ON tryout_attempts
  FOR EACH ROW EXECUTE FUNCTION auto_grade_attempt();

-- =========================
-- CMS CONTENT TABLES (replaces Sanity)
-- =========================

-- VOD Content (Video on Demand)
CREATE TABLE vod_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  duration TEXT,
  thumbnail_url TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E-Modul Content
CREATE TABLE emod_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  drive_url TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  chapter TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Classes
CREATE TABLE live_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  meet_url TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  tutor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES class_groups(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for CMS tables
ALTER TABLE vod_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE emod_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VOD viewable by authenticated" ON vod_content
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage VOD" ON vod_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY "E-Modul viewable by authenticated" ON emod_content
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage E-Modul" ON emod_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY "Live classes viewable by authenticated" ON live_classes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage live classes" ON live_classes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE INDEX idx_vod_subject ON vod_content(subject_id);
CREATE INDEX idx_emod_subject ON emod_content(subject_id);
CREATE INDEX idx_live_class_scheduled ON live_classes(scheduled_at);

-- =========================
-- SEED DATA
-- =========================
INSERT INTO subjects (name, code, description, icon) VALUES
  ('Matematika', 'MTK', 'Pelajaran Matematika', '📐'),
  ('Bahasa Indonesia', 'BIND', 'Pelajaran Bahasa Indonesia', '📚'),
  ('Bahasa Inggris', 'BING', 'Pelajaran Bahasa Inggris', '🌍'),
  ('IPA', 'IPA', 'Ilmu Pengetahuan Alam', '🔬');

INSERT INTO class_groups (name, description, max_students) VALUES
  ('Kelas 9A', 'Kelas unggulan 9A', 25),
  ('Kelas 9B', 'Kelas reguler 9B', 25),
  ('Kelas 8A', 'Kelas unggulan 8A', 25),
  ('Kelas 8B', 'Kelas reguler 8B', 25);
