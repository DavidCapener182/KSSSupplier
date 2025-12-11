-- Lazy Booker Detector Schema

CREATE TABLE IF NOT EXISTS public.lazy_booking_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL, -- 0-100
  pattern_description TEXT NOT NULL,
  days_before_event INTEGER NOT NULL,
  staff_upload_velocity JSONB, -- Details on upload timing
  status TEXT NOT NULL CHECK (status IN ('pending', 'resolved', 'ignored')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lazy_booking_alerts_provider_id ON public.lazy_booking_alerts(provider_id);
CREATE INDEX idx_lazy_booking_alerts_event_id ON public.lazy_booking_alerts(event_id);
CREATE INDEX idx_lazy_booking_alerts_status ON public.lazy_booking_alerts(status);

-- RLS Policies
ALTER TABLE public.lazy_booking_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on lazy_booking_alerts"
  ON public.lazy_booking_alerts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_lazy_booking_alerts_updated_at BEFORE UPDATE ON public.lazy_booking_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



