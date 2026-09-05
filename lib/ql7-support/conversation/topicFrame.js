import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_TOPIC_FRAME_VERSION = '5.1.0'

const VALID_STATUSES = Object.freeze(['active', 'suspended', 'resolved', 'abandoned', 'reopened'])
const cap = (values, limit) => Object.freeze(ql7Arr(values).slice(-limit))

function normalizeReturnPoint(value = {}, seed = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const legacy = typeof value === 'string' ? ql7Str(value) : ''
  return Object.freeze({
    propositionId: ql7Str(source.propositionId || seed.propositionId),
    openQuestionId: ql7Str(source.openQuestionId || seed.openQuestionId),
    pendingActionId: ql7Str(source.pendingActionId || legacy || seed.pendingActionId),
    requiredFactIds: cap(source.requiredFactIds || seed.requiredFactIds, 64),
    lastUserCommitmentId: ql7Str(source.lastUserCommitmentId || seed.lastUserCommitmentId),
    lastSystemCommitmentId: ql7Str(source.lastSystemCommitmentId || seed.lastSystemCommitmentId),
    turnId: ql7Str(source.turnId || seed.turnId),
    memoryVersion: Math.max(0, Number(source.memoryVersion ?? seed.memoryVersion ?? 0)),
  })
}

export function createQl7SupportTopicFrame(seed = {}) {
  const now = ql7Str(seed.now || seed.updatedAt || seed.createdAt)
  const domainId = ql7Str(seed.domainId || seed.topic || 'support_system')
  const status = VALID_STATUSES.includes(seed.status) ? seed.status : 'active'
  const body = {
    schema: 'ql7.support.topic-frame',
    schemaVersion: QL7_SUPPORT_TOPIC_FRAME_VERSION,
    topicFrameId: ql7Str(seed.topicFrameId || `frame:${ql7StableHash(`${seed.conversationId || ''}:${domainId}:${seed.createdTurnId || seed.turnId || now}`)}`),
    parentTopicFrameId: ql7Str(seed.parentTopicFrameId),
    branchOfTopicFrameId: ql7Str(seed.branchOfTopicFrameId),
    domainId,
    subdomainId: ql7Str(seed.subdomainId || `${domainId}.knowledge`),
    microtopicId: ql7Str(seed.microtopicId || `${domainId}.overview`),
    userGoal: ql7Str(seed.userGoal),
    userQuestion: ql7Str(seed.userQuestion),
    materialIntent: ql7Str(seed.materialIntent || seed.messageAct),
    intentConfirmationReceiptId: ql7Str(seed.intentConfirmationReceiptId),
    intentConfirmationState: ql7Str(seed.intentConfirmationState || 'not_required'),
    clarificationTurnCount: Math.max(0, Math.min(30, Number(seed.clarificationTurnCount || 0))),
    knownFacts: cap(seed.knownFacts, 128),
    unknownFacts: cap(seed.unknownFacts, 64),
    confirmedFacts: cap(seed.confirmedFacts, 128),
    rejectedHypotheses: cap(seed.rejectedHypotheses, 64),
    userCorrections: cap(seed.userCorrections, 64),
    assistantCommitments: cap(seed.assistantCommitments, 64),
    completedSteps: cap(seed.completedSteps, 64),
    pendingSteps: cap(seed.pendingSteps, 64),
    unresolvedQuestions: cap(seed.unresolvedQuestions, 64),
    answeredPropositionIds: cap(seed.answeredPropositionIds, 128),
    openQuestionIds: cap(seed.openQuestionIds, 64),
    pendingActionIds: cap(seed.pendingActionIds, 64),
    lastMeaningfulUserTurnId: ql7Str(seed.lastMeaningfulUserTurnId || seed.createdTurnId),
    lastMeaningfulAssistantTurnId: ql7Str(seed.lastMeaningfulAssistantTurnId),
    lastStableSummary: ql7Str(seed.lastStableSummary),
    exactReturnPoint: normalizeReturnPoint(seed.exactReturnPoint || seed.lastExactReturnPoint, { propositionId: ql7Arr(seed.answeredPropositionIds).at(-1), openQuestionId: ql7Arr(seed.openQuestionIds).at(-1), pendingActionId: ql7Arr(seed.pendingActionIds).at(-1) || seed.expectedNextAction, turnId: seed.lastTurnId || seed.turnId, memoryVersion: seed.memoryVersion }),
    expectedNextAction: ql7Str(seed.expectedNextAction),
    returnCueIds: cap(seed.returnCueIds, 32),
    locale: ql7Str(seed.locale || 'en'),
    tone: ql7Str(seed.tone || 'neutral'),
    status,
    createdTurnId: ql7Str(seed.createdTurnId || seed.turnId),
    lastTurnId: ql7Str(seed.lastTurnId || seed.turnId),
    createdAt: ql7Str(seed.createdAt || now),
    suspendedAt: status === 'suspended' ? ql7Str(seed.suspendedAt || now) : ql7Str(seed.suspendedAt),
    resumedAt: ['active', 'reopened'].includes(status) ? ql7Str(seed.resumedAt) : '',
    resolvedAt: status === 'resolved' ? ql7Str(seed.resolvedAt || now) : ql7Str(seed.resolvedAt),
    updatedAt: now,
  }
  return Object.freeze({
    ...body,
    frameHash: ql7StableHash(JSON.stringify(body)),
  })
}

