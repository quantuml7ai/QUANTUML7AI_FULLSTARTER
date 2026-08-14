import { describe, expect, test } from 'vitest'
import { decideQl7SupportConversationTurn } from '../../../lib/ql7-support/conversationIntelligence.js'
import { extractQl7SupportMediaEvidence } from '../../../lib/ql7-support/mediaEvidence.js'
import { assessQl7SupportTone } from '../../../lib/ql7-support/toxicityEngine.js'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { buildQl7SupportPremiumResponsePlan } from '../../../lib/ql7-support/responsePlan.js'
import { localizeQl7SupportReply } from '../../../lib/ql7-support/languageOrchestrator.js'
import { buildQl7SupportCard, validateQl7SupportCard } from '../../../lib/ql7-support/cards.js'

describe('QL7 Support intelligence calibration V29', () => {
  test('closes a rejected topic and never echoes stale Exchange/Ads prompts', () => {
    const text = 'мне не нужна реклама. пошел ты нахуй'
    const previousContext = { previousTopic: 'quantum_exchange', topic: 'quantum_exchange', currentQuestionCode: 'exchange_anchor' }
    const tone = assessQl7SupportTone({ text, language: 'ru', translatedText: 'I do not need ads. fuck off' })
    const route = routeQl7SupportMessage({ text, locale: 'ru', previousContext, baseAnalysis: { topic: 'ads_campaigns' } })
    const decision = decideQl7SupportConversationTurn({ text, canonicalText: 'I do not need ads. fuck off', previousContext, route, analysis: { ...route, entities: {} }, tone })
    const reply = buildQl7SupportPremiumResponsePlan({ analysis: { ...route, conversationDecision: decision }, route, memory: previousContext, tone, conversationDecision: decision, locale: 'ru', seed: 'v29' })
    expect(decision).toMatchObject({ decision: 'boundary_and_close_topic', shouldClearQuestion: true, emailMaterial: false })
    expect(reply.text).not.toMatch(/Quantum Exchange|Ads campaigns|кампан.{0,20}ID/iu)
  })

  test('understands Hebrew insult and threat roles and produces a native boundary', () => {
    const text = 'אתה באמת טיפש?'
    const previousContext = { previousTopic: 'quantum_exchange', topic: 'quantum_exchange', currentQuestionCode: 'exchange_anchor' }
    const tone = assessQl7SupportTone({ text, language: 'he', translatedText: 'Are you really stupid?' })
    const route = routeQl7SupportMessage({ text, locale: 'he', previousContext, baseAnalysis: { topic: 'support_system' } })
    const decision = decideQl7SupportConversationTurn({ text, canonicalText: 'Are you really stupid?', previousContext, route, analysis: { ...route, entities: {} }, tone })
    const reply = buildQl7SupportPremiumResponsePlan({ analysis: { ...route, conversationDecision: decision }, route, memory: previousContext, tone, conversationDecision: decision, locale: 'he', seed: 'v29-he' })
    expect(tone).toMatchObject({ taxonomyCategory: 'insult_to_support', target: 'support' })
    expect(decision).toMatchObject({ decision: 'calm_boundary', shouldClearQuestion: true, emailMaterial: false })
    expect(reply.text).toMatch(/[\u0590-\u05ff]/u)
    expect(reply.text).not.toMatch(/Quantum Exchange|Ads campaigns/iu)
    expect(assessQl7SupportTone({ text: 'אני אהרוג אותך', language: 'he', translatedText: 'I will kill you' })).toMatchObject({ taxonomyCategory: 'threat', safetyEscalation: true })
  })

  test('rejects a decorated English echo when Hebrew localization was requested', async () => {
    const result = await localizeQl7SupportReply({ text: 'I can help.', targetLanguage: 'he', translate: async ({ text }) => ({ text: `[he] ${text}`, provider: 'bad-provider' }) })
    expect(result).toMatchObject({ translationStatus: 'provider_failed', translationWarning: 'provider_output_language_mismatch', text: 'I can help.' })
  })

  test('builds a signed moderation card with a privacy-enhanced YouTube player and no reporter identity', () => {
    const media = extractQl7SupportMediaEvidence({ text: 'video https://www.youtube.com/watch?v=QTjzyP2Afys' })
    const card = buildQl7SupportCard({ kind: 'moderation_snapshot', locale: 'ru', title: 'Жалоба', snapshot: { postId: '246', permalink: '/forum/p/246', reportType: 'boring', reasonLabel: 'Неинтересный материал', media } })
    expect(card.snapshot.media[0]).toMatchObject({ type: 'embed', provider: 'youtube' })
    expect(card.snapshot.media[0].embedUrl).toContain('youtube-nocookie.com/embed/')
    expect(card.snapshot).not.toHaveProperty('reporterId')
    expect(validateQl7SupportCard(card)).toMatchObject({ ok: true })
  })
})
