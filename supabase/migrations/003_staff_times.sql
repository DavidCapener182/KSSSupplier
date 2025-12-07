-- Staff times table
-- Stores the staff count and times (start/end in 24hr format) for each assignment
-- Allows multiple shifts per assignment (e.g., 20 staff 09:00-17:00, 24 staff 17:00-01:00)
CREATE TABLE public.staff_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  staff_count INTEGER NOT NULL,
  start_time TIME NOT NULL, -- 24hr format (e.g., '09:00:00')
  end_time TIME NOT NULL, -- 24hr format (e.g., '17:00:00')
  shift_number INTEGER NOT NULL DEFAULT 1, -- Order of shifts (1, 2, 3, etc.)
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_staff_times_assignment_id ON public.staff_times(assignment_id);
CREATE INDEX idx_staff_times_assignment_shift ON public.staff_times(assignment_id, shift_number);

-- Add updated_at trigger
CREATE TRIGGER update_staff_times_updated_at BEFORE UPDATE ON public.staff_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for staff_times
CREATE POLICY "Admins can manage all staff times"
  ON public.staff_times FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Providers can view staff times for their assignments"
  ON public.staff_times FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.id = staff_times.assignment_id
      AND assignments.provider_id = get_provider_id(auth.uid())
    )
  );

