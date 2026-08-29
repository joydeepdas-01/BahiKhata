export interface Customer {
  id: string;
  name: string;
  phone: string;                     // Normalized wa.me phone number (e.g. 919876543210)
  amount: number;                    // Outstanding due amount in Paise (integer)
  dueDate?: string | null;           // ISO date string YYYY-MM-DD or null
  note?: string;                     // Optional note
  status: 'pending' | 'paid' | 'archived';
  lastReminderSentAt?: string | null; // ISO timestamp when deep link was opened
}

export interface CustomerSummary {
  totalPendingPaise: number;
  totalCustomersCount: number;
  pendingCount: number;
  dueTodayCount: number;
  overdueCount: number;
}
