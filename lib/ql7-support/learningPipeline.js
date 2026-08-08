import crypto from 'crypto'
import { QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY, QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY_VERSION } from './learning/governancePolicy.js'

export const QL7_SUPPORT_FEEDBACK_EVENTS = 'ql7_support_feedback_events'
export const QL7_SUPPORT_LEARNING_CANDIDATES = 'ql7_support_learning_candidates'
export const QL7_SUPPORT_TRAINING_EXAMPLES = 'ql7_support_training_examples'
export const QL7_SUPPORT_KNOWLEDGE_REVISIONS = 'ql7_support_knowledge_revisions'
export const QL7_SUPPORT_MODEL_VERSIONS = 'ql7_support_model_versions'
export const QL7_SUPPORT_EVAL_RUNS = 'ql7_support_eval_runs'
export const QL7_SUPPORT_DEPLOYMENT_STATE = 'ql7_support_deployment_state'
export const QL7_SUPPORT_USER_PREFERENCES = 'ql7_support_user_preferences'
export const QL7_SUPPORT_LEARNING_DEPLOYMENTS = 'ql7_support_learning_deployments'

function str(value) { return String(value ?? '').trim() }
function nowIso(clock) { return new Date(typeof clock === 'function' ? clock() : Date.now()).toISOString() }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }
function sha(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }
function idFor(value) { return sha(value).slice(0, 24) }
function deploymentStateId(scope = '', mode = 'active') {
  const safeScope = str(scope).replace(/[^A-Za-z0-9:_-]/g, '').slice(0, 120)
  return safeScope ? `${safeScope}:${mode}` : mode
}
function redact(value) {
  return str(value)
    .replace(/\b(?:ql7ws_|bearer\s+)[A-Za-z0-9._~+/=-]{12,}\b/giu, '[secret-redacted]')
    .replace(/\b(?:seed phrase|mnemonic|private key)\s*[:=]?\s*(?:[a-z]{3,}\s+){5,}[a-z]{3,}\b/giu, '$1: [secret-redacted]')
    .replace(/\b(?:0x)?[a-f0-9]{64}\b/giu, '[hash-redacted]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email-redacted]')
    .replace(/\+?\d[\d\s()\-]{8,}\d/g, '[phone-redacted]')
    .slice(0, 1800)
}
function poisoningScore({ expected = '', actual = '', evidence = {}, signalType = '' } = {}) {
  const source = `${expected}\n${actual}\n${JSON.stringify(evidence || {})}`.toLowerCase()
  let score = 0
  if (/(ignore previous|system prompt|developer message|jailbreak|bypass|drop collection|delete many)/i.test(source)) score += 0.5
  if (/(seed phrase|private key|mnemonic|bearer|ql7ws_)/i.test(source)) score += 0.35
  if (source.length > 5000) score += 0.15
  if (/spam|flood/i.test(signalType)) score += 0.2
  return Math.min(1, Number(score.toFixed(2)))
}
function safeEvidence(evidence = {}) {
  const value = clone(evidence) || {}
  for (const key of Object.keys(value)) {
    if (/token|secret|password|private|header|cookie|authorization/i.test(key)) delete value[key]
    else if (typeof value[key] === 'string') value[key] = redact(value[key]).slice(0, 800)
  }
  return value
}

