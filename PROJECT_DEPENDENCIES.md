# PROJECT_DEPENDENCIES.md

> Обязательное правило сопровождения:
> Если появляются новые крупные зависимости между доменами, меняются import-графы или переносится ownership между зонами, этот файл должен быть обновлен.
> Рекомендуемый способ обновления: `node tools/generate-project-dependencies.js`.

Сгенерировано автоматически: 2026-08-07T06:36:47.566Z
Исходных файлов в анализе: 1034
Локальных зависимостей: 1913

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
- `api/dm` — 14 файлов
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
- `app/ads` — 5 файлов
- `app/ads.js` — 1 файлов
- `app/components` — 1 файлов
- `app/contact` — 2 файлов
- `app/exchange` — 12 файлов
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
- `components` — 50 файлов
- `config` — 1 файлов
- `forum/diagnostics` — 2 файлов
- `forum/dm` — 40 файлов
- `forum/feed` — 60 файлов
- `forum/geo` — 1 файлов
- `forum/media` — 43 файлов
- `forum/moderation` — 9 файлов
- `forum/profile` — 18 файлов
- `forum/qcoin` — 6 файлов
- `forum/quests` — 10 файлов
- `forum/root` — 14 файлов
- `forum/shared` — 27 файлов
- `forum/styles` — 11 файлов
- `forum/subscriptions` — 4 файлов
- `forum/ui` — 51 файлов
- `lib/ads` — 1 файлов
- `lib/adsCore.js` — 1 файлов
- `lib/adsGeoTargetingFlow.js` — 1 файлов
- `lib/adsLandingPackageState.js` — 1 файлов
- `lib/auth` — 1 файлов
- `lib/authActionGateClient.js` — 1 файлов
- `lib/battlecoin` — 3 файлов
- `lib/brain.js` — 1 файлов
- `lib/databroker.js` — 1 файлов
- `lib/deepTranslateService.js` — 1 файлов
- `lib/exchange` — 2 файлов
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
- `lib/ql7-support` — 168 файлов
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
- `root` — 156 файлов
- `src/shared` — 32 файлов
- `tools` — 75 файлов

## Топ Межзоновых Зависимостей

- `lib/ql7-support` -> `lib/ql7-support` — 342 локальных импортов
- `root` -> `lib/ql7-support` — 187 локальных импортов
- `root` -> `components` — 51 локальных импортов
- `api/forum` -> `api/forum` — 49 локальных импортов
- `forum/dm` -> `forum/dm` — 46 локальных импортов
- `api/metamarket` -> `api/metamarket` — 45 локальных импортов
- `forum/feed` -> `forum/feed` — 42 локальных импортов
- `api/dm` -> `lib/ql7-support` — 39 локальных импортов
- `components` -> `components` — 35 локальных импортов
- `forum/feed` -> `forum/shared` — 32 локальных импортов
- `forum/ui` -> `forum/ui` — 31 локальных импортов
- `src/shared` -> `src/shared` — 31 локальных импортов
- `tools` -> `tools` — 28 локальных импортов
- `forum/media` -> `forum/media` — 27 локальных импортов
- `lib/mongo` -> `lib/mongo` — 27 локальных импортов
- `root` -> `src/shared` — 25 локальных импортов
- `root` -> `root` — 23 локальных импортов
- `forum/dm` -> `forum/shared` — 21 локальных импортов
- `forum/dm` -> `lib/ql7-support` — 21 локальных импортов
- `forum/root` -> `forum/ui` — 18 локальных импортов
- `root` -> `lib/mongo` — 18 локальных импортов
- `forum/feed` -> `forum/profile` — 16 локальных импортов
- `api/dm` -> `api/dm` — 15 локальных импортов
- `api/forum` -> `lib/forum` — 15 локальных импортов
- `forum/root` -> `forum/shared` — 15 локальных импортов
- `root` -> `forum/feed` — 15 локальных импортов
- `api/dm` -> `lib/mongo` — 14 локальных импортов
- `app/layout.js` -> `components` — 14 локальных импортов
- `app/exchange` -> `app/exchange` — 13 локальных импортов
- `forum/media` -> `forum/shared` — 13 локальных импортов
- `forum/profile` -> `forum/profile` — 13 локальных импортов
- `forum/profile` -> `forum/shared` — 13 локальных импортов
- `forum/root` -> `forum/feed` — 13 локальных импортов
- `api/forum` -> `api/profile` — 12 локальных импортов
- `root` -> `forum/media` — 12 локальных импортов
- `api/forum` -> `lib/mongo` — 11 локальных импортов
- `forum/root` -> `forum/media` — 11 локальных импортов
- `root` -> `forum/dm` — 11 локальных импортов
- `api/profile` -> `lib/mongo` — 10 локальных импортов
- `forum/dm` -> `forum/profile` — 10 локальных импортов
- `forum/ui` -> `forum/media` — 10 локальных импортов
- `forum/quests` -> `forum/quests` — 9 локальных импортов
- `forum/root` -> `forum/profile` — 9 локальных импортов
- `lib/forum` -> `lib/mongo` — 9 локальных импортов
- `api/forum` -> `lib/storage` — 8 локальных импортов
- `api/profile` -> `api/profile` — 8 локальных импортов
- `forum/shared` -> `forum/shared` — 8 локальных импортов
- `api/profile` -> `api/forum` — 7 локальных импортов
- `lib/ql7-support` -> `lib/mongo` — 7 локальных импортов
- `lib/ql7-support` -> `components` — 7 локальных импортов

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

