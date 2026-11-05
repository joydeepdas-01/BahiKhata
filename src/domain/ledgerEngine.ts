/**
 * BahiKhata Advanced Financial Ledger Engine
 * 
 * Strict integer-paise accounting engine supporting:
 * - Independent Accounts Receivable (Money owed to me)
 * - Independent Accounts Payable (Money I owe to others)
 * - Customer Advances & Supplier Advances (Overpayments & pre-payments)
 * - Flexible Installment tracking & Settlement allocations (FIFO & specific debt matching)
 * - Mutual settlements (Bilateral offsetting)
 * - Traceable Reversals & Audit History
 * - Legacy schema migration & compatibility
 */

export type LedgerDirection = 'receivable' | 'payable';

export type FinancialTransactionType =
  // Receivable direction (Customer account)
  | 'credit_given'       // Credit sale / Udhaar Diya -> increases receivable
  | 'payment_received'   // Debt payment received / Jama -> decreases receivable (overpayment becomes advance)
  | 'advance_received'   // Customer advance received -> increases customer advance
  | 'refund_given'       // Refund given from customer advance -> decreases customer advance
  // Payable direction (Supplier / Creditor account)
  | 'debt_incurred'      // Purchase on credit / Udhaar Liya -> increases payable
  | 'payment_made'       // Debt payment made / Bhugtan -> decreases payable (overpayment becomes advance)
  | 'advance_paid'       // Supplier advance paid -> increases supplier advance
  | 'refund_received'    // Refund received from supplier advance -> decreases supplier advance
  // Bilateral & Correction
  | 'mutual_adjustment'  // Bilateral offset reducing both receivable and payable
  | 'reversal';          // Traceable correction inverting a prior transaction

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

export interface PaymentAllocation {
  targetTransactionId: string; // The debt/credit transaction ID being settled
  allocatedPaise: number;      // Amount allocated in paise (strictly > 0)
}

export interface LedgerTransaction {
  id: string;
  customerId: string;
  type: FinancialTransactionType;
  amount: number;              // Strictly positive integer in Paise (₹1 = 100 paise)
  date: string;                // ISO Date YYYY-MM-DD
  createdAt: string;           // ISO 8601 Timestamp
  updatedAt?: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;    // UPI UTR, Cheque No, Invoice / Bill No
  dueDate?: string | null;     // Due date for credit_given or debt_incurred
  allocations?: PaymentAllocation[]; // Allocations for payments
  reversalOfId?: string;       // References original transaction if type === 'reversal'
  isReversed?: boolean;        // Set to true if this transaction was later reversed
}

export interface OutstandingDebtItem {
  transactionId: string;
  type: 'credit_given' | 'debt_incurred';
  direction: LedgerDirection;
  date: string;
  dueDate?: string | null;
  note?: string;
  originalAmountPaise: number;
  settledAmountPaise: number;
  remainingAmountPaise: number;
  status: 'unsettled' | 'partially_settled' | 'fully_settled';
  allocations: Array<{
    paymentTransactionId: string;
    paymentDate: string;
    allocatedPaise: number;
    paymentMethod?: PaymentMethod;
    referenceNumber?: string;
  }>;
}

export interface CustomerFinancialSummary {
  customerId: string;
  // Primary independent financial positions (all >= 0 in integer paise)
  receivablePaise: number;        // Money customer owes me
  payablePaise: number;           // Money I owe to customer/supplier
  customerAdvancePaise: number;   // Advance money customer deposited with me
  supplierAdvancePaise: number;   // Advance money I paid to supplier
  netPaise: number;               // receivablePaise - payablePaise (> 0 = customer owes me, < 0 = I owe customer)
  
  // Aggregate volume metrics
  totalCreditGivenPaise: number;
  totalPaymentsReceivedPaise: number;
  totalDebtIncurredPaise: number;
  totalPaymentsMadePaise: number;
  totalAdvancesReceivedPaise: number;
  totalAdvancesPaidPaise: number;
  totalMutualAdjustmentsPaise: number;
  totalRefundsGivenPaise: number;
  totalRefundsReceivedPaise: number;

