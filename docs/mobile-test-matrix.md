# Mobile Test Matrix

Этот чеклист нужен для будущих Android/iOS Shell этапов.

## Navigation

- cold start opens `https://www.quantuml7ai.com`;
- warm start keeps state;
- native Back работает предсказуемо;
- unknown domains не открываются в main WebView;
- external browser opens only for allowed external flows.

## Permissions

- camera allow/deny;
- microphone allow/deny;
- photo/video picker;
- file upload;
- cancel file picker;
- avatar upload;
- forum media upload;
- DM media upload.

## Wallet and payments

- payment create;
- payment return;
- webhook-driven final state;
- WalletConnect deep link;
- wallet return without page reset;
- failed payment;
- cancelled payment.

## UI and devices

- iPhone notch;
- Dynamic Island;
- home indicator;
- Android gesture nav;
- tablet layout;
- landscape;
- keyboard with composer;
- MetaMarket popover;
- Quantum Wallet modal;
- video fullscreen.

## Reliability

- offline screen;
- reconnect;
- WebView error;
- HTTP error;
- low memory background/foreground;
- session persistence;
- logout cleanup.

