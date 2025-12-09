import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { detectDoubleBookings } from '@/lib/ai/double-booking-detector';

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Use admin client to bypass RLS and access all data needed for detection
    const supabase = createAdminClient();
    
    const conflicts = await detectDoubleBookings(supabase, eventId);

    // Save alerts to DB if any found
    if (conflicts.length > 0) {
      // Remove extra fields before insert
      const alertsToInsert = conflicts.map(({ provider1_name, provider2_name, ...rest }) => rest);
      
      const { error } = await supabase
        .from('double_booking_alerts')
        .upsert(alertsToInsert, { 
          onConflict: 'event_id, staff_detail_id_1, staff_detail_id_2', 
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Error saving alerts:', error);
        // Continue anyway to return the detected conflicts to UI
      }
    }

    return NextResponse.json({ 
      conflicts,
      count: conflicts.length
    });

  } catch (error: any) {
    console.error('Error detecting double bookings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

