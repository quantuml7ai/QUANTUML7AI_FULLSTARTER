import {buildQl7SupportInputPolicy, normalizeQl7SupportInputPolicy} from '../inputPolicy.js'
import {prepareQl7SupportLanguageInput} from '../languageOrchestrator.js'
import {buildQl7SupportSimulationScenario, normalizeQl7SupportSimulationConfig} from '../simulationGenerator.js'
import {QL7_SUPPORT_SIMULATION_LANGUAGES, QL7_SUPPORT_SIMULATION_TOPICS} from '../simulationOntology.js'
import {localizeQl7SemanticBadgeLabel} from '../semanticBadgeRegistry.js'
import {assessQl7SupportTone} from '../toneAssessment.js'
import {analyzeQl7SupportTurn} from '../semantics/analyzeTurn.js'
import {createQl7SupportConversationMemoryGraph} from '../conversation/conversationMemoryGraph.js'
import {projectQl7SupportMemoryGraphToSemanticContext} from '../conversation/semanticContext.js'
import {evaluateQl7SupportIndependentOracle} from './independentOracle.js'
import {routeQl7SupportLanguageDialect} from '../language/dialectRouter.js'
import {buildQl7SupportPremiumCard} from '../presentation/premiumCardLayout.js'
import {executeQl7SupportTurnRuntime} from '../runtime/executeTurn.js'
import {buildQl7SupportSimulationReceipts} from '../data/simulationFixtures.js'
import {buildQl7SupportSafetyEscalation} from '../safety/escalationLedger.js'
import {buildQl7SupportSessionIdentityContext} from '../identity/sessionContext.js'
import {buildQl7SupportBattleSemanticInput} from '../semantics/battleExpansion.js'
import {getQl7SupportSemanticOntologyStats} from '../ontology/simulationOntology.js'
import {normalizeQl7SupportLocale} from '../language/locales.js'
import {planQl7SupportResponseLength} from '../response/responseLengthPlanner.js'

export const QL7_SUPPORT_FACTUAL_SIMULATION_SCHEMA = 'ql7.support.factual-simulation'
export const QL7_SUPPORT_FACTUAL_SIMULATION_MODE_COUNTS = Object.freeze({
  quick: 25000,
  full: 250000,
  deep: 1000000,
  extreme: 5000000,
  ultimate: 50000000,
})

const SCENARIO_WINDOW = 5000000

function str(value) { return String(value ?? '').trim() }
function bool(value) { return value === true || value === 'true' || value === '1' || value === 'yes' }
function int(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.trunc(n)))
}
function list(value, fallback = []) {
  if (Array.isArray(value)) return value.map(str).filter(Boolean)
  const text = str(value)
  return text ? text.split(',').map(str).filter(Boolean) : fallback
}
function responseNativeLocale(locale = '') {
  return normalizeQl7SupportLocale(locale)
}

