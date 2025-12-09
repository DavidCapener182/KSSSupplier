import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerClient(request?: Request) {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
  
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  
  // Get all cookies and search for Supabase auth cookies
  const allCookies = cookieStore.getAll();
  
  // Supabase cookie format: sb-<project-ref>-auth-token
  const authCookieName = `sb-${projectRef}-auth-token`;
  const authCookie = cookieStore.get(authCookieName);
  
  if (authCookie) {
      try {
        // Supabase stores session as JSON string
      const decoded = decodeURIComponent(authCookie.value);
        const sessionData = JSON.parse(decoded);
        
        // Try different possible structures
        if (sessionData.access_token) {
          accessToken = sessionData.access_token;
        }
        if (sessionData.refresh_token) {
          refreshToken = sessionData.refresh_token;
        }
        if (sessionData.session?.access_token) {
          accessToken = sessionData.session.access_token;
        }
        if (sessionData.session?.refresh_token) {
          refreshToken = sessionData.session.refresh_token;
        }
        // Sometimes it's nested differently
      if (Array.isArray(sessionData) && sessionData[0]?.access_token) {
          accessToken = sessionData[0].access_token;
        }
      } catch (e) {
      console.debug('Failed to parse auth cookie:', e);
    }
  }
  
  // Fallback: Look for any Supabase auth cookies
  if (!accessToken) {
    for (const cookie of allCookies) {
      const name = cookie.name;
      const value = cookie.value;
      
      // Check if this is a Supabase auth cookie
      if (name.includes('sb-') && name.includes('auth')) {
        try {
          const decoded = decodeURIComponent(value);
          const sessionData = JSON.parse(decoded);
          
          if (sessionData.access_token) {
            accessToken = sessionData.access_token;
          }
          if (sessionData.refresh_token) {
            refreshToken = sessionData.refresh_token;
          }
          if (sessionData.session?.access_token) {
            accessToken = sessionData.session.access_token;
          }
          if (sessionData.session?.refresh_token) {
            refreshToken = sessionData.session.refresh_token;
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }
    }
  }
  
  // Also try reading from request headers if provided (prioritize this)
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
    
    // Try reading all cookies from request header as fallback
    if (!accessToken) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookieMap = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, ...valueParts] = cookie.trim().split('=');
          const value = valueParts.join('='); // Handle values with = in them
          acc[key] = decodeURIComponent(value);
          return acc;
        }, {} as Record<string, string>);
        
        // Look for any Supabase auth cookie
        for (const [key, value] of Object.entries(cookieMap)) {
          if (key.includes('sb-') && key.includes('auth') && !accessToken) {
            try {
              const sessionData = JSON.parse(value);
              if (sessionData.access_token) {
                accessToken = sessionData.access_token;
              }
              if (sessionData.session?.access_token) {
                accessToken = sessionData.session.access_token;
              }
            } catch (e) {
              // If not JSON, might be direct token
              if (key.includes('access')) {
                accessToken = value;
              }
            }
          }
        }
      }
    }
  }

  // Create client
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          // Try to get from cookies
          const cookie = cookieStore.get(key);
          return cookie?.value || null;
        },
        setItem: () => {}, // No-op for server
        removeItem: () => {}, // No-op for server
      },
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    },
  } as any);

  // If we have tokens, try to set the session
  if (accessToken) {
    try {
      if (refreshToken) {
      await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      } as any);
      } else {
        // If we only have access token, set it directly
        await client.auth.setSession({
          access_token: accessToken,
          refresh_token: '', // Empty refresh token
        } as any);
      }
    } catch (e) {
      console.debug('setSession failed, trying getUser:', e);
      // If setSession fails, try to get user directly with the token
        try {
        const { data: { user }, error: getUserError } = await client.auth.getUser(accessToken);
        if (user && !getUserError) {
            // User is authenticated, client should work now
            return client;
        } else {
          console.debug('getUser failed:', getUserError);
          }
        } catch (e2) {
          console.debug('Could not authenticate with token:', e2);
        }
      }
    }
  
  // Try to get session from storage (cookies) as fallback
    try {
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (session?.access_token && !sessionError) {
        // Session found, client is authenticated
        return client;
    } else if (sessionError) {
      console.debug('getSession error:', sessionError);
      }
    } catch (e) {
    console.debug('Could not get session from storage:', e);
  }

  return client;
}


