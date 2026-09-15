# Android Test Matrix

## Устройства

- Android 9 / 10 / 11 / 12 / 13 / 14 / 15.
- Small phone, large phone, foldable/tablet.
- Gesture navigation и three-button navigation.
- Dark mode.
- Slow network и offline.

## Сценарии WebView

- Cold start без белого flash.
- Warm start без session reset.
- Native Back по WebView history.
- External unknown domain не открывается внутри shell.
- App Links возвращают пользователя в shell.
- Remote config fallback работает без сети.

## Media

- Upload image/video.
- Cancel file picker.
- Camera permission allow/deny.
- Microphone permission allow/deny.
- Q-Cast / voice/media flows.
- Fullscreen/inline video.

## Wallet и payments

- `wc:` link.
- Wallet universal link.
- Wallet not installed fallback.
- Payment provider opens externally.
- Payment return не сбрасывает WebView state.

