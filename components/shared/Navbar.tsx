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
  Moon,
  Sun,
  FileStack,
  Clock,
  BarChart3,
  HelpCircle,
  Search,
  ChevronDown,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { Separator } from '@/components/ui/separator';
import { useDataStore } from '@/lib/data-store';
import { useMessageNotifications } from '@/hooks/use-message-notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const adminNavItems = [
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
];

const providerNavItems = [
  { title: 'Dashboard', href: '/provider/dashboard', icon: LayoutDashboard },
  { title: 'Events', href: '/provider/events', icon: Calendar },
  { title: 'Messages', href: '/provider/messages', icon: MessageSquare },
  { title: 'Invoices', href: '/provider/invoices', icon: FileText },
  { title: 'Calendar', href: '/provider/calendar', icon: CalendarDays },
  { title: 'Settings', href: '/provider/settings', icon: Settings },
  { title: 'Help', href: '/provider/help', icon: HelpCircle },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { unreadMessageCount, loadUnreadMessageCount } = useDataStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const initialTheme = stored || 'light';
      setTheme(initialTheme);
      // Apply theme to document
      const root = document.documentElement;
      if (initialTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#2C2C2C]/80 backdrop-blur-md text-white shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="w-full px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10 hover:text-white" aria-label="Open mobile menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="p-4 flex-1 flex flex-col min-h-0">
                <nav className="space-y-1 flex-1 overflow-y-auto" role="navigation" aria-label="Mobile menu">
                  {navItems.map((item) => {
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
                </nav>
                <div className="mt-auto pt-4 space-y-1 border-t">
                  <button
                    onClick={() => {
                      const newTheme = theme === 'light' ? 'dark' : 'light';
                      setTheme(newTheme);
                      const root = document.documentElement;
                      if (newTheme === 'dark') {
                        root.classList.add('dark');
                      } else {
                        root.classList.remove('dark');
                      }
                      localStorage.setItem('theme', newTheme);
                    }}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    {theme === 'light' ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )}
                    <span>Toggle Theme</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
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

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="pl-0 hover:bg-transparent text-left h-auto py-1">
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                      <div className="bg-rose-500/20 p-1.5 rounded-full ring-1 ring-rose-500/50">
                        <User className="h-4 w-4 text-rose-500" />
                      </div>
                      <div className="hidden md:flex flex-col leading-tight">
                        <span className="font-medium text-sm text-white">{user.email}</span>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                          {user.role}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-white/50 ml-1" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56 bg-[#2C2C2C] border-white/10 text-white">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <Link href={user.role === 'admin' ? '/admin/settings' : '/provider/settings'}>
                    <DropdownMenuItem className="focus:bg-rose-500 focus:text-white cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem 
                    className="focus:bg-rose-500 focus:text-white cursor-pointer"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
