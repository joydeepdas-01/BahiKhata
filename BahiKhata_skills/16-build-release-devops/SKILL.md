# BahiKhata Build, Release & DevOps Skill

## Purpose
Produce repeatable, trustworthy Android and web builds.

## Invoke When
- Creating APK/AAB.
- Preparing releases.
- Changing build configuration.
- Setting up CI/CD.

## Inputs
- Source repository
- Version
- Build configuration
- Release requirements

## Outputs
- Debug APK
- Release APK when needed
- AAB for Play Store
- Build artifacts
- Release notes

## Allowed
- Configure build scripts.
- Automate tests/builds.
- Manage versioning.
- Produce release artifacts.

## Forbidden
- Commit signing keys/secrets.
- Ship debug configuration as production.
- Skip release verification.

## Rules
1. Secrets must remain outside source control.
2. Release builds must be reproducible.
3. Version code/name must be updated intentionally.
4. Production builds require passing verification.

## Verification
- Clean checkout builds successfully.
- Tests pass before release.
- APK installs.
- AAB is generated successfully.
- Release configuration is verified.
