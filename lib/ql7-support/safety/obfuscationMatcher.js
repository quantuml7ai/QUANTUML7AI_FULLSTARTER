import {ql7Locale, ql7StableHash, ql7Str} from '../internal/text.js'
import {QL7_SUPPORT_NATIVE_SAFETY_LEXICON} from '../language/safetyLexicon.native.js'
import {QL7_SUPPORT_MULTILINGUAL_SAFETY_LEXICON} from '../language/safetyLexicon.multilingual.js'

export const QL7_SUPPORT_OBFUSCATION_MATCHER_VERSION = '15.2.0'

const ALL = Object.freeze({
  ...QL7_SUPPORT_NATIVE_SAFETY_LEXICON,
  ...QL7_SUPPORT_MULTILINGUAL_SAFETY_LEXICON,
})

const ZERO_WIDTH_RE = /[\u200B-\u200F\u2060\uFEFF]/gu
const SEPARATOR_RE = /[^\p{L}\p{N}]+/gu
const NON_LATIN_SHORT_RE = /[\p{Script=Han}\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Thai}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
const HAN_SCRIPT_RE = /\p{Script=Han}/u
const COMPACT_TARGET_SCRIPT_RE = /[\p{Script=Han}\p{Script=Hebrew}\p{Script=Arabic}]/u

const LEET = Object.freeze({
  '0': 'o',
  '1': 'i',
  '2': 'z',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '6': 'g',
  '7': 't',
  '8': 'b',
  '9': 'g',
  '@': 'a',
  '$': 's',
  '!': 'i',
})

// This map is used only as an additional confusable candidate. It must never
// replace the native-script representation because that would destroy words
// such as Russian "тупой" before matching its native lexicon.
const CONFUSABLE_TO_LATIN = Object.freeze({
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
  'з': 'z', 'и': 'i', 'і': 'i', 'ј': 'j', 'к': 'k', 'м': 'm', 'н': 'h',
  'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x',
  'Α': 'a', 'Β': 'b', 'Ε': 'e', 'Η': 'h', 'Ι': 'i', 'Κ': 'k',
  'Μ': 'm', 'Ν': 'n', 'Ο': 'o', 'Ρ': 'p', 'Τ': 't', 'Χ': 'x', 'Υ': 'y',
})

const LATIN_KEYBOARD_TO_CYRILLIC = Object.freeze({
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з',
  '[': 'х', ']': 'ъ', a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о',
  k: 'л', l: 'д', ';': 'ж', "'": 'э', z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и',
  n: 'т', m: 'ь', ',': 'б', '.': 'ю',
})

