# PROJECT_OWNERSHIP.md

> Обязательное правило сопровождения:
> Если меняется граница ответственности каталогов, появляются новые домены, переносятся модули между зонами или меняются entry points, этот файл обязан быть обновлен.
> Рекомендуемый способ обновления: `node tools/generate-project-ownership.js`.

Сгенерировано автоматически: 2026-09-05T12:24:44.994Z

## Общий Принцип

- `app/` владеет страницами, layout-слоем и серверными route handlers.
- `app/api/` владеет backend/API-контуром.
- `components/` владеет truly shared UI вне одного домена.
- `lib/` владеет общей инфраструктурой и серверно-клиентскими библиотеками.
- `app/forum/` владеет форумом, DM, media, qcoin, quests и их feature-oriented слоями.
- `public/` владеет статическими ассетами.
- `tools/` и `audit/` владеют аудитом, диагностикой и техобслуживанием.

## App Ownership

### [lang]

- Зона: `app/[lang]`
- Назначение: Route/domain слой сегмента [lang].
- Точки входа: `app/[lang]/trust-and-identity/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### about

- Зона: `app/about`
- Назначение: Контентный раздел about.
- Точки входа: `app/about/layout.js`, `app/about/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### academy

- Зона: `app/academy`
- Назначение: Академия, экзамены и образовательный UI.
- Точки входа: `app/academy/layout.js`, `app/academy/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### ads

- Зона: `app/ads`
- Назначение: Рекламный контур, рекламные страницы и связанный UI.
- Точки входа: `app/ads/layout.js`, `app/ads/page.jsx`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### components

- Зона: `app/components`
- Назначение: Локальные app-level компоненты.
- Точки входа: нет явных root-entry файлов
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### contact

- Зона: `app/contact`
- Назначение: Контентный раздел contact.
- Точки входа: `app/contact/layout.js`, `app/contact/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### exchange

- Зона: `app/exchange`
- Назначение: Exchange-раздел и связанный интерфейс обмена.
- Точки входа: `app/exchange/layout.js`, `app/exchange/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### forum

- Зона: `app/forum`
- Назначение: Форум, мессенджер, темы, посты, медиа, профиль, VIP, QCoin, quests и связанный экранный runtime.
- Точки входа: `app/forum/layout.js`, `app/forum/loading.js`, `app/forum/page.js`
- Связанные зоны: `app/forum/features`, `app/forum/shared`, `app/api/forum`, `app/api/dm`, `components`, `lib`, `public`

### game

- Зона: `app/game`
- Назначение: Игровой раздел и его route-layer.
- Точки входа: `app/game/layout.js`, `app/game/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### privacy

- Зона: `app/privacy`
- Назначение: Контентный раздел privacy.
- Точки входа: `app/privacy/layout.js`, `app/privacy/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### subscribe

- Зона: `app/subscribe`
- Назначение: Подписочный/лендинговый контур.
- Точки входа: `app/subscribe/layout.js`, `app/subscribe/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### tma

- Зона: `app/tma`
- Назначение: TMA/Telegram Mini App страницы.
- Точки входа: `app/tma/auto/layout.js`, `app/tma/auto/page.jsx`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### trust-and-identity

- Зона: `app/trust-and-identity`
- Назначение: Route/domain слой сегмента trust-and-identity.
- Точки входа: нет явных root-entry файлов
- Связанные зоны: `components`, `lib`, `public`, `app/api`

## API Ownership

### API: _diag

- Зона: `app/api/_diag`
- Назначение: API-домен _diag.
- Точки входа: `app/api/_diag/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: academy

- Зона: `app/api/academy`
- Назначение: API академии.
- Точки входа: `app/api/academy/exam/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: account-restrictions

- Зона: `app/api/account-restrictions`
- Назначение: API-домен account-restrictions.
- Точки входа: `app/api/account-restrictions/status/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: ads

- Зона: `app/api/ads`
- Назначение: API рекламы.
- Точки входа: `app/api/ads/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: aiquota

- Зона: `app/api/aiquota`
- Назначение: API-домен aiquota.
- Точки входа: `app/api/aiquota/usage/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: app-shell

- Зона: `app/api/app-shell`
- Назначение: API-домен app-shell.
- Точки входа: `app/api/app-shell/config/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: battlecoin

- Зона: `app/api/battlecoin`
- Назначение: API-домен battlecoin.
- Точки входа: `app/api/battlecoin/chat/events/route.js`, `app/api/battlecoin/chat/messages/route.js`, `app/api/battlecoin/chat/reaction/route.js`, `app/api/battlecoin/order/route.js`, `app/api/battlecoin/state/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: brain

- Зона: `app/api/brain`
- Назначение: API-домен brain.
- Точки входа: `app/api/brain/analyze/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: coins

- Зона: `app/api/coins`
- Назначение: API-домен coins.
- Точки входа: `app/api/coins/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: composer-safety

- Зона: `app/api/composer-safety`
- Назначение: API-домен composer-safety.
- Точки входа: `app/api/composer-safety/preview/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: contact

- Зона: `app/api/contact`
- Назначение: API-домен contact.
- Точки входа: `app/api/contact/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: crypto-news

- Зона: `app/api/crypto-news`
- Назначение: API-домен crypto-news.
- Точки входа: `app/api/crypto-news/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: debug

- Зона: `app/api/debug`
- Назначение: API-домен debug.
- Точки входа: `app/api/debug/ads/grant/route.js`, `app/api/debug/env/route.js`, `app/api/debug/forum-diag/route.js`, `app/api/debug/invoices/route.js`, `app/api/debug/qcoin/topup/grant/route.js`, `app/api/debug/redis/info/route.js`, `app/api/debug/redis/route.js`, `app/api/debug/vip/grant/route.js`, `app/api/debug/vip/migrate/route.js`, `app/api/debug/vip/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: deep-translate

- Зона: `app/api/deep-translate`
- Назначение: API-домен deep-translate.
- Точки входа: `app/api/deep-translate/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: dm

- Зона: `app/api/dm`
- Назначение: Серверный контур личных сообщений: dialogs, thread, send, delete, seen, block.
- Точки входа: `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/support-broadcast/route.js`, `app/api/dm/support-card-translate/route.js`, `app/api/dm/support-entry/route.js`, `app/api/dm/support-feedback/route.js`, `app/api/dm/support-learning-consent/route.js`
- Связанные зоны: `app/forum/features/dm`, `app/forum`, `app/api/profile`, `lib`

### API: forum

- Зона: `app/api/forum`
- Назначение: Серверный контур форума: snapshot, mutate, report, moderation, uploads, subs, vip, stream.
- Точки входа: `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/admin/verify/route.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/events/stream/route.js`, `app/api/forum/feed/page/route.js`, `app/api/forum/inbox/replies/page/route.js`, `app/api/forum/media-feed/page/route.js`
- Связанные зоны: `app/forum`, `lib`, `public`, `app/api/profile`

### API: geo

- Зона: `app/api/geo`
- Назначение: API-домен geo.
- Точки входа: `app/api/geo/session-touch/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: market

- Зона: `app/api/market`
- Назначение: API-домен market.
- Точки входа: `app/api/market/summary/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: metamarket

- Зона: `app/api/metamarket`
- Назначение: API-домен metamarket.
- Точки входа: `app/api/metamarket/buy/route.js`, `app/api/metamarket/collection/route.js`, `app/api/metamarket/gift/route.js`, `app/api/metamarket/my-collection/route.js`, `app/api/metamarket/owners/route.js`, `app/api/metamarket/quote/route.js`, `app/api/metamarket/sell/route.js`, `app/api/metamarket/state/route.js`, `app/api/metamarket/token-history/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: metastudio

- Зона: `app/api/metastudio`
- Назначение: API-домен metastudio.
- Точки входа: `app/api/metastudio/register/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: pay

- Зона: `app/api/pay`
- Назначение: Платежный backend и webhook-и.
- Точки входа: `app/api/pay/create/route.js`, `app/api/pay/qcoin-purchase/route.js`, `app/api/pay/webhook/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: payments

- Зона: `app/api/payments`
- Назначение: Платежный backend и webhook-и.
- Точки входа: `app/api/payments/demo/complete/route.js`, `app/api/payments/now/create/route.js`, `app/api/payments/now/webhook/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: profile

