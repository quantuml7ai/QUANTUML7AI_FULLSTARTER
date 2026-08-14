import crypto from 'node:crypto'
import { buildQl7SupportInputPolicy, normalizeQl7SupportInputPolicy } from './inputPolicy.js'

export const QL7_SUPPORT_UI_EVENT_COLLECTION = 'ql7_support_ui_events'
export const QL7_SUPPORT_RUNTIME_STATES = Object.freeze(['receiving','validating','verifying_actor','resolving_identity','redacting','translating_in','understanding','analyzing','classifying','clarifying','planning','retrieving','checking_evidence','diagnosing','aggregating','composing','rendering_user','preparing_result','preparing_card','preparing_admin_report','translating_out','policy_guard','committing','sending','answer_committed','input_ready','cooldown','waiting_choice','waiting_user','waiting_admin','completed','abandoned','cancelled','unavailable','timeout','safety_review','error','offline','idle','ready_for_input','delivered','merging_memory','queued_email'])

const SAFETY_RESTRICTION_REASON = 'safety_review'
const QL7_SUPPORT_RESTRICTION_TTL_GRACE_MS = 60 * 1000
const QL7_SUPPORT_RECENT_STATE_LIMIT = 32

function str(value) { return String(value ?? '').trim() }
function currentMs(clock) { return typeof clock === 'function' ? Number(clock()) : Date.now() }
function nowIso(clock) { return new Date(currentMs(clock)).toISOString() }
function hash(value) { return crypto.createHash('sha256').update(str(value)).digest('hex').slice(0, 24) }
function blockedUntilMs(policy = {}) { return Number(policy?.blockedUntilMs || Date.parse(policy?.blockedUntil || policy?.readyAt || '') || policy?.readyAtMs || 0) }
function isActiveSafetyRestriction(policy = {}, nowMs = Date.now()) {
  return str(policy?.reasonCode || policy?.reasonCategory) === SAFETY_RESTRICTION_REASON && policy?.allowed === false && blockedUntilMs(policy) > nowMs
}
function sortRuntimeRows(rows = []) {
  return [...rows].sort((a, b) => {
    const timeDelta = Date.parse(b?.changedAt || '') - Date.parse(a?.changedAt || '')
    if (Number.isFinite(timeDelta) && timeDelta !== 0) return timeDelta
    return Number(b?.sequence || 0) - Number(a?.sequence || 0)
  })
}
async function readRecentUserRows(collection, userId = '') {
  if (!collection?.find) return []
  return collection.find({ userId: str(userId) }).sort({ changedAt: -1, sequence: -1 }).limit(QL7_SUPPORT_RECENT_STATE_LIMIT).toArray()
}
function activeSafetyPolicy(rows = [], nowMs = Date.now(), locale = 'en') {
  const policies = rows
    .map((row) => normalizeQl7SupportInputPolicy(row?.inputPolicy || {}, { now: () => nowMs, locale: row?.inputPolicy?.locale || locale }))
    .filter((policy) => isActiveSafetyRestriction(policy, nowMs))
    .sort((a, b) => blockedUntilMs(b) - blockedUntilMs(a))
  return policies[0] || null
}

function runtimeHistoryEvent(doc = {}) {
  return {
    eventId: str(doc.eventId),
    sequence: Number(doc.sequence || 0),
    state: normalizeQl7SupportRuntimeState(doc.state),
    detailCode: str(doc.detailCode),
    caseId: str(doc.caseId),
    correlationId: str(doc.correlationId),
    changedAt: str(doc.changedAt),
    finalMessageId: str(doc.finalMessageId),
    surfaceHash: str(doc.surfaceHash),
    inputPolicy: doc.inputPolicy && typeof doc.inputPolicy === 'object' ? doc.inputPolicy : null,
  }
}

