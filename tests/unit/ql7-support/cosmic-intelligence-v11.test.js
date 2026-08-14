import { describe, it, expect } from 'vitest'
import { assertQl7SupportUserInputV11, countQl7SupportGraphemesV11, enforceQl7SupportReplyBudgetV11 } from '../../../lib/ql7-support/limitsV11.js'
import { getQl7SupportRouteNavigationHrefV11, getQl7SupportTopicActionV9 } from '../../../lib/ql7-support/topicActionRegistryV9.js'
import { buildQl7SupportPersonalityEvidenceV11, buildQl7SupportPersonalityStateV11 } from '../../../lib/ql7-support/personalityEngineV11.js'
import { calculateQl7SupportCognitiveMaturityV11 } from '../../../lib/ql7-support/learningControlPlaneV11.js'
import { buildQl7SupportSimulationScenarioV11 } from '../../../lib/ql7-support/simulationGeneratorV11.js'
import { clusterQl7SupportSimulationFailuresV11, evaluateQl7SupportSimulationResultV11 } from '../../../lib/ql7-support/simulationEvaluatorV11.js'
import { buildQl7SupportRuntimeClaimV11, getQl7SupportRuntimeCapabilityV11 } from '../../../lib/ql7-support/runtimeCapabilityRegistryV11.js'
import { QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION_V11, recordQl7SupportCognitiveTurnV11 } from '../../../lib/ql7-support/cognitiveMemoryV11.js'
import { attachQl7SupportSignedChoicesV11, hasQl7SupportChoiceSelectionAttemptV11, sanitizeQl7SupportChoiceTransportV11, verifyQl7SupportChoiceTokenV11 } from '../../../lib/ql7-support/choiceContractV11.js'
import { buildQl7SupportCardV4 } from '../../../lib/ql7-support/cards.js'
import { analyzeQl7SupportRequest } from '../../../lib/ql7-support/caseEngine.js'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { buildQl7SupportTurnSemanticFrameV9 } from '../../../lib/ql7-support/turnSemanticFrameV9.js'

function memoryDatabase() {
  const docs = new Map()
  return {
    docs,
    collection(name) {
      if (!docs.has(name)) docs.set(name, new Map())
      const rows = docs.get(name)
      return {
        createIndex: async () => 'ok',
        findOne: async (filter) => Array.from(rows.values()).find((row) => Object.entries(filter || {}).every(([key, value]) => row?.[key] === value)) || null,
        updateOne: async (filter, update, options = {}) => {
          const existing = Array.from(rows.values()).find((row) => Object.entries(filter || {}).every(([key, value]) => row?.[key] === value))
          const row = { ...(existing || {}), ...(update?.$setOnInsert && !existing ? update.$setOnInsert : {}), ...(update?.$set || {}) }
          const id = row._id || existing?._id || filter?._id || `${name}:${rows.size}`
          row._id = id
          if (existing?._id && existing._id !== id) rows.delete(existing._id)
          rows.set(id, row)
          return { acknowledged: true, upsertedCount: existing ? 0 : (options.upsert ? 1 : 0) }
        },
        deleteMany: async () => ({ deletedCount: 0 }),
      }
    },
  }
}

