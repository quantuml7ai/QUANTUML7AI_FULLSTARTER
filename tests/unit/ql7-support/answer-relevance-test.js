import { describe, expect, it } from 'vitest'
import { evaluateQl7SupportAnswerRelevance } from '../../../lib/ql7-support/response/answerRelevanceGuard.js'
import { evaluateQl7SupportUserSpecificAnchor } from '../../../lib/ql7-support/response/userSpecificAnchorGuard.js'
import { getQl7SupportDomainBoundary } from '../../../lib/ql7-support/semantics/domainBoundaryGraph.js'

function scope({
  domain = 'wallet',
  microtopic = `${domain}.overview`,
  intent = 'informational_question',
  receiptId = 'scope:test',
  receiptHash = 'scope-hash:test',
} = {}) {
  return {
    receiptId,
    receiptHash,
    primaryDomainId: domain,
    primaryMicrotopicId: microtopic,
    selectedIntentId: intent,
    userGoalId: `${domain}:${intent}`,
    userRequestedEntityIds: [],
    allowedEntityIds: [domain],
  }
}

function plan(scopeReceipt, {
  messageAct = scopeReceipt.selectedIntentId,
  units = [`topic:${scopeReceipt.primaryDomainId}`, `act:${messageAct}`],
} = {}) {
  return {
    planHash: 'semantic-plan-hash:test',
    scopeReceiptId: scopeReceipt.receiptId,
    scopeReceiptHash: scopeReceipt.receiptHash,
    answerGoal: `${scopeReceipt.primaryDomainId}:${scopeReceipt.selectedIntentId}`,
    selectedDomainId: scopeReceipt.primaryDomainId,
    selectedMicrotopicId: scopeReceipt.primaryMicrotopicId,
    selectedIntentId: scopeReceipt.selectedIntentId,
    messageAct,
    directAnswerUnits: units,
    requiredPropositions: units,
    userSpecificAnchor: {
      inputMeaningHash: 'input-meaning-hash:test',
      selectedDomainId: scopeReceipt.primaryDomainId,
      selectedMicrotopicId: scopeReceipt.primaryMicrotopicId,
      selectedIntentId: scopeReceipt.selectedIntentId,
      topicFrameId: 'frame:test',
    },
  }
}

describe('QL7 Support canonical semantic answer relevance authority', () => {
  it('allows an interactional greeting only when it is bound to the canonical plan and request identity', () => {
    const scopeReceipt = scope({ domain: 'support_system', microtopic: 'support_system.overview', intent: 'general_knowledge' })
    const semanticPlan = plan(scopeReceipt, { messageAct: 'greeting', units: ['topic:support_system', 'act:greeting'] })
    const result = evaluateQl7SupportAnswerRelevance({
      text: 'Hello.',
      semanticPlan,
      scopeReceipt,
      contentPlan: { messageAct: 'greeting', propositions: ['topic:support_system', 'act:greeting'] },
      realizationPropositionIds: ['topic:support_system', 'act:greeting'],
      locale: 'en',
    })
    expect(result).toMatchObject({
      ok: true,
      nonSubstantive: true,
      canonicalPlanBound: true,
      failures: [],
    })
  })

  it('uses canonical realization provenance instead of English token overlap for a localized substantive answer', () => {
    const scopeReceipt = scope({ domain: 'wallet' })
    const semanticPlan = plan(scopeReceipt)
    const result = evaluateQl7SupportAnswerRelevance({
      text: 'Кошелёк подключён к вашему аккаунту.',
      semanticPlan,
      scopeReceipt,
      contentPlan: { messageAct: 'informational_question', propositions: semanticPlan.requiredPropositions },
      realizationPropositionIds: semanticPlan.requiredPropositions,
      locale: 'ru',
    })
    expect(result.ok).toBe(true)
    expect(result.realizationBound).toBe(true)
    expect(result.realizationSemanticOverlap).toBeGreaterThan(0)
  })

  it('rejects a substantive answer when semantic realization provenance is absent', () => {
    const scopeReceipt = scope({ domain: 'qcoin' })
    const semanticPlan = plan(scopeReceipt)
    const result = evaluateQl7SupportAnswerRelevance({
      text: 'QCoin balance details are available.',
      semanticPlan,
      scopeReceipt,
      contentPlan: { messageAct: 'informational_question', propositions: semanticPlan.requiredPropositions },
      realizationPropositionIds: [],
      locale: 'en',
    })
    expect(result.ok).toBe(false)
    expect(result.failures).toContain('realization_semantic_provenance_missing')
  })

  it('rejects realization provenance that does not belong to the canonical semantic plan', () => {
    const scopeReceipt = scope({ domain: 'qcoin' })
    const semanticPlan = plan(scopeReceipt)
    const result = evaluateQl7SupportAnswerRelevance({
      text: 'QCoin balance details are available.',
      semanticPlan,
      scopeReceipt,
      contentPlan: { messageAct: 'informational_question', propositions: semanticPlan.requiredPropositions },
      realizationPropositionIds: ['topic:ads_campaigns'],
      locale: 'en',
    })
    expect(result.ok).toBe(false)
    expect(result.failures).toContain('realization_semantic_provenance_mismatch')
  })

  it('rejects semantic-plan and scope mismatches even when visible text contains the product name', () => {
    const scopeReceipt = scope({ domain: 'qcoin' })
    const semanticPlan = plan(scopeReceipt)
    semanticPlan.userSpecificAnchor = {
      ...semanticPlan.userSpecificAnchor,
      selectedDomainId: 'ads_campaigns',
    }
    const relevance = evaluateQl7SupportAnswerRelevance({
      text: 'QCoin balance details are available.',
      semanticPlan,
      scopeReceipt,
      contentPlan: { messageAct: 'informational_question', propositions: semanticPlan.requiredPropositions },
      realizationPropositionIds: semanticPlan.requiredPropositions,
      locale: 'en',
    })
    const anchor = evaluateQl7SupportUserSpecificAnchor({ semanticPlan, scopeReceipt, text: 'QCoin balance details are available.' })
    expect(relevance.failures).toContain('semantic_anchor_scope_mismatch')
    expect(anchor.failures).toContain('semantic_anchor_scope_mismatch')
  })

  it('keeps the Payments to Wallet relation as an explicit required dependency rather than cross-domain leakage', () => {
    const boundary = getQl7SupportDomainBoundary('payments')
    expect(boundary.requiredDependencies).toContain('wallet')
    expect(boundary.forbiddenAutomaticRelations).not.toContain('wallet')
  })
})
