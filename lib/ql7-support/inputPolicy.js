import {getQl7NativeCopy} from './language/nativeBanks.js'

const READY_STATES = new Set(['idle', 'ready', 'ready_for_input', 'waiting_user', 'waiting_choice', 'clarifying', 'input_ready', 'completed', 'answer_committed'])
const LOCK_STATES = new Set(['receiving', 'validating', 'verifying_actor', 'resolving_identity', 'redacting', 'translating_in', 'understanding', 'analyzing', 'classifying', 'planning', 'retrieving', 'checking_evidence', 'diagnosing', 'aggregating', 'rendering_user', 'preparing_result', 'preparing_card', 'preparing_admin_report', 'composing', 'translating_out', 'policy_guard', 'committing', 'sending'])
const MAX_COOLDOWN_MS = 30 * 60 * 1000
const EMERGENCY = /(?:срочно|опасност|угрожают\s+жизни|хочу\s+(?:умереть|не\s+жить)|не\s+хочу\s+жить|покончу\s+с\s+собой|что[-\s]?то\s+с\s+собой|навредить\s+себе|само(?:вред|убий)|су[еиы]цид|не\s+хочу\s+жити|заподіяти\s+собі\s+шкоду|immediate\s+danger|emergency|kill\s+myself|hurt\s+myself|self[-\s]?harm|suicide|end\s+(?:it\s+all|my\s+life)|take\s+my\s+life|quiero\s+morir|hacerme\s+daño|kendime\s+zarar|ölmek\s+istiyorum|خطر|انتحار|أؤذي\s+نفسي|自杀|不想活|伤害自己|סכנה|להתאבד|לפגוע\s+בעצמי)/iu

function str(value) { return String(value ?? '').trim() }
function localeKey(value = 'en') { return str(value).toLowerCase().split(/[-_]/u)[0] || 'en' }
function currentMs(now) { return typeof now === 'function' ? Number(now()) : Number(now || Date.now()) }
function copy(locale) { return getQl7NativeCopy(locale).composer }
function timestamp(value) {
  const parsed = Date.parse(str(value))
  return Number.isFinite(parsed) ? parsed : 0
}

function fallbackCooldownMs(policy = {}) {
  const reason = str(policy.reasonCode || policy.reasonCategory)
  if (reason === 'safety_review') return MAX_COOLDOWN_MS
  if (reason === 'spam_cooldown') return 15_000
  return 6500
}

function resolveBlockedUntilMs(policy = {}, nowMs = Date.now()) {
  const explicitAllowed = policy.allowed !== undefined ? policy.allowed : policy.canSend
  const issuedAtMs = timestamp(policy.issuedAt) || timestamp(policy.serverNow)
  const declaredMs = Math.max(0, Math.min(MAX_COOLDOWN_MS, Number(policy.totalCooldownMs || policy.cooldownMs || policy.remainingMs || 0)))
  const explicit = Number(
    policy.blockedUntilMs ||
    timestamp(policy.blockedUntil) ||
    policy.readyAtMs ||
    timestamp(policy.readyAt) ||
    timestamp(policy.expiresAt) ||
    0,
  )
  if (explicit > 0) {
    const ceilingBase = issuedAtMs > 0 ? issuedAtMs : nowMs
    return Math.min(explicit, ceilingBase + MAX_COOLDOWN_MS)
  }
  if (explicitAllowed === false) {
    const base = issuedAtMs > 0 ? issuedAtMs : nowMs
    return base + (declaredMs || fallbackCooldownMs(policy))
  }
  return 0
}

export function isQl7SupportEmergencyText(text = '') { return EMERGENCY.test(str(text)) }

