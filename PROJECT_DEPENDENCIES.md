# PROJECT_DEPENDENCIES.md

> Обязательное правило сопровождения:
> Если появляются новые крупные зависимости между доменами, меняются import-графы или переносится ownership между зонами, этот файл должен быть обновлен.
> Рекомендуемый способ обновления: `node tools/generate-project-dependencies.js`.

Сгенерировано автоматически: 2026-07-21T00:48:50.885Z
Исходных файлов в анализе: 1206
Локальных зависимостей: 1215

## Охват

- Локальные импорты между `app`, `components`, `lib`, `tools`, `public`.
- Межзоновые зависимости по доменам и слоям.
- Файлы с высоким fan-in, то есть большим радиусом поломки.

## Размер Зон

- `api/_diag` — 1 файлов
- `api/academy` — 1 файлов
- `api/ads` — 1 файлов
- `api/aiquota` — 1 файлов
- `api/app-shell` — 1 файлов
- `api/battlecoin` — 5 файлов
- `api/brain` — 1 файлов
- `api/coins` — 1 файлов
- `api/contact` — 1 файлов
- `api/crypto-news` — 1 файлов
- `api/debug` — 9 файлов
- `api/deep-translate` — 1 файлов
- `api/dm` — 9 файлов
- `api/forum` — 43 файлов
- `api/geo` — 1 файлов
- `api/market` — 1 файлов
- `api/metamarket` — 16 файлов
- `api/metastudio` — 1 файлов
- `api/pay` — 2 файлов
- `api/payments` — 3 файлов
- `api/profile` — 10 файлов
- `api/push` — 9 файлов
- `api/qcoin` — 6 файлов
- `api/quest` — 3 файлов
- `api/quotes` — 1 файлов
- `api/referral` — 2 файлов
- `api/subscription` — 1 файлов
- `api/telegram` — 4 файлов
- `api/tma` — 1 файлов
- `api/wallet-session` — 1 файлов
- `app/about` — 2 файлов
- `app/academy` — 3 файлов
- `app/ads` — 4 файлов
- `app/ads.js` — 1 файлов
- `app/components` — 1 файлов
- `app/contact` — 2 файлов
- `app/exchange` — 10 файлов
- `app/game` — 2 файлов
- `app/jsconfig.json` — 1 файлов
- `app/layout.js` — 1 файлов
- `app/page.js` — 1 файлов
- `app/privacy` — 2 файлов
- `app/providers.jsx` — 1 файлов
- `app/robots.js` — 1 файлов
- `app/sitemap.js` — 1 файлов
- `app/subscribe` — 3 файлов
- `app/tma` — 2 файлов
- `audit` — 170 файлов
- `components` — 49 файлов
- `config` — 1 файлов
- `forum/diagnostics` — 2 файлов
- `forum/dm` — 32 файлов
- `forum/feed` — 60 файлов
- `forum/geo` — 1 файлов
- `forum/media` — 43 файлов
- `forum/moderation` — 9 файлов
- `forum/profile` — 18 файлов
- `forum/qcoin` — 6 файлов
- `forum/quests` — 10 файлов
- `forum/root` — 14 файлов
- `forum/shared` — 24 файлов
- `forum/styles` — 10 файлов
- `forum/subscriptions` — 4 файлов
- `forum/ui` — 51 файлов
- `lib/adsCore.js` — 1 файлов
- `lib/auth` — 1 файлов
- `lib/authActionGateClient.js` — 1 файлов
- `lib/battlecoin` — 3 файлов
- `lib/brain.js` — 1 файлов
- `lib/databroker.js` — 1 файлов
- `lib/fcm.js` — 1 файлов
- `lib/forum` — 7 файлов
- `lib/forumClientVideoOptimizer.js` — 1 файлов
- `lib/forumShareManager.js` — 1 файлов
- `lib/forumVideoTrim.js` — 1 файлов
- `lib/geo` — 6 файлов
- `lib/identity` — 2 файлов
- `lib/indicators.js` — 1 файлов
- `lib/metadataCache.js` — 1 файлов
- `lib/mongo` — 21 файлов
- `lib/nativePush.js` — 1 файлов
- `lib/notificationCenter.js` — 1 файлов
- `lib/ql7-support` — 6 файлов
- `lib/redis.js` — 1 файлов
- `lib/safeWin.js` — 1 файлов
- `lib/security` — 1 файлов
- `lib/seo` — 3 файлов
- `lib/storage` — 2 файлов
- `lib/subscriptions.js` — 1 файлов
- `lib/supportEmailTransport.js` — 1 файлов
- `lib/tma.js` — 1 файлов
- `lib/videoPipelineProgress.js` — 1 файлов
- `lib/walletSessionClient.js` — 1 файлов
- `lib/webPush.js` — 1 файлов
- `root` — 351 файлов
- `src/shared` — 32 файлов
- `tools` — 71 файлов

