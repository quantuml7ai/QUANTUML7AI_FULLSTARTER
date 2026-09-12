import {ql7StableHash} from '../internal/text.js'

export const QL7_SUPPORT_CLARIFICATION_STRATEGY_VERSION = '5.3.0'
export const QL7_SUPPORT_CLARIFICATION_STRATEGY_OWNER_ID = 'ql7-support.clarification-strategies'

const FOCUS = Object.freeze(['intent','domain','entity','time','status','action','result','source'])
const CONTRAST = Object.freeze(['top2','top3','material_vs_social','read_vs_explain'])
const TONE = Object.freeze(['neutral','concise','supportive','technical'])
const FORM = Object.freeze(['binary','single_slot','contrastive','example_anchored'])

function buildRegistry() {
  const rows = []
  let index = 0
  for (const focus of FOCUS) {
    for (const contrast of CONTRAST) {
      for (const tone of TONE) {
        for (const form of FORM) {
          const strategyId = `clarify:${focus}:${contrast}:${tone}:${form}`
          rows.push(Object.freeze({
            strategyId,
            focus,
            contrast,
            tone,
            form,
            readyToSend: false,
            finalText: false,
            index: index++,
            strategyHash: ql7StableHash(strategyId),
          }))
        }
      }
    }
  }
  return Object.freeze(rows)
}

export const QL7_SUPPORT_CLARIFICATION_STRATEGIES = buildRegistry()
export const QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT = QL7_SUPPORT_CLARIFICATION_STRATEGIES.length


export function selectQl7SupportNoveltyFallbackClarification({ seed = '', usedStrategyIds = [] } = {}) {
  const used = new Set((Array.isArray(usedStrategyIds) ? usedStrategyIds : []).map(String).filter(Boolean))
  const start = Number.parseInt(ql7StableHash(`novelty-fallback:${String(seed || '')}`).slice(0, 8), 16) % QL7_SUPPORT_CLARIFICATION_STRATEGIES.length
  let selected = null
  for (let offset = 0; offset < QL7_SUPPORT_CLARIFICATION_STRATEGIES.length; offset += 1) {
    const candidate = QL7_SUPPORT_CLARIFICATION_STRATEGIES[(start + offset) % QL7_SUPPORT_CLARIFICATION_STRATEGIES.length]
    if (!used.has(candidate.strategyId)) { selected = candidate; break }
  }
  if (!selected) selected = QL7_SUPPORT_CLARIFICATION_STRATEGIES[start]
  const body = {
    schema: 'ql7.support.novelty-fallback-clarification-selection',
    schemaVersion: QL7_SUPPORT_CLARIFICATION_STRATEGY_VERSION,
    ownerId: QL7_SUPPORT_CLARIFICATION_STRATEGY_OWNER_ID,
    selectedStrategyId: selected.strategyId,
    selectedStrategyHash: selected.strategyHash,
    focus: selected.focus,
    contrast: selected.contrast,
    tone: selected.tone,
    form: selected.form,
    index: selected.index,
    readyToSend: false,
    finalText: false,
    reason: 'delivery_availability_after_material_regeneration_exhaustion',
  }
  return Object.freeze({ ...body, receiptHash: ql7StableHash(JSON.stringify(body)) })
}

export function auditQl7SupportClarificationStrategies() {
  const ids = new Set(QL7_SUPPORT_CLARIFICATION_STRATEGIES.map((row) => row.strategyId))
  const failures = []
  if (QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT < 100) failures.push('strategy_count_below_100')
  if (ids.size !== QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT) failures.push('duplicate_strategy_id')
  if (QL7_SUPPORT_CLARIFICATION_STRATEGIES.some((row) => row.readyToSend || row.finalText)) failures.push('stored_final_text_owner')
  return Object.freeze({
    ok: failures.length === 0,
    schemaVersion: QL7_SUPPORT_CLARIFICATION_STRATEGY_VERSION,
    count: QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT,
    failures: Object.freeze(failures),
  })
}
