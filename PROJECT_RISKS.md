# PROJECT_RISKS.md

> Обязательное правило сопровождения:
> Если меняются критические точки входа, серверные контракты, import-граф или ownership модулей, этот файл должен быть обновлен.
> Рекомендуемый способ обновления: `node tools/generate-project-risks.js`.

Сгенерировано автоматически: 2026-05-01T15:21:01.360Z
Исходных файлов в анализе: 812
Route-aware файлов: 96

## Что Считается Риском

- Файлы с большим числом потребителей.
- Файлы с большим числом локальных зависимостей.
- Route/layout/API entry points, влияющие на экранный или серверный поток.
- DB/cache/config/i18n узлы, от которых зависят несколько доменов одновременно.

## Критические Route И Runtime Entry Points

- `app/about/layout.js` — Изменение влияет на layout-сборку и поведение целого маршрута/домена.
- `app/about/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/academy/layout.js` — Изменение влияет на layout-сборку и поведение целого маршрута/домена.
- `app/academy/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/ads/layout.js` — Изменение влияет на layout-сборку и поведение целого маршрута/домена.
- `app/ads/page.jsx` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/api/_diag/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/academy/exam/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/ads/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/aiquota/usage/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/battlecoin/order/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/battlecoin/state/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/brain/analyze/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/coins/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/contact/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/crypto-news/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/debug/forum-diag/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/deep-translate/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/dm/block/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/dm/delete/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/dm/dialogs/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/dm/seen/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/dm/send/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/dm/thread/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/dm/unblock/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/admin/banUser/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/admin/deletePost/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/admin/deleteTopic/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/admin/unbanUser/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/admin/verify/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/blobUploadUrl/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/events/stream/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/mediaLock/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/moderate/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/mutate/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/own/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/post-by-id/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/post-chain/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/post-locate/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/post-meta/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/recommendations/users/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/report/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/snapshot/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/subs/count/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/subs/list/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/subs/my-count/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/subs/toggle/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/upload/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/uploadAudio/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/uploadVideo/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/vip/batch/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/forum/wa-preview/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/market/summary/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/pay/create/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/pay/webhook/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/payments/demo/complete/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/payments/now/create/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/payments/now/webhook/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/profile/batch/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/profile/check-nick/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/profile/get-about/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/profile/get-profile/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/profile/save-nick/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/profile/set-about/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/profile/upload-avatar/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/profile/user-popover/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/qcoin/drop/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/qcoin/get/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/qcoin/heartbeat/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/quest/env/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/quest/progress/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/quest/status/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/quotes/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/referral/hit/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/referral/link/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/subscription/status/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/telegram/link/confirm/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/telegram/link/resolve/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/telegram/link/start/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/telegram/link/status/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/api/tma/auto/route.js` — Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.
- `app/contact/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/exchange/layout.js` — Изменение влияет на layout-сборку и поведение целого маршрута/домена.
- `app/exchange/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/forum/layout.js` — Изменение влияет на layout-сборку и поведение целого маршрута/домена.
- `app/forum/loading.js` — Изменение влияет на загрузочное состояние и UX-сценарии.
- `app/forum/p/[postId]/route.js` — Изменение влияет на маршрутный runtime.
- `app/forum/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/game/layout.js` — Изменение влияет на layout-сборку и поведение целого маршрута/домена.
- `app/game/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/layout.js` — Изменение влияет на layout-сборку и поведение целого маршрута/домена.
- `app/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/privacy/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/subscribe/layout.js` — Изменение влияет на layout-сборку и поведение целого маршрута/домена.
- `app/subscribe/page.js` — Изменение влияет на экран/маршрут как на основную точку входа.
- `app/tma/auto/page.jsx` — Изменение влияет на экран/маршрут как на основную точку входа.

## Файлы С Самым Высоким Fan-In

- `app/api/forum/_utils.js` — используют 33 локальных модулей
- `app/api/forum/_db.js` — используют 32 локальных модулей
- `components/i18n.js` — используют 31 локальных модулей
- `tools/runtime-governance.js` — используют 25 локальных модулей
- `app/forum/features/profile/utils/profileCache.js` — используют 18 локальных модулей
- `app/forum/shared/utils/classnames.js` — используют 17 локальных модулей
- `app/api/profile/_identity.js` — используют 15 локальных модулей
- `tests/support/runtimeGovernance.js` — используют 11 локальных модулей
- `app/forum/shared/utils/forumWindowingRegistry.js` — используют 9 локальных модулей
- `app/api/dm/_utils.js` — используют 8 локальных модулей
- `app/forum/features/profile/components/AvatarEmoji.jsx` — используют 8 локальных модулей
- `app/forum/shared/components/HydrateText.jsx` — используют 8 локальных модулей
- `app/forum/shared/hooks/useForumWindowing.js` — используют 8 локальных модулей
- `lib/metadataCache.js` — используют 8 локальных модулей
- `src/shared/runtime/budgets/routeProfiles.js` — используют 8 локальных модулей
- `app/api/dm/_db.js` — используют 7 локальных модулей
- `app/forum/shared/utils/browser.js` — используют 7 локальных модулей
- `app/forum/shared/utils/forumWindowingPresets.js` — используют 7 локальных модулей
- `app/ads.js` — используют 6 локальных модулей
- `app/forum/shared/hooks/useEvent.js` — используют 6 локальных модулей
- `app/forum/shared/utils/formatters.js` — используют 6 локальных модулей
- `app/forum/features/dm/utils/dmLoaders.js` — используют 5 локальных модулей
- `app/forum/features/profile/components/VipFlipBadge.jsx` — используют 5 локальных модулей
- `app/forum/shared/constants/media.js` — используют 5 локальных модулей
- `app/forum/shared/utils/counts.js` — используют 5 локальных модулей

## Файлы С Самым Высоким Fan-Out

- `app/forum/ForumRoot.jsx` — импортирует 65 локальных модулей
- `app/forum/features/feed/components/ForumPostCard.jsx` — импортирует 14 локальных модулей
- `app/forum/features/dm/hooks/useForumDmRuntime.js` — импортирует 12 локальных модулей
- `app/forum/features/feed/components/TopicItem.jsx` — импортирует 11 локальных модулей
- `app/layout.js` — импортирует 11 локальных модулей
- `app/forum/features/dm/components/DmDialogRow.jsx` — импортирует 9 локальных модулей
- `app/forum/features/dm/components/DmThreadMessageRow.jsx` — импортирует 9 локальных модулей
- `app/forum/features/ui/components/ComposerCore.jsx` — импортирует 9 локальных модулей
- `app/forum/ForumHeaderPanel.jsx` — импортирует 9 локальных модулей
- `tests/integration/forum/features/feed/hooks/useUserRecommendationsRail.test.jsx` — импортирует 9 локальных модулей
- `tests/unit/i18n/i18nDictionaries.test.js` — импортирует 9 локальных модулей
- `tests/unit/runtime/runtimeGovernance.test.js` — импортирует 9 локальных модулей
- `app/forum/features/ui/components/ForumOverlayStack.jsx` — импортирует 8 локальных модулей
- `app/forum/features/ui/hooks/useForumScreenFlowsRuntime.js` — импортирует 8 локальных модулей
- `components/i18n.js` — импортирует 8 локальных модулей
- `app/forum/features/dm/components/DmMessagesPane.jsx` — импортирует 7 локальных модулей
- `app/forum/features/dm/components/DmThreadHeader.jsx` — импортирует 7 локальных модулей
- `app/forum/features/feed/components/PostHeaderMeta.jsx` — импортирует 7 локальных модулей
- `app/forum/features/feed/hooks/useForumFeedRuntime.js` — импортирует 7 локальных модулей
- `app/forum/features/ui/utils/buildForumRootPropBundles.js` — импортирует 7 локальных модулей
- `app/forum/ForumLayout.jsx` — импортирует 7 локальных модулей
- `src/shared/runtime/mode/runtimeMode.js` — импортирует 7 локальных модулей
- `app/forum/features/media/hooks/useForumVideoFeedRuntime.js` — импортирует 6 локальных модулей
- `app/forum/features/profile/components/ProfilePopover.jsx` — импортирует 6 локальных модулей
- `app/forum/features/ui/hooks/useForumComposerSubmitRuntime.js` — импортирует 6 локальных модулей

## Зоны С Повышенной Плотностью Связей

- `app/layout.js` — файлов: 1; исходящих связей: 11; плотность: 11
- `forum/root` — файлов: 14; исходящих связей: 89; плотность: 6.36
- `app/page.js` — файлов: 1; исходящих связей: 3; плотность: 3
- `app/ads` — файлов: 4; исходящих связей: 10; плотность: 2.5
- `api/profile` — файлов: 9; исходящих связей: 19; плотность: 2.11
- `app/exchange` — файлов: 3; исходящих связей: 6; плотность: 2
- `api/brain` — файлов: 1; исходящих связей: 2; плотность: 2
- `api/market` — файлов: 1; исходящих связей: 2; плотность: 2
- `forum/dm` — файлов: 31; исходящих связей: 59; плотность: 1.9
- `api/forum` — файлов: 30; исходящих связей: 54; плотность: 1.8
- `api/dm` — файлов: 9; исходящих связей: 16; плотность: 1.78
- `forum/feed` — файлов: 59; исходящих связей: 104; плотность: 1.76
- `forum/profile` — файлов: 18; исходящих связей: 30; плотность: 1.67
- `app/academy` — файлов: 3; исходящих связей: 5; плотность: 1.67
- `api/pay` — файлов: 2; исходящих связей: 3; плотность: 1.5
- `api/referral` — файлов: 2; исходящих связей: 3; плотность: 1.5
- `app/about` — файлов: 2; исходящих связей: 3; плотность: 1.5
- `app/game` — файлов: 2; исходящих связей: 3; плотность: 1.5
- `app/subscribe` — файлов: 3; исходящих связей: 4; плотность: 1.33
- `forum/ui` — файлов: 51; исходящих связей: 64; плотность: 1.25
- `src/shared` — файлов: 32; исходящих связей: 34; плотность: 1.06
- `api/telegram` — файлов: 4; исходящих связей: 4; плотность: 1
- `api/qcoin` — файлов: 3; исходящих связей: 3; плотность: 1
- `api/battlecoin` — файлов: 2; исходящих связей: 2; плотность: 1
- `api/academy` — файлов: 1; исходящих связей: 1; плотность: 1
- `api/ads` — файлов: 1; исходящих связей: 1; плотность: 1
- `api/subscription` — файлов: 1; исходящих связей: 1; плотность: 1
- `app/ads.js` — файлов: 1; исходящих связей: 1; плотность: 1
- `app/components` — файлов: 1; исходящих связей: 1; плотность: 1
- `app/contact` — файлов: 1; исходящих связей: 1; плотность: 1

## Серверные И Инфраструктурные Хотспоты

- `app/api/_diag/route.js`
- `app/api/academy/exam/route.js`
- `app/api/ads/route.js`
- `app/api/aiquota/usage/route.js`
- `app/api/battlecoin/order/route.js`
- `app/api/battlecoin/state/route.js`
- `app/api/brain/analyze/route.js`
- `app/api/coins/route.js`
- `app/api/contact/route.js`
- `app/api/crypto-news/route.js`
- `app/api/debug/forum-diag/route.js`
- `app/api/deep-translate/route.js`
- `app/api/dm/_db.js`
- `app/api/dm/_utils.js`
- `app/api/dm/block/route.js`
- `app/api/dm/delete/route.js`
- `app/api/dm/dialogs/route.js`
- `app/api/dm/seen/route.js`
- `app/api/dm/send/route.js`
- `app/api/dm/thread/route.js`
- `app/api/dm/unblock/route.js`
- `app/api/forum/_db.js`
- `app/api/forum/_utils.js`
- `app/api/forum/admin/banUser/route.js`
- `app/api/forum/admin/deletePost/route.js`
- `app/api/forum/admin/deleteTopic/route.js`
- `app/api/forum/admin/unbanUser/route.js`
- `app/api/forum/admin/verify/route.js`
- `app/api/forum/blobUploadUrl/route.js`
- `app/api/forum/events/stream/route.js`
- `app/api/forum/mediaLock/route.js`
- `app/api/forum/moderate/route.js`
- `app/api/forum/mutate/route.js`
- `app/api/forum/own/route.js`
- `app/api/forum/post-by-id/route.js`
- `app/api/forum/post-chain/route.js`
- `app/api/forum/post-locate/route.js`
- `app/api/forum/post-meta/route.js`
- `app/api/forum/recommendations/users/route.js`
- `app/api/forum/report/route.js`
- `app/api/forum/snapshot/route.js`
- `app/api/forum/subs/count/route.js`
- `app/api/forum/subs/list/route.js`
- `app/api/forum/subs/my-count/route.js`
- `app/api/forum/subs/toggle/route.js`
- `app/api/forum/upload/route.js`
- `app/api/forum/uploadAudio/route.js`
- `app/api/forum/uploadVideo/route.js`
- `app/api/forum/vip/batch/route.js`
- `app/api/forum/wa-preview/route.js`
- `app/api/market/summary/route.js`
- `app/api/pay/create/route.js`
- `app/api/pay/webhook/route.js`
- `app/api/payments/demo/complete/route.js`
- `app/api/payments/now/create/route.js`
- `app/api/payments/now/webhook/route.js`
- `app/api/profile/batch/route.js`
- `app/api/profile/check-nick/route.js`
- `app/api/profile/get-about/route.js`
- `app/api/profile/get-profile/route.js`
- `app/api/profile/save-nick/route.js`
- `app/api/profile/set-about/route.js`
- `app/api/profile/upload-avatar/route.js`
- `app/api/profile/user-popover/route.js`
- `app/api/qcoin/drop/route.js`
- `app/api/qcoin/get/route.js`
- `app/api/qcoin/heartbeat/route.js`
- `app/api/quest/env/route.js`
- `app/api/quest/progress/route.js`
- `app/api/quest/status/route.js`
- `app/api/quotes/route.js`
- `app/api/referral/hit/route.js`
- `app/api/referral/link/route.js`
- `app/api/subscription/status/route.js`
- `app/api/telegram/link/confirm/route.js`
- `app/api/telegram/link/resolve/route.js`
- `app/api/telegram/link/start/route.js`
- `app/api/telegram/link/status/route.js`
- `app/api/tma/auto/route.js`
- `components/i18n.js`
- `lib/forumShareManager.js`
- `lib/forumVideoTrim.js`
- `lib/geo/countries.js`
- `lib/geo/regions.js`
- `lib/metadataCache.js`
- `lib/redis.js`

## Корневые Конфиги И Документы Управления

- `package.json`
- `next.config.mjs`
- `jsconfig.json`
- `.eslintrc.json`
- `.env.local.example`
- `README.md`

## Практический Вывод

- Перед изменениями в route/layout/API и high fan-in файлах нужен отдельный локальный аудит импорта и сценариев.
- Перед изменениями в `app/api/**`, `lib/**`, `components/i18n.js` и `middleware.js` нужно ожидать междоменный эффект.
- Этот файл нужен не для косметики, а чтобы быстро видеть зоны, где одно изменение чаще всего ломает несколько частей проекта.