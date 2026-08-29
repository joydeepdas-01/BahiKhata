# BahiKhata --- Features & Product Specification

**Document Type:** Product Feature Specification\
**Product:** BahiKhata\
**Platform:** Android-first, with optional Web/PWA companion\
**Product Category:** Small Business Utility / Payment Reminder\
**Primary Market:** India\
**Version:** V1 Product Specification\
**Status:** Product Definition / Pre-Development\
**Brand Name:** BahiKhata

------------------------------------------------------------------------

## 1. Product Overview

### 1.1 Product Name

# BahiKhata

**BahiKhata** is an India-focused, lightweight payment-reminder
application for small merchants, shopkeepers, tuition teachers,
freelancers, tailors, wholesalers, and other small businesses that
maintain informal customer dues.

The product converts a simple customer-debt list into personalized,
ready-to-send WhatsApp reminders.

### 1.2 Core Product Promise

> **Add the customer, enter the amount, generate the reminder, and send
> it on WhatsApp.**

The application is intentionally designed to remove unnecessary setup:

-   No mandatory account
-   No complicated business setup
-   No WhatsApp Business API
-   No cloud customer database in V1
-   No monthly subscription for the core utility
-   No automatic WhatsApp sending
-   No payment collection system in V1

### 1.3 Product Positioning

BahiKhata is not intended to compete with a full accounting ERP.

It is a focused utility for the small-business problem of:

> **"Who owes me money, how much do they owe, and how do I remind them
> quickly?"**

------------------------------------------------------------------------

# 2. Product Vision

BahiKhata aims to modernize the familiar Indian **bahi-khata** concept
without forcing a traditional merchant to adopt a complicated accounting
platform.

The product should feel:

-   Indian
-   Familiar
-   Simple
-   Fast
-   Trustworthy
-   Mobile-first
-   Privacy-conscious
-   Affordable
-   Extremely easy to learn

The original product opportunity is based on the observation that small
merchants often maintain dues in notebooks or WhatsApp conversations and
manually compose reminders one by one.

**Evidence note:** the supplied research specification classifies the
opportunity as Level 2 evidence: a validated product shape based on
competitor-landscape research, but not validated demand. Real-user
conversations are therefore a required product-validation step before
significant expansion.

------------------------------------------------------------------------

# 3. Target Users

## 3.1 Primary Persona --- Small Shopkeeper

Typical characteristics:

-   Small kirana/general store or local shop
-   Maintains informal customer credit
-   Uses an Android smartphone
-   Uses WhatsApp regularly
-   May maintain a physical notebook as a khata
-   Moderate digital literacy
-   Does not want complex accounting software
-   Is highly price-sensitive
-   Wants a quick solution rather than a business-management system

Typical use case:

> A shopkeeper has 20 regular customers with outstanding balances and
> wants to remind all of them without manually typing every message.

## 3.2 Secondary Personas

### Tuition Teacher

Uses BahiKhata to remind students/parents about:

-   Monthly tuition fees
-   Pending fees
-   Overdue payments

### Freelancer

Uses BahiKhata for:

-   Pending invoices
-   Project balances
-   Client payment follow-ups

### Small Wholesaler

Uses BahiKhata to follow up with:

-   Retailers
-   Regular buyers
-   Outstanding balances

### Tailor / Local Service Provider

Uses BahiKhata for:

-   Pending service payments
-   Outstanding customer balances
-   Order-related dues

------------------------------------------------------------------------

# 4. Core User Problem

A small merchant may currently use:

-   Paper notebook
-   Physical bahi-khata
-   WhatsApp chat history
-   Phone contacts
-   Memory

The payment-reminder process is often:

1.  Remember the customer.
2.  Remember or find the amount.
3.  Open WhatsApp.
4.  Find the contact.
5.  Type the message.
6.  Repeat for the next customer.

BahiKhata reduces this repetitive work to a structured workflow.

------------------------------------------------------------------------

# 5. Core User Journey

``` text
Open BahiKhata
      ↓
Add / import customers
      ↓
Enter amount and due date
      ↓
Choose reminder tone
      ↓
Generate reminders
      ↓
Review message
      ↓
Tap "Send on WhatsApp"
      ↓
WhatsApp opens with pre-filled message
      ↓
User presses Send
      ↓
Customer pays
      ↓
Tap "Mark as Paid"
```

The final WhatsApp send action always remains under the user's control.

------------------------------------------------------------------------

# 6. Platform Strategy

## 6.1 Primary Platform

**Android application**

BahiKhata will be designed as an installable Android app rather than
only as a website.