- Зона: `app/api/profile`
- Назначение: Профиль, about, nick, avatar и batch-профили.
- Точки входа: `app/api/profile/batch/route.js`, `app/api/profile/check-nick/route.js`, `app/api/profile/delete-account/route.js`, `app/api/profile/get-about/route.js`, `app/api/profile/get-profile/route.js`, `app/api/profile/save-nick/route.js`, `app/api/profile/set-about/route.js`, `app/api/profile/upload-avatar/route.js`, `app/api/profile/user-popover/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: push

- Зона: `app/api/push`
- Назначение: API-домен push.
- Точки входа: `app/api/push/config/route.js`, `app/api/push/events/route.js`, `app/api/push/native/link/route.js`, `app/api/push/native/register/route.js`, `app/api/push/native/status/route.js`, `app/api/push/native/unlink/route.js`, `app/api/push/subscribe/route.js`, `app/api/push/sync/route.js`, `app/api/push/unsubscribe/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: qcoin

- Зона: `app/api/qcoin`
- Назначение: QCoin backend: balance, heartbeat, drop.
- Точки входа: `app/api/qcoin/drop/route.js`, `app/api/qcoin/get/route.js`, `app/api/qcoin/heartbeat/route.js`, `app/api/qcoin/topup/cancel/route.js`, `app/api/qcoin/topup/create/route.js`, `app/api/qcoin/topup/webhook/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: quest

- Зона: `app/api/quest`
- Назначение: Серверный контур квестов.
- Точки входа: `app/api/quest/env/route.js`, `app/api/quest/progress/route.js`, `app/api/quest/status/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: quotes

- Зона: `app/api/quotes`
- Назначение: API-домен quotes.
- Точки входа: `app/api/quotes/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: referral

- Зона: `app/api/referral`
- Назначение: API-домен referral.
- Точки входа: `app/api/referral/hit/route.js`, `app/api/referral/link/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: subscription

- Зона: `app/api/subscription`
- Назначение: API-домен subscription.
- Точки входа: `app/api/subscription/status/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: telegram

- Зона: `app/api/telegram`
- Назначение: Интеграция Telegram/TMA.
- Точки входа: `app/api/telegram/link/confirm/route.js`, `app/api/telegram/link/resolve/route.js`, `app/api/telegram/link/start/route.js`, `app/api/telegram/link/status/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: tma

- Зона: `app/api/tma`
- Назначение: Интеграция Telegram/TMA.
- Точки входа: `app/api/tma/auto/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: wallet-session

- Зона: `app/api/wallet-session`
- Назначение: API-домен wallet-session.
- Точки входа: `app/api/wallet-session/route.js`
- Связанные зоны: `app`, `components`, `lib`

## Forum Ownership

### Forum Root

- Зона: `app/forum`
- Назначение: Корневой composition, layout, styles и orchestration всего форума.
- Точки входа: `app/forum/Forum.jsx`, `app/forum/ForumRoot.jsx`, `app/forum/ForumHeaderPanel.jsx`, `app/forum/layout.js`, `app/forum/page.js`
- Связанные зоны: `app/forum/features`, `app/forum/shared`, `app/api/forum`, `app/api/dm`, `lib`, `public`
- Примечания: Это главная интеграционная зона между UI, данными, API и shared-слоем форума.

### Forum feature: diagnostics

- Зона: `app/forum/features/diagnostics`
- Назначение: Perf/diag hooks и вспомогательные debug-механизмы.
- Точки входа: `app/forum/features/diagnostics/hooks/useForumDiagnostics.js`, `app/forum/features/diagnostics/utils/emitPolicy.js`
- Связанные зоны: `app/forum/shared`, `app/api/forum`, `app/forum`

### Forum feature: dm

- Зона: `app/forum/features/dm`
- Назначение: Quantum Messenger, диалоги, треды, cache, delete/block/seen и DM UI.
- Точки входа: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmDialogsPane.jsx`, `app/forum/features/dm/components/DmMediaRenderer.jsx`, `app/forum/features/dm/components/DmMessagesPane.jsx`, `app/forum/features/dm/components/DmThreadAlerts.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadLoadMore.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/dm/components/DmVoicePlayer.jsx`, `app/forum/features/dm/components/InboxPane.jsx`
- Связанные зоны: `app/api/dm`, `app/api/profile`, `app/forum/features/profile`, `app/forum/shared`

### Forum feature: feed

- Зона: `app/forum/features/feed`
- Назначение: Лента, темы, посты, replies, сортировки, composer и data runtime ленты.
- Точки входа: `app/forum/features/feed/components/CreateTopicCard.jsx`, `app/forum/features/feed/components/ForumPostCard.jsx`, `app/forum/features/feed/components/LoadMoreSentinel.jsx`, `app/forum/features/feed/components/PostActionBar.jsx`, `app/forum/features/feed/components/PostBodyContent.jsx`, `app/forum/features/feed/components/PostCardBridge.jsx`, `app/forum/features/feed/components/PostFxLayer.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/PostMediaStack.jsx`, `app/forum/features/feed/components/PostOwnerMenu.jsx`
- Связанные зоны: `app/api/forum`, `app/forum/features/media`, `app/forum/features/profile`, `app/forum/shared`

### Forum feature: geo

- Зона: `app/forum/features/geo`
- Назначение: Фича geo внутри форума.
- Точки входа: `app/forum/features/geo/GeoSessionTouchClient.jsx`
- Связанные зоны: `app/forum/shared`, `app/api/forum`, `app/forum`

### Forum feature: media

- Зона: `app/forum/features/media`
- Назначение: Видео, аудио, embeds, lifecycle плееров, preview и trim/upload runtime.
- Точки входа: `app/forum/features/media/components/ComposerAttachmentPreview.jsx`, `app/forum/features/media/components/ExternalVideoPlayer.jsx`, `app/forum/features/media/components/LivePreview.jsx`, `app/forum/features/media/components/qcast/QCastIcons.jsx`, `app/forum/features/media/components/QCastPlayer.jsx`, `app/forum/features/media/components/VideoFeedPane.jsx`, `app/forum/features/media/components/VideoLimitOverlay.jsx`, `app/forum/features/media/components/VideoMedia.jsx`, `app/forum/features/media/components/VideoOverlay.jsx`, `app/forum/features/media/components/VideoTrimPopover.jsx`
- Связанные зоны: `app/forum/shared`, `app/api/forum`, `app/forum`

### Forum feature: moderation

- Зона: `app/forum/features/moderation`
- Назначение: Жалобы, admin actions, media lock и moderation UI/logic.
- Точки входа: `app/forum/features/moderation/components/AdminPopover.jsx`, `app/forum/features/moderation/components/ReportPopover.jsx`, `app/forum/features/moderation/hooks/useAdminActions.js`, `app/forum/features/moderation/hooks/useAdminFlag.js`, `app/forum/features/moderation/hooks/useForumModerationRuntime.js`, `app/forum/features/moderation/hooks/useForumModerationUi.js`, `app/forum/features/moderation/hooks/useMediaModeration.js`, `app/forum/features/moderation/hooks/useReportController.js`, `app/forum/features/moderation/utils/http.js`
- Связанные зоны: `app/api/forum/report`, `app/api/forum/admin`, `app/forum/features/media`, `app/forum/shared`

### Forum feature: profile

- Зона: `app/forum/features/profile`
- Назначение: Профиль, avatar, about, VIP, popovers и profile sync.
- Точки входа: `app/forum/features/profile/components/AboutRail.jsx`, `app/forum/features/profile/components/AvatarEmoji.jsx`, `app/forum/features/profile/components/ForumVipControl.jsx`, `app/forum/features/profile/components/ProfilePopover.jsx`, `app/forum/features/profile/components/UserInfoPopover.jsx`, `app/forum/features/profile/components/VipFlipBadge.jsx`, `app/forum/features/profile/components/VipPopover.jsx`, `app/forum/features/profile/constants/vipAssets.js`, `app/forum/features/profile/hooks/useAboutEditor.js`, `app/forum/features/profile/hooks/useForumProfileSocialRuntime.js`
- Связанные зоны: `app/api/profile`, `app/forum/features/qcoin`, `app/forum/features/subscriptions`, `app/forum/shared`

### Forum feature: qcoin

- Зона: `app/forum/features/qcoin`
- Назначение: QCoin UI в форуме и клиентская логика баланса.
- Точки входа: `app/forum/features/qcoin/components/QCoinInline.jsx`, `app/forum/features/qcoin/components/QCoinWithdrawPopover.jsx`, `app/forum/features/qcoin/hooks/useQCoinLive.js`, `app/forum/features/qcoin/utils/account.js`, `app/forum/features/qcoin/utils/formatQCoinBalance.js`, `app/forum/features/qcoin/utils/paymentWindow.js`
- Связанные зоны: `app/api/qcoin`, `app/forum/features/profile`, `app/forum/shared`

### Forum feature: quests

