import { describe, expect, it } from 'vitest'
import { executeQl7SupportScenario } from '../../lib/ql7-support/simulation/executeScenario.js'
import { executeQl7SupportProductionTurn, finalizeQl7SupportProductionDelivery } from '../../lib/ql7-support/runtime/productionTurn.js'
import { runQl7SupportProductionParityCase } from '../../lib/ql7-support/simulation/productionParityHarness.js'

describe('QL7 Support V14 production-shaped integration', () => {
  it('runs semantic routing, surface generation and independent oracle through the shared production adapter', () => {
    const row = executeQl7SupportScenario({
      id: 'integration:qcoin-theft',
      locale: 'ru',
      input: 'украли деньги с баланса qcoin',
      userId: 'integration-user',
      seed: 'integration-v14',
      expected: { topic: 'qcoin', messageAct: 'incident_report', noAds: true },
    })
    expect(row.oracle.ok).toBe(true)
    expect(row.result.analysis.topic).toBe('qcoin')
    expect(row.result.surface.tables.some((table) => /ads/iu.test(table.schema))).toBe(false)
    expect(row.evidence.surface.primarySvg.assetId).toBeTruthy()
    expect(row.productionTurn.delivery.topic).toBe('qcoin')
    expect(row.productionTurn.delivery.textHash).toBeTruthy()
    expect(row.productionTurn.delivery.surfaceHash).toBeTruthy()
  })

  it('keeps explicit CryptoRadar product evidence above generic market-signal wording', () => {
    const turn = executeQl7SupportProductionTurn({
      mode: 'test',
      requestId: 'integration:cryptoradar',
      selectedLocale: 'ru',
      originalText: 'Что такое CryptoRadar и как он помогает найти сигнал?',
      analysis: { topic: 'exchange_ai', messageAct: 'ai_recommendation_request' },
      route: { topic: 'exchange_ai', messageAct: 'ai_recommendation_request' },
      now: '2026-08-03T00:00:00.000Z',
      seed: 'integration:cryptoradar',
    })
    expect(turn.delivery.topic).toBe('homepage')
    expect(turn.delivery.messageAct).toBe('how_to_question')
    expect(turn.delivery.text).toContain('CryptoRadar')
  })

  it('uses trusted pending production context for a bare denial without trusting normal stale routes', () => {
    const turn = executeQl7SupportProductionTurn({
      mode: 'test',
      requestId: 'integration:no-new-fact',
      selectedLocale: 'ru',
      originalText: 'нет',
      priorLedger: {
        activeTopic: 'ads_campaigns',
        activeGoal: 'ads_campaigns_anchor_1',
        waitingFor: 'ads_campaigns_anchor_1',
        openMaterialQuestion: true,
      },
      productionQuestionCode: 'ads_campaigns_anchor_1',
      contextualFollowup: true,
      conversationDecision: { decision: 'continue_case' },
      analysis: {
        topic: 'ads_campaigns',
        messageAct: 'denial',
        role: 'denial',
        currentQuestionCode: 'ads_campaigns_anchor_1',
        entities: {},
      },
      route: {
        topic: 'ads_campaigns',
        messageAct: 'denial',
        currentQuestionCode: 'ads_campaigns_anchor_1',
      },
      now: '2026-08-03T00:00:00.000Z',
      seed: 'integration:no-new-fact',
    })
    expect(turn.runtimeInput.baseAnalysisTrust).toBe(true)
    expect(turn.delivery.topic).toBe('ads_campaigns')
    expect(turn.delivery.messageAct).toBe('denial')
    expect(turn.delivery.responseCode).toBe('no_new_fact:ads_campaigns')
  })


  it('projects the exact final user-visible product delivery through the same laboratory finalizer', () => {
    const row = executeQl7SupportScenario({
      id: 'integration:final-delivery-parity',
      locale: 'en',
      input: 'Show my open support cases',
      seed: 'integration:final-delivery-parity',
      productionDeliveryOverrides: {
        replyPlan: {
          responseCode: 'open_cases:selection',
          text: 'Select the open request whose status you want me to check.',
        },
        surface: {
          schema: 'ql7.support.surface',
          locale: 'en',
          actions: [{ routeId: 'support_system', actionType: 'route' }],
          integrity: { signature: 'integration-final-surface' },
        },
        composerPolicy: { allowed: true },
        locale: 'en',
        topic: 'support_system',
        messageAct: 'status_followup',
      },
      expected: { topic: 'support_system' },
    })
    const directFinal = finalizeQl7SupportProductionDelivery({
      productionTurn: row.productionTurn,
      ...row.scenario.productionDeliveryOverrides,
    })
    expect(row.oracle.productionDeliveryParity.ok).toBe(true)
    expect(row.productionDelivery).toEqual(directFinal)
    expect(row.evidence.text).toBe(directFinal.text)
    expect(row.evidence.surface.integrity.signature).toBe(directFinal.surfaceHash)
    expect(row.evidence.actions.map((action) => action.routeId)).toEqual(directFinal.actionIds)
  })

  it('matches exact production and direct delivery projections', () => {
    const row = runQl7SupportProductionParityCase({
      mode: 'test',
      requestId: 'integration:parity',
      selectedLocale: 'de',
      originalText: 'Wie benutze ich QCoin?',
      analysis: { topic: 'support_system' },
      route: { topic: 'support_system' },
      now: '2026-08-03T00:00:00.000Z',
      seed: 'integration:parity',
    })
    expect(row.ok).toBe(true)
    expect(row.runtimeInputParity).toBe(true)
    expect(row.deliveryParity).toBe(true)
    expect(row.production).toEqual(row.direct)
  })
})
