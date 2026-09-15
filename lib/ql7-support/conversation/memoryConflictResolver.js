import {createQl7SupportConversationMemoryGraph} from './conversationMemoryGraph.js'

export const QL7_SUPPORT_MEMORY_CONFLICT_RESOLVER_VERSION = '5.1.1'

function changedActiveTopic(stored = {}, candidate = {}) {
  return String(stored?.activeTopicFrameId || '') !== String(candidate?.activeTopicFrameId || '')
}

export function resolveQl7SupportMemoryConflict({
  stored = {},
  candidate = {},
  expectedVersion = -1,
} = {}) {
  const storedGraph = createQl7SupportConversationMemoryGraph(stored)
  const candidateGraph = createQl7SupportConversationMemoryGraph(candidate)
  const storedVersion = Number(storedGraph.memoryVersion || 0)
  const expected = Number(expectedVersion)

  if (expected >= 0 && storedVersion !== expected) {
    return Object.freeze({
      ok: false,
      decision: 'rebase_required',
      storedVersion,
      expectedVersion: expected,
      activeTopicChanged: changedActiveTopic(storedGraph, candidateGraph),
      graph: storedGraph,
    })
  }

  if (candidateGraph.memoryVersion < storedVersion) {
    return Object.freeze({
      ok: false,
      decision: 'candidate_stale',
      storedVersion,
      expectedVersion: expected,
      graph: storedGraph,
    })
  }

  return Object.freeze({
    ok: true,
    decision: 'accept_candidate',
    storedVersion,
    expectedVersion: expected,
    activeTopicChanged: changedActiveTopic(storedGraph, candidateGraph),
    graph: candidateGraph,
  })
}
