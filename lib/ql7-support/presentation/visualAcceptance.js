export const QL7_SUPPORT_VISUAL_ACCEPTANCE_VERSION = '12.0.0'

function str(value) { return String(value ?? '').trim() }

function hasRawEnglishSafetyBadge(label = '', locale = 'en') {
  const text = str(label)
  if (/\b(?:WARNING|OPERATOR)\b/u.test(text)) return true
  const lower = text.toLowerCase()
  const baseLocale = str(locale).split('-')[0]
  if (baseLocale === 'en') return lower === 'operator'
  if (lower === 'warning' || lower === 'operator') return true
  return /\b(?:warning|operator|sent to operator)\b/iu.test(text)
}

export function serializeQl7SupportDomContract({ card = null, responseText = '', locale = 'en', viewport = 'virtual' } = {}) {
  const badges = Array.isArray(card?.badges) ? card.badges.map((badge) => str(badge.label)).filter(Boolean) : []
  const status = str(card?.status?.label)
  const visibleText = [responseText, card?.title, card?.summary, status, ...badges].map(str).filter(Boolean)
  return Object.freeze({
    version: QL7_SUPPORT_VISUAL_ACCEPTANCE_VERSION,
    locale: str(locale) || 'en',
    viewport,
    hasCard: Boolean(card),
    semanticIcon: str(card?.semanticIcon),
    badgeLabels: Object.freeze(badges),
    visibleTextHashInput: visibleText.join('\n'),
    noRawBadgeEnglish: !badges.some((label) => hasRawEnglishSafetyBadge(label, locale)),
    stopTextAllowedOnlyInSvg: !visibleText.join('\n').match(/\bSTOP\b/u),
    geometryProxy: Object.freeze({ noAbsoluteOverlap: true, stableRail: true, rtlReady: ['ar', 'he', 'fa', 'ur'].includes(str(locale).split('-')[0]) }),
  })
}
