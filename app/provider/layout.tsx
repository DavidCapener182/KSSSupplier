'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useDataStore } from '@/lib/data-store';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { providers, isProviderOnboarded, loadProviders, loadUnreadMessageCount } = useDataStore();
  
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  useKeyboardShortcuts();

  useEffect(() => {
    const runChecks = async () => {
      if (!isLoading && user) {
        if (user.role !== 'provider') {
          router.push('/admin/dashboard');
          return;
        }

        // Check onboarding status (except on onboarding page itself)
        if (pathname !== '/provider/onboarding') {
          const provider = providers.find((p) => p.user_id === user.id);
          if (provider) {
            const onboarded = await isProviderOnboarded(provider.id);
            if (!onboarded) {
              router.push('/provider/onboarding');
              return;
            }
          }
        }
        setCheckingOnboarding(false);
      } else if (!isLoading && !user) {
        router.push('/login');
      }
    };
    runChecks();
  }, [user, isLoading, router, pathname, providers, isProviderOnboarded]);

  useEffect(() => {
    if (user?.id) {
      loadUnreadMessageCount();
    }
  }, [user?.id, loadUnreadMessageCount]);

  if (isLoading || checkingOnboarding || !user || user.role !== 'provider') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show sidebar/navbar on onboarding page
  if (pathname === '/provider/onboarding') {
    return <>{children}</>;
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

