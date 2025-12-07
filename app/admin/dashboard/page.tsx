'use client';

import { useDataStore } from '@/lib/data-store';
import { useMockDataStore } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, Clock, HelpCircle, AlertCircle, ArrowUpRight, Mail, FileText, FileCheck2, Bell, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { StatusDistributionChart, ProviderPerformanceChart } from '@/components/admin/KPICharts';
import { UpcomingEventsWidget, AttendanceTrendWidget } from '@/components/admin/DashboardWidget';
import { AttendanceTrendChart } from '@/components/admin/AttendanceTrendChart';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useRef } from 'react';
import { generateEventReminders } from '@/lib/reminders';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const { events, assignments, providers, activityLogs, getPendingProviders, isProviderOnboarded, loadEvents, loadAssignments, loadProviders, loadActivityLogs, isLoading } = useDataStore();
  const [existingEntityIds, setExistingEntityIds] = useState<{
    events: Set<string>;
    assignments: Set<string>;
    invoices: Set<string>;
    documents: Set<string>;
    messages: Set<string>;
  }>({
    events: new Set(),
    assignments: new Set(),
    invoices: new Set(),
    documents: new Set(),
    messages: new Set(),
  });
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [pendingProviders, setPendingProviders] = useState<typeof providers>([]);
  const upcomingEventsCardRef = useRef<HTMLDivElement | null>(null);
  const [upcomingEventsHeight, setUpcomingEventsHeight] = useState<number | null>(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        await Promise.all([
          loadEvents(),
          loadAssignments(),
          loadProviders(),
          loadActivityLogs(),
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLocalLoading(false);
      }
    }
    loadData();
  }, [loadEvents, loadAssignments, loadProviders]);

  // Determine pending providers (status='pending' OR approved but not onboarded)
  useEffect(() => {
    const fetchPendingStatus = async () => {
      if (providers.length === 0) return;
      
      const pendingList = [];
      for (const provider of providers) {
        if (provider.status === 'pending') {
          pendingList.push(provider);
        } else if (provider.status === 'approved') {
          // Check if they have completed onboarding documents
          const onboarded = await isProviderOnboarded(provider.id);
          if (!onboarded) {
             pendingList.push(provider);
          }
        }
      }
      setPendingProviders(pendingList);
    };
    
    fetchPendingStatus();
  }, [providers, isProviderOnboarded]);

  // Measure Upcoming Events height and apply to Recent Activity
  useEffect(() => {
    if (upcomingEventsCardRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setUpcomingEventsHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(upcomingEventsCardRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [events, assignments, providers]);

  // Generate reminders for upcoming events
  const reminders = generateEventReminders(events, assignments, providers);

  const isDataLoading = isLoading || isLocalLoading;

  const totalEvents = events.length;
  const pendingConfirmations = assignments.filter((a) => a.status === 'pending').length;
  const confirmedAssignments = assignments.filter((a) => a.status === 'accepted').length;
  const activeProviders = providers.filter((p) => !pendingProviders.find(pending => pending.id === p.id) && p.status !== 'suspended');
  const totalProviders = activeProviders.length;

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Load all entity IDs to check which entities still exist
  useEffect(() => {
    async function loadEntityIds() {
      if (!currentUser) return;
      try {
        // Load all entity IDs in parallel
        const [eventsResult, assignmentsResult, invoicesResult, documentsResult, messagesResult] = await Promise.all([
          supabase.from('events').select('id'),
          supabase.from('assignments').select('id'),
          supabase.from('invoices').select('id'),
          supabase.from('documents').select('id'),
          supabase.from('messages').select('id'),
        ]);

        setExistingEntityIds({
          events: new Set(eventsResult.data?.map(e => e.id) || []),
          assignments: new Set(assignmentsResult.data?.map(a => a.id) || []),
          invoices: new Set(invoicesResult.data?.map(i => i.id) || []),
          documents: new Set(documentsResult.data?.map(d => d.id) || []),
          messages: new Set(messagesResult.data?.map(m => m.id) || []),
        });
      } catch (err) {
        console.error('Error loading entity IDs:', err);
      }
    }
    loadEntityIds();
  }, [currentUser]);

  // Filter out activity logs where the entity no longer exists
  const recentActivity = activityLogs
    .filter(log => {
      switch (log.entity_type) {
        case 'event':
          return existingEntityIds.events.has(log.entity_id);
        case 'assignment':
          return existingEntityIds.assignments.has(log.entity_id);
        case 'invoice':
          return existingEntityIds.invoices.has(log.entity_id);
        case 'document':
          return existingEntityIds.documents.has(log.entity_id);
        case 'message':
          return existingEntityIds.messages.has(log.entity_id);
        default:
          return true;
      }
    })
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const resolveProviderName = (providerId?: string) =>
    providerId ? providers.find((p) => p.id === providerId)?.company_name || 'Provider' : 'Provider';

  const resolveProviderNameByUserId = (userId?: string) =>
    userId ? providers.find((p) => p.user_id === userId)?.company_name || 'Provider' : 'Provider';

  const resolveUserDisplay = (id?: string, nameHint?: string) => {
    if (nameHint) return nameHint;
    if (!id) return 'Provider';
    const providerById = providers.find((p) => p.id === id);
    if (providerById) return providerById.company_name;
    const providerByUserId = providers.find((p) => p.user_id === id);
    if (providerByUserId) return providerByUserId.company_name;
    if (id === 'admin' || id === currentUser?.id) return 'KSS Admin';
    return nameHint || 'Provider';
  };

  const resolveEventName = (eventId?: string) =>
    eventId ? events.find((e) => e.id === eventId)?.name || 'Event' : 'Event';

  const renderActivity = (log: any) => {
    const details: any = log.details || {};
    const time = format(new Date(log.created_at), 'MMM dd, HH:mm');
    let title = log.action;
    let desc = '';
    let icon = <Clock className="h-3 w-3 text-muted-foreground" />;

    switch (log.action) {
      case 'message_sent':
        title = 'Message sent';
        {
          const receiverDisplay =
            resolveUserDisplay(details.receiver_id, details.receiver_name);
          desc = `To: ${receiverDisplay}`;
        }
        icon = <Mail className="h-3 w-3 text-blue-500" />;
        break;
      case 'message_received':
        title = 'Message received';
        {
          const senderDisplay =
            resolveUserDisplay(details.sender_id, details.sender_name);
          desc = `From: ${senderDisplay}`;
        }
        icon = <Mail className="h-3 w-3 text-green-500" />;
        break;
      case 'assignment_created':
        title = `Assignment created`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <Users className="h-3 w-3 text-blue-500" />;
        break;
      case 'assignment_updated':
        title = `Assignment updated`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <Users className="h-3 w-3 text-amber-500" />;
        break;
      case 'assignment_deleted':
        title = `Assignment deleted`;
        icon = <Users className="h-3 w-3 text-red-500" />;
        break;
      case 'assignment_accepted':
        title = `Assignment accepted`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <CheckCircle className="h-3 w-3 text-green-500" />;
        break;
      case 'assignment_declined':
        title = `Assignment declined`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <UserX className="h-3 w-3 text-red-500" />;
        break;
      case 'event_created':
      case 'event_backfill':
        title = `Event created`;
        desc = resolveEventName(log.entity_id);
        icon = <Calendar className="h-3 w-3 text-blue-500" />;
        break;
      case 'event_updated':
        title = `Event updated`;
        desc = resolveEventName(log.entity_id);
        icon = <Calendar className="h-3 w-3 text-amber-500" />;
        break;
      case 'event_deleted':
        title = `Event deleted`;
        desc = resolveEventName(log.entity_id);
        icon = <Calendar className="h-3 w-3 text-red-500" />;
        break;
      case 'provider_created':
      case 'provider_backfill':
        title = `Provider added`;
        desc = resolveProviderName(log.entity_id);
        icon = <Users className="h-3 w-3 text-blue-500" />;
        break;
      case 'provider_updated':
        title = `Provider updated`;
        desc = resolveProviderName(log.entity_id);
        icon = <Users className="h-3 w-3 text-amber-500" />;
        break;
      case 'provider_approved':
        title = `Provider approved`;
        desc = resolveProviderName(log.entity_id);
        icon = <UserCheck className="h-3 w-3 text-green-500" />;
        break;
      case 'provider_rejected':
        title = `Provider rejected`;
        desc = resolveProviderName(log.entity_id);
        icon = <UserX className="h-3 w-3 text-red-500" />;
        break;
      case 'onboarding_document_created':
      case 'onboarding_backfill':
        title = `Onboarding document added`;
        desc = resolveProviderName(details.provider_id);
        icon = <FileText className="h-3 w-3 text-blue-500" />;
        break;
      case 'onboarding_document_completed':
        title = `Onboarding document completed`;
        desc = resolveProviderName(details.provider_id);
        icon = <FileCheck2 className="h-3 w-3 text-green-500" />;
        break;
      case 'document_uploaded':
      case 'document_backfill':
        title = `Document uploaded`;
        desc = resolveEventName(details.event_id);
        icon = <FileText className="h-3 w-3 text-blue-500" />;
        break;
      case 'document_deleted':
        title = `Document deleted`;
        desc = resolveEventName(details.event_id);
        icon = <FileText className="h-3 w-3 text-red-500" />;
        break;
      case 'invoice_created':
      case 'invoice_backfill':
        title = `Invoice created`;
        desc = resolveProviderName(details.provider_id);
        icon = <FileText className="h-3 w-3 text-blue-500" />;
        break;
      case 'invoice_updated':
        title = `Invoice updated`;
        desc = resolveProviderName(details.provider_id);
        icon = <FileText className="h-3 w-3 text-amber-500" />;
        break;
      case 'availability_update':
        title = `Availability updated`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(log.entity_id)} (${details.status || ''})`;
        icon = <Bell className="h-3 w-3 text-green-500" />;
        break;
      default:
        title = log.action;
        desc = '';
    }

    return { title, desc, time, icon };
  };

  return (
    <div className="space-y-8 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your event staffing operations</p>
        </div>
        <div className="hidden md:block">
          <Link href="/admin/calendar">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">
              <Calendar className="mr-2 h-4 w-4" /> View Calendar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isDataLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-none shadow-md bg-card">
                <CardHeader className="space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Link href="/admin/events" className="block">
              <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card relative overflow-hidden group cursor-pointer">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-50 dark:from-blue-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-foreground">{totalEvents}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <span className="text-blue-600 dark:text-blue-400 font-medium mr-1">2026</span> season
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-amber-50 dark:from-amber-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Actions</CardTitle>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground">{pendingConfirmations}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting provider response
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-green-50 dark:from-green-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground">{confirmedAssignments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted assignments
                </p>
              </CardContent>
            </Card>

            <Link href="/admin/providers" className="block">
              <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card relative overflow-hidden group cursor-pointer">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-purple-50 dark:from-purple-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Providers</CardTitle>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600 dark:text-purple-400">
                    <Users className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-foreground">{totalProviders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active partners
                  </p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {!isDataLoading && pendingProviders.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500 shadow-md bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-full">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Pending Approvals</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {pendingProviders.length} provider{pendingProviders.length !== 1 ? 's' : ''} awaiting account approval or documents
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/admin/providers?tab=suspended">
                    <Button variant="outline" size="sm" className="border-yellow-200 dark:border-yellow-900/40 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                      Review All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {pendingProviders.slice(0, 3).map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-3 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/20 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold text-sm text-foreground truncate">{provider.company_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{provider.contact_email}</p>
                        {provider.status === 'approved' && (
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Pending Documents</span>
                        )}
                      </div>
                      <Link href={`/admin/providers/${provider.id}/onboarding`}>
                        <Button variant="ghost" size="sm" className="text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 h-8 px-2">
                          Review
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
            {pendingProviders.length > 3 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  +{pendingProviders.length - 3} more pending approval
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isDataLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-md bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-2">
            <UpcomingEventsWidget
              ref={(node) => {
                // The ref is forwarded to the Card element by DashboardWidget
                upcomingEventsCardRef.current = node;
              }}
              events={events}
              assignments={assignments}
              providers={providers}
            />
          </div>
          <Card className="shadow-md border-none bg-card md:col-span-2 xl:col-span-1 flex flex-col overflow-hidden" style={upcomingEventsHeight ? { height: `${upcomingEventsHeight}px` } : undefined}>
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest confirmations and updates</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-y-auto pr-2 pb-1 custom-scrollbar space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((log) => {
                    const { title, desc, time, icon } = renderActivity(log);
                    const details: any = log.details || {};
                    const providerForMessage =
                      providers.find((p) => p.user_id === details.receiver_id) ||
                      providers.find((p) => p.user_id === details.sender_id) ||
                      (details.provider_id ? providers.find((p) => p.id === details.provider_id) : null);
                    const link =
                      log.entity_type === 'message'
                        ? `/admin/messages${providerForMessage ? `?providerId=${providerForMessage.id}` : ''}`
                        : undefined;
                    const content = (
                      <div className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0 animate-fade-in group">
                        <div className="mt-1 p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full flex-shrink-0">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {title}
                          </p>
                          {desc && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {desc}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                             {time}
                          </p>
                        </div>
                      </div>
                    );
                    return link ? (
                      <Link key={log.id} href={link} className="block hover:bg-muted/40 rounded-lg px-1 -mx-1">
                        {content}
                      </Link>
                    ) : (
                      <div key={log.id}>{content}</div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatusDistributionChart assignments={assignments} />
        <ProviderPerformanceChart assignments={assignments} providers={providers} />
        <AttendanceTrendWidget assignments={assignments} />
      </div>

      {!isDataLoading && assignments.filter((a) => a.status === 'accepted' && a.actual_managers !== null).length > 0 && (
        <Card className="shadow-md border-none bg-card">
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Historical attendance performance (Last 30 Days)</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceTrendChart assignments={assignments} events={events} days={30} />
          </CardContent>
        </Card>
      )}

      {!isDataLoading && reminders.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 shadow-md bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-foreground">Action Required</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {reminders.length} reminder{reminders.length !== 1 ? 's' : ''} needing attention
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reminders.slice(0, 5).map((reminder) => {
                const event = events.find((e) => e.id === reminder.event_id);
                const assignment = assignments.find((a) => a.id === reminder.assignment_id);
                const provider = providers.find((p) => p.user_id === reminder.user_id);
                return (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20"
                  >
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{provider?.company_name || 'Provider'}</p>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200 border-none">
                          {reminder.reminder_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{reminder.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {event?.name} • Due: {format(new Date(reminder.due_date), 'MMM dd')}
                      </p>
                    </div>
                    <Link href={`/admin/messages?provider=${provider?.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
              {reminders.length > 5 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  +{reminders.length - 5} more reminders
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