### Android deliverables

-   Development APK
-   Release APK for direct testing/distribution where appropriate
-   Android App Bundle (AAB) for Google Play Store distribution

## 6.2 Shared Web Technology

The UI can be built using:

-   React
-   TypeScript
-   Vite
-   Tailwind CSS

The Android application can package the web application using a native
Android bridge such as Capacitor.

### Architecture

``` text
React + TypeScript + Vite
            ↓
       BahiKhata UI
            ↓
        Capacitor
            ↓
       Android App
            ↓
      APK / AAB
```

## 6.3 Optional Web/PWA Version

The same core codebase can optionally produce:

-   Web version
-   PWA
-   Desktop-browser experience

The Android app remains the primary product target.

------------------------------------------------------------------------

# 7. MVP Feature Set

The V1 feature set should remain intentionally small.

## Core V1 Features

1.  Customer management
2.  Bulk customer entry
3.  Excel/Sheets paste
4.  Customer amount and due-date management
5.  Reminder tone selection
6.  Automatic message generation
7.  Message preview
8.  WhatsApp deep-link sending
9.  Local data persistence
10. Mark as Paid
11. CSV import/export
12. Bengali/Hindi/English templates
13. Android offline-first experience
14. PWA/web compatibility where retained

The supplied product specification originally defined a 5--7 feature
hard cap for the web MVP. The Android-first version should preserve that
simplicity while treating platform support and packaging as delivery
requirements rather than reasons to expand the business scope.

------------------------------------------------------------------------

# 8. Customer Management

## 8.1 Add Customer

The user can add a customer manually.

### Fields

**Required**

-   Customer Name
-   Phone Number
-   Amount Due

**Optional**

-   Due Date
-   Note

### Example

``` text
Name: Rahul
Phone: 9876543210
Amount: ₹1,250
Due Date: 25 August 2026
Note: Grocery
```

## 8.2 Edit Customer

User can modify:

-   Name
-   Phone number
-   Amount
-   Due date
-   Note
-   Status

## 8.3 Delete Customer

User can permanently remove a customer from local data after
confirmation.

## 8.4 Customer Status

Supported states:

``` text
pending
paid
archived
```

### Pending

Payment is outstanding.

### Paid

Customer has paid.

### Archived

Customer is retained for record purposes but excluded from the active
reminder list.

------------------------------------------------------------------------

# 9. Bulk Customer Entry

## 9.1 Manual Multi-row Table

Users can enter multiple customers in a table.

Suggested columns:

  Field      Required
  ---------- ----------
  Name       Yes
  Phone      Yes
  Amount     Yes
  Due Date   Optional
  Note       Optional

## 9.2 Spreadsheet Paste

Users can copy tab-separated data from:

-   Microsoft Excel
-   Google Sheets
-   Other spreadsheet software

and paste it directly into BahiKhata.

Example:

``` text
Rahul    9876543210    1250    25/08/2026    Grocery
Suman    6295784657    800     28/08/2026    August fees
Amit     9000000000    1500    30/08/2026    Order
```

The application should detect rows and populate the customer table.

## 9.3 Bulk Validation

Before generating reminders, the application should validate:

-   Missing names
-   Invalid phone numbers
-   Invalid amounts
-   Invalid dates
-   Empty rows
-   Duplicate rows where detectable

Invalid records should be highlighted clearly rather than silently
discarded.

------------------------------------------------------------------------

# 10. Reminder Tone System

BahiKhata should provide pre-defined reminder tones.

## 10.1 Gentle / Pre-Due Reminder

Purpose:

-   Friendly advance reminder
-   Suitable before the due date

Tone:

-   Respectful
-   Non-confrontational
-   Short

## 10.2 Due Today

Purpose:

-   Payment is due today

Tone:

-   Polite
-   Direct
-   Clear

## 10.3 Overdue

Purpose:

-   Due date has passed

Tone:

-   Respectful but more direct
-   Clearly identifies the pending amount

## 10.4 Final Notice

Purpose:

-   A stronger reminder after previous follow-ups

Tone:

-   Firm
-   Professional
-   Still respectful

------------------------------------------------------------------------

# 11. Automatic Template Personalization

Templates use placeholders.

Supported placeholders:

``` text
{{name}}
{{amount}}
{{due_date}}
```

Example template:

``` text
Hello {{name}}, this is a gentle reminder regarding
your pending payment of {{amount}}, due on {{due_date}}.
```

For Rahul:

``` text
Hello Rahul, this is a gentle reminder regarding
your pending payment of ₹1,250, due on 25 August.
```

