-- Add CHECK constraint for entity_type to match TypeScript union type
-- Only add if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'activity_logs_entity_type_check'
  ) THEN
    ALTER TABLE public.activity_logs
      ADD CONSTRAINT activity_logs_entity_type_check 
      CHECK (entity_type IN ('event', 'assignment', 'invoice', 'document', 'message'));
  END IF;
END $$;

-- Add INSERT policies for activity logs
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;

-- Allow authenticated users to insert activity logs (system-generated)
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow admins to insert activity logs for any user (for system actions)
CREATE POLICY "Admins can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Add index for created_at to improve query performance for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

