-- Helper function to get admin user ID
-- Providers can call this to find the admin user for messaging
CREATE OR REPLACE FUNCTION get_admin_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE role = 'admin' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