The template engine should replace placeholders safely and consistently.

------------------------------------------------------------------------

# 12. Language Support

Minimum V1 languages:

-   English
-   Hindi
-   Bengali

## 12.1 Language Selector

The user can select the message language.

Example:

``` text
Language:
[ বাংলা ▼ ]
```

## 12.2 Language Independence

Changing the application UI language and changing the message language
should be architecturally separable.

This allows future expansion to additional Indian languages.

Potential future languages:

-   Assamese
-   Odia
-   Marathi
-   Gujarati
-   Tamil
-   Telugu
-   Kannada
-   Malayalam
-   Punjabi

These are future possibilities, not V1 requirements.

------------------------------------------------------------------------

# 13. Message Preview

Before opening WhatsApp, the user should see the generated message.

Each reminder card should show:

-   Customer name
-   Outstanding amount
-   Due date
-   Selected tone
-   Message preview
-   Send button
-   Mark Paid action

Example:

``` text
Rahul
₹1,250
Due: 25 Aug

"Hello Rahul, this is a gentle reminder..."

[ Send on WhatsApp ] [ Mark Paid ]
```

The preview prevents accidental use of the wrong amount, customer, or
template.

------------------------------------------------------------------------

# 14. WhatsApp Integration

## 14.1 Core Mechanism

BahiKhata generates a WhatsApp deep link using the customer's normalized
phone number and encoded message.

Conceptually:

``` text
https://wa.me/<phone>?text=<encoded-message>
```

## 14.2 Android Behaviour

On Android, tapping the button should attempt to open the appropriate
WhatsApp experience.

Expected flow:

``` text
BahiKhata
   ↓
Send on WhatsApp
   ↓
Android / WhatsApp link
   ↓
WhatsApp
   ↓
Chat opens
   ↓
Message already typed
   ↓
User presses Send
```

## 14.3 No Automatic Sending

BahiKhata must never silently send messages.

The user always performs the final Send action in WhatsApp.

## 14.4 No WhatsApp Business API in V1

The V1 product does not integrate:

-   WhatsApp Business API
-   Cloud API
-   Automated message sending
-   Bot infrastructure
-   Template approval workflows

This keeps the product aligned with its no-setup proposition.

------------------------------------------------------------------------

# 15. Phone Number Handling

The application should normalize phone numbers before generating links.

Recommended internal representation:

``` text
E.164-like normalized format
```

For the Indian market, the application should make common Indian
phone-number entry easy.

The UI may accept:

``` text
9876543210
+91 9876543210
+919876543210
```

and normalize them internally.

Invalid numbers should be rejected before a WhatsApp link is generated.

------------------------------------------------------------------------

# 16. Local Data Storage

## 16.1 Storage Philosophy

V1 should not require a server-side customer database.

Customer data remains on the user's device.

Possible storage:

-   IndexedDB
-   localStorage for very small configuration data

IndexedDB should be preferred for structured customer records.

## 16.2 Customer Data Model

``` text
Customer {
  id
  name
  phone
  amount
  due_date
  note
  status
  last_reminder_sent_at
}
```

## 16.3 Message Template Model

``` text
MessageTemplate {
  tone_key
  language
  text
}
```

Supported tone keys:

``` text
pre_due
due_today
overdue
final
```

Supported language keys:

``` text
en
hi
bn
```

------------------------------------------------------------------------

# 17. Auto-Save

Customer changes should be saved locally automatically.

Examples:

-   Add customer → save
-   Edit customer → save
-   Mark paid → save
-   Import CSV → save

The user should not need a separate Save button for normal data entry.

------------------------------------------------------------------------

# 18. Clear All Data

A dedicated destructive action should allow users to clear all local
customer data.

Because this is destructive:

1.  User taps Clear All.
2.  Confirmation dialog appears.
3.  App explains that local data will be removed.
4.  User confirms.
5.  Data is deleted.

The application should avoid accidental one-tap destruction.

------------------------------------------------------------------------

# 19. Mark as Paid

When a customer pays:

``` text
Pending
   ↓
Mark as Paid
   ↓
Paid
```

The customer should leave the active reminder queue.

Depending on final UX, paid customers may:

-   disappear from the active list
-   appear under a Paid filter
-   remain available in local history

The original specification explicitly requires that Mark as Paid removes
or archives the customer from the active reminder list.

------------------------------------------------------------------------

# 20. CSV Import

## Supported purpose

For users already maintaining their customer data in spreadsheets.

Suggested CSV columns:

``` text
name
phone
amount
due_date
note
```

## Import workflow

