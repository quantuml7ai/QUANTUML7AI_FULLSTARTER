import crypto from 'node:crypto'

export const QL7_SUPPORT_PROPERTY_FUZZER_VERSION = '5.1.1'

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex')
const mutations = Object.freeze([
  Object.freeze({ id: 'outer-whitespace', apply: (text) => ` ${text} ` }),
  Object.freeze({ id: 'joined-words', apply: (text) => text.replace(/\s+/g, '') }),
  Object.freeze({ id: 'uppercase', apply: (text) => text.toUpperCase() }),
  Object.freeze({ id: 'punctuation-noise', apply: (text) => `${text} !!!` }),
  Object.freeze({ id: 'emoji-noise', apply: (text) => `${text} 🙂` }),
  Object.freeze({ id: 'a-confusable', apply: (text) => text.replace(/a/gi, '@') }),
  Object.freeze({ id: 'o-confusable', apply: (text) => text.replace(/o/gi, '0') }),
])

export function fuzzQl7SupportProperties({
  text = '',
  count = 32,
  seed = '',
} = {}) {
  const source = String(text)
  const total = Math.max(1, Math.min(100000, Number(count) || 32))
  const output = []

  for (let index = 0; index < total; index += 1) {
    const selector = parseInt(hash(`${seed}:${index}`).slice(0, 8), 16) % mutations.length
    const mutation = mutations[selector]
    output.push(Object.freeze({
      caseId: `fuzz:${hash(`${seed}:${index}:${source}`)}`,
      mutationId: mutation.id,
      text: mutation.apply(source),
      parentTextHash: hash(source),
      invariant: 'semantic_scope_should_not_change_for_benign_mutation',
    }))
  }

  return Object.freeze(output)
}
