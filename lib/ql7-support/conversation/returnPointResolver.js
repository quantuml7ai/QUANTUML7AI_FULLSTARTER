export const QL7_SUPPORT_RETURN_POINT_RESOLVER_VERSION = '5.1.1'

const str = (value) => String(value ?? '').trim()

function candidateFrames(memoryGraph = {}, targetFrameId = '') {
  const frames = memoryGraph?.topicFrames || {}
  if (targetFrameId) return [frames[targetFrameId]].filter(Boolean)

  return (memoryGraph?.suspendedTopicFrameIds || [])
    .slice()
    .reverse()
    .map((id) => frames[id])
    .filter(Boolean)
}

export function resolveQl7SupportReturnPoint(memoryGraph = {}, targetFrameId = '') {
  const frame = candidateFrames(memoryGraph, targetFrameId)[0]
  if (!frame) return null

  const raw = frame.exactReturnPoint && typeof frame.exactReturnPoint === 'object'
    ? frame.exactReturnPoint
    : {}

  const exactReturnPoint = Object.freeze({
    propositionId: str(raw.propositionId || frame.answeredPropositionIds?.at?.(-1)),
    openQuestionId: str(raw.openQuestionId || frame.openQuestionIds?.at?.(-1)),
    pendingActionId: str(
      raw.pendingActionId ||
      frame.pendingActionIds?.at?.(-1) ||
      frame.expectedNextAction,
    ),
    requiredFactIds: Object.freeze([...(raw.requiredFactIds || frame.unknownFacts || [])]),
    lastUserCommitmentId: str(raw.lastUserCommitmentId),
    lastSystemCommitmentId: str(raw.lastSystemCommitmentId),
    turnId: str(raw.turnId || frame.lastTurnId),
    memoryVersion: Math.max(0, Number(raw.memoryVersion ?? memoryGraph.memoryVersion ?? 0)),
  })

  return Object.freeze({
    schema: 'ql7.support.return-point',
    schemaVersion: QL7_SUPPORT_RETURN_POINT_RESOLVER_VERSION,
    topicFrameId: str(frame.topicFrameId),
    domainId: str(frame.domainId),
    microtopicId: str(frame.microtopicId),
    exactReturnPoint,
    lastAnsweredPropositionId: exactReturnPoint.propositionId,
    userQuestion: str(frame.userQuestion),
  })
}