  // Breakdown of debts
  outstandingReceivables: OutstandingDebtItem[]; // Open debts customer owes me
  outstandingPayables: OutstandingDebtItem[];    // Open debts I owe customer
  settledDebts: OutstandingDebtItem[];           // Fully settled past debts
}

/**
 * Normalizes legacy transaction types ('credit', 'payment') to unified types.
 */
export function normalizeTransactionType(type: string): FinancialTransactionType {
  switch (type) {
    case 'credit':
      return 'credit_given';
    case 'payment':
      return 'payment_received';
    case 'credit_given':
    case 'payment_received':
    case 'advance_received':
    case 'refund_given':
    case 'debt_incurred':
    case 'payment_made':
    case 'advance_paid':
    case 'refund_received':
    case 'mutual_adjustment':
    case 'reversal':
      return type as FinancialTransactionType;
    default:
      return 'credit_given';
  }
}

/**
 * Returns human-readable label for a transaction type.
 */
export function getTransactionTypeLabel(type: FinancialTransactionType): {
  label: string;
  category: 'receive' | 'pay' | 'adjustment';
  color: string;
  direction: LedgerDirection | 'neutral';
} {
  switch (type) {
    case 'credit_given':
      return { label: 'Credit Given (Udhaar Diya)', category: 'receive', color: 'text-rose-600 dark:text-rose-400', direction: 'receivable' };
    case 'payment_received':
      return { label: 'Payment Received (Jama Mila)', category: 'receive', color: 'text-emerald-600 dark:text-emerald-400', direction: 'receivable' };
    case 'advance_received':
      return { label: 'Advance Received', category: 'receive', color: 'text-blue-600 dark:text-blue-400', direction: 'receivable' };
    case 'refund_given':
      return { label: 'Advance Refunded to Customer', category: 'receive', color: 'text-amber-600 dark:text-amber-400', direction: 'receivable' };

    case 'debt_incurred':
      return { label: 'Debt Incurred (Udhaar Liya)', category: 'pay', color: 'text-amber-600 dark:text-amber-400', direction: 'payable' };
    case 'payment_made':
      return { label: 'Payment Made (Bhugtan Kiya)', category: 'pay', color: 'text-indigo-600 dark:text-indigo-400', direction: 'payable' };
    case 'advance_paid':
      return { label: 'Advance Paid to Supplier', category: 'pay', color: 'text-cyan-600 dark:text-cyan-400', direction: 'payable' };
    case 'refund_received':
      return { label: 'Supplier Advance Refunded', category: 'pay', color: 'text-teal-600 dark:text-teal-400', direction: 'payable' };

    case 'mutual_adjustment':
      return { label: 'Mutual Adjustment', category: 'adjustment', color: 'text-purple-600 dark:text-purple-400', direction: 'neutral' };
    case 'reversal':
      return { label: 'Transaction Reversed', category: 'adjustment', color: 'text-zinc-500 dark:text-zinc-400', direction: 'neutral' };
  }
}

/**
 * Process a customer's entire transaction ledger in chronological order.
 * Computes exact integer-paise financial balances, debt allocations, installments,
 * advances, and mutual adjustments with mathematical consistency.
 */
