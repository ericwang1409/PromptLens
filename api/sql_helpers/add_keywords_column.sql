-- Migration to add keywords column to queries table
-- Run this in your Supabase SQL Editor

-- Add keywords column (JSON array of strings)
alter table queries
add column if not exists keywords jsonb default '[]'::jsonb;

-- Add index for keywords column for better query performance
create index if not exists queries_keywords_idx
  on queries using gin (keywords);

-- Add comment to document the column
comment on column queries.keywords is 'Array of keyword strings associated with the query for categorization and search';

-- Example usage:
-- UPDATE queries SET keywords = '["AI", "machine learning", "classification"]'::jsonb WHERE id = 'some-id';
-- SELECT * FROM queries WHERE keywords ? 'AI';  -- Check if keywords array contains 'AI'
-- SELECT * FROM queries WHERE keywords @> '["AI"]'::jsonb;  -- Check if keywords contains the array ["AI"]
