import { describe, expect, test } from 'vitest'
import { getQl7SupportLexiconCoverage, getQl7SupportLexiconPhrase } from '../../../lib/ql7-support/conversationLexiconV7.js'
import { buildQl7SupportConversationState, classifyQl7SupportAbandonment, stabilizeQl7SupportConversationRoute } from '../../../lib/ql7-support/conversationStateV7.js'
import { buildQl7SupportInputPolicy, evaluateQl7SupportInputAttempt } from '../../../lib/ql7-support/inputPolicy.js'
import { buildQl7SupportDiagnosticFailureResult } from '../../../lib/ql7-support/diagnosticFailure.js'
import { calculateQl7EcosystemRating } from '../../../lib/ql7-support/ecosystemRating.js'
import { buildQl7SupportEventContract, QL7_SUPPORT_EVENT_TYPES_V7 } from '../../../lib/ql7-support/eventNotificationCatalog.js'
import { describeQl7SupportReportProgress } from '../../../lib/ql7-support/reportPolicyRegistry.js'
import { auditQl7SupportScenarioContractsV7, QL7_SUPPORT_CORE_LOCALES_V7 } from '../../../lib/ql7-support/scenarioContractsV7.js'

describe('QL7 Support 777 final intelligence V7', () => {
  test('defines the canonical 43 x 24 x 8 scenario contract', () => {
    expect(auditQl7SupportScenarioContractsV7()).toMatchObject({ ok: true, domains: 43, acts: 24, locales: 8, canonicalScenarios: 8256 })
  })

  test('provides premium greeting diversity for all core locales', () => {
    const coverage = getQl7SupportLexiconCoverage()
    expect(QL7_SUPPORT_CORE_LOCALES_V7).toHaveLength(8)
    for (const locale of QL7_SUPPORT_CORE_LOCALES_V7) {
      expect(coverage[locale].greeting).toBeGreaterThanOrEqual(5)
      const variants = new Set(Array.from({ length: 20 }, (_, index) => getQl7SupportLexiconPhrase({ locale, category: 'greeting', seed: `test:${index}` })))
      expect(variants.size).toBeGreaterThanOrEqual(4)
    }
  })

  test('retains active context for a short follow-up instead of reopening the domain catalogue', () => {
    const result = stabilizeQl7SupportConversationRoute({
      text: 'Проверь статус',
      route: { topic: 'platform', messageAct: 'ambiguous_request', confidence: 0.41 },
      previousCase: { activeSubject: 'vip', activeDomain: 'vip' },
    })
    expect(result).toMatchObject({ topic: 'vip', messageAct: 'status_followup', contextRetained: true, reasonCode: 'active_subject_retained' })
  })

  test('persists abandonment only for the active case', () => {
    const abandonment = classifyQl7SupportAbandonment('Уже неважно, можно закрыть')
    expect(abandonment).toMatchObject({ matched: true, closeCase: true })
    const state = buildQl7SupportConversationState({ previousCase: { topic: 'ads_campaigns', turnCount: 3 }, analysis: { topic: 'ads_campaigns', messageAct: 'abandonment', abandonment } })
    expect(state).toMatchObject({ activeSubject: 'ads_campaigns', abandonmentReason: abandonment.reasonCategory })
  })

  test('uses a bounded server input policy and unlocks on clarification', () => {
    const now = () => Date.parse('2026-07-26T10:00:00.000Z')
    const locked = buildQl7SupportInputPolicy({ state: 'diagnosing', locale: 'ru', duplicateCount: 3, recentMessageCount: 7, now })
    expect(locked.canSend).toBe(false)
    expect(locked.cooldownMs).toBeGreaterThan(0)
    expect(locked.cooldownMs).toBeLessThanOrEqual(45000)
    expect(buildQl7SupportInputPolicy({ state: 'clarifying', locale: 'ru', now }).canSend).toBe(true)
    expect(evaluateQl7SupportInputAttempt({ policy: locked, text: 'Срочно помогите, угрожают жизни', locale: 'ru', now })).toMatchObject({ allowed: true, reason: 'emergency_override' })
  })

  test('returns a typed safe result for diagnostic infrastructure failures', () => {
    const result = buildQl7SupportDiagnosticFailureResult({ error: Object.assign(new Error('mongo stack secret'), { name: 'AbortError' }), topic: 'vip', caseId: 'case-v7' })
    expect(result).toMatchObject({ branch: 'timeout', readOnly: true, businessCollectionsWritten: [] })
    expect(JSON.stringify(result)).not.toMatch(/stack secret/iu)
  })

  test('produces an explainable non-punitive ecosystem rating', () => {
    const result = calculateQl7EcosystemRating({ profile: { createdAt: '2025-01-01', nickname: 'User' }, activity: { successfulOperations: 10, ecosystemParticipation: 5 }, violations: { confirmed: 1 }, support: { resolvedCases: 3 }, now: () => Date.parse('2026-07-26T00:00:00Z') })
    expect(result.value).toBeGreaterThanOrEqual(0)
    expect(result.value).toBeLessThanOrEqual(100)
    expect(result.punitiveAction).toBe(false)
    expect(result.positiveContributors).toBeInstanceOf(Array)
    expect(result.calculationVersion).toBeTruthy()
  })

  test('covers ecosystem events and moderation thresholds', () => {
    expect(QL7_SUPPORT_EVENT_TYPES_V7.length).toBeGreaterThanOrEqual(26)
    const event = buildQl7SupportEventContract({ type: 'vip_expiration_warning', userId: 'user-1', subjectId: 'vip-1', locale: 'uk', payload: { daysRemaining: 3 } })
    expect(event).toMatchObject({ signedCardRequired: true, readOnly: true, realBusinessWrite: false })
    expect(event.dedupeKey).toContain('vip_expiration_warning')
    expect(describeQl7SupportReportProgress({ reportType: 'uninterested', currentReports: 12 })).toMatchObject({ currentReports: 12, nextThreshold: 20, remainingReports: 8, possibleRestriction: 'none' })
  })
})
