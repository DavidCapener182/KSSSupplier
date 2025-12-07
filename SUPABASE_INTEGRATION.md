# Supabase Integration Guide

## ✅ Completed Integration Steps

### 1. Database Setup ✅
- All 13 tables created with proper relationships
- Row Level Security (RLS) policies configured
- Indexes and triggers set up
- Helper functions for role checking

### 2. Supabase Client Configuration ✅
- Client-side client (`lib/supabase/client.ts`)
- Server-side client with cookie handling (`lib/supabase/server.ts`)
- Environment variables configured

### 3. Authentication System ✅
- Supabase Auth functions (`lib/supabase/auth.ts`)
- Hybrid auth context supporting both Supabase and mock auth
- Login page with tabs for both authentication methods

### 4. Data Layer ✅
- Complete Supabase data functions (`lib/supabase/data.ts`)
- Supabase store with Zustand (`lib/supabase-store.ts`)
- Unified data store interface (`lib/data-store.ts`)

### 5. Storage Functions ✅
- File upload/download functions (`lib/supabase/storage.ts`)
- Helper functions for documents, invoices, and onboarding files

### 6. Real-time Subscriptions ✅
- Real-time hooks for assignments, messages, notifications (`lib/supabase/realtime.ts`)

### 7. API Routes Updated ✅
- iCal calendar feeds now use Supabase data

## 🚀 How to Enable Supabase

### Step 1: Set Environment Variable

Add to your `.env.local`:
```env
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_USE_SUPABASE_AUTH=true
```

### Step 2: Create Storage Buckets

In your Supabase Dashboard → Storage, create these buckets (all private):
1. `documents` - For event briefing documents
2. `invoices` - For provider invoices  
3. `onboarding` - For signed agreements and NDAs

### Step 3: Set Up Storage Policies

Run this SQL in your Supabase SQL Editor:

```sql
-- Documents bucket policies
CREATE POLICY "Admins can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view documents they have access to"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
      EXISTS (
        SELECT 1 FROM public.documents d
        JOIN public.assignments a ON a.event_id = d.event_id
        JOIN public.providers p ON p.id = a.provider_id
        WHERE p.user_id = auth.uid()
        AND d.file_path = (bucket_id || '/' || name)
      )
    )
  );

-- Invoices bucket policies
CREATE POLICY "Providers can upload their own invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE user_id = auth.uid()
      AND (bucket_id || '/' || name) LIKE ('invoices/providers/' || id || '/%')
    )
  );

CREATE POLICY "Admins can view all invoices"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Providers can view their own invoices"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE user_id = auth.uid()
      AND (bucket_id || '/' || name) LIKE ('invoices/providers/' || id || '/%')
    )
  );

-- Onboarding bucket policies
CREATE POLICY "Users can upload their own onboarding documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'onboarding' AND
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE user_id = auth.uid()
      AND (bucket_id || '/' || name) LIKE ('onboarding/providers/' || id || '/%')
    )
  );

CREATE POLICY "Users can view their own onboarding documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'onboarding' AND
    (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
      EXISTS (
        SELECT 1 FROM public.providers
        WHERE user_id = auth.uid()
        AND (bucket_id || '/' || name) LIKE ('onboarding/providers/' || id || '/%')
      )
    )
  );
```

### Step 4: Create Initial Admin User

1. Go to **Authentication** in Supabase dashboard
2. Create a user (via email signup or manually)
3. Note the user's UUID from `auth.users`
4. Run this SQL:

```sql
INSERT INTO public.users (id, email, role)
VALUES (
  'user-uuid-from-auth-users',
  'admin@kssnwltd.co.uk',
  'admin'
);
```

### Step 5: Update Components to Use New Store

Replace `useMockDataStore` with `useDataStore` in components:

```typescript
// Old
import { useMockDataStore } from '@/lib/mock-data';

// New
import { useDataStore } from '@/lib/data-store';
```

The interface is compatible, so components should work with minimal changes.

## 📝 Migration Checklist

- [x] Database schema created
- [x] RLS policies configured
- [x] Supabase clients created
- [x] Authentication system integrated
- [x] Data layer functions created
- [x] Storage functions created
- [x] Real-time subscriptions set up
- [x] iCal feeds updated
- [ ] Storage buckets created (manual step)
- [ ] Storage policies applied (manual step)
- [ ] Initial admin user created (manual step)
- [ ] Components updated to use `useDataStore`
- [ ] Testing completed

## 🔄 Switching Between Mock and Supabase

The system supports both modes:

**Mock Mode (Default):**
- Uses Zustand store with in-memory data
- No environment variables needed
- Perfect for development and testing

**Supabase Mode:**
- Set `NEXT_PUBLIC_USE_SUPABASE=true`
- Set `NEXT_PUBLIC_USE_SUPABASE_AUTH=true`
- Uses real database, storage, and authentication
- Production-ready

## 🧪 Testing

1. Start with mock mode to verify UI/UX
2. Switch to Supabase mode for integration testing
3. Test all CRUD operations
4. Verify RLS policies work correctly
5. Test file uploads to storage
6. Verify real-time updates work

## 📚 Next Steps

1. Update all components to use `useDataStore` instead of `useMockDataStore`
2. Add loading states for async operations
3. Add error handling for Supabase operations
4. Test real-time subscriptions
5. Verify file uploads work with storage
6. Create seed data script for initial setup


