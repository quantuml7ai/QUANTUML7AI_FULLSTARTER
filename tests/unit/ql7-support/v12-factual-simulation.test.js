import { describe, expect, test } from 'vitest'
import {
  buildQl7SupportSafetyEscalationV12,
  assertQl7SupportNoRawIdentityRequestV12,
  assertQl7SupportBattleExpansionReadyV12,
  buildQl7SupportBattleSemanticInputV12,
  composeQl7SupportAdaptiveResponseV12,
  critiqueQl7SupportResponseV12,
  executeQl7SupportFactualScenarioV12,
  getQl7SupportAdaptiveResponseVariationStatsV12,
  getQl7SupportBattleExpansionStatsV12,
  getQl7SupportSemanticOntologyStatsV12,
  iterateQl7SupportFactualSimulationScenariosV12,
  localizeQl7SupportOutputV12,
  normalizeQl7SupportFactualSimulationConfigV12,
  composeQl7SupportAdminReportRuV12,
  renderQl7SupportAdminReportRuHtmlV12,
  buildQl7SupportPremiumCardV12,
  evaluateQl7SupportSafeLearningGateV12,
  getQl7SupportSafeLearningCalibrationStatsV12,
} from '../../../lib/ql7-support/v12/index.js'
import { evaluateQl7SupportIndependentOracleV12 } from '../../../lib/ql7-support/v12/independentReferenceOracleV12.js'
import { localizeQl7SemanticBadgeLabelV11_6 } from '../../../lib/ql7-support/semanticBadgeRegistryV11_6.js'
import { QL7_SUPPORT_SIMULATION_TOPICS_V11 } from '../../../lib/ql7-support/simulationOntologyV11.js'
import { presentQl7SupportDiagnostic } from '../../../lib/ql7-support/diagnosticPresentation.js'
import { buildQl7SupportIntentHypotheses } from '../../../lib/ql7-support/intentHypothesisEngine.js'
import { buildQl7SupportInputPolicy } from '../../../lib/ql7-support/inputPolicy.js'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { assessQl7SupportTone } from '../../../lib/ql7-support/toxicityEngine.js'

const MACHINE_TONE_PATTERN = /(?:safe account context|current session context|current user context|visible state|visible status|old branch|previous branch|topic changed|single concrete detail|current result matters|the wording should survive|emotion is treated as signal|internal reference code|product evidence|record is missing|держу\s+безопасн|безопасн\w*\s+контекст|текущ\w*\s+контекст|видим\w*\s+(?:статус|состояние)|стар\w*\s+ветк|старая\s+тема|старую\s+тему|если\s+тема\s+сменилась|если\s+тема\s+поменялась|одной\s+конкретной\s+детал|внутренн\w*\s+код|запись\s+не\s+найдена)/iu

const META_SCAFFOLD_PATTERN = /(?:user goal ahead|formal wording|strategic signal|generic ticket|not a reason to open a long questionnaire|here is the useful answer|the practical answer is|what matters now|so i would answer it this way|the useful part is|the user goal is the anchor|verified login|privacy-safe facts|same thread without making you restart|i use it to choose|i will keep this compact|i read the main topic as|a strong support answer should reduce uncertainty)/iu

