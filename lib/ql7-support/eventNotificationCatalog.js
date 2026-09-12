import crypto from 'node:crypto'
import {QL7_SUPPORT_ALL_LOCALES} from './config/behaviorManifest.js'

export const QL7_SUPPORT_EVENT_ENVELOPE_SCHEMA_VERSION = '1.0.0'
export const QL7_SUPPORT_EVENT_ENVELOPE_OWNER_ID = 'ql7-support.event-envelope'
export const QL7_SUPPORT_EVENT_SOURCE_PROPOSITION_SCHEMA_VERSION = '1.0.0'

const EVENT_SOURCE_PROPOSITION_POLICY = Object.freeze({
  broadcast: Object.freeze({
    payloadKey: 'announcement',
    templateId: 'broadcast.admin-source',
    maxGraphemes: 2_000,
  }),
  critical_security: Object.freeze({
    payloadKey: 'securityNotice',
    templateId: 'security.critical-source',
    maxGraphemes: 1_600,
  }),
})

const ECOSYSTEM_EVENT_TYPES = Object.freeze([
  'purchase_succeeded', 'purchase_failed', 'purchase_pending', 'qcoin_operation',
  'vip_activated', 'vip_extended',
  'ads_package_exhausted',
  'subscription_renewed', 'subscription_cancelled', 'payment_inconsistency',
  'metamarket_gift_received', 'metamarket_gift_sent', 'metamarket_delivery_problem',
  'campaign_activated', 'campaign_limit_warning', 'campaign_metrics_anomaly',
  'report_received',
  'publishing_restriction', 'human_review',
])

const PROACTIVE_EVENT_TYPES = Object.freeze([
  'welcome', 'qcoin_credit', 'vip_activated', 'vip_expiring_3d', 'vip_expiring_2d',
  'vip_expiring_1d', 'vip_expired', 'ads_activated', 'ads_metrics_weekly',
  'ads_expiring_3d', 'ads_expiring_2d', 'ads_expiring_1d', 'ads_final_summary',
  'report_received', 'report_threshold', 'post_removed', 'media_lock',
  'rules_warning', 'broadcast', 'critical_security', 'idle_nudge',
])

export const QL7_SUPPORT_EVENT_TYPES = Object.freeze([...new Set([
  ...ECOSYSTEM_EVENT_TYPES,
  ...PROACTIVE_EVENT_TYPES,
])])

const EVENT_SEMANTICS = Object.freeze({
  welcome: ['platform', 'account.registration.welcome', 'info'],
  qcoin_credit: ['qcoin', 'qcoin.balance.credit.confirmed', 'success'],
  qcoin_operation: ['qcoin', 'qcoin.operation.status', 'info'],
  purchase_succeeded: ['payments', 'purchase.result.succeeded', 'success'],
  purchase_failed: ['payments', 'purchase.result.failed', 'warning'],
  purchase_pending: ['payments', 'purchase.result.pending', 'info'],
  vip_activated: ['vip', 'vip.activation.confirmed', 'success'],
  vip_extended: ['vip', 'vip.extension.confirmed', 'success'],
  vip_expiring_3d: ['vip', 'vip.expiration.warning.3d', 'warning'],
  vip_expiring_2d: ['vip', 'vip.expiration.warning.2d', 'warning'],
  vip_expiring_1d: ['vip', 'vip.expiration.warning.1d', 'warning'],
  vip_expired: ['vip', 'vip.expiration.completed', 'warning'],
  ads_activated: ['ads_packages', 'ads.package.activation.confirmed', 'success'],
  ads_package_exhausted: ['ads_packages', 'ads.package.exhausted', 'warning'],
  ads_metrics_weekly: ['ads_campaigns', 'ads.campaign.metrics.weekly', 'info'],
  ads_expiring_3d: ['ads_packages', 'ads.package.expiration.warning.3d', 'warning'],
  ads_expiring_2d: ['ads_packages', 'ads.package.expiration.warning.2d', 'warning'],
  ads_expiring_1d: ['ads_packages', 'ads.package.expiration.warning.1d', 'warning'],
  ads_final_summary: ['ads_campaigns', 'ads.campaign.metrics.final', 'info'],
  campaign_activated: ['ads_campaigns', 'ads.campaign.activation.confirmed', 'success'],
  campaign_limit_warning: ['ads_campaigns', 'ads.campaign.limit.warning', 'warning'],
  campaign_metrics_anomaly: ['ads_campaigns', 'ads.campaign.metrics.anomaly', 'warning'],
  subscription_renewed: ['vip', 'subscription.renewal.confirmed', 'success'],
  subscription_cancelled: ['vip', 'subscription.cancellation.confirmed', 'warning'],
  payment_inconsistency: ['payments', 'payment.evidence.inconsistent', 'warning'],
  metamarket_gift_received: ['metamarket', 'metamarket.gift.received', 'success'],
  metamarket_gift_sent: ['metamarket', 'metamarket.gift.sent', 'success'],
  metamarket_delivery_problem: ['metamarket', 'metamarket.delivery.problem', 'warning'],
  report_received: ['moderation', 'moderation.report.received', 'warning'],
  report_threshold: ['moderation', 'moderation.report.threshold', 'warning'],
  post_removed: ['moderation', 'moderation.content.removed', 'critical'],
  media_lock: ['moderation', 'moderation.media.restriction', 'critical'],
  publishing_restriction: ['moderation', 'moderation.publishing.restriction', 'critical'],
  rules_warning: ['moderation', 'moderation.rules.warning', 'warning'],
  human_review: ['moderation', 'moderation.human.review', 'warning'],
  broadcast: ['support_system', 'system.broadcast', 'info'],
  critical_security: ['security', 'security.critical.notice', 'critical'],
  idle_nudge: ['support_system', 'conversation.open-question.idle-followup', 'info'],
})

