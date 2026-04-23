-- ============================================================
-- PGMentor Library Schema Migration
-- Run this ONCE in your Supabase SQL Editor:
--   supabase.com → your project → SQL Editor → paste & run
-- ============================================================

-- knowledge_library: add all detail columns + section/topic
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS topic_title    TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS definition     TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS basic_concepts TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS detailed_essay TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS summary        TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS key_takeaways  TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS title          TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS content        TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS section        TEXT;
ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS topic          TEXT;

-- essay_library: add section/topic if missing
ALTER TABLE essay_library ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE essay_library ADD COLUMN IF NOT EXISTS topic   TEXT;

-- mcq_library: add section/topic if missing
ALTER TABLE mcq_library ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE mcq_library ADD COLUMN IF NOT EXISTS topic   TEXT;

-- flash_cards: add section/topic if missing
ALTER TABLE flash_cards ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE flash_cards ADD COLUMN IF NOT EXISTS topic   TEXT;

-- Done. All library tables now have the required columns.
