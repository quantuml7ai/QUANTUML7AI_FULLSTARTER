# Android Remote Config

Android Shell читает:

```text
https://www.quantuml7ai.com/api/app-shell/config
```

## Что поддерживается

- `minAndroidBuild`
- `maintenanceMode`
- `forceUpdate`
- `softUpdate`
- `paymentMode`
- `mainUrl`
- `allowedDomains`
- `externalPaymentDomains`
- `walletSchemes`
- `remoteKillSwitches`
- `supportUrl`
- `privacyUrl`
- `termsUrl`

## Поведение

- Последний валидный config сохраняется в `SharedPreferences`.
- Если config недоступен, shell использует cached config или safe default.
- `forceUpdate` или слишком старый `versionCode` блокирует runtime экраном обновления.
- `maintenanceMode` показывает нативное service-state окно.
- `allowedDomains` управляет тем, что можно открыть внутри основного WebView.
- Wallet/payment links открываются внешним intent и не превращают shell в браузер.

## Default safety

До store-compliance решения:

```text
paymentMode = review_pending
```

Это защищает mobile release от случайного запуска неподтверждённых digital-goods
payment сценариев в магазине.

