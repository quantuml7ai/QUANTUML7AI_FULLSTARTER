# Mobile Release Guide

Этот документ фиксирует будущий release-подход для Android и iOS оболочек Quantum L7 AI.

## Web Core

Web Core деплоится на Vercel из production-ветки:

```text
https://www.quantuml7ai.com
```

Mobile shell должен открывать именно production URL, если не включен отдельный test/staging режим.

## Android

Будущая release-сборка:

```powershell
cd mobile/android
./gradlew clean bundleRelease
```

Публикуемый артефакт:

```text
mobile/android/app/build/outputs/bundle/release/app-release.aab
```

Release flow:

1. internal testing;
2. device QA;
3. closed testing, если нужно;
4. production rollout.

## iOS

Будущая release-сборка:

```text
Open mobile/ios/QuantumL7AI.xcodeproj
Product -> Archive -> Distribute App
```

Release flow:

1. TestFlight;
2. review notes;
3. App Store review;
4. staged release.

## Секреты

В репозиторий нельзя добавлять:

- Android keystore;
- Apple certificates;
- provisioning profiles;
- App Store Connect API key;
- Google Play service-account JSON;
- payment secrets;
- wallet secrets.

