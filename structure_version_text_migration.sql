-- ============================================================
-- PGMentor: structure_version column — change int4 → TEXT
-- and backfill all existing rows with "April 2026"
--
-- Run this ONCE in your Supabase SQL Editor:
--   supabase.com → your project → SQL Editor → paste & run
-- ============================================================

-- Step 1: Convert the column type from integer to text
ALTER TABLE knowledge_library
  ALTER COLUMN structure_version TYPE TEXT USING structure_version::TEXT;

-- Step 2: Set ALL existing rows (and any NULLs) to "April 2026"
UPDATE knowledge_library
  SET structure_version = 'April 2026';

-- Done. All existing Knowledge Library records now show Version: April 2026
