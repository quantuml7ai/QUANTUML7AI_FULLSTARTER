export const QL7_SUPPORT_CHOICE_DIVERSITY_VERSION_V12 = '12.0.0'

function str(value) { return String(value ?? '').trim() }
function norm(value) { return str(value).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim() }

export function dedupeQl7SupportChoicesV12(options = []) {
  const seen = new Set()
  const out = []
  for (const option of Array.isArray(options) ? options : []) {
    const label = str(option?.label || option?.text || option)
    const key = norm(label)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(typeof option === 'object' ? { ...option, label } : { label })
  }
  return Object.freeze(out)
}

export function evaluateQl7SupportChoiceDiversityV12(card = {}) {
  const options = Array.isArray(card?.options) ? card.options : []
  const deduped = dedupeQl7SupportChoicesV12(options)
  return Object.freeze({
    version: QL7_SUPPORT_CHOICE_DIVERSITY_VERSION_V12,
    ok: options.length === deduped.length,
    optionCount: options.length,
    distinctCount: deduped.length,
    duplicateCount: Math.max(0, options.length - deduped.length),
  })
}
