export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode: string;
  notes?: string;
}

export interface CheckoutFormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Normalizes digits from phone number input, stripping country code prefix if present.
 */
export function extractPhoneDigits(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');

  // If starts with 91 and has 12 digits (e.g. +91 9876543210 -> 9876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // If starts with 0 and has 11 digits (e.g. 09876543210 -> 9876543210)
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits;
}

/**
 * Sanitizes phone input in real-time as user types (caps to 10 digits)
 */
export function cleanPhoneNumber(raw: string): string {
  const digits = extractPhoneDigits(raw);
  return digits.slice(0, 10);
}

/**
 * Validates Indian 10-digit mobile number
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      error: 'Phone number is required for delivery confirmation call',
    };
  }

  // Check for invalid letters/symbols
  if (/[a-zA-Z]/.test(phone)) {
    return {
      isValid: false,
      error: 'Phone number cannot contain letters',
    };
  }

  const digits = extractPhoneDigits(phone);

  if (digits.length < 10) {
    return {
      isValid: false,
      error: `Phone number must be exactly 10 digits (currently ${digits.length})`,
    };
  }

  if (digits.length > 10) {
    return {
      isValid: false,
      error: `Phone number cannot exceed 10 digits (currently ${digits.length})`,
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validates customer full name
 */
export function validateFullName(name: string): ValidationResult {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Full name is required',
    };
  }
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Name must be at least 2 characters',
    };
  }
  return { isValid: true, error: null };
}

/**
 * Real-time input sanitizer for PIN code (caps to 6 numeric digits)
 */
export function cleanPincode(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(0, 6);
}

/**
 * Validates Indian 6-digit postal PIN code
 */
export function validatePincode(pincode: string): ValidationResult {
  const raw = (pincode || '').trim();
  if (!raw) {
    return {
      isValid: false,
      error: 'PIN code is required for delivery',
    };
  }

  if (/[a-zA-Z]/.test(raw)) {
    return {
      isValid: false,
      error: 'PIN code cannot contain letters',
    };
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 6 || raw !== digits) {
    return {
      isValid: false,
      error: `PIN code must be exactly 6 digits (currently ${digits.length})`,
    };
  }

  if (!/^[1-9]\d{5}$/.test(digits)) {
    return {
      isValid: false,
      error: 'PIN code must start with digits 1-9',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validates email address (mandatory for order confirmation and invoice receipts)
 */
export function validateEmail(email?: string): ValidationResult {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Email address is required for order confirmation and receipts',
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g. name@example.com)',
    };
  }
  return { isValid: true, error: null };
}

/**
 * Validates street address
 */
export function validateAddress(address: string): ValidationResult {
  const trimmed = (address || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Delivery address is required',
    };
  }
  if (trimmed.length < 10) {
    return {
      isValid: false,
      error: 'Please enter a complete address with door no. and street (min 10 characters)',
    };
  }
  return { isValid: true, error: null };
}

/**
 * Validates city or region
 */
export function validateCity(city: string): ValidationResult {
  if (!(city || '').trim()) {
    return {
      isValid: false,
      error: 'City or region is required',
    };
  }
  return { isValid: true, error: null };
}

/**
 * Comprehensive checkout form validator
 */
export function validateCheckoutForm(data: CheckoutFormData): CheckoutFormValidation {
  const errors: Record<string, string> = {};

  const nameVal = validateFullName(data.fullName);
  if (!nameVal.isValid && nameVal.error) errors.fullName = nameVal.error;

  const phoneVal = validatePhoneNumber(data.phone);
  if (!phoneVal.isValid && phoneVal.error) errors.phone = phoneVal.error;

  const emailVal = validateEmail(data.email);
  if (!emailVal.isValid && emailVal.error) errors.email = emailVal.error;

  const addressVal = validateAddress(data.address);
  if (!addressVal.isValid && addressVal.error) errors.address = addressVal.error;

  const cityVal = validateCity(data.city);
  if (!cityVal.isValid && cityVal.error) errors.city = cityVal.error;

  const pinVal = validatePincode(data.pincode);
  if (!pinVal.isValid && pinVal.error) errors.pincode = pinVal.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
