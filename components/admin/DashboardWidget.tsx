'use client';

import { useState, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';
import type { Event, Assignment, Provider } from '@/lib/types';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { EventDetailsDialog } from './EventDetailsDialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const DashboardWidget = forwardRef<HTMLDivElement, DashboardWidgetProps>(
  ({ title, description, children, className }, ref) => {
    return (
      <Card ref={ref} className={cn('flex flex-col h-full', className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex-1 min-h-0">{children}</CardContent>
      </Card>
    );
  }
);

DashboardWidget.displayName = 'DashboardWidget';

interface UpcomingEventsWidgetProps {
  events: Event[];
  assignments: Assignment[];
  providers: Provider[];
  className?: string;
}

export const UpcomingEventsWidget = forwardRef<HTMLDivElement, UpcomingEventsWidgetProps>(
  ({ events, assignments, providers, className }, ref) => {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const upcoming = events
      .filter((e) => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);

    return (
      <>
        <DashboardWidget ref={ref} title="Upcoming Events" description="Next 10 events on the schedule" className={className}>
        <div className="flex h-full flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {upcoming.map((event) => {
              const daysUntil = differenceInDays(new Date(event.date), new Date());
              const eventAssignments = assignments.filter((a) => a.event_id === event.id);
              const confirmed = eventAssignments.filter((a) => a.status === 'accepted').length;
              const isUrgent = daysUntil <= 7 && confirmed < eventAssignments.length;

              return (
                <div
                  key={event.id}
                  className="p-2.5 border rounded-lg hover:bg-accent transition-colors animate-fade-in cursor-pointer"
                  onClick={() => setSelectedEventId(event.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEventId(event.id);
                    }
                  }}
                  aria-label={`View details for ${event.name}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium leading-tight">{event.name}</p>
                        {isUrgent && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground leading-tight">
                        {format(new Date(event.date), 'MMM dd, yyyy')} • {event.location}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {daysUntil === 0
                          ? 'Today'
                          : daysUntil === 1
                          ? 'Tomorrow'
                          : `${daysUntil} days away`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={confirmed === eventAssignments.length ? 'default' : 'secondary'}>
                        {confirmed}/{eventAssignments.length}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-1">
            <Link href="/admin/events">
              <Button variant="outline" className="w-full" size="sm">
                View More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </DashboardWidget>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={events.find((e) => e.id === selectedEventId) || null}
        assignments={assignments}
        providers={providers}
        open={!!selectedEventId}
        onOpenChange={(open) => !open && setSelectedEventId(null)}
      />
    </>
  );
  }
);

UpcomingEventsWidget.displayName = 'UpcomingEventsWidget';

interface AttendanceTrendWidgetProps {
  assignments: Assignment[];
}

export function AttendanceTrendWidget({ assignments }: AttendanceTrendWidgetProps) {
  const recentAssignments = assignments
    .filter((a) => a.status === 'accepted' && a.actual_managers !== null)
    .slice(-5)
    .reverse();

  const calculateRate = (assignment: Assignment) => {
    const totalAssigned =
      assignment.assigned_managers +
      assignment.assigned_supervisors +
      assignment.assigned_sia +
      assignment.assigned_stewards;
    const totalActual =
      (assignment.actual_managers || 0) +
      (assignment.actual_supervisors || 0) +
      (assignment.actual_sia || 0) +
      (assignment.actual_stewards || 0);
    return totalAssigned > 0 ? (totalActual / totalAssigned) * 100 : 0;
  };

  const rates = recentAssignments.map(calculateRate);
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const trend = rates.length >= 2 ? rates[rates.length - 1] - rates[0] : 0;

  return (
    <DashboardWidget title="Attendance Trend" description="Recent attendance performance">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{avgRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Average Attendance</p>
          </div>
          <div className="flex items-center gap-2">
            {trend > 0 ? (
              <>
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600">+{trend.toFixed(1)}%</span>
              </>
            ) : trend < 0 ? (
              <>
                <TrendingDown className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600">{trend.toFixed(1)}%</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No change</span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {recentAssignments.map((assignment, index) => {
            const rate = calculateRate(assignment);
            return (
              <div key={assignment.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Event {index + 1}</span>
                  <span className="font-medium">{rate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      rate >= 95 ? 'bg-green-500' : rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardWidget>
  );
}

