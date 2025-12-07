'use client';

import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { useMockDataStore } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Calendar, CheckCircle, Clock, XCircle, ArrowRight, MapPin, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function ProviderEventsPage() {
  const { user } = useAuth();
  const { events, assignments, providers, availability, loadEvents, loadAssignments, loadProviders, loadProviderAvailability, setProviderAvailability, isLoading } = useDataStore();
  const { providers: mockProviders } = useMockDataStore(); // Get mock providers for mock auth lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // Check if using mock auth (user ID starts with 'user-' or 'admin-')
  const isMockAuth = user?.id?.startsWith('user-') || user?.id?.startsWith('admin-');
  
  useEffect(() => {
    loadEvents();
    loadAssignments();
    loadProviders();
  }, [loadEvents, loadAssignments, loadProviders]);

  // Wait for providers to load before checking
  // Use mock providers if using mock auth, otherwise use Supabase providers
  const mockProvider = isMockAuth && user
    ? mockProviders.find((p) => p.user_id === user.id)
    : null;
    
  // If using mock auth, find the corresponding Supabase provider by company name/email
  // This is needed because assignments in Supabase use UUID provider_ids
  const provider = isMockAuth && mockProvider
    ? providers.find((p) => 
        p.company_name === mockProvider.company_name || 
        p.contact_email === mockProvider.contact_email
      ) || mockProvider // Fallback to mock provider if not found in Supabase
    : (user && providers.length > 0
        ? providers.find((p) => p.user_id === user.id)
        : null);
    
  // For assignments, use the Supabase provider ID if available (for UUID matching)
  // Otherwise use the mock provider ID
  const providerIdForAssignments = isMockAuth && mockProvider && provider && provider.id !== mockProvider.id
    ? provider.id // Use Supabase UUID
    : provider?.id; // Use provider ID (either mock or Supabase)

  // Load availability for this provider
  useEffect(() => {
    if (providerIdForAssignments) {
      loadProviderAvailability(providerIdForAssignments);
    }
  }, [providerIdForAssignments, loadProviderAvailability]);
    
  const providerAssignments = providerIdForAssignments
    ? assignments.filter((a) => a.provider_id === providerIdForAssignments)
    : [];

  // Availability map for this provider
  const availabilityByEvent = availability.reduce<Record<string, 'available' | 'unavailable'>>((acc, item) => {
    if (item.provider_id === providerIdForAssignments) {
      acc[item.event_id] = item.status;
    }
    return acc;
  }, {});

  // Filter assignments by status
  const filteredAssignments = providerAssignments.filter((assignment) => {
    if (statusFilter !== 'all' && assignment.status !== statusFilter) {
      return false;
    }
    
    if (searchQuery) {
      const event = events.find((e) => e.id === assignment.event_id);
      if (event) {
        const searchLower = searchQuery.toLowerCase();
        return (
          event.name.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
        );
      }
    }
    
    return true;
  });

  // Get events for filtered assignments
  const filteredEvents = filteredAssignments
    .map((assignment) => {
      const event = events.find((e) => e.id === assignment.event_id);
      return { assignment, event };
    })
    .filter((item): item is { assignment: typeof providerAssignments[0]; event: typeof events[0] } => item.event !== undefined)
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-transparent flex items-center w-fit gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Accepted</span>
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700 border-transparent flex items-center w-fit gap-1">
            <XCircle className="h-3 w-3" />
            <span>Declined</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-transparent flex items-center w-fit gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
    }
  };

  const handleAvailability = async (eventId: string, status: 'available' | 'unavailable') => {
    if (!providerIdForAssignments) return;
    setIsUpdating(eventId + status);
    try {
      await setProviderAvailability(providerIdForAssignments, eventId, status);
      // availability state will refresh via store
    } finally {
      setIsUpdating(null);
    }
  };

  // Show loading state while data is loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if provider not found after loading
  if (!provider && user && providers.length > 0) {
    return (
      <div className="space-y-6 p-2">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/provider/dashboard' },
            { label: 'Events' },
          ]}
        />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <Card className="border-none shadow-md">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-2">Provider not found</p>
                <p className="text-sm text-gray-500 mb-4">
                  Your account may not be linked to a provider profile. Please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If no user, show login prompt
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Please log in to view your events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/provider/dashboard' },
          { label: 'Events' },
        ]}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Your event assignments and confirmations</p>
        </div>
      </div>

      <Card className="border-none shadow-md bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-lg font-semibold text-foreground">Your Events</CardTitle>
          <CardDescription className="text-muted-foreground">View and manage your event assignments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search events by name or location..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background hover:bg-accent'}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  className={statusFilter === 'pending' ? 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700' : 'bg-background hover:bg-accent'}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'accepted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('accepted')}
                  className={statusFilter === 'accepted' ? 'bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' : 'bg-background hover:bg-accent'}
                >
                  Accepted
                </Button>
                <Button
                  variant={statusFilter === 'declined' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('declined')}
                  className={statusFilter === 'declined' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-background hover:bg-accent'}
                >
                  Declined
                </Button>
              </div>
            </div>
          </div>
          
          {filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="font-semibold text-foreground">Event</TableHead>
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Location</TableHead>
                    <TableHead className="font-semibold text-foreground">Staff Assigned</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map(({ assignment, event }) => (
                    <TableRow key={assignment.id} className="hover:bg-muted/50 border-b border-border last:border-0">
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/provider/events/${event.id}`}
                            className="text-foreground hover:text-primary font-semibold transition-colors"
                          >
                            {event.name}
                          </Link>
                          {assignment.status === 'accepted' && assignment.details_requested && (
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-transparent w-fit text-[10px]">
                              PNC Details Required
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(event.date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[150px]" title={event.location}>{event.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1 text-muted-foreground">
                          {assignment.assigned_managers > 0 && (
                            <div className="flex justify-between max-w-[120px]"><span>Managers:</span> <span className="font-medium text-foreground">{assignment.assigned_managers}</span></div>
                          )}
                          {assignment.assigned_supervisors > 0 && (
                            <div className="flex justify-between max-w-[120px]"><span>Supervisors:</span> <span className="font-medium text-foreground">{assignment.assigned_supervisors}</span></div>
                          )}
                          {assignment.assigned_sia > 0 && (
                            <div className="flex justify-between max-w-[120px]"><span>SIA:</span> <span className="font-medium text-foreground">{assignment.assigned_sia}</span></div>
                          )}
                          {assignment.assigned_stewards > 0 && (
                            <div className="flex justify-between max-w-[120px]"><span>Stewards:</span> <span className="font-medium text-foreground">{assignment.assigned_stewards}</span></div>
                          )}
                          {assignment.assigned_managers === 0 &&
                            assignment.assigned_supervisors === 0 &&
                            assignment.assigned_sia === 0 &&
                            assignment.assigned_stewards === 0 && (
                              <span className="text-muted-foreground italic">No staff assigned</span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/provider/events/${event.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary">
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12">
              <EmptyState
                icon={Calendar}
                title="No events found"
                description={
                  searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'You have no event assignments yet'
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-lg font-semibold text-foreground">All Event Dates & Locations</CardTitle>
          <CardDescription className="text-muted-foreground">
            Indicate your availability. Event names are hidden by design.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="font-semibold text-foreground">Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Location</TableHead>
                  <TableHead className="font-semibold text-foreground">Availability</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length > 0 ? (
                  events
                    .slice()
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event) => {
                      const status = availabilityByEvent[event.id];
                      return (
                        <TableRow key={event.id} className="hover:bg-muted/50 border-b border-border last:border-0">
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(event.date), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[200px]" title={event.location}>{event.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {status === 'available' && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 border-transparent">Available</Badge>
                            )}
                            {status === 'unavailable' && (
                              <Badge variant="secondary" className="bg-red-100 text-red-700 border-transparent">Unavailable</Badge>
                            )}
                            {!status && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-transparent">No response</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant={status === 'available' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleAvailability(event.id, 'available')}
                                disabled={isUpdating !== null}
                                className={status === 'available' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-background hover:bg-accent'}
                              >
                                Available
                              </Button>
                              <Button
                                variant={status === 'unavailable' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleAvailability(event.id, 'unavailable')}
                                disabled={isUpdating !== null}
                                className={status === 'unavailable' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-background hover:bg-accent'}
                              >
                                Unavailable
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="py-8">
                        <EmptyState
                          icon={Calendar}
                          title="No events available"
                          description="There are no events yet."
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
