-- ═══════════════════════════════════════════════════════════════════════════
-- PGMentor — Fix Anatomy / Anaesthesiology Course Name Collision
-- Run in: https://supabase.com/dashboard/project/qnguxwmrqwcksspujmoa/sql/new
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Preview affected rows ──────────────────────────────────────────
SELECT
  'knowledge_library' AS tbl, id, course, paper, section
FROM knowledge_library
WHERE course = 'Anaesthesiology' AND id LIKE '%_ana_%'
UNION ALL
SELECT
  'essay_library', id, course, paper, section
FROM essay_library
WHERE course = 'Anaesthesiology' AND id LIKE '%_ana_%'
UNION ALL
SELECT
  'mcq_library', id, course, paper, section
FROM mcq_library
WHERE course = 'Anaesthesiology' AND id LIKE '%_ana_%'
UNION ALL
SELECT
  'flash_cards', id, course, paper, section
FROM flash_cards
WHERE course = 'Anaesthesiology' AND id LIKE '%_ana_%';


-- ── STEP 2: Fix knowledge_library ──────────────────────────────────────────
UPDATE knowledge_library
SET
  course = 'Anatomy',
  paper = CASE
    WHEN id LIKE '%_ana_p1_%' THEN 'Paper I – Gross Anatomy of Upper Limb, Lower Limb, Thorax & Abdomen'
    WHEN id LIKE '%_ana_p2_%' THEN 'Paper II – Head, Neck, Brain & Neuroanatomy'
    WHEN id LIKE '%_ana_p3_%' THEN 'Paper III – Histology, Embryology & Genetics'
    WHEN id LIKE '%_ana_p4_%' THEN 'Paper IV – Applied Anatomy, Recent Advances & Clinical Anatomy'
    ELSE paper
  END,
  section = CASE
    WHEN id LIKE '%_ana_p1_s1_%' THEN 'Upper Limb'
    WHEN id LIKE '%_ana_p1_s2_%' THEN 'Lower Limb'
    WHEN id LIKE '%_ana_p1_s3_%' THEN 'Thorax'
    WHEN id LIKE '%_ana_p1_s4_%' THEN 'Abdomen'
    WHEN id LIKE '%_ana_p2_s1_%' THEN 'Head & Neck'
    WHEN id LIKE '%_ana_p2_s2_%' THEN 'Neuroanatomy'
    WHEN id LIKE '%_ana_p3_s1_%' THEN 'Histology'
    WHEN id LIKE '%_ana_p3_s2_%' THEN 'Embryology'
    WHEN id LIKE '%_ana_p3_s3_%' THEN 'Genetics'
    WHEN id LIKE '%_ana_p4_s1_%' THEN 'Applied Anatomy'
    WHEN id LIKE '%_ana_p4_s2_%' THEN 'Radiological Anatomy'
    WHEN id LIKE '%_ana_p4_s3_%' THEN 'Clinical Anatomy'
    WHEN id LIKE '%_ana_p4_s4_%' THEN 'Recent Advances'
    WHEN id LIKE '%_ana_p4_s5_%' THEN 'Very High-Yield Topics'
    ELSE section
  END
WHERE course = 'Anaesthesiology' AND id LIKE '%_ana_%';


-- ── STEP 3: Fix essay_library ───────────────────────────────────────────────
UPDATE essay_library
SET
  course = 'Anatomy',
  paper = CASE
    WHEN id LIKE '%_ana_p1_%' THEN 'Paper I – Gross Anatomy of Upper Limb, Lower Limb, Thorax & Abdomen'
    WHEN id LIKE '%_ana_p2_%' THEN 'Paper II – Head, Neck, Brain & Neuroanatomy'
    WHEN id LIKE '%_ana_p3_%' THEN 'Paper III – Histology, Embryology & Genetics'
    WHEN id LIKE '%_ana_p4_%' THEN 'Paper IV – Applied Anatomy, Recent Advances & Clinical Anatomy'
    ELSE paper
  END,
  section = CASE
    WHEN id LIKE '%_ana_p1_s1_%' THEN 'Upper Limb'
    WHEN id LIKE '%_ana_p1_s2_%' THEN 'Lower Limb'
    WHEN id LIKE '%_ana_p1_s3_%' THEN 'Thorax'
    WHEN id LIKE '%_ana_p1_s4_%' THEN 'Abdomen'
    WHEN id LIKE '%_ana_p2_s1_%' THEN 'Head & Neck'
    WHEN id LIKE '%_ana_p2_s2_%' THEN 'Neuroanatomy'
    WHEN id LIKE '%_ana_p3_s1_%' THEN 'Histology'
    WHEN id LIKE '%_ana_p3_s2_%' THEN 'Embryology'
    WHEN id LIKE '%_ana_p3_s3_%' THEN 'Genetics'
    WHEN id LIKE '%_ana_p4_s1_%' THEN 'Applied Anatomy'
    WHEN id LIKE '%_ana_p4_s2_%' THEN 'Radiological Anatomy'
    WHEN id LIKE '%_ana_p4_s3_%' THEN 'Clinical Anatomy'
    WHEN id LIKE '%_ana_p4_s4_%' THEN 'Recent Advances'
    WHEN id LIKE '%_ana_p4_s5_%' THEN 'Very High-Yield Topics'
    ELSE section
  END
