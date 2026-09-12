import {QL7_SUPPORT_ECOSYSTEM_TOPICS, getQl7SupportTopicLabel, normalizeQl7SupportTopic} from '../ecosystemCatalog.js'
import {getQl7NativeCopy} from '../language/nativeBanks.js'

export function buildQl7SupportBadges({ plan = {}, locale = 'en' } = {}) {
  const p = getQl7NativeCopy(locale).badges
  const out = []
  if (plan.resultKind === 'verified') out.push({ id: 'verified', label: p.verified, tone: 'success', icon: 'confirmed' })
  else if (plan.resultKind === 'verified_empty') out.push({ id: 'verified-empty', label: p.empty, tone: 'success', icon: 'confirmed' })
  else if (plan.resultKind === 'unavailable') out.push({ id: 'unavailable', label: p.unavailable, tone: 'neutral', icon: 'unavailable' })
  else if (plan.safetyBoundary?.category === 'direct_insult') out.push({ id: 'warning', label: plan.safetyBoundary.cooldownMs ? p.blocked : p.warning, tone: 'warning', icon: plan.safetyBoundary.cooldownMs ? 'blocked' : 'warning' })
  else if (plan.safetyBoundary?.category === 'credible_threat') out.push({ id: 'blocked', label: p.blocked, tone: 'danger', icon: 'blocked' })
  const topic = String(plan.topic || '').trim()
  // Topic badges are ecosystem navigation metadata, not a fallback identity badge.
  // General-human/open-subject/public-figure topics are intentionally outside the
  // ecosystem topic registry; passing them through getQl7SupportTopicLabel() would
  // fall back to support_system and inject an unnecessary "QL7 Support" badge.
  // That structural brand then correctly fails the final language-purity gate.
  // Keep the gate strict and stop creating the invalid surface instead.
  const canonicalTopic = topic ? normalizeQl7SupportTopic(topic) : ''
  const ecosystemTopic = canonicalTopic && QL7_SUPPORT_ECOSYSTEM_TOPICS.includes(canonicalTopic)
  const topicLabel = ecosystemTopic && canonicalTopic !== 'support_system'
    ? getQl7SupportTopicLabel(canonicalTopic, locale)
    : ''
  if (topicLabel && !out.some((badge) => String(badge.label || '').toLowerCase() === topicLabel.toLowerCase())) {
    out.push({ id: `topic-${canonicalTopic}`, label: topicLabel, tone: plan.resultKind === 'verified' ? 'success' : 'info', icon: plan.semanticRole || canonicalTopic })
  }
  if (plan.operatorHandoff?.required) out.push({ id: 'operator-pending', label: p.operator, tone: 'accent', icon: 'operator' })
  return Object.freeze(out.slice(0, 4))
}
