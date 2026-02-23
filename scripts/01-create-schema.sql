-- SecureCRT Database Schema
-- Phase 1: Core tables and RLS policies

-- 1. Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  total_marks INTEGER NOT NULL CHECK (total_marks > 0),
  passing_percentage INTEGER DEFAULT 40 CHECK (passing_percentage >= 0 AND passing_percentage <= 100),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  enable_mcq BOOLEAN DEFAULT TRUE,
  enable_coding BOOLEAN DEFAULT FALSE,
  enable_screen_recording BOOLEAN DEFAULT TRUE,
  enable_webcam BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Exam Questions table
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'coding')),
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL CHECK (marks > 0),
  question_order INTEGER NOT NULL,
  -- MCQ specific fields
  mcq_options JSONB, -- [{id, text, is_correct}]
  mcq_correct_answer_id TEXT,
  -- Coding specific fields
  coding_language TEXT, -- 'python', 'java', 'cpp', 'javascript', etc.
  coding_template TEXT, -- starter code
  coding_test_cases JSONB, -- [{input, expected_output}]
  coding_constraints TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Exam Enrollments table
CREATE TABLE IF NOT EXISTS exam_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'submitted', 'graded')),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  is_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- 5. Exam Submissions table
CREATE TABLE IF NOT EXISTS exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES exam_enrollments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  answer TEXT, -- MCQ answer or code submission
  is_correct BOOLEAN,
  marks_obtained INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Exam Results table
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL UNIQUE REFERENCES exam_enrollments(id) ON DELETE CASCADE,
  total_marks INTEGER NOT NULL,
  marks_obtained INTEGER NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  is_passed BOOLEAN NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Screen Recordings table
CREATE TABLE IF NOT EXISTS screen_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES exam_enrollments(id) ON DELETE CASCADE,
  storage_url TEXT,
  file_size_bytes INTEGER,
  duration_seconds INTEGER,
  has_audio BOOLEAN DEFAULT TRUE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Cheating Logs table
CREATE TABLE IF NOT EXISTS cheating_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES exam_enrollments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('tab_switch', 'fullscreen_exit', 'no_face_detected', 'multiple_faces', 'face_swap', 'camera_off')),
  event_count INTEGER DEFAULT 1,
  details JSONB,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  logged_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Code Executions table
CREATE TABLE IF NOT EXISTS code_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  test_results JSONB, -- [{test_case_id, passed, output, error}]
  execution_time_ms INTEGER,
  memory_used_mb NUMERIC(10, 2),
  status TEXT CHECK (status IN ('pending', 'running', 'success', 'error')),
  error_message TEXT,
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_enrollments_exam_id ON exam_enrollments(exam_id);
CREATE INDEX idx_exam_enrollments_student_id ON exam_enrollments(student_id);
CREATE INDEX idx_exam_submissions_enrollment_id ON exam_submissions(enrollment_id);
CREATE INDEX idx_exam_results_enrollment_id ON exam_results(enrollment_id);
CREATE INDEX idx_cheating_logs_enrollment_id ON cheating_logs(enrollment_id);
CREATE INDEX idx_code_executions_submission_id ON code_executions(submission_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheating_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_executions ENABLE ROW LEVEL SECURITY;

-- Users: Users can view their own profile, admins can view all
CREATE POLICY "users_read_own" ON users FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Exams: Published exams viewable by students, all by admins
CREATE POLICY "exams_read_published" ON exams FOR SELECT
  USING (status = 'published' OR created_by = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "exams_create_admin" ON exams FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "exams_update_owner" ON exams FOR UPDATE
  USING (created_by = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Exam Questions: Visible if user is enrolled or is admin/creator
CREATE POLICY "exam_questions_read" ON exam_questions FOR SELECT
  USING (
    exam_id IN (
      SELECT exam_id FROM exam_enrollments WHERE student_id = auth.uid()
    ) OR
    (SELECT created_by FROM exams WHERE id = exam_id) = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Exam Enrollments: Students see their own, admins see all
CREATE POLICY "enrollments_read" ON exam_enrollments FOR SELECT
  USING (student_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "enrollments_create_admin" ON exam_enrollments FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Exam Submissions: Students see their own, admins see all
CREATE POLICY "submissions_read" ON exam_submissions FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM exam_enrollments WHERE student_id = auth.uid()
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "submissions_insert_own" ON exam_submissions FOR INSERT
  WITH CHECK (
    enrollment_id IN (
      SELECT id FROM exam_enrollments WHERE student_id = auth.uid()
    )
  );

-- Exam Results: Students see their own, admins see all
CREATE POLICY "results_read" ON exam_results FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM exam_enrollments WHERE student_id = auth.uid()
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Screen Recordings: Own recordings or admin
CREATE POLICY "recordings_read" ON screen_recordings FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM exam_enrollments WHERE student_id = auth.uid()
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "recordings_insert_own" ON screen_recordings FOR INSERT
  WITH CHECK (
    enrollment_id IN (
      SELECT id FROM exam_enrollments WHERE student_id = auth.uid()
    )
  );

-- Cheating Logs: Admins only
CREATE POLICY "cheating_logs_admin" ON cheating_logs FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Code Executions: Own submissions or admin
CREATE POLICY "code_executions_read" ON code_executions FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM exam_submissions WHERE enrollment_id IN (
        SELECT id FROM exam_enrollments WHERE student_id = auth.uid()
      )
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "code_executions_insert_own" ON code_executions FOR INSERT
  WITH CHECK (
    submission_id IN (
      SELECT id FROM exam_submissions WHERE enrollment_id IN (
        SELECT id FROM exam_enrollments WHERE student_id = auth.uid()
      )
    )
  );
