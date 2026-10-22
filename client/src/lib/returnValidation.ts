export const RETURN_REASONS = [
  'Defective / Not Turning On',
  'Damaged in Transit / Broken',
  'Missing Parts / Accessories',
  'Incorrect Item Received',
  'Performance Mismatch',
  'Other (describe below)',
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

export interface ReturnFormInput {
  reason: string;
  faultDetails: string;
  agreedToPolicy: boolean;
}

export interface ReturnValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Checks if a delivered order is still within the 7-day Sri Ram & Co store replacement window.
 * Accepts optional referenceNow timestamp for deterministic testing.
 */
export function isEligibleForReturn(deliveredAtIso?: string | null, referenceNow: number = Date.now()): boolean {
  if (!deliveredAtIso) return false;
  const deliveredTime = new Date(deliveredAtIso).getTime();
  if (isNaN(deliveredTime)) return false;

  const returnWindowMs = 7 * 24 * 60 * 60 * 1000;
  // Allow a 60-second buffer to absorb network latency and clock jitter
  return (referenceNow - deliveredTime) <= (returnWindowMs + 60 * 1000);
}

/**
 * Validates customer input prior to initiating reverse logistics request.
 */
export function validateReturnSubmission(input: ReturnFormInput): ReturnValidationResult {
  const errors: Record<string, string> = {};

  if (!input.reason || !input.reason.trim()) {
    errors.reason = 'Please select a reason for returning the item.';
  } else if (!RETURN_REASONS.includes(input.reason as any)) {
    errors.reason = 'Please select a reason from the approved options list.';
  }

  const cleanDetails = (input.faultDetails || '').trim();
  if (!cleanDetails) {
    errors.faultDetails = 'Please provide details about the fault or issue.';
  } else if (cleanDetails.length < 5) {
    errors.faultDetails = 'Fault details must be at least 5 characters to help our inspection team.';
  }

  if (input.agreedToPolicy !== true) {
    errors.agreedToPolicy = 'You must agree to the Terms, Return Policy, and Refund Policy to proceed.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