const THREAT_TERMS = Object.freeze({
  en: Object.freeze(['attack', 'hack', 'kill', 'destroy', 'bomb']),
  ru: Object.freeze(['атакую', 'атаковать', 'взломаю', 'взломать', 'убью', 'уничтожу', 'взорву']),
  uk: Object.freeze(['атакую', 'атакувати', 'зламаю', 'зламати', "вб'ю", 'знищу', 'підірву']),
  es: Object.freeze(['atacar', 'hackear', 'matar', 'destruir', 'bomba']),
  tr: Object.freeze(['saldır', 'saldıracağım', 'hackle', 'öldür', 'yok et', 'bomba']),
  ar: Object.freeze(['أهاجم', 'سأهاجم', 'أخترق', 'أقتل', 'أدمر', 'قنبلة']),
  zh: Object.freeze(['攻击', '入侵', '杀', '摧毁', '炸弹']),
  he: Object.freeze(['אתקוף', 'אפרוץ', 'אהרוג', 'אשמיד', 'פצצה']),
  de: Object.freeze(['angreifen', 'greife', 'hacken', 'töten', 'zerstören', 'bombe']),
  fr: Object.freeze(['attaquer', 'pirater', 'tuer', 'détruire', 'bombe']),
  it: Object.freeze(['attaccare', 'attaccherò', 'hackerare', 'uccidere', 'distruggere', 'bomba']),
  pt: Object.freeze(['atacar', 'hackear', 'matar', 'destruir', 'bomba']),
  pl: Object.freeze(['zaatakuję', 'atakować', 'zhakować', 'zabić', 'zniszczyć', 'bomba']),
  nl: Object.freeze(['aanvallen', 'hacken', 'doden', 'vernietigen', 'bom']),
  sv: Object.freeze(['attackera', 'hacka', 'döda', 'förstöra', 'bomb']),
  no: Object.freeze(['angripe', 'hacke', 'drepe', 'ødelegge', 'bombe']),
  da: Object.freeze(['angribe', 'hacke', 'dræbe', 'ødelægge', 'bombe']),
  fi: Object.freeze(['hyökätä', 'hyökkään', 'hakkeroida', 'tappaa', 'tuhota', 'pommi']),
  cs: Object.freeze(['zaútočit', 'zaútočím', 'hacknout', 'zabít', 'zničit', 'bomba']),
  sk: Object.freeze(['zaútočiť', 'zaútočím', 'hacknúť', 'zabiť', 'zničiť', 'bomba']),
  hu: Object.freeze(['megtámad', 'megtámadom', 'feltör', 'megöl', 'elpusztít', 'bomba']),
  ro: Object.freeze(['ataca', 'voi ataca', 'sparge', 'ucide', 'distruge', 'bombă']),
  bg: Object.freeze(['атакувам', 'атакувам системата', 'хакна', 'убия', 'унищожа', 'бомба']),
  sr: Object.freeze(['napasti', 'napadnuću', 'hakovati', 'ubiti', 'uništiti', 'bomba']),
  hr: Object.freeze(['napasti', 'napast ću', 'hakirati', 'ubiti', 'uništiti', 'bomba']),
  sl: Object.freeze(['napasti', 'napadel bom', 'vdreti', 'ubiti', 'uničiti', 'bomba']),
  el: Object.freeze(['επιτεθώ', 'επίθεση', 'χακάρω', 'σκοτώσω', 'καταστρέψω', 'βόμβα']),
  ka: Object.freeze(['შევუტევ', 'თავდასხმა', 'გატეხვა', 'მოვკლავ', 'გავანადგურებ', 'ბომბი']),
  az: Object.freeze(['hücum', 'hücum edəcəyəm', 'sındırmaq', 'öldürmək', 'məhv etmək', 'bomba']),
  kk: Object.freeze(['шабуыл', 'шабуыл жасаймын', 'бұзу', 'өлтіру', 'жою', 'бомба']),
  ja: Object.freeze(['攻撃', '侵入', '殺す', '破壊', '爆弾']),
  ko: Object.freeze(['공격', '해킹', '죽이', '파괴', '폭탄']),
})

function fold(value = '') {
  return ql7Str(value)
    .normalize('NFKC')
    .replace(ZERO_WIDTH_RE, '')
    .toLowerCase()
}

function mapChars(value, map) {
  return Array.from(value).map((ch) => map[ch] || ch).join('')
}

function compact(value = '') {
  return value.replace(SEPARATOR_RE, '')
}

function squeeze(value = '') {
  return value.replace(/(.)\1{2,}/gu, '$1$1')
}

function normalizeNative(value = '') {
  return squeeze(compact(mapChars(fold(value), LEET)))
}

function normalizeConfusable(value = '') {
  return squeeze(compact(mapChars(mapChars(fold(value), LEET), CONFUSABLE_TO_LATIN)))
}

function normalizeKeyboardCyrillic(value = '') {
  return squeeze(compact(mapChars(fold(value), LATIN_KEYBOARD_TO_CYRILLIC)))
}

function candidates(value = '') {
  return Object.freeze(Array.from(new Set([
    normalizeNative(value),
    normalizeConfusable(value),
    normalizeKeyboardCyrillic(value),
  ].filter(Boolean))))
}

function tokenCandidates(value = '') {
  const tokens = fold(value)
    .split(SEPARATOR_RE)
    .map((token) => candidates(token))
    .flat()
    .filter(Boolean)
  return Object.freeze(Array.from(new Set(tokens)))
}

function distance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    let minimum = current[0]
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      minimum = Math.min(minimum, current[j])
    }
    if (minimum > max) return max + 1
    previous = current
  }
  return previous[b.length]
}