``` text
Import CSV
    ↓
Select file
    ↓
Parse CSV
    ↓
Validate rows
    ↓
Show import preview
    ↓
Confirm
    ↓
Save locally
```

## Error handling

The app should show:

-   Total rows
-   Valid rows
-   Invalid rows
-   Duplicate rows
-   Specific validation errors

------------------------------------------------------------------------

# 21. CSV Export

Users should be able to export their local data.

Export should include:

-   Name
-   Phone
-   Amount
-   Due date
-   Note
-   Status

The export should be generated entirely on-device.

No server upload is required.

------------------------------------------------------------------------

# 22. Search and Filtering

Search and filtering are recommended UX enhancements for the Android
version, but they should not expand the V1 into a full CRM.

### Search

Search by:

-   Customer name
-   Phone number

### Suggested filters

-   All
-   Pending
-   Due today
-   Overdue
-   Paid

These should remain lightweight.

------------------------------------------------------------------------

# 23. Main Android Screen

The main screen should contain most of the product functionality.

Suggested structure:

``` text
BahiKhata
Your simple payment reminder

[ Search ]

[ Pending ] [ Due Today ] [ Overdue ]

Customer List

┌───────────────────────────────┐
│ Rahul                         │
│ ₹1,250 • Due Today            │
│                               │
│ [ WhatsApp ]     [ Paid ]     │
└───────────────────────────────┘

┌───────────────────────────────┐
│ Suman                         │
│ ₹800 • 3 days overdue         │
│                               │
│ [ WhatsApp ]     [ Paid ]     │
└───────────────────────────────┘

              [+ Add Customer]
```

The exact UI is a design decision and should be validated through
prototyping.

------------------------------------------------------------------------

# 24. Add Customer Screen / Sheet

The Add Customer interface should be optimized for fast entry.

Fields:

``` text
Customer Name
Phone Number
Amount Due
Due Date
Note
```

Primary action:

``` text
[ Add Customer ]
```

Optional:

``` text
[ Add & Add Another ]
```

The second action can make entering multiple customers much faster.

------------------------------------------------------------------------

# 25. Generate Reminders

The user should be able to generate reminders for:

-   All pending customers
-   Selected customers
-   A filtered group

The generated reminder should use:

-   Customer data
-   Current status
-   Due date
-   Selected language
-   Selected tone
-   Template placeholders

------------------------------------------------------------------------

# 26. Bulk Tone Selection

The user should be able to apply one tone to many customers.

Example:

``` text
Select All
      ↓
Tone: Overdue
      ↓
Apply
```

Individual rows can optionally override the default tone.

This is consistent with the original detailed user flow.

------------------------------------------------------------------------

# 27. Reminder Card States

Each reminder card can have states such as:

### Pending

``` text
[ Send on WhatsApp ]
[ Mark Paid ]
```

### Opened / Prepared

Optional local state:

``` text
[ Send Again ]
[ Mark Paid ]
```

### Paid

``` text
Paid
```

The product should not claim that a message was actually delivered
merely because a WhatsApp link was opened.

------------------------------------------------------------------------

# 28. Reminder History

The original data model allows an optional:

``` text
last_reminder_sent_at
```

Because the final Send action happens inside WhatsApp, the app should
clearly distinguish between:

-   Reminder prepared
-   WhatsApp opened
-   User-confirmed reminder action

BahiKhata should not falsely claim message delivery or read status.

------------------------------------------------------------------------

# 29. Offline-First Behaviour

Core functions should work without an internet connection:

-   Open app
-   View saved customers
-   Add/edit customers
-   Generate messages
-   Preview messages
-   Change templates
-   Mark paid
-   Import/export where supported locally

Internet is required when the user actually needs WhatsApp connectivity.

------------------------------------------------------------------------

# 30. Android App Packaging

## Development

Develop and test through Android Studio and a connected Android
device/emulator.

## APK

Used for:

-   Local testing
-   Internal distribution
-   Development builds

## AAB

Used for:

-   Google Play Store release

The project should maintain separate debug and release configurations.

------------------------------------------------------------------------

# 31. App Installation

Possible distribution channels:

### Phase 1

Direct APK installation for development/testing.

### Phase 2

Internal testing through Play Console.

### Phase 3

Google Play Store production release.

### Optional

Web/PWA companion for users who prefer browser access.

------------------------------------------------------------------------

# 32. App Permissions

BahiKhata should follow a **minimum-permission principle**.

The app should not request unnecessary permissions.

In particular, V1 should not require:

