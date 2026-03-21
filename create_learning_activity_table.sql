-- Learning Activity Tracking Table
-- Tracks detailed user activity across all features for persistent analytics

CREATE TABLE IF NOT EXISTS learning_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  feature_id TEXT NOT NULL,
  category TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('generate', 'save', 'view', 'practice', 'complete')),
  topic TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_learning_activity_user_id ON learning_activity(user_id);
CREATE INDEX idx_learning_activity_feature_id ON learning_activity(feature_id);
CREATE INDEX idx_learning_activity_category ON learning_activity(category);
CREATE INDEX idx_learning_activity_created_at ON learning_activity(created_at DESC);

-- Enable Row Level Security
ALTER TABLE learning_activity ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read/write their own data
CREATE POLICY "Users can manage their own learning activity"
  ON learning_activity FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
