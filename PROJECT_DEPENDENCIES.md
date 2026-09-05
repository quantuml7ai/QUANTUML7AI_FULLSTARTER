# PROJECT_DEPENDENCIES.md

> Обязательное правило сопровождения:
> Если появляются новые крупные зависимости между доменами, меняются import-графы или переносится ownership между зонами, этот файл должен быть обновлен.
> Рекомендуемый способ обновления: `node tools/generate-project-dependencies.js`.

Сгенерировано автоматически: 2026-09-05T12:24:45.141Z
Исходных файлов в анализе: 1946
Локальных зависимостей: 3114

## Охват

- Локальные импорты между `app`, `components`, `lib`, `tools`, `public`.
- Межзоновые зависимости по доменам и слоям.
- Файлы с высоким fan-in, то есть большим радиусом поломки.

## Размер Зон

- `api/_diag` — 1 файлов
- `api/academy` — 1 файлов
- `api/account-restrictions` — 1 файлов
- `api/ads` — 1 файлов
- `api/aiquota` — 1 файлов
- `api/app-shell` — 1 файлов
- `api/battlecoin` — 5 файлов
- `api/brain` — 1 файлов
- `api/coins` — 1 файлов
- `api/composer-safety` — 1 файлов
- `api/contact` — 1 файлов
- `api/crypto-news` — 1 файлов
- `api/debug` — 1 файлов
- `api/deep-translate` — 1 файлов
- `api/dm` — 16 файлов
- `api/forum` — 43 файлов
- `api/geo` — 1 файлов
- `api/market` — 1 файлов
- `api/metamarket` — 16 файлов
- `api/metastudio` — 1 файлов
- `api/pay` — 3 файлов
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
- `app/[lang]` — 1 файлов
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
- `app/trust-and-identity` — 1 файлов
- `components` — 60 файлов
- `config` — 1 файлов
- `forum/diagnostics` — 2 файлов
- `forum/dm` — 42 файлов
- `forum/feed` — 60 файлов
- `forum/geo` — 1 файлов
- `forum/media` — 44 файлов
- `forum/moderation` — 9 файлов
- `forum/profile` — 18 файлов
- `forum/qcoin` — 6 файлов
- `forum/quests` — 10 файлов
- `forum/root` — 14 файлов
- `forum/shared` — 27 файлов
- `forum/styles` — 11 файлов
- `forum/subscriptions` — 4 файлов
- `forum/ui` — 52 файлов
- `lib/account-restrictions` — 6 файлов
- `lib/ads` — 1 файлов
- `lib/adsCore.js` — 1 файлов
- `lib/adsGeoTargetingFlow.js` — 1 файлов
- `lib/adsLandingPackageState.js` — 1 файлов
- `lib/auth` — 1 файлов
- `lib/authActionGateClient.js` — 1 файлов
- `lib/battlecoin` — 3 файлов
- `lib/brain.js` — 1 файлов
- `lib/brand` — 1 файлов
- `lib/composer-safety` — 58 файлов
- `lib/databroker.js` — 1 файлов
- `lib/deepTranslateService.js` — 1 файлов
- `lib/economic-integrity` — 16 файлов
- `lib/exchange` — 3 файлов
- `lib/fcm.js` — 1 файлов
- `lib/forum` — 9 файлов
- `lib/forumClientVideoOpfs.js` — 1 файлов
- `lib/forumClientVideoOptimizer.js` — 1 файлов
- `lib/forumClientVideoOptimizerWorker.js` — 1 файлов
- `lib/forumClientVideoRuntime.js` — 1 файлов
- `lib/forumClientVideoWorkerBridge.js` — 1 файлов
- `lib/forumClientVideoWorkerProtocol.js` — 1 файлов
- `lib/forumShareManager.js` — 1 файлов
- `lib/forumVideoTrim.js` — 1 файлов
- `lib/geo` — 6 файлов
- `lib/identity` — 3 файлов
- `lib/indicators.js` — 1 файлов
- `lib/metadataCache.js` — 1 файлов
- `lib/migrations` — 1 файлов
- `lib/mongo` — 22 файлов
- `lib/nativePush.js` — 1 файлов
- `lib/nativeVideoPoster.js` — 1 файлов
- `lib/notificationCenter.js` — 1 файлов
- `lib/paymentMethodClient.js` — 1 файлов
- `lib/qcoinEntitlementPurchase.js` — 1 файлов
- `lib/ql7-support` — 810 файлов
- `lib/ql7HevcDecoderWorker.js` — 1 файлов
- `lib/ql7HevcFallbackDecoder.js` — 1 файлов
- `lib/ql7HevcFallbackPrimitives.js` — 1 файлов
- `lib/ql7HevcPresentationReorder.js` — 1 файлов
- `lib/redis.js` — 1 файлов
- `lib/safeWin.js` — 1 файлов
- `lib/security` — 1 файлов
- `lib/seo` — 8 файлов
- `lib/storage` — 2 файлов
- `lib/subscriptions.js` — 1 файлов
- `lib/supportEmailTransport.js` — 1 файлов
- `lib/tma.js` — 1 файлов
- `lib/videoPipelineProgress.js` — 1 файлов
- `lib/visual-runtime` — 3 файлов
- `lib/walletSessionClient.js` — 1 файлов
- `lib/webPush.js` — 1 файлов
- `public/__ql7_visual_posters` — 1 файлов
- `public/.well-known` — 2 файлов
- `public/academy` — 1 файлов
- `public/compat.js` — 1 файлов
- `public/game` — 1 файлов
- `public/metab` — 1 файлов
- `public/metamarket` — 8 файлов
- `public/models` — 1 файлов
- `public/ql7-notification-sw.js` — 1 файлов
- `public/robot` — 1 файлов
- `public/tonconnect-manifest.json` — 1 файлов
- `public/vendor` — 7 файлов
- `public/vip` — 2 файлов
- `public/workers` — 2 файлов
- `root` — 257 файлов
- `src/shared` — 32 файлов
- `tools` — 94 файлов

