import {getQl7SupportMultilingualTopicLabel} from './language/ecosystemLocaleLexicon.js'
import {QL7_SUPPORT_RELEASE_DOMAIN_ROOTS} from './ontology/domains/index.js'
import {getQl7SupportConfiguredReadCollections} from './readOnlySourceManifest.js'

export const QL7_SUPPORT_INTERFACE_LANGS = Object.freeze(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'])

export const QL7_SUPPORT_PUBLIC_OPERATOR_STATES = Object.freeze([
  'idle',
  'greeting',
  'understanding',
  'checking',
  'analyzing',
  'preparing_response',
  'answer_ready',
  'needs_clarification',
  'attention_required',
  'temporarily_unavailable',
])

export const QL7_SUPPORT_OPERATOR_STATES = QL7_SUPPORT_PUBLIC_OPERATOR_STATES

export const QL7_SUPPORT_OPERATOR_VIDEO_STATES = Object.freeze([
  'understanding',
  'checking',
  'analyzing',
  'preparing_response',
])

export const QL7_SUPPORT_OPERATOR_STATIC_STATES = Object.freeze([
  'idle',
  'greeting',
  'answer_ready',
  'needs_clarification',
  'attention_required',
  'temporarily_unavailable',
])

export const QL7_SUPPORT_PIPELINE_OPERATOR_STATES = Object.freeze([
  'idle',
  'accepted',
  'receiving',
  'auth_verifying',
  'identity_resolving',
  'language_detecting',
  'translating_in',
  'context_loading',
  'intent_mapping',
  'entity_resolving',
  'data_collecting',
  'diagnosing',
  'synthesizing',
  'fact_checking',
  'clarifying',
  'composing',
  'sending',
  'delivered',
  'waiting_user',
  'waiting_admin',
  'error',
  'offline',
])

export const QL7_SUPPORT_OPERATOR_STATE_ALIASES = Object.freeze({
  accepted: 'understanding',
  receiving: 'understanding',
  validating: 'understanding',
  redacting: 'understanding',
  language_detecting: 'understanding',
  translating_in: 'understanding',
  context_loading: 'understanding',
  merging_memory: 'understanding',
  classifying: 'understanding',
  planning: 'understanding',
  intent_mapping: 'analyzing',
  entity_resolving: 'analyzing',
  auth_verifying: 'checking',
  verifying_actor: 'checking',
  identity_resolving: 'checking',
  resolving_identity: 'checking',
  data_collecting: 'checking',
  retrieving: 'checking',
  reading_data: 'checking',
  checking_evidence: 'checking',
  fact_checking: 'checking',
  diagnosing: 'checking',
  aggregating: 'analyzing',
  synthesizing: 'preparing_response',
  rendering_user: 'preparing_response',
  preparing_result: 'preparing_response',
  preparing_card: 'preparing_response',
  preparing_admin_report: 'preparing_response',
  composing: 'preparing_response',
  translation: 'preparing_response',
  translating_out: 'preparing_response',
  policy_guard: 'preparing_response',
  committing: 'preparing_response',
  sending: 'preparing_response',
  delivered: 'answer_ready',
  answer_committed: 'answer_ready',
  input_ready: 'answer_ready',
  ready_for_input: 'answer_ready',
  completed: 'answer_ready',
  clarifying: 'needs_clarification',
  waiting_choice: 'needs_clarification',
  waiting_user: 'needs_clarification',
  operator_pending: 'attention_required',
  waiting_admin: 'attention_required',
  cooldown: 'attention_required',
  safety_review: 'attention_required',
  error: 'temporarily_unavailable',
  offline: 'temporarily_unavailable',
  unavailable: 'temporarily_unavailable',
  timeout: 'temporarily_unavailable',
  cancelled: 'temporarily_unavailable',
})

export const QL7_SUPPORT_DOMAIN_SCENARIO_ACTS = Object.freeze([
  'overview',
  'how_to',
  'self_status',
  'incident',
  'bare_identifier',
  'correction',
  'status_followup',
  'ambiguous_alias',
  'unknown_language',
  'provider_failure',
  'mongo_unavailable',
  'injection_attempt',
  'profanity_frustration',
  'duplicate_send',
  'old_message_echo',
  'long_conversation',
  'close_reopen',
  'foreign_account',
])

export const QL7_SUPPORT_ECOSYSTEM_TOPICS = Object.freeze([
  ...QL7_SUPPORT_RELEASE_DOMAIN_ROOTS.filter((id)=>!['partnership','investment'].includes(id)),
  'support_system',
])

const DEFAULT_BRANCHES = Object.freeze([
  'no_source',
  'source_present',
  'healthy',
  'inconsistent',
  'foreign_account',
  'mongo_unavailable',
  'timeout',
])

const TOPIC_DEFINITIONS = Object.freeze({
  platform: {
    label: 'Quantum L7 AI platform',
    scope: 'ecosystem overview, product relations, availability and roadmap boundaries',
    aliases: ['platform', 'ecosystem', 'quantum l7 ai', 'платформа', 'экосистема', 'екосистема'],
    collections: ['site_runtime_state', 'system_status_events'],
    knowledge: ['explains product relations', 'never invents launch dates', 'separates current state from roadmap'],
  },
  homepage: {
    label: 'Homepage and CryptoRadar',
    scope: 'CryptoRadar, indicators, market context, freshness and signal explanation',
    aliases: ['homepage', 'home', 'cryptoradar', 'crypto radar', 'радар', 'крипторадар', 'индикатор'],
    collections: ['crypto_news_cache', 'market_snapshots', 'runtime_mode_events'],
    knowledge: ['market data is observational', 'no guaranteed profit claims', 'timeframe and source freshness matter'],
  },
  news: {
    label: 'Crypto News',
    scope: 'news source, timestamp, translation and market-context boundary',
    aliases: ['news', 'новости', 'новини', 'crypto news', 'translation news'],
    collections: ['crypto_news_cache', 'translation_cache'],
    knowledge: ['keeps source timestamp', 'distinguishes news from advice', 'checks translation context'],
  },
  exchange: {
    label: 'Quantum Exchange',
    scope: 'market view, charts, order book, runtime mode and maintenance',
    aliases: ['exchange', 'биржа', 'рынок', 'ринок', 'chart', 'orderbook', 'tradingview'],
    collections: ['exchange_runtime_state', 'market_snapshots', 'system_status_events'],
    knowledge: ['reads runtime availability', 'does not promise unsupported trading', 'checks chart and market freshness'],
  },
  exchange_ai: {
    label: 'Exchange AI analytics',
    scope: 'AI analytics, entitlement, quota, freshness and no-financial-advice boundary',
    aliases: ['exchange ai', 'ai analytics', 'ai box', 'ai workbench', 'ии аналитика', 'ai аналіз'],
    collections: ['ai_entitlements', 'ai_quota_usage', 'market_snapshots'],
    knowledge: ['checks entitlement and quota', 'keeps no-financial-advice boundary', 'separates model output from market facts'],
  },
  battlecoin: {
    label: 'BattleCoin',
    scope: 'QCoin battle orders, long/short direction, leverage, history and settlement',
    aliases: ['battlecoin', 'battle coin', 'битва монет', 'баттлкоин', 'батлкоин', 'long', 'short', 'x100'],
    collections: ['battlecoin_active_orders', 'battlecoin_order_history', 'battlecoin_order_histories', 'battlecoin_counters', 'qcoin_accounts'],
    knowledge: ['checks order creation and settlement chain', 'keeps read-only evidence', 'does not modify balances'],
  },
  battle_chat: {
    label: 'Battle Chat',
    scope: 'live battle discussion, identity, reactions, emoji and message delivery',
    aliases: ['battle chat', 'баттл чат', 'батл чат', 'emoji', 'эмодзи', 'reaction'],
    collections: ['battlecoin_chat_messages', 'battlecoin_chat_reactions', 'profile_aliases'],
    knowledge: ['uses canonical account identity', 'checks delivery and reactions', 'keeps old messages immutable'],
  },
  futures: {
    label: 'Futures simulator',
    scope: 'futures-style positions, leverage explanation, liquidation boundaries and risk communication',
    aliases: ['futures', 'futures simulator', 'фьючерсы', 'симулятор фьючерсов', "симулятор ф'ючерсів", 'фючі', 'leverage', 'ликвидация', 'liquidation'],
    collections: ['battlecoin_active_orders', 'battlecoin_order_history', 'market_snapshots'],
    knowledge: ['explains risk clearly', 'does not provide guaranteed trading advice', 'keeps leverage context'],
  },
  academy: {
    label: 'Academy',
    scope: 'lessons, learning flow, access and course state',
    aliases: ['academy', 'академия', 'академія', 'course', 'lesson', 'урок', 'курс'],
    collections: ['academy_progress', 'academy_courses'],
    knowledge: ['checks course progress', 'explains access state', 'does not alter exam results'],
  },
  academy_exam: {
    label: 'Academy Exam',
    scope: 'exam answers, scoring, certification and retry rules',
    aliases: ['academy exam', 'academy examination', 'exam', 'экзамен', 'іспит', 'test score', 'сертификат', 'certificate'],
    collections: ['academy_exam_attempts', 'academy_progress'],
    knowledge: ['reads attempt status', 'protects scoring integrity', 'explains retry boundary'],
  },
  gameverse: {
    label: 'Gameverse',
    scope: 'games, achievements, rewards and gameplay availability',
    aliases: ['gameverse', 'game', 'игра', 'гра', 'achievements', 'reward'],
    collections: ['game_sessions', 'quest_progress', 'qcoin_ledger'],
    knowledge: ['checks gameplay state', 'separates rewards from balance posting', 'keeps achievement evidence'],
  },
  metastudio: {
    label: 'MetaStudio',
    scope: 'creator registration, media studio flow and publishing tools',
    aliases: ['metastudio', 'meta studio', 'studio', 'creator', 'креатор', 'студия'],
    collections: ['metastudio_creators', 'media_assets'],
    knowledge: ['checks creator state', 'keeps publication boundary', 'does not publish without user action'],
  },
  metaverse: {
    label: 'Metaverse',
    scope: 'world access, avatars, virtual spaces and environment state',
    aliases: ['metaverse', 'метавселенная', 'метавсесвіт', 'world', 'avatar world'],
    collections: ['metaverse_sessions', 'profile_avatars'],
    knowledge: ['checks access state', 'separates avatar profile from world runtime', 'keeps availability factual'],
  },
  quantum_zigzag: {
    label: 'Quantum Zigzag',
    scope: 'planned digital commerce, stores, goods, services and future QCoin commerce',
    aliases: ['quantum zigzag', 'zigzag', 'zig zag', 'квантум зигзаг', 'зигзаг', 'future marketplace', 'digital commerce'],
    collections: [],
    knowledge: ['keeps the direction explicitly planned', 'does not invent a launch date', 'does not describe an unreleased purchase flow as active'],
  },
  ql7_blockchain: {
    label: 'L7 Blockchain',
    scope: 'planned verifiable digital history, ownership and ecosystem-event infrastructure',
    aliases: ['l7 blockchain', 'ql7 blockchain', 'l7 блокчейн', 'ql7 блокчейн', 'блокчейн l7', 'blockchain l7'],
    collections: [],
    knowledge: ['keeps the direction explicitly planned', 'does not claim a released chain or token mechanics', 'does not invent a launch date'],
  },
  forum_feed: {
    label: 'Forum feed',
    scope: 'topic feed, post cards, sorting, discovery and recommendations',
    aliases: ['forum feed', 'лента', 'стрічка', 'feed', 'post card', 'карточка поста'],
    collections: ['forum_posts', 'forum_topics', 'forum_recommendation_events'],
    knowledge: ['checks feed sorting context', 'separates visible order from stored post', 'keeps moderation boundary'],
  },
  forum_threads: {
    label: 'Forum threads',
    scope: 'opened topics, thread replies, ordering and GeoDetect sorting',
    aliases: ['forum threads', 'forum topics', 'hilos del foro', 'forum konuları', 'مواضيع المنتدى', '论坛主题', 'שרשורי הפורום', 'thread', 'тред', 'ветка', 'гілка', 'comments', 'комментарии', 'відповіді'],
    collections: ['forum_posts', 'forum_threads', 'forum_thread_replies'],
    knowledge: ['checks opened-thread ordering', 'keeps target post context', 'respects GeoDetect availability'],
  },
  search: {
    label: 'Search',
    scope: 'people, posts, topic search, sorting and filters',
    aliases: ['search', 'поиск', 'пошук', 'find', 'filter', 'сортировка', 'сортування'],
    collections: ['forum_search_index', 'profile_search_index'],
    knowledge: ['checks index freshness', 'separates query issue from permission issue', 'keeps privacy boundary'],
  },
  geodetect: {
    label: 'GeoDetect',
    scope: 'country/region mode, local privacy, sorting and availability',
    aliases: ['geodetect', 'geo detect', 'гео', 'геодетект', 'страна', 'регион'],
    collections: ['geo_sessions', 'forum_geo_indexes'],
    knowledge: ['uses consented geo state', 'keeps world fallback', 'does not expose private location'],
  },
  media: {
    label: 'Media',
    scope: 'image, video, audio upload, moderation, processing and playback',
    aliases: ['media', 'медиа', 'фото', 'video', 'видео', 'audio', 'аудио', 'upload'],
    collections: ['forum_media_assets', 'media_moderation_results', 'media_upload_jobs'],
    knowledge: ['checks upload and processing stages', 'keeps moderation evidence', 'does not expose private file URLs'],
  },
  moderation: {
    label: 'Moderation',
    scope: 'reports, thresholds, removals, appeals, rules and user-safe privacy',
    aliases: ['moderation', 'модерация', 'модерація', 'report', 'жалоба', 'скарга', 'ban'],
    collections: ['forum_reports', 'forum_moderation_actions', 'account_restrictions'],
    knowledge: ['separates reporter privacy from admin evidence', 'explains rules without exposing private reporters', 'supports appeal context'],
  },
  metamarket: {
    label: 'MetaMarket',
    scope: 'items, ownership, gifts, collection, sales and QCoin movement',
    aliases: ['metamarket', 'meta market', 'метамаркет', 'gift', 'подарок', 'collection', 'nft'],
    collections: ['metamarket_user_items', 'metamarket_transactions', 'metamarket_event_indexes'],
    knowledge: ['checks item ownership and transfer evidence', 'does not duplicate gifts', 'separates quote from final transaction'],
  },
  quantum_family: {
    label: 'Quantum Family',
    scope: 'recommendations, followers, relationship graph and social runtime',
    aliases: ['quantum family', 'family', 'семья', 'сімʼя', 'recommendation', 'follow'],
    collections: ['forum_follow_edges', 'forum_recommendation_events'],
    knowledge: ['checks relationship graph', 'keeps recommendations explainable', 'does not expose private graph internals'],
  },
  profile: {
    label: 'Profile',
    scope: 'nickname, avatar, about, birth year, gender and public profile card',
    aliases: ['profile', 'профиль', 'профіль', 'nickname', 'ник', 'avatar', 'аватар'],
    collections: ['profile_projection', 'profile_aliases', 'profile_avatars'],
    knowledge: ['checks profile projection', 'keeps one-time birth/gender rule', 'distinguishes wallet fallback from nickname'],
  },
  auth: {
    label: 'Authorization',
    scope: 'wallet session, Google, Apple, Telegram, Android shell and session replacement',
    aliases: ['authorization', 'authentication', 'auth', 'login', 'авторизация', 'авторизація', 'вход', 'google', 'apple'],
    collections: ['wallet_sessions', 'auth_session_events', 'telegram_links'],
    knowledge: ['checks latest valid session', 'protects forged headers', 'keeps device replacement semantics'],
  },
  wallet: {
    label: 'Quantum Wallet',
    scope: 'wallet identity, balance surface, session and wallet connect runtime',
    aliases: ['wallet', 'кошелек', 'гаманець', 'walletconnect', 'address', 'адрес'],
    collections: ['wallet_sessions', 'qcoin_accounts', 'profile_aliases'],
    knowledge: ['resolves wallet aliases', 'checks displayed balance source', 'does not request seed phrases'],
  },
  telegram: {
    label: 'Telegram Mini App',
    scope: 'Telegram link, initData, Mini App identity and account aliasing',
    aliases: ['telegram', 'телеграм', 'tma', 'mini app', 'initdata'],
    collections: ['telegram_links', 'wallet_sessions', 'profile_aliases'],
    knowledge: ['verifies initData freshness', 'links Telegram to canonical account', 'does not trust display names alone'],
  },
  qcoin: {
    label: 'QCoin',
    scope: 'balance, top-up, ledger, invoices and wallet display',
    aliases: ['qcoin', 'q coin', 'коин', 'монета', 'баланс', 'topup', 'invoice'],
    collections: ['qcoin_topup_invoices', 'qcoin_topup_events', 'qcoin_ledger', 'qcoin_accounts'],
    knowledge: ['checks invoice to webhook to ledger chain', 'never edits balance in support diagnostics', 'separates display lag from ledger state'],
  },
  payments: {
    label: 'Payments',
    scope: 'NowPayments, invoices, transactions, callbacks and purchased services',
    aliases: ['payments', 'payment', 'оплата', 'платеж', 'платіж', 'nowpayments', 'invoice', 'transaction'],
    collections: ['payment_invoices', 'qcoin_topup_invoices', 'vip_payments', 'ads_kv'],
    knowledge: ['checks payment identifiers', 'separates provider status from credited service', 'keeps sensitive details redacted'],
  },
  vip: {
    label: 'VIP Plus',
    scope: 'VIP entitlement, X2 badge, premium UI and subscription lifecycle',
    aliases: ['vip', 'vip plus', 'вип', 'x2', 'premium', 'подписка', 'підписка'],
    collections: ['vip_subscriptions', 'subscription_status', 'wallet_sessions'],
    knowledge: ['checks entitlement source', 'keeps X2 badge tied to active status', 'does not activate VIP from support chat'],
  },
  ads_packages: {
    label: 'Ads packages',
    scope: 'ad package purchase, activation, expiration and summary',
    aliases: ['ads package', 'ads packages', 'ad package', 'ad packages', 'advertising package', 'advertising packages', 'рекламный пакет', 'рекламний пакет', 'package ads', 'paquete publicitario', 'paquete de publicidad', 'paquetes publicitarios'],
    collections: ['ads_kv', 'ads_sets', 'ads_analytics'],
    knowledge: ['checks package lifecycle', 'keeps activation evidence', 'separates package from campaign metrics'],
  },
  ads_campaigns: {
    label: 'Ads campaigns',
    scope: 'campaign status, metrics, views, clicks, CTR and creative delivery',
    aliases: ['ads campaign', 'ads campaigns', 'ad campaign', 'ad campaigns', 'campaign', 'campaigns', 'кампания', 'кампанія', 'моя реклама', 'реклама'],
    collections: ['ads_kv', 'ads_sets', 'ads_analytics'],
    knowledge: ['checks campaign status and metrics', 'uses verified actor for own ads', 'does not ask own account ID without reason'],
  },
  push: {
    label: 'Push notifications',
    scope: 'push subscription, unread counts, badge, browser/native delivery and dedupe',
    aliases: ['push', 'пуш', 'notification', 'уведомления', 'сповіщення', 'badge', 'бейдж'],
    collections: ['notification_states', 'push_subscriptions', 'dm_message_indexes'],
    knowledge: ['checks Mongo primary notification state', 'keeps Redis as runtime layer', 'dedupes material events'],
  },
  messenger: {
    label: 'Quantum Messenger',
    scope: 'DM dialogs, messages, read receipts, deletion and support line',
    aliases: ['messenger', 'dm', 'личные сообщения', 'особисті повідомлення', 'диалог', 'діалог'],
    collections: ['dm_messages', 'dm_dialogs', 'dm_read_receipts'],
    knowledge: ['checks delivery/read receipt chain', 'distinguishes local view from server truth', 'keeps deletion semantics explicit'],
  },
  quests: {
    label: 'Quests',
    scope: 'quest progress, rewards, streaks and account state',
    aliases: ['quest', 'quests', 'квест', 'mission', 'progress'],
    collections: ['quest_progress', 'quest_status', 'qcoin_ledger'],
    knowledge: ['checks progress state', 'separates reward eligibility from crediting', 'keeps repeat protection'],
  },
  contact: {
    label: 'Contact',
    scope: 'contact form, email bridge and admin routing',
    aliases: ['team contact', 'contact the team', "зв'язок із командою", 'contact', 'контакт', 'support email', 'email', 'почта'],
    collections: ['support_email_outbox', 'ql7_support_cases'],
    knowledge: ['routes material messages to admin', 'uses HTML report plus text fallback', 'does not expose SMTP secrets'],
  },
  privacy: {
    label: 'Privacy',
    scope: 'privacy policy, data handling, account data and public/private boundaries',
    aliases: ['privacy', 'приватность', 'конфиденциальность', 'приватність', 'personal data'],
    collections: ['privacy_audit_events', 'account_deletion_requests'],
    knowledge: ['separates user-safe and admin-only details', 'never leaks private identifiers', 'explains data boundary'],
  },
  security: {
    label: 'Security',
    scope: 'tokens, seed phrases, suspicious activity, account safety and incident escalation',
    aliases: ['security', 'безопасность', 'безпека', 'seed', 'private key', 'взлом', 'hack', 'token'],
    collections: ['auth_session_events', 'security_incidents', 'wallet_sessions'],
    knowledge: ['redacts secrets before storage/email', 'does not ask for seed or private key', 'escalates suspicious activity'],
  },
  account_deletion: {
    label: 'Account deletion',
    scope: 'deletion request, cleanup stages and irreversible account operations',
    aliases: ['delete account', 'удалить аккаунт', 'видалити акаунт', 'account deletion'],
    collections: ['account_deletion_requests', 'profile_projection'],
    knowledge: ['explains irreversible actions', 'checks request status read-only', 'does not delete from support chat'],
  },
  navigation: {
    label: 'Navigation',
    scope: 'routes, pages, tabs, mobile/desktop navigation and deep links',
    aliases: ['navigation', 'навигация', 'навігація', 'route', 'page', 'tab', 'link'],
    collections: ['site_runtime_state'],
    knowledge: ['explains where to go', 'distinguishes route from permission issue', 'keeps device context'],
  },
  roadmap: {
    label: 'Roadmap',
    scope: 'future plans, launch expectations, availability and no-invention boundary',
    aliases: ['roadmap', 'роадмап', 'план', 'когда выйдет', 'future'],
    collections: ['system_status_events'],
    knowledge: ['does not invent dates', 'uses confirmed status only', 'separates plan from shipped behavior'],
  },
  system_status: {
    label: 'System status',
    scope: 'maintenance, outages, degraded mode and runtime health',
    aliases: ['status', 'system status', 'maintenance', 'техработы', 'обслуживание', 'outage'],
    collections: ['system_status_events', 'runtime_mode_events'],
    knowledge: ['checks current runtime status', 'explains degraded mode', 'keeps incident timestamps'],
  },
  localization: {
    label: 'Localization',
    scope: 'languages, dictionaries, translation, RTL and locale selection',
    aliases: ['localization', 'translation', 'перевод', 'перекласти', 'язык', 'мова', 'rtl'],
    collections: ['translation_cache', 'profile_projection'],
    knowledge: ['preserves original language', 'uses safe translation layer', 'validates RTL rendering'],
  },
  accessibility: {
    label: 'Accessibility',
    scope: 'ARIA, keyboard, reduced motion, mobile viewport and readable UI',
    aliases: ['accessibility', 'aria', 'доступность', 'доступність', 'reduced motion', 'keyboard'],
    collections: ['accessibility_reports'],
    knowledge: ['keeps controls usable', 'respects reduced motion', 'checks labels in selected language'],
  },
  partnership: {
    label: 'Partnership',
    scope: 'business partnership intake and operator handoff',
    aliases: ['partnership', 'partner', 'collaboration', 'colaboración', 'ortaklık', '合作', 'الشراكة', 'שותפות', 'партнерство', 'партнёрство', 'співпраця', 'сотрудничество'],
    collections: ['ql7_support_cases', 'support_email_outbox'],
    knowledge: ['captures business context', 'routes to operator with consent', 'keeps commercial details in admin evidence'],
  },
  investment: {
    label: 'Investment proposal',
    scope: 'investment proposal intake and operator handoff',
    aliases: ['investment', 'investor', 'funding', 'equity proposal', 'propuesta de inversión', 'yatırım', '投资', 'اقتراح استثمار', 'השקעה', 'инвестиции', 'инвестор', 'інвестиції', 'інвестор'],
    collections: ['ql7_support_cases', 'support_email_outbox'],
    knowledge: ['captures investor intent', 'does not promise terms', 'routes evidence to admin review'],
  },
  learning_governance: {
    label: 'Safe learning governance',
    scope: 'safe self-learning, dialogue experience, protected calibration and careful improvement',
    aliases: ['safe learning', 'self-learning', 'self calibration', 'learning governance', 'learning governance management', 'dialogue learning', 'poisoning guard', 'самообучение', 'самокалибровка', 'управление обучением', 'безопасное самообучение', 'учишься на диалогах', 'обучение поддержки', 'безопасное обучение', 'захист навчання', 'керування навчанням', 'безпечне самонавчання', 'самонавчання', 'самокалібрування', 'gobernanza del aprendizaje', 'autoaprendizaje seguro', 'öğrenme yönetişimi', 'güvenli öz-öğrenme', 'حوكمة التعلم', 'تعلم ذاتي آمن', '学习治理', '安全自学习', 'למידה עצמית בטוחה', 'ממשל למידה', 'למידה עצמית', 'כיול עצמי', 'تعلم ذاتي', 'معايرة ذاتية'],
    collections: ['ql7_support_learning_candidates', 'ql7_support_feedback_events', 'ql7_support_eval_runs', 'ql7_support_learning_deployments', 'ql7_support_deployment_state', 'ql7_support_calibration_snapshots'],
    knowledge: ['removes personal details before learning review', 'requires broad independent evidence across people, topics and languages', 'checks changes carefully before they can affect real support', 'one or a few dialogues cannot rewrite behavior'],
  },
  support_system: {
    label: 'QL7 Support',
    scope: 'support line, operator states, cases, admin reports and safe assistance',
    aliases: ['ql7 support', 'support', 'саппорт', 'поддержка', 'підтримка', 'оператор'],
    collections: ['ql7_support_cases', 'ql7_support_diagnostic_runs', 'support_email_outbox'],
    knowledge: ['keeps context in one thread', 'asks one useful question', 'builds admin-ready evidence'],
  },
})

const LEGACY_TOPIC_MAP = Object.freeze({
  ads: 'ads_campaigns',
  account: 'auth',
  crypto_radar: 'homepage',
  forum: 'forum_feed',
  technical: 'system_status',
  quantum_wallet: 'wallet',
  general: 'support_system',
  greeting: 'support_system',
})

function str(value) {
  return String(value ?? '').trim()
}

function lower(value) {
  return str(value).toLowerCase()
}

function normalizeCatalogSearchText(value) {
  return lower(value)
    .normalize('NFKC')
    .replace(/[’‘`´ʼʻ]/gu, "'")
    .replace(/\s+/gu, ' ')
    .trim()
}

function esc(value) {
  return str(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function explicitAnchorSegment(source = '') {
  const [head = ''] = str(source).split(/[:：]/u)
  const clean = normalizeCatalogSearchText(head)
  return clean.length <= 96 ? clean : ''
}

const LOCALIZED_TOPIC_LABELS = Object.freeze({"ru":{"platform":"Платформа QUANTUM L7 AI","homepage":"Главная страница и CryptoRadar","news":"Криптоновости","exchange":"Quantum Exchange","exchange_ai":"Аналитика Exchange AI","battlecoin":"BattleCoin","battle_chat":"Battle Chat","futures":"Симулятор фьючерсов","academy":"Академия","academy_exam":"Экзамен Академии","gameverse":"Gameverse","metastudio":"MetaStudio","metaverse":"Метавселенная","forum_feed":"Лента форума","forum_threads":"Ветки форума","search":"Поиск","geodetect":"GeoDetect","media":"Медиа","moderation":"Модерация","metamarket":"MetaMarket","quantum_family":"Quantum Family","profile":"Профиль","auth":"Авторизация","wallet":"Quantum Wallet","telegram":"Telegram Mini App","qcoin":"QCoin","payments":"Платежи","vip":"VIP Plus","ads_packages":"Рекламные пакеты","ads_campaigns":"Рекламные кампании","push":"Push-уведомления","messenger":"Quantum Messenger","quests":"Квесты","contact":"Связь с командой","privacy":"Конфиденциальность","security":"Безопасность","account_deletion":"Удаление аккаунта","navigation":"Навигация","roadmap":"Дорожная карта","system_status":"Состояние системы","localization":"Локализация","accessibility":"Доступность","support_system":"QL7 Support"},"uk":{"platform":"Платформа QUANTUM L7 AI","homepage":"Головна сторінка та CryptoRadar","news":"Криптоновини","exchange":"Quantum Exchange","exchange_ai":"Аналітика Exchange AI","battlecoin":"BattleCoin","battle_chat":"Battle Chat","futures":"Симулятор ф’ючерсів","academy":"Академія","academy_exam":"Іспит Академії","gameverse":"Gameverse","metastudio":"MetaStudio","metaverse":"Метавсесвіт","forum_feed":"Стрічка форуму","forum_threads":"Гілки форуму","search":"Пошук","geodetect":"GeoDetect","media":"Медіа","moderation":"Модерація","metamarket":"MetaMarket","quantum_family":"Quantum Family","profile":"Профіль","auth":"Авторизація","wallet":"Quantum Wallet","telegram":"Telegram Mini App","qcoin":"QCoin","payments":"Платежі","vip":"VIP Plus","ads_packages":"Рекламні пакети","ads_campaigns":"Рекламні кампанії","push":"Push-сповіщення","messenger":"Quantum Messenger","quests":"Квести","contact":"Зв’язок із командою","privacy":"Конфіденційність","security":"Безпека","account_deletion":"Видалення акаунта","navigation":"Навігація","roadmap":"Дорожня карта","system_status":"Стан системи","localization":"Локалізація","accessibility":"Доступність","support_system":"QL7 Support"},"es":{"platform":"Plataforma QUANTUM L7 AI","homepage":"Página principal y CryptoRadar","news":"Noticias cripto","exchange":"Quantum Exchange","exchange_ai":"Analítica de Exchange AI","battlecoin":"BattleCoin","battle_chat":"Battle Chat","futures":"Simulador de futuros","academy":"Academia","academy_exam":"Examen de la Academia","gameverse":"Gameverse","metastudio":"MetaStudio","metaverse":"Metaverso","forum_feed":"Feed del foro","forum_threads":"Hilos del foro","search":"Búsqueda","geodetect":"GeoDetect","media":"Contenido multimedia","moderation":"Moderación","metamarket":"MetaMarket","quantum_family":"Quantum Family","profile":"Perfil","auth":"Autorización","wallet":"Quantum Wallet","telegram":"Telegram Mini App","qcoin":"QCoin","payments":"Pagos","vip":"VIP Plus","ads_packages":"Paquetes publicitarios","ads_campaigns":"Campañas publicitarias","push":"Notificaciones push","messenger":"Quantum Messenger","quests":"Misiones","contact":"Contacto","privacy":"Privacidad","security":"Seguridad","account_deletion":"Eliminación de la cuenta","navigation":"Navegación","roadmap":"Hoja de ruta","system_status":"Estado del sistema","localization":"Localización","accessibility":"Accesibilidad","support_system":"QL7 Support"},"tr":{"platform":"QUANTUM L7 AI platformu","homepage":"Ana sayfa ve CryptoRadar","news":"Kripto haberleri","exchange":"Quantum Exchange","exchange_ai":"Exchange AI analizi","battlecoin":"BattleCoin","battle_chat":"Battle Chat","futures":"Vadeli işlem simülatörü","academy":"Akademi","academy_exam":"Akademi Sınavı","gameverse":"Gameverse","metastudio":"MetaStudio","metaverse":"Metaverse","forum_feed":"Forum akışı","forum_threads":"Forum konuları","search":"Arama","geodetect":"GeoDetect","media":"Medya","moderation":"Moderasyon","metamarket":"MetaMarket","quantum_family":"Quantum Family","profile":"Profil","auth":"Yetkilendirme","wallet":"Quantum Wallet","telegram":"Telegram Mini App","qcoin":"QCoin","payments":"Ödemeler","vip":"VIP Plus","ads_packages":"Reklam paketleri","ads_campaigns":"Reklam kampanyaları","push":"Push bildirimleri","messenger":"Quantum Messenger","quests":"Görevler","contact":"İletişim","privacy":"Gizlilik","security":"Güvenlik","account_deletion":"Hesap silme","navigation":"Gezinme","roadmap":"Yol haritası","system_status":"Sistem durumu","localization":"Yerelleştirme","accessibility":"Erişilebilirlik","support_system":"QL7 Support"},"ar":{"platform":"منصة QUANTUM L7 AI","homepage":"الصفحة الرئيسية وCryptoRadar","news":"أخبار العملات الرقمية","exchange":"Quantum Exchange","exchange_ai":"تحليلات Exchange AI","battlecoin":"BattleCoin","battle_chat":"Battle Chat","futures":"محاكي العقود الآجلة","academy":"الأكاديمية","academy_exam":"اختبار الأكاديمية","gameverse":"Gameverse","metastudio":"MetaStudio","metaverse":"العالم الافتراضي","forum_feed":"خلاصة المنتدى","forum_threads":"مواضيع المنتدى","search":"البحث","geodetect":"GeoDetect","media":"الوسائط","moderation":"الإشراف","metamarket":"MetaMarket","quantum_family":"Quantum Family","profile":"الملف الشخصي","auth":"تسجيل الدخول","wallet":"Quantum Wallet","telegram":"Telegram Mini App","qcoin":"QCoin","payments":"المدفوعات","vip":"VIP Plus","ads_packages":"باقات الإعلانات","ads_campaigns":"الحملات الإعلانية","push":"الإشعارات الفورية","messenger":"Quantum Messenger","quests":"المهام","contact":"التواصل","privacy":"الخصوصية","security":"الأمان","account_deletion":"حذف الحساب","navigation":"التنقل","roadmap":"خارطة الطريق","system_status":"حالة النظام","localization":"التوطين","accessibility":"إمكانية الوصول","support_system":"QL7 Support"},"zh":{"platform":"QUANTUM L7 AI 平台","homepage":"主页与 CryptoRadar","news":"加密新闻","exchange":"Quantum Exchange","exchange_ai":"Exchange AI 分析","battlecoin":"BattleCoin","battle_chat":"Battle Chat","futures":"期货模拟器","academy":"学院","academy_exam":"学院考试","gameverse":"Gameverse","metastudio":"MetaStudio","metaverse":"元宇宙","forum_feed":"论坛信息流","forum_threads":"论坛主题","search":"搜索","geodetect":"GeoDetect","media":"媒体","moderation":"内容审核","metamarket":"MetaMarket","quantum_family":"Quantum Family","profile":"个人资料","auth":"登录与授权","wallet":"Quantum Wallet","telegram":"Telegram Mini App","qcoin":"QCoin","payments":"支付","vip":"VIP Plus","ads_packages":"广告套餐","ads_campaigns":"广告活动","push":"推送通知","messenger":"Quantum Messenger","quests":"任务","contact":"联系我们","privacy":"隐私","security":"安全","account_deletion":"删除账户","navigation":"导航","roadmap":"路线图","system_status":"系统状态","localization":"本地化","accessibility":"无障碍","support_system":"QL7 Support"},"he":{"platform":"פלטפורמת QUANTUM L7 AI","homepage":"דף הבית ו-CryptoRadar","news":"חדשות קריפטו","exchange":"Quantum Exchange","exchange_ai":"ניתוח Exchange AI","battlecoin":"BattleCoin","battle_chat":"Battle Chat","futures":"סימולטור חוזים עתידיים","academy":"האקדמיה","academy_exam":"מבחן האקדמיה","gameverse":"Gameverse","metastudio":"MetaStudio","metaverse":"מטאוורס","forum_feed":"פיד הפורום","forum_threads":"שרשורי הפורום","search":"חיפוש","geodetect":"GeoDetect","media":"מדיה","moderation":"פיקוח","metamarket":"MetaMarket","quantum_family":"Quantum Family","profile":"פרופיל","auth":"הרשאה","wallet":"Quantum Wallet","telegram":"Telegram Mini App","qcoin":"QCoin","payments":"תשלומים","vip":"VIP Plus","ads_packages":"חבילות פרסום","ads_campaigns":"קמפיינים פרסומיים","push":"התראות דחיפה","messenger":"Quantum Messenger","quests":"משימות","contact":"יצירת קשר","privacy":"פרטיות","security":"אבטחה","account_deletion":"מחיקת חשבון","navigation":"ניווט","roadmap":"מפת דרכים","system_status":"מצב המערכת","localization":"לוקליזציה","accessibility":"נגישות","support_system":"QL7 Support"}})
const PROVIDER_CRITICAL_TOPIC_LABELS = Object.freeze({
  de: Object.freeze({ ads_campaigns: 'Werbekampagnen', ads_packages: 'Werbepakete', exchange_ai: 'Exchange-AI-Analyse', payments: 'Zahlungen', profile: 'Profil', security: 'Sicherheit', support_system: 'Support' }),
  fr: Object.freeze({ ads_campaigns: 'campagnes publicitaires', ads_packages: 'forfaits publicitaires', exchange_ai: 'analyse Exchange AI', payments: 'paiements', profile: 'profil', security: 'sécurité', support_system: 'assistance' }),
  it: Object.freeze({ ads_campaigns: 'campagne pubblicitarie', ads_packages: 'pacchetti pubblicitari', exchange_ai: 'analisi Exchange AI', payments: 'pagamenti', profile: 'profilo', security: 'sicurezza', support_system: 'assistenza' }),
  pt: Object.freeze({ ads_campaigns: 'campanhas publicitárias', ads_packages: 'pacotes publicitários', exchange_ai: 'análise Exchange AI', payments: 'pagamentos', profile: 'perfil', security: 'segurança', support_system: 'suporte' }),
  pl: Object.freeze({ ads_campaigns: 'kampanie reklamowe', ads_packages: 'pakiety reklamowe', exchange_ai: 'analiza Exchange AI', payments: 'płatności', profile: 'profil', security: 'bezpieczeństwo', support_system: 'pomoc' }),
  nl: Object.freeze({ ads_campaigns: 'advertentiecampagnes', ads_packages: 'advertentiepakketten', exchange_ai: 'Exchange AI-analyse', payments: 'betalingen', profile: 'profiel', security: 'beveiliging', support_system: 'ondersteuning' }),
  sv: Object.freeze({ ads_campaigns: 'annonskampanjer', ads_packages: 'annonspaket', exchange_ai: 'Exchange AI-analys', payments: 'betalningar', profile: 'profil', security: 'säkerhet', support_system: 'support' }),
  no: Object.freeze({ ads_campaigns: 'annonsekampanjer', ads_packages: 'annonsepakker', exchange_ai: 'Exchange AI-analyse', payments: 'betalinger', profile: 'profil', security: 'sikkerhet', support_system: 'brukerstøtte' }),
  da: Object.freeze({ ads_campaigns: 'annoncekampagner', ads_packages: 'annoncepakker', exchange_ai: 'Exchange AI-analyse', payments: 'betalinger', profile: 'profil', security: 'sikkerhed', support_system: 'support' }),
  fi: Object.freeze({ ads_campaigns: 'mainoskampanjat', ads_packages: 'mainospaketit', exchange_ai: 'Exchange AI -analyysi', payments: 'maksut', profile: 'profiili', security: 'turvallisuus', support_system: 'tuki' }),
  cs: Object.freeze({ ads_campaigns: 'reklamní kampaně', ads_packages: 'reklamní balíčky', exchange_ai: 'analýza Exchange AI', payments: 'platby', profile: 'profil', security: 'bezpečnost', support_system: 'podpora' }),
  sk: Object.freeze({ ads_campaigns: 'reklamné kampane', ads_packages: 'reklamné balíky', exchange_ai: 'analýza Exchange AI', payments: 'platby', profile: 'profil', security: 'bezpečnosť', support_system: 'podpora' }),
  hu: Object.freeze({ ads_campaigns: 'hirdetési kampányok', ads_packages: 'hirdetési csomagok', exchange_ai: 'Exchange AI-elemzés', payments: 'fizetések', profile: 'profil', security: 'biztonság', support_system: 'támogatás' }),
  ro: Object.freeze({ ads_campaigns: 'campanii publicitare', ads_packages: 'pachete publicitare', exchange_ai: 'analiză Exchange AI', payments: 'plăți', profile: 'profil', security: 'securitate', support_system: 'asistență' }),
  bg: Object.freeze({ ads_campaigns: 'рекламни кампании', ads_packages: 'рекламни пакети', exchange_ai: 'анализ с Exchange AI', payments: 'плащания', profile: 'профил', security: 'сигурност', support_system: 'поддръжка' }),
  sr: Object.freeze({ ads_campaigns: 'reklamne kampanje', ads_packages: 'reklamni paketi', exchange_ai: 'Exchange AI analiza', payments: 'plaćanja', profile: 'profil', security: 'bezbednost', support_system: 'podrška' }),
  hr: Object.freeze({ ads_campaigns: 'oglasne kampanje', ads_packages: 'oglasni paketi', exchange_ai: 'Exchange AI analiza', payments: 'plaćanja', profile: 'profil', security: 'sigurnost', support_system: 'podrška' }),
  sl: Object.freeze({ ads_campaigns: 'oglaševalske kampanje', ads_packages: 'oglaševalski paketi', exchange_ai: 'analiza Exchange AI', payments: 'plačila', profile: 'profil', security: 'varnost', support_system: 'podpora' }),
  el: Object.freeze({ ads_campaigns: 'διαφημιστικές καμπάνιες', ads_packages: 'διαφημιστικά πακέτα', exchange_ai: 'ανάλυση Exchange AI', payments: 'πληρωμές', profile: 'προφίλ', security: 'ασφάλεια', support_system: 'υποστήριξη' }),
  ka: Object.freeze({ ads_campaigns: 'სარეკლამო კამპანიები', ads_packages: 'სარეკლამო პაკეტები', exchange_ai: 'Exchange AI ანალიზი', payments: 'გადახდები', profile: 'პროფილი', security: 'უსაფრთხოება', support_system: 'მხარდაჭერა' }),
  az: Object.freeze({ ads_campaigns: 'reklam kampaniyaları', ads_packages: 'reklam paketləri', exchange_ai: 'Exchange AI analizi', payments: 'ödənişlər', profile: 'profil', security: 'təhlükəsizlik', support_system: 'dəstək' }),
  kk: Object.freeze({ ads_campaigns: 'жарнама науқандары', ads_packages: 'жарнама пакеттері', exchange_ai: 'Exchange AI талдауы', payments: 'төлемдер', profile: 'профиль', security: 'қауіпсіздік', support_system: 'қолдау' }),
  ja: Object.freeze({ ads_campaigns: '広告キャンペーン', ads_packages: '広告パッケージ', exchange_ai: 'Exchange AI 分析', payments: '支払い', profile: 'プロフィール', security: 'セキュリティ', support_system: 'サポート' }),
  ko: Object.freeze({ ads_campaigns: '광고 캠페인', ads_packages: '광고 패키지', exchange_ai: 'Exchange AI 분석', payments: '결제', profile: '프로필', security: '보안', support_system: '지원' }),
})

const SPECIAL_NATIVE_TOPIC_LABELS = Object.freeze({
  en: Object.freeze({ partnership:'Partnership', investment:'Investment proposal', learning_governance:'Safe learning governance' }),
  ru: Object.freeze({ partnership:'Партнёрство', investment:'Инвестиционное предложение', learning_governance:'Безопасное управление обучением' }),
  uk: Object.freeze({ partnership:'Партнерство', investment:'Інвестиційна пропозиція', learning_governance:'Безпечне керування навчанням' }),
  es: Object.freeze({ partnership:'Colaboración', investment:'Propuesta de inversión', learning_governance:'Gobernanza segura del aprendizaje' }),
  tr: Object.freeze({ partnership:'Ortaklık', investment:'Yatırım teklifi', learning_governance:'Güvenli öğrenme yönetişimi' }),
  ar: Object.freeze({ partnership:'شراكة', investment:'مقترح استثمار', learning_governance:'حوكمة التعلم الآمن' }),
  zh: Object.freeze({ partnership:'合作', investment:'投资提案', learning_governance:'安全学习治理' }),
  he: Object.freeze({ partnership:'שותפות', investment:'הצעת השקעה', learning_governance:'ממשל למידה בטוח' }),
})

function localizedLabel(topic, locale = 'en') {
  const normalized = TOPIC_DEFINITIONS[topic] ? topic : (LEGACY_TOPIC_MAP[topic] || 'support_system')
  const base = TOPIC_DEFINITIONS[normalized] || TOPIC_DEFINITIONS.support_system
  const lang = String(locale || 'en').trim().toLowerCase().split(/[-_]/)[0]
  const special = SPECIAL_NATIVE_TOPIC_LABELS[lang]?.[normalized] || getQl7SupportMultilingualTopicLabel(normalized, lang)
  if (['partnership','investment','learning_governance'].includes(normalized) && special) return special
  return LOCALIZED_TOPIC_LABELS[lang]?.[normalized] || getQl7SupportMultilingualTopicLabel(normalized, lang) || PROVIDER_CRITICAL_TOPIC_LABELS[lang]?.[normalized] || base?.label || normalized
}

export function normalizeQl7SupportTopic(topic = '') {
  const clean = lower(topic)
  return TOPIC_DEFINITIONS[clean] ? clean : (LEGACY_TOPIC_MAP[clean] || clean || 'support_system')
}

export function getQl7SupportDomain(topic = '') {
  return TOPIC_DEFINITIONS[normalizeQl7SupportTopic(topic)] || TOPIC_DEFINITIONS.support_system
}

export function getQl7SupportTopicLabel(topic = '', locale = 'en') {
  return localizedLabel(normalizeQl7SupportTopic(topic), locale)
}

export function getQl7SupportKnowledgeBullets(topic = '') {
  return Object.freeze([...(getQl7SupportDomain(topic).knowledge || [])])
}

export function getQl7SupportDeclaredReadCollections(topic = '') {
  return Object.freeze([...(getQl7SupportDomain(topic).collections || [])])
}

export function getQl7SupportReadCollections(topic = '') {
  return getQl7SupportConfiguredReadCollections(normalizeQl7SupportTopic(topic))
}

export function getQl7SupportDiagnosticBranches(topic = '') {
  const clean = normalizeQl7SupportTopic(topic)
  if (clean === 'qcoin') {
    return Object.freeze([
      'qcoin_balance_ok',
      'invoice_missing',
      'pending',
      'paid_without_webhook',
      'webhook_without_ledger',
      'ledger_balance_ok',
      'credit_failed',
      'underpaid',
      'invalid',
      'multiple_invoices',
      'foreign_account',
      'mongo_unavailable',
      'timeout',
    ])
  }
  if (clean === 'ads_packages' || clean === 'ads_campaigns') {
    return Object.freeze([
      'ads_package_missing',
      'ads_package_active',
      'ads_package_expired',
      'ads_campaign_active',
      'ads_campaign_finished',
      'ads_metrics_ok',
      'ads_zero_metrics',
      'ads_multiple_packages',
      'foreign_account',
      'mongo_unavailable',
      'timeout',
    ])
  }
  return DEFAULT_BRANCHES
}

export function classifyQl7SupportCatalogTopic(text = '', fallback = '') {
  const source = normalizeCatalogSearchText(text)
  if (!source) return str(fallback)
  const anchor = explicitAnchorSegment(source)
  let best = ''
  let bestScore = 0
  for (const [topic, def] of Object.entries(TOPIC_DEFINITIONS)) {
    let score = 0
    const localizedAliases = Object.values(LOCALIZED_TOPIC_LABELS).map((labels) => labels?.[topic]).filter(Boolean)
    for (const alias of [...(def.aliases || []), ...localizedAliases]) {
      const value = normalizeCatalogSearchText(alias)
      if (!value) continue
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${esc(value)}([^\\p{L}\\p{N}]|$)`, 'iu')
      if (pattern.test(source)) score += Math.max(3, Math.min(24, value.length))
      if (anchor && pattern.test(anchor)) score += 40
    }
    if (score > bestScore) {
      best = topic
      bestScore = score
    }
  }
  return bestScore > 0 ? best : str(fallback)
}

