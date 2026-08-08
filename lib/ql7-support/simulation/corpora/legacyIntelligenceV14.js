import {
  QL7_SUPPORT_BREADTH_SEMANTIC_CASES_V11,
} from '../../conversationBreadthCorpusV11.js'
import {
  QL7_SUPPORT_HUMAN_MATERIAL_CASES_V11,
} from '../../humanConversationCorpusV11.js'

export const QL7_SUPPORT_LEGACY_INTELLIGENCE_CORPUS_VERSION = '15.1.0'

const MATERIAL = Object.freeze([
  ...QL7_SUPPORT_BREADTH_SEMANTIC_CASES_V11.map(([locale, text, topic, subIntent]) => Object.freeze({
    source: 'conversationBreadthCorpusV11', locale, text, topic, subIntent,
  })),
  ...QL7_SUPPORT_HUMAN_MATERIAL_CASES_V11.map(([locale, text, topic]) => Object.freeze({
    source: 'humanConversationCorpusV11', locale, text, topic, subIntent: 'material_dialogue',
  })),
])

export const QL7_SUPPORT_LEGACY_INTELLIGENCE_CORPUS_COVERAGE = Object.freeze({
  version: QL7_SUPPORT_LEGACY_INTELLIGENCE_CORPUS_VERSION,
  rows: MATERIAL.length,
  locales: Object.freeze([...new Set(MATERIAL.map((row) => row.locale))].sort()),
  topics: Object.freeze([...new Set(MATERIAL.map((row) => row.topic))].sort()),
  sources: Object.freeze([...new Set(MATERIAL.map((row) => row.source))].sort()),
  productionImported: false,
  laboratoryOnly: true,
})

export function getQl7SupportLegacyIntelligenceCase(index = 0, locale = '') {
  const localized = MATERIAL.filter((row) => !locale || row.locale === locale)
  const rows = localized.length ? localized : MATERIAL
  return rows[Math.abs(Number(index) || 0) % rows.length]
}
