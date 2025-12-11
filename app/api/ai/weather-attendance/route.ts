import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateComprehensivePrediction } from '@/lib/ai/enhanced-attrition-analyzer';

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const prediction = await generateComprehensivePrediction(supabase, eventId);

    // Save predictions to DB
    const { error: dbError } = await supabase
      .from('weather_attendance_predictions')
      .upsert({
        event_id: eventId,
        forecasted_weather: prediction.weather,
        predicted_attrition_rate: prediction.predictedAttrition,
        recommended_overbooking: prediction.recommendedOverbooking,
        travel_risk_factors: { 
          riskMultiplier: prediction.weatherRisk.riskMultiplier, 
          reasoning: prediction.reasoning 
        }
      }, { onConflict: 'event_id' });

    if (dbError) console.error('Error saving weather prediction:', dbError);

    // Save provider risks
    if (prediction.providerRisks.length > 0) {
       const risksToSave = prediction.providerRisks.map(r => ({
         assignment_id: r.assignmentId,
         provider_id: r.providerId,
         event_id: eventId,
         distance_km: r.distanceKm,
         estimated_travel_hours: r.durationHours,
         risk_level: r.riskLevel
       }));

       const { error: riskError } = await supabase
         .from('provider_travel_risks')
         .upsert(risksToSave, { onConflict: 'assignment_id' });

       if (riskError) console.error('Error saving provider risks:', riskError);
    }

    return NextResponse.json(prediction);

  } catch (error: any) {
    console.error('Error generating weather prediction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


