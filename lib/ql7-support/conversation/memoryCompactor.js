import {
  createQl7SupportConversationMemoryGraph,
  QL7_SUPPORT_MEMORY_LIMITS,
} from './conversationMemoryGraph.js'

export const QL7_SUPPORT_MEMORY_COMPACTOR_VERSION = '5.1.1'

const bounded = (value, fallback, minimum = 1) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.max(minimum, Math.floor(numeric)) : fallback
}

export function compactQl7SupportMemoryGraph(graph = {}, limits = {}) {
  const maxTurns = bounded(
    limits.maxTurns,
    QL7_SUPPORT_MEMORY_LIMITS?.recentTurnWindow || 100,
    20,
  )
  const maxResolved = bounded(limits.maxResolved, 16, 4)
  const maxCorrections = bounded(limits.maxCorrections, QL7_SUPPORT_MEMORY_LIMITS?.corrections || 128, 16)
  const maxRejected = bounded(limits.maxRejected, QL7_SUPPORT_MEMORY_LIMITS?.rejectedHypotheses || 128, 16)
  const maxCommitments = bounded(limits.maxCommitments, QL7_SUPPORT_MEMORY_LIMITS?.commitments || 128, 16)
  const maxReturnCandidates = bounded(limits.maxReturnCandidates, 32, 4)

  return createQl7SupportConversationMemoryGraph({
    ...graph,
    turnRecords: (graph.turnRecords || []).slice(-maxTurns),
    recentlyResolvedTopicFrameIds: (graph.recentlyResolvedTopicFrameIds || []).slice(-maxResolved),
    abandonedTopicFrameIds: (graph.abandonedTopicFrameIds || []).slice(-maxResolved),
    correctionLedger: (graph.correctionLedger || []).slice(-maxCorrections),
    rejectedHypothesisLedger: (graph.rejectedHypothesisLedger || []).slice(-maxRejected),
    commitmentLedger: (graph.commitmentLedger || []).slice(-maxCommitments),
    returnCandidates: (graph.returnCandidates || []).slice(-maxReturnCandidates),
    updatedAt: graph.updatedAt,
  })
}
