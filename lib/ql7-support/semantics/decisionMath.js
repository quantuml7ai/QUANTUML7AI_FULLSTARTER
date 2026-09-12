import crypto from 'node:crypto'
import {buildQl7FeatureVector} from './featureVector.js'
import {scoreQl7Candidates} from './candidateScorer.js'
import {calibrateQl7Posterior} from './calibratedPosterior.js'
import {evaluateQl7Abstention} from './abstentionPolicy.js'
import {collectQl7CounterEvidence} from './counterEvidence.js'
import {resolveQl7NegationScope} from './negationScopeResolver.js'
import {resolveQl7QuotationContext} from './quotationContextResolver.js'
import {decisionCostFor, expectedQl7DecisionLoss, QL7_SUPPORT_DECISION_COST_MATRIX_VERSION} from './decisionCostMatrix.js'
import {resolveQl7Coreference} from './coreferenceResolver.js'

export const QL7_SUPPORT_DECISION_MATH_VERSION = '6.0.0'
export const QL7_SUPPORT_DECISION_MATH_OWNER_ID = 'ql7-support.semantic-decision-math'

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0))
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const sha = (value) => crypto.createHash('sha256').update(String(value ?? '')).digest('hex')

function posteriorMetrics(rows = []) {
  const probabilities = (Array.isArray(rows) ? rows : [])
    .map((row) => clamp01(row?.posterior))
    .filter(Number.isFinite)
  const top = probabilities[0] || 0
  const second = probabilities[1] || 0
  const rawEntropy = -probabilities.reduce((sum, p) => p > 0 ? sum + p * Math.log(p) : sum, 0)
  const maxEntropy = probabilities.length > 1 ? Math.log(probabilities.length) : 0
  return Object.freeze({
    topProbability: top,
    secondProbability: second,
    margin: Math.max(0, top - second),
    normalizedEntropy: maxEntropy > 0 ? clamp01(rawEntropy / maxEntropy) : 0,
    posteriorCount: probabilities.length,
  })
}

function evidenceMetrics({ featureVector = {}, counterEvidence = {}, evidenceCoverage = 1, locale = '', domain = '', memoryGraph = {}, sourceStaleness = 0 } = {}) {
  const features = Array.isArray(featureVector?.features) ? featureVector.features : []
  const supported = features.filter((row) => Math.abs(finite(row?.normalizedValue)) > 0.001)
  const reliable = supported.filter((row) => finite(row?.reliability, 0) >= 0.6)
  const collisionRisk = features.reduce((max, row) => Math.max(max, clamp01(row?.collisionRisk)), 0)
  const counterRows = Array.isArray(counterEvidence?.rows) ? counterEvidence.rows : Array.isArray(counterEvidence) ? counterEvidence : []
  const localeId = String(locale || '').toLowerCase().split(/[-_]/u)[0]
  const activeDomain = String(memoryGraph?.activeTopic || memoryGraph?.activeDomain || '')
  return Object.freeze({
    evidenceCoverage: clamp01(evidenceCoverage),
    featureSupportCount: supported.length,
    reliableFeatureCount: reliable.length,
    reliableFeatureRatio: supported.length ? reliable.length / supported.length : 0,
    counterEvidenceCount: counterRows.length,
    counterEvidenceCoverage: counterRows.length ? clamp01(Math.min(1, counterRows.length / Math.max(1, supported.length))) : 0,
    localeAgreement: localeId && features.some((row) => String(row?.locale || '').toLowerCase().split(/[-_]/u)[0] === localeId) ? 1 : localeId ? 0.5 : 0,
    memoryAgreement: domain && activeDomain ? (String(domain) === activeDomain ? 1 : 0) : 0.5,
    sourceFreshness: clamp01(1 - Math.max(0, finite(sourceStaleness))),
    featureCollisionRisk: collisionRisk,
  })
}