## Топ Межзоновых Зависимостей

- `api/forum` -> `api/forum` — 49 локальных импортов
- `api/metamarket` -> `api/metamarket` — 45 локальных импортов
- `forum/feed` -> `forum/feed` — 42 локальных импортов
- `components` -> `components` — 34 локальных импортов
- `forum/dm` -> `forum/dm` — 31 локальных импортов
- `forum/ui` -> `forum/ui` — 31 локальных импортов
- `src/shared` -> `src/shared` — 31 локальных импортов
- `forum/feed` -> `forum/shared` — 30 локальных импортов
- `tools` -> `tools` — 28 локальных импортов
- `forum/media` -> `forum/media` — 27 локальных импортов
- `lib/mongo` -> `lib/mongo` — 27 локальных импортов
- `root` -> `components` — 27 локальных импортов
- `root` -> `src/shared` — 25 локальных импортов
- `root` -> `root` — 23 локальных импортов
- `forum/root` -> `forum/ui` — 18 локальных импортов
- `root` -> `lib/mongo` — 18 локальных импортов
- `forum/dm` -> `forum/shared` — 17 локальных импортов
- `forum/feed` -> `forum/profile` — 16 локальных импортов
- `api/forum` -> `lib/forum` — 15 локальных импортов
- `forum/root` -> `forum/shared` — 14 локальных импортов
- `api/dm` -> `api/dm` — 13 локальных импортов
- `app/layout.js` -> `components` — 13 локальных импортов
- `forum/profile` -> `forum/profile` — 13 локальных импортов
- `forum/profile` -> `forum/shared` — 13 локальных импортов
- `forum/root` -> `forum/feed` — 13 локальных импортов
- `root` -> `forum/feed` — 13 локальных импортов
- `api/forum` -> `api/profile` — 12 локальных импортов
- `forum/media` -> `forum/shared` — 12 локальных импортов
- `api/forum` -> `lib/mongo` — 11 локальных импортов
- `app/exchange` -> `app/exchange` — 11 локальных импортов
- `forum/root` -> `forum/media` — 11 локальных импортов
- `api/profile` -> `lib/mongo` — 10 локальных импортов
- `forum/dm` -> `forum/profile` — 10 локальных импортов
- `forum/ui` -> `forum/media` — 10 локальных импортов
- `root` -> `forum/media` — 10 локальных импортов
- `forum/quests` -> `forum/quests` — 9 локальных импортов
- `forum/root` -> `forum/profile` — 9 локальных импортов
- `lib/forum` -> `lib/mongo` — 9 локальных импортов
- `api/dm` -> `lib/mongo` — 8 локальных импортов
- `api/dm` -> `lib/ql7-support` — 8 локальных импортов
- `api/forum` -> `lib/storage` — 8 локальных импортов
- `api/profile` -> `api/profile` — 8 локальных импортов
- `api/profile` -> `api/forum` — 7 локальных импортов
- `lib/ql7-support` -> `lib/ql7-support` — 7 локальных импортов
- `root` -> `lib/ql7-support` — 7 локальных импортов
- `api/push` -> `api/dm` — 6 локальных импортов
- `api/qcoin` -> `lib/mongo` — 6 локальных импортов
- `forum/feed` -> `forum/media` — 6 локальных импортов
- `forum/feed` -> `forum/ui` — 6 локальных импортов
- `forum/moderation` -> `forum/moderation` — 6 локальных импортов

## Исходящие Зависимости По Зонам

### api/_diag

- Нет локальных исходящих импортов.

### api/academy

- `lib/mongo` — 2
- `api/forum` — 1
- `lib/identity` — 1

### api/ads

- `lib/adsCore.js` — 1

### api/aiquota

- Нет локальных исходящих импортов.

### api/app-shell

- Нет локальных исходящих импортов.

### api/battlecoin

- `lib/mongo` — 4
- `lib/battlecoin` — 3
- `lib/auth` — 2
- `lib/subscriptions.js` — 2

