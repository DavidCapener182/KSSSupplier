-- Redesign staff_times to support role-based assignments
-- Drop the old table and recreate with role support
DROP TABLE IF EXISTS public.staff_times CASCADE;

-- Create new staff_times table with role support
CREATE TABLE public.staff_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('managers', 'supervisors', 'sia', 'stewards')),
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
CREATE INDEX idx_staff_times_role ON public.staff_times(assignment_id, role_type, shift_number);

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