## Топ Межзоновых Зависимостей

- `lib/ql7-support` -> `lib/ql7-support` — 919 локальных импортов
- `root` -> `lib/ql7-support` — 332 локальных импортов
- `root` -> `components` — 69 локальных импортов
- `api/dm` -> `lib/ql7-support` — 64 локальных импортов
- `lib/composer-safety` -> `lib/composer-safety` — 53 локальных импортов
- `api/forum` -> `api/forum` — 51 локальных импортов
- `forum/dm` -> `forum/dm` — 50 локальных импортов
- `api/metamarket` -> `api/metamarket` — 45 локальных импортов
- `components` -> `components` — 44 локальных импортов
- `forum/feed` -> `forum/feed` — 42 локальных импортов
- `lib/mongo` -> `lib/mongo` — 37 локальных импортов
- `forum/feed` -> `forum/shared` — 32 локальных импортов
- `forum/ui` -> `forum/ui` — 32 локальных импортов
- `src/shared` -> `src/shared` — 31 локальных импортов
- `tools` -> `tools` — 30 локальных импортов
- `forum/media` -> `forum/media` — 29 локальных импортов
- `root` -> `root` — 29 локальных импортов
- `root` -> `src/shared` — 25 локальных импортов
- `forum/dm` -> `lib/ql7-support` — 22 локальных импортов
- `forum/dm` -> `forum/shared` — 21 локальных импортов
- `api/forum` -> `lib/forum` — 20 локальных импортов
- `lib/economic-integrity` -> `lib/economic-integrity` — 20 локальных импортов
- `root` -> `lib/mongo` — 20 локальных импортов
- `app/layout.js` -> `components` — 18 локальных импортов
- `forum/root` -> `forum/ui` — 18 локальных импортов
- `api/dm` -> `lib/mongo` — 17 локальных импортов
- `forum/feed` -> `forum/profile` — 16 локальных импортов
- `root` -> `forum/feed` — 16 локальных импортов
- `root` -> `lib/composer-safety` — 16 локальных импортов
- `tools` -> `components` — 16 локальных импортов
- `api/dm` -> `api/dm` — 15 локальных импортов
- `api/forum` -> `api/profile` — 15 локальных импортов
- `forum/root` -> `forum/shared` — 15 локальных импортов
- `lib/seo` -> `lib/seo` — 14 локальных импортов
- `root` -> `lib/seo` — 14 локальных импортов
- `app/exchange` -> `app/exchange` — 13 локальных импортов
- `forum/media` -> `forum/shared` — 13 локальных импортов
- `forum/profile` -> `forum/profile` — 13 локальных импортов
- `forum/profile` -> `forum/shared` — 13 локальных импортов
- `forum/root` -> `forum/feed` — 13 локальных импортов
- `root` -> `forum/media` — 13 локальных импортов
- `forum/dm` -> `forum/profile` — 12 локальных импортов
- `lib/ql7-support` -> `lib/composer-safety` — 12 локальных импортов
- `forum/root` -> `forum/media` — 11 локальных импортов
- `lib/forum` -> `lib/mongo` — 11 локальных импортов
- `lib/mongo` -> `lib/identity` — 11 локальных импортов
- `tools` -> `lib/seo` — 11 локальных импортов
- `api/forum` -> `lib/mongo` — 10 локальных импортов
- `api/profile` -> `lib/mongo` — 10 локальных импортов
- `forum/ui` -> `forum/media` — 10 локальных импортов

## Исходящие Зависимости По Зонам

### api/_diag

- Нет локальных исходящих импортов.

### api/academy

- `lib/mongo` — 2
- `api/forum` — 1
- `lib/economic-integrity` — 1
- `lib/identity` — 1

### api/account-restrictions

- `api/profile` — 1
- `lib/account-restrictions` — 1

### api/ads

- `api/profile` — 1
- `lib/adsCore.js` — 1
- `lib/forum` — 1
- `lib/storage` — 1

### api/aiquota

- `lib/exchange` — 1
- `lib/identity` — 1

### api/app-shell

- Нет локальных исходящих импортов.

### api/battlecoin

- `lib/mongo` — 4
- `lib/battlecoin` — 3
- `lib/account-restrictions` — 2
- `lib/auth` — 2
- `lib/subscriptions.js` — 2
- `lib/composer-safety` — 1

### api/brain

- `lib/exchange` — 1

### api/coins

- Нет локальных исходящих импортов.

### api/composer-safety

- `lib/composer-safety` — 2

### api/contact

- `lib/supportEmailTransport.js` — 1

### api/crypto-news

- Нет локальных исходящих импортов.

### api/debug

- Нет локальных исходящих импортов.

### api/deep-translate

- `lib/deepTranslateService.js` — 1

### api/dm

