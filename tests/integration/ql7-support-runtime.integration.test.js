import { describe, expect, it } from 'vitest'
import { executeQl7SupportScenario } from '../../lib/ql7-support/simulation/executeScenario.js'
import { executeQl7SupportProductionTurn, finalizeQl7SupportProductionDelivery } from '../../lib/ql7-support/runtime/productionTurn.js'
import { runQl7SupportProductionParityCase } from '../../lib/ql7-support/simulation/productionParityHarness.js'
import { verifyQl7SupportChoiceToken } from '../../lib/ql7-support/choiceContract.js'
import { localizeQl7SupportFinalDelivery } from '../../lib/ql7-support/language/finalDeliveryLocalization.js'
import { QL7_SUPPORT_ECOSYSTEM_TOPICS, getQl7SupportTopicLabel } from '../../lib/ql7-support/ecosystemCatalog.js'


function deterministicProviderTranslation({ targetLang = 'en' } = {}) {
  const target = String(targetLang || 'en').toLowerCase().split(/[-_]/u)[0]
  const text = target === 'de'
    ? 'Übersetzte Supportinformation.'
    : target === 'sv'
      ? 'Översatt supportinformation.'
      : target === 'ja'
        ? '翻訳済みのサポート情報です。'
        : 'Translated support information.'
  return Promise.resolve({ text, provider: 'integration-deterministic-provider' })
}

function finalDeliveryLocalizer(payload) {
  return localizeQl7SupportFinalDelivery({
    ...payload,
    translate: deterministicProviderTranslation,
  })
}

const TEST_ACTOR = Object.freeze({
  valid: true,
  authMode: 'test_verified_actor',
  canonicalAccountId: 'canonical-runtime:test-actor',
  actorReceiptId: 'actor-receipt:canonical-runtime-test',
})