function mergeRuntimeHistory(rows = [], correlationId = '') {
  const wanted = str(correlationId)
  const seen = new Set()
  const events = []
  for (const row of rows) {
    const candidates = Array.isArray(row?.history) && row.history.length ? row.history : [runtimeHistoryEvent(row)]
    for (const raw of candidates) {
      if (wanted && str(raw?.correlationId) !== wanted) continue
      const event = runtimeHistoryEvent(raw)
      const key = event.eventId || `${event.correlationId}:${event.changedAt}:${event.sequence}:${event.state}`
      if (seen.has(key)) continue
      seen.add(key)
      events.push(event)
    }
  }
  return events
    .sort((a, b) => {
      const timeDelta = Date.parse(a.changedAt || '') - Date.parse(b.changedAt || '')
      if (Number.isFinite(timeDelta) && timeDelta !== 0) return timeDelta
      return Number(a.sequence || 0) - Number(b.sequence || 0)
    })
    .slice(-64)
}

export function normalizeQl7SupportRuntimeState(value = '') {
  const clean = str(value).toLowerCase()
  if (clean === 'delivered') return 'answer_committed'
  if (clean === 'ready_for_input') return 'input_ready'
  return QL7_SUPPORT_RUNTIME_STATES.includes(clean) ? clean : 'idle'
}

export async function publishQl7SupportRuntimeState({
  database,
  userId = '',
  caseId = '',
  correlationId = '',
  state = 'idle',
  detailCode = '',
  triggeringUserMessageId = '',
  finalMessageId = '',
  surfaceHash = '',
  attemptId = '',
  sequence = null,
  clock = Date.now,
  ttlMs = 15 * 60 * 1000,
  inputPolicy = null,
  locale = 'en',
} = {}) {
  if (!database?.collection) return null
  const collection = database.collection(QL7_SUPPORT_UI_EVENT_COLLECTION)
  const nowMs = currentMs(clock)
  const at = new Date(nowMs).toISOString()
  const id = `support-ui:${hash(`${userId}:${caseId}:${correlationId}`)}`
  const existing = await collection.findOne({ _id: id }).catch(() => null)
  const hasExplicitSequence = sequence !== null && sequence !== undefined && String(sequence).trim() !== '' && Number.isFinite(Number(sequence))
  const nextSequence = hasExplicitSequence ? Number(sequence) : Math.max(0, Number(existing?.sequence || 0)) + 1
  const attempt = str(attemptId || existing?.attemptId || correlationId || id)
  const requestedState = normalizeQl7SupportRuntimeState(state)
  const committedId = str(finalMessageId || (requestedState === 'answer_committed' ? triggeringUserMessageId : '') || existing?.finalMessageId)
  if (requestedState === 'answer_committed' && !committedId) throw new Error('ql7_support_answer_committed_requires_final_message_id')

  let policy = inputPolicy
    ? normalizeQl7SupportInputPolicy(inputPolicy, { now: () => nowMs, locale })
    : buildQl7SupportInputPolicy({ state: requestedState, caseId, locale, now: () => nowMs })
  const recentRows = await readRecentUserRows(collection, userId).catch(() => [])
  const activeSafety = activeSafetyPolicy(recentRows, nowMs, locale)
  const preserveSafetyRestriction = Boolean(activeSafety && (!isActiveSafetyRestriction(policy, nowMs) || blockedUntilMs(activeSafety) > blockedUntilMs(policy)))
  if (preserveSafetyRestriction) {
    policy = normalizeQl7SupportInputPolicy({
      ...activeSafety,
      allowed: false,
      canSend: false,
      runtimeStage: 'cooldown',
      emergencyOverride: false,
      source: 'server',
    }, { now: () => nowMs, locale })
  }
  const normalizedState = preserveSafetyRestriction ? 'cooldown' : requestedState
  const eventId = `${id}:${attempt}:${nextSequence}:${normalizedState}`
  const minimumExpiryMs = nowMs + Math.max(60000, Number(ttlMs || 0))
  const restrictionExpiryMs = isActiveSafetyRestriction(policy, nowMs)
    ? blockedUntilMs(policy) + QL7_SUPPORT_RESTRICTION_TTL_GRACE_MS
    : 0
  const expiresAtMs = Math.max(minimumExpiryMs, restrictionExpiryMs)
  const historyEvent = runtimeHistoryEvent({
    eventId,
    sequence: nextSequence,
    state: normalizedState,
    detailCode: preserveSafetyRestriction ? SAFETY_RESTRICTION_REASON : str(detailCode),
    caseId: str(caseId),
    correlationId: str(correlationId),
    changedAt: at,
    finalMessageId: committedId,
    surfaceHash: str(surfaceHash || existing?.surfaceHash),
    inputPolicy: policy,
  })
  const existingHistory = Array.isArray(existing?.history) ? existing.history : []
  const history = mergeRuntimeHistory([{ history: [...existingHistory, historyEvent] }], correlationId)
  const doc = {
    _id: id,
    eventId,
    userId: str(userId),
    caseId: str(caseId),
    correlationId: str(correlationId),
    attemptId: attempt,
    sequence: nextSequence,
    state: normalizedState,
    detailCode: preserveSafetyRestriction ? SAFETY_RESTRICTION_REASON : str(detailCode),
    inputPolicy: policy,
    triggeringUserMessageId: str(triggeringUserMessageId),
    finalMessageId: committedId,
    surfaceHash: str(surfaceHash || existing?.surfaceHash),
    changedAt: at,
    serverTime: at,
    expiresAt: new Date(expiresAtMs).toISOString(),
    storagePrimary: 'mongo',
    history,
  }
  await collection.updateOne(
    { _id: id, sequence: { $lt: nextSequence } },
    { $set: doc, $setOnInsert: { createdAt: at } },
    { upsert: true },
  ).catch(async () => collection.updateOne(
    { _id: id },
    { $set: doc, $setOnInsert: { createdAt: at } },
    { upsert: true },
  ))
  return doc
}

