import { Provider, Assignment, Event } from '@/lib/types';
import { calculateDistance } from './location-matcher';

export interface ProviderScore {
  providerId: string;
  totalScore: number;
  components: {
    performanceScore: number;
    distanceScore: number;
    capacityScore: number;
    reliabilityScore: number;
  };
  details: {
    distanceText: string;
    acceptanceRate: number;
    attendanceRate: number;
    totalAssignments: number;
  };
  reasoning: string[];
}

export interface ScoringOptions {
  weightPerformance: number; // default 0.4
  weightDistance: number;    // default 0.3
  weightReliability: number; // default 0.3
  maxDistanceMiles: number;  // default 50
}

const DEFAULT_OPTIONS: ScoringOptions = {
  weightPerformance: 0.4,
  weightDistance: 0.3,
  weightReliability: 0.3,
  maxDistanceMiles: 100,
};

export async function scoreProviders(
  event: Event,
  providers: Provider[],
  allAssignments: Assignment[],
  options: Partial<ScoringOptions> = {}
): Promise<ProviderScore[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const scores: ProviderScore[] = [];

  for (const provider of providers) {
    // 1. Calculate Historical Performance (similar to ProviderScorecard)
    const providerAssignments = allAssignments.filter(a => a.provider_id === provider.id);
    
    // Acceptance Rate
    const accepted = providerAssignments.filter(a => a.status === 'accepted').length;
    const totalOffers = providerAssignments.length;
    const acceptanceRate = totalOffers > 0 ? (accepted / totalOffers) * 100 : 0;

    // Attendance Rate
    const completedAssignments = providerAssignments.filter(
      a => a.status === 'accepted' && a.actual_managers !== null
    );
    
    const attendanceRates = completedAssignments.map(assignment => {
      const totalAssigned =
        assignment.assigned_managers +
        assignment.assigned_supervisors +
        assignment.assigned_sia +
        assignment.assigned_stewards;
      const totalActual =
        (assignment.actual_managers || 0) +
        (assignment.actual_supervisors || 0) +
        (assignment.actual_sia || 0) +
        (assignment.actual_stewards || 0);
      return totalAssigned > 0 ? (totalActual / totalAssigned) * 100 : 0;
    });
    
    const avgAttendanceRate =
      attendanceRates.length > 0
        ? attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length
        : 0; // Default to 0 if no history, or maybe neutral 80? Let's keep 0 for now as 'unproven'

    // Performance Score (0-100)
    // If no history, give a base score for approved providers
    const hasHistory = totalOffers > 0;
    const performanceScore = hasHistory 
      ? (acceptanceRate * 0.4 + avgAttendanceRate * 0.6) 
      : 70; // Base score for new providers

    // 2. Calculate Distance Score
    let distanceScore = 0;
    let distanceText = 'Unknown location';
    let distanceMiles = 0;

    if (provider.address && event.location) {
      const distResult = await calculateDistance(provider.address, event.location);
      distanceMiles = distResult.distanceMiles;
      distanceText = distResult.formattedDistance;
      
      // Score: 100 if close, 0 if > maxDistance
      if (distResult.source === 'geocoded') {
        distanceScore = Math.max(0, 100 - (distanceMiles / opts.maxDistanceMiles) * 100);
      } else {
        distanceScore = 50; // Neutral if unknown
      }
    } else {
        distanceScore = 50; // Neutral if missing data
    }

    // 3. Reliability Score (Attendance consistency + Lazy Booking Pattern)
    // Penalize for cancellations (assignments declined after acceptance - not tracked currently, but let's use declined rate)
    const declined = providerAssignments.filter(a => a.status === 'declined').length;
    let baseReliabilityScore = totalOffers > 0 ? 100 - (declined / totalOffers * 100) : 80;
    
    // Check for lazy booking pattern (late staff uploads)
    // This would ideally check lazy_booking_alerts table, but for now we'll analyze assignments directly
    // If provider has history of accepting early but uploading staff very late, downgrade reliability
    const lateUploadPattern = providerAssignments
      .filter(a => a.status === 'accepted' && a.accepted_at)
      .map(a => {
        // This is a simplified check - in production, we'd query staff_details.created_at
        // For now, we'll assume if they have many accepted assignments but low actual attendance, they might be lazy bookers
        const hasActuals = a.actual_managers !== null;
        const daysAccepted = a.accepted_at ? Math.floor((new Date().getTime() - new Date(a.accepted_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        return { hasActuals, daysAccepted, acceptedAt: a.accepted_at };
      });
    
    // If provider consistently accepts early (>30 days) but has no actuals recorded, potential lazy booker
    const veryEarlyAccepts = lateUploadPattern.filter(p => p.daysAccepted > 30 && !p.hasActuals).length;
    const lazyBookingPenalty = veryEarlyAccepts > 2 ? Math.min(30, veryEarlyAccepts * 10) : 0;
    
    const reliabilityScore = Math.max(0, baseReliabilityScore - lazyBookingPenalty);

    // 4. Capacity Check (Can they handle this event size?)
    const eventSize = 
      event.requirements.managers + 
      event.requirements.supervisors + 
      event.requirements.sia + 
      event.requirements.stewards;
    
    // Check max staff they've provided before
    const maxProvided = completedAssignments.reduce((max, a) => {
        const actual = (a.actual_managers || 0) + (a.actual_supervisors || 0) + (a.actual_sia || 0) + (a.actual_stewards || 0);
        return Math.max(max, actual);
    }, 0);

    let capacityScore = 100;
    if (hasHistory && maxProvided < eventSize * 0.5) {
        capacityScore = 50; // Warning: this event is much bigger than they usually handle
    }

    // Total Weighted Score
    const totalScore = (
      performanceScore * opts.weightPerformance +
      distanceScore * opts.weightDistance +
      reliabilityScore * opts.weightReliability
    );

    // Generate reasoning
    const reasoning: string[] = [];
    if (performanceScore > 80) reasoning.push(`High performance rating (${performanceScore.toFixed(0)}/100)`);
    if (distanceScore > 80) reasoning.push(`Close proximity: ${distanceText}`);
    else if (distanceScore < 20) reasoning.push(`Far distance: ${distanceText}`);
    
    if (avgAttendanceRate > 90) reasoning.push(`Excellent attendance record (${avgAttendanceRate.toFixed(0)}%)`);
    else if (avgAttendanceRate < 70 && hasHistory) reasoning.push(`Low attendance record (${avgAttendanceRate.toFixed(0)}%)`);

    if (capacityScore < 80) reasoning.push(`Note: Event size (${eventSize}) exceeds typical order size`);

    scores.push({
      providerId: provider.id,
      totalScore,
      components: {
        performanceScore,
        distanceScore,
        capacityScore,
        reliabilityScore
      },
      details: {
        distanceText,
        acceptanceRate,
        attendanceRate: avgAttendanceRate,
        totalAssignments: totalOffers
      },
      reasoning
    });
  }

  // Sort by total score descending
  return scores.sort((a, b) => b.totalScore - a.totalScore);
}
