'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { useLoadData } from '@/lib/supabase/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/shared/SearchInput';
import { format } from 'date-fns';
import Link from 'next/link';
import { Plus, Calendar, X, Download, Trash2, Copy, MapPin, Users } from 'lucide-react';
import { exportEventsToCSV, downloadCSV } from '@/lib/export';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/shared/EmptyState';
import { Checkbox } from '@/components/shared/Checkbox';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { EventDetailsDialog } from '@/components/admin/EventDetailsDialog';
import { Pagination } from '@/components/shared/Pagination';

export default function EventsPage() {
  const router = useRouter();
  const { events, assignments, providers, availability, deleteEvent, createEvent, loadEvents, loadAssignments, loadProviders, loadEventAvailability, isLoading } = useDataStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedEventDialog, setSelectedEventDialog] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Load data on mount
  useEffect(() => {
    loadEvents();
    loadAssignments();
    loadProviders();
  }, [loadEvents, loadAssignments, loadProviders]);

  // Load availability for all events
  useEffect(() => {
    if (events.length > 0) {
      events.forEach((event) => loadEventAvailability(event.id));
    }
  }, [events, loadEventAvailability]);

  const activeProviderCount = providers.filter((p) => p.status !== 'suspended').length;

  const eventsWithStatus = events.map((event) => {
    const eventAssignments = assignments.filter((a) => a.event_id === event.id);
    const eventAvailability = availability.filter((a) => a.event_id === event.id);
    const availableCount = eventAvailability.filter((a) => a.status === 'available').length;
    const unavailableCount = eventAvailability.filter((a) => a.status === 'unavailable').length;
    const pendingAvailability = Math.max(activeProviderCount - (availableCount + unavailableCount), 0);
    const totalRequested = {
      managers: event.requirements.managers,
      supervisors: event.requirements.supervisors,
      sia: event.requirements.sia,
      stewards: event.requirements.stewards,
    };
    const totalAssigned = eventAssignments.reduce(
      (acc, a) => ({
        managers: acc.managers + a.assigned_managers,
        supervisors: acc.supervisors + a.assigned_supervisors,
        sia: acc.sia + a.assigned_sia,
        stewards: acc.stewards + a.assigned_stewards,
      }),
      { managers: 0, supervisors: 0, sia: 0, stewards: 0 }
    );
    const confirmed = eventAssignments.filter((a) => a.status === 'accepted').length;
    const pending = eventAssignments.filter((a) => a.status === 'pending').length;

    const isFullyStaffed =
      totalAssigned.managers >= totalRequested.managers &&
      totalAssigned.supervisors >= totalRequested.supervisors &&
      totalAssigned.sia >= totalRequested.sia &&
      totalAssigned.stewards >= totalRequested.stewards;

    return {
      ...event,
      totalAssigned,
      totalRequested,
      confirmed,
      pending,
      isFullyStaffed,
      assignmentCount: eventAssignments.length,
      availabilitySummary: {
        available: availableCount,
        unavailable: unavailableCount,
        pending: pendingAvailability,
      },
    };
  });

  // Filter and search events
  const handleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const handleSelectEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedEvents) {
        await deleteEvent(id);
      }
      await loadEvents(); // Reload events after deletion
      toast({
        title: 'Events Deleted',
        description: `${selectedEvents.size} event(s) have been deleted.`,
        variant: 'default',
      });
      setSelectedEvents(new Set());
      setIsBulkDeleteOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete events',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDuplicate = async () => {
    try {
      let count = 0;
      for (const id of selectedEvents) {
        const event = events.find((e) => e.id === id);
        if (event) {
          await createEvent({
            name: `${event.name} (Copy)`,
            location: event.location,
            date: event.date,
            requirements: event.requirements,
          });
          count++;
        }
      }
      await loadEvents(); // Reload events after duplication
      toast({
        title: 'Events Duplicated',
        description: `${count} event(s) have been duplicated.`,
        variant: 'success',
      });
      setSelectedEvents(new Set());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate events',
        variant: 'destructive',
      });
    }
  };

  const filteredEvents = useMemo(() => {
    let filtered = eventsWithStatus;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((event) => {
        if (statusFilter === 'fully-staffed') return event.isFullyStaffed;
        if (statusFilter === 'needs-staff') return !event.isFullyStaffed;
        if (statusFilter === 'has-pending') return event.pending > 0;
        return true;
      });
    }

    // Tab filter
    const now = new Date();
    // Reset time part for accurate date comparison
    now.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      if (activeTab === 'upcoming') return eventDate >= now;
      if (activeTab === 'completed') return eventDate < now;
      return true;
    });

    // Custom date range filter
    if (startDate || endDate) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && end) {
          return eventDate >= start && eventDate <= end;
        } else if (start) {
          return eventDate >= start;
        } else if (end) {
          return eventDate <= end;
        }
        return true;
      });
    }

    // Sort by date
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [eventsWithStatus, searchQuery, statusFilter, activeTab, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, activeTab, startDate, endDate]);

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Manage all events for the 2026 season</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedEvents.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleBulkDuplicate}
                className="bg-background hover:bg-accent"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate ({selectedEvents.size})
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsBulkDeleteOpen(true)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedEvents.size})
              </Button>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const csv = exportEventsToCSV(events, assignments, []);
                  downloadCSV(csv, `events-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                }}
                className="bg-background hover:bg-accent"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export CSV</TooltipContent>
          </Tooltip>
          <Link href="/admin/events/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="completed">Completed Events</TabsTrigger>
        </TabsList>

        <Card className="border-none shadow-md bg-card">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-lg font-semibold text-foreground">
              {activeTab === 'all' ? 'All Events' : activeTab === 'upcoming' ? 'Upcoming Events' : 'Completed Events'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">List of events with staffing status</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              </div>
            ) : (
              <>
            <div className="p-4 space-y-4 border-b border-border bg-muted/20">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search events by name or location..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] bg-background">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="fully-staffed">Fully Staffed</SelectItem>
                      <SelectItem value="needs-staff">Needs Staff</SelectItem>
                      <SelectItem value="has-pending">Has Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-medium px-1">
                Showing {filteredEvents.length} of {eventsWithStatus.length} events
              </div>
            </div>
          <div className="overflow-auto max-h-[65vh]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={selectedEvents.size > 0 && selectedEvents.size === filteredEvents.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[140px] font-semibold text-foreground">Event Name</TableHead>
                  <TableHead className="min-w-[140px] font-semibold text-foreground">Date</TableHead>
                  <TableHead className="min-w-[200px] font-semibold text-foreground">Location</TableHead>
                  <TableHead className="min-w-[180px] font-semibold text-foreground">Staffing Status</TableHead>
                  <TableHead className="min-w-[120px] font-semibold text-foreground">Assignments</TableHead>
                  <TableHead className="min-w-[160px] font-semibold text-foreground">Provider Availability</TableHead>
                  <TableHead className="min-w-[120px] font-semibold text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.length > 0 ? (
                  paginatedEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className={`
                        ${selectedEvents.has(event.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-muted/50'} 
                        cursor-pointer transition-colors border-b border-border last:border-0
                      `}
                      role="row"
                      aria-label={`Event: ${event.name}`}
                      tabIndex={0}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest('input[type="checkbox"]') ||
                          target.closest('button') ||
                          target.closest('a')
                        ) {
                          return;
                        }
                        setSelectedEventDialog(event.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const target = e.target as HTMLElement;
                          if (
                            target.closest('input[type="checkbox"]') ||
                            target.closest('button') ||
                            target.closest('a')
                          ) {
                            return;
                          }
                          setSelectedEventDialog(event.id);
                        }
                      }}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedEvents.has(event.id)}
                          onCheckedChange={() => handleSelectEvent(event.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground max-w-[140px] whitespace-normal break-words">{event.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-sm">
                            {event.end_date 
                              ? `${format(new Date(event.date), 'MMM dd')} - ${format(new Date(event.end_date), 'MMM dd, yyyy')}`
                              : format(new Date(event.date), 'MMM dd, yyyy')
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start space-x-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span className="text-sm whitespace-normal break-words max-w-[200px]" title={event.location}>{event.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {event.totalRequested.managers > 0 && (
                            <div className="flex items-center justify-between bg-muted/30 px-2 py-0.5 rounded">
                              <span className="text-muted-foreground">Managers</span>
                              <span className={event.totalAssigned.managers < event.totalRequested.managers ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                                {event.totalAssigned.managers}/{event.totalRequested.managers}
                              </span>
                            </div>
                          )}
                          {event.totalRequested.supervisors > 0 && (
                            <div className="flex items-center justify-between bg-muted/30 px-2 py-0.5 rounded">
                              <span className="text-muted-foreground">Supervisors</span>
                              <span className={event.totalAssigned.supervisors < event.totalRequested.supervisors ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                                {event.totalAssigned.supervisors}/{event.totalRequested.supervisors}
                              </span>
                            </div>
                          )}
                          {event.totalRequested.sia > 0 && (
                            <div className="flex items-center justify-between bg-muted/30 px-2 py-0.5 rounded">
                              <span className="text-muted-foreground">SIA</span>
                              <span className={event.totalAssigned.sia < event.totalRequested.sia ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                                {event.totalAssigned.sia}/{event.totalRequested.sia}
                              </span>
                            </div>
                          )}
                          {event.totalRequested.stewards > 0 && (
                            <div className="flex items-center justify-between bg-muted/30 px-2 py-0.5 rounded">
                              <span className="text-muted-foreground">Stewards</span>
                              <span className={event.totalAssigned.stewards < event.totalRequested.stewards ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                                {event.totalAssigned.stewards}/{event.totalRequested.stewards}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-muted-foreground">Confirmed: {event.confirmed}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="text-muted-foreground">Pending: {event.pending}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Available</span>
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-transparent">
                              {event.availabilitySummary?.available ?? 0}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Unavailable</span>
                            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-transparent">
                              {event.availabilitySummary?.unavailable ?? 0}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">No response</span>
                            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-transparent">
                              {event.availabilitySummary?.pending ?? 0}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.isFullyStaffed ? (
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-transparent">Fully Staffed</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-transparent">Needs Staff</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Calendar}
                      title="No Events Found"
                      description={searchQuery || statusFilter !== 'all' || activeTab !== 'all' || startDate || endDate
                        ? "No events match your current filters. Try adjusting your search or filter criteria."
                        : "You haven't created any events yet. Get started by creating your first event."}
                      action={
                        !searchQuery && statusFilter === 'all' && activeTab === 'all' && !startDate && !endDate
                          ? {
                              label: 'Create Event',
                              onClick: () => router.push('/admin/events/new'),
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t border-border">
            {filteredEvents.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredEvents.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </div>
            </>
          )}
        </CardContent>
      </Card>
      </Tabs>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedEvents.size} event(s) and all associated assignments, documents, and invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedEvents.size} Event(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={events.find((e) => e.id === selectedEventDialog) || null}
        assignments={assignments}
        providers={providers}
        open={!!selectedEventDialog}
        onOpenChange={(open) => !open && setSelectedEventDialog(null)}
      />
    </div>
  );
}
