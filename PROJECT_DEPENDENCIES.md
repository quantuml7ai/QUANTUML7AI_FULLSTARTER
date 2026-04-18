# PROJECT_DEPENDENCIES.md

> Обязательное правило сопровождения:
> Если появляются новые крупные зависимости между доменами, меняются import-графы или переносится ownership между зонами, этот файл должен быть обновлен.
> Рекомендуемый способ обновления: `node tools/generate-project-dependencies.js`.

Сгенерировано автоматически: 2026-04-18T03:02:06.634Z
Исходных файлов в анализе: 792
Локальных зависимостей: 687

## Охват

- Локальные импорты между `app`, `components`, `lib`, `tools`, `public`.
- Межзоновые зависимости по доменам и слоям.
- Файлы с высоким fan-in, то есть большим радиусом поломки.

## Размер Зон

- `api/_diag` — 1 файлов
- `api/academy` — 1 файлов
- `api/ads` — 1 файлов
- `api/aiquota` — 1 файлов
- `api/battlecoin` — 2 файлов
- `api/brain` — 1 файлов
- `api/coins` — 1 файлов
- `api/contact` — 1 файлов
- `api/crypto-news` — 1 файлов
- `api/debug` — 1 файлов
- `api/deep-translate` — 1 файлов
- `api/dm` — 9 файлов
- `api/forum` — 30 файлов
- `api/market` — 1 файлов
- `api/pay` — 2 файлов
- `api/payments` — 3 файлов
- `api/profile` — 9 файлов
- `api/qcoin` — 3 файлов
- `api/quest` — 3 файлов
- `api/quotes` — 1 файлов
- `api/referral` — 2 файлов
- `api/subscription` — 1 файлов
- `api/telegram` — 4 файлов
- `api/tma` — 1 файлов
- `app/about` — 2 файлов
- `app/academy` — 3 файлов
- `app/ads` — 4 файлов
- `app/ads.js` — 1 файлов
- `app/components` — 1 файлов
- `app/contact` — 1 файлов
- `app/exchange` — 3 файлов
- `app/game` — 2 файлов
- `app/jsconfig.json` — 1 файлов
- `app/layout.js` — 1 файлов
- `app/page.js` — 1 файлов
- `app/privacy` — 1 файлов
- `app/providers.jsx` — 1 файлов
- `app/subscribe` — 3 файлов
- `app/tma` — 1 файлов
- `audit` — 170 файлов
- `components` — 23 файлов
- `config` — 1 файлов
- `forum/diagnostics` — 2 файлов
- `forum/dm` — 31 файлов
- `forum/feed` — 59 файлов
- `forum/media` — 39 файлов
- `forum/moderation` — 9 файлов
- `forum/profile` — 18 файлов
- `forum/qcoin` — 5 файлов
- `forum/quests` — 11 файлов
- `forum/root` — 14 файлов
- `forum/shared` — 21 файлов
- `forum/styles` — 10 файлов
- `forum/subscriptions` — 3 файлов
- `forum/ui` — 51 файлов
- `lib/adsCore.js` — 1 файлов
- `lib/brain.js` — 1 файлов
- `lib/databroker.js` — 1 файлов
- `lib/forumShareManager.js` — 1 файлов
- `lib/forumVideoTrim.js` — 1 файлов
- `lib/geo` — 2 файлов
- `lib/indicators.js` — 1 файлов
- `lib/metadataCache.js` — 1 файлов
- `lib/redis.js` — 1 файлов
- `lib/safeWin.js` — 1 файлов
- `lib/subscriptions.js` — 1 файлов
- `lib/tma.js` — 1 файлов
- `public/compat.js` — 1 файлов
- `public/models` — 1 файлов
- `public/tonconnect-manifest.json` — 1 файлов
- `public/workers` — 1 файлов
- `root` — 111 файлов
- `src/shared` — 32 файлов
- `tools` — 58 файлов

## Топ Межзоновых Зависимостей