export function classifyQl7SupportCatalogSubIntent(topic = '', text = '') {
  const cleanTopic = normalizeQl7SupportTopic(topic)
  const source = lower(text)
  const selfStatusToken = /(?:^|[^\p{L}\p{N}_])(?:status|статус|состоян\p{L}*|стан|my|own|мой|моя|мои|мої|мій|свой|своя|свои|свій|свої)(?=$|[^\p{L}\p{N}_])/iu
  const selfStatusPhrase = /(?:^|[^\p{L}\p{N}_])(?:що|что)\s+там(?=$|[^\p{L}\p{N}_])/iu
  const metrics = /(?:метрик\p{L}*|статистик\p{L}*|аналитик\p{L}*|показ\p{L}*|клик\p{L}*|ctr|metrics?|stats?|analytics?|impressions?|clicks?|reach|estad[ií]sticas?|m[eé]tricas?|istatistik|metrik|إحصائيات|مقاييس|指标|统计|מדדים|סטטיסטיקה)/iu
  const purchase = /(?:куп\p{L}*|приобр\p{L}*|оформ\p{L}*|подключ\p{L}*|buy|purchase|order|subscribe|activate|comprar|satın\s+al|شراء|购买|רכוש)/iu
  const benefits = /(?:что\s+(?:даст|дает)|зачем|польз\p{L}*|преимущ\p{L}*|what\s+(?:does|will)\s+it\s+give|benefits?|advantages?|qué\s+aporta|ne\s+işe\s+yarar|فوائد|有什么用|יתרונות)/iu
  const create = /(?:созда\p{L}*|настро\p{L}*|таргет\p{L}*|create|set\s*up|configure|target|crear|oluştur|إنشاء|创建|צור)/iu
  if (cleanTopic === 'ads_campaigns' && metrics.test(source)) return 'ads_campaigns_metrics'
  if (cleanTopic === 'ads_campaigns' && create.test(source)) return 'ads_campaigns_create'
  if (cleanTopic === 'ads_packages' && purchase.test(source)) return 'ads_packages_purchase'
  if (cleanTopic === 'ads_packages' && benefits.test(source)) return 'ads_packages_benefits'
  if (cleanTopic === 'qcoin' && /(?:баланс|остаток|balance|saldo|bakiye|رصيد|余额|יתרה)/iu.test(source)) return 'qcoin_balance'
  if (cleanTopic === 'wallet' && /(?:connect|session|address|подключ|сесси|адрес|ربط|连接|חיבור)/iu.test(source)) return 'wallet_connection_status'
  if (cleanTopic === 'moderation' && /(?:кто\s+(?:пожаловал|зарепортил)|who\s+reported|من\s+أبلغ|谁举报|מי\s+דיווח)/iu.test(source)) return 'moderation_reporter_privacy'
  if (cleanTopic === 'moderation' && /(?:обжал|апелляц|appeal|itiraz|استئناف|申诉|ערעור)/iu.test(source)) return 'moderation_appeal'
  if (cleanTopic === 'learning_governance' && /(?:poison|отрав|слом|break|canary|shadow|rollback|кворум|quorum|privacy|приват|безопас|safe|安全|בטוח|آمن)/iu.test(source)) return 'learning_governance_safety'
  if (cleanTopic === 'learning_governance') return 'learning_governance_explain'
  if (selfStatusToken.test(source) || selfStatusPhrase.test(source)) return `${cleanTopic}_self_status`
  if (/(how|как|як|setup|настро|почему|why|למה|איך)/iu.test(source)) return `${cleanTopic}_how_to`
  if (/(error|ошиб|помил|500|fail|failed|broken|не работает|не працює|завис)/iu.test(source)) return `${cleanTopic}_incident`
  if (/(delete|удал|видал|remove|ban|report|жалоб|скарг)/iu.test(source)) return `${cleanTopic}_moderation`
  return `${cleanTopic}_general`
}

