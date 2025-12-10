import { createServerClient } from '@/lib/supabase/server';
import { calculateEngagementScore } from '@/lib/ai/engagement-analyzer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { providerId } = await request.json();
    
    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);

    // Check auth (Admin only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Provider
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // 2. Fetch Logs
    // Limit to last 90 days for relevance
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', provider.user_id)
      .gte('created_at', ninetyDaysAgo.toISOString());

    if (logsError) throw logsError;

    // 3. Fetch Messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${provider.user_id},receiver_id.eq.${provider.user_id}`)
      .gte('created_at', ninetyDaysAgo.toISOString());

    if (messagesError) throw messagesError;

    // 4. Fetch Assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, created_at, status')
      .eq('provider_id', providerId)
      .gte('created_at', ninetyDaysAgo.toISOString());

    if (assignmentsError) throw assignmentsError;

    // 5. Calculate Score
    const metrics = calculateEngagementScore(
      provider,
      logs || [],
      messages || [],
      assignments || []
    );

    // 6. Save to DB
    const { error: upsertError } = await supabase
      .from('provider_engagement_scores')
      .upsert({
        provider_id: providerId,
        engagement_score: metrics.engagementScore,
        time_to_open_hours: metrics.timeToOpenHours,
        login_frequency_days: metrics.loginFrequencyDays,
        chat_latency_hours: metrics.chatLatencyHours,
        metrics: metrics,
        calculated_at: new Date().toISOString()
      }, { onConflict: 'provider_id' });

    if (upsertError) {
      console.error('Error saving engagement score:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json(metrics);

  } catch (error: any) {
    console.error('Error in engagement score calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


