-- Migration to add cached_query_id column to queries table
-- Run this in your Supabase SQL Editor

-- Add the cached_query_id column with foreign key constraint
alter table queries
add column if not exists cached_query_id uuid references queries(id) on delete set null;

-- Add an index for better performance when querying by cached_query_id
create index if not exists queries_cached_query_idx
  on queries (cached_query_id);

-- Add a comment to document the purpose
comment on column queries.cached_query_id is 'References the original query that was used as cache source for this query. NULL if this was a fresh LLM response.';
