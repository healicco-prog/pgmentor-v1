-- ============================================================
-- MEDIMENTR USER MANAGEMENT SYSTEM - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Plans
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_trial BOOLEAN DEFAULT false,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (id, name, price_monthly, description, is_trial, trial_days) VALUES
  ('trial', 'Free Trial', 0, '15-day free trial with limited access', true, 15),
  ('starter', 'Starter', 499, 'Knowledge & Learning Resources + Academic & Research Writing', false, 0),
  ('standard', 'Standard', 1199, 'Everything in Starter + Productivity, Professional Management, Clinical Decision, Practice Support', false, 0),
  ('premium', 'Premium', 1999, 'Everything in Standard + Assessment System, LMS, Thesis Manager', false, 0)
ON CONFLICT (id) DO NOTHING;


-- 2. Modules
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO modules (id, name, description, category) VALUES
  ('knowledge-library', 'Knowledge Library', 'AI-generated clinical notes and study materials', 'knowledge'),
  ('essay-library', 'Essay Library', 'Curated essays for medical education', 'knowledge'),
  ('mcq-library', 'MCQ Library', 'Multiple choice questions bank', 'knowledge'),
  ('flash-cards', 'Flash Cards', 'Digital flash cards for quick revision', 'knowledge'),
  ('academic-writing', 'Academic Writing', 'Research papers, essays, academic documents', 'academic'),
  ('clinical-decision', 'Clinical Decision Support', 'AI-powered clinical decision assistance', 'clinical'),
  ('prescription-analysis', 'Prescription Analyser', 'AI prescription audit and analysis', 'clinical'),
  ('drug-treatment', 'Drug Treatment Assistant', 'Drug interaction and treatment planning', 'clinical'),
  ('doubt-solver', 'Doubt Solver', 'AI-powered medical doubt resolution', 'learning'),
  ('guidelines', 'Guidelines Generator', 'Clinical guidelines and protocols', 'clinical'),
  ('assessment-exam', 'Assessment & Examination', 'Exams, assessments, and practice tests', 'assessment'),
  ('lms', 'Learning Management System', 'Full LMS with courses, progress tracking', 'learning'),
  ('thesis-notes', 'Thesis Manager', 'Research thesis and notes management', 'academic'),
  ('resume-builder', 'Resume Builder', 'Professional medical resume builder', 'professional'),
  ('productivity', 'Productivity Tools', 'AI tools for professional productivity', 'productivity')
ON CONFLICT (id) DO NOTHING;


-- 3. Plan Module Access (which plan can access which module)
CREATE TABLE IF NOT EXISTS plan_module_access (
  id BIGSERIAL PRIMARY KEY,
  plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  UNIQUE(plan_id, module_id)
);

-- Trial
INSERT INTO plan_module_access (plan_id, module_id) VALUES
  ('trial', 'knowledge-library'), ('trial', 'essay-library')
ON CONFLICT DO NOTHING;

-- Starter
INSERT INTO plan_module_access (plan_id, module_id) VALUES
  ('starter', 'knowledge-library'), ('starter', 'essay-library'),
  ('starter', 'mcq-library'), ('starter', 'flash-cards'), ('starter', 'academic-writing')
ON CONFLICT DO NOTHING;

-- Standard
INSERT INTO plan_module_access (plan_id, module_id) VALUES
  ('standard', 'knowledge-library'), ('standard', 'essay-library'),
  ('standard', 'mcq-library'), ('standard', 'flash-cards'), ('standard', 'academic-writing'),
  ('standard', 'productivity'), ('standard', 'resume-builder'),
  ('standard', 'clinical-decision'), ('standard', 'prescription-analysis'),
  ('standard', 'drug-treatment'), ('standard', 'doubt-solver'), ('standard', 'guidelines')
ON CONFLICT DO NOTHING;

-- Premium (all modules)
INSERT INTO plan_module_access (plan_id, module_id) VALUES
  ('premium', 'knowledge-library'), ('premium', 'essay-library'),
  ('premium', 'mcq-library'), ('premium', 'flash-cards'), ('premium', 'academic-writing'),
  ('premium', 'productivity'), ('premium', 'resume-builder'),
  ('premium', 'clinical-decision'), ('premium', 'prescription-analysis'),
  ('premium', 'drug-treatment'), ('premium', 'doubt-solver'), ('premium', 'guidelines'),
  ('premium', 'assessment-exam'), ('premium', 'lms'), ('premium', 'thesis-notes')
ON CONFLICT DO NOTHING;


