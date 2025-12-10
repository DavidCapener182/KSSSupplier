import { createServerClient } from '@/lib/supabase/server';
import { answerQuestion } from '@/lib/ai/rag-ops-bot';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { question, eventId, providerId } = await request.json();
    
    if (!question || !eventId) {
      return NextResponse.json({ error: 'Question and Event ID are required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Provider Name for personalization
    let providerName = 'Provider';
    if (providerId) {
      const { data: provider } = await supabase
        .from('providers')
        .select('company_name')
        .eq('id', providerId)
        .single();
      
      if (provider) {
        providerName = provider.company_name;
      }
    }

    // Generate Answer
    const result = await answerQuestion(supabase, question, eventId, providerName);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in Ops Bot:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


