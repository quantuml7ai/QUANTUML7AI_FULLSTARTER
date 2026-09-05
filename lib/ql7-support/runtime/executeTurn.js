import {assertQl7SupportActive} from '../config/featureFlag.js'
import {QL7_SUPPORT_STATIC_DATA_READINESS as QL7_SUPPORT_STATIC_DATA_READINESS} from '../config/staticDataReadiness.js'
import {hashQl7SupportDeliveryText} from '../contracts/finalDeliveryReceipt.js'
import {QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH, QL7_SUPPORT_RUNTIME_EXECUTOR_ID, QL7_SUPPORT_RUNTIME_VERSION} from '../config/behaviorManifest.js'
import {
  applyQl7SupportUserTurnToMemoryGraph,
  commitQl7SupportAssistantTurnToMemoryGraph,
  commitQl7SupportOperationalStateToMemoryGraph,
  createQl7SupportConversationMemoryGraph,
} from '../conversation/conversationMemoryGraph.js'
import {classifyQl7SupportTopicTransition} from '../conversation/transitionClassifier.js'
import {projectQl7SupportMemoryGraphToRuntimeState, projectQl7SupportMemoryGraphToSemanticContext} from '../conversation/semanticContext.js'
import {getQl7SupportLocalTimeParts, normalizeQl7SupportTimeZone} from '../conversation/temporalContext.js'
import {normalizeQl7SupportReceipts, receiptFromQl7Diagnostic} from '../data/adapterReceipt.js'
import {buildQl7SupportFactProjection} from '../data/factProjection.js'
import {resolveQl7SupportResponseLocale} from '../language/responseLocalePolicy.js'
import {buildQl7SupportIncidentCandidate} from '../learning/incidentCandidate.js'
import {buildQl7SupportComposerPolicyFromSafety} from '../inputPolicy.js'
import {ql7Arr, ql7Locale, ql7StableHash, ql7Str} from '../internal/text.js'
import {buildQl7SupportOperatorCase} from '../operator/buildCase.js'
import {buildQl7SupportSurface} from '../presentation/buildSupportSurface.js'
import {buildQl7SupportResponseContentPlan} from '../response/buildContentPlan.js'
import {buildQl7SupportSemanticResponsePlan} from '../response/buildSemanticResponsePlan.js'
import {critiqueQl7SupportResponse} from '../response/critiqueResponse.js'
import {buildQl7SupportDiscoursePlan} from '../response/discoursePlanner.js'
import {evaluateQl7SupportFinalHumanQuality} from '../response/finalHumanQualityGate.js'
import {nextQl7SupportRegenerationStrategy, QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS, QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET} from '../response/regenerationController.js'
import {buildQl7SupportNoveltyReservationDescriptors, buildQl7SupportSemanticContextObservation} from '../response/noveltyReservation.js'
import {realizeQl7SupportHumanNaturalResponse} from '../response/humanNaturalRealizer.js'
import {
  commitQl7SupportNoveltyFingerprint,
  createQl7SupportSemanticNoveltyLedger,
} from '../response/semanticNoveltyLedger.js'
import {analyzeQl7SupportTurn} from '../semantics/analyzeTurn.js'
import {buildQl7SupportResponseScopeReceipt} from '../semantics/buildResponseScopeReceipt.js'
import {normalizeQl7SupportOperatorState} from '../ecosystemCatalog.js'
import {buildQl7SupportContactConsentReceipt} from '../contact/contactConsent.js'
import {getQl7SupportContactRetentionPolicy} from '../contact/contactPrivacy.js'
import {projectQl7SupportContactForOperator, projectQl7SupportContactForUser} from '../contact/contactIntelligence.js'
import {prepareQl7NativeIntelligenceContext} from './nativeIntelligencePlane.js'
import {readQl7SupportAcademyKnowledge,shouldReadQl7SupportAcademyKnowledge} from '../knowledge/academy/academyKnowledgeAdapter.js'



