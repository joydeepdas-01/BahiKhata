# BahiKhata V1.0.0 Release Documentation

This document describes the release procedure, APK signing policy, and verification checksums for **BahiKhata V1.0.0**.

---

## 1. V1.0.0 Release Artifacts

The official downloadable APK release binary is packaged in the repository:

- **File Path**: `releases/v1.0.0/BahiKhata-v1.0.0.apk`
- **Checksum Manifest**: `releases/v1.0.0/SHA256SUMS.txt`
- **SHA-256 Checksum**: `57fdccd4c7fb724247c49e61e868a4c4112902b00ca1fb81fe326b46c692ff5c`

---

## 2. Signing Policy & Transparency Statement

- **Open-Source Distribution APK**: The V1.0.0 binary provided in the `releases/v1.0.0/` folder is compiled and signed using the standard Android debug keystore. It is **fully installable** on any Android 8.0+ device via standard APK sideloading or ADB.
- **Private Production Keystore**: In compliance with security best practices, private production keystores (`.jks`) and signing credentials are **never committed to public Git repositories**.
- **Play Store Deployment**: For production Google Play Store publishing, an AAB (`app-release.aab`) is compiled via `./gradlew bundleRelease` and signed via private CI/CD release secrets.

---

## 3. How to Verify SHA-256 Checksum

### On Linux / macOS:
```bash
sha256sum releases/v1.0.0/BahiKhata-v1.0.0.apk
```

### On Windows PowerShell:
```powershell
(Get-FileHash releases\v1.0.0\BahiKhata-v1.0.0.apk -Algorithm SHA256).Hash.ToLower()
```