- Зона: `app/forum/features/quests`
- Назначение: Квесты, claim-flow, quest runtime и UI.
- Точки входа: `app/forum/features/quests/components/QuestClaimOverlay.jsx`, `app/forum/features/quests/components/QuestHub.jsx`, `app/forum/features/quests/components/QuestPane.jsx`, `app/forum/features/quests/hooks/useForumQuestConfig.js`, `app/forum/features/quests/hooks/useForumQuestProgress.js`, `app/forum/features/quests/hooks/useForumQuestRuntime.js`, `app/forum/features/quests/hooks/useQuestClaimAction.js`, `app/forum/features/quests/hooks/useQuestStorageState.js`, `app/forum/features/quests/hooks/useQuestViewActions.js`, `app/forum/features/quests/utils/progress.js`
- Связанные зоны: `app/api/quest`, `app/forum/features/qcoin`, `app/forum/shared`

### Forum feature: subscriptions

- Зона: `app/forum/features/subscriptions`
- Назначение: Подписки и social graph inside forum.
- Точки входа: `app/forum/features/subscriptions/components/FollowersCounterInline.jsx`, `app/forum/features/subscriptions/components/SubscriptionsPopover.jsx`, `app/forum/features/subscriptions/hooks/useStarredAuthorsState.js`, `app/forum/features/subscriptions/utils/starred.js`
- Связанные зоны: `app/forum/shared`, `app/api/forum`, `app/forum`

### Forum feature: ui

- Зона: `app/forum/features/ui`
- Назначение: Общие UI-узлы форума, prop bundles и shell runtime-хуки.
- Точки входа: `app/forum/features/ui/components/ComposeDock.jsx`, `app/forum/features/ui/components/ComposerActionRail.jsx`, `app/forum/features/ui/components/ComposerCore.jsx`, `app/forum/features/ui/components/ComposerEmojiPanel.jsx`, `app/forum/features/ui/components/ComposerEmojiPreview.jsx`, `app/forum/features/ui/components/ComposerFabButton.jsx`, `app/forum/features/ui/components/ComposerFileInput.jsx`, `app/forum/features/ui/components/ComposerMediaProgressBar.jsx`, `app/forum/features/ui/components/ComposerStatusMeta.jsx`, `app/forum/features/ui/components/ComposerTextInput.jsx`
- Связанные зоны: `app/forum/shared`, `app/api/forum`, `app/forum`

## Shared Layers

### Global Components

- Зона: `components`
- Назначение: Переиспользуемые UI-компоненты и провайдеры верхнего уровня вне одного домена.
- Точки входа: `components/AndroidAppPrompt.jsx`, `components/AndroidChromiumVideoCanvas.jsx`, `components/AndroidNotificationBadgeSync.jsx`, `components/AuthNavClient.jsx`, `components/BgAudio.js`, `components/composer-safety/ComposerSafetyBadge.jsx`, `components/ForumBootSplash.jsx`, `components/ForumShellGate.jsx`, `components/HeroAvatar.js`, `components/HeroSection.js`, `components/i18n-dicts/ar.js`, `components/i18n-dicts/en.js`
- Связанные зоны: `app`, `app/forum`, `lib`, `public`
- Примечания: Сюда входят i18n, wallet-хабы, top bar, визуальные FX и общие клиентские виджеты.

### Infrastructure Libraries

