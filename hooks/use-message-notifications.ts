'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { User } from '@/lib/types';

export function useMessageNotifications(
  user: User | null,
  onNewMessage?: () => void
) {
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-notify-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const message = payload.new as { content?: string; sender_id?: string };

          toast({
            title: 'New message',
            description: message?.content || 'You received a new message.',
          });

          onNewMessage?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, onNewMessage]);
}

