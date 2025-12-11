-- Sentiment Analysis Tables

-- Message Sentiment
CREATE TABLE IF NOT EXISTS public.message_sentiment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(4,3) NOT NULL, -- -1.000 to 1.000
  sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  key_topics JSONB,
  risk_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id)
);

-- Provider Sentiment Trends
CREATE TABLE IF NOT EXISTS public.provider_sentiment_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  average_sentiment DECIMAL(4,3) NOT NULL,
  message_count INTEGER NOT NULL,
  trend_direction TEXT CHECK (trend_direction IN ('improving', 'stable', 'declining')),
  alert_level TEXT CHECK (alert_level IN ('green', 'yellow', 'red')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_sentiment_message_id ON public.message_sentiment(message_id);
CREATE INDEX IF NOT EXISTS idx_provider_sentiment_trends_provider_id ON public.provider_sentiment_trends(provider_id);

-- RLS Policies
ALTER TABLE public.message_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_sentiment_trends ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on message_sentiment"
  ON public.message_sentiment
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on provider_sentiment_trends"
  ON public.provider_sentiment_trends
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Providers can read their own trends? Maybe not needed for V1, keeping it internal tool.


