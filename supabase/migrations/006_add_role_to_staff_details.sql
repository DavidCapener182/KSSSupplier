-- Add role column to staff_details table
ALTER TABLE public.staff_details ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('Manager', 'Supervisor', 'SIA', 'Steward'));
