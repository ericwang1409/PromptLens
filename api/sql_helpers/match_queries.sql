-- SQL function for vector similarity search
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION match_queries(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  prompt text,
  response text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    q.id,
    q.user_id,
    q.prompt,
    q.response,
    1 - (q.prompt_embedding <=> query_embedding) AS similarity
  FROM queries q
  WHERE 1 - (q.prompt_embedding <=> query_embedding) >= match_threshold
  ORDER BY q.prompt_embedding <=> query_embedding
  LIMIT match_count;
$$;
