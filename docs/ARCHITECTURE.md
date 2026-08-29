# BahiKhata System Architecture

This document describes the software architecture, data flow, and component organization of BahiKhata.

---

## 1. High-Level Architecture

BahiKhata is designed as an **offline-first, zero-cloud mobile ledger application** built using modern web web technologies wrapped inside Capacitor for Android.

```mermaid
flowchart TD
    User([Shop Owner / User]) --> UI[React 19 + TailwindCSS Web Shell]
    
    subgraph Core Logic & Domain
        UI --> CustomerContext[Customer State Management]
        UI --> DisplaySettingsContext[Appearance & Reminder Preferences]
        CustomerContext --> StorageService[IndexedDB Ledger Database]
        CustomerContext --> FormulaEngine[Paise Integer Financial Calculator]
        CustomerContext --> ReminderEngine[WhatsApp Deep-Link Generator]
        CustomerContext --> BackupEngine[CSV / TSV Import-Export Helper]
    end

    subgraph Native Android Wrapper
        UI --> CapacitorBridge[Capacitor Native Bridge]
        CapacitorBridge --> AndroidWebView[Android System WebView]
        CapacitorBridge --> Haptics[Capacitor Haptic Engine]
    end
```

---

## 2. Key Architectural Guarantees

1. **100% Offline Data Autonomy**:
   All customer records, transaction amounts, due dates, notes, and preferences are stored exclusively inside IndexedDB (`bahikhata_db`). Data never leaves the device.

2. **Financial Integer Precision**:
   Amounts are converted from user input (e.g. `₹150.50`) directly into **Integer Paise** (`15050` Paise) before writing to state or database. All summation, balances, and overdue tallies operate strictly on integer arithmetic, eliminating floating-point rounding errors.

3. **Independent Typography Scaling**:
   Text size adjustments (**Small**, **Standard**, **Large**, **Extra Large**) operate purely on CSS variables (`--app-font-scale`, `--app-body-font-size`, `--app-heading-scale`, `--app-label-scale`). HTML root font size is locked at `16px`, ensuring font scaling never shrinks container width or distorts UI geometry.

4. **Outer Content Margin System**:
   A centralized container utility (`AppContentContainer`) applies safe 8px–12px outer horizontal margins (`--content-margin-inline: 10px`) across all mobile screens, ensuring cards, search bars, filter chips, and dialogs sit comfortably inside the viewport.
