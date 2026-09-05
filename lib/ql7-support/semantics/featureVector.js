import crypto from 'node:crypto'

export const QL7_SUPPORT_SEMANTIC_FEATURE_VECTOR_VERSION = '5.1.1'

const FAMILY_BY_COMPONENT = Object.freeze({
  lexicalScore: 'lexical_morphological',
  phraseScore: 'lexical_morphological',
  entityScore: 'entity_product_alias',
  syntaxScore: 'discourse_speech_act',
  messageActScore: 'discourse_speech_act',
  emotionScore: 'emotion_evidence',
  urgencyScore: 'safety_operational_capability',
  currentGoalScore: 'conversation_memory_agreement',
  recentMaterialTopicScore: 'conversation_memory_agreement',
  verifiedContextScore: 'source_fact_eligibility',
  explicitSwitchScore: 'conversation_memory_agreement',
  negativeEvidencePenalty: 'source_fact_eligibility',
  staleContextPenalty: 'conversation_memory_agreement',
  unrelatedAdapterPenalty: 'source_fact_eligibility',
})

const DEFAULT_NORMALIZATION_PATH = Object.freeze([
  'unicode_nfkc',
  'space_normalization',
])

const stableHash = (value) => crypto
  .createHash('sha256')
  .update(String(value ?? ''))
  .digest('hex')

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)))

const boundedReliability = (value, fallback = 0.8) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? clamp(numeric, 0, 1) : fallback
}

const normalizeScore = (value) => clamp(Number(value || 0) / 10, -1, 1)

function normalizeStringArray(values = []) {
  return Object.freeze(
    [...new Set((Array.isArray(values) ? values : []).map((value) => String(value ?? '').trim()).filter(Boolean))],
  )
}

function createFeature(seed = {}) {
  const sourceSpanStart = Number.isInteger(seed.sourceSpanStart) ? seed.sourceSpanStart : -1
  const sourceSpanEnd = Number.isInteger(seed.sourceSpanEnd) ? seed.sourceSpanEnd : -1

  return Object.freeze({
    featureId: String(seed.featureId || ''),
    featureFamily: String(seed.featureFamily || 'lexical_morphological'),
    locale: String(seed.locale || 'und'),
    sourceSpanStart,
    sourceSpanEnd,
    normalizationPath: normalizeStringArray(seed.normalizationPath || DEFAULT_NORMALIZATION_PATH),
    sourceRuleVersion: String(seed.sourceRuleVersion || 'semantic-score-model:14.15.7'),
    rawValue: Number(seed.rawValue || 0),
    normalizedValue: Number(seed.normalizedValue ?? normalizeScore(seed.rawValue)),
    reliability: boundedReliability(seed.reliability),
    collisionRisk: boundedReliability(seed.collisionRisk, 0),
    supportingHypotheses: normalizeStringArray(seed.supportingHypotheses),
    counterHypotheses: normalizeStringArray(seed.counterHypotheses),
    provenanceKind: String(seed.provenanceKind || 'runtime-derived'),
  })
}

function candidateFeatureRows({ topicCandidates = [], negativeSignals = [], locale = 'und' }) {
  const rows = []
  for (const candidate of (Array.isArray(topicCandidates) ? topicCandidates : []).slice(0, 12)) {
    const topic = String(candidate?.topic || candidate?.candidateId || '').trim()
    if (!topic) continue

    for (const [component, value] of Object.entries(candidate?.components || {})) {
      if (!Number(value)) continue
      rows.push(createFeature({
        featureId: `candidate:${topic}:${component}`,
        featureFamily: FAMILY_BY_COMPONENT[component] || 'lexical_morphological',
        locale,
        rawValue: value,
        reliability: 0.85,
        supportingHypotheses: [topic],
        counterHypotheses: negativeSignals
          .filter((signal) => String(signal?.topic || '') === topic)
          .map((signal) => signal?.signal),
        provenanceKind: 'candidate-component',
      }))
    }

    rows.push(createFeature({
      featureId: `candidate:${topic}:total`,
      featureFamily: 'lexical_morphological',
      locale,
      rawValue: candidate?.total,
      reliability: 0.8,
      supportingHypotheses: [topic],
      provenanceKind: 'candidate-total',
    }))
  }
  return rows
}

