'use client';

import { useEffect, useState } from 'react';
import { useSupabaseDataStore } from '../supabase-store';
import { subscribeToAssignment, subscribeToEventAssignments, subscribeToMessages, subscribeToNotifications, unsubscribe } from './realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook to load initial data when component mounts
 */
export function useLoadData() {
  const store = useSupabaseDataStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await Promise.all([
          store.loadEvents(),
          store.loadProviders(),
          store.loadAssignments(),
          store.loadInvoices(),
          store.loadEventTemplates(),
          store.loadActivityLogs(),
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return isLoading;
}

/**
 * Hook to subscribe to assignment updates in real-time
 */
export function useAssignmentSubscription(assignmentId: string | null) {
  const store = useSupabaseDataStore();

  useEffect(() => {
    if (!assignmentId) return;

    const channel = subscribeToAssignment(assignmentId, (assignment) => {
      // Update the assignment in the store
      store.updateAssignment(assignmentId, assignment);
    });

    return () => {
      unsubscribe(channel);
    };
  }, [assignmentId, store]);
}

/**
 * Hook to subscribe to all assignments for an event
 */
export function useEventAssignmentsSubscription(eventId: string) {
  const store = useSupabaseDataStore();

  useEffect(() => {
    const channel = subscribeToEventAssignments(eventId, (assignment) => {
      // Reload assignments to get the latest
      store.loadAssignments();
    });

    return () => {
      unsubscribe(channel);
    };
  }, [eventId, store]);
}

/**
 * Hook to subscribe to messages between two users
 */
export function useMessagesSubscription(userId1: string, userId2: string) {
  const store = useSupabaseDataStore();

  useEffect(() => {
    const channel = subscribeToMessages(userId1, userId2, (message) => {
      // Add new message to store
      store.sendMessage({
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        read: message.read,
      });
    });

    return () => {
      unsubscribe(channel);
    };
  }, [userId1, userId2, store]);
}

/**
 * Hook to subscribe to notifications for current user
 */
export function useNotificationsSubscription(userId: string | null) {
  const store = useSupabaseDataStore();

  useEffect(() => {
    if (!userId) return;

    const channel = subscribeToNotifications(userId, (notification) => {
      // Add new notification to store
      store.addNotification({
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        link: notification.link,
      });
    });

    return () => {
      unsubscribe(channel);
    };
  }, [userId, store]);
}

/**
 * Hook to load and subscribe to notifications
 */
export function useNotifications(userId: string | null) {
  const store = useSupabaseDataStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      await store.loadNotifications();
      const count = await store.getUnreadNotificationCount();
      setUnreadCount(count);
    }
    load();
  }, [userId, store]);

  useNotificationsSubscription(userId);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (userId) {
        const count = await store.getUnreadNotificationCount();
        setUnreadCount(count);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [userId, store]);

  return {
    notifications: userId ? store.notifications.filter(n => n.user_id === userId) : [],
    unreadCount,
  };
}


