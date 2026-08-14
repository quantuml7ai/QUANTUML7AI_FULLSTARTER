import { describe, expect, test } from 'vitest'
import { buildQl7SupportTurnSemanticFrameV9 } from '../../../lib/ql7-support/turnSemanticFrameV9.js'
import { arbitrateQl7SupportTopicSwitchV9 } from '../../../lib/ql7-support/topicSwitchArbiterV9.js'
import {
  localizeQl7MetricV9,
  normalizeQl7MetricRowsV9,
} from '../../../lib/ql7-support/metricRegistryV9.js'
import {
  buildQl7SupportCardV4,
  validateQl7SupportCardV4,
} from '../../../lib/ql7-support/cardSchemaV4.js'
import {
  getQl7SemanticSurfaceCoverageV9,
  realizeQl7SemanticSurfaceV9,
} from '../../../lib/ql7-support/semanticSurfaceV9.js'
import { realizeQl7SupportReply } from '../../../lib/ql7-support/naturalLanguageRealizer.js'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { getQl7SupportKnowledgeAnswer } from '../../../lib/ql7-support/knowledgeRegistry.js'
import {
  getQl7SupportTopicActionV9,
  getQl7SupportRouteHrefV9,
} from '../../../lib/ql7-support/topicActionRegistryV9.js'
import {
  auditQl7LocalDictionaryContext,
  buildQl7LocalDictionaryContext,
  realizeQl7LocalDictionaryAnswer,
} from '../../../lib/ql7-support/localDictionaryContext.js'
import { decideQl7SupportConversationTurn } from '../../../lib/ql7-support/conversationIntelligence.js'
import { assessQl7SupportTone } from '../../../lib/ql7-support/toxicityEngine.js'
import { presentQl7SupportDiagnostic } from '../../../lib/ql7-support/diagnosticPresentation.js'
import { buildSupportEmailReport, renderSupportEmailHtml } from '../../../lib/supportEmailTransport.js'
import { dedupeDmThreadMessagesExact } from '../../../app/forum/features/dm/utils/dmLoaders.js'
import { prepareQl7SupportLanguageInput } from '../../../lib/ql7-support/languageOrchestrator.js'

