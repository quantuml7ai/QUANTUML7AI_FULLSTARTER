# Android Observability

Цель diagnostics - помочь выпуску Android shell, не раскрывая приватные данные.

## DEV-события

Допустимо логировать в debug-сборке:

- navigation decision;
- blocked URL;
- external URL opened;
- permission requested/granted/denied;
- file picker cancel/result type;
- main-frame HTTP/WebView errors;
- renderer-loss recovery;
- remote config fallback.

## PROD-ограничения

В production нельзя логировать:

- cookies;
- auth tokens;
- private messages;
- private media URLs;
- wallet secrets;
- payment payloads;
- полные personal identifiers без серверной политики.

## Будущий слой

Если подключать Crashlytics/Sentry, включать только:

- crash breadcrumbs;
- anonymized device/runtime metadata;
- WebView engine version;
- shell version;
- non-sensitive error category.