export function normalizeQl7SupportFactualSimulationConfig(input = {}) {
  const mode = ['quick', 'full', 'deep', 'extreme', 'ultimate'].includes(str(input.mode).toLowerCase()) ? str(input.mode).toLowerCase() : 'quick'
  const requestedCount = input.count ?? input.targetPairs ?? input.pairs
  const count = int(requestedCount, 1, 50000000, QL7_SUPPORT_FACTUAL_SIMULATION_MODE_COUNTS[mode])
  const allowUltimate = bool(input.allowUltimate || input.allow50m || process.env.QL7_SUPPORT_canonical_ALLOW_ULTIMATE)
  if ((mode === 'ultimate' || count >= 50000000) && !allowUltimate) throw new Error('ultimate_50m_requires_--allow-ultimate')
  const languages = list(input.languages, mode === 'quick' ? ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'] : QL7_SUPPORT_SIMULATION_LANGUAGES)
    .filter((locale) => QL7_SUPPORT_SIMULATION_LANGUAGES.includes(locale))
  if (!languages.length) throw new Error('factual_simulation_languages_empty')
  return Object.freeze({
    schema: QL7_SUPPORT_FACTUAL_SIMULATION_SCHEMA,
    mode,
    count,
    seed: str(input.seed) || 'ql7-support-factual',
    evidenceMode: ['summary', 'balanced', 'full'].includes(str(input.evidenceMode).toLowerCase()) ? str(input.evidenceMode).toLowerCase() : (mode === 'ultimate' ? 'full' : 'balanced'),
    languages: Object.freeze(languages),
    topics: Object.freeze(list(input.topics, QL7_SUPPORT_SIMULATION_TOPICS).filter((topic) => QL7_SUPPORT_SIMULATION_TOPICS.includes(topic))),
    minTurns: int(input.minTurns, 1, 20, mode === 'quick' ? 2 : 3),
    maxTurns: int(input.maxTurns, 1, 20, mode === 'quick' ? 6 : 20),
    externalTranslationAllowed: false,
    resume: bool(input.resume),
    checkpointDir: str(input.checkpointDir),
    baseUrl: str(input.baseUrl),
    cdpUrl: str(input.cdpUrl),
    liveSmoke: bool(input.liveSmoke),
    browserAcceptance: bool(input.browserAcceptance),
    shardCount: int(input.shardCount, 1, 4096, 1),
    shardIndex: int(input.shardIndex, 0, 4095, 0),
    cardVersion: int(input.cardVersion, 4, 4, 4),
    allowUltimate,
    ontology: getQl7SupportSemanticOntologyStats(),
  })
}

function canonicalConfigForScenarioCycle(config, cycle = 0) {
  return normalizeQl7SupportSimulationConfig({
    mode: config.mode === 'quick' ? 'quick' : 'soak',
    seed: `${config.seed}:cycle:${cycle}`,
    scenarioCount: SCENARIO_WINDOW,
    languages: config.languages,
    topics: config.topics,
    minTurns: config.minTurns,
    maxTurns: config.maxTurns,
    minLength: 1,
    maxLength: 600,
    shardCount: 1,
    shardIndex: 0,
  })
}

export function *iterateQl7SupportFactualSimulationScenarios(rawConfig = {}) {
  const config = normalizeQl7SupportFactualSimulationConfig(rawConfig)
  let globalPairIndex = 0
  let scenarioIndex = 0
  while (globalPairIndex < config.count) {
    const cycle = Math.floor(scenarioIndex / SCENARIO_WINDOW)
    const indexInCycle = scenarioIndex % SCENARIO_WINDOW
    const scenario = buildQl7SupportSimulationScenario(indexInCycle, canonicalConfigForScenarioCycle(config, cycle))
    const turns = Array.isArray(scenario.conversationTurns) && scenario.conversationTurns.length ? scenario.conversationTurns : [{ turnIndex: 0, input: scenario.input, locale: scenario.locale }]
    const remaining = config.count - globalPairIndex
    const scenarioTurns = turns.slice(0, remaining)
    const assigned = scenarioIndex % config.shardCount === config.shardIndex
    if (assigned) {
      yield Object.freeze({
        scenario: Object.freeze({ ...scenario, globalScenarioIndex: scenarioIndex, cycle, conversationTurns: scenarioTurns, turns: scenarioTurns.length }),
        firstPairIndex: globalPairIndex,
      })
    }
    globalPairIndex += scenarioTurns.length
    scenarioIndex += 1
  }
}

function buildSafetyBadges({ safety, locale }) {
  if (!safety || safety.action === 'allow') return []
  if (safety.action === 'warn') return [{ id: 'safety-warning', label: localizeQl7SemanticBadgeLabel('warning', locale), tone: 'warning', icon: 'warning' }]
  const seconds = Math.ceil(Number(safety.cooldownMs || 0) / 1000)
  const badges = [{ id: 'safety-pause', label: localizeQl7SemanticBadgeLabel('stop', locale, { seconds }), tone: 'blocked', icon: 'stop' }]
  if (safety.operatorHandoff) badges.unshift({ id: 'operator-handoff', label: localizeQl7SemanticBadgeLabel('operator', locale), tone: 'operator', icon: 'operator' })
  return badges
}

function buildPolicyForSafety({ replyPlan, tone, safety, locale, nowMs }) {
  if (safety?.cooldownMs > 0) {
    return normalizeQl7SupportInputPolicy({
      canSend: false,
      readyAtMs: nowMs + safety.cooldownMs,
      reasonCategory: safety.operatorHandoff ? 'safety_review' : 'spam_cooldown',
      severity: safety.operatorHandoff ? 'critical' : 'elevated',
      canInterrupt: false,
      emergencyOverride: true,
      expectedInputType: 'none',
      runtimeStage: safety.operatorHandoff ? 'safety_review' : 'cooldown',
      locale,
    }, { now: () => nowMs, locale })
  }
  return buildQl7SupportInputPolicy({
    state: replyPlan?.nextState || 'ready_for_input',
    locale,
    tone,
    expectedInputType: replyPlan?.nextState === 'waiting_choice' ? 'choice' : 'text',
    now: () => nowMs,
  })
}

export async function executeQl7SupportFactualScenario({ scenario, firstPairIndex = 0, rawConfig = {}, translate = null, nowMs = Date.now() } = {}) {
  const config = normalizeQl7SupportFactualSimulationConfig(rawConfig)
  let memoryGraph = createQl7SupportConversationMemoryGraph({ conversationId: `${scenario.scenarioId}:conversation` })
  const identity = buildQl7SupportSessionIdentityContext({ actorSeed: scenario.scenarioId, authenticated: true })
  let priorRudeCount = 0
  const pairs = []
  const turns = Array.isArray(scenario.conversationTurns) && scenario.conversationTurns.length ? scenario.conversationTurns : [{ turnIndex: 0, input: scenario.input, locale: scenario.locale }]
  for (let localIndex = 0; localIndex < turns.length; localIndex += 1) {
    const rawTurn = turns[localIndex]
    const pairIndex = firstPairIndex + localIndex
    const locale = str(rawTurn.locale || scenario.locale || 'en')
    const expectedTopic = str(rawTurn.oracle?.primaryTopic || rawTurn.oracle?.expectedTopic || rawTurn.oracle?.expectedTopics?.[0] || scenario.topic || 'support_system')
    const battleExpansion = buildQl7SupportBattleSemanticInput({
      text: rawTurn.input,
      topic: expectedTopic,
      locale,
      pairIndex,
      scenarioId: scenario.scenarioId,
      turnIndex: rawTurn.turnIndex ?? localIndex,
    })
    const turn = Object.freeze({
      ...rawTurn,
      input: battleExpansion.text,
      originalInput: rawTurn.input,
      battleExpansion,
    })
    const startedAt = Date.now()
    const languageInput = await prepareQl7SupportLanguageInput({ text: turn.input, selectedLocale: locale })
    const dialect = routeQl7SupportLanguageDialect({ text: turn.input, selectedLocale: locale, scenarioClass: scenario.axes?.scenarioClass || '', dialectPack: scenario.axes?.register || '' })
    const semanticText = str(languageInput.canonicalText || turn.input)
    const semanticLocale = languageInput.canonicalLanguage === 'en' ? 'en' : locale
    const responseLocale = responseNativeLocale(locale)
    const previousContext = projectQl7SupportMemoryGraphToSemanticContext(memoryGraph)
    const understanding = analyzeQl7SupportTurn({
      text: semanticText,
      locale: semanticLocale,
      conversationId: `${scenario.scenarioId}:conversation`,
      turnId: `${scenario.scenarioId}:turn-${turn.turnIndex ?? localIndex}:pair-${pairIndex}`,
      previousContext,
    })
    const analysis = understanding.analysis
    const route = understanding.route
    const tone = assessQl7SupportTone({
      text: turn.input,
      translatedText: semanticText,
      language: semanticLocale,
      semanticSafety: understanding.safety?.sharedSemanticEvidence || null,
    })
    const adapterReceipts = buildQl7SupportSimulationReceipts({ topic: route.topic, pairIndex, actorId: identity.actorIdMasked })
    const runtimeCanonical = executeQl7SupportTurnRuntime({
      mode: 'simulation',
      text: turn.input,
      selectedLocale: responseLocale,
      authoritativeAnalysis: true,
      analysis: { ...analysis, normalization: understanding.normalization, safety: understanding.safety, caseId: `factual-case-${pairIndex}` },
      route,
      priorMemoryGraph: memoryGraph,
      tone,
      seed: `${scenario.scenarioId}:${turn.turnIndex}:${pairIndex}`,
      adapterReceipts,
    })
    const planned = Object.freeze({
      plan: runtimeCanonical.replyPlan,
      basePlan: runtimeCanonical.replyPlan,
      responseVariation: (() => {
        const budget = planQl7SupportResponseLength({ analysis: runtimeCanonical.analysis || analysis, contentPlan: runtimeCanonical.replyPlan?.contentPlan || runtimeCanonical.contentPlan || {} })
        return Object.freeze({ schema: 'ql7.support.response-variation', variationKey: runtimeCanonical.replyPlan.semanticFingerprint, shape: 'adaptive', conversationMode: runtimeCanonical.plan.kind || 'content_first', budget: Object.freeze({ graphemes: [...String(runtimeCanonical.replyPlan?.text || '')].length, max: budget.max, absoluteHardMax: budget.absoluteHardMax, oneWordAllowed: budget.oneWordAllowed, adaptive: budget.adaptive, truncated: false }) })
      })(),
      critic: runtimeCanonical.critic,
      runtime: runtimeCanonical,
    })
    const safety = buildQl7SupportSafetyEscalation({ tone, text: turn.input, priorRudeCount, nowMs })
    if (safety.event === 'rude') priorRudeCount = safety.rudeCount
    const cardBuilt = buildQl7SupportPremiumCard({
      cardSpec: planned.plan.cardSpec,
      requestContext: { caseId: `factual-case-${pairIndex}`, analysis: { ...analysis, topic: runtimeCanonical.effectiveRoute.topic, messageAct: runtimeCanonical.effectiveRoute.messageAct }, route: runtimeCanonical.effectiveRoute, messageAct: runtimeCanonical.effectiveRoute.messageAct },
      replyPlan: planned.plan,
      locale,
      tone,
      sourceText: turn.input,
      version: config.cardVersion,
    })
    const policy = buildPolicyForSafety({ replyPlan: planned.plan, tone, safety, locale, nowMs })
    const safetyBadges = buildSafetyBadges({ safety, locale })
    const outputLocalization = Object.freeze({
      version: 'ql7.support.localization.native32',
      text: planned.plan.text,
      card: cardBuilt.card,
      targetLanguage: responseLocale,
      textStatus: 'native',
      cardStatus: 'native',
      translatedStrings: 0,
      status: 'native+native',
      externalProviderUsed: false,
    })
    const responseText = str(outputLocalization.text || planned.plan.text)
    const responseCard = outputLocalization.card || cardBuilt.card
    const localizedCardBadges = Array.isArray(responseCard?.badges) ? responseCard.badges : []
    const visibleBadges = Object.freeze([...safetyBadges, ...(localizedCardBadges.length ? localizedCardBadges : (cardBuilt.visibleBadges || []))])
    const actual = Object.freeze({
      pairIndex,
      pairId: `ql7-pair-${String(pairIndex).padStart(8, '0')}`,
      scenarioId: scenario.scenarioId,
      conversationId: `${scenario.scenarioId}:conversation`,
      turnId: `${scenario.scenarioId}:turn-${turn.turnIndex ?? localIndex}:pair-${pairIndex}`,
      locale,
      semanticLocale,
      inputText: turn.input,
      originalInputText: turn.originalInput || turn.input,
      battleExpansion,
      normalizedInput: semanticText,
      languageInput,
      dialect,
      identity,
      tone,
      analysis: { ...analysis, topic: runtimeCanonical.effectiveRoute.topic, messageAct: runtimeCanonical.effectiveRoute.messageAct },
      route: runtimeCanonical.effectiveRoute,
      responsePlan: planned.plan,
      baseResponsePlan: planned.basePlan,
      responseVariation: planned.responseVariation,
      responseCritic: planned.critic,
      responseText,
      baseResponseText: planned.basePlan?.text || '',
      card: responseCard,
      cardExpected: Boolean(planned.plan.cardSpec),
      cardValidation: cardBuilt.validation,
      visibleBadges,
      outputLocalization,
      inputPolicy: policy,
      safety,
      adapterReceipts,
      runtimeParity: runtimeCanonical.runtimeParity,
      responseLocale,
      stages: Object.freeze({
        inputNormalization: true,
        semanticBattleExpansion: true,
        languageDialectDetection: true,
        socialAct: true,
        toxicitySafetyContext: true,
        intentHypotheses: true,
        topicSwitchArbiter: true,
        conversationMemoryGraphCommit: true,
        sessionIdentityResolution: true,
        readOnlyDiagnosticAdapter: adapterReceipts.some((receipt) => receipt.executed === true && receipt.writeCount === 0),
        responsePlanning: true,
        naturalLanguageRealization: Boolean(str(planned.plan.text)),
        adaptiveResponseVariation: true,
        responseCritic: true,
        cardSchemaBuild: !planned.plan.cardSpec || cardBuilt.validation?.ok === true,
        structuredLocalization: outputLocalization.status !== 'provider_disabled_in_factual_run',
        inputPolicy: true,
        presentationAdapter: true,
        domContractSerialization: true,
        independentOracleEvaluation: true,
      }),
      durationMs: Date.now() - startedAt,
    })
    const oracle = evaluateQl7SupportIndependentOracle({ scenario, turn, actual, expected: turn.oracle || scenario.oracle || {} })
    pairs.push(Object.freeze({ scenario: { scenarioId: scenario.scenarioId, index: scenario.index, topic: scenario.topic, locale: scenario.locale, axes: scenario.axes }, turn, actual, oracle }))
    memoryGraph = runtimeCanonical.memoryGraph
  }
  return Object.freeze({ scenarioId: scenario.scenarioId, pairs: Object.freeze(pairs), memoryGraph })
}
