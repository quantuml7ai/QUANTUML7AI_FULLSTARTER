# .well-known for Quantum L7 AI Mobile Shell

Папка подготовлена для Android App Links и будущих iOS Universal Links.

## Android

Custom callbacks `quantuml7ai://wc` и `quantuml7ai://auth` работают без `assetlinks.json`.

Verified HTTPS App Links настроены в `assetlinks.json` для:

- `com.quantuml7ai.app` с текущим локальным release-сертификатом;
- `com.quantuml7ai.app.debug` с Android debug-сертификатом.

После включения Google Play App Signing Play Console выдаст отдельный App Signing SHA-256. Его нужно добавить в release-запись, не удаляя fingerprint прямой release-сборки, если она продолжит распространяться отдельно.

## iOS

`apple-app-site-association` не создаётся до утверждения Bundle ID, Apple Team ID и списка universal-link routes.
