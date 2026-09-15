# Quantum L7 AI Android Native Shell

## Release browser context

The production launcher uses `QuantumLauncherActivity`, a verified Chrome Trusted Web Activity launcher
for the Web Core. This is required
for Google OAuth and Web3Modal/AppKit because Google blocks OAuth inside embedded WebViews and the
authentication result must return to the same browser storage and popup context that started it.

`MainActivity` remains in the project as a hardened internal WebView fallback. The release launcher is
`QuantumLauncherActivity`; native auth callbacks are accepted by
`AuthReturnActivity` and returned to the trusted Web Activity.

The launcher also requests Android notification permission. TWA notification delegation and the
Web Core service worker synchronize the combined forum and MetaMarket unread badge. See
`ANDROID_NOTIFICATIONS.md`.

Эта папка содержит Android Native Shell для Quantum L7 AI. Shell не
дублирует бизнес-логику Web Core и не переносит продукт в native. Его задача:
безопасно открыть production Web Core внутри премиального Android WebView.

Основной URL:

```text
https://www.quantuml7ai.com
```

## Что заложено

- Kotlin Android project в `mobile/android`.
- Android WebView с JavaScript, DOM storage, cookies, IndexedDB/localStorage.
- Persistent cookies через `CookieManager` и flush при lifecycle-переходах.
- Native Back: сначала история WebView, затем закрытие приложения.
- Offline / blocked / maintenance / force-update состояния без белого flash.
- Allowlist доменов: `quantuml7ai.com`, `www.quantuml7ai.com` и remote config.
- Запрет неизвестных доменов внутри основного WebView.
- External opening для wallet/payment links через OS intent.
- `WebChromeClient` с `onShowFileChooser` и `onPermissionRequest`.
- Camera / microphone / media picker permissions.
- App Links intent-filter для production-доменов.
- Remote config endpoint `/api/app-shell/config`.
- Minimal native bridge только для trusted WebView origins.
- Safe Browsing, strict HTTPS, no SSL bypass, no cleartext traffic.
- Renderer-loss recovery: shell пересоздаёт WebView и показывает безопасный state.
- Android 12+ data extraction rules: auth/cookies/local data не уходят в backup/transfer.
- Native strings для базовых shell-состояний на 7 языках проекта.

## Что Android Shell не делает

- Не хранит private keys, seed-фразы, auth tokens, payment secrets.
- Не выполняет wallet signature и payment logic на native-стороне.
- Не открывает unknown domains внутри WebView.
- Не подменяет Forum, Wallet, MetaMarket, Messenger, QCoin logic.
- Не требует изменений Web Core для обычного браузера или Telegram Mini App.

## Сборка

Открыть Android Studio:

```text
mobile/android
```

Debug build:

```powershell
cd mobile/android
gradle :app:assembleDebug
```

Release AAB:

```powershell
cd mobile/android
gradle :app:bundleRelease
```

Ожидаемый артефакт:

```text
mobile/android/app/build/outputs/bundle/release/Quantum L7 AI release 1.0.7.aab
```

Если в среде добавлен Gradle Wrapper, можно использовать:

```powershell
./gradlew :app:bundleRelease
```

Wrapper jar специально не хранится и не генерируется вслепую. Подробности:
`GRADLE_WRAPPER.md`.

Для LDPlayer / эмулятора:

```powershell
cd mobile/android
.\tools\android-doctor.ps1
.\tools\build-debug-apk.ps1
.\tools\install-ldplayer.ps1
```

Подробный сценарий: `LDPLAYER_TESTING.md`.

## Перед production-релизом

1. Утвердить финальный `applicationId`.
2. Подготовить release keystore вне репозитория.
3. Добавить реальный `assetlinks.json` в `public/.well-known/` после SHA256 fingerprint.
4. Проверить Google Play Billing / external payment policy.
5. Пройти Android internal testing на реальных устройствах.
6. Проверить App Links, wallet return, payment return, media upload и Q-Cast.

## Android-документы рядом

- `ANDROID_SECURITY.md`
- `ANDROID_RELEASE.md`
- `ANDROID_TEST_MATRIX.md`
- `ANDROID_APP_LINKS.md`
- `ANDROID_REMOTE_CONFIG.md`
- `ANDROID_RELEASE_DECISIONS.md`
- `ANDROID_NATIVE_BRIDGE.md`
- `ANDROID_MEDIA_PERMISSIONS.md`
- `ANDROID_WALLET_PAYMENT.md`
- `ANDROID_OBSERVABILITY.md`
- `ANDROID_NOTIFICATIONS.md`
- `ANDROID_STORE_METADATA.md`
- `ANDROID_ACCEPTANCE_CHECKLIST.md`
- `GRADLE_WRAPPER.md`
- `LDPLAYER_TESTING.md`
