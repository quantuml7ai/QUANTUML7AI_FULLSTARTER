import { analyzeQl7SupportRequest } from '../caseEngine.js'
import { buildQl7SupportInputPolicy, normalizeQl7SupportInputPolicy } from '../inputPolicy.js'
import { prepareQl7SupportLanguageInput } from '../languageOrchestrator.js'
import { buildQl7SupportSimulationScenarioV11, normalizeQl7SupportSimulationConfigV11 } from '../simulationGeneratorV11.js'
import { QL7_SUPPORT_SIMULATION_LANGUAGES_V11, QL7_SUPPORT_SIMULATION_TOPICS_V11 } from '../simulationOntologyV11.js'
import { routeQl7SupportMessage } from '../semanticRouter.js'
import { localizeQl7SemanticBadgeLabelV11_6 } from '../semanticBadgeRegistryV11_6.js'
import { assessQl7SupportTone } from '../toxicityEngine.js'
import { createQl7SupportConversationLedgerV12, ledgerToQl7SupportPreviousContextV12, mergeQl7SupportLedgerTurnV12 } from './conversationLedgerV12.js'
import { evaluateQl7SupportIndependentOracleV12 } from './independentReferenceOracleV12.js'
import { routeQl7SupportLanguageDialectV12 } from './languageDialectRouterV12.js'
import { buildQl7SupportPremiumCardV12 } from './premiumCardLayoutV12.js'
import { executeQl7SupportTurnRuntime } from '../runtime/executeTurn.js'
import { buildQl7SupportSimulationReceiptsV13 } from '../data/simulationFixtures.js'
import { buildQl7SupportSafetyEscalationV12 } from './safetyEscalationLedgerV12.js'
import { buildQl7SupportSessionIdentityContextV12 } from './sessionIdentityContextV12.js'
import { buildQl7SupportBattleSemanticInputV12 } from './semanticBattleExpansionV12.js'
import { getQl7SupportSemanticOntologyStatsV12 } from './semanticOntologyV12.js'
import { localizeQl7SupportOutputV12 } from './structuredLocalizationV12.js'

export const QL7_SUPPORT_FACTUAL_SIMULATION_VERSION_V12 = '12.0.0'
export const QL7_SUPPORT_FACTUAL_SIMULATION_MODE_COUNTS_V12 = Object.freeze({
  quick: 25000,
  full: 250000,
  deep: 1000000,
  extreme: 5000000,
  ultimate: 50000000,
})

const V11_SCENARIO_WINDOW = 5000000

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
  const clean = str(locale).toLowerCase().split(/[-_]/u)[0]
  return ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'].includes(clean) ? clean : 'en'
}

