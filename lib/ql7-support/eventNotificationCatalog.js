export const QL7_SUPPORT_EVENT_TYPES_V7 = Object.freeze([
  'purchase_succeeded', 'purchase_failed', 'purchase_pending', 'qcoin_operation',
  'vip_activated', 'vip_extended', 'vip_expiration_warning',
  'ads_package_activated', 'ads_package_expiration_warning', 'ads_package_exhausted',
  'subscription_renewed', 'subscription_cancelled', 'payment_inconsistency',
  'metamarket_gift_received', 'metamarket_gift_sent', 'metamarket_delivery_problem',
  'campaign_activated', 'campaign_limit_warning', 'campaign_metrics_anomaly',
  'report_received', 'report_threshold_warning', 'report_threshold_reached',
  'content_removed', 'media_restriction', 'publishing_restriction', 'human_review',
])
export const QL7_SUPPORT_EVENT_TYPES = QL7_SUPPORT_EVENT_TYPES_V7

const MATERIAL_EMAIL_EVENTS = new Set([
  'purchase_failed', 'payment_inconsistency', 'metamarket_delivery_problem',
  'campaign_metrics_anomaly', 'report_threshold_reached', 'content_removed',
  'publishing_restriction', 'human_review',
])
function str(value) { return String(value ?? '').trim() }
function safePayload(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([key]) => !/(?:token|secret|password|reporter|rawip|latitude|longitude)/iu.test(key)))
}
export function buildQl7SupportEventContract({ type = '', userId = '', subjectId = '', locale = 'en', payload = {}, timestamp = new Date().toISOString() } = {}) {
  const eventType = str(type)
  if (!QL7_SUPPORT_EVENT_TYPES_V7.includes(eventType)) throw new Error(`unsupported_ql7_support_event:${eventType}`)
  const safeUserId = str(userId), safeSubjectId = str(subjectId), safe = safePayload(payload)
  if (!safeUserId || !safeSubjectId) throw new Error('ql7_support_event_identity_required')
  const userProjection = { eventType, subjectId: safeSubjectId, locale: str(locale) || 'en', ...safe }
  const adminProjection = { eventType, userId: safeUserId, subjectId: safeSubjectId, locale: str(locale) || 'en', ...safe }
  return Object.freeze({
    version: 1, eventType, userId: safeUserId, subjectId: safeSubjectId,
    locale: str(locale) || 'en', timestamp: new Date(timestamp).toISOString(),
    dedupeKey: `ql7-support:event:${eventType}:${safeUserId}:${safeSubjectId}`,
    recipientProjection: userProjection, userProjection, adminProjection,
    runtimeState: MATERIAL_EMAIL_EVENTS.has(eventType) ? 'preparing_admin_report' : 'preparing_card',
    emailPolicy: MATERIAL_EMAIL_EVENTS.has(eventType) ? 'material_deduplicated' : 'none',
    pushPolicy: 'deduplicated', signedCardRequired: true, readOnly: true,
    realBusinessWrite: false,
  })
}
