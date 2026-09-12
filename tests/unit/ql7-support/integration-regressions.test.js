import { describe, expect, it } from 'vitest'
import {
  commitQl7SupportIdempotency,
  reserveQl7SupportIdempotency,
  waitForQl7SupportIdempotency,
} from '../../../lib/ql7-support/http/idempotencyStore.js'
import { analyzeQl7SupportTurn } from '../../../lib/ql7-support/semantics/analyzeTurn.js'
import { classifyQl7SupportGeneralTopic } from '../../../lib/ql7-support/knowledge/generalKnowledgeRegistry.js'
import { deriveQl7EntrySession } from '../../../lib/ql7-support/greeting/entrySession.js'

describe('canonical canonical integration regression closure', () => {
  it('does not treat the short AI alias as a substring inside an unrelated Russian word', () => {
    const text = 'Да, это при создании ордера LONG, ошибка 500'
    expect(classifyQl7SupportGeneralTopic(text, { locale: 'ru' })?.category).not.toBe('ai')
    const analysis = analyzeQl7SupportTurn({ locale: 'ru', text, previousContext: { activeTopic: 'battlecoin', topic: 'battlecoin', previousTopic: 'battlecoin' } }).analysis
    expect(analysis).toMatchObject({ topic: 'battlecoin', messageAct: 'incident_report' })
  })

  it('uses a protected wallet reference to complete the pending Ads personal-status intent without exposing it as semantic prose', () => {
    const first = analyzeQl7SupportTurn({ locale: 'uk', text: 'Проблемы с рекламой', conversationId: 'integration-regression', turnId: '1' }).analysis
    const wallet = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    const second = analyzeQl7SupportTurn({ locale: 'uk', text: wallet, conversationId: 'integration-regression', turnId: '2', previousContext: { activeTopic: 'support_system', topic: 'support_system', intentConfirmation: first.intentConfirmation, openMaterialQuestion: true } }).analysis
    expect(second).toMatchObject({ topic: 'ads_campaigns', messageAct: 'personal_status_request', requiresAdapter: true })
    expect(second.adapterEligibility.ads_campaigns).toBe(true)
    expect(second.entities.walletAddress).toBe(wallet)
  })

  it('derives one stable greeting reservation for the same entry session', () => {
    const base = { actorHash: 'actor', conversationId: 'ql7-support', entrySessionId: 'open:first', entryEpoch: '1', locale: 'ru', reopenReason: 'open', greetingPolicyVersion: '5.4.0' }
    const a = deriveQl7EntrySession({ ...base, openedAt: '2026-08-21T00:00:00.000Z' })
    const b = deriveQl7EntrySession({ ...base, openedAt: '2026-08-21T00:00:05.000Z' })
    expect(b.greetingReservationId).toBe(a.greetingReservationId)
  })

  it('makes a concurrent support-entry request wait for the first committed response', async () => {
    const keyHash = `entry-idempotency-${Date.now()}-${Math.random()}`
    const first = await reserveQl7SupportIdempotency({
      keyHash,
      payloadHash: 'same-entry-payload',
      actorIdHash: 'actor-entry',
    })
    const concurrent = await reserveQl7SupportIdempotency({
      keyHash,
      payloadHash: 'same-entry-payload',
      actorIdHash: 'actor-entry',
    })

    expect(first).toMatchObject({ owner: true, state: 'reserved' })
    expect(concurrent).toMatchObject({ owner: false, replay: false, state: 'reserved' })

    const settledPromise = waitForQl7SupportIdempotency({
      keyHash,
      timeoutMs: 1_000,
      pollMs: 20,
    })
    await commitQl7SupportIdempotency({
      keyHash,
      ownerToken: first.ownerToken,
      result: { ok: true, messageId: 'support-entry-message' },
    })

    await expect(settledPromise).resolves.toMatchObject({
      state: 'committed',
      result: { ok: true, messageId: 'support-entry-message' },
    })
  })
})
