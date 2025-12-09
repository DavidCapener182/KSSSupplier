import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateRelationshipHealth } from '@/lib/ai/relationship-health-monitor';

export async function POST(request: Request) {
  try {
    const { providerId } = await request.json();
    
    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);
    
    // Check auth (Admin only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { // Add role check logic here if needed
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We need to map providerId to user_id to find messages
    // Assuming providerId is the provider table ID
    const { data: provider, error: pError } = await supabase
      .from('providers')
      .select('user_id')
      .eq('id', providerId)
      .single();

    if (pError || !provider) {
       return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const healthReport = await calculateRelationshipHealth(supabase, provider.user_id);

    return NextResponse.json(healthReport);

  } catch (error: any) {
    console.error('Error calculating relationship health:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
