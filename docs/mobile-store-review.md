# Mobile Store Review Notes

Цель мобильных оболочек Quantum L7 AI — не пустой WebView, а официальный премиальный вход в Web Core с нативной ценностью.

## Нативная ценность

Обязательные слои:

- premium splash;
- offline screen;
- native Back;
- secure navigation;
- file upload;
- camera/microphone permissions;
- App Links / Universal Links;
- payment return;
- wallet return;
- support/privacy/terms links;
- stable session;
- optional native share.

## Пояснение для review

Приложение открывает основной Quantum L7 AI Web Core, потому что Web Core является главным цифровым продуктом экосистемы. Native Shell добавляет безопасную мобильную оболочку, permissions, navigation, file upload, offline handling and return flows.

## Что проверять перед отправкой

- нет SSL bypass;
- нет unknown domains inside main WebView;
- нет debug WebView в release;
- permissions объяснены человеческим языком;
- payment policy проверена для digital goods;
- privacy policy и support URL доступны;
- auth/session сохраняются стабильно;
- logout реально завершает session.

