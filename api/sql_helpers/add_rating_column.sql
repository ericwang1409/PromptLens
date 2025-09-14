-- Migration to add rating column to queries table
-- Run this in your Supabase SQL Editor

-- Add rating column (integer between 1 and 5)
alter table queries
add column if not exists rating integer check (rating >= 1 and rating <= 5);

-- Add index for rating column for better query performance
create index if not exists queries_rating_idx
  on queries (rating);

-- Add comment to document the column
comment on column queries.rating is 'User rating for the query response on a scale of 1-5 (1=poor, 5=excellent)';
