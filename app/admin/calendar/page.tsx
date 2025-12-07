'use client';

import { useState, useEffect } from 'react';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventCalendar } from '@/components/shared/EventCalendar';
import { format } from 'date-fns';
import Link from 'next/link';
import { Calendar as CalendarIcon, ExternalLink, Grid3x3, List } from 'lucide-react';

export default function CalendarPage() {
  const { events, assignments, loadEvents, loadAssignments } = useDataStore();
  
  useEffect(() => {
    loadEvents();
    loadAssignments();
  }, [loadEvents, loadAssignments]);

  // Group events by month
  const eventsByMonth = events.reduce((acc, event) => {
    const month = format(new Date(event.date), 'MMMM yyyy');
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  // Sort events within each month
  Object.keys(eventsByMonth).forEach((month) => {
    eventsByMonth[month].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  });

  const getEventStatus = (eventId: string) => {
    const eventAssignments = assignments.filter((a) => a.event_id === eventId);
    const confirmed = eventAssignments.filter((a) => a.status === 'accepted').length;
    const total = eventAssignments.length;

    if (total === 0) return { label: 'Unassigned', variant: 'destructive' as const };
    if (confirmed === total) return { label: 'Fully Confirmed', variant: 'success' as const };
    if (confirmed > 0) return { label: 'Partially Confirmed', variant: 'warning' as const };
    return { label: 'Pending', variant: 'warning' as const };
  };

  const calendarFeedUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/calendar/admin.ics`
    : '/api/calendar/admin.ics';

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">View all events in calendar format</p>
        </div>
        <div className="flex items-center space-x-4">
          <a href={calendarFeedUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="bg-background hover:bg-accent">
              <ExternalLink className="h-4 w-4 mr-2" />
              Subscribe to iCal Feed
            </Button>
          </a>
        </div>
      </div>

      <Card className="border-none shadow-md bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-foreground">Event Calendar</CardTitle>
          <CardDescription className="text-muted-foreground">
            All events for the 2026 season. Subscribe to the iCal feed to add events to your
            calendar app.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
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
                events={events}
                assignments={assignments}
                getEventStatus={getEventStatus}
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
                          const status = getEventStatus(event.id);
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
                                    href={`/admin/events/${event.id}`}
                                    className="font-semibold text-foreground hover:text-primary"
                                  >
                                    {event.name}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{event.location}</p>
                                </div>
                              </div>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