function adapterRows(adapters={}){const out=[];for(const [name,value] of Object.entries(adapters||{})){if(value&&typeof value==='object'&&('executed'in value||'result'in value||'data'in value))out.push({...value,adapter:value.adapter||name,source:value.source||name})}return out}
function runtimeEvents(input, analysis) {
  const at = ql7Str(input.now) || new Date().toISOString()
  const base = {
    correlationId: ql7Str(input.correlationId || input.requestId),
    requestId: ql7Str(input.requestId),
    triggeringUserMessageId: ql7Str(input.userTurnId || input.messageId),
    attemptId: ql7Str(input.attemptId || input.requestId),
    serverTime: at,
  }
  const rawStates = ['accepted']
  if (analysis.requiresAdapter) rawStates.push('checking_evidence')
  rawStates.push('analyzing', 'composing')
  const byState = new Map()
  for (const rawState of rawStates) {
    const state = normalizeQl7SupportOperatorState(rawState)
    const previous = byState.get(state) || {}
    byState.set(state, {
      ...previous,
      rawStates: [...(previous.rawStates || []), rawState],
    })
  }
  return Object.freeze(Array.from(byState.entries()).map(([state, event], index) => Object.freeze({
    ...base,
    ...event,
    state,
    sequence: index + 1,
    operatorPublicState: true,
    deliveryStage: 'candidate',
  })))
}
function contactsFromAnalysis(analysis={},input={},now=''){
 const signals=analysis.contactSignals||{}
 const state=analysis.contactConsent===true?'granted':analysis.contactRefused===true?'refused':'unknown'
 if(state==='unknown'&&!signals.receipt)return null
 const refused=state==='refused'||state==='dm_only'
 const actorHash=ql7StableHash(ql7Str(input.actor?.canonicalAccountId||input.actor?.accountId||input.verifiedActorId||input.userId||input.actorId||''))
 const consentReceipt=buildQl7SupportContactConsentReceipt({actorHash,purpose:ql7Str(signals.purpose||'operator_handoff'),state,channelTypes:refused?['dm']:(signals.channels||analysis.contactChannels||[]),sourceReceiptId:ql7Str(signals.receipt?.receiptId),now})
 const retentionPolicy=getQl7SupportContactRetentionPolicy(refused?state:ql7Str(signals.purpose||'operator_handoff'))
 const emptyProjection=Object.freeze({purpose:signals.purpose||'operator_handoff',consent:false,refused,contacts:Object.freeze([]),receipt:signals.receipt||null})
 const userProjection=state==='granted'?projectQl7SupportContactForUser(signals):emptyProjection
 const operatorProjection=state==='granted'?projectQl7SupportContactForOperator(signals):emptyProjection
 return Object.freeze({consent:state==='granted',refused,contactDeclined:state==='refused',preferred:refused?'dm':ql7Str(signals.preferred||analysis.contactPreferred),channels:refused?['dm']:(signals.channels||analysis.contactChannels||[]),email:state==='granted'?ql7Str(signals.email):'',phone:state==='granted'?ql7Str(signals.phone):'',telegram:state==='granted'?ql7Str(signals.telegram):'',fax:state==='granted'?ql7Str(signals.fax):'',mobile:state==='granted'?ql7Str(signals.mobile):'',landline:state==='granted'?ql7Str(signals.landline):'',privateRedactionValues:Object.freeze(refused?(signals.values||[]).map((row)=>ql7Str(row?.value)).filter(Boolean):[]),consentReceipt,retentionPolicy,userProjection,operatorProjection})
}
export function executeQl7SupportTurnRuntime(input = {}, adapters = {}) {
  const mode = ql7Str(input.mode || 'test').toLowerCase() || 'test'
  if (mode === 'production') assertQl7SupportActive()

  const localePolicy = resolveQl7SupportResponseLocale(input)
  const locale = localePolicy.locale
  const text = ql7Str(input.originalText || input.text || input.sourceText)
  const explicitNow = ql7Str(input.now)
  const clockValue = explicitNow
    ? Date.parse(explicitNow)
    : typeof input.clock === 'function'
      ? Number(input.clock())
      : Number(input.clock || Date.now())
  const runtimeNowMs = Number.isFinite(clockValue) ? clockValue : Date.now()
  const now = explicitNow || new Date(runtimeNowMs).toISOString()
  const browserTimeZone = normalizeQl7SupportTimeZone(input.browserTimeZone || input.timeZone || input.entryEvent?.timeZone || 'UTC')
  const localTime = getQl7SupportLocalTimeParts({ now: runtimeNowMs, timeZone: browserTimeZone, locale })
  const semanticNow = () => runtimeNowMs
  const turnId = ql7Str(input.userTurnId || input.messageId || `turn:${ql7StableHash(`${input.requestId}:${text}`)}`)
  const conversationId = ql7Str(input.conversationId || input.caseId || input.requestId || 'ql7-support-conversation')
  const memorySource = input.priorMemoryGraph || input.memoryGraph || input.memory || {}
  const memoryBefore = createQl7SupportConversationMemoryGraph({
    ...memorySource,
    conversationId: memorySource?.conversationId || conversationId,
    updatedAt: memorySource?.updatedAt || now,
  })
  const runtimeStateBefore = projectQl7SupportMemoryGraphToRuntimeState(memoryBefore)
  const noveltyBefore = createQl7SupportSemanticNoveltyLedger(
    input.priorNoveltyLedger || input.noveltyLedger || {
      responseFingerprints: runtimeStateBefore.responseFingerprints,
    },
  )
  const semanticPreviousContext = projectQl7SupportMemoryGraphToSemanticContext(memoryBefore)

  const eventSourceReceipt = input.eventEnvelope?.sourceReceipt
    ? [{
      id: input.eventEnvelope.sourceReceipt.receiptId,
      adapter: 'support.event-source',
      source: 'support.event-source',
      sourceType: input.eventEnvelope.sourceReceipt.sourceType,
      actorScope: 'recipient',
      executed: true,
      verified: true,
      writeCount: 0,
      checkedAt: input.eventEnvelope.occurredAtServerUtc,
      evidenceHash: input.eventEnvelope.sourceReceipt.factHash,
      result: {
        eventType: input.eventEnvelope.type,
        topic: input.eventEnvelope.primaryDomainId,
        microtopic: input.eventEnvelope.primaryMicrotopicId,
        verifiedFactIds: input.eventEnvelope.verifiedFactIds,
        payload: input.eventEnvelope.payload,
      },
    }]
    : []
  const explicit = [
    ...(Array.isArray(input.adapterReceipts) ? input.adapterReceipts : []),
    ...eventSourceReceipt,
  ]
  const diagnostic = input.diagnosticResult
    ? [receiptFromQl7Diagnostic(input.diagnosticResult)]
    : []
  const receipts = normalizeQl7SupportReceipts([...explicit, ...diagnostic, ...adapterRows(adapters)])
  const knowledgeAdapter = adapters?.knowledge || adapters?.openHumanKnowledge || {}
  const knowledgeContext = Object.freeze({
    approvedPublicFigures: Array.isArray(knowledgeAdapter?.approvedPublicFigures) ? knowledgeAdapter.approvedPublicFigures : [],
    sourceReceipt: knowledgeAdapter?.sourceReceipt || null,
    publicFigureFactBundle: knowledgeAdapter?.publicFigureFactBundle || null,
    staticDataReadinessHash: QL7_SUPPORT_STATIC_DATA_READINESS.readinessHash,
  })
  const semantic = input.authoritativeAnalysis === true && input.analysis && typeof input.analysis === 'object'
    ? Object.freeze({
        version: 'canonical-understanding-receipt',
        locale,
        normalization: input.analysis.normalization || null,
        safety: input.analysis.safety || {},
        tone: input.tone || {},
        route: input.route || {},
        analysis: input.analysis,
      })
    : analyzeQl7SupportTurn({
        text,
        locale,
        conversationId,
        turnId,
        previousContext: semanticPreviousContext,
        baseAnalysis: input.analysis || {},
        baseRoute: input.route || {},
        baseTone: input.tone || {},
        baseAnalysisTrust: input.baseAnalysisTrust === true,
        knowledgeContext,
        now: semanticNow,
      })
  const transition = classifyQl7SupportTopicTransition({
    text,
    analysis: semantic.analysis,
    memoryGraph: memoryBefore,
  })
  // A trusted canonical analysis is authoritative provenance, not a claim of zero
  // uncertainty.  Do not erase its own ranked alternatives: that used to make
  // production turns systematically bypass the Choice Card precisely when the
  // canonical Understanding owner reported ambiguity.
  const topicHypotheses = ql7Arr(semantic.analysis.topicCandidates)
    .slice(0, 4)
    .map((row) => Object.freeze({
      probability: Number(row?.probability ?? row?.confidence ?? row?.score ?? row?.total ?? 0),
      topic: ql7Str(row?.topic),
    }))
    .filter((row) => row.topic && Number.isFinite(row.probability))
  const interactionDecision = Object.freeze({
    hypotheses: topicHypotheses,
    expectedErrorCost: semantic.analysis.userClarificationRequired === true ? 1 : semantic.analysis.needsChoice === true ? 0.82 : 0.55,
    informationGain: Number(semantic.analysis.clarificationDecision?.informationGain ?? (semantic.analysis.needsChoice === true ? 1 : 0.25)),
    policyRequiresChoice: semantic.analysis.needsChoice === true && topicHypotheses.length >= 2,
    semanticAuthorityTrusted: input.baseAnalysisTrust === true,
  })
  const academyKnowledgeReceipt = shouldReadQl7SupportAcademyKnowledge({
    query: text,
    topic: semantic.analysis.topic,
    messageAct: semantic.analysis.messageAct,
  })
    ? readQl7SupportAcademyKnowledge({ query: text, locale, checkedAt: now })
    : null
  const nativeIntelligence = prepareQl7NativeIntelligenceContext({ ...input, analysis: semantic.analysis, semanticFrame: semantic.analysis, interactionDecision })
  const detectedContacts = contactsFromAnalysis(semantic.analysis, input, now)
  const analysisForPlan = Object.freeze({
    ...semantic.analysis,
    ...(detectedContacts?.consentReceipt ? { contactConsentReceipt: detectedContacts.consentReceipt } : {}),
    academyKnowledgeReceipt,
    nativeIntelligence,
  })
  const factProjection = buildQl7SupportFactProjection({ topic: semantic.analysis.topic, receipts })
  const plan = buildQl7SupportResponseContentPlan({
    analysis: analysisForPlan,
    route: semantic.route,
    tone: semantic.tone,
    locale,
    receipts,
    conversationState: runtimeStateBefore,
    seed: input.seed || input.requestId || '',
    factProjection,
    runtimeContext: {
      openCases: input.openCases || [],
      runtimeCapability: input.runtimeCapability || null,
      entryEvent: input.entryEvent || null,
      eventEnvelope: input.eventEnvelope || null,
      interactionModality: nativeIntelligence.modality,
      timeZone: browserTimeZone,
      localTime,
      now,
    },
  })
  const scopeReceipt = buildQl7SupportResponseScopeReceipt({
    analysis: semantic.analysis,
    plan,
    memoryGraph: memoryBefore,
    conversationId,
    turnId,
    now,
  })
  const internalEvent = input.entryEvent?.type === 'entry_greeting' || input.eventEnvelope?.schema === 'ql7.support.event-envelope'
  const memoryAfterUser = internalEvent ? memoryBefore : applyQl7SupportUserTurnToMemoryGraph({
    memoryGraph: memoryBefore,
    transition,
    analysis: semantic.analysis,
    scopeReceipt,
    text,
    turnId,
    locale,
    now,
  })
  const semanticPlan = buildQl7SupportSemanticResponsePlan({
    text,
    locale,
    analysis: analysisForPlan,
    contentPlan: plan,
    scopeReceipt,
    memoryGraph: memoryAfterUser,
  })
  const realizationSeed = input.seed || input.requestId || scopeReceipt.receiptHash
  const externalNoveltyAttempt = Math.max(0, Number(input.noveltyCollisionReceipt?.attempt) || 0)
  const externalNoveltyStrategy = input.noveltyCollisionReceipt
    ? nextQl7SupportRegenerationStrategy({
      attempt: externalNoveltyAttempt >= QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS
        ? QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS
        : Math.max(0, externalNoveltyAttempt - 1),
      qualityGate: {},
      collisionReceipt: input.noveltyCollisionReceipt,
      usedStrategies: ql7Arr(input.usedRegenerationStrategies),
    })
    : null
  let discoursePlan = buildQl7SupportDiscoursePlan({
    semanticPlan,
    contentPlan: plan,
    scopeReceipt,
    locale,
    seed: realizationSeed,
    attempt: externalNoveltyAttempt,
    regenerationStrategy: externalNoveltyStrategy,
  })
  let realized = realizeQl7SupportHumanNaturalResponse({
    semanticPlan,
    discoursePlan,
    contentPlan: plan,
    scopeReceipt,
    locale,
    seed: realizationSeed,
    attempt: externalNoveltyAttempt,
    noveltyLedger: noveltyBefore,
    suppressTitle: input.noveltyCollisionReceipt?.fingerprintType === 'title',
    memoryGraph: memoryAfterUser,
    preferences: memoryAfterUser.explicitPreferences || {},
    analysis: analysisForPlan,
  })
  let canonicalKnowledgeReceipt = realized.knowledgeReceipt?.schema === 'ql7.support.knowledge-realization-receipt'
    ? realized.knowledgeReceipt
    : null
  let noveltyFallbackReceipt = realized.noveltyFallbackReceipt?.schema === 'ql7.support.novelty-delivery-availability-fallback-receipt'
    ? realized.noveltyFallbackReceipt
    : null
  let surface = buildQl7SupportSurface({
    plan,
    realized,
    locale,
    receipts,
    conversationState: runtimeStateBefore,
    requestContext: { requestId: input.requestId, caseId: input.caseId, now, timeZone: browserTimeZone, localTime },
  })
  let critic = critiqueQl7SupportResponse({
    text: realized.text,
    surface,
    locale,
    plan,
    receipts,
    expectedLocale: locale,
  })
  let qualityGate = evaluateQl7SupportFinalHumanQuality({
    text: realized.text,
    title: surface.title,
    locale,
    scopeReceipt,
    semanticPlan,
    noveltyLedger: noveltyBefore,
    actions: surface.actions?.length ? surface.actions : (surface.options || []),
    legacyCritic: critic,
    immutableFactFragments: realized.immutableFactFragments,
    realizationPropositionIds: realized.propositions,
    contentPlan: plan,
    memoryGraph: memoryAfterUser,
    surface,
  })
  let regenerationReceipt = externalNoveltyStrategy
  for (let attempt = 1; qualityGate.decision === 'regenerate' && attempt <= QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS; attempt += 1) {
    regenerationReceipt = nextQl7SupportRegenerationStrategy({
      attempt: attempt - 1, qualityGate, previousStrategy: regenerationReceipt?.strategy || '',
      collisionReceipt: input.noveltyCollisionReceipt || null, usedStrategies: ql7Arr(input.usedRegenerationStrategies),
    })
    discoursePlan = buildQl7SupportDiscoursePlan({
      semanticPlan,
      contentPlan: plan,
      scopeReceipt,
      locale,
      seed: realizationSeed,
      attempt,
      regenerationStrategy: regenerationReceipt,
    })
    realized = realizeQl7SupportHumanNaturalResponse({
      semanticPlan,
      discoursePlan,
      contentPlan: plan,
      scopeReceipt,
      locale,
      seed: realizationSeed,
      attempt,
      noveltyLedger: noveltyBefore,
      suppressTitle: input.noveltyCollisionReceipt?.fingerprintType === 'title',
      memoryGraph: memoryAfterUser,
      preferences: memoryAfterUser.explicitPreferences || {},
      analysis: semantic.analysis,
    })
    if (realized.knowledgeReceipt?.schema === 'ql7.support.knowledge-realization-receipt') canonicalKnowledgeReceipt = realized.knowledgeReceipt
    if (realized.noveltyFallbackReceipt?.schema === 'ql7.support.novelty-delivery-availability-fallback-receipt') noveltyFallbackReceipt = realized.noveltyFallbackReceipt
    surface = buildQl7SupportSurface({
      plan,
      realized,
      locale,
      receipts,
      conversationState: runtimeStateBefore,
      requestContext: { requestId: input.requestId, caseId: input.caseId, now, timeZone: browserTimeZone, localTime },
    })
    critic = critiqueQl7SupportResponse({
      text: realized.text,
      surface,
      locale,
      plan,
      receipts,
      expectedLocale: locale,
    })
    qualityGate = evaluateQl7SupportFinalHumanQuality({
      text: realized.text,
      title: surface.title,
      locale,
      scopeReceipt,
      semanticPlan,
      noveltyLedger: noveltyBefore,
      actions: surface.actions?.length ? surface.actions : (surface.options || []),
      legacyCritic: critic,
      immutableFactFragments: realized.immutableFactFragments,
      realizationPropositionIds: realized.propositions,
      contentPlan: plan,
      memoryGraph: memoryAfterUser,
      surface,
    })
  }
  if (qualityGate.decision === 'regenerate') {
    const exhaustedQualityGate = qualityGate
    for (let fallbackAttempt = 0; qualityGate.decision === 'regenerate' && fallbackAttempt < QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET; fallbackAttempt += 1) {
      const exhaustionStrategy = nextQl7SupportRegenerationStrategy({
        attempt: QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS,
        qualityGate: exhaustedQualityGate,
        previousStrategy: regenerationReceipt?.strategy || '',
        collisionReceipt: input.noveltyCollisionReceipt || null,
        usedStrategies: ql7Arr(input.usedRegenerationStrategies),
      })
      const fallbackAttemptNumber = QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS + 1 + fallbackAttempt
      const fallbackSeed = `${realizationSeed}:delivery-availability-fallback:${fallbackAttempt}`
      discoursePlan = buildQl7SupportDiscoursePlan({
        semanticPlan,
        contentPlan: plan,
        scopeReceipt,
        locale,
        seed: fallbackSeed,
        attempt: fallbackAttemptNumber,
        regenerationStrategy: exhaustionStrategy,
      })
      realized = realizeQl7SupportHumanNaturalResponse({
        semanticPlan,
        discoursePlan,
        contentPlan: plan,
        scopeReceipt,
        locale,
        seed: fallbackSeed,
        attempt: fallbackAttemptNumber,
        noveltyLedger: noveltyBefore,
        suppressTitle: true,
        memoryGraph: memoryAfterUser,
        preferences: memoryAfterUser.explicitPreferences || {},
        analysis: semantic.analysis,
      })
      if (realized.knowledgeReceipt?.schema === 'ql7.support.knowledge-realization-receipt') canonicalKnowledgeReceipt = realized.knowledgeReceipt
      if (realized.noveltyFallbackReceipt?.schema === 'ql7.support.novelty-delivery-availability-fallback-receipt') noveltyFallbackReceipt = realized.noveltyFallbackReceipt
      surface = buildQl7SupportSurface({
        plan,
        realized,
        locale,
        receipts,
        conversationState: runtimeStateBefore,
        requestContext: { requestId: input.requestId, caseId: input.caseId, now, timeZone: browserTimeZone, localTime },
      })
      critic = critiqueQl7SupportResponse({
        text: realized.text,
        surface,
        locale,
        plan,
        receipts,
        expectedLocale: locale,
      })
      qualityGate = evaluateQl7SupportFinalHumanQuality({
        text: realized.text,
        title: surface.title,
        locale,
        scopeReceipt,
        semanticPlan,
        noveltyLedger: noveltyBefore,
        actions: surface.actions?.length ? surface.actions : (surface.options || []),
        legacyCritic: critic,
        immutableFactFragments: realized.immutableFactFragments,
        realizationPropositionIds: realized.propositions,
        contentPlan: plan,
        memoryGraph: memoryAfterUser,
        surface,
      })
      regenerationReceipt = Object.freeze({
        ...exhaustionStrategy,
        action: qualityGate.decision === 'regenerate' ? 'safe_clarification_candidate_rejected' : 'safe_clarification_delivered',
        fallbackAttempt: fallbackAttempt + 1,
        fallbackStrategyBudget: QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET,
        fallbackQualityGateReceiptId: qualityGate.receiptId,
        fallbackQualityGateReceiptHash: qualityGate.receiptHash,
        fallbackResponseHash: realized.responseHash,
      })
    }
  }
  if (!regenerationReceipt && noveltyFallbackReceipt?.safeClarification === true && ql7Arr(plan.factProjection?.issues).length) {
    regenerationReceipt = Object.freeze({
      schema: 'ql7.support.regeneration-strategy-receipt',
      schemaVersion: '5.3.0',
      ownerId: 'ql7-support.regeneration-controller',
      action: 'safe_clarification_delivered',
      attempt: 0,
      strategy: 'scope-safe-clarification',
      failures: Object.freeze(['fact_projection_inconsistent']),
      collisionType: '',
      changedDimensions: Object.freeze(['clarification_question']),
      reason: 'verified_fact_projection_inconsistent',
    })
  }
  if (qualityGate.decision === 'regenerate') {
    const error = new Error(`response_quality_unavailable:${qualityGate.coherenceFailures.join(',')}`)
    error.code = 'response_quality_unavailable'
    error.status = 503
    error.qualityGate = qualityGate
    error.regenerationReceipt = regenerationReceipt
    throw error
  }

  // Knowledge/source provenance and novelty-delivery fallback provenance are independent contracts.
  // Surface regeneration may change wording or deliver a scope-safe clarification, but it must not
  // overwrite the source-gated knowledge receipt established by the canonical knowledge branch.
  if (canonicalKnowledgeReceipt || noveltyFallbackReceipt) {
    realized = Object.freeze({
      ...realized,
      knowledgeReceipt: canonicalKnowledgeReceipt || null,
      noveltyFallbackReceipt: noveltyFallbackReceipt || null,
    })
  }

  const composerPolicy = buildQl7SupportComposerPolicyFromSafety({
    safety: semantic.safety,
    caseId: input.caseId,
    locale,
    now: Date.parse(now) || Date.now(),
  })
  const finalMessageId = `support:${ql7StableHash(`${input.requestId}:${surface.integrityBlock.surfaceHash}:${realized.responseHash}`)}`
  const memoryAfterAssistant = commitQl7SupportAssistantTurnToMemoryGraph({
    memoryGraph: memoryAfterUser,
    text: realized.text,
    turnId: finalMessageId,
    propositionIds: realized.propositions,
    nextAction: plan.waitingFor,
    resolved: plan.closureState === 'closed',
    now,
  })
  const noveltyLedger = commitQl7SupportNoveltyFingerprint(noveltyBefore, realized.text, {
    locale,
    branch: `${scopeReceipt.primaryDomainId}:${scopeReceipt.selectedIntentId}`,
    title: surface.title,
    semanticPlanHash: semanticPlan.planHash,
    immutableFactFragments: realized.immutableFactFragments,
  })
  const operatorRequired = input.forceOperatorCase === true ||
    plan.operatorHandoff?.required === true ||
    (semantic.analysis.topic === 'security' &&
      semantic.analysis.messageAct === 'incident_report' &&
      semantic.analysis.scamCrimeSignal === true)
  const operatorCase = operatorRequired
    ? buildQl7SupportOperatorCase({
      requestId: input.requestId,
      caseId: input.caseId,
      actor: input.actor || {},
      profile: input.profile || {},
      analysis: semantic.analysis,
      originalText: text,
      translatedMeaning: input.translatedMeaning || text,
      receipts,
      rating: input.rating || null,
      geo: input.geo || {},
      activity: input.activity || {},
      contacts: input.contacts || detectedContacts,
      now,
    })
    : undefined
  const operatorStatus = operatorCase ? 'ready_for_review' : 'none'
  const nextState = plan.choices
    ? 'waiting_choice'
    : composerPolicy.allowed
      ? (plan.closureState === 'closed' ? 'idle' : 'input_ready')
      : 'cooldown'
  const events = runtimeEvents(input, semantic.analysis)
  const replyPlan = Object.freeze({
    text: realized.text,
    title: realized.title,
    responseMode: plan.surfaceKind === 'compact' ? 'human_short' : 'structured',
    replyBudget: Object.freeze({
      text: realized.text,
      graphemes: critic.graphemes,
      max: Math.max(1, Math.min(4000, Number(semanticPlan.responseBudget?.max) || 4000)),
      truncated: false,
    }),
    responseCode: ql7Str(plan.responseCode) || `canonical:${plan.topic}:${plan.messageAct}:${plan.resultKind}`,
    locale,
    topic: plan.topic,
    messageAct: plan.messageAct,
    semanticFingerprint: realized.responseHash,
    nextState,
    domainPlan: input.route?.domainPlan || input.analysis?.domainPlan || null,
    cardSpec: surface,
    clarification: plan.choices ? realized.text : null,
    userFacingAsOf: surface.checkedAt,
    contentPlan: plan,
    semanticPlan,
    discoursePlan,
    scopeReceipt,
    qualityGate,
    adapterReceipts: receipts,
    runtimeVersion: QL7_SUPPORT_RUNTIME_VERSION,
    behaviorManifestHash: QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH,
    composerPolicy,
    finalMessageId,
    operatorStatus,
  })
  const learningIncident = ['insult_uncertain', 'insult_denied', 'direct_insult'].includes(semantic.safety.category)
    ? buildQl7SupportIncidentCandidate({
      actorHash: input.actor?.id || input.actor?.wallet || '',
      caseId: input.caseId || input.requestId,
      assessment: semantic.safety.insultAssessment,
      locale,
      resolution: semantic.safety.insultState?.state,
      topicRecovery: semantic.safety.insultState?.state === 'denied',
    })
    : null
  const memoryAfter = commitQl7SupportOperationalStateToMemoryGraph({
    memoryGraph: memoryAfterAssistant,
    turn: {
      userTurnId: turnId,
      turnId: finalMessageId,
      assistantText: realized.text,
      propositions: realized.propositions,
      topic: semantic.safety.insultState?.resumeTopic || semantic.analysis.topic,
      activeGoal: semantic.safety.insultState?.resumeGoal || '',
      messageAct: semantic.analysis.messageAct,
      safety: semantic.safety,
      insultState: semantic.safety.insultState || {},
      resolved: plan.closureState === 'closed',
      closureState: plan.closureState,
      emotionalSupport: semantic.analysis.messageAct === 'emotional_support',
      humorMode: ['humor_request', 'humor_followup'].includes(semantic.analysis.messageAct),
      operatorHandoff: Boolean(plan.operatorHandoff?.required),
      contactPrompted: Boolean(plan.contactRequest?.requested),
      contactProvided: detectedContacts?.consent === true,
      contactRefused: detectedContacts?.refused === true,
      relationshipStage: plan.relationshipIntent?.stage || '',
      questionnaire: plan.contactQuestionnaire || null,
      svgAssetId: surface.svgAssetId,
      entities: semantic.analysis.entities || {},
      now,
    },
    now,
  })
  const conversationState = projectQl7SupportMemoryGraphToRuntimeState(memoryAfter)
  const noveltyReservationDescriptors = buildQl7SupportNoveltyReservationDescriptors({
    actorIdHash: input.verifiedActorIdHash || hashQl7SupportDeliveryText(
      input.verifiedActorId || input.actor?.canonicalAccountId || input.actor?.id || 'anonymous',
    ),
    conversationId,
    turnId,
    locale,
    scopeReceipt,
    semanticPlan,
    discoursePlan,
    qualityGate,
  })
  const noveltyReservationIds = Object.freeze(
    noveltyReservationDescriptors.map((row) => row.reservationId),
  )
  const noveltySemanticObservation = buildQl7SupportSemanticContextObservation({
    actorIdHash: input.verifiedActorIdHash || hashQl7SupportDeliveryText(input.verifiedActorId || input.actor?.canonicalAccountId || input.actor?.id || 'anonymous'),
    locale, scopeReceipt, semanticPlan,
  })

  return Object.freeze({
    version: QL7_SUPPORT_RUNTIME_VERSION,
    runtimeVersion: QL7_SUPPORT_RUNTIME_VERSION,
    mode,
    executorId: QL7_SUPPORT_RUNTIME_EXECUTOR_ID,
    behaviorManifestHash: QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH,
    analysis: analysisForPlan,
    tone: semantic.tone,
    localePolicy,
    transition,
    scopeReceipt,
    semanticPlan,
    discoursePlan,
    knowledgeReceipt: realized.knowledgeReceipt || nativeIntelligence.evidencePack || null,
    nativeIntelligence,
    noveltyFallbackReceipt: realized.noveltyFallbackReceipt || null,
    qualityGate,
    regenerationReceipt,
    requestId: ql7Str(input.requestId),
    requestEnvelope: input.requestEnvelope || null,
    conversationId,
    turnId,
    idempotencyKey: ql7Str(input.idempotencyKey || input.clientMutationId || input.requestId),
    replayInput: Object.freeze({
      redactedText: text,
      selectedLocale: locale,
      analysis: semantic.analysis,
      route: semantic.route,
      tone: semantic.tone,
      adapterReceipts: receipts,
      retentionPurpose: 'pre_send_semantic_replay',
    }),
    actor: Object.freeze({ ...(input.actor || {}) }),
    now,
    memoryBefore,
    memoryGraph: memoryAfter,
    noveltyBefore,
    noveltyLedger,
    noveltyReservationDescriptors,
    noveltyReservationIds,
    noveltySemanticObservation,
    factProjection,
    learningIncident,
    effectiveRoute: semantic.route,
    safety: semantic.safety,
    replyPlan,
    plan,
    contentPlan: plan,
    realized,
    text: realized.text,
    surface,
    critic,
    conversationState,
    receipts,
    adapterReceipts: receipts,
    composerPolicy,
    stateEvents: events,
    operatorCase,
    finalMessageId,
    internalProvenance: Object.freeze({
      resolvedExecutorPath: 'lib/ql7-support/runtime/executeTurn.js',
      inputHash: ql7StableHash(text),
      surfaceHash: surface.integrityBlock.surfaceHash,
      receiptsHash: ql7StableHash(JSON.stringify(receipts)),
      scopeReceiptHash: scopeReceipt.receiptHash,
      semanticPlanHash: semanticPlan.planHash,
      noveltySemanticObservationHash: noveltySemanticObservation.receiptHash,
      surfaceRedundancyReceiptHash: qualityGate.surfaceRedundancy?.receipt?.receiptHash || '',
      regenerationStrategyId: regenerationReceipt?.strategy || '',
      discoursePlanHash: discoursePlan.planHash,
      qualityGateHash: qualityGate.receiptHash,
      knowledgeReceiptHash: ql7Str(realized.knowledgeReceipt?.receiptHash),
      noveltyFallbackReceiptHash: ql7Str(realized.noveltyFallbackReceipt?.receiptHash),
      finalMessageId,
    }),
    runtimeParity: Object.freeze({
      sameExecutor: true,
      localePolicyVersion: localePolicy.version,
      executorId: QL7_SUPPORT_RUNTIME_EXECUTOR_ID,
      behaviorManifestHash: QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH,
      scopeReceiptHash: scopeReceipt.receiptHash,
      semanticPlanHash: semanticPlan.planHash,
      discoursePlanHash: discoursePlan.planHash,
      qualityGateHash: qualityGate.receiptHash,
      knowledgeReceiptHash: ql7Str(realized.knowledgeReceipt?.receiptHash),
      noveltyFallbackReceiptHash: ql7Str(realized.noveltyFallbackReceipt?.receiptHash),
    }),
  })
}
