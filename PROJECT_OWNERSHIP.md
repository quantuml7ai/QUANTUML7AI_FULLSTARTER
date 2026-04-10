# PROJECT_OWNERSHIP.md

> Обязательное правило сопровождения:
> Если меняется граница ответственности каталогов, появляются новые домены, переносятся модули между зонами или меняются entry points, этот файл обязан быть обновлен.
> Рекомендуемый способ обновления: `node tools/generate-project-ownership.js`.

Сгенерировано автоматически: 2026-04-10T16:59:43.103Z

## Общий Принцип

- `app/` владеет страницами, layout-слоем и серверными route handlers.
- `app/api/` владеет backend/API-контуром.
- `components/` владеет truly shared UI вне одного домена.
- `lib/` владеет общей инфраструктурой и серверно-клиентскими библиотеками.
- `app/forum/` владеет форумом, DM, media, qcoin, quests и их feature-oriented слоями.
- `public/` владеет статическими ассетами.
- `tools/` и `audit/` владеют аудитом, диагностикой и техобслуживанием.

## App Ownership

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
- Точки входа: `app/contact/page.js`
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
- Точки входа: `app/privacy/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### subscribe

- Зона: `app/subscribe`
- Назначение: Подписочный/лендинговый контур.
- Точки входа: `app/subscribe/layout.js`, `app/subscribe/page.js`
- Связанные зоны: `components`, `lib`, `public`, `app/api`

### tma

- Зона: `app/tma`
- Назначение: TMA/Telegram Mini App страницы.
- Точки входа: `app/tma/auto/page.jsx`
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

### API: battlecoin

- Зона: `app/api/battlecoin`
- Назначение: API-домен battlecoin.
- Точки входа: `app/api/battlecoin/order/route.js`, `app/api/battlecoin/state/route.js`
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
- Точки входа: `app/api/debug/forum-diag/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: deep-translate

- Зона: `app/api/deep-translate`
- Назначение: API-домен deep-translate.
- Точки входа: `app/api/deep-translate/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: dm

- Зона: `app/api/dm`
- Назначение: Серверный контур личных сообщений: dialogs, thread, send, delete, seen, block.
- Точки входа: `app/api/dm/block/route.js`, `app/api/dm/delete/route.js`, `app/api/dm/dialogs/route.js`, `app/api/dm/seen/route.js`, `app/api/dm/send/route.js`, `app/api/dm/thread/route.js`, `app/api/dm/unblock/route.js`
- Связанные зоны: `app/forum/features/dm`, `app/forum`, `app/api/profile`, `lib`

### API: forum

- Зона: `app/api/forum`
- Назначение: Серверный контур форума: snapshot, mutate, report, moderation, uploads, subs, vip, stream.
- Точки входа: `app/api/forum/admin/banUser/route.js`, `app/api/forum/admin/deletePost/route.js`, `app/api/forum/admin/deleteTopic/route.js`, `app/api/forum/admin/unbanUser/route.js`, `app/api/forum/admin/verify/route.js`, `app/api/forum/blobUploadUrl/route.js`, `app/api/forum/events/stream/route.js`, `app/api/forum/mediaLock/route.js`, `app/api/forum/moderate/route.js`, `app/api/forum/mutate/route.js`
- Связанные зоны: `app/forum`, `lib`, `public`, `app/api/profile`

### API: market

- Зона: `app/api/market`
- Назначение: API-домен market.
- Точки входа: `app/api/market/summary/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: pay

- Зона: `app/api/pay`
- Назначение: Платежный backend и webhook-и.
- Точки входа: `app/api/pay/create/route.js`, `app/api/pay/webhook/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: payments

- Зона: `app/api/payments`
- Назначение: Платежный backend и webhook-и.
- Точки входа: `app/api/payments/demo/complete/route.js`, `app/api/payments/now/create/route.js`, `app/api/payments/now/webhook/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: profile

- Зона: `app/api/profile`
- Назначение: Профиль, about, nick, avatar и batch-профили.
- Точки входа: `app/api/profile/batch/route.js`, `app/api/profile/check-nick/route.js`, `app/api/profile/get-about/route.js`, `app/api/profile/get-profile/route.js`, `app/api/profile/save-nick/route.js`, `app/api/profile/set-about/route.js`, `app/api/profile/upload-avatar/route.js`, `app/api/profile/user-popover/route.js`
- Связанные зоны: `app`, `components`, `lib`

### API: qcoin