const MATERIAL_EMAIL_EVENTS = new Set([
  'purchase_failed', 'payment_inconsistency', 'metamarket_delivery_problem',
  'campaign_metrics_anomaly', 'report_threshold', 'post_removed',
  'publishing_restriction', 'critical_security', 'human_review',
])

function str(value) {
  return String(value ?? '').trim()
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]))
}

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value ?? null))).digest('hex')
}

function envelopeBody(envelope = {}) {
  return {
    schema: envelope.schema,
    schemaVersion: envelope.schemaVersion,
    ownerId: envelope.ownerId,
    eventId: envelope.eventId,
    type: envelope.type,
    actorIdHash: envelope.actorIdHash,
    recipientIdHash: envelope.recipientIdHash,
    subjectIdHash: envelope.subjectIdHash,
    primaryDomainId: envelope.primaryDomainId,
    primaryMicrotopicId: envelope.primaryMicrotopicId,
    verifiedFactIds: envelope.verifiedFactIds,
    sourceReceipt: envelope.sourceReceipt,
    locale: envelope.locale,
    severity: envelope.severity,
    occurredAtServerUtc: envelope.occurredAtServerUtc,
    idempotencyKeyHash: envelope.idempotencyKeyHash,
    payload: envelope.payload,
    surfaceFacts: envelope.surfaceFacts,
    pushPolicy: envelope.pushPolicy,
    emailPolicy: envelope.emailPolicy,
    readOnly: envelope.readOnly,
    realBusinessWrite: envelope.realBusinessWrite,
  }
}

function normalizeLocale(value = 'en') {
  const locale = str(value).toLowerCase().split(/[-_]/u)[0]
  return QL7_SUPPORT_ALL_LOCALES.includes(locale) ? locale : 'en'
}

