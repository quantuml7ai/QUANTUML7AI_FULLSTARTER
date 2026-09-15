import {ql7Arr, ql7NormalizeSpaces, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_BOT_PHRASE_REGISTRY_VERSION = '5.2.0'

const EXACT_FAMILIES = Object.freeze({
  generic_presence: Object.freeze([
    'я рядом', 'я на связи', 'я вас слышу', 'i am here', 'i am with you', 'i hear you', 'estoy aquí', 'estoy contigo',
    'yanınızdayım', 'buradayım', 'أنا معك', 'أنا هنا', '我在这里', 'אני כאן',
  ]),
  generic_acknowledgement: Object.freeze([
    'понял', 'поняла', 'i understand', 'got it', 'entendido', 'anladım', 'فهمت', '明白了', 'הבנתי',
  ]),
  mechanical_partition: Object.freeze([
    'я разделю эмоцию факты и действие',
    'я разделю эмоцию факты и следующий шаг',
    'i will separate feelings facts and action',
    'i will separate emotion facts and the next step',
  ]),
  automatic_menu: Object.freeze([
    'выберите направление ниже', 'что разберём', 'what should we sort out',
    'pick a direction below', 'choose a direction below',
  ]),
  forced_return: Object.freeze([
    'можем немного поговорить а затем вернуться',
    'we can talk briefly then return',
    'останемся полезными',
    'stay useful',
  ]),
})

const SEMANTIC_FAMILIES = Object.freeze([
  Object.freeze({
    id: 'mechanical_emotion_fact_action',
    pattern: /(?:раздел\w*|отдел\w*|separate).{0,35}(?:эмоц|emotion|feeling).{0,35}(?:факт|fact).{0,35}(?:действ|action|следующ)/iu,
  }),
  Object.freeze({
    id: 'automatic_ecosystem_menu',
    pattern: /(?:выбер|choose|pick).{0,35}(?:направлен|direction).{0,35}(?:ниже|below)/iu,
  }),
  Object.freeze({
    id: 'forced_product_return',
    pattern: /(?:немного\s+поговор|talk\s+briefly).{0,60}(?:верн|return).{0,35}(?:задач|product|ecosystem)/iu,
  }),
  Object.freeze({
    id: 'machine_self_explanation',
    pattern: /(?:classifier|adapter|semantic route|pipeline|oracle|внутренн\w+\s+маршрут|семантическ\w+\s+классификатор)/iu,
  }),
  Object.freeze({
    id: 'machine_support_slot_loop',
    pattern: /(?:вы\s+спрашиваете\s+о\s+поддержк|скажите\s+прямо\s+сейчас\s+про\s+поддержк|укажите.{0,40}про\s+поддержк).{0,90}(?:таймфрейм|срок|период|конкретн\w+\s+детал)/iu,
  }),
  Object.freeze({
    id: 'machine_double_detail',
    pattern: /(?:конкретн\w+\s+детал).{0,35}(?:конкретн\w+\s+детал)/iu,
  }),
])

function normalized(value = '') {
  return ql7NormalizeSpaces(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export const QL7_SUPPORT_BOT_PHRASE_REGISTRY = Object.freeze({
  schema: 'ql7.support.bot-phrase-registry',
  version: QL7_SUPPORT_BOT_PHRASE_REGISTRY_VERSION,
  exactFamilies: EXACT_FAMILIES,
  semanticFamilies: SEMANTIC_FAMILIES,
  registryHash: ql7StableHash(JSON.stringify({ exact: EXACT_FAMILIES, semantic: SEMANTIC_FAMILIES.map((row) => row.id) })),
})

export function detectQl7SupportBotPhrases(text = '') {
  const value = ql7Str(text)
  const clean = normalized(value)
  const hits = []
  for (const [familyId, rows] of Object.entries(EXACT_FAMILIES)) {
    for (const phrase of rows) {
      const needle = normalized(phrase)
      if (needle && clean.includes(needle)) {
        hits.push(Object.freeze({ familyId, kind: 'exact-family', phraseHash: ql7StableHash(needle) }))
        break
      }
    }
  }
  for (const family of SEMANTIC_FAMILIES) {
    if (family.pattern.test(value)) hits.push(Object.freeze({ familyId: family.id, kind: 'semantic-family' }))
  }
  return Object.freeze({
    version: QL7_SUPPORT_BOT_PHRASE_REGISTRY_VERSION,
    ok: hits.length === 0,
    hits: Object.freeze(hits),
  })
}

export function removeQl7SupportBotPhraseSentences(text = '') {
  const sentences = ql7Str(text).split(/(?<=[.!?。！？…])\s+/u).filter(Boolean)
  const kept = sentences.filter((sentence) => detectQl7SupportBotPhrases(sentence).ok)
  return ql7NormalizeSpaces(kept.join(' '))
}

export function validateQl7SupportBotPhraseRegistry() {
  const phrases = Object.values(EXACT_FAMILIES).flatMap((rows) => ql7Arr(rows)).map(normalized)
  const failures = []
  if (new Set(phrases).size !== phrases.length) failures.push('duplicate_exact_phrase')
  if (!SEMANTIC_FAMILIES.length) failures.push('missing_semantic_families')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}
