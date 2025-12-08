'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Event, Assignment } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EventCalendarProps {
  events: Event[];
  assignments: Assignment[];
  onDateClick?: (date: Date) => void;
  getEventStatus?: (eventId: string) => { label: string; variant: 'success' | 'warning' | 'destructive' };
}

export function EventCalendar({ events, assignments, onDateClick, getEventStatus }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), date));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (onDateClick) {
        onDateClick(date);
      }
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="w-full rounded-xl border bg-card text-card-foreground p-2 sm:p-4 shadow-sm overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-[600px] sm:min-w-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            fromDate={new Date(2026, 0, 1)}
            toDate={new Date(2026, 11, 31)}
            className="w-full rounded-md border"
            classNames={{
              months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4 w-full min-w-[600px] sm:min-w-0",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.7rem] sm:text-[0.8rem] min-w-[80px] sm:min-w-0",
              row: "flex w-full mt-2",
              cell: "h-auto flex-1 min-h-[80px] sm:min-h-[120px] text-center text-xs sm:text-sm p-1 sm:p-2 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-full w-full p-1 sm:p-2 font-normal aria-selected:opacity-100 items-start justify-start text-left",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
          components={{
            DayContent: ({ date }) => {
              const dayEvents = getEventsForDate(date);
              return (
                <div className="flex h-full w-full flex-col justify-between">
                  <div className="self-start font-medium text-xs sm:text-sm">{format(date, 'd')}</div>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 flex w-full flex-col gap-0.5 sm:gap-1 text-left">
                      {dayEvents.slice(0, 2).map((event) => {
                        const status = getEventStatus ? getEventStatus(event.id) : null;
                        return (
                          <div key={event.id} className="flex items-start gap-1 text-[8px] sm:text-[10px] leading-tight">
                            <span
                              className={cn(
                                'mt-0.5 sm:mt-1 inline-block h-1 w-1 sm:h-1.5 sm:w-1.5 shrink-0 rounded-full',
                                status?.variant === 'success' && 'bg-green-500',
                                status?.variant === 'warning' && 'bg-yellow-500',
                                status?.variant === 'destructive' && 'bg-red-500',
                                !status && 'bg-blue-500'
                              )}
                              aria-hidden
                            />
                            <span className="truncate font-medium" title={event.name}>
                              {event.name}
                            </span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="pl-2 sm:pl-3 text-[8px] sm:text-[10px] text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            },
          }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 text-foreground">
            {selectedDate ? `Events on ${format(selectedDate, 'MMMM dd, yyyy')}` : 'Select a date to view events'}
          </h3>
          {selectedDate && selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => {
                const status = getEventStatus ? getEventStatus(event.id) : null;
                return (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{event.name}</p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                      {status && <Badge variant={status.variant}>{status.label}</Badge>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : selectedDate ? (
            <p className="text-muted-foreground text-center py-6">No events on this date</p>
          ) : (
            <p className="text-muted-foreground text-center py-6">
              Select a date to view events
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

