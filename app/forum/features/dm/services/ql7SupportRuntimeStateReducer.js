export const QL7_SUPPORT_CLIENT_RUNTIME_REDUCER_VERSION = '5.4.0'

const PHASE_RANK = Object.freeze({
  idle: 0,
  receiving: 10,
  validating: 15,
  verifying_actor: 20,
  resolving_identity: 25,
  redacting: 30,
  translating_in: 35,
  understanding: 40,
  analyzing: 42,
  classifying: 45,
  clarifying: 47,
  merging_memory: 48,
  planning: 50,
  retrieving: 52,
  checking_evidence: 54,
  diagnosing: 55,
  aggregating: 57,
  composing: 60,
  rendering_user: 62,
  preparing_result: 64,
  preparing_card: 65,
  preparing_admin_report: 66,
  translating_out: 68,
  policy_guard: 70,
  committing: 72,
  sending: 74,
  queued_email: 76,
  delivered: 80,
  answer_committed: 80,
  answer_ready: 90,
  input_ready: 90,
  ready_for_input: 90,
  cooldown: 90,
  waiting_choice: 90,
  waiting_user: 90,
  waiting_admin: 90,
  safety_review: 90,
  completed: 100,
  abandoned: 100,
  cancelled: 100,
  unavailable: 100,
  temporarily_unavailable: 100,
  timeout: 100,
  error: 100,
  offline: 100,
})

const TERMINAL = new Set([
  'answer_ready', 'input_ready', 'ready_for_input', 'cooldown', 'waiting_choice',
  'waiting_user', 'waiting_admin', 'completed', 'abandoned', 'cancelled',
  'unavailable', 'temporarily_unavailable', 'timeout', 'error', 'offline',
])

const clean = (value) => String(value ?? '').trim()
const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function projectQl7SupportRuntimeOrder(event = {}) {
  const receipt = event?.stateReceipt && typeof event.stateReceipt === 'object' ? event.stateReceipt : null
  const state = clean(event?.supportUiState || event?.state || receipt?.phase || 'idle').toLowerCase()
  const sequence = numeric(event?.sequence ?? receipt?.sequence, 0)
  const stateVersion = numeric(event?.stateVersion ?? receipt?.stateVersion, sequence)
  const phaseRank = numeric(event?.phaseRank ?? receipt?.phaseRank, PHASE_RANK[state] || 0)
  const changedAtMs = numeric(event?.changedAt, Date.parse(event?.changedAtServerUtc || event?.changedAt || '') || 0)
  const correlationId = clean(event?.correlationId || receipt?.correlationId)
  const attemptId = clean(event?.attemptId || receipt?.attemptId || correlationId)
  const terminal = event?.terminal === true || receipt?.terminal === true || TERMINAL.has(state)
  return Object.freeze({ state, sequence, stateVersion, phaseRank, changedAtMs, correlationId, attemptId, terminal })
}

export function shouldApplyQl7SupportRuntimeEvent(previous = {}, incoming = {}) {
  const prev = projectQl7SupportRuntimeOrder(previous)
  const next = projectQl7SupportRuntimeOrder(incoming)

  if (!prev.correlationId && !prev.attemptId && prev.sequence <= 0 && prev.changedAtMs <= 0) return true

  const sameCorrelation = !prev.correlationId || !next.correlationId || prev.correlationId === next.correlationId
  const sameAttempt = !prev.attemptId || !next.attemptId || prev.attemptId === next.attemptId

  if (sameAttempt && sameCorrelation) {
    if (next.sequence > 0 && prev.sequence > 0) {
      if (next.sequence < prev.sequence) return false
      if (next.sequence === prev.sequence && next.stateVersion <= prev.stateVersion) return false
    } else if (next.stateVersion > 0 && prev.stateVersion > 0 && next.stateVersion <= prev.stateVersion) {
      return false
    } else if (next.changedAtMs > 0 && prev.changedAtMs > 0 && next.changedAtMs < prev.changedAtMs) {
      return false
    }
    if (prev.terminal && !next.terminal) return false
    if (!next.terminal && next.phaseRank < prev.phaseRank) return false
    return true
  }

  // A different attempt is allowed only when it is materially newer. This prevents a late
  // response from an old poll/history request from stealing the visible state from the active turn.
  if (next.sequence > 0 && prev.sequence > 0 && next.sequence <= prev.sequence) return false
  if (next.changedAtMs > 0 && prev.changedAtMs > 0 && next.changedAtMs < prev.changedAtMs) return false
  return true
}

export function sortQl7SupportRuntimeHistory(events = []) {
  return [...(Array.isArray(events) ? events : [])].sort((a, b) => {
    const aa = projectQl7SupportRuntimeOrder(a)
    const bb = projectQl7SupportRuntimeOrder(b)
    if (aa.sequence !== bb.sequence) return aa.sequence - bb.sequence
    if (aa.stateVersion !== bb.stateVersion) return aa.stateVersion - bb.stateVersion
    return aa.changedAtMs - bb.changedAtMs
  })
}

export function auditQl7SupportRuntimeClientReducer() {
  const ready = { correlationId: 'c', attemptId: 'a', sequence: 8, stateVersion: 8, supportUiState: 'answer_ready', phaseRank: 90, terminal: true, changedAt: 800 }
  const stale = { correlationId: 'c', attemptId: 'a', sequence: 7, stateVersion: 7, supportUiState: 'preparing_response', phaseRank: 64, terminal: false, changedAt: 700 }
  const duplicate = { ...ready }
  const newer = { correlationId: 'd', attemptId: 'b', sequence: 9, stateVersion: 9, supportUiState: 'receiving', phaseRank: 10, terminal: false, changedAt: 900 }
  const failures = []
  if (shouldApplyQl7SupportRuntimeEvent(ready, stale)) failures.push('terminal_regressed_to_stale')
  if (shouldApplyQl7SupportRuntimeEvent(ready, duplicate)) failures.push('duplicate_sequence_reapplied')
  if (!shouldApplyQl7SupportRuntimeEvent(ready, newer)) failures.push('new_attempt_rejected')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}
