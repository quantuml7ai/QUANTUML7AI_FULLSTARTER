import {QL7_SUPPORT_ECOSYSTEM_TOPICS, getQl7SupportDeclaredReadCollections, normalizeQl7SupportTopic} from './ecosystemCatalog.js'
import {QL7_SUPPORT_DOMAIN_TOPICS} from './knowledge/domainRegistry.js'
import {
  isQl7SupportRealReadCollection,
  getQl7SupportConfiguredReadCollections,
  listQl7SupportRealReadCollections,
} from './readOnlySourceManifest.js'


const ROUTE_EVIDENCE = Object.freeze({
  platform: ['app/page.js', 'app/about/page.js', 'app/privacy/page.js'],
  homepage: ['app/page.js', 'app/components/CryptoNewsLens.jsx'],
  news: ['app/components/CryptoNewsLens.jsx', 'app/api/crypto-news/route.js', 'app/api/deep-translate/route.js'],
  exchange: ['app/exchange/page.jsx', 'app/api/market/summary/route.js'],
  exchange_ai: ['app/exchange/AIWorkbench.jsx', 'app/api/aiquota/usage/route.js'],
  battlecoin: ['app/api/battlecoin/order/route.js', 'app/api/battlecoin/state/route.js'],
  battle_chat: ['app/exchange/battle-chat', 'app/api/battlecoin/chat/messages/route.js'],
  futures: ['app/exchange', 'app/api/battlecoin/order/route.js'],
  academy: ['app/academy/page.js'],
  academy_exam: ['app/api/academy/exam/route.js'],
  gameverse: ['app/game/page.js', 'app/api/quest/progress/route.js'],
  metastudio: ['app/api/metastudio/register/route.js'],
  metaverse: ['app/about/page.js', 'app/game/page.js'],
  quantum_zigzag: ['components/i18n.source.js', 'docs/mobile-payment-compliance.md', 'docs/mobile-shell.md'],
  ql7_blockchain: ['components/i18n.source.js', 'docs/mobile-shell.md'],
  forum_feed: ['app/api/forum/feed/page/route.js'],
  forum_threads: ['app/api/forum/thread/page/route.js', 'app/api/forum/post-chain/route.js'],
  search: ['app/api/forum/search/page/route.js'],
  geodetect: ['app/api/geo/session-touch/route.js', 'app/api/forum/feed/page/route.js'],
  media: ['app/api/forum/media-feed/page/route.js', 'app/api/forum/uploadVideo/route.js'],
  moderation: ['app/api/forum/report/route.js', 'app/api/forum/moderate/route.js'],
  metamarket: ['app/api/metamarket'],
  quantum_family: ['app/api/forum/subs', 'app/api/forum/recommendations/users/route.js'],
  profile: ['app/api/profile', 'app/forum/features/profile'],
  auth: ['app/api/wallet-session/route.js', 'lib/walletSessionClient.js'],
  wallet: ['app/api/wallet-session/route.js', 'app/api/qcoin/get/route.js'],
  telegram: ['app/api/telegram/link', 'app/api/tma/auto/route.js'],
  qcoin: ['app/api/qcoin', 'lib/mongo/qcoin-primary.cjs'],
  payments: ['app/api/pay', 'app/api/payments'],
  vip: ['app/api/subscription/status/route.js', 'app/api/forum/vip/batch/route.js'],
  ads_packages: ['app/api/ads/route.js', 'lib/adsCore.js'],
  ads_campaigns: ['app/api/ads/route.js', 'lib/adsCore.js'],
  push: ['app/api/push', 'lib/webPush.js'],
  messenger: ['app/api/dm', 'lib/mongo/dm-primary.cjs'],
  quests: ['app/api/quest'],
  contact: ['app/api/contact/route.js', 'app/contact/page.js#disabled_redirect_guard'],
  privacy: ['app/privacy/page.js', 'app/api/profile/delete-account/route.js'],
  security: ['app/api/wallet-session/route.js', 'lib/ql7-support/identityResolver.js'],
  account_deletion: ['app/api/profile/delete-account/route.js', 'lib/mongo/account-deletion-primary.cjs'],
  navigation: ['app', 'components'],
  roadmap: ['app/about/page.js', 'docs'],
  system_status: ['app/api/app-shell/config/route.js', 'tools/runtime-passports'],
  localization: ['components/i18n-dicts', 'app/api/deep-translate/route.js'],
  accessibility: ['app/forum/features/dm/components/Ql7SupportOperator.jsx', 'app/forum/styles/modules/dmStyles.js'],
  partnership: ['lib/ql7-support/operator/buildCase.js', 'lib/ql7-support/contact/contactIntelligence.js'],
  investment: ['lib/ql7-support/operator/buildCase.js', 'lib/ql7-support/contact/contactIntelligence.js'],
  learning_governance: ['lib/ql7-support/learningPipeline.js', 'lib/ql7-support/learningControlPlane.js', 'lib/ql7-support/canonical/safeLearningCalibration.js'],
  support_system: ['app/api/dm/send/route.js', 'app/api/dm/support-state/route.js', 'lib/ql7-support'],
})


