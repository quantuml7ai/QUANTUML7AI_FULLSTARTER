import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { analyzeQl7SupportRequest } from '../../../lib/ql7-support/caseEngine.js'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { assessQl7SupportTone } from '../../../lib/ql7-support/toxicityEngine.js'
import { buildQl7SupportPremiumResponsePlan } from '../../../lib/ql7-support/responsePlan.js'
import { QL7_SUPPORT_TOPIC_LABELS_V11 } from '../../../lib/ql7-support/simulationOntologyV11.js'
import {
  QL7_SUPPORT_HUMAN_MATERIAL_CASES_V11,
  QL7_SUPPORT_HUMAN_SOCIAL_CASES_V11,
} from '../../../lib/ql7-support/humanConversationCorpusV11.js'
import {
  createQl7SupportIdleNudgeMessageV11,
  createQl7SupportInstantGreetingMessageV11,
  isQl7SupportEphemeralEntryMessageV11,
  listQl7SupportEntryGreetingsV11,
} from '../../../lib/ql7-support/entryGreetingLexiconV11.js'

function run(locale, text, previousContext = {}, memory = {}) {
  const tone = assessQl7SupportTone({ text, language: locale })
  const analysis = analyzeQl7SupportRequest({ text, locale, previousContext })
  const route = routeQl7SupportMessage({ text, locale, previousContext, baseAnalysis: analysis, tone })
  const plan = buildQl7SupportPremiumResponsePlan({ analysis: { ...analysis, caseId: 'unit-v11-5' }, route, memory, tone, locale, seed: `${locale}:${text}` })
  return { route, plan }
}