### api/brain

- `lib/brain.js` — 1
- `lib/databroker.js` — 1

### api/coins

- Нет локальных исходящих импортов.

### api/contact

- `lib/supportEmailTransport.js` — 1

### api/crypto-news

- Нет локальных исходящих импортов.

### api/debug

- `lib/subscriptions.js` — 2
- `lib/adsCore.js` — 1
- `lib/mongo` — 1
- `lib/redis.js` — 1

### api/deep-translate

- Нет локальных исходящих импортов.

### api/dm

- `api/dm` — 13
- `lib/mongo` — 8
- `lib/ql7-support` — 8
- `lib/webPush.js` — 3
- `lib/notificationCenter.js` — 2
- `api/profile` — 1

### api/forum

- `api/forum` — 49
- `lib/forum` — 15
- `api/profile` — 12
- `lib/mongo` — 11
- `lib/storage` — 8
- `forum/shared` — 3
- `lib/subscriptions.js` — 2
- `lib/geo` — 1
- `lib/ql7-support` — 1
- `lib/webPush.js` — 1

### api/geo

- `lib/forum` — 1
- `lib/geo` — 1
- `lib/identity` — 1
- `lib/mongo` — 1

### api/market

- `lib/brain.js` — 1
- `lib/databroker.js` — 1

### api/metamarket

- `api/metamarket` — 45
- `api/forum` — 3
- `lib/subscriptions.js` — 3
- `api/profile` — 1
- `components` — 1
- `lib/mongo` — 1
- `lib/webPush.js` — 1

### api/metastudio

- `lib/mongo` — 1

### api/pay

- `lib/mongo` — 3
- `lib/adsCore.js` — 2
- `lib/subscriptions.js` — 1

### api/payments

- Нет локальных исходящих импортов.

### api/profile

- `lib/mongo` — 10
- `api/profile` — 8
- `api/forum` — 7
- `lib/ql7-support` — 2
- `lib/identity` — 1
- `lib/subscriptions.js` — 1

### api/push

- `api/dm` — 6
- `lib/webPush.js` — 5
- `lib/nativePush.js` — 4

### api/qcoin

- `lib/mongo` — 6
- `api/forum` — 3
- `lib/ql7-support` — 1

### api/quest

- `lib/mongo` — 3
- `api/forum` — 2

### api/quotes

- Нет локальных исходящих импортов.

### api/referral

- `lib/mongo` — 3
- `api/forum` — 2
- `api/profile` — 2
- `lib/identity` — 2
- `lib/subscriptions.js` — 1

### api/subscription

- `lib/subscriptions.js` — 1

### api/telegram

- `lib/mongo` — 3
- `lib/redis.js` — 3
- `lib/subscriptions.js` — 1

### api/tma

- `lib/mongo` — 1

### api/wallet-session

- `lib/ql7-support` — 1

### app/about

- `app/ads.js` — 1
- `components` — 1
- `lib/metadataCache.js` — 1

### app/academy

- `components` — 2
- `app/academy` — 1
- `app/ads.js` — 1
- `lib/metadataCache.js` — 1

### app/ads

- `components` — 4
- `app/ads` — 2
- `lib/geo` — 2
- `forum/media` — 1
- `lib/metadataCache.js` — 1
- `lib/videoPipelineProgress.js` — 1

### app/ads.js

- `forum/root` — 1

### app/components

- `components` — 1

### app/contact

- `components` — 1
- `lib/metadataCache.js` — 1

### app/exchange

- `app/exchange` — 11
- `components` — 4
- `app/ads.js` — 1
- `lib/authActionGateClient.js` — 1
- `lib/brain.js` — 1
- `lib/forumShareManager.js` — 1
- `lib/metadataCache.js` — 1
- `lib/walletSessionClient.js` — 1

### app/game

- `app/ads.js` — 1
- `components` — 1
- `forum/shared` — 1
- `lib/metadataCache.js` — 1
- `lib/walletSessionClient.js` — 1

### app/jsconfig.json

- Нет локальных исходящих импортов.

### app/layout.js

- `components` — 13
- `app/providers.jsx` — 1
- `lib/metadataCache.js` — 1
- `lib/seo` — 1

### app/page.js

- `app/ads.js` — 1
- `app/components` — 1
- `components` — 1

### app/privacy

- `components` — 1
- `lib/metadataCache.js` — 1

### app/providers.jsx

- `components` — 1

### app/robots.js

- `lib/seo` — 2

