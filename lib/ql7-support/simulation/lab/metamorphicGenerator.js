export const QL7_METAMORPHIC_TRANSFORMS = Object.freeze([
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
  'quoted-context',
  'formal-reformulation',
])
export const QL7_SUPPORT_METAMORPHIC_GENERATOR_VERSION = '5.1.1'

function simpleTransform(text, transformId) {
  switch (transformId) {
    case 'whitespace':
      return `  ${text.replace(/\s+/gu, '   ')}  `
    case 'punctuation':
      return `${text}!!!`
    case 'case':
      return text.toLocaleUpperCase()
    case 'nfkc':
      return text.normalize('NFKC')
    case 'quoted-context':
      return `«${text}»`
    case 'emoji-noise':
      return text.replace(/\s+/u, ' 🙂 ')
    case 'joined-words':
      return text.replace(/\s+/gu, '')
    case 'split-words':
      return text.replace(/([\p{L}\p{N}]{6,})/gu, (match) => `${match.slice(0, 3)} ${match.slice(3)}`)
    default:
      return text
  }
}

export function applyMetamorphicTransform(scenario = {}, transformId = '') {
  const id = String(transformId || '')
  if (!QL7_METAMORPHIC_TRANSFORMS.includes(id)) {
    throw new Error(`metamorphic_transform_unknown:${id}`)
  }

  const source = String(scenario?.input || scenario?.text || '')
  return Object.freeze({
    ...scenario,
    input: simpleTransform(source, id),
    lab: Object.freeze({
      ...(scenario?.lab || {}),
      mutationTransform: id,
      parentScenarioId: scenario?.id,
      metamorphicGeneratorVersion: QL7_SUPPORT_METAMORPHIC_GENERATOR_VERSION,
    }),
  })
}
