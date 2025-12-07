import { NextResponse } from 'next/server';
import ical from 'ical-generator';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Get all events from Supabase
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return new NextResponse('Error generating calendar', { status: 500 });
    }

    // Create calendar
    const calendar = ical({
      prodId: '//KSS NW UK Event Staffing Platform//EN',
      name: 'KSS NW UK Events - All Events',
      timezone: 'Europe/London',
    });

    // Get base URL from request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Add events to calendar
    events?.forEach((event) => {
      calendar.createEvent({
        start: new Date(event.date),
        end: new Date(new Date(event.date).setHours(23, 59, 59)),
        summary: event.name,
        description: `Location: ${event.location}\nManagers: ${event.requirements_managers}, Supervisors: ${event.requirements_supervisors}, SIA: ${event.requirements_sia}, Stewards: ${event.requirements_stewards}`,
        location: event.location,
        url: `${baseUrl}/admin/events/${event.id}`,
      });
    });

    return new NextResponse(calendar.toString(), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="kss-events.ics"',
      },
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return new NextResponse('Error generating calendar', { status: 500 });
  }
}
