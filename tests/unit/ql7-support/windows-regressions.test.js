import { describe, expect, it } from 'vitest'
import { analyzeQl7SupportTurn } from '../../../lib/ql7-support/semantics/analyzeTurn.js'
import { extractQl7SupportContactSignals } from '../../../lib/ql7-support/contact/contactIntelligence.js'

describe('canonical canonical Windows regression closure', () => {
  it('preserves protected contact spans and explicit consent through semantic normalization', () => {
    const raw = 'yes, you may contact me at user@example.com about a partnership'
    const contact = extractQl7SupportContactSignals(raw)
    const analysis = analyzeQl7SupportTurn({ locale: 'en', text: raw }).analysis
    expect(contact).toMatchObject({ offered: true, consent: true, preferred: 'email', email: 'user@example.com' })
    expect(analysis).toMatchObject({ topic: 'partnership', contactOffered: true, contactConsent: true, contactPreferred: 'email' })
    expect(analysis.contactSignals.email).toBe('user@example.com')
  })

  it('keeps topic recall as a meta command while retaining prior topic only as recalled content', () => {
    const analysis = analyzeQl7SupportTurn({ locale: 'ru', text: 'о чём мы говорили?', previousContext: { activeTopic: 'qcoin', topicBranches: [{ topic: 'forum' }] } }).analysis
    expect(analysis).toMatchObject({ messageAct: 'topic_recall', topic: 'support_system', requiresAdapter: false })
    expect(analysis.topicDecisionReceipt.transitionClass).toBe('topic_recall')
  })

  it.each([
    ['en', 'Show my ELITE advertising package status'],
    ['ru', 'Покажи статус рекламного пакета ELITE'],
    ['uk', 'Покажи стан рекламного пакета ELITE'],
  ])('keeps %s package status out of ads_campaigns', (locale, text) => {
    const analysis = analyzeQl7SupportTurn({ locale, text }).analysis
    expect(analysis.topic).toBe('ads_packages')
    expect(analysis.topicCandidates[0]?.topic).toBe('ads_packages')
    expect(analysis.adapterEligibility.ads_packages).toBe(true)
  })

  it('lets current-turn investment evidence outrank a non-route-eligible partnership alias', () => {
    const analysis = analyzeQl7SupportTurn({ locale: 'en', text: 'I want to cooperate with Quantum L7 AI, maybe partnership or investment, please guide me' }).analysis
    expect(analysis.messageAct).toBe('business_proposal')
    expect(analysis.topic).toBe('investment')
    expect(analysis.topic).not.toBe('exchange_ai')
  })

  it('publishes DecisionMath confidence with calibration state instead of fixed heuristic probability', () => {
    const analysis = analyzeQl7SupportTurn({ locale: 'en', text: 'what is a neutron' }).analysis
    expect(analysis.confidence).toBe(analysis.decisionMathReceipt.semanticConfidence)
    expect(analysis.confidenceKind).toBe('decision_math_semantic_confidence')
    expect(analysis.calibrationStatus).toBe(analysis.decisionMathReceipt.calibrationStatus)
  })
})
