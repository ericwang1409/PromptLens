-- Create saved_visualizations table
CREATE TABLE IF NOT EXISTS saved_visualizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  query TEXT NOT NULL,
  chart_type VARCHAR(50) NOT NULL CHECK (chart_type IN ('line', 'pie')),
  chart_data JSONB NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Row Level Security (RLS) has been removed for this table

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_user_id ON saved_visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_updated_at ON saved_visualizations(updated_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_visualizations_updated_at
    BEFORE UPDATE ON saved_visualizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
