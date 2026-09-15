import {QL7_SUPPORT_ECOSYSTEM_TOPICS, normalizeQl7SupportTopic} from '../ecosystemCatalog.js'
import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {
  getQl7SupportDomainBoundary,
  resolveQl7SupportMicrotopic,
} from './domainBoundaryGraph.js'

export const QL7_SUPPORT_RESPONSE_SCOPE_RECEIPT_VERSION = '5.1.0'

function unique(values) {
  return Object.freeze([...new Set(ql7Arr(values).map(ql7Str).filter(Boolean))])
}

function selectedIntent(analysis = {}, plan = {}) {
  return ql7Str(
    plan.selectedIntentId ||
    analysis.selectedIntentId ||
    analysis.subIntent ||
    analysis.messageAct ||
    plan.messageAct ||
    'overview',
  )
}

function explicitSecondaryDomains(analysis = {}, primaryDomainId = '') {
  const explicit = ql7Arr(
    analysis.explicitSecondaryDomainIds ||
    analysis.multiIntentDomains ||
    analysis.requestedDomains,
  )
    .map(normalizeQl7SupportTopic)
    .filter((topic) => topic && topic !== primaryDomainId && topic !== 'support_system')
  const clarificationCandidates = analysis.messageAct === 'ambiguous_request'
    ? ql7Arr(analysis.topicCandidates)
      .filter((row) => Number(row?.total || 0) >= 6)
      .map((row) => normalizeQl7SupportTopic(row?.topic))
      .filter((topic) => topic && topic !== primaryDomainId && topic !== 'support_system')
    : []
  const marketCandidate = analysis.messageAct === 'ambiguous_request' && analysis.marketSignals?.hasAsset === true
    ? ['exchange_ai']
    : []
  return unique([...explicit, ...clarificationCandidates, ...marketCandidate])
}

function recalledMemoryDomains(analysis = {}, memoryGraph = {}, primaryDomainId = '') {
  if (!['topic_recall', 'topic_resume'].includes(ql7Str(analysis.messageAct))) return Object.freeze([])
  const active = memoryGraph.topicFrames?.[memoryGraph.activeTopicFrameId]
  const domainId = normalizeQl7SupportTopic(active?.domainId || '')
  return Object.freeze(domainId && domainId !== primaryDomainId ? [domainId] : [])
}

