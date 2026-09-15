import {QL7_SUPPORT_ALL_LOCALES} from '../config/behaviorManifest.js'
import {ql7Locale, ql7StableHash, ql7Str} from '../internal/text.js'
import {validateQl7SupportEventSourceProposition} from '../eventNotificationCatalog.js'

export const QL7_SUPPORT_EVENT_SEMANTIC_PROJECTION_SCHEMA_VERSION = '1.0.0'
export const QL7_SUPPORT_EVENT_NATURAL_REALIZER_OWNER_ID = 'ql7-support.event-semantic-projection'

const EVENT_CLASS = Object.freeze({
  welcome: 'welcome',
  qcoin_credit: 'success', qcoin_operation: 'info',
  purchase_succeeded: 'success', purchase_failed: 'failure', purchase_pending: 'pending',
   vip_activated: 'success', vip_extended: 'success',
  vip_expiring_3d: 'reminder', vip_expiring_2d: 'reminder', vip_expiring_1d: 'reminder', vip_expired: 'restriction',
   ads_activated: 'success',
  ads_package_exhausted: 'restriction', ads_metrics_weekly: 'info', ads_expiring_3d: 'reminder',
  ads_expiring_2d: 'reminder', ads_expiring_1d: 'reminder', ads_final_summary: 'info',
  campaign_activated: 'success', campaign_limit_warning: 'reminder', campaign_metrics_anomaly: 'reminder',
  subscription_renewed: 'success', subscription_cancelled: 'restriction', payment_inconsistency: 'failure',
  metamarket_gift_received: 'success', metamarket_gift_sent: 'success', metamarket_delivery_problem: 'failure',
   report_received: 'moderation', report_threshold: 'moderation',
   post_removed: 'restriction',
   media_lock: 'restriction', publishing_restriction: 'restriction',
  rules_warning: 'moderation', human_review: 'moderation', critical_security: 'security',
  broadcast: 'broadcast', idle_nudge: 'idle_nudge',
})

const SENSITIVE_KEY = /(?:token|secret|password|seed|mnemonic|private|raw|stack|mongo|collection|route|authorization|cookie|session)/iu
const FACT_KEYS = Object.freeze([
  'amount', 'currency', 'daysRemaining', 'expiresAt', 'status', 'reasonCode', 'packageId',
  'campaignId', 'reportCount', 'threshold', 'metricName', 'metricValue', 'period', 'duration',
])

function safeSemanticFacts(payload = {}) {
  if (!payload || typeof payload !== 'object') return Object.freeze({})
  const facts = {}
  for (const key of FACT_KEYS) {
    if (SENSITIVE_KEY.test(key) || !(key in payload)) continue
    const value = payload[key]
    if (typeof value === 'string') facts[key] = value.slice(0, 512)
    else if (typeof value === 'number' || typeof value === 'boolean') facts[key] = value
  }
  return Object.freeze(facts)
}

function sourceProposition(payload = {}, key = '', eventType = '') {
  const proposition = payload?.[key]
  if (!proposition || typeof proposition !== 'object') {
    const error = new Error(`event_source_proposition_required:${eventType}`)
    error.code = 'event_source_proposition_required'
    throw error
  }
  const check = validateQl7SupportEventSourceProposition(proposition, { eventType })
  if (!check.ok) {
    const error = new Error('event_source_proposition_invalid')
    error.code = 'event_source_proposition_invalid'
    error.failures = check.failures
    throw error
  }
  return proposition
}

/** Semantic-only event projection. Final user-visible text is owned by the canonical runtime/HNR path. */
export function projectQl7SupportEventSemantics({ envelope = {}, locale = 'en', seed = '' } = {}) {
  const language = ql7Locale(locale)
  if (!QL7_SUPPORT_ALL_LOCALES.includes(language)) {
    const error = new Error(`event_locale_profile_unavailable:${language}`)
    error.code = 'event_locale_profile_unavailable'
    throw error
  }
  const type = ql7Str(envelope?.type)
  const payload = envelope?.payload && typeof envelope.payload === 'object' ? envelope.payload : {}
  const eventClass = EVENT_CLASS[type] || 'info'
  const externalSource = type === 'broadcast'
    ? sourceProposition(payload, 'announcement', type)
    : type === 'critical_security'
      ? sourceProposition(payload, 'securityNotice', type)
      : null
  const semanticFacts = safeSemanticFacts(payload)
  const semanticPlanId = `event-semantic:${ql7StableHash(JSON.stringify({
    eventId: ql7Str(envelope?.eventId), type, language, eventClass, semanticFacts,
    propositionHash: ql7Str(externalSource?.propositionHash), seed: ql7Str(seed),
  }))}`

  return Object.freeze({
    schema: 'ql7.support.event-semantic-projection',
    schemaVersion: QL7_SUPPORT_EVENT_SEMANTIC_PROJECTION_SCHEMA_VERSION,
    semanticPlanId,
    locale: language,
    type,
    eventClass,
    speechAct: 'event_notification',
    semanticFacts,
    externalSourceProposition: externalSource || null,
    sourceLocale: ql7Str(externalSource?.sourceLocale),
    requiresLocalization: Boolean(externalSource && externalSource.sourceLocale !== language),
    sourceReceiptId: ql7Str(envelope?.sourceReceipt?.receiptId),
    occurredAtServerUtc: ql7Str(envelope?.occurredAtServerUtc),
    surfaceFacts: envelope?.surfaceFacts && typeof envelope.surfaceFacts === 'object' ? envelope.surfaceFacts : null,
    text: '',
    title: '',
    readyToSend: false,
    finalText: false,
    finalTextOwner: false,
    semanticProjection: true,
    canonicalRuntimeOwner: 'runtime/executeTurn.js',
    canonicalRealizationOwner: 'response/humanNaturalRealizer.js',
  })
}

export function getQl7SupportEventLocaleCoverage() {
  return Object.freeze({
    version: QL7_SUPPORT_EVENT_SEMANTIC_PROJECTION_SCHEMA_VERSION,
    locales: Object.freeze([...QL7_SUPPORT_ALL_LOCALES]),
    localeCount: QL7_SUPPORT_ALL_LOCALES.length,
    semanticEventClasses: Object.freeze([...new Set(Object.values(EVENT_CLASS))].sort()),
    readyToSendRows: 0,
    finalSentenceRows: 0,
    finalTextOwner: false,
    semanticOnly: true,
    canonicalRuntimeOwner: 'runtime/executeTurn.js',
    complete: QL7_SUPPORT_ALL_LOCALES.length === 32,
  })
}