-   Contacts permission
-   SMS permission
-   Call logs
-   Microphone
-   Camera
-   Location

unless a future feature specifically requires them.

The product can operate with manually entered phone numbers.

------------------------------------------------------------------------

# 33. Privacy Model

The product should clearly communicate:

> **Your customer list stays on your device in V1.**

Privacy principles:

-   No mandatory login
-   No cloud customer database
-   No server-side customer storage
-   No unnecessary permissions
-   No selling customer information
-   No unnecessary third-party data processing

A privacy explanation should be available inside Settings/About.

------------------------------------------------------------------------

# 34. Security

Even though V1 is local-only, security still matters.

Recommended measures:

-   Validate all imported data
-   Sanitize template input
-   Safely encode WhatsApp URLs
-   Avoid arbitrary HTML injection
-   Do not execute imported content
-   Avoid storing unnecessary sensitive data
-   Protect destructive actions with confirmation
-   Keep dependencies updated

------------------------------------------------------------------------

# 35. Error Handling

The application should provide understandable messages.

Examples:

### Invalid phone

> Please enter a valid phone number.

### Missing amount

> Please enter the pending amount.

### Missing customer name

> Please enter the customer's name.

### Invalid CSV

> Some rows could not be imported. Review the highlighted rows.

### WhatsApp unavailable

> WhatsApp could not be opened. Please check whether WhatsApp is
> installed or try again.

### Storage failure

> BahiKhata could not save your data locally. Please check available
> device storage.

Errors should be actionable, not technical.

------------------------------------------------------------------------

# 36. Empty States

The app should never feel broken when there are no customers.

Example:

``` text
No pending payments

Add your first customer to start
sending payment reminders.

[ + Add Customer ]
```

After all customers are paid:

``` text
You're all caught up.

No pending payments right now.
```

------------------------------------------------------------------------

# 37. Onboarding

The onboarding should be minimal.

Suggested first-run flow:

``` text
Welcome to BahiKhata

Simple payment reminders
for your business.

No account required.
Your data stays on your device.

[ Get Started ]
```

Then immediately open Add Customer.

Do not create a long tutorial.

------------------------------------------------------------------------

# 38. Settings

Suggested settings:

### Messages

-   Default language
-   Default reminder tone
-   Template settings

### Data

-   Export CSV
-   Import CSV
-   Clear all data

### App

-   Install status
-   Version
-   Privacy
-   About BahiKhata

The original specification suggests keeping settings/templates as a
second screen or modal to preserve the micro-product structure.

------------------------------------------------------------------------

# 39. Template Management

V1 should provide built-in templates.

Future Pro functionality may allow custom template editing.

Template format:

``` text
Hello {{name}},

This is a reminder regarding your pending
payment of {{amount}}, due on {{due_date}}.

Thank you.
```

The template engine should support placeholder validation.

If a template contains an unsupported placeholder, the application
should flag it rather than generating broken text.

------------------------------------------------------------------------

# 40. Currency and Amount Formatting

The initial target market is India.

The application should use Indian currency formatting.

Examples:

``` text
₹500
₹1,250
₹10,000
₹1,25,000
₹12,50,000
```

The internal amount representation should avoid floating-point precision
errors for money.

Prefer integer smallest-unit representation or a safe decimal strategy.

------------------------------------------------------------------------

# 41. Date Handling

The app should support Indian user-friendly date entry and display.

Examples:

``` text
25 Aug
25 August 2026
```

The reminder engine should correctly identify:

-   Pre-due
-   Due today
-   Overdue

The application should store dates in a consistent internal format.

------------------------------------------------------------------------

# 42. Dashboard-Level Summary

A very small summary area can improve usability without turning
BahiKhata into an accounting dashboard.

Possible summary:

``` text
Pending
8 customers

Total Due
₹12,450
```

Optional:

``` text
Due Today
3
```

This is a UX enhancement and should remain lightweight.

------------------------------------------------------------------------

# 43. No Full Accounting System in V1

BahiKhata should not initially attempt to become:

-   Full ledger accounting software
-   GST accounting platform
-   Inventory management system
-   POS system
-   Payroll system
-   CRM
-   Full invoicing platform
-   Business analytics suite

The product's strongest value is its narrow focus.

------------------------------------------------------------------------

# 44. Explicitly Out of Scope for V1

The following should not be built in the initial release:

-   WhatsApp Business API
-   Automatic WhatsApp sending
-   Scheduled WhatsApp sending
-   Customer accounts
-   User login
-   Cloud customer database
-   UPI payment collection
-   Payment gateway
-   Analytics dashboard
-   Complex reports
-   Multi-user roles
-   Native iOS application
-   Full accounting system
-   Inventory
-   GST module
-   POS
-   Payroll
-   Complex CRM

