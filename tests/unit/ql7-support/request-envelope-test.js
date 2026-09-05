import { describe, expect, it } from 'vitest'
import { buildQl7SupportTurnRequestEnvelope, validateQl7SupportTurnRequestEnvelope } from '../../../lib/ql7-support/contracts/supportTurnRequestEnvelope.js'
import { executeQl7SupportProductionTurn } from '../../../lib/ql7-support/runtime/productionTurn.js'

const ACTOR = Object.freeze({
  valid: true,
  authMode: 'test_verified_actor',
  canonicalAccountId: 'request-envelope:test-actor',
  sessionIdHash: 'session-hash-test',
  actorReceiptId: 'actor-receipt:request-envelope-test',
  verifiedAt: '2026-08-16T00:00:00.000Z',
  expiresAt: '2026-08-16T01:00:00.000Z',
})
const BOUNDARY = Object.freeze({
  originDecisionReceiptId: 'origin-receipt:test',
  rateLimitBucketId: 'rate-bucket:test',
  idempotencyKeyHash: 'idempotency-hash:test',
})

describe('QL7 Support canonical SupportTurnRequestEnvelope', () => {
  it('binds verified actor, raw input, route, locale and boundary receipts before runtime', () => {
    const envelope = buildQl7SupportTurnRequestEnvelope({
      requestId: 'req-1',
      correlationId: 'corr-1',
      conversationId: 'conv-1',
      turnId: 'turn-1',
      clientMutationId: 'mutation-1',
      idempotencyKey: 'idem-1',
      actor: ACTOR,
      text: 'Привет 👋',
      locale: 'ru',
      requestedLocale: 'ru',
      sourceRouteId: 'dm.support-send.post',
      sourceSurfaceId: 'messenger.support',
      source: 'production',
      requestBoundary: BOUNDARY,
      now: '2026-08-16T00:00:00.000Z',
    })
    expect(envelope.actorReceiptId).toBe(ACTOR.actorReceiptId)
    expect(envelope.rawInputByteLength).toBeGreaterThan(envelope.rawInputGraphemeLength)
    expect(envelope.requestedLocale).toBe('ru')
    expect(envelope.sourceRouteId).toBe('dm.support-send.post')
    expect(envelope.sourceSurfaceId).toBe('messenger.support')
    expect(envelope.originDecisionReceiptId).toBe(BOUNDARY.originDecisionReceiptId)
    expect(envelope.rateLimitBucketId).toBe(BOUNDARY.rateLimitBucketId)
    expect(envelope.idempotencyKeyHash).toBe(BOUNDARY.idempotencyKeyHash)
    expect(envelope.boundaryComplete).toBe(true)
    expect(validateQl7SupportTurnRequestEnvelope(envelope)).toEqual({ ok: true, failures: [] })
  })

  it('fails closed before runtime when no verified actor exists', () => {
    expect(() => buildQl7SupportTurnRequestEnvelope({
      requestId: 'req-invalid', conversationId: 'conv-invalid', turnId: 'turn-invalid',
      clientMutationId: 'mutation-invalid', idempotencyKey: 'idem-invalid', text: 'hello', locale: 'en',
    })).toThrow(/verified_actor_required/)
  })

  it('keeps trusted internal verifiedActorId compatibility without accepting an explicitly invalid actor', async () => {
    const turn = await executeQl7SupportProductionTurn({
      mode: 'test',
      requestId: 'internal-compatible',
      conversationId: 'internal-compatible',
      userTurnId: 'internal-compatible:user',
      verifiedActorId: 'internal-compatible:actor',
      idempotencyKey: 'internal-compatible:idem',
      selectedLocale: 'en',
      originalText: 'How does the forum work?',
      now: '2026-08-16T00:00:00.000Z',
    })
    expect(turn.runtimeInput.requestEnvelope.actorReceiptId).toContain('actor-receipt:internal:')
    await expect(executeQl7SupportProductionTurn({
      mode: 'test', requestId: 'invalid-explicit', conversationId: 'invalid-explicit', userTurnId: 'invalid-explicit:user',
      actor: { valid: false }, verifiedActorId: 'must-not-override-invalid', idempotencyKey: 'invalid-explicit:idem',
      selectedLocale: 'en', originalText: 'hello', now: '2026-08-16T00:00:00.000Z',
    })).rejects.toMatchObject({ code: 'ql7_support_request_envelope_invalid' })
  })
})