function receiptBody({
  analysis = {},
  plan = {},
  memoryGraph = {},
  conversationId = '',
  turnId = '',
  now = '',
} = {}) {
  const primaryDomainId = normalizeQl7SupportTopic(
    plan.topic || analysis.topic || memoryGraph.activeDomainId || 'support_system',
  )
  const intentId = selectedIntent(analysis, plan)
  const boundary = getQl7SupportDomainBoundary(primaryDomainId)
  const explicitSecondaries = explicitSecondaryDomains(analysis, primaryDomainId)
  const planSecondaries = unique(ql7Arr(plan.allowedSecondaryDomainIds)
      .map(normalizeQl7SupportTopic)
      .filter((domainId) => domainId && domainId !== primaryDomainId && domainId !== 'support_system'))
  const secondaries = unique([...explicitSecondaries, ...planSecondaries])
  const memoryDomains = recalledMemoryDomains(analysis, memoryGraph, primaryDomainId)
  const dependencyRequired = analysis.requiresAdapter === true ||
    plan.resultKind === 'verified' ||
    ['informational_question', 'how_to_question', 'roadmap_question'].includes(ql7Str(analysis.messageAct || plan.messageAct))
  const requiredDependencies = dependencyRequired ? ql7Arr(boundary.requiredDependencies) : []
  const allowedDomainIds = unique([primaryDomainId, ...secondaries, ...memoryDomains, ...requiredDependencies])
  const forbiddenDomainIds = unique(
    QL7_SUPPORT_ECOSYSTEM_TOPICS.filter((topic) => !allowedDomainIds.includes(topic)),
  )
  const primaryMicrotopicId = ql7Str(
    plan.primaryMicrotopicId ||
    analysis.primaryMicrotopicId ||
    resolveQl7SupportMicrotopic(primaryDomainId, analysis.subIntent || intentId),
  )
  const explicitSecondaryMicrotopicIds = unique(
    ql7Arr(analysis.explicitSecondaryMicrotopicIds)
      .filter((value) => explicitSecondaries.some((domainId) => ql7Str(value).startsWith(`${domainId}.`))),
  )
  const allowedFactIds = unique([
    ...ql7Arr(plan.confirmedFacts).map((row) => row?.factId || row?.receiptId),
    ...ql7Arr(plan.factProjection?.facts).map((row) => row?.factId || row?.key),
  ])
  const userRequestedEntityIds = unique([
    ...ql7Arr(analysis.requestedEntityIds),
    ...ql7Arr(analysis.entities?.products),
    ...ql7Arr(analysis.entities?.assets),
  ])
  const allowedEntityIds = unique([
    primaryDomainId,
    ...secondaries,
    ...requiredDependencies,
    ...memoryDomains,
    ...userRequestedEntityIds,
  ])
  const memoryFrameIds = unique([
    memoryGraph.activeTopicFrameId,
    ...ql7Arr(memoryGraph.returnCandidates).map((row) => row?.topicFrameId || row),
  ])
  return {
    schema: 'ql7.support.response-scope-receipt',
    schemaVersion: QL7_SUPPORT_RESPONSE_SCOPE_RECEIPT_VERSION,
    conversationId: ql7Str(conversationId || memoryGraph.conversationId || 'anonymous-conversation'),
    turnId: ql7Str(turnId || `turn:${Number(memoryGraph.turnRecords?.length || 0) + 1}`),
    primaryDomainId,
    primarySubdomainId: ql7Str(plan.primarySubdomainId || `${primaryDomainId}.knowledge`),
    primaryMicrotopicId,
    explicitSecondaryDomainIds: explicitSecondaries,
    explicitSecondaryMicrotopicIds,
    userRequestedEntityIds,
    allowedDomainIds,
    allowedEntityIds,
    allowedProductIds: allowedEntityIds,
    allowedFactIds,
    allowedActionIds: unique(ql7Arr(plan.choices?.options).map((row) => row?.intent || row?.topic)),
    forbiddenDomainIds,
    forbiddenEntityIds: forbiddenDomainIds,
    forbiddenProductIds: forbiddenDomainIds,
    forbiddenCarryoverIds: forbiddenDomainIds,
    forbiddenPhraseFamilies: Object.freeze(['service-branding', 'automatic-ecosystem-menu', 'forced-topic-return']),
    selectedIntentId: intentId,
    userGoalId: ql7Str(analysis.userGoalId || plan.userGoalId || `${primaryDomainId}:${intentId}`),
    scopeReason: explicitSecondaries.length
      ? 'explicit-multi-intent'
      : planSecondaries.length || requiredDependencies.length ? 'single-domain-with-graph-required-dependency' : 'single-primary-domain',
    scopeConfidence: Number(analysis.topicConfidence ?? analysis.confidence ?? 0),
    scopeMargin: Number(analysis.topicMargin ?? analysis.margin ?? 0),
    clarificationRequired: plan.choices != null || analysis.needsChoice === true,
    intentConfirmationReceiptId: ql7Str(analysis.intentConfirmation?.receiptId),
    intentConfirmationState: ql7Str(analysis.intentConfirmation?.state || 'not_required'),
    adapterAuthorized: analysis.intentConfirmation?.adapterAuthorized === true,
    adapterOperationId: ql7Str(analysis.intentConfirmation?.adapterOperationId),
    memoryFrameIds,
    generatedEntityIds: Object.freeze([]),
    generatedFactIds: Object.freeze([]),
    deferredIntentIds: unique(analysis.deferredIntentIds),
    crossDomainLeakageCount: 0,
    brandLeakageCount: 0,
    validatedAt: ql7Str(now),
    sourceDecisionHash: ql7StableHash(JSON.stringify({
      topic: primaryDomainId,
      intentId,
      candidates: analysis.topicCandidates || [],
      planVersion: plan.version || '',
    })),
    memoryHash: ql7Str(memoryGraph.memoryHash),
  }
}

export function buildQl7SupportResponseScopeReceipt(input = {}) {
  const body = receiptBody(input)
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({
    ...body,
    receiptId: `scope:${receiptHash}`,
    receiptHash,
  })
}

export function validateQl7SupportResponseScopeReceipt(receipt = {}) {
  const failures = []
  if (receipt.schema !== 'ql7.support.response-scope-receipt') failures.push('invalid_schema')
  if (receipt.schemaVersion !== QL7_SUPPORT_RESPONSE_SCOPE_RECEIPT_VERSION) failures.push('unknown_version')
  if (!QL7_SUPPORT_ECOSYSTEM_TOPICS.includes(receipt.primaryDomainId)) failures.push('unknown_primary_domain')
  if (!receipt.primaryMicrotopicId) failures.push('missing_primary_microtopic')
  if (!receipt.selectedIntentId) failures.push('missing_selected_intent')
  if (!receipt.receiptId || !receipt.receiptHash) failures.push('missing_integrity')
  const recompute = { ...receipt }
  delete recompute.receiptId
  delete recompute.receiptHash
  if (receipt.receiptHash && ql7StableHash(JSON.stringify(recompute)) !== receipt.receiptHash) {
    failures.push('receipt_hash_mismatch')
  }
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}
