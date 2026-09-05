import {describe, expect, it} from 'vitest'
import {executeQl7SupportTurnRuntime} from '../../../lib/ql7-support/runtime/executeTurn.js'
import {analyzeQl7SupportTurn} from '../../../lib/ql7-support/semantics/analyzeTurn.js'
import {
  getQl7SupportProductKnowledgeRealizerCoverage,
  realizeQl7SupportProductKnowledge,
} from '../../../lib/ql7-support/response/productKnowledgeRealizer.js'
import {getQl7SupportKnowledgeAnswer} from '../../../lib/ql7-support/knowledgeRegistry.js'
import {QL7_SUPPORT_ECOSYSTEM_TOPICS} from '../../../lib/ql7-support/ecosystemCatalog.js'

const now = '2026-08-23T10:00:00.000Z'

function analyze(text, locale = 'ru', previousContext = {}) {
  return analyzeQl7SupportTurn({
    text,
    locale,
    conversationId: `pragmatic:${locale}`,
    turnId: `turn:${text}`,
    previousContext,
    now,
  }).analysis
}

function run(text, locale = 'ru') {
  return executeQl7SupportTurnRuntime({
    mode: 'test',
    requestId: `pragmatic:${locale}:${text}`,
    userTurnId: `user:${locale}:${text}`,
    selectedLocale: locale,
    text,
    now,
  })
}

describe('QL7 Support pragmatic context owner', () => {
  it('separates product discussion, purchase guidance and personal reads', () => {
    const overview = analyze('Расскажи про MetaMarket')
    expect(overview).toMatchObject({
      topic: 'metamarket',
      messageAct: 'informational_question',
      requiresAdapter: false,
      userClarificationRequired: false,
    })
    expect(overview.pragmaticFrame).toMatchObject({
      topGoalId: 'explain_overview',
      clearSafeGoal: true,
      sensitiveGoal: false,
    })

    const purchase = analyze('Как купить QCoin?')
    expect(purchase).toMatchObject({
      topic: 'qcoin',
      messageAct: 'how_to_question',
      requiresAdapter: false,
      userClarificationRequired: false,
    })
    expect(purchase.intentConfirmation.state).toBe('not_required')

    const read = analyze('Покажи мой баланс QCoin')
    expect(read).toMatchObject({
      topic: 'qcoin',
      messageAct: 'personal_status_request',
      requiresAdapter: true,
      userClarificationRequired: false,
    })
    expect(read.intentConfirmation).toMatchObject({state: 'confirmed', adapterAuthorized: true})
  })

  it('separates crypto discussion from current price and AI analysis', () => {
    const discussion = analyze('Что думаешь про перспективы битка?')
    expect(discussion).toMatchObject({
      topic: 'bitcoin',
      messageAct: 'general_knowledge_question',
      requiresAdapter: false,
      userClarificationRequired: false,
    })
    expect(discussion.pragmaticFrame.topGoalId).toBe('opinion_discussion')

    const currentPrice = analyze('Сколько сейчас стоит биток?')
    expect(currentPrice).toMatchObject({
      topic: 'exchange_ai',
      messageAct: 'ai_recommendation_request',
      requiresAdapter: true,
      userClarificationRequired: false,
    })
    expect(currentPrice.pragmaticFrame.topGoalId).toBe('current_market_fact')
    expect(currentPrice.intentConfirmation).toMatchObject({state: 'confirmed', adapterOperationId: 'current_price'})

    const vague = analyze('биток')
    expect(vague).toMatchObject({
      messageAct: 'ambiguous_request',
      requiresAdapter: false,
      userClarificationRequired: true,
    })
  })

  it('keeps internal prelab uncertainty auditable without forcing safe user clarification', () => {
    const safe = analyze('Что такое блокчейн простыми словами?')
    expect(safe.semanticAbstentionRequired).toBe(true)
    expect(safe.calibrationStatus).toBe('PRELAB_UNCALIBRATED')
    expect(safe.userClarificationRequired).toBe(false)
    expect(safe.answerabilityDecision).toMatchObject({
      directSafe: true,
      semanticUncertaintyPreserved: true,
      reasonCode: 'answer-with-bounded-evidence',
    })
  })

  it('keeps meaningless fragments and vague owned domains out of adapters', () => {
    const noise = analyze('.')
    expect(noise).toMatchObject({messageAct: 'spam_or_noise', requiresAdapter: false, userClarificationRequired: true})
    expect(noise.pragmaticFrame.topGoalId).toBe('meaningless_fragment')

    const ads = analyze('моя реклама')
    expect(ads).toMatchObject({topic: 'ads_campaigns', messageAct: 'ambiguous_request', requiresAdapter: false})
    expect(ads.intentConfirmation.state).toBe('collecting')
  })

  it('realizes connected human-facing product and stable-knowledge answers through production runtime', () => {
    const qcoin = run('Как купить QCoin?')
    expect(qcoin.discoursePlan.branchId).toBe('knowledge.answer')
    expect(qcoin.text).toMatch(/Quantum Wallet|плат[её]жн|зачислен/iu)
    expect(qcoin.text).not.toMatch(/соответствующий элемент|поддержка Support/iu)

    const metamarket = run('Расскажи про MetaMarket')
    expect(metamarket.text).toMatch(/цифровые предметы|владение|квитанц/iu)
    expect(metamarket.scopeReceipt.allowedDomainIds).toEqual(expect.arrayContaining(['metamarket', 'qcoin']))

    const blockchain = run('Что такое блокчейн простыми словами?')
    expect(blockchain.discoursePlan.branchId).toBe('dialogue.general-knowledge')
    expect(blockchain.text).toMatch(/блок|транзакц|узл|реестр|криптограф/iu)
    expect(blockchain.text).not.toMatch(/поддержка Support|выбранн.*вопрос/iu)

    const change = run('Почему люди боятся перемен?')
    expect(change.text).toMatch(/неопредел[её]нност|потер.*контрол|обратим.*шаг/iu)
  })

  it('has material semantic clauses for every native realization locale', () => {
    expect(getQl7SupportProductKnowledgeRealizerCoverage()).toMatchObject({
      ok: true,
      topics: 45,
      locales: 8,
      semanticClauseCount: 720,
      failures: [],
    })
    expect(QL7_SUPPORT_ECOSYSTEM_TOPICS).toHaveLength(45)
    for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
      const answer = getQl7SupportKnowledgeAnswer({topic, intent: 'how_to_question', locale: 'en'})
      expect(answer, topic).toBeTruthy()
      for (const locale of ['en','ru','uk','es','tr','ar','zh','he']) {
        const realized = realizeQl7SupportProductKnowledge({answer, locale, intent: 'how_to', seed: `${topic}:${locale}`})
        expect(realized.supported, `${topic}:${locale}`).toBe(true)
        expect(realized.fragments, `${topic}:${locale}`).toHaveLength(2)
        expect([...realized.text].length, `${topic}:${locale}`).toBeGreaterThan(locale === 'zh' ? 35 : 70)
      }
    }
  })
})
