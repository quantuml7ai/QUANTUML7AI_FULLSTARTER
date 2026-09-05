import {ql7Arr, ql7Str} from '../internal/text.js'
import {createQl7SupportConversationMemoryGraph} from './conversationMemoryGraph.js'

export const QL7_SUPPORT_SEMANTIC_CONTEXT_VERSION = '5.2.0'

function activeFrameOf(graph = {}) {
  return graph.topicFrames?.[graph.activeTopicFrameId] || null
}

function previousFrameOf(graph = {}) {
  const suspended = ql7Arr(graph.suspendedTopicFrameIds)
    .map((id) => graph.topicFrames?.[id])
    .filter(Boolean)
  if (suspended.length) return suspended.at(-1)
  return ql7Arr(graph.recentlyResolvedTopicFrameIds)
    .map((id) => graph.topicFrames?.[id])
    .filter(Boolean)
    .at(-1) || null
}

function confirmationReceiptForFrame(graph = {}, frame = null) {
  if (!frame?.intentConfirmationReceiptId) return null
  const receipt = ql7Arr(graph.intentConfirmationReceipts)
    .find((row) => row?.receiptId === frame.intentConfirmationReceiptId)
  if (receipt?.schema !== 'ql7.support.intent-confirmation-receipt') return null
  if (ql7Str(receipt.slotValues?.domainId) !== ql7Str(frame.domainId)) return null
  return Object.freeze({ ...receipt })
}

function semanticFrameProjection(frame = null) {
  if (!frame) return null
  return Object.freeze({
    topicFrameId: ql7Str(frame.topicFrameId),
    domainId: ql7Str(frame.domainId),
    subdomainId: ql7Str(frame.subdomainId),
    microtopicId: ql7Str(frame.microtopicId),
    userGoal: ql7Str(frame.userGoal),
    materialIntent: ql7Str(frame.materialIntent),
    intentConfirmationReceiptId: ql7Str(frame.intentConfirmationReceiptId),
    intentConfirmationState: ql7Str(frame.intentConfirmationState),
    expectedNextAction: ql7Str(frame.expectedNextAction),
    status: ql7Str(frame.status),
    lastTurnId: ql7Str(frame.lastTurnId),
  })
}

export function projectQl7SupportMemoryGraphToRuntimeState(memoryGraph = {}) {
  const graph = createQl7SupportConversationMemoryGraph(memoryGraph)
  const active = activeFrameOf(graph)
  const previous = previousFrameOf(graph)
  const operational = graph.operationalState || {}
  const activeFrameIntentConfirmation = confirmationReceiptForFrame(graph, active)
  return Object.freeze({
    schema: 'ql7.support.conversation-runtime-state',
    schemaVersion: QL7_SUPPORT_SEMANTIC_CONTEXT_VERSION,
    conversationId: graph.conversationId,
    activeTopic: ql7Str(active?.domainId),
    previousTopic: ql7Str(previous?.domainId || active?.domainId),
    activeGoal: ql7Str(active?.userGoal),
    waitingFor: ql7Str(active?.expectedNextAction),
    pendingAction: ql7Str(active?.expectedNextAction),
    closureState: ql7Str(operational.closureState || (active?.status === 'resolved' ? 'closed' : 'open')),
    lastMaterialTurnId: ql7Str(operational.lastMaterialTurnId),
    corrections: Object.freeze(ql7Arr(graph.userCorrections)),
    rejectedHypotheses: Object.freeze(ql7Arr(graph.rejectedHypotheses)),
    intentConfirmation: graph.activeIntentConfirmation || null,
    activeTopicFrame: semanticFrameProjection(active),
    activeFrameIntentConfirmation,
    suspendedTopicFrames: Object.freeze(
      ql7Arr(graph.suspendedTopicFrameIds)
        .map((id) => semanticFrameProjection(graph.topicFrames?.[id]))
        .filter(Boolean),
    ),
    entities: Object.freeze({ ...(operational.entities || {}) }),
    responseFingerprints: Object.freeze(ql7Arr(operational.responseFingerprints)),
    sentenceFingerprints: Object.freeze(ql7Arr(operational.sentenceFingerprints)),
    propositionFingerprints: Object.freeze(ql7Arr(operational.propositionFingerprints)),
    recentSvgAssetIds: Object.freeze(ql7Arr(operational.recentSvgAssetIds)),
    safety: Object.freeze({ ...(operational.safety || {}) }),
    social: Object.freeze({ ...(operational.social || {}) }),
    business: Object.freeze({ ...(operational.business || {}) }),
    turns: Number(graph.turnRecords?.length || 0),
    memoryVersion: graph.memoryVersion,
    memoryHash: graph.memoryHash,
    updatedAt: graph.updatedAt,
  })
}

export function projectQl7SupportMemoryGraphToSemanticContext(memoryGraph = {}) {
  const graph = createQl7SupportConversationMemoryGraph(memoryGraph)
  const runtime = projectQl7SupportMemoryGraphToRuntimeState(graph)
  const active = activeFrameOf(graph)
  return Object.freeze({
    schema: 'ql7.support.semantic-context',
    schemaVersion: QL7_SUPPORT_SEMANTIC_CONTEXT_VERSION,
    conversationId: graph.conversationId,
    activeTopic: runtime.activeTopic,
    topic: runtime.activeTopic,
    previousTopic: runtime.previousTopic,
    activeGoal: runtime.activeGoal,
    waitingFor: runtime.waitingFor,
    pendingAction: runtime.pendingAction,
    openMaterialQuestion: Boolean(active?.unresolvedQuestions?.length || active?.expectedNextAction),
    unresolvedSlots: Object.freeze(ql7Arr(active?.unresolvedQuestions)),
    corrections: runtime.corrections,
    userCorrections: runtime.corrections,
    rejectedHypotheses: runtime.rejectedHypotheses,
    intentConfirmation: runtime.intentConfirmation,
    activeTopicFrame: runtime.activeTopicFrame,
    activeFrameIntentConfirmation: runtime.activeFrameIntentConfirmation,
    suspendedTopicFrames: runtime.suspendedTopicFrames,
    entities: runtime.entities,
    social: runtime.social,
    business: runtime.business,
    safety: runtime.safety,
    turns: runtime.turns,
    memoryVersion: graph.memoryVersion,
    memoryHash: graph.memoryHash,
    updatedAt: graph.updatedAt,
  })
}