- Зона: `app/api/qcoin`
- Назначение: QCoin backend: balance, heartbeat, drop.
- Точки входа: `app/api/qcoin/drop/route.js`, `app/api/qcoin/get/route.js`, `app/api/qcoin/heartbeat/route.js`
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
- Точки входа: `app/forum/features/dm/components/DmDialogRow.jsx`, `app/forum/features/dm/components/DmDialogsPane.jsx`, `app/forum/features/dm/components/DmMessagesPane.jsx`, `app/forum/features/dm/components/DmThreadAlerts.jsx`, `app/forum/features/dm/components/DmThreadHeader.jsx`, `app/forum/features/dm/components/DmThreadLoadMore.jsx`, `app/forum/features/dm/components/DmThreadMessageRow.jsx`, `app/forum/features/dm/components/DmVoicePlayer.jsx`, `app/forum/features/dm/components/InboxPane.jsx`, `app/forum/features/dm/components/InboxRepliesPane.jsx`
- Связанные зоны: `app/api/dm`, `app/api/profile`, `app/forum/features/profile`, `app/forum/shared`

### Forum feature: feed

- Зона: `app/forum/features/feed`
- Назначение: Лента, темы, посты, replies, сортировки, composer и data runtime ленты.
- Точки входа: `app/forum/features/feed/components/CreateTopicCard.jsx`, `app/forum/features/feed/components/ForumPostCard.jsx`, `app/forum/features/feed/components/LoadMoreSentinel.jsx`, `app/forum/features/feed/components/PostActionBar.jsx`, `app/forum/features/feed/components/PostBodyContent.jsx`, `app/forum/features/feed/components/PostCardBridge.jsx`, `app/forum/features/feed/components/PostFxLayer.jsx`, `app/forum/features/feed/components/PostHeaderMeta.jsx`, `app/forum/features/feed/components/PostMediaStack.jsx`, `app/forum/features/feed/components/PostOwnerMenu.jsx`
- Связанные зоны: `app/api/forum`, `app/forum/features/media`, `app/forum/features/profile`, `app/forum/shared`

### Forum feature: media

- Зона: `app/forum/features/media`
- Назначение: Видео, аудио, embeds, lifecycle плееров, preview и trim/upload runtime.
- Точки входа: `app/forum/features/media/components/ComposerAttachmentPreview.jsx`, `app/forum/features/media/components/LivePreview.jsx`, `app/forum/features/media/components/qcast/QCastIcons.jsx`, `app/forum/features/media/components/QCastPlayer.jsx`, `app/forum/features/media/components/VideoFeedPane.jsx`, `app/forum/features/media/components/VideoLimitOverlay.jsx`, `app/forum/features/media/components/VideoMedia.jsx`, `app/forum/features/media/components/VideoOverlay.jsx`, `app/forum/features/media/components/VideoTrimPopover.jsx`, `app/forum/features/media/hooks/useForumComposerAttachments.js`
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
- Точки входа: `app/forum/features/qcoin/components/QCoinInline.jsx`, `app/forum/features/qcoin/components/QCoinWithdrawPopover.jsx`, `app/forum/features/qcoin/hooks/useQCoinLive.js`, `app/forum/features/qcoin/utils/account.js`, `app/forum/features/qcoin/utils/paymentWindow.js`
- Связанные зоны: `app/api/qcoin`, `app/forum/features/profile`, `app/forum/shared`

### Forum feature: quests

- Зона: `app/forum/features/quests`
- Назначение: Квесты, claim-flow, quest runtime и UI.
- Точки входа: `app/forum/features/quests/components/QuestClaimOverlay.jsx`, `app/forum/features/quests/components/QuestHub.jsx`, `app/forum/features/quests/components/QuestLaunchIcon.jsx`, `app/forum/features/quests/components/QuestPane.jsx`, `app/forum/features/quests/hooks/useForumQuestConfig.js`, `app/forum/features/quests/hooks/useForumQuestProgress.js`, `app/forum/features/quests/hooks/useForumQuestRuntime.js`, `app/forum/features/quests/hooks/useQuestClaimAction.js`, `app/forum/features/quests/hooks/useQuestStorageState.js`, `app/forum/features/quests/hooks/useQuestViewActions.js`
- Связанные зоны: `app/api/quest`, `app/forum/features/qcoin`, `app/forum/shared`

### Forum feature: subscriptions

- Зона: `app/forum/features/subscriptions`
- Назначение: Подписки и social graph inside forum.
- Точки входа: `app/forum/features/subscriptions/components/FollowersCounterInline.jsx`, `app/forum/features/subscriptions/hooks/useStarredAuthorsState.js`, `app/forum/features/subscriptions/utils/starred.js`
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
- Точки входа: `components/AuthNavClient.jsx`, `components/BgAudio.js`, `components/ForumBootSplash.jsx`, `components/ForumShellGate.jsx`, `components/HeroAvatar.js`, `components/HeroSection.js`, `components/i18n.js`, `components/InviteFriendPopup.jsx`, `components/InviteFriendProvider.jsx`, `components/LanguageSwitcher.js`, `components/NotRobot.jsx`, `components/QCoinDropFX.jsx`
- Связанные зоны: `app`, `app/forum`, `lib`, `public`
- Примечания: Сюда входят i18n, wallet-хабы, top bar, визуальные FX и общие клиентские виджеты.

