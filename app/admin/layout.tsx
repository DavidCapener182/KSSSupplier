'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useDataStore } from '@/lib/data-store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { loadUnreadMessageCount } = useDataStore();
  useKeyboardShortcuts();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/provider/dashboard');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.id) {
      loadUnreadMessageCount();
    }
  }, [user?.id, loadUnreadMessageCount]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex relative">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 w-full overflow-x-auto overflow-y-auto h-[calc(100vh-64px)] md:ml-0">{children}</main>
      </div>
    </div>
  );
}

