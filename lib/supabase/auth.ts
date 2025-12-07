import { supabase } from './client';
import type { User } from '@/lib/types';

export async function signIn(email: string, password: string) {
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

  // Get user role from public.users table
  try {
    // Try RPC first as it's safer with RLS
    const { data: userData, error: userError } = await supabase.rpc('get_my_profile');

    if (!userError && userData) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: userData.role as 'admin' | 'provider',
          forcePasswordChange: (data.user.user_metadata as any)?.force_password_change === true || userData.force_password_change === true,
        },
        session: data.session,
      };
    }

    // Fallback to direct query if RPC fails
    console.warn('RPC get_my_profile failed, falling back to direct query:', userError);
    
    const { data: directUserData, error: directError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (!directError && directUserData) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: directUserData.role as 'admin' | 'provider',
          forcePasswordChange: (data.user.user_metadata as any)?.force_password_change === true || (directUserData as any).force_password_change === true,
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
          forcePasswordChange: false,
        },
        session: data.session,
      };
    }

    const finalError = directError || userError || new Error('User role not found');
    throw finalError;
  } catch (err) {
    console.error('Unexpected error fetching user role:', err);
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
    // Try RPC first
    const { data: userData, error: rpcError } = await supabase.rpc('get_my_profile');

    if (!rpcError && userData) {
      return {
        id: user.id,
        email: user.email!,
        role: userData.role as 'admin' | 'provider',
        forcePasswordChange: (user.user_metadata as any)?.force_password_change === true || userData.force_password_change === true,
      };
    }

    // Fallback to direct query
    const { data: directUserData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!error && directUserData) {
      return {
        id: user.id,
        email: user.email!,
        role: directUserData.role as 'admin' | 'provider',
        forcePasswordChange: (user.user_metadata as any)?.force_password_change === true || (directUserData as any).force_password_change === true,
      };
    }

    // Final fallback for the known admin email
    if (user.email === 'david.capener@kssnwltd.co.uk') {
      console.warn('Falling back to hardcoded admin role for david.capener@kssnwltd.co.uk (getCurrentUser)');
      return {
        id: user.id,
        email: user.email!,
        role: 'admin',
        forcePasswordChange: false,
      };
    }

    console.warn('Could not fetch user profile:', error || rpcError);
    return null;
  } catch (err) {
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