const FAMILY = Object.freeze({
  platform: 'knowledge', homepage: 'market', news: 'content', exchange: 'market', exchange_ai: 'entitlement',
  battlecoin: 'orders', battle_chat: 'messages', futures: 'orders', academy: 'education', academy_exam: 'education',
  gameverse: 'progress', metastudio: 'registration', metaverse: 'knowledge', quantum_zigzag: 'knowledge', ql7_blockchain: 'knowledge', forum_feed: 'forum', forum_threads: 'forum',
  search: 'search', geodetect: 'geo', media: 'media', moderation: 'moderation', metamarket: 'ownership', quantum_family: 'social',
  profile: 'profile', auth: 'identity', wallet: 'identity', telegram: 'identity', qcoin: 'ledger', payments: 'payments', vip: 'entitlement',
  ads_packages: 'ads', ads_campaigns: 'ads', push: 'notifications', messenger: 'messages', quests: 'progress', contact: 'outbox',
  privacy: 'privacy', security: 'security', account_deletion: 'deletion', navigation: 'knowledge', roadmap: 'knowledge',
  system_status: 'runtime', localization: 'translation', accessibility: 'accessibility', learning_governance: 'learning', support_system: 'support',
})

const STATUS_FIELDS = Object.freeze({
  orders: ['status', 'state', 'side', 'filledAt', 'cancelledAt'],
  messages: ['status', 'deliveryStatus', 'seenAt', 'deletedAt'],
  education: ['status', 'score', 'completedAt', 'attempt'],
  registration: ['status', 'approvedAt', 'rejectedAt'],
  forum: ['deleted', 'moderationStatus', 'createdAt', 'updatedAt'],
  search: ['updatedAt', 'score'], geo: ['city', 'region', 'country', 'source', 'updatedAt'],
  media: ['status', 'processingStatus', 'moderationStatus', 'mediaType'],
  moderation: ['status', 'reason', 'threshold', 'action', 'updatedAt'], ownership: ['status', 'ownerId', 'count', 'updatedAt'],
  social: ['followers', 'following', 'updatedAt'], profile: ['nickname', 'vip', 'updatedAt'], identity: ['status', 'expiresAt', 'revokedAt'],
  ledger: ['status', 'amount', 'balanceAfter', 'creditedAt'], payments: ['status', 'paymentStatus', 'creditedAt'],
  entitlement: ['status', 'active', 'expiresAt'], ads: ['status', 'active', 'expiresAt', 'views', 'clicks'],
  notifications: ['unread', 'deliveredAt', 'seenAt'], progress: ['status', 'progress', 'completedAt'], outbox: ['status', 'attempts', 'sentAt'],
  privacy: ['status', 'createdAt'], security: ['status', 'revokedAt', 'updatedAt'], deletion: ['status', 'completedAt'],
  support: ['caseStatus', 'diagnosticStatus', 'updatedAt'], market: ['status', 'updatedAt'], content: ['publishedAt', 'updatedAt'],
  runtime: ['status', 'updatedAt'], translation: ['provider', 'status', 'updatedAt'], accessibility: ['status', 'updatedAt'], knowledge: ['status'],
  learning: ['status', 'evaluationStatus', 'deploymentStatus', 'updatedAt'],
})

