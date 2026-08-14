import { buildQl7SupportCardV3 } from '../cardSchemaV3.js'
import { buildQl7SupportCardV4, validateQl7SupportCardV4 } from '../cardSchemaV4.js'
import { validateQl7SupportCardAnyVersion } from '../cards.js'
import { applyQl7SupportEmotionalPresentationV11 } from '../emotionalPresentationV11.js'
import { localizeQl7SupportBadgeRailLabelV11_6 } from '../semanticBadgeRegistryV11_6.js'

export const QL7_SUPPORT_PREMIUM_CARD_LAYOUT_VERSION_V12 = '12.0.0'

function str(value) { return String(value ?? '').trim() }
function hasEvidenceValue(value) {
  if (value === 0 || value === false) return true
  if (value === undefined || value === null || str(value) === '') return false
  if (Array.isArray(value)) return value.some(hasEvidenceValue)
  if (typeof value === 'object') return Object.entries(value).some(([key, child]) => {
    if (/^(?:status|branch|source|sourceStatus|adapterId|error|errors|raw|query|asOf|updatedAt|checkedAt|generatedAt)$/iu.test(str(key))) return false
    return hasEvidenceValue(child)
  })
  return true
}
function shouldStampAsVerified(cardSpec = {}) {
  const kind = `${cardSpec.kind || ''} ${cardSpec.purpose || ''} ${cardSpec.status || cardSpec.branch || ''}`
  const conversational = /choice|clarification|conversation|social|humor|partnership|greeting|notice|pending/iu.test(kind)
  const verifiedKind = /diagnostic|data_table|case_result|qcoin|ads|vip|payment|moderation|security|safety|restriction|success|healthy|active|confirmed|inconsistent|expired/iu.test(kind)
  const evidence = hasEvidenceValue(cardSpec.table?.rows) || hasEvidenceValue(cardSpec.metrics) || hasEvidenceValue(cardSpec.facts) || hasEvidenceValue(cardSpec.checks)
  return (verifiedKind || evidence) && !conversational
}

export function buildQl7SupportPremiumCardV12({ cardSpec = null, requestContext = {}, replyPlan = {}, locale = 'en', tone = {}, sourceText = '', version = 4 } = {}) {
  if (!cardSpec || typeof cardSpec !== 'object') {
    return Object.freeze({ version: QL7_SUPPORT_PREMIUM_CARD_LAYOUT_VERSION_V12, card: null, validation: { ok: true, skipped: true }, visibleBadges: Object.freeze([]) })
  }
  const emotional = applyQl7SupportEmotionalPresentationV11({
    cardSpec,
    text: sourceText,
    translatedText: requestContext?.analysis?.canonicalText || requestContext?.analysis?.translatedText || '',
    tone,
    messageAct: requestContext?.messageAct || requestContext?.analysis?.messageAct || requestContext?.role,
  })
  const input = {
    ...emotional,
    locale,
    caseId: emotional.caseId || requestContext.caseId || 'ql7-support-v12-case',
    ...(shouldStampAsVerified(emotional) && (emotional.checkedAt || emotional.asOf || replyPlan.userFacingAsOf) ? { asOf: emotional.checkedAt || emotional.asOf || replyPlan.userFacingAsOf } : {}),
  }
  const card = Number(version) === 4 ? buildQl7SupportCardV4(input) : buildQl7SupportCardV3(input)
  const validation = Number(card?.version) === 4 ? validateQl7SupportCardV4(card) : validateQl7SupportCardAnyVersion(card)
  const visibleBadges = Object.freeze((Array.isArray(card?.badges) ? card.badges : []).map((badge) => ({
    id: str(badge.id),
    tone: str(badge.tone),
    label: localizeQl7SupportBadgeRailLabelV11_6(badge, locale),
    icon: str(badge.icon),
  })).filter((badge) => badge.label))
  return Object.freeze({
    version: QL7_SUPPORT_PREMIUM_CARD_LAYOUT_VERSION_V12,
    card,
    validation,
    visibleBadges,
    layoutContract: Object.freeze({ noNestedCards: true, stableBadgeRail: true, svgStopGraphicOnly: str(card?.semanticIcon) === 'stop' }),
  })
}
