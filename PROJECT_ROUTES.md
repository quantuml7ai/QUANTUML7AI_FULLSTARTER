# PROJECT_ROUTES.md

> Обязательное правило сопровождения:
> Любое изменение маршрутов, страниц, layout-файлов, loading/not-found/default файлов и API-route файлов обязано сопровождаться обновлением этого файла.
> Рекомендуемый способ обновления: `node tools/generate-project-routes.js`.

Сгенерировано автоматически: 2026-04-16T21:56:30.854Z
Всего route-aware файлов: 96
Пользовательских route-сущностей: 21
API-route сущностей: 75

## Охват

- Все страницы Next.js (`page.js|jsx`)
- Все `layout`, `loading`, `not-found`, `default` файлы
- Все route handlers, включая `app/api/**/route.js` и не-API `route.js`

## Пользовательские Маршруты И Route Handlers

### about

- `/about` — layout маршрута `/about`; файл: `app/about/layout.js`; тип: `layout`.
- `/about` — страница маршрута `/about`; файл: `app/about/page.js`; тип: `page`.

### academy

- `/academy` — layout маршрута `/academy`; файл: `app/academy/layout.js`; тип: `layout`.
- `/academy` — страница маршрута `/academy`; файл: `app/academy/page.js`; тип: `page`.

### ads

- `/ads` — layout маршрута `/ads`; файл: `app/ads/layout.js`; тип: `layout`.
- `/ads` — страница маршрута `/ads`; файл: `app/ads/page.jsx`; тип: `page`.

### contact

- `/contact` — страница маршрута `/contact`; файл: `app/contact/page.js`; тип: `page`.

### exchange

- `/exchange` — layout маршрута `/exchange`; файл: `app/exchange/layout.js`; тип: `layout`.
- `/exchange` — страница маршрута `/exchange`; файл: `app/exchange/page.js`; тип: `page`.

### forum

- `/forum` — layout маршрута `/forum`; файл: `app/forum/layout.js`; тип: `layout`.
- `/forum` — loading-состояние маршрута `/forum`; файл: `app/forum/loading.js`; тип: `loading`.
- `/forum` — страница маршрута `/forum`; файл: `app/forum/page.js`; тип: `page`.
- `/forum/p/[postId]` — route handler маршрута `/forum/p/[postId]`; файл: `app/forum/p/[postId]/route.js`; тип: `route-handler`.

### game

- `/game` — layout маршрута `/game`; файл: `app/game/layout.js`; тип: `layout`.
- `/game` — страница маршрута `/game`; файл: `app/game/page.js`; тип: `page`.

### privacy

- `/privacy` — страница маршрута `/privacy`; файл: `app/privacy/page.js`; тип: `page`.

### root

- `/` — layout корневого маршрута; файл: `app/layout.js`; тип: `layout`.
- `/` — страница корневого маршрута; файл: `app/page.js`; тип: `page`.

### subscribe

- `/subscribe` — layout маршрута `/subscribe`; файл: `app/subscribe/layout.js`; тип: `layout`.
- `/subscribe` — страница маршрута `/subscribe`; файл: `app/subscribe/page.js`; тип: `page`.

### tma

- `/tma/auto` — страница маршрута `/tma/auto`; файл: `app/tma/auto/page.jsx`; тип: `page`.

## API Маршруты

### api/_diag

- `/api/_diag` — API-эндпоинт `/api/_diag`; файл: `app/api/_diag/route.js`; тип: `api-route`.

### api/academy

- `/api/academy/exam` — API-эндпоинт `/api/academy/exam`; файл: `app/api/academy/exam/route.js`; тип: `api-route`.

### api/ads

- `/api/ads` — API-эндпоинт `/api/ads`; файл: `app/api/ads/route.js`; тип: `api-route`.

### api/aiquota

- `/api/aiquota/usage` — API-эндпоинт `/api/aiquota/usage`; файл: `app/api/aiquota/usage/route.js`; тип: `api-route`.

### api/battlecoin