- `lib/exchange` — 1

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

- `lib/deepTranslateService.js` — 1

### api/dm

- `lib/ql7-support` — 39
- `api/dm` — 15
- `lib/mongo` — 14
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
- `lib/ql7-support` — 2
- `lib/subscriptions.js` — 2
- `lib/geo` — 1
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

- `components` — 2
- `app/ads.js` — 1
- `lib/metadataCache.js` — 1

### app/academy

- `components` — 3
- `app/academy` — 1
- `app/ads.js` — 1
- `lib/metadataCache.js` — 1

### app/ads

- `components` — 6
- `app/ads` — 3
- `lib/adsGeoTargetingFlow.js` — 2
- `lib/geo` — 2
- `forum/media` — 1
- `lib/adsLandingPackageState.js` — 1
- `lib/metadataCache.js` — 1
- `lib/videoPipelineProgress.js` — 1

### app/ads.js

- `forum/root` — 1

### app/components

- `components` — 1

### app/contact

- `lib/metadataCache.js` — 1

### app/exchange

- `app/exchange` — 13
- `components` — 6
- `lib/exchange` — 2
- `app/ads.js` — 1
- `lib/authActionGateClient.js` — 1
- `lib/brain.js` — 1
- `lib/forumShareManager.js` — 1
- `lib/metadataCache.js` — 1
- `lib/walletSessionClient.js` — 1

### app/game

- `components` — 2
- `app/ads.js` — 1
- `forum/shared` — 1
- `lib/metadataCache.js` — 1
- `lib/walletSessionClient.js` — 1

### app/jsconfig.json

- Нет локальных исходящих импортов.

### app/layout.js

- `components` — 14
- `app/providers.jsx` — 1
- `lib/metadataCache.js` — 1
- `lib/seo` — 1

### app/page.js

- `components` — 2
- `app/ads.js` — 1
- `app/components` — 1

### app/privacy

- `components` — 2
- `lib/metadataCache.js` — 1

### app/providers.jsx

- `components` — 1

### app/robots.js

- `lib/seo` — 2

### app/sitemap.js

- `lib/seo` — 2

### app/subscribe

- `components` — 2
- `app/ads.js` — 1
- `app/subscribe` — 1
- `lib/metadataCache.js` — 1

### app/tma

- `components` — 1

### components

- `components` — 35
- `forum/qcoin` — 3
- `forum/profile` — 2
- `lib/authActionGateClient.js` — 2
- `lib/walletSessionClient.js` — 2
- `lib/notificationCenter.js` — 1
- `lib/ql7-support` — 1

