import { describe, it, expect } from 'vitest';
import { parseTSV } from '../tsvHelper';

describe('tsvHelper', () => {
  it('should parse tab-separated values with headers', () => {
    const tsvData = `
Name\tMobile\tDues\tDue Date\tRemarks
Rahul Sharma\t9876543210\t1250.50\t2026-08-25\tShirt tailoring
Amit Kumar\t9999988888\t500\t2026-09-01\tTrousers
    `.trim();

    const result = parseTSV(tsvData);
    expect(result.length).toBe(2);
    expect(result[0].isValid).toBe(true);
    expect(result[0].name).toBe('Rahul Sharma');
    expect(result[0].phone).toBe('9876543210');
    expect(result[0].amount).toBe('1250.50');
    expect(result[0].dueDate).toBe('2026-08-25');
    expect(result[0].note).toBe('Shirt tailoring');
  });

  it('should auto-detect columns based on cell heuristics if headers are missing', () => {
    const tsvData = `
Rahul Sharma\t9876543210\t1250.50\t2026-08-25\tShirt tailoring
Amit Kumar\t9999988888\t500\t2026-09-01\tTrousers
    `.trim();

    const result = parseTSV(tsvData);
    expect(result.length).toBe(2);
    expect(result[0].isValid).toBe(true);
    expect(result[0].name).toBe('Rahul Sharma');
    expect(result[0].phone).toBe('9876543210');
    expect(result[0].amount).toBe('1250.50');
    expect(result[0].dueDate).toBe('2026-08-25');
  });

  it('should identify errors for invalid entries and return warnings', () => {
    const tsvData = `
Rahul Sharma\t12345\t1250.50\t2026-08-25\tShirt tailoring
Amit Kumar\t9999988888\t-500\t2026-09-01\tTrousers
Suresh Singh\t9999988888\t500\tinvalid-date\tTrousers
    `.trim();

    const result = parseTSV(tsvData);
    expect(result.length).toBe(3);
    expect(result[0].isValid).toBe(false);
    expect(result[0].errors).toContain('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)');
    
    expect(result[1].isValid).toBe(false);
    expect(result[1].errors).toContain('Amount must be a positive number');

    expect(result[2].isValid).toBe(false);
    expect(result[2].errors).toContain('Invalid due date format (use YYYY-MM-DD)');
  });
});
