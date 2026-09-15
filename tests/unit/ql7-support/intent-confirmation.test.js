import { describe, expect, it } from 'vitest'
import { createQl7SupportConversationMemoryGraph } from '../../../lib/ql7-support/conversation/conversationMemoryGraph.js'
import { normalizeQl7SupportInput } from '../../../lib/ql7-support/language/normalizeInput.js'
import { executeQl7SupportTurnRuntime } from '../../../lib/ql7-support/runtime/executeTurn.js'
import { analyzeQl7SupportTurn } from '../../../lib/ql7-support/semantics/analyzeTurn.js'
import {
  QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS,
  validateQl7SupportIntentConfirmationReceipt,
} from '../../../lib/ql7-support/semantics/intentConfirmationReceipt.js'

const now = Date.parse('2026-08-15T00:00:00.000Z')

function analyze(text, previousContext = {}, id = text) {
  return analyzeQl7SupportTurn({
    text,
    locale: 'ru',
    conversationId: 'intent-confirmation-test',
    turnId: `turn:${id}`,
    previousContext,
    now,
  }).analysis
}

describe('QL7 Support canonical multi-turn intent confirmation', () => {
  it('does not authorize punctuation, keyboard noise, a bare product name or vague ads wording', () => {
    for (const text of ['.', 'asdfghjkl', 'QCoin', 'моя реклама']) {
      const result = analyze(text)
      expect(result.requiresAdapter, text).toBe(false)
      expect(result.adapterEligibility.mongoReadAllowed, text).toBe(false)
      expect(result.intentConfirmation.adapterAuthorized, text).toBe(false)
    }
    expect(analyze('QCoin').intentConfirmation).toMatchObject({
      state: 'collecting',
      slotValues: { domainId: 'qcoin', operationId: '' },
      missingSlots: ['operationId'],
    })
  })

  it('authorizes a direct actor-scoped read only with explicit domain and operation evidence', () => {
    const result = analyze('покажи метрики моей рекламы')
    expect(result).toMatchObject({
      topic: 'ads_campaigns',
      messageAct: 'personal_status_request',
      requiresAdapter: true,
      adapterEligibility: { ads_campaigns: true, mongoReadAllowed: true },
      intentConfirmation: {
        state: 'confirmed',
        adapterAuthorized: true,
        adapterOperationId: 'campaign_metrics',
        missingSlots: [],
      },
    })
  })

  it('accumulates a vague ads request and a later clarification before authorizing Mongo read', () => {
    const first = analyze('моя реклама', {}, 'ads-1')
    expect(first.intentConfirmation.state).toBe('collecting')
    expect(first.requiresAdapter).toBe(false)

    const second = analyze('метрики', {
      intentConfirmation: first.intentConfirmation,
    }, 'ads-2')
    expect(second).toMatchObject({
      topic: 'ads_campaigns',
      messageAct: 'personal_status_request',
      requiresAdapter: true,
      intentConfirmation: {
        state: 'confirmed',
        turnCount: 2,
        slotValues: { domainId: 'ads_campaigns', operationId: 'campaign_metrics' },
      },
    })
    expect(second.intentConfirmation.evidenceIds).toEqual(expect.arrayContaining([
      'domain:ads_campaigns',
      'operation:campaign_metrics',
      'dialogue:clarification-answer',
    ]))
  })

  it('keeps AI recommendation blocked until domain, operation, asset and timeframe are confirmed', () => {
    const first = analyze('биток', {}, 'ai-1')
    const second = analyze('дай AI рекомендацию', {
      intentConfirmation: first.intentConfirmation,
    }, 'ai-2')
    const third = analyze('4h', {
      intentConfirmation: second.intentConfirmation,
    }, 'ai-3')

    expect(first.intentConfirmation).toMatchObject({
      state: 'collecting',
      slotValues: { domainId: 'exchange_ai', assetId: 'BTCUSDT' },
      missingSlots: ['operationId'],
    })
    expect(second).toMatchObject({
      requiresAdapter: false,
      intentConfirmation: {
        state: 'collecting',
        slotValues: { operationId: 'ai_recommendation', assetId: 'BTCUSDT' },
        missingSlots: ['timeframe'],
      },
    })
    expect(third).toMatchObject({
      requiresAdapter: true,
      intentConfirmation: {
        state: 'confirmed',
        adapterAuthorized: true,
        slotValues: { operationId: 'ai_recommendation', assetId: 'BTCUSDT', timeframe: '4h' },
        missingSlots: [],
      },
    })
  })

  it('distinguishes talking about Bitcoin from an explicit current-price request', () => {
    const discussion = analyze('что думаешь про перспективы битка?')
    const price = analyze('сколько сейчас стоит биток?')
    expect(discussion.requiresAdapter).toBe(false)
    expect(discussion.intentConfirmation.adapterAuthorized).toBe(false)
    expect(price).toMatchObject({
      topic: 'exchange_ai',
      messageAct: 'ai_recommendation_request',
      requiresAdapter: true,
      intentConfirmation: {
        adapterOperationId: 'current_price',
        slotValues: { assetId: 'BTCUSDT' },
      },
    })
  })

  it('treats explicit rejection as counter-evidence and never carries authorization across it', () => {
    const first = analyze('моя реклама', {}, 'reject-1')
    const rejected = analyze('нет, я не про рекламу', {
      intentConfirmation: first.intentConfirmation,
    }, 'reject-2')
    expect(rejected.requiresAdapter).toBe(false)
    expect(rejected.intentConfirmation).toMatchObject({
      state: 'rejected',
      adapterAuthorized: false,
    })
    expect(rejected.intentConfirmation.counterEvidenceIds).toContain('explicit-intent-rejection')
  })

  it('does not misread "пока не знаю" as a farewell while material clarification is pending', () => {
    const first = analyze('моя реклама', {}, 'not-farewell-1')
    const second = analyze('пока не знаю', {
      intentConfirmation: first.intentConfirmation,
    }, 'not-farewell-2')
    expect(second.intentConfirmation.state).toBe('collecting')
    expect(second.intentConfirmation.adapterAuthorized).toBe(false)
    expect(second.messageAct).not.toBe('farewell')
    expect(second.socialAct).not.toBe('farewell')
  })

  it('hard-stops after thirty unresolved clarification turns', () => {
    let result = analyze('моя реклама', {}, 'limit-1')
    for (let index = 2; index <= QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS; index += 1) {
      result = analyze('пока не знаю', {
        intentConfirmation: result.intentConfirmation,
      }, `limit-${index}`)
    }
    expect(result.requiresAdapter).toBe(false)
    expect(result.intentConfirmation).toMatchObject({
      state: 'exhausted',
      turnCount: QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS,
      remainingTurns: 0,
      adapterAuthorized: false,
    })
  }, 30_000)

  it('uses the same confirmation receipt in the production runtime path and persists it in both memories', () => {
    const runtime = executeQl7SupportTurnRuntime({
      mode: 'test',
      requestId: 'runtime-intent-confirmation',
      conversationId: 'runtime-intent-confirmation',
      userTurnId: 'runtime-intent-confirmation:user-1',
      selectedLocale: 'ru',
      text: 'моя реклама',
      now: '2026-08-15T00:00:00.000Z',
    })
    expect(runtime.analysis.requiresAdapter).toBe(false)
    expect(runtime.receipts).toEqual([])
    expect(runtime.analysis.intentConfirmation.state).toBe('collecting')
    expect(runtime.conversationState.intentConfirmation.receiptId).toBe(runtime.analysis.intentConfirmation.receiptId)
    expect(runtime.memoryGraph.activeIntentConfirmation.receiptId).toBe(runtime.analysis.intentConfirmation.receiptId)
    expect(runtime.plan.confirmationSlot).toBe('operationId')
    expect(runtime.plan.waitingFor).toBe('signed_choice')
    expect(runtime.surface.options).toHaveLength(4)
    expect(runtime.surface.other).toBeTruthy()
    expect(runtime.surface.options.some((option) => /реклам|метрик/iu.test(String(option?.label || '')))).toBe(true)
    expect(runtime.text).toMatch(/что именно|имеете в виду|как это работает|статус|проблем/u)
  })

  it('rejects tampered and future-version receipts', () => {
    const receipt = analyze('покажи мой баланс QCoin').intentConfirmation
    expect(validateQl7SupportIntentConfirmationReceipt(receipt)).toMatchObject({ ok: true, failures: [] })
    expect(validateQl7SupportIntentConfirmationReceipt({ ...receipt, adapterOperationId: 'campaign_metrics' }).failures).toContain('receipt_hash_mismatch')
    expect(validateQl7SupportIntentConfirmationReceipt({ ...receipt, schemaVersion: '99.0.0' }).failures).toContain('unknown_schema_version')
  })

  it('preserves deliberate English code-switching under a Russian selected locale', () => {
    expect(normalizeQl7SupportInput({ locale: 'ru', text: 'price btc' }).normalizedText).toBe('price btc')
    const result = analyze('price btc')
    expect(result).toMatchObject({
      topic: 'exchange_ai',
      requiresAdapter: true,
      intentConfirmation: { adapterOperationId: 'current_price' },
    })
    expect(createQl7SupportConversationMemoryGraph({ activeIntentConfirmation: result.intentConfirmation }).activeIntentConfirmation.receiptId).toBe(result.intentConfirmation.receiptId)
  })
})
