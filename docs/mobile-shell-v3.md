# Mobile Shell V3 Architecture

Документ фиксирует первый безопасный слой monorepo-архитектуры для будущих официальных мобильных оболочек Quantum L7 AI.

## Главная формула

```text
Quantum L7 AI Web Core -> Vercel
Android Native Shell -> .aab -> Google Play Console
iOS Native Shell -> Xcode Archive -> TestFlight / App Store
```

Web Core остается главным продуктом. Android и iOS Shell не заменяют Web Core, а становятся официальными мобильными входами в него.

## Границы ответственности

Web Core отвечает за:

- интерфейс;
- API;
- Forum;
- Quantum Wallet;
- QCoin;
- MetaMarket;
- Messenger;
- Academy;
- будущие Quantum Exchange, Quantum Zigzag, Quantum Meta Studio, Quantum Universe и QL7 GameVerse;
- бизнес-логику, экономику, профили, коллекции и i18n.

Native Shell отвечает за:

- безопасный WebView/WKWebView;
- премиальный splash и offline state;
- native Back;
- permissions;
- file upload;
- App Links / Universal Links;
- payment/wallet return;
- минимальный optional bridge.

## Безопасный принцип

Никакая мобильная оболочка не должна:

- дублировать серверную бизнес-логику;
- хранить приватные ключи или seed-фразы;
- исполнять arbitrary JS/eval bridge;
- обходить HTTPS/ATS/SSL;
- превращаться в универсальный браузер.

Если native bridge отсутствует, Web Core должен продолжать работать как обычное web-приложение.

