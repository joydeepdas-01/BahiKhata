# BahiKhata Data Model Specification

This document details the data structures, field schemas, and integer currency representations used throughout BahiKhata.

---

## 1. Customer Ledger Entity (`Customer`)

```typescript
export interface Customer {
  id: string;                      // Unique UUID timestamp identifier
  name: string;                    // Customer full name
  phone: string;                   // Normalized Indian mobile number (e.g., 919876543210)
  amount: number;                  // Integer Paise value (e.g. ₹150.50 -> 15050)
  dueDate: string | null;          // ISO 8601 YYYY-MM-DD date string
  note?: string;                   // Optional ledger note / item list
  status: 'pending' | 'paid' | 'archived';
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
  lastReminderSentAt?: string;    // ISO 8601 timestamp
}
```

---

## 2. Integer Financial Representation

To prevent floating-point rounding errors common in monetary software, amounts are converted upon input:

$$\text{Paise} = \text{Math.round}(\text{Rupees} \times 100)$$

**Examples**:
- `₹100.00` $\rightarrow$ `10000` Paise
- `₹45.50` $\rightarrow$ `4550` Paise
- `₹0.75` $\rightarrow$ `75` Paise

Display formatting utilizes standard Indian numbering format (`en-IN`):
- `1000000` Paise = `₹10,000.00`

---

## 3. Due Date Classification Matrix

| Status | Condition | Pill Style |
| :--- | :--- | :--- |
| `Settled / Paid` | `customer.status === 'paid'` | Forest Green (`#1b5e20`) |
| `Overdue` | `dueDate < todayStr && status === 'pending'` | Crimson Red (`#b71c1c`) |
| `Due Today` | `dueDate === todayStr && status === 'pending'` | Saffron Orange (`#e65100`) |
| `Pending` | `dueDate > todayStr && status === 'pending'` | Slate Grey (`#2d3748`) |