function normalizeSourceStatement(value = '', maxGraphemes = 2_000) {
  return str(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, '')
    .replace(/[\r\n\t]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .slice(0, maxGraphemes)
    .trim()
}

function sourcePropositionBody(value = {}) {
  return {
    schema: value.schema,
    schemaVersion: value.schemaVersion,
    eventType: value.eventType,
    propositionId: value.propositionId,
    templateId: value.templateId,
    templateVersion: value.templateVersion,
    sourceLocale: value.sourceLocale,
    sourceText: value.sourceText,
    sourceTextHash: value.sourceTextHash,
    realizationPolicy: value.realizationPolicy,
    readyToSend: value.readyToSend,
  }
}

export function buildQl7SupportEventSourceProposition({
  eventType = '',
  type = '',
  sourceText = '',
  text = '',
  sourceLocale = 'en',
  templateId = '',
  templateVersion = '1.0.0',
} = {}) {
  const typeId = str(eventType || type)
  const policy = EVENT_SOURCE_PROPOSITION_POLICY[typeId]
  if (!policy) {
    const error = new Error(`event_source_proposition_type_unsupported:${typeId}`)
    error.code = 'event_source_proposition_type_unsupported'
    throw error
  }
  const selectedTemplateId = str(templateId || policy.templateId)
  if (selectedTemplateId !== policy.templateId) {
    const error = new Error(`event_source_template_not_approved:${selectedTemplateId}`)
    error.code = 'event_source_template_not_approved'
    throw error
  }
  const cleanText = normalizeSourceStatement(sourceText || text, policy.maxGraphemes)
  if (!cleanText) {
    const error = new Error('event_source_statement_required')
    error.code = 'event_source_statement_required'
    throw error
  }
  const sourceTextHash = hash(cleanText)
  const body = {
    schema: 'ql7.support.event-source-proposition',
    schemaVersion: QL7_SUPPORT_EVENT_SOURCE_PROPOSITION_SCHEMA_VERSION,
    eventType: typeId,
    propositionId: `event-proposition:${hash({ typeId, selectedTemplateId, sourceTextHash })}`,
    templateId: selectedTemplateId,
    templateVersion: str(templateVersion) || '1.0.0',
    sourceLocale: normalizeLocale(sourceLocale),
    sourceText: cleanText,
    sourceTextHash,
    realizationPolicy: 'canonical_event_frame',
    readyToSend: false,
  }
  return Object.freeze({
    ...body,
    propositionHash: hash(body),
  })
}

export function validateQl7SupportEventSourceProposition(value = {}, { eventType = '' } = {}) {
  const failures = []
  const typeId = str(eventType || value?.eventType)
  const policy = EVENT_SOURCE_PROPOSITION_POLICY[typeId]
  if (!policy) failures.push('source_proposition_type_unsupported')
  if (value?.schema !== 'ql7.support.event-source-proposition') failures.push('source_proposition_schema_invalid')
  if (value?.schemaVersion !== QL7_SUPPORT_EVENT_SOURCE_PROPOSITION_SCHEMA_VERSION) failures.push('source_proposition_version_invalid')
  if (str(value?.eventType) !== typeId) failures.push('source_proposition_event_type_invalid')
  if (policy && str(value?.templateId) !== policy.templateId) failures.push('source_proposition_template_invalid')
  if (!str(value?.templateVersion)) failures.push('source_proposition_template_version_missing')
  const cleanText = normalizeSourceStatement(value?.sourceText, policy?.maxGraphemes || 2_000)
  if (!cleanText || cleanText !== value?.sourceText) failures.push('source_proposition_text_invalid')
  if (hash(cleanText) !== value?.sourceTextHash) failures.push('source_proposition_text_hash_invalid')
  if (value?.readyToSend !== false || value?.realizationPolicy !== 'canonical_event_frame') failures.push('source_proposition_realization_policy_invalid')
  if (hash(sourcePropositionBody(value)) !== value?.propositionHash) failures.push('source_proposition_hash_invalid')
  if (!str(value?.propositionId)) failures.push('source_proposition_id_missing')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze([...new Set(failures)]) })
}

function safeEventValue(value, depth = 0) {
  if (depth > 12 || value === null || value === undefined) return value ?? null
  if (typeof value === 'string') return value.slice(0, 4_000)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.slice(0, 64).map((item) => safeEventValue(item, depth + 1))
  if (typeof value !== 'object') return str(value)
  const out = {}
  for (const [key, item] of Object.entries(value)) {
    if (/(?:token|secret|password|seedphrase|mnemonic|privatekey|reporter(?:id|wallet)?|rawip|latitude|longitude)/iu.test(key)) continue
    out[key] = safeEventValue(item, depth + 1)
  }
  return out
}

function verifiedFactIds(payload = {}, sourceReceiptId = '') {
  const ids = []
  if (sourceReceiptId) ids.push(sourceReceiptId)
  for (const [key, value] of Object.entries(payload)) {
    if (!/(?:id|receipt|invoice|payment|report|warning|revision)$/iu.test(key)) continue
    const clean = str(value)
    if (clean) ids.push(`${key}:${hash(clean)}`)
  }
  return Object.freeze([...new Set(ids)].sort())
}

