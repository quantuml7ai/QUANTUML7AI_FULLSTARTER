export const QL7_SUPPORT_SAFETY_ESCALATION_LEDGER_VERSION = '12.0.0'

function str(value) { return String(value ?? '').trim() }

export function classifyQl7SupportSafetyEvent({ tone = {}, text = '' } = {}) {
  const category = str(tone.taxonomyCategory || tone.category)
  if (tone.threat || tone.safetyEscalation || ['threat', 'hate', 'harassment', 'sexual_harassment'].includes(category)) return 'threat'
  if (tone.promptInjection || category === 'prompt_injection') return 'injection'
  if (tone.profane || tone.insult || tone.hostile || tone.profanityDetected || ['insult_to_support', 'insult_to_user', 'profanity_context_unknown'].includes(category)) return 'rude'
  if (/\b(?:kill you|bomb|terror)\b|(?:убью|теракт|взорву)/iu.test(str(text))) return 'threat'
  return 'none'
}

export function buildQl7SupportSafetyEscalation({ tone = {}, text = '', priorRudeCount = 0, nowMs = Date.now() } = {}) {
  const event = classifyQl7SupportSafetyEvent({ tone, text })
  const rudeIndex = Math.max(0, Number(priorRudeCount || 0)) + (event === 'rude' ? 1 : 0)
  let cooldownMs = 0
  let action = 'allow'
  let operatorHandoff = false
  let badgeKey = ''
  if (event === 'rude') {
    if (rudeIndex <= 1) { action = 'warn'; badgeKey = 'warning' }
    else if (rudeIndex === 2) { action = 'cooldown'; cooldownMs = 60 * 1000; badgeKey = 'stop' }
    else { action = 'cooldown'; cooldownMs = 5 * 60 * 1000; badgeKey = 'stop' }
  } else if (event === 'threat') {
    action = 'safety_review'
    cooldownMs = 30 * 60 * 1000
    operatorHandoff = true
    badgeKey = 'operator'
  } else if (event === 'injection') {
    action = 'cooldown'
    cooldownMs = 45 * 1000
    badgeKey = 'warning'
  }
  return Object.freeze({
    version: QL7_SUPPORT_SAFETY_ESCALATION_LEDGER_VERSION,
    event,
    action,
    priorRudeCount: Math.max(0, Number(priorRudeCount || 0)),
    rudeCount: rudeIndex,
    cooldownMs,
    readyAtMs: Number(nowMs || Date.now()) + cooldownMs,
    operatorHandoff,
    badgeKey,
  })
}
