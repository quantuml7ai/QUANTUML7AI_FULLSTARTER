import { describe, it, expect } from 'vitest'
import { analyzeQl7SupportRequest } from '../../../lib/ql7-support/caseEngine.js'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { buildQl7SupportPremiumResponsePlan } from '../../../lib/ql7-support/responsePlan.js'
import { countQl7SupportGraphemesV11 } from '../../../lib/ql7-support/limitsV11.js'
import { getQl7SupportRouteNavigationHrefV11, getQl7SupportTopicActionV9 } from '../../../lib/ql7-support/topicActionRegistryV9.js'
import { buildQl7SupportRuntimeClaimV11, getQl7SupportRuntimeCapabilityV11 } from '../../../lib/ql7-support/runtimeCapabilityRegistryV11.js'

function run(text, locale, previousContext = {}) {
  const analysis = analyzeQl7SupportRequest({ text, locale, previousContext })
  const route = routeQl7SupportMessage({ text, locale, previousContext, baseAnalysis: analysis, tone: {} })
  const plan = buildQl7SupportPremiumResponsePlan({ analysis, route, memory: previousContext, tone: {}, locale, seed: `${locale}:${text}` })
  return { analysis, route, plan }
}

describe('QL7 Support V11 offline pipeline', () => {
  it.each([
    ['ru', 'где баланс qcoin'], ['uk', 'де мій qcoin'], ['en', 'open quantum wallet'],
    ['es', 'qué incluye vip'], ['tr', 'reklam paketim aktif mi'], ['ar', 'أين رصيد QCoin'], ['zh', '我的 QCoin 余额在哪里'], ['he', 'איפה יתרת QCoin שלי'],
  ])('produces a bounded reply for %s', (locale, text) => {
    const { plan } = run(text, locale)
    expect(plan.text.length).toBeGreaterThan(0)
    expect(countQl7SupportGraphemesV11(plan.text, locale)).toBeLessThanOrEqual(4000)
  })

  it('switches away from stale QCoin context when advertising is explicitly requested', () => {
    const previousContext = { topic: 'qcoin', previousTopic: 'qcoin', caseStatus: 'collecting_context', replyHistory: [{ text: 'QCoin details', responseCode: 'qcoin' }] }
    const { route } = run('Не про QCoin. Теперь покажи мои рекламные метрики.', 'ru', previousContext)
    expect(['ads_campaigns', 'ads_packages']).toContain(route.topic)
  })

  it('keeps actions aligned with the chosen ecosystem topic', () => {
    expect(getQl7SupportTopicActionV9('qcoin')).toMatchObject({ eventName: 'quantum-wallet:open' })
    expect(getQl7SupportTopicActionV9('metamarket')).toMatchObject({ eventName: 'metamarket:open' })
    expect(getQl7SupportTopicActionV9('metastudio')).toMatchObject({ href: '/game?ql7Action=metastudio#metastudio' })
    expect(getQl7SupportTopicActionV9('vip')).toMatchObject({ href: '/subscribe' })
    expect(getQl7SupportTopicActionV9('homepage')).toMatchObject({ href: '/' })
    expect(getQl7SupportTopicActionV9('battlecoin')).toMatchObject({ href: '/exchange', tab: 'battlecoin' })
    expect(getQl7SupportRouteNavigationHrefV11('battlecoin')).toBe('/exchange#ql7-exchange-battlecoin')
  })

  it.each(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'])('builds a no-invented-date runtime claim for %s', (locale) => {
    const claim = buildQl7SupportRuntimeClaimV11(getQl7SupportRuntimeCapabilityV11('exchange'), locale)
    expect(claim.status).toBe('development')
    expect(claim.inventedDate).toBe(false)
    expect(claim.publishedLaunchAt).toBe(null)
    expect(claim.text.length).toBeGreaterThan(20)
  })

  it('keeps V11.3 production routing aligned across moderation, partnership, family, roadmap and ads packages', () => {
    const cases = [
      ['en', 'How can I appeal a media publishing restriction?', 'moderation'],
      ['ru', 'Почему мой пост удалили после жалоб?', 'moderation'],
      ['uk', 'Які рекламні пакети доступні?', 'ads_packages'],
      ['zh', 'Explain the roadmap and future plans.', 'roadmap'],
      ['he', 'MyQ uantum Family followers and subscriptions seems to h', 'quantum_family'],
      ['ar', 'Provide source status, identifiers and diagnostic classification. Nice! My balance went on vacation, but seriously: push', 'push'],
      ['ru', 'Почему географическая лента сортируется неправильно?', 'geodetect'],
      ['tr', 'My privacy and personal-data handling seems to have gone missing.', 'privacy'],
      ['uk', 'My account deletion and data cleanup seems to have gone missing.', 'account_deletion'],
      ['ru', 'Не обещай, что предмет обязательно подорожает.', 'metamarket'],
    ]
    for (const [locale, text, expected] of cases) expect(run(text, locale).route.topic).toBe(expected)

    const partnership = run('Quiero hablar de una asociación comercial relacionada con Quantum Universe and metaverse.', 'es').route
    const candidates = new Set([partnership.topic, ...(partnership.hypotheses || []).map((item) => item.topic), ...(partnership.alternatives || [])])
    expect(partnership.topic).toBe('contact')
    expect(candidates.has('contact')).toBe(true)
    expect(candidates.has('metaverse')).toBe(true)
  })


})