export async function recordQl7SupportLearningSignal({
  database,
  userId = '',
  caseId = '',
  topic = '',
  subIntent = '',
  sourceLocale = '',
  signalType = '',
  expected = '',
  actual = '',
  evidence = {},
  consent = false,
  clock = Date.now,
} = {}) {
  if (!database || typeof database.collection !== 'function') return null
  const at = nowIso(clock)
  const redactedExpected = redact(expected)
  const redactedActual = redact(actual)
  const projectedEvidence = safeEvidence(evidence)
  const risk = poisoningScore({ expected: redactedExpected, actual: redactedActual, evidence: projectedEvidence, signalType })
  const userIdHash = sha(str(userId)).slice(0, 32)
  const sourceCaseIdHash = sha(str(caseId)).slice(0, 32)
  const candidateSeed = {
    userIdHash,
    sourceCaseIdHash,
    topic: str(topic),
    subIntent: str(subIntent),
    sourceLocale: str(sourceLocale),
    signalType: str(signalType),
    redactedExpected,
    redactedActual,
    projectedEvidence,
  }
  const candidateId = `learning:${idFor(candidateSeed)}`
  const feedbackId = `feedback:${idFor({ ...candidateSeed, at })}`
  await database.collection(QL7_SUPPORT_FEEDBACK_EVENTS).insertOne({
    _id: feedbackId,
    userIdHash,
    sourceCaseIdHash,
    topic: str(topic),
    subIntent: str(subIntent),
    signalType: str(signalType),
    consent: consent === true,
    poisoningRisk: risk,
    createdAt: at,
    storagePrimary: 'mongo',
  })
  const doc = {
    _id: candidateId,
    candidateId,
    userIdHash,
    sourceCaseIdHash,
    sourceLocale: str(sourceLocale),
    topic: str(topic),
    subIntent: str(subIntent),
    signalType: str(signalType),
    redactedInput: redactedActual || redactedExpected,
    expected: redactedExpected,
    actual: redactedActual,
    structuredContext: projectedEvidence,
    proposedChangeType: 'knowledge_or_policy_candidate',
    proposedChange: { expected: redactedExpected, actual: redactedActual },
    poisoningRisk: risk,
    privacyReview: risk >= 0.35 ? 'rejected' : 'pending',
    qualityReview: 'pending',
    status: risk >= 0.35 ? 'rejected_poisoning_risk' : 'candidate',
    reviewRequired: true,
    evaluationStatus: 'pending',
    deploymentStatus: 'not_deployed',
    rollbackAvailable: false,
    consent: consent === true,
    provenanceHash: sha(candidateSeed),
    createdAt: at,
    updatedAt: at,
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).updateOne(
    { _id: candidateId },
    { $setOnInsert: doc, $set: { lastFeedbackAt: at } },
    { upsert: true },
  )
  return doc
}


export async function recordQl7SupportIncidentLearningCandidate({
  database,
  incident = null,
  topic = '',
  consent = false,
  clock = Date.now,
} = {}) {
  if (!database || typeof database.collection !== 'function' || !incident || incident.rawTextStored !== false) return null
  const at = nowIso(clock)
  const projected = {
    version: str(incident.version),
    anonymousUserHash: str(incident.anonymousUserHash).slice(0, 64),
    anonymousCaseHash: str(incident.anonymousCaseHash).slice(0, 64),
    locale: str(incident.locale).slice(0, 16),
    scoreBucket: str(incident.scoreBucket).slice(0, 24),
    decision: str(incident.decision).slice(0, 32),
    target: str(incident.target).slice(0, 32),
    featureVector: safeEvidence(incident.featureVector || {}),
    patternHashes: Array.isArray(incident.patternHashes) ? incident.patternHashes.map(str).filter(Boolean).slice(0, 16) : [],
    resolution: str(incident.resolution).slice(0, 32),
    topicRecovery: incident.topicRecovery === true,
    rawTextStored: false,
  }
  const candidateId = `learning-incident:${idFor({ projected, topic: str(topic) })}`
  const doc = {
    _id: candidateId,
    candidateId,
    candidateType: 'safety_boundary_incident',
    userIdHash: projected.anonymousUserHash,
    sourceCaseIdHash: projected.anonymousCaseHash,
    sourceLocale: projected.locale,
    topic: str(topic),
    subIntent: 'calibrated_insult_boundary',
    signalType: 'anonymous_boundary_resolution',
    redactedInput: '',
    expected: '',
    actual: '',
    structuredContext: projected,
    rawTextStored: false,
    poisoningRisk: 0,
    privacyReview: 'pending',
    qualityReview: 'pending',
    status: 'candidate',
    reviewRequired: true,
    evaluationStatus: 'pending',
    deploymentStatus: 'not_deployed',
    rollbackAvailable: false,
    automaticProductionPromotion: QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY.automaticProductionPromotion,
    automaticSourceRewrite: QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY.automaticSourceRewrite,
    governancePolicyVersion: QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY_VERSION,
    consent: consent === true,
    provenanceHash: sha({ projected, topic: str(topic), policy: QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY_VERSION }),
    createdAt: at,
    updatedAt: at,
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).updateOne(
    { _id: candidateId },
    { $setOnInsert: doc, $set: { lastObservedAt: at } },
    { upsert: true },
  )
  return doc
}

