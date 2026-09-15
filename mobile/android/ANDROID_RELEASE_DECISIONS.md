# Android Release Decisions

## Trusted Web Activity decision

- Production launcher: `com.google.androidbrowserhelper.trusted.LauncherActivity`.
- Web Core and Google/Web3Modal authentication share one verified Chrome browser context.
- Custom auth callbacks are handled by `com.quantuml7ai.app.AuthReturnActivity`.
- `com.quantuml7ai.app.MainActivity` remains a non-exported hardened WebView fallback.
- Domain verification is provided by `public/.well-known/assetlinks.json`.

Этот файл фиксирует утверждённые значения Android-ветки на текущий этап. Он
нужен, чтобы сборка APK/AAB не зависела от устных договорённостей.

## Утверждено

- Scope: Android only. iOS намеренно не входит в эту ветку поставки.
- Android project root: `mobile/android`.
- Package / `applicationId`: `com.quantuml7ai.app`.
- Kotlin namespace: `com.quantuml7ai.app`.
- Main Activity: `com.quantuml7ai.app.MainActivity`.
- Min SDK: `26`.
- Target SDK: `35`.
- Compile SDK: `35`.
- Version code: `1`.
- Version name: `0.1.0`.
- Shell version: `3.0`.
- Runtime environment: `production`.
- Web Core URL: `https://www.quantuml7ai.com`.
- Remote config URL: `https://www.quantuml7ai.com/api/app-shell/config`.
- Debug APK path: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.
- Release AAB path: `mobile/android/app/build/outputs/bundle/release/Quantum L7 AI release 1.0.7.aab`.
- Debug signing: стандартный Android debug certificate, только для LDPlayer / emulator testing.
- Release signing: только внешний keystore, без хранения в репозитории.
- Store payment mode: `review_pending` до финального compliance-решения Google Play.

## Команды для APK / LDPlayer

```powershell
cd mobile/android
.\tools\android-doctor.ps1
.\tools\build-debug-apk.ps1
.\tools\install-ldplayer.ps1
```

Если в среде ещё нет JDK / Android SDK / Gradle / adb, `android-doctor.ps1` покажет, что именно нужно
доставить для сборки и установки APK.

## До Google Play production ещё требуется

- Release keystore вне репозитория.
- SHA256 release fingerprint.
- Реальный `public/.well-known/assetlinks.json` после утверждения fingerprint.
- Google Play Data Safety form.
- Google Play Billing / external payments compliance decision.
- Internal testing на реальных устройствах и LDPlayer/emulator smoke.

## Что не утверждается вслепую

- Gradle Wrapper binary jar не добавляется вручную.
- `assetlinks.json` не создаётся без SHA256 fingerprint.
- Keystore и Play service account JSON не добавляются в репозиторий.
- Store payment mode не переводится из `review_pending` без compliance-решения.
