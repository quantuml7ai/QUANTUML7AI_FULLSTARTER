import { describe, expect, test } from 'vitest'
import { auditQl7SupportCompositionalGrammar, realizeQl7SupportCompositionalSurface } from '../../../lib/ql7-support/language/compositionalGrammar.js'
import { buildQl7SupportConversationState, classifyQl7SupportAbandonment, stabilizeQl7SupportConversationRoute } from '../../../lib/ql7-support/conversationState.js'
import { buildQl7SupportInputPolicy, evaluateQl7SupportInputAttempt } from '../../../lib/ql7-support/inputPolicy.js'
import { buildQl7SupportDiagnosticFailureResult } from '../../../lib/ql7-support/diagnosticFailure.js'
import { calculateQl7EcosystemRating } from '../../../lib/ql7-support/ecosystemRating.js'
import {
  buildQl7SupportEventContract,
  buildQl7SupportEventSourceProposition,
  QL7_SUPPORT_EVENT_TYPES,
  validateQl7SupportEventEnvelope,
  validateQl7SupportEventSourceProposition,
} from '../../../lib/ql7-support/eventNotificationCatalog.js'
import { getQl7SupportEventLocaleCoverage, projectQl7SupportEventSemantics } from '../../../lib/ql7-support/response/eventSemanticProjection.js'
import { describeQl7SupportReportProgress } from '../../../lib/ql7-support/reportPolicyRegistry.js'
import { auditQl7SupportScenarioContracts, QL7_SUPPORT_CORE_LOCALES } from '../../../lib/ql7-support/scenarioContracts.js'

describe('QL7 Support canonical final intelligence', () => {
  test('defines the canonical 43 x 24 x 8 scenario contract', () => {
    expect(auditQl7SupportScenarioContracts()).toMatchObject({ ok: true, domains: 43, acts: 24, locales: 8, canonicalScenarios: 8256 })
  })

  test('uses the canonical compositional grammar directly for every native locale', () => {
    expect(auditQl7SupportCompositionalGrammar()).toMatchObject({ ok: true })
    expect(QL7_SUPPORT_CORE_LOCALES).toHaveLength(8)
    for (const locale of QL7_SUPPORT_CORE_LOCALES) {
      const realized = realizeQl7SupportCompositionalSurface(locale, 'greeting', {}, `test:${locale}`)
      expect(realized.text.length, locale).toBeGreaterThan(1)
      expect(realized.receipt.ownerId).toBe('ql7-support.compositional-grammar')
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
    const result = buildQl7SupportDiagnosticFailureResult({ error: Object.assign(new Error('mongo stack secret'), { name: 'AbortError' }), topic: 'vip', caseId: 'case-canonical' })
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
    expect(QL7_SUPPORT_EVENT_TYPES.length).toBeGreaterThanOrEqual(26)
    const event = buildQl7SupportEventContract({ type: 'vip_expiring_3d', userId: 'user-1', subjectId: 'vip-1', locale: 'uk', payload: { daysRemaining: 3 } })
    expect(event).toMatchObject({ signedCardRequired: true, readOnly: true, realBusinessWrite: false })
    expect(event.dedupeKey).toContain('vip_expiring_3d')
    expect(validateQl7SupportEventEnvelope(event, { userId: 'user-1' })).toMatchObject({ ok: true, failures: [] })
    expect(validateQl7SupportEventEnvelope({ ...event, recipientIdHash: 'forged' }, { userId: 'user-1' }).ok).toBe(false)
    const changed = buildQl7SupportEventContract({ type: 'vip_expiring_3d', userId: 'user-1', subjectId: 'vip-1', locale: 'uk', payload: { daysRemaining: 2 } })
    expect(changed.eventId).toBe(event.eventId)
    expect(changed.envelopeHash).not.toBe(event.envelopeHash)
    const coverage = getQl7SupportEventLocaleCoverage()
    expect(coverage).toMatchObject({ localeCount: 32, readyToSendRows: 0, finalSentenceRows: 0, semanticOnly: true, complete: true })
    for (const locale of coverage.locales) {
      const idle = buildQl7SupportEventContract({ type: 'idle_nudge', userId: 'user-1', subjectId: `case-1:reply-1`, locale, timestamp: '2026-08-10T12:07:00.000Z' })
      expect(projectQl7SupportEventSemantics({ envelope: idle, locale })).toMatchObject({
        locale, type: 'idle_nudge', speechAct: 'event_notification', text: '', readyToSend: false, finalText: false, semanticProjection: true,
      })
    }
    const sourceText = 'Ecosystem maintenance starts at 22:00 UTC.'
    const announcement = buildQl7SupportEventSourceProposition({ eventType: 'broadcast', sourceText, sourceLocale: 'en' })
    expect(validateQl7SupportEventSourceProposition(announcement, { eventType: 'broadcast' })).toMatchObject({ ok: true, failures: [] })
    const broadcast = buildQl7SupportEventContract({
      type: 'broadcast',
      userId: 'user-1',
      subjectId: 'broadcast-1',
      locale: 'en',
      payload: { broadcastId: 'broadcast-1', announcement },
    })
    const broadcastProjection = projectQl7SupportEventSemantics({ envelope: broadcast, locale: 'en' })
    expect(broadcastProjection).toMatchObject({ type: 'broadcast', eventClass: 'broadcast', text: '', readyToSend: false, finalText: false })
    expect(broadcastProjection.externalSourceProposition.sourceText).toBe(sourceText)
    expect(broadcastProjection.externalSourceProposition.readyToSend).toBe(false)
    expect(() => buildQl7SupportEventContract({
      type: 'broadcast',
      userId: 'user-1',
      subjectId: 'broadcast-invalid-ready-prose',
      locale: 'en',
      payload: { message: sourceText },
    })).toThrow('event_ready_to_send_prose_forbidden')
    expect(validateQl7SupportEventSourceProposition({ ...announcement, sourceText: 'tampered' }, { eventType: 'broadcast' }).ok).toBe(false)
    expect(describeQl7SupportReportProgress({ reportType: 'uninterested', currentReports: 12 })).toMatchObject({ currentReports: 12, nextThreshold: 20, remainingReports: 8, possibleRestriction: 'none' })
  })
})
