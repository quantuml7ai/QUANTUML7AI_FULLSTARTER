import {ql7StableHash, ql7Str} from '../internal/text.js'
import {getQl7LexicalUniverse} from './lexicalUniverseRegistry.js'

export const QL7_SUPPORT_ROBUST_CONCEPT_MATCHER_VERSION = '5.3.0'
export const QL7_SUPPORT_ROBUST_CONCEPT_MATCHER_OWNER_ID = 'ql7-support.robust-concept-matcher'

const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/gu
const MARKS = /\p{M}+/gu
const SEP = /[\p{P}\p{S}\s_]+/gu
const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u
const PHRASE_REPRESENTATION_CACHE = new Map()

const DIGIT_FOLD = Object.freeze({
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
})

const CONFUSABLE_FOLD = Object.freeze({
  'а':'a','ɑ':'a','α':'a',
  'е':'e','ε':'e',
  'о':'o','ο':'o',
  'р':'p','ρ':'p',
  'с':'c',
  'х':'x','χ':'x',
  'у':'y',
  'к':'k',
  'м':'m',
  'т':'t',
  'в':'b',
  'н':'h',
})

const KEYBOARD_RU_TO_LAT = Object.freeze({
  'й':'q','ц':'w','у':'e','к':'r','е':'t','н':'y','г':'u','ш':'i','щ':'o','з':'p',
  'х':'[','ъ':']','ф':'a','ы':'s','в':'d','а':'f','п':'g','р':'h','о':'j','л':'k',
  'д':'l','ж':';','э':"'",'я':'z','ч':'x','с':'c','м':'v','и':'b','т':'n','ь':'m',
})

function foldDigits(value = '') {
  return [...value].map((ch) => DIGIT_FOLD[ch] || ch).join('')
}

function foldConfusables(value = '') {
  return [...value].map((ch) => CONFUSABLE_FOLD[ch] || ch).join('')
}

function collapseRuns(value = '') {
  return value.replace(/([\p{L}\p{N}])\1{2,}/gu, '$1$1')
}

function normalizeBase(value = '') {
  return ql7Str(value)
    .normalize('NFKC')
    .replace(ZERO_WIDTH, '')
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(MARKS, '')
    .normalize('NFKC')
}

function normalizeWords(value = '') {
  return collapseRuns(foldDigits(foldConfusables(normalizeBase(value))))
    .replace(SEP, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

function compact(value = '') {
  return normalizeWords(value).replace(/\s+/gu, '')
}

function ruKeyboardToLatin(value = '') {
  return [...normalizeBase(value)].map((ch) => KEYBOARD_RU_TO_LAT[ch] || ch).join('')
}

function tokens(value = '') {
  return normalizeWords(value).split(/\s+/u).filter(Boolean)
}

function damerauLevenshtein(a = '', b = '', maxDistance = 3) {
  const left = [...a], right = [...b]
  if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1
  const width = right.length + 1
  let pre = null
  let prev = Array.from({ length: width }, (_, i) => i)
  for (let i = 1; i <= left.length; i += 1) {
    const curr = [i]
    let rowMin = curr[0]
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      let value = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      )
      if (
        pre &&
        i > 1 &&
        j > 1 &&
        left[i - 1] === right[j - 2] &&
        left[i - 2] === right[j - 1]
      ) value = Math.min(value, pre[j - 2] + 1)
      curr[j] = value
      rowMin = Math.min(rowMin, value)
    }
    if (rowMin > maxDistance) return maxDistance + 1
    pre = prev
    prev = curr
  }
  return prev[right.length]
}

function fuzzyThreshold(length = 0, risk = 'normal') {
  if (length <= 3) return 0
  if (length <= 6) return 1
  if (length <= 11) return risk === 'high' ? 1 : 2
  return risk === 'high' ? 2 : 3
}

