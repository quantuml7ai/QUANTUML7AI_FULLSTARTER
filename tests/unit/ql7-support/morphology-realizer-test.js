import { describe, expect, it } from 'vitest'

import { auditQl7SupportFactPresentationLexicon } from '../../../lib/ql7-support/language/factPresentationLexicon.js'
import { buildQl7SupportDiscoursePlan } from '../../../lib/ql7-support/response/discoursePlanner.js'
import { realizeQl7SupportMorphology } from '../../../lib/ql7-support/response/morphologyRealizer.js'

function realize(contentPlan, { locale = 'ru', seed = 'morphology-test', attempt = 0 } = {}) {
  const semanticPlan = Object.freeze({
    planId: 'semantic:test',
    planHash: 'semantic-hash',
    lengthClass: 'compact',
    requiredPropositions: ['requested-answer'],
    userSpecificAnchor: { inputMeaningHash: 'input-hash' },
  })
  const scopeReceipt = Object.freeze({
    receiptId: 'scope:test',
    receiptHash: 'scope-hash',
    primaryDomainId: contentPlan.topic || 'support_system',
    selectedIntentId: contentPlan.messageAct || 'informational_question',
  })
  const discoursePlan = buildQl7SupportDiscoursePlan({
    semanticPlan,
    contentPlan,
    scopeReceipt,
    locale,
    seed,
    attempt,
  })
  return realizeQl7SupportMorphology({
    discoursePlan,
    semanticPlan,
    contentPlan,
    scopeReceipt,
    locale,
    seed,
    attempt,
  })
}

describe('QL7 Support morphology realizer canonical.1', () => {
  it('owns complete typed fact labels for all 32 locale profiles', () => {
    expect(auditQl7SupportFactPresentationLexicon()).toMatchObject({
      ok: true,
      localeCount: 32,
      keyCount: 25,
      entryCount: 800,
      failures: [],
    })
  })

  it('realizes verified actor facts and retains their immutable provenance', () => {
    const result = realize({
      topic: 'qcoin',
      messageAct: 'personal_status_request',
      resultKind: 'verified',
      surfaceKind: 'structured',
      factProjection: {
        verified: true,
        factHash: 'fact:qcoin:balance',
        receiptId: 'receipt:qcoin:read',
        checkedAt: '2026-08-15T10:00:00.000Z',
        facts: { balance: 125.5, sourceData: {} },
      },
    })

    expect(result.text).toMatch(/Баланс:\s*125,5\s*QCoin/u)
    expect(result.text).not.toContain('2026-08-15T10:00:00.000Z')
    expect(result.immutableFactFragments).toEqual([
      expect.objectContaining({ fragmentId: 'fact:qcoin:balance', sourceId: 'receipt:qcoin:read' }),
    ])
    expect(result.realizationReceipt).toMatchObject({
      branchId: 'fact.verified',
      locale: 'ru',
      morphologyChecks: { rawIsoDateLeak: false, unresolvedSlots: 0 },
    })
    expect(result.realizationReceipt.frameReceipts[0].entryId).toBe('ru.composition.verified')
  })

  it('does not infer a sensitive fact from noise', () => {
    const result = realize({
      topic: 'support_system',
      messageAct: 'spam_or_noise',
      resultKind: 'none',
      surfaceKind: 'compact',
    })

    expect(result.text).toMatch(/фрагмент|вопрос/u)
    expect(result.text).not.toMatch(/баланс|реклам|кампан/iu)
    expect(result.realizationReceipt.branchId).toBe('clarification.noise-recovery')
  })

  it('declines exhausted AI calculation through the quota branch', () => {
    const result = realize({
      topic: 'exchange_ai',
      messageAct: 'ai_recommendation_request',
      resultKind: 'verified',
      surfaceKind: 'structured',
      allowedSecondaryDomainIds: ['vip'],
      receipt: { result: { quotaState: 'exhausted', canAnalyze: false } },
      factProjection: {
        verified: true,
        receiptId: 'receipt:quota',
        facts: { sourceData: { quotaState: 'exhausted', canAnalyze: false } },
      },
    })

    expect(result.text).toMatch(/квота|расч[её]т|VIP/iu)
    expect(result.realizationReceipt.branchId).toBe('fact.ai-quota-exhausted')
    expect(result.realizationReceipt.frameReceipts).toEqual([
      expect.objectContaining({ operationKey: 'aiQuota' }),
    ])
  })

  it('fails closed for a locale without a reviewed profile', () => {
    expect(() => realize({ topic: 'support_system', messageAct: 'greeting' }, { locale: 'xx' }))
      .toThrow('ql7_morphology_locale_unsupported:xx')
  })
})