export function buildQl7FeatureVector({
  text = '',
  locale = 'und',
  topicCandidates = [],
  positiveSignals = [],
  negativeSignals = [],
  confidenceMargin = 0,
  semanticEntropy = 0,
  negation = {},
  quotation = {},
  memoryAgreement = 0,
  sourceEligibility = 0,
  codeSwitchRisk = 0,
} = {}) {
  const features = candidateFeatureRows({ topicCandidates, negativeSignals, locale })

  features.push(createFeature({
    featureId: 'meta:confidence_margin',
    featureFamily: 'source_fact_eligibility',
    locale,
    rawValue: confidenceMargin,
    normalizedValue: clamp(Number(confidenceMargin || 0) / 8, 0, 1),
    reliability: 0.9,
    provenanceKind: 'semantic-margin',
  }))

  features.push(createFeature({
    featureId: 'meta:semantic_entropy',
    featureFamily: 'modality_uncertainty',
    locale,
    rawValue: semanticEntropy,
    normalizedValue: clamp(Number(semanticEntropy || 0) / 4, 0, 1),
    reliability: 0.9,
    provenanceKind: 'semantic-entropy',
  }))

  features.push(createFeature({
    featureId: 'context:negation',
    featureFamily: 'negation_scope',
    locale,
    rawValue: negation?.hasNegation ? 1 : 0,
    reliability: 0.95,
    counterHypotheses: negation?.hasNegation ? ['literal_positive_reading'] : [],
    provenanceKind: 'negation-resolver',
  }))

  const quotationPresent = Boolean(quotation?.quoted || quotation?.reported)
  features.push(createFeature({
    featureId: 'context:quotation',
    featureFamily: 'quotation_reported_speech',
    locale,
    rawValue: quotationPresent ? 1 : 0,
    reliability: 0.95,
    counterHypotheses: quotationPresent ? ['speaker_is_actor'] : [],
    provenanceKind: 'quotation-resolver',
  }))

  features.push(createFeature({
    featureId: 'context:memory_agreement',
    featureFamily: 'conversation_memory_agreement',
    locale,
    rawValue: memoryAgreement,
    reliability: 0.85,
    provenanceKind: 'memory-graph',
  }))

  features.push(createFeature({
    featureId: 'context:source_eligibility',
    featureFamily: 'source_fact_eligibility',
    locale,
    rawValue: sourceEligibility,
    reliability: 0.98,
    provenanceKind: 'source-policy',
  }))

  features.push(createFeature({
    featureId: 'context:locale_agreement',
    featureFamily: 'locale_script_codeswitch_agreement',
    locale,
    rawValue: 1 - Number(codeSwitchRisk || 0),
    normalizedValue: clamp(1 - Number(codeSwitchRisk || 0), -1, 1),
    reliability: 0.9,
    collisionRisk: codeSwitchRisk,
    provenanceKind: 'locale-arbitration',
  }))

  const body = {
    schema: 'ql7.support.semantic-feature-vector',
    schemaVersion: QL7_SUPPORT_SEMANTIC_FEATURE_VECTOR_VERSION,
    locale: String(locale || 'und'),
    textHash: stableHash(text),
    features: Object.freeze(features),
    positiveSignals: Object.freeze([...(Array.isArray(positiveSignals) ? positiveSignals : [])]),
    negativeSignals: Object.freeze([...(Array.isArray(negativeSignals) ? negativeSignals : [])]),
    provenanceComplete: features.every((feature) => Boolean(feature.featureFamily && feature.sourceRuleVersion)),
  }

  return Object.freeze({
    ...body,
    receiptHash: stableHash(JSON.stringify(body)),
  })
}
