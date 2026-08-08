import { describe, expect, test } from 'vitest'

import {
  detectQl7SupportLanguage,
  prepareQl7SupportLanguageInput,
  redactQl7SupportTranslationInput,
} from '../../../lib/ql7-support/languageOrchestrator.js'
import {
  isQl7SupportSemanticRepeat,
  mergeQl7SupportMemory,
  normalizeQl7SupportMemory,
  registerQl7SupportReply,
  shouldOpenNewQl7SupportCase,
} from '../../../lib/ql7-support/dialogueMemory.js'
import { classifyQl7SupportMessageAct, routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { assessQl7SupportTone } from '../../../lib/ql7-support/toxicityEngine.js'
import { buildQl7SupportPremiumResponsePlan } from '../../../lib/ql7-support/responsePlan.js'
import { buildQl7SupportCard, validateQl7SupportCard } from '../../../lib/ql7-support/cards.js'
import {
  QL7_SUPPORT_DOMAIN_SCENARIO_ACTS_V4,
  QL7_SUPPORT_ECOSYSTEM_TOPICS,
  buildQl7SupportDomainPlan,
} from '../../../lib/ql7-support/ecosystemCatalog.js'
import { getQl7SupportSourceContract } from '../../../lib/ql7-support/sourceRegistry.js'

const LANGUAGE_SAMPLES = {
  en: 'Hello!',
  ru: 'Привет!',
  uk: 'Привіт!',
  es: '¡Hola!',
  tr: 'Merhaba',
  ar: 'مرحبا',
  zh: '你好',
  he: 'שלום',
}

describe('QL7 Support Planetary AI V5 pure engine', () => {
  test('detects seven native locales plus an unknown-language Deep Translate route', () => {
    for (const [locale, text] of Object.entries(LANGUAGE_SAMPLES)) {
      expect(detectQl7SupportLanguage(text), text).toBe(locale)
      expect(classifyQl7SupportMessageAct(text), text).toBe('greeting')
    }
    for (const text of ['שלום!', 'שלום,', 'مرحباً!', '您好！']) {
      expect(classifyQl7SupportMessageAct(text), text).toBe('greeting')
    }
  })

  test('redacts secrets before translation and trusts provider outcome rather than an heuristic flag', async () => {
    const token = 'ql7ws_abcdefghijklmnopqrstuvwxyz123456'
    expect(redactQl7SupportTranslationInput(`token=${token}`)).not.toContain(token)

    const translated = await prepareQl7SupportLanguageInput({
      text: 'שלום',
      translate: async ({ text }) => ({ text: `translated:${text}`, provider: 'fake-deep-translate' }),
    })
    expect(translated).toMatchObject({
      detectedLanguage: 'he',
      translationStatus: 'translated',
      translationProvider: 'fake-deep-translate',
    })

    const failed = await prepareQl7SupportLanguageInput({
      text: 'שלום',
      translate: async ({ text }) => ({ text, provider: 'fallback_original' }),
    })
    expect(failed.translationStatus).toBe('provider_failed')
  })

  test('keeps current message, corrections, provenance and bounded memory without old-message echo', () => {
    let memory = normalizeQl7SupportMemory({})
    for (let index = 0; index < 24; index += 1) {
      memory = mergeQl7SupportMemory({
        previousCase: { memory },
        currentMessage: { id: `message-${index}`, text: `invoice ${index}` },
        analysis: {
          topic: 'qcoin',
          messageAct: index === 4 ? 'correction' : 'problem_description',
          entities: { invoiceId: `invoice-${index}` },
          currentQuestionCode: `question-${index}`,
          confidence: 0.9,
        },
        now: `2026-07-24T00:00:${String(index).padStart(2, '0')}.000Z`,
      })
    }

    expect(memory.currentMessageId).toBe('message-23')
    expect(memory.relevantMessages).toHaveLength(20)
    expect(memory.questionsAsked).toHaveLength(3)
    expect(memory.claims.length).toBeGreaterThan(0)
    expect(memory.corrections.length).toBeGreaterThan(0)
    expect(memory.relevantMessages.at(-1).textPreview).toBe('invoice 23')
  })

  test('classifies explicit topic switches and short denials before answer-to-question fallback', () => {
    const previousContext = { currentQuestionCode: 'ads_campaign_id_question', previousTopic: 'ads_campaigns' }
    expect(classifyQl7SupportMessageAct('нет', previousContext)).toBe('denial')
    expect(classifyQl7SupportMessageAct('This is a separate issue: CryptoRadar does not load signals', previousContext))
      .toBe('new_unrelated_issue')
  })

  test('opens a new case for a closed case or an unrelated new topic', () => {
    expect(shouldOpenNewQl7SupportCase({
      previousCase: { _id: 'closed', caseStatus: 'closed', memory: { previousTopic: 'qcoin' } },
      analysis: { topic: 'ads_campaigns', messageAct: 'problem_description' },
    })).toBe(true)
    expect(shouldOpenNewQl7SupportCase({
      previousCase: { _id: 'open', caseStatus: 'open', memory: { previousTopic: 'qcoin' } },
      analysis: { topic: 'ads_campaigns', messageAct: 'problem_description' },
    })).toBe(true)
  })

  test('distinguishes frustration with a real request from a direct threat', () => {
    expect(assessQl7SupportTone({ text: 'сука, помоги починить, не работает', language: 'ru' })).toMatchObject({
      category: 'frustration_with_request',
      threat: false,
    })
    expect(assessQl7SupportTone({ text: 'я тебя убью', language: 'ru' }).threat).toBe(true)
  })

  test('builds context-sensitive responses and refuses a semantic duplicate', () => {
    const route = routeQl7SupportMessage({ text: 'Почему не пришли QCoin?', locale: 'ru' })
    const first = buildQl7SupportPremiumResponsePlan({ analysis: route, route, locale: 'ru', seed: 'stable' })
    const memory = registerQl7SupportReply({}, {
      text: first.text,
      responseCode: first.responseCode,
      messageId: 'reply-1',
    })
    expect(isQl7SupportSemanticRepeat(memory, first.text, first.responseCode)).toBe(true)
    expect(memory.replyHistory[0].textHash).toMatch(/^[a-f0-9]{64}$/)
    expect(memory.lastReplyTextHash).toBe(memory.replyHistory[0].textHash)

    const second = buildQl7SupportPremiumResponsePlan({
      analysis: route,
      route,
      memory,
      locale: 'ru',
      seed: 'stable',
      now: '2026-07-24T00:00:00.000Z',
    })
    expect(second.text).toBeTruthy()
    expect(second.semanticFingerprint).not.toBe(first.semanticFingerprint)
    const nextMemory = registerQl7SupportReply(memory, {
      text: second.text,
      responseCode: second.responseCode,
      messageId: 'reply-2',
    })
    expect(new Set(nextMemory.replyHistory.map((item) => item.textHash)).size).toBe(2)
  })

  test('signs server cards and rejects any client-side tampering', () => {
    const card = buildQl7SupportCard({
      kind: 'moderation_snapshot',
      locale: 'ru',
      title: 'Проверка публикации',
      snapshot: {
        postId: 'post-1',
        text: 'snapshot text',
        media: [{ type: 'video', url: '/evidence.mp4' }],
        capturedAt: '2026-07-24T00:00:00.000Z',
      },
    })
    expect(validateQl7SupportCard(card)).toMatchObject({ ok: true })
    expect(validateQl7SupportCard({ ...card, title: 'tampered' })).toEqual({ ok: false, error: 'card_integrity' })
  })

  test('exposes exactly 43 domains by 18 executable read-only scenarios', () => {
    expect(QL7_SUPPORT_ECOSYSTEM_TOPICS).toHaveLength(43)
    expect(QL7_SUPPORT_DOMAIN_SCENARIO_ACTS_V4).toHaveLength(18)
    expect(QL7_SUPPORT_ECOSYSTEM_TOPICS.length * QL7_SUPPORT_DOMAIN_SCENARIO_ACTS_V4.length).toBe(774)

    for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
      const plan = buildQl7SupportDomainPlan({ analysis: { topic }, locale: 'en' })
      expect(plan.scenarioMatrix).toHaveLength(18)
      expect(plan.readAdapter).toMatchObject({ readOnly: true, bounded: true })
      expect(getQl7SupportSourceContract(topic).readOnly).toBe(true)
    }
  })
})
