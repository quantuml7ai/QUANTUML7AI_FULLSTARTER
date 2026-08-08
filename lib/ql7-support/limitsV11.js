export const QL7_SUPPORT_USER_INPUT_MAX_GRAPHEMES_V11 = 600
export const QL7_SUPPORT_REPLY_MAX_GRAPHEMES_V11 = 4000

const RESPONSE_PROFILES = Object.freeze({
  micro_ack: Object.freeze({ min: 1, preferred: 180, max: 400 }),
  single_clarification: Object.freeze({ min: 40, preferred: 320, max: 700 }),
  compact_fact: Object.freeze({ min: 80, preferred: 550, max: 1000 }),
  guided_steps: Object.freeze({ min: 180, preferred: 1200, max: 2000 }),
  diagnostic_result: Object.freeze({ min: 220, preferred: 1700, max: 2600 }),
  financial_status: Object.freeze({ min: 180, preferred: 1500, max: 2400 }),
  comparison: Object.freeze({ min: 300, preferred: 2200, max: 3400 }),
  policy_explanation: Object.freeze({ min: 260, preferred: 1900, max: 3200 }),
  incident_intake: Object.freeze({ min: 220, preferred: 1600, max: 3000 }),
  business_intake: Object.freeze({ min: 220, preferred: 1800, max: 3200 }),
  educational_overview: Object.freeze({ min: 320, preferred: 2300, max: 3800 }),
  long_form_explanation: Object.freeze({ min: 500, preferred: 3200, max: 4000 }),
  safety_intervention: Object.freeze({ min: 120, preferred: 1200, max: 4000 }),
})

function str(value) { return String(value ?? '') }

export function splitQl7SupportGraphemesV11(value = '', locale = 'en') {
  const text = str(value)
  if (!text) return []
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      const segmenter = new Intl.Segmenter(locale || 'en', { granularity: 'grapheme' })
      return Array.from(segmenter.segment(text), (entry) => entry.segment)
    }
  } catch {}
  return Array.from(text)
}

export function countQl7SupportGraphemesV11(value = '', locale = 'en') {
  return splitQl7SupportGraphemesV11(value, locale).length
}

export function trimQl7SupportGraphemesV11(value = '', max = QL7_SUPPORT_REPLY_MAX_GRAPHEMES_V11, locale = 'en') {
  const limit = Math.max(0, Number(max) || 0)
  if (!limit) return ''
  const parts = splitQl7SupportGraphemesV11(value, locale)
  if (parts.length <= limit) return parts.join('')
  return parts.slice(0, limit).join('')
}

function normalizedText(value = '') {
  return str(value)
    .replace(/\u0000/gu, '')
    .replace(/\uFFFD/gu, '')
    .replace(/[ \t]+/gu, ' ')
    .replace(/\s+([,.;!?…:،。！？])/gu, '$1')
    .replace(/\n{3,}/gu, '\n\n')
    .trim()
}

function sentenceChunks(value = '') {
  const text = normalizedText(value)
  if (!text) return []
  const chunks = text.match(/[^.!?。！？…\n]+(?:[.!?。！？…]+|\n+|$)/gu)
  return (chunks || [text]).map((item) => item.trim()).filter(Boolean)
}

export function fitQl7SupportReplyV11(value = '', {
  locale = 'en',
  maxGraphemes = QL7_SUPPORT_REPLY_MAX_GRAPHEMES_V11,
  ellipsis = '…',
} = {}) {
  const max = Math.max(1, Math.min(QL7_SUPPORT_REPLY_MAX_GRAPHEMES_V11, Number(maxGraphemes) || QL7_SUPPORT_REPLY_MAX_GRAPHEMES_V11))
  const text = normalizedText(value)
  const count = countQl7SupportGraphemesV11(text, locale)
  if (count <= max) return Object.freeze({ text, graphemes: count, truncated: false, max })

  const selected = []
  let selectedCount = 0
  for (const sentence of sentenceChunks(text)) {
    const separator = selected.length ? ' ' : ''
    const next = `${separator}${sentence}`
    const nextCount = countQl7SupportGraphemesV11(next, locale)
    if (selectedCount + nextCount > Math.max(1, max - 1)) break
    selected.push(next)
    selectedCount += nextCount
  }

  let compact = selected.join('').trim()
  if (!compact) compact = trimQl7SupportGraphemesV11(text, Math.max(1, max - 1), locale).trimEnd()
  compact = `${compact}${ellipsis}`
  if (countQl7SupportGraphemesV11(compact, locale) > max) {
    compact = `${trimQl7SupportGraphemesV11(compact, Math.max(1, max - 1), locale).trimEnd()}${ellipsis}`
  }
  return Object.freeze({ text: compact, graphemes: countQl7SupportGraphemesV11(compact, locale), truncated: true, max })
}

export function validateQl7SupportUserInputV11(value = '', { locale = 'en' } = {}) {
  const text = normalizedText(value)
  const graphemes = countQl7SupportGraphemesV11(text, locale)
  const allowed = graphemes >= 1 && graphemes <= QL7_SUPPORT_USER_INPUT_MAX_GRAPHEMES_V11
  return Object.freeze({
    allowed,
    text,
    graphemes,
    min: 1,
    max: QL7_SUPPORT_USER_INPUT_MAX_GRAPHEMES_V11,
    error: allowed ? '' : (graphemes < 1 ? 'ql7_support_text_required' : 'ql7_support_text_too_long'),
  })
}

export function assertQl7SupportUserInputV11(value = '', options = {}) {
  const result = validateQl7SupportUserInputV11(value, options)
  if (result.allowed) return result
  const error = new Error(result.error)
  error.status = 400
  error.details = { graphemes: result.graphemes, max: result.max }
  throw error
}

export function getQl7SupportResponseProfileV11(mode = 'compact_fact') {
  return RESPONSE_PROFILES[String(mode || '')] || RESPONSE_PROFILES.compact_fact
}

export function enforceQl7SupportReplyBudgetV11(value = '', {
  mode = 'compact_fact',
  locale = 'en',
  hardMax = QL7_SUPPORT_REPLY_MAX_GRAPHEMES_V11,
} = {}) {
  const profile = getQl7SupportResponseProfileV11(mode)
  const max = Math.min(QL7_SUPPORT_REPLY_MAX_GRAPHEMES_V11, Math.max(1, Number(hardMax) || profile.max || QL7_SUPPORT_REPLY_MAX_GRAPHEMES_V11))
  const fitted = fitQl7SupportReplyV11(value, { locale, maxGraphemes: max })
  return Object.freeze({ ...fitted, mode, preferred: profile.preferred, profileMax: profile.max })
}

export const QL7_SUPPORT_RESPONSE_PROFILES_V11 = RESPONSE_PROFILES
