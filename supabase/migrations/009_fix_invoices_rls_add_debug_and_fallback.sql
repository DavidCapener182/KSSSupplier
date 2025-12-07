-- Add a more robust policy that handles edge cases
-- Also, let's make sure the policy works even if there are timing issues

DROP POLICY IF EXISTS "Admins can insert all invoices" ON public.invoices;

-- Create a policy that's more explicit and handles null cases
CREATE POLICY "Admins can insert all invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    -- Direct check: user exists, is authenticated, and is admin
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

