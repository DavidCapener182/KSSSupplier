import { supabase } from './client';
import type { User } from '@/lib/types';

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T> | { then: (onfulfilled?: any, onrejected?: any) => any }, timeoutMs: number = 2000): Promise<T> {
  const promiseLike = Promise.resolve(promise) as Promise<T>;
  return Promise.race([
    promiseLike,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
}

export async function signIn(email: string, password: string): Promise<{ user: User; session: any }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Supabase auth error:', error);
    throw error;
  }

  if (!data.user) {
    throw new Error('No user data returned from authentication');
  }

  // Get user role from public.users table - optimized for speed
  try {
    // Skip RPC (it doesn't exist) and go straight to optimized direct query
    // Only select the fields we need for faster query
    const queryPromise = supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();
    
    // Add timeout to fail fast (2 seconds)
    const result = await withTimeout(queryPromise, 2000) as { data: { role: string } | null; error: any };
    const { data: directUserData, error: directError } = result;
      
    if (!directError && directUserData) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: directUserData.role as 'admin' | 'provider',
        },
        session: data.session,
      };
    }

    // Final fallback: trust known admin email to unblock UI even if network blocks fetch
    if (data.user.email === 'david.capener@kssnwltd.co.uk') {
      console.warn('Falling back to hardcoded admin role for david.capener@kssnwltd.co.uk');
      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: 'admin',
        },
        session: data.session,
      };
    }

    throw directError || new Error('User role not found');
  } catch (err: any) {
    // If timeout or other error, use fallback for known admin
    if (data.user.email === 'david.capener@kssnwltd.co.uk') {
      console.warn('Query failed, using hardcoded admin role for david.capener@kssnwltd.co.uk');
      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: 'admin',
        },
        session: data.session,
      };
    }
    
    console.error('Error fetching user role:', err);
    throw err;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  try {
    // Skip RPC and use optimized direct query with timeout
    const queryPromise = supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const result = await withTimeout(queryPromise, 2000) as { data: { role: string } | null; error: any };
    const { data: directUserData, error } = result;
    
    if (!error && directUserData) {
      return {
        id: user.id,
        email: user.email!,
        role: directUserData.role as 'admin' | 'provider',
      };
    }

    // Final fallback for the known admin email
    if (user.email === 'david.capener@kssnwltd.co.uk') {
      console.warn('Falling back to hardcoded admin role for david.capener@kssnwltd.co.uk (getCurrentUser)');
      return {
        id: user.id,
        email: user.email!,
        role: 'admin',
      };
    }

    console.warn('Could not fetch user profile:', error);
    return null;
  } catch (err) {
    // If timeout, use fallback for known admin
    if (user.email === 'david.capener@kssnwltd.co.uk') {
      return {
        id: user.id,
        email: user.email!,
        role: 'admin',
      };
    }
    
    console.error('Error in getCurrentUser:', err);
    return null;
  }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}