function policyEligibility({
  decisionKind = 'general_answer',
  policyProofPresent = false,
  evidenceCoverage = 1,
  sourceStaleness = 0,
  semanticEvidencePresent = false,
} = {}) {
  const policyProofRequired = ['economic_action', 'restriction', 'quarantine'].includes(decisionKind)
  const deterministicProofEligible = !policyProofRequired || policyProofPresent === true
  const sourceEligible = clamp01(1 - Math.max(0, finite(sourceStaleness))) >= (policyProofRequired ? 0.95 : 0.4)
  const evidenceEligible = clamp01(evidenceCoverage) >= (policyProofRequired ? 1 : 0.5)
  const semanticEvidenceEligible = semanticEvidencePresent === true
  return Object.freeze({
    policyProofRequired,
    deterministicProofPresent: policyProofPresent === true,
    deterministicProofEligible,
    sourceEligible,
    evidenceEligible,
    semanticEvidencePresent: semanticEvidenceEligible,
    sideEffectEligible: semanticEvidenceEligible && deterministicProofEligible && sourceEligible && evidenceEligible,
    generativeScoreIsAuthority: false,
  })
}

export function buildQl7DecisionMathReceipt({
  text = '',
  locale = 'und',
  domain = '',
  intentFamily = '',
  scoring = {},
  decisionKind = 'general_answer',
  policyProofPresent = false,
  evidenceCoverage = 1,
  collisionRisk = 0,
  sourceStaleness = 0,
  analysis = {},
  memoryGraph = {},
} = {}) {
  const negation = resolveQl7NegationScope(text)
  const quotation = resolveQl7QuotationContext(text)
  const memoryAgreement = memoryGraph?.activeTopic === domain || memoryGraph?.activeDomain === domain ? 1 : 0

  const featureVector = buildQl7FeatureVector({
    ...scoring,
    text,
    locale,
    negation,
    quotation,
    memoryAgreement,
    sourceEligibility: evidenceCoverage,
    codeSwitchRisk: collisionRisk,
  })

  const scoredCandidates = scoreQl7Candidates(featureVector)
  const reliableEvidenceCount = (featureVector?.features || []).filter((row) => Math.abs(finite(row?.normalizedValue)) > 0.001 && finite(row?.reliability) >= 0.6).length
  const topCandidateScore = finite(scoredCandidates?.[0]?.score, 0)
  const unknownRequired = scoredCandidates.length < 2 || reliableEvidenceCount < 2
  const unknownCandidate = Object.freeze({
    candidateId: 'unknown_open_set',
    bias: 0,
    score: Number((topCandidateScore - (reliableEvidenceCount >= 2 ? 1.15 : 0.35)).toFixed(6)),
    contributions: Object.freeze([]),
    familyValues: Object.freeze({}),
    provenance: Object.freeze([{ featureId: 'open_set:unknown', featureFamily: 'open_set_unknown', normalizedValue: 1, weight: 1, contribution: 0 }]),
    scorerVersion: 'open-set-guard',
  })
  const candidates = Object.freeze((unknownRequired ? [...scoredCandidates, unknownCandidate] : [...scoredCandidates, unknownCandidate]).sort((a,b)=>b.score-a.score||a.candidateId.localeCompare(b.candidateId)))
  const calibrated = calibrateQl7Posterior(candidates, {
    runtimeVersion: QL7_SUPPORT_DECISION_MATH_VERSION,
    locale,
    domain,
    intentFamily,
    cellSamples: Number(scoring?.calibrationCellSamples || 0),
  })
  const posterior = calibrated.rows
  const metrics = posteriorMetrics(posterior)
  const calibrationDatasetHash = String(calibrated?.calibrator?.calibrationDatasetHash || '')
  const calibrationAcceptanceHash = String(calibrated?.calibrator?.frozenAcceptanceHash || '')
  const empiricalCalibrationValid = calibrated.valid === true && calibrated.sparseCell !== true && Boolean(calibrationDatasetHash) && !/^pending(?:[-_:]|$)/iu.test(calibrationDatasetHash) && Boolean(calibrationAcceptanceHash) && !/^frozen-unseen$/iu.test(calibrationAcceptanceHash)
  const semanticEvidencePresent =
    calibrated.valid === true &&
    metrics.posteriorCount > 0 &&
    metrics.topProbability > 0 &&
    posterior.some((row) => String(row?.candidateId || '').trim() && row.candidateId !== 'unknown_open_set')
  const counterEvidence = collectQl7CounterEvidence({ text, analysis, negation, quotation })
  const evidence = evidenceMetrics({ featureVector, counterEvidence, evidenceCoverage, locale, domain, memoryGraph, sourceStaleness })
  const effectiveCollisionRisk = Math.max(clamp01(collisionRisk), evidence.featureCollisionRisk)

  const abstention = evaluateQl7Abstention({
    posterior,
    margin: metrics.margin,
    entropy: metrics.normalizedEntropy,
    decisionKind,
    evidenceCoverage: evidence.evidenceCoverage,
    collisionRisk: effectiveCollisionRisk,
    policyProofPresent,
    oodScore: Number(analysis?.oodScore || analysis?.semanticFrame?.oodScore || 0),
    costOfError: Math.min(1, Number(decisionCostFor(decisionKind)?.errorCost || 0) / 100),
  })

  const unknownTop = String(posterior?.[0]?.candidateId || '') === 'unknown_open_set'
  const prelabUncalibrated = empiricalCalibrationValid !== true
  const effectiveAbstention = Object.freeze({
    ...abstention,
    semanticAbstain: Boolean(abstention.semanticAbstain || unknownTop || (scoredCandidates.length <= 1 && prelabUncalibrated)),
    reasons: Object.freeze([...(abstention.reasons || []), ...(unknownTop ? ['open_set_unknown'] : []), ...(scoredCandidates.length <= 1 && prelabUncalibrated ? ['singleton_uncalibrated'] : [])].filter((v,i,a)=>a.indexOf(v)===i)),
  })

  const cost = decisionCostFor(decisionKind)
  const expectedLoss = expectedQl7DecisionLoss({
    posterior,
    decisionKind,
    entropy: metrics.normalizedEntropy,
    evidenceCoverage: evidence.evidenceCoverage,
    collisionRisk: effectiveCollisionRisk,
    sourceStaleness,
  })
  const eligibility = policyEligibility({ decisionKind, policyProofPresent, evidenceCoverage, sourceStaleness, semanticEvidencePresent })
  const coreference = resolveQl7Coreference({ text, memoryGraph })

  const semanticDecision = effectiveAbstention.semanticAbstain || effectiveAbstention.evidenceInsufficient
    ? 'clarify_or_abstain'
    : 'proceed'
  const policyDecision = !eligibility.sideEffectEligible && eligibility.policyProofRequired
    ? 'hold_for_deterministic_proof'
    : 'semantic_layer_no_side_effect_authority'

  const body = {
    schema: 'ql7.support.decision-math-receipt',
    schemaVersion: QL7_SUPPORT_DECISION_MATH_VERSION,
    ownerId: QL7_SUPPORT_DECISION_MATH_OWNER_ID,
    locale,
    domain,
    intentFamily,
    decisionKind,
    featureVectorHash: featureVector.receiptHash,
    featureVector,
    candidates,
    posterior,
    posteriorMetrics: metrics,
    semanticEvidencePresent,
    calibrator: calibrated.calibrator,
    posteriorNumericallyValid: calibrated.valid === true,
    calibrationValid: empiricalCalibrationValid,
    sparseCalibrationCell: calibrated.sparseCell === true,
    abstention: effectiveAbstention,
    policyHold: effectiveAbstention.policyHold === true,
    evidenceMetrics: evidence,
    counterEvidence,
    negation,
    quotation,
    cost,
    expectedLoss,
    collisionRisk: effectiveCollisionRisk,
    sourceStaleness: finite(sourceStaleness),
    policyEligibility: eligibility,
    coreference,
    semanticDecision,
    policyDecision,
    semanticConfidence: empiricalCalibrationValid ? clamp01(metrics.topProbability) : Math.min(0.49, clamp01(metrics.topProbability)),
    semanticConfidenceKind: empiricalCalibrationValid ? 'empirical_calibrated_probability' : 'prelab_heuristic_not_probability',
    openSetUnknownPresent: true,
    openSetUnknownTop: unknownTop,
    coverageConfidence: clamp01(evidence.evidenceCoverage * Math.max(0.25, evidence.reliableFeatureRatio)),
    sourceConfidence: clamp01(evidence.sourceFreshness),
    policyConfidence: eligibility.policyProofRequired ? (eligibility.sideEffectEligible ? 1 : 0) : clamp01(Math.min(metrics.topProbability || 0, Math.max(0.25,evidence.evidenceCoverage))),
    calibrationStatus: empiricalCalibrationValid ? 'empirically-calibrated' : (calibrated.valid === true ? 'PRELAB_UNCALIBRATED' : 'calibration-invalid'),
    calibrationDatasetHash,
    calibrationAcceptanceHash,
    temperatureVersion: String(calibrated?.calibrator?.calibratorId || 'unversioned-temperature'),
    costMatrixVersion: QL7_SUPPORT_DECISION_COST_MATRIX_VERSION,
    decisionVectorHash: sha(JSON.stringify({
      top: metrics.topProbability,
      margin: metrics.margin,
      entropy: metrics.normalizedEntropy,
      evidence: evidence.evidenceCoverage,
      counter: evidence.counterEvidenceCoverage,
      locale: evidence.localeAgreement,
      memory: evidence.memoryAgreement,
      freshness: evidence.sourceFreshness,
      eligible: eligibility.sideEffectEligible,
      expectedLoss,
    })),
  }
  return Object.freeze({ ...body, receiptHash: sha(JSON.stringify(body)) })
}