### config

- Нет локальных исходящих импортов.

### forum/diagnostics

- `forum/diagnostics` — 1

### forum/dm

- `forum/dm` — 46
- `forum/shared` — 21
- `lib/ql7-support` — 21
- `forum/profile` — 10
- `forum/feed` — 3
- `forum/ui` — 2
- `forum/media` — 1
- `lib/authActionGateClient.js` — 1

### forum/feed

- `forum/feed` — 42
- `forum/shared` — 32
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
- `forum/shared` — 13
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
- `forum/shared` — 15
- `forum/feed` — 13
- `forum/media` — 11
- `forum/profile` — 9
- `components` — 6
- `forum/root` — 6
- `forum/dm` — 3
- `forum/styles` — 3
- `lib/ql7-support` — 3
- `api/forum` — 1
- `forum/diagnostics` — 1

### forum/shared

- `forum/shared` — 8

### forum/styles

- Нет локальных исходящих импортов.

### forum/subscriptions

- `forum/shared` — 6
- `forum/profile` — 2
- `forum/root` — 1
- `forum/subscriptions` — 1

### forum/ui

- `forum/ui` — 31
- `forum/media` — 10
- `forum/feed` — 6
- `forum/dm` — 5
- `forum/profile` — 5
- `forum/shared` — 5
- `components` — 4
- `forum/root` — 4
- `forum/moderation` — 1
- `forum/quests` — 1
- `forum/subscriptions` — 1
- `lib/authActionGateClient.js` — 1

### lib/ads

- Нет локальных исходящих импортов.

### lib/adsCore.js

- `lib/mongo` — 2
- `lib/storage` — 2
- `lib/ql7-support` — 1

### lib/adsGeoTargetingFlow.js

- Нет локальных исходящих импортов.

### lib/adsLandingPackageState.js

- Нет локальных исходящих импортов.

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

### lib/deepTranslateService.js

- Нет локальных исходящих импортов.

### lib/exchange

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

- `lib/ql7-support` — 342
- `components` — 7
- `lib/mongo` — 7
- `lib/adsCore.js` — 2
- `lib/supportEmailTransport.js` — 2
- `api/profile` — 1
- `lib/security` — 1
- `lib/subscriptions.js` — 1
- `lib/tma.js` — 1
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

- `lib/ql7-support` — 2

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

- `lib/ql7-support` — 187
- `components` — 51
- `src/shared` — 25
- `root` — 23
- `lib/mongo` — 18
- `forum/feed` — 15
- `forum/media` — 12
- `forum/dm` — 11
- `forum/shared` — 4
- `lib/exchange` — 3
- `lib/forum` — 3
- `lib/forumClientVideoOptimizer.js` — 3

### src/shared

- `src/shared` — 31
- `config` — 3

### tools

- `tools` — 28
- `forum/shared` — 1

## Файлы С Высоким Fan-In