### Infrastructure Libraries

- Зона: `lib`
- Назначение: Глобальные библиотеки проекта: metadata, geo, subscriptions, forum-share, trim, redis, tma и бизнес-хелперы.
- Точки входа: `lib/adsCore.js`, `lib/brain.js`, `lib/databroker.js`, `lib/forumShareManager.js`, `lib/forumVideoTrim.js`, `lib/geo/countries.js`, `lib/geo/regions.js`, `lib/indicators.js`, `lib/metadataCache.js`, `lib/redis.js`, `lib/safeWin.js`, `lib/subscriptions.js`, `lib/tma.js`
- Связанные зоны: `app`, `app/api`, `components`, `app/forum`
- Примечания: Это не UI-слой; здесь должна жить инфраструктура и общая прикладная логика.

## Static Assets Ownership

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

### public/audio

- Зона: `public/audio`
- Назначение: Статические ассеты namespace audio.
- Точки входа: `public/audio/cosmic.mp3`, `public/audio/Q-Cast.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/branding

- Зона: `public/branding`
- Назначение: Статические ассеты namespace branding.
- Точки входа: `public/branding/about-analytics.jpg`, `public/branding/about-architecture.jpg`, `public/branding/about-feed.jpg`, `public/branding/about-loop 1.mp4`, `public/branding/about-poster.jpg`, `public/branding/exchange_promo.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/click

- Зона: `public/click`
- Назначение: Статические ассеты namespace click.
- Точки входа: `public/click/authorization 1.gif`, `public/click/authorization.gif`, `public/click/policy 1.png`, `public/click/policy.png`, `public/click/quest.gif`, `public/click/support 1.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/coins

- Зона: `public/coins`
- Назначение: Статические ассеты namespace coins.
- Точки входа: `public/coins/0GUSDT.png`, `public/coins/1INCHUSDT.png`, `public/coins/1MBABYDOGEUSDT.png`, `public/coins/2ZUSDT.png`, `public/coins/1000CATUSDT.png`, `public/coins/1000CHEEMSUSDT.png`
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
- Точки входа: `public/metab/about1.jpg`, `public/metab/academy1.png`, `public/metab/ads1.png`, `public/metab/exchange1.png`, `public/metab/forum1.png`, `public/metab/game1.png`
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
- Точки входа: `public/uploads/avatars/ava_0x8F49b54543_2b1a5851f8d04c349227.png`, `public/uploads/avatars/ava_0x8F49b54543_3ac73e94e23e43ce9d4a.png`, `public/uploads/avatars/ava_0x8F49b54543_3e772da4fa014c89ba1b.png`, `public/uploads/avatars/ava_0x8F49b54543_5f42899137284397a273.png`, `public/uploads/avatars/ava_0x8F49b54543_7e472c3b350f4899a482.png`, `public/uploads/avatars/ava_0x8F49b54543_48cb9ee3b4734e8f8df6.png`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/vip

- Зона: `public/vip`
- Назначение: Статические ассеты namespace vip.
- Точки входа: `public/vip/avatars/a1.gif`, `public/vip/avatars/a2.gif`, `public/vip/avatars/a3.gif`, `public/vip/avatars/a4.gif`, `public/vip/avatars/a5.gif`, `public/vip/avatars/a6.gif`
- Связанные зоны: `app`, `components`, `app/forum`, `styles/public URLs`

### public/workers

- Зона: `public/workers`
- Назначение: Статические ассеты namespace workers.
- Точки входа: `public/workers/forum-trim-worker.js`
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
- Точки входа: `tools/analyze-forum-diag.js`, `tools/analyze-forum-media-har.js`, `tools/analyze-heapsnapshot.js`, `tools/audit-account-sync.js`, `tools/audit-ad-runtime.js`, `tools/audit-auth-bus.js`, `tools/audit-effects.js`, `tools/audit-forum-deps.js`, `tools/audit-forum-functional-parity.ps1`, `tools/audit-forum-media-churn.js`, `tools/audit-forum-scroll-runtime.js`, `tools/audit-forum-startup.js`, `tools/audit-forum-view-report.js`, `tools/audit-full-forum.js`, `tools/audit-heavy.js`, `tools/audit-media-budget.js`, `tools/audit-media.js`, `tools/audit-project-docs.js`, `tools/audit-runtime-hotspots.js`, `tools/generate-project-dependencies.js`, `tools/generate-project-docs.js`, `tools/generate-project-ownership.js`, `tools/generate-project-risks.js`, `tools/generate-project-routes.js`, `tools/generate-project-tree.js`, `tools/project-docs-shared.js`, `tools/run-verification-audits.mjs`, `tools/test-codex.mjs`, `tools/verify-docs-workflow.mjs`, `tools/verify-environment.mjs`
- Связанные зоны: `audit`, `app`, `app/forum`, `app/api`, `components`, `lib`
