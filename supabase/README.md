# Supabase Database Setup

This directory contains SQL migration files for setting up the KSS NW UK Labour Provider Portal database.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Note down your project URL and anon key

### 2. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Run Migrations

You can run these migrations in two ways:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `001_initial_schema.sql`
4. Run the query
5. Repeat for `002_rls_policies.sql`

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Set Up Storage Buckets

After running migrations, set up storage buckets in Supabase Dashboard:

1. Go to Storage in your Supabase dashboard
2. Create the following buckets:
   - `documents` (public: false)
   - `invoices` (public: false)
   - `onboarding` (public: false)

3. Set up storage policies (or use the SQL below):

```sql
-- Documents bucket policies
CREATE POLICY "Admins can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'events'
  );

CREATE POLICY "Users can view documents they have access to"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

-- Invoices bucket policies
CREATE POLICY "Providers can upload their own invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all invoices"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Onboarding bucket policies
CREATE POLICY "Users can upload their own onboarding documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'onboarding' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 5. Create Initial Admin User

After setting up the database, create an admin user:

1. Go to Authentication in Supabase dashboard
2. Create a new user manually or via email signup
3. Run this SQL to set the user role:

```sql
INSERT INTO public.users (id, email, role)
VALUES (
  'user-uuid-from-auth-users',
  'admin@kssnwltd.co.uk',
  'admin'
);
```

## Migration Files

- `001_initial_schema.sql` - Creates all tables, indexes, and triggers
- `002_rls_policies.sql` - Sets up Row Level Security policies

## Database Schema Overview

### Core Tables
- `users` - Extends Supabase auth.users with role information
- `events` - Event information and staff requirements
- `providers` - Labour provider companies
- `assignments` - Links providers to events with staff counts

### Supporting Tables
- `staff_details` - PNC/SIA information for staff
- `messages` - Chat messages between admin and providers
- `documents` - Event briefing documents
- `document_comments` - Comments on documents
- `invoices` - Provider invoices
- `event_templates` - Reusable event templates
- `activity_logs` - System activity tracking
- `notifications` - User notifications
- `onboarding_documents` - Signed agreements and NDAs

## Security

All tables have Row Level Security (RLS) enabled with policies that:
- Allow admins full access
- Restrict providers to their own data
- Ensure data isolation between providers


