# Android Store Metadata Draft

Документ фиксирует, что нужно подготовить для Google Play перед публикацией.

## Listing

- App name: `Quantum L7 AI`.
- Short description: премиальный вход в экосистему Quantum L7 AI.
- Full description: Web Core, Forum, Quantum Wallet, QCoin, MetaMarket, Academy,
  Messenger, будущие GameVerse / MetaStudio / Zigzag модули.
- Feature graphic и screenshots: готовятся отдельно, без хранения секретов.
- Support URL: `https://www.quantuml7ai.com/contact`.
- Privacy URL: `https://www.quantuml7ai.com/privacy`.

## Data Safety

Проверить категории:

- account/profile data;
- user-generated forum/media content;
- messages/DM data;
- wallet/payment interaction metadata;
- diagnostics/crash data, если будет подключена observability.

## Permissions explanation

- Camera: публикация фото/видео и Q-Cast.
- Microphone: voice/media/Q-Cast.
- Photos/videos: загрузка пользовательского контента.
- Internet/network state: работа Web Core и offline handling.

## Review notes

Нужно объяснить, что приложение не является пустой WebView-копией:

- native Back;
- offline/maintenance/force-update states;
- App Links;
- secure navigation allowlist;
- native media permission flow;
- wallet/payment external return;
- native share/haptic bridge;
- remote config / kill switch.