- `api/forum` -> `api/forum` — 44 локальных импортов
- `forum/feed` -> `forum/feed` — 38 локальных импортов
- `forum/ui` -> `forum/ui` — 31 локальных импортов
- `src/shared` -> `src/shared` — 31 локальных импортов
- `forum/dm` -> `forum/dm` — 28 локальных импортов
- `tools` -> `tools` — 28 локальных импортов
- `root` -> `src/shared` — 25 локальных импортов
- `forum/media` -> `forum/media` — 21 локальных импортов
- `root` -> `root` — 19 локальных импортов
- `forum/root` -> `forum/ui` — 18 локальных импортов
- `forum/feed` -> `forum/profile` — 16 локальных импортов
- `api/dm` -> `api/dm` — 15 локальных импортов
- `forum/feed` -> `forum/shared` — 14 локальных импортов
- `api/profile` -> `api/forum` — 13 локальных импортов
- `forum/profile` -> `forum/shared` — 13 локальных импортов
- `forum/root` -> `forum/shared` — 13 локальных импортов
- `forum/root` -> `forum/feed` — 13 локальных импортов
- `components` -> `components` — 12 локальных импортов
- `forum/profile` -> `forum/profile` — 12 локальных импортов
- `forum/root` -> `forum/media` — 12 локальных импортов
- `forum/dm` -> `forum/profile` — 10 локальных импортов
- `forum/dm` -> `forum/shared` — 10 локальных импортов
- `forum/media` -> `forum/shared` — 10 локальных импортов
- `forum/ui` -> `forum/media` — 10 локальных импортов
- `root` -> `forum/feed` — 10 локальных импортов
- `app/layout.js` -> `components` — 9 локальных импортов
- `forum/quests` -> `forum/quests` — 9 локальных импортов
- `forum/root` -> `forum/profile` — 9 локальных импортов
- `api/forum` -> `api/profile` — 8 локальных импортов
- `api/profile` -> `api/profile` — 6 локальных импортов
- `forum/feed` -> `forum/ui` — 6 локальных импортов
- `forum/moderation` -> `forum/moderation` — 6 локальных импортов
- `forum/root` -> `forum/root` — 6 локальных импортов
- `forum/ui` -> `forum/feed` — 6 локальных импортов
- `forum/shared` -> `forum/shared` — 5 локальных импортов
- `api/telegram` -> `lib/redis.js` — 4 локальных импортов
- `forum/feed` -> `forum/media` — 4 локальных импортов
- `forum/feed` -> `forum/dm` — 4 локальных импортов
- `forum/root` -> `components` — 4 локальных импортов
- `forum/ui` -> `forum/dm` — 4 локальных импортов
- `root` -> `forum/media` — 4 локальных импортов
- `api/qcoin` -> `api/forum` — 3 локальных импортов
- `app/ads` -> `components` — 3 локальных импортов
- `forum/feed` -> `forum/root` — 3 локальных импортов
- `forum/ui` -> `forum/shared` — 3 локальных импортов
- `forum/ui` -> `forum/root` — 3 локальных импортов
- `forum/ui` -> `forum/quests` — 3 локальных импортов
- `src/shared` -> `config` — 3 локальных импортов
- `api/battlecoin` -> `api/forum` — 2 локальных импортов
- `api/forum` -> `lib/subscriptions.js` — 2 локальных импортов

## Исходящие Зависимости По Зонам

### api/_diag

- Нет локальных исходящих импортов.

### api/academy

- `api/forum` — 1

### api/ads

- `lib/adsCore.js` — 1

### api/aiquota

- Нет локальных исходящих импортов.

### api/battlecoin

- `api/forum` — 2

### api/brain

- `lib/brain.js` — 1
- `lib/databroker.js` — 1

### api/coins

- Нет локальных исходящих импортов.

### api/contact

- Нет локальных исходящих импортов.

### api/crypto-news

- Нет локальных исходящих импортов.

### api/debug

- Нет локальных исходящих импортов.

### api/deep-translate

- Нет локальных исходящих импортов.

### api/dm

- `api/dm` — 15
- `api/profile` — 1

### api/forum

- `api/forum` — 44
- `api/profile` — 8
- `lib/subscriptions.js` — 2

### api/market

- `lib/brain.js` — 1
- `lib/databroker.js` — 1

### api/pay

- `lib/adsCore.js` — 2
- `lib/subscriptions.js` — 1

### api/payments

- Нет локальных исходящих импортов.

### api/profile

- `api/forum` — 13
- `api/profile` — 6

### api/qcoin

- `api/forum` — 3

### api/quest

- `api/forum` — 2

### api/quotes

- Нет локальных исходящих импортов.

### api/referral

- `api/forum` — 2
- `lib/subscriptions.js` — 1

