-- Post-Event Success Reports Schema

CREATE TABLE IF NOT EXISTS public.event_success_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  report_text TEXT,
  report_pdf_path TEXT,
  performance_attendance_rate DECIMAL(5,2),
  financial_total_cost DECIMAL(10,2),
  financial_budget DECIMAL(10,2),
  financial_variance DECIMAL(10,2),
  issues_count INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)
);

-- Indexes
CREATE INDEX idx_event_success_reports_event_id ON public.event_success_reports(event_id);

-- RLS Policies
ALTER TABLE public.event_success_reports ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on event_success_reports"
  ON public.event_success_reports
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