export function normalizeQl7SupportInputPolicy(policy = {}, { now = Date.now, locale = 'en' } = {}) {
  const nowMs = currentMs(now)
  const lang = localeKey(policy.locale || locale)
  const explicitAllowed = policy.allowed !== undefined ? policy.allowed : policy.canSend
  const blockedUntilMs = resolveBlockedUntilMs(policy, nowMs)
  const blocked = explicitAllowed === false && blockedUntilMs > nowMs
  const expiredBoundedLock = explicitAllowed === false && blockedUntilMs > 0 && blockedUntilMs <= nowMs
  const allowed = blocked ? false : (expiredBoundedLock ? true : explicitAllowed !== false)
  const declaredTotal = Math.max(0, Math.min(MAX_COOLDOWN_MS, Number(policy.totalCooldownMs || policy.cooldownMs || Math.max(0, blockedUntilMs - nowMs))))
  const remainingMs = blocked ? Math.max(0, blockedUntilMs - nowMs) : 0
  const originalReason = str(policy.reasonCode || policy.reasonCategory || (allowed ? 'ready' : 'analysis_in_progress'))
  const staleBlockingReason = allowed && ['safety_review', 'spam_cooldown', 'analysis_in_progress'].includes(originalReason)
  const reasonCode = expiredBoundedLock || staleBlockingReason ? 'ready' : originalReason
  const native = copy(lang)
  const reasonLabel = expiredBoundedLock || staleBlockingReason
    ? native.ready
    : (str(policy.reasonLabel || policy.title) || (
      reasonCode === 'safety_review'
        ? native.safety
        : reasonCode === 'spam_cooldown'
          ? native.spam
          : reasonCode === 'boundary_warning'
            ? native.boundary
            : allowed
              ? native.ready
              : native.analysis
    ))
  const rawRuntimeStage = str(policy.runtimeStage || (allowed ? 'input_ready' : 'cooldown'))
  const staleBlockingStage = allowed && ['cooldown', 'safety_review', 'sending', 'committing', 'policy_guard'].includes(rawRuntimeStage)
  const runtimeStage = expiredBoundedLock || staleBlockingStage ? 'input_ready' : rawRuntimeStage
  const detail = expiredBoundedLock || staleBlockingReason || staleBlockingStage
    ? reasonLabel
    : (str(policy.detail || policy.message) || reasonLabel)

  return Object.freeze({
    version: 14,
    allowed,
    canSend: allowed,
    blockedUntil: blocked ? new Date(blockedUntilMs).toISOString() : '',
    blockedUntilMs: blocked ? blockedUntilMs : 0,
    readyAt: blocked ? new Date(blockedUntilMs).toISOString() : new Date(nowMs).toISOString(),
    readyAtMs: blocked ? blockedUntilMs : nowMs,
    cooldownMs: remainingMs,
    totalCooldownMs: blocked ? Math.max(declaredTotal, remainingMs) : 0,
    remainingMs,
    maxCooldownMs: MAX_COOLDOWN_MS,
    reasonCode,
    reasonCategory: reasonCode,
    reasonLabel,
    detail,
    message: detail,
    severity: expiredBoundedLock || staleBlockingReason || staleBlockingStage ? 'normal' : str(policy.severity || 'normal'),
    escalationLevel: expiredBoundedLock || staleBlockingReason || staleBlockingStage ? 0 : Math.max(0, Number(policy.escalationLevel || 0)),
    canInterrupt: policy.canInterrupt === true,
    emergencyOverride: allowed ? true : (reasonCode !== 'safety_review' && policy.emergencyOverride !== false),
    expectedInputType: expiredBoundedLock || staleBlockingReason || staleBlockingStage ? 'text' : str(policy.expectedInputType || (allowed ? 'text' : 'none')),
    caseId: str(policy.caseId),
    runtimeStage,
    locale: lang,
    serverNow: new Date(nowMs).toISOString(),
    issuedAt: str(policy.issuedAt) || new Date(nowMs).toISOString(),
    expiresAt: blocked ? new Date(blockedUntilMs).toISOString() : '',
    source: 'server',
  })
}