export function buildQl7SupportEventEnvelope({
  eventId = '', type = '', eventType = '', userId = '', actorId = '', subjectId = '',
  locale = 'en', payload = {}, timestamp = new Date().toISOString(), occurredAt = '',
  sourceReceipt = null, sourceReceiptId = '', idempotencyKey = '', severity = '',
  push = true, surfaceFacts = null,
} = {}) {
  const typeId = str(type || eventType)
  if (!QL7_SUPPORT_EVENT_TYPES.includes(typeId) || !EVENT_SEMANTICS[typeId]) {
    const error = new Error(`unsupported_ql7_support_event:${typeId}`)
    error.code = 'unsupported_ql7_support_event'
    throw error
  }
  const recipientId = str(userId)
  const sourceActorId = str(actorId || userId)
  const subject = str(subjectId)
  if (!recipientId || !subject) {
    const error = new Error('ql7_support_event_identity_required')
    error.code = 'ql7_support_event_identity_required'
    throw error
  }
  const [primaryDomainId, primaryMicrotopicId, defaultSeverity] = EVENT_SEMANTICS[typeId]
  const safePayload = Object.freeze(safeEventValue(payload) || {})
  const safeSurfaceFacts = Object.freeze(safeEventValue(surfaceFacts) || {})
  const sourcePolicy = EVENT_SOURCE_PROPOSITION_POLICY[typeId]
  if (sourcePolicy) {
    if (Object.prototype.hasOwnProperty.call(safePayload, 'message')) {
      const error = new Error('event_ready_to_send_prose_forbidden')
      error.code = 'event_ready_to_send_prose_forbidden'
      throw error
    }
    const sourceCheck = validateQl7SupportEventSourceProposition(safePayload[sourcePolicy.payloadKey], { eventType: typeId })
    if (!sourceCheck.ok) {
      const error = new Error('event_source_proposition_invalid')
      error.code = 'event_source_proposition_invalid'
      error.failures = sourceCheck.failures
      throw error
    }
  }
  const occurredAtServerUtc = new Date(occurredAt || timestamp).toISOString()
  const recipientIdHash = hash(recipientId)
  const actorIdHash = hash(sourceActorId)
  const factHash = hash({ typeId, subject, safePayload, safeSurfaceFacts, occurredAtServerUtc })
  const effectiveSourceReceiptId = str(sourceReceiptId || sourceReceipt?.receiptId) || `event-source:${factHash}`
  const sourceFactReceipt = Object.freeze({
    schema: 'ql7.support.event-source-fact-receipt',
    schemaVersion: QL7_SUPPORT_EVENT_ENVELOPE_SCHEMA_VERSION,
    receiptId: effectiveSourceReceiptId,
    sourceType: str(sourceReceipt?.sourceType || 'producer_attestation'),
    sourceOperationIdHash: hash(sourceReceipt?.sourceOperationId || subject),
    factHash,
    occurredAtServerUtc,
  })
  const effectiveEventId = str(eventId) || `event:${hash({ typeId, recipientIdHash, subject })}`
  const effectiveIdempotencyKey = str(idempotencyKey) || `ql7-support:event:${typeId}:${effectiveEventId}:${recipientIdHash}`
  const body = {
    schema: 'ql7.support.event-envelope',
    schemaVersion: QL7_SUPPORT_EVENT_ENVELOPE_SCHEMA_VERSION,
    ownerId: QL7_SUPPORT_EVENT_ENVELOPE_OWNER_ID,
    eventId: effectiveEventId,
    type: typeId,
    actorIdHash,
    recipientIdHash,
    subjectIdHash: hash(subject),
    primaryDomainId,
    primaryMicrotopicId,
    verifiedFactIds: verifiedFactIds(safePayload, effectiveSourceReceiptId),
    sourceReceipt: sourceFactReceipt,
    locale: normalizeLocale(locale),
    severity: str(severity || defaultSeverity),
    occurredAtServerUtc,
    idempotencyKeyHash: hash(effectiveIdempotencyKey),
    payload: safePayload,
    surfaceFacts: safeSurfaceFacts,
    pushPolicy: push === false ? 'none' : 'deduplicated',
    emailPolicy: MATERIAL_EMAIL_EVENTS.has(typeId) ? 'material_deduplicated' : 'none',
    readOnly: true,
    realBusinessWrite: false,
  }
  const envelopeHash = hash(body)
  return Object.freeze({
    ...body,
    envelopeHash,
    receiptId: `event-envelope:${envelopeHash}`,
    dedupeKey: effectiveIdempotencyKey,
    signedCardRequired: true,
    runtimeState: MATERIAL_EMAIL_EVENTS.has(typeId) ? 'preparing_admin_report' : 'preparing_card',
    recipientProjection: Object.freeze({ eventType: typeId, subjectIdHash: body.subjectIdHash, locale: body.locale, ...safePayload }),
    userProjection: Object.freeze({ eventType: typeId, subjectIdHash: body.subjectIdHash, locale: body.locale, ...safePayload }),
    adminProjection: Object.freeze({ eventType: typeId, recipientIdHash, subjectIdHash: body.subjectIdHash, locale: body.locale, ...safePayload }),
  })
}