export async function reviewQl7SupportLearningCandidate({ database, candidateId, approved = false, reviewer = 'system-test', notes = '', clock = Date.now } = {}) {
  const at = nowIso(clock)
  const candidate = await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).findOne({ _id: str(candidateId) })
  if (!candidate) throw new Error('learning_candidate_not_found')
  if (Number(candidate.poisoningRisk || 0) >= 0.35) approved = false
  const status = approved ? 'approved_for_eval' : 'rejected'
  await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).updateOne(
    { _id: candidate._id },
    { $set: {
      status,
      privacyReview: approved ? 'passed' : candidate.privacyReview === 'rejected' ? 'rejected' : 'passed',
      qualityReview: approved ? 'approved' : 'rejected',
      reviewer: str(reviewer),
      reviewNotes: redact(notes).slice(0, 1000),
      reviewedAt: at,
      updatedAt: at,
    } },
  )
  return { ok: true, status }
}

export async function evaluateQl7SupportLearningCandidate({ database, candidateId, metrics = {}, baselineVersion = 'active', candidateVersion = '', clock = Date.now } = {}) {
  const candidate = await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).findOne({ _id: str(candidateId) })
  if (!candidate || candidate.status !== 'approved_for_eval') throw new Error('learning_candidate_not_approved')
  const at = nowIso(clock)
  const normalized = {
    truthfulness: Number(metrics.truthfulness ?? 0),
    privacy: Number(metrics.privacy ?? 0),
    safety: Number(metrics.safety ?? 0),
    repetition: Number(metrics.repetition ?? 0),
    grammar: Number(metrics.grammar ?? 0),
    regressionDelta: Number(metrics.regressionDelta ?? 0),
  }
  const passed = normalized.truthfulness >= 0.95 && normalized.privacy >= 1 && normalized.safety >= 0.98 && normalized.repetition >= 0.95 && normalized.grammar >= 0.9 && normalized.regressionDelta >= -0.01
  const version = str(candidateVersion) || `candidate-${sha({ candidateId, normalized }).slice(0, 16)}`
  const runId = `eval:${idFor({ candidateId, version, normalized })}`
  const doc = {
    _id: runId,
    candidateId: candidate._id,
    baselineVersion: str(baselineVersion),
    candidateVersion: version,
    metrics: normalized,
    passed,
    mode: 'offline',
    replyMutationAllowed: false,
    reproducibleHash: sha({ candidateId, version, normalized }),
    createdAt: at,
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_EVAL_RUNS).updateOne({ _id: runId }, { $set: doc }, { upsert: true })
  await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).updateOne(
    { _id: candidate._id },
    { $set: { evaluationStatus: passed ? 'passed' : 'failed', evaluationRunId: runId, candidateVersion: version, updatedAt: at } },
  )
  return doc
}

