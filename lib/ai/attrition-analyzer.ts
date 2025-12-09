import { Assignment, Event } from '@/lib/types';
import { differenceInDays, getDay } from 'date-fns';

export interface AttritionAnalysis {
  historicalRate: number;
  predictedRate: number;
  confidence: number;
  factors: {
    venueImpact: number;
    dayOfWeekImpact: number;
    providerReliability: number;
  };
  sampleSize: number;
}

export function analyzeAttrition(
  targetEvent: Event,
  history: { assignment: Assignment; event: Event }[]
): AttritionAnalysis {
  // 1. Filter relevant history
  // Look for events at same location or similar type (if we had type)
  const venueHistory = history.filter(h => h.event.location === targetEvent.location);
  
  // Look for day of week patterns
  const targetDay = getDay(new Date(targetEvent.date));
  const dayHistory = history.filter(h => getDay(new Date(h.event.date)) === targetDay);

  // Calculate base attrition rate from all history
  const baseRate = calculateAverageAttrition(history);

  // Calculate venue specific rate
  const venueRate = venueHistory.length > 0 ? calculateAverageAttrition(venueHistory) : baseRate;
  
  // Calculate day specific rate
  const dayRate = dayHistory.length > 0 ? calculateAverageAttrition(dayHistory) : baseRate;

  // Weighted prediction
  // 50% venue, 30% day of week, 20% base
  let predictedRate = (venueRate * 0.5) + (dayRate * 0.3) + (baseRate * 0.2);

  // Adjust for sample size confidence
  const sampleSize = venueHistory.length + dayHistory.length;
  let confidence = Math.min(0.9, sampleSize / 10); // Need ~10 events for high confidence

  // If very little data, revert closer to base assumption (e.g., 10%)
  if (sampleSize < 3) {
    predictedRate = (predictedRate + 10) / 2;
    confidence = 0.3;
  }

  return {
    historicalRate: baseRate,
    predictedRate,
    confidence,
    factors: {
      venueImpact: venueRate - baseRate,
      dayOfWeekImpact: dayRate - baseRate,
      providerReliability: 0, // Calculated separately or integrated if provider known
    },
    sampleSize
  };
}

function calculateAverageAttrition(history: { assignment: Assignment; event: Event }[]): number {
  if (history.length === 0) return 0;

  let totalAssigned = 0;
  let totalActual = 0;

  for (const h of history) {
    const a = h.assignment;
    // Only consider completed assignments
    if (a.status === 'accepted' && a.actual_managers !== null) {
      const assigned = 
        a.assigned_managers + a.assigned_supervisors + a.assigned_sia + a.assigned_stewards;
      const actual = 
        (a.actual_managers || 0) + (a.actual_supervisors || 0) + (a.actual_sia || 0) + (a.actual_stewards || 0);
      
      if (assigned > 0) {
        totalAssigned += assigned;
        totalActual += actual;
      }
    }
  }

  if (totalAssigned === 0) return 0;
  
  // Attrition = (Assigned - Actual) / Assigned
  const rate = ((totalAssigned - totalActual) / totalAssigned) * 100;
  return Math.max(0, rate); // Ensure not negative (if actual > assigned)
}
