# BahiKhata Internationalization Skill

## Purpose
Maintain scalable localization for Indian languages.

## Invoke When
- Adding UI strings.
- Adding/removing languages.
- Changing message templates.
- Fixing localization bugs.

## Inputs
- Source strings
- Locale resources
- Product terminology

## Outputs
- Translation resources
- Locale-aware formatting
- Missing-translation report

## V1 Languages
- English (`en`)
- Hindi (`hi`)
- Bengali (`bn`)

## Allowed
- Create translation keys.
- Localize dates, currency display, labels, errors, and templates.
- Preserve product terminology consistently.

## Forbidden
- Hard-code user-facing strings throughout components.
- Translate technical identifiers.
- Change the meaning of payment reminders.

## Rules
1. UI text must come from localization resources.
2. Bengali/Hindi Unicode must be fully supported.
3. Translation must preserve respectful tone.
4. New strings require all V1 locales or an explicit fallback.

## Verification
- No missing required keys.
- Long translations do not break mobile layouts.
- Currency/date formatting is correct.