- Зона: `lib`
- Назначение: Глобальные библиотеки проекта: metadata, geo, subscriptions, forum-share, trim, redis, tma и бизнес-хелперы.
- Точки входа: `lib/account-restrictions/portalLexicon.js`, `lib/ads/adDiscoveryPrompt.js`, `lib/adsCore.js`, `lib/adsGeoTargetingFlow.js`, `lib/adsLandingPackageState.js`, `lib/authActionGateClient.js`, `lib/brain.js`, `lib/brand/officialChannels.js`, `lib/composer-safety/badgeLexicon.js`, `lib/composer-safety/clientModerationBank.js`, `lib/composer-safety/clientPreview.js`, `lib/composer-safety/localeRiskConcepts.client.js`, `lib/composer-safety/localeSemanticHints.client.js`, `lib/composer-safety/previewWorker.js`, `lib/databroker.js`, `lib/deepTranslateService.js`, `lib/exchange/aiBoxAnalysisService.js`, `lib/exchange/aiEntitlementState.js`, `lib/exchange/aiQuotaIdentity.js`, `lib/fcm.js`, `lib/forumClientVideoOpfs.js`, `lib/forumClientVideoOptimizer.js`, `lib/forumClientVideoOptimizerWorker.js`, `lib/forumClientVideoRuntime.js`, `lib/forumClientVideoWorkerBridge.js`, `lib/forumClientVideoWorkerProtocol.js`, `lib/forumShareManager.js`, `lib/forumVideoTrim.js`, `lib/geo/countries.js`, `lib/geo/regions.js`, `lib/indicators.js`, `lib/metadataCache.js`, `lib/migrations/forumRulesStorage.js`, `lib/nativePush.js`, `lib/nativeVideoPoster.js`, `lib/notificationCenter.js`, `lib/paymentMethodClient.js`, `lib/qcoinEntitlementPurchase.js`, `lib/ql7-support/adminReportComposer.js`, `lib/ql7-support/adsSupportReadAdapter.js`, `lib/ql7-support/adultLanguagePolicy.js`, `lib/ql7-support/broadcast.js`, `lib/ql7-support/cards/cardPresentation.js`, `lib/ql7-support/cardSchema.js`, `lib/ql7-support/choiceContract.js`, `lib/ql7-support/cognition/beliefState.js`, `lib/ql7-support/cognition/cognitiveTurnState.js`, `lib/ql7-support/cognition/computePolicy.js`, `lib/ql7-support/cognition/evidenceGraph.js`, `lib/ql7-support/cognition/planGraph.js`, `lib/ql7-support/cognitiveMemory.js`, `lib/ql7-support/config/behaviorManifest.js`, `lib/ql7-support/config/directiveRegistry.js`, `lib/ql7-support/config/featureFlag.js`, `lib/ql7-support/config/finalCombatDataFloors.js`, `lib/ql7-support/config/floorCoverageRegistry.js`, `lib/ql7-support/config/materialReadiness.js`, `lib/ql7-support/config/maxCombatRequirementRegistry.js`, `lib/ql7-support/config/prelabMaterialLiveRequirements.js`, `lib/ql7-support/config/staticDataReadiness.js`, `lib/ql7-support/contact/contactConsent.js`, `lib/ql7-support/contact/contactIntelligence.js`, `lib/ql7-support/contact/contactPrivacy.js`, `lib/ql7-support/contact/questionnaire.js`, `lib/ql7-support/contracts/finalDeliveryReceipt.js`, `lib/ql7-support/contracts/supportTurnRequestEnvelope.js`, `lib/ql7-support/conversation/commitmentTracker.js`, `lib/ql7-support/conversation/conversationMemoryGraph.js`, `lib/ql7-support/conversation/correctionLedger.js`, `lib/ql7-support/conversation/entityReferenceMemory.js`, `lib/ql7-support/conversation/memoryCompactor.js`, `lib/ql7-support/conversation/memoryConflictResolver.js`, `lib/ql7-support/conversation/memoryPrivacyPolicy.js`, `lib/ql7-support/conversation/memoryStore.js`, `lib/ql7-support/conversation/memoryTransaction.js`, `lib/ql7-support/conversation/rejectedHypothesisLedger.js`, `lib/ql7-support/conversation/returnPointResolver.js`, `lib/ql7-support/conversation/semanticContext.js`, `lib/ql7-support/conversation/temporalContext.js`, `lib/ql7-support/conversation/topicFrame.js`, `lib/ql7-support/conversation/topicStackPolicy.js`, `lib/ql7-support/conversation/transitionClassifier.js`, `lib/ql7-support/conversationState.js`, `lib/ql7-support/data/adapterReceipt.js`, `lib/ql7-support/data/aiBoxSupportReadAdapter.js`, `lib/ql7-support/data/factProjection.js`, `lib/ql7-support/data/readAuthorizationPolicy.js`, `lib/ql7-support/data/readPlan.js`, `lib/ql7-support/data/readState.js`, `lib/ql7-support/data/safeProjection.js`, `lib/ql7-support/data/simulationFixtures.js`, `lib/ql7-support/diagnosticFailure.js`, `lib/ql7-support/diagnosticPresentation.js`, `lib/ql7-support/diagnosticRegistry.js`, `lib/ql7-support/diagnostics.js`, `lib/ql7-support/ecosystemCatalog.js`, `lib/ql7-support/ecosystemRating.js`, `lib/ql7-support/emailOutboxWorker.js`, `lib/ql7-support/emotionalPresentation.js`, `lib/ql7-support/entryGreetingLexicon.js`, `lib/ql7-support/eventNotificationCatalog.js`, `lib/ql7-support/events.js`, `lib/ql7-support/evidencePolicy.js`, `lib/ql7-support/greeting/entrySession.js`, `lib/ql7-support/greetingCoordinator.js`, `lib/ql7-support/http/entryOperation.js`, `lib/ql7-support/http/idempotencyStore.js`, `lib/ql7-support/http/originPolicy.js`, `lib/ql7-support/http/rateLimitPolicy.js`, `lib/ql7-support/http/requestGuard.js`, `lib/ql7-support/http/serviceRequestGuard.js`, `lib/ql7-support/identity/sessionContext.js`, `lib/ql7-support/identityGraph.js`, `lib/ql7-support/identityResolver.js`, `lib/ql7-support/inputNormalization.js`, `lib/ql7-support/inputPolicy.js`, `lib/ql7-support/integration/productEventBridge.js`, `lib/ql7-support/internal/text.js`, `lib/ql7-support/knowledge/academy/academyKnowledgeAdapter.js`, `lib/ql7-support/knowledge/adsReadPolicy.js`, `lib/ql7-support/knowledge/domainKnowledge.js`, `lib/ql7-support/knowledge/domainRegistry.js`, `lib/ql7-support/knowledge/generalHumanKnowledgeCore.js`, `lib/ql7-support/knowledge/generalHumanSourceRouteRegistry.js`, `lib/ql7-support/knowledge/generalKnowledgeRegistry.js`, `lib/ql7-support/knowledge/humanConversationBank.js`, `lib/ql7-support/knowledge/humanTopicOntology.js`, `lib/ql7-support/knowledge/humorAnecdoteFrameBank.js`, `lib/ql7-support/knowledge/humorLexicalPlan.js`, `lib/ql7-support/knowledge/humorLexiconBank.js`, `lib/ql7-support/knowledge/humorMechanismOntology.js`, `lib/ql7-support/knowledge/humorSafetyPolicy.js`, `lib/ql7-support/knowledge/ingestion/claimSchema.js`, `lib/ql7-support/knowledge/ingestion/entitySchema.js`, `lib/ql7-support/knowledge/ingestion/freshnessPolicy.js`, `lib/ql7-support/knowledge/ingestion/knowledgeSnapshotManifest.js`, `lib/ql7-support/knowledge/ingestion/sourceRegistry.js`, `lib/ql7-support/knowledge/knowledgeGraph.js`, `lib/ql7-support/knowledge/knowledgeNodeSchema.js`, `lib/ql7-support/knowledge/officialIdentity.js`, `lib/ql7-support/knowledge/openHumanKnowledgeRouter.js`, `lib/ql7-support/knowledge/public-figures/currentFactFreshnessPolicy.js`, `lib/ql7-support/knowledge/public-figures/entitySnapshot.js`, `lib/ql7-support/knowledge/public-figures/factSchema.js`, `lib/ql7-support/knowledge/public-figures/identityCatalog.js`, `lib/ql7-support/knowledge/public-figures/manifest.js`, `lib/ql7-support/knowledge/public-figures/materialProfiles.js`, `lib/ql7-support/knowledge/public-figures/privacyBoundary.js`, `lib/ql7-support/knowledge/public-figures/publicFigureFactResolver.js`, `lib/ql7-support/knowledge/public-figures/publicFigureResolver.js`, `lib/ql7-support/knowledge/publicFigureCatalog.js`, `lib/ql7-support/knowledge/publicFigureFactOntology.js`, `lib/ql7-support/knowledge/publicFigureKnowledgeGraph.js`, `lib/ql7-support/knowledge/publicFigureQuestionClassifier.js`, `lib/ql7-support/knowledge/publicFigureRegistry.js`, `lib/ql7-support/knowledge/publicFigureSourceResolver.js`, `lib/ql7-support/knowledge/religionKnowledgeRegistry.js`, `lib/ql7-support/knowledge/retrieval/conflictResolver.js`, `lib/ql7-support/knowledge/retrieval/evidencePack.js`, `lib/ql7-support/knowledge/retrieval/hybridRetriever.js`, `lib/ql7-support/knowledge/retrieval/localEmbeddingIndex.js`, `lib/ql7-support/knowledge/retrieval/neuralReranker.js`, `lib/ql7-support/knowledge/retrieval/sparseIndex.js`, `lib/ql7-support/knowledge/sourceReceipt.js`, `lib/ql7-support/knowledgeRegistry.js`, `lib/ql7-support/language/compositionalGrammar.js`, `lib/ql7-support/language/dialectRouter.js`, `lib/ql7-support/language/ecosystemLocaleLexicon.js`, `lib/ql7-support/language/factPresentationLexicon.js`, `lib/ql7-support/language/finalDeliveryLocalization.js`, `lib/ql7-support/language/humanResponsePrimitives.multilingual.js`, `lib/ql7-support/language/humanVariationPrimitives.js`, `lib/ql7-support/language/languageVariantBank.js`, `lib/ql7-support/language/lexicalUniverseRegistry.js`, `lib/ql7-support/language/linguisticPrimitiveSchema.js`, `lib/ql7-support/language/localeOperationFrames.js`, `lib/ql7-support/language/locales.js`, `lib/ql7-support/language/locales/ar.js`, `lib/ql7-support/language/locales/az.js`, `lib/ql7-support/language/locales/bg.js`, `lib/ql7-support/language/locales/cs.js`, `lib/ql7-support/language/locales/da.js`, `lib/ql7-support/language/locales/de.js`, `lib/ql7-support/language/locales/el.js`, `lib/ql7-support/language/locales/en.js`, `lib/ql7-support/language/locales/es.js`, `lib/ql7-support/language/locales/fi.js`, `lib/ql7-support/language/locales/fr.js`, `lib/ql7-support/language/locales/he.js`, `lib/ql7-support/language/locales/hr.js`, `lib/ql7-support/language/locales/hu.js`, `lib/ql7-support/language/locales/it.js`, `lib/ql7-support/language/locales/ja.js`, `lib/ql7-support/language/locales/ka.js`, `lib/ql7-support/language/locales/kk.js`, `lib/ql7-support/language/locales/ko.js`, `lib/ql7-support/language/locales/manifest.js`, `lib/ql7-support/language/locales/nl.js`, `lib/ql7-support/language/locales/no.js`, `lib/ql7-support/language/locales/pl.js`, `lib/ql7-support/language/locales/profileFactory.js`, `lib/ql7-support/language/locales/pt.js`, `lib/ql7-support/language/locales/ro.js`, `lib/ql7-support/language/locales/ru.js`, `lib/ql7-support/language/locales/sk.js`, `lib/ql7-support/language/locales/sl.js`, `lib/ql7-support/language/locales/sr.js`, `lib/ql7-support/language/locales/sv.js`, `lib/ql7-support/language/locales/tr.js`, `lib/ql7-support/language/locales/uk.js`, `lib/ql7-support/language/locales/zh.js`, `lib/ql7-support/language/localizationParity.js`, `lib/ql7-support/language/materialDataLoader.js`, `lib/ql7-support/language/mutationLattice.js`, `lib/ql7-support/language/nativeBanks.js`, `lib/ql7-support/language/nativeStructuredLocalization.js`, `lib/ql7-support/language/normalizeInput.js`, `lib/ql7-support/language/responseLocalePolicy.js`, `lib/ql7-support/language/reviewedSeedRegistry.js`, `lib/ql7-support/language/robustConceptMatcher.js`, `lib/ql7-support/language/safetyLexicon.multilingual.js`, `lib/ql7-support/language/safetyLexicon.native.js`, `lib/ql7-support/language/semanticBanks.js`, `lib/ql7-support/language/semanticConceptBank.js`, `lib/ql7-support/language/sourceEvidenceLexicon.js`, `lib/ql7-support/language/supportSurfaceCopyRegistry.js`, `lib/ql7-support/languageOrchestrator.js`, `lib/ql7-support/learning/ablationEvaluator.js`, `lib/ql7-support/learning/approvalReceipt.js`, `lib/ql7-support/learning/calibrationCandidateReceipt.js`, `lib/ql7-support/learning/consentReceipt.js`, `lib/ql7-support/learning/constraintOptimizer.js`, `lib/ql7-support/learning/counterfactualEvaluator.js`, `lib/ql7-support/learning/datasetDeletion.js`, `lib/ql7-support/learning/driftMonitor.js`, `lib/ql7-support/learning/featureAttribution.js`, `lib/ql7-support/learning/governancePolicy.js`, `lib/ql7-support/learning/incidentCandidate.js`, `lib/ql7-support/learning/outcomeCalibrationLedger.js`, `lib/ql7-support/learning/promotionPolicy.js`, `lib/ql7-support/learning/safeCalibration.js`, `lib/ql7-support/learning/scientificGovernance.js`, `lib/ql7-support/learning/weightCalibrationReceipt.js`, `lib/ql7-support/learning/weightProposal.js`, `lib/ql7-support/learningControlPlane.js`, `lib/ql7-support/learningGovernance.js`, `lib/ql7-support/learningPipeline.js`, `lib/ql7-support/limits.js`, `lib/ql7-support/mediaEvidence.js`, `lib/ql7-support/metricRegistry.js`, `lib/ql7-support/microIntentCatalog.js`, `lib/ql7-support/nativeTranslationService.js`, `lib/ql7-support/neural/criticContract.js`, `lib/ql7-support/neural/generationContract.js`, `lib/ql7-support/neural/modelManifest.js`, `lib/ql7-support/neural/modelReceipt.js`, `lib/ql7-support/neural/nativeCriticAdapter.js`, `lib/ql7-support/neural/nativeGenerationAdapter.js`, `lib/ql7-support/neural/nativeModelGateway.js`, `lib/ql7-support/neural/normalizationLatticeSchema.js`, `lib/ql7-support/neural/safetyFrameSchema.js`, `lib/ql7-support/neural/semanticFrameSchema.js`, `lib/ql7-support/neural/understandingContract.js`, `lib/ql7-support/neural/understandingCoordinator.js`, `lib/ql7-support/ontology/actionOntology.js`, `lib/ql7-support/ontology/domainOntology.js`, `lib/ql7-support/ontology/domains/academy_exam.js`, `lib/ql7-support/ontology/domains/academy.js`, `lib/ql7-support/ontology/domains/accessibility.js`, `lib/ql7-support/ontology/domains/account_deletion.js`, `lib/ql7-support/ontology/domains/ads_campaigns.js`, `lib/ql7-support/ontology/domains/ads_packages.js`, `lib/ql7-support/ontology/domains/auth.js`, `lib/ql7-support/ontology/domains/battle_chat.js`, `lib/ql7-support/ontology/domains/battlecoin.js`, `lib/ql7-support/ontology/domains/contact.js`, `lib/ql7-support/ontology/domains/exchange_ai.js`, `lib/ql7-support/ontology/domains/exchange.js`, `lib/ql7-support/ontology/domains/forum_feed.js`, `lib/ql7-support/ontology/domains/forum_threads.js`, `lib/ql7-support/ontology/domains/futures.js`, `lib/ql7-support/ontology/domains/gameverse.js`, `lib/ql7-support/ontology/domains/geodetect.js`, `lib/ql7-support/ontology/domains/homepage.js`, `lib/ql7-support/ontology/domains/index.js`, `lib/ql7-support/ontology/domains/investment.js`, `lib/ql7-support/ontology/domains/localization.js`, `lib/ql7-support/ontology/domains/media.js`, `lib/ql7-support/ontology/domains/messenger.js`, `lib/ql7-support/ontology/domains/metamarket.js`, `lib/ql7-support/ontology/domains/metastudio.js`, `lib/ql7-support/ontology/domains/metaverse.js`, `lib/ql7-support/ontology/domains/moderation.js`, `lib/ql7-support/ontology/domains/navigation.js`, `lib/ql7-support/ontology/domains/news.js`, `lib/ql7-support/ontology/domains/partnership.js`, `lib/ql7-support/ontology/domains/payments.js`, `lib/ql7-support/ontology/domains/platform.js`, `lib/ql7-support/ontology/domains/privacy.js`, `lib/ql7-support/ontology/domains/profile.js`, `lib/ql7-support/ontology/domains/push.js`, `lib/ql7-support/ontology/domains/qcoin.js`, `lib/ql7-support/ontology/domains/ql7_blockchain.js`, `lib/ql7-support/ontology/domains/quantum_family.js`, `lib/ql7-support/ontology/domains/quantum_zigzag.js`, `lib/ql7-support/ontology/domains/quests.js`, `lib/ql7-support/ontology/domains/roadmap.js`, `lib/ql7-support/ontology/domains/search.js`, `lib/ql7-support/ontology/domains/security.js`, `lib/ql7-support/ontology/domains/system_status.js`, `lib/ql7-support/ontology/domains/telegram.js`, `lib/ql7-support/ontology/domains/vip.js`, `lib/ql7-support/ontology/domains/wallet.js`, `lib/ql7-support/ontology/edgeSchemas.js`, `lib/ql7-support/ontology/emotionOntology.js`, `lib/ql7-support/ontology/entityOntology.js`, `lib/ql7-support/ontology/intentOntology.js`, `lib/ql7-support/ontology/memoryOntology.js`, `lib/ql7-support/ontology/microtopicOntology.js`, `lib/ql7-support/ontology/nodeSchemas.js`, `lib/ql7-support/ontology/ontologyManifest.js`, `lib/ql7-support/ontology/ontologyMigration.js`, `lib/ql7-support/ontology/ontologyQuery.js`, `lib/ql7-support/ontology/ontologyValidator.js`, `lib/ql7-support/ontology/relationConstraints.js`, `lib/ql7-support/ontology/safetyOntology.js`, `lib/ql7-support/ontology/simulationOntology.js`, `lib/ql7-support/ontology/sourceClaimOntology.js`, `lib/ql7-support/ontology/speechActOntology.js`, `lib/ql7-support/operator/adminReportRu.js`, `lib/ql7-support/operator/buildCase.js`, `lib/ql7-support/operator/evidenceAggregation.js`, `lib/ql7-support/operator/reportContract.js`, `lib/ql7-support/operator/smtpPolicy.js`, `lib/ql7-support/operator/smtpRendererRu.js`, `lib/ql7-support/personalityEngine.js`, `lib/ql7-support/presentation.js`, `lib/ql7-support/presentation/badgePolicy.js`, `lib/ql7-support/presentation/buildSupportSurface.js`, `lib/ql7-support/presentation/choiceLocaleLexicon.js`, `lib/ql7-support/presentation/entityMentionBudget.js`, `lib/ql7-support/presentation/interactionModalityPlanner.js`, `lib/ql7-support/presentation/premiumCardLayout.js`, `lib/ql7-support/presentation/propositionPlacement.js`, `lib/ql7-support/presentation/registry.js`, `lib/ql7-support/presentation/surfaceSemanticDensity.js`, `lib/ql7-support/presentation/svgRegistry.js`, `lib/ql7-support/presentation/tableRegistry.js`, `lib/ql7-support/presentation/visualAcceptance.js`, `lib/ql7-support/rating/evidenceQuality.js`, `lib/ql7-support/rating/factorRegistry.js`, `lib/ql7-support/rating/ratingCalibration.js`, `lib/ql7-support/rating/ratingCoverage.js`, `lib/ql7-support/readOnlySourceManifest.js`, `lib/ql7-support/reportPolicyRegistry.js`, `lib/ql7-support/response/answerRelevanceGuard.js`, `lib/ql7-support/response/botPhraseRegistry.js`, `lib/ql7-support/response/buildContentPlan.js`, `lib/ql7-support/response/buildSemanticResponsePlan.js`, `lib/ql7-support/response/choiceDiversity.js`, `lib/ql7-support/response/contradictionGuard.js`, `lib/ql7-support/response/critiqueResponse.js`, `lib/ql7-support/response/discoursePlanner.js`, `lib/ql7-support/response/discourseStrategyRegistry.js`, `lib/ql7-support/response/domainIsolationGuard.js`, `lib/ql7-support/response/evaluateNovelty.js`, `lib/ql7-support/response/eventSemanticProjection.js`, `lib/ql7-support/response/factualCompletenessGuard.js`, `lib/ql7-support/response/finalHumanQualityGate.js`, `lib/ql7-support/response/generalFactRealizer.js`, `lib/ql7-support/response/humanNaturalRealizer.js`, `lib/ql7-support/response/humorRealizationPlanner.js`, `lib/ql7-support/response/immutableFactFragmentRegistry.js`, `lib/ql7-support/response/languagePurityGuard.js`, `lib/ql7-support/response/morphologyRealizer.js`, `lib/ql7-support/response/morphosyntacticRealizer.js`, `lib/ql7-support/response/noveltyReservation.js`, `lib/ql7-support/response/productKnowledgeRealizer.js`, `lib/ql7-support/response/propositionPlanner.js`, `lib/ql7-support/response/publicFigureKnowledgeRealizer.js`, `lib/ql7-support/response/referringExpressionPlanner.js`, `lib/ql7-support/response/regenerationController.js`, `lib/ql7-support/response/responseBranchRegistry.js`, `lib/ql7-support/response/responseLengthPlanner.js`, `lib/ql7-support/response/semanticNoveltyLedger.js`, `lib/ql7-support/response/styleController.js`, `lib/ql7-support/response/surfaceRedundancyGuard.js`, `lib/ql7-support/response/surfaceRedundancyReceipt.js`, `lib/ql7-support/response/userSpecificAnchorGuard.js`, `lib/ql7-support/runtime/canonicalContext.js`, `lib/ql7-support/runtime/caseStoreContract.js`, `lib/ql7-support/runtime/commitRecoveryWorker.js`, `lib/ql7-support/runtime/deliveryCommitCoordinator.js`, `lib/ql7-support/runtime/executeTurn.js`, `lib/ql7-support/runtime/finalDeliveryVerifier.js`, `lib/ql7-support/runtime/nativeIntelligencePlane.js`, `lib/ql7-support/runtime/productionTurn.js`, `lib/ql7-support/runtime/runtimeStatePublicationReceipt.js`, `lib/ql7-support/runtime/runtimeStateReceipt.js`, `lib/ql7-support/runtime/stateReceipt.js`, `lib/ql7-support/runtime/transportContract.js`, `lib/ql7-support/runtime/turnSequencer.js`, `lib/ql7-support/runtimeCapabilityRegistry.js`, `lib/ql7-support/runtimeStateMachine.js`, `lib/ql7-support/safety/crisisAssessment.js`, `lib/ql7-support/safety/crisisConceptBank.js`, `lib/ql7-support/safety/crisisReviewedCueBank.js`, `lib/ql7-support/safety/escalationLedger.js`, `lib/ql7-support/safety/evaluateTurn.js`, `lib/ql7-support/safety/insultAssessment.js`, `lib/ql7-support/safety/insultStateMachine.js`, `lib/ql7-support/safety/obfuscationMatcher.js`, `lib/ql7-support/safety/sharedSemanticEvidence.js`, `lib/ql7-support/scenarioContracts.js`, `lib/ql7-support/scheduler.js`, `lib/ql7-support/security/assetProtectionPolicy.js`, `lib/ql7-support/security/ecosystemAttackAssessment.js`, `lib/ql7-support/security/illicitAssetRoutePolicy.js`, `lib/ql7-support/security/securityActionPolicy.js`, `lib/ql7-support/security/securityEventFrame.js`, `lib/ql7-support/security/securityEvidenceReceipt.js`, `lib/ql7-support/security/securityLadderProjection.js`, `lib/ql7-support/security/securityReadPlan.js`, `lib/ql7-support/security/securityRiskFusion.js`, `lib/ql7-support/semanticBadgeRegistry.js`, `lib/ql7-support/semantics/abstentionPolicy.js`, `lib/ql7-support/semantics/analyzeTurn.js`, `lib/ql7-support/semantics/approvedInteractions.js`, `lib/ql7-support/semantics/battleExpansion.js`, `lib/ql7-support/semantics/buildResponseScopeReceipt.js`, `lib/ql7-support/semantics/calibratedPosterior.js`, `lib/ql7-support/semantics/calibratorRegistry.js`, `lib/ql7-support/semantics/candidateScorer.js`, `lib/ql7-support/semantics/clarificationRanker.js`, `lib/ql7-support/semantics/clarificationStrategyRegistry.js`, `lib/ql7-support/semantics/coreferenceResolver.js`, `lib/ql7-support/semantics/counterEvidence.js`, `lib/ql7-support/semantics/decisionCostMatrix.js`, `lib/ql7-support/semantics/decisionMath.js`, `lib/ql7-support/semantics/domainBoundaryGraph.js`, `lib/ql7-support/semantics/emotionAssessment.js`, `lib/ql7-support/semantics/entityExtractor.js`, `lib/ql7-support/semantics/featureVector.js`, `lib/ql7-support/semantics/intentConfirmationReceipt.js`, `lib/ql7-support/semantics/negationScopeResolver.js`, `lib/ql7-support/semantics/pragmaticFrame.js`, `lib/ql7-support/semantics/quotationContextResolver.js`, `lib/ql7-support/semantics/routeCalibration.js`, `lib/ql7-support/semantics/topicArbitrator.js`, `lib/ql7-support/semantics/topicDecisionReceipt.js`, `lib/ql7-support/server.js`, `lib/ql7-support/simulation/aiBoxAnalyticsOracle.js`, `lib/ql7-support/simulation/bankAuthenticityOracle.js`, `lib/ql7-support/simulation/branchScenarioCatalog.js`, `lib/ql7-support/simulation/capabilityProductionProbe.js`, `lib/ql7-support/simulation/capabilityRegistry.js`, `lib/ql7-support/simulation/capabilityScenario.js`, `lib/ql7-support/simulation/clarificationOracle.js`, `lib/ql7-support/simulation/composerSafetyOracle.js`, `lib/ql7-support/simulation/corpora/conversationBreadth.js`, `lib/ql7-support/simulation/corpora/knowledge32.js`, `lib/ql7-support/simulation/corpora/safetyBoundary.js`, `lib/ql7-support/simulation/crisisDepthOracle.js`, `lib/ql7-support/simulation/crisisSafetyOracle.js`, `lib/ql7-support/simulation/decisionMathOracle.js`, `lib/ql7-support/simulation/DeterministicContractOracle.js`, `lib/ql7-support/simulation/domainIsolationOracle.js`, `lib/ql7-support/simulation/embeddingSimilarityOracle.js`, `lib/ql7-support/simulation/executeScenario.js`, `lib/ql7-support/simulation/factualSimulation.js`, `lib/ql7-support/simulation/featureParityOracle.js`, `lib/ql7-support/simulation/fullCodeDataReadinessOracle.js`, `lib/ql7-support/simulation/fullCombatDataReadinessOracle.js`, `lib/ql7-support/simulation/greetingCapacityOracle.js`, `lib/ql7-support/simulation/humanNaturalnessOracle.js`, `lib/ql7-support/simulation/humanReviewAgreement.js`, `lib/ql7-support/simulation/humanReviewSampler.js`, `lib/ql7-support/simulation/humorCapacityOracle.js`, `lib/ql7-support/simulation/humorMaterialDiversityOracle.js`, `lib/ql7-support/simulation/identityAudit.js`, `lib/ql7-support/simulation/independentOracle.js`, `lib/ql7-support/simulation/inMemoryPolicyDb.js`, `lib/ql7-support/simulation/lab/ablationRunner.js`, `lib/ql7-support/simulation/lab/calibrationMetrics.js`, `lib/ql7-support/simulation/lab/causalAttribution.js`, `lib/ql7-support/simulation/lab/checkpointJournal.js`, `lib/ql7-support/simulation/lab/counterfactualGenerator.js`, `lib/ql7-support/simulation/lab/coverageTensor.js`, `lib/ql7-support/simulation/lab/datasetLineage.js`, `lib/ql7-support/simulation/lab/datasetRegistry.js`, `lib/ql7-support/simulation/lab/deltaDebugger.js`, `lib/ql7-support/simulation/lab/differentialRunner.js`, `lib/ql7-support/simulation/lab/distributedCoordinator.js`, `lib/ql7-support/simulation/lab/driftMetrics.js`, `lib/ql7-support/simulation/lab/evidenceMerkleTree.js`, `lib/ql7-support/simulation/lab/experimentManifest.js`, `lib/ql7-support/simulation/lab/factorialDesign.js`, `lib/ql7-support/simulation/lab/failureClusterer.js`, `lib/ql7-support/simulation/lab/humanReviewQueue.js`, `lib/ql7-support/simulation/lab/liveProofRegistry.js`, `lib/ql7-support/simulation/lab/liveProofRunner.js`, `lib/ql7-support/simulation/lab/metamorphicGenerator.js`, `lib/ql7-support/simulation/lab/multipleTestingCorrection.js`, `lib/ql7-support/simulation/lab/mutationInvariantRegistry.js`, `lib/ql7-support/simulation/lab/oracleConsensus.js`, `lib/ql7-support/simulation/lab/oracleProcessClient.js`, `lib/ql7-support/simulation/lab/oracleProcessProtocol.js`, `lib/ql7-support/simulation/lab/oracleSandbox.js`, `lib/ql7-support/simulation/lab/powerAnalysis.js`, `lib/ql7-support/simulation/lab/propertyFuzzer.js`, `lib/ql7-support/simulation/lab/releaseGate.js`, `lib/ql7-support/simulation/lab/replayPackBuilder.js`, `lib/ql7-support/simulation/lab/reviewAgreement.js`, `lib/ql7-support/simulation/lab/scenarioGenerator.js`, `lib/ql7-support/simulation/lab/scientificLabContract.js`, `lib/ql7-support/simulation/lab/shardWriter.js`, `lib/ql7-support/simulation/lab/splitAllocator.js`, `lib/ql7-support/simulation/lab/splitLeakageDetector.js`, `lib/ql7-support/simulation/lab/statisticalEngine.js`, `lib/ql7-support/simulation/lab/supportUniverseInventory.js`, `lib/ql7-support/simulation/lab/workerLease.js`, `lib/ql7-support/simulation/labCheckpoint.js`, `lib/ql7-support/simulation/labNoveltyIndex.js`, `lib/ql7-support/simulation/labPlanRegistry.js`, `lib/ql7-support/simulation/labRootCause.js`, `lib/ql7-support/simulation/labScenarioLedger.js`, `lib/ql7-support/simulation/languageSeedDiversityOracle.js`, `lib/ql7-support/simulation/liveRead.js`, `lib/ql7-support/simulation/localePurityOracle.js`, `lib/ql7-support/simulation/materialityOracle.js`, `lib/ql7-support/simulation/microtopicDialogue.js`, `lib/ql7-support/simulation/model/knowledgeRetrievalOracle.js`, `lib/ql7-support/simulation/model/modelEvaluationRunner.js`, `lib/ql7-support/simulation/model/modelMutationSuite.js`, `lib/ql7-support/simulation/model/nativeLanguageReviewPack.js`, `lib/ql7-support/simulation/model/nativeModelOracleClient.js`, `lib/ql7-support/simulation/model/publicEntityOracle.js`, `lib/ql7-support/simulation/model/semanticHoldoutOracle.js`, `lib/ql7-support/simulation/mutationEngine.js`, `lib/ql7-support/simulation/openHumanTopicOracle.js`, `lib/ql7-support/simulation/operatorEvidenceOracle.js`, `lib/ql7-support/simulation/outcomeCalibrationOracle.js`, `lib/ql7-support/simulation/productionParityHarness.js`, `lib/ql7-support/simulation/publicFigureCoverageOracle.js`, `lib/ql7-support/simulation/publicFigureRichnessOracle.js`, `lib/ql7-support/simulation/releaseEvidenceManifest.js`, `lib/ql7-support/simulation/reportWriter.js`, `lib/ql7-support/simulation/scenarioCatalog.js`, `lib/ql7-support/simulation/scientificScenario.js`, `lib/ql7-support/simulation/semanticDuplicateOracle.js`, `lib/ql7-support/simulation/statisticalAcceptance.js`, `lib/ql7-support/simulation/surfaceRedundancyOracle.js`, `lib/ql7-support/simulation/topicMemoryOracle.js`, `lib/ql7-support/simulationGenerator.js`, `lib/ql7-support/simulationOntology.js`, `lib/ql7-support/sourceRegistry.js`, `lib/ql7-support/systemActor.js`, `lib/ql7-support/telemetry/canonicalTelemetry.js`, `lib/ql7-support/toneAssessment.js`, `lib/ql7-support/topicActionRegistry.js`, `lib/ql7-support/turnSemanticFrame.js`, `lib/ql7-support/vipResolver.js`, `lib/ql7HevcDecoderWorker.js`, `lib/ql7HevcFallbackDecoder.js`, `lib/ql7HevcFallbackPrimitives.js`, `lib/ql7HevcPresentationReorder.js`, `lib/redis.js`, `lib/safeWin.js`, `lib/seo/siteIndex.js`, `lib/seo/siteOrigin.js`, `lib/seo/structuredData.js`, `lib/seo/trustIdentityContent.js`, `lib/seo/trustIdentityMachineIdentity.js`, `lib/seo/trustIdentityMetadata.js`, `lib/seo/trustIdentityRoutes.js`, `lib/seo/trustIdentityStructuredData.js`, `lib/storage/mediaKeys.js`, `lib/storage/r2.js`, `lib/subscriptions.js`, `lib/supportEmailTransport.js`, `lib/tma.js`, `lib/videoPipelineProgress.js`, `lib/visual-runtime/animatedAssetManifest.js`, `lib/visual-runtime/animatedAssetRegistry.js`, `lib/visual-runtime/visualActivityRegistry.js`, `lib/walletSessionClient.js`, `lib/webPush.js`
- Связанные зоны: `app`, `app/api`, `components`, `app/forum`
- Примечания: Это не UI-слой; здесь должна жить инфраструктура и общая прикладная логика.

