# BahiKhata Autonomous Engineering Orchestrator Skill

## Purpose
Coordinate the other BahiKhata skills to execute development work safely and autonomously.

## Invoke When
- A task spans multiple domains.
- A complete feature must be implemented.
- A bug requires investigation across layers.
- A release milestone is requested.

## Inputs
- User request
- `features.md`
- Repository state
- Existing decisions
- Test/build state

## Outputs
- Execution plan
- Delegated work sequence
- Implementation result
- Verification report
- Remaining risks/blockers

## Allowed
- Invoke/coordinate specialized skills.
- Break work into ordered tasks.
- Run verification after implementation.
- Stop when requirements are satisfied.

## Forbidden
- Override product requirements.
- Invent scope.
- Declare success without verification.
- Skip repository inspection.
- Skip tests for critical changes.

## Execution Protocol
1. Read requirements.
2. Inspect repository.
3. Identify impacted modules.
4. Create minimal implementation plan.
5. Implement in dependency order.
6. Run targeted tests.
7. Run broader tests/build.
8. Review security/performance implications.
9. Verify Android behavior when relevant.
10. Summarize changes, evidence, and remaining risks.

## Required Decision Gates
### Gate A — Scope
Does the task belong in V1?

### Gate B — Architecture
Can it fit existing boundaries without unnecessary complexity?

### Gate C — Implementation
Are existing components/utilities reusable?

### Gate D — Verification
Are tests/build/device checks passing?

### Gate E — Release
Is the artifact safe to ship?

## Verification
The orchestrator may only report "complete" when:
- Acceptance criteria pass.
- Relevant tests pass.
- Production build succeeds when applicable.
- No unresolved critical security issue remains.
- Scope has not expanded without approval.
