-- ═══════════════════════════════════════════════════════════════════════════
-- PGMentor — Add structure_version column to knowledge_library
--
-- Run this ONCE in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qnguxwmrqwcksspujmoa/sql/new
--
-- WHY: The knowledge_library table was created before structure_version was
-- added. Every save attempt includes this column, so if it doesn't exist
-- ALL saves fail silently → "0/N created" in the admin panel.
--
-- This script is SAFE to run even if the column already exists (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Add the column (no-op if it already exists)
ALTER TABLE knowledge_library
  ADD COLUMN IF NOT EXISTS structure_version TEXT DEFAULT 'April 2026';

-- Step 2: Backfill any existing NULL rows
UPDATE knowledge_library
  SET structure_version = 'April 2026'
  WHERE structure_version IS NULL;

-- Step 3: Verify
SELECT
  COUNT(*)                                          AS total_rows,
  COUNT(NULLIF(structure_version, ''))              AS rows_with_version,
  COUNT(*) FILTER (WHERE structure_version IS NULL) AS rows_still_null
FROM knowledge_library;
