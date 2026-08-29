import { describe, it, expect } from 'vitest';
import { paiseToRupees, rupeesToPaise, formatIndianCurrency } from '../amountFormatter';

describe('amountFormatter', () => {
  describe('paiseToRupees', () => {
    it('should convert paise to rupees', () => {
      expect(paiseToRupees(100)).toBe(1.0);
      expect(paiseToRupees(12550)).toBe(125.5);
      expect(paiseToRupees(0)).toBe(0);
    });
  });

  describe('rupeesToPaise', () => {
    it('should convert rupee numbers to paise integers', () => {
      expect(rupeesToPaise(1.25)).toBe(125);
      expect(rupeesToPaise(125.5)).toBe(12550);
      expect(rupeesToPaise('₹1,250.50')).toBe(125050);
      expect(rupeesToPaise(0)).toBe(0);
    });
  });

  describe('formatIndianCurrency', () => {
    it('should format rupees under 1,000 without grouping', () => {
      expect(formatIndianCurrency(50000)).toBe('₹500');
      expect(formatIndianCurrency(99900)).toBe('₹999');
    });

    it('should format rupees with decimals if paise is fractional', () => {
      expect(formatIndianCurrency(125050)).toBe('₹1,250.50');
      expect(formatIndianCurrency(50005)).toBe('₹500.05');
    });

    it('should format rupees utilizing the Indian numbering system grouping (e.g. 1,25,000)', () => {
      expect(formatIndianCurrency(100000)).toBe('₹1,000');
      expect(formatIndianCurrency(1250000)).toBe('₹12,500');
      expect(formatIndianCurrency(10000000)).toBe('₹1,00,000');
      // In Indian system: 
      // 10,000 is grouped as 10,000
      // 1,00,000 is grouped as 1,00,000 (1 Lakh)
      // 10,00,000 is grouped as 10,00,000 (10 Lakhs)
      // 1,00,00,000 is grouped as 1,00,00,000 (1 Crore)
    });

    it('should match features.md examples exactly', () => {
      expect(formatIndianCurrency(50000)).toBe('₹500');
      expect(formatIndianCurrency(125000)).toBe('₹1,250');
      expect(formatIndianCurrency(1000000)).toBe('₹10,000');
      expect(formatIndianCurrency(12500000)).toBe('₹1,25,000');
      expect(formatIndianCurrency(125000000)).toBe('₹12,50,000');
    });

    it('should handle negative numbers', () => {
      expect(formatIndianCurrency(-50000)).toBe('-₹500');
      expect(formatIndianCurrency(-125050)).toBe('-₹1,250.50');
    });
  });
});