describe('QL7 Support cosmic intelligence V11', () => {
  it('enforces 600 input and 4000 output by grapheme', () => {
    expect(assertQl7SupportUserInputV11('a'.repeat(600)).graphemes).toBe(600)
    expect(() => assertQl7SupportUserInputV11('a'.repeat(601))).toThrow()
    expect(countQl7SupportGraphemesV11('👨‍👩‍👧‍👦')).toBe(1)
    expect(enforceQl7SupportReplyBudgetV11('x'.repeat(5000), { mode: 'long_form_explanation' }).graphemes).toBeLessThanOrEqual(4000)
  })


  it('preserves an opaque signed choice token and detects unsigned selection attempts', () => {
    const signedToken = 'opaque.choice.token'
    const sanitized = sanitizeQl7SupportChoiceTransportV11({ optionId: 'vip-status', topic: 'vip', signedToken })
    expect(sanitized.signedToken).toBe(signedToken)
    expect(hasQl7SupportChoiceSelectionAttemptV11({ optionId: 'vip-status' })).toBe(true)
    expect(hasQl7SupportChoiceSelectionAttemptV11(null)).toBe(false)
  })

  it('binds signed choices to user, expiry and immutable token semantics', async () => {
    const issuedAt = Date.parse('2026-01-01T00:00:00.000Z')
    const secret = 'ql7-support-v11-unit-secret-0123456789abcdef'
    const signed = await attachQl7SupportSignedChoicesV11({
      card: { caseId: 'case-1', options: [{ id: 'vip-status', label: 'VIP status', semantic: { topic: 'vip', subIntent: 'subscription_status', caseId: 'case-1' } }] },
      userId: 'user-1',
      ownerCaseId: 'case-1',
      issuedAt,
      ttlMs: 60_000,
      secret,
    })
    const token = signed.card.options[0].signedToken
    await expect(verifyQl7SupportChoiceTokenV11({ token, userId: 'user-1', secret, now: issuedAt + 1_000 })).resolves.toMatchObject({ ok: true, payload: { topic: 'vip', subIntent: 'subscription_status' } })
    await expect(verifyQl7SupportChoiceTokenV11({ token, userId: 'other-user', secret, now: issuedAt + 1_000 })).resolves.toMatchObject({ ok: false, error: 'choice_wrong_user' })
    await expect(verifyQl7SupportChoiceTokenV11({ token, userId: 'user-1', secret, now: issuedAt + 120_000 })).resolves.toMatchObject({ ok: false, error: 'choice_expired' })
  })

  it('uses real actions instead of universal forum fallback', () => {
    expect(getQl7SupportTopicActionV9('wallet')).toMatchObject({ actionType: 'global_event', eventName: 'quantum-wallet:open' })
    expect(getQl7SupportTopicActionV9('metamarket')).toMatchObject({ actionType: 'global_event', eventName: 'metamarket:open' })
    expect(getQl7SupportTopicActionV9('vip')).toMatchObject({ actionType: 'route', href: '/subscribe' })
    expect(getQl7SupportTopicActionV9('ads_packages')).toMatchObject({ actionType: 'route', href: '/ads' })
    expect(getQl7SupportTopicActionV9('metastudio')).toMatchObject({ actionType: 'route', href: '/game?ql7Action=metastudio#metastudio' })
    expect(getQl7SupportTopicActionV9('homepage')).toMatchObject({ actionType: 'route', href: '/' })
    expect(getQl7SupportTopicActionV9('battlecoin')).toMatchObject({ actionType: 'route', href: '/exchange', tab: 'battlecoin' })
    expect(getQl7SupportTopicActionV9('futures')).toMatchObject({ actionType: 'route', href: '/exchange', tab: 'futures' })
    expect(getQl7SupportRouteNavigationHrefV11('battlecoin')).toBe('/exchange#ql7-exchange-battlecoin')
  })

  it('keeps personality bounded, applies explicit feedback and blocks maturity on critical failures', () => {
    const evidence = buildQl7SupportPersonalityEvidenceV11({ outcomeType: 'not_helpful', value: 'explain in more detail' })
    const personality = buildQl7SupportPersonalityStateV11({ evidence: [...evidence, ...Array.from({ length: 100 }, () => ({ type: 'humor_helpful', weight: 1 }))] })
    expect(personality.traits.humorReadiness).toBeLessThanOrEqual(1)
    expect(personality.sampleSize).toBeGreaterThan(0)
    const maturity = calculateQl7SupportCognitiveMaturityV11({ safetyReliability: { score: 99, sampleSize: 100, criticalFailures: 1 } })
    expect(maturity.status).toBe('blocked')
  })

  it('builds deterministic bounded simulations and detects overflow', () => {
    const first = buildQl7SupportSimulationScenarioV11(77, { seed: 'same' })
    const second = buildQl7SupportSimulationScenarioV11(77, { seed: 'same' })
    expect(first).toEqual(second)
    expect(first.inputGraphemes).toBeGreaterThanOrEqual(1)
    expect(first.inputGraphemes).toBeLessThanOrEqual(600)
    const result = evaluateQl7SupportSimulationResultV11({ scenario: first, actual: { topic: first.topic, text: 'x'.repeat(4001) } })
    expect(result.failures.map((row) => row.code)).toContain('reply_over_4000')
  })

  it('keeps simulation oracles truthful and maturity measured-only', () => {
    const rows = Array.from({ length: 2000 }, (_, index) => buildQl7SupportSimulationScenarioV11(index, { seed: 'truth-unit', scenarioCount: 2000, minTurns: 2, maxTurns: 4 }))
    const startOracles = rows.map((row) => row.conversationTurns[0].oracle)
    expect(startOracles.some((oracle) => oracle.mode === 'ambiguity')).toBe(true)
    expect(startOracles.some((oracle) => oracle.mode === 'exact')).toBe(true)
    expect(startOracles.filter((oracle) => oracle.mode === 'exact').every((oracle) => oracle.primaryAnchorRecovered === true)).toBe(true)
    expect(startOracles.filter((oracle) => oracle.mode === 'ambiguity').every((oracle) => Array.isArray(oracle.allowedTopics) && oracle.allowedTopics.includes('support_system'))).toBe(true)
    expect(rows.flatMap((row) => row.conversationTurns).some((turn) => turn.oracle.mode === 'multi_intent')).toBe(true)
    const maturity = calculateQl7SupportCognitiveMaturityV11({ topicAccuracy: { score: 80, sampleSize: 200 } })
    expect(maturity.slices.translationQuality.measured).toBe(false)
    expect(maturity.slices.translationQuality.confidence).toBe(0)
    expect(maturity.score).toBe(80)
    expect(maturity.status).toBe('insufficient_evidence')
  }, 30000)

  it('evaluates multi-intent coverage and reports expected-to-actual clusters', () => {
    const scenario = { scenarioId: 'multi', locale: 'en', mutation: 'none', conversationTurns: [{ turnIndex: 0, transition: 'multi_intent', locale: 'en', input: 'wallet and qcoin', oracle: { mode: 'multi_intent', expectedTopics: ['wallet', 'qcoin'], requireHypothesisCoverage: true } }] }
    const result = evaluateQl7SupportSimulationResultV11({ scenario, actual: { turns: [{ topic: 'wallet', text: 'Wallet only.', route: { topic: 'wallet', hypotheses: [{ topic: 'wallet' }] } }] } })
    expect(result.ok).toBe(false)
    expect(result.failures.map((row) => row.code)).toContain('multi_intent_missing_topic')
    const clusters = clusterQl7SupportSimulationFailuresV11([{ scenario, actual: { turns: [{ topic: 'wallet' }] }, evaluation: result }])
    expect(clusters[0].clusterKey).toContain('multi_intent_missing_topic')
    expect(clusters[0].transition).toBe('multi_intent')
  })

  it('never invents a runtime date and localizes current development status', () => {
    const capability = getQl7SupportRuntimeCapabilityV11('exchange')
    const ru = buildQl7SupportRuntimeClaimV11(capability, 'ru')
    expect(ru.inventedDate).toBe(false)
    expect(ru.publishedLaunchAt).toBe(null)
    expect(ru.text).toContain('разработке')
    expect(ru.text).not.toMatch(/20\d\d-[01]\d-[0-3]\d/u)
  })

  it('stores only a canonical dm_messages reference and derived redacted turn data', async () => {
    const database = memoryDatabase()
    const result = await recordQl7SupportCognitiveTurnV11({
      database,
      userId: 'test-user',
      messageId: '1001',
      caseId: 'case-1',
      requestContext: { topic: 'qcoin', subIntent: 'balance', messageAct: 'personal_status', tone: {} },
      replyPlan: { text: 'Your QCoin balance is ready.', responseCode: 'qcoin_balance', responseMode: 'financial_status' },
      languageInput: { detectedLanguage: 'en', translationStatus: 'native' },
    })
    expect(result.ok).toBe(true)
    const turns = database.docs.get('ql7_support_turn_decisions_v11')
    const row = Array.from(turns.values())[0]
    expect(row.canonicalMessageCollection).toBe(QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION_V11)
    expect(row.canonicalMessageId).toBe('1001')
    expect(row).not.toHaveProperty('rawUserText')
  })
  it('keeps Card V4 actions fail-closed and same-origin', () => {
    const card = buildQl7SupportCardV4({
      locale: 'en', title: 'Action safety', summary: 'Unsafe targets are removed.',
      actions: [
        { id: 'ads', routeId: 'ads', label: 'Ads' },
        { id: 'internal', href: '/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support', label: 'Contact' },
        { id: 'external', href: 'https://evil.example', label: 'External' },
        { id: 'protocol-relative', href: '//evil.example', label: 'Protocol relative' },
        { id: 'javascript', href: 'javascript:alert(1)', label: 'JavaScript' },
        { id: 'fake-route-id', routeId: 'external', actionType: 'route', label: 'Fake' },
      ],
    })
    expect(card.actions).toHaveLength(2)
    expect(card.actions.map((row) => row.id)).toEqual(['ads', 'internal'])
    expect(JSON.stringify(card.actions)).not.toContain('evil.example')
    expect(JSON.stringify(card.actions)).not.toContain('javascript:')
  })


  it('preserves explicit GameVerse when a flattened routed intent is reframed', () => {
    const text = 'Объясни, что такое страница GameVerse и когда запуск?'
    const route = routeQl7SupportMessage({
      text,
      locale: 'ru',
      previousContext: { topic: 'metaverse' },
    })
    const frame = buildQl7SupportTurnSemanticFrameV9({
      text,
      locale: 'ru',
      intent: route,
      previousContext: { topic: 'metaverse' },
    })

    expect(route.topic).toBe('gameverse')
    expect(frame.topic).toBe('gameverse')
    expect(frame.previousTopic).toBe('metaverse')
  })

  it('honors explicit topic rejection and switches from stale QCoin to requested ads metrics', () => {
    const previousContext = { topic: 'qcoin', previousTopic: 'qcoin', caseStatus: 'collecting_context' }
    const text = 'Не про QCoin. Теперь покажи мои рекламные метрики.'
    const analysis = analyzeQl7SupportRequest({ text, locale: 'ru', previousContext })
    const route = routeQl7SupportMessage({ text, locale: 'ru', previousContext, baseAnalysis: analysis, tone: {} })
    expect(route.topic).toBe('ads_campaigns')
    expect(route.hypotheses[0]?.topic).toBe('ads_campaigns')

    const inclusive = 'Not only QCoin. Also explain ad packages.'
    const inclusiveAnalysis = analyzeQl7SupportRequest({ text: inclusive, locale: 'en', previousContext: {} })
    const inclusiveRoute = routeQl7SupportMessage({ text: inclusive, locale: 'en', previousContext: {}, baseAnalysis: inclusiveAnalysis, tone: {} })
    expect(inclusiveRoute.hypotheses.map((row) => row.topic)).toContain('qcoin')
  })

  it('prioritizes explicit ecosystem subjects over incidental VIP Ads and QCoin state', () => {
    const cases = [
      ['Quantum Wallet. My QCoin top-up is pending.', 'wallet'],
      ['crypto news. The campaign exists but its metrics are zero.', 'news'],
      ['Quantum Family followers and subscriptions. My VIP appears expired.', 'quantum_family'],
      ['forum threads. I have an active advertising campaign.', 'forum_threads'],
      ['ad packages. The campaign exists but its metrics are zero.', 'ads_packages'],
      ['partnership and investment proposal.', 'contact'],
      ['Deep Translate localization and language support.', 'localization'],
    ]
    for (const [text, expected] of cases) {
      const analysis = analyzeQl7SupportRequest({ text, locale: 'en', previousContext: {} })
      const route = routeQl7SupportMessage({ text, locale: 'en', previousContext: {}, baseAnalysis: analysis, tone: {} })
      expect(route.topic).toBe(expected)
    }
  })

  it('repairs mixed keyboard-layout product anchors without mutating the original message', () => {
    const text = 'йuanеum цallуе. Please explain how to use it.'
    const analysis = analyzeQl7SupportRequest({ text, locale: 'en', previousContext: {} })
    const route = routeQl7SupportMessage({ text, locale: 'en', previousContext: {}, baseAnalysis: analysis, tone: {} })
    expect(route.topic).toBe('wallet')
  })

  it('keeps the previous topic primary while representing an explicit multi-intent addition', () => {
    const previousContext = { topic: 'wallet', previousTopic: 'wallet' }
    const text = 'Tell me more about this. Also explain ad packages.'
    const analysis = analyzeQl7SupportRequest({ text, locale: 'en', previousContext })
    const route = routeQl7SupportMessage({ text, locale: 'en', previousContext, baseAnalysis: analysis, tone: {} })
    const candidates = new Set([route.topic, ...(route.hypotheses || []).map((item) => item.topic), ...(route.alternatives || [])])
    expect(route.topic).toBe('wallet')
    expect(candidates.has('wallet')).toBe(true)
    expect(candidates.has('ads_packages')).toBe(true)
  })


  it('does not preserve an ambiguity fallback over the first explicit multi-intent topic', () => {
    const previousContext = { topic: 'support_system', previousTopic: 'support_system' }
    const text = 'I mean BattleCoin. Also explain Gameverse.'
    const analysis = analyzeQl7SupportRequest({ text, locale: 'en', previousContext })
    const route = routeQl7SupportMessage({ text, locale: 'en', previousContext, baseAnalysis: analysis, tone: {} })
    const candidates = new Set([route.topic, ...(route.hypotheses || []).map((item) => item.topic), ...(route.alternatives || [])])
    expect(route.topic).toBe('battlecoin')
    expect(candidates.has('battlecoin')).toBe(true)
    expect(candidates.has('gameverse')).toBe(true)
  })


  it('uses the first explicit topic when a stale previous focus competes with two named topics', () => {
    const previousContext = { topic: 'academy', previousTopic: 'academy' }
    const text = 'I mean quests and rewards. Also explain payments and invoices.'
    const analysis = analyzeQl7SupportRequest({ text, locale: 'en', previousContext })
    const route = routeQl7SupportMessage({ text, locale: 'en', previousContext, baseAnalysis: analysis, tone: {} })
    const candidates = new Set([route.topic, ...(route.hypotheses || []).map((item) => item.topic), ...(route.alternatives || [])])
    expect(route.topic).toBe('quests')
    expect(candidates.has('quests')).toBe(true)
    expect(candidates.has('payments')).toBe(true)
  })


  it('lets an explicit named topic override a stale previous topic even for an ambiguous complaint act', () => {
    const previousContext = { topic: 'support_system', previousTopic: 'support_system' }
    const text = 'I am unhappy: something is wrong with Academy exam and result. Please investigate.'
    const analysis = analyzeQl7SupportRequest({ text, locale: 'en', previousContext })
    const route = routeQl7SupportMessage({ text, locale: 'en', previousContext, baseAnalysis: analysis, tone: {} })
    expect(route.topic).toBe('academy_exam')
    expect(route.topicSwitchDecision).toBe('switch')
  })


  it('calibrates V11.3 multilingual routing and keeps truncated oracles evidence-bound', () => {
    const routeCase = (text, locale = 'en', previousContext = {}) => {
      const analysis = analyzeQl7SupportRequest({ text, locale, previousContext })
      return routeQl7SupportMessage({ text, locale, previousContext, baseAnalysis: analysis, tone: {} })
    }

    expect(routeCase('MyQ uantum Family followers and subscriptions seems to h', 'he').topic).toBe('quantum_family')
    expect(routeCase('No estoy conforme: algo falla con reports, violations, deletion and appeal. Investígalo.', 'es').topic).toBe('moderation')
    expect(routeCase('Provide source status, identifiers and diagnostic classification. Nice! My balance went on vacation, but seriously: push', 'ar').topic).toBe('push')
    expect(routeCase('LOG 1970-01-01е00:00:00.000Z уккOк_SеAеUS=UNKNOцN\nPкovid', 'es').topic).toBe('system_status')

    for (const [text, locale, expectedDomain] of [
      ['אני רוצה לדון בשותפות עסקית הקשורה ל־BattleCoin and ten-minute battles.', 'he', 'battlecoin'],
      ['Quiero hablar de una asociación comercial relacionada con Quantum Universe and metaverse.', 'es', 'metaverse'],
    ]) {
      const route = routeCase(text, locale)
      const candidates = new Set([route.topic, ...(route.hypotheses || []).map((item) => item.topic), ...(route.alternatives || [])])
      expect(route.topic).toBe('contact')
      expect(candidates.has('contact')).toBe(true)
      expect(candidates.has(expectedDomain)).toBe(true)
    }

    const config = { mode: 'quick', seed: 'ql7-v11-production-baseline', scenarioCount: 10000, minLength: 1, maxLength: 600, minTurns: 1, maxTurns: 30 }
    const metamarketPriceSwitch = buildQl7SupportSimulationScenarioV11(198, config)
    expect(metamarketPriceSwitch.conversationTurns[1].oracle).toMatchObject({ mode: 'exact', expectedTopic: 'metamarket' })
    const reporting = buildQl7SupportSimulationScenarioV11(3138, config)
    expect(reporting.oracle.mode).toBe('ambiguity')
    expect(reporting.oracle.allowedTopics).toContain('moderation')
    expect(reporting.oracle.expectedTopic).toBe('')

    const operational = buildQl7SupportSimulationScenarioV11(2158, config)
    expect(operational.oracle.allowedTopics).toContain('system_status')
    const truncatedAds = buildQl7SupportSimulationScenarioV11(2732, config)
    expect(truncatedAds.oracle.mode).toBe('ambiguity')
    expect(truncatedAds.oracle.allowedTopics).toContain('ads_campaigns')
    const mixedAcademy = buildQl7SupportSimulationScenarioV11(740, config)
    expect(mixedAcademy.oracle.allowedTopics).toEqual(expect.arrayContaining(['academy', 'system_status']))
    const mixedAuth = buildQl7SupportSimulationScenarioV11(7843, config)
    expect(mixedAuth.oracle.allowedTopics).toEqual(expect.arrayContaining(['auth', 'system_status']))

    expect(routeCase('Почему географическая лента сортируется неправильно?', 'ru').topic).toBe('geodetect')
    expect(routeCase('My privacy and personal-data handling seems to have gone missing.', 'tr').topic).toBe('privacy')
    expect(routeCase('My account deletion and data cleanup seems to have gone missing.', 'uk').topic).toBe('account_deletion')
    expect(routeCase('Do not promise that the item price will grow.', 'ru').topic).toBe('metamarket')
    expect(routeCase('The QCoin token price may grow.', 'en').topic).toBe('qcoin')
    expect(routeCase('Explain futures price growth.', 'en').topic).toBe('futures')

    const partnershipContinuation = buildQl7SupportSimulationScenarioV11(4371, config)
    expect(partnershipContinuation.conversationTurns[0].oracle).toMatchObject({
      mode: 'multi_intent',
      expectedTopics: expect.arrayContaining(['contact', 'academy_exam']),
    })
    expect(partnershipContinuation.conversationTurns[2].oracle).toMatchObject({
      mode: 'ambiguity',
      allowedTopics: expect.arrayContaining(['contact', 'academy_exam']),
      oracleReason: 'deictic_continuation_after_multi_topic_context_allows_established_topics',
    })

    const bareForum = buildQl7SupportSimulationScenarioV11(6581, config)
    expect(bareForum.oracle.mode).toBe('ambiguity')
    expect(bareForum.oracle.allowedTopics).toContain('forum_feed')
  })


})
