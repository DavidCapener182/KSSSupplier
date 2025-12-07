'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  CalendarDays,
  FileStack,
  Activity,
  Clock,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { useEffect } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Events', href: '/admin/events', icon: Calendar },
  { title: 'Templates', href: '/admin/events/templates', icon: FileStack },
  { title: 'Providers', href: '/admin/providers', icon: Users },
  { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { title: 'Pending Approvals', href: '/admin/providers/pending', icon: Clock },
  { title: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { title: 'Invoices', href: '/admin/invoices', icon: FileText },
  { title: 'Activity Log', href: '/admin/activity', icon: Activity },
  { title: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
  { title: 'Help', href: '/admin/help', icon: HelpCircle },
];

const providerNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/provider/dashboard', icon: LayoutDashboard },
  { title: 'Events', href: '/provider/events', icon: Calendar },
  { title: 'Messages', href: '/provider/messages', icon: MessageSquare },
  { title: 'Invoices', href: '/provider/invoices', icon: FileText },
  { title: 'Calendar', href: '/provider/calendar', icon: CalendarDays },
  { title: 'Settings', href: '/provider/settings', icon: Settings },
  { title: 'Help', href: '/provider/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadMessageCount, loadUnreadMessageCount } = useDataStore();

  useEffect(() => {
    if (user) {
      loadUnreadMessageCount();
    }
  }, [user, loadUnreadMessageCount]);

  const navItems = user?.role === 'admin' ? adminNavItems : providerNavItems;

  return (
    <aside className="hidden md:block sticky top-[64px] w-64 bg-background border-r h-[calc(100vh-64px)] overflow-y-auto p-4" role="complementary" aria-label="Sidebar navigation">
      <nav className="space-y-1" role="navigation" aria-label="Main menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
              role="menuitem"
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 flex items-center justify-between">
                <span>{item.title}</span>
                {item.title === 'Messages' && unreadMessageCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs min-w-[20px] h-5 px-1">
                    {unreadMessageCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

