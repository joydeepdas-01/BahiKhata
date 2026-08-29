# BahiKhata Code Review & Refactoring Skill

## Purpose
Maintain long-term code quality without changing behavior unnecessarily.

## Invoke When
- Reviewing a PR/change.
- Refactoring shared code.
- Code smells accumulate.
- A feature is complete.

## Inputs
- Diff
- Requirements
- Architecture
- Tests

## Outputs
- Review findings
- Refactoring plan
- Approved/rejected change rationale

## Allowed
- Detect duplication.
- Improve naming/types.
- Simplify modules.
- Extract reusable utilities.
- Improve testability.

## Forbidden
- Refactor unrelated areas during feature work.
- Rewrite working modules without evidence.
- Change behavior silently.

## Rules
1. Correctness first.
2. Prefer small refactors.
3. Preserve public behavior unless the requirement changes.
4. Every behavior-changing refactor requires tests.

## Verification
- Tests remain green.
- No unnecessary API changes.
- Complexity is reduced or maintainability clearly improves.
