import {QL7_SUPPORT_APPROVED_INTERACTIONS} from './approvedInteractions.js'

export const QL7_SUPPORT_CANDIDATE_SCORER_VERSION = '5.1.1'

const BASE_WEIGHT = Object.freeze({
  lexical_morphological: 1,
  entity_product_alias: 1.25,
  negation_scope: 0.8,
  quotation_reported_speech: 0.8,
  temporal_future_past: 0.6,
  actor_target_action: 1,
  modality_uncertainty: -0.35,
  discourse_speech_act: 0.8,
  emotion_evidence: 0.55,
  safety_operational_capability: 1.5,
  conversation_memory_agreement: 0.7,
  source_fact_eligibility: 1.1,
  locale_script_codeswitch_agreement: 0.6,
})

const candidatePattern = /^candidate:([^:]+):(.+)$/u
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

function contributionForFeature(feature) {
  const weight = finite(BASE_WEIGHT[feature?.featureFamily], 1)
  const normalizedValue = finite(feature?.normalizedValue) * finite(feature?.reliability, 1)
  return Object.freeze({
    featureId: String(feature?.featureId || ''),
    featureFamily: String(feature?.featureFamily || ''),
    normalizedValue,
    weight,
    contribution: weight * normalizedValue,
    counterHypotheses: Object.freeze([...(feature?.counterHypotheses || [])]),
  })
}

function interactionContribution(row, interaction) {
  const [leftFamily, rightFamily] = interaction?.families || []
  const left = finite(row.familyValues[leftFamily])
  const right = finite(row.familyValues[rightFamily])
  if (!left || !right) return null

  const contribution = finite(interaction?.weight) * left * right
  return Object.freeze({
    interactionId: String(interaction?.interactionId || ''),
    families: Object.freeze([leftFamily, rightFamily]),
    contribution,
  })
}

export function scoreQl7Candidates(featureVector = {}) {
  const candidates = new Map()

  for (const feature of featureVector?.features || []) {
    const match = candidatePattern.exec(String(feature?.featureId || ''))
    if (!match) continue

    const candidateId = match[1]
    const row = candidates.get(candidateId) || {
      candidateId,
      bias: 0,
      score: 0,
      contributions: [],
      familyValues: {},
    }

    const contribution = contributionForFeature(feature)
    row.score += contribution.contribution
    row.familyValues[contribution.featureFamily] =
      finite(row.familyValues[contribution.featureFamily]) + contribution.normalizedValue
    row.contributions.push(contribution)
    candidates.set(candidateId, row)
  }

  for (const row of candidates.values()) {
    for (const interaction of QL7_SUPPORT_APPROVED_INTERACTIONS) {
      const contribution = interactionContribution(row, interaction)
      if (!contribution) continue
      row.score += contribution.contribution
      row.contributions.push(contribution)
    }

    row.score = Number(row.score.toFixed(6))
    row.provenance = Object.freeze([...row.contributions])
    row.familyValues = Object.freeze({ ...row.familyValues })
    row.contributions = Object.freeze([...row.contributions])
    row.scorerVersion = QL7_SUPPORT_CANDIDATE_SCORER_VERSION
    Object.freeze(row)
  }

  return Object.freeze(
    [...candidates.values()]
      .sort((left, right) => right.score - left.score || left.candidateId.localeCompare(right.candidateId)),
  )
}