function phraseTokenFuzzy(sourceTokens = [], phraseTokens = [], risk = 'normal') {
  if (!sourceTokens.length || !phraseTokens.length) return null
  if (phraseTokens.length === 1) {
    const phrase = phraseTokens[0]
    const max = fuzzyThreshold(phrase.length, risk)
    let best = null
    for (let i = 0; i < sourceTokens.length; i += 1) {
      const token = sourceTokens[i]
      if (Math.abs(token.length - phrase.length) > max) continue
      const distance = damerauLevenshtein(token, phrase, max)
      if (distance <= max) {
        const similarity = 1 - distance / Math.max(token.length, phrase.length, 1)
        if (!best || similarity > best.similarity) best = { similarity, index: i, distance }
      }
    }
    return best
  }
  for (let start = 0; start <= sourceTokens.length - phraseTokens.length; start += 1) {
    let distance = 0
    let budget = 0
    for (let offset = 0; offset < phraseTokens.length; offset += 1) {
      const a = sourceTokens[start + offset], b = phraseTokens[offset]
      const max = fuzzyThreshold(b.length, risk)
      budget += max
      const d = damerauLevenshtein(a, b, max)
      if (d > max) { distance = budget + 1; break }
      distance += d
    }
    if (distance <= budget) {
      const chars = phraseTokens.reduce((sum, token) => sum + token.length, 0)
      return { similarity: 1 - distance / Math.max(chars, 1), index: start, distance }
    }
  }
  return null
}

function candidateRepresentations(value = '') {
  const base = normalizeWords(value)
  const compactValue = compact(value)
  const keyboard = normalizeWords(ruKeyboardToLatin(value))
  return Object.freeze([
    { path: 'unicode_nfkc+casefold+diacritic_fold+confusable_fold+leet_fold+spacing', value: base },
    { path: 'compact_joined_words', value: compactValue },
    ...(keyboard && keyboard !== base ? [{ path: 'ru_keyboard_to_latin', value: keyboard }] : []),
  ])
}

function exactHit(sourceRepresentation, phraseRepresentation) {
  if (!sourceRepresentation || !phraseRepresentation) return false
  if (sourceRepresentation === phraseRepresentation) return true
  if (sourceRepresentation.includes(` ${phraseRepresentation} `)) return true
  if (sourceRepresentation.startsWith(`${phraseRepresentation} `)) return true
  if (sourceRepresentation.endsWith(` ${phraseRepresentation}`)) return true
  return sourceRepresentation.includes(phraseRepresentation) && phraseRepresentation.length >= 7
}

function phrasePayload(rawPhrase, fallbackLocale='en') {
  if (rawPhrase && typeof rawPhrase === 'object') {
    return Object.freeze({
      phrase: ql7Str(rawPhrase.text ?? rawPhrase.phrase ?? rawPhrase.value),
      sourceLocale: ql7Str(rawPhrase.sourceLocale ?? rawPhrase.locale ?? fallbackLocale).toLowerCase().split(/[-_]/u)[0] || 'en',
      conceptId: ql7Str(rawPhrase.conceptId ?? rawPhrase.id),
      dialect: ql7Str(rawPhrase.dialect ?? rawPhrase.region),
    })
  }
  return Object.freeze({ phrase: ql7Str(rawPhrase), sourceLocale: ql7Str(fallbackLocale).toLowerCase().split(/[-_]/u)[0] || 'en', conceptId: '', dialect: '' })
}

function compiledPhrase(value='') {
  const key=normalizeBase(value)
  if(PHRASE_REPRESENTATION_CACHE.has(key))return PHRASE_REPRESENTATION_CACHE.get(key)
  const row=Object.freeze({representations:candidateRepresentations(value),tokens:tokens(value),normalized:normalizeWords(value)})
  if(PHRASE_REPRESENTATION_CACHE.size>20_000)PHRASE_REPRESENTATION_CACHE.clear()
  PHRASE_REPRESENTATION_CACHE.set(key,row)
  return row
}

