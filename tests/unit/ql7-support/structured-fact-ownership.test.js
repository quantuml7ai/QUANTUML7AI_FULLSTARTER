import { describe, expect, it } from 'vitest'

import { buildQl7SupportDiscoursePlan } from '../../../lib/ql7-support/response/discoursePlanner.js'
import {
  QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
  realizeQl7SupportMorphosyntax,
  resolveQl7SupportExactFactVisibilityOwner,
} from '../../../lib/ql7-support/response/morphosyntacticRealizer.js'
import { executeQl7SupportTurnRuntime } from '../../../lib/ql7-support/runtime/executeTurn.js'
import { createQl7SupportAdapterReceipt } from '../../../lib/ql7-support/data/adapterReceipt.js'

function directMorphology(contentPlan, { locale = 'ru', seed = 'canonical-direct' } = {}) {
  const semanticPlan = Object.freeze({
    planId: 'semantic:canonical',
    planHash: 'semantic:canonical:hash',
    lengthClass: 'compact',
    requiredPropositions: ['requested-answer'],
    userSpecificAnchor: { inputMeaningHash: 'input:canonical' },
  })
  const scopeReceipt = Object.freeze({
    receiptId: 'scope:canonical',
    receiptHash: 'scope:canonical:hash',
    primaryDomainId: contentPlan.topic || 'support_system',
    selectedIntentId: contentPlan.messageAct || 'informational_question',
  })
  const discoursePlan = buildQl7SupportDiscoursePlan({
    semanticPlan,
    contentPlan,
    scopeReceipt,
    locale,
    seed,
    attempt: 0,
  })
  return realizeQl7SupportMorphosyntax({
    discoursePlan,
    semanticPlan,
    contentPlan,
    scopeReceipt,
    locale,
    seed,
    attempt: 0,
  })
}

describe('Canonical exact structured-fact visibility ownership', () => {
  it('keeps a verified immutable fact visible when morphology has no table-owning receipt', () => {
    const contentPlan = {
      topic: 'qcoin',
      messageAct: 'personal_status_request',
      resultKind: 'verified',
      surfaceKind: 'structured',
      factProjection: {
        verified: true,
        factHash: 'fact:qcoin:balance',
        receiptId: 'receipt:qcoin:direct',
        facts: { balance: 125.5, sourceData: {} },
      },
    }
    const ownership = resolveQl7SupportExactFactVisibilityOwner(contentPlan)
    expect(ownership).toMatchObject({
      mode: 'prose_immutable_fragment',
      structuredTableOwnerPresent: false,
      exactProseSuppressed: false,
      verifiedProjectionPresent: true,
    })

    const result = directMorphology(contentPlan)
    expect(result.text).toMatch(/Баланс:\s*125,5\s*QCoin/u)
    expect(result.immutableFactFragments).toEqual([
      expect.objectContaining({
        fragmentId: 'fact:qcoin:balance',
        sourceId: 'receipt:qcoin:direct',
      }),
    ])
    expect(result.realizationReceipt.exactFactOwnership).toMatchObject({
      mode: 'prose_immutable_fragment',
      exactProseSuppressed: false,
    })
  })

  it('keeps the structured table as the single exact owner when a verified receipt can render it', () => {
    const receipt = createQl7SupportAdapterReceipt({
      executed: true,
      verified: true,
      source: 'qcoin.read',
      scope: 'self',
      result: { balance: '1' },
      checkedAt: '2026-01-01T00:00:00.000Z',
      writeCount: 0,
    })
    const ownership = resolveQl7SupportExactFactVisibilityOwner({
      topic: 'qcoin',
      messageAct: 'personal_status_request',
      resultKind: 'verified',
      surfaceKind: 'structured',
      receipt: { ...receipt, resultKind: 'verified' },
      factProjection: { verified: true, facts: { balance: '1' } },
    })
    expect(ownership).toMatchObject({
      mode: 'structured_table',
      structuredTableOwnerPresent: true,
      exactProseSuppressed: true,
    })

    const runtime = executeQl7SupportTurnRuntime({
      mode: 'test',
      text: 'Покажи баланс QCoin',
      selectedLocale: 'ru',
      analysis: { topic: 'qcoin', messageAct: 'personal_status_request' },
      route: { topic: 'qcoin', messageAct: 'personal_status_request' },
      tone: { taxonomyCategory: 'neutral' },
      adapterReceipts: [receipt],
    })
    const tableBalance = runtime.replyPlan?.cardSpec?.tables?.[0]?.rows?.find((row) => row.key === 'balance')?.value
    expect(String(tableBalance)).toBe('1')
    expect(runtime.replyPlan?.text || '').not.toMatch(/Баланс:\s*1\s*QCoin/iu)
    expect(runtime.noveltyFallbackReceipt).toBeNull()
    expect(runtime.regenerationReceipt).toBeNull()
    expect(runtime.qualityGate?.surfaceRedundancy).toMatchObject({ ok: true, failures: [] })
  })

  it('pins the canonical morphosyntactic realizer contract', () => {
    expect(QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION).toBe('5.4.0')
  })
})
