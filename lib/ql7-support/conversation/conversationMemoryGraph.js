import {normalizeQl7SupportTopic} from '../ecosystemCatalog.js'
import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {createQl7SupportTopicFrame, updateQl7SupportTopicFrame} from './topicFrame.js'
import {appendQl7SupportCorrection} from './correctionLedger.js'
import {appendQl7SupportRejectedHypothesis} from './rejectedHypothesisLedger.js'
import {updateQl7SupportCommitments} from './commitmentTracker.js'
import {updateQl7SupportEntityReferenceMemory} from './entityReferenceMemory.js'
import {applyQl7SupportTopicStackPolicy} from './topicStackPolicy.js'

export const QL7_SUPPORT_CONVERSATION_MEMORY_GRAPH_VERSION = '5.1.0'
export const QL7_SUPPORT_MEMORY_LIMITS = Object.freeze({
  recentTurnWindow: 100,
  topicFrames: 96,
  suspendedTopicFrames: 32,
  nestedBranchDepth: 8,
  corrections: 128,
  rejectedHypotheses: 128,
  commitments: 128,
  intentConfirmationReceipts: 30,
})

function capped(values, limit) {
  return Object.freeze(ql7Arr(values).slice(-limit))
}

function sentenceHashes(text = '') {
  return ql7Str(text)
    .split(/(?<=[.!?。！？])\s+/u)
    .map((row) => ql7StableHash(row.toLowerCase()))
    .filter(Boolean)
}

function normalizeOperationalState(input = {}) {
  const source = input?.operationalState && typeof input.operationalState === 'object'
    ? input.operationalState
    : input && typeof input === 'object'
      ? input
      : {}
  const safetySource = source.safety && typeof source.safety === 'object' ? source.safety : {}
  const socialSource = source.social && typeof source.social === 'object' ? source.social : {}
  const businessSource = source.business && typeof source.business === 'object' ? source.business : {}
  return Object.freeze({
    entities: Object.freeze({ ...(source.entities && typeof source.entities === 'object' ? source.entities : {}) }),
    responseFingerprints: capped(
      source.responseFingerprints || source.replyHistory?.map?.((row) => row?.hash || row?.fingerprint || row?.semanticFingerprint || row?.textHash),
      512,
    ),
    sentenceFingerprints: capped(source.sentenceFingerprints, 2048),
    propositionFingerprints: capped(source.propositionFingerprints, 2048),
    recentSvgAssetIds: capped(source.recentSvgAssetIds, 20),
    lastMaterialTurnId: ql7Str(source.lastMaterialTurnId),
    closureState: ql7Str(source.closureState || 'open'),
    safety: Object.freeze({
      directInsultCount: Number(safetySource.directInsultCount || source.safetyStrikeCount || 0),
      confirmedDirectInsultCount: Number(
        safetySource.confirmedDirectInsultCount ?? safetySource.directInsultCount ?? source.safetyStrikeCount ?? 0,
      ),
      pendingBoundaryClarification: safetySource.pendingBoundaryClarification && typeof safetySource.pendingBoundaryClarification === 'object'
        ? Object.freeze({ ...safetySource.pendingBoundaryClarification })
        : Object.freeze({ active: false }),
      lastAssessment: safetySource.lastAssessment && typeof safetySource.lastAssessment === 'object'
        ? Object.freeze({ ...safetySource.lastAssessment })
        : null,
      lastCategory: ql7Str(safetySource.lastCategory),
      blockedUntil: ql7Str(safetySource.blockedUntil),
      history: capped(safetySource.history, 32),
    }),
    social: Object.freeze({
      smallTalkTurns: Number(socialSource.smallTalkTurns || 0),
      supportiveTurns: Number(socialSource.supportiveTurns || 0),
      humorMode: socialSource.humorMode === true,
    }),
    business: Object.freeze({
      intakeTurns: Number(businessSource.intakeTurns || 0),
      operatorRequestTurns: Number(businessSource.operatorRequestTurns || 0),
      contactPrompted: businessSource.contactPrompted === true,
      contactProvided: businessSource.contactProvided === true,
      contactRefused: businessSource.contactRefused === true,
      lastStage: ql7Str(businessSource.lastStage),
      questionnaire: businessSource.questionnaire && typeof businessSource.questionnaire === 'object'
        ? Object.freeze({ ...businessSource.questionnaire })
        : Object.freeze({}),
    }),
  })
}

