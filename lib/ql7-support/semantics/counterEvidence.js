export const QL7_SUPPORT_COUNTER_EVIDENCE_VERSION = '5.1.1'

const TARGET_DENIAL = /(?:not you|not about you|не тебе|не про тебя|не вам|не тобі|не про тебе|не про вас)/iu
const EDUCATIONAL_CONTEXT = /(?:education|educational|учеб|навч|истор|history|news|новост|новин|research|исследован)/iu

function row(code, strength, source = 'runtime-context', details = {}) {
  return Object.freeze({
    code,
    strength: Math.max(0, Math.min(1, Number(strength || 0))),
    source,
    ...details,
  })
}

export function collectQl7CounterEvidence({
  text = '',
  analysis = {},
  negation = {},
  quotation = {},
} = {}) {
  const source = String(text || '')
  const rows = []

  if (quotation?.quoted || quotation?.reported) {
    rows.push(row('quoted_or_reported_speech', 0.95, 'quotation-resolver', {
      spanCount: Number(quotation?.quotedMatches?.length || 0),
    }))
  }
  if (quotation?.counterSpeech) {
    rows.push(row('counter_speech', 0.98, 'quotation-resolver'))
  }
  if (negation?.hasNegation) {
    rows.push(row('negation_scope_present', 0.9, 'negation-resolver', {
      spanCount: Number(negation?.matches?.length || 0),
    }))
  }
  if (TARGET_DENIAL.test(source)) {
    rows.push(row('target_denial', 0.98, 'lexical-target-denial'))
  }
  if (EDUCATIONAL_CONTEXT.test(source)) {
    rows.push(row('educational_historical_news_context', 0.9, 'context-purpose'))
  }
  if (analysis?.emotionAssessment?.evidenceStrength === 'none') {
    rows.push(row('no_emotion_evidence', 0.8, 'emotion-assessment'))
  }
  if (analysis?.safety?.actionability === 'none' || analysis?.actionability === 'none') {
    rows.push(row('no_operational_actionability', 0.92, 'safety-actionability'))
  }
  if (analysis?.targetScope === 'none' || analysis?.safety?.targetScope === 'none') {
    rows.push(row('no_target_scope', 0.9, 'target-arbitration'))
  }

  return Object.freeze(rows)
}