- `/api/battlecoin/order` — API-эндпоинт `/api/battlecoin/order`; файл: `app/api/battlecoin/order/route.js`; тип: `api-route`.
- `/api/battlecoin/state` — API-эндпоинт `/api/battlecoin/state`; файл: `app/api/battlecoin/state/route.js`; тип: `api-route`.

### api/brain

- `/api/brain/analyze` — API-эндпоинт `/api/brain/analyze`; файл: `app/api/brain/analyze/route.js`; тип: `api-route`.

### api/coins

- `/api/coins` — API-эндпоинт `/api/coins`; файл: `app/api/coins/route.js`; тип: `api-route`.

### api/contact

- `/api/contact` — API-эндпоинт `/api/contact`; файл: `app/api/contact/route.js`; тип: `api-route`.

### api/crypto-news

- `/api/crypto-news` — API-эндпоинт `/api/crypto-news`; файл: `app/api/crypto-news/route.js`; тип: `api-route`.

### api/debug

- `/api/debug/forum-diag` — API-эндпоинт `/api/debug/forum-diag`; файл: `app/api/debug/forum-diag/route.js`; тип: `api-route`.

### api/deep-translate

- `/api/deep-translate` — API-эндпоинт `/api/deep-translate`; файл: `app/api/deep-translate/route.js`; тип: `api-route`.

### api/dm

- `/api/dm/block` — API-эндпоинт `/api/dm/block`; файл: `app/api/dm/block/route.js`; тип: `api-route`.
- `/api/dm/delete` — API-эндпоинт `/api/dm/delete`; файл: `app/api/dm/delete/route.js`; тип: `api-route`.
- `/api/dm/dialogs` — API-эндпоинт `/api/dm/dialogs`; файл: `app/api/dm/dialogs/route.js`; тип: `api-route`.
- `/api/dm/seen` — API-эндпоинт `/api/dm/seen`; файл: `app/api/dm/seen/route.js`; тип: `api-route`.
- `/api/dm/send` — API-эндпоинт `/api/dm/send`; файл: `app/api/dm/send/route.js`; тип: `api-route`.
- `/api/dm/thread` — API-эндпоинт `/api/dm/thread`; файл: `app/api/dm/thread/route.js`; тип: `api-route`.
- `/api/dm/unblock` — API-эндпоинт `/api/dm/unblock`; файл: `app/api/dm/unblock/route.js`; тип: `api-route`.

### api/forum

