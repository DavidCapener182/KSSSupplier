'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  CalendarDays,
  LogOut,
  User,
  Menu,
  Activity,
  Settings,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { Separator } from '@/components/ui/separator';
import { useDataStore } from '@/lib/data-store';
import { useMessageNotifications } from '@/hooks/use-message-notifications';

const adminNavItems = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Events', href: '/admin/events', icon: Calendar },
  { title: 'Providers', href: '/admin/providers', icon: Users },
  { title: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { title: 'Invoices', href: '/admin/invoices', icon: FileText },
  { title: 'Activity Log', href: '/admin/activity', icon: Activity },
  { title: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
];

const providerNavItems = [
  { title: 'Dashboard', href: '/provider/dashboard', icon: LayoutDashboard },
  { title: 'Events', href: '/provider/events', icon: Calendar },
  { title: 'Messages', href: '/provider/messages', icon: MessageSquare },
  { title: 'Invoices', href: '/provider/invoices', icon: FileText },
  { title: 'Calendar', href: '/provider/calendar', icon: CalendarDays },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { unreadMessageCount, loadUnreadMessageCount } = useDataStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = user?.role === 'admin' ? adminNavItems : providerNavItems;

  useEffect(() => {
    if (user) {
      loadUnreadMessageCount();
    }
  }, [user, loadUnreadMessageCount]);

  useMessageNotifications(user || null, () => {
    loadUnreadMessageCount();
  });

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-[#2C2C2C] text-white shadow-md" role="navigation" aria-label="Main navigation">
      <div className="w-full px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10 hover:text-white" aria-label="Open mobile menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <nav className="space-y-1" role="navigation" aria-label="Mobile menu">
                  {navItems.map((item) => {
                    if (item.href === '/admin/settings' || item.href === '/provider/settings') {
                      return null; // Settings will be in user menu
                    }
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="flex items-center justify-between w-full">
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
                  <Separator className="my-2" />
                  <Link
                    href={user?.role === 'admin' ? '/admin/settings' : '/provider/settings'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === '/admin/settings' || pathname === '/provider/settings'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-primary">KSS NW UK</span> Labour Provider Portal
          </h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          {user && (
            <>
              <div className="text-white/90 hover:text-white transition-colors">
                <NotificationCenter />
              </div>
              <div className="text-white/90 hover:text-white transition-colors">
                <ThemeToggle />
              </div>
              <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-300 border-l border-gray-700 pl-4">
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 p-1 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="hidden md:inline font-medium text-white">{user.email}</span>
                    <span className="text-xs text-primary font-semibold capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
              <Link href={user.role === 'admin' ? '/admin/settings' : '/provider/settings'}>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 text-xs md:text-sm" aria-label="Settings">
                  <Settings className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="text-white/80 hover:text-white hover:bg-red-500/20 hover:text-red-400 text-xs md:text-sm" aria-label="Logout">
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