## Static Assets Ownership

### public/__ql7_visual_posters

- Зона: `public/__ql7_visual_posters`
- Назначение: Статические ассеты namespace __ql7_visual_posters.
- Точки входа: `public/__ql7_visual_posters/ai/ai.gif.webp`, `public/__ql7_visual_posters/audio/bgaudio.gif.webp`, `public/__ql7_visual_posters/click/authorization.gif.webp`, `public/__ql7_visual_posters/click/quest.gif.webp`, `public/__ql7_visual_posters/click/telegram.gif.webp`, `public/__ql7_visual_posters/friends/invitation.gif.webp`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/.well-known

- Зона: `public/.well-known`
- Назначение: Статические ассеты namespace .well-known.
- Точки входа: `public/.well-known/assetlinks.json`, `public/.well-known/ql7-identity.json`, `public/.well-known/README.md`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/academy

- Зона: `public/academy`
- Назначение: Статические ассеты namespace academy.
- Точки входа: `public/academy/ai_block_15.png`, `public/academy/ai_block_16.png`, `public/academy/ai_meta_block_17.png`, `public/academy/chain_block_03.png`, `public/academy/dao_meta_block_08.png`, `public/academy/data_ai_block_14.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/ads

- Зона: `public/ads`
- Назначение: Статические ассеты namespace ads.
- Точки входа: `public/ads/hero-preview.png`, `public/ads/ql7-forum-global.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/ai