- `lib/ql7-support` — 64
- `lib/mongo` — 17
- `api/dm` — 15
- `lib/webPush.js` — 3
- `lib/notificationCenter.js` — 2
- `lib/storage` — 2
- `api/profile` — 1
- `lib/account-restrictions` — 1
- `lib/composer-safety` — 1
- `lib/forum` — 1
- `lib/security` — 1

### api/forum

- `api/forum` — 51
- `lib/forum` — 20
- `api/profile` — 15
- `lib/mongo` — 10
- `lib/storage` — 9
- `lib/account-restrictions` — 6
- `forum/shared` — 3
- `lib/ql7-support` — 2
- `lib/webPush.js` — 2
- `lib/adsCore.js` — 1
- `lib/composer-safety` — 1
- `lib/geo` — 1

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
- `lib/mongo` — 2
- `components` — 1
- `lib/economic-integrity` — 1
- `lib/identity` — 1
- `lib/webPush.js` — 1

### api/metastudio

- `lib/mongo` — 2
- `lib/identity` — 1

### api/pay

- `lib/mongo` — 5
- `lib/adsCore.js` — 2
- `lib/economic-integrity` — 1
- `lib/identity` — 1
- `lib/qcoinEntitlementPurchase.js` — 1
- `lib/ql7-support` — 1
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
- `lib/economic-integrity` — 2
- `lib/ql7-support` — 1

### api/quest

- `lib/mongo` — 3
- `api/forum` — 2
- `lib/economic-integrity` — 1

### api/quotes

- Нет локальных исходящих импортов.

### api/referral

- `lib/mongo` — 3
- `api/forum` — 2
- `api/profile` — 2
- `lib/identity` — 2
- `lib/economic-integrity` — 1
- `lib/subscriptions.js` — 1

### api/subscription

- `lib/subscriptions.js` — 1

### api/telegram

- `lib/mongo` — 3
- `lib/redis.js` — 2
- `lib/identity` — 1
- `lib/subscriptions.js` — 1

### api/tma

- `lib/mongo` — 1

### api/wallet-session

- `lib/identity` — 1
- `lib/ql7-support` — 1

### app/[lang]

- `lib/seo` — 4
- `components` — 1

### app/about

- `components` — 3
- `app/ads.js` — 1
- `lib/metadataCache.js` — 1

### app/academy

- `components` — 3
- `app/academy` — 1
- `app/ads.js` — 1
- `lib/metadataCache.js` — 1
- `lib/paymentMethodClient.js` — 1

### app/ads

- `components` — 6
- `app/ads` — 3
- `forum/media` — 2
- `forum/moderation` — 2
- `lib/adsGeoTargetingFlow.js` — 2
- `lib/geo` — 2
- `forum/shared` — 1
- `lib/adsLandingPackageState.js` — 1
- `lib/forumClientVideoOptimizer.js` — 1
- `lib/metadataCache.js` — 1
- `lib/nativeVideoPoster.js` — 1
- `lib/paymentMethodClient.js` — 1

### app/ads.js

- `forum/root` — 1

### app/components

- `components` — 1
- `lib/visual-runtime` — 1

### app/contact

- `lib/seo` — 2
- `lib/metadataCache.js` — 1

### app/exchange

- `app/exchange` — 13
- `components` — 8
- `lib/exchange` — 2
- `lib/paymentMethodClient.js` — 2
- `app/ads.js` — 1
- `forum/profile` — 1
- `forum/ui` — 1
- `lib/authActionGateClient.js` — 1
- `lib/brain.js` — 1
- `lib/forumShareManager.js` — 1
- `lib/metadataCache.js` — 1
- `lib/visual-runtime` — 1

### app/game

- `components` — 2
- `app/ads.js` — 1
- `forum/shared` — 1
- `lib/metadataCache.js` — 1
- `lib/walletSessionClient.js` — 1

### app/jsconfig.json

- Нет локальных исходящих импортов.

### app/layout.js

- `components` — 18
- `app/providers.jsx` — 1
- `lib/metadataCache.js` — 1
- `lib/seo` — 1

### app/page.js

- `components` — 3
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

- `lib/seo` — 3

### app/subscribe

- `components` — 3
- `app/ads.js` — 1
- `app/subscribe` — 1
- `lib/metadataCache.js` — 1
- `lib/paymentMethodClient.js` — 1

### app/tma

- `components` — 2

### app/trust-and-identity

- `lib/seo` — 1

### components

- `components` — 44
- `lib/visual-runtime` — 6
- `lib/authActionGateClient.js` — 5
- `lib/seo` — 4
- `lib/walletSessionClient.js` — 4
- `forum/qcoin` — 3
- `forum/profile` — 2
- `lib/brand` — 2
- `lib/account-restrictions` — 1
- `lib/composer-safety` — 1
- `lib/notificationCenter.js` — 1
- `lib/paymentMethodClient.js` — 1

### config

- Нет локальных исходящих импортов.

### forum/diagnostics

- `forum/diagnostics` — 1

### forum/dm

- `forum/dm` — 50
- `lib/ql7-support` — 22
- `forum/shared` — 21
- `forum/profile` — 12
- `forum/feed` — 3
- `forum/ui` — 2
- `components` — 1
- `forum/media` — 1
- `lib/authActionGateClient.js` — 1

### forum/feed

- `forum/feed` — 42
- `forum/shared` — 32
- `forum/profile` — 16
- `forum/media` — 6
- `forum/ui` — 6
- `forum/dm` — 4
- `components` — 3
- `forum/root` — 3
- `forum/quests` — 1
- `forum/subscriptions` — 1

