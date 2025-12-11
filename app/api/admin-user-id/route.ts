import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient(request);
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use RPC function to get admin user ID (bypasses RLS via SECURITY DEFINER)
    const { data: adminUserId, error } = await supabase.rpc('get_admin_user_id');

    if (error) {
      console.error('Error fetching admin user:', error);
      // Fallback: Try direct query (may fail due to RLS for providers)
      const { data: adminUsers, error: fallbackError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (fallbackError || !adminUsers || adminUsers.length === 0) {
        return NextResponse.json({ error: 'Failed to find admin user' }, { status: 500 });
      }

      return NextResponse.json({ adminUserId: adminUsers[0].id });
    }

    if (!adminUserId) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 404 });
    }

    return NextResponse.json({ adminUserId });

  } catch (error: any) {
    console.error('Error in admin-user-id endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


