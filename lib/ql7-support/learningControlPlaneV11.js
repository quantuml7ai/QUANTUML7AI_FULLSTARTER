import crypto from 'node:crypto'

export const QL7_SUPPORT_LEARNING_CONTROL_VERSION_V11 = 'ql7-learning-control-v11'
function str(value) { return String(value ?? '').trim() }
function clamp(value) { const number = Number(value); return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0 }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }

export function calculateQl7SupportCognitiveMaturityV11(metrics = {}, { evalRunId = '', corpusHash = '', modelVersion = 'v11', asOf = new Date().toISOString() } = {}) {
  const keys = [
    'topicAccuracy', 'subIntentAccuracy', 'ambiguityQuality', 'topicSwitchAccuracy',
    'groundingReliability', 'translationQuality', 'structuredLocalizationCoverage',
    'actionAccuracy', 'diagnosticAccuracy', 'responseNovelty', 'toneAppropriateness',
    'userAdaptationConfidence', 'safetyReliability', 'regressionStability', 'evidenceCoverage',
  ]
  const requiredForQualification = ['topicAccuracy', 'topicSwitchAccuracy', 'safetyReliability', 'regressionStability', 'evidenceCoverage']
  const weights = Object.freeze({ topicAccuracy: 3, topicSwitchAccuracy: 2, safetyReliability: 3, regressionStability: 2, ambiguityQuality: 1, evidenceCoverage: 0.5 })
  const slices = {}
  let weighted = 0
  let totalWeight = 0
  let criticalFailures = 0
  for (const key of keys) {
    const source = metrics?.[key]
    const score = clamp(typeof source === 'object' ? source.score : source)
    const sampleSize = Math.max(0, Number(typeof source === 'object' ? source.sampleSize : 0) || 0)
    const suppliedConfidence = typeof source === 'object' ? source?.confidence : undefined
    const confidence = sampleSize > 0
      ? Math.min(1, Math.max(0, Number.isFinite(Number(suppliedConfidence)) ? Number(suppliedConfidence) : (1 - Math.exp(-sampleSize / 120))))
      : 0
    const failures = Math.max(0, Number(typeof source === 'object' ? source.criticalFailures : 0) || 0)
    const measured = sampleSize > 0 && confidence > 0
    const weight = Number(weights[key] || 1)
    criticalFailures = Math.max(criticalFailures, failures)
    if (measured) {
      weighted += score * weight * confidence
      totalWeight += weight * confidence
    }
    slices[key] = { score, sampleSize, confidence, criticalFailures: failures, measured }
  }
  const score = totalWeight ? weighted / totalWeight : 0
  const missingRequiredSlices = requiredForQualification.filter((key) => !slices[key]?.measured)
  const failingRequiredSlices = requiredForQualification.filter((key) => slices[key]?.measured && slices[key].score < 95)
  const status = criticalFailures
    ? 'blocked'
    : (missingRequiredSlices.length
        ? 'insufficient_evidence'
        : (score >= 95 && failingRequiredSlices.length === 0 ? 'qualified' : 'calibrating'))
  return Object.freeze({
    version: QL7_SUPPORT_LEARNING_CONTROL_VERSION_V11,
    status,
    score: Number(score.toFixed(3)),
    criticalFailures,
    measuredSliceCount: Object.values(slices).filter((item) => item.measured).length,
    missingRequiredSlices: Object.freeze(missingRequiredSlices),
    failingRequiredSlices: Object.freeze(failingRequiredSlices),
    slices: Object.freeze(slices),
    sampleSize: Math.max(...Object.values(slices).filter((item) => item.measured).map((item) => item.sampleSize), 0),
    evalRunId: str(evalRunId), corpusHash: str(corpusHash), modelVersion: str(modelVersion), asOf: str(asOf),
    formulaHash: hash({ keys, requiredForQualification, weights, qualificationFloor: 95, unmeasuredWeight: 0, criticalAggregation: 'max' }),
  })
}

