import { ql7Arr, ql7StableHash, ql7Str } from '../internal/text.js'
import { QL7_SUPPORT_ACTIVE_CALIBRATION_MANIFEST } from '../calibration/calibrationManifest.js'
import { createQl7SupportConversationMemoryGraph } from './conversationMemoryGraph.js'
import {
  auditQl7SupportMemoryPrivacy,
  redactQl7SupportMemoryText,
} from './memoryPrivacyPolicy.js'

export const QL7_SUPPORT_PERSISTED_MEMORY_VERSION = '18.0.0'
export const QL7_SUPPORT_PERSISTED_MEMORY_MAX_BYTES = 32 * 1024
export const QL7_SUPPORT_PERSISTED_MEMORY_TTL_SECONDS = 30 * 24 * 60 * 60
export const QL7_SUPPORT_PERSISTED_MEMORY_LIMITS = Object.freeze({
  recentTurnHashes: 24,
  topicFrames: 16,
  factIds: 64,
  unresolvedSlotIds: 32,
  rejectedHypothesisIds: 32,
  commitments: 32,
})

const encoder = new TextEncoder()

function bytes(value) {
  return encoder.encode(JSON.stringify(value)).byteLength
}

function shortId(value, prefix = 'ref') {
  const source = value && typeof value === 'object'
    ? value.factId || value.slotId || value.commitmentId || value.hypothesisId || value.receiptId || value.id || value.code || value.key
    : value
  const clean = ql7Str(source)
  if (!clean) return ''
  if (/^[a-z0-9_.:@/-]{1,96}$/iu.test(clean) && !/(?:token|secret|private|mnemonic|bearer)/iu.test(clean)) return clean
  return `${prefix}:${ql7StableHash(clean)}`
}

function ids(values, limit, prefix) {
  return Object.freeze(Array.from(new Set(
    ql7Arr(values).map((value) => shortId(value, prefix)).filter(Boolean),
  )).slice(-limit))
}

function semanticSummary(value = '') {
  return redactQl7SupportMemoryText(value)
    .replace(/\[REDACTED\]/gu, '[private]')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 240)
}

function frameRecency(frame = {}) {
  const parsed = Date.parse(ql7Str(frame.updatedAt || frame.resolvedAt || frame.createdAt))
  return Number.isFinite(parsed) ? parsed : 0
}

function projectTopicFrame(frame = {}, retainedIds = new Set()) {
  const topicFrameId = shortId(frame.topicFrameId, 'frame')
  return Object.freeze({
    topicFrameId,
    parentTopicFrameId: retainedIds.has(frame.parentTopicFrameId) ? shortId(frame.parentTopicFrameId, 'frame') : '',
    branchOfTopicFrameId: retainedIds.has(frame.branchOfTopicFrameId) ? shortId(frame.branchOfTopicFrameId, 'frame') : '',
    domainId: shortId(frame.domainId, 'domain'),
    subdomainId: shortId(frame.subdomainId, 'subdomain'),
    microtopicId: shortId(frame.microtopicId, 'microtopic'),
    userGoal: shortId(frame.userGoal, 'goal'),
    userQuestion: '',
    materialIntent: shortId(frame.materialIntent, 'intent'),
    intentConfirmationReceiptId: shortId(frame.intentConfirmationReceiptId, 'intent-receipt'),
    intentConfirmationState: shortId(frame.intentConfirmationState, 'intent-state'),
    clarificationTurnCount: Math.max(0, Number(frame.clarificationTurnCount || 0)),
    knownFacts: ids(frame.knownFacts, 32, 'fact'),
    unknownFacts: ids(frame.unknownFacts, 24, 'slot'),
    confirmedFacts: ids(frame.confirmedFacts, 32, 'fact'),
    rejectedHypotheses: ids(frame.rejectedHypotheses, 16, 'hypothesis'),
    userCorrections: ids(frame.userCorrections, 16, 'correction'),
    assistantCommitments: ids(frame.assistantCommitments, 16, 'commitment'),
    completedSteps: ids(frame.completedSteps, 16, 'step'),
    pendingSteps: ids(frame.pendingSteps, 16, 'step'),
    unresolvedQuestions: ids(frame.unresolvedQuestions, 16, 'slot'),
    answeredPropositionIds: ids(frame.answeredPropositionIds, 24, 'proposition'),
    openQuestionIds: ids(frame.openQuestionIds, 16, 'slot'),
    pendingActionIds: ids(frame.pendingActionIds, 16, 'action'),
    lastMeaningfulUserTurnId: shortId(frame.lastMeaningfulUserTurnId, 'turn'),
    lastMeaningfulAssistantTurnId: shortId(frame.lastMeaningfulAssistantTurnId, 'turn'),
    lastStableSummary: semanticSummary(frame.lastStableSummary),
    exactReturnPoint: Object.freeze({
      propositionId: shortId(frame.exactReturnPoint?.propositionId, 'proposition'),
      openQuestionId: shortId(frame.exactReturnPoint?.openQuestionId, 'slot'),
      pendingActionId: shortId(frame.exactReturnPoint?.pendingActionId, 'action'),
      requiredFactIds: ids(frame.exactReturnPoint?.requiredFactIds, 16, 'fact'),
      lastUserCommitmentId: shortId(frame.exactReturnPoint?.lastUserCommitmentId, 'commitment'),
      lastSystemCommitmentId: shortId(frame.exactReturnPoint?.lastSystemCommitmentId, 'commitment'),
      turnId: shortId(frame.exactReturnPoint?.turnId, 'turn'),
      memoryVersion: Math.max(0, Number(frame.exactReturnPoint?.memoryVersion || 0)),
    }),
    expectedNextAction: shortId(frame.expectedNextAction, 'action'),
    returnCueIds: ids(frame.returnCueIds, 16, 'cue'),
    locale: shortId(frame.locale, 'locale'),
    tone: shortId(frame.tone, 'tone'),
    status: shortId(frame.status, 'status'),
    createdTurnId: shortId(frame.createdTurnId, 'turn'),
    lastTurnId: shortId(frame.lastTurnId, 'turn'),
    createdAt: ql7Str(frame.createdAt),
    suspendedAt: ql7Str(frame.suspendedAt),
    resumedAt: ql7Str(frame.resumedAt),
    resolvedAt: ql7Str(frame.resolvedAt),
    updatedAt: ql7Str(frame.updatedAt),
  })
}