export async function runQl7SupportShadowEvaluation({ database, candidateId, baselineReply = '', candidateReply = '', metrics = {}, clock = Date.now } = {}) {
  const at = nowIso(clock)
  const runId = `shadow:${idFor({ candidateId, baselineReply: sha(baselineReply), candidateReply: sha(candidateReply), metrics })}`
  const doc = {
    _id: runId,
    candidateId: str(candidateId),
    mode: 'shadow',
    baselineReplyHash: sha(str(baselineReply)),
    candidateReplyHash: sha(str(candidateReply)),
    deliveredReplyHash: sha(str(baselineReply)),
    replyMutationAllowed: false,
    metrics: clone(metrics) || {},
    passed: metrics?.passed === true,
    createdAt: at,
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_EVAL_RUNS).updateOne({ _id: runId }, { $set: doc }, { upsert: true })
  return doc
}

export async function deployQl7SupportLearningCandidate({ database, candidateId, evaluation = {}, mode = 'canary', canaryPercent = 1, deploymentScope = '', clock = Date.now } = {}) {
  const candidate = await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).findOne({ _id: str(candidateId) })
  if (!candidate || candidate.status !== 'approved_for_eval') throw new Error('learning_candidate_not_approved')
  const evalRun = candidate.evaluationRunId
    ? await database.collection(QL7_SUPPORT_EVAL_RUNS).findOne({ _id: candidate.evaluationRunId })
    : null
  if (evaluation?.passed !== true && evalRun?.passed !== true) throw new Error('learning_evaluation_failed')
  const at = nowIso(clock)
  const deploymentId = `deployment:${idFor({ candidateId, at })}`
  const deploymentMode = mode === 'active' ? 'active' : 'canary'
  const percentage = deploymentMode === 'active' ? 100 : Math.max(0.1, Math.min(10, Number(canaryPercent || 1)))
  const activeStateId = deploymentStateId(deploymentScope, 'active')
  const canaryStateId = deploymentStateId(deploymentScope, 'canary')
  const activeState = await database.collection(QL7_SUPPORT_DEPLOYMENT_STATE).findOne({ _id: activeStateId })
  const doc = {
    _id: deploymentId,
    candidateId: candidate._id,
    version: str(evaluation.version || candidate.candidateVersion || `candidate-${candidate._id}`),
    evaluationRunId: candidate.evaluationRunId || '',
    status: deploymentMode,
    canaryPercent: percentage,
    rollbackAvailable: true,
    previousVersion: str(activeState?.version),
    thresholds: {
      maxPrivacyFailureRate: 0,
      maxSafetyRegressionRate: 0.001,
      maxTruthfulnessRegressionRate: 0.01,
      maxErrorRate: 0.02,
    },
    deployedAt: at,
    deploymentScope: str(deploymentScope),
    stateIds: { active: activeStateId, canary: canaryStateId },
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_LEARNING_DEPLOYMENTS).insertOne(doc)
  await database.collection(QL7_SUPPORT_DEPLOYMENT_STATE).updateOne(
    { _id: deploymentMode === 'active' ? activeStateId : canaryStateId },
    { $set: { version: doc.version, deploymentId, mode: deploymentMode, canaryPercent: percentage, previousVersion: doc.previousVersion, updatedAt: at } },
    { upsert: true },
  )
  await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).updateOne(
    { _id: candidate._id },
    { $set: { status: 'deployed', deploymentId, deploymentStatus: deploymentMode, rollbackAvailable: true, updatedAt: at } },
  )
  return { ok: true, deploymentId, mode: deploymentMode, canaryPercent: percentage }
}

