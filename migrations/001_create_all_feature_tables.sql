-- =====================================================
-- PGMentor: Create All Missing Feature Tables
-- Run this in Supabase SQL Editor if setting up fresh
-- =====================================================

-- 1. Core reference tables
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, icon TEXT,
  category TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, price_monthly INTEGER NOT NULL DEFAULT 0,
  description TEXT, is_trial BOOLEAN DEFAULT false, trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_module_access (
  id BIGSERIAL PRIMARY KEY, plan_id TEXT, module_id TEXT, UNIQUE(plan_id, module_id)
);

CREATE TABLE IF NOT EXISTS course_subjects (
  id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, category TEXT, description TEXT,
  is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User management tables
CREATE TABLE IF NOT EXISTS user_subjects (
  id BIGSERIAL PRIMARY KEY, user_id UUID UNIQUE, subject_id BIGINT,
  changed_at TIMESTAMPTZ DEFAULT NOW(), next_change_allowed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subject_change_history (
  id BIGSERIAL PRIMARY KEY, user_id UUID, old_subject_id BIGINT, new_subject_id BIGINT,
  change_reason TEXT, confirmation_accepted BOOLEAN DEFAULT true, changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  email TEXT, session_id TEXT, device_id TEXT, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY, user_id UUID, subscription_id BIGINT,
  plan_id TEXT, amount INTEGER NOT NULL DEFAULT 0, currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending', payment_method TEXT, transaction_id TEXT UNIQUE,
  invoice_number TEXT UNIQUE, paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_token_overrides (
  id BIGSERIAL PRIMARY KEY, user_id UUID UNIQUE, token_limit INTEGER NOT NULL DEFAULT 0,
  override_reason TEXT, overridden_by TEXT, expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY, action_type TEXT NOT NULL, performed_by TEXT NOT NULL,
  target_user_id UUID, target_user_email TEXT, details JSONB,
  ip_address TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Content/feature tables (all use TEXT ids, TEXT user_ids)
CREATE TABLE IF NOT EXISTS knowledge_library (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  title TEXT, content TEXT, course TEXT, paper TEXT, section TEXT, topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_publications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  title TEXT NOT NULL, category TEXT DEFAULT 'Education', excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '', hashtags TEXT DEFAULT '', date TEXT DEFAULT '',
  views INTEGER DEFAULT 0, image_src TEXT DEFAULT '',
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_club (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT NOT NULL DEFAULT 'default',
  discipline TEXT, topic TEXT, criteria TEXT, ppt_structure TEXT, detailed_notes TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocol_generator (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  topic TEXT, content TEXT, title TEXT, feature_id TEXT DEFAULT 'protocol-generator',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manuscript_generator (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  topic TEXT, content TEXT, title TEXT, feature_id TEXT DEFAULT 'manuscript-generator',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reflection_generator (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  subject TEXT, topic TEXT, content TEXT, title TEXT, feature_id TEXT DEFAULT 'reflection-generator',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_decision_support_system (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  patient_data JSONB, recommendations JSONB, content TEXT, title TEXT,
  feature_id TEXT DEFAULT 'clinical-decision-support', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doubt_solver (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  topic TEXT, style TEXT, depth TEXT, explanation TEXT, title TEXT, content TEXT,
  feature_id TEXT DEFAULT 'doubt-solver', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_builder (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  full_name TEXT, professional_title TEXT, email TEXT, phone TEXT, location TEXT,
  linkedin TEXT, summary TEXT, education JSONB, experience JSONB, skills JSONB,
  publications JSONB, certifications JSONB, awards JSONB, memberships JSONB,
  conferences JSONB, selected_template TEXT DEFAULT 'classic', title TEXT, content TEXT,
  feature_id TEXT DEFAULT 'resume-builder', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS digital_diary (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  entry_date TIMESTAMPTZ, content TEXT, action_items JSONB, title TEXT,
  feature_id TEXT DEFAULT 'digital-diary', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drug_treatment_assistant (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  query TEXT, drug_name TEXT, condition TEXT, patient_context TEXT,
  mode TEXT, style TEXT, response TEXT, title TEXT, content TEXT,
  feature_id TEXT DEFAULT 'drug-treatment-assistant', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_guidelines (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, "userId" TEXT DEFAULT 'default',
  "conditionName" TEXT, title TEXT, organization TEXT, "publicationYear" TEXT,
  "sourceUrl" TEXT, category TEXT, summary TEXT, notes TEXT,
  "savedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_analyser (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  prescription_data JSONB, analysis TEXT, content TEXT, title TEXT,
  feature_id TEXT DEFAULT 'prescription-analyser', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_analyser_essay (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  subject TEXT, topic TEXT, questions JSONB, evaluation JSONB, content TEXT, title TEXT,
  feature_id TEXT DEFAULT 'knowledge-analyser-essay', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_analyser_mcqs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  subject TEXT, topic TEXT, mcqs JSONB, evaluation JSONB, content TEXT, title TEXT,
  feature_id TEXT DEFAULT 'knowledge-analyser-mcqs', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_exam_simulator (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  subject TEXT, paper TEXT, topics JSONB, questions JSONB, evaluation JSONB,
  content TEXT, title TEXT, feature_id TEXT DEFAULT 'ai-exam-simulator',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_examination_system (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  specialty TEXT, exam_type TEXT, case_data JSONB, history_log JSONB,
  examination_log JSONB, investigation_log JSONB, diagnosis_text TEXT,
  management_text TEXT, viva_qas JSONB, final_report TEXT,
  total_score NUMERIC, content TEXT, title TEXT,
  feature_id TEXT DEFAULT 'clinical-examination-system', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_paper_generator (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  paper_number TEXT, topic TEXT, generated_question_paper TEXT,
  model_question_paper TEXT, date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_exam_preparation_system (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  course_id TEXT, analytics JSONB, content TEXT, title TEXT,
  feature_id TEXT DEFAULT 'ai-exam-prep', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_exam_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT DEFAULT 'default',
  specialty TEXT, subspecialty TEXT, exam_type TEXT, case_data TEXT,
  status TEXT DEFAULT 'in_progress', end_time TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_exam_interactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, session_id TEXT,
  step TEXT, user_input TEXT, ai_response TEXT, timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_exam_evaluations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, session_id TEXT,
  scores TEXT, total_score NUMERIC, feedback TEXT, recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on all tables + permissive policies
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'modules','plans','plan_module_access','course_subjects','user_subjects',
    'subject_change_history','sessions','payments','user_token_overrides','admin_audit_logs',
    'knowledge_library','blog_publications','journal_club','protocol_generator',
    'manuscript_generator','reflection_generator','clinical_decision_support_system',
    'doubt_solver','resume_builder','digital_diary','drug_treatment_assistant',
    'saved_guidelines','prescription_analyser','knowledge_analyser_essay',
    'knowledge_analyser_mcqs','ai_exam_simulator','clinical_examination_system',
    'question_paper_generator','ai_exam_preparation_system',
    'clinical_exam_sessions','clinical_exam_interactions','clinical_exam_evaluations'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY IF NOT EXISTS "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- 5. Seed reference data
INSERT INTO plans (id, name, price_monthly, is_trial, trial_days, is_active) VALUES
  ('trial', 'Trial', 0, true, 15, true),
  ('starter', 'Starter', 499, false, 0, true),
  ('standard', 'Standard', 1199, false, 0, true),
  ('premium', 'Premium', 1999, false, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_subjects (name) VALUES
  ('Anatomy'),('Physiology'),('Biochemistry'),('Pharmacology'),('Pathology'),
  ('Microbiology'),('Forensic Medicine & Toxicology'),('PSM / Community Medicine'),
  ('General Medicine'),('General Surgery'),('Obstetrics & Gynecology'),('Pediatrics'),
  ('ENT'),('Ophthalmology'),('Orthopaedics'),('Dermatology (DVL)'),('Psychiatry'),
  ('Anaesthesiology'),('Radio Diagnosis')
ON CONFLICT (name) DO NOTHING;

-- 6. Fix existing tables that may have wrong column types
-- user_curriculum: add data column if missing
ALTER TABLE user_curriculum ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- saved_items: add default id generation
ALTER TABLE saved_items ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- seminar_builder: add missing columns
ALTER TABLE seminar_builder ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE seminar_builder ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE seminar_builder ADD COLUMN IF NOT EXISTS ppt_slides JSONB;
ALTER TABLE seminar_builder ADD COLUMN IF NOT EXISTS detailed_notes TEXT;

-- statassist: add missing columns
ALTER TABLE statassist ADD COLUMN IF NOT EXISTS study_title TEXT;
ALTER TABLE statassist ADD COLUMN IF NOT EXISTS methods TEXT;
ALTER TABLE statassist ADD COLUMN IF NOT EXISTS results TEXT;

-- scientific_session_search: add missing columns
ALTER TABLE scientific_session_search ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE scientific_session_search ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE scientific_session_search ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE scientific_session_search ADD COLUMN IF NOT EXISTS month TEXT;

-- flash_cards: add missing columns
ALTER TABLE flash_cards ADD COLUMN IF NOT EXISTS front_content TEXT;
ALTER TABLE flash_cards ADD COLUMN IF NOT EXISTS back_content TEXT;
ALTER TABLE flash_cards ADD COLUMN IF NOT EXISTS paper TEXT;
ALTER TABLE flash_cards ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE flash_cards ADD COLUMN IF NOT EXISTS title TEXT;

-- mcq_library: add missing columns
ALTER TABLE mcq_library ADD COLUMN IF NOT EXISTS question TEXT;
ALTER TABLE mcq_library ADD COLUMN IF NOT EXISTS options JSONB;
ALTER TABLE mcq_library ADD COLUMN IF NOT EXISTS correct_answer TEXT;
ALTER TABLE mcq_library ADD COLUMN IF NOT EXISTS paper TEXT;
ALTER TABLE mcq_library ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE mcq_library ADD COLUMN IF NOT EXISTS title TEXT;

-- essay_library: add missing columns
ALTER TABLE essay_library ADD COLUMN IF NOT EXISTS paper TEXT;
ALTER TABLE essay_library ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE essay_library ADD COLUMN IF NOT EXISTS title TEXT;

-- essay_library, mcq_library, flash_cards: fix UUID columns to TEXT (server sends TEXT ids)
-- Drop foreign keys and policies first, then alter, then recreate policies
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['essay_library','mcq_library','flash_cards']) LOOP
    -- Drop FK constraints
    EXECUTE (SELECT string_agg('ALTER TABLE ' || t || ' DROP CONSTRAINT "' || constraint_name || '"', '; ')
             FROM information_schema.table_constraints
             WHERE table_name = t AND constraint_type = 'FOREIGN KEY');
    -- Drop RLS policies
    EXECUTE (SELECT string_agg('DROP POLICY "' || policyname || '" ON ' || t, '; ')
             FROM pg_policies WHERE tablename = t);
    -- Alter columns
    EXECUTE format('ALTER TABLE %I ALTER COLUMN id TYPE TEXT USING id::TEXT', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT gen_random_uuid()::text', t);
    -- Recreate permissive policy
    EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- contacts_management: add missing columns
ALTER TABLE contacts_management ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE contacts_management ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE contacts_management ADD COLUMN IF NOT EXISTS is_personal_card BOOLEAN DEFAULT false;
ALTER TABLE contacts_management ADD COLUMN IF NOT EXISTS image TEXT;

-- Blog seed data
INSERT INTO blog_publications (id, title, category, excerpt, date, views, image_src, status) VALUES
  ('blog-seed-001', 'How Postgraduate Medical Students Should Prepare Notes', 'Education',
   'A comprehensive article exploring how postgraduate medical students should prepare notes.', 'Oct 12, 2025', 342,
   'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=600', 'published'),
  ('blog-seed-002', 'Understanding Statistical Tests in Clinical Research', 'Research',
   'A comprehensive article exploring understanding statistical tests in clinical research.', 'Nov 05, 2025', 184,
   'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=600', 'published'),
  ('blog-seed-003', 'How to Write a Manuscript Using AI', 'Publication',
   'A comprehensive article exploring how to write a manuscript using AI.', 'Dec 20, 2025', 521,
   'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=600', 'published')
ON CONFLICT (id) DO NOTHING;
