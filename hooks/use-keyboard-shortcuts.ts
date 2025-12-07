'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const shortcuts: Shortcut[] = [
      {
        key: 'k',
        ctrl: true,
        action: () => {
          // Open command palette or search (placeholder)
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        },
        description: 'Focus search',
      },
      {
        key: 'n',
        ctrl: true,
        shift: true,
        action: () => {
          if (user?.role === 'admin') {
            router.push('/admin/events/new');
          }
        },
        description: 'New event',
      },
      {
        key: 'd',
        ctrl: true,
        action: () => {
          if (user?.role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/provider/dashboard');
          }
        },
        description: 'Go to dashboard',
      },
      {
        key: 'e',
        ctrl: true,
        action: () => {
          if (user?.role === 'admin') {
            router.push('/admin/events');
          } else {
            router.push('/provider/events');
          }
        },
        description: 'Go to events',
      },
      {
        key: 'm',
        ctrl: true,
        action: () => {
          if (user?.role === 'admin') {
            router.push('/admin/messages');
          } else {
            router.push('/provider/messages');
          }
        },
        description: 'Go to messages',
      },
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, user]);
}


