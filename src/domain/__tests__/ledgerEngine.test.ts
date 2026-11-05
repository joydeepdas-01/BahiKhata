import { describe, it, expect } from 'vitest';
import {
  calculateCustomerLedger,
  previewTransactionEffect,
  LedgerTransaction,
  normalizeTransactionType
} from '../ledgerEngine';

describe('Advanced Financial Ledger Engine — Real-World Financial Scenarios', () => {
  const customerId = 'cust_101';

  // Helper to construct test transactions easily
  function createTx(
    partial: Partial<LedgerTransaction> & { type: LedgerTransaction['type']; amount: number }
  ): LedgerTransaction {
    return {
      id: partial.id || 'tx_' + Math.random().toString(36).substring(2, 9),
      customerId,
      date: partial.date || '2026-11-01',
      createdAt: partial.createdAt || '2026-11-01T10:00:00.000Z',
      ...partial
    };
  }

  it('Scenario 1 — Single credit: Customer receives ₹5,000 credit (500000 paise)', () => {
    const transactions = [
      createTx({
        id: 'c1',
        type: 'credit_given',
        amount: 500000, // ₹5,000.00
        date: '2026-11-01'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(500000);
    expect(ledger.payablePaise).toBe(0);
    expect(ledger.netPaise).toBe(500000);
    expect(ledger.customerAdvancePaise).toBe(0);
    expect(ledger.outstandingReceivables.length).toBe(1);
    expect(ledger.outstandingReceivables[0].remainingAmountPaise).toBe(500000);
    expect(ledger.outstandingReceivables[0].status).toBe('unsettled');
  });

  it('Scenario 2 — Partial settlement: Customer owes ₹5,000 and pays ₹2,000', () => {
    const transactions = [
      createTx({
        id: 'c1',
        type: 'credit_given',
        amount: 500000, // ₹5,000.00
        date: '2026-11-01'
      }),
      createTx({
        id: 'p1',
        type: 'payment_received',
        amount: 200000, // ₹2,000.00
        date: '2026-11-02'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(300000); // ₹3,000.00 remaining
    expect(ledger.payablePaise).toBe(0);
    expect(ledger.netPaise).toBe(300000);
    expect(ledger.customerAdvancePaise).toBe(0);
    expect(ledger.outstandingReceivables[0].remainingAmountPaise).toBe(300000);
    expect(ledger.outstandingReceivables[0].settledAmountPaise).toBe(200000);
    expect(ledger.outstandingReceivables[0].status).toBe('partially_settled');
  });

  it('Scenario 3 — Complete settlement: Customer pays the remaining ₹3,000', () => {
    const transactions = [
      createTx({
        id: 'c1',
        type: 'credit_given',
        amount: 500000,
        date: '2026-11-01'
      }),
      createTx({
        id: 'p1',
        type: 'payment_received',
        amount: 200000,
        date: '2026-11-02'
      }),
      createTx({
        id: 'p2',
        type: 'payment_received',
        amount: 300000, // Remaining ₹3,000.00
        date: '2026-11-05'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(0);
    expect(ledger.payablePaise).toBe(0);
    expect(ledger.netPaise).toBe(0);
    expect(ledger.customerAdvancePaise).toBe(0);
    expect(ledger.outstandingReceivables.length).toBe(0);
    expect(ledger.settledDebts.length).toBe(1);
    expect(ledger.settledDebts[0].remainingAmountPaise).toBe(0);
    expect(ledger.settledDebts[0].status).toBe('fully_settled');
  });

  it('Scenario 4 — Additional credit: Customer owes ₹3,000 and receives another ₹2,000 credit', () => {
    const transactions = [
      createTx({
        id: 'c1',
        type: 'credit_given',
        amount: 300000, // ₹3,000.00
        date: '2026-11-01'
      }),
      createTx({
        id: 'c2',
        type: 'credit_given',
        amount: 200000, // ₹2,000.00
        date: '2026-11-03'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(500000); // ₹5,000.00 total
    expect(ledger.outstandingReceivables.length).toBe(2);
    expect(ledger.outstandingReceivables[0].remainingAmountPaise).toBe(300000);
    expect(ledger.outstandingReceivables[1].remainingAmountPaise).toBe(200000);
  });

  it('Scenario 5 — Multiple installments: ₹10,000 debt settled through ₹1,000, ₹2,000, ₹3,000, and ₹4,000', () => {
    const transactions = [
      createTx({
        id: 'c_big',
        type: 'credit_given',
        amount: 1000000, // ₹10,000.00
        date: '2026-11-01'
      }),
      createTx({ id: 'p1', type: 'payment_received', amount: 100000, date: '2026-11-02' }),
      createTx({ id: 'p2', type: 'payment_received', amount: 200000, date: '2026-11-05' }),
      createTx({ id: 'p3', type: 'payment_received', amount: 300000, date: '2026-11-12' }),
      createTx({ id: 'p4', type: 'payment_received', amount: 400000, date: '2026-11-20' })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(0);
    expect(ledger.settledDebts.length).toBe(1);
    expect(ledger.settledDebts[0].settledAmountPaise).toBe(1000000);
    expect(ledger.settledDebts[0].allocations.length).toBe(4);
    expect(ledger.settledDebts[0].allocations[0].allocatedPaise).toBe(100000);
    expect(ledger.settledDebts[0].allocations[1].allocatedPaise).toBe(200000);
    expect(ledger.settledDebts[0].allocations[2].allocatedPaise).toBe(300000);
    expect(ledger.settledDebts[0].allocations[3].allocatedPaise).toBe(400000);
  });

  it('Scenario 6 — Payable: I owe a supplier ₹8,000 and pay ₹3,000', () => {
    const transactions = [
      createTx({
        id: 'd1',
        type: 'debt_incurred',
        amount: 800000, // ₹8,000.00
        date: '2026-11-01'
      }),
      createTx({
        id: 'pm1',
        type: 'payment_made',
        amount: 300000, // ₹3,000.00
        date: '2026-11-04'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.payablePaise).toBe(500000); // ₹5,000.00 remaining payable
    expect(ledger.receivablePaise).toBe(0);
    expect(ledger.netPaise).toBe(-500000);
    expect(ledger.outstandingPayables.length).toBe(1);
    expect(ledger.outstandingPayables[0].remainingAmountPaise).toBe(500000);
    expect(ledger.outstandingPayables[0].settledAmountPaise).toBe(300000);
  });

  it('Scenario 7 — Both directions: Rahul owes me ₹5,000, and I owe Rahul ₹2,000', () => {
    const transactions = [
      createTx({
        id: 'c1',
        type: 'credit_given',
        amount: 500000, // ₹5,000.00
        date: '2026-11-01'
      }),
      createTx({
        id: 'd1',
        type: 'debt_incurred',
        amount: 200000, // ₹2,000.00
        date: '2026-11-02'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(500000); // ₹5,000
    expect(ledger.payablePaise).toBe(200000);   // ₹2,000
    expect(ledger.netPaise).toBe(300000);       // Net ₹3,000 receivable
    expect(ledger.outstandingReceivables.length).toBe(1);
    expect(ledger.outstandingPayables.length).toBe(1);
  });

  it('Scenario 8 — Overpayment: Customer owes ₹3,000 and pays ₹4,000 (Advance creation)', () => {
    const transactions = [
      createTx({
        id: 'c1',
        type: 'credit_given',
        amount: 300000, // ₹3,000.00
        date: '2026-11-01'
      }),
      createTx({
        id: 'p1',
        type: 'payment_received',
        amount: 400000, // ₹4,000.00 (₹1,000 overpayment)
        date: '2026-11-02'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(0); // Debt fully settled
    expect(ledger.customerAdvancePaise).toBe(100000); // ₹1,000 advance
    expect(ledger.settledDebts.length).toBe(1);
    expect(ledger.settledDebts[0].status).toBe('fully_settled');
  });

  it('Scenario 9 — Multiple debt allocation: Debts of ₹2,000, ₹3,000, and ₹5,000. Payment of ₹4,000 allocated to first two debts', () => {
    const transactions = [
      createTx({ id: 'dA', type: 'credit_given', amount: 200000, date: '2026-11-01' }),
      createTx({ id: 'dB', type: 'credit_given', amount: 300000, date: '2026-11-02' }),
      createTx({ id: 'dC', type: 'credit_given', amount: 500000, date: '2026-11-03' }),
      createTx({
        id: 'p1',
        type: 'payment_received',
        amount: 400000,
        date: '2026-11-04',
        allocations: [
          { targetTransactionId: 'dA', allocatedPaise: 200000 },
          { targetTransactionId: 'dB', allocatedPaise: 200000 }
        ]
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(600000); // 100000 (dB) + 500000 (dC) = 600000
    expect(ledger.settledDebts.length).toBe(1);
    expect(ledger.settledDebts[0].transactionId).toBe('dA');
    expect(ledger.settledDebts[0].remainingAmountPaise).toBe(0);

    const openB = ledger.outstandingReceivables.find(d => d.transactionId === 'dB');
    const openC = ledger.outstandingReceivables.find(d => d.transactionId === 'dC');

    expect(openB?.remainingAmountPaise).toBe(100000); // ₹1,000 remaining
    expect(openB?.status).toBe('partially_settled');
    expect(openC?.remainingAmountPaise).toBe(500000); // ₹5,000 remaining
    expect(openC?.status).toBe('unsettled');
  });

  it('Scenario 10 — Reversal: A ₹2,000 credit entry is reversed', () => {
    const transactions = [
      createTx({
        id: 'c_original',
        type: 'credit_given',
        amount: 200000,
        date: '2026-11-01'
      }),
      createTx({
        id: 'rev_1',
        type: 'reversal',
        amount: 200000,
        date: '2026-11-02',
        reversalOfId: 'c_original'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(0);
    expect(ledger.outstandingReceivables.length).toBe(0);
  });

  it('Scenario 11 — Mutual adjustment: Explicitly offset ₹2,000 between Receivable ₹5,000 and Payable ₹2,000', () => {
    const transactions = [
      createTx({ id: 'c1', type: 'credit_given', amount: 500000, date: '2026-11-01' }),
      createTx({ id: 'd1', type: 'debt_incurred', amount: 200000, date: '2026-11-02' }),
      createTx({
        id: 'adj_1',
        type: 'mutual_adjustment',
        amount: 200000, // Offset ₹2,000
        date: '2026-11-03'
      })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.receivablePaise).toBe(300000); // 5000 - 2000 = ₹3,000
    expect(ledger.payablePaise).toBe(0);        // 2000 - 2000 = ₹0 (settled)
    expect(ledger.netPaise).toBe(300000);
    expect(ledger.totalMutualAdjustmentsPaise).toBe(200000);
  });

  it('Scenario 12 — Advance consumed: Customer gives ₹1,000 advance, later buys ₹2,500 goods on credit', () => {
    const transactions = [
      createTx({ id: 'adv1', type: 'advance_received', amount: 100000, date: '2026-11-01' }),
      createTx({ id: 'c1', type: 'credit_given', amount: 250000, date: '2026-11-03' })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);

    expect(ledger.customerAdvancePaise).toBe(0);     // ₹1,000 advance used
    expect(ledger.receivablePaise).toBe(150000);    // ₹1,500 remaining due
    expect(ledger.outstandingReceivables[0].settledAmountPaise).toBe(100000);
    expect(ledger.outstandingReceivables[0].remainingAmountPaise).toBe(150000);
  });

  it('Scenario 13 — Preview transaction effect correctly calculates before and after', () => {
    const transactions = [
      createTx({ id: 'c1', type: 'credit_given', amount: 800000, date: '2026-11-01' })
    ];
    const ledger = calculateCustomerLedger(customerId, transactions);

    // Preview payment of ₹3,000
    const preview = previewTransactionEffect(ledger, 'payment_received', 300000);

    expect(preview.currentOutstandingPaise).toBe(800000);
    expect(preview.newOutstandingPaise).toBe(500000);
    expect(preview.advancePaiseResult).toBe(0);
    expect(preview.allocationsPreview[0].allocatedPaise).toBe(300000);
  });

  it('Scenario 14 — Legacy type compatibility: correctly maps legacy "credit" and "payment"', () => {
    expect(normalizeTransactionType('credit')).toBe('credit_given');
    expect(normalizeTransactionType('payment')).toBe('payment_received');

    const legacyTransactions = [
      { id: 't1', customerId, type: 'credit', amount: 40000, date: '2026-11-01', createdAt: '2026-11-01T10:00:00Z' },
      { id: 't2', customerId, type: 'payment', amount: 15000, date: '2026-11-02', createdAt: '2026-11-02T10:00:00Z' }
    ];

    const ledger = calculateCustomerLedger(customerId, legacyTransactions);
    expect(ledger.receivablePaise).toBe(25000); // 40000 - 15000 = 25000 paise (₹250.00)
    expect(ledger.payablePaise).toBe(0);
  });

  it('Scenario 15 — Large volume and multi-crore balance integrity', () => {
    const transactions = [
      createTx({ id: 'c_crore', type: 'credit_given', amount: 1000000000, date: '2026-11-01' }), // ₹1,00,00,000 (1 Crore)
      createTx({ id: 'p_half', type: 'payment_received', amount: 450000000, date: '2026-11-02' }) // ₹45,00,000
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);
    expect(ledger.receivablePaise).toBe(550000000); // ₹55,00,000 exactly
    expect(ledger.payablePaise).toBe(0);
  });

  it('Scenario 16 — Decimal paise arithmetic integrity (₹100.50 + ₹200.75 - ₹150.25)', () => {
    const transactions = [
      createTx({ id: 'd1', type: 'credit_given', amount: 10050, date: '2026-11-01' }), // ₹100.50
      createTx({ id: 'd2', type: 'credit_given', amount: 20075, date: '2026-11-02' }), // ₹200.75
      createTx({ id: 'p1', type: 'payment_received', amount: 15025, date: '2026-11-03' }) // ₹150.25
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);
    // 10050 + 20075 - 15025 = 15100 paise (₹151.00)
    expect(ledger.receivablePaise).toBe(15100);
    expect(ledger.payablePaise).toBe(0);
  });

  it('Scenario 17 — Customer advance refund: Advance ₹2,000, Refund ₹800', () => {
    const transactions = [
      createTx({ id: 'adv1', type: 'advance_received', amount: 200000, date: '2026-11-01' }),
      createTx({ id: 'ref1', type: 'refund_given', amount: 80000, date: '2026-11-02' })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);
    expect(ledger.customerAdvancePaise).toBe(120000); // ₹1,200 remaining advance
    expect(ledger.totalRefundsGivenPaise).toBe(80000);
  });

  it('Scenario 18 — Supplier advance and refund: Paid ₹5,000 advance to supplier, refunded ₹1,500', () => {
    const transactions = [
      createTx({ id: 's_adv', type: 'advance_paid', amount: 500000, date: '2026-11-01' }),
      createTx({ id: 's_ref', type: 'refund_received', amount: 150000, date: '2026-11-02' })
    ];

    const ledger = calculateCustomerLedger(customerId, transactions);
    expect(ledger.supplierAdvancePaise).toBe(350000); // ₹3,500 remaining supplier advance
    expect(ledger.totalRefundsReceivedPaise).toBe(150000);
  });
});