export function auditQl7DecisionMathContract() {
  const required = ['topProbability','margin','normalizedEntropy']
  const receipt = buildQl7DecisionMathReceipt({
    text: 'show my wallet status',
    locale: 'en',
    domain: 'wallet',
    intentFamily: 'status',
    decisionKind: 'personal_read',
    evidenceCoverage: 0.8,
    sourceStaleness: 0.05,
    scoring: {
      topicCandidates: [
        { topic: 'wallet', total: 7.4, components: { lexicalScore: 4, entityScore: 2.4, messageActScore: 1 } },
        { topic: 'payments', total: 2.2, components: { lexicalScore: 1.2, entityScore: 1 } },
      ],
      positiveSignals: [{ topic: 'wallet', signal: 'audit_wallet_status', component: 'entityScore', value: 2.4 }],
      negativeSignals: [],
      confidenceMargin: 5.2,
      semanticEntropy: 0.55,
      calibrationCellSamples: 1000,
    },
    memoryGraph: { activeTopic: 'wallet' },
  })
  const failures = []
  for (const key of required) if (!Number.isFinite(Number(receipt?.posteriorMetrics?.[key]))) failures.push(`missing_metric:${key}`)
  if (Number(receipt?.posteriorMetrics?.posteriorCount || 0) < 2) failures.push('posterior_candidates_missing')
  if (!(Number(receipt?.posteriorMetrics?.topProbability || 0) > 0)) failures.push('top_probability_zero')
  if (receipt?.semanticEvidencePresent !== true) failures.push('semantic_evidence_missing')
  if (receipt?.policyEligibility?.generativeScoreIsAuthority !== false) failures.push('generative_score_authority')
  if (!receipt?.receiptHash) failures.push('receipt_hash_missing')
  return Object.freeze({ ok: failures.length === 0, schemaVersion: QL7_SUPPORT_DECISION_MATH_VERSION, failures: Object.freeze(failures) })
}