- `/api/forum/admin/banUser` — API-эндпоинт `/api/forum/admin/banUser`; файл: `app/api/forum/admin/banUser/route.js`; тип: `api-route`.
- `/api/forum/admin/deletePost` — API-эндпоинт `/api/forum/admin/deletePost`; файл: `app/api/forum/admin/deletePost/route.js`; тип: `api-route`.
- `/api/forum/admin/deleteTopic` — API-эндпоинт `/api/forum/admin/deleteTopic`; файл: `app/api/forum/admin/deleteTopic/route.js`; тип: `api-route`.
- `/api/forum/admin/unbanUser` — API-эндпоинт `/api/forum/admin/unbanUser`; файл: `app/api/forum/admin/unbanUser/route.js`; тип: `api-route`.
- `/api/forum/admin/verify` — API-эндпоинт `/api/forum/admin/verify`; файл: `app/api/forum/admin/verify/route.js`; тип: `api-route`.
- `/api/forum/blobUploadUrl` — API-эндпоинт `/api/forum/blobUploadUrl`; файл: `app/api/forum/blobUploadUrl/route.js`; тип: `api-route`.
- `/api/forum/events/stream` — API-эндпоинт `/api/forum/events/stream`; файл: `app/api/forum/events/stream/route.js`; тип: `api-route`.
- `/api/forum/mediaLock` — API-эндпоинт `/api/forum/mediaLock`; файл: `app/api/forum/mediaLock/route.js`; тип: `api-route`.
- `/api/forum/moderate` — API-эндпоинт `/api/forum/moderate`; файл: `app/api/forum/moderate/route.js`; тип: `api-route`.
- `/api/forum/mutate` — API-эндпоинт `/api/forum/mutate`; файл: `app/api/forum/mutate/route.js`; тип: `api-route`.
- `/api/forum/own` — API-эндпоинт `/api/forum/own`; файл: `app/api/forum/own/route.js`; тип: `api-route`.
- `/api/forum/post-by-id` — API-эндпоинт `/api/forum/post-by-id`; файл: `app/api/forum/post-by-id/route.js`; тип: `api-route`.
- `/api/forum/post-chain` — API-эндпоинт `/api/forum/post-chain`; файл: `app/api/forum/post-chain/route.js`; тип: `api-route`.
- `/api/forum/post-locate` — API-эндпоинт `/api/forum/post-locate`; файл: `app/api/forum/post-locate/route.js`; тип: `api-route`.
- `/api/forum/post-meta` — API-эндпоинт `/api/forum/post-meta`; файл: `app/api/forum/post-meta/route.js`; тип: `api-route`.
- `/api/forum/recommendations/users` — API-эндпоинт `/api/forum/recommendations/users`; файл: `app/api/forum/recommendations/users/route.js`; тип: `api-route`.
- `/api/forum/report` — API-эндпоинт `/api/forum/report`; файл: `app/api/forum/report/route.js`; тип: `api-route`.
- `/api/forum/snapshot` — API-эндпоинт `/api/forum/snapshot`; файл: `app/api/forum/snapshot/route.js`; тип: `api-route`.
- `/api/forum/subs/count` — API-эндпоинт `/api/forum/subs/count`; файл: `app/api/forum/subs/count/route.js`; тип: `api-route`.
- `/api/forum/subs/list` — API-эндпоинт `/api/forum/subs/list`; файл: `app/api/forum/subs/list/route.js`; тип: `api-route`.
- `/api/forum/subs/my-count` — API-эндпоинт `/api/forum/subs/my-count`; файл: `app/api/forum/subs/my-count/route.js`; тип: `api-route`.
- `/api/forum/subs/toggle` — API-эндпоинт `/api/forum/subs/toggle`; файл: `app/api/forum/subs/toggle/route.js`; тип: `api-route`.
- `/api/forum/upload` — API-эндпоинт `/api/forum/upload`; файл: `app/api/forum/upload/route.js`; тип: `api-route`.
- `/api/forum/uploadAudio` — API-эндпоинт `/api/forum/uploadAudio`; файл: `app/api/forum/uploadAudio/route.js`; тип: `api-route`.
- `/api/forum/uploadVideo` — API-эндпоинт `/api/forum/uploadVideo`; файл: `app/api/forum/uploadVideo/route.js`; тип: `api-route`.
- `/api/forum/vip/batch` — API-эндпоинт `/api/forum/vip/batch`; файл: `app/api/forum/vip/batch/route.js`; тип: `api-route`.
- `/api/forum/wa-preview` — API-эндпоинт `/api/forum/wa-preview`; файл: `app/api/forum/wa-preview/route.js`; тип: `api-route`.

### api/market

- `/api/market/summary` — API-эндпоинт `/api/market/summary`; файл: `app/api/market/summary/route.js`; тип: `api-route`.

### api/pay

- `/api/pay/create` — API-эндпоинт `/api/pay/create`; файл: `app/api/pay/create/route.js`; тип: `api-route`.
- `/api/pay/webhook` — API-эндпоинт `/api/pay/webhook`; файл: `app/api/pay/webhook/route.js`; тип: `api-route`.

### api/payments

- `/api/payments/demo/complete` — API-эндпоинт `/api/payments/demo/complete`; файл: `app/api/payments/demo/complete/route.js`; тип: `api-route`.
- `/api/payments/now/create` — API-эндпоинт `/api/payments/now/create`; файл: `app/api/payments/now/create/route.js`; тип: `api-route`.
- `/api/payments/now/webhook` — API-эндпоинт `/api/payments/now/webhook`; файл: `app/api/payments/now/webhook/route.js`; тип: `api-route`.

