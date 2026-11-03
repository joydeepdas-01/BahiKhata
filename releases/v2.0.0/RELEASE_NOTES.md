# BahiKhata v2.0.0 — Modern Merchant Ledger & Design System Unification

> **The Modern, Private, Offline-First Digital Ledger & Smart Payment Reminder System for Indian Merchants.**

---

### 🌟 What's New in v2.0.0

This release marks a complete **UI/UX modernization, workflow optimization, and visual design system unification** inspired by Apple Human Interface Guidelines, Wise, Linear, and Material Design 3.

#### 1. Unified Design System & Production Polish
- **Centralized Design Tokens:** Spacing (strict 4px/8px scale), standardized typography weights, and cohesive brand palette (`#B3262D` Burgundy, `#F8F7F4` Warm Parchment canvas, `#FFFFFF` Surface, `#E8E6E1` Subtle Hairline Borders).
- **Reusable `CustomerCard`:** Complete redesign of ledger cards featuring initials avatars, bold tabular balances, relative due date status (`Overdue by X days`, `Due today`, `Settled`), item note previews, and responsive action bars that never overflow or clip.
- **Searchable `CustomerSelector`:** Replaced native browser select inputs with a high-fidelity custom customer dropdown featuring real-time search, avatars, phone numbers, and live balance indicators.
- **Unified 5-Destination Bottom Navigation:** Customers, Transactions Activity Feed, Central Elevated Quick-Action Button (`+`), Reminders Queue with overdue counter badge, and Settings.
- **Balanced App Header:** Clean shop identity, "Offline Khata" chip, bulk spreadsheet paste button, and compact Add Customer action.

#### 2. Native Android Contact Picker Integration
- **Direct Device Address Book Import:** Pick any customer directly from your phone contacts via native Android `Intent.ACTION_PICK` without granting broad address book permissions.
- **Multi-Phone Handling:** Detects multiple phone numbers on a contact card and displays quick selection chips.
- **Automatic +91 Normalization & Real-Time Duplicate Detection:** Formats 10-digit Indian numbers and instantly alerts if a customer account already exists with that phone number.

#### 3. True Double-Entry Ledger Engine
- **Integer-Paise Precision:** Zero floating-point arithmetic rounding errors. Every transaction is computed and stored in integer paise.
- **Credit (+ Udhaar) & Payment (- Jama):** Record credit or payments in 2 taps from anywhere in the app.
- **Complete Audit Trail & Customer Timeline:** View detailed transaction histories with date, amount, custom item note, and delete/correction capabilities.

#### 4. Multilingual WhatsApp Payment Reminders
- **3 Languages:** English, हिंदी (Hindi), and বাংলা (Bengali).
- **4 Urgency Tones:** Gentle Pre-due, Due Today, Urgent Overdue, and Final Notice.
- **Authentic WhatsApp Chat Bubble Mockup:** Realistic preview matching WhatsApp colors (`#d9fdd3`), timestamps, and double-blue ticks.
- **Direct Deep-Linking:** Generates `https://wa.me/` links for user-reviewed sending with zero costly enterprise APIs.

---

### 📦 Download Assets & Checksums

| File | Size | SHA-256 Checksum |
| :--- | :--- | :--- |
| **`BahiKhata-v2.0.0.apk`** | ~4.3 MB | `38c26beeaf6fa446c6c8a09e0ccec8fff0cef9107d658d3f328bd2e03002ca7e` |

### 📱 Android Requirements
- Minimum Android: **Android 7.0 (API Level 24 - Nougat)**
- Target Android: **Android 15 (API Level 35)**
- Architecture: **arm64-v8a, armeabi-v7a, x86_64**

---

### 🛠️ Technical Specifications
- **Framework:** React 19.2 + TypeScript 6
- **Styling:** TailwindCSS v4.0
- **Native Runtime:** Capacitor v8.1 + Custom Native Java Plugin (`ContactPickerPlugin.java`)
- **Storage:** IndexedDB v2 (`bahikhata_db`)
- **Testing:** Vitest 4.1 — 37/37 passing unit tests

