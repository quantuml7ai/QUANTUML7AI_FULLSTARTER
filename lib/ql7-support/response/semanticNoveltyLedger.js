import crypto from 'node:crypto'
import {ql7Arr, ql7Sentences, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_SEMANTIC_NOVELTY_LEDGER_VERSION = '6.0.0'

function cap(values, limit) {
  return Object.freeze(ql7Arr(values).slice(-limit))
}

function strongHash(value = '') {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex')
}

export function normalizeQl7SupportNoveltyText(text = '') {
  return ql7Str(text)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function clauses(text = '') {
  return ql7Str(text).split(/[,:;.!?。！？]+/u).map(normalizeQl7SupportNoveltyText).filter(Boolean)
}

function rhetoricalSkeleton(text = '') {
  return ql7Sentences(text).map((sentence) => {
    const words = normalizeQl7SupportNoveltyText(sentence).split(' ').filter(Boolean)
    const lengths = words.map((word) => Math.min(12, [...word].length)).join('.')
    return `${Math.min(words.length, 32)}:${/[?？]$/u.test(sentence) ? 'q' : /[!！]$/u.test(sentence) ? 'x' : 's'}:${lengths}`
  }).join('|')
}

function minHashSignature(tokens = [], slots = 16) {
  const shingles = []
  for (let index = 0; index < tokens.length; index += 1) {
    shingles.push(tokens[index])
    if (tokens[index + 1]) shingles.push(`${tokens[index]} ${tokens[index + 1]}`)
    if (tokens[index + 2]) shingles.push(`${tokens[index]} ${tokens[index + 1]} ${tokens[index + 2]}`)
  }
  if (!shingles.length) return Object.freeze([])
  const signature = []
  for (let slot = 0; slot < slots; slot += 1) {
    let minimum = null
    for (const shingle of shingles) {
      const value = strongHash(`${slot}:${shingle}`).slice(0, 16)
      if (minimum === null || value < minimum) minimum = value
    }
    signature.push(minimum)
  }
  return Object.freeze(signature)
}

function lexicalEmbeddingSignature(tokens = []) {
  if (!tokens.length) return '0000000000000000'
  const dimensions = Array.from({ length: 64 }, () => 0)
  for (const token of tokens) {
    const hash = BigInt(`0x${strongHash(token).slice(0, 16)}`)
    for (let bit = 0; bit < 64; bit += 1) {
      dimensions[bit] += ((hash >> BigInt(bit)) & 1n) === 1n ? 1 : -1
    }
  }
  let signature = 0n
  for (let bit = 0; bit < 64; bit += 1) {
    if (dimensions[bit] >= 0) signature |= 1n << BigInt(bit)
  }
  return signature.toString(16).padStart(16, '0')
}

function factualConstantMask(text = '') {
  const source = ql7Str(text)
  const constants = [
    ...source.matchAll(/https?:\/\/[^\s]+/giu),
    ...source.matchAll(/\b\d+(?:[.,]\d+)?(?:%|\p{Sc})?\b/gu),
    ...source.matchAll(/\b(?:0x)?[a-f0-9]{24,}\b/giu),
  ].map((match) => strongHash(match[0]).slice(0, 24))
  return Object.freeze([...new Set(constants)])
}

export function fingerprintQl7SupportResponse(text = '', {
  title = '',
  semanticPlanHash = '',
  immutableFactFragments = [],
} = {}) {
  const normalized = normalizeQl7SupportNoveltyText(text)
  const sentenceRows = ql7Sentences(text).map(normalizeQl7SupportNoveltyText).filter(Boolean)
  const clauseRows = clauses(text)
  const tokens = normalized.split(' ').filter(Boolean)
  const opening = tokens.slice(0, 10).join(' ')
  const closing = tokens.slice(-10).join(' ')
  const immutableRows = ql7Arr(immutableFactFragments)
    .filter((row) => ql7Str(row?.fragmentId) && ql7Str(row?.text))
  const immutableSentenceHashes = new Set()
  const immutableClauseHashes = new Set()
  const immutableNormalizedRows = []
  for (const row of immutableRows) {
    immutableNormalizedRows.push(normalizeQl7SupportNoveltyText(row.text))
    for (const sentence of ql7Sentences(row.text).map(normalizeQl7SupportNoveltyText).filter(Boolean)) {
      immutableSentenceHashes.add(strongHash(sentence))
    }
    for (const clause of clauses(row.text)) immutableClauseHashes.add(strongHash(clause))
  }
  return Object.freeze({
    hashAlgorithm: 'sha256',
    exactHash: strongHash(ql7Str(text)),
    normalizedHash: strongHash(normalized),
    orderedSentenceHash: strongHash(sentenceRows.join('\n')),
    unorderedSentenceMultisetHash: strongHash([...sentenceRows].sort().join('\n')),
    orderedClauseHash: strongHash(clauseRows.join('\n')),
    unorderedClauseMultisetHash: strongHash([...clauseRows].sort().join('\n')),
    sentenceHashes: Object.freeze(sentenceRows.map(strongHash)),
    clauseHashes: Object.freeze(clauseRows.map(strongHash)),
    rhetoricalSkeletonHash: strongHash(rhetoricalSkeleton(text)),
    openingHash: strongHash(opening),
    closingHash: strongHash(closing),
    titleHash: ql7Str(title) ? strongHash(normalizeQl7SupportNoveltyText(title)) : '',
    semanticPlanHash: ql7Str(semanticPlanHash),
    minHashSignature: minHashSignature(tokens),
    embeddingSignature: lexicalEmbeddingSignature(tokens),
    factualConstantMask: factualConstantMask(text),
    immutableFactFragmentIds: Object.freeze(immutableRows.map((row) => ql7Str(row.fragmentId))),
    immutableSentenceHashes: Object.freeze([...immutableSentenceHashes]),
    immutableClauseHashes: Object.freeze([...immutableClauseHashes]),
    openingIsImmutableFact: Boolean(opening && immutableNormalizedRows.some((value) => value.includes(opening))),
    closingIsImmutableFact: Boolean(closing && immutableNormalizedRows.some((value) => value.includes(closing))),
    tokenSet: Object.freeze([...new Set(tokens)].slice(0, 256)),
  })
}

export function createQl7SupportSemanticNoveltyLedger(input = {}) {
  return Object.freeze({
    schema: 'ql7.support.semantic-novelty-ledger',
    version: QL7_SUPPORT_SEMANTIC_NOVELTY_LEDGER_VERSION,
    exactHashes: cap(input.exactHashes || input.responseFingerprints, 1000),
    normalizedHashes: cap(input.normalizedHashes, 1000),
    sentenceMultisetHashes: cap(input.sentenceMultisetHashes, 1000),
    clauseMultisetHashes: cap(input.clauseMultisetHashes, 1000),
    rhetoricalSkeletonHashes: cap(input.rhetoricalSkeletonHashes, 100),
    sentenceHashes: cap(input.sentenceHashes, 4000),
    clauseHashes: cap(input.clauseHashes, 8000),
    openingHashes: cap(input.openingHashes, 100),
    closingHashes: cap(input.closingHashes, 100),
    titleHashes: cap(input.titleHashes, 100),
    semanticPlanHashes: cap(input.semanticPlanHashes, 1000),
    recentResponses: cap(input.recentResponses, 100),
  })
}

export function commitQl7SupportNoveltyFingerprint(ledgerInput = {}, text = '', metadata = {}) {
  const ledger = createQl7SupportSemanticNoveltyLedger(ledgerInput)
  const fingerprint = fingerprintQl7SupportResponse(text, {
    title: metadata.title,
    semanticPlanHash: metadata.semanticPlanHash,
    immutableFactFragments: metadata.immutableFactFragments,
  })
  const response = Object.freeze({
    textHash: fingerprint.exactHash,
    normalizedHash: fingerprint.normalizedHash,
    tokenSet: fingerprint.tokenSet,
    locale: ql7Str(metadata.locale),
    branch: ql7Str(metadata.branch),
      semanticEmbedding: Array.isArray(metadata.semanticEmbedding) ? Object.freeze(metadata.semanticEmbedding.map(Number)) : null,
  })
  return createQl7SupportSemanticNoveltyLedger({
    exactHashes: [...ledger.exactHashes, fingerprint.exactHash],
    normalizedHashes: [...ledger.normalizedHashes, fingerprint.normalizedHash],
    sentenceMultisetHashes: [...ledger.sentenceMultisetHashes, fingerprint.unorderedSentenceMultisetHash],
    clauseMultisetHashes: [...ledger.clauseMultisetHashes, fingerprint.unorderedClauseMultisetHash],
    rhetoricalSkeletonHashes: [...ledger.rhetoricalSkeletonHashes, fingerprint.rhetoricalSkeletonHash],
    sentenceHashes: [...ledger.sentenceHashes, ...fingerprint.sentenceHashes],
    clauseHashes: [...ledger.clauseHashes, ...fingerprint.clauseHashes],
    openingHashes: [...ledger.openingHashes, fingerprint.openingHash],
    closingHashes: [...ledger.closingHashes, fingerprint.closingHash],
    titleHashes: fingerprint.titleHash ? [...ledger.titleHashes, fingerprint.titleHash] : ledger.titleHashes,
    semanticPlanHashes: fingerprint.semanticPlanHash
      ? [...ledger.semanticPlanHashes, fingerprint.semanticPlanHash]
      : ledger.semanticPlanHashes,
    recentResponses: [...ledger.recentResponses, response],
  })
}
