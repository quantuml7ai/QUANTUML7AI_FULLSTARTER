import { describe, expect, it } from 'vitest'

import {
  QL7_SUPPORT_NOVELTY_RESERVATION_POLICY,
  buildQl7SupportNoveltyReservationDescriptors,
} from '../../lib/ql7-support/response/noveltyReservation.js'

const scopeReceipt = {
  primaryDomainId: 'forum',
  primaryMicrotopicId: 'forum.explain',
  selectedIntentId: 'explain',
  memoryHash: 'canonical-integration-memory',
  allowedFactIds: [],
}
const semanticPlan = { planHash: 'canonical-integration-semantic-plan' }
const qualityGate = { novelty: { fingerprint: {
  exactHash: 'canonical-x', normalizedHash: 'canonical-n', unorderedSentenceMultisetHash: 'canonical-s', unorderedClauseMultisetHash: 'canonical-c',
  rhetoricalSkeletonHash: 'canonical-r', openingHash: 'canonical-o', closingHash: 'canonical-z', titleHash: 'canonical-t', sentenceHashes: ['canonical-s1'],
  clauseHashes: ['canonical-c1'], immutableSentenceHashes: [], immutableClauseHashes: [], minHashSignature: ['canonical-m1'],
} } }

describe('canonical integration closure', () => {
  it('keeps distinct turns collision-free at the durable reservation layer', () => {
    const common = { actorIdHash: 'canonical-actor', conversationId: 'canonical-conversation', locale: 'en', scopeReceipt, semanticPlan, qualityGate }
    const first = buildQl7SupportNoveltyReservationDescriptors({ ...common, turnId: 'turn-a' })
    const second = buildQl7SupportNoveltyReservationDescriptors({ ...common, turnId: 'turn-b' })
    const ids = new Set(first.map((row) => row.reservationId))
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.durableReservationScope).toBe('actor_conversation_turn')
    expect(second.filter((row) => ids.has(row.reservationId))).toHaveLength(0)
  })

  it('keeps same-turn retries deterministic so concurrent duplicate delivery remains rejectable before transport', () => {
    const common = { actorIdHash: 'canonical-actor', conversationId: 'canonical-conversation', turnId: 'turn-a', locale: 'en', scopeReceipt, semanticPlan, qualityGate }
    const first = buildQl7SupportNoveltyReservationDescriptors(common)
    const retry = buildQl7SupportNoveltyReservationDescriptors(common)
    expect(retry.map((row) => row.reservationId)).toEqual(first.map((row) => row.reservationId))
    expect(first.length).toBeGreaterThan(8)
  })
})
