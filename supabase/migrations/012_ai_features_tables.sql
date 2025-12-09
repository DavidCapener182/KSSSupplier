-- AI Recommendations table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  reasoning TEXT,
  factors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Extractions table
CREATE TABLE IF NOT EXISTS public.document_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  extracted_data JSONB,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SIA License Verifications table
CREATE TABLE IF NOT EXISTS public.sia_license_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_detail_id UUID REFERENCES public.staff_details(id) ON DELETE CASCADE,
  sia_number TEXT,
  expiry_date DATE,
  is_valid BOOLEAN,
  is_expired BOOLEAN,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verification_source TEXT
);

-- Attrition Predictions table
CREATE TABLE IF NOT EXISTS public.attrition_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  predicted_attrition_rate DECIMAL(5,2),
  recommended_overbooking INTEGER,
  risk_factors JSONB,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Summaries table
CREATE TABLE IF NOT EXISTS public.message_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  summary TEXT,
  key_points JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Add RLS policies for new tables

-- AI Recommendations: Admin read/write, Providers no access (internal tool)
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on ai_recommendations"
  ON public.ai_recommendations
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Document Extractions: Admin read/write, Providers read own? (maybe not needed for provider)
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on document_extractions"
  ON public.document_extractions
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- SIA License Verifications: Admin read/write, Providers read own staff verifications
ALTER TABLE public.sia_license_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on sia_license_verifications"
  ON public.sia_license_verifications
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Providers can view verifications for their assignments"
  ON public.sia_license_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_details sd
      JOIN public.assignments a ON sd.assignment_id = a.id
      JOIN public.providers p ON a.provider_id = p.id
      WHERE sd.id = sia_license_verifications.staff_detail_id
      AND p.user_id = auth.uid()
    )
  );

-- Attrition Predictions: Admin read/write
ALTER TABLE public.attrition_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on attrition_predictions"
  ON public.attrition_predictions
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Message Summaries: Admin read/write
ALTER TABLE public.message_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on message_summaries"
  ON public.message_summaries
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Create indexes
CREATE INDEX idx_ai_recommendations_event_id ON public.ai_recommendations(event_id);
CREATE INDEX idx_document_extractions_document_id ON public.document_extractions(document_id);
CREATE INDEX idx_sia_license_verifications_staff_detail_id ON public.sia_license_verifications(staff_detail_id);
CREATE INDEX idx_attrition_predictions_event_id ON public.attrition_predictions(event_id);
CREATE INDEX idx_message_summaries_participants ON public.message_summaries(sender_id, receiver_id);
