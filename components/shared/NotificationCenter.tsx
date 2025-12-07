'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useMockDataStore } from '@/lib/mock-data';
import { useDataStore } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Bell, Check, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NotificationCenter() {
  const { user } = useAuth();
  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
  const { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount } =
    useMockDataStore();
  const { unreadMessageCount, loadUnreadMessageCount } = useDataStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && useSupabase) {
      loadUnreadMessageCount();
    }
  }, [user, useSupabase, loadUnreadMessageCount]);

  const notifications = !useSupabase && user ? getNotifications(user.id) : [];
  const unreadCount = useSupabase ? unreadMessageCount : user ? getUnreadNotificationCount(user.id) : 0;

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAllRead = () => {
    if (user) {
      markAllNotificationsRead(user.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return '📋';
      case 'message':
        return '💬';
      case 'invoice':
        return '💰';
      case 'reminder':
        return '⏰';
      default:
        return '🔔';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </SheetDescription>
            </div>
            {!useSupabase && unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {useSupabase ? (
            <div
              className={cn(
                'p-3 border rounded-lg flex items-start gap-3',
                unreadCount > 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
              )}
            >
              <MessageSquare className="h-5 w-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">Messages</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}.`
                    : 'No unread messages.'}
                </p>
              </div>
              <Link href={user?.role === 'admin' ? '/admin/messages' : '/provider/messages'} onClick={() => setIsOpen(false)}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors',
                  !notification.read && 'bg-primary/5 border-primary/20'
                )}
                onClick={() => {
                  if (!notification.read) {
                    handleMarkRead(notification.id);
                  }
                  if (notification.link) {
                    setIsOpen(false);
                  }
                }}
              >
                {notification.link ? (
                  <Link href={notification.link} className="block">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <p className={cn('font-medium text-sm', !notification.read && 'font-semibold')}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <p className={cn('font-medium text-sm', !notification.read && 'font-semibold')}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


