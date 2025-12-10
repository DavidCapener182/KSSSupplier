-- Add 'purchase_order' status to invoices table
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('pending', 'approved', 'paid', 'purchase_order'));

-- Allow file_path to be NULL for purchase orders (they're generated on-demand)
ALTER TABLE public.invoices
  ALTER COLUMN file_path DROP NOT NULL;