function projectTurns(records = []) {
  return Object.freeze(ql7Arr(records).slice(-QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.recentTurnHashes).map((row) => Object.freeze({
    turnId: shortId(row?.turnId, 'turn'),
    role: shortId(row?.role, 'role'),
    textHash: shortId(row?.textHash || row?.hash, 'turn-hash'),
    domainId: shortId(row?.domainId, 'domain'),
    microtopicId: shortId(row?.microtopicId, 'microtopic'),
    materialIntent: shortId(row?.materialIntent || row?.intent, 'intent'),
    transitionType: shortId(row?.transitionType, 'transition'),
    topicFrameId: shortId(row?.topicFrameId, 'frame'),
    at: ql7Str(row?.at || row?.createdAt),
  })))
}

function projectLedger(values = [], limit = 32, prefix = 'ledger') {
  return Object.freeze(ql7Arr(values).slice(-limit).map((row) => Object.freeze({
    id: shortId(row, prefix),
    turnId: shortId(row?.turnId, 'turn'),
    status: shortId(row?.status, 'status'),
    role: shortId(row?.role, 'role'),
    at: ql7Str(row?.at || row?.createdAt || row?.updatedAt),
  })))
}

function finalizeProjection(body) {
  let candidate = { ...body, byteLength: 0 }
  for (let index = 0; index < 5; index += 1) {
    const projectionHash = ql7StableHash(JSON.stringify(candidate))
    const nextBytes = bytes({ ...candidate, projectionHash })
    if (nextBytes === candidate.byteLength) return Object.freeze({ ...candidate, projectionHash })
    candidate = { ...candidate, byteLength: nextBytes }
  }
  const projectionHash = ql7StableHash(JSON.stringify(candidate))
  return Object.freeze({ ...candidate, projectionHash })
}

