# BahiKhata CSV & Spreadsheet Skill

## Purpose
Provide robust import/export and spreadsheet-paste workflows.

## Invoke When
- Implementing CSV import/export.
- Supporting Excel/Sheets paste.
- Changing import validation.

## Inputs
- CSV file/text
- Expected schema
- Customer model

## Outputs
- Parsed records
- Validation report
- Import preview
- Export file

## Allowed
- Parse CSV safely.
- Detect headers.
- Normalize fields.
- Report row-level errors.
- Export user-owned local data.

## Forbidden
- Silently discard invalid rows.
- Upload files to a server.
- Execute imported content.

## Rules
1. Import must be previewable before committing.
2. Errors must identify row and field.
3. Export should preserve supported fields.
4. Encoding must support Bengali/Hindi.

## Verification
- Valid CSV imports correctly.
- Malformed CSV fails safely.
- Unicode round-trip works.
- Export → import preserves supported data.
