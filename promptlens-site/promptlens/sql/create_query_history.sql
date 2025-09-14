-- Create query_history table
CREATE TABLE IF NOT EXISTS query_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_type VARCHAR(50) DEFAULT 'natural_language', -- 'natural_language', 'visualization', 'analysis', etc.
  chart_type VARCHAR(20), -- 'line', 'pie', 'bar', etc. (for visualization queries)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON query_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_history_last_used_at ON query_history(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_history_query_type ON query_history(query_type);
CREATE INDEX IF NOT EXISTS idx_query_history_is_favorite ON query_history(is_favorite);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_query_history_updated_at
    BEFORE UPDATE ON query_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS is disabled - access control handled at application level