export function validateQl7SupportEventEnvelope(envelope = {}, { userId = '' } = {}) {
  const failures = []
  if (envelope?.schema !== 'ql7.support.event-envelope') failures.push('schema_invalid')
  if (envelope?.schemaVersion !== QL7_SUPPORT_EVENT_ENVELOPE_SCHEMA_VERSION) failures.push('schema_version_invalid')
  if (envelope?.ownerId !== QL7_SUPPORT_EVENT_ENVELOPE_OWNER_ID) failures.push('owner_invalid')
  if (!QL7_SUPPORT_EVENT_TYPES.includes(str(envelope?.type))) failures.push('event_type_invalid')
  const semantics = EVENT_SEMANTICS[str(envelope?.type)]
  if (!semantics || envelope?.primaryDomainId !== semantics?.[0] || envelope?.primaryMicrotopicId !== semantics?.[1]) {
    failures.push('event_semantics_invalid')
  }
  if (!str(envelope?.eventId) || !str(envelope?.recipientIdHash) || !str(envelope?.actorIdHash)) failures.push('identity_missing')
  if (!str(envelope?.dedupeKey) || hash(str(envelope?.dedupeKey)) !== envelope?.idempotencyKeyHash) failures.push('idempotency_binding_invalid')
  if (str(userId) && hash(str(userId)) !== envelope?.recipientIdHash) failures.push('recipient_binding_invalid')
  if (!envelope?.sourceReceipt?.receiptId || !/^[a-f0-9]{64}$/u.test(str(envelope?.sourceReceipt?.factHash))) failures.push('source_receipt_invalid')
  if (!Array.isArray(envelope?.verifiedFactIds) || !envelope.verifiedFactIds.includes(envelope?.sourceReceipt?.receiptId)) failures.push('verified_fact_binding_invalid')
  if (!['info', 'success', 'warning', 'critical'].includes(str(envelope?.severity))) failures.push('severity_invalid')
  if (!Number.isFinite(Date.parse(str(envelope?.occurredAtServerUtc)))) failures.push('occurred_at_invalid')
  const sourcePolicy = EVENT_SOURCE_PROPOSITION_POLICY[str(envelope?.type)]
  if (sourcePolicy) {
    if (Object.prototype.hasOwnProperty.call(envelope?.payload || {}, 'message')) failures.push('ready_to_send_prose_forbidden')
    const sourceCheck = validateQl7SupportEventSourceProposition(envelope?.payload?.[sourcePolicy.payloadKey], { eventType: envelope?.type })
    failures.push(...sourceCheck.failures)
  }
  if (hash(envelopeBody(envelope)) !== envelope?.envelopeHash) failures.push('envelope_hash_invalid')
  if (envelope?.readOnly !== true || envelope?.realBusinessWrite !== false) failures.push('event_write_contract_invalid')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze([...new Set(failures)]) })
}

export function buildQl7SupportEventContract(input = {}) {
  return buildQl7SupportEventEnvelope(input)
}

export function getQl7SupportEventSemantics(type = '') {
  const row = EVENT_SEMANTICS[str(type)]
  if (!row) return null
  return Object.freeze({ primaryDomainId: row[0], primaryMicrotopicId: row[1], severity: row[2] })
}