### api/profile

- `/api/profile/batch` — API-эндпоинт `/api/profile/batch`; файл: `app/api/profile/batch/route.js`; тип: `api-route`.
- `/api/profile/check-nick` — API-эндпоинт `/api/profile/check-nick`; файл: `app/api/profile/check-nick/route.js`; тип: `api-route`.
- `/api/profile/get-about` — API-эндпоинт `/api/profile/get-about`; файл: `app/api/profile/get-about/route.js`; тип: `api-route`.
- `/api/profile/get-profile` — API-эндпоинт `/api/profile/get-profile`; файл: `app/api/profile/get-profile/route.js`; тип: `api-route`.
- `/api/profile/save-nick` — API-эндпоинт `/api/profile/save-nick`; файл: `app/api/profile/save-nick/route.js`; тип: `api-route`.
- `/api/profile/set-about` — API-эндпоинт `/api/profile/set-about`; файл: `app/api/profile/set-about/route.js`; тип: `api-route`.
- `/api/profile/upload-avatar` — API-эндпоинт `/api/profile/upload-avatar`; файл: `app/api/profile/upload-avatar/route.js`; тип: `api-route`.
- `/api/profile/user-popover` — API-эндпоинт `/api/profile/user-popover`; файл: `app/api/profile/user-popover/route.js`; тип: `api-route`.

### api/qcoin

- `/api/qcoin/drop` — API-эндпоинт `/api/qcoin/drop`; файл: `app/api/qcoin/drop/route.js`; тип: `api-route`.
- `/api/qcoin/get` — API-эндпоинт `/api/qcoin/get`; файл: `app/api/qcoin/get/route.js`; тип: `api-route`.
- `/api/qcoin/heartbeat` — API-эндпоинт `/api/qcoin/heartbeat`; файл: `app/api/qcoin/heartbeat/route.js`; тип: `api-route`.

### api/quest

- `/api/quest/env` — API-эндпоинт `/api/quest/env`; файл: `app/api/quest/env/route.js`; тип: `api-route`.
- `/api/quest/progress` — API-эндпоинт `/api/quest/progress`; файл: `app/api/quest/progress/route.js`; тип: `api-route`.
- `/api/quest/status` — API-эндпоинт `/api/quest/status`; файл: `app/api/quest/status/route.js`; тип: `api-route`.

### api/quotes

- `/api/quotes` — API-эндпоинт `/api/quotes`; файл: `app/api/quotes/route.js`; тип: `api-route`.

### api/referral

- `/api/referral/hit` — API-эндпоинт `/api/referral/hit`; файл: `app/api/referral/hit/route.js`; тип: `api-route`.
- `/api/referral/link` — API-эндпоинт `/api/referral/link`; файл: `app/api/referral/link/route.js`; тип: `api-route`.

### api/subscription

- `/api/subscription/status` — API-эндпоинт `/api/subscription/status`; файл: `app/api/subscription/status/route.js`; тип: `api-route`.

### api/telegram

- `/api/telegram/link/confirm` — API-эндпоинт `/api/telegram/link/confirm`; файл: `app/api/telegram/link/confirm/route.js`; тип: `api-route`.
- `/api/telegram/link/resolve` — API-эндпоинт `/api/telegram/link/resolve`; файл: `app/api/telegram/link/resolve/route.js`; тип: `api-route`.
- `/api/telegram/link/start` — API-эндпоинт `/api/telegram/link/start`; файл: `app/api/telegram/link/start/route.js`; тип: `api-route`.
- `/api/telegram/link/status` — API-эндпоинт `/api/telegram/link/status`; файл: `app/api/telegram/link/status/route.js`; тип: `api-route`.

### api/tma

- `/api/tma/auto` — API-эндпоинт `/api/tma/auto`; файл: `app/api/tma/auto/route.js`; тип: `api-route`.
