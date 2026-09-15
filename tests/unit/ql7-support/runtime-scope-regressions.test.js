import { describe, expect, it } from 'vitest'
import { executeQl7SupportTurnRuntime } from '../../../lib/ql7-support/runtime/executeTurn.js'
import { analyzeQl7SupportTurn } from '../../../lib/ql7-support/semantics/analyzeTurn.js'
import { evaluateQl7SupportSafety } from '../../../lib/ql7-support/safety/evaluateTurn.js'
import { buildQl7SupportKnowledgeSourceReceipt } from '../../../lib/ql7-support/knowledge/sourceReceipt.js'

const NOW_ISO = '2026-08-15T00:00:00.000Z'
const NOW_MS = Date.parse(NOW_ISO)

function sourceReceipt({ expired = false } = {}) {
  return buildQl7SupportKnowledgeSourceReceipt({
    factId: expired ? 'fact:canonical:expired' : 'fact:canonical:current',
    subjectId: 'sea',
    sourceClass: 'official_public_source',
    sourceRef: expired ? 'source:canonical:expired' : 'source:canonical:current',
    verifiedAt: expired ? '2026-08-10T00:00:00.000Z' : '2026-08-14T00:00:00.000Z',
    validUntil: expired ? '2026-08-14T00:00:00.000Z' : '2026-08-20T00:00:00.000Z',
    freshnessClass: 'current',
    currentSensitive: true,
    claimHash: expired ? 'claim:expired' : 'claim:current',
    evidenceHash: expired ? 'evidence:expired' : 'evidence:current',
    status: 'verified',
  })
}

describe('QL7 Support canonical runtime scope regressions', () => {
  it('realizes the general-knowledge branch through an explicit locale profile on all native contours', async () => {
    const cases = {
      en: 'tell me about the sea',
      ru: 'расскажи про море',
      uk: 'розкажи про море',
      es: 'háblame del mar',
      tr: 'bana denizden bahset',
      ar: 'حدثني عن البحر',
      zh: '告诉我关于海洋',
      he: 'ספר לי על הים',
    }
    for (const [locale, text] of Object.entries(cases)) {
      const result = await executeQl7SupportTurnRuntime({
        requestId: `canonical-unit-${locale}`,
        conversationId: `canonical-unit-${locale}`,
        turnId: `canonical-unit-turn-${locale}`,
        actorIdHash: `canonical-unit-actor-${locale}`,
        text,
        locale,
        now: NOW_ISO,
      })
      expect(result.discoursePlan.branchId, locale).toBe('dialogue.general-knowledge')
      expect(result.realized.text, locale).toBeTruthy()
      expect(result.qualityGate.decision, locale).not.toBe('regenerate')
    }
  })

  it('normalizes semantic clock shapes before source-receipt freshness auditing', () => {
    const current = sourceReceipt()
    const expired = sourceReceipt({ expired: true })
    for (const now of [() => NOW_MS, NOW_MS, NOW_ISO]) {
      const accepted = analyzeQl7SupportTurn({
        text: 'расскажи про море', locale: 'ru', now, knowledgeContext: { sourceReceipt: current },
      })
      const rejected = analyzeQl7SupportTurn({
        text: 'расскажи про море', locale: 'ru', now, knowledgeContext: { sourceReceipt: expired },
      })
      expect(accepted.analysis.knowledgeSourceReceipt?.receiptId).toBe(current.receiptId)
      expect(rejected.analysis.knowledgeSourceReceipt).toBeNull()
    }
  })

  it('normalizes safety clock shapes without RangeError and preserves policy result', () => {
    const categories = [() => NOW_MS, NOW_MS, NOW_ISO].map((now) => evaluateQl7SupportSafety({
      text: 'как работает QCoin?', locale: 'ru', now,
    }).category)
    expect(new Set(categories).size).toBe(1)
    expect(categories[0]).toBe('none')
  })
})
