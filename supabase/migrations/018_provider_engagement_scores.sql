-- Provider Engagement Scores Table
-- Stores behavioral analytics for provider engagement

CREATE TABLE IF NOT EXISTS public.provider_engagement_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  engagement_score DECIMAL(5,2) NOT NULL, -- 0 to 100
  time_to_open_hours DECIMAL(10,2), -- Average time to view assignment
  login_frequency_days DECIMAL(10,2), -- Average days between logins
  chat_latency_hours DECIMAL(10,2), -- Average time to reply to messages
  metrics JSONB, -- Detailed metrics breakdown
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id)
);

-- Indexes
CREATE INDEX idx_provider_engagement_scores_provider_id ON public.provider_engagement_scores(provider_id);

-- RLS Policies
ALTER TABLE public.provider_engagement_scores ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on provider_engagement_scores"
  ON public.provider_engagement_scores
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Providers can view their own score (optional, maybe keep internal for now)
-- Keeping it internal for now as requested ("Helps you identify...")

