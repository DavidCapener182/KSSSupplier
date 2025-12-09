import { createServerClient } from '@/lib/supabase/server';
import { detectLazyBookingPattern } from '@/lib/ai/lazy-booking-detector';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { providerId } = await request.json();
    
    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch assignments with event and staff details
    // We need historical data to detect patterns
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        event:events(*),
        staff_details(*)
      `)
      .eq('provider_id', providerId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Analyze
    const analysis = detectLazyBookingPattern(assignments || []);

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Error in Lazy Booking Analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

