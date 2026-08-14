import { describe, expect, test } from 'vitest'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { buildQl7SupportPremiumResponsePlan } from '../../../lib/ql7-support/responsePlan.js'
import { auditQl7SupportKnowledgeRegistry } from '../../../lib/ql7-support/knowledgeRegistry.js'
import { assertQl7SupportAdultUserText, QL7_SUPPORT_CORE_LOCALES_V6 } from '../../../lib/ql7-support/adultLanguagePolicy.js'
import { buildQl7SupportCard, validateQl7SupportCard } from '../../../lib/ql7-support/cards.js'

function reply(text, locale = 'ru', memory = {}) {
  const route = routeQl7SupportMessage({ text, locale, previousContext: memory })
  return { route, plan: buildQl7SupportPremiumResponsePlan({ analysis: { ...route, role: route.messageAct }, route, memory, locale, seed: text }) }
}

describe('QL7 Support adult intelligence V6', () => {
  test('supports all eight required locales and 43 knowledge domains', () => {
    expect(QL7_SUPPORT_CORE_LOCALES_V6).toEqual(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'])
    expect(auditQl7SupportKnowledgeRegistry()).toMatchObject({ ok: true, topics: 43, missing: [] })
  })

  test('greets naturally without internal implementation declarations', () => {
    const result = reply('Привет')
    expect(result.route.messageAct).toBe('greeting')
    expect(result.plan.text).toMatch(/здрав|привет|добр(?:ый|ая|ое|ого)\s+(?:день|вечер|утро)/iu)
    expect(result.plan.text).not.toMatch(/read-only|коллекц|adapter|разрешенн|я взял линию/iu)
  })

  test('answers the exchange analytics question with a real UI path', () => {
    const result = reply('Как работать с аналитикой на бирже?')
    expect(result.route).toMatchObject({ topic: 'exchange', messageAct: 'how_to_question' })
    expect(result.plan.text).toMatch(/график/iu)
    expect(result.plan.text).toMatch(/объ[её]м/iu)
    expect(result.plan.text).toMatch(/стакан/iu)
  })


  test('preserves legacy intent contracts for self-status, incidents and CryptoRadar precedence', () => {
    const vipStatus = routeQl7SupportMessage({
      text: 'Проверь мой VIP статус',
      locale: 'ru',
      baseAnalysis: { topic: 'vip', role: 'status_request', subIntent: 'vip_self_status', entities: { selfReference: true } },
    })
    expect(vipStatus).toMatchObject({ topic: 'vip', messageAct: 'personal_status_request', shouldClarify: false })

    const vipIncident = routeQl7SupportMessage({
      text: 'VIP x2 premium badge did not activate',
      locale: 'en',
      baseAnalysis: { topic: 'vip', role: 'problem_description', subIntent: 'vip_general', entities: {} },
    })
    expect(vipIncident).toMatchObject({ topic: 'vip', messageAct: 'incident_report', shouldClarify: false })

    const coreLocaleVipIncidents = [
      ['ru', 'VIP не активировался'],
      ['uk', 'VIP не активувався'],
      ['en', 'VIP did not activate'],
      ['es', 'VIP no se activó'],
      ['tr', 'VIP etkinleşmedi'],
      ['ar', 'VIP لم يتم التفعيل'],
      ['zh', 'VIP 未激活'],
      ['he', 'VIP לא הופעל'],
    ]
    for (const [locale, text] of coreLocaleVipIncidents) {
      const routed = routeQl7SupportMessage({
        text,
        locale,
        baseAnalysis: { topic: 'vip', role: 'problem_description', subIntent: 'vip_general', entities: {} },
      })
      expect(routed).toMatchObject({ topic: 'vip', messageAct: 'incident_report', shouldClarify: false })
    }

    const vipActivationHowTo = routeQl7SupportMessage({
      text: 'How do I activate VIP x2 premium badge?',
      locale: 'en',
      baseAnalysis: { topic: 'vip', role: 'how_to_question', subIntent: 'vip_general', entities: {} },
    })
    expect(vipActivationHowTo).toMatchObject({ topic: 'vip', messageAct: 'how_to_question', shouldClarify: false })

    const cryptoRadar = routeQl7SupportMessage({
      text: 'How to use CryptoRadar stock market analytics correctly?',
      locale: 'en',
      baseAnalysis: { topic: 'crypto_radar', role: 'how_to_question', subIntent: 'crypto_radar_general', entities: {} },
    })
    expect(cryptoRadar).toMatchObject({ topic: 'homepage', messageAct: 'how_to_question' })
  })

  test('separates profanity with a real request from profanity without a request', () => {
    expect(reply('Ты дебил, у меня биржа не работает').route.messageAct).toBe('profanity_with_request')
    expect(reply('Ты дебил').route.messageAct).toBe('profanity_without_request')
    expect(reply('Ты дебил, у меня биржа не работает').plan.text).toMatch(/уваж|помог|разбер/iu)
  })

  test('creates a four-option clarification card and rejects tampering', () => {
    const result = reply('У меня проблема')
    expect(result.plan.cardSpec).toMatchObject({ kind: 'clarification_choices' })
    expect(result.plan.cardSpec.options.length).toBeGreaterThanOrEqual(3)
    expect(result.plan.cardSpec.options.length).toBeLessThanOrEqual(4)
    expect(result.plan.cardSpec.other.label).toBeTruthy()
    const card = buildQl7SupportCard(result.plan.cardSpec)
    expect(card).toMatchObject({
      version: 4,
      schema: 'ql7.support.card.v4',
      integrity: { algorithm: 'sha256' },
    })
    expect(validateQl7SupportCard(card)).toMatchObject({ ok: true })
    expect(validateQl7SupportCard({ ...card, summary: 'tampered' })).toEqual({ ok: false, error: 'card_integrity' })
  })

  test('treats false safety flags as empty facts for denial rotation', () => {
    const memory = {
      currentQuestionCode: 'ads_campaigns_anchor_1',
      questionsAsked: ['ads_campaigns_anchor_1'],
      replyHistory: [],
    }
    const route = { topic: 'ads_campaigns', messageAct: 'denial', domainPlan: null }
    const plan = buildQl7SupportPremiumResponsePlan({
      analysis: {
        ...route,
        role: 'denial',
        currentQuestionCode: 'ads_campaigns_anchor_1',
        entities: { hasSecret: false, selfReference: false },
      },
      route,
      memory,
      locale: 'ru',
      seed: 'denial-false-flags',
    })
    expect(plan.responseCode).toBe('no_new_fact:ads_campaigns')
  })

  test('enforces adult user-text policy', () => {
    expect(assertQl7SupportAdultUserText('Проверка завершена. По найденным данным всё корректно.')).toBe(true)
    expect(() => assertQl7SupportAdultUserText('I queried adapterId and allowed collections in read-only mode.')).toThrow('ql7_support_user_text_policy')
  })
})
