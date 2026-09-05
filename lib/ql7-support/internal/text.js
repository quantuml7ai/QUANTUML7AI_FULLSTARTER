export const QL7_SUPPORT_VISIBLE_TEXT_MAX_GRAPHEMES = 400

export function ql7Str(value) { return String(value ?? '').trim() }
export function ql7Arr(value) { return Array.isArray(value) ? value : [] }
export function ql7Locale(value = 'en') {
  const clean = ql7Str(value).toLowerCase().replace('_', '-').split('-')[0]
  return clean || 'en'
}
export function ql7CountGraphemes(value = '', locale = 'en') {
  const text = String(value ?? '')
  try { return [...new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(text)].length } catch { return Array.from(text).length }
}
export function ql7SliceGraphemes(value = '', max = QL7_SUPPORT_VISIBLE_TEXT_MAX_GRAPHEMES, locale = 'en') {
  const text = ql7Str(value)
  if (ql7CountGraphemes(text, locale) <= max) return text
  let parts
  try { parts = [...new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(text)].map((row) => row.segment) } catch { parts = Array.from(text) }
  let cut = parts.slice(0, Math.max(1, max)).join('').trim()
  const last = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'), cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'))
  if (last >= Math.floor(max * 0.45)) cut = cut.slice(0, last + 1).trim()
  else cut = cut.replace(/[,:;\-–—\s]+$/u, '').trim() + '…'
  return cut
}
export function ql7NormalizeSpaces(value = '') {
  const protectedTokens = []
  const shielded = ql7Str(value).replace(/(?:https?:\/\/[^\s<>()]+|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b)/giu, (token) => {
    const index = protectedTokens.push(token) - 1
    return `\uE000${index}\uE001`
  })
  return shielded
    .replace(/([,;:.!?])(?=\p{L})/gu, '$1 ')
    .replace(/\s+/gu, ' ')
    .replace(/\uE000(\d+)\uE001/gu, (_, index) => protectedTokens[Number(index)] || '')
    .trim()
}
export function ql7Sentences(value = '') {
  return ql7NormalizeSpaces(value).split(/(?<=[.!?。！？…])\s+/u).map(ql7Str).filter(Boolean)
}
export function ql7UniqueSentences(value = '') {
  const out=[]; const seen=new Set()
  for (const sentence of ql7Sentences(value)) {
    const key=sentence.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()
    if (!key || seen.has(key)) continue
    seen.add(key); out.push(sentence)
  }
  return out.join(' ')
}
export function ql7SafeVisibleText(value = '', locale = 'en', max = QL7_SUPPORT_VISIBLE_TEXT_MAX_GRAPHEMES) {
  return ql7SliceGraphemes(ql7UniqueSentences(ql7NormalizeSpaces(value)), max, locale)
}
export function ql7StableHash(value = '') {
  let hash=2166136261
  for (const ch of String(value ?? '')) hash=Math.imul(hash ^ ch.charCodeAt(0),16777619)
  return (hash>>>0).toString(16).padStart(8,'0')
}
export function ql7Pick(values = [], seed = '') {
  const rows=ql7Arr(values).filter((v)=>ql7Str(v))
  return rows.length ? rows[parseInt(ql7StableHash(seed),16)%rows.length] : ''
}
