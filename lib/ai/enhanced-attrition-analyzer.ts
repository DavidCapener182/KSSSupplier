import { Assignment, Event } from '@/lib/types';
import { analyzeAttrition } from './attrition-analyzer';
import { getWeatherForecast, calculateWeatherRisk } from './weather-analyzer';
import { analyzeTravelRisk } from './travel-risk-calculator';
import { createClient } from '@supabase/supabase-js';

export async function generateComprehensivePrediction(
  supabase: any,
  eventId: string
) {
  // 1. Fetch Event
  const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single();
  if (!event) throw new Error('Event not found');

  // 2. Fetch Assignments & Providers
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, providers(*)')
    .eq('event_id', eventId);

  // 3. Get Base Attrition
  // We need history for this (fetching all history might be heavy, so simplified here)
  const { data: history } = await supabase
    .from('assignments')
    .select('*, events(*)')
    .eq('status', 'accepted')
    .not('actual_managers', 'is', null)
    .limit(50); // Last 50 relevant assignments

  const historyMapped = history.map((h: any) => ({ assignment: h, event: h.events }));
  const baseAnalysis = analyzeAttrition(event, historyMapped);

  // 4. Weather Analysis
  const weather = await getWeatherForecast(event.location, event.date);
  const weatherRisk = weather ? calculateWeatherRisk(weather) : { riskMultiplier: 1.0, reasoning: [] };

  // 5. Travel Risk Analysis (Average across providers)
  let totalTravelRisk = 0;
  const providerRisks = [];
  
  if (assignments && assignments.length > 0) {
    for (const assign of assignments) {
      if (assign.providers?.address) {
        const risk = await analyzeTravelRisk(assign.providers.address, event.location);
        totalTravelRisk += risk.riskScore;
        providerRisks.push({
          assignmentId: assign.id,
          providerId: assign.provider_id,
          ...risk
        });
      }
    }
    totalTravelRisk = totalTravelRisk / assignments.length;
  }

  // 6. Combine Factors
  // Base Rate * Weather Multiplier + Travel Risk Factor
  let predictedRate = baseAnalysis.predictedRate * weatherRisk.riskMultiplier;
  
  // Add travel risk impact (e.g., +1% attrition for every 10 points of risk > 20)
  if (totalTravelRisk > 20) {
    predictedRate += (totalTravelRisk - 20) / 10;
  }

  predictedRate = Math.min(100, Math.max(0, predictedRate));

  // 7. Calculate Recommended Overbooking
  const totalRequired = 
    event.requirements_managers + 
    event.requirements_supervisors + 
    event.requirements_sia + 
    event.requirements_stewards;
    
  const recommendedOverbooking = Math.ceil(totalRequired * (predictedRate / 100));

  return {
    weather,
    weatherRisk,
    baseAttrition: baseAnalysis.predictedRate,
    predictedAttrition: predictedRate,
    recommendedOverbooking,
    providerRisks,
    reasoning: [
      ...weatherRisk.reasoning,
      totalTravelRisk > 40 ? `High average provider travel time increases risk.` : null
    ].filter(Boolean)
  };
}