export function calculateCustomerLedger(
  customerId: string,
  rawTransactions: Array<LedgerTransaction | any>
): CustomerFinancialSummary {
  // 1. Normalize all transactions
  const normalized: LedgerTransaction[] = rawTransactions.map(t => ({
    ...t,
    type: normalizeTransactionType(t.type),
    amount: Math.round(Number(t.amount) || 0)
  }));

  // 2. Identify reversed transaction IDs
  const reversedTxIds = new Set<string>();
  normalized.forEach(t => {
    if (t.type === 'reversal' && t.reversalOfId) {
      reversedTxIds.add(t.reversalOfId);
    }
    if (t.isReversed) {
      reversedTxIds.add(t.id);
    }
  });

  // 3. Filter out reversed transactions and the reversals themselves for primary calculation,
  // but keep a clean chronological list of effective transactions
  const effectiveTransactions = normalized
    .filter(t => !reversedTxIds.has(t.id) && t.type !== 'reversal')
    .sort((a, b) => {
      const dateCmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCmp !== 0) return dateCmp;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  // Tracking collections
  const receivableDebts: Map<string, OutstandingDebtItem> = new Map();
  const payableDebts: Map<string, OutstandingDebtItem> = new Map();

  let customerAdvancePaise = 0;
  let supplierAdvancePaise = 0;

  // Aggregate counters
  let totalCreditGivenPaise = 0;
  let totalPaymentsReceivedPaise = 0;
  let totalDebtIncurredPaise = 0;
  let totalPaymentsMadePaise = 0;
  let totalAdvancesReceivedPaise = 0;
  let totalAdvancesPaidPaise = 0;
  let totalMutualAdjustmentsPaise = 0;
  let totalRefundsGivenPaise = 0;
  let totalRefundsReceivedPaise = 0;

  // Process transactions chronologically
  for (const tx of effectiveTransactions) {
    const amount = Math.max(0, tx.amount);
    if (amount === 0) continue;

    switch (tx.type) {
      case 'credit_given': {
        totalCreditGivenPaise += amount;
        
        let remaining = amount;
        let settledFromAdvance = 0;

        // If customer already has an advance balance, automatically adjust
        if (customerAdvancePaise > 0) {
          settledFromAdvance = Math.min(customerAdvancePaise, remaining);
          customerAdvancePaise -= settledFromAdvance;
          remaining -= settledFromAdvance;
        }

        const item: OutstandingDebtItem = {
          transactionId: tx.id,
          type: 'credit_given',
          direction: 'receivable',
          date: tx.date,
          dueDate: tx.dueDate,
          note: tx.note,
          originalAmountPaise: amount,
          settledAmountPaise: settledFromAdvance,
          remainingAmountPaise: remaining,
          status: remaining === 0 ? 'fully_settled' : (settledFromAdvance > 0 ? 'partially_settled' : 'unsettled'),
          allocations: settledFromAdvance > 0 ? [{
            paymentTransactionId: 'advance_auto_adjust',
            paymentDate: tx.date,
            allocatedPaise: settledFromAdvance,
            paymentMethod: 'other',
            referenceNumber: 'Adjusted from customer advance'
          }] : []
        };
        receivableDebts.set(tx.id, item);
        break;
      }

      case 'payment_received': {
        totalPaymentsReceivedPaise += amount;
        let remainingPayment = amount;

        // Step A: If explicit allocations are provided, satisfy them first
        if (tx.allocations && tx.allocations.length > 0) {
          for (const alloc of tx.allocations) {
            if (remainingPayment <= 0) break;
            const debt = receivableDebts.get(alloc.targetTransactionId);
            if (debt && debt.remainingAmountPaise > 0) {
              const allocated = Math.min(alloc.allocatedPaise, debt.remainingAmountPaise, remainingPayment);
              if (allocated > 0) {
                debt.settledAmountPaise += allocated;
                debt.remainingAmountPaise -= allocated;
                debt.status = debt.remainingAmountPaise === 0 ? 'fully_settled' : 'partially_settled';
                debt.allocations.push({
                  paymentTransactionId: tx.id,
                  paymentDate: tx.date,
                  allocatedPaise: allocated,
                  paymentMethod: tx.paymentMethod,
                  referenceNumber: tx.referenceNumber
                });
                remainingPayment -= allocated;
              }
            }
          }
        }

        // Step B: If remaining payment exists, allocate using FIFO (Oldest unsettled first)
        if (remainingPayment > 0) {
          for (const debt of receivableDebts.values()) {
            if (remainingPayment <= 0) break;
            if (debt.remainingAmountPaise > 0) {
              const allocated = Math.min(debt.remainingAmountPaise, remainingPayment);
              debt.settledAmountPaise += allocated;
              debt.remainingAmountPaise -= allocated;
              debt.status = debt.remainingAmountPaise === 0 ? 'fully_settled' : 'partially_settled';
              debt.allocations.push({
                paymentTransactionId: tx.id,
                paymentDate: tx.date,
                allocatedPaise: allocated,
                paymentMethod: tx.paymentMethod,
                referenceNumber: tx.referenceNumber
              });
              remainingPayment -= allocated;
            }
          }
        }

        // Step C: Any unallocated payment becomes a Customer Advance
        if (remainingPayment > 0) {
          customerAdvancePaise += remainingPayment;
        }
        break;
      }

      case 'advance_received': {
        totalAdvancesReceivedPaise += amount;
        customerAdvancePaise += amount;
        break;
      }

      case 'refund_given': {
        totalRefundsGivenPaise += amount;
        customerAdvancePaise = Math.max(0, customerAdvancePaise - amount);
        break;
      }

      case 'debt_incurred': {
        totalDebtIncurredPaise += amount;
        let remaining = amount;
        let settledFromAdvance = 0;

        // If we already have a supplier advance balance, automatically adjust
        if (supplierAdvancePaise > 0) {
          settledFromAdvance = Math.min(supplierAdvancePaise, remaining);
          supplierAdvancePaise -= settledFromAdvance;
          remaining -= settledFromAdvance;
        }

        const item: OutstandingDebtItem = {
          transactionId: tx.id,
          type: 'debt_incurred',
          direction: 'payable',
          date: tx.date,
          dueDate: tx.dueDate,
          note: tx.note,
          originalAmountPaise: amount,
          settledAmountPaise: settledFromAdvance,
          remainingAmountPaise: remaining,
          status: remaining === 0 ? 'fully_settled' : (settledFromAdvance > 0 ? 'partially_settled' : 'unsettled'),
          allocations: settledFromAdvance > 0 ? [{
            paymentTransactionId: 'advance_auto_adjust',
            paymentDate: tx.date,
            allocatedPaise: settledFromAdvance,
            paymentMethod: 'other',
            referenceNumber: 'Adjusted from supplier advance'
          }] : []
        };
        payableDebts.set(tx.id, item);
        break;
      }

      case 'payment_made': {
        totalPaymentsMadePaise += amount;
        let remainingPayment = amount;

        // Step A: Explicit allocations
        if (tx.allocations && tx.allocations.length > 0) {
          for (const alloc of tx.allocations) {
            if (remainingPayment <= 0) break;
            const debt = payableDebts.get(alloc.targetTransactionId);
            if (debt && debt.remainingAmountPaise > 0) {
              const allocated = Math.min(alloc.allocatedPaise, debt.remainingAmountPaise, remainingPayment);
              if (allocated > 0) {
                debt.settledAmountPaise += allocated;
                debt.remainingAmountPaise -= allocated;
                debt.status = debt.remainingAmountPaise === 0 ? 'fully_settled' : 'partially_settled';
                debt.allocations.push({
                  paymentTransactionId: tx.id,
                  paymentDate: tx.date,
                  allocatedPaise: allocated,
                  paymentMethod: tx.paymentMethod,
                  referenceNumber: tx.referenceNumber
                });
                remainingPayment -= allocated;
              }
            }
          }
        }

        // Step B: FIFO allocation for payables
        if (remainingPayment > 0) {
          for (const debt of payableDebts.values()) {
            if (remainingPayment <= 0) break;
            if (debt.remainingAmountPaise > 0) {
              const allocated = Math.min(debt.remainingAmountPaise, remainingPayment);
              debt.settledAmountPaise += allocated;
              debt.remainingAmountPaise -= allocated;
              debt.status = debt.remainingAmountPaise === 0 ? 'fully_settled' : 'partially_settled';
              debt.allocations.push({
                paymentTransactionId: tx.id,
                paymentDate: tx.date,
                allocatedPaise: allocated,
                paymentMethod: tx.paymentMethod,
                referenceNumber: tx.referenceNumber
              });
              remainingPayment -= allocated;
            }
          }
        }

        // Step C: Leftover becomes Supplier Advance
        if (remainingPayment > 0) {
          supplierAdvancePaise += remainingPayment;
        }
        break;
      }

      case 'advance_paid': {
        totalAdvancesPaidPaise += amount;
        supplierAdvancePaise += amount;
        break;
      }

      case 'refund_received': {
        totalRefundsReceivedPaise += amount;
        supplierAdvancePaise = Math.max(0, supplierAdvancePaise - amount);
        break;
      }

      case 'mutual_adjustment': {
        totalMutualAdjustmentsPaise += amount;
        
        // Reduce open receivables by amount (FIFO)
        let remRec = amount;
        for (const debt of receivableDebts.values()) {
          if (remRec <= 0) break;
          if (debt.remainingAmountPaise > 0) {
            const allocated = Math.min(debt.remainingAmountPaise, remRec);
            debt.settledAmountPaise += allocated;
            debt.remainingAmountPaise -= allocated;
            debt.status = debt.remainingAmountPaise === 0 ? 'fully_settled' : 'partially_settled';
            debt.allocations.push({
              paymentTransactionId: tx.id,
              paymentDate: tx.date,
              allocatedPaise: allocated,
              paymentMethod: 'other',
              referenceNumber: 'Mutual adjustment offset'
            });
            remRec -= allocated;
          }
        }

        // Reduce open payables by amount (FIFO)
        let remPay = amount;
        for (const debt of payableDebts.values()) {
          if (remPay <= 0) break;
          if (debt.remainingAmountPaise > 0) {
            const allocated = Math.min(debt.remainingAmountPaise, remPay);
            debt.settledAmountPaise += allocated;
            debt.remainingAmountPaise -= allocated;
            debt.status = debt.remainingAmountPaise === 0 ? 'fully_settled' : 'partially_settled';
            debt.allocations.push({
              paymentTransactionId: tx.id,
              paymentDate: tx.date,
              allocatedPaise: allocated,
              paymentMethod: 'other',
              referenceNumber: 'Mutual adjustment offset'
            });
            remPay -= allocated;
          }
        }
        break;
      }
    }
  }

  // Calculate total outstanding balances strictly from remaining amounts
  let receivablePaise = 0;
  const outstandingReceivables: OutstandingDebtItem[] = [];
  const settledDebts: OutstandingDebtItem[] = [];

  for (const debt of receivableDebts.values()) {
    receivablePaise += debt.remainingAmountPaise;
    if (debt.status === 'fully_settled') {
      settledDebts.push(debt);
    } else {
      outstandingReceivables.push(debt);
    }
  }

  let payablePaise = 0;
  const outstandingPayables: OutstandingDebtItem[] = [];

  for (const debt of payableDebts.values()) {
    payablePaise += debt.remainingAmountPaise;
    if (debt.status === 'fully_settled') {
      settledDebts.push(debt);
    } else {
      outstandingPayables.push(debt);
    }
  }

  // Sort open debts by date ascending (oldest first)
  outstandingReceivables.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  outstandingPayables.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // Sort settled debts newest first
  settledDebts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const netPaise = receivablePaise - payablePaise;

  return {
    customerId,
    receivablePaise,
    payablePaise,
    customerAdvancePaise,
    supplierAdvancePaise,
    netPaise,
    totalCreditGivenPaise,
    totalPaymentsReceivedPaise,
    totalDebtIncurredPaise,
    totalPaymentsMadePaise,
    totalAdvancesReceivedPaise,
    totalAdvancesPaidPaise,
    totalMutualAdjustmentsPaise,
    totalRefundsGivenPaise,
    totalRefundsReceivedPaise,
    outstandingReceivables,
    outstandingPayables,
    settledDebts
  };
}

/**
 * Preview the financial effect of a prospective payment or transaction before saving.
 */
export function previewTransactionEffect(
  summary: CustomerFinancialSummary,
  transactionType: FinancialTransactionType,
  amountPaise: number,
  allocations?: PaymentAllocation[]
): {
  direction: LedgerDirection | 'neutral';
  currentOutstandingPaise: number;
  newOutstandingPaise: number;
  advancePaiseResult: number;
  allocationsPreview: Array<{
    debtId: string;
    originalRemainingPaise: number;
    allocatedPaise: number;
    newRemainingPaise: number;
  }>;
} {
  const isReceivable = transactionType === 'payment_received' || transactionType === 'credit_given';
  const openDebts = isReceivable ? summary.outstandingReceivables : summary.outstandingPayables;
  const currentOutstanding = isReceivable ? summary.receivablePaise : summary.payablePaise;

  if (transactionType === 'credit_given' || transactionType === 'debt_incurred') {
    const existingAdvance = transactionType === 'credit_given' ? summary.customerAdvancePaise : summary.supplierAdvancePaise;
    const advanceUsed = Math.min(existingAdvance, amountPaise);
    const addedOutstanding = amountPaise - advanceUsed;

    return {
      direction: isReceivable ? 'receivable' : 'payable',
      currentOutstandingPaise: currentOutstanding,
      newOutstandingPaise: currentOutstanding + addedOutstanding,
      advancePaiseResult: Math.max(0, existingAdvance - advanceUsed),
      allocationsPreview: []
    };
  }

  if (transactionType === 'payment_received' || transactionType === 'payment_made') {
    let remPayment = amountPaise;
    const previewList: Array<{
      debtId: string;
      originalRemainingPaise: number;
      allocatedPaise: number;
      newRemainingPaise: number;
    }> = [];

    // Explicit allocations
    if (allocations && allocations.length > 0) {
      for (const alloc of allocations) {
        if (remPayment <= 0) break;
        const targetDebt = openDebts.find(d => d.transactionId === alloc.targetTransactionId);
        if (targetDebt) {
          const allocated = Math.min(alloc.allocatedPaise, targetDebt.remainingAmountPaise, remPayment);
          previewList.push({
            debtId: targetDebt.transactionId,
            originalRemainingPaise: targetDebt.remainingAmountPaise,
            allocatedPaise: allocated,
            newRemainingPaise: targetDebt.remainingAmountPaise - allocated
          });
          remPayment -= allocated;
        }
      }
    }

    // FIFO allocation for remainder
    for (const debt of openDebts) {
      if (remPayment <= 0) break;
      const alreadyAllocated = previewList.find(p => p.debtId === debt.transactionId);
      const remainingDebt = alreadyAllocated ? alreadyAllocated.newRemainingPaise : debt.remainingAmountPaise;

      if (remainingDebt > 0) {
        const allocated = Math.min(remainingDebt, remPayment);
        if (alreadyAllocated) {
          alreadyAllocated.allocatedPaise += allocated;
          alreadyAllocated.newRemainingPaise -= allocated;
        } else {
          previewList.push({
            debtId: debt.transactionId,
            originalRemainingPaise: debt.remainingAmountPaise,
            allocatedPaise: allocated,
            newRemainingPaise: debt.remainingAmountPaise - allocated
          });
        }
        remPayment -= allocated;
      }
    }

    const totalAllocated = previewList.reduce((acc, p) => acc + p.allocatedPaise, 0);
    const newOutstanding = Math.max(0, currentOutstanding - totalAllocated);
    const currentAdvance = isReceivable ? summary.customerAdvancePaise : summary.supplierAdvancePaise;
    const advanceResult = currentAdvance + remPayment; // Excess payment converts to advance

    return {
      direction: isReceivable ? 'receivable' : 'payable',
      currentOutstandingPaise: currentOutstanding,
      newOutstandingPaise: newOutstanding,
      advancePaiseResult: advanceResult,
      allocationsPreview: previewList
    };
  }

  return {
    direction: 'neutral',
    currentOutstandingPaise: currentOutstanding,
    newOutstandingPaise: currentOutstanding,
    advancePaiseResult: 0,
    allocationsPreview: []
  };
}