### forum/geo

- Нет локальных исходящих импортов.

### forum/media

- `forum/media` — 29
- `forum/shared` — 13
- `forum/feed` — 4
- `lib/nativeVideoPoster.js` — 4
- `lib/forumClientVideoOptimizer.js` — 2
- `lib/forumVideoTrim.js` — 2
- `lib/videoPipelineProgress.js` — 2
- `components` — 1
- `forum/moderation` — 1
- `forum/profile` — 1
- `forum/root` — 1

### forum/moderation

- `forum/moderation` — 6
- `forum/root` — 1
- `forum/shared` — 1

### forum/profile

- `forum/profile` — 13
- `forum/shared` — 13
- `components` — 4
- `forum/subscriptions` — 3
- `forum/qcoin` — 2
- `lib/ql7-support` — 2
- `lib/authActionGateClient.js` — 1
- `lib/paymentMethodClient.js` — 1
- `lib/walletSessionClient.js` — 1

### forum/qcoin

- `forum/qcoin` — 3
- `components` — 1
- `forum/shared` — 1

### forum/quests

- `forum/quests` — 9
- `components` — 1
- `forum/shared` — 1

### forum/root

- `forum/ui` — 18
- `forum/shared` — 15
- `forum/feed` — 13
- `forum/media` — 11
- `forum/profile` — 9
- `components` — 7
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

- `forum/ui` — 32
- `forum/media` — 10
- `components` — 8
- `forum/feed` — 6
- `forum/dm` — 5
- `forum/profile` — 5
- `forum/shared` — 5
- `forum/root` — 4
- `forum/moderation` — 1
- `forum/quests` — 1
- `forum/subscriptions` — 1
- `lib/authActionGateClient.js` — 1

### lib/account-restrictions

- `lib/account-restrictions` — 3
- `lib/mongo` — 1

### lib/ads

- Нет локальных исходящих импортов.

### lib/adsCore.js

- `lib/mongo` — 2
- `lib/storage` — 2
- `lib/economic-integrity` — 1
- `lib/identity` — 1
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

### lib/brand

- Нет локальных исходящих импортов.

### lib/composer-safety

- `lib/composer-safety` — 53
- `lib/ql7-support` — 4
- `lib/mongo` — 3
- `lib/account-restrictions` — 1

### lib/databroker.js

- Нет локальных исходящих импортов.

### lib/deepTranslateService.js

- Нет локальных исходящих импортов.

### lib/economic-integrity

- `lib/economic-integrity` — 20
- `lib/account-restrictions` — 3
- `lib/mongo` — 2

### lib/exchange

- `lib/brain.js` — 1
- `lib/databroker.js` — 1
- `lib/identity` — 1

### lib/fcm.js

- Нет локальных исходящих импортов.

### lib/forum

- `lib/mongo` — 11
- `lib/forum` — 6
- `lib/geo` — 4
- `lib/security` — 2
- `lib/identity` — 1

### lib/forumClientVideoOpfs.js

- `lib/forumClientVideoRuntime.js` — 1

### lib/forumClientVideoOptimizer.js

- `lib/forumClientVideoRuntime.js` — 1
- `lib/forumClientVideoWorkerBridge.js` — 1
- `lib/ql7HevcFallbackDecoder.js` — 1

### lib/forumClientVideoOptimizerWorker.js

- `lib/forumClientVideoOpfs.js` — 1
- `lib/forumClientVideoRuntime.js` — 1
- `lib/forumClientVideoWorkerProtocol.js` — 1
- `lib/ql7HevcFallbackDecoder.js` — 1

### lib/forumClientVideoRuntime.js

- Нет локальных исходящих импортов.

### lib/forumClientVideoWorkerBridge.js

- `lib/forumClientVideoRuntime.js` — 1
- `lib/forumClientVideoWorkerProtocol.js` — 1

### lib/forumClientVideoWorkerProtocol.js

- Нет локальных исходящих импортов.

### lib/forumShareManager.js

- Нет локальных исходящих импортов.

### lib/forumVideoTrim.js

- Нет локальных исходящих импортов.

### lib/geo

- `lib/geo` — 3
- `lib/forum` — 2

### lib/identity

- `lib/identity` — 2
- `lib/mongo` — 1

### lib/indicators.js

- Нет локальных исходящих импортов.

### lib/metadataCache.js

- `lib/seo` — 1

### lib/migrations

- Нет локальных исходящих импортов.

### lib/mongo

- `lib/mongo` — 37
- `lib/identity` — 11
- `lib/economic-integrity` — 5
- `lib/battlecoin` — 2
- `lib/forum` — 1
- `lib/geo` — 1
- `lib/ql7-support` — 1

### lib/nativePush.js

- `api/profile` — 1
- `lib/fcm.js` — 1
- `lib/notificationCenter.js` — 1

### lib/nativeVideoPoster.js

- Нет локальных исходящих импортов.

### lib/notificationCenter.js

- Нет локальных исходящих импортов.

### lib/paymentMethodClient.js

- Нет локальных исходящих импортов.

### lib/qcoinEntitlementPurchase.js

- `lib/mongo` — 3
- `lib/adsCore.js` — 1
- `lib/economic-integrity` — 1
- `lib/ql7-support` — 1
- `lib/subscriptions.js` — 1

### lib/ql7-support

