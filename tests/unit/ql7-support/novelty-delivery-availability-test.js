import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_NOVELTY_RESERVATION_POLICY,
  buildQl7SupportNoveltyReservationDescriptors,
  buildQl7SupportNoveltyReservationScopeId,
  buildQl7SupportSemanticContextObservation,
  validateQl7SupportNoveltyReservationDescriptors,
} from '../../../lib/ql7-support/response/noveltyReservation.js'
import {
  QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS,
  QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET,
  nextQl7SupportRegenerationStrategy,
} from '../../../lib/ql7-support/response/regenerationController.js'
import {
  QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT,
  selectQl7SupportNoveltyFallbackClarification,
} from '../../../lib/ql7-support/semantics/clarificationStrategyRegistry.js'

const scopeReceipt = {
  primaryDomainId: 'support_system',
  primaryMicrotopicId: 'support.answer',
  selectedIntentId: 'answer',
  memoryHash: 'm',
  allowedFactIds: ['f1'],
}
const semanticPlan = { planHash: 'same-semantic-plan' }
const qualityGate = {
  novelty: {
    fingerprint: {
      exactHash: 'x',
      normalizedHash: 'n',
      unorderedSentenceMultisetHash: 's',
      unorderedClauseMultisetHash: 'c',
      rhetoricalSkeletonHash: 'r',
      openingHash: 'o',
      closingHash: 'z',
      titleHash: 't',
      sentenceHashes: ['s1'],
      clauseHashes: ['c1'],
      immutableSentenceHashes: [],
      immutableClauseHashes: [],
      minHashSignature: ['m1'],
    },
  },
}

const directedCollisionExpectations = Object.freeze({
  exact_response: 'lexical-reframe',
  normalized_response: 'lexical-reframe',
  sentence_multiset: 'change-sentence-boundaries',
  clause_multiset: 'change-clause-structure',
  rhetorical_skeleton: 'change-rhetorical-skeleton',
  opening: 'change-opening',
  closing: 'change-closing',
  title: 'reduce-title',
  sentence: 'change-sentence-boundaries',
  clause: 'change-clause-structure',
  minhash_signature: 'lexical-reframe',
  surface_duplicate_proposition: 'surface-dedupe-reframe',
  surface_duplicate_table_row: 'surface-dedupe-reframe',
  surface_duplicate_status: 'surface-dedupe-reframe',
  surface_body_table_row_repetition: 'surface-dedupe-reframe',
  unnecessary_repeated_entity_label: 'entity-reference-reframe',
})

describe('P0 novelty delivery availability canonical', () => {
  it('keeps semantic identity observational and scopes durable realization locks by turn', () => {
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.semanticIdentityIsExclusive).toBe(false)
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.observationalTypes).toContain('semantic_context')
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.exclusiveTypes).not.toContain('semantic_context')
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.durableReservationScope).toBe('actor_conversation_turn')
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.historicalAntiRepeatOwner).toBe('ql7-support.semantic-novelty-ledger')
    const obs = buildQl7SupportSemanticContextObservation({ actorIdHash: 'a', locale: 'ru', scopeReceipt, semanticPlan })
    expect(obs.exclusive).toBe(false)
    expect(obs.use).toBe('provenance_and_near_semantic_measurement_only')
    expect(buildQl7SupportNoveltyReservationScopeId({ actorIdHash: 'a', conversationId: 'c', turnId: '1' }))
      .not.toBe(buildQl7SupportNoveltyReservationScopeId({ actorIdHash: 'a', conversationId: 'c', turnId: '2' }))
  })

  it('allows 100 repeated same-intent turns without durable historical reservation collision', () => {
    const seen = new Set()
    for (let i = 1; i <= 100; i += 1) {
      const rows = buildQl7SupportNoveltyReservationDescriptors({
        actorIdHash: 'a', conversationId: 'c', turnId: `t-${i}`, locale: 'ru', scopeReceipt, semanticPlan, qualityGate,
      })
      const validation = validateQl7SupportNoveltyReservationDescriptors(rows)
      expect(validation.ok, validation.failures.join(',')).toBe(true)
      expect(rows.some((row) => row.fingerprintType === 'semantic_context')).toBe(false)
      for (const row of rows) {
        expect(seen.has(row.reservationId), `${i}:${row.fingerprintType}`).toBe(false)
        seen.add(row.reservationId)
      }
    }
    expect(seen.size).toBeGreaterThan(100)
  })

  it('keeps same-turn retry deterministic for concurrency/idempotency protection', () => {
    const args = { actorIdHash: 'a', conversationId: 'c', turnId: 't', locale: 'ru', scopeReceipt, semanticPlan, qualityGate }
    const first = buildQl7SupportNoveltyReservationDescriptors(args)
    const retry = buildQl7SupportNoveltyReservationDescriptors(args)
    expect(first.map((row) => row.reservationId)).toEqual(retry.map((row) => row.reservationId))
    expect(first.every((row) => row.reservationScopeId === retry[0].reservationScopeId)).toBe(true)
  })

  it('maps every durable collision family to a material regeneration dimension', () => {
    for (const [fingerprintType, expectedStrategy] of Object.entries(directedCollisionExpectations)) {
      const receipt = nextQl7SupportRegenerationStrategy({ attempt: 0, collisionReceipt: { fingerprintType } })
      expect(receipt.action, fingerprintType).toBe('regenerate')
      expect(receipt.strategy, fingerprintType).toBe(expectedStrategy)
      expect(receipt.changedDimensions.length, fingerprintType).toBeGreaterThan(0)
      expect(receipt.reason, fingerprintType).toBe(`novelty_collision:${fingerprintType}`)
    }
  })

  it('does not solve a collision by retrying an already-used strategy forever', () => {
    const first = nextQl7SupportRegenerationStrategy({ attempt: 0, collisionReceipt: { fingerprintType: 'exact_response' } })
    const second = nextQl7SupportRegenerationStrategy({
      attempt: 1,
      previousStrategy: first.strategy,
      usedStrategies: [first.strategy],
      collisionReceipt: { fingerprintType: 'exact_response' },
    })
    expect(first.strategy).toBe('lexical-reframe')
    expect(second.action).toBe('regenerate')
    expect(second.strategy).not.toBe(first.strategy)
    expect(second.changedDimensions.length).toBeGreaterThan(0)
  })

  it('keeps the normal regeneration budget bounded and uses scope-safe exhaustion', () => {
    expect(QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS).toBe(16)
    const final = nextQl7SupportRegenerationStrategy({
      attempt: QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS,
      collisionReceipt: { fingerprintType: 'exact_response' },
    })
    expect(final.action).toBe('fail_closed')
    expect(final.strategy).toBe('scope-safe-clarification')
    expect(final.changedDimensions).toContain('clarification_question')
    expect(final.reason).toBe('regeneration_attempt_budget_exhausted')
  })

  it('uses the full semantic clarification bank for bounded safe fallback without stored final text', () => {
    expect(QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT).toBe(512)
    expect(QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET).toBe(32)
    const first = selectQl7SupportNoveltyFallbackClarification({ seed: 'same-intent-turn-17' })
    const second = selectQl7SupportNoveltyFallbackClarification({ seed: 'same-intent-turn-17', usedStrategyIds: [first.selectedStrategyId] })
    expect(first.readyToSend).toBe(false)
    expect(first.finalText).toBe(false)
    expect(first.selectedStrategyId).toMatch(/^clarify:/)
    expect(second.selectedStrategyId).not.toBe(first.selectedStrategyId)
    expect(second.readyToSend).toBe(false)
    expect(second.finalText).toBe(false)
  })
})
