-- Create the seminar_builder table
CREATE TABLE IF NOT EXISTS seminar_builder (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    discipline TEXT,
    topic TEXT,
    criteria TEXT,
    ppt_structure TEXT,
    detailed_notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: user_id is set to 'default' based on current simplified auth flow in the server
