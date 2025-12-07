import type { Assignment, StaffTimes } from './types';
import { extractRatesFromAgreement } from './rate-extractor';

/**
 * Calculate the total invoice amount (including VAT) from staff times
 */
export function calculateInvoiceAmount(
  assignment: Assignment,
  staffTimes: StaffTimes[],
  agreementContent?: string
): number {
  // Extract hourly rates from agreement content, or use defaults
  const extractedRates = agreementContent 
    ? extractRatesFromAgreement(agreementContent)
    : {
        sia: 16.00,
        stewards: 14.00,
        managers: 16.00,
        supervisors: 16.00,
      };
  
  const hourlyRates: Record<string, number> = {
    'sia': extractedRates.sia,
    'stewards': extractedRates.stewards,
    'managers': extractedRates.managers,
    'supervisors': extractedRates.supervisors,
  };

  let grandTotal = 0;

  if (staffTimes.length === 0) {
    // If no staff times, calculate based on assigned staff with default 8 hours
    const roles = [
      { type: 'managers', count: assignment.assigned_managers },
      { type: 'supervisors', count: assignment.assigned_supervisors },
      { type: 'sia', count: assignment.assigned_sia },
      { type: 'stewards', count: assignment.assigned_stewards },
    ];

    roles.forEach((role) => {
      if (role.count > 0) {
        const rate = hourlyRates[role.type] || 14.00;
        const hours = 8; // Default 8 hours if no times specified
        const total = role.count * hours * rate;
        grandTotal += total;
      }
    });
  } else {
    // Calculate based on actual staff times
    staffTimes.forEach((time) => {
      const startTime = new Date(`2000-01-01T${time.start_time}`);
      let endTime = new Date(`2000-01-01T${time.end_time}`);
      // Handle overnight shifts
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const rate = hourlyRates[time.role_type] || 14.00;
      const total = time.staff_count * hours * rate;
      grandTotal += total;
    });
  }

  // Add VAT (20%)
  const vat = grandTotal * 0.2;
  const totalWithVat = grandTotal + vat;

  return totalWithVat;
}

