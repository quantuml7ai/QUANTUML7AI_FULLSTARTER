export const QL7_SUPPORT_NEGATION_SCOPE_VERSION = '5.1.1'

const NEGATION_PATTERN = /\b(?:not|no|never|without|не|нет|никогда|ніколи|без|nunca|sin|nicht|kein|ohne|pas|sans|non|senza|não|sem|nie|bez|niet|geen|inte|utan|ikke|uden|ei|ilman|ne|nem|fără|няма|brez|δεν|χωρίς|yox|емес|ない|아니|לא|בלי|ليس|بدون|不|没有)\b/giu

const CLAUSE_BOUNDARY = /[.!?;:\n]/u

function localClause(source, start, end) {
  let left = start
  let right = end
  while (left > 0 && !CLAUSE_BOUNDARY.test(source[left - 1])) left -= 1
  while (right < source.length && !CLAUSE_BOUNDARY.test(source[right])) right += 1
  return {
    clauseStart: left,
    clauseEnd: right,
    clause: source.slice(left, right).trim(),
  }
}

export function resolveQl7NegationScope(text = '') {
  const source = String(text || '')
  const matches = [...source.matchAll(NEGATION_PATTERN)].map((match) => {
    const start = Number(match.index || 0)
    const end = start + match[0].length
    const clause = localClause(source, start, end)
    return Object.freeze({
      token: match[0],
      index: start,
      sourceSpanStart: start,
      sourceSpanEnd: end,
      left: source.slice(Math.max(0, start - 48), start),
      right: source.slice(end, Math.min(source.length, end + 96)),
      ...clause,
      scopeKind: 'local-clause',
    })
  })

  return Object.freeze({
    schema: 'ql7.support.negation-scope',
    schemaVersion: QL7_SUPPORT_NEGATION_SCOPE_VERSION,
    hasNegation: matches.length > 0,
    matches: Object.freeze(matches),
  })
}
