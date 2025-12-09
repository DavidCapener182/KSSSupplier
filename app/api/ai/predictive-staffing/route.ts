import { NextResponse } from 'next/server';
import { analyzeAttrition } from '@/lib/ai/attrition-analyzer';
import { calculateOverbooking } from '@/lib/ai/overbooking-calculator';
import OpenAI from 'openai';
import { createServerClient } from '@/lib/supabase/server';

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

    // 1. Fetch current event
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

    // 2. Fetch history (assignments + events)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*');
      
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*');

    if (assignmentsError || eventsError) throw new Error('Failed to fetch history');

    // Link assignments to events and transform
    const history = (assignments || []).map(a => {
      const eventRow = (events || []).find(e => e.id === a.event_id);
      if (!eventRow) return null;
      
      const transformedEvent = {
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
      
      return {
        assignment: a,
        event: transformedEvent
      };
    }).filter(h => h !== null) as any[];

    // 3. Analyze Attrition
    const analysis = analyzeAttrition(event, history);
    
    // 4. Calculate Overbooking
    const totalRequired = 
      event.requirements.managers + 
      event.requirements.supervisors + 
      event.requirements.sia + 
      event.requirements.stewards;
      
    const recommendation = calculateOverbooking(totalRequired, analysis);

    // 5. Identify Risk Factors with AI
    let riskAnalysis = {
      riskLevel: 'Low',
      factors: [] as string[]
    };

    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
          Analyze staffing risk for this event:
          Event: ${event.name}
          Date: ${event.date}
          Location: ${event.location}
          Required Staff: ${totalRequired}
          Predicted Attrition: ${analysis.predictedRate.toFixed(1)}%
          
          Identify potential risk factors (e.g., weekend/holiday, large size, location). 
          Return JSON: { "riskLevel": "Low"|"Medium"|"High", "factors": ["factor 1", "factor 2"] }
        `;

        const completion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4o-mini',
          response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
        riskAnalysis = { ...riskAnalysis, ...result };
      } catch (e) {
        console.error('AI risk analysis failed:', e);
      }
    }

    // 6. Store prediction
    await supabase.from('attrition_predictions').insert({
      event_id: eventId,
      predicted_attrition_rate: analysis.predictedRate,
      recommended_overbooking: recommendation.recommendedTotal,
      risk_factors: riskAnalysis,
      confidence_score: analysis.confidence
    });

    return NextResponse.json({
      analysis,
      recommendation,
      riskAnalysis
    });

  } catch (error: any) {
    console.error('Error in predictive staffing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
