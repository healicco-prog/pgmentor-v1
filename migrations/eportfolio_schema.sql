-- ═══════════════════════════════════════════════════════════════════════
-- e-Portfolio MS — Database Schema
-- Run this against your Supabase project
-- ═══════════════════════════════════════════════════════════════════════

-- STUDENT PROFILES
CREATE TABLE IF NOT EXISTS portfolio_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  full_name text,
  registration_number text,
  email text,
  mobile text,
  course text,
  specialty text,
  year_of_study int,
  institution_name text,
  department text,
  date_of_joining date,
  expected_completion date,
  guide_name text,
  co_guide_name text,
  profile_photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- CLINICAL LOGBOOK
CREATE TABLE IF NOT EXISTS portfolio_logbook (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  date date NOT NULL,
  posting text,
  procedure_name text NOT NULL,
  role text,
  times_performed int DEFAULT 1,
  remarks text,
  learning_points text,
  ai_notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_logbook_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  logbook_id uuid REFERENCES portfolio_logbook(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- CASE PRESENTATIONS
CREATE TABLE IF NOT EXISTS portfolio_cases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  diagnosis text,
  department text,
  case_type text,
  summary text,
  learning_points text,
  ai_notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_case_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES portfolio_cases(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- SEMINARS
CREATE TABLE IF NOT EXISTS portfolio_seminars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  date date NOT NULL,
  topic text,
  department text,
  key_learning_points text,
  references_text text,
  ai_notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_seminar_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seminar_id uuid REFERENCES portfolio_seminars(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- JOURNAL CLUBS
CREATE TABLE IF NOT EXISTS portfolio_journals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  article_title text NOT NULL,
  journal_name text,
  date_presented date NOT NULL,
  study_design text,
  key_findings text,
  critical_appraisal text,
  learning_points text,
  ai_notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_journal_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id uuid REFERENCES portfolio_journals(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- TEACHING ACTIVITIES
CREATE TABLE IF NOT EXISTS portfolio_teaching (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  date date NOT NULL,
  topic text NOT NULL,
  audience text,
  teaching_method text,
  learning_points text,
  ai_notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_teaching_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teaching_id uuid REFERENCES portfolio_teaching(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- ASSESSMENTS
CREATE TABLE IF NOT EXISTS portfolio_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  exam_type text NOT NULL,
  date date NOT NULL,
  topic text,
  score text,
  remarks text,
  learning_gaps text,
  ai_notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_assessment_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES portfolio_assessments(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- REFLECTIONS
CREATE TABLE IF NOT EXISTS portfolio_reflections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  date date NOT NULL,
  context text,
  what_happened text,
  learning_gained text,
  future_plan text,
  ai_notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_reflection_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reflection_id uuid REFERENCES portfolio_reflections(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- DOCUMENTS REPOSITORY
CREATE TABLE IF NOT EXISTS portfolio_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  category text,
  date date,
  description text,
  ai_notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_document_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES portfolio_documents(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio_images', 'portfolio_images', true)
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_logbook_user ON portfolio_logbook(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_cases_user ON portfolio_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_seminars_user ON portfolio_seminars(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_journals_user ON portfolio_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_teaching_user ON portfolio_teaching(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_assessments_user ON portfolio_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_reflections_user ON portfolio_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_documents_user ON portfolio_documents(user_id);