This preserves the original product's micro-utility positioning.

------------------------------------------------------------------------

# 45. Future Pro Features

If real users demonstrate demand, potential Pro functionality can
include:

## Pro Feature Group

-   Unlimited saved contacts
-   Custom reminder templates
-   Multiple business profiles
-   Advanced CSV tools
-   Extended reminder history
-   Customer notes/history
-   Additional languages
-   More advanced filtering
-   Backup/export utilities

The original research proposes a one-time Pro unlock around ₹99--₹299 as
one possible monetization path rather than a subscription.

This is not a V1 requirement.

------------------------------------------------------------------------

# 46. Future Product Expansion

Only after validation, BahiKhata could expand toward:

``` text
BahiKhata
│
├── Khata
│   └── Customer balances
│
├── Reminders
│   └── WhatsApp reminders
│
├── Payments
│   └── Payment records
│
├── Invoices
│   └── Simple invoices
│
└── Reports
    └── Business summaries
```

Expansion must be driven by actual user demand.

------------------------------------------------------------------------

# 47. UX Principles

BahiKhata should follow these principles:

## Principle 1 --- Simplicity

The user should understand the main screen without instructions.

## Principle 2 --- Speed

The core task should be achievable in seconds.

## Principle 3 --- Familiarity

Use familiar Indian business terminology where appropriate.

## Principle 4 --- Trust

Never claim that a message was sent when BahiKhata only opened WhatsApp.

## Principle 5 --- Privacy

Keep V1 customer data local.

## Principle 6 --- No Friction

Do not force signup, onboarding forms, or unnecessary configuration.

## Principle 7 --- Mobile First

The primary interaction target is Android.

## Principle 8 --- Respectful Reminders

Templates should avoid aggressive or embarrassing language.

------------------------------------------------------------------------

# 48. Accessibility

The application should support:

-   Large readable text
-   Adequate touch targets
-   Clear button labels
-   Strong text/background contrast
-   Screen-reader-friendly labels
-   Visible focus states where applicable
-   Avoiding color-only status communication

Example:

Do not communicate overdue status only using red.

Use:

``` text
Overdue
3 days late
```

with appropriate visual emphasis.

------------------------------------------------------------------------

# 49. Performance Requirements

Because this is a lightweight utility:

-   App launch should be fast
-   Main screen should render quickly
-   No unnecessary network requests
-   No large JavaScript libraries without justification
-   Local operations should remain responsive
-   CSV processing should not freeze the UI for normal datasets

The product should be optimized for budget Android devices and ordinary
mobile connections.

------------------------------------------------------------------------

# 50. Data Ownership

The user should be able to:

-   Export their data
-   Clear their data
-   Continue using the app without an account

The application should not make user data hostage to a cloud account.

------------------------------------------------------------------------

# 51. Deployment Architecture

Recommended V1 architecture:

``` text
                GitHub
                   │
                   ▼
          React + Vite Project
                   │
                   ▼
              Build Process
                   │
          ┌────────┴────────┐
          ▼                 ▼
     Web/PWA Build      Capacitor Build
                            │
                            ▼
                       Android Project
                            │
                     ┌──────┴──────┐
                     ▼             ▼
                    APK           AAB
                                  │
                                  ▼
                           Google Play
```

The Android app can operate primarily from local data.

No backend is required for the core V1 workflow.

------------------------------------------------------------------------

# 52. Development Environment

Recommended stack:

### Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS

### Android

-   Capacitor
-   Android Studio
-   Android SDK

### Data

-   IndexedDB
-   Optional localStorage for small preferences

### Testing

-   Unit tests
-   Component tests
-   Android device testing
-   WhatsApp link testing
-   CSV import testing
-   Offline testing

### Source Control

-   Git
-   GitHub

------------------------------------------------------------------------

# 53. Quality Assurance Checklist

Before V1 release, verify:

## Customer

-   [ ] Add customer works
-   [ ] Edit customer works
-   [ ] Delete customer works
-   [ ] Phone validation works
-   [ ] Amount validation works
-   [ ] Due date works

## Bulk Entry

-   [ ] Excel paste works
-   [ ] Invalid rows are highlighted
-   [ ] CSV import works
-   [ ] CSV export works

## Reminder

-   [ ] All tones generate correctly
-   [ ] Name placeholder works
-   [ ] Amount placeholder works
-   [ ] Date placeholder works
-   [ ] Bengali template works
-   [ ] Hindi template works
-   [ ] English template works