### api/subscription

- `lib/subscriptions.js` — 1

### api/telegram

- `lib/redis.js` — 4

### api/tma

- Нет локальных исходящих импортов.

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

- `components` — 3
- `app/ads` — 2
- `lib/geo` — 2
- `lib/metadataCache.js` — 1

### app/ads.js

- `forum/root` — 1

### app/components

- `components` — 1

### app/contact

- `components` — 1

### app/exchange

- `components` — 2
- `app/ads.js` — 1
- `app/exchange` — 1
- `lib/brain.js` — 1
- `lib/metadataCache.js` — 1

### app/game

- `app/ads.js` — 1
- `components` — 1
- `lib/metadataCache.js` — 1

### app/jsconfig.json

- Нет локальных исходящих импортов.

### app/layout.js

- `components` — 9
- `app/providers.jsx` — 1
- `lib/metadataCache.js` — 1

### app/page.js

- `app/ads.js` — 1
- `app/components` — 1
- `components` — 1

### app/privacy

- `components` — 1

### app/providers.jsx

- Нет локальных исходящих импортов.

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

- `components` — 12

### config

- Нет локальных исходящих импортов.

### forum/diagnostics

- `forum/diagnostics` — 1

### forum/dm

- `forum/dm` — 28
- `forum/profile` — 10
- `forum/shared` — 10
- `forum/feed` — 2
- `forum/ui` — 2
- `forum/media` — 1

### forum/feed

- `forum/feed` — 38
- `forum/profile` — 16
- `forum/shared` — 14
- `forum/ui` — 6
- `forum/dm` — 4
- `forum/media` — 4
- `forum/root` — 3
- `components` — 2
- `forum/subscriptions` — 2
- `forum/quests` — 1

### forum/media

- `forum/media` — 21
- `forum/shared` — 10
- `forum/feed` — 2
- `lib/forumVideoTrim.js` — 2
- `forum/profile` — 1

### forum/moderation

- `forum/moderation` — 6
- `forum/root` — 1
- `forum/shared` — 1

### forum/profile

- `forum/shared` — 13
- `forum/profile` — 12
- `forum/qcoin` — 2
- `forum/subscriptions` — 2
- `components` — 1

### forum/qcoin

- `forum/qcoin` — 2
- `forum/shared` — 1

### forum/quests

- `forum/quests` — 9
- `forum/shared` — 1

### forum/root

- `forum/ui` — 18
- `forum/feed` — 13
- `forum/shared` — 13
- `forum/media` — 12
- `forum/profile` — 9
- `forum/root` — 6
- `components` — 4
- `forum/dm` — 2
- `forum/qcoin` — 2
- `forum/styles` — 2
- `api/forum` — 1
- `forum/diagnostics` — 1

### forum/shared

- `forum/shared` — 5

### forum/styles

- Нет локальных исходящих импортов.

### forum/subscriptions

- `forum/shared` — 1
- `forum/subscriptions` — 1

### forum/ui

- `forum/ui` — 31
- `forum/media` — 10
- `forum/feed` — 6
- `forum/dm` — 4
- `forum/quests` — 3
- `forum/root` — 3
- `forum/shared` — 3
- `forum/profile` — 2
- `components` — 1
- `forum/moderation` — 1

### lib/adsCore.js

- Нет локальных исходящих импортов.

### lib/brain.js

- Нет локальных исходящих импортов.

### lib/databroker.js

- Нет локальных исходящих импортов.

### lib/forumShareManager.js

- Нет локальных исходящих импортов.

### lib/forumVideoTrim.js

- Нет локальных исходящих импортов.

### lib/geo

- Нет локальных исходящих импортов.

### lib/indicators.js

- Нет локальных исходящих импортов.

### lib/metadataCache.js

- Нет локальных исходящих импортов.

### lib/redis.js

- Нет локальных исходящих импортов.

### lib/safeWin.js

- Нет локальных исходящих импортов.

### lib/subscriptions.js

- Нет локальных исходящих импортов.

### lib/tma.js

- Нет локальных исходящих импортов.

### public/compat.js

- Нет локальных исходящих импортов.

### public/models

- Нет локальных исходящих импортов.

### public/tonconnect-manifest.json

- Нет локальных исходящих импортов.

### public/workers

- Нет локальных исходящих импортов.

### root