export function updateQl7SupportTopicFrame(frame = {}, update = {}) {
  const prior = createQl7SupportTopicFrame(frame)
  return createQl7SupportTopicFrame({
    ...prior,
    ...update,
    knownFacts: update.knownFacts ?? prior.knownFacts,
    unknownFacts: update.unknownFacts ?? prior.unknownFacts,
    confirmedFacts: update.confirmedFacts ?? prior.confirmedFacts,
    rejectedHypotheses: update.rejectedHypotheses ?? prior.rejectedHypotheses,
    userCorrections: update.userCorrections ?? prior.userCorrections,
    assistantCommitments: update.assistantCommitments ?? prior.assistantCommitments,
    completedSteps: update.completedSteps ?? prior.completedSteps,
    pendingSteps: update.pendingSteps ?? prior.pendingSteps,
    unresolvedQuestions: update.unresolvedQuestions ?? prior.unresolvedQuestions,
    answeredPropositionIds: update.answeredPropositionIds ?? prior.answeredPropositionIds,
    openQuestionIds: update.openQuestionIds ?? prior.openQuestionIds,
    pendingActionIds: update.pendingActionIds ?? prior.pendingActionIds,
  })
}

export function validateQl7SupportTopicFrame(frame = {}) {
  const failures = []
  if (frame.schema !== 'ql7.support.topic-frame') failures.push('invalid_schema')
  if (frame.schemaVersion !== QL7_SUPPORT_TOPIC_FRAME_VERSION) failures.push('unknown_version')
  if (!frame.topicFrameId) failures.push('missing_frame_id')
  if (!frame.domainId) failures.push('missing_domain')
  if (!frame.microtopicId) failures.push('missing_microtopic')
  if (!VALID_STATUSES.includes(frame.status)) failures.push('invalid_status')
  if (!frame.exactReturnPoint || typeof frame.exactReturnPoint !== 'object' || Array.isArray(frame.exactReturnPoint)) failures.push('invalid_exact_return_point')
  else { for (const key of ['propositionId','openQuestionId','pendingActionId','requiredFactIds','lastUserCommitmentId','lastSystemCommitmentId','turnId','memoryVersion']) if (!(key in frame.exactReturnPoint)) failures.push(`return_point_field:${key}`) }
  if (!frame.frameHash) failures.push('missing_hash')
  const copy = { ...frame }
  delete copy.frameHash
  if (frame.frameHash && ql7StableHash(JSON.stringify(copy)) !== frame.frameHash) failures.push('hash_mismatch')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}

// Compatibility alias for pre-REV.5.1 callers. It does not own a second schema
// or normalization pipeline; all projections delegate to the canonical frame owner.
export function normalizeQl7SupportTopicFrame(seed = {}) {
  return createQl7SupportTopicFrame({
    ...seed,
    domainId: ql7Str(seed.domainId || seed.topicId || seed.topic),
  })
}
