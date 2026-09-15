export const QL7_SUPPORT_MUTATION_INVARIANT_VERSION = '5.1.1'

const INVARIANT = new Set([
  'whitespace',
  'punctuation',
  'case',
  'nfkc',
  'keyboard-layout',
  'transliteration',
  'typo-insert',
  'typo-delete',
  'typo-substitute',
  'typo-transpose',
  'joined-words',
  'split-words',
  'emoji-noise',
  'safe-code-switch',
  'formal-reformulation',
])

const EXPLICIT = Object.freeze({
  'quoted-context': Object.freeze({
    intent: 'context-dependent',
    domain: 'invariant',
    safety: 'must-not-escalate-quoted-only',
    actorActionability: 'may-reduce',
  }),
})

export function expectedMutationInvariant(transformId = '') {
  const id = String(transformId || '')
  if (EXPLICIT[id]) return EXPLICIT[id]

  return Object.freeze({
    intent: INVARIANT.has(id) ? 'invariant' : 'registered-change',
    domain: 'invariant',
    safety: 'invariant-unless-transform-declares-change',
    facts: 'invariant',
    actorIdentity: 'invariant',
    requiredActions: 'invariant',
  })
}
