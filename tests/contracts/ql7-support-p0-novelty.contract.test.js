import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_NOVELTY_RESERVATION_POLICY,
  buildQl7SupportNoveltyReservationDescriptors,
  buildQl7SupportNoveltyReservationScopeId,
  buildQl7SupportSemanticContextObservation,
  validateQl7SupportNoveltyReservationDescriptors,
} from '../../lib/ql7-support/response/noveltyReservation.js'
import {
  QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS,
  QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET,
  nextQl7SupportRegenerationStrategy,
} from '../../lib/ql7-support/response/regenerationController.js'
import { QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT } from '../../lib/ql7-support/semantics/clarificationStrategyRegistry.js'

const scopeReceipt={primaryDomainId:'support_system',primaryMicrotopicId:'support.answer',selectedIntentId:'answer',memoryHash:'m',allowedFactIds:['f1']}
const semanticPlan={planHash:'same-semantic-plan'}
const qualityGate={novelty:{fingerprint:{exactHash:'x',normalizedHash:'n',unorderedSentenceMultisetHash:'s',unorderedClauseMultisetHash:'c',rhetoricalSkeletonHash:'r',openingHash:'o',closingHash:'z',titleHash:'t',sentenceHashes:['s1'],clauseHashes:['c1'],immutableSentenceHashes:[],immutableClauseHashes:[],minHashSignature:['m1']}}}

describe('QL7 Support canonical P0 novelty delivery availability contract',()=>{
  it('separates semantic identity from realization reservation without weakening historical anti-repeat',()=>{
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.semanticIdentityIsExclusive).toBe(false)
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.observationalTypes).toContain('semantic_context')
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.exclusiveTypes).not.toContain('semantic_context')
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.historicalAntiRepeatOwner).toBe('ql7-support.semantic-novelty-ledger')
    const observation=buildQl7SupportSemanticContextObservation({actorIdHash:'a',locale:'ru',scopeReceipt,semanticPlan})
    expect(observation.exclusive).toBe(false)
  })

  it('keeps durable reservation deterministic inside a turn and distinct across turns',()=>{
    const first=buildQl7SupportNoveltyReservationScopeId({actorIdHash:'a',conversationId:'c',turnId:'t1'})
    const retry=buildQl7SupportNoveltyReservationScopeId({actorIdHash:'a',conversationId:'c',turnId:'t1'})
    const next=buildQl7SupportNoveltyReservationScopeId({actorIdHash:'a',conversationId:'c',turnId:'t2'})
    expect(first).toBe(retry)
    expect(first).not.toBe(next)
    const rows=buildQl7SupportNoveltyReservationDescriptors({actorIdHash:'a',conversationId:'c',turnId:'t1',locale:'ru',scopeReceipt,semanticPlan,qualityGate})
    expect(validateQl7SupportNoveltyReservationDescriptors(rows).ok).toBe(true)
    expect(rows.some((row)=>row.fingerprintType==='semantic_context')).toBe(false)
  })

  it('retains the normal regeneration budget and adds a separate material safe-fallback strategy search',()=>{
    expect(QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS).toBe(16)
    expect(QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET).toBe(32)
    expect(QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT).toBe(512)
    const exhausted=nextQl7SupportRegenerationStrategy({attempt:QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS,collisionReceipt:{fingerprintType:'exact_response'}})
    expect(exhausted.strategy).toBe('scope-safe-clarification')
    expect(exhausted.changedDimensions).toContain('clarification_question')
  })

  it('propagates restricted collision receipts through ordinary, entry, event and recovery regeneration paths',()=>{
    const server=fs.readFileSync('lib/ql7-support/server.js','utf8')
    const coordinator=fs.readFileSync('lib/ql7-support/runtime/deliveryCommitCoordinator.js','utf8')
    const executor=fs.readFileSync('lib/ql7-support/runtime/executeTurn.js','utf8')
    expect((server.match(/noveltyCollisionReceipt:\s*collisionReceipt/gu)||[]).length).toBeGreaterThanOrEqual(3)
    expect(coordinator).toContain('noveltyCollisionHistory')
    expect(coordinator).toContain('fingerprintType')
    expect(coordinator).toContain('regenerationChangedDimensions')
    expect(executor).toContain('safe_clarification_delivered')
    expect(executor).toContain('fallbackQualityGateReceiptHash')
  })
})
