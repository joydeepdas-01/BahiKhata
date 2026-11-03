import { describe, it, expect } from 'vitest';
import { 
  calculateBalanceFromTransactions, 
  findDuplicateCustomer, 
  Customer, 
  Transaction 
} from '../customer';
import { normalizePhone } from '../phoneNormalizer';

describe('Customer Domain Logic & Ledger Calculations', () => {
  it('calculates balance correctly from multiple credit and payment transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 't1',
        customerId: 'c1',
        type: 'credit',
        amount: 50000, // ₹500.00
        date: '2026-11-01',
        createdAt: '2026-11-01T10:00:00Z'
      },
      {
        id: 't2',
        customerId: 'c1',
        type: 'credit',
        amount: 25000, // ₹250.00
        date: '2026-11-02',
        createdAt: '2026-11-02T10:00:00Z'
      },
      {
        id: 't3',
        customerId: 'c1',
        type: 'payment',
        amount: 30000, // ₹300.00
        date: '2026-11-03',
        createdAt: '2026-11-03T10:00:00Z'
      }
    ];

    const balance = calculateBalanceFromTransactions(transactions);
    expect(balance).toBe(45000); // 50000 + 25000 - 30000 = 45000 Paise (₹450.00)
  });

  it('correctly reports 0 balance when transactions balance out to zero (fully settled)', () => {
    const transactions: Transaction[] = [
      {
        id: 't1',
        customerId: 'c1',
        type: 'credit',
        amount: 100000, // ₹1,000.00
        date: '2026-11-01',
        createdAt: '2026-11-01T10:00:00Z'
      },
      {
        id: 't2',
        customerId: 'c1',
        type: 'payment',
        amount: 100000, // ₹1,000.00
        date: '2026-11-02',
        createdAt: '2026-11-02T10:00:00Z'
      }
    ];

    expect(calculateBalanceFromTransactions(transactions)).toBe(0);
  });

  it('handles customer advance payments resulting in negative balance', () => {
    const transactions: Transaction[] = [
      {
        id: 't1',
        customerId: 'c1',
        type: 'credit',
        amount: 20000, // ₹200.00
        date: '2026-11-01',
        createdAt: '2026-11-01T10:00:00Z'
      },
      {
        id: 't2',
        customerId: 'c1',
        type: 'payment',
        amount: 50000, // ₹500.00 (Customer overpaid or gave advance)
        date: '2026-11-02',
        createdAt: '2026-11-02T10:00:00Z'
      }
    ];

    expect(calculateBalanceFromTransactions(transactions)).toBe(-30000); // -₹300.00 advance
  });

  it('detects duplicate customer by normalized phone across different input representations', () => {
    const existing: Customer[] = [
      {
        id: 'c1',
        name: 'Amit Kumar',
        phone: '919876543210',
        amount: 10000,
        status: 'pending'
      },
      {
        id: 'c2',
        name: 'Priya Sharma',
        phone: '919123456789',
        amount: 0,
        status: 'paid'
      }
    ];

    // Normalized lookup
    expect(findDuplicateCustomer(existing, '919876543210')?.name).toBe('Amit Kumar');

    // From raw input "+91 98765-43210"
    const input1 = normalizePhone('+91 98765-43210');
    expect(input1.isValid).toBe(true);
    expect(findDuplicateCustomer(existing, input1.normalized!)?.id).toBe('c1');

    // From raw input "09876543210"
    const input2 = normalizePhone('09876543210');
    expect(input2.isValid).toBe(true);
    expect(findDuplicateCustomer(existing, input2.normalized!)?.id).toBe('c1');

    // Exclude self during profile edit
    expect(findDuplicateCustomer(existing, '919876543210', 'c1')).toBeUndefined();

    // Not a duplicate
    expect(findDuplicateCustomer(existing, '919999999999')).toBeUndefined();
  });
});