- Зона: `public/ai`
- Назначение: Статические ассеты namespace ai.
- Точки входа: `public/ai/ai.gif`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/android

- Зона: `public/android`
- Назначение: Статические ассеты namespace android.
- Точки входа: `public/android/Quantum L7 AI release 1.0.7.apk`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/anonymous

- Зона: `public/anonymous`
- Назначение: Статические ассеты namespace anonymous.
- Точки входа: `public/anonymous/anonymous.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/audio

- Зона: `public/audio`
- Назначение: Статические ассеты namespace audio.
- Точки входа: `public/audio/bgaudio.gif`, `public/audio/cosmic.mp3`, `public/audio/Q-Cast.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/branding

- Зона: `public/branding`
- Назначение: Статические ассеты namespace branding.
- Точки входа: `public/branding/about-analytics.jpg`, `public/branding/about-architecture.jpg`, `public/branding/about-feed.jpg`, `public/branding/about-poster.jpg`, `public/branding/exchange_promo.png`, `public/branding/explain_promo.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/click

- Зона: `public/click`
- Назначение: Статические ассеты namespace click.
- Точки входа: `public/click/authorization.gif`, `public/click/policy.png`, `public/click/quest.gif`, `public/click/support.png`, `public/click/telegram.gif`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/coins

- Зона: `public/coins`
- Назначение: Статические ассеты namespace coins.
- Точки входа: `public/coins/battlecoin/logo.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/friends