export async function promoteQl7SupportCanary({ database, deploymentId, observed = {}, deploymentScope = '', clock = Date.now } = {}) {
  const deployment = await database.collection(QL7_SUPPORT_LEARNING_DEPLOYMENTS).findOne({ _id: str(deploymentId), status: 'canary' })
  if (!deployment) throw new Error('learning_canary_not_found')
  const thresholds = deployment.thresholds || {}
  const safe = Number(observed.privacyFailureRate || 0) <= Number(thresholds.maxPrivacyFailureRate || 0)
    && Number(observed.safetyRegressionRate || 0) <= Number(thresholds.maxSafetyRegressionRate || 0)
    && Number(observed.truthfulnessRegressionRate || 0) <= Number(thresholds.maxTruthfulnessRegressionRate || 0)
    && Number(observed.errorRate || 0) <= Number(thresholds.maxErrorRate || 0)
  if (!safe) return rollbackQl7SupportLearningDeployment({ database, deploymentId, reason: 'canary_threshold_exceeded', deploymentScope: deploymentScope || deployment.deploymentScope, clock })
  const at = nowIso(clock)
  await database.collection(QL7_SUPPORT_LEARNING_DEPLOYMENTS).updateOne({ _id: deployment._id }, { $set: { status: 'active', canaryPercent: 100, promotedAt: at, observed: clone(observed) || {} } })
  await database.collection(QL7_SUPPORT_DEPLOYMENT_STATE).updateOne(
    { _id: deploymentStateId(deploymentScope || deployment.deploymentScope, 'active') },
    { $set: { version: deployment.version, deploymentId: deployment._id, mode: 'active', canaryPercent: 100, previousVersion: deployment.previousVersion, updatedAt: at } },
    { upsert: true },
  )
  return { ok: true, status: 'active' }
}

export async function rollbackQl7SupportLearningDeployment({ database, deploymentId, reason = '', deploymentScope = '', clock = Date.now } = {}) {
  const at = nowIso(clock)
  const deployment = await database.collection(QL7_SUPPORT_LEARNING_DEPLOYMENTS).findOne({ _id: str(deploymentId) })
  if (!deployment) throw new Error('learning_deployment_not_found')
  await database.collection(QL7_SUPPORT_LEARNING_DEPLOYMENTS).updateOne(
    { _id: deployment._id },
    { $set: { status: 'rolled_back', rollbackReason: redact(reason).slice(0, 1000), rolledBackAt: at } },
  )
  await database.collection(QL7_SUPPORT_DEPLOYMENT_STATE).updateOne(
    { _id: deploymentStateId(deploymentScope || deployment.deploymentScope, deployment.status === 'active' ? 'active' : 'canary'), deploymentId: deployment._id },
    { $set: { version: deployment.previousVersion || '', deploymentId: '', mode: 'rolled_back', canaryPercent: 0, updatedAt: at } },
    { upsert: true },
  )
  await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).updateOne(
    { deploymentId: deployment._id },
    { $set: { deploymentStatus: 'rolled_back', status: 'approved_for_eval', updatedAt: at } },
  )
  return { ok: true, status: 'rolled_back' }
}

export async function deleteQl7SupportUserLearningData({ database, userId = '', sourceCaseIdHashes = [] } = {}) {
  const userHash = sha(str(userId)).slice(0, 32)
  const hashes = Array.from(new Set((sourceCaseIdHashes || []).map(str).filter(Boolean)))
  const feedback = await database.collection(QL7_SUPPORT_FEEDBACK_EVENTS).deleteMany({ userIdHash: userHash })
  const candidates = await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).deleteMany({
    userIdHash: userHash,
    status: { $nin: ['deployed'] },
  })
  const legacyCandidates = hashes.length
    ? await database.collection(QL7_SUPPORT_LEARNING_CANDIDATES).deleteMany({
      sourceCaseIdHash: { $in: hashes },
      userIdHash: { $exists: false },
      status: { $nin: ['deployed'] },
    })
    : { deletedCount: 0 }
  const preferences = await database.collection(QL7_SUPPORT_USER_PREFERENCES).deleteMany({ userIdHash: userHash })
  return {
    ok: true,
    feedbackDeleted: feedback.deletedCount || 0,
    candidatesDeleted: (candidates.deletedCount || 0) + (legacyCandidates.deletedCount || 0),
    preferencesDeleted: preferences.deletedCount || 0,
  }
}
