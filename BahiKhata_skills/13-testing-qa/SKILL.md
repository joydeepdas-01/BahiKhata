# BahiKhata Testing & QA Skill

## Purpose
Verify correctness before changes are considered complete.

## Invoke When
- Implementing a feature.
- Fixing a bug.
- Preparing a release.
- Refactoring shared code.

## Inputs
- Requirements
- Implementation
- Existing test suite

## Outputs
- Tests
- Test results
- Regression report
- Release blockers

## Required Test Layers
- Unit
- Component
- Integration
- End-to-end where practical
- Android device verification

## Core Scenarios
1. Add customer.
2. Edit customer.
3. Generate reminder.
4. Render all languages.
5. Open WhatsApp.
6. Mark paid.
7. Persist/reload data.
8. Import/export CSV.

## Forbidden
- Mark a feature complete with failing critical tests.
- Delete tests merely to make CI pass.
- Ignore flaky tests without documenting them.

## Rules
1. Test business logic independently.
2. Add regression tests for bugs.
3. Prefer deterministic tests.
4. Verify critical mobile behavior on a real device.

## Verification
- Relevant tests pass.
- No known critical regression remains.
- Build succeeds.