const OWNERSHIP_FIELDS = Object.freeze([
  'userId', 'accountId', 'canonicalAccountId', 'uid', 'ownerId', 'ownerUserId',
  'rawAccountId', 'walletAddress', 'wallet', 'telegramId',
])

const EVIDENCE_FIELDS = Object.freeze({
  knowledge: ['version', 'availability', 'roadmapStatus', 'updatedAt'],
  market: ['symbol', 'price', 'change', 'updatedAt'],
  content: ['title', 'source', 'publishedAt', 'updatedAt'],
  entitlement: ['active', 'packageId', 'expiresAt', 'status'],
  orders: ['orderId', 'side', 'amount', 'filledAmount', 'price', 'status', 'createdAt', 'filledAt', 'cancelledAt'],
  messages: ['messageId', 'threadId', 'deliveryStatus', 'seenAt', 'deletedAt', 'createdAt'],
  education: ['examId', 'courseId', 'attempt', 'score', 'status', 'completedAt'],
  progress: ['questId', 'progress', 'eligibility', 'status', 'completedAt'],
  registration: ['registrationId', 'status', 'approvedAt', 'rejectedAt'],
  forum: ['postId', 'threadId', 'topicId', 'deleted', 'moderationStatus', 'createdAt', 'updatedAt'],
  search: ['entityId', 'entityType', 'score', 'updatedAt'],
  geo: ['known', 'precision', 'country', 'region', 'city', 'source', 'confidence', 'updatedAt'],
  media: ['mediaId', 'postId', 'mediaType', 'processingStatus', 'moderationStatus', 'status', 'createdAt'],
  moderation: ['postId', 'reason', 'threshold', 'count', 'remaining', 'action', 'status', 'updatedAt'],
  ownership: ['itemId', 'tokenId', 'ownerId', 'count', 'status', 'updatedAt'],
  social: ['followers', 'following', 'subscribed', 'updatedAt'],
  profile: ['nickname', 'vip', 'locale', 'createdAt', 'lastActivityAt', 'updatedAt'],
  identity: ['authMode', 'status', 'expiresAt', 'revokedAt', 'updatedAt'],
  ledger: ['invoiceId', 'transactionHash', 'amount', 'currency', 'balanceAfter', 'status', 'creditedAt'],
  payments: ['paymentId', 'invoiceId', 'amount', 'currency', 'paymentStatus', 'status', 'creditedAt'],
  ads: ['campaignId', 'packageId', 'active', 'status', 'expiresAt', 'views', 'clicks', 'updatedAt'],
  notifications: ['messageId', 'unread', 'deliveredAt', 'seenAt', 'updatedAt'],
  outbox: ['caseId', 'materialEventKey', 'status', 'attempts', 'nextAttemptAt', 'sentAt', 'updatedAt'],
  privacy: ['requestId', 'status', 'createdAt', 'updatedAt'],
  security: ['incidentId', 'authMode', 'status', 'revokedAt', 'updatedAt'],
  deletion: ['deletionRequestId', 'status', 'confirmedAt', 'completedAt', 'updatedAt'],
  runtime: ['service', 'status', 'detailCode', 'updatedAt'],
  translation: ['sourceLanguage', 'targetLanguage', 'provider', 'status', 'latencyMs', 'updatedAt'],
  accessibility: ['viewportWidth', 'reducedMotion', 'direction', 'status', 'updatedAt'],
  learning: ['candidateId', 'topic', 'sourceLocale', 'poisoningRisk', 'privacyReview', 'qualityReview', 'evaluationStatus', 'deploymentStatus', 'canaryPercent', 'updatedAt'],
  support: ['caseId', 'topic', 'subIntent', 'caseStatus', 'diagnosticStatus', 'revision', 'updatedAt'],
})

