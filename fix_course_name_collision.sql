-- ═══════════════════════════════════════════════════════════════════════════
-- PGMentor — Fix course name collision: Anatomy vs Anaesthesiology
--
-- ROOT CAUSE:
--   Both Anatomy (c10) and Anaesthesiology (c15) used identical topic IDs
--   (ana_p1, ana_p1_s1, ana_p1_s1_t1 … etc).
--   Rows that belong to Anatomy were saved with course = 'Anaesthesiology'
--   because the fallback lookup picked the wrong course.
--
-- FIX:
--   Any row whose ID contains the Anatomy prefix pattern (_ana_p) but whose
--   course column says 'Anaesthesiology' should have course = 'Anatomy'.
--   Anaesthesiology topics now use the prefix 'anesth_' going forward, so
--   any future saves will be unambiguous.
--
-- Run this ONCE in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qnguxwmrqwcksspujmoa/sql/new
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Preview what will be changed ────────────────────────────────────────
SELECT
  'knowledge_library' AS table_name,
  id,
  course AS wrong_course,
  paper,
  section,
  topic_title
FROM knowledge_library
WHERE course = 'Anaesthesiology'
  AND id LIKE '%_ana_%'

UNION ALL

SELECT
  'essay_library',
  id,
  course,
  paper,
  section,
  title
FROM essay_library
WHERE course = 'Anaesthesiology'
  AND id LIKE '%_ana_%'

UNION ALL

SELECT
  'mcq_library',
  id,
  course,
  paper,
  section,
  title
FROM mcq_library
WHERE course = 'Anaesthesiology'
  AND id LIKE '%_ana_%'

UNION ALL

SELECT
  'flash_cards',
  id,
  course,
  paper,
  section,
  title
FROM flash_cards
WHERE course = 'Anaesthesiology'
  AND id LIKE '%_ana_%';


-- ── 2. Apply the fix ────────────────────────────────────────────────────────
-- Uncomment each block below after confirming the preview above looks correct.

-- UPDATE knowledge_library
--   SET course = 'Anatomy',
--       paper  = REPLACE(paper,  'Anaesthesiology', 'Anatomy'),
--       updated_at = NOW()
--   WHERE course = 'Anaesthesiology'
--     AND id LIKE '%_ana_%';

-- UPDATE essay_library
--   SET course = 'Anatomy',
--       paper  = REPLACE(paper,  'Anaesthesiology', 'Anatomy'),
--       updated_at = NOW()
--   WHERE course = 'Anaesthesiology'
--     AND id LIKE '%_ana_%';

-- UPDATE mcq_library
--   SET course = 'Anatomy',
--       paper  = REPLACE(paper,  'Anaesthesiology', 'Anatomy'),
--       updated_at = NOW()
--   WHERE course = 'Anaesthesiology'
--     AND id LIKE '%_ana_%';

-- UPDATE flash_cards
--   SET course = 'Anatomy',
--       paper  = REPLACE(paper,  'Anaesthesiology', 'Anatomy'),
--       updated_at = NOW()
--   WHERE course = 'Anaesthesiology'
--     AND id LIKE '%_ana_%';


-- ── 3. Verify after fix ─────────────────────────────────────────────────────
-- SELECT course, COUNT(*) AS rows
-- FROM knowledge_library
-- GROUP BY course
-- ORDER BY rows DESC;
