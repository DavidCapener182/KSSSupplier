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
  Search,
  LogOut,
  Presentation,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

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
  { title: 'Data Search', href: '/admin/search', icon: Search },
  { title: 'Activity Log', href: '/admin/activity', icon: Activity },
  { title: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
  { title: 'Help', href: '/admin/help', icon: HelpCircle },
  { title: 'Pitch Deck', href: '/admin/pitch', icon: Presentation },
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
  const { user, logout } = useAuth();
  const { unreadMessageCount, loadUnreadMessageCount } = useDataStore();

  useEffect(() => {
    if (user) {
      loadUnreadMessageCount();
    }
  }, [user, loadUnreadMessageCount]);

  const navItems = user?.role === 'admin' ? adminNavItems : providerNavItems;

  return (
    <aside className="hidden md:flex flex-col sticky top-[64px] w-64 bg-charcoal border-r border-border h-[calc(100vh-64px)]" role="complementary" aria-label="Sidebar navigation">
      <nav className="flex-1 overflow-y-auto p-4 space-y-1" role="navigation" aria-label="Main menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out relative',
                isActive
                  ? 'text-white bg-gradient-to-r from-rose-500/10 to-transparent'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
              aria-current={isActive ? 'page' : undefined}
              role="menuitem"
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 h-full w-1 bg-rose-500 rounded-r-full shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
              )}
              
              {/* Icon with glow effect on active */}
              <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-rose-500" : "text-white/60 group-hover:text-white")} />
              
              <span className="flex-1 flex items-center justify-between">
                <span className={cn(isActive && "font-semibold")}>{item.title}</span>
                {/* Notification Badge */}
                {item.title === 'Messages' && unreadMessageCount > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md shadow-rose-500/20">
                    {unreadMessageCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <Separator className="mb-4" />
        <Button
          variant="ghost"
          onClick={() => logout()}
          className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}

