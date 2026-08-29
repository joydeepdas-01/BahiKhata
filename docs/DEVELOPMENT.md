# BahiKhata Development & Contribution Guide

This guide covers local environment setup, running tests, building web assets, syncing Capacitor, and building Android APKs.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **JDK**: JDK 21 (`hotspot`)
- **Android SDK**: API 34 SDK with Platform Tools (`adb`)

---

## 2. Environment Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/dhrubesh/BahiKhata.git
cd BahiKhata
npm install
```

---

## 3. Available npm Scripts

```bash
# Start Vite development server
npm run dev

# Run full TypeScript type-check and Vite production build
npm run build

# Run Vitest unit test suite
npx vitest run

# Run Oxlint static linter
npm run lint
```

---

## 4. Android Build & Deployment

### Sync Web Build to Capacitor
```bash
npm run build
npx cap sync android
```

### Build Android APK via Gradle
```bash
cd android
./gradlew assembleDebug
./gradlew assembleRelease
./gradlew bundleRelease
```

### Install onto Connected Android Phone via ADB
```bash
adb devices -l
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.bahikhata.app/.MainActivity
```
