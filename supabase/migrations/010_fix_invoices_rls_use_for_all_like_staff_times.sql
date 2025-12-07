-- Match the exact pattern that works for staff_times
-- Drop all existing admin policies and recreate using FOR ALL pattern

DROP POLICY IF EXISTS "Admins can insert all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can select all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can update all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can delete all invoices" ON public.invoices;

-- Recreate using FOR ALL pattern like staff_times
CREATE POLICY "Admins can manage all invoices"
  ON public.invoices FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Keep provider policies as they are