- `lib/ql7-support` — 919
- `lib/composer-safety` — 12
- `lib/mongo` — 7
- `lib/economic-integrity` — 6
- `lib/account-restrictions` — 4
- `lib/adsCore.js` — 2
- `lib/security` — 2
- `lib/seo` — 2
- `lib/supportEmailTransport.js` — 2
- `api/profile` — 1
- `lib/brand` — 1
- `lib/exchange` — 1

### lib/ql7HevcDecoderWorker.js

- `lib/ql7HevcFallbackPrimitives.js` — 1

### lib/ql7HevcFallbackDecoder.js

- `lib/ql7HevcFallbackPrimitives.js` — 1
- `lib/ql7HevcPresentationReorder.js` — 1

### lib/ql7HevcFallbackPrimitives.js

- Нет локальных исходящих импортов.

### lib/ql7HevcPresentationReorder.js

- Нет локальных исходящих импортов.

### lib/redis.js

- Нет локальных исходящих импортов.

### lib/safeWin.js

- Нет локальных исходящих импортов.

### lib/security

- `lib/mongo` — 1

### lib/seo

- `lib/seo` — 14
- `components` — 8
- `lib/brand` — 2

### lib/storage

- Нет локальных исходящих импортов.

### lib/subscriptions.js

- `lib/mongo` — 2
- `lib/identity` — 1
- `lib/ql7-support` — 1

### lib/supportEmailTransport.js

- `lib/ql7-support` — 3

### lib/tma.js

- Нет локальных исходящих импортов.

### lib/videoPipelineProgress.js

- Нет локальных исходящих импортов.

### lib/visual-runtime

- Нет локальных исходящих импортов.

### lib/walletSessionClient.js

- Нет локальных исходящих импортов.

### lib/webPush.js

- `api/profile` — 1
- `lib/mongo` — 1
- `lib/nativePush.js` — 1
- `lib/notificationCenter.js` — 1

### public/__ql7_visual_posters

- Нет локальных исходящих импортов.

### public/.well-known

- Нет локальных исходящих импортов.

### public/academy

- Нет локальных исходящих импортов.

### public/compat.js

- Нет локальных исходящих импортов.

### public/game

- Нет локальных исходящих импортов.

### public/metab

- Нет локальных исходящих импортов.

### public/metamarket

- Нет локальных исходящих импортов.

### public/models

- Нет локальных исходящих импортов.

### public/ql7-notification-sw.js

- Нет локальных исходящих импортов.

### public/robot

- Нет локальных исходящих импортов.

### public/tonconnect-manifest.json

- Нет локальных исходящих импортов.

### public/vendor

- Нет локальных исходящих импортов.

### public/vip

- Нет локальных исходящих импортов.

### public/workers

- Нет локальных исходящих импортов.

### root

- `lib/ql7-support` — 332
- `components` — 69
- `root` — 29
- `src/shared` — 25
- `lib/mongo` — 20
- `forum/feed` — 16
- `lib/composer-safety` — 16
- `lib/seo` — 14
- `forum/media` — 13
- `forum/dm` — 10
- `lib/economic-integrity` — 7
- `forum/shared` — 5

### src/shared

- `src/shared` — 31
- `config` — 3

### tools

- `tools` — 30
- `components` — 16
- `lib/seo` — 11
- `lib/brand` — 2
- `app/sitemap.js` — 1
- `forum/shared` — 1
- `lib/forumClientVideoRuntime.js` — 1
- `lib/ql7-support` — 1

## Файлы С Высоким Fan-In

