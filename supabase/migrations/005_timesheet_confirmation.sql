-- Add timesheets_confirmed column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS timesheets_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

-- Add attachment columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_path TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;