describe('QL7 Support canonical production-shaped integration', () => {
  it('delivers reviewed Russian public-figure facts through the exact production realizer and keeps sparse profiles source-gated', async () => {
    const aristotle = await executeQl7SupportProductionTurn({
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
      actorReceiptId: TEST_ACTOR.actorReceiptId,
      requestId: 'integration:public-figure:aristotle',
      conversationId: 'integration:public-figure:aristotle',
      userTurnId: 'integration:public-figure:aristotle:user',
      selectedLocale: 'ru',
      originalText: 'кто такой Аристотель',
      now: '2026-08-23T10:00:00.000Z',
      seed: 'integration:public-figure:aristotle',
    })

    expect(aristotle.runtime.analysis).toMatchObject({
      topic: 'public_figures',
      publicFigureQuestionKind: 'stable_identity',
      publicFigureSourceResolution: { answerClaimAllowed: true, sourceVerified: true },
      publicFigureFactProjection: { ok: true, status: 'verified' },
    })
    expect(aristotle.runtime.analysis.generalTopic.publicFigure.selected.personId).toBe('aristotle')
    expect(aristotle.runtime.analysis.publicFigureFactProjection.facts).toHaveLength(4)
    expect(aristotle.delivery.text).toMatch(/Аристотель.*Древней Греции.*Никомахова этика/u)
    expect(aristotle.delivery.text).not.toMatch(/semantic facts|public_figures|philosopher and polymath/iu)
    expect(aristotle.runtime.qualityGate.decision).toBe('allow')

    const sparse = await executeQl7SupportProductionTurn({
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
      actorReceiptId: TEST_ACTOR.actorReceiptId,
      requestId: 'integration:public-figure:sparse',
      conversationId: 'integration:public-figure:sparse',
      userTurnId: 'integration:public-figure:sparse:user',
      selectedLocale: 'en',
      originalText: 'Who is Jacques Derrida?',
      now: '2026-08-23T10:00:00.000Z',
      seed: 'integration:public-figure:sparse',
    })
    expect(sparse.runtime.analysis.generalTopic.publicFigure.selected.personId).toBe('jacques-derrida')
    expect(sparse.runtime.analysis.publicFigureFactProjection.facts).toHaveLength(0)
    expect(sparse.delivery.text).not.toMatch(/philosopher|biography|deconstruction/iu)
  })

  it('isolates entry-greeting CAS while resuming the open topic through the production realizer bank', async () => {
    const entryInput = (suffix, recentVariantIds = []) => ({
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
      actorReceiptId: TEST_ACTOR.actorReceiptId,
      requestId: `integration:entry:${suffix}`,
      conversationId: `support-entry:integration:${suffix}`,
      caseId: `support-entry:integration:${suffix}`,
      userTurnId: `entry-event:integration:${suffix}`,
      sourceEventId: `entry-event:integration:${suffix}`,
      clientMutationId: `entry:integration:${suffix}`,
      idempotencyKey: `entry-delivery:integration:${suffix}`,
      selectedLocale: 'ru',
      routeId: 'dm.support-entry.post',
      sourceRouteId: 'dm.support-entry.post',
      sourceSurfaceId: 'messenger.support-entry',
      originalText: '',
      baseAnalysisTrust: true,
      analysis: {
        topic: 'support_system',
        messageAct: 'entry_greeting',
        socialAct: 'entry_greeting',
        confidence: 1,
        internalEvent: true,
      },
      route: { topic: 'support_system', messageAct: 'entry_greeting' },
      priorMemoryGraph: {},
      entryEvent: {
        type: 'entry_greeting',
        actorSeed: 'integration-entry-actor',
        entryMode: 'continue',
        entryNonce: suffix,
        entrySessionId: suffix,
        greetingReservationId: `greeting:${suffix}`,
        recentVariantIds,
        activeCaseId: 'case:wallet:open',
        activeCaseStatus: 'open',
        activeTopic: 'wallet',
        openQuestion: 'wallet_balance_scope',
        timeZone: 'Europe/Kyiv',
        now: Date.parse('2026-08-23T10:00:00.000Z'),
      },
      now: '2026-08-23T10:00:00.000Z',
      seed: `integration:entry:${suffix}`,
    })

    const first = await executeQl7SupportProductionTurn(entryInput('first'))
    const firstStrategyId = first.runtime.realized.entryGreetingReceipt.strategyId
    const second = await executeQl7SupportProductionTurn(entryInput('second', [firstStrategyId]))

    expect(first.runtime.memoryBefore).toMatchObject({
      conversationId: 'support-entry:integration:first',
      memoryVersion: 0,
    })
    expect(first.runtime.memoryGraph).toMatchObject({
      conversationId: 'support-entry:integration:first',
      memoryVersion: 1,
    })
    expect(first.runtime.contentPlan.allowedSecondaryDomainIds).toEqual(['wallet'])
    expect(first.runtime.realized.entryGreetingReceipt).toMatchObject({
      entryMode: 'continue',
      activeTopicId: 'wallet',
      activeTopicRemembered: true,
      hasOpenQuestion: true,
      finalTextStored: false,
    })
    expect(first.delivery.text).toContain('Quantum Wallet')
    expect(first.runtime.qualityGate.decision).toBe('allow')
    expect(second.runtime.realized.entryGreetingReceipt.strategyId).not.toBe(firstStrategyId)
    expect(second.delivery.text).toContain('Quantum Wallet')
  })

  it('runs semantic routing, sealed surface generation and independent oracle through the shared production adapter', async () => {
    const row = await executeQl7SupportScenario({
      id: 'integration:qcoin-theft',
      locale: 'ru',
      input: 'украли деньги с баланса qcoin',
      userId: 'integration-user',
      seed: 'integration-canonical',
      expected: { topic: 'qcoin', messageAct: 'incident_report', noAds: true },
    })
    expect(row.oracle.ok).toBe(true)
    expect(row.result.analysis.topic).toBe('qcoin')
    expect(/ads/iu.test(row.result.surface.table?.schema || '')).toBe(false)
    expect(row.evidence.surface.primarySvg.assetId).toBeTruthy()
    expect(row.productionTurn.delivery.topic).toBe('qcoin')
    expect(row.productionTurn.delivery.textHash).toBeTruthy()
    expect(row.productionTurn.delivery.surfaceHash).toBeTruthy()
    expect(row.productionDelivery.receipt.commitState).toBe('committed')
  })

  it('keeps explicit CryptoRadar product evidence above generic market-signal wording', async () => {
    const turn = await executeQl7SupportProductionTurn({
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
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

  it('keeps related product facts intact without weakening cross-domain isolation', async () => {
    const run = (id, originalText) => executeQl7SupportProductionTurn({
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
      actorReceiptId: TEST_ACTOR.actorReceiptId,
      requestId: `integration:product-knowledge:${id}`,
      conversationId: `integration:product-knowledge:${id}`,
      userTurnId: `integration:product-knowledge:${id}:user`,
      selectedLocale: 'ru',
      originalText,
      now: '2026-08-23T10:00:00.000Z',
      seed: `integration:product-knowledge:${id}`,
    })

    const aiBox = await run('ai-box', 'Что такое AI Box и как он работает')
    expect(aiBox.delivery.topic).toBe('exchange_ai')
    expect(aiBox.delivery.text).toMatch(/AI Box.*Quantum Exchange|Quantum Exchange.*AI Box/u)
    expect(aiBox.delivery.text).toMatch(/квот|VIP/u)
    expect(aiBox.delivery.text).toMatch(/образовательн.*не является финансовым советом/u)
    expect(aiBox.runtime.scopeReceipt.allowedDomainIds).toEqual(expect.arrayContaining(['exchange_ai', 'exchange', 'vip']))
    expect(aiBox.runtime.qualityGate.domainIsolation.decision).toBe('allow')

    const zigzag = await run('zigzag', 'Что такое Quantum Zigzag')
    expect(zigzag.delivery.topic).toBe('quantum_zigzag')
    expect(zigzag.delivery.text).toMatch(/планируемое направление.*QCoin/u)
    expect(zigzag.delivery.text).toMatch(/даты запуска нет/u)
    expect(zigzag.delivery.text).not.toMatch(/уточн|какую часть|что именно/u)
    expect(zigzag.runtime.scopeReceipt.allowedDomainIds).toContain('qcoin')
    expect(zigzag.runtime.qualityGate.domainIsolation.decision).toBe('allow')

    const gameverse = await run('gameverse', 'Расскажи про QL7 Gameverse и как им пользоваться')
    expect(gameverse.delivery.topic).toBe('gameverse')
    expect(gameverse.delivery.text).toMatch(/QL7 Gameverse.*QCoin/u)
    expect(gameverse.delivery.text).not.toContain('поддержка Gameverse')

    const messenger = await run('messenger', 'Как пользоваться Quantum Messenger')
    expect(messenger.delivery.topic).toBe('messenger')
    expect(messenger.delivery.text).toMatch(/Quantum Messenger.*службой поддержки/u)
    expect(messenger.delivery.text).not.toContain('поддержка Support')
    expect(messenger.runtime.qualityGate.decision).toBe('allow')
  })

  it('delivers a material answer for every ecosystem domain through the exact production runtime', async () => {
    expect(QL7_SUPPORT_ECOSYSTEM_TOPICS).toHaveLength(45)
    for (const [index, topic] of QL7_SUPPORT_ECOSYSTEM_TOPICS.entries()) {
      const label = getQl7SupportTopicLabel(topic, 'ru')
      const turn = await executeQl7SupportProductionTurn({
        mode: 'test',
        actor: TEST_ACTOR,
        verifiedActorId: TEST_ACTOR.canonicalAccountId,
        actorReceiptId: TEST_ACTOR.actorReceiptId,
        requestId: `integration:all-products:${topic}`,
        conversationId: `integration:all-products:${topic}`,
        userTurnId: `integration:all-products:${topic}:user`,
        selectedLocale: 'ru',
        originalText: `Что такое ${label} и как этим пользоваться?`,
        now: new Date(Date.parse('2026-08-23T10:00:00.000Z') + index * 1_000).toISOString(),
        seed: `integration:all-products:${topic}`,
      })

      expect(turn.delivery.topic, topic).toBe(topic)
      expect(['how_to_question', 'informational_question'], topic).toContain(turn.delivery.messageAct)
      expect(turn.runtime.analysis.requiresAdapter, topic).toBe(false)
      expect(turn.runtime.contentPlan.confirmationPending, topic).toBe(false)
      expect(turn.runtime.scopeReceipt.allowedDomainIds, topic).toContain(topic)
      expect(turn.runtime.realized.knowledgeReceipt?.domainNodeId, topic).toBeTruthy()
      expect([...turn.delivery.text].length, topic).toBeGreaterThan(80)
      expect(turn.runtime.qualityGate.decision, topic).toBe('allow')
      expect(turn.delivery.text, topic).not.toMatch(/что именно вас интересует|как это работает \/ текущий статус|не складывается в ясный запрос/iu)
    }
  }, 120_000)

  it('uses trusted pending production context for a bare denial without trusting normal stale routes', async () => {
    const turn = await executeQl7SupportProductionTurn({
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
      requestId: 'integration:no-new-fact',
      selectedLocale: 'ru',
      originalText: 'нет',
      priorMemoryGraph: {
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


  it('rejects post-runtime semantic mutation and commits the exact laboratory delivery', async () => {
    const row = await executeQl7SupportScenario({
      id: 'integration:final-delivery-parity',
      locale: 'en',
      input: 'Show my open support cases',
      seed: 'integration:final-delivery-parity',
      expected: { topic: 'support_system' },
    })
    expect(row.oracle.productionDeliveryParity.ok).toBe(true)
    expect(row.productionDelivery.receipt.commitState).toBe('committed')
    expect(row.evidence.text).toBe(row.productionDelivery.text)
    expect(row.evidence.surface.integrity.signature).toBe(row.productionDelivery.surfaceHash)
    expect(() => finalizeQl7SupportProductionDelivery({
      productionTurn: row.productionTurn,
      replyPlan: { ...row.productionTurn.replyPlan, text: 'Mutated after the quality gate.' },
    })).toThrow(/delivery_integrity_failed/u)
  })

  it('matches exact production and direct committed delivery projections', async () => {
    const row = await runQl7SupportProductionParityCase({
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
      requestId: 'integration:parity',
      selectedLocale: 'de',
      originalText: 'Wie benutze ich QCoin?',
      analysis: { topic: 'support_system' },
      route: { topic: 'support_system' },
      now: '2026-08-03T00:00:00.000Z',
      seed: 'integration:parity',
      localizeFinalDelivery: finalDeliveryLocalizer,
    })
    expect(row.ok).toBe(true)
    expect(row.runtimeInputParity).toBe(true)
    expect(row.deliveryParity).toBe(true)
    expect(row.production).toEqual(row.direct)
  })

  it('binds open-case choices to the actual case, actor, conversation and exact delivery', async () => {
    const secret = 'ql7-support-choice-production-parity-secret-0123456789'
    const input = {
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
      requestId: 'integration:bound-open-cases',
      conversationId: 'conversation:bound-open-cases',
      caseId: 'case-owner',
      selectedLocale: 'en',
      originalText: 'Show me the status of my open support cases.',
      analysis: { topic: 'support_system', messageAct: 'status_request' },
      route: { topic: 'support_system', messageAct: 'status_request' },
      baseAnalysisTrust: true,
      openCases: [
        { _id: 'case-wallet', topic: 'wallet', updatedAt: '2026-08-01T10:00:00.000Z' },
        { caseId: 'case-ads', topic: 'ads_campaigns', updatedAt: '2026-08-02T10:00:00.000Z' },
      ],
      verifiedActorId: 'actor:bound-open-cases',
      choiceSigningKey: secret,
      now: '2026-08-03T00:00:00.000Z',
      seed: 'integration:bound-open-cases',
    }
    const first = await executeQl7SupportProductionTurn(input)
    const replay = await executeQl7SupportProductionTurn(input)
    const options = first.delivery.surface.options

    expect(options.map((option) => option.semantic.caseId)).toEqual(['case-wallet', 'case-ads'])
    expect(options.every((option) => Boolean(option.signedToken))).toBe(true)
    expect(replay.delivery.surface).toEqual(first.delivery.surface)
    expect(replay.delivery.receipt.receiptHash).toBe(first.delivery.receipt.receiptHash)

    const expected = {
      deliveryBindingId: first.delivery.deliveryBindingId,
      scopeReceiptHash: first.runtime.scopeReceipt.receiptHash,
      conversationId: input.conversationId,
      locale: 'en',
    }
    await expect(verifyQl7SupportChoiceToken({
      token: options[0].signedToken,
      userId: input.verifiedActorId,
      secret,
      now: Date.parse(input.now) + 1_000,
      expected,
    })).resolves.toMatchObject({ ok: true, payload: { targetCaseId: 'case-wallet' } })
    await expect(verifyQl7SupportChoiceToken({
      token: options[0].signedToken,
      userId: input.verifiedActorId,
      secret,
      now: Date.parse(input.now) + 1_000,
      expected: { ...expected, deliveryBindingId: 'delivery-binding:other' },
    })).resolves.toMatchObject({ ok: false, error: 'choice_delivery_binding_mismatch' })
    await expect(verifyQl7SupportChoiceToken({
      token: options[0].signedToken,
      userId: 'actor:other',
      secret,
      now: Date.parse(input.now) + 1_000,
      expected,
    })).resolves.toMatchObject({ ok: false, error: 'choice_wrong_user' })
  })

  it('switches across material and human topics, then resumes the named ads frame with bounded coreference', async () => {
    const texts = [
      'покажи метрики моей рекламы',
      'расскажи про MetaMarket',
      'как дела?',
      'кто такой Аристотель',
      'вернемся к рекламным метрикам',
      'покажи их за неделю',
    ]
    const turns = []
    let priorMemoryGraph = null

    for (const [index, originalText] of texts.entries()) {
      const turn = await executeQl7SupportProductionTurn({
        mode: 'test',
        actor: TEST_ACTOR,
        verifiedActorId: TEST_ACTOR.canonicalAccountId,
        actorReceiptId: TEST_ACTOR.actorReceiptId,
        requestId: `integration:topic-resume:${index}`,
        conversationId: 'integration:topic-resume',
        userTurnId: `integration:topic-resume:user:${index}`,
        selectedLocale: 'ru',
        originalText,
        priorMemoryGraph,
        now: new Date(Date.parse('2026-08-03T00:00:00.000Z') + index * 1_000).toISOString(),
        seed: `integration:topic-resume:${index}`,
      })
      turns.push(turn)
      priorMemoryGraph = turn.runtime.memoryGraph
    }

    expect(turns.map((turn) => turn.runtime.analysis.topic)).toEqual([
      'ads_campaigns',
      'metamarket',
      'support_system',
      'public_figures',
      'ads_campaigns',
      'ads_campaigns',
    ])
    expect(turns[4].runtime.transition).toMatchObject({
      transitionType: 'resume_by_explicit_reference',
      nextDomainId: 'ads_campaigns',
    })
    expect(turns[5].runtime.transition.transitionType).toBe('continue_current')
    expect(turns[5].runtime.analysis.coreference).toMatchObject({
      resolvedFromMemory: true,
      topicId: 'ads_campaigns',
    })
    expect(turns[5].runtime.analysis.intentConfirmation).toMatchObject({
      state: 'confirmed',
      adapterAuthorized: true,
      adapterOperationId: 'campaign_metrics',
      slotValues: { domainId: 'ads_campaigns', operationId: 'campaign_metrics' },
    })
    expect(turns[5].runtime.analysis.requiresAdapter).toBe(true)
    expect(turns[5].runtime.memoryGraph.topicFrames[turns[5].runtime.memoryGraph.activeTopicFrameId].domainId).toBe('ads_campaigns')
  })

  it('delivers every verified campaign row from the production diagnostic receipt to one signed DM table', async () => {
    const turn = await executeQl7SupportProductionTurn({
      mode: 'test',
      actor: TEST_ACTOR,
      verifiedActorId: TEST_ACTOR.canonicalAccountId,
      actorReceiptId: TEST_ACTOR.actorReceiptId,
      requestId: 'integration:ads-metrics-table',
      conversationId: 'integration:ads-metrics-table',
      userTurnId: 'integration:ads-metrics-table:user',
      selectedLocale: 'ru',
      originalText: 'покажи метрики моей рекламы',
      authoritativeAnalysis: true,
      baseAnalysisTrust: true,
      analysis: {
        topic: 'ads_campaigns',
        messageAct: 'personal_status_request',
        subIntent: 'ads_campaigns_metrics',
        confidence: 1,
        intentConfirmation: {
          state: 'confirmed',
          adapterAuthorized: true,
          adapterOperationId: 'campaign_metrics',
          slotValues: { domainId: 'ads_campaigns', operationId: 'campaign_metrics' },
        },
      },
      route: { topic: 'ads_campaigns', messageAct: 'personal_status_request' },
      diagnosticResult: {
        ok: true,
        topic: 'ads',
        branch: 'ads_metrics_ok',
        status: 'healthy',
        checkedAt: '2026-08-23T10:00:00.000Z',
        evidence: {
          campaignCount: 2,
          impressions: 1500,
          clicks: 60,
          ctr: 0.04,
          campaignRows: [
            { campaignId: 'cmp-a', campaignName: 'Alpha', status: 'active', impressions: 1000, clicks: 40, ctr: 0.04, updatedAt: '2026-08-23T09:59:00.000Z' },
            { campaignId: 'cmp-b', campaignName: 'Beta', status: 'active', impressions: 500, clicks: 20, ctr: 0.04, updatedAt: '2026-08-23T09:59:00.000Z' },
          ],
        },
      },
      now: '2026-08-23T10:00:00.000Z',
      seed: 'integration:ads-metrics-table',
    })

    expect(turn.runtime.factProjection.facts.campaigns).toHaveLength(2)
    expect(turn.runtime.qualityGate.surfaceRedundancy).toMatchObject({ ok: true, failures: [] })
    expect(turn.delivery.surface.table).toMatchObject({
      schema: 'ql7.table.ads.campaigns.matrix',
      layout: 'matrix',
      columns: expect.arrayContaining([
        expect.objectContaining({ key: 'campaign' }),
        expect.objectContaining({ key: 'views', format: 'integer' }),
        expect.objectContaining({ key: 'ctr', format: 'percent' }),
      ]),
    })
    expect(turn.delivery.surface.table.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ campaign: 'Alpha', views: 1000, clicks: 40, ctr: 0.04 }),
      expect.objectContaining({ campaign: 'Beta', views: 500, clicks: 20, ctr: 0.04 }),
    ]))
    expect(turn.delivery.text).toMatch(/Проверенные данные|Сведения/u)
    expect(turn.delivery.text).not.toMatch(/source receipt|read-only|adapter|intent/iu)
  })
})