- `src/shared` — 25
- `root` — 19
- `forum/feed` — 10
- `forum/media` — 4
- `forum/shared` — 2
- `api/forum` — 1
- `forum/dm` — 1
- `forum/subscriptions` — 1

### src/shared

- `src/shared` — 31
- `config` — 3

### tools

- `tools` — 28

## Файлы С Высоким Fan-In

- `app/api/forum/_utils.js` — fan-in 33; основные потребители: `app/api/academy/exam/route.js`, `app/api/forum/_db.js`, `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/admin/verify/route.js`, `app/api/forum/mediaLock/route.js`
- `app/api/forum/_db.js` — fan-in 32; основные потребители: `app/api/battlecoin/order/route.js`, `app/api/battlecoin/state/route.js`, `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/events/stream/route.js`
- `components/i18n.js` — fan-in 30; основные потребители: `app/about/page.js`, `app/academy/AcademyExamBlock.js`, `app/academy/page.js`, `app/ads/GeoTargetingPicker.jsx`, `app/ads/home.js`, `app/ads/page.jsx`, `app/components/CryptoNewsLens.jsx`, `app/contact/page.js`
- `tools/runtime-governance.js` — fan-in 25; основные потребители: `tools/audit-adaptive-actions.js`, `tools/audit-adaptive-core.js`, `tools/audit-auth-cascade.js`, `tools/audit-console-noise.js`, `tools/audit-diagnostics-boundaries.js`, `tools/audit-feature-flag-safety.js`, `tools/audit-forensic-mode-bounds.js`, `tools/audit-iframe-restore.js`
- `app/forum/features/profile/utils/profileCache.js` — fan-in 18; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/InboxRepliesPane.jsx`, `app/forum/features/feed/components/ForumPostCard.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/PublishedPostsPane.jsx`, `app/forum/features/feed/components/ThreadRepliesPane.jsx`, `app/forum/features/feed/components/TopicItem.jsx`
- `app/forum/shared/utils/classnames.js` — fan-in 17; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationsRail.jsx`, `app/forum/features/profile/components/AboutRail.jsx`, `app/forum/features/profile/components/ForumVipControl.jsx`
- `app/api/profile/_identity.js` — fan-in 15; основные потребители: `app/api/dm/_utils.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/mutate/route.js`, `app/api/forum/recommendations/users/route.js`, `app/api/forum/subs/count/route.js`, `app/api/forum/subs/list/route.js`, `app/api/forum/subs/my-count/route.js`, `app/api/forum/subs/toggle/route.js`
- `tests/support/runtimeGovernance.js` — fan-in 11; основные потребители: `tests/component/runtime/runtimeComponentSurfaces.test.jsx`, `tests/contracts/forum/media-budget-owner.contract.test.js`, `tests/contracts/forum/player-budget-profiles.contract.test.js`, `tests/contracts/forum/qcast-shared-mute-owner.contract.test.js`, `tests/contracts/forum/same-src-thrash-guard.contract.test.js`, `tests/contracts/project/runtime-governance-contracts.test.js`, `tests/contracts/root/auth-bus-budget.contract.test.js`, `tests/contracts/root/runtime-mode.contract.test.js`
- `app/api/dm/_utils.js` — fan-in 8; основные потребители: `app/api/dm/_db.js`, `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`
- `app/forum/features/profile/components/AvatarEmoji.jsx` — fan-in 8; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/ui/components/ForumSearchSortControls.jsx`, `app/forum/ForumHeaderPanel.jsx`
- `app/forum/shared/components/HydrateText.jsx` — fan-in 8; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostActionBar.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/profile/components/UserInfoPopover.jsx`, `app/forum/features/subscriptions/components/FollowersCounterInline.jsx`
- `lib/metadataCache.js` — fan-in 8; основные потребители: `app/about/layout.js`, `app/academy/layout.js`, `app/ads/layout.js`, `app/exchange/layout.js`, `app/forum/layout.js`, `app/game/layout.js`, `app/layout.js`, `app/subscribe/layout.js`
- `src/shared/runtime/budgets/routeProfiles.js` — fan-in 8; основные потребители: `src/shared/runtime/budgets/routeCapabilities.js`, `tests/contracts/decorative/autoplay-budget.contract.test.js`, `tests/contracts/forum/ads-shared-budget.contract.test.js`, `tests/contracts/forum/iframe-singleton-mobile.contract.test.js`, `tests/contracts/forum/native-video-cold-offscreen.contract.test.js`, `tests/contracts/root/wallet-intent-only.contract.test.js`, `tests/integration/runtime/runtimeGovernance.integration.test.js`, `tests/unit/runtime/runtimeGovernance.test.js`
- `app/api/dm/_db.js` — fan-in 7; основные потребители: `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`
- `app/forum/shared/utils/browser.js` — fan-in 7; основные потребители: `app/forum/features/media/hooks/useForumMediaCoordinator.js`, `app/forum/features/moderation/hooks/useAdminFlag.js`, `app/forum/features/profile/hooks/useForumProfileSync.js`, `app/forum/features/profile/utils/profileCache.js`, `app/forum/ForumRoot.jsx`, `app/forum/shared/config/runtime.js`, `app/forum/shared/storage/localStorage.js`
- `app/ads.js` — fan-in 6; основные потребители: `app/about/page.js`, `app/academy/page.js`, `app/exchange/page.js`, `app/game/page.js`, `app/page.js`, `app/subscribe/subscribe.client.jsx`
- `app/forum/shared/hooks/useEvent.js` — fan-in 6; основные потребители: `app/forum/features/feed/hooks/useForumDeepLinkFlow.js`, `app/forum/features/feed/hooks/useForumFeedRuntime.js`, `app/forum/features/media/hooks/useForumVideoFeedRuntime.js`, `app/forum/features/profile/components/ProfilePopover.jsx`, `app/forum/features/profile/hooks/useForumProfileSync.js`, `app/forum/shared/hooks/useForumNavBridge.js`
- `app/forum/shared/utils/formatters.js` — fan-in 6; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/ForumRoot.jsx`
- `app/forum/features/dm/utils/dmLoaders.js` — fan-in 5; основные потребители: `app/forum/features/dm/hooks/useDmDeleteController.js`, `app/forum/features/dm/hooks/useDmLocalCache.js`, `app/forum/features/dm/hooks/useForumDmRuntime.js`, `app/forum/features/dm/services/sendDmComposerMessage.js`, `tests/unit/forum/features/dm/utils/dmLoaders.test.js`
- `app/forum/features/profile/components/VipFlipBadge.jsx` — fan-in 5; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `app/forum/features/feed/components/UserRecommendationCard.jsx`
- `app/forum/shared/utils/counts.js` — fan-in 5; основные потребители: `app/forum/features/feed/components/UserRecommendationCard.jsx`, `app/forum/features/profile/components/ProfilePopover.jsx`, `app/forum/features/profile/components/UserInfoPopover.jsx`, `app/forum/ForumRoot.jsx`, `tests/unit/forum/shared/utils/counts.test.js`
- `lib/subscriptions.js` — fan-in 5; основные потребители: `app/api/forum/recommendations/users/route.js`, `app/api/forum/vip/batch/route.js`, `app/api/pay/webhook/route.js`, `app/api/referral/hit/route.js`, `app/api/subscription/status/route.js`
- `src/shared/runtime/mode/runtimeModeResolver.js` — fan-in 5; основные потребители: `src/shared/runtime/mode/runtimeMode.js`, `src/shared/runtime/mode/runtimeModeClient.js`, `src/shared/runtime/mode/runtimeModeGuards.js`, `src/shared/runtime/mode/runtimeModeServer.js`, `tests/unit/runtime/runtimeGovernance.test.js`
- `app/forum/features/dm/utils/mediaParsing.js` — fan-in 4; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/hooks/usePostMediaTextModel.js`, `app/forum/ForumRoot.jsx`
- `app/forum/features/media/utils/mediaLifecycleRuntime.js` — fan-in 4; основные потребители: `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/feed/components/PostCardBridge.jsx`, `app/forum/features/media/components/ComposerAttachmentPreview.jsx`, `app/forum/features/media/hooks/useForumMediaCoordinator.js`
- `app/forum/features/media/utils/mediaRuntime.js` — fan-in 4; основные потребители: `app/forum/features/media/components/VideoTrimPopover.jsx`, `app/forum/features/media/hooks/useVideoTrimController.js`, `app/forum/ForumRoot.jsx`, `tests/unit/forum/features/media/utils/mediaRuntime.test.js`
- `app/forum/features/profile/hooks/useVipFlag.js` — fan-in 4; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/feed/components/ForumPostCard.jsx`, `app/forum/features/feed/components/TopicItem.jsx`
- `app/forum/features/subscriptions/utils/starred.js` — fan-in 4; основные потребители: `app/forum/features/feed/hooks/useThreadPostsModel.js`, `app/forum/features/feed/hooks/useTopicDiscoveryModel.js`, `app/forum/features/subscriptions/hooks/useStarredAuthorsState.js`, `tests/integration/forum/features/feed/hooks/useUserRecommendationsRail.test.jsx`
- `app/forum/features/ui/components/StarButton.jsx` — fan-in 4; основные потребители: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/TopicItem.jsx`
- `app/forum/ForumAds.js` — fan-in 4; основные потребители: `app/ads.js`, `app/forum/features/ui/components/ForumAdSlot.jsx`, `app/forum/features/ui/hooks/useForumAdsRuntime.js`, `app/forum/ForumRoot.jsx`
- `app/forum/shared/constants/media.js` — fan-in 4; основные потребители: `app/forum/features/media/components/VideoLimitOverlay.jsx`, `app/forum/features/media/components/VideoTrimPopover.jsx`, `app/forum/features/media/utils/mediaRuntime.js`, `app/forum/ForumRoot.jsx`
- `lib/redis.js` — fan-in 4; основные потребители: `app/api/telegram/link/confirm/route.js`, `app/api/telegram/link/resolve/route.js`, `app/api/telegram/link/start/route.js`, `app/api/telegram/link/status/route.js`
- `src/shared/runtime/budgets/budgetEngine.js` — fan-in 4; основные потребители: `tests/contracts/forum/ads-shared-budget.contract.test.js`, `tests/contracts/forum/iframe-singleton-mobile.contract.test.js`, `tests/integration/runtime/runtimeGovernance.integration.test.js`, `tests/unit/runtime/runtimeGovernance.test.js`
- `src/shared/runtime/mode/runtimeModeTypes.js` — fan-in 4; основные потребители: `src/shared/runtime/mode/runtimeFlags.js`, `src/shared/runtime/mode/runtimeMode.js`, `src/shared/runtime/mode/runtimeModeGuards.js`, `src/shared/runtime/mode/runtimeModeResolver.js`
- `tests/fixtures/forum/recommendations.js` — fan-in 4; основные потребители: `tests/component/forum/features/feed/components/UserRecommendationCard.test.jsx`, `tests/component/forum/features/feed/components/UserRecommendationsRail.test.jsx`, `tests/integration/forum/features/feed/hooks/useUserRecommendationsRail.test.jsx`, `tests/smoke/forum/features/media/components/VideoFeedPane.test.jsx`
- `tests/support/projectSurface.js` — fan-in 4; основные потребители: `tests/contracts/project/api-route-contracts.test.js`, `tests/contracts/project/app-entry-contracts.test.js`, `tests/contracts/project/forum-hook-contracts.test.js`, `tests/support/runtimeGovernance.js`
- `app/api/forum/_bus.js` — fan-in 3; основные потребители: `app/api/forum/events/stream/route.js`, `app/api/forum/mutate/route.js`, `app/api/forum/report/route.js`
- `app/forum/features/feed/components/UserRecommendationsRail.jsx` — fan-in 3; основные потребители: `app/forum/features/media/components/VideoFeedPane.jsx`, `tests/component/forum/features/feed/components/UserRecommendationsRail.test.jsx`, `tests/smoke/forum/features/media/components/VideoFeedPane.test.jsx`
- `app/forum/features/feed/utils/cardMemo.js` — fan-in 3; основные потребители: `app/forum/features/feed/components/PostCardBridge.jsx`, `app/forum/features/feed/components/TopicItem.jsx`, `tests/unit/forum/features/feed/utils/cardMemo.test.js`
- `app/forum/features/media/utils/mediaLinks.js` — fan-in 3; основные потребители: `app/forum/features/media/utils/mediaUrlPipeline.js`, `app/forum/features/ui/components/ForumSearchSortControls.jsx`, `app/forum/ForumRoot.jsx`

## Вывод

- Файлы с высоким fan-in требуют особенно осторожных изменений.
- Самые чувствительные зоны обычно находятся в `app/forum`, `app/api/*`, `components/i18n.js`, `lib/*` и корневых route/layout файлах.