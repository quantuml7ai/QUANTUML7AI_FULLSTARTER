import { describe, expect, it } from 'vitest'

import {
  QL7_SUPPORT_RESPONSE_BRANCHES,
  auditQl7SupportResponseBranchRegistry,
  resolveQl7SupportResponseBranch,
} from '../../../lib/ql7-support/response/responseBranchRegistry.js'
import { buildQl7SupportDiscoursePlan } from '../../../lib/ql7-support/response/discoursePlanner.js'

describe('QL7 Support canonical response branch registry', () => {
  it('registers complete semantic branches with a 10k empirical floor', () => {
    const audit = auditQl7SupportResponseBranchRegistry()
    expect(audit.ok).toBe(true)
    expect(audit.branchCount).toBeGreaterThanOrEqual(35)
    expect(audit.capacityFloor).toBe(10_000)
    expect(Object.values(QL7_SUPPORT_RESPONSE_BRANCHES).every((branch) => branch.capacityFloor === 10_000)).toBe(true)
  })

  it('keeps noisy input away from sensitive fact branches', () => {
    const resolved = resolveQl7SupportResponseBranch({
      topic: 'qcoin',
      messageAct: 'spam_or_noise',
      resultKind: 'none',
    })
    expect(resolved.definition.id).toBe('clarification.noise-recovery')
    expect(resolved.definition.forbiddenOperations).toContain('automatic-balance')
  })

  it('selects an entitlement limit before any AI calculation branch', () => {
    const resolved = resolveQl7SupportResponseBranch({
      topic: 'exchange_ai',
      messageAct: 'ai_recommendation_request',
      resultKind: 'verified',
      receipt: { result: { canAnalyze: false, quotaState: 'exhausted' } },
    })
    expect(resolved.definition.id).toBe('fact.ai-quota-exhausted')
    expect(resolved.definition.forbiddenOperations).toContain('run-calculation')
  })

  it('builds a text-free discourse plan with immutable actor facts', () => {
    const plan = buildQl7SupportDiscoursePlan({
      locale: 'ru',
      seed: 'branch:test',
      semanticPlan: { userSpecificAnchor: { inputMeaningHash: 'abc', topicFrameId: 'topic:1' } },
      scopeReceipt: { primaryDomainId: 'qcoin', primaryMicrotopicId: 'qcoin.self_status', selectedIntentId: 'self_status' },
      contentPlan: {
        topic: 'qcoin',
        messageAct: 'personal_status_request',
        resultKind: 'verified',
        factProjection: {
          verified: true,
          receiptId: 'receipt:qcoin:1',
          checkedAt: '2026-08-15T00:00:00.000Z',
          facts: { balance: 125, status: 'active' },
        },
      },
    })
    expect(plan.branchId).toBe('fact.verified')
    expect(plan.semanticUnits.find((item) => item.type === 'balance')).toMatchObject({ value: 125, immutable: true, privacyClass: 'actor-scoped' })
    expect(JSON.stringify(plan)).not.toContain('Ваш баланс')
  })
})