-- 4. Course Subjects (predefined list - 36 disciplines)
CREATE TABLE IF NOT EXISTS course_subjects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO course_subjects (name, category, sort_order) VALUES
  ('Anatomy', 'Basic Sciences', 1), ('Physiology', 'Basic Sciences', 2),
  ('Biochemistry', 'Basic Sciences', 3), ('Pharmacology', 'Para-Clinical', 4),
  ('Pathology', 'Para-Clinical', 5), ('Microbiology', 'Para-Clinical', 6),
  ('Community Medicine', 'Para-Clinical', 7), ('Forensic Medicine', 'Para-Clinical', 8),
  ('Ophthalmology', 'Clinical', 9), ('ENT (Otorhinolaryngology)', 'Clinical', 10),
  ('General Medicine', 'Clinical', 11), ('General Surgery', 'Clinical', 12),
  ('Obstetrics & Gynaecology', 'Clinical', 13), ('Paediatrics', 'Clinical', 14),
  ('Orthopaedics', 'Clinical', 15), ('Psychiatry', 'Clinical', 16),
  ('Dermatology & Venereology', 'Clinical', 17), ('Radiodiagnosis', 'Clinical', 18),
  ('Anaesthesiology', 'Clinical', 19), ('Emergency Medicine', 'Clinical', 20),
  ('Cardiology', 'Superspeciality', 21), ('Pulmonology', 'Superspeciality', 22),
  ('Neurology', 'Superspeciality', 23), ('Nephrology', 'Superspeciality', 24),
  ('Gastroenterology', 'Superspeciality', 25), ('Oncology', 'Superspeciality', 26),
  ('Endocrinology', 'Superspeciality', 27), ('Rheumatology', 'Superspeciality', 28),
  ('Infectious Diseases', 'Superspeciality', 29), ('Critical Care Medicine', 'Superspeciality', 30),
  ('Nursing', 'Allied Health', 31), ('Pharmacy', 'Allied Health', 32),
  ('Physiotherapy', 'Allied Health', 33), ('Dentistry', 'Allied Health', 34),
  ('Ayurveda', 'Alternative Medicine', 35), ('Homoeopathy', 'Alternative Medicine', 36)
ON CONFLICT (name) DO NOTHING;


-- 5. User Professional Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  mobile TEXT,
  profession TEXT,
  specialty TEXT,
  highest_qualification TEXT,
  current_stage TEXT CHECK (current_stage IN ('studying', 'practicing', 'both')),
  country TEXT,
  state TEXT,
  city TEXT,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'blocked', 'pending')),
  email_verified BOOLEAN DEFAULT false,
  disclaimer_accepted BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);


-- 6. User Active Subject (one per user)
CREATE TABLE IF NOT EXISTS user_subjects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES course_subjects(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  next_change_allowed_at TIMESTAMPTZ,
  UNIQUE(user_id)
);


-- 7. Subject Change History (audit trail)
CREATE TABLE IF NOT EXISTS subject_change_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_subject_id BIGINT REFERENCES course_subjects(id),
  new_subject_id BIGINT REFERENCES course_subjects(id),
  change_reason TEXT,
  confirmation_accepted BOOLEAN DEFAULT true,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);


-- 8. Subscriptions (trial + paid)
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
  is_trial BOOLEAN DEFAULT false,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 9. Token Policies (default allocations per plan, set by Super Admin)
CREATE TABLE IF NOT EXISTS token_policies (
  id BIGSERIAL PRIMARY KEY,
  plan_id TEXT REFERENCES plans(id) UNIQUE,
  monthly_tokens INTEGER NOT NULL DEFAULT 100,
  trial_tokens INTEGER NOT NULL DEFAULT 50,
  reset_monthly BOOLEAN DEFAULT true,
  hard_stop_on_exhaustion BOOLEAN DEFAULT false,
  alert_at_70 BOOLEAN DEFAULT true,
  alert_at_90 BOOLEAN DEFAULT true,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO token_policies (plan_id, monthly_tokens, trial_tokens) VALUES
  ('trial', 1000, 1000),
  ('starter', 3000, 0),
  ('standard', 8000, 0),
  ('premium', 20000, 0)
ON CONFLICT (plan_id) DO UPDATE SET monthly_tokens = EXCLUDED.monthly_tokens;


-- 10. User Token Overrides (Super Admin can override per user)
CREATE TABLE IF NOT EXISTS user_token_overrides (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_limit INTEGER NOT NULL,
  override_reason TEXT,
  overridden_by TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);


-- 11. Token Usage Logs (timestamped per user per module)
CREATE TABLE IF NOT EXISTS token_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES modules(id),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  action_description TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);


-- 12. Payments
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id),
  plan_id TEXT REFERENCES plans(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT UNIQUE,
  invoice_number TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 13. Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action_type TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_user_email TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_token_usage_user ON token_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_date ON token_usage_logs(used_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(account_status);
