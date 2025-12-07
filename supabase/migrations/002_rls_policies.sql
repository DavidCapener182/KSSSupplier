-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_documents ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT get_user_role(user_uuid) = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get provider_id from user_id
CREATE OR REPLACE FUNCTION get_provider_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT id FROM public.providers WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view their own record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (is_admin(auth.uid()));

-- Events policies
CREATE POLICY "Admins can manage all events"
  ON public.events FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Providers can view events they're assigned to"
  ON public.events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.event_id = events.id
      AND assignments.provider_id = get_provider_id(auth.uid())
    )
  );

-- Providers policies
CREATE POLICY "Users can view their own provider record"
  ON public.providers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all providers"
  ON public.providers FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can update their own provider record"
  ON public.providers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update all providers"
  ON public.providers FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert providers"
  ON public.providers FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Assignments policies
CREATE POLICY "Admins can manage all assignments"
  ON public.assignments FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Providers can view their own assignments"
  ON public.assignments FOR SELECT
  USING (provider_id = get_provider_id(auth.uid()));

CREATE POLICY "Providers can update their own assignments"
  ON public.assignments FOR UPDATE
  USING (provider_id = get_provider_id(auth.uid()));

-- Staff details policies
CREATE POLICY "Admins can manage all staff details"
  ON public.staff_details FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Providers can manage staff details for their assignments"
  ON public.staff_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.id = staff_details.assignment_id
      AND assignments.provider_id = get_provider_id(auth.uid())
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages they sent or received"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they received"
  ON public.messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- Documents policies
CREATE POLICY "Admins can manage all documents"
  ON public.documents FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Providers can view documents for their events"
  ON public.documents FOR SELECT
  USING (
    provider_id IS NULL OR
    provider_id = get_provider_id(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.event_id = documents.event_id
      AND assignments.provider_id = get_provider_id(auth.uid())
      AND assignments.status = 'accepted'
    )
  );

-- Document comments policies
CREATE POLICY "Users can view comments on documents they can access"
  ON public.document_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_comments.document_id
      AND (
        documents.provider_id IS NULL OR
        documents.provider_id = get_provider_id(auth.uid()) OR
        is_admin(auth.uid())
      )
    )
  );

CREATE POLICY "Users can add comments to accessible documents"
  ON public.document_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_comments.document_id
      AND (
        documents.provider_id IS NULL OR
        documents.provider_id = get_provider_id(auth.uid()) OR
        is_admin(auth.uid())
      )
    )
  );

-- Invoices policies
CREATE POLICY "Admins can manage all invoices"
  ON public.invoices FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Providers can view and create their own invoices"
  ON public.invoices FOR SELECT
  USING (provider_id = get_provider_id(auth.uid()));

CREATE POLICY "Providers can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (provider_id = get_provider_id(auth.uid()));

-- Event templates policies
CREATE POLICY "Admins can manage event templates"
  ON public.event_templates FOR ALL
  USING (is_admin(auth.uid()));

-- Activity logs policies
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Onboarding documents policies
CREATE POLICY "Users can view their own onboarding documents"
  ON public.onboarding_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = onboarding_documents.provider_id
      AND providers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all onboarding documents"
  ON public.onboarding_documents FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can update their own onboarding documents"
  ON public.onboarding_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = onboarding_documents.provider_id
      AND providers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own onboarding documents"
  ON public.onboarding_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = onboarding_documents.provider_id
      AND providers.user_id = auth.uid()
    )
  );