export function buildQl7SupportInputPolicy({ state = 'idle', caseId = '', locale = 'en', tone = {}, safety = null, safetyStrikeCount = 0, duplicateCount = 0, recentMessageCount = 0, expectedInputType = '', now = Date.now } = {}) {
  const nowMs = currentMs(now)
  const stage = str(state).toLowerCase() || 'idle'
  const decision = safety || tone?.safety || {}
  let escalation = Math.max(Number(decision.escalationLevel || 0), Number(safetyStrikeCount || 0))
  let cooldownMs = Math.max(0, Number(decision.cooldownMs || 0))
  let reasonCode = 'ready'
  let severity = str(decision.severity || tone.severity || 'normal')
  const threat = decision.category === 'credible_threat' || decision.threat === true || tone.threat === true || tone.safetyEscalation === true
  const insult = decision.category === 'direct_insult' || decision.insult === true || tone.insult === true || tone.profanityDetected === true

  if (threat) {
    cooldownMs = Math.max(cooldownMs, MAX_COOLDOWN_MS)
    reasonCode = 'safety_review'
    severity = 'critical'
    escalation = Math.max(escalation, 5)
  } else if (insult) {
    if (escalation <= 1) {
      cooldownMs = 0
      reasonCode = 'boundary_warning'
      severity = 'warning'
    } else {
      cooldownMs = Math.max(cooldownMs, escalation === 2 ? 60_000 : escalation === 3 ? 300_000 : 900_000)
      reasonCode = 'spam_cooldown'
      severity = 'elevated'
    }
  }

  const repeats = Math.max(0, Number(duplicateCount || 0))
  const burst = Math.max(0, Number(recentMessageCount || 0))
  if (!threat && !insult && (repeats > 0 || burst >= 3)) {
    cooldownMs = Math.max(cooldownMs, 4500 + repeats * 2500 + Math.max(0, burst - 2) * 1200)
    reasonCode = 'spam_cooldown'
  }
  if (!cooldownMs && LOCK_STATES.has(stage)) {
    cooldownMs = 6500
    reasonCode = 'analysis_in_progress'
  }

  const allowed = cooldownMs <= 0 && (READY_STATES.has(stage) || !LOCK_STATES.has(stage))
  return normalizeQl7SupportInputPolicy({
    allowed,
    blockedUntilMs: allowed ? 0 : nowMs + cooldownMs,
    totalCooldownMs: cooldownMs,
    reasonCode,
    severity,
    escalationLevel: escalation,
    caseId,
    runtimeStage: stage,
    expectedInputType: expectedInputType || (allowed ? 'text' : 'none'),
    locale,
    emergencyOverride: reasonCode !== 'safety_review',
    issuedAt: new Date(nowMs).toISOString(),
  }, { now: () => nowMs, locale })
}

export function buildQl7SupportComposerPolicyFromSafety({ safety = {}, caseId = '', locale = 'en', now = Date.now } = {}) {
  return buildQl7SupportInputPolicy({ state: safety.cooldownMs ? 'cooldown' : 'input_ready', caseId, locale, safety, now, expectedInputType: safety.cooldownMs ? 'none' : 'text' })
}

export function evaluateQl7SupportInputAttempt({ policy = {}, text = '', now = Date.now, locale = 'en' } = {}) {
  const normalized = normalizeQl7SupportInputPolicy(policy, { now, locale })
  if (normalized.allowed) return { allowed: true, reason: 'ready', policy: normalized }
  if (normalized.reasonCode !== 'safety_review' && normalized.emergencyOverride && isQl7SupportEmergencyText(text)) {
    return {
      allowed: true,
      reason: 'emergency_override',
      policy: normalizeQl7SupportInputPolicy({ ...normalized, allowed: true, canSend: true, reasonCode: 'ready', blockedUntilMs: 0, runtimeStage: 'input_ready' }, { now, locale }),
    }
  }
  return { allowed: false, reason: normalized.reasonCode, policy: normalized }
}
