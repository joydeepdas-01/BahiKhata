export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string; // e.g. "919876543210" for wa.me
  formatted?: string;  // e.g. "+91 98765 43210" for UI display
  error?: string;
}

export function normalizePhone(input: string): PhoneValidationResult {
  if (!input || !input.trim()) {
    return { isValid: false, error: 'Phone number cannot be empty' };
  }

  // Strip all non-digit characters
  const digits = input.replace(/\D/g, '');

  let mainNumber = digits;

  // Check if it starts with 91 (with or without leading +)
  if (digits.length === 12 && digits.startsWith('91')) {
    mainNumber = digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // Handle standard leading 0
    mainNumber = digits.substring(1);
  }

  // Validate Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(mainNumber)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)'
    };
  }

  return {
    isValid: true,
    normalized: `91${mainNumber}`,
    formatted: `+91 ${mainNumber.substring(0, 5)} ${mainNumber.substring(5)}`
  };
}
