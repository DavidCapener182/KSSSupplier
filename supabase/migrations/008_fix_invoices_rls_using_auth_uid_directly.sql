-- Fix invoices RLS by using direct role check instead of is_admin() function
-- The issue might be that is_admin() isn't working correctly in the WITH CHECK clause
-- This creates a more direct policy that checks the user role directly

DROP POLICY IF EXISTS "Admins can insert all invoices" ON public.invoices;

-- Create a new policy that checks the role directly in the WITH CHECK clause
CREATE POLICY "Admins can insert all invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