describe('QL7 Support V12 factual simulation architecture', () => {
  test('publishes a 10k+ ontology over the 32-language corpus', () => {
    const stats = getQl7SupportSemanticOntologyStatsV12()
    expect(stats.nodeCount).toBeGreaterThanOrEqual(10000)
    expect(stats.languageCount).toBe(32)
    expect(stats.battleExpansion.readyForBattlePreflight).toBe(true)
    expect(stats.responseVariation.maxDraftGraphemes).toBe(400)
    expect(stats.responseVariation.estimatedResponseCombinations).toBeGreaterThanOrEqual(100000)
    expect(stats.responseVariation.jokeSemanticCombinationFloor).toBeGreaterThanOrEqual(100000)
    expect(stats.responseVariation.humanToneFirst).toBe(true)
    expect(stats.safeLearning.protectsAgainstOneDialoguePoisoning).toBe(true)
    expect(stats.meetsV12Minimum).toBe(true)
  })

  test('builds adaptive answer variants for all support topics while enforcing the 400-grapheme production ceiling', () => {
    const stats = getQl7SupportAdaptiveResponseVariationStatsV12()
    expect(stats.maxDraftGraphemes).toBe(400)
    expect(stats.visibleMaxGraphemes).toBe(400)
    expect(stats.productionVisibleOutputBounded).toBe(true)
    expect(stats.supportsLargeDrafts).toBe(false)
    expect(stats.axisCounts.topicCoverage).toBe(QL7_SUPPORT_SIMULATION_TOPICS_V11.length)
    const variants = new Set()
    const locales = ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he']
    for (let index = 0; index < QL7_SUPPORT_SIMULATION_TOPICS_V11.length * 2; index += 1) {
      const topic = QL7_SUPPORT_SIMULATION_TOPICS_V11[index % QL7_SUPPORT_SIMULATION_TOPICS_V11.length]
      const locale = locales[index % locales.length]
      const messageAct = index % 5 === 0 ? 'personal_status_request' : index % 5 === 1 ? 'how_to_question' : index % 5 === 2 ? 'incident_report' : index % 5 === 3 ? 'partnership_request' : 'informational_question'
      const result = composeQl7SupportAdaptiveResponseV12({
        baseText: locale === 'ru'
          ? `Проверю тему ${topic} по данным вашей сессии без лишних служебных деталей.`
          : `I will check ${topic} through your session details without asking for extra reference details.`,
        route: { topic, messageAct },
        tone: { taxonomyCategory: index % 3 === 0 ? 'complaint' : 'calm' },
        locale,
        sourceText: locale === 'ru' ? 'поясни по-человечески, пожалуйста' : 'please explain it in a human way',
        seed: `adaptive-unit-${index}`,
        responseMode: index % 4 === 0 ? 'financial_status' : index % 4 === 1 ? 'guided_steps' : index % 4 === 2 ? 'business_intake' : 'compact_fact',
        targetGraphemes: 1400,
      })
      expect(result.budget.graphemes).toBeLessThanOrEqual(400)
      expect(result.text).not.toMatch(/(?:пришл|укаж|назови).{0,80}(?:id|идентификатор|айди)/iu)
      expect(result.text).not.toMatch(/\b(?:id|ids|identifier|identifiers|attach|attached|screenshot|screen)\b/iu)
      expect(result.text).not.toMatch(/(?:идентификатор|айди|прикреп|скриншот|экран)/iu)
      expect(result.text).not.toMatch(MACHINE_TONE_PATTERN)
      expect(result.text).not.toMatch(META_SCAFFOLD_PATTERN)
      expect(critiqueQl7SupportResponseV12({ text: result.text, locale }).ok).toBe(true)
      expect(assertQl7SupportNoRawIdentityRequestV12(result.text).ok).toBe(true)
      expect(result.topic).toBeTruthy()
      variants.add(result.text)
    }
    expect(variants.size).toBeGreaterThanOrEqual(QL7_SUPPORT_SIMULATION_TOPICS_V11.length)
  })

  test('removes meta scaffolding phrases from user-visible adaptive answers', () => {
    const result = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Here is the useful answer: Tell me Which Academy detail should I use first: what you see now, last action, approximate time, expected result?',
      route: { topic: 'academy', messageAct: 'informational_question' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'en',
      sourceText: 'No, I mean Quantum Academy lessons and progress. If this is material, pass the context to an operator.',
      seed: 'unit-v12-no-meta-scaffold',
      targetGraphemes: 900,
    })
    expect(result.text).not.toMatch(META_SCAFFOLD_PATTERN)
    expect(result.text).not.toMatch(/Tell me Which|One detail will help: Which/u)
    expect(result.text).toMatch(/Academy|what you see now|last action|approximate time|expected result/iu)
    expect(critiqueQl7SupportResponseV12({ text: result.text, locale: 'en' }).ok).toBe(true)
  })

  test('marks Kazakh as a provider locale and never accepts an untranslated fallback for display', () => {
    const result = composeQl7SupportAdaptiveResponseV12({
      baseText: 'No, I mean Quantum Academy lessons and progress.',
      route: { topic: 'academy', messageAct: 'incident_report' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'kk',
      sourceText: 'Неліктен Quantum Academy lessons and progress менде жұмыс істемейді? урок QL7',
      seed: 'unit-v12-kk-provider-contract',
    })
    expect(result).toMatchObject({ locale: 'kk', topic: 'academy', providerLocale: true, nativeLocale: false, requiresProviderTranslation: true, providerFallbackAccepted: false, acceptedForDisplay: false })
    expect(result.text).not.toMatch(META_SCAFFOLD_PATTERN)
  })

  test('keeps provider-locale Academy compatibility isolated from operator and business routing', () => {
    const result = composeQl7SupportAdaptiveResponseV12({
      baseText: 'No, I mean Quantum Academy lessons and progress.',
      route: { topic: 'academy', messageAct: 'incident_report' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'kk',
      sourceText: 'No, I mean Quantum Academy lessons and progress. / please verify урок QL7',
      seed: 'unit-v12-kk-academy-no-operator-business-bleed',
    })
    expect(result).toMatchObject({ topic: 'academy', conversationMode: 'content_first', providerLocale: true, acceptedForDisplay: false })
    expect(result.text).not.toMatch(/\b(?:operator|business|strategic|team|administration|human review)\b/iu)
    expect(result.text).not.toMatch(META_SCAFFOLD_PATTERN)
  })

  test('keeps learning intent while provider-locale output remains gated pending structured translation', () => {
    const result = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Safe self-learning can improve support from broad dialogue experience.',
      route: { topic: 'learning_governance', messageAct: 'learning_governance_request' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'kk',
      sourceText: 'Система диалогтардан шынымен үйрене ме, бір адам оны бұза ала ма?',
      seed: 'unit-v12-kk-learning-provider-contract',
    })
    expect(result).toMatchObject({ conversationMode: 'learning', providerLocale: true, requiresProviderTranslation: true, providerFallbackAccepted: false, acceptedForDisplay: false })
    expect(result.text).not.toMatch(/\b(?:shadow|canary|rollback|offline|privacy_review|poisoning_review)\b/iu)
  })

  test('does not classify friendly bro/topic wording as a Turkish profanity substring', () => {
    const text = 'I mean QL7 Support capabilities and scope. Local wording: bro; same topic: саппорт.'
    const tone = assessQl7SupportTone({ text, language: 'en' })
    expect(tone.taxonomyCategory).toBe('neutral')
    expect(tone.profanityHits).not.toContain('pic')
  })

  test('answers Kazakh safe self-learning requests natively and without internal stage names', () => {
    const result = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Safe self-learning can improve support from broad dialogue experience.',
      route: { topic: 'learning_governance', messageAct: 'learning_governance_request' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'kk',
      sourceText: 'Система диалогтардан шынымен үйрене ме, бір адам оны бұза ала ма?',
      seed: 'unit-v12-kk-learning-native',
      targetGraphemes: 900,
    })
    expect(result.conversationMode).toBe('learning')
    expect(result.text).toMatch(/[ӘәҒғҚқҢңӨөҰұҮүІі]/u)
    expect(result.text).not.toMatch(/\b(?:shadow|canary|rollback|offline|privacy_review|poisoning_review)\b/iu)
    expect(result.text).not.toMatch(/\b(?:Yes|Support can|Personal details are not used)\b/iu)
    expect(critiqueQl7SupportResponseV12({ text: result.text, locale: 'kk' }).ok).toBe(true)
  })

  test('honors explicit Telegram Mini App correction instead of retaining previous system-status topic', () => {
    const text = 'Hayır, Telegram Mini App konusunu kastediyorum.. If this is material, pass the context to an operator. TMA mini app.'
    const route = routeQl7SupportMessage({
      text,
      locale: 'tr',
      previousContext: {
        topic: 'system_status',
        previousTopic: 'system_status',
        currentQuestionCode: 'system_status_anchor',
      },
      baseAnalysis: {
        topic: 'system_status',
        role: 'denial',
        text,
      },
      tone: { taxonomyCategory: 'neutral' },
    })
    expect(route.topic).toBe('telegram')
    expect(route.topicSwitchDecision).toBe('switch')
    expect(route.domainPlan.topic).toBe('telegram')
  })

  test('keeps explicit runtime status primary when keyboard navigation is only accessibility context', () => {
    const text = 'No, I mean current runtime status and availability. Also keep it readable for keyboard navigation and assistive flow. system status.'
    const intent = buildQl7SupportIntentHypotheses({ text, locale: 'en' })
    expect(intent.top.topic).toBe('system_status')
    expect(intent.matchedEvidence).toEqual(expect.arrayContaining(['priority:system_status_primary_anchor']))
    expect(intent.alternatives).toEqual(expect.arrayContaining(['navigation']))
  })

  test('keeps social small talk warm without leaking internal process wording', () => {
    const result = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Рад общению. Можем немного поговорить, а потом перейти к вопросу по QL7.',
      route: { topic: 'support_system', messageAct: 'casual_chat' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'ru',
      sourceText: 'брат, как дела? ты похоже умнеешь каждый день, приятно общаться',
      seed: 'unit-v12-warm-social',
    })
    expect(result.conversationMode).toBe('social')
    expect(result.text).toMatch(/(?:брат|бро|рад|приятно|жив|тепл)/iu)
    expect(result.text).not.toMatch(MACHINE_TONE_PATTERN)
    expect(critiqueQl7SupportResponseV12({ text: result.text, locale: 'ru' }).ok).toBe(true)
  })

  test('explains real safe self-learning without allowing one or a few dialogues to rewrite behavior', () => {
    const stats = getQl7SupportSafeLearningCalibrationStatsV12()
    expect(stats.requiresCrossUserQuorum).toBe(true)
    expect(stats.requiresShadowAndCanary).toBe(true)

    const narrow = evaluateQl7SupportSafeLearningGateV12({
      samples: Array.from({ length: 20 }, (_, index) => ({
        userIdHash: `same-user-${index % 2}`,
        topic: 'support_system',
        sourceLocale: 'ru',
        clusterKey: 'one-repeat-cluster',
        poisoningRisk: 0,
        consent: true,
      })),
      candidateMetrics: {
        truthfulness: 1,
        privacy: 1,
        safety: 1,
        repetition: 1,
        grammar: 1,
        localizationCoverage: 1,
        humanToneWinRate: 1,
        regressionDelta: 0.01,
        hallucinationRate: 0,
        errorRate: 0,
      },
      completedStages: ['privacy_review', 'poisoning_review', 'offline_simulation', 'regression_compare', 'shadow', 'canary'],
    })
    expect(narrow.allowed).toBe(false)
    expect(narrow.blockers).toEqual(expect.arrayContaining(['insufficient_dialogue_mass', 'insufficient_independent_users', 'insufficient_language_breadth', 'insufficient_topic_breadth']))

    const broad = evaluateQl7SupportSafeLearningGateV12({
      samples: Array.from({ length: 400 }, (_, index) => ({
        userIdHash: `user-${index}`,
        topic: QL7_SUPPORT_SIMULATION_TOPICS_V11[index % QL7_SUPPORT_SIMULATION_TOPICS_V11.length],
        sourceLocale: ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'][index % 8],
        clusterKey: `cluster-${index % 80}`,
        poisoningRisk: 0,
        consent: true,
      })),
      candidateMetrics: {
        truthfulness: 1,
        privacy: 1,
        safety: 1,
        repetition: 1,
        grammar: 1,
        localizationCoverage: 1,
        humanToneWinRate: 1,
        regressionDelta: 0.02,
        hallucinationRate: 0,
        errorRate: 0,
      },
      completedStages: ['privacy_review', 'poisoning_review', 'offline_simulation', 'regression_compare', 'shadow', 'canary'],
    })
    expect(broad.allowed).toBe(true)
    expect(broad.oneOrFewDialoguesCanPromote).toBe(false)

    const route = buildQl7SupportIntentHypotheses({
      text: 'Брат, ты реально учишься на диалогах или один человек может сломать твою самокалибровку?',
      locale: 'ru',
    })
    expect(route.top.topic).toBe('learning_governance')

    const answer = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Обучение проходит через обезличенные сигналы, offline evaluation, shadow, canary и rollback.',
      route: { topic: 'learning_governance', messageAct: 'learning_governance_request' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'ru',
      sourceText: 'Брат, ты реально учишься на диалогах или один человек может сломать твою самокалибровку?',
      seed: 'unit-v12-learning-governance',
    })
    expect(answer.conversationMode).toBe('learning')
    expect(answer.text).toMatch(/(?:реальном опыте общения|опыт живых диалогов|один человек|один диалог|не могут поменять|не могут продавить|широком независимом опыте|новым правилом)/iu)
    expect(answer.text).not.toMatch(/(?:shadow|canary|rollback|privacy[_\s-]?review|poisoning[_\s-]?review|offline evaluation|кворум|карантин|контур)/iu)
    expect(answer.text).not.toMatch(MACHINE_TONE_PATTERN)
    expect(critiqueQl7SupportResponseV12({ text: answer.text, locale: 'ru' }).ok).toBe(true)
  })

  test('answers joke requests with an actual light joke and returns to useful support scope', () => {
    const result = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Могу пошутить коротко и потом помочь с вопросом по экосистеме QL7.',
      route: { topic: 'support_system', messageAct: 'humor_play' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'ru',
      sourceText: 'расскажи анекдот, только добрый',
      seed: 'unit-v12-joke',
    })
    expect(result.conversationMode).toBe('humor')
    expect(result.text).toMatch(/(?:анекдот|шутк|улыб|смеш)/iu)
    expect(result.text).not.toMatch(MACHINE_TONE_PATTERN)
    expect(critiqueQl7SupportResponseV12({ text: result.text, locale: 'ru' }).ok).toBe(true)
  })

  test('handles partnership and investment requests as warm strategic admin intake', () => {
    const result = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Администрация сможет рассмотреть обращение после краткого описания идеи и удобного контакта.',
      route: { topic: 'contact', messageAct: 'partnership_request' },
      tone: { taxonomyCategory: 'calm' },
      locale: 'ru',
      sourceText: 'хочу инвестировать и обсудить партнёрство с администрацией, вижу будущее проекта',
      seed: 'unit-v12-partnership',
      responseMode: 'business_intake',
    })
    expect(result.conversationMode).toBe('partnership')
    expect(result.text).toMatch(/(?:будущее|сотруднич|администрац|контакт|партн|инвест)/iu)
    expect(result.text).not.toMatch(MACHINE_TONE_PATTERN)
    expect(critiqueQl7SupportResponseV12({ text: result.text, locale: 'ru' }).ok).toBe(true)
  })

  test('expands real battle-language inputs across topics, modes, and supported languages', () => {
    const ready = assertQl7SupportBattleExpansionReadyV12()
    const stats = getQl7SupportBattleExpansionStatsV12()
    expect(ready.ok).toBe(true)
    expect(ready.missingTopics).toEqual([])
    expect(stats.coveredTopicCount).toBe(stats.topicCount)
    expect(stats.languageCount).toBe(32)
    expect(stats.semanticCombinationFloor).toBeGreaterThanOrEqual(10000)
    const expanded = buildQl7SupportBattleSemanticInputV12({
      text: 'Проверь мой баланс QCoin без запроса ID',
      topic: 'qcoin',
      locale: 'ru',
      pairIndex: 7,
      scenarioId: 'unit-semantic-battle',
    })
    expect(expanded.classifierOnly).toBe(false)
    expect(expanded.actualQuestion).toBe(true)
    expect(expanded.topic).toBe('qcoin')
    expect(expanded.text).not.toBe(expanded.originalText)
    expect(expanded.signals).toEqual(expect.arrayContaining(['qcoin', 'ru', expanded.mode]))
  })

  test('requires an explicit safety flag for the Ultimate 50M mode', () => {
    expect(() => normalizeQl7SupportFactualSimulationConfigV12({ mode: 'ultimate', count: 50000000 })).toThrow(/allow-ultimate/)
    expect(normalizeQl7SupportFactualSimulationConfigV12({ mode: 'ultimate', count: 50000000, allowUltimate: true }).count).toBe(50000000)
  })

  test('normalizes the V12 runner flags required for checkpoint, browser, and live-smoke contours', () => {
    const config = normalizeQl7SupportFactualSimulationConfigV12({
      mode: 'quick',
      count: 10,
      resume: true,
      checkpointDir: 'reports/checkpoints',
      baseUrl: 'http://localhost:3000',
      cdpUrl: 'ws://localhost:9222/devtools/browser/test',
      liveSmoke: true,
      browserAcceptance: true,
    })
    expect(config).toMatchObject({
      resume: true,
      checkpointDir: 'reports/checkpoints',
      baseUrl: 'http://localhost:3000',
      cdpUrl: 'ws://localhost:9222/devtools/browser/test',
      liveSmoke: true,
      browserAcceptance: true,
    })
  })

  test('uses the V12 moderation ladder: first warning, second 60s, third 5m, threat 30m plus operator', () => {
    const rudeTone = { profane: true, hostile: true, insult: true, taxonomyCategory: 'insult_to_support' }
    expect(buildQl7SupportSafetyEscalationV12({ tone: rudeTone, priorRudeCount: 0 })).toMatchObject({ action: 'warn', cooldownMs: 0, operatorHandoff: false })
    expect(buildQl7SupportSafetyEscalationV12({ tone: rudeTone, priorRudeCount: 1 })).toMatchObject({ action: 'cooldown', cooldownMs: 60000 })
    expect(buildQl7SupportSafetyEscalationV12({ tone: rudeTone, priorRudeCount: 2 })).toMatchObject({ action: 'cooldown', cooldownMs: 300000 })
    expect(buildQl7SupportSafetyEscalationV12({ tone: { threat: true, safetyEscalation: true } })).toMatchObject({ action: 'safety_review', cooldownMs: 1800000, operatorHandoff: true })
  })

  test('humanizes rude and threat reactions while keeping firm safety boundaries', () => {
    const rudeTone = { profane: true, hostile: true, insult: true, taxonomyCategory: 'insult_to_support' }
    const rude = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Давайте сохраним уважительный тон.',
      route: { topic: 'support_system', messageAct: 'profanity_with_request' },
      tone: rudeTone,
      locale: 'ru',
      sourceText: 'ты тупой, проверь почему реклама не работает',
      seed: 'unit-v12-rude-human-boundary',
    })
    expect(rude.conversationMode).toBe('safety')
    expect(rude.text).toMatch(/(?:Слышу|помогу|проблем|факт|без оскорб|тон)/iu)
    expect(rude.text).not.toMatch(/(?:контур|policy|old branch|single concrete detail|текущ\w*\s+контекст|стар\w*\s+ветк)/iu)
    expect(rude.text).not.toMatch(/(?:угроз|опасност|пауза|проверку безопасности|реальная срочная опасность)/iu)
    expect(critiqueQl7SupportResponseV12({ text: rude.text, locale: 'ru' }).ok).toBe(true)

    const threatTone = { threat: true, safetyEscalation: true, taxonomyCategory: 'threat' }
    const threat = composeQl7SupportAdaptiveResponseV12({
      baseText: 'Я не могу продолжать разговор с угрозами.',
      route: { topic: 'support_system', messageAct: 'threat' },
      tone: threatTone,
      locale: 'ru',
      sourceText: 'я тебя убью если не починишь баланс',
      seed: 'unit-v12-threat-human-boundary',
    })
    expect(threat.conversationMode).toBe('safety')
    expect(threat.text).toMatch(/(?:не продолжу|угроз|пауза|безопас|реальная срочная опасность|продукт)/iu)
    expect(threat.text).not.toMatch(/(?:контур|policy|old branch|single concrete detail|текущ\w*\s+контекст|стар\w*\s+ветк)/iu)
    expect(critiqueQl7SupportResponseV12({ text: threat.text, locale: 'ru' }).ok).toBe(true)

    const paused = buildQl7SupportInputPolicy({
      state: 'ready_for_input',
      locale: 'ru',
      tone: rudeTone,
      safetyStrikeCount: 2,
      now: () => Date.parse('2026-07-29T12:00:00.000Z'),
    })
    expect(paused.canSend).toBe(false)
    expect(paused.message).toMatch(/(?:пауза|обычными словами|по делу)/iu)
    expect(paused.message).not.toMatch(/контур|служеб|policy/iu)

    const threatPolicy = buildQl7SupportInputPolicy({
      state: 'ready_for_input',
      locale: 'ru',
      tone: threatTone,
      now: () => Date.parse('2026-07-29T12:00:00.000Z'),
    })
    expect(threatPolicy).toMatchObject({
      allowed: false,
      canSend: false,
      reasonCode: 'safety_review',
      reasonCategory: 'safety_review',
      severity: 'critical',
      cooldownMs: 30 * 60 * 1000,
      totalCooldownMs: 30 * 60 * 1000,
      expectedInputType: 'none',
      source: 'server',
    })
    expect(threatPolicy.message).toMatch(/(?:пауза|безопас)/iu)
    expect(threatPolicy.message).not.toMatch(/контур|служеб|policy/iu)
  })

  test('executes a real question to actual response pair through the production-equivalent pipeline', async () => {
    const [item] = Array.from(iterateQl7SupportFactualSimulationScenariosV12({ mode: 'quick', count: 2, languages: ['en'], seed: 'unit-v12-factual' }))
    const result = await executeQl7SupportFactualScenarioV12({ scenario: item.scenario, firstPairIndex: item.firstPairIndex, rawConfig: { mode: 'quick', count: 2, languages: ['en'], seed: 'unit-v12-factual' }, nowMs: Date.parse('2026-07-29T12:00:00.000Z') })
    expect(result.pairs.length).toBeGreaterThan(0)
    const pair = result.pairs[0]
    expect(pair.actual.inputText).toBeTruthy()
    expect(pair.actual.responseText).toBeTruthy()
    expect(pair.actual.stages).toMatchObject({
      inputNormalization: true,
      semanticBattleExpansion: true,
      responsePlanning: true,
      naturalLanguageRealization: true,
      adaptiveResponseVariation: true,
      inputPolicy: true,
      independentOracleEvaluation: true,
    })
    expect(pair.actual.battleExpansion).toMatchObject({ classifierOnly: false, actualQuestion: true })
    expect(pair.actual.responseVariation).toMatchObject({ version: '12.0.0-v14-compat', budget: expect.objectContaining({ max: 400 }) })
    expect(pair.actual.responseVariation.budget.graphemes).toBeLessThanOrEqual(400)
    expect(pair.actual.originalInputText).toBeTruthy()
    expect(pair.actual.inputText).not.toBe(pair.actual.originalInputText)
    expect(pair.actual.responseText).not.toBe(pair.actual.route?.topic)
  })

  test('localizes factual output text and cards through the provider-backed stage', async () => {
    const translate = async ({ targetLang }) => ({
      text: targetLang === 'en'
        ? 'Tell one small joke and then help with the support topic.'
        : 'Lokalisierte Antwort auf Deutsch mit einer klaren Karte.',
      provider: 'unit-provider',
    })
    const result = await executeQl7SupportFactualScenarioV12({
      scenario: {
        scenarioId: 'unit-v12-provider-output-localization',
        index: 1,
        locale: 'de',
        topic: 'support_system',
        axes: {},
        conversationTurns: [
          {
            turnIndex: 0,
            locale: 'de',
            input: 'Erzaehl einen kurzen Witz und hilf dann mit Support',
            oracle: { expectedTopic: 'support_system' },
          },
        ],
      },
      firstPairIndex: 0,
      rawConfig: { mode: 'quick', count: 1, languages: ['de'], seed: 'unit-v12-provider-output-localization', providerTranslate: true, providerSampleLimit: 10 },
      translate,
      nowMs: Date.parse('2026-07-29T12:00:00.000Z'),
    })
    const pair = result.pairs[0]
    expect(pair.actual.outputLocalization.status).toBe('translated+translated')
    expect(pair.actual.stages.structuredLocalization).toBe(true)
    expect(pair.actual.responseText).toBe('Lokalisierte Antwort auf Deutsch mit einer klaren Karte.')
    expect(pair.actual.card.title).toBe('Lokalisierte Antwort auf Deutsch mit einer klaren Karte.')
    expect(JSON.stringify(pair.actual.visibleBadges)).not.toMatch(/\b(?:WARNING|OPERATOR|Warning|Operator|Sent to operator)\b/u)
  })

  test('fully localizes card natural-language nodes including premium tables and actions', async () => {
    const translate = async () => ({ text: 'перевод', provider: 'unit-provider' })
    const result = await localizeQl7SupportOutputV12({
      text: 'Card response',
      targetLanguage: 'ru',
      forceProvider: true,
      translate,
      card: {
        locale: 'en',
        title: 'Account review',
        summary: 'We checked the visible account state.',
        status: { code: 'pending', label: 'Pending review', tone: 'warning' },
        badges: [{ id: 'warn', label: 'Warning', tone: 'warning', icon: 'warning' }],
        table: {
          title: 'Review details',
          columns: [{ key: 'label', label: 'Field' }, { key: 'value', label: 'Value' }],
          rows: [
            { key: 'state', label: 'Current state', value: 'Needs review' },
            { key: 'hash', label: 'Evidence hash', value: '0x1234567890abcdef1234567890abcdef12345678' },
          ],
        },
        actions: [{ id: 'continue', label: 'Continue support', href: '/forum' }],
        labels: { checked: 'Checked', details: 'Details' },
      },
    })
    expect(result.text).toBe('перевод')
    expect(result.card.title).toBe('перевод')
    expect(result.card.summary).toBe('перевод')
    expect(result.card.status.label).toBe('перевод')
    expect(result.card.badges[0].label).toBe('перевод')
    expect(result.card.table.title).toBe('перевод')
    expect(result.card.table.columns.map((column) => column.label)).toEqual(['перевод', 'перевод'])
    expect(result.card.table.rows[0].label).toBe('перевод')
    expect(result.card.table.rows[0].value).toBe('перевод')
    expect(result.card.table.rows[1].label).toBe('перевод')
    expect(result.card.table.rows[1].value).toBe('0x1234567890abcdef1234567890abcdef12345678')
    expect(result.card.actions[0].label).toBe('перевод')
    expect(result.card.labels.checked).toBe('перевод')
    expect(result.card.labels.details).toBe('перевод')
    expect(result.status).toBe('translated+translated')
  })

  test('does not show unavailable source badges when concrete diagnostic data is present', () => {
    const presentation = presentQl7SupportDiagnostic({
      topic: 'ads_campaigns',
      locale: 'ru',
      diagnosticResult: {
        topic: 'ads',
        branch: 'mongo_unavailable',
        status: 'unavailable',
        asOf: '2026-07-29T20:01:00.000Z',
        evidence: {
          campaignName: 'Летняя кампания',
          impressions: 1280,
          clicks: 64,
          ctr: 5,
          metricsUpdatedAt: '2026-07-29T20:00:00.000Z',
        },
      },
    })
    expect(presentation.status).toBe('healthy')
    const built = buildQl7SupportPremiumCardV12({
      cardSpec: presentation.card || presentation,
      locale: 'ru',
      requestContext: { caseId: 'case-data', analysis: {}, messageAct: 'personal_status_request' },
      replyPlan: {},
      sourceText: 'проверь рекламную кампанию',
    })
    const visible = JSON.stringify({ status: built.card.status, badges: built.visibleBadges, summary: built.card.summary })
    expect(visible).not.toMatch(/Источник|источник|недоступ|unavailable|Source/iu)
    expect(built.card.status.label).toMatch(/Подтверж/u)
    expect(JSON.stringify(built.card.table?.rows || [])).toContain('1280')
  })

  test('does not mark social, humor, partnership or learning cards as checked before a real verification', () => {
    const cardSpecs = [
      { kind: 'v12_social_response', purpose: 'social', title: 'Тёплая поддержка', summary: 'Рад поговорить.', status: 'active', badges: [{ label: 'Диалог', tone: 'neutral', icon: 'chat' }] },
      { kind: 'v12_humor_response', purpose: 'humor', title: 'Лёгкий момент', summary: 'Короткая шутка.', status: 'active', badges: [{ label: 'Юмор', tone: 'neutral', icon: 'spark' }] },
      { kind: 'v12_partnership_response', purpose: 'pending', title: 'Стратегическое обращение', summary: 'Подготовим суть для администрации.', status: 'pending', badges: [{ label: 'Партнёрство', tone: 'success', icon: 'chat' }] },
      { kind: 'v12_learning_response', purpose: 'explanation', title: 'Безопасное самообучение', summary: 'Контур объясняет обучение.', status: 'learning_guarded', badges: [{ label: 'Самокалибровка', tone: 'success', icon: 'learning' }] },
    ]
    for (const cardSpec of cardSpecs) {
      const built = buildQl7SupportPremiumCardV12({
        cardSpec,
        locale: 'ru',
        requestContext: { caseId: `case-${cardSpec.kind}`, analysis: {}, messageAct: 'casual_chat' },
        replyPlan: {},
        sourceText: 'брат просто поговорим',
      })
      expect(built.card.checkedAt).toBe('')
      expect(JSON.stringify({ checkedAt: built.card.checkedAt, visibleBadges: built.visibleBadges, status: built.card.status })).not.toMatch(/Проверено|Checked/u)
    }

    const diagnostic = buildQl7SupportPremiumCardV12({
      cardSpec: {
        kind: 'data_table',
        purpose: 'diagnostic_result',
        locale: 'ru',
        title: 'Баланс',
        summary: 'Данные подтверждены.',
        status: 'healthy',
        table: {
          columns: [{ key: 'label', label: 'Что подтверждено' }, { key: 'value', label: 'Результат' }],
          rows: [{ key: 'balance', label: 'Баланс', value: 123 }],
        },
      },
      locale: 'ru',
      requestContext: { caseId: 'case-diagnostic', analysis: {}, messageAct: 'personal_status_request' },
      replyPlan: { userFacingAsOf: '2026-07-29T20:00:00.000Z' },
      sourceText: 'проверь баланс',
    })
    expect(diagnostic.card.checkedAt).toBeTruthy()
  })

  test('treats STOP as SVG-only and rejects raw English safety rail labels', () => {
    const bad = evaluateQl7SupportIndependentOracleV12({
      turn: { locale: 'ru' },
      actual: {
        responseText: 'ok',
        visibleBadges: [{ label: 'WARNING' }, { label: 'STOP' }],
        cardValidation: { ok: true },
      },
    })
    expect(bad.ok).toBe(false)
    expect(bad.failures.map((failure) => failure.code)).toEqual(expect.arrayContaining(['raw_english_badge_label', 'stop_text_in_rail_badge']))
    const english = evaluateQl7SupportIndependentOracleV12({
      turn: { locale: 'en' },
      actual: {
        responseText: 'ok',
        visibleBadges: [{ label: 'Warning' }, { label: 'Sent to operator' }],
        cardValidation: { ok: true },
      },
    })
    expect(english.failures.map((failure) => failure.code)).not.toContain('raw_english_badge_label')
    const good = evaluateQl7SupportIndependentOracleV12({
      turn: { locale: 'ru' },
      actual: {
        responseText: 'ok',
        visibleBadges: [
          { label: '\u041f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435' },
          { label: '\u041f\u0430\u0443\u0437\u0430 30:00' },
        ],
        card: { semanticIcon: 'stop', title: 'x', summary: 'y', badges: [] },
        cardValidation: { ok: true },
      },
    })
    expect(good.ok).toBe(true)
  })

  test('localizes safety rail labels for all factual-run languages without English badge fallbacks', () => {
    const locales = ['en','ru','uk','es','tr','ar','zh','he','de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','bg','sr','hr','sl','el','ka','az','kk','ja','ko']
    for (const locale of locales) {
      const labels = [
        localizeQl7SemanticBadgeLabelV11_6('warning', locale),
        localizeQl7SemanticBadgeLabelV11_6('operator', locale),
        localizeQl7SemanticBadgeLabelV11_6('stop', locale, { seconds: 1800 }),
      ]
      expect(labels[2]).not.toMatch(/\bSTOP\b/u)
      if (locale !== 'en') expect(labels.join('\n')).not.toMatch(/\b(?:WARNING|OPERATOR|Warning|Operator|Sent to operator|warning|operator)\b/u)
    }
  })

  test('renders the V12 Russian SMTP evidence sample as white text on a blue base', () => {
    const report = composeQl7SupportAdminReportRuV12({
      caseId: 'case-redacted',
      topic: 'operator-handoff',
      identity: { actorIdMasked: 'actor-***-redacted' },
      tone: { taxonomyCategory: 'safety_review' },
      recommendation: 'проверить обезличенную суть обращения и ответить без запроса лишних служебных данных',
    })
    const html = renderQl7SupportAdminReportRuHtmlV12(report)
    expect(html).toContain('lang="ru"')
    expect(html).toContain('QL7 Support - отчёт оператору')
    expect(html).toContain('background:#092848!important;color:#ffffff!important')
    expect(html).toContain('-webkit-text-fill-color:#ffffff!important')
    expect(html).not.toMatch(/Open direct conversation|background:#f4fbff|#fff7d6|ql7ws_|mongodb:\/\//u)
  })
})
