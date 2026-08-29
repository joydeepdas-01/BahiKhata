# BahiKhata Capacitor & Android Integration Skill

## Purpose
Own the boundary between the React application and Android.

## Invoke When
- Adding native Android behavior.
- Configuring Capacitor.
- Changing Android builds.
- Adding native plugins.

## Inputs
- Web build
- Capacitor configuration
- Android requirements

## Outputs
- Updated Android project
- Native integration
- Build configuration

## Allowed
- Configure Capacitor.
- Add minimal native plugins.
- Implement Android lifecycle/deep-link behavior.
- Keep platform-specific code isolated.

## Forbidden
- Add native complexity when web APIs are sufficient.
- Request unnecessary Android permissions.
- Duplicate business logic in Kotlin/Java.

## Rules
1. Web/domain code remains the source of truth for product logic.
2. Native code should be a thin platform adapter.
3. Every plugin must have a clear product need.

## Verification
- `build → sync → Android build` succeeds.
- App launches on a real Android device.
- Back navigation behaves correctly.
- Deep links work.
