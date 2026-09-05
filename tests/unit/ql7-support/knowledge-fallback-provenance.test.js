import { describe, expect, it } from 'vitest'

import { evaluateQl7SupportContradictions } from '../../../lib/ql7-support/response/contradictionGuard.js'
import { buildQl7SupportDiscoursePlan } from '../../../lib/ql7-support/response/discoursePlanner.js'
import { realizeQl7SupportMorphosyntax } from '../../../lib/ql7-support/response/morphosyntacticRealizer.js'
import { executeQl7SupportTurnRuntime } from '../../../lib/ql7-support/runtime/executeTurn.js'

function fallbackMorphology() {
  const contentPlan = Object.freeze({
    topic: 'ql7_blockchain',
    messageAct: 'informational_question',
    resultKind: 'none',
    surfaceKind: 'compact',
  })
  const semanticPlan = Object.freeze({
    planId: 'semantic:canonical-fallback',
    planHash: 'semantic:canonical-fallback:hash',
    lengthClass: 'compact',
    requiredPropositions: Object.freeze(['requested-answer']),
    userSpecificAnchor: Object.freeze({ inputMeaningHash: 'input:canonical-fallback' }),
  })
  const scopeReceipt = Object.freeze({
    receiptId: 'scope:canonical-fallback',
    receiptHash: 'scope:canonical-fallback:hash',
    primaryDomainId: 'ql7_blockchain',
    selectedIntentId: 'informational_question',
  })
  const regenerationStrategy = Object.freeze({
    strategy: 'scope-safe-clarification',
    changedDimensions: Object.freeze(['clarification_question']),
  })
  const discoursePlan = buildQl7SupportDiscoursePlan({
    semanticPlan,
    contentPlan,
    scopeReceipt,
    locale: 'en',
    seed: 'canonical-fallback',
    attempt: 17,
    regenerationStrategy,
  })
  return realizeQl7SupportMorphosyntax({
    discoursePlan,
    semanticPlan,
    contentPlan,
    scopeReceipt,
    locale: 'en',
    seed: 'canonical-fallback',
    attempt: 17,
  })
}

describe('QL7 Support canonical knowledge/fallback provenance separation', () => {
  it('treats explicit negated availability as compatible with planned status while retaining true contradiction controls', () => {
    const negated = [
      'L7 Blockchain is planned and not available yet.',
      'L7 Blockchain is currently source-gated as planned and not as an active released function.',
    ]
    for (const text of negated) {
      expect(evaluateQl7SupportContradictions({ text, facts: { status: 'planned' } })).toMatchObject({
        ok: true,
        failures: [],
        availabilityAssertion: { affirmative: false, future: true, explicitNegatedPositive: true },
      })
    }

    for (const text of ['L7 Blockchain is planned and available.', 'L7 Blockchain is planned but active.']) {
      const result = evaluateQl7SupportContradictions({ text, facts: { status: 'planned' } })
      expect(result.ok).toBe(false)
      expect(result.failures).toContain('availability_contradiction')
      expect(result.failures).toContain('fact_status_contradiction')
      expect(result.availabilityAssertion.affirmative).toBe(true)
    }
  })

  it('keeps a scope-safe novelty fallback receipt out of the knowledge-receipt slot at morphology owner', () => {
    const result = fallbackMorphology()
    expect(result.knowledgeReceipt).toBeNull()
    expect(result.noveltyFallbackReceipt).toMatchObject({
      schema: 'ql7.support.novelty-delivery-availability-fallback-receipt',
      safeClarification: true,
      finalTextStored: false,
    })
    expect(result.noveltyFallbackReceipt.receiptId).toMatch(/^novelty-fallback:/u)
    expect(result.noveltyFallbackReceipt.receiptHash).toHaveLength(8)
    expect(result.noveltyFallbackReceipt.strategyReceiptHash).toHaveLength(8)
  })

  it('preserves the canonical source-gated knowledge receipt when repeated knowledge turns legitimately use novelty fallback', () => {
    let memoryGraph = null
    let noveltyLedger = null
    let ledger = null
    let fallbackCount = 0
    let canonicalKnowledgeHash = ''

    for (let turn = 1; turn <= 5; turn += 1) {
      const result = executeQl7SupportTurnRuntime({
        requestId: `canonical-knowledge-${turn}`,
        conversationId: 'canonical-knowledge-conversation',
        userTurnId: `canonical-knowledge-turn-${turn}`,
        originalText: 'What is QL7 Blockchain?',
        selectedLocale: 'en',
        seed: `canonical-knowledge-${turn}`,
        priorMemoryGraph: memoryGraph,
        priorNoveltyLedger: noveltyLedger,
        ledger,
        now: new Date(1787080000000 + turn * 1000).toISOString(),
      })

      expect(result.knowledgeReceipt).toMatchObject({
        schema: 'ql7.support.knowledge-realization-receipt',
        graphVersion: '5.1.0',
        domainNodeId: 'knowledge.ql7_blockchain.domain',
        availability: 'planned',
      })
      expect(result.realized.knowledgeReceipt.receiptHash).toBe(result.knowledgeReceipt.receiptHash)
      expect(result.runtimeParity.knowledgeReceiptHash).toBe(result.knowledgeReceipt.receiptHash)

      canonicalKnowledgeHash ||= result.knowledgeReceipt.receiptHash
      expect(result.knowledgeReceipt.receiptHash).toBe(canonicalKnowledgeHash)

      if (result.noveltyFallbackReceipt) {
        fallbackCount += 1
        expect(result.regenerationReceipt?.strategy).toBe('scope-safe-clarification')
        expect(result.noveltyFallbackReceipt).toMatchObject({
          schema: 'ql7.support.novelty-delivery-availability-fallback-receipt',
          safeClarification: true,
          finalTextStored: false,
        })
        expect(result.realized.noveltyFallbackReceipt.receiptHash).toBe(result.noveltyFallbackReceipt.receiptHash)
        expect(result.runtimeParity.noveltyFallbackReceiptHash).toBe(result.noveltyFallbackReceipt.receiptHash)
        expect(result.noveltyFallbackReceipt.receiptHash).not.toBe(result.knowledgeReceipt.receiptHash)
      } else {
        expect(result.runtimeParity.noveltyFallbackReceiptHash).toBe('')
      }

      memoryGraph = result.memoryGraph
      noveltyLedger = result.noveltyLedger
      ledger = result.conversationState
    }

    expect(fallbackCount).toBeGreaterThan(0)
  })
})