- `lib/ql7-support/internal/text.js` — fan-in 134; основные потребители: `lib/ql7-support/config/behaviorManifest.js`, `lib/ql7-support/config/staticDataReadiness.js`, `lib/ql7-support/contact/contactConsent.js`, `lib/ql7-support/contact/contactIntelligence.js`, `lib/ql7-support/contact/questionnaire.js`, `lib/ql7-support/contracts/finalDeliveryReceipt.js`, `lib/ql7-support/contracts/supportTurnRequestEnvelope.js`, `lib/ql7-support/conversation/conversationMemoryGraph.js`
- `lib/mongo/client.cjs` — fan-in 47; основные потребители: `app/api/dm/send/route.js`, `app/api/dm/support-broadcast/route.js`, `app/api/dm/support-card-translate/route.js`, `app/api/dm/support-entry/route.js`, `app/api/dm/support-feedback/route.js`, `app/api/dm/support-learning-consent/route.js`, `app/api/dm/support-state/route.js`, `app/api/dm/support-worker/route.js`
- `app/api/forum/_utils.js` — fan-in 44; основные потребители: `app/api/academy/exam/route.js`, `app/api/forum/_db.js`, `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/admin/verify/route.js`, `app/api/forum/inbox/replies/page/route.js`
- `components/i18n.js` — fan-in 41; основные потребители: `app/about/page.js`, `app/academy/AcademyExamBlock.js`, `app/academy/page.js`, `app/ads/AdsGeoTargetingPortal.jsx`, `app/ads/GeoTargetingPicker.jsx`, `app/ads/home.js`, `app/ads/page.jsx`, `app/components/CryptoNewsLens.jsx`
- `lib/ql7-support/ecosystemCatalog.js` — fan-in 38; основные потребители: `app/forum/features/dm/components/Ql7SupportOperator.jsx`, `app/forum/features/dm/hooks/useForumDmRuntime.js`, `app/forum/features/dm/services/sendDmComposerMessage.js`, `lib/ql7-support/config/behaviorManifest.js`, `lib/ql7-support/conversation/conversationMemoryGraph.js`, `lib/ql7-support/conversation/transitionClassifier.js`, `lib/ql7-support/diagnosticPresentation.js`, `lib/ql7-support/diagnosticRegistry.js`
- `lib/ql7-support/language/locales/profileFactory.js` — fan-in 33; основные потребители: `lib/ql7-support/language/locales/ar.js`, `lib/ql7-support/language/locales/az.js`, `lib/ql7-support/language/locales/bg.js`, `lib/ql7-support/language/locales/cs.js`, `lib/ql7-support/language/locales/da.js`, `lib/ql7-support/language/locales/de.js`, `lib/ql7-support/language/locales/el.js`, `lib/ql7-support/language/locales/en.js`
- `app/api/profile/_identity.js` — fan-in 31; основные потребители: `app/api/account-restrictions/status/route.js`, `app/api/ads/route.js`, `app/api/dm/_utils.js`, `app/api/forum/_db.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/moderate/route.js`, `app/api/forum/mutate/route.js`, `app/api/forum/own/route.js`
- `lib/mongo/profile-primary.cjs` — fan-in 31; основные потребители: `app/api/forum/_db.js`, `app/api/forum/user-search/rebuild/route.js`, `app/api/metastudio/register/route.js`, `app/api/pay/create/route.js`, `app/api/pay/webhook/route.js`, `app/api/profile/_identity.js`, `app/api/profile/batch/route.js`, `app/api/profile/check-nick/route.js`
- `lib/ql7-support/config/behaviorManifest.js` — fan-in 28; основные потребители: `lib/ql7-support/entryGreetingLexicon.js`, `lib/ql7-support/eventNotificationCatalog.js`, `lib/ql7-support/events.js`, `lib/ql7-support/knowledge/academy/academyKnowledgeAdapter.js`, `lib/ql7-support/knowledge/knowledgeGraph.js`, `lib/ql7-support/language/humanVariationPrimitives.js`, `lib/ql7-support/language/languageVariantBank.js`, `lib/ql7-support/language/locales.js`
- `tools/runtime-governance.js` — fan-in 25; основные потребители: `tools/audit-adaptive-actions.js`, `tools/audit-adaptive-core.js`, `tools/audit-auth-cascade.js`, `tools/audit-console-noise.js`, `tools/audit-diagnostics-boundaries.js`, `tools/audit-feature-flag-safety.js`, `tools/audit-forensic-mode-bounds.js`, `tools/audit-iframe-restore.js`
- `app/api/forum/_db.js` — fan-in 23; основные потребители: `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/mediaLock/route.js`, `app/api/forum/moderate/route.js`, `app/api/forum/mutate/route.js`
- `lib/ql7-support/config/featureFlag.js` — fan-in 23; основные потребители: `app/api/dm/block/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/send/route.js`, `app/api/dm/support-broadcast/route.js`, `app/api/dm/support-card-translate/route.js`, `app/api/dm/support-entry/route.js`, `app/api/dm/support-feedback/route.js`, `app/api/dm/support-learning-consent/route.js`
- `lib/identity/canonical-user-id.cjs` — fan-in 21; основные потребители: `app/api/forum/_db.js`, `app/api/metastudio/register/route.js`, `app/api/pay/webhook/route.js`, `app/api/telegram/link/start/route.js`, `app/api/wallet-session/route.js`, `lib/adsCore.js`, `lib/exchange/aiQuotaIdentity.js`, `lib/identity/ql7IdentityContract.cjs`
- `lib/ql7-support/systemActor.js` — fan-in 21; основные потребители: `app/api/dm/_utils.js`, `app/api/dm/block/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`, `app/api/profile/check-nick/route.js`, `app/api/profile/save-nick/route.js`
- `app/forum/features/profile/utils/profileCache.js` — fan-in 20; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/InboxRepliesPane.jsx`, `app/forum/features/feed/components/ForumPostCard.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/PublishedPostsPane.jsx`, `app/forum/features/feed/components/ThreadRepliesPane.jsx`, `app/forum/features/feed/components/TopicItem.jsx`
- `lib/seo/trustIdentityRoutes.js` — fan-in 20; основные потребители: `app/[lang]/trust-and-identity/page.js`, `app/contact/page.js`, `app/sitemap.js`, `app/trust-and-identity/route.js`, `components/trust/TrustIdentityAboutTeaser.jsx`, `components/trust/TrustIdentityArticle.jsx`, `components/trust/TrustIdentityLanguageSwitcher.jsx`, `lib/ql7-support/knowledge/officialIdentity.js`
- `app/forum/shared/utils/classnames.js` — fan-in 19; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/dm/components/Ql7SupportOperator.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationsRail.jsx`, `app/forum/features/profile/components/AboutRail.jsx`
- `components/visual-runtime/ViewportAnimatedImage.jsx` — fan-in 19; основные потребители: `app/exchange/ai-box/AIWorkbench.jsx`, `app/forum/features/dm/components/DmMediaRenderer.jsx`, `app/forum/features/feed/components/PostMediaStack.jsx`, `app/forum/features/profile/components/AvatarEmoji.jsx`, `app/forum/features/profile/components/ProfilePopover.jsx`, `app/forum/features/qcoin/components/QCoinWithdrawPopover.jsx`, `app/forum/features/quests/components/QuestHub.jsx`, `app/forum/features/ui/components/ComposerEmojiPanel.jsx`
- `lib/ql7-support/runtime/executeTurn.js` — fan-in 18; основные потребители: `lib/ql7-support/runtime/productionTurn.js`, `lib/ql7-support/simulation/factualSimulation.js`, `lib/ql7-support/simulation/productionParityHarness.js`, `tests/component/ql7-support-surface.component.test.jsx`, `tests/integration/ql7-support-code-data-readiness.integration.test.js`, `tests/integration/ql7-support-p0-novelty.integration.test.js`, `tests/integration/ql7-support-runtime-scope.integration.test.js`, `tests/smoke/ql7-support-runtime.smoke.test.js`
- `app/api/dm/_utils.js` — fan-in 16; основные потребители: `app/api/dm/_db.js`, `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/support-card-translate/route.js`, `app/api/dm/support-feedback/route.js`
- `app/api/metamarket/_format.js` — fan-in 15; основные потребители: `app/api/metamarket/_catalog.js`, `app/api/metamarket/_db.js`, `app/api/metamarket/_identity.js`, `app/api/metamarket/_locks.js`, `app/api/metamarket/_transactions.js`, `app/api/metamarket/buy/route.js`, `app/api/metamarket/collection/route.js`, `app/api/metamarket/gift/route.js`
- `lib/mongo/qcoin-primary.cjs` — fan-in 15; основные потребители: `app/api/academy/exam/route.js`, `app/api/profile/user-popover/route.js`, `app/api/qcoin/drop/route.js`, `app/api/qcoin/get/route.js`, `app/api/qcoin/heartbeat/route.js`, `app/api/qcoin/topup/cancel/route.js`, `app/api/qcoin/topup/create/route.js`, `app/api/qcoin/topup/webhook/route.js`
- `lib/ql7-support/cardSchema.js` — fan-in 15; основные потребители: `app/api/dm/support-card-translate/route.js`, `lib/ql7-support/language/finalDeliveryLocalization.js`, `lib/ql7-support/presentation/premiumCardLayout.js`, `lib/ql7-support/runtime/finalDeliveryVerifier.js`, `lib/ql7-support/runtime/productionTurn.js`, `lib/ql7-support/server.js`, `tests/component/ql7-support-surface.component.test.jsx`, `tests/component/ql7-support/adult-card-test.js`
- `lib/ql7-support/semantics/analyzeTurn.js` — fan-in 15; основные потребители: `lib/ql7-support/runtime/canonicalContext.js`, `lib/ql7-support/runtime/executeTurn.js`, `lib/ql7-support/server.js`, `lib/ql7-support/simulation/factualSimulation.js`, `tests/contracts/ql7-support-doc-version-coherence.contract.test.js`, `tests/integration/ql7-support-live-prelab.integration.test.js`, `tests/unit/ql7-support/canonical-matrix-performance.test.js`, `tests/unit/ql7-support/closure-matrix.test.js`
- `lib/forum/forum-server-complete-reader.cjs` — fan-in 13; основные потребители: `app/api/forum/inbox/replies/page/route.js`, `app/api/forum/post-by-id/route.js`, `app/api/forum/post-chain/route.js`, `app/api/forum/post-locate/route.js`, `app/api/forum/post-meta/route.js`, `app/api/forum/search/page/route.js`, `app/api/forum/snapshot/route.js`, `app/api/forum/thread/locate/route.js`
- `lib/ql7-support/language/locales/manifest.js` — fan-in 13; основные потребители: `lib/ql7-support/knowledge/domainKnowledge.js`, `lib/ql7-support/knowledge/humorLexicalPlan.js`, `lib/ql7-support/knowledge/humorLexiconBank.js`, `lib/ql7-support/language/compositionalGrammar.js`, `lib/ql7-support/language/factPresentationLexicon.js`, `lib/ql7-support/language/lexicalUniverseRegistry.js`, `lib/ql7-support/language/localeOperationFrames.js`, `lib/ql7-support/language/supportSurfaceCopyRegistry.js`
- `lib/subscriptions.js` — fan-in 13; основные потребители: `app/api/battlecoin/order/route.js`, `app/api/battlecoin/state/route.js`, `app/api/forum/vip/batch/route.js`, `app/api/metamarket/_db.js`, `app/api/metamarket/state/route.js`, `app/api/metamarket/token-history/route.js`, `app/api/pay/webhook/route.js`, `app/api/profile/user-popover/route.js`
- `tests/support/projectSurface.js` — fan-in 13; основные потребители: `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/api-route-contracts.test.js`, `tests/contracts/project/app-entry-contracts.test.js`, `tests/contracts/project/canonical-human-identity-contract.test.js`, `tests/contracts/project/economic-runtime-hardening-contract.test.js`, `tests/contracts/project/forum-hook-contracts.test.js`, `tests/contracts/project/forum-media-lock-canonical.contract.test.js`, `tests/contracts/project/forum-post-mutation-convergence.contract.test.js`
- `lib/economic-integrity/productionRoute.cjs` — fan-in 12; основные потребители: `app/api/academy/exam/route.js`, `app/api/metamarket/_transactions.js`, `app/api/pay/webhook/route.js`, `app/api/qcoin/drop/route.js`, `app/api/qcoin/topup/webhook/route.js`, `app/api/quest/progress/route.js`, `app/api/referral/hit/route.js`, `lib/economic-integrity/gate.cjs`
- `lib/ql7-support/runtime/productionTurn.js` — fan-in 12; основные потребители: `lib/ql7-support/server.js`, `lib/ql7-support/simulation/executeScenario.js`, `lib/ql7-support/simulation/liveRead.js`, `lib/ql7-support/simulation/productionParityHarness.js`, `tests/integration/ql7-support-knowledge-integration.test.js`, `tests/integration/ql7-support-neural-production-parity.integration.test.js`, `tests/integration/ql7-support-production-lab-parity.integration.test.js`, `tests/integration/ql7-support-runtime.integration.test.js`
- `lib/webPush.js` — fan-in 12; основные потребители: `app/api/dm/delete/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/forum/moderate/route.js`, `app/api/forum/mutate/route.js`, `app/api/metamarket/gift/route.js`, `app/api/push/config/route.js`, `app/api/push/events/route.js`
- `tests/support/runtimeGovernance.js` — fan-in 12; основные потребители: `tests/component/runtime/runtimeComponentSurfaces.test.jsx`, `tests/contracts/forum/media-budget-owner.contract.test.js`, `tests/contracts/forum/player-budget-profiles.contract.test.js`, `tests/contracts/forum/qcast-shared-mute-owner.contract.test.js`, `tests/contracts/forum/same-src-thrash-guard.contract.test.js`, `tests/contracts/mobile/android-shell-contracts.test.js`, `tests/contracts/project/runtime-governance-contracts.test.js`, `tests/contracts/root/auth-bus-budget.contract.test.js`
- `app/forum/shared/utils/counts.js` — fan-in 11; основные потребители: `app/forum/features/dm/components/InboxTabsHeader.jsx`, `app/forum/features/feed/components/PostActionBar.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/profile/components/ProfilePopover.jsx`, `app/forum/features/profile/components/UserInfoPopover.jsx`, `app/forum/features/subscriptions/components/FollowersCounterInline.jsx`, `app/forum/features/subscriptions/components/SubscriptionsPopover.jsx`
- `components/i18n-dicts/ar.js` — fan-in 11; основные потребители: `components/i18n.js`, `lib/seo/trustIdentityContent.js`, `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/ads-geo-targeting-portal-contracts.test.js`, `tests/contracts/project/exchange-ai-box-contracts.test.js`, `tests/contracts/project/video-pipeline-progress-contracts.test.js`, `tests/unit/i18n/i18nDictionaries.test.js`, `tests/unit/ql7-support/final-runtime.test.js`
- `components/i18n-dicts/en.js` — fan-in 11; основные потребители: `components/i18n.js`, `lib/seo/trustIdentityContent.js`, `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/ads-geo-targeting-portal-contracts.test.js`, `tests/contracts/project/exchange-ai-box-contracts.test.js`, `tests/contracts/project/video-pipeline-progress-contracts.test.js`, `tests/unit/i18n/i18nDictionaries.test.js`, `tests/unit/ql7-support/final-runtime.test.js`
- `components/i18n-dicts/es.js` — fan-in 11; основные потребители: `components/i18n.js`, `lib/seo/trustIdentityContent.js`, `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/ads-geo-targeting-portal-contracts.test.js`, `tests/contracts/project/exchange-ai-box-contracts.test.js`, `tests/contracts/project/video-pipeline-progress-contracts.test.js`, `tests/unit/i18n/i18nDictionaries.test.js`, `tests/unit/ql7-support/final-runtime.test.js`
- `components/i18n-dicts/ru.js` — fan-in 11; основные потребители: `components/i18n.js`, `lib/seo/trustIdentityContent.js`, `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/ads-geo-targeting-portal-contracts.test.js`, `tests/contracts/project/exchange-ai-box-contracts.test.js`, `tests/contracts/project/video-pipeline-progress-contracts.test.js`, `tests/unit/i18n/i18nDictionaries.test.js`, `tests/unit/ql7-support/final-runtime.test.js`
- `components/i18n-dicts/tr.js` — fan-in 11; основные потребители: `components/i18n.js`, `lib/seo/trustIdentityContent.js`, `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/ads-geo-targeting-portal-contracts.test.js`, `tests/contracts/project/exchange-ai-box-contracts.test.js`, `tests/contracts/project/video-pipeline-progress-contracts.test.js`, `tests/unit/i18n/i18nDictionaries.test.js`, `tests/unit/ql7-support/final-runtime.test.js`
- `components/i18n-dicts/uk.js` — fan-in 11; основные потребители: `components/i18n.js`, `lib/seo/trustIdentityContent.js`, `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/ads-geo-targeting-portal-contracts.test.js`, `tests/contracts/project/exchange-ai-box-contracts.test.js`, `tests/contracts/project/video-pipeline-progress-contracts.test.js`, `tests/unit/i18n/i18nDictionaries.test.js`, `tests/unit/ql7-support/final-runtime.test.js`
- `components/i18n-dicts/zh.js` — fan-in 11; основные потребители: `components/i18n.js`, `lib/seo/trustIdentityContent.js`, `tests/contracts/metamarket/metamarket-contracts.test.js`, `tests/contracts/project/ads-geo-targeting-portal-contracts.test.js`, `tests/contracts/project/exchange-ai-box-contracts.test.js`, `tests/contracts/project/video-pipeline-progress-contracts.test.js`, `tests/unit/i18n/i18nDictionaries.test.js`, `tests/unit/ql7-support/final-runtime.test.js`

## Вывод

- Файлы с высоким fan-in требуют особенно осторожных изменений.
- Самые чувствительные зоны обычно находятся в `app/forum`, `app/api/*`, `components/i18n.js`, `lib/*` и корневых route/layout файлах.
