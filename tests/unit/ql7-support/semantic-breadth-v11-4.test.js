import { describe, expect, test } from 'vitest'
import { analyzeQl7SupportRequest } from '../../../lib/ql7-support/caseEngine.js'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { assessQl7SupportTone } from '../../../lib/ql7-support/toxicityEngine.js'
import { assessQl7SupportEmotionV11, applyQl7SupportEmotionalPresentationV11 } from '../../../lib/ql7-support/emotionalPresentationV11.js'
import { QL7_SUPPORT_BREADTH_SEMANTIC_CASES_V11 } from '../../../lib/ql7-support/conversationBreadthCorpusV11.js'
import { buildQl7SupportCardV3, validateQl7SupportCardAny } from '../../../lib/ql7-support/cardSchemaV3.js'

function routeCase(locale, text) {
  const previousContext = {}
  const tone = assessQl7SupportTone({ text, language: locale })
  const baseAnalysis = analyzeQl7SupportRequest({ text, locale, previousContext })
  return routeQl7SupportMessage({ text, locale, previousContext, baseAnalysis, tone })
}

describe('QL7 Support V11.4 semantic breadth and emotional presentation', () => {
  test('keeps package status, campaign metrics, purchase value, balances and moderation privacy distinct', () => {
    for (const [locale, text, topic, subIntent] of QL7_SUPPORT_BREADTH_SEMANTIC_CASES_V11) {
      const route = routeCase(locale, text)
      expect([route.topic, route.subIntent], `${locale}: ${text}`).toEqual([topic, subIntent])
      expect(route.shouldClarify, `${locale}: ${text}`).not.toBe(true)
    }
  })

  test('honors explicit rejection of metrics instead of forcing campaign analytics', () => {
    const rows = [
      ['ru', 'Без аналитики: мой рекламный тариф ещё действует?'],
      ['uk', 'Не метрики, перевір чи діє мій пакет реклами.'],
      ['en', 'No analytics: is my advertising plan still active?'],
      ['es', 'Sin métricas: ¿mi paquete de publicidad sigue activo?'],
      ['tr', 'Metrik değil; reklam paketim hâlâ aktif mi?'],
      ['ar', 'لا أريد المقاييس، هل حزمتي الإعلانية ما زالت نشطة؟'],
      ['zh', '不要广告数据，只看我的套餐是否有效。'],
      ['he', 'בלי מדדים: חבילת הפרסום שלי עדיין פעילה?'],
    ]
    for (const [locale, text] of rows) expect(routeCase(locale, text)).toMatchObject({ topic: 'ads_packages', subIntent: 'ads_packages_self_status' })
  })

  test('serializes a bounded emotion signal into a signed V3 card', () => {
    const emotional = applyQl7SupportEmotionalPresentationV11({
      cardSpec: { purpose: 'complaint', title: 'Проверка', summary: 'Разберём проблему.' },
      text: 'Я в ярости, опять всё сломалось.',
      tone: {},
      messageAct: 'complaint',
    })
    expect(emotional).toMatchObject({ visualTheme: 'emotion-volcanic', emotion: { emotion: 'angry', pulse: 'sharp' } })
    const card = buildQl7SupportCardV3(emotional)
    expect(validateQl7SupportCardAny(card)).toMatchObject({ ok: true })
    expect(card.emotion).toMatchObject({ emotion: 'angry', pulse: 'sharp' })
  })

  test('recognizes adult emotional signals without converting them into unsafe policy claims', () => {
    expect(assessQl7SupportEmotionV11({ text: 'Пошути немного, но по делу.' }).emotion).toBe('humorous')
    expect(assessQl7SupportEmotionV11({ text: 'Дай строгую аналитику, метрики и доказательства.' }).emotion).toBe('analytical')
    expect(assessQl7SupportEmotionV11({ text: 'Мне тревожно, срочно проверь безопасность.' }).emotion).toBe('anxious')
    expect(assessQl7SupportEmotionV11({ text: 'Ура, это просто супер!' }).emotion).toBe('joyful')
  })
})
