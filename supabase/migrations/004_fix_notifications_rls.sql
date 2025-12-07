-- Fix notifications RLS policy to allow admins to insert notifications for any user
-- Drop the existing policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications for any user" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications for themselves" ON public.notifications;

-- Create a more permissive policy that allows admins OR users inserting for themselves
CREATE POLICY "Allow notification inserts"
  ON public.notifications FOR INSERT
  WITH CHECK (
    is_admin(auth.uid()) OR 
    user_id = auth.uid()
  );

