# BahiKhata Skills Architecture

## Purpose

This directory contains the production-grade agent skills for building and maintaining BahiKhata.

## Skill Inventory

| ID | Skill | Primary Responsibility |
|---|---|---|
| 01 | Product Requirements | Requirements, acceptance criteria, scope |
| 02 | Project Context | Repository exploration and reuse |
| 03 | Architecture | System/module architecture |
| 04 | UI/UX | Mobile-first user experience |
| 05 | Design System | Visual consistency |
| 06 | Domain Business Logic | Core rules and models |
| 07 | Storage / IndexedDB | Local persistence |
| 08 | Reminder Template Engine | Personalized reminders |
| 09 | WhatsApp Integration | `wa.me` / Android deep links |
| 10 | i18n / Localization | English/Hindi/Bengali |
| 11 | CSV Import/Export | Spreadsheet workflows |
| 12 | Capacitor / Android | Native Android boundary |
| 13 | Testing / QA | Verification and regression prevention |
| 14 | Security / Privacy | Data and permission safety |
| 15 | Performance | Startup/runtime efficiency |
| 16 | Build / Release / DevOps | APK/AAB and CI/CD |
| 17 | Code Review / Refactoring | Maintainability |
| 18 | Autonomous Orchestrator | Multi-skill task execution |

## Invocation Priority

### P0 — Required for core development

01, 02, 03, 04, 06, 07, 08, 09, 10, 12, 13, 14, 16, 18

### P1 — Strongly recommended

05, 11, 15, 17

## Default Orchestration

For a normal feature:

```text
Requirements
    ↓
Project Context
    ↓
Architecture
    ↓
UI/UX + Domain + Storage/Integration
    ↓
Implementation
    ↓
Testing
    ↓
Security/Performance Review
    ↓
Build Verification
    ↓
Complete
```

For Android-specific features:

```text
Requirements
    ↓
Project Context
    ↓
Architecture
    ↓
Capacitor/Android
    ↓
Implementation
    ↓
WhatsApp/Native verification if applicable
    ↓
Testing
    ↓
Build APK/AAB
```

## Global Rules

1. `features.md` is the primary product contract.
2. The application is Android-first but may retain a shared Web/PWA target.
3. V1 remains local-first.
4. No backend, cloud customer database, login, UPI collection, or WhatsApp Business API may be introduced without explicit product approval.
5. The final WhatsApp Send action remains user-controlled.
6. Never claim message delivery or read status from a deep-link action.
7. Reuse existing code before creating new abstractions.
8. Every behavior-changing implementation requires verification.
9. No skill may silently expand V1 scope.
10. Security, privacy, accessibility, and performance are cross-cutting responsibilities.

## Suggested Repository Layout

```text
skills/
├── 01-product-requirements/
│   └── SKILL.md
├── 02-project-context/
│   └── SKILL.md
├── 03-architecture/
│   └── SKILL.md
├── 04-ui-ux/
│   └── SKILL.md
├── 05-design-system/
│   └── SKILL.md
├── 06-domain-business-logic/
│   └── SKILL.md
├── 07-storage-indexeddb/
│   └── SKILL.md
├── 08-reminder-template-engine/
│   └── SKILL.md
├── 09-whatsapp-integration/
│   └── SKILL.md
├── 10-i18n-localization/
│   └── SKILL.md
├── 11-csv-import-export/
│   └── SKILL.md
├── 12-capacitor-android/
│   └── SKILL.md
├── 13-testing-qa/
│   └── SKILL.md
├── 14-security-privacy/
│   └── SKILL.md
├── 15-performance/
│   └── SKILL.md
├── 16-build-release-devops/
│   └── SKILL.md
├── 17-code-review-refactoring/
│   └── SKILL.md
├── 18-autonomous-orchestrator/
│   └── SKILL.md
└── README.md
```
