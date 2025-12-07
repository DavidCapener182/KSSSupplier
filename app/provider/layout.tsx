'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useDataStore } from '@/lib/data-store';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { providers, isProviderOnboarded, loadProviders, loadUnreadMessageCount } = useDataStore();
  const { toast } = useToast();
  
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  useKeyboardShortcuts();

  useEffect(() => {
    const runChecks = async () => {
      if (!isLoading && user) {
        if (user.role !== 'provider') {
          router.push('/admin/dashboard');
          return;
        }

        if (user.forcePasswordChange) {
          setPasswordModalOpen(true);
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

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Please choose a password with at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { force_password_change: false },
      });
      if (error) throw error;
      toast({
        title: 'Password updated',
        description: 'Use your new password next time you log in.',
        variant: 'success',
      });
      setPasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Could not update password',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex relative">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 w-full overflow-x-auto overflow-y-auto h-[calc(100vh-64px)] md:ml-0">{children}</main>
        </div>
      </div>

      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Your Temporary Password</DialogTitle>
            <DialogDescription>
              Please set a new password before continuing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

