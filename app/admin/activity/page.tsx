'use client';

import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Activity, Filter, Calendar, Users, CheckCircle, Clock, Mail, FileText, FileCheck2, Bell, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';

export default function ActivityLogPage() {
  const { user: currentUser } = useAuth();
  const { activityLogs, getActivityLogs, providers, events, assignments, messages, loadActivityLogs, loadProviders, loadEvents, loadAssignments } = useDataStore();
  
  useEffect(() => {
    loadActivityLogs();
    loadProviders();
    loadEvents();
    loadAssignments();
  }, [loadActivityLogs, loadProviders, loadEvents, loadAssignments]);
  
  const [entityFilter, setEntityFilter] = useState<string>('all');
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

  const allLogs = getActivityLogs(
    entityFilter !== 'all' ? { entity_type: entityFilter } : undefined
  );

  // Filter out activity logs where the entity no longer exists
  const filteredLogs = allLogs.filter(log => {
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
  });

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

  const getActivityLink = (log: typeof filteredLogs[0]): string | undefined => {
    const details: any = log.details || {};
    
    switch (log.entity_type) {
      case 'event':
        return `/admin/events/${log.entity_id}`;
      case 'assignment':
        // Link to the event page where the assignment is shown
        const assignment = assignments.find((a) => a.id === log.entity_id);
        if (assignment) {
          return `/admin/events/${assignment.event_id}`;
        }
        // Fallback to event from details
        if (details.event_id) {
          return `/admin/events/${details.event_id}`;
        }
        return undefined;
      case 'provider':
        return `/admin/providers/${log.entity_id}`;
      case 'message':
        const providerForMessage =
          providers.find((p) => p.user_id === details.receiver_id) ||
          providers.find((p) => p.user_id === details.sender_id) ||
          (details.provider_id ? providers.find((p) => p.id === details.provider_id) : null);
        return `/admin/messages${providerForMessage ? `?providerId=${providerForMessage.id}` : ''}`;
      case 'invoice':
        if (details.provider_id) {
          return `/admin/invoices?providerId=${details.provider_id}`;
        }
        return `/admin/invoices`;
      case 'document':
        if (details.event_id) {
          return `/admin/events/${details.event_id}`;
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const renderActivity = (log: typeof filteredLogs[0]) => {
    const details: any = log.details || {};
    const time = format(new Date(log.created_at), 'MMM dd, yyyy HH:mm');
    let title = log.action;
    let desc = '';
    let messageContent = '';
    let icon = <Clock className="h-5 w-5 text-muted-foreground" />;

    switch (log.action) {
      case 'message_sent':
        title = 'Message sent';
        {
          const receiverDisplay =
            resolveUserDisplay(details.receiver_id, details.receiver_name);
          desc = `To: ${receiverDisplay}`;
          // Get message content from details or messages array
          messageContent = details.content || messages.find(m => m.id === log.entity_id)?.content || '';
        }
        icon = <Mail className="h-5 w-5 text-blue-500" />;
        break;
      case 'message_received':
        title = 'Message received';
        {
          const senderDisplay =
            resolveUserDisplay(details.sender_id, details.sender_name);
          desc = `From: ${senderDisplay}`;
          // Get message content from details or messages array
          messageContent = details.content || messages.find(m => m.id === log.entity_id)?.content || '';
        }
        icon = <Mail className="h-5 w-5 text-green-500" />;
        break;
      case 'assignment_created':
        title = `Assignment created`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <Users className="h-5 w-5 text-blue-500" />;
        break;
      case 'assignment_updated':
        title = `Assignment updated`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <Users className="h-5 w-5 text-amber-500" />;
        break;
      case 'assignment_deleted':
        title = `Assignment deleted`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <Users className="h-5 w-5 text-red-500" />;
        break;
      case 'assignment_accepted':
        title = `Assignment accepted`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <CheckCircle className="h-5 w-5 text-green-500" />;
        break;
      case 'assignment_declined':
        title = `Assignment declined`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(details.event_id)}`;
        icon = <UserX className="h-5 w-5 text-red-500" />;
        break;
      case 'event_created':
      case 'event_backfill':
        title = `Event created`;
        desc = resolveEventName(log.entity_id);
        icon = <Calendar className="h-5 w-5 text-blue-500" />;
        break;
      case 'event_updated':
        title = `Event updated`;
        desc = resolveEventName(log.entity_id);
        icon = <Calendar className="h-5 w-5 text-amber-500" />;
        break;
      case 'event_deleted':
        title = `Event deleted`;
        desc = resolveEventName(log.entity_id);
        icon = <Calendar className="h-5 w-5 text-red-500" />;
        break;
      case 'provider_created':
      case 'provider_backfill':
        title = `Provider added`;
        desc = resolveProviderName(log.entity_id);
        icon = <Users className="h-5 w-5 text-blue-500" />;
        break;
      case 'provider_updated':
        title = `Provider updated`;
        desc = resolveProviderName(log.entity_id);
        icon = <Users className="h-5 w-5 text-amber-500" />;
        break;
      case 'provider_approved':
        title = `Provider approved`;
        desc = resolveProviderName(log.entity_id);
        icon = <UserCheck className="h-5 w-5 text-green-500" />;
        break;
      case 'provider_rejected':
        title = `Provider rejected`;
        desc = resolveProviderName(log.entity_id);
        icon = <UserX className="h-5 w-5 text-red-500" />;
        break;
      case 'onboarding_document_created':
      case 'onboarding_backfill':
        title = `Onboarding document added`;
        desc = resolveProviderName(details.provider_id);
        icon = <FileText className="h-5 w-5 text-blue-500" />;
        break;
      case 'onboarding_document_completed':
        title = `Onboarding document completed`;
        desc = resolveProviderName(details.provider_id);
        icon = <FileCheck2 className="h-5 w-5 text-green-500" />;
        break;
      case 'document_uploaded':
      case 'document_backfill':
        title = `Document uploaded`;
        desc = resolveEventName(details.event_id);
        icon = <FileText className="h-5 w-5 text-blue-500" />;
        break;
      case 'document_deleted':
        title = `Document deleted`;
        desc = resolveEventName(details.event_id);
        icon = <FileText className="h-5 w-5 text-red-500" />;
        break;
      case 'invoice_created':
      case 'invoice_backfill':
        title = `Invoice created`;
        desc = resolveProviderName(details.provider_id);
        icon = <FileText className="h-5 w-5 text-blue-500" />;
        break;
      case 'invoice_updated':
        title = `Invoice updated`;
        desc = resolveProviderName(details.provider_id);
        icon = <FileText className="h-5 w-5 text-amber-500" />;
        break;
      case 'availability_update':
        title = `Availability updated`;
        desc = `${resolveProviderName(details.provider_id)} → ${resolveEventName(log.entity_id)} (${details.status || ''})`;
        icon = <Bell className="h-5 w-5 text-green-500" />;
        break;
      default:
        title = log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        desc = '';
    }

    return { title, desc, time, icon, messageContent };
  };

  const formatActionText = (action: string): string => {
    return action
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('accepted') || action.includes('approved') || action.includes('completed') || action === 'message_received') return 'success';
    if (action.includes('deleted') || action.includes('declined') || action.includes('rejected')) return 'destructive';
    if (action.includes('updated') || action.includes('modified')) return 'warning';
    if (action === 'message_sent') return 'default';
    return 'default';
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Log</h1>
          <p className="text-muted-foreground mt-2">Track all changes and actions in the system</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="assignment">Assignments</SelectItem>
              <SelectItem value="invoice">Invoices</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="provider">Providers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-md border-none bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} activity log{filteredLogs.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const { title, desc, time, icon, messageContent } = renderActivity(log);
                const link = getActivityLink(log);
                const actionColor = getActionColor(log.action);
                
                const content = (
                  <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/40 transition-colors group">
                    <div className="mt-1 p-2 bg-muted rounded-full flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={actionColor as any} className="text-xs">
                          {formatActionText(log.action)}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{log.entity_type}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {title}
                      </p>
                      {desc && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {desc}
                        </p>
                      )}
                      {messageContent && (
                        <div className="mt-2 p-2 bg-muted/50 rounded-md border-l-2 border-primary/30">
                          <p className="text-sm text-foreground line-clamp-3">
                            {messageContent}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {time}
                      </p>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={log.id} href={link}>
                    {content}
                  </Link>
                ) : (
                  <div key={log.id}>{content}</div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activity logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
