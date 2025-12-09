import { differenceInDays, parseISO, isPast, isValid } from 'date-fns';

export interface SIAValidationResult {
  isValid: boolean;
  isExpired: boolean;
  expiryDate?: Date;
  daysUntilExpiry?: number;
  errors: string[];
}

export function validateSIALicense(siaNumber: string, expiryDateStr?: string): SIAValidationResult {
  const result: SIAValidationResult = {
    isValid: false,
    isExpired: false,
    errors: [],
  };

  // 1. Format Validation (16 digits typically)
  const cleanNumber = siaNumber.replace(/\s/g, '');
  if (!/^\d{16}$/.test(cleanNumber)) {
    result.errors.push('SIA number must be 16 digits');
  }

  // 2. Expiry Validation
  if (expiryDateStr) {
    try {
      const expiry = new Date(expiryDateStr);
      if (isValid(expiry)) {
        result.expiryDate = expiry;
        
        if (isPast(expiry)) {
          result.isExpired = true;
          result.errors.push(`License expired on ${expiry.toLocaleDateString()}`);
        } else {
          result.daysUntilExpiry = differenceInDays(expiry, new Date());
          if (result.daysUntilExpiry < 30) {
            result.errors.push(`License expires soon (${result.daysUntilExpiry} days)`);
          }
        }
      } else {
        result.errors.push('Invalid expiry date format');
      }
    } catch (e) {
      result.errors.push('Invalid expiry date');
    }
  } else {
    // Missing expiry is a warning/error depending on strictness
    // result.errors.push('Expiry date missing'); 
  }

  result.isValid = result.errors.length === 0;
  return result;
}

export function formatSIANumber(number: string): string {
  const clean = number.replace(/\D/g, '');
  return clean.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
}
