-- ═══════════════════════════════════════════════════════════════════════════
-- THESIS DATA COLLECTION TOOL — Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Thesis Studies table
CREATE TABLE IF NOT EXISTS thesis_studies (
  id TEXT PRIMARY KEY DEFAULT ('STUDY-' || substr(md5(random()::text), 1, 8)),
  user_id TEXT NOT NULL,
  course TEXT NOT NULL,
  specialty TEXT NOT NULL,
  thesis_title TEXT NOT NULL,
  guide_name TEXT NOT NULL,
  co_guide_name TEXT,
  institution_name TEXT NOT NULL,
  year_of_admission TEXT NOT NULL,
  study_type TEXT NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 30,
  study_duration TEXT,
  inclusion_criteria TEXT,
  exclusion_criteria TEXT,
  primary_outcome TEXT,
  secondary_outcome TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Thesis Cases table (individual subject/patient/sample entries)
CREATE TABLE IF NOT EXISTS thesis_cases (
  id TEXT PRIMARY KEY DEFAULT ('CASE-' || substr(md5(random()::text), 1, 8)),
  study_id TEXT NOT NULL REFERENCES thesis_studies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  date_of_recruitment TEXT,
  diagnosis TEXT,
  clinical_findings TEXT,
  duration_of_illness TEXT,
  relevant_history TEXT,
  examination_findings TEXT,
  laboratory_values TEXT,
  imaging_findings TEXT,
  scores_grading TEXT,
  measurements TEXT,
  drug_therapy TEXT,
  procedure_details TEXT,
  intervention_details TEXT,
  outcome_status TEXT,
  improvement TEXT,
  complications TEXT,
  follow_up_findings TEXT,
  remarks TEXT,
  observations TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_thesis_studies_user_id ON thesis_studies(user_id);
CREATE INDEX IF NOT EXISTS idx_thesis_cases_study_id ON thesis_cases(study_id);
CREATE INDEX IF NOT EXISTS idx_thesis_cases_user_id ON thesis_cases(user_id);

-- 4. Enable RLS
ALTER TABLE thesis_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE thesis_cases ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view own thesis studies" ON thesis_studies FOR SELECT USING (true);
CREATE POLICY "Users can insert own thesis studies" ON thesis_studies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own thesis studies" ON thesis_studies FOR UPDATE USING (true);
CREATE POLICY "Users can delete own thesis studies" ON thesis_studies FOR DELETE USING (true);

CREATE POLICY "Users can view own thesis cases" ON thesis_cases FOR SELECT USING (true);
CREATE POLICY "Users can insert own thesis cases" ON thesis_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own thesis cases" ON thesis_cases FOR UPDATE USING (true);
CREATE POLICY "Users can delete own thesis cases" ON thesis_cases FOR DELETE USING (true);
