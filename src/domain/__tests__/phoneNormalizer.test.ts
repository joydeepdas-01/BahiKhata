import { describe, it, expect } from 'vitest';
import { normalizePhone } from '../phoneNormalizer';

describe('phoneNormalizer', () => {
  it('should normalize a standard 10-digit Indian mobile number', () => {
    const result = normalizePhone('9876543210');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe('919876543210');
    expect(result.formatted).toBe('+91 98765 43210');
  });

  it('should handle mobile numbers starting with +91', () => {
    const result = normalizePhone('+919876543210');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe('919876543210');
  });

  it('should handle mobile numbers starting with 91 and no plus', () => {
    const result = normalizePhone('919876543210');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe('919876543210');
  });

  it('should handle mobile numbers starting with 0', () => {
    const result = normalizePhone('09876543210');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe('919876543210');
  });

  it('should handle spaces, hyphens, and brackets in formatting input', () => {
    const result = normalizePhone('+91 (98765) 43-210');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe('919876543210');
  });

  it('should reject numbers that do not have 10 digits after removing country code', () => {
    const result = normalizePhone('987654321');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('10-digit');
  });

  it('should reject numbers that do not start with 6, 7, 8, or 9', () => {
    const result = normalizePhone('5876543210');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('starting with 6, 7, 8, or 9');
  });

  it('should reject empty or whitespace inputs', () => {
    const result = normalizePhone('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Phone number cannot be empty');
  });
});