const FILTER_KEYS = Object.freeze(['_id', 'id', 'userId', 'accountId', 'uid', 'ownerId', 'ownerUserId', 'rawAccountId', 'walletAddress', 'wallet', 'messageId', 'caseId', 'threadId', 'postId', 'orderId', 'invoiceId', 'paymentId', 'campaignId', 'packageId', 'telegramId', 'nickname'])

function unique(values = []) { return Array.from(new Set(values.filter(Boolean))) }
function normalizeSourceTopic(topic = '') {
  const raw = String(topic || '').trim().toLowerCase()
  if (QL7_SUPPORT_DOMAIN_TOPICS.includes(raw)) return raw
  return normalizeQl7SupportTopic(raw)
}
function buildContract(topic) {
  const clean = normalizeSourceTopic(topic)
  const declared = QL7_SUPPORT_ECOSYSTEM_TOPICS.includes(clean) ? getQl7SupportDeclaredReadCollections(clean) : []
  const configured = getQl7SupportConfiguredReadCollections(clean)
  const collections = configured.filter((name) => isQl7SupportRealReadCollection(name)).slice(0, 6)
  const family = FAMILY[clean] || 'knowledge'
  return Object.freeze({
    topic: clean,
    domainId: clean,
    adapterId: `ql7:${clean}:${family}:canonical`,
    playbook: `${family}_evidence_playbook`,
    family,
    mode: collections.length ? 'bounded_read' : 'diagnostic_not_applicable',
    collections: Object.freeze(collections),
    unsupportedDeclaredCollections: Object.freeze(declared.filter((name) => !isQl7SupportRealReadCollection(name))),
    routeEvidence: Object.freeze([...(ROUTE_EVIDENCE[clean] || [])]),
    filterKeys: Object.freeze([...FILTER_KEYS]),
    projection: Object.freeze(unique(['_id', ...OWNERSHIP_FIELDS, ...(STATUS_FIELDS[family] || ['status', 'updatedAt']), ...(EVIDENCE_FIELDS[family] || [])])),
    statusFields: Object.freeze([...(STATUS_FIELDS[family] || ['status', 'updatedAt'])]),
    evidenceFields: Object.freeze([...(EVIDENCE_FIELDS[family] || [])]),
    analyzerId: `ql7:${clean}:${family}:analyzer:canonical`,
    readOnly: true,
    arbitraryQueryAllowed: false,
    foreignAccountAllowed: false,
    sourceUnavailableDistinctFromNoData: true,
    maxCollections: 6,
    maxRowsPerCollection: 25,
    maxTimeMs: 2500,
    privacyClass: ['security', 'privacy', 'moderation', 'account_deletion'].includes(clean) ? 'restricted' : 'user_safe',
    renderer: `${clean}:evidence_renderer:canonical`,
    recommendationPolicy: `${family}:next_best_action:canonical`,
  })
}

const CONTRACTS = Object.freeze(Object.fromEntries(QL7_SUPPORT_DOMAIN_TOPICS.map((topic) => [topic, buildContract(topic)])))

export function getQl7SupportSourceContract(topic = '') {
  const clean = normalizeSourceTopic(topic)
  return CONTRACTS[clean] || CONTRACTS.support_system
}
export function listQl7SupportSourceContracts() { return Object.freeze(QL7_SUPPORT_DOMAIN_TOPICS.map((topic) => CONTRACTS[topic])) }
export function isAllowedQl7SupportCollection(name = '') { return isQl7SupportRealReadCollection(name) }
export function listQl7SupportRealCollections() { return listQl7SupportRealReadCollections() }
