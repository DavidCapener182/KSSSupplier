import { NextResponse } from 'next/server';
import { scoreProviders } from '@/lib/ai/provider-scorer';
import OpenAI from 'openai';
import { createServerClient } from '@/lib/supabase/server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // 1. Fetch data
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Transform event to match Event interface
    const event = {
      id: eventRow.id,
      name: eventRow.name,
      location: eventRow.location,
      date: eventRow.date,
      requirements: {
        managers: eventRow.requirements_managers,
        supervisors: eventRow.requirements_supervisors,
        sia: eventRow.requirements_sia,
        stewards: eventRow.requirements_stewards,
      },
      created_at: eventRow.created_at,
      updated_at: eventRow.updated_at,
    };

    // Get all approved providers
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('*')
      .eq('status', 'approved');

    if (providersError) throw providersError;

    // Get all assignments for history
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*');

    if (assignmentsError) throw assignmentsError;

    // 2. Calculate scores
    const scoredProviders = await scoreProviders(event, providers || [], assignments || []);
    const topProviders = scoredProviders.slice(0, 3);

    // 3. Generate AI insights using OpenAI
    let aiReasoning = '';
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
          I need to match providers for an event.
          
          Event: ${event.name}
          Location: ${event.location}
          Date: ${event.date}
          Requirements: ${JSON.stringify(event.requirements)}
          
          Top 3 Candidates:
          ${topProviders.map(p => {
            const provider = providers.find(pv => pv.id === p.providerId);
            return `
            - ${provider?.company_name}:
              Score: ${p.totalScore.toFixed(0)}/100
              Performance: ${p.components.performanceScore.toFixed(0)}
              Distance: ${p.details.distanceText}
              Attendance: ${p.details.attendanceRate.toFixed(0)}%
              Reasoning: ${p.reasoning.join(', ')}
            `;
          }).join('\n')}
          
          Please provide a brief, professional recommendation summary for why these providers are the best fit, highlighting specific strengths. Keep it under 100 words.
        `;

        const completion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4o-mini',
        });

        aiReasoning = completion.choices[0]?.message?.content || '';
      } catch (aiError) {
        console.error('OpenAI generation failed:', aiError);
        // Fallback or ignore
      }
    }

    // 4. Store recommendations
    // We'll store the top recommendation as the primary one, but return all top 3
    if (topProviders.length > 0) {
      const topMatch = topProviders[0];
      
      // Check if recommendation already exists for this event/provider to avoid duplicates
      // Or just insert new one
      const { error: saveError } = await supabase
        .from('ai_recommendations')
        .insert({
          event_id: eventId,
          provider_id: topMatch.providerId,
          score: topMatch.totalScore,
          reasoning: aiReasoning || topMatch.reasoning.join('. '),
          factors: topMatch.components
        });
        
      if (saveError) console.error('Error saving recommendation:', saveError);
    }

    // Return the enriched results
    return NextResponse.json({
      recommendations: topProviders.map(p => {
        const provider = providers.find(pv => pv.id === p.providerId);
        return {
          ...p,
          company_name: provider?.company_name,
          contact_email: provider?.contact_email,
        };
      }),
      aiReasoning
    });

  } catch (error: any) {
    console.error('Error in provider matching:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