WHERE course = 'Anaesthesiology' AND id LIKE '%_ana_%';


-- ── STEP 4: Fix mcq_library ─────────────────────────────────────────────────
UPDATE mcq_library
SET
  course = 'Anatomy',
  paper = CASE
    WHEN id LIKE '%_ana_p1_%' THEN 'Paper I – Gross Anatomy of Upper Limb, Lower Limb, Thorax & Abdomen'
    WHEN id LIKE '%_ana_p2_%' THEN 'Paper II – Head, Neck, Brain & Neuroanatomy'
    WHEN id LIKE '%_ana_p3_%' THEN 'Paper III – Histology, Embryology & Genetics'
    WHEN id LIKE '%_ana_p4_%' THEN 'Paper IV – Applied Anatomy, Recent Advances & Clinical Anatomy'
    ELSE paper
  END,
  section = CASE
    WHEN id LIKE '%_ana_p1_s1_%' THEN 'Upper Limb'
    WHEN id LIKE '%_ana_p1_s2_%' THEN 'Lower Limb'
    WHEN id LIKE '%_ana_p1_s3_%' THEN 'Thorax'
    WHEN id LIKE '%_ana_p1_s4_%' THEN 'Abdomen'
    WHEN id LIKE '%_ana_p2_s1_%' THEN 'Head & Neck'
    WHEN id LIKE '%_ana_p2_s2_%' THEN 'Neuroanatomy'
    WHEN id LIKE '%_ana_p3_s1_%' THEN 'Histology'
    WHEN id LIKE '%_ana_p3_s2_%' THEN 'Embryology'
    WHEN id LIKE '%_ana_p3_s3_%' THEN 'Genetics'
    WHEN id LIKE '%_ana_p4_s1_%' THEN 'Applied Anatomy'
    WHEN id LIKE '%_ana_p4_s2_%' THEN 'Radiological Anatomy'
    WHEN id LIKE '%_ana_p4_s3_%' THEN 'Clinical Anatomy'
    WHEN id LIKE '%_ana_p4_s4_%' THEN 'Recent Advances'
    WHEN id LIKE '%_ana_p4_s5_%' THEN 'Very High-Yield Topics'
    ELSE section
  END
WHERE course = 'Anaesthesiology' AND id LIKE '%_ana_%';


-- ── STEP 5: Fix flash_cards ─────────────────────────────────────────────────
UPDATE flash_cards
SET
  course = 'Anatomy',
  paper = CASE
    WHEN id LIKE '%_ana_p1_%' THEN 'Paper I – Gross Anatomy of Upper Limb, Lower Limb, Thorax & Abdomen'
    WHEN id LIKE '%_ana_p2_%' THEN 'Paper II – Head, Neck, Brain & Neuroanatomy'
    WHEN id LIKE '%_ana_p3_%' THEN 'Paper III – Histology, Embryology & Genetics'
    WHEN id LIKE '%_ana_p4_%' THEN 'Paper IV – Applied Anatomy, Recent Advances & Clinical Anatomy'
    ELSE paper
  END,
  section = CASE
    WHEN id LIKE '%_ana_p1_s1_%' THEN 'Upper Limb'
    WHEN id LIKE '%_ana_p1_s2_%' THEN 'Lower Limb'
    WHEN id LIKE '%_ana_p1_s3_%' THEN 'Thorax'
    WHEN id LIKE '%_ana_p1_s4_%' THEN 'Abdomen'
    WHEN id LIKE '%_ana_p2_s1_%' THEN 'Head & Neck'
    WHEN id LIKE '%_ana_p2_s2_%' THEN 'Neuroanatomy'
    WHEN id LIKE '%_ana_p3_s1_%' THEN 'Histology'
    WHEN id LIKE '%_ana_p3_s2_%' THEN 'Embryology'
    WHEN id LIKE '%_ana_p3_s3_%' THEN 'Genetics'
    WHEN id LIKE '%_ana_p4_s1_%' THEN 'Applied Anatomy'
    WHEN id LIKE '%_ana_p4_s2_%' THEN 'Radiological Anatomy'
    WHEN id LIKE '%_ana_p4_s3_%' THEN 'Clinical Anatomy'
    WHEN id LIKE '%_ana_p4_s4_%' THEN 'Recent Advances'
    WHEN id LIKE '%_ana_p4_s5_%' THEN 'Very High-Yield Topics'
    ELSE section
  END
WHERE course = 'Anaesthesiology' AND id LIKE '%_ana_%';


-- ── STEP 6: Verify ──────────────────────────────────────────────────────────
SELECT course, COUNT(*) AS rows
FROM knowledge_library
GROUP BY course
ORDER BY rows DESC;
