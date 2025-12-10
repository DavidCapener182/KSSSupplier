-- RAG Ops Bot Schema

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document Embeddings Table
CREATE TABLE IF NOT EXISTS public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_document_embeddings_document_id ON public.document_embeddings(document_id);
-- Vector search index (IVFFlat) for performance on large datasets
-- Note: IVFFlat index requires some data to be present. For now, we can skip or create it later.
-- Or just rely on exact search for small datasets which is fine.
-- CREATE INDEX idx_document_embeddings_embedding ON public.document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS Policies
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on document_embeddings"
  ON public.document_embeddings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Providers can read embeddings for documents they have access to
CREATE POLICY "Providers can view embeddings for their events"
  ON public.document_embeddings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.assignments a ON d.event_id = a.event_id
      JOIN public.providers p ON a.provider_id = p.id
      WHERE d.id = document_embeddings.document_id
      AND p.user_id = auth.uid()
    )
  );

-- Similarity Search Function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_event_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_text text,
  similarity float,
  document_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.chunk_text,
    1 - (de.embedding <=> query_embedding) AS similarity,
    d.file_name as document_name
  FROM public.document_embeddings de
  JOIN public.documents d ON de.document_id = d.id
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
  AND d.event_id = filter_event_id
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


