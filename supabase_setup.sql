-- =====================================================================
-- PGMentor — Supabase Tables Setup / Repair Script
-- Run this ONCE in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → paste this → Run
-- It is safe to run multiple times (idempotent).
-- =====================================================================


-- ─── 1. user_curriculum ───────────────────────────────────────────────
--   Stores each user's full curriculum (including generated AI content).
--   user_id is TEXT (not UUID FK) so the global default
--   '00000000-0000-0000-0000-000000000000' always works without needing
--   a matching row in auth.users.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_curriculum (
  user_id  TEXT PRIMARY KEY,
  data     JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table was previously created with UUID type, add a text alias column
-- (only needed if you see type errors — usually safe to skip)

ALTER TABLE user_curriculum DISABLE ROW LEVEL SECURITY;
GRANT ALL ON user_curriculum TO anon, authenticated, service_role;


-- ─── 2. knowledge_library ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_library (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  title          TEXT,
  content        TEXT,
  topic_title    TEXT,
  definition     TEXT,
  basic_concepts TEXT,
  detailed_essay TEXT,
  summary        TEXT,
  key_takeaways  TEXT,
  course         TEXT,
  paper          TEXT,
  section        TEXT,
  topic          TEXT,
  structure_version TEXT DEFAULT 'April 2026',
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure detail columns exist on existing tables too (idempotent)
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS topic_title    TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS definition     TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS basic_concepts TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS detailed_essay TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS summary        TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS key_takeaways  TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS structure_version TEXT DEFAULT 'April 2026';

-- Drop any FK constraint on user_id (blocks our global-default saves)
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'knowledge_library'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  LOOP
    EXECUTE 'ALTER TABLE knowledge_library DROP CONSTRAINT IF EXISTS "' || constraint_rec.constraint_name || '"';
    RAISE NOTICE 'Dropped FK constraint: %', constraint_rec.constraint_name;
  END LOOP;
END $$;

ALTER TABLE knowledge_library DISABLE ROW LEVEL SECURITY;
GRANT ALL ON knowledge_library TO anon, authenticated, service_role;


-- ─── 3. essay_library ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS essay_library (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  title       TEXT,
  content     TEXT,
  course      TEXT,
  paper       TEXT,
  section     TEXT,
  topic       TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'essay_library'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  LOOP
    EXECUTE 'ALTER TABLE essay_library DROP CONSTRAINT IF EXISTS "' || constraint_rec.constraint_name || '"';
  END LOOP;
END $$;

ALTER TABLE essay_library DISABLE ROW LEVEL SECURITY;
GRANT ALL ON essay_library TO anon, authenticated, service_role;


-- ─── 4. mcq_library ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mcq_library (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  title          TEXT,
  question       TEXT,
  options        JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT DEFAULT '',
  course         TEXT,
  paper          TEXT,
  section        TEXT,
  topic          TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'mcq_library'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  LOOP
    EXECUTE 'ALTER TABLE mcq_library DROP CONSTRAINT IF EXISTS "' || constraint_rec.constraint_name || '"';
  END LOOP;
END $$;

ALTER TABLE mcq_library DISABLE ROW LEVEL SECURITY;
GRANT ALL ON mcq_library TO anon, authenticated, service_role;


-- ─── 5. flash_cards ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flash_cards (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  title          TEXT,
  front_content  TEXT,
  back_content   TEXT,
  course         TEXT,
  paper          TEXT,
  section        TEXT,
  topic          TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'flash_cards'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  LOOP
    EXECUTE 'ALTER TABLE flash_cards DROP CONSTRAINT IF EXISTS "' || constraint_rec.constraint_name || '"';
  END LOOP;
END $$;

ALTER TABLE flash_cards DISABLE ROW LEVEL SECURITY;
GRANT ALL ON flash_cards TO anon, authenticated, service_role;


-- ─── Verify ──────────────────────────────────────────────────────────
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('knowledge_library','essay_library','mcq_library','flash_cards','user_curriculum')
ORDER BY table_name, ordinal_position;
