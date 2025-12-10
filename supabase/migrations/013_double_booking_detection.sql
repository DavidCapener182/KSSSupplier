-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create double_booking_alerts table
CREATE TABLE IF NOT EXISTS public.double_booking_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  staff_detail_id_1 UUID NOT NULL REFERENCES public.staff_details(id) ON DELETE CASCADE,
  staff_detail_id_2 UUID NOT NULL REFERENCES public.staff_details(id) ON DELETE CASCADE,
  sia_number TEXT,
  staff_name TEXT,
  match_type TEXT CHECK (match_type IN ('sia_number', 'name_fuzzy')),
  similarity_score DECIMAL(4,3), -- 0.000 to 1.000
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for staff_details lookups
CREATE INDEX IF NOT EXISTS idx_staff_details_sia_number ON public.staff_details(sia_number);
-- Add GIN index for fuzzy text search on staff_name
CREATE INDEX IF NOT EXISTS idx_staff_details_staff_name_trgm ON public.staff_details USING GIN (staff_name gin_trgm_ops);

-- Add indexes for double_booking_alerts
CREATE INDEX IF NOT EXISTS idx_double_booking_alerts_event_id ON public.double_booking_alerts(event_id);
CREATE INDEX IF NOT EXISTS idx_double_booking_alerts_status ON public.double_booking_alerts(status);

-- Enable RLS
ALTER TABLE public.double_booking_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can do everything on double_booking_alerts"
  ON public.double_booking_alerts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Providers can only view alerts related to their own staff assignments
CREATE POLICY "Providers can view relevant double booking alerts"
  ON public.double_booking_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_details sd
      JOIN public.assignments a ON sd.assignment_id = a.id
      JOIN public.providers p ON a.provider_id = p.id
      WHERE (sd.id = double_booking_alerts.staff_detail_id_1 OR sd.id = double_booking_alerts.staff_detail_id_2)
      AND p.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_double_booking_alerts_updated_at BEFORE UPDATE ON public.double_booking_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

