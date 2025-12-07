import { NextResponse } from 'next/server';
import ical from 'ical-generator';
import { createServerClient } from '@/lib/supabase/server';

async function getProviderEvents(providerId: string) {
  const supabase = await createServerClient();
  
  // Get provider's accepted assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('event_id')
    .eq('provider_id', providerId)
    .eq('status', 'accepted');

  if (assignmentsError || !assignments) {
    return [];
  }

  const eventIds = assignments.map((a) => a.event_id);

  if (eventIds.length === 0) {
    return [];
  }

  // Get events for these assignments
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('date', { ascending: true });

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    return [];
  }

  return events || [];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; token: string }> }
) {
  try {
    const { id, token } = await params;
    
    // In Phase 2, verify token against provider profile in Supabase
    // For now, we'll just check if provider exists
    const supabase = await createServerClient();
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('id', id)
      .single();

    if (providerError || !provider) {
      return new NextResponse('Provider not found', { status: 404 });
    }

    const events = await getProviderEvents(id);

    // Create calendar
    const calendar = ical({
      prodId: '//KSS NW UK Event Staffing Platform//EN',
      name: 'KSS NW UK Events - My Assignments',
      timezone: 'Europe/London',
    });

    // Get base URL from request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Add events to calendar
    events.forEach((event) => {
      calendar.createEvent({
        start: new Date(event.date),
        end: new Date(new Date(event.date).setHours(23, 59, 59)),
        summary: event.name,
        description: `Location: ${event.location}\nManagers: ${event.requirements_managers}, Supervisors: ${event.requirements_supervisors}, SIA: ${event.requirements_sia}, Stewards: ${event.requirements_stewards}`,
        location: event.location,
        url: `${baseUrl}/provider/events/${event.id}`,
      });
    });

    return new NextResponse(calendar.toString(), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="kss-assignments-${id}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return new NextResponse('Error generating calendar', { status: 500 });
  }
}
