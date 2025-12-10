-- Natural Language Search Audit Log

CREATE TABLE IF NOT EXISTS public.search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  generated_sql TEXT,
  result_count INTEGER,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON public.search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON public.search_queries(created_at);

-- RLS
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Admins can view all search logs (audit)
CREATE POLICY "Admins can view all search queries"
  ON public.search_queries
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Admin-only SQL execution function for AI search
-- WARNING: This allows executing arbitrary SQL. Ensure strictly controlled via API level validation.
CREATE OR REPLACE FUNCTION admin_exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator privileges (should be admin/postgres)
AS $$
DECLARE
  result json;
BEGIN
  -- Double check user is admin
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Execute query and return as JSON
  EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
  RETURN result;
END;
$$;

