# BahiKhata Domain & Business Logic Skill

## Purpose
Implement and protect core domain rules independent of UI and Android.

## Invoke When
- Changing customer status.
- Changing due-date logic.
- Adding reminder generation rules.
- Changing amount/date behavior.

## Inputs
- Domain requirements
- Customer model
- Template model
- Existing domain utilities

## Outputs
- Pure domain functions
- Typed models
- Validation rules
- Unit tests

## Core Concepts
Customer status: `pending | paid | archived`
Reminder tones: `pre_due | due_today | overdue | final`
Languages: `en | hi | bn`

## Allowed
- Implement pure, deterministic business logic.
- Add domain-level validation.
- Normalize and format business data.

## Forbidden
- Put UI or Android code in domain modules.
- Silently mutate customer status based on an external assumption.
- Claim WhatsApp delivery from link opening.

## Rules
1. Money calculations must avoid unsafe floating-point behavior.
2. Date logic must be deterministic and timezone-aware.
3. Status transitions must be explicit.
4. Business rules must be unit-testable.

## Verification
- Unit tests cover normal, boundary, invalid, and date-transition cases.
- No UI/platform dependency exists in core logic.