- Зона: `public/friends`
- Назначение: Статические ассеты namespace friends.
- Точки входа: `public/friends/fb.png`, `public/friends/ig.png`, `public/friends/invitation.gif`, `public/friends/tg.png`, `public/friends/viber.png`, `public/friends/wa.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/fucher

- Зона: `public/fucher`
- Назначение: Статические ассеты namespace fucher.
- Точки входа: `public/fucher/fucher.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/game

- Зона: `public/game`
- Назначение: Статические ассеты namespace game.
- Точки входа: `public/game/1.png`, `public/game/apk.png`, `public/game/game.gif`, `public/game/glif1.png`, `public/game/glif2.png`, `public/game/glif3.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/icons

- Зона: `public/icons`
- Назначение: Статические ассеты namespace icons.
- Точки входа: `public/icons/instagram.png`, `public/icons/telegram.png`, `public/icons/tiktok.png`, `public/icons/twitter.png`, `public/icons/youtube.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/isvip

- Зона: `public/isvip`
- Назначение: Статические ассеты namespace isvip.
- Точки входа: `public/isvip/1.png`, `public/isvip/2.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/leng

- Зона: `public/leng`
- Назначение: Статические ассеты namespace leng.
- Точки входа: `public/leng/ar.png`, `public/leng/en.png`, `public/leng/es.png`, `public/leng/ru.png`, `public/leng/tr.png`, `public/leng/uk.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/load

- Зона: `public/load`
- Назначение: Статические ассеты namespace load.
- Точки входа: `public/load/load.mp4`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/metab