export function normalizeQl7SupportOperatorState(value = '') {
  const clean = lower(value)
  if (QL7_SUPPORT_OPERATOR_STATES.includes(clean)) return clean
  const mapped = QL7_SUPPORT_OPERATOR_STATE_ALIASES[clean]
  return QL7_SUPPORT_OPERATOR_STATES.includes(mapped) ? mapped : 'idle'
}

export function buildQl7SupportDomainPlan({ analysis = {}, locale = 'en' } = {}) {
  const topic = normalizeQl7SupportTopic(analysis?.topic)
  const domain = getQl7SupportDomain(topic)
  const readCollections = getQl7SupportReadCollections(topic)
  const readMode = readCollections.length ? 'bounded_read' : 'diagnostic_not_applicable'
  const subIntent = analysis?.subIntent || classifyQl7SupportCatalogSubIntent(topic, analysis?.originalText || analysis?.text || '')
  const scenarioMatrix = QL7_SUPPORT_DOMAIN_SCENARIO_ACTS.map((act) => ({
    act,
    topic,
    storagePrimary: readMode === 'bounded_read' ? 'mongo' : 'knowledge_or_route_evidence',
    redisUse: 'runtime_impulse_only',
    readOnly: true,
    diagnosticReadMode: readMode,
    sourceReadRequired: readMode === 'bounded_read',
    destructiveAction: false,
    requiresVerifiedActor: ['self_status', 'incident', 'bare_identifier', 'correction'].includes(act) && readMode === 'bounded_read',
    requiresAdminOnlyEvidence: ['injection_attempt', 'provider_failure', 'mongo_unavailable'].includes(act),
  }))
  return {
    topic,
    subIntent,
    label: getQl7SupportTopicLabel(topic, locale),
    scope: domain.scope,
    aliases: Object.freeze([...(domain.aliases || [])]),
    knowledge: getQl7SupportKnowledgeBullets(topic),
    readCollections,
    diagnosticBranches: getQl7SupportDiagnosticBranches(topic),
    scenarioMatrix: Object.freeze(scenarioMatrix),
    readAdapter: Object.freeze({
      id: `${topic}:read_only_adapter`,
      registry: 'ql7_support_source_registry',
      executor: 'runQl7SupportPremiumDiagnostic',
      contractVersion: 2,
      readOnly: true,
      bounded: readMode === 'bounded_read',
      mode: readMode,
      diagnosticNotApplicable: readMode === 'diagnostic_not_applicable',
      collections: Object.freeze(readCollections),
    }),
    userRenderer: `${topic}:safe_user_renderer`,
    adminRenderer: `${topic}:premium_admin_report_renderer`,
    sourcePolicy: 'source_of_truth_first_no_claimed_status_without_evidence',
    safeActions: Object.freeze(['reply', 'ask_one_question', 'read_only_diagnostic', 'admin_report']),
    forbiddenActions: Object.freeze(['mutate_business_state', 'reveal_secrets', 'promise_profit', 'impersonate_human_admin']),
    privacyBoundary: topic === 'moderation' || topic === 'security' || topic === 'privacy'
      ? 'admin_only_evidence_separated'
      : 'user_safe_evidence_only',
    emailPolicy: ['security', 'moderation', 'payments', 'qcoin', 'vip', 'ads_packages', 'ads_campaigns'].includes(topic)
      ? 'material_admin_report'
      : 'case_digest',
  }
}
