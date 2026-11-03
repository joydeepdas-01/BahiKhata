export type TransactionType = 'credit' | 'payment';

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType; // 'credit' (Gave Credit / Udhaar) | 'payment' (Received Payment / Jama)
  amount: number;        // Strictly positive integer amount in Paise (e.g. ₹100.50 -> 10050)
  date: string;          // ISO date string YYYY-MM-DD
  note?: string;         // Optional note / bill number / description
  createdAt: string;     // ISO timestamp
}

export interface Customer {
  id: string;
  name: string;
  phone: string;                      // Normalized wa.me phone number (e.g. 919876543210)
  additionalPhones?: string[];        // Additional secondary phone numbers from contact card
  amount: number;                     // Net outstanding balance in Paise (integer): > 0 means customer owes you, 0 means settled, < 0 means advance
  dueDate?: string | null;            // ISO date string YYYY-MM-DD or null
  note?: string;                      // Optional memo/address/note
  status: 'pending' | 'paid' | 'archived';
  lastReminderSentAt?: string | null; // ISO timestamp when reminder link was opened
  createdAt?: string;                 // ISO timestamp
  updatedAt?: string;                 // ISO timestamp
}

export interface CustomerSummary {
  totalPendingPaise: number;
  totalCustomersCount: number;
  pendingCount: number;
  dueTodayCount: number;
  overdueCount: number;
  settledCount: number;
  todayTransactionsCount: number;
  todayCreditPaise: number;
  todayPaymentPaise: number;
}

export type CustomerSortOption = 'recent' | 'balance_desc' | 'name_asc' | 'due_date';
export type CustomerFilterOption = 'all' | 'pending' | 'due_today' | 'overdue' | 'paid';

/**
 * Calculates net balance in paise from a list of transactions.
 * Credits increase what the customer owes (+).
 * Payments decrease what the customer owes (-).
 */
export function calculateBalanceFromTransactions(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    if (t.type === 'credit') {
      return acc + t.amount;
    } else if (t.type === 'payment') {
      return acc - t.amount;
    }
    return acc;
  }, 0);
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
