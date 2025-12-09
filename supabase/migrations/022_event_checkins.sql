-- 1. Add Status to Events Table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled'));

-- 2. Create the Check-Ins Table (The Digital Log)
CREATE TABLE IF NOT EXISTS public.event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- We link to the specific staff detail record if found
  staff_detail_id UUID REFERENCES public.staff_details(id) ON DELETE SET NULL,
  
  -- We record the RAW data scanned, even if they aren't on the list
  sia_number TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  
  -- Tracking the source
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  
  -- Audit details
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_in_method TEXT DEFAULT 'qr_scan' CHECK (check_in_method IN ('qr_scan', 'manual_entry')),
  
  -- Verification status
  verified BOOLEAN DEFAULT FALSE, -- True = Was on the expected list
  is_duplicate BOOLEAN DEFAULT FALSE, -- True = Scanned twice
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add Indexing for fast scanning
CREATE INDEX IF NOT EXISTS idx_event_checkins_event_sia ON public.event_checkins(event_id, sia_number);
CREATE INDEX IF NOT EXISTS idx_event_checkins_event_id ON public.event_checkins(event_id);

-- 4. Enable RLS
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Admins can do everything
CREATE POLICY "Admins can manage all event_checkins"
  ON public.event_checkins FOR ALL
  USING (is_admin(auth.uid()));

-- Providers can view check-ins for their staff
CREATE POLICY "Providers can view check-ins for their staff"
  ON public.event_checkins FOR SELECT
  USING (
    provider_id = get_provider_id(auth.uid()) OR
    EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.staff_details sd ON sd.assignment_id = a.id
        WHERE sd.id = event_checkins.staff_detail_id
        AND a.provider_id = get_provider_id(auth.uid())
    )
  );

