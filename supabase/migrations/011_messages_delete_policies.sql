-- Allow admins to delete any messages
CREATE POLICY "Admins can delete all messages"
  ON public.messages FOR DELETE
  USING (is_admin(auth.uid()));

-- Allow users to delete messages they are part of
CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());


