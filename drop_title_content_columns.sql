-- ═══════════════════════════════════════════════════════════════════════════
-- PGMentor — Drop redundant `title` and `content` columns from knowledge_library
--
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qnguxwmrqwcksspujmoa/sql/new
--
-- These columns are the old schema — they have been fully replaced by:
--   title   → topic_title
--   content → definition + basic_concepts + detailed_essay + summary + key_takeaways
--
-- The server no longer writes to these columns and will NOT re-add them
-- after a restart (the auto-migration code has been updated to skip them).
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Drop the old legacy columns
ALTER TABLE knowledge_library DROP COLUMN IF EXISTS title;
ALTER TABLE knowledge_library DROP COLUMN IF EXISTS content;

-- Step 2: Remove any rows where all detail columns are empty/null
-- (these are orphaned rows from failed or incomplete generation runs)
DELETE FROM knowledge_library
WHERE
  (topic_title   IS NULL OR topic_title   = '')
  AND (definition    IS NULL OR definition    = '')
  AND (basic_concepts IS NULL OR basic_concepts = '')
  AND (detailed_essay IS NULL OR detailed_essay = '')
  AND (summary       IS NULL OR summary       = '')
  AND (key_takeaways IS NULL OR key_takeaways = '');

-- Step 3: Verify remaining columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'knowledge_library'
ORDER BY ordinal_position;

-- Step 4: Verify remaining rows (should have no empty-detail rows)
SELECT COUNT(*) AS total_rows,
       COUNT(NULLIF(topic_title, '')) AS rows_with_topic_title,
       COUNT(NULLIF(detailed_essay, '')) AS rows_with_detailed_essay
FROM knowledge_library;