describe('QL7 Support V11.5 human conversation runtime', () => {
  test('recognizes greetings, thanks, praise, anxiety, confusion and farewells in all native locales', () => {
    for (const [locale, text, expectedAct] of QL7_SUPPORT_HUMAN_SOCIAL_CASES_V11) {
      const { route, plan } = run(locale, text)
      expect(route.messageAct, `${locale}: ${text}`).toBe(expectedAct)
      expect(route.topic, `${locale}: ${text}`).toBe('support_system')
      expect(String(plan.text || ''), `${locale}: ${text}`).not.toMatch(/(?:alliance|альянс|protected contour|system prompt|Quantum LCM Global)/iu)
      expect(String(plan.text || '')).not.toMatch(/(?:укажите|пришлите|send).{0,40}\b(?:ID|identifier)\b/iu)
    }
  })

  test('does not let a greeting, filler or profanity hide a real ecosystem request', () => {
    for (const [locale, text, expectedTopic] of QL7_SUPPORT_HUMAN_MATERIAL_CASES_V11) {
      const { route } = run(locale, text)
      expect(route.topic, `${locale}: ${text}`).toBe(expectedTopic)
      expect(route.messageAct, `${locale}: ${text}`).not.toBe('greeting')
    }
  })


  test('keeps every ecosystem topic above conversational greeting and confusion prefixes', () => {
    const builders = {
      en: (label) => `Good evening. I am a little confused, but now to the point: explain ${label}.`,
      ru: (label) => `Добрый вечер. Я немного запутался, но теперь по делу: объясни ${label}.`,
      uk: (label) => `Добрий вечір. Я трохи заплутався, але тепер до справи: поясни ${label}.`,
      es: (label) => `Buenas tardes. Estoy un poco confundido, pero ahora al grano: explica ${label}.`,
      tr: (label) => `İyi akşamlar. Biraz kafam karıştı ama şimdi konuya gelelim: ${label} konusunu açıkla.`,
      ar: (label) => `مساء الخير. أنا مرتبك قليلاً، لكن الآن إلى الموضوع: اشرح ${label}.`,
      zh: (label) => `晚上好。我有点困惑，但现在说正事：请解释${label}。`,
      he: (label) => `ערב טוב. אני קצת מבולבל, אבל עכשיו לעניין: הסבר על ${label}.`,
    }
    for (const [locale, build] of Object.entries(builders)) {
      for (const [topic, label] of Object.entries(QL7_SUPPORT_TOPIC_LABELS_V11)) {
        const { route } = run(locale, build(label))
        expect(route.topic, `${locale}: ${topic}`).toBe(topic)
      }
    }
  }, 60000)

  test('answers identity only when asked and uses the public Quantum L7 AI Global mission', () => {
    for (const [locale, text] of [['ru', 'для чего ты создан?'], ['en', 'who are you?'], ['zh', '你是谁？']]) {
      const { route, plan } = run(locale, text)
      expect(route.messageAct).toBe('identity_question')
      expect(plan.text).toContain('Quantum L7 AI Global')
    }
    expect(run('ru', 'добрый вечер').plan.text).not.toContain('Quantum L7 AI Global')
  })

  test('moves repeated free chat toward a four-choice plus Other support boundary', () => {
    const first = run('en', 'chat with me, I am bored', {}, { relevantMessages: [], replyHistory: [] })
    const second = run('en', 'tell me something else, just keep chatting', { previousTopic: 'support_system' }, {
      relevantMessages: [{ messageAct: first.route.messageAct, topic: first.route.topic }],
      replyHistory: [first.plan.text],
    })
    expect(first.route.messageAct).toBe('casual_chat')
    expect(first.plan.nextState).toBe('waiting_user')
    expect(second.route.messageAct).toBe('casual_chat')
    expect(second.plan.nextState).toBe('waiting_choice')
    expect(second.plan.cardSpec?.options).toHaveLength(4)
    expect(second.plan.cardSpec?.other?.label).toBeTruthy()
  })

  test('creates an instant transient greeting, a different next-entry variant and an idle nudge', () => {
    for (const locale of ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he']) {
      expect(listQl7SupportEntryGreetingsV11(locale).length).toBeGreaterThanOrEqual(8)
      const one = createQl7SupportInstantGreetingMessageV11({ userId: 'user-v11-5', locale, entryNonce: `${locale}:1`, now: 1000 })
      const two = createQl7SupportInstantGreetingMessageV11({ userId: 'user-v11-5', locale, entryNonce: `${locale}:2`, now: 2000 })
      const idle = createQl7SupportIdleNudgeMessageV11({ userId: 'user-v11-5', locale, entryNonce: `${locale}:2`, anchorId: 'answer-1', now: 3000 })
      expect(one.text).not.toBe(two.text)
      expect(one.metadata).toMatchObject({ clientOnly: true, entryGreeting: true })
      expect(idle.metadata).toMatchObject({ clientOnly: true, idleNudge: true, ephemeralSupportPrompt: true })
      expect(isQl7SupportEphemeralEntryMessageV11(one)).toBe(true)
      expect(isQl7SupportEphemeralEntryMessageV11(idle)).toBe(true)
    }
  })

  test('wires instant entry, exact server acknowledgement, cleanup on exit and newest-first rendering', () => {
    const root = process.cwd()
    const forum = fs.readFileSync(path.join(root, 'app/forum/ForumRoot.jsx'), 'utf8')
    const route = fs.readFileSync(path.join(root, 'app/api/dm/support-entry/route.js'), 'utf8')
    const pane = fs.readFileSync(path.join(root, 'app/forum/features/dm/components/DmMessagesPane.jsx'), 'utf8')
    expect(forum).toContain('createQl7SupportInstantGreetingMessageV11')
    expect(forum).toContain('entryVariantId: String(optimisticGreeting?.metadata?.entryVariantId')
    expect(forum).toContain("method: 'DELETE'")
    expect(forum).toContain('createQl7SupportIdleNudgeMessageV11')
    expect(route).toContain('entryVariantId: String(body?.entryVariantId')
    expect(route).toContain('removeQl7SupportEntryGreetingsV11')
    expect(pane).toContain('dmThreadItems.slice().reverse()')
    expect(pane).toContain('data-dm-thread-order="newest-first"')
  })
})