export async function readQl7SupportRuntimeState({ database, userId = '', correlationId = '', clock = Date.now } = {}) {
  if (!database?.collection) return null
  const nowMs = currentMs(clock)
  const collection = database.collection(QL7_SUPPORT_UI_EVENT_COLLECTION)
  const allRows = await readRecentUserRows(collection, userId)
  const scopedRows = str(correlationId) ? allRows.filter((row) => str(row?.correlationId) === str(correlationId)) : allRows
  const activeSafetyRows = allRows.filter((row) => isActiveSafetyRestriction(
    normalizeQl7SupportInputPolicy(row?.inputPolicy || {}, { now: () => nowMs, locale: row?.inputPolicy?.locale || 'en' }),
    nowMs,
  ))
  const activeSafetyRow = activeSafetyRows.sort((a, b) => blockedUntilMs(b?.inputPolicy) - blockedUntilMs(a?.inputPolicy))[0] || null
  const doc = activeSafetyRow || sortRuntimeRows(scopedRows)[0] || null
  if (!doc) return null
  const history = mergeRuntimeHistory(scopedRows, correlationId)
  const normalizedPolicy = normalizeQl7SupportInputPolicy(doc.inputPolicy || {}, { now: () => nowMs, locale: doc.inputPolicy?.locale || 'en' })
  if (isActiveSafetyRestriction(normalizedPolicy, nowMs)) {
    return { ...doc, state: 'cooldown', expired: false, inputPolicy: normalizedPolicy, history }
  }
  if (str(doc?.inputPolicy?.reasonCode || doc?.inputPolicy?.reasonCategory) === SAFETY_RESTRICTION_REASON && normalizedPolicy.allowed) {
    return {
      ...doc,
      state: 'input_ready',
      detailCode: 'safety_restriction_expired',
      expired: false,
      history,
      inputPolicy: normalizeQl7SupportInputPolicy({
        ...normalizedPolicy,
        allowed: true,
        canSend: true,
        blockedUntilMs: 0,
        reasonCode: 'ready',
        reasonCategory: 'ready',
        runtimeStage: 'input_ready',
        emergencyOverride: true,
      }, { now: () => nowMs, locale: normalizedPolicy.locale || 'en' }),
    }
  }
  if (Date.parse(doc.expiresAt || '') < nowMs) {
    const readyPolicy = normalizeQl7SupportInputPolicy({
      ...normalizedPolicy,
      allowed: true,
      canSend: true,
      blockedUntilMs: 0,
      reasonCode: 'ready',
      reasonCategory: 'ready',
      runtimeStage: 'input_ready',
      emergencyOverride: true,
    }, { now: () => nowMs, locale: normalizedPolicy.locale || 'en' })
    return {
      ...doc,
      state: 'input_ready',
      detailCode: 'runtime_event_expired_ready',
      expired: true,
      inputPolicy: readyPolicy,
      history,
    }
  }
  return { ...doc, expired: false, inputPolicy: normalizedPolicy, history }
}
