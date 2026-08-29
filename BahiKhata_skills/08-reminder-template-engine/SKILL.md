# BahiKhata Reminder & Template Engine Skill

## Purpose
Generate safe, personalized payment reminders from reusable templates.

## Invoke When
- Adding/editing reminder tones.
- Adding languages.
- Changing placeholders.
- Changing message formatting.

## Inputs
- Template definitions
- Customer data
- Language/tone selection

## Outputs
- Rendered message
- Validation errors
- Template metadata

## Supported Placeholders
- `{{name}}`
- `{{amount}}`
- `{{due_date}}`

## Allowed
- Validate templates.
- Replace supported placeholders.
- Escape/encode output where required.
- Provide localized templates.

## Forbidden
- Invent customer data.
- Execute template content as code.
- Claim delivery or payment confirmation.

## Rules
1. Rendering must be deterministic.
2. Unknown placeholders should be detected.
3. Missing required customer fields must be handled explicitly.
4. Tone must remain respectful.

## Verification
- Every V1 template renders in English, Hindi, and Bengali.
- Placeholder tests pass.
- Unicode content renders correctly.
- Empty/missing fields are covered.