export function projectQl7SupportMemoryForPersistence(graph = {}, {
  actorIdHash = '',
  now = '',
  ttlSeconds = QL7_SUPPORT_PERSISTED_MEMORY_TTL_SECONDS,
} = {}) {
  const normalized = createQl7SupportConversationMemoryGraph(graph)
  const activeId = ql7Str(normalized.activeTopicFrameId)
  const selected = Object.values(normalized.topicFrames || {})
    .sort((left, right) => (
      Number(right.topicFrameId === activeId) - Number(left.topicFrameId === activeId) ||
      frameRecency(right) - frameRecency(left) ||
      ql7Str(left.topicFrameId).localeCompare(ql7Str(right.topicFrameId))
    ))
    .slice(0, QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.topicFrames)
  const retained = new Set(selected.map((frame) => frame.topicFrameId))
  const projectedFrames = Object.freeze(Object.fromEntries(
    selected.map((frame) => {
      const projected = projectTopicFrame(frame, retained)
      return [projected.topicFrameId, projected]
    }),
  ))
  const projectedActiveId = retained.has(activeId) ? activeId : selected[0]?.topicFrameId || ''
  const active = projectedFrames[projectedActiveId] || null
  const updatedAt = ql7Str(now || normalized.updatedAt) || new Date().toISOString()
  const expiresAt = new Date(Date.parse(updatedAt) + Math.max(3600, Number(ttlSeconds || 0)) * 1000).toISOString()
  const graphProjection = createQl7SupportConversationMemoryGraph({
    conversationId: normalized.conversationId,
    memoryVersion: normalized.memoryVersion,
    activeTopicFrameId: projectedActiveId,
    suspendedTopicFrameIds: ids(normalized.suspendedTopicFrameIds.filter((id) => retained.has(id)), 16, 'frame'),
    recentlyResolvedTopicFrameIds: ids(normalized.recentlyResolvedTopicFrameIds.filter((id) => retained.has(id)), 16, 'frame'),
    abandonedTopicFrameIds: ids(normalized.abandonedTopicFrameIds.filter((id) => retained.has(id)), 8, 'frame'),
    topicFrames: projectedFrames,
    turnRecords: projectTurns(normalized.turnRecords),
    entityMemory: projectLedger(normalized.entityMemory, 24, 'entity'),
    factMemory: projectLedger(normalized.factMemory, QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.factIds, 'fact'),
    userCorrections: projectLedger(normalized.userCorrections, 24, 'correction'),
    rejectedHypotheses: ids(normalized.rejectedHypotheses, QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.rejectedHypothesisIds, 'hypothesis'),
    explicitPreferences: ids(normalized.explicitPreferences, 16, 'preference'),
    openCommitments: projectLedger(normalized.openCommitments, QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.commitments, 'commitment'),
    returnCandidates: ids(normalized.returnCandidates, 16, 'return'),
    correctionLedger: projectLedger(normalized.correctionLedger, 24, 'correction'),
    rejectedHypothesisLedger: projectLedger(normalized.rejectedHypothesisLedger, 24, 'hypothesis'),
    commitmentLedger: projectLedger(normalized.commitmentLedger, QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.commitments, 'commitment'),
    activeIntentConfirmation: normalized.activeIntentConfirmation ? Object.freeze({
      receiptId: shortId(normalized.activeIntentConfirmation.receiptId, 'intent-receipt'),
      state: shortId(normalized.activeIntentConfirmation.state, 'intent-state'),
      turnCount: Math.max(0, Number(normalized.activeIntentConfirmation.turnCount || 0)),
    }) : null,
    intentConfirmationReceipts: projectLedger(normalized.intentConfirmationReceipts, 8, 'intent-receipt'),
    operationalState: {
      responseFingerprints: ids(normalized.operationalState?.responseFingerprints, 32, 'response-hash'),
      sentenceFingerprints: ids(normalized.operationalState?.sentenceFingerprints, 32, 'sentence-hash'),
      propositionFingerprints: ids(normalized.operationalState?.propositionFingerprints, 32, 'proposition-hash'),
      recentSvgAssetIds: ids(normalized.operationalState?.recentSvgAssetIds, 16, 'asset'),
      lastMaterialTurnId: shortId(normalized.operationalState?.lastMaterialTurnId, 'turn'),
      closureState: shortId(normalized.operationalState?.closureState || 'open', 'closure'),
      safety: {
        directInsultCount: Math.max(0, Number(normalized.operationalState?.safety?.directInsultCount || 0)),
        confirmedDirectInsultCount: Math.max(0, Number(normalized.operationalState?.safety?.confirmedDirectInsultCount || 0)),
        pendingBoundaryClarification: { active: normalized.operationalState?.safety?.pendingBoundaryClarification?.active === true },
        lastCategory: shortId(normalized.operationalState?.safety?.lastCategory, 'safety'),
        blockedUntil: ql7Str(normalized.operationalState?.safety?.blockedUntil),
      },
      social: normalized.operationalState?.social,
      business: {
        intakeTurns: Math.max(0, Number(normalized.operationalState?.business?.intakeTurns || 0)),
        operatorRequestTurns: Math.max(0, Number(normalized.operationalState?.business?.operatorRequestTurns || 0)),
        contactPrompted: normalized.operationalState?.business?.contactPrompted === true,
        contactProvided: normalized.operationalState?.business?.contactProvided === true,
        contactRefused: normalized.operationalState?.business?.contactRefused === true,
        lastStage: shortId(normalized.operationalState?.business?.lastStage, 'business-stage'),
      },
    },
    updatedAt,
  })
  const unresolvedSlotIds = ids([
    ...(active?.unknownFacts || []),
    ...(active?.unresolvedQuestions || []),
    ...(active?.openQuestionIds || []),
  ], QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.unresolvedSlotIds, 'slot')
  const projection = finalizeProjection({
    schema: 'ql7.support.persisted-memory-projection',
    schemaVersion: QL7_SUPPORT_PERSISTED_MEMORY_VERSION,
    conversationId: normalized.conversationId,
    actorIdHash: shortId(actorIdHash, 'actor'),
    locale: active?.locale || 'en',
    activeTopicFrameId: projectedActiveId,
    activeTopic: active?.domainId || '',
    activeIntent: active?.materialIntent || '',
    activeGoal: active?.userGoal || '',
    semanticSummary: active?.lastStableSummary || '',
    factIds: ids([...(active?.knownFacts || []), ...(active?.confirmedFacts || [])], QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.factIds, 'fact'),
    unresolvedSlotIds,
    rejectedHypothesisIds: ids(normalized.rejectedHypotheses, QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.rejectedHypothesisIds, 'hypothesis'),
    commitments: ids(normalized.openCommitments, QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.commitments, 'commitment'),
    safetyState: Object.freeze({ ...graphProjection.operationalState.safety }),
    recentTurnHashes: Object.freeze(graphProjection.turnRecords.map((row) => row.textHash).filter(Boolean)),
    topicFrames: Object.freeze(Object.keys(graphProjection.topicFrames)),
    memoryVersion: graphProjection.memoryVersion,
    memoryHash: graphProjection.memoryHash,
    calibrationVersion: QL7_SUPPORT_ACTIVE_CALIBRATION_MANIFEST.calibrationVersion,
    calibrationHash: QL7_SUPPORT_ACTIVE_CALIBRATION_MANIFEST.artifactSha256,
    graph: graphProjection,
    updatedAt,
    expiresAt,
  })
  const privacy = auditQl7SupportMemoryPrivacy(projection)
  if (!privacy.ok) {
    const error = new Error('ql7_support_memory_projection_privacy_failed')
    error.code = 'ql7_support_memory_projection_privacy_failed'
    error.failures = privacy.failures
    throw error
  }
  if (bytes(projection) > QL7_SUPPORT_PERSISTED_MEMORY_MAX_BYTES) {
    const error = new Error('ql7_support_memory_projection_size_exceeded')
    error.code = 'ql7_support_memory_projection_size_exceeded'
    error.byteLength = bytes(projection)
    throw error
  }
  return projection
}