function frameMap(input = {}) {
  const source = input.topicFrames && typeof input.topicFrames === 'object'
    ? input.topicFrames
    : {}
  return Object.fromEntries(
    Object.values(source)
      .map((frame) => createQl7SupportTopicFrame(frame))
      .map((frame) => [frame.topicFrameId, frame]),
  )
}


function frameRecency(frame = {}) {
  for (const raw of [frame.updatedAt, frame.lastTurnAt, frame.lastUpdatedAt, frame.createdAt]) {
    const parsed = Date.parse(ql7Str(raw))
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function pruneTopicFrames(frames = {}, { activeFrameId = '', suspendedIds = [], resolvedIds = [], abandonedIds = [], limit = QL7_SUPPORT_MEMORY_LIMITS.topicFrames } = {}) {
  const rows = Object.values(frames || {})
  const hardLimit = Math.max(1, Number(limit) || QL7_SUPPORT_MEMORY_LIMITS.topicFrames)
  if (rows.length <= hardLimit) return Object.freeze({ ...frames })

  const suspendedSet = new Set(ql7Arr(suspendedIds).map(ql7Str).filter(Boolean))
  const recentResolved = new Set(ql7Arr(resolvedIds).slice(-16).map(ql7Str).filter(Boolean))
  const recentAbandoned = new Set(ql7Arr(abandonedIds).slice(-8).map(ql7Str).filter(Boolean))
  const activeId = ql7Str(activeFrameId)

  const priority = (frame = {}) => {
    const id = ql7Str(frame.topicFrameId)
    if (id && id === activeId) return 100
    if (['active', 'reopened'].includes(frame.status)) return 95
    if (frame.status === 'suspended' || suspendedSet.has(id)) return 90
    if (ql7Arr(frame.openQuestionIds).length) return 85
    if (ql7Arr(frame.pendingActionIds).length) return 80
    if (ql7Arr(frame.unknownFacts).length) return 75
    if (recentResolved.has(id)) return 40
    if (recentAbandoned.has(id)) return 30
    return 10
  }

  const selected = [...rows]
    .sort((a, b) => (
      priority(b) - priority(a) ||
      frameRecency(b) - frameRecency(a) ||
      ql7Str(a.topicFrameId).localeCompare(ql7Str(b.topicFrameId))
    ))
    .slice(0, hardLimit)

  return Object.freeze(Object.fromEntries(selected.map((frame) => [frame.topicFrameId, frame])))
}

function retainedIds(values = [], retained = new Set(), limit = 32) {
  return Object.freeze(ql7Arr(values).filter((id)=>retained.has(ql7Str(id))).slice(-limit))
}

function migrateLegacyFrame(input = {}, conversationId = '') {
  const domainId = normalizeQl7SupportTopic(input.activeTopic || input.topic || '')
  if (!domainId || domainId === 'support_system') return null
  return createQl7SupportTopicFrame({
    conversationId,
    domainId,
    userGoal: input.activeGoal,
    materialIntent: input.waitingFor ? 'clarification' : 'continuation',
    pendingSteps: input.pendingAction ? [input.pendingAction] : [],
    unresolvedQuestions: input.waitingFor ? [input.waitingFor] : [],
    expectedNextAction: input.waitingFor || input.pendingAction,
    rejectedHypotheses: input.rejectedHypotheses,
    userCorrections: input.corrections || input.userCorrections,
    status: input.closureState === 'closed' ? 'resolved' : 'active',
    createdTurnId: input.lastMaterialTurnId,
    lastTurnId: input.lastMaterialTurnId,
    locale: input.locale || 'en',
    now: input.updatedAt,
  })
}

function memoryBody(input = {}) {
  const conversationId = ql7Str(input.conversationId || 'ql7-support-conversation')
  const frames = frameMap(input)
  if (!Object.keys(frames).length) {
    const migrated = migrateLegacyFrame(input, conversationId)
    if (migrated) frames[migrated.topicFrameId] = migrated
  }
  const requestedActive = ql7Str(input.activeTopicFrameId)
  const activeFrameId = frames[requestedActive]
    ? requestedActive
    : Object.values(frames).find((frame) => ['active', 'reopened'].includes(frame.status))?.topicFrameId || ''
  const sourceSuspendedIds = input.suspendedTopicFrameIds || Object.values(frames).filter((frame) => frame.status === 'suspended').map((frame) => frame.topicFrameId)
  const sourceResolvedIds = input.recentlyResolvedTopicFrameIds || Object.values(frames).filter((frame) => frame.status === 'resolved').map((frame) => frame.topicFrameId)
  const sourceAbandonedIds = input.abandonedTopicFrameIds || Object.values(frames).filter((frame) => frame.status === 'abandoned').map((frame) => frame.topicFrameId)
  const boundedFrames = pruneTopicFrames(frames, {
    activeFrameId,
    suspendedIds: sourceSuspendedIds,
    resolvedIds: sourceResolvedIds,
    abandonedIds: sourceAbandonedIds,
  })
  const retainedFrameIds = new Set(Object.keys(boundedFrames))
  return {
    schema: 'ql7.support.conversation-memory-graph',
    schemaVersion: QL7_SUPPORT_CONVERSATION_MEMORY_GRAPH_VERSION,
    memoryVersion: Number.isInteger(Number(input.memoryVersion))
      ? Math.max(0, Number(input.memoryVersion))
      : 0,
    conversationId,
    activeTopicFrameId: activeFrameId,
    suspendedTopicFrameIds: retainedIds(sourceSuspendedIds, retainedFrameIds, QL7_SUPPORT_MEMORY_LIMITS.suspendedTopicFrames),
    recentlyResolvedTopicFrameIds: retainedIds(sourceResolvedIds, retainedFrameIds, 32),
    abandonedTopicFrameIds: retainedIds(sourceAbandonedIds, retainedFrameIds, 32),
    topicFrames: boundedFrames,
    turnRecords: capped(input.turnRecords, QL7_SUPPORT_MEMORY_LIMITS.recentTurnWindow),
    entityMemory: capped(input.entityMemory, 256),
    factMemory: capped(input.factMemory, 512),
    userCorrections: capped(input.userCorrections || input.corrections, QL7_SUPPORT_MEMORY_LIMITS.corrections),
    rejectedHypotheses: capped(input.rejectedHypotheses, QL7_SUPPORT_MEMORY_LIMITS.rejectedHypotheses),
    explicitPreferences: capped(input.explicitPreferences, 64),
    openCommitments: capped(input.openCommitments, QL7_SUPPORT_MEMORY_LIMITS.commitments),
    returnCandidates: capped(input.returnCandidates, 32),
    correctionLedger: capped(input.correctionLedger, QL7_SUPPORT_MEMORY_LIMITS.corrections),
    rejectedHypothesisLedger: capped(input.rejectedHypothesisLedger, QL7_SUPPORT_MEMORY_LIMITS.rejectedHypotheses),
    commitmentLedger: capped(input.commitmentLedger, QL7_SUPPORT_MEMORY_LIMITS.commitments),
    activeIntentConfirmation: input.activeIntentConfirmation && typeof input.activeIntentConfirmation === 'object'
      ? Object.freeze({ ...input.activeIntentConfirmation })
      : null,
    intentConfirmationReceipts: capped(
      input.intentConfirmationReceipts,
      QL7_SUPPORT_MEMORY_LIMITS.intentConfirmationReceipts,
    ),
    operationalState: normalizeOperationalState(input),
    updatedAt: ql7Str(input.updatedAt),
  }
}

export function createQl7SupportConversationMemoryGraph(input = {}) {
  const body = memoryBody(input)
  return Object.freeze({ ...body, memoryHash: ql7StableHash(JSON.stringify(body)) })
}

function frameIntentConfirmationPatch(frame = {}, analysis = {}) {
  const receipt = analysis.intentConfirmation
  const sameDomain = ql7Str(receipt?.slotValues?.domainId) === ql7Str(frame.domainId)
  const materialState = ['collecting', 'confirmed', 'rejected', 'exhausted'].includes(ql7Str(receipt?.state))
  if (!receipt || !sameDomain || !materialState) {
    return {
      intentConfirmationReceiptId: frame.intentConfirmationReceiptId,
      intentConfirmationState: frame.intentConfirmationState,
      clarificationTurnCount: frame.clarificationTurnCount,
    }
  }
  return {
    intentConfirmationReceiptId: receipt.receiptId || frame.intentConfirmationReceiptId,
    intentConfirmationState: receipt.state || frame.intentConfirmationState,
    clarificationTurnCount: receipt.turnCount ?? frame.clarificationTurnCount,
  }
}

function nextFrame({ graph, transition, analysis, scopeReceipt, text, turnId, locale, now }) {
  const frames = { ...graph.topicFrames }
  const active = frames[graph.activeTopicFrameId] || null
  const transitionType = ql7Str(transition.transitionType)
  let activeTopicFrameId = graph.activeTopicFrameId
  let suspended = [...graph.suspendedTopicFrameIds]
  let resolved = [...graph.recentlyResolvedTopicFrameIds]
  let abandoned = [...graph.abandonedTopicFrameIds]

  if (active && ['switch_to_new', 'interrupt_current'].includes(transitionType)) {
    frames[active.topicFrameId] = updateQl7SupportTopicFrame(active, {
      status: 'suspended',
      suspendedAt: now,
      exactReturnPoint: { propositionId: active.answeredPropositionIds?.at(-1) || '', openQuestionId: active.openQuestionIds?.at(-1) || '', pendingActionId: active.pendingActionIds?.at(-1) || active.expectedNextAction || '', requiredFactIds: active.unknownFacts || [], lastUserCommitmentId: graph.commitmentLedger?.filter?.((r)=>r.role==='user'&&r.status==='open')?.at?.(-1)?.commitmentId || '', lastSystemCommitmentId: graph.commitmentLedger?.filter?.((r)=>r.role!=='user'&&r.status==='open')?.at?.(-1)?.commitmentId || '', turnId: active.lastTurnId || turnId, memoryVersion: graph.memoryVersion },
      now,
    })
    suspended = [...suspended.filter((id) => id !== active.topicFrameId), active.topicFrameId]
  }

  if (active && transitionType === 'close_current') {
    frames[active.topicFrameId] = updateQl7SupportTopicFrame(active, { status: 'resolved', resolvedAt: now, now })
    resolved = [...resolved.filter((id) => id !== active.topicFrameId), active.topicFrameId]
    activeTopicFrameId = ''
  } else if (active && transitionType === 'abandon_current') {
    frames[active.topicFrameId] = updateQl7SupportTopicFrame(active, { status: 'abandoned', now })
    abandoned = [...abandoned.filter((id) => id !== active.topicFrameId), active.topicFrameId]
    activeTopicFrameId = ''
  } else if (transitionType.startsWith('resume_by_') && frames[transition.targetTopicFrameId]) {
    const target = frames[transition.targetTopicFrameId]
    frames[target.topicFrameId] = updateQl7SupportTopicFrame(target, {
      status: target.status === 'resolved' ? 'reopened' : 'active',
      resumedAt: now,
      userQuestion: text || target.userQuestion,
      materialIntent: scopeReceipt.selectedIntentId || target.materialIntent,
      microtopicId: scopeReceipt.primaryMicrotopicId || target.microtopicId,
      ...frameIntentConfirmationPatch(target, analysis),
      lastMeaningfulUserTurnId: turnId,
      lastTurnId: turnId,
      locale,
      now,
    })
    activeTopicFrameId = target.topicFrameId
    suspended = suspended.filter((id) => id !== target.topicFrameId)
  } else if (['switch_to_new', 'interrupt_current'].includes(transitionType) || !active) {
    const frame = createQl7SupportTopicFrame({
      conversationId: graph.conversationId,
      parentTopicFrameId: transitionType === 'interrupt_current' ? active?.topicFrameId : '',
      branchOfTopicFrameId: active?.topicFrameId || '',
      domainId: scopeReceipt.primaryDomainId,
      subdomainId: scopeReceipt.primarySubdomainId,
      microtopicId: scopeReceipt.primaryMicrotopicId,
      userGoal: scopeReceipt.userGoalId,
      userQuestion: text,
      materialIntent: scopeReceipt.selectedIntentId,
      userCorrections: analysis.correction ? [text] : [],
      rejectedHypotheses: analysis.rejectedHypothesis ? [analysis.rejectedHypothesis] : [],
      expectedNextAction: analysis.needsChoice ? 'clarify-one-specific-point' : '',
      intentConfirmationReceiptId: analysis.intentConfirmation?.receiptId,
      intentConfirmationState: analysis.intentConfirmation?.state,
      clarificationTurnCount: analysis.intentConfirmation?.turnCount,
      locale,
      createdTurnId: turnId,
      lastTurnId: turnId,
      now,
    })
    frames[frame.topicFrameId] = frame
    activeTopicFrameId = frame.topicFrameId
  } else if (active) {
    frames[active.topicFrameId] = updateQl7SupportTopicFrame(active, {
      userQuestion: text || active.userQuestion,
      materialIntent: scopeReceipt.selectedIntentId || active.materialIntent,
      microtopicId: scopeReceipt.primaryMicrotopicId || active.microtopicId,
      userCorrections: analysis.correction
        ? [...active.userCorrections, text]
        : active.userCorrections,
      rejectedHypotheses: analysis.rejectedHypothesis
        ? [...active.rejectedHypotheses, analysis.rejectedHypothesis]
        : active.rejectedHypotheses,
      ...frameIntentConfirmationPatch(active, analysis),
      lastMeaningfulUserTurnId: turnId,
      lastTurnId: turnId,
      locale,
      now,
    })
  }

  const stackPolicy = applyQl7SupportTopicStackPolicy({ frames, activeTopicFrameId, suspendedTopicFrameIds: suspended, candidateFrameId: activeTopicFrameId, transitionType })
  if (!stackPolicy.ok) throw new Error(`ql7_support_topic_stack_policy:${stackPolicy.failures.join(',')}`)
  return { frames, activeTopicFrameId, suspended: [...stackPolicy.suspendedTopicFrameIds], resolved, abandoned }
}

export function applyQl7SupportUserTurnToMemoryGraph({
  memoryGraph = {},
  transition = {},
  analysis = {},
  scopeReceipt = {},
  text = '',
  turnId = '',
  locale = 'en',
  now = '',
} = {}) {
  const graph = createQl7SupportConversationMemoryGraph(memoryGraph)
  const at = ql7Str(now)
  const next = nextFrame({ graph, transition, analysis, scopeReceipt, text, turnId, locale, now: at })
  const turnRecord = Object.freeze({
    turnId: ql7Str(turnId),
    role: 'user',
    textHash: ql7StableHash(ql7Str(text)),
    domainId: scopeReceipt.primaryDomainId,
    microtopicId: scopeReceipt.primaryMicrotopicId,
    intentId: scopeReceipt.selectedIntentId,
    transitionType: transition.transitionType,
    topicFrameId: next.activeTopicFrameId,
    at,
  })
  return createQl7SupportConversationMemoryGraph({
    ...graph,
    activeTopicFrameId: next.activeTopicFrameId,
    suspendedTopicFrameIds: next.suspended,
    recentlyResolvedTopicFrameIds: next.resolved,
    abandonedTopicFrameIds: next.abandoned,
    topicFrames: next.frames,
    turnRecords: [...graph.turnRecords, turnRecord],
    entityMemory: updateQl7SupportEntityReferenceMemory(graph.entityMemory, { entities: [...(analysis.contactSignals?.entities || []), ...(analysis.knowledgeAliasReceipt?.entities || [])], turnId, locale, at }),
    userCorrections: analysis.correction ? [...graph.userCorrections, ql7Str(text)] : graph.userCorrections,
    rejectedHypotheses: analysis.rejectedHypothesis
      ? [...graph.rejectedHypotheses, analysis.rejectedHypothesis]
      : graph.rejectedHypotheses,
    correctionLedger: analysis.correction ? appendQl7SupportCorrection(graph.correctionLedger, { text, turnId, at }) : graph.correctionLedger,
    rejectedHypothesisLedger: analysis.rejectedHypothesis ? appendQl7SupportRejectedHypothesis(graph.rejectedHypothesisLedger, { hypothesis: analysis.rejectedHypothesis?.topic || analysis.rejectedHypothesis?.hypothesis || String(analysis.rejectedHypothesis), reason: analysis.rejectedHypothesis?.reason || 'user_correction', turnId, at }) : graph.rejectedHypothesisLedger,
    returnCandidates: next.suspended.map((topicFrameId) => ({ topicFrameId })),
    activeIntentConfirmation: analysis.intentConfirmation?.state === 'collecting'
      ? analysis.intentConfirmation
      : null,
    intentConfirmationReceipts: analysis.intentConfirmation
      ? [...graph.intentConfirmationReceipts, analysis.intentConfirmation]
      : graph.intentConfirmationReceipts,
    updatedAt: at,
  })
}

export function commitQl7SupportAssistantTurnToMemoryGraph({
  memoryGraph = {},
  text = '',
  turnId = '',
  propositionIds = [],
  nextAction = '',
  resolved = false,
  now = '',
} = {}) {
  const graph = createQl7SupportConversationMemoryGraph(memoryGraph)
  const frames = { ...graph.topicFrames }
  const active = frames[graph.activeTopicFrameId]
  if (active) {
    frames[active.topicFrameId] = updateQl7SupportTopicFrame(active, {
      answeredPropositionIds: [...active.answeredPropositionIds, ...ql7Arr(propositionIds)],
      expectedNextAction: ql7Str(nextAction || active.expectedNextAction),
      lastMeaningfulAssistantTurnId: ql7Str(turnId),
      lastStableSummary: ql7Str(text).slice(0, 600),
      status: resolved ? 'resolved' : active.status,
      resolvedAt: resolved ? ql7Str(now) : active.resolvedAt,
      lastTurnId: turnId,
      now,
    })
  }
  const record = Object.freeze({
    turnId: ql7Str(turnId),
    role: 'assistant',
    textHash: ql7StableHash(ql7Str(text)),
    topicFrameId: graph.activeTopicFrameId,
    propositionIds: capped(propositionIds, 128),
    at: ql7Str(now),
  })
  const activeCommitmentId = active?.topicFrameId || graph.activeTopicFrameId || ql7Str(turnId)
  const commitmentLedger = nextAction
    ? updateQl7SupportCommitments(graph.commitmentLedger, { commitmentId: activeCommitmentId, description: ql7Str(nextAction), status: resolved ? 'resolved' : 'open', turnId, at: now })
    : resolved && activeCommitmentId
      ? updateQl7SupportCommitments(graph.commitmentLedger, { commitmentId: activeCommitmentId, description: ql7Str(active?.expectedNextAction), status: 'resolved', turnId, at: now })
      : graph.commitmentLedger
  return createQl7SupportConversationMemoryGraph({
    ...graph,
    memoryVersion: graph.memoryVersion + 1,
    topicFrames: frames,
    turnRecords: [...graph.turnRecords, record],
    recentlyResolvedTopicFrameIds: resolved && active
      ? [...graph.recentlyResolvedTopicFrameIds, active.topicFrameId]
      : graph.recentlyResolvedTopicFrameIds,
    commitmentLedger,
    updatedAt: ql7Str(now),
  })
}


export function commitQl7SupportOperationalStateToMemoryGraph({
  memoryGraph = {},
  turn = {},
  now = '',
} = {}) {
  const graph = createQl7SupportConversationMemoryGraph(memoryGraph)
  const state = normalizeOperationalState(graph.operationalState)
  const safety = turn.safety && typeof turn.safety === 'object' ? turn.safety : {}
  const insultState = turn.insultState && typeof turn.insultState === 'object' ? turn.insultState : {}
  const act = ql7Str(turn.messageAct)
  const topic = ql7Str(turn.topic)
  const assistantText = ql7Str(turn.assistantText)
  const material = ![
    'greeting', 'entry_greeting', 'gratitude', 'farewell', 'small_talk', 'casual_chat',
    'humor_request', 'humor_followup', 'joke_request', 'emotional_support',
    'wellbeing_question', 'topic_recall', 'topic_resume', 'ambiguous_request', 'spam_or_noise',
  ].includes(act)
  const relationship = ['business_proposal', 'partnership_request', 'human_operator_request'].includes(act) ||
    ['partnership', 'investment', 'contact'].includes(topic) || turn.operatorHandoff === true
  const responseHash = assistantText ? ql7StableHash(assistantText.toLowerCase()) : ''
  const propositionHashes = ql7Arr(turn.propositions)
    .map((row) => ql7StableHash(ql7Str(row).toLowerCase()))
    .filter(Boolean)
  const at = ql7Str(now || turn.now)
  const pendingBoundaryClarification = insultState.createPending
    ? (insultState.pendingBoundaryClarification || Object.freeze({ active: true }))
    : insultState.clearPending
      ? Object.freeze({ active: false })
      : state.safety.pendingBoundaryClarification
  const history = capped([
    ...state.safety.history,
    ...(safety.category && safety.category !== 'none'
      ? [{ category: safety.category, level: safety.escalationLevel, at }]
      : []),
  ], 32)
  const nextOperationalState = Object.freeze({
    ...state,
    entities: Object.freeze({ ...state.entities, ...(turn.entities || {}) }),
    responseFingerprints: responseHash
      ? capped([...state.responseFingerprints, responseHash], 512)
      : state.responseFingerprints,
    sentenceFingerprints: capped([...state.sentenceFingerprints, ...sentenceHashes(assistantText)], 2048),
    propositionFingerprints: capped([...state.propositionFingerprints, ...propositionHashes], 2048),
    recentSvgAssetIds: turn.svgAssetId
      ? capped([...state.recentSvgAssetIds, turn.svgAssetId], 20)
      : state.recentSvgAssetIds,
    lastMaterialTurnId: material
      ? ql7Str(turn.userTurnId || turn.turnId || state.lastMaterialTurnId)
      : state.lastMaterialTurnId,
    closureState: turn.resolved ? 'closed' : ql7Str(turn.closureState || state.closureState || 'open'),
    safety: Object.freeze({
      ...state.safety,
      directInsultCount: safety.category === 'direct_insult'
        ? Math.max(Number(state.safety.directInsultCount || 0), Number(safety.escalationLevel || 0))
        : Number(state.safety.directInsultCount || 0),
      confirmedDirectInsultCount: safety.category === 'direct_insult'
        ? Math.max(Number(state.safety.confirmedDirectInsultCount || 0), Number(safety.escalationLevel || 0))
        : Number(state.safety.confirmedDirectInsultCount || 0),
      pendingBoundaryClarification: Object.freeze({ ...pendingBoundaryClarification }),
      lastAssessment: safety.insultAssessment || state.safety.lastAssessment,
      lastCategory: ql7Str(safety.category || state.safety.lastCategory),
      blockedUntil: ql7Str(safety.blockedUntil || state.safety.blockedUntil),
      history,
    }),
    social: Object.freeze({
      smallTalkTurns: state.social.smallTalkTurns + (act === 'small_talk' || act === 'casual_chat' ? 1 : 0),
      supportiveTurns: state.social.supportiveTurns + (turn.emotionalSupport ? 1 : 0),
      humorMode: turn.humorMode === true || (state.social.humorMode && act === 'humor_followup'),
    }),
    business: Object.freeze({
      ...state.business,
      intakeTurns: state.business.intakeTurns + (relationship ? 1 : 0),
      operatorRequestTurns: state.business.operatorRequestTurns + (act === 'human_operator_request' ? 1 : 0),
      contactPrompted: state.business.contactPrompted || turn.contactPrompted === true,
      contactProvided: state.business.contactProvided || turn.contactProvided === true,
      contactRefused: state.business.contactRefused || turn.contactRefused === true,
      lastStage: ql7Str(turn.relationshipStage || state.business.lastStage),
      questionnaire: turn.questionnaire && typeof turn.questionnaire === 'object'
        ? Object.freeze({ ...turn.questionnaire })
        : state.business.questionnaire,
    }),
  })
  return createQl7SupportConversationMemoryGraph({
    ...graph,
    operationalState: nextOperationalState,
    updatedAt: at || graph.updatedAt,
  })
}

export function validateQl7SupportConversationMemoryGraph(memoryGraph = {}) {
  const failures = []
  if (memoryGraph.schema !== 'ql7.support.conversation-memory-graph') failures.push('invalid_schema')
  if (memoryGraph.schemaVersion !== QL7_SUPPORT_CONVERSATION_MEMORY_GRAPH_VERSION) failures.push('unknown_schema_version')
  if (!Number.isInteger(memoryGraph.memoryVersion) || memoryGraph.memoryVersion < 0) failures.push('invalid_memory_version')
  if (!memoryGraph.conversationId) failures.push('missing_conversation_id')
  if (memoryGraph.turnRecords?.length > QL7_SUPPORT_MEMORY_LIMITS.recentTurnWindow) failures.push('turn_window_overflow')
  if (memoryGraph.suspendedTopicFrameIds?.length > QL7_SUPPORT_MEMORY_LIMITS.suspendedTopicFrames) failures.push('suspended_frame_overflow')
  if (memoryGraph.intentConfirmationReceipts?.length > QL7_SUPPORT_MEMORY_LIMITS.intentConfirmationReceipts) failures.push('intent_confirmation_overflow')
  if (memoryGraph.activeTopicFrameId && !memoryGraph.topicFrames?.[memoryGraph.activeTopicFrameId]) failures.push('active_frame_missing')
  if (!memoryGraph.memoryHash) failures.push('missing_hash')
  const copy = { ...memoryGraph }
  delete copy.memoryHash
  if (memoryGraph.memoryHash && ql7StableHash(JSON.stringify(copy)) !== memoryGraph.memoryHash) failures.push('hash_mismatch')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}