function shortTermMatch(source, term, kind = 'insult') {
  const termVariants = candidates(term)
  const sourceTokens = tokenCandidates(source)

  if (kind === 'target' && COMPACT_TARGET_SCRIPT_RE.test(term)) {
    const sourceVariants = candidates(source)
    if (termVariants.some((variant) => sourceVariants.some((sourceVariant) => sourceVariant.includes(variant)))) {
      return true
    }
  }

  // Scripts without whitespace word boundaries need direct native containment.
  if (NON_LATIN_SHORT_RE.test(term) && kind !== 'target') {
    const sourceVariants = candidates(source)
    if (termVariants.some((variant) => sourceVariants.some((sourceVariant) => sourceVariant.includes(variant)))) {
      return true
    }
    if (HAN_SCRIPT_RE.test(term)) return false
    return termVariants.some((variant) => sourceTokens.some((token) => token.length >= 2 && distance(token, variant, 1) <= 1))
  }

  // A one-letter form such as Dutch "u" is accepted only as a
  // whitespace-delimited token. Punctuation-delimited matching would turn the
  // middle letter in "st.u.pid" into a false direct-address signal.
  if (termVariants.some((variant) => variant.length === 1)) {
    const foldedSource = fold(source)
    return termVariants.some((variant) => {
      if (variant.length !== 1) return sourceTokens.includes(variant)
      const escaped = variant.replace(/[\^$.*+?()[\]{}|]/g, '\\$&')
      return new RegExp(`(?:^|\\s)${escaped}(?=$|\\s)`, 'iu').test(foldedSource)
    })
  }

  // Short Latin/Cyrillic targets such as "tu", "du" or "ты" must be
  // complete tokens. Substring matching would classify "stupid" as Romanian
  // direct address because it contains "tu".
  return termVariants.some((variant) => sourceTokens.includes(variant) || (kind === 'target' && variant.length >= 2 && sourceTokens.some((token) => token.length >= 2 && distance(token, variant, 1) <= 1)))
}

function containsPhrase(source, phrase, kind = 'insult') {
  const sourceVariants = candidates(source)
  const phraseVariants = candidates(phrase)
  if (!phraseVariants.length) return false

  const shortest = Math.min(...phraseVariants.map((value) => value.length))
  if (shortest <= 3 || kind === 'target') {
    return shortTermMatch(source, phrase, kind)
  }

  if (sourceVariants.some((a) => phraseVariants.some((b) => a.includes(b)))) {
    return true
  }

  // Obfuscated words split by punctuation still form one compact candidate.
  // Compare that candidate fuzzily before falling back to individual tokens.
  if (sourceVariants.some((sourceVariant) => phraseVariants.some((phraseVariant) => {
    const maxDistance = phraseVariant.length >= 8 ? 2 : 1
    return distance(sourceVariant, phraseVariant, maxDistance) <= maxDistance
  }))) {
    return true
  }

  const tokens = tokenCandidates(source)
  return tokens.some((token) => phraseVariants.some((phraseToken) => {
    const maxDistance = phraseToken.length >= 8 ? 2 : 1
    return distance(token, phraseToken, maxDistance) <= maxDistance
  }))
}

function hitRows(source, rows = [], kind = 'insult', locale = 'en') {
  const out = []
  for (const term of rows || []) {
    if (!containsPhrase(source, term, kind)) continue
    out.push(Object.freeze({
      kind,
      locale,
      termHash: ql7StableHash(term),
      spanHash: ql7StableHash(source),
      strength: Math.min(1, 0.55 + normalizeNative(term).length / 24),
    }))
  }
  return out
}

export function matchQl7SupportObfuscatedSafety({ text = '', locale = 'en' } = {}) {
  const language = ql7Locale(locale)
  const primary = ALL[language] || ALL.en
  const universal = language === 'en' ? null : ALL.en
  const insults = [
    ...hitRows(text, primary.insults, 'insult', language),
    ...(universal ? hitRows(text, universal.insults, 'insult', 'en') : []),
  ]
  const threats = [
    ...hitRows(text, THREAT_TERMS[language] || [], 'threat', language),
    ...(language === 'en' ? [] : hitRows(text, THREAT_TERMS.en, 'threat', 'en')),
  ]
  const nativeCompact = normalizeNative(text)
  const confusableCompact = normalizeConfusable(text)

  return Object.freeze({
    version: QL7_SUPPORT_OBFUSCATION_MATCHER_VERSION,
    locale: language,
    normalized: fold(text),
    compact: nativeCompact,
    confusableCompact,
    insults: Object.freeze(insults.slice(0, 24)),
    threats: Object.freeze(threats.slice(0, 24)),
    targets: Object.freeze(hitRows(text, primary.targets, 'target', language).slice(0, 16)),
    denials: Object.freeze(hitRows(text, primary.denials, 'denial', language).slice(0, 16)),
    product: Object.freeze(hitRows(text, primary.product, 'product', language).slice(0, 16)),
    quotes: Object.freeze(hitRows(text, primary.quotes, 'quote', language).slice(0, 16)),
    fingerprint: ql7StableHash(`${nativeCompact}:${confusableCompact}`),
  })
}
