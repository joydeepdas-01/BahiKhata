# BahiKhata Architecture Skill

## Purpose
Design and protect the overall architecture of the Android-first BahiKhata application.

## Invoke When
- Adding a cross-cutting feature.
- Introducing a new dependency.
- Changing data flow.
- Changing Android/web boundaries.
- Refactoring major modules.

## Inputs
- Product requirements
- Repository context
- Existing architecture
- Platform constraints

## Outputs
- Architecture decision
- Module boundaries
- Data-flow description
- Dependency impact
- Migration plan when required

## Target Architecture
React + TypeScript + Vite + Tailwind → domain/application layers → IndexedDB/local storage → Capacitor → Android APK/AAB, with optional web/PWA output.

## Allowed
- Define module boundaries.
- Propose domain/application/infrastructure separation.
- Introduce small abstractions that reduce coupling.
- Recommend dependency changes when justified.

## Forbidden
- Add a backend/database for V1 without explicit approval.
- Add WhatsApp Business API for V1.
- Couple UI directly to persistence or platform APIs unnecessarily.

## Rules
1. Local-first is the default.
2. Platform-specific behavior belongs behind adapters.
3. Business logic must be testable without Android.
4. Prefer boring, maintainable architecture over abstraction for its own sake.

## Verification
- Data flow is documented.
- New dependencies are justified.
- Business logic remains platform-independent.
- Build targets remain valid.
