import {
  FinancialTransactionType,
  PaymentMethod,
  PaymentAllocation,
  LedgerTransaction,
  CustomerFinancialSummary,
  OutstandingDebtItem,
  calculateCustomerLedger,
  normalizeTransactionType
} from './ledgerEngine';

export * from './ledgerEngine';

export type TransactionType = FinancialTransactionType | 'credit' | 'payment';

export interface Transaction extends Omit<LedgerTransaction, 'type'> {
  type: TransactionType;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;                      // Normalized wa.me phone number (e.g. 919876543210)
  additionalPhones?: string[];        // Additional secondary phone numbers from contact card
  amount: number;                     // Net balance in Paise (integer): > 0 means net customer owes, 0 means settled, < 0 means net you owe
  
  // Independent Ledger Positions (in Integer Paise)
  receivablePaise?: number;           // Money customer owes me (Accounts Receivable, >= 0)
  payablePaise?: number;              // Money I owe this person (Accounts Payable, >= 0)
  customerAdvancePaise?: number;      // Advance money customer deposited with me (>= 0)
  supplierAdvancePaise?: number;      // Advance money I paid to supplier (>= 0)
  accountType?: 'customer' | 'supplier' | 'both';

  dueDate?: string | null;            // ISO date string YYYY-MM-DD or null
  note?: string;                      // Optional memo/address/note
  status: 'pending' | 'paid' | 'archived';
  lastReminderSentAt?: string | null; // ISO timestamp when reminder link was opened
  createdAt?: string;                 // ISO timestamp
  updatedAt?: string;                 // ISO timestamp
}

export interface CustomerSummary {
  // Classic summary
  totalPendingPaise: number;
  totalCustomersCount: number;
  pendingCount: number;
  dueTodayCount: number;
  overdueCount: number;
  settledCount: number;
  todayTransactionsCount: number;
  todayCreditPaise: number;
  todayPaymentPaise: number;

  // Advanced Ledger Summary
  totalReceivablePaise: number;       // All money customers owe me
  totalPayablePaise: number;          // All money I owe suppliers/creditors
  totalCustomerAdvancesPaise: number; // All customer advances held
  totalSupplierAdvancesPaise: number; // All supplier advances paid
  netLedgerPositionPaise: number;     // totalReceivablePaise - totalPayablePaise
  todayCashInflowPaise: number;       // Actual payments received today
  todayCashOutflowPaise: number;      // Actual payments made today
  payableCustomersCount: number;      // Count of accounts with active payables
  receivableCustomersCount: number;   // Count of accounts with active receivables
}

export type CustomerSortOption = 'recent' | 'balance_desc' | 'name_asc' | 'due_date';
export type CustomerFilterOption = 'all' | 'pending' | 'payable' | 'advance' | 'due_today' | 'overdue' | 'paid';

/**
 * Calculates net balance in paise from a list of transactions.
 * Uses calculateCustomerLedger for complete mathematical precision.
 */
export function calculateBalanceFromTransactions(transactions: Transaction[]): number {
  if (!transactions || transactions.length === 0) return 0;
  const summary = calculateCustomerLedger('calc', transactions);
  // Net balance: receivable - payable (advance is separate)
  if (summary.customerAdvancePaise > 0 && summary.receivablePaise === 0) {
    return -summary.customerAdvancePaise;
  }
  return summary.netPaise;
}

/**
 * Checks for existing customer with the same normalized phone number.
 */
export function findDuplicateCustomer(
  customers: Customer[],
  normalizedPhone: string,
  excludeCustomerId?: string
): Customer | undefined {
  if (!normalizedPhone) return undefined;
  return customers.find(c => c.id !== excludeCustomerId && c.phone === normalizedPhone);
}
