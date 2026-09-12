# Android Native Bridge Contract

Native bridge называется `QuantumL7Android` и доступен только внутри WebView,
который находится на trusted origin из allowlist.

## Разрешённые команды

- `getAppInfo()` - отдаёт platform, appVersion, buildNumber, shellVersion, environment и версию Android.
- `nativeShare(text, title)` - открывает системный share sheet, максимум 4096 символов.
- `haptic()` - короткий tactile feedback без циклов и таймеров.
- `openExternal(url)` - открывает wallet/payment/support links через OS intent.
- `getSafeAreaInsets()` - возвращает базовую структуру safe-area для будущей интеграции.

## Запрещено

- читать cookies, localStorage, sessionStorage или auth tokens;
- возвращать private keys, seed phrases, wallet signatures;
- исполнять произвольный JavaScript из native;
- выполнять оплату или подпись кошелька на native-стороне;
- читать файлы без user action;
- включать camera/microphone без системного permission prompt.

## Правило расширения

Любая новая bridge-команда должна иметь:

1. trusted-origin проверку;
2. минимальный payload;
3. отсутствие секретов;
4. fallback, при котором Web Core продолжает работать без bridge;
5. отдельную запись в этом документе.
