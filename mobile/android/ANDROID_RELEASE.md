# Android Release

## Локальная подпись

Release signing настроен через игнорируемые Git файлы:

```text
mobile/android/keystore.properties
mobile/android/.signing/quantuml7ai-release.jks
```

Никогда не добавляйте эти файлы в Git. Потеря keystore или пароля лишит возможности обновлять приложение, распространяемое с этой подписью. Сделайте зашифрованную резервную копию вне проекта.

Шаблон:

```text
mobile/android/keystore.properties.example
```

## Сборка

```powershell
cd mobile/android
.\tools\build-debug-apk.ps1
.\tools\build-release.ps1
.\tools\print-signing-fingerprints.ps1
```

Артефакты:

```text
app/build/outputs/apk/debug/app-debug.apk
app/build/outputs/apk/release/Quantum L7 AI release 1.0.7.apk
app/build/outputs/bundle/release/Quantum L7 AI release 1.0.7.aab
```

Gradle initially creates `app-release.apk` and `app-release.aab`; `build-release.ps1` then renames both and updates
`output-metadata.json`. The release folder therefore contains one APK without a duplicate copy.

## Текущий release SHA-256

```text
3D:7B:28:37:71:93:E6:06:0B:7E:9A:BF:74:4D:AA:F6:8D:02:9B:7C:7C:DA:6F:AF:3D:91:C7:43:2E:FD:A4:42
```

Этот fingerprint относится к локальной release-подписи. После загрузки AAB и включения Google Play App Signing взять App Signing SHA-256 из Play Console и добавить его в `public/.well-known/assetlinks.json`.

## Перед публикацией

1. Проверить production URL и `/api/app-shell/config`.
2. Сделать зашифрованную резервную копию `.signing/quantuml7ai-release.jks` и `keystore.properties`.
3. Загрузить AAB во внутреннее тестирование Google Play.
4. Добавить Google Play App Signing SHA-256 в `assetlinks.json`.
5. Проверить WalletConnect/Google return, App Links, login/logout и сохранение WebView-сессии.
6. Проверить privacy policy, Data Safety и payment compliance.