- Зона: `public/metab`
- Назначение: Статические ассеты namespace metab.
- Точки входа: `public/metab/about1.png`, `public/metab/academy1.png`, `public/metab/ads1.png`, `public/metab/exchange1.png`, `public/metab/forum1.png`, `public/metab/game1.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/metamarket

- Зона: `public/metamarket`
- Назначение: Статические ассеты namespace metamarket.
- Точки входа: `public/metamarket/cyber_animals/Aetherion.webp`, `public/metamarket/cyber_animals/AetherScavenger.webp`, `public/metamarket/cyber_animals/AquaMind.webp`, `public/metamarket/cyber_animals/AquaPulse.webp`, `public/metamarket/cyber_animals/AquaSentinel.webp`, `public/metamarket/cyber_animals/AuroraVix.webp`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/models

- Зона: `public/models`
- Назначение: Статические ассеты namespace models.
- Точки входа: `public/models/nsfwjs/group1-shard1of1`, `public/models/nsfwjs/model.json`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/qcoind

- Зона: `public/qcoind`
- Назначение: Статические ассеты namespace qcoind.
- Точки входа: `public/qcoind/mini.mp4`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/ql7

- Зона: `public/ql7`
- Назначение: Статические ассеты namespace ql7.
- Точки входа: `public/ql7/ql7support.png`, `public/ql7/static.png`, `public/ql7/video.mp4`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/Quest

- Зона: `public/Quest`
- Назначение: Статические ассеты namespace Quest.
- Точки входа: `public/Quest/q1.mp4`, `public/Quest/q1.png`, `public/Quest/q1/1.png`, `public/Quest/q1/2.png`, `public/Quest/q1/3.png`, `public/Quest/q1/4.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/robot

- Зона: `public/robot`
- Назначение: Статические ассеты namespace robot.
- Точки входа: `public/robot/1.png`, `public/robot/2.png`, `public/robot/3.png`, `public/robot/4.png`, `public/robot/5.png`, `public/robot/6.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/snow

- Зона: `public/snow`
- Назначение: Статические ассеты namespace snow.
- Точки входа: `public/snow/fx. 1png`, `public/snow/fx.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/uploads

- Зона: `public/uploads`
- Назначение: Статические ассеты namespace uploads.
- Точки входа: нет явных root-entry файлов
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/vendor

- Зона: `public/vendor`
- Назначение: Статические ассеты namespace vendor.
- Точки входа: `public/vendor/ffmpeg/814.ffmpeg.js`, `public/vendor/ffmpeg/ffmpeg-core.js`, `public/vendor/ffmpeg/ffmpeg-core.wasm`, `public/vendor/ffmpeg/ffmpeg.js`, `public/vendor/ffmpeg/manifest.json`, `public/vendor/ql7-hevc/hevc-decode.js`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/vip

- Зона: `public/vip`
- Назначение: Статические ассеты namespace vip.
- Точки входа: `public/vip/avatars/a1.gif`, `public/vip/avatars/a2.gif`, `public/vip/avatars/a3.gif`, `public/vip/avatars/a4.gif`, `public/vip/avatars/a5.gif`, `public/vip/avatars/a6.gif`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/workers

- Зона: `public/workers`
- Назначение: Статические ассеты namespace workers.
- Точки входа: `public/workers/814.ffmpeg.js`, `public/workers/forum-trim-worker.js`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

## Tooling And Audit Ownership

### Audit Artifacts

- Зона: `audit`
- Назначение: JSON-артефакты проверок, фаз миграции и технических отчетов.
- Точки входа: `audit/forum-final-created-files-check.json`, `audit/forum-final-ownership-map.json`, `audit/forum-final-residual-monolith.json`, `audit/forum-functional-parity.report.json`, `audit/forum-phase-00-architecture.json`, `audit/forum-phase-01-shared.json`, `audit/forum-phase-02-ui-primitives.json`, `audit/forum-phase-03-feed.json`, `audit/forum-phase-04-media.json`, `audit/forum-phase-05-dm.json`, `audit/forum-phase-06-profile-social-qcoin.json`, `audit/forum-phase-07-quests-moderation-diagnostics.json`
- Связанные зоны: `tools`, `app/forum`, `app/api`, `manual verification`

### Tools

- Зона: `tools`
- Назначение: Локальные генераторы и аудит-скрипты проекта.
- Точки входа: `tools/analyze-canonical-economic-backup.mjs`, `tools/analyze-forum-diag.js`, `tools/analyze-forum-media-har.js`, `tools/analyze-heapsnapshot.js`, `tools/apply-ql7-support-scoped-closure.ps1`, `tools/audit-account-sync.js`, `tools/audit-ad-runtime.js`, `tools/audit-adaptive-actions.js`, `tools/audit-adaptive-core.js`, `tools/audit-auth-bus.js`, `tools/audit-auth-cascade.js`, `tools/audit-console-noise.js`, `tools/audit-diagnostics-boundaries.js`, `tools/audit-effects.js`, `tools/audit-feature-flag-safety.js`, `tools/audit-forensic-mode-bounds.js`, `tools/audit-forum-deps.js`, `tools/audit-forum-functional-parity.ps1`, `tools/audit-forum-media-churn.js`, `tools/audit-forum-runtime-stability.mjs`, `tools/audit-forum-scroll-runtime.js`, `tools/audit-forum-startup.js`, `tools/audit-forum-view-report.js`, `tools/audit-full-forum.js`, `tools/audit-global-visual-activity.mjs`, `tools/audit-heavy.js`, `tools/audit-iframe-restore.js`, `tools/audit-layout-stability.js`, `tools/audit-media-budget.js`, `tools/audit-media-ownership.js`, `tools/audit-media.js`, `tools/audit-mobile-profile-budget.js`, `tools/audit-mode-contract.js`, `tools/audit-player-ownership.js`, `tools/audit-post-video-lifecycle.js`, `tools/audit-preload-waste.js`, `tools/audit-prod-lite-discipline.js`, `tools/audit-project-docs.js`, `tools/audit-provider-baseline.js`, `tools/audit-route-budgets.js`, `tools/audit-route-priority-policies.js`, `tools/audit-route-teardown.js`, `tools/audit-runtime-hotspots.js`, `tools/audit-runtime-mode-resolution.js`, `tools/audit-runtime-passports.js`, `tools/audit-same-src-thrash.js`, `tools/compare-baselines.js`, `tools/generate-project-dependencies.js`, `tools/generate-project-docs.js`, `tools/generate-project-ownership.js`, `tools/generate-project-risks.js`, `tools/generate-project-routes.js`, `tools/generate-project-tree.js`, `tools/generate-trust-identity-machine-surfaces.mjs`, `tools/ingest/normalizeHar.js`, `tools/ingest/normalizeHeap.js`, `tools/inventory-forum-runtime-lifecycle.mjs`, `tools/project-docs-shared.js`, `tools/prove-forum-navigation-contracts.mjs`, `tools/prove-forum-windowing-height-index.mjs`, `tools/prove-global-visual-activity.mjs`, `tools/ql7-faststart-browser-smoke-v68.mjs`, `tools/ql7-faststart-local-v68-check.mjs`, `tools/ql7-ffmpeg-assets-check-v68.mjs`, `tools/ql7-finalize-localized-trust-root-html.mjs`, `tools/ql7-forum-native-video-light-prewarm-check-r24-fix2.mjs`, `tools/ql7-forum-user-recommendations-top500-check-final-baseline-v12.mjs`, `tools/ql7-front-camera-poster-mirror-check-r24-fix2.mjs`, `tools/ql7-har-media-churn.mjs`, `tools/ql7-hevc-assets-check-v7.mjs`, `tools/ql7-hevc-browser-bundle-check-v9.mjs`, `tools/ql7-install-hevc-wasm-v7.mjs`, `tools/ql7-install-local-ffmpeg-v68.mjs`, `tools/ql7-iphone-avc-streaming-check-r22.mjs`, `tools/ql7-media-owner-audit.mjs`, `tools/ql7-media-pressure-watch.mjs`, `tools/ql7-media-rootfix-v57-check.mjs`, `tools/ql7-media-rootfix-v57-smoke.mjs`, `tools/ql7-mp4-atom-audit.mjs`, `tools/ql7-native-video-poster-check-v1.mjs`, `tools/ql7-trust-identity-check-final-baseline-v3.mjs`, `tools/ql7-trust-identity-source-integrity-final-baseline-v3.mjs`, `tools/ql7-trust-identity-verify-built-html-final-baseline-v3.mjs`, `tools/run-governance-group.mjs`, `tools/run-scenario-telemetry.mjs`, `tools/run-verification-audits.mjs`, `tools/runtime-governance-baseline.mjs`, `tools/runtime-governance.js`, `tools/smoke-wallet-session.mjs`, `tools/split-i18n-dicts.mjs`, `tools/test-codex.mjs`, `tools/verify-docs-workflow.mjs`, `tools/verify-economic-environment.mjs`, `tools/verify-environment.mjs`, `tools/verify-global-visual-posters.mjs`, `tools/verify-ql7-rev51-release.mjs`
- Связанные зоны: `audit`, `app`, `app/forum`, `app/api`, `components`, `lib`
