-- Weather & Travel Tables

-- Weather Attendance Predictions
CREATE TABLE IF NOT EXISTS public.weather_attendance_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  forecasted_weather JSONB, -- { temp, condition, precipitation_prob, wind_speed }
  predicted_attrition_rate DECIMAL(5,2),
  recommended_overbooking INTEGER,
  travel_risk_factors JSONB, -- Summary of risks for this event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)
);

-- Provider Travel Risks
CREATE TABLE IF NOT EXISTS public.provider_travel_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  distance_km DECIMAL(10,2),
  estimated_travel_hours DECIMAL(4,2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weather_predictions_event_id ON public.weather_attendance_predictions(event_id);
CREATE INDEX IF NOT EXISTS idx_travel_risks_assignment_id ON public.provider_travel_risks(assignment_id);

-- RLS
ALTER TABLE public.weather_attendance_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_travel_risks ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can do everything on weather_attendance_predictions"
  ON public.weather_attendance_predictions
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on provider_travel_risks"
  ON public.provider_travel_risks
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Providers view own risks?
CREATE POLICY "Providers can view own travel risks"
  ON public.provider_travel_risks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.id = provider_travel_risks.provider_id 
      AND p.user_id = auth.uid()
    )
  );

