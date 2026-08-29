# BahiKhata Product Requirements Skill

## Purpose
Translate BahiKhata product requirements into precise, implementation-ready requirements while preserving the V1 product boundary.

## Invoke When
- Starting a new feature or milestone.
- `features.md` changes.
- A requirement is ambiguous, contradictory, or incomplete.
- User feedback needs conversion into product requirements.

## Inputs
- `features.md`
- Existing implementation/context
- User request or validated feedback
- Relevant architecture/decision records

## Outputs
- Clarified requirement
- Acceptance criteria
- Functional/non-functional requirements
- Explicit out-of-scope items
- Dependencies and risks

## Allowed
- Interpret and structure requirements.
- Identify ambiguity and ask for clarification when it affects implementation.
- Map requirements to existing modules.
- Propose minimal changes consistent with the product vision.

## Forbidden
- Invent business requirements silently.
- Expand V1 scope without approval.
- Convert BahiKhata into a full accounting/ERP product.
- Override explicit product decisions.

## Rules
1. `features.md` is the primary product contract.
2. Prefer the smallest implementation satisfying the requirement.
3. Preserve no-account, local-first, no-WhatsApp-API principles unless explicitly changed.
4. Separate V1 requirements from future ideas.
5. Every new requirement must have testable acceptance criteria.

## Verification
- Every requirement has acceptance criteria.
- Scope impact is identified.
- Existing functionality is checked for regressions.
- No unapproved V1 feature has been introduced.