export function matchQl7SupportConceptPhrases({
  text = '',
  locale = 'en',
  family = '',
  phrases = [],
  risk = 'normal',
  allowFuzzy = true,
  maxHits = 24,
} = {}) {
  const source = ql7Str(text)
  const lexicalUniverse=getQl7LexicalUniverse(locale)
  const sourceRepresentations = candidateRepresentations(source)
  const sourceTokens = tokens(source)
  const hits = []
  const seen = new Set()

  for (const rawPhrase of Array.isArray(phrases) ? phrases : []) {
    const payload = phrasePayload(rawPhrase, locale)
    const phrase = payload.phrase
    if (!phrase) continue
    const compiled = compiledPhrase(phrase)
    const phraseRepresentations = compiled.representations
    let best = null
    for (const src of sourceRepresentations) {
      for (const target of phraseRepresentations) {
        if (exactHit(src.value, target.value)) {
          const similarity = src.value === target.value ? 1 : 0.99
          best = { similarity, path: `${src.path}=>${target.path}`, distance: 0, fuzzy: false }
          break
        }
      }
      if (best) break
    }
    if (!best && allowFuzzy) {
      const fuzzy = phraseTokenFuzzy(sourceTokens, compiled.tokens, risk)
      if (fuzzy && fuzzy.similarity >= (risk === 'high' ? 0.86 : 0.80)) {
        best = { ...fuzzy, path: 'token_damerau_levenshtein', fuzzy: true }
      }
    }
    if (!best) continue

    const key = ql7StableHash(`${family}:${payload.sourceLocale}:${compiled.normalized}`)
    if (seen.has(key)) continue
    seen.add(key)
    hits.push(Object.freeze({
      family: ql7Str(family),
      sourceLocale: payload.sourceLocale,
      conceptId: payload.conceptId,
      dialect: payload.dialect,
      phraseHash: ql7StableHash(phrase),
      matchedConceptHash: key,
      normalizationPath: best.path,
      similarity: Number(best.similarity.toFixed(6)),
      editDistance: Number(best.distance || 0),
      fuzzy: best.fuzzy === true,
      collisionRisk: Number((best.fuzzy ? Math.max(0, 1 - best.similarity) : 0).toFixed(6)),
      sourceHash: ql7StableHash(source),
      rawTextStored: false,
    }))
    if (hits.length >= maxHits) break
  }

  return Object.freeze({
    schema: 'ql7.support.robust-concept-match',
    schemaVersion: QL7_SUPPORT_ROBUST_CONCEPT_MATCHER_VERSION,
    ownerId: QL7_SUPPORT_ROBUST_CONCEPT_MATCHER_OWNER_ID,
    locale: ql7Str(locale).toLowerCase().split(/[-_]/u)[0] || 'en',
    family: ql7Str(family),
    sourceHash: ql7StableHash(source),
    sourceNormalizationHash: ql7StableHash(normalizeWords(source)),
    compactHash: ql7StableHash(compact(source)),
    hits: Object.freeze(hits),
    hitCount: hits.length,
    maxSimilarity: hits.reduce((max, row) => Math.max(max, row.similarity), 0),
    maxCollisionRisk: hits.reduce((max, row) => Math.max(max, row.collisionRisk), 0),
    lexicalUniverse: Object.freeze({version: lexicalUniverse.schemaVersion, locale: lexicalUniverse.locale, materialTermCount: lexicalUniverse.termCount, materialHash: lexicalUniverse.hash, openVocabulary: lexicalUniverse.openVocabulary, neuralGeneralizationRequired: lexicalUniverse.neuralGeneralizationRequired}),
  })
}

export function normalizeQl7SupportConceptText(value = '') {
  return normalizeWords(value)
}

export function auditQl7SupportRobustConceptMatcher() {
  const probes = [
    ['х0чy   умереть', 'хочу умереть'],
    ['k i l l   m y s e l f', 'kill myself'],
    ['s u i c i d e', 'suicide'],
    ['убю себя', 'убью себя'],
  ]
  const rows = probes.map(([input, phrase]) => {
    const receipt = matchQl7SupportConceptPhrases({ text: input, phrases: [phrase], family: 'audit', allowFuzzy: true })
    return Object.freeze({ inputHash: ql7StableHash(input), phraseHash: ql7StableHash(phrase), hit: receipt.hitCount > 0 })
  })
  const failures = rows.filter((row) => !row.hit).map((row) => `probe_failed:${row.inputHash.slice(0,12)}`)
  return Object.freeze({
    ok: failures.length === 0,
    schema: 'ql7.support.robust-concept-matcher-audit',
    schemaVersion: QL7_SUPPORT_ROBUST_CONCEPT_MATCHER_VERSION,
    probeCount: rows.length,
    rows: Object.freeze(rows),
    failures: Object.freeze(failures),
  })
}
