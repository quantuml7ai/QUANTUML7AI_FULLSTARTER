import { executeQl7SupportTurnRuntime } from './executeTurn.js'
import { resolveQl7SupportResponseLocale } from '../language/responseLocalePolicy.js'
import { ql7StableHash, ql7Str } from '../internal/text.js'

export const QL7_SUPPORT_PRODUCTION_TURN_VERSION = '15.2.1'

const CONTEXTUAL_FOLLOWUP_ACTS = Object.freeze(new Set([
  'denial',
  'confirmation',
  'answer_to_question',
  'additional_evidence',
  'status_followup',
  'topic_resume',
]))

function contextualFollowupTrust(input = {}) {
  const analysis = input.analysis || {}
  const route = input.route || {}
  const act = ql7Str(analysis.messageAct || analysis.role || route.messageAct)
  if (!CONTEXTUAL_FOLLOWUP_ACTS.has(act)) return false

  const prior = input.priorLedger || input.ledger || input.memory || {}
  const explicitFollowup = input.contextualFollowup === true ||
    input.productionContext?.followup === true ||
    input.conversationDecision?.decision === 'continue_case'
  const pendingContext = Boolean(
    ql7Str(analysis.currentQuestionCode) ||
    ql7Str(route.currentQuestionCode) ||
    ql7Str(prior.waitingFor) ||
    ql7Str(prior.activeGoal) ||
    ql7Str(prior.activeTopic),
  )

  return explicitFollowup && pendingContext
}

export function buildQl7SupportProductionTurnInput(input = {}) {
  const localePolicy = resolveQl7SupportResponseLocale({
    selectedLocale: input.selectedLocale ||
      input.detectedLocale ||
      input.locale ||
      input.analysis?.detectedLanguage ||
      input.analysis?.selectedLocale ||
      'en',
  })
  const analysis = input.analysis && typeof input.analysis === 'object'
    ? input.analysis
    : {}
  const route = input.route && typeof input.route === 'object'
    ? input.route
    : {}
  const tone = input.tone && typeof input.tone === 'object'
    ? input.tone
    : {}
  const priorSource = input.priorLedger || input.ledger || input.memory || {}
  const productionQuestionCode = ql7Str(
    input.productionQuestionCode ||
    analysis.currentQuestionCode ||
    priorSource.currentQuestionCode,
  )
  const baseAnalysisTrust = input.baseAnalysisTrust === true ||
    contextualFollowupTrust({
      ...input,
      analysis,
      route,
      priorLedger: priorSource,
    })
  const trustedHintTopic = baseAnalysisTrust
    ? ql7Str(analysis.topic || route.topic)
    : ''
  const priorLedger = Object.freeze({
    ...priorSource,
    activeTopic: ql7Str(priorSource.activeTopic || trustedHintTopic),
    waitingFor: ql7Str(priorSource.waitingFor || productionQuestionCode),
  })

  return Object.freeze({
    ...input,
    mode: ql7Str(input.mode || 'production') || 'production',
    selectedLocale: localePolicy.locale,
    priorLedger,
    productionQuestionCode,
    analysis,
    route,
    tone,
    baseAnalysisTrust,
    productionContext: Object.freeze({
      version: QL7_SUPPORT_PRODUCTION_TURN_VERSION,
      localeKind: localePolicy.kind,
      localeSupported: localePolicy.supported,
      contextualFollowup: baseAnalysisTrust &&
        CONTEXTUAL_FOLLOWUP_ACTS.has(
          ql7Str(analysis.messageAct || analysis.role || route.messageAct),
        ),
      canonicalExecutor: 'lib/ql7-support/runtime/executeTurn.js',
    }),
  })
}

function resolveProductionSurfaceHash(surface = {}, runtime = {}) {
  const explicit = ql7Str(
    surface?.integrityBlock?.surfaceHash ||
    surface?.integrity?.signature ||
    runtime.internalProvenance?.surfaceHash,
  )
  if (explicit) return explicit
  return ql7StableHash(JSON.stringify(surface || {}))
}

export function projectQl7SupportProductionDelivery(runtime = {}, delivered = {}) {
  const replyPlan = delivered.replyPlan || runtime.replyPlan || {}
  const surface = delivered.surface || runtime.surface || {}
  const composerPolicy = delivered.composerPolicy || runtime.composerPolicy || {}
  const actionIds = (surface.actions || surface.options || [])
    .map((row) => ql7Str(row?.routeId || row?.id))
    .filter(Boolean)
  const text = ql7Str(delivered.text || replyPlan.text || runtime.text)
  const surfaceHash = resolveProductionSurfaceHash(surface, runtime)

  return Object.freeze({
    projectionVersion: QL7_SUPPORT_PRODUCTION_TURN_VERSION,
    deliveryStage: 'final-user-visible',
    runtimeVersion: ql7Str(runtime.runtimeVersion || runtime.version),
    behaviorManifestHash: ql7Str(runtime.behaviorManifestHash),
    executorId: ql7Str(runtime.executorId),
    locale: ql7Str(
      delivered.locale ||
      surface.locale ||
      runtime.localePolicy?.locale ||
      replyPlan.locale,
    ),
    localeKind: ql7Str(runtime.localePolicy?.kind),
    topic: ql7Str(delivered.topic || runtime.analysis?.topic),
    messageAct: ql7Str(delivered.messageAct || runtime.analysis?.messageAct),
    safetyCategory: ql7Str(runtime.safety?.category),
    insultDecision: ql7Str(runtime.safety?.insultAssessment?.decision),
    resultKind: ql7Str(runtime.plan?.resultKind),
    responseCode: ql7Str(replyPlan.responseCode),
    text,
    textHash: ql7StableHash(text),
    surfaceHash,
    factHash: ql7Str(runtime.factProjection?.factHash),
    composerAllowed: composerPolicy.allowed !== false,
    actionIds: Object.freeze(actionIds),
    finalMessageId: ql7Str(delivered.finalMessageId || runtime.finalMessageId),
  })
}

export function finalizeQl7SupportProductionDelivery({
  productionTurn = {},
  runtime = null,
  replyPlan = null,
  surface = null,
  composerPolicy = null,
  locale = '',
  topic = '',
  messageAct = '',
  finalMessageId = '',
} = {}) {
  const canonicalRuntime = runtime || productionTurn.runtime || productionTurn
  return projectQl7SupportProductionDelivery(canonicalRuntime, {
    replyPlan,
    surface,
    composerPolicy,
    locale,
    topic,
    messageAct,
    finalMessageId,
  })
}

export function executeQl7SupportProductionTurn(input = {}, adapters = {}) {
  const runtimeInput = buildQl7SupportProductionTurnInput(input)
  const runtime = executeQl7SupportTurnRuntime(runtimeInput, adapters)
  const delivery = projectQl7SupportProductionDelivery(runtime)

  return Object.freeze({
    version: QL7_SUPPORT_PRODUCTION_TURN_VERSION,
    runtimeInput,
    localePolicy: runtime.localePolicy,
    runtime,
    replyPlan: runtime.replyPlan,
    surface: runtime.surface,
    composerPolicy: runtime.composerPolicy,
    delivery,
  })
}
