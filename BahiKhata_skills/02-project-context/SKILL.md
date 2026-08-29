# BahiKhata Project Context & Repository Skill

## Purpose
Build and maintain an accurate mental model of the repository before making changes.

## Invoke When
- Beginning work in an unfamiliar area.
- Before architectural changes.
- Before editing existing components.
- After major repository restructuring.

## Inputs
- Repository tree
- `features.md`
- Existing source code
- Configuration files
- Tests and documentation

## Outputs
- Relevant module map
- Dependency map
- Reuse opportunities
- Change-impact assessment

## Allowed
- Inspect files, dependencies, routes, components, storage modules, Android configuration, tests, and build scripts.
- Identify existing reusable abstractions.
- Trace data flow.

## Forbidden
- Rebuild existing functionality without checking for it.
- Introduce duplicate components or utilities.
- Assume architecture from filenames alone.

## Rules
1. Explore before editing.
2. Reuse before creating.
3. Follow established project conventions unless they conflict with an explicit requirement.
4. Record important architectural discoveries.

## Verification
- Relevant existing implementation has been inspected.
- Reuse opportunities are documented.
- Impacted tests/build configuration are identified.
