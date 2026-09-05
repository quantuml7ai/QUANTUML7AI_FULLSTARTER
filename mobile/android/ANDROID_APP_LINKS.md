# Android App Links And Auth Return

Android Shell принимает два безопасных канала возврата:

```text
quantuml7ai://wc
quantuml7ai://auth
```

и production App Links:

```text
https://www.quantuml7ai.com
https://quantuml7ai.com
```

## Возврат после WalletConnect / Google / кошелька

- `MainActivity` работает в режиме `singleTask`, поэтому возврат приходит в существующий экземпляр через `onNewIntent`.
- Custom scheme не перезагружает текущую страницу и не уничтожает pending-состояние WalletConnect/wagmi.
- После возврата живой WebView получает события `ql7:mobile-return`, `focus`, `online` и `visibilitychange`.
- Если внешняя авторизация вернула Activity без deep link, Android lifecycle-resume всё равно будит frontend.
- AppKit metadata содержит `redirect.native = quantuml7ai://wc`.

Проверка через adb:

```powershell
adb shell am start -W -a android.intent.action.VIEW -d "quantuml7ai://wc"
adb shell am start -W -a android.intent.action.VIEW -d "quantuml7ai://auth"
```

Обе команды должны вернуть пользователя в уже открытое приложение без пересоздания WebView и без потери текущего экрана.

## Verified HTTPS App Links

Файл создан:

```text
public/.well-known/assetlinks.json
```

Текущие fingerprints:

```text
release com.quantuml7ai.app:
3D:7B:28:37:71:93:E6:06:0B:7E:9A:BF:74:4D:AA:F6:8D:02:9B:7C:7C:DA:6F:AF:3D:91:C7:43:2E:FD:A4:42

debug com.quantuml7ai.app.debug:
13:E6:62:C2:12:38:D1:C8:BD:12:CF:03:7C:89:85:8A:EE:E6:14:E2:57:3C:0C:EB:3E:79:A4:29:54:EF:F1:5E
```

Проверить fingerprints собранных APK:

```powershell
.\tools\print-signing-fingerprints.ps1
```

`assetlinks.json` должен обслуживаться по HTTPS без redirect loop:

```text
https://www.quantuml7ai.com/.well-known/assetlinks.json
```

После включения Google Play App Signing добавить App Signing SHA-256 из Play Console в release-запись `assetlinks.json`.