describe('QL7 Support V9 cognitive runtime', () => {
  test('builds turn frames that switch from old wallet context to ads metrics', () => {
    const frame = buildQl7SupportTurnSemanticFrameV9({
      text: 'Какие метрики по моей рекламе и CTR?',
      locale: 'ru',
      intent: { messageAct: 'personal_status_request', top: { topic: 'ads_campaigns', confidence: 0.9 } },
      previousContext: { topic: 'qcoin' },
    })
    const decision = arbitrateQl7SupportTopicSwitchV9({
      frame,
      intent: { messageAct: 'personal_status_request', top: { topic: 'ads_campaigns', confidence: 0.9 } },
      previousContext: { topic: 'qcoin' },
    })
    expect(frame).toMatchObject({
      topic: 'ads_campaigns',
      previousTopic: 'qcoin',
      operation: 'show_metrics',
      ownership: 'self',
    })
    expect(decision).toMatchObject({
      decision: 'switch',
      reasonCode: 'operation_show_metrics',
    })
  })

  test('routes cyber threats into safety review instead of ordinary security ID clarification', () => {
    const frame = buildQl7SupportTurnSemanticFrameV9({
      text: 'Я сделаю на вас кибер атаку',
      locale: 'ru',
      intent: { messageAct: 'problem_description', top: { topic: 'security', confidence: 0.9 } },
      previousContext: { topic: 'security' },
    })
    expect(frame).toMatchObject({
      topic: 'support_system',
      operation: 'safety_review',
      socialRisk: 'threat',
    })
  })

  test('keeps GameVerse page questions separate from generic metaverse launch answers', () => {
    const route = routeQl7SupportMessage({
      text: 'Объясни, что такое страница GameVerse и когда запуск?',
      locale: 'ru',
      previousContext: { topic: 'metaverse' },
    })
    const frame = buildQl7SupportTurnSemanticFrameV9({
      text: 'Объясни, что такое страница GameVerse и когда запуск?',
      locale: 'ru',
      intent: route,
      previousContext: { topic: 'metaverse' },
    })
    const answer = getQl7SupportKnowledgeAnswer({
      topic: frame.topic,
      intent: route.messageAct,
      locale: 'ru',
      seed: 'gameverse-page-question',
    })

    expect(frame.topic).toBe('gameverse')
    expect(answer.source).toBe('local_i18n_semantic_context_v9')
    expect(answer.dictionaryContext.keyCount).toBeGreaterThan(3)
    expect(answer.dictionaryContext.keys).toContain('game_title')
    expect(answer.text).toContain('QCoin')
    expect(answer.text).toMatch(/Дату запуска|roadmap/iu)
  })

  test('extracts local i18n page context for all support topics and realizes variable wording', () => {
    const audit = auditQl7LocalDictionaryContext()
    expect(audit.ok).toBe(true)
    expect(audit.topics).toBeGreaterThanOrEqual(40)

    const context = buildQl7LocalDictionaryContext({ topic: 'gameverse', locale: 'en' })
    const variants = ['a', 'b', 'c', 'd'].map((suffix) => realizeQl7LocalDictionaryAnswer({
      topic: 'gameverse',
      intent: 'informational_question',
      locale: 'en',
      seed: `dictionary-realizer-${suffix}`,
      context,
    }))
    expect(context.keys).toContain('game_p1')
    expect(new Set(variants.map((item) => item.text)).size).toBeGreaterThan(1)
    expect(variants[0].text).toContain('QCoin')
    expect(variants[0].text).not.toContain('Welcome to the Quantum L7 GameVerse')
  })

  test('normalizes V9 metrics into localized safe rows', () => {
    expect(localizeQl7MetricV9('views_total', 'ru')).toBe('Просмотры')
    const rows = normalizeQl7MetricRowsV9([
      { key: 'views_total', value: 1200 },
      { key: 'click_count', value: 84 },
      { key: 'raw_internal_key', value: 'hidden' },
    ], 'ru')
    expect(rows).toEqual([
      expect.objectContaining({ key: 'impressions', label: 'Просмотры', value: 1200 }),
      expect.objectContaining({ key: 'clicks', label: 'Клики', value: 84 }),
    ])
    const adsCard = buildQl7SupportCardV4({
      locale: 'ru',
      title: 'Рекламная аналитика',
      summary: 'Метрики нормализованы для пользователя.',
      metrics: [
        { key: 'view_count', value: 4300 },
        { key: 'click_count', value: 217 },
        { key: 'ctr_total', value: 0.0505 },
        { key: 'package_name', value: 'Quantum Pulse' },
        { key: 'raw_internal_key', value: 'leak' },
      ],
    })
    expect(adsCard.metrics).toEqual([
      expect.objectContaining({ key: 'impressions', label: 'Просмотры', value: '4300', format: 'integer' }),
      expect.objectContaining({ key: 'clicks', label: 'Клики', value: '217', format: 'integer' }),
      expect.objectContaining({ key: 'ctr', label: 'CTR', value: '0.0505', format: 'percent' }),
      expect.objectContaining({ key: 'packageName', label: 'Пакет', value: 'Quantum Pulse' }),
    ])
    const renderedMetricText = JSON.stringify(adsCard.metrics)
    expect(renderedMetricText).not.toContain('view_count')
    expect(renderedMetricText).not.toContain('click_count')
    expect(renderedMetricText).not.toContain('raw_internal_key')
  })

  test('signs Card V4 and keeps V1-V3 compatibility boundary outside unsafe actions', () => {
    const card = buildQl7SupportCardV4({
      locale: 'ru',
      title: 'Рекламная кампания',
      summary: 'Проверено.',
      metrics: [
        { key: 'impressions_total', value: 100 },
        { key: 'unsafeMetric', value: 'nope' },
      ],
      actions: [
        { id: 'open-ads', routeId: 'ads', label: 'Подробнее' },
        { id: 'open-gameverse', routeId: 'gameverse', label: 'Открыть GameVerse' },
        { id: 'external', href: 'https://example.com', label: 'External' },
      ],
    })
    expect(card.version).toBe(4)
    expect(card.metrics).toHaveLength(1)
    expect(card.actions).toHaveLength(2)
    expect(validateQl7SupportCardV4(card).ok).toBe(true)
  })

  test('adds premium safe CTA actions to ecosystem knowledge replies', () => {
    const cases = [
      ['exchange', '/exchange'],
      ['homepage', '/'],
      ['battlecoin', '/exchange'],
      ['gameverse', '/game'],
      ['academy', '/academy'],
      ['ads_campaigns', '/ads'],
    ]
    for (const [topic, href] of cases) {
      const action = getQl7SupportTopicActionV9(topic, { locale: 'ru', seed: `cta:${topic}` })
      expect(action).toMatchObject({ href, kind: 'primary' })
      expect(getQl7SupportRouteHrefV9(action.routeId)).toBe(href)
      const reply = realizeQl7SupportReply({
        analysis: { messageAct: 'informational_question', topic, caseId: `case-${topic}` },
        route: { messageAct: 'informational_question', topic },
        locale: 'ru',
        seed: `knowledge:${topic}`,
      })
      expect(reply.cardSpec).toMatchObject({
        purpose: 'explanation',
        kind: 'ecosystem_context',
        visualTheme: 'knowledge-blue',
      })
      expect(reply.cardSpec.actions).toEqual([expect.objectContaining({ href, kind: 'primary' })])
      expect(JSON.stringify(reply.cardSpec)).not.toMatch(/local[_ -]?i18n|dictionary|словар|internal/iu)
    }
  })

  test('assembles mission and humor replies from semantic slots across languages', () => {
    const coverage = getQl7SemanticSurfaceCoverageV9()
    for (const locale of ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he']) {
      expect(Object.keys(coverage[locale] || {}).length).toBeGreaterThan(20)
      const identity = realizeQl7SemanticSurfaceV9({ locale, category: 'identity', seed: `id:${locale}` })
      const humor = realizeQl7SemanticSurfaceV9({ locale, category: 'humor', seed: `humor:${locale}` })
      expect(identity).toContain('Quantum L7 AI Global')
      expect(humor.length).toBeGreaterThan(40)
    }
    expect(realizeQl7SemanticSurfaceV9({ locale: 'ru', category: 'identity', seed: 'a' }))
      .not.toBe(realizeQl7SemanticSurfaceV9({ locale: 'ru', category: 'identity', seed: 'b' }))
  })

  test('realizer uses V9 semantic surface for identity and humor acts', () => {
    const identity = realizeQl7SupportReply({
      analysis: { messageAct: 'identity_question', topic: 'support_system' },
      route: { messageAct: 'identity_question', topic: 'support_system' },
      locale: 'ru',
      seed: 'realizer:identity',
    })
    const humor = realizeQl7SupportReply({
      analysis: { messageAct: 'humor_play', topic: 'support_system' },
      route: { messageAct: 'humor_play', topic: 'support_system' },
      locale: 'ru',
      seed: 'realizer:humor',
    })
    expect(identity.text).toContain('Quantum L7 AI Global')
    expect(identity.responseCode).toBe('identity_mission')
    expect(humor.responseCode).toBe('humor_boundary')
    expect(humor.text).toMatch(/шут|юмор|лёгк|искр/iu)
  })

  test('routes own VIP, balance and ad metrics into read-only diagnostics without asking for an ID', () => {
    const cases = [
      ['какой статус моей VIP подписки?', 'vip', 'check_status', 'verified_actor_self_status'],
      ['покажи мой баланс', 'qcoin', 'check_status', 'topic_switch_v9'],
      ['покажи метрики по рекламе', 'ads_campaigns', 'show_metrics', 'topic_switch_v9'],
      ['кькоин пропал с баланса', 'qcoin', 'support_intake', 'topic_switch_v9'],
    ]
    for (const [text, topic, operation, reasonCode] of cases) {
      const route = routeQl7SupportMessage({ text, locale: 'ru', previousContext: { topic: 'vip' } })
      const decision = decideQl7SupportConversationTurn({
        text,
        route,
        analysis: { topic: route.topic, subIntent: route.subIntent, messageAct: route.messageAct, caseStatus: 'collecting_context' },
      })
      expect(route.topic).toBe(topic)
      expect(route.operation).toBe(operation)
      expect(route.shouldClarify).toBe(false)
      expect(route.missingEvidence).toEqual([])
      expect(route.domainPlan).toMatchObject({ privacyBoundary: 'user_safe_evidence_only' })
      expect(decision).toMatchObject({ shouldDiagnose: true, caseStatus: 'ready_for_diagnostic', reasonCode })
      if (text === 'покажи мой баланс') {
        expect(route).toMatchObject({ ownership: 'self', subIntent: 'qcoin_balance', operation: 'check_status' })
        expect(decision.explicitSelfReference).toBe(true)
        expect(decision.actorScopedRead).toBe(true)
      }
    }
  })

  test('keeps multilingual abuse and threats out of stale topic context', () => {
    const insult = assessQl7SupportTone({ text: 'du huhrensohn hilf mir', language: 'ru' })
    const insultRoute = routeQl7SupportMessage({
      text: 'du huhrensohn hilf mir',
      locale: 'ru',
      previousContext: { topic: 'vip' },
      tone: insult,
    })
    expect(insult).toMatchObject({ taxonomyCategory: 'insult_to_support', asksForHelp: true })
    expect(insultRoute).toMatchObject({ messageAct: 'profanity_with_request', topic: 'support_system', shouldClarify: false })

    const threatText = 'اريد ان ارتكب هجوما إرهابيا'
    const threat = assessQl7SupportTone({ text: threatText, language: 'ru' })
    const threatRoute = routeQl7SupportMessage({ text: threatText, locale: 'ar', previousContext: { topic: 'vip' }, tone: threat })
    const decision = decideQl7SupportConversationTurn({
      text: threatText,
      route: threatRoute,
      analysis: { topic: threatRoute.topic, subIntent: threatRoute.subIntent, messageAct: threatRoute.messageAct },
      tone: threat,
    })
    expect(threat).toMatchObject({ taxonomyCategory: 'threat', safetyEscalation: true })
    expect(threatRoute).toMatchObject({ messageAct: 'threat', topic: 'support_system', operation: 'safety_review' })
    expect(decision).toMatchObject({ decision: 'safety_escalation', caseStatus: 'awaiting_admin' })
  })

  test('uses canonical English provider output for dialect routing and emits choice cards for uncertain asks', async () => {
    const translated = await prepareQl7SupportLanguageInput({
      text: 'salom, qcoin balansimni korsat hozir',
      selectedLocale: 'uz',
      translate: async () => ({
        text: 'check my QCoin balance for the current verified account',
        provider: 'unit_fixture',
      }),
    })
    const balanceRoute = routeQl7SupportMessage({
      text: translated.canonicalText,
      locale: translated.detectedLanguage,
      baseAnalysis: { canonicalText: translated.canonicalText },
      previousContext: { topic: 'vip' },
    })
    expect(translated).toMatchObject({ detectedLanguage: 'uz', translationStatus: 'translated', canonicalLanguage: 'en' })
    expect(balanceRoute).toMatchObject({
      messageAct: 'personal_status_request',
      topic: 'qcoin',
      operation: 'check_status',
      shouldClarify: false,
    })

    const uncertain = await prepareQl7SupportLanguageInput({
      text: 'hallo, hilf mir mit diesem ding',
      selectedLocale: 'de',
      translate: async () => ({
        text: 'I need help with that thing but I do not know the correct section',
        provider: 'unit_fixture',
      }),
    })
    const uncertainRoute = routeQl7SupportMessage({
      text: uncertain.canonicalText,
      locale: uncertain.detectedLanguage,
      baseAnalysis: { canonicalText: uncertain.canonicalText },
      previousContext: { topic: 'vip' },
    })
    const reply = realizeQl7SupportReply({
      analysis: { messageAct: uncertainRoute.messageAct, topic: uncertainRoute.topic, caseId: 'case-choices' },
      route: uncertainRoute,
      locale: uncertain.detectedLanguage,
      seed: 'provider-boundary-choice',
    })
    expect(uncertain).toMatchObject({ detectedLanguage: 'de', translationStatus: 'translated', canonicalLanguage: 'en' })
    expect(uncertainRoute).toMatchObject({ messageAct: 'ambiguous_request', shouldClarify: true })
    expect(reply.cardSpec).toMatchObject({ kind: 'clarification_choices' })
    expect(reply.cardSpec.options).toHaveLength(4)
    expect(reply.cardSpec.other).toMatchObject({ id: 'ql7_choice_other' })
  })

  test('treats CryptoRadar requests as ecosystem information with premium CTA instead of ambiguity', () => {
    const route = routeQl7SupportMessage({ text: 'расскажи про CryptoRadar', locale: 'ru', previousContext: { topic: 'vip' } })
    const reply = realizeQl7SupportReply({
      analysis: { messageAct: route.messageAct, topic: route.topic, caseId: 'case-cryptoradar' },
      route,
      locale: 'ru',
      seed: 'cryptoradar:archive-regression',
    })
    expect(route).toMatchObject({ messageAct: 'informational_question', topic: 'homepage', operation: 'explain', shouldClarify: false })
    expect(reply.cardSpec).toMatchObject({
      purpose: 'explanation',
      kind: 'ecosystem_context',
      visualTheme: 'knowledge-blue',
    })
    expect(reply.cardSpec.actions).toEqual([expect.objectContaining({ href: '/', kind: 'primary' })])
    expect(JSON.stringify(reply.cardSpec)).not.toMatch(/dictionary|local_i18n|словар/iu)
  })

  test('presents inactive VIP and missing ad packages without false success or zero-metric tables', () => {
    const vip = presentQl7SupportDiagnostic({
      topic: 'vip',
      locale: 'ru',
      diagnosticResult: { topic: 'vip', branch: 'inactive', active: false, asOf: '2026-07-27T15:00:00.000Z' },
    })
    expect(vip).toMatchObject({ kind: 'data_table', status: 'noData', title: 'Состояние VIP' })
    expect(JSON.stringify(vip)).toContain('нет активной VIP-подписки')
    expect(JSON.stringify(vip)).not.toContain('"label":"Подтверждено"')
    expect(JSON.stringify(vip)).not.toContain('всё выглядит корректно')

    const ads = presentQl7SupportDiagnostic({
      topic: 'ads_campaigns',
      locale: 'ru',
      diagnosticResult: {
        topic: 'ads',
        branch: 'ads_package_missing',
        evidence: { packageCount: 0, campaignCount: 0, impressions: 0, clicks: 0, ctr: 0 },
        asOf: '2026-07-27T15:00:00.000Z',
      },
    })
    expect(ads).toMatchObject({ kind: 'notice', status: 'noData', table: null, metrics: [] })
    expect(JSON.stringify(ads)).toContain('нет активного рекламного пакета')
    expect(JSON.stringify(ads)).not.toMatch(/Просмотры|Клики|view_count|click_count/iu)
  })

  test('renders QCoin balance as a compact premium table without duplicate status rows', () => {
    const balance = presentQl7SupportDiagnostic({
      topic: 'qcoin',
      locale: 'ru',
      diagnosticResult: {
        topic: 'qcoin',
        branch: 'qcoin_balance_ok',
        evidence: { balance: 125.5, checkedAt: '2026-07-27T15:00:00.000Z' },
        asOf: '2026-07-27T15:00:00.000Z',
      },
    })
    expect(balance).toMatchObject({ kind: 'data_table', title: 'Баланс QCoin', status: 'healthy' })
    expect(balance.table.rows.map((row) => row.key)).toEqual(['balance', 'checkedAt'])
    expect(JSON.stringify(balance)).not.toMatch(/status.*status|view_count|click_count/iu)
  })

  test('humanizes contact and support SMTP HTML without raw keys or dark unreadable message text', () => {
    const contact = buildSupportEmailReport({
      source: 'contact_form',
      name: 'Ivan',
      email: 'ivan@example.com',
      message: 'Текст заявки пользователя',
      meta: { locale: 'ru' },
      report: {
        topic: 'contact_form_received',
        caseStatus: 'queued_for_admin_review',
        detectedLanguage: 'ru',
        translationStatus: 'required_fields_validated',
        privacyBoundary: 'admin_only_evidence_separated',
        actor: { wallet_session: 'ql7ws_abcdefghijklmnopqrstuvwxyz', request_fingerprint: 'request_context_redacted' },
        safeGeo: { request_ip: '192.168.1.10', status: 'request_ip_unavailable' },
        timeline: [{ type: 'contact_form_admin_only_redacted', status: 'required_fields_validated' }],
      },
    })
    const contactHtml = renderSupportEmailHtml(contact)
    expect(contactHtml).toContain('color:#ffffff!important')
    expect(contactHtml).toContain('background:#092848!important')
    expect(contactHtml).toContain('Required fields validated')
    expect(contactHtml).not.toMatch(/messageAct|subIntent|responseCode|required_fields_validated|request_context_redacted|contact_form_admin_only_redacted|wallet_session|192\.168/iu)

    const support = buildSupportEmailReport({
      source: 'ql7_support_dm',
      name: 'QL7 Support DM',
      message: 'батлкоин',
      report: {
        caseId: 'case-1',
        messageId: '673',
        topic: 'battlecoin',
        role: 'bare_identifier',
        subIntent: 'battlecoin_general',
        caseStatus: 'ready_for_diagnostic',
        diagnosticStatus: 'ready',
        responseCode: 'none',
        user: '0x6d0bf9020900faba87bcb2906bf97b7febca4ae',
        profile: { nickname: 'QL7 Support DM' },
        diagnostic: { facts: [], checks: [], anomalies: [], confidence: 35 },
        ecosystemRating: {
          value: 53,
          band: 'established',
          confidence: 35,
          positiveContributors: [{ key: 'profile_nickname', points: 3 }],
          missingData: ['account_age', 'successful_activity'],
        },
        recommendedAction: 'Review battlecoin branch unavailable and continue from the support case.',
      },
    })
    const supportHtml = renderSupportEmailHtml(support)
    const supportRawPattern = /Message act|Sub-intent|Response code|profile_nickname|account_age|\[\{|\\u0412|\\u0432\\u0402|\\u2014|\\u00b7/u
    expect(supportHtml).toContain('Открыть прямой диалог в DM')
    expect(supportHtml).toContain('dmUser=0x6d0bf9020900faba87bcb2906bf97b7febca4ae')
    expect(supportHtml).toContain('background:#092848!important;color:#ffffff!important')
    expect(supportHtml).toContain('-webkit-text-fill-color:#ffffff!important')
    expect(supportHtml).not.toContain('Open direct conversation')
    expect(supportHtml).not.toMatch(/Open support thread|View applicant profile|Open conversation inbox/u)
    expect(supportHtml).not.toMatch(supportRawPattern)
  })

  test('dedupes repeated Support greetings and canonical reply replacements before rendering', () => {
    const messages = dedupeDmThreadMessagesExact([
      { id: 'g1', from: 'ql7-support', to: 'user-1', ts: 10, supportThread: true, supportEventType: 'entry_greeting', text: 'hello one' },
      { id: 'g2', from: 'ql7-support', to: 'user-1', ts: 20, supportThread: true, supportEventType: 'support_thread_open', text: 'hello two' },
      { id: 'tmp_dm_1', from: 'ql7-support', to: 'user-1', ts: 30, status: 'sending', supportThread: true, clientMutationId: 'reply:abc', text: 'draft' },
      { id: 'srv_1', from: 'ql7-support', to: 'user-1', ts: 40, supportThread: true, clientMutationId: 'reply:abc', supportCard: { integrity: { signature: 'x' } }, text: 'final' },
    ])
    expect(messages).toHaveLength(2)
    expect(messages.map((item) => item.id)).toEqual(['g2', 'srv_1'])
  })
})
