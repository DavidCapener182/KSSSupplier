# KSS NW UK Event Staffing Management Platform

Event staffing management platform for KSS NW UK 2026 Festival Season. This platform allows Admin users to create events, assign staffing requirements to Labour Provider companies, and track confirmations and performance. Each labour provider has a secure dashboard to view their assigned events, accept work, upload required staff details, communicate via chat, and manage invoices.

## Features

### Admin Dashboard
- **Event Management**: Create, view, and manage events with staff requirements
- **Provider Assignment**: Assign providers to events with specific role counts
- **Real-time Updates**: See provider acceptances and updates in real-time
- **Document Sharing**: Upload and share briefing documents with providers
- **KPI Tracking**: Monitor attendance rates and performance metrics
- **Chat**: Communicate with providers in real-time
- **Invoice Management**: View and process provider invoices
- **Calendar Integration**: iCal feed for all events

### Provider Dashboard
- **Event Overview**: View assigned events with pending and confirmed status
- **Accept/Decline**: Respond to event assignments
- **Staff Details**: Upload PNC/SIA information for accreditation
- **Document Access**: Download event briefing documents
- **Chat**: Communicate with admin in real-time
- **Invoice Submission**: Upload invoices after event completion
- **Calendar Integration**: Personal iCal feed for assigned events

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand (Phase 1 - Mock Data)
- **Backend**: Supabase (Phase 2 - Integration)
- **Calendar**: ical-generator

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
cd "KSS NW UK Supplier Portal"
```

2. Install dependencies
```bash
npm install
```

3. Create environment file (for Phase 2 - Supabase integration)
```bash
cp .env.local.example .env.local
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Mock Authentication (Phase 1)

The platform currently uses mock authentication for development:

1. Navigate to `/login`
2. Select a role:
   - **Admin**: Full access to all features
   - **Provider**: Select a provider company from the dropdown
3. Click "Sign in" to access the appropriate dashboard

### Testing the Platform

#### As Admin:
1. Login as Admin
2. Navigate to Events → Create Event
3. Fill in event details and staff requirements
4. Go to the event detail page
5. Assign providers to the event
6. View real-time updates when providers accept assignments
7. Upload documents, request staff details, and track KPIs

#### As Provider:
1. Login as a Provider (select from dropdown)
2. View assigned events on the dashboard
3. Accept or decline assignments
4. Upload staff details when requested
5. Download briefing documents
6. Chat with admin
7. Submit invoices after events

## Project Structure

```
/app
  /(auth)          # Authentication pages
  /admin           # Admin dashboard pages
  /provider        # Provider dashboard pages
  /api             # API routes (calendar feeds)
/components
  /ui              # shadcn/ui components
  /admin           # Admin-specific components
  /provider        # Provider-specific components
  /shared          # Shared components
/lib
  /types.ts        # TypeScript type definitions
  /mock-data.ts    # Zustand store with mock data
  /auth-context.tsx # Authentication context
/hooks
  /use-realtime.ts # Real-time subscription hooks
```

## Phase 2: Supabase Integration

The platform is designed to integrate with Supabase in Phase 2. The following will be implemented:

- **Database Schema**: Events, Providers, Assignments, Staff Details, Messages, Documents, Invoices
- **Authentication**: Supabase Auth with role-based access
- **Row Level Security**: RLS policies to ensure data isolation
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for documents and invoices

## Calendar Integration

### Admin Calendar Feed
Subscribe to all events:
```
https://your-domain.com/api/calendar/admin.ics
```

### Provider Calendar Feed
Subscribe to your assigned events:
```
https://your-domain.com/api/calendar/provider/{providerId}/token.ics
```

Add these URLs to Google Calendar, Apple Calendar, Outlook, or any calendar app that supports iCal feeds.

## Development Notes

- **Mock Data**: Currently uses Zustand store for state management. All data is in-memory and resets on page refresh.
- **Real-time**: Simulated using Zustand subscriptions. Will be replaced with Supabase Realtime in Phase 2.
- **File Uploads**: Currently simulated. Will use Supabase Storage in Phase 2.

## License

Private - KSS NW UK 2026 Festival Season