### app/sitemap.js

- `lib/seo` — 2

### app/subscribe

- `app/ads.js` — 1
- `app/subscribe` — 1
- `components` — 1
- `lib/metadataCache.js` — 1

### app/tma

- `components` — 1

### audit

- Нет локальных исходящих импортов.

### components

- `components` — 34
- `forum/qcoin` — 3
- `forum/profile` — 2
- `lib/walletSessionClient.js` — 2
- `lib/authActionGateClient.js` — 1
- `lib/notificationCenter.js` — 1

### config

- Нет локальных исходящих импортов.

### forum/diagnostics

- `forum/diagnostics` — 1

### forum/dm

- `forum/dm` — 31
- `forum/shared` — 17
- `forum/profile` — 10
- `lib/ql7-support` — 4
- `forum/feed` — 3
- `forum/ui` — 2
- `forum/media` — 1
- `lib/authActionGateClient.js` — 1

### forum/feed

- `forum/feed` — 42
- `forum/shared` — 30
- `forum/profile` — 16
- `forum/media` — 6
- `forum/ui` — 6
- `forum/dm` — 4
- `forum/root` — 3
- `components` — 2
- `forum/quests` — 1
- `forum/subscriptions` — 1

### forum/geo

- Нет локальных исходящих импортов.

### forum/media

- `forum/media` — 27
- `forum/shared` — 12
- `forum/feed` — 4
- `lib/forumClientVideoOptimizer.js` — 2
- `lib/forumVideoTrim.js` — 2
- `components` — 1
- `forum/profile` — 1
- `forum/root` — 1
- `lib/videoPipelineProgress.js` — 1

### forum/moderation

- `forum/moderation` — 6
- `forum/root` — 1
- `forum/shared` — 1

### forum/profile

- `forum/profile` — 13
- `forum/shared` — 13
- `forum/subscriptions` — 3
- `components` — 2
- `forum/qcoin` — 2
- `lib/ql7-support` — 2
- `lib/walletSessionClient.js` — 1

### forum/qcoin

- `forum/qcoin` — 3
- `forum/shared` — 1

### forum/quests

- `forum/quests` — 9
- `forum/shared` — 1

### forum/root

- `forum/ui` — 18
- `forum/shared` — 14
- `forum/feed` — 13
- `forum/media` — 11
- `forum/profile` — 9
- `forum/root` — 6
- `components` — 5
- `forum/dm` — 2
- `forum/styles` — 2
- `api/forum` — 1
- `forum/diagnostics` — 1
- `forum/geo` — 1

### forum/shared

- `forum/shared` — 6

### forum/styles

- Нет локальных исходящих импортов.

### forum/subscriptions

- `forum/shared` — 5
- `forum/profile` — 2
- `forum/root` — 1
- `forum/subscriptions` — 1

### forum/ui

- `forum/ui` — 31
- `forum/media` — 10
- `forum/feed` — 6
- `forum/profile` — 5
- `components` — 4
- `forum/dm` — 4
- `forum/root` — 4
- `forum/shared` — 4
- `forum/quests` — 2
- `forum/moderation` — 1
- `forum/subscriptions` — 1
- `lib/authActionGateClient.js` — 1

### lib/adsCore.js

- `lib/mongo` — 2
- `lib/storage` — 2
- `lib/ql7-support` — 1

### lib/auth

- `lib/identity` — 1
- `lib/mongo` — 1
- `lib/tma.js` — 1

### lib/authActionGateClient.js

- Нет локальных исходящих импортов.

### lib/battlecoin

- `lib/battlecoin` — 1

### lib/brain.js

- Нет локальных исходящих импортов.

### lib/databroker.js

- Нет локальных исходящих импортов.

### lib/fcm.js

- Нет локальных исходящих импортов.

### lib/forum

- `lib/mongo` — 9
- `lib/forum` — 6
- `lib/geo` — 4
- `lib/security` — 1

### lib/forumClientVideoOptimizer.js

- Нет локальных исходящих импортов.

### lib/forumShareManager.js

- Нет локальных исходящих импортов.

### lib/forumVideoTrim.js

- Нет локальных исходящих импортов.

### lib/geo

- `lib/geo` — 3
- `lib/forum` — 2

### lib/identity

- `lib/identity` — 1
- `lib/mongo` — 1

### lib/indicators.js

- Нет локальных исходящих импортов.

### lib/metadataCache.js

- `lib/seo` — 1

