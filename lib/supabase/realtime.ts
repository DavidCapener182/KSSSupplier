import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to assignment updates
 */
export function subscribeToAssignment(
  assignmentId: string,
  callback: (assignment: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`assignment:${assignmentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assignments',
        filter: `id=eq.${assignmentId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to all assignments for an event
 */
export function subscribeToEventAssignments(
  eventId: string,
  callback: (assignment: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`event-assignments:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assignments',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to messages between two users
 */
export function subscribeToMessages(
  userId1: string,
  userId2: string,
  callback: (message: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${userId1}:${userId2}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1}))`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to provider status changes
 */
export function subscribeToProviderStatus(
  providerId: string,
  callback: (provider: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`provider:${providerId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'providers',
        filter: `id=eq.${providerId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}


