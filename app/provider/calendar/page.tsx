'use client';

import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { useMockDataStore } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Calendar as CalendarIcon, ExternalLink, Grid3x3, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventCalendar } from '@/components/shared/EventCalendar';
import { useEffect } from 'react';

export default function ProviderCalendarPage() {
  const { user } = useAuth();
  const { events, assignments, providers, loadEvents, loadAssignments, loadProviders } = useDataStore();
  const { providers: mockProviders } = useMockDataStore(); // Get mock providers for mock auth lookup
  
  // Check if using mock auth (user ID starts with 'user-' or 'admin-')
  const isMockAuth = user?.id?.startsWith('user-') || user?.id?.startsWith('admin-');
  
  useEffect(() => {
    loadEvents();
    loadAssignments();
    loadProviders();
  }, [loadEvents, loadAssignments, loadProviders]);

  const mockProvider = isMockAuth && user
    ? mockProviders.find((p) => p.user_id === user.id)
    : null;
    
  // If using mock auth, find the corresponding Supabase provider by company name/email
  const provider = isMockAuth && mockProvider
    ? providers.find((p) => 
        p.company_name === mockProvider.company_name || 
        p.contact_email === mockProvider.contact_email
      ) || mockProvider
    : providers.find((p) => p.user_id === user?.id);
    
  // For assignments, use the Supabase provider ID if available (for UUID matching)
  const providerIdForAssignments = isMockAuth && mockProvider && provider && provider.id !== mockProvider.id
    ? provider.id
    : provider?.id;
    
  const providerAssignments = providerIdForAssignments
    ? assignments.filter((a) => a.provider_id === providerIdForAssignments && a.status === 'accepted')
    : [];

  const providerEvents = providerAssignments
    .map((assignment) => {
      const event = events.find((e) => e.id === assignment.event_id);
      return { assignment, event };
    })
    .filter((item): item is { assignment: typeof providerAssignments[0]; event: typeof events[0] } => item.event !== undefined)
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

  // Group events by month
  const eventsByMonth = providerEvents.reduce((acc, { event }) => {
    const month = format(new Date(event.date), 'MMMM yyyy');
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const calendarFeedUrl = provider
    ? typeof window !== 'undefined'
      ? `${window.location.origin}/api/calendar/provider/${provider.id}/token.ics`
      : `/api/calendar/provider/${provider.id}/token.ics`
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">Your confirmed event assignments</p>
        </div>
        {calendarFeedUrl && (
          <a href={calendarFeedUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="bg-background hover:bg-accent">
              <ExternalLink className="h-4 w-4 mr-2" />
              Subscribe to iCal Feed
            </Button>
          </a>
        )}
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">My Events Calendar</CardTitle>
          <CardDescription className="text-muted-foreground">
            All your confirmed events. Subscribe to the iCal feed to add them to your calendar app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providerEvents.length > 0 ? (
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="mb-4 bg-muted">
                <TabsTrigger value="calendar" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <List className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar">
                <EventCalendar
                  events={providerEvents.map(({ event }) => event)}
                  assignments={providerAssignments}
                />
              </TabsContent>

              <TabsContent value="list">
                <div className="space-y-8">
                  {Object.keys(eventsByMonth)
                    .sort((a, b) => {
                      const dateA = new Date(a);
                      const dateB = new Date(b);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map((month) => (
                      <div key={month}>
                        <h2 className="text-xl font-semibold mb-4 text-foreground">{month}</h2>
                        <div className="space-y-3">
                          {eventsByMonth[month].map((event) => {
                            const assignment = providerAssignments.find(
                              (a) => a.event_id === event.id
                            );
                            return (
                              <div
                                key={event.id}
                                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors bg-card"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium text-foreground">
                                      {format(new Date(event.date), 'dd')}
                                    </span>
                                  </div>
                                  <div>
                                    <Link
                                      href={`/provider/events/${event.id}`}
                                      className="font-semibold text-foreground hover:text-primary"
                                    >
                                      {event.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground">{event.location}</p>
                                  </div>
                                </div>
                                {assignment && (
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-foreground">
                                      {assignment.assigned_managers +
                                        assignment.assigned_supervisors +
                                        assignment.assigned_sia +
                                        assignment.assigned_stewards}{' '}
                                      staff
                                    </p>
                                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">Confirmed</Badge>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground py-8">No confirmed events yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

