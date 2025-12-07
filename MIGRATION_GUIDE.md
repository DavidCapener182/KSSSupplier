# Migration Guide: Mock Data to Supabase

This guide explains how to migrate components from using `useMockDataStore` to the unified `useDataStore` that supports both mock and Supabase modes.

## Quick Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { useMockDataStore } from '@/lib/mock-data';
```

**After:**
```typescript
import { useDataStore } from '@/lib/data-store';
```

### 2. Update Store Usage

**Before:**
```typescript
const { events, providers, createEvent } = useMockDataStore();
```

**After:**
```typescript
const { events, providers, createEvent, loadEvents, loadProviders } = useDataStore();
```

### 3. Add Data Loading

For Supabase mode, you need to explicitly load data. Add this to components that need data:

```typescript
import { useLoadData } from '@/lib/supabase/hooks';

export default function MyComponent() {
  const isLoading = useLoadData(); // Loads all initial data
  const { events, providers } = useDataStore();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Rest of component
}
```

Or load specific data:

```typescript
const { loadEvents, loadProviders } = useDataStore();

useEffect(() => {
  loadEvents();
  loadProviders();
}, []);
```

### 4. Update Async Operations

**Before (Mock - synchronous):**
```typescript
const handleCreate = () => {
  const newEvent = createEvent(eventData);
  // Event is immediately available
};
```

**After (Supabase - async):**
```typescript
const handleCreate = async () => {
  try {
    const newEvent = await createEvent(eventData);
    // Event is now in store
    toast({ title: 'Event created', variant: 'success' });
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' });
  }
};
```

### 5. Add Real-time Subscriptions (Optional)

For real-time updates, use the hooks:

```typescript
import { useEventAssignmentsSubscription } from '@/lib/supabase/hooks';

export default function EventDetailPage({ eventId }) {
  useEventAssignmentsSubscription(eventId); // Auto-updates when assignments change
  
  const { assignments } = useDataStore();
  const eventAssignments = assignments.filter(a => a.event_id === eventId);
  
  // Component code
}
```

## Component Migration Checklist

For each component using `useMockDataStore`:

- [ ] Change import to `useDataStore`
- [ ] Add data loading (use `useLoadData` or specific load functions)
- [ ] Update async operations to use `await` and try/catch
- [ ] Add loading states
- [ ] Add error handling with toast notifications
- [ ] Test in both mock and Supabase modes

## Environment Variables

To enable Supabase mode, add to `.env.local`:

```env
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_USE_SUPABASE_AUTH=true
```

To use mock mode (default), don't set these variables or set them to `false`.

## Testing

1. **Test in Mock Mode First**: Verify all functionality works
2. **Switch to Supabase Mode**: Set environment variables
3. **Test Data Operations**: Create, read, update, delete
4. **Test Real-time**: Verify subscriptions work
5. **Test File Uploads**: Verify storage integration
6. **Test Authentication**: Verify login/logout works

## Common Patterns

### Loading Data on Mount
```typescript
useEffect(() => {
  loadEvents();
  loadProviders();
}, [loadEvents, loadProviders]);
```

### Handling Async Errors
```typescript
const handleAction = async () => {
  try {
    await someAction();
    toast({ title: 'Success', variant: 'success' });
  } catch (error: any) {
    toast({ 
      title: 'Error', 
      description: error.message,
      variant: 'destructive' 
    });
  }
};
```

### Real-time Updates
```typescript
// Auto-update when data changes
useEventAssignmentsSubscription(eventId);
useMessagesSubscription(userId1, userId2);
useNotificationsSubscription(userId);
```

## Files to Update

All files in `app/admin` and `app/provider` that use `useMockDataStore` need to be updated. The interface is compatible, so the changes are minimal.