export function buildQl7SupportCalibrationCandidateV11({ cluster = {}, evidence = [], proposedChanges = {}, baseline = {}, candidate = {} } = {}) {
  const rows = Array.isArray(evidence) ? evidence : []
  return Object.freeze({
    candidateId: `cal-v11:${hash({ cluster, proposedChanges, at: Date.now() }).slice(0, 36)}`,
    version: QL7_SUPPORT_LEARNING_CONTROL_VERSION_V11,
    status: 'candidate',
    clusterKey: str(cluster?.key || cluster?.clusterKey).slice(0, 240),
    evidenceCount: rows.length,
    evidenceHashes: rows.slice(0, 200).map((row) => hash(row)),
    proposedChanges,
    baseline,
    candidate,
    requiredStages: ['privacy_review', 'poisoning_review', 'offline_simulation', 'regression_compare', 'shadow', 'canary'],
    autoPromotionAllowed: false,
    sourceRewriteAllowed: false,
    createdAt: new Date().toISOString(),
  })
}

export function evaluateQl7SupportPromotionGateV11({ baseline = {}, candidate = {}, criticalFailures = [] } = {}) {
  const failures = (Array.isArray(criticalFailures) ? criticalFailures : []).filter(Boolean)
  const baseScore = Number(baseline?.score || 0)
  const nextScore = Number(candidate?.score || 0)
  const required = ['safetyReliability', 'groundingReliability', 'actionAccuracy', 'regressionStability']
  const gates = required.map((key) => ({ key, baseline: Number(baseline?.slices?.[key]?.score || 0), candidate: Number(candidate?.slices?.[key]?.score || 0) }))
  const regressed = gates.filter((gate) => gate.candidate + 0.001 < gate.baseline)
  return Object.freeze({
    allowed: failures.length === 0 && regressed.length === 0 && nextScore >= baseScore,
    failures,
    regressed,
    baselineScore: baseScore,
    candidateScore: nextScore,
    requiresHumanApproval: true,
    automaticSourceRewrite: false,
  })
}

export const QL7_SUPPORT_LEARNING_COMPATIBILITY_MAP_V11 = Object.freeze({
  feedbackEvents: 'ql7_support_feedback_events',
  candidates: 'ql7_support_learning_candidates',
  trainingExamples: 'ql7_support_training_examples',
  knowledgeRevisions: 'ql7_support_knowledge_revisions',
  modelVersions: 'ql7_support_model_versions',
  evaluationRuns: 'ql7_support_eval_runs',
  deploymentState: 'ql7_support_deployment_state',
  userPreferences: 'ql7_support_user_preferences',
  deployments: 'ql7_support_learning_deployments',
  legacySignals: 'ql7_support_learning_signals_v8',
  legacyProfiles: 'ql7_support_communication_profiles_v8',
})

export function buildQl7SupportGovernedLearningStateV11({ stage = 'observation', candidate = null, evaluation = null, deployment = null } = {}) {
  const allowedStages = ['observation', 'candidate', 'privacy_review', 'poisoning_review', 'offline_simulation', 'regression_compare', 'shadow', 'canary', 'promoted', 'rolled_back', 'blocked']
  const normalizedStage = allowedStages.includes(str(stage)) ? str(stage) : 'blocked'
  return Object.freeze({
    version: QL7_SUPPORT_LEARNING_CONTROL_VERSION_V11,
    stage: normalizedStage,
    candidateId: str(candidate?.candidateId || candidate?._id),
    evaluationRunId: str(evaluation?.runId || evaluation?._id),
    deploymentId: str(deployment?.deploymentId || deployment?._id),
    autoPromotionAllowed: false,
    automaticSourceRewrite: false,
    humanApprovalRequired: true,
    compatibleCollections: QL7_SUPPORT_LEARNING_COMPATIBILITY_MAP_V11,
    rollbackRequiredOnRegression: true,
    generatedAt: new Date().toISOString(),
  })
}