### lib/mongo

- `lib/mongo` — 27
- `lib/battlecoin` — 2
- `lib/forum` — 1
- `lib/geo` — 1
- `lib/identity` — 1

### lib/nativePush.js

- `api/profile` — 1
- `lib/fcm.js` — 1
- `lib/notificationCenter.js` — 1

### lib/notificationCenter.js

- Нет локальных исходящих импортов.

### lib/ql7-support

- `lib/ql7-support` — 7
- `lib/mongo` — 4
- `api/profile` — 1
- `lib/adsCore.js` — 1
- `lib/supportEmailTransport.js` — 1
- `lib/webPush.js` — 1

### lib/redis.js

- Нет локальных исходящих импортов.

### lib/safeWin.js

- Нет локальных исходящих импортов.

### lib/security

- `lib/mongo` — 1

### lib/seo

- `lib/seo` — 2
- `components` — 1

### lib/storage

- Нет локальных исходящих импортов.

### lib/subscriptions.js

- `lib/mongo` — 2
- `lib/ql7-support` — 1

### lib/supportEmailTransport.js

- Нет локальных исходящих импортов.

### lib/tma.js

- Нет локальных исходящих импортов.

### lib/videoPipelineProgress.js

- Нет локальных исходящих импортов.

### lib/walletSessionClient.js

- Нет локальных исходящих импортов.

### lib/webPush.js

- `api/profile` — 1
- `lib/mongo` — 1
- `lib/nativePush.js` — 1
- `lib/notificationCenter.js` — 1

### root

- `components` — 27
- `src/shared` — 25
- `root` — 23
- `lib/mongo` — 18
- `forum/feed` — 13
- `forum/media` — 10
- `lib/ql7-support` — 7
- `forum/shared` — 3
- `lib/forum` — 3
- `lib/seo` — 3
- `api/dm` — 2
- `api/forum` — 2

### src/shared

- `src/shared` — 31
- `config` — 3

### tools

- `tools` — 28

## Файлы С Высоким Fan-In

