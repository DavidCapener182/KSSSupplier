/**
 * Extract hourly rates from contractor agreement content
 */
export function extractRatesFromAgreement(agreementContent: string): {
  sia: number;
  stewards: number;
  managers: number;
  supervisors: number;
} {
  // Default rates (fallback)
  const defaultRates = {
    sia: 16.00,
    stewards: 14.00,
    managers: 16.00,
    supervisors: 16.00,
  };

  if (!agreementContent) {
    return defaultRates;
  }

  // Extract SIA rate - look for pattern like "£16.00 per hour for SIA"
  const siaMatch = agreementContent.match(/£(\d+\.?\d*)\s+per\s+hour\s+for\s+SIA/i);
  const siaRate = siaMatch ? parseFloat(siaMatch[1]) : defaultRates.sia;

  // Extract Stewards rate - look for pattern like "£14.00 per hour for non-SIA Stewards" or "£14.00 per hour for Stewards"
  const stewardsMatch = agreementContent.match(/£(\d+\.?\d*)\s+per\s+hour\s+for\s+(?:non-?SIA\s+)?[Ss]tewards/i);
  const stewardsRate = stewardsMatch ? parseFloat(stewardsMatch[1]) : defaultRates.stewards;

  // Managers and Supervisors typically use SIA rate (they're usually SIA licensed)
  return {
    sia: siaRate,
    stewards: stewardsRate,
    managers: siaRate, // Managers are typically SIA licensed
    supervisors: siaRate, // Supervisors are typically SIA licensed
  };
}