## WhatsApp

-   [ ] Correct number is used
-   [ ] Message is URL encoded correctly
-   [ ] WhatsApp opens correctly on Android
-   [ ] Message appears pre-filled
-   [ ] User remains responsible for Send

## Local Data

-   [ ] Data survives app restart
-   [ ] Data survives device restart
-   [ ] Mark Paid persists
-   [ ] Clear All works correctly
-   [ ] Export works

## Android

-   [ ] APK installs
-   [ ] App icon works
-   [ ] Splash screen works
-   [ ] Back navigation works
-   [ ] Keyboard behaviour is correct
-   [ ] Different screen sizes work
-   [ ] App works on low-end Android devices

------------------------------------------------------------------------

# 54. Product Validation Before Full Build

The original research explicitly identifies demand validation as the
biggest uncertainty.

Therefore the recommended process is:

### Step 1

Build only:

``` text
Customer table
      ↓
Generate
      ↓
Message preview
      ↓
WhatsApp link
```

### Step 2

Put it on real Android phones.

### Step 3

Show it to 5--10 actual small-business users.

### Step 4

Observe whether they immediately understand:

-   What the app does
-   How to add a customer
-   How to generate a reminder
-   How to send the reminder

### Step 5

Only then prioritize:

-   Local save
-   CSV
-   Multiple languages
-   Additional UX
-   Pro features

The supplied research recommends this validation approach before
investing heavily.

------------------------------------------------------------------------

# 55. First-10-Users Distribution Plan

Potential initial distribution:

1.  Local kirana shops
2.  Tuition centres
3.  Small wholesalers
4.  Local service providers
5.  Friends/family businesses
6.  Local business WhatsApp groups
7.  Short demonstration videos
8.  Local trader associations

The best initial test is not a large marketing campaign.

It is putting BahiKhata directly into the hands of real shopkeepers and
observing actual usage.

------------------------------------------------------------------------

# 56. Monetization Strategy

## V1

Recommended:

> **Free**

Do not introduce a subscription.

## Future Options

### Option A --- Free Forever

Use BahiKhata as:

-   Portfolio project
-   Goodwill product
-   User acquisition channel
-   Lead generation for a larger product

### Option B --- One-Time Pro

Potential:

**₹99--₹299 one-time**

Possible Pro features:

-   Custom templates
-   Multiple business profiles
-   Advanced exports
-   Unlimited saved contacts

### Option C --- Sibling Product

BahiKhata can eventually lead users to a more advanced:

-   Billing product
-   Invoicing product
-   Small-business management product

------------------------------------------------------------------------

# 57. Business Model Principle

The product should not violate its own value proposition.

The value proposition is:

> Free + fast + simple + no setup.

Therefore:

-   No forced subscription
-   No intrusive signup wall
-   No unnecessary ads in the core workflow
-   No complicated paywall before the user experiences the value

------------------------------------------------------------------------

# 58. Risk Management

## Risk 1 --- Demand Risk

The opportunity has not yet been validated through direct interviews.

**Mitigation:** Talk to real shopkeepers before major expansion.

## Risk 2 --- Copyability

The core technology is simple and can be copied.

**Mitigation:** Win through:

-   Better UX
-   Indian-language support
-   Local distribution
-   Trust
-   Brand
-   Speed of iteration

## Risk 3 --- WhatsApp Behaviour

Deep links depend on WhatsApp/device behaviour.

**Mitigation:** Test on multiple Android devices and WhatsApp
configurations.

## Risk 4 --- Local Data Loss

Browser/app local storage can be lost if the user clears application
data or uninstalls the app.

**Mitigation:**

-   Clear warning
-   CSV export
-   Backup guidance
-   Future optional encrypted backup feature

## Risk 5 --- Scope Creep

The product could easily become an ERP.

**Mitigation:**

> If a feature does not improve the core payment-reminder workflow, it
> should not automatically enter V1.

------------------------------------------------------------------------

# 59. Core Product Metrics

The initial product should focus on practical usage metrics rather than
vanity metrics.

Potential future metrics, if analytics are introduced with appropriate
privacy controls:

-   Number of users
-   Number of customers added
-   Number of reminders generated
-   Number of WhatsApp actions initiated
-   Number of customers marked paid
-   Repeat usage
-   CSV import usage
-   Language usage

However, **analytics are not required for the local-only V1**.

------------------------------------------------------------------------

# 60. Success Criteria for V1

BahiKhata V1 should be considered successful if a real shopkeeper can:

1.  Install/open the app.
2.  Understand what it does without assistance.
3.  Add a customer.
4.  Enter the amount.
5.  Generate a reminder.
6.  Preview the reminder.
7.  Open WhatsApp.
8.  Send the message.
9.  Mark the customer as paid.
10. Return later and still find the saved data.

The experience should require minimal explanation.

------------------------------------------------------------------------

# 61. Non-Goals

BahiKhata is not trying to:

-   Replace accountants
-   Replace GST software
-   Replace full accounting packages
-   Automate WhatsApp messaging
-   Collect payments automatically
-   Build a CRM
-   Become a banking application
-   Store a central customer database in V1

The product wins by doing one small job extremely well.

------------------------------------------------------------------------

# 62. Product Identity

## Brand

**BahiKhata**

## Brand Concept

Traditional Indian ledger culture + modern mobile utility.

## Product Character

-   Simple
-   Friendly
-   Trustworthy
-   Practical
-   Indian
-   Professional
-   Lightweight

## Suggested Product Description

> **BahiKhata --- Simple payment reminders for your business.**

Possible Indian-language positioning can be developed separately for
Hindi and Bengali audiences.

------------------------------------------------------------------------

# 63. Final V1 Feature Matrix

  Feature                    V1                       Future
  ----------------------- ----- ----------------------------
  Android App               Yes                          ---
  APK                       Yes                          ---
  AAB / Play Store          Yes                          ---
  Customer Management       Yes                     Advanced
  Bulk Entry                Yes                     Advanced
  Excel/Sheets Paste        Yes                          ---
  CSV Import                Yes                     Advanced
  CSV Export                Yes                     Advanced
  Amount Tracking           Yes                     Advanced
  Due Date                  Yes                     Advanced
  Notes                     Yes                     Advanced
  Reminder Templates        Yes                       Custom
  Gentle Reminder           Yes                          ---
  Due Today                 Yes                          ---
  Overdue                   Yes                          ---
  Final Notice              Yes                          ---
  Bengali                   Yes               More languages
  Hindi                     Yes                          ---
  English                   Yes                          ---
  Message Preview           Yes                          ---
  WhatsApp Deep Link        Yes                          ---
  Automatic Sending          No                  Not planned
  WhatsApp Business API      No    Separate product decision
  Mark Paid                 Yes              Payment history
  Local Storage             Yes        Optional backup later
  Login                      No              Future optional
  Cloud Database             No              Future optional
  UPI Collection             No                       Future
  Analytics                  No                       Future
  Multi-user                 No                       Future
  Full Accounting            No   Separate product direction
  Subscription               No                    No for V1

------------------------------------------------------------------------

# 64. Final Product Definition

**BahiKhata is an Android-first, privacy-conscious, lightweight Indian
payment-reminder utility that transforms a simple list of outstanding
customer dues into personalized WhatsApp reminders.**

Its core loop is:

``` text
ADD
 ↓
TRACK
 ↓
GENERATE
 ↓
REVIEW
 ↓
WHATSAPP
 ↓
SEND
 ↓
PAID
```

The product should remain:

> **Small enough to understand in seconds.\
> Fast enough to use every day.\
> Simple enough for a first-time digital user.\
> Useful enough to become a habit.**

------------------------------------------------------------------------

# 65. Recommended Build Boundary

### Build First

``` text
Android shell
+
Main screen
+
Customer entry
+
Local storage
+
Reminder templates
+
Message generation
+
WhatsApp deep link
+
Mark Paid
```

### Add After Validation

``` text
CSV
+
Bulk paste
+
Bengali/Hindi templates
+
Search/filter
+
Export
+
Improved onboarding
```

### Do Not Add to V1

``` text
Backend
+
Cloud database
+
Login
+
WhatsApp API
+
Automatic sending
+
UPI
+
Full accounting
+
Analytics dashboard
```

------------------------------------------------------------------------

# 66. Product Principle

> **BahiKhata should feel like taking the simplicity of a traditional
> khata and giving it one modern superpower: sending a polite payment
> reminder through WhatsApp in seconds.**

------------------------------------------------------------------------

## Source Basis

This specification is based primarily on the supplied
`whatsapp-reminder-generator-spec.md`, which defines the original
product concept, target users, core flow, MVP features, data model,
technology direction, infrastructure approach, risks, and validation
strategy.

The Android-first decision, APK/AAB packaging direction, and related
Android-specific delivery considerations reflect the subsequent product
decision to make **BahiKhata an Android application** while retaining
the original no-account, no-backend, no-WhatsApp-API product philosophy.