- `app/api/forum/_utils.js` — fan-in 44; основные потребители: `app/api/academy/exam/route.js`, `app/api/forum/_db.js`, `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/admin/verify/route.js`, `app/api/forum/inbox/replies/page/route.js`
- `components/i18n.js` — fan-in 38; основные потребители: `app/about/page.js`, `app/academy/AcademyExamBlock.js`, `app/academy/page.js`, `app/ads/AdsGeoTargetingPortal.jsx`, `app/ads/GeoTargetingPicker.jsx`, `app/ads/home.js`, `app/ads/page.jsx`, `app/components/CryptoNewsLens.jsx`
- `lib/mongo/client.cjs` — fan-in 37; основные потребители: `app/api/dm/send/route.js`, `app/api/dm/support-card-translate/route.js`, `app/api/dm/support-entry/route.js`, `app/api/dm/support-feedback/route.js`, `app/api/dm/support-state/route.js`, `app/api/dm/thread/route.js`, `app/api/forum/recommendations/users/route.js`, `app/api/profile/user-popover/route.js`
- `lib/ql7-support/internal/text.js` — fan-in 37; основные потребители: `lib/ql7-support/config/behaviorManifest.js`, `lib/ql7-support/conversation/ledger.js`, `lib/ql7-support/data/adapterReceipt.js`, `lib/ql7-support/data/factProjection.js`, `lib/ql7-support/data/simulationFixtures.js`, `lib/ql7-support/knowledge/domainKnowledge.js`, `lib/ql7-support/knowledge/domainRegistry.js`, `lib/ql7-support/language/humanResponsePacks.provider.js`
- `lib/ql7-support/ecosystemCatalog.js` — fan-in 34; основные потребители: `app/forum/features/dm/components/Ql7SupportOperator.jsx`, `app/forum/features/dm/hooks/useForumDmRuntime.js`, `app/forum/features/dm/services/sendDmComposerMessage.js`, `lib/ql7-support/caseEngine.js`, `lib/ql7-support/config/behaviorManifest.js`, `lib/ql7-support/diagnosticPresentation.js`, `lib/ql7-support/diagnosticRegistry.js`, `lib/ql7-support/diagnostics.js`
- `app/api/profile/_identity.js` — fan-in 27; основные потребители: `app/api/dm/_utils.js`, `app/api/forum/_db.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/mutate/route.js`, `app/api/forum/own/route.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/report/route.js`, `app/api/forum/subs/count/route.js`
- `lib/mongo/profile-primary.cjs` — fan-in 26; основные потребители: `app/api/debug/vip/grant/route.js`, `app/api/forum/_db.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/user-search/rebuild/route.js`, `app/api/pay/create/route.js`, `app/api/profile/_identity.js`, `app/api/profile/batch/route.js`, `app/api/profile/check-nick/route.js`
- `tools/runtime-governance.js` — fan-in 25; основные потребители: `tools/audit-adaptive-actions.js`, `tools/audit-adaptive-core.js`, `tools/audit-auth-cascade.js`, `tools/audit-console-noise.js`, `tools/audit-diagnostics-boundaries.js`, `tools/audit-feature-flag-safety.js`, `tools/audit-forensic-mode-bounds.js`, `tools/audit-iframe-restore.js`
- `app/api/forum/_db.js` — fan-in 22; основные потребители: `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/mediaLock/route.js`, `app/api/forum/mutate/route.js`, `app/api/forum/recommendations/users/route.js`
- `lib/ql7-support/systemActor.js` — fan-in 22; основные потребители: `app/api/dm/_utils.js`, `app/api/dm/block/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`, `app/api/profile/check-nick/route.js`, `app/api/profile/save-nick/route.js`
- `app/forum/features/profile/utils/profileCache.js` — fan-in 20; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/InboxRepliesPane.jsx`, `app/forum/features/feed/components/ForumPostCard.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/PublishedPostsPane.jsx`, `app/forum/features/feed/components/ThreadRepliesPane.jsx`, `app/forum/features/feed/components/TopicItem.jsx`
- `app/forum/shared/utils/classnames.js` — fan-in 19; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/dm/components/Ql7SupportOperator.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationsRail.jsx`, `app/forum/features/profile/components/AboutRail.jsx`
- `app/api/dm/_utils.js` — fan-in 16; основные потребители: `app/api/dm/_db.js`, `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/support-card-translate/route.js`, `app/api/dm/support-feedback/route.js`
- `app/api/metamarket/_format.js` — fan-in 15; основные потребители: `app/api/metamarket/_catalog.js`, `app/api/metamarket/_db.js`, `app/api/metamarket/_identity.js`, `app/api/metamarket/_locks.js`, `app/api/metamarket/_transactions.js`, `app/api/metamarket/buy/route.js`, `app/api/metamarket/collection/route.js`, `app/api/metamarket/gift/route.js`
- `lib/subscriptions.js` — fan-in 15; основные потребители: `app/api/battlecoin/order/route.js`, `app/api/battlecoin/state/route.js`, `app/api/debug/vip/grant/route.js`, `app/api/debug/vip/route.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/vip/batch/route.js`, `app/api/metamarket/_db.js`, `app/api/metamarket/state/route.js`
- `lib/mongo/qcoin-primary.cjs` — fan-in 14; основные потребители: `app/api/academy/exam/route.js`, `app/api/profile/user-popover/route.js`, `app/api/qcoin/drop/route.js`, `app/api/qcoin/get/route.js`, `app/api/qcoin/heartbeat/route.js`, `app/api/qcoin/topup/cancel/route.js`, `app/api/qcoin/topup/create/route.js`, `app/api/qcoin/topup/webhook/route.js`
- `lib/forum/forum-server-complete-reader.cjs` — fan-in 13; основные потребители: `app/api/forum/inbox/replies/page/route.js`, `app/api/forum/post-by-id/route.js`, `app/api/forum/post-chain/route.js`, `app/api/forum/post-locate/route.js`, `app/api/forum/post-meta/route.js`, `app/api/forum/search/page/route.js`, `app/api/forum/snapshot/route.js`, `app/api/forum/thread/locate/route.js`
- `lib/ql7-support/cards.js` — fan-in 13; основные потребители: `lib/ql7-support/events.js`, `lib/ql7-support/v12/premiumCardLayoutV12.js`, `tests/component/ql7-support/adult-card-v2.test.js`, `tests/component/ql7-support/cosmic-v11-actions.test.js`, `tests/component/ql7-support/final-card-media-v7.test.js`, `tests/component/ql7-support/premium-card.test.js`, `tests/contracts/project/ql7-support-contracts.test.js`, `tests/contracts/project/ql7-support-cosmic-v11-contracts.test.js`
- `lib/ql7-support/featureFlag.js` — fan-in 12; основные потребители: `app/api/dm/block/route.js`, `app/api/dm/send/route.js`, `app/api/dm/support-entry/route.js`, `app/api/dm/support-feedback/route.js`, `app/api/dm/support-state/route.js`, `app/api/dm/support-worker/route.js`, `app/api/dm/unblock/route.js`, `app/forum/features/dm/components/DmDialogRow.jsx`
- `lib/ql7-support/semanticRouter.js` — fan-in 12; основные потребители: `lib/ql7-support/server.js`, `lib/ql7-support/v12/factualSimulationV12.js`, `tests/integration/ql7-support/adult-pipeline-v6.test.js`, `tests/integration/ql7-support/cosmic-v11-pipeline.test.js`, `tests/unit/ql7-support/adult-intelligence-v6.test.js`, `tests/unit/ql7-support/cosmic-intelligence-v11.test.js`, `tests/unit/ql7-support/human-conversation-v11-5.test.js`, `tests/unit/ql7-support/intelligence-calibration-v29.test.js`
- `lib/webPush.js` — fan-in 12; основные потребители: `app/api/dm/delete/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/forum/mutate/route.js`, `app/api/metamarket/gift/route.js`, `app/api/push/config/route.js`, `app/api/push/events/route.js`, `app/api/push/subscribe/route.js`
- `tests/support/runtimeGovernance.js` — fan-in 12; основные потребители: `tests/component/runtime/runtimeComponentSurfaces.test.jsx`, `tests/contracts/forum/media-budget-owner.contract.test.js`, `tests/contracts/forum/player-budget-profiles.contract.test.js`, `tests/contracts/forum/qcast-shared-mute-owner.contract.test.js`, `tests/contracts/forum/same-src-thrash-guard.contract.test.js`, `tests/contracts/mobile/android-shell-contracts.test.js`, `tests/contracts/project/runtime-governance-contracts.test.js`, `tests/contracts/root/auth-bus-budget.contract.test.js`
- `app/forum/shared/utils/counts.js` — fan-in 11; основные потребители: `app/forum/features/dm/components/InboxTabsHeader.jsx`, `app/forum/features/feed/components/PostActionBar.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/profile/components/ProfilePopover.jsx`, `app/forum/features/profile/components/UserInfoPopover.jsx`, `app/forum/features/subscriptions/components/FollowersCounterInline.jsx`, `app/forum/features/subscriptions/components/SubscriptionsPopover.jsx`
- `lib/mongo/dm-primary.cjs` — fan-in 11; основные потребители: `app/api/dm/_db.js`, `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`
- `lib/mongo/forum-primary.cjs` — fan-in 11; основные потребители: `app/api/forum/_db.js`, `app/api/forum/mutate/route.js`, `app/api/forum/own/route.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/report/route.js`, `app/api/forum/rev/route.js`, `app/api/forum/subs/people/route.js`, `app/forum/p/[postId]/route.js`
- `lib/ql7-support/config/featureFlag.js` — fan-in 11; основные потребители: `app/api/dm/dialogs/route.js`, `app/api/dm/support-card-translate/route.js`, `app/api/dm/thread/route.js`, `lib/ql7-support/broadcast.js`, `lib/ql7-support/config/capabilitySnapshot.js`, `lib/ql7-support/emailOutboxWorker.js`, `lib/ql7-support/events.js`, `lib/ql7-support/featureFlag.js`
- `lib/ql7-support/inputPolicy.js` — fan-in 11; основные потребители: `app/api/dm/send/route.js`, `app/forum/features/dm/hooks/useForumDmRuntime.js`, `app/forum/features/dm/services/sendDmComposerMessage.js`, `app/forum/features/ui/components/ComposerActionRail.jsx`, `lib/ql7-support/runtime/executeTurn.js`, `lib/ql7-support/runtimeStateMachine.js`, `lib/ql7-support/server.js`, `lib/ql7-support/v12/factualSimulationV12.js`
- `lib/ql7-support/languageOrchestrator.js` — fan-in 11; основные потребители: `app/api/dm/support-card-translate/route.js`, `lib/ql7-support/providerLocalizationV8.js`, `lib/ql7-support/server.js`, `lib/ql7-support/v12/factualSimulationV12.js`, `lib/ql7-support/v12/languageDialectRouterV12.js`, `lib/ql7-support/v12/structuredLocalizationV12.js`, `tests/unit/ql7-support/intelligence-calibration-v29.test.js`, `tests/unit/ql7-support/premium-ai-v5.test.js`
- `lib/ql7-support/limitsV11.js` — fan-in 11; основные потребители: `app/api/dm/send/route.js`, `app/api/dm/support-feedback/route.js`, `app/forum/features/dm/components/Ql7SupportChoiceCard.js`, `lib/ql7-support/adultLanguagePolicy.js`, `lib/ql7-support/cognitiveMemoryV11.js`, `lib/ql7-support/responsePlan.js`, `lib/ql7-support/server.js`, `lib/ql7-support/simulationEvaluatorV11.js`
- `app/api/metamarket/_identity.js` — fan-in 10; основные потребители: `app/api/metamarket/_transactions.js`, `app/api/metamarket/buy/route.js`, `app/api/metamarket/collection/route.js`, `app/api/metamarket/gift/route.js`, `app/api/metamarket/my-collection/route.js`, `app/api/metamarket/owners/route.js`, `app/api/metamarket/quote/route.js`, `app/api/metamarket/sell/route.js`
- `app/forum/features/profile/components/AvatarEmoji.jsx` — fan-in 10; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/subscriptions/components/SubscriptionsPopover.jsx`, `app/forum/features/ui/components/ForumSearchSortControls.jsx`
- `components/TopBar.js` — fan-in 10; основные потребители: `app/about/page.js`, `app/academy/page.js`, `app/ads/page.jsx`, `app/exchange/page.js`, `app/forum/page.js`, `app/game/page.js`, `app/layout.js`, `app/page.js`
- `lib/metadataCache.js` — fan-in 10; основные потребители: `app/about/layout.js`, `app/academy/layout.js`, `app/ads/layout.js`, `app/contact/layout.js`, `app/exchange/layout.js`, `app/forum/layout.js`, `app/game/layout.js`, `app/layout.js`
- `lib/ql7-support/adultLanguagePolicy.js` — fan-in 10; основные потребители: `lib/ql7-support/adminReportComposer.js`, `lib/ql7-support/cardSchemaV2.js`, `lib/ql7-support/diagnosticPresentation.js`, `lib/ql7-support/localDictionaryContext.js`, `lib/ql7-support/naturalLanguageRealizer.js`, `lib/ql7-support/responsePlan.js`, `lib/ql7-support/speechEngine.js`, `lib/ql7-support/topicActionRegistryV9.js`
- `lib/ql7-support/config/behaviorManifest.js` — fan-in 10; основные потребители: `lib/ql7-support/config/capabilitySnapshot.js`, `lib/ql7-support/entryGreetingLexiconV11.js`, `lib/ql7-support/language/humanVariationBanks.js`, `lib/ql7-support/language/locales.js`, `lib/ql7-support/language/responseLocalePolicy.js`, `lib/ql7-support/runtime/executeTurn.js`, `lib/ql7-support/simulation/corpora/knowledge32V14.js`, `tests/contracts/ql7-support-v14.contract.test.js`
- `lib/ql7-support/runtime/executeTurn.js` — fan-in 10; основные потребители: `lib/ql7-support/runtime/productionTurn.js`, `lib/ql7-support/simulation/productionParityHarness.js`, `lib/ql7-support/v12/factualSimulationV12.js`, `lib/ql7-support/v12/responsePlannerV12.js`, `lib/ql7-support/v13/index.js`, `lib/ql7-support/v13/runtimeV13.js`, `tests/component/ql7-support-v14-surface.component.test.jsx`, `tests/smoke/ql7-support-v14-runtime.smoke.test.js`
- `lib/ql7-support/toxicityEngine.js` — fan-in 10; основные потребители: `lib/ql7-support/server.js`, `lib/ql7-support/v12/factualSimulationV12.js`, `tests/unit/ql7-support/human-conversation-v11-5.test.js`, `tests/unit/ql7-support/intelligence-calibration-v29.test.js`, `tests/unit/ql7-support/premium-ai-v5.test.js`, `tests/unit/ql7-support/premium-cognitive-v9.test.js`, `tests/unit/ql7-support/runtime-completion-v18.test.js`, `tests/unit/ql7-support/semantic-breadth-v11-4.test.js`
- `app/forum/shared/components/HydrateText.jsx` — fan-in 9; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostActionBar.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/profile/components/UserInfoPopover.jsx`, `app/forum/features/subscriptions/components/FollowersCounterInline.jsx`
- `app/forum/shared/constants/media.js` — fan-in 9; основные потребители: `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/upload/route.js`, `app/api/forum/uploadVideo/route.js`, `app/forum/features/media/components/VideoLimitOverlay.jsx`, `app/forum/features/media/components/VideoTrimPopover.jsx`, `app/forum/features/media/hooks/useForumComposerAttachments.js`, `app/forum/features/media/services/resolveComposerMediaPayload.js`, `app/forum/features/media/utils/mediaRuntime.js`
- `app/forum/shared/utils/forumWindowingRegistry.js` — fan-in 9; основные потребители: `app/forum/features/feed/hooks/useForumDeepLinkFlow.js`, `app/forum/features/feed/hooks/usePostParentReplyNav.js`, `app/forum/features/feed/hooks/useThreadOpenNavigation.js`, `app/forum/features/feed/utils/navScroll.js`, `app/forum/features/feed/utils/openThreadFromPost.js`, `app/forum/features/feed/utils/postFocus.js`, `app/forum/ForumRoot.jsx`, `app/forum/shared/hooks/useForumWindowing.js`

## Вывод

- Файлы с высоким fan-in требуют особенно осторожных изменений.
- Самые чувствительные зоны обычно находятся в `app/forum`, `app/api/*`, `components/i18n.js`, `lib/*` и корневых route/layout файлах.
