-- Fix invoices RLS to ensure admins can insert invoices (including purchase orders)
-- The existing policy uses USING which works for SELECT/UPDATE/DELETE but INSERT needs WITH CHECK

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;

-- Recreate with proper WITH CHECK for INSERT operations
CREATE POLICY "Admins can manage all invoices"
  ON public.invoices FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

