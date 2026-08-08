// lib/mongo/permanent-policy.cjs
// QL7_MONGO_PERMANENT_CODE_POLICY_V18
// Permanent Mongo/Redis runtime policy. Non-secret storage ownership is code-owned here.
// ENV must provide only credentials/connection settings (MONGODB_*, MONGO_DNS_SERVERS, Redis tokens/URLs).

'use strict'

const PERMANENT_READ_DOMAINS = Object.freeze([
  'forum',
  'qcoin',
  'qcoin_read_only',
  'dm',
  'metamarket',
  'profile',
  'ads',
  'quest',
  'academy',
  'subscription',
  'battlecoin',
  'referral',
  'payments',
  'pay',
  'metastudio',
  'push',
])

const HELD_READ_DOMAINS = Object.freeze([
  'aiquota',
])

const FUTURE_REVIEW_DOMAINS = Object.freeze([
  'telegram',
])

const READ_DOMAIN_FLAGS = Object.freeze({
  forum: 'MONGO_READ_FORUM',
  qcoin: 'MONGO_READ_QCOIN',
  qcoin_read_only: 'MONGO_READ_QCOIN',
  dm: 'MONGO_READ_DM',
  metamarket: 'MONGO_READ_METAMARKET',
  profile: 'MONGO_READ_PROFILE',
  ads: 'MONGO_READ_ADS',
  quest: 'MONGO_READ_QUEST',
  academy: 'MONGO_READ_ACADEMY',
  subscription: 'MONGO_READ_SUBSCRIPTION',
  battlecoin: 'MONGO_READ_BATTLECOIN',
  referral: 'MONGO_READ_REFERRAL',
  telegram: 'MONGO_READ_TELEGRAM',
  push: 'MONGO_READ_PUSH',
  payments: 'MONGO_READ_PAYMENTS',
  pay: 'MONGO_READ_PAYMENTS',
  metastudio: 'MONGO_READ_METASTUDIO',
})

function normalizeDomain(domain) {
  return String(domain || 'unknown').trim().toLowerCase().replace(/-/g, '_') || 'unknown'
}

function isMongoPermanentReadDomain(domain) {
  return PERMANENT_READ_DOMAINS.includes(normalizeDomain(domain))
}

function isHeldReadDomain(domain) {
  return HELD_READ_DOMAINS.includes(normalizeDomain(domain))
}

function getMongoReadDomainFlag(domain) {
  return READ_DOMAIN_FLAGS[normalizeDomain(domain)] || null
}

function getMongoPermanentPolicy() {
  const readDomains = Object.freeze({
    forum: true,
    qcoin: true,
    qcoin_read_only: true,
    dm: true,
    metamarket: true,
    profile: true,
    ads: true,
    quest: true,
    academy: true,
    subscription: true,
    telegram: false,
    battlecoin: true,
    referral: true,
    payments: true,
    pay: true,
    metastudio: true,
    aiquota: false,
    push: true,
  })

  return Object.freeze({
    version: 'ql7-mongo-permanent-code-policy-v18',
    mongoEnabled: true,
    readCutover: true,
    mongoPrimaryWrites: true,
    parallelPermanentWrites: false,
    redisCleanupAllowed: false,
    redisFallbackEnabled: false,
    migrationLockEnabled: false,
    verifyParityReads: false,
    runtimeComparisonReads: false,
    runtimeComparisonTimeoutMs: 0,
    runtimeComparisonSampleRate: 0,
    runtimeComparisonLog: false,
    runtimeComparisonThrowOnMismatch: false,
    runtimeComparisonThrowOnError: false,
    runtimeDohDirectSeed: true,
    primaryReadCanaryCapture: true,
    metamarketStateFastPrimary: true,
    readDomains,
    permanentReadDomains: PERMANENT_READ_DOMAINS.slice(),
    heldReadDomains: HELD_READ_DOMAINS.slice(),
    futureReviewDomains: FUTURE_REVIEW_DOMAINS.slice(),
    allowedEnvSecretsOnly: [
      'MONGODB_URI',
      'MONGODB_DB',
      'MONGODB_MAX_POOL_SIZE',
      'MONGODB_MIN_POOL_SIZE',
      'MONGODB_SERVER_SELECTION_TIMEOUT_MS',
      'MONGODB_CONNECT_TIMEOUT_MS',
      'MONGODB_SOCKET_TIMEOUT_MS',
      'MONGO_DNS_SERVERS',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'REDIS_URL',
      'REDIS_TOKEN',
    ],
    note: 'Mongo is the permanent primary read/write source for migrated domains, including push notification state and push subscriptions; Redis remains only for realtime pubsub, TTL cache, locks, sessions, rate limits, runtime snapshots and short-lived dedupe. Dual-write, normal Redis fallback and Redis cleanup are code-disabled.',
  })
}

module.exports = {
  PERMANENT_READ_DOMAINS,
  HELD_READ_DOMAINS,
  FUTURE_REVIEW_DOMAINS,
  READ_DOMAIN_FLAGS,
  normalizeDomain,
  isMongoPermanentReadDomain,
  isHeldReadDomain,
  getMongoReadDomainFlag,
  getMongoPermanentPolicy,
}