export function hydrateQl7SupportMemoryProjection(projection = {}) {
  if (projection?.schema !== 'ql7.support.persisted-memory-projection') return null
  const copy = { ...projection }
  delete copy.projectionHash
  if (ql7StableHash(JSON.stringify(copy)) !== projection.projectionHash) return null
  return createQl7SupportConversationMemoryGraph(projection.graph || {})
}

export function auditQl7SupportPersistentMemoryProjection(projection = {}) {
  const failures = []
  const serialized = JSON.stringify(projection)
  const actualBytes = bytes(projection)
  if (projection?.schema !== 'ql7.support.persisted-memory-projection') failures.push('invalid_projection_schema')
  if (!hydrateQl7SupportMemoryProjection(projection)) failures.push('projection_hash_invalid')
  if (actualBytes > QL7_SUPPORT_PERSISTED_MEMORY_MAX_BYTES) failures.push('projection_size_exceeded')
  if (projection?.graph?.turnRecords?.length > QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.recentTurnHashes) failures.push('turn_hash_window_exceeded')
  if (Object.keys(projection?.graph?.topicFrames || {}).length > QL7_SUPPORT_PERSISTED_MEMORY_LIMITS.topicFrames) failures.push('topic_frame_window_exceeded')
  if (/"(?:rawText|fullTranscript|transcript|secret|privateKey|sessionToken)"/iu.test(serialized)) failures.push('forbidden_persisted_field')
  if (Object.keys(projection?.graph?.operationalState?.business?.questionnaire || {}).length) failures.push('raw_questionnaire_forbidden')
  const privacy = auditQl7SupportMemoryPrivacy(projection)
  failures.push(...privacy.failures)
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures), byteLength: actualBytes })
}
