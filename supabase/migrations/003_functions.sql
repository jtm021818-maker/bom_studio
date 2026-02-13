-- ============================================================================
-- HYBRID SEARCH FUNCTION: Search Creators
-- ============================================================================
-- Combines hard filters (availability, skills) with vector similarity search
-- Returns ranked results based on embedding similarity + metadata scoring

CREATE OR REPLACE FUNCTION hybrid_search_creators(
  query_embedding vector(1536),
  filter_availability availability DEFAULT NULL,
  filter_skills TEXT[] DEFAULT NULL,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  intro TEXT,
  skills TEXT[],
  tools TEXT[],
  availability availability,
  hourly_rate TEXT,
  portfolio_url TEXT,
  similarity FLOAT,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.profile_id,
    cp.intro,
    cp.skills,
    cp.tools,
    cp.availability,
    cp.hourly_rate,
    cp.portfolio_url,
    1 - (cp.embedding <=> query_embedding) AS similarity, -- cosine similarity
    cp.created_at
  FROM creator_profiles cp
  WHERE 
    cp.deleted_at IS NULL
    AND cp.embedding IS NOT NULL
    AND (filter_availability IS NULL OR cp.availability = filter_availability)
    AND (filter_skills IS NULL OR cp.skills && filter_skills) -- array overlap
  ORDER BY cp.embedding <=> query_embedding -- cosine distance (ascending = more similar)
  LIMIT result_limit;
END;
$$;

COMMENT ON FUNCTION hybrid_search_creators IS 'Hybrid search for creators: hard filters + vector similarity';

-- ============================================================================
-- HYBRID SEARCH FUNCTION: Search Projects
-- ============================================================================
-- Searches open projects by video brief embedding similarity
-- Filters by budget range, category, deadline

CREATE OR REPLACE FUNCTION hybrid_search_projects(
  query_embedding vector(1536),
  filter_budget_min INTEGER DEFAULT NULL,
  filter_budget_max INTEGER DEFAULT NULL,
  filter_category TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  title TEXT,
  description TEXT,
  status project_status,
  budget_min INTEGER,
  budget_max INTEGER,
  deadline TIMESTAMP,
  category TEXT,
  similarity FLOAT,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.client_id,
    p.title,
    p.description,
    p.status,
    p.budget_min,
    p.budget_max,
    p.deadline,
    p.category,
    1 - (vb.embedding <=> query_embedding) AS similarity,
    p.created_at
  FROM projects p
  INNER JOIN video_briefs vb ON vb.project_id = p.id
  WHERE 
    p.deleted_at IS NULL
    AND p.status = 'open'
    AND vb.embedding IS NOT NULL
    AND (filter_budget_min IS NULL OR p.budget_max >= filter_budget_min)
    AND (filter_budget_max IS NULL OR p.budget_min <= filter_budget_max)
    AND (filter_category IS NULL OR p.category = filter_category)
  ORDER BY vb.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$;

COMMENT ON FUNCTION hybrid_search_projects IS 'Hybrid search for projects: hard filters + video brief embedding similarity';

-- ============================================================================
-- HELPER FUNCTION: Get Creator Stats
-- ============================================================================
-- Returns aggregated stats for a creator (for re-ranking in application layer)

CREATE OR REPLACE FUNCTION get_creator_stats(creator_profile_id UUID)
RETURNS TABLE (
  avg_rating FLOAT,
  total_reviews INTEGER,
  completed_projects INTEGER,
  response_rate FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.rating), 0.0)::FLOAT AS avg_rating,
    COUNT(r.id)::INTEGER AS total_reviews,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed')::INTEGER AS completed_projects,
    1.0::FLOAT AS response_rate -- Placeholder: implement actual response tracking
  FROM creator_profiles cp
  LEFT JOIN profiles prof ON prof.id = cp.profile_id
  LEFT JOIN reviews r ON r.reviewee_id = prof.id
  LEFT JOIN contracts c ON c.creator_id = prof.id
  LEFT JOIN projects p ON p.id = c.project_id
  WHERE cp.id = creator_profile_id
  GROUP BY cp.id;
END;
$$;

COMMENT ON FUNCTION get_creator_stats IS 'Get aggregated stats for a creator profile (for re-ranking)';
