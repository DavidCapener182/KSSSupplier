import { Assignment, Event } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';

export interface LazyBookingAnalysis {
  riskScore: number; // 0-100
  patternDescription: string;
  isHighRisk: boolean;
  averageDaysBeforeEventUpload: number;
  lateUploadCount: number;
  totalAnalysed: number;
}

export function detectLazyBookingPattern(
  assignments: (Assignment & { event?: Event; staff_details?: any[] })[]
): LazyBookingAnalysis {
  let totalAnalysed = 0;
  let lateUploadCount = 0; // Uploaded < 3 days before event
  let veryLateUploadCount = 0; // Uploaded < 24h before event
  let totalDaysBefore = 0;
  let hasData = false;

  for (const assignment of assignments) {
    // Only analyze accepted assignments with staff details and valid dates
    if (
      assignment.status === 'accepted' &&
      assignment.staff_details &&
      assignment.staff_details.length > 0 &&
      assignment.accepted_at &&
      assignment.event?.date
    ) {
      const eventDate = parseISO(assignment.event.date);
      const acceptedDate = parseISO(assignment.accepted_at);
      
      // Find the first staff upload date
      const staffUploads = assignment.staff_details
        .map((sd: any) => new Date(sd.created_at))
        .sort((a: any, b: any) => a - b);
      
      if (staffUploads.length > 0) {
        const firstUploadDate = staffUploads[0];
        
        // Check if accepted early (> 30 days before event)
        const daysAcceptedBeforeEvent = differenceInDays(eventDate, acceptedDate);
        
        if (daysAcceptedBeforeEvent > 30) {
          totalAnalysed++;
          hasData = true;

          const daysUploadBeforeEvent = differenceInDays(eventDate, firstUploadDate);
          totalDaysBefore += daysUploadBeforeEvent;

          if (daysUploadBeforeEvent < 3) {
            lateUploadCount++;
          }
          if (daysUploadBeforeEvent < 1) {
            veryLateUploadCount++;
          }
        }
      }
    }
  }

  if (!hasData) {
    return {
      riskScore: 0,
      patternDescription: "Insufficient data to analyze booking patterns.",
      isHighRisk: false,
      averageDaysBeforeEventUpload: 0,
      lateUploadCount: 0,
      totalAnalysed: 0
    };
  }

  const averageDaysBeforeEventUpload = totalDaysBefore / totalAnalysed;
  const lateRate = lateUploadCount / totalAnalysed;
  
  // Calculate Risk Score
  // Base score 0. If late rate is high, score goes up.
  let riskScore = Math.round(lateRate * 100);
  
  // Boost score if very late uploads exist
  if (veryLateUploadCount > 0) {
    riskScore = Math.min(100, riskScore + (veryLateUploadCount * 10));
  }

  let patternDescription = "Normal booking behavior.";
  if (riskScore > 70) {
    patternDescription = "CRITICAL: Consistently uploads staff details < 24h before event despite early acceptance.";
  } else if (riskScore > 40) {
    patternDescription = "WARNING: Frequently uploads staff details late (< 3 days before event).";
  }

  return {
    riskScore,
    patternDescription,
    isHighRisk: riskScore > 50,
    averageDaysBeforeEventUpload,
    lateUploadCount,
    totalAnalysed
  };
}



