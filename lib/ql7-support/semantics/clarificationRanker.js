import {ql7StableHash} from '../internal/text.js'
import {QL7_SUPPORT_CLARIFICATION_STRATEGIES} from './clarificationStrategyRegistry.js'

export const QL7_SUPPORT_CLARIFICATION_RANKER_VERSION = '5.2.2'
export const QL7_SUPPORT_MAX_VISIBLE_CLARIFICATION_OPTIONS = 4

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const clamp01 = (value) => Math.max(0, Math.min(1, finite(value)))

function candidateProbability(row = {}, index = 0) {
  const direct = finite(row.posterior ?? row.probability, NaN)
  if (Number.isFinite(direct)) return clamp01(direct)
  const score = Math.max(0, finite(row.total ?? row.score, 0))
  return score > 0 ? score : 1 / Math.max(1, index + 1)
}

function normalizeHypotheses(rows = []) {
  const raw = (Array.isArray(rows) ? rows : []).slice(0, 8).map((row, index) => ({
    id: String(row.candidateId || row.topic || row.intent || row.id || `candidate_${index}`),
    probability: candidateProbability(row, index),
    source: row,
  }))
  const total = raw.reduce((sum, row) => sum + row.probability, 0) || 1
  return raw.map((row) => Object.freeze({ ...row, probability: row.probability / total }))
}

function entropy(rows = []) {
  return -rows.reduce((sum, row) => row.probability > 0 ? sum + row.probability * Math.log(row.probability) : sum, 0)
}

function informationGain(strategy, hypotheses, context = {}) {
  if (hypotheses.length < 2) return 0
  const before = entropy(hypotheses)
  const top = hypotheses[0]?.probability || 0
  const second = hypotheses[1]?.probability || 0
  const separation = Math.max(0, top - second)
  const focusBonus = strategy.focus === context.missingSlot ? 0.28 : 0
  const contrastBonus = strategy.contrast === 'top2' ? 0.22 : strategy.contrast === 'top3' && hypotheses.length >= 3 ? 0.16 : 0.08
  const formBonus = strategy.form === 'contrastive' ? 0.12 : strategy.form === 'single_slot' ? 0.1 : 0.04
  const uncertainty = Math.max(0, before) * Math.max(0.2, 1 - separation)
  return uncertainty + focusBonus + contrastBonus + formBonus
}

function repetitionPenalty(strategy, memory = {}) {
  const recent = new Set(Array.isArray(memory?.clarificationStrategyIds) ? memory.clarificationStrategyIds : [])
  return recent.has(strategy.strategyId) ? 1.2 : 0
}

export function rankQl7SupportClarifications({
  hypotheses = [],
  decisionMathReceipt = {},
  memory = {},
  missingSlot = '',
  locale = 'en',
} = {}) {
  const normalized = normalizeHypotheses(hypotheses)
  const rows = QL7_SUPPORT_CLARIFICATION_STRATEGIES.map((strategy) => {
    const gain = informationGain(strategy, normalized, { missingSlot })
    const repeatPenalty = repetitionPenalty(strategy, memory)
    const tonePenalty = decisionMathReceipt?.decisionKind === 'restriction' && strategy.tone === 'supportive' ? 0.08 : 0
    const score = gain - repeatPenalty - tonePenalty
    return Object.freeze({
      strategyId: strategy.strategyId,
      focus: strategy.focus,
      contrast: strategy.contrast,
      tone: strategy.tone,
      form: strategy.form,
      expectedInformationGain: Number(gain.toFixed(8)),
      repetitionPenalty: Number(repeatPenalty.toFixed(8)),
      score: Number(score.toFixed(8)),
      readyToSend: false,
      finalText: false,
    })
  }).sort((a, b) => b.score - a.score || a.strategyId.localeCompare(b.strategyId))

  const selected = rows[0] || null
  const visibleOptions = normalized.slice(0, QL7_SUPPORT_MAX_VISIBLE_CLARIFICATION_OPTIONS).map((row) => Object.freeze({
    hypothesisId: row.id,
    probability: Number(row.probability.toFixed(8)),
    semanticOnly: true,
  }))

  const body = {
    schema: 'ql7.support.clarification-ranking',
    schemaVersion: QL7_SUPPORT_CLARIFICATION_RANKER_VERSION,
    locale: String(locale || 'en').toLowerCase().split(/[-_]/u)[0],
    internalCandidateCount: rows.length,
    visibleOptionCount: visibleOptions.length,
    maxVisibleOptions: QL7_SUPPORT_MAX_VISIBLE_CLARIFICATION_OPTIONS,
    oneBestQuestionPolicy: true,
    selected,
    visibleOptions: Object.freeze(visibleOptions),
    topRanked: Object.freeze(rows.slice(0, 12)),
    posteriorEntropy: Number(entropy(normalized).toFixed(8)),
    clarificationRequired: Boolean(selected && (decisionMathReceipt?.abstention?.semanticAbstain || normalized.length > 1)),
    rawQuestionStored: false,
  }
  return Object.freeze({ ...body, receiptHash: ql7StableHash(JSON.stringify(body)) })
}
