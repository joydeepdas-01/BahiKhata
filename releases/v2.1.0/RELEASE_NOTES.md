# BahiKhata v2.1.0 — Advanced Financial Ledger Engine Release Notes

**Release Version:** `2.1.0`  
**Build Target:** Android Native APK & PWA  
**Package Name:** `com.bahikhata.app`  
**Distribution File:** `BahiKhata-v2.1.0.apk`  
**SHA-256 Checksum:** `a03e2b3fe1c9c4cda68f045d83d6108eaa4eb94755b368b3f90ad51ca5fe93c9`  
**Release Date:** November 5, 2026  

---

## 🚀 Major Highlights

### 1. Unified Mathematical Ledger Engine (`src/domain/ledgerEngine.ts`)
- **Strict Integer-Paise Precision:** Zero floating-point rounding errors (`₹1.00 = 100 paise`). All balances, allocations, installments, and advances are calculated strictly in integer paise.
- **Independent Positions per Contact:** Accounts Receivable (money owed to me) and Accounts Payable (money I owe) are tracked as independent financial positions. One contact can maintain both positions simultaneously without premature automatic offset.
- **Customer & Supplier Advances:** Overpayments and pre-payments automatically generate an advance balance (`customerAdvancePaise` / `supplierAdvancePaise`) that safely offsets against future credit bills or can be refunded.
- **Flexible Installment System:** Support for partial and multiple installment payments across irregular dates. Each credit/debt bill tracks `originalAmountPaise`, `settledAmountPaise`, `remainingAmountPaise`, and settlement progress.
- **Debt Allocation Engine:** Supports automatic FIFO allocation (oldest debt settled first) as well as specific bill targeting.
- **Bilateral Mutual Settlement:** Explicitly confirmed mutual settlement offsetting `min(Receivable, Payable)` without physical cash movement, generating a traceable audit record.
- **Traceable Reversals & Audit History:** Mistaken transactions can be reversed while preserving a permanent audit record (`reversalOfId`).

---

## 📊 Complete Accounting Model & Transaction Types

| Transaction Type | Direction | Category | Accounting Effect |
|---|---|---|---|
| `credit_given` | Receivable | Receive | Increases Accounts Receivable (Customer owes you) |
| `payment_received` | Receivable | Receive | Decreases Receivable; excess becomes Customer Advance |
| `advance_received` | Receivable | Receive | Increases Customer Advance held |
| `refund_given` | Receivable | Receive | Decreases Customer Advance |
| `debt_incurred` | Payable | Pay | Increases Accounts Payable (You owe supplier) |
| `payment_made` | Payable | Pay | Decreases Payable; excess becomes Supplier Advance |
| `advance_paid` | Payable | Pay | Increases Supplier Advance deposited |
| `refund_received` | Payable | Pay | Decreases Supplier Advance |
| `mutual_adjustment`| Bilateral | Adjustment| Offsets equal amounts from both Receivable and Payable |
| `reversal` | Neutral | Correction | Traceably inverts the effect of an earlier transaction |

---

## 🎨 Redesigned UI & Mobile Experience

- **Dual-Position Financial Hero:** Wise + Apple minimal hierarchy displaying "You Will Receive" (rose) and "You Need To Pay" (indigo) side-by-side with Today's Inflow/Outflow cash stats.
- **Customer Detail Modal:**
  - 4-stat financial summary banner: Owes You, You Owe, Advances Held, Net Position.
  - Mutual settlement banner when both positions are active.
  - Tabbed interface: Chronological Ledger Timeline, Outstanding Bills & Installments with progress bars, and Advance Balances.
  - Add Transaction form with real-time financial effect preview and allocation selection.
- **Quick Transaction Modal:** Contextual entry with direction selector ("Money I Receive" vs "Money I Pay") and live before/after balance calculation.
- **Customer List Filters:** One-tap filtering by "All", "Owes You", "You Owe", "Due Today", "Overdue", and "Settled".

---

## 🧪 Quality Assurance & Test Verification

- **Vitest Test Suite:** **55/55 unit & integration tests passing** (`src/domain/__tests__/ledgerEngine.test.ts`).
- **All 10 Real-World Financial Scenarios Verified:**
  1. Single credit calculation
  2. Partial installment settlement
  3. Complete debt settlement
  4. Additional credit on existing balance
  5. Multiple installments across irregular dates
  6. Accounts payable tracking
  7. Independent receivable and payable positions
  8. Overpayment and advance creation
  9. Multiple debt allocation
  10. Transaction reversal without history loss
  11. Mutual bilateral settlement
  12. Advance auto-consumed by subsequent credit
  13. Real-time preview calculation
  14. Legacy type compatibility (`credit` -> `credit_given`, `payment` -> `payment_received`)
  15. Multi-crore balance integrity (`₹1,00,00,000+`)
  16. Decimal paise precision (`₹100.50`)
  17. Customer advance refund
  18. Supplier advance refund

---

## 📲 In-Place Android Phone Installation

- Successfully installed over existing version via ADB on connected physical device `tkvowcxc45daby9t`.
- **Zero data loss:** All existing customer records, balances, notes, and due dates preserved and migrated seamlessly.
