import { getQl7SupportTopicLabel } from '../ecosystemCatalog.js'
import { getQl7NativeCopy } from '../language/nativeBanks.js'

export function buildQl7SupportBadges({ plan = {}, locale = 'en' } = {}) {
  const p = getQl7NativeCopy(locale).badges
  const out = []
  if (plan.resultKind === 'verified') out.push({ id: 'verified', label: p.verified, tone: 'success', icon: 'confirmed' })
  else if (plan.resultKind === 'verified_empty') out.push({ id: 'verified-empty', label: p.empty, tone: 'success', icon: 'confirmed' })
  else if (plan.resultKind === 'unavailable') out.push({ id: 'unavailable', label: p.unavailable, tone: 'neutral', icon: 'unavailable' })
  else if (plan.safetyBoundary?.category === 'direct_insult') out.push({ id: 'warning', label: plan.safetyBoundary.cooldownMs ? p.blocked : p.warning, tone: 'warning', icon: plan.safetyBoundary.cooldownMs ? 'blocked' : 'warning' })
  else if (plan.safetyBoundary?.category === 'credible_threat') out.push({ id: 'blocked', label: p.blocked, tone: 'danger', icon: 'blocked' })
  const topic = String(plan.topic || '').trim()
  const topicLabel = topic && topic !== 'support_system' ? getQl7SupportTopicLabel(topic, locale) : ''
  if (topicLabel && !out.some((badge) => String(badge.label || '').toLowerCase() === topicLabel.toLowerCase())) {
    out.push({ id: `topic-${topic}`, label: topicLabel, tone: plan.resultKind === 'verified' ? 'success' : 'info', icon: plan.semanticRole || topic })
  }
  if (plan.operatorHandoff?.required) out.push({ id: 'operator-pending', label: p.operator, tone: 'accent', icon: 'operator' })
  return Object.freeze(out.slice(0, 4))
}
