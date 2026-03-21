-- =====================================================
-- Blog Publications Table for MediMentr
-- Run this SQL in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS blog_publications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT DEFAULT 'default',
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Education',
    excerpt TEXT DEFAULT '',
    content TEXT DEFAULT '',
    hashtags TEXT DEFAULT '',
    date TEXT DEFAULT '',
    views INTEGER DEFAULT 0,
    image_src TEXT DEFAULT '',
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE blog_publications ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon users (matching existing app pattern)
CREATE POLICY "Allow all access to blog_publications" ON blog_publications
    FOR ALL USING (true) WITH CHECK (true);

-- Insert default seed data (the 3 original articles)
INSERT INTO blog_publications (id, title, category, excerpt, date, views, image_src, status) VALUES
(
    'blog-seed-001',
    'How Postgraduate Medical Students Should Prepare Notes',
    'Education',
    'A comprehensive article exploring how postgraduate medical students should prepare notes specifically within the education framework.',
    'Oct 12, 2025',
    342,
    'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=600',
    'published'
),
(
    'blog-seed-002',
    'Understanding Statistical Tests in Clinical Research',
    'Research',
    'A comprehensive article exploring understanding statistical tests in clinical research specifically within the research framework.',
    'Nov 05, 2025',
    184,
    'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=600',
    'published'
),
(
    'blog-seed-003',
    'How to Write a Manuscript Using AI',
    'Publication',
    'A comprehensive article exploring how to write a manuscript using AI specifically within the publication framework.',
    'Dec 20, 2025',
    521,
    'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=600',
    'published'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- If you already created the table earlier, just run:
-- ALTER TABLE blog_publications ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
-- ALTER TABLE blog_publications ADD COLUMN IF NOT EXISTS hashtags TEXT DEFAULT '';
-- =====================================================
