'use client';

import { useEffect } from 'react';
import { useMockDataStore } from '@/lib/mock-data';

/**
 * Hook to simulate real-time updates using Zustand store subscriptions
 * In Phase 2, this will be replaced with Supabase Realtime subscriptions
 */
export function useRealtime<T>(
  selector: (state: ReturnType<typeof useMockDataStore.getState>) => T,
  callback: (data: T) => void
) {
  useEffect(() => {
    const unsubscribe = useMockDataStore.subscribe((state) => {
      const selected = selector(state);
      callback(selected);
    });
    return unsubscribe;
  }, [selector, callback]);
}

/**
 * Hook to listen for assignment status changes
 */
export function useAssignmentUpdates(
  assignmentId: string | null,
  callback: (assignment: ReturnType<typeof useMockDataStore.getState>['assignments'][0] | null) => void
) {
  useEffect(() => {
    if (!assignmentId) {
      callback(null);
      return;
    }

    const unsubscribe = useMockDataStore.subscribe((state) => {
      const assignment = state.assignments.find((a) => a.id === assignmentId) || null;
      callback(assignment);
    });

    return unsubscribe;
  }, [assignmentId, callback]);
}

/**
 * Hook to listen for new messages in a conversation
 */
export function useMessageUpdates(
  userId1: string | null,
  userId2: string | null,
  callback: (messages: ReturnType<typeof useMockDataStore.getState>['messages']) => void
) {
  useEffect(() => {
    if (!userId1 || !userId2) {
      callback([]);
      return;
    }

    const unsubscribe = useMockDataStore.subscribe((state) => {
      const messages = state.messages.filter(
        (msg) =>
          (msg.sender_id === userId1 && msg.receiver_id === userId2) ||
          (msg.sender_id === userId2 && msg.receiver_id === userId1)
      );
      callback(messages);
    });

    return unsubscribe;
  }, [userId1, userId2, callback]);
}