export function normalizeQl7SupportFactualSimulationConfigV12(input = {}) {
  const mode = ['quick', 'full', 'deep', 'extreme', 'ultimate'].includes(str(input.mode).toLowerCase()) ? str(input.mode).toLowerCase() : 'quick'
  const requestedCount = input.count ?? input.targetPairs ?? input.pairs
  const count = int(requestedCount, 1, 50000000, QL7_SUPPORT_FACTUAL_SIMULATION_MODE_COUNTS_V12[mode])
  const allowUltimate = bool(input.allowUltimate || input.allow50m || process.env.QL7_SUPPORT_V12_ALLOW_ULTIMATE)
  if ((mode === 'ultimate' || count >= 50000000) && !allowUltimate) throw new Error('ultimate_50m_requires_--allow-ultimate')
  const languages = list(input.languages, mode === 'quick' ? ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'] : QL7_SUPPORT_SIMULATION_LANGUAGES_V11)
    .filter((locale) => QL7_SUPPORT_SIMULATION_LANGUAGES_V11.includes(locale))
  if (!languages.length) throw new Error('v12_languages_empty')
  return Object.freeze({
    version: QL7_SUPPORT_FACTUAL_SIMULATION_VERSION_V12,
    mode,
    count,
    seed: str(input.seed) || 'ql7-support-v12-factual',
    evidenceMode: ['summary', 'balanced', 'full'].includes(str(input.evidenceMode).toLowerCase()) ? str(input.evidenceMode).toLowerCase() : (mode === 'ultimate' ? 'full' : 'balanced'),
    languages: Object.freeze(languages),
    topics: Object.freeze(list(input.topics, QL7_SUPPORT_SIMULATION_TOPICS_V11).filter((topic) => QL7_SUPPORT_SIMULATION_TOPICS_V11.includes(topic))),
    minTurns: int(input.minTurns, 1, 20, mode === 'quick' ? 2 : 3),
    maxTurns: int(input.maxTurns, 1, 20, mode === 'quick' ? 6 : 20),
    providerTranslate: bool(input.providerTranslate),
    providerSampleLimit: int(input.providerSampleLimit, 0, 100000, 0),
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
    ontology: getQl7SupportSemanticOntologyStatsV12(),
  })
}

function v11ConfigForScenarioCycle(config, cycle = 0) {
  return normalizeQl7SupportSimulationConfigV11({
    mode: config.mode === 'quick' ? 'quick' : 'soak',
    seed: `${config.seed}:v12:${cycle}`,
    scenarioCount: V11_SCENARIO_WINDOW,
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

export function *iterateQl7SupportFactualSimulationScenariosV12(rawConfig = {}) {
  const config = normalizeQl7SupportFactualSimulationConfigV12(rawConfig)
  let globalPairIndex = 0
  let scenarioIndex = 0
  while (globalPairIndex < config.count) {
    const cycle = Math.floor(scenarioIndex / V11_SCENARIO_WINDOW)
    const indexInCycle = scenarioIndex % V11_SCENARIO_WINDOW
    const scenario = buildQl7SupportSimulationScenarioV11(indexInCycle, v11ConfigForScenarioCycle(config, cycle))
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
  if (safety.action === 'warn') return [{ id: 'safety-warning', label: localizeQl7SemanticBadgeLabelV11_6('warning', locale), tone: 'warning', icon: 'warning' }]
  const seconds = Math.ceil(Number(safety.cooldownMs || 0) / 1000)
  const badges = [{ id: 'safety-pause', label: localizeQl7SemanticBadgeLabelV11_6('stop', locale, { seconds }), tone: 'blocked', icon: 'stop' }]
  if (safety.operatorHandoff) badges.unshift({ id: 'operator-handoff', label: localizeQl7SemanticBadgeLabelV11_6('operator', locale), tone: 'operator', icon: 'operator' })
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

export async function executeQl7SupportFactualScenarioV12({ scenario, firstPairIndex = 0, rawConfig = {}, translate = null, nowMs = Date.now() } = {}) {
  const config = normalizeQl7SupportFactualSimulationConfigV12(rawConfig)
  let ledger = createQl7SupportConversationLedgerV12({ conversationId: `${scenario.scenarioId}:conversation` })
  const identity = buildQl7SupportSessionIdentityContextV12({ actorSeed: scenario.scenarioId, authenticated: true })
  let priorRudeCount = 0
  const pairs = []
  const turns = Array.isArray(scenario.conversationTurns) && scenario.conversationTurns.length ? scenario.conversationTurns : [{ turnIndex: 0, input: scenario.input, locale: scenario.locale }]
  for (let localIndex = 0; localIndex < turns.length; localIndex += 1) {
    const rawTurn = turns[localIndex]
    const pairIndex = firstPairIndex + localIndex
    const locale = str(rawTurn.locale || scenario.locale || 'en')
    const expectedTopic = str(rawTurn.oracle?.primaryTopic || rawTurn.oracle?.expectedTopic || rawTurn.oracle?.expectedTopics?.[0] || scenario.topic || 'support_system')
    const battleExpansion = buildQl7SupportBattleSemanticInputV12({
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
    const providerAllowed = config.providerTranslate && (!config.providerSampleLimit || pairIndex < config.providerSampleLimit)
    const languageInput = providerAllowed
      ? await prepareQl7SupportLanguageInput({ text: turn.input, selectedLocale: locale, translate })
      : {
        originalText: turn.input,
        redactedText: turn.input,
        canonicalText: turn.input,
        detectedLanguage: locale,
        canonicalLanguage: locale,
        translationRequired: locale !== 'en',
        translationStatus: locale === 'en' ? 'native' : 'provider_disabled_in_factual_run',
        translationProvider: locale === 'en' ? 'native' : 'disabled',
      }
    const dialect = routeQl7SupportLanguageDialectV12({ text: turn.input, selectedLocale: locale, scenarioClass: scenario.axes?.scenarioClass || '', dialectPack: scenario.axes?.register || '' })
    const semanticText = str(languageInput.canonicalText || turn.input)
    const semanticLocale = languageInput.canonicalLanguage === 'en' ? 'en' : locale
    const responseLocale = responseNativeLocale(locale)
    const previousContext = ledgerToQl7SupportPreviousContextV12(ledger)
    const tone = assessQl7SupportTone({ text: turn.input, translatedText: semanticText, language: semanticLocale })
    const analysis = analyzeQl7SupportRequest({ text: semanticText, locale: semanticLocale, previousContext })
    const route = routeQl7SupportMessage({ text: semanticText, locale: semanticLocale, previousContext, baseAnalysis: analysis, tone })
    const adapterReceipts = buildQl7SupportSimulationReceiptsV13({ topic: route.topic, pairIndex, actorId: identity.actorIdMasked })
    const runtimeCanonical = executeQl7SupportTurnRuntime({
      mode: 'simulation',
      text: turn.input,
      selectedLocale: responseLocale,
      analysis: { ...analysis, caseId: `v12-case-${pairIndex}` },
      route,
      priorLedger: ledger,
      tone,
      seed: `${scenario.scenarioId}:${turn.turnIndex}:${pairIndex}`,
      adapterReceipts,
    })
    const planned = Object.freeze({
      plan: runtimeCanonical.replyPlan,
      basePlan: runtimeCanonical.replyPlan,
      responseVariation: Object.freeze({ version: '12.0.0-v14-compat', variationKey: runtimeCanonical.replyPlan.semanticFingerprint, shape: 'minimal', conversationMode: runtimeCanonical.plan.kind || 'content_first', budget: Object.freeze({ graphemes: [...String(runtimeCanonical.replyPlan?.text || '')].length, max: 400, truncated: false }) }),
      critic: runtimeCanonical.critic,
      runtime: runtimeCanonical,
    })
    const safety = buildQl7SupportSafetyEscalationV12({ tone, text: turn.input, priorRudeCount, nowMs })
    if (safety.event === 'rude') priorRudeCount = safety.rudeCount
    const cardBuilt = buildQl7SupportPremiumCardV12({
      cardSpec: planned.plan.cardSpec,
      requestContext: { caseId: `v12-case-${pairIndex}`, analysis: { ...analysis, topic: runtimeCanonical.effectiveRoute.topic, messageAct: runtimeCanonical.effectiveRoute.messageAct }, route: runtimeCanonical.effectiveRoute, messageAct: runtimeCanonical.effectiveRoute.messageAct },
      replyPlan: planned.plan,
      locale,
      tone,
      sourceText: turn.input,
      version: config.cardVersion,
    })
    const policy = buildPolicyForSafety({ replyPlan: planned.plan, tone, safety, locale, nowMs })
    const safetyBadges = buildSafetyBadges({ safety, locale })
    const outputLocalization = providerAllowed && locale !== responseLocale
      ? await localizeQl7SupportOutputV12({
        text: planned.plan.text,
        card: cardBuilt.card,
        targetLanguage: locale,
        sourceLanguage: responseLocale,
        translate,
        maxStrings: 96,
        forceProvider: true,
      })
      : Object.freeze({
        version: 'ql7.support.v12.localization.inline',
        text: planned.plan.text,
        card: cardBuilt.card,
        targetLanguage: locale,
        textStatus: locale === responseLocale ? 'native' : 'provider_disabled_in_factual_run',
        cardStatus: locale === responseLocale ? 'native' : 'provider_disabled_in_factual_run',
        translatedStrings: 0,
        status: locale === responseLocale ? 'native+native' : 'provider_disabled_in_factual_run',
      })
    const responseText = str(outputLocalization.text || planned.plan.text)
    const responseCard = outputLocalization.card || cardBuilt.card
    const localizedCardBadges = Array.isArray(responseCard?.badges) ? responseCard.badges : []
    const visibleBadges = Object.freeze([...safetyBadges, ...(localizedCardBadges.length ? localizedCardBadges : (cardBuilt.visibleBadges || []))])
    const actual = Object.freeze({
      pairIndex,
      pairId: `ql7-v12-pair-${String(pairIndex).padStart(8, '0')}`,
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
        conversationLedgerMerge: true,
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
    const oracle = evaluateQl7SupportIndependentOracleV12({ scenario, turn, actual, expected: turn.oracle || scenario.oracle || {} })
    pairs.push(Object.freeze({ scenario: { scenarioId: scenario.scenarioId, index: scenario.index, topic: scenario.topic, locale: scenario.locale, axes: scenario.axes }, turn, actual, oracle }))
    ledger = mergeQl7SupportLedgerTurnV12(ledger, {
      userText: turn.input,
      assistantText: planned.plan.text,
      topic: runtimeCanonical.effectiveRoute.topic,
      messageAct: runtimeCanonical.effectiveRoute.messageAct,
      responseCode: planned.plan.responseCode,
    })
  }
  return Object.freeze({ scenarioId: scenario.scenarioId, pairs: Object.freeze(pairs), ledger })
}