- `app/api/forum/_utils.js` — fan-in 44; основные потребители: `app/api/academy/exam/route.js`, `app/api/forum/_db.js`, `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/admin/verify/route.js`, `app/api/forum/inbox/replies/page/route.js`
- `components/i18n.js` — fan-in 36; основные потребители: `app/about/page.js`, `app/academy/AcademyExamBlock.js`, `app/academy/page.js`, `app/ads/GeoTargetingPicker.jsx`, `app/ads/home.js`, `app/ads/page.jsx`, `app/components/CryptoNewsLens.jsx`, `app/contact/page.js`
- `lib/mongo/client.cjs` — fan-in 30; основные потребители: `app/api/forum/recommendations/users/route.js`, `app/api/profile/user-popover/route.js`, `lib/forum/forum-index-maintenance.cjs`, `lib/forum/forum-projection-rebuild.cjs`, `lib/forum/forum-server-complete-reader.cjs`, `lib/forum/forum-server-page-reader.cjs`, `lib/mongo/academy-primary.cjs`, `lib/mongo/account-deletion-primary.cjs`
- `app/api/profile/_identity.js` — fan-in 27; основные потребители: `app/api/dm/_utils.js`, `app/api/forum/_db.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/mutate/route.js`, `app/api/forum/own/route.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/report/route.js`, `app/api/forum/subs/count/route.js`
- `tools/runtime-governance.js` — fan-in 25; основные потребители: `tools/audit-adaptive-actions.js`, `tools/audit-adaptive-core.js`, `tools/audit-auth-cascade.js`, `tools/audit-console-noise.js`, `tools/audit-diagnostics-boundaries.js`, `tools/audit-feature-flag-safety.js`, `tools/audit-forensic-mode-bounds.js`, `tools/audit-iframe-restore.js`
- `lib/mongo/profile-primary.cjs` — fan-in 24; основные потребители: `app/api/debug/vip/grant/route.js`, `app/api/forum/_db.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/user-search/rebuild/route.js`, `app/api/pay/create/route.js`, `app/api/profile/_identity.js`, `app/api/profile/batch/route.js`, `app/api/profile/check-nick/route.js`
- `app/api/forum/_db.js` — fan-in 22; основные потребители: `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/mediaLock/route.js`, `app/api/forum/mutate/route.js`, `app/api/forum/recommendations/users/route.js`
- `app/forum/features/profile/utils/profileCache.js` — fan-in 20; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/InboxRepliesPane.jsx`, `app/forum/features/feed/components/ForumPostCard.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/PublishedPostsPane.jsx`, `app/forum/features/feed/components/ThreadRepliesPane.jsx`, `app/forum/features/feed/components/TopicItem.jsx`
- `app/forum/shared/utils/classnames.js` — fan-in 18; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationsRail.jsx`, `app/forum/features/profile/components/AboutRail.jsx`, `app/forum/features/profile/components/ForumVipControl.jsx`
- `lib/ql7-support/systemActor.js` — fan-in 18; основные потребители: `app/api/dm/_utils.js`, `app/api/dm/block/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`, `app/api/profile/check-nick/route.js`, `app/api/profile/save-nick/route.js`, `app/forum/features/dm/components/DmDialogRow.jsx`
- `app/api/metamarket/_format.js` — fan-in 15; основные потребители: `app/api/metamarket/_catalog.js`, `app/api/metamarket/_db.js`, `app/api/metamarket/_identity.js`, `app/api/metamarket/_locks.js`, `app/api/metamarket/_transactions.js`, `app/api/metamarket/buy/route.js`, `app/api/metamarket/collection/route.js`, `app/api/metamarket/gift/route.js`
- `app/api/dm/_utils.js` — fan-in 14; основные потребители: `app/api/dm/_db.js`, `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`
- `lib/mongo/qcoin-primary.cjs` — fan-in 14; основные потребители: `app/api/academy/exam/route.js`, `app/api/profile/user-popover/route.js`, `app/api/qcoin/drop/route.js`, `app/api/qcoin/get/route.js`, `app/api/qcoin/heartbeat/route.js`, `app/api/qcoin/topup/cancel/route.js`, `app/api/qcoin/topup/create/route.js`, `app/api/qcoin/topup/webhook/route.js`
- `lib/subscriptions.js` — fan-in 14; основные потребители: `app/api/battlecoin/order/route.js`, `app/api/battlecoin/state/route.js`, `app/api/debug/vip/grant/route.js`, `app/api/debug/vip/route.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/vip/batch/route.js`, `app/api/metamarket/_db.js`, `app/api/metamarket/state/route.js`
- `lib/forum/forum-server-complete-reader.cjs` — fan-in 13; основные потребители: `app/api/forum/inbox/replies/page/route.js`, `app/api/forum/post-by-id/route.js`, `app/api/forum/post-chain/route.js`, `app/api/forum/post-locate/route.js`, `app/api/forum/post-meta/route.js`, `app/api/forum/search/page/route.js`, `app/api/forum/snapshot/route.js`, `app/api/forum/thread/locate/route.js`
- `lib/webPush.js` — fan-in 12; основные потребители: `app/api/dm/delete/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/forum/mutate/route.js`, `app/api/metamarket/gift/route.js`, `app/api/push/config/route.js`, `app/api/push/events/route.js`, `app/api/push/subscribe/route.js`
- `tests/support/runtimeGovernance.js` — fan-in 12; основные потребители: `tests/component/runtime/runtimeComponentSurfaces.test.jsx`, `tests/contracts/forum/media-budget-owner.contract.test.js`, `tests/contracts/forum/player-budget-profiles.contract.test.js`, `tests/contracts/forum/qcast-shared-mute-owner.contract.test.js`, `tests/contracts/forum/same-src-thrash-guard.contract.test.js`, `tests/contracts/mobile/android-shell-contracts.test.js`, `tests/contracts/project/runtime-governance-contracts.test.js`, `tests/contracts/root/auth-bus-budget.contract.test.js`
- `app/forum/shared/utils/counts.js` — fan-in 11; основные потребители: `app/forum/features/dm/components/InboxTabsHeader.jsx`, `app/forum/features/feed/components/PostActionBar.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/profile/components/ProfilePopover.jsx`, `app/forum/features/profile/components/UserInfoPopover.jsx`, `app/forum/features/subscriptions/components/FollowersCounterInline.jsx`, `app/forum/features/subscriptions/components/SubscriptionsPopover.jsx`
- `lib/mongo/dm-primary.cjs` — fan-in 11; основные потребители: `app/api/dm/_db.js`, `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`
- `lib/mongo/forum-primary.cjs` — fan-in 11; основные потребители: `app/api/forum/_db.js`, `app/api/forum/mutate/route.js`, `app/api/forum/own/route.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/report/route.js`, `app/api/forum/rev/route.js`, `app/api/forum/subs/people/route.js`, `app/forum/p/[postId]/route.js`
- `app/api/metamarket/_identity.js` — fan-in 10; основные потребители: `app/api/metamarket/_transactions.js`, `app/api/metamarket/buy/route.js`, `app/api/metamarket/collection/route.js`, `app/api/metamarket/gift/route.js`, `app/api/metamarket/my-collection/route.js`, `app/api/metamarket/owners/route.js`, `app/api/metamarket/quote/route.js`, `app/api/metamarket/sell/route.js`
- `app/forum/features/profile/components/AvatarEmoji.jsx` — fan-in 10; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/subscriptions/components/SubscriptionsPopover.jsx`, `app/forum/features/ui/components/ForumSearchSortControls.jsx`
- `lib/metadataCache.js` — fan-in 10; основные потребители: `app/about/layout.js`, `app/academy/layout.js`, `app/ads/layout.js`, `app/contact/layout.js`, `app/exchange/layout.js`, `app/forum/layout.js`, `app/game/layout.js`, `app/layout.js`
- `app/forum/shared/components/HydrateText.jsx` — fan-in 9; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostActionBar.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/profile/components/UserInfoPopover.jsx`, `app/forum/features/subscriptions/components/FollowersCounterInline.jsx`
- `app/forum/shared/utils/forumWindowingRegistry.js` — fan-in 9; основные потребители: `app/forum/features/feed/hooks/useForumDeepLinkFlow.js`, `app/forum/features/feed/hooks/usePostParentReplyNav.js`, `app/forum/features/feed/hooks/useThreadOpenNavigation.js`, `app/forum/features/feed/utils/navScroll.js`, `app/forum/features/feed/utils/openThreadFromPost.js`, `app/forum/features/feed/utils/postFocus.js`, `app/forum/ForumRoot.jsx`, `app/forum/shared/hooks/useForumWindowing.js`
- `app/api/metamarket/_db.js` — fan-in 8; основные потребители: `app/api/metamarket/_ledger.js`, `app/api/metamarket/_locks.js`, `app/api/metamarket/_transactions.js`, `app/api/metamarket/collection/route.js`, `app/api/metamarket/my-collection/route.js`, `app/api/metamarket/owners/route.js`, `app/api/metamarket/state/route.js`, `app/api/metamarket/token-history/route.js`
- `app/forum/features/feed/utils/postMerge.js` — fan-in 8; основные потребители: `app/forum/features/dm/hooks/useForumDmRuntime.js`, `app/forum/features/feed/hooks/useForumDataRuntime.js`, `app/forum/features/feed/hooks/useForumSyncLoop.js`, `app/forum/features/feed/hooks/usePublishedPostsModel.js`, `app/forum/features/feed/utils/snapshotTransforms.js`, `app/forum/features/media/hooks/useForumVideoFeedRuntime.js`, `app/forum/features/media/hooks/useVideoFeedState.js`, `tests/unit/forum/features/feed/utils/cardMemo.test.js`
- `app/forum/features/profile/components/VipFlipBadge.jsx` — fan-in 8; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/subscriptions/components/SubscriptionsPopover.jsx`, `app/forum/features/ui/components/ForumSearchSortControls.jsx`, `components/MetaMarket.jsx`
- `app/forum/shared/constants/media.js` — fan-in 8; основные потребители: `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/upload/route.js`, `app/api/forum/uploadVideo/route.js`, `app/forum/features/media/components/VideoLimitOverlay.jsx`, `app/forum/features/media/components/VideoTrimPopover.jsx`, `app/forum/features/media/hooks/useForumComposerAttachments.js`, `app/forum/features/media/utils/mediaRuntime.js`, `app/forum/ForumRoot.jsx`
- `app/forum/shared/hooks/useForumWindowing.js` — fan-in 8; основные потребители: `app/forum/features/dm/components/DmDialogsPane.jsx`, `app/forum/features/dm/components/DmMessagesPane.jsx`, `app/forum/features/dm/components/InboxRepliesPane.jsx`, `app/forum/features/feed/components/PublishedPostsPane.jsx`, `app/forum/features/feed/components/ThreadRepliesPane.jsx`, `app/forum/features/feed/components/TopicsPane.jsx`, `app/forum/features/feed/components/UserPostsPane.jsx`, `app/forum/features/media/hooks/useVideoFeedWindowing.js`
- `lib/identity/ql7IdentityContract.cjs` — fan-in 8; основные потребители: `app/api/academy/exam/route.js`, `app/api/profile/_identity.js`, `app/api/referral/hit/route.js`, `app/api/referral/link/route.js`, `lib/auth/battlecoin-chat-auth.cjs`, `lib/identity/geo-identity.cjs`, `lib/mongo/qcoin-primary.cjs`, `tests/unit/mongo/profile-primary.test.js`
- `lib/ql7-support/events.js` — fan-in 8; основные потребители: `app/api/forum/report/route.js`, `app/api/qcoin/topup/webhook/route.js`, `app/api/wallet-session/route.js`, `lib/adsCore.js`, `lib/ql7-support/broadcast.js`, `lib/ql7-support/scheduler.js`, `lib/subscriptions.js`, `tests/integration/ql7-support-scenarios.test.js`
- `src/shared/runtime/budgets/routeProfiles.js` — fan-in 8; основные потребители: `src/shared/runtime/budgets/routeCapabilities.js`, `tests/contracts/decorative/autoplay-budget.contract.test.js`, `tests/contracts/forum/ads-shared-budget.contract.test.js`, `tests/contracts/forum/iframe-singleton-mobile.contract.test.js`, `tests/contracts/forum/native-video-cold-offscreen.contract.test.js`, `tests/contracts/root/wallet-intent-only.contract.test.js`, `tests/integration/runtime/runtimeGovernance.integration.test.js`, `tests/unit/runtime/runtimeGovernance.test.js`
- `app/api/metamarket/_catalog.js` — fan-in 7; основные потребители: `app/api/metamarket/_db.js`, `app/api/metamarket/_transactions.js`, `app/api/metamarket/collection/route.js`, `app/api/metamarket/my-collection/route.js`, `app/api/metamarket/owners/route.js`, `app/api/metamarket/state/route.js`, `app/api/metamarket/token-history/route.js`
- `app/forum/shared/utils/browser.js` — fan-in 7; основные потребители: `app/forum/features/media/hooks/useForumMediaCoordinator.js`, `app/forum/features/moderation/hooks/useAdminFlag.js`, `app/forum/features/profile/hooks/useForumProfileSync.js`, `app/forum/features/profile/utils/profileCache.js`, `app/forum/ForumRoot.jsx`, `app/forum/shared/config/runtime.js`, `app/forum/shared/storage/localStorage.js`
- `app/forum/shared/utils/forumWindowingPresets.js` — fan-in 7; основные потребители: `app/forum/features/dm/components/DmDialogsPane.jsx`, `app/forum/features/dm/components/DmMessagesPane.jsx`, `app/forum/features/dm/components/InboxRepliesPane.jsx`, `app/forum/features/feed/components/PublishedPostsPane.jsx`, `app/forum/features/feed/components/ThreadRepliesPane.jsx`, `app/forum/features/feed/components/TopicsPane.jsx`, `app/forum/features/feed/components/UserPostsPane.jsx`
- `tests/support/projectSurface.js` — fan-in 7; основные потребители: `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/api-route-contracts.test.js`, `tests/contracts/project/app-entry-contracts.test.js`, `tests/contracts/project/forum-hook-contracts.test.js`, `tests/contracts/project/seo-indexing-contracts.test.js`, `tests/support/runtimeGovernance.js`, `tests/unit/metamarket/catalog.test.js`
- `app/ads.js` — fan-in 6; основные потребители: `app/about/page.js`, `app/academy/page.js`, `app/exchange/page.js`, `app/game/page.js`, `app/page.js`, `app/subscribe/subscribe.client.jsx`
- `app/api/dm/_db.js` — fan-in 6; основные потребители: `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/unblock/route.js`, `tests/unit/mongo/dm-primary.test.js`
- `app/forum/features/media/utils/mediaLifecycleRuntime.js` — fan-in 6; основные потребители: `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostCardBridge.jsx`, `app/forum/features/media/components/ComposerAttachmentPreview.jsx`, `app/forum/features/media/components/ExternalVideoPlayer.jsx`, `app/forum/features/media/components/VideoOverlay.jsx`, `app/forum/features/media/hooks/useForumMediaCoordinator.js`

## Вывод

- Файлы с высоким fan-in требуют особенно осторожных изменений.
- Самые чувствительные зоны обычно находятся в `app/forum`, `app/api/*`, `components/i18n.js`, `lib/*` и корневых route/layout файлах.
