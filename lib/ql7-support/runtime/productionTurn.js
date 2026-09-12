import {executeQl7SupportTurnRuntime} from './executeTurn.js'
import {createQl7SupportConversationMemoryGraph} from '../conversation/conversationMemoryGraph.js'
import {projectQl7SupportMemoryGraphToRuntimeState} from '../conversation/semanticContext.js'
import {resolveQl7SupportResponseLocale} from '../language/responseLocalePolicy.js'
import {ql7StableHash, ql7Str} from '../internal/text.js'
import {
  buildQl7SupportDeliveryBindingId,
  hashQl7SupportDeliveryText,
  hashQl7SupportDeliveryValue,
} from '../contracts/finalDeliveryReceipt.js'
import {buildQl7SupportCard} from '../cardSchema.js'
import {buildQl7SupportTurnRequestEnvelope} from '../contracts/supportTurnRequestEnvelope.js'
import {attachQl7SupportSignedChoices} from '../choiceContract.js'
import {prepareQl7SupportFinalDelivery} from './finalDeliveryVerifier.js'
import {buildQl7SupportCanonicalTurnContextAsync} from './canonicalContext.js'
import {enrichQl7SupportSemanticUnderstanding} from '../neural/understandingCoordinator.js'
import crypto from 'node:crypto'

export const QL7_SUPPORT_PRODUCTION_TURN_VERSION = '5.2.0'

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

  const memoryGraph = createQl7SupportConversationMemoryGraph({
    ...(input.priorMemoryGraph || input.memoryGraph || input.memory || {}),
    conversationId: input.conversationId || input.caseId || input.requestId || 'ql7-support-conversation',
  })
  const prior = projectQl7SupportMemoryGraphToRuntimeState(memoryGraph)
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
  const {
    deliverySigningKey: _deliverySigningKey,
    deliverySigningKeyId: _deliverySigningKeyId,
    finalizeSurface: _finalizeSurface,
    localizeFinalDelivery: _localizeFinalDelivery,
    choiceSigningKey: _choiceSigningKey,
    verifiedActorId: _verifiedActorId,
    neuralProvider: _neuralProvider,
    neuralProviderOptions: _neuralProviderOptions,
    ...safeInput
  } = input
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
  const priorMemorySource = input.priorMemoryGraph || input.memoryGraph || input.memory || {}
  const priorMemoryGraph = createQl7SupportConversationMemoryGraph({
    ...priorMemorySource,
    conversationId: input.conversationId || input.caseId || input.requestId || 'ql7-support-conversation',
    // updatedAt is part of the canonical memory hash. A read-only projection of
    // the prior graph must not rewrite it before the versioned memory commit.
    updatedAt: priorMemorySource.updatedAt || input.now || '',
  })
  const priorState = projectQl7SupportMemoryGraphToRuntimeState(priorMemoryGraph)
  const productionQuestionCode = ql7Str(
    input.productionQuestionCode ||
    analysis.currentQuestionCode ||
    priorState.waitingFor,
  )
  const baseAnalysisTrust = input.authoritativeAnalysis === true || input.baseAnalysisTrust === true ||
    contextualFollowupTrust({
      ...input,
      analysis,
      route,
      priorMemoryGraph,
    })
  const normalizedPriorMemoryGraph = createQl7SupportConversationMemoryGraph({
    ...priorMemoryGraph,
    activeTopic: priorState.activeTopic,
    waitingFor: priorState.waitingFor || productionQuestionCode,
  })

  const explicitActor = input.actor && typeof input.actor === 'object' ? input.actor : {}
  const verifiedActorId = ql7Str(input.verifiedActorId)
  const explicitActorId = ql7Str(explicitActor.canonicalAccountId || explicitActor.accountId || explicitActor.userId)
  const envelopeActor = explicitActorId || explicitActor.valid === false || !verifiedActorId
    ? explicitActor
    : Object.freeze({
        valid: true,
        canonicalAccountId: verifiedActorId,
        authMode: 'internal_verified_actor',
        actorReceiptId: `actor-receipt:internal:${hashQl7SupportDeliveryText(verifiedActorId)}`,
      })
  const routeId = input.routeId || (input.eventEnvelope ? 'support.event' : input.entryEvent ? 'support.entry' : 'dm.support.send')
  const requestEnvelope = input.requestEnvelope || buildQl7SupportTurnRequestEnvelope({
    requestId: input.requestId || input.correlationId || input.idempotencyKey,
    correlationId: input.correlationId || input.requestId,
    conversationId: input.conversationId || input.caseId || input.requestId,
    turnId: input.userTurnId || input.messageId || input.sourceEventId || input.requestId,
    clientMutationId: input.clientMutationId || input.idempotencyKey || input.requestId,
    idempotencyKey: input.idempotencyKey || input.clientMutationId || input.requestId,
    actor: envelopeActor,
    actorReceiptId: input.actorReceiptId || envelopeActor.actorReceiptId,
    text: input.originalText || input.text || input.sourceText || (input.eventEnvelope ? JSON.stringify(input.eventEnvelope.payload || {}) : 'event'),
    locale: localePolicy.locale,
    requestedLocale: input.selectedLocale || input.detectedLocale || input.locale || localePolicy.requested,
    routeId,
    sourceRouteId: input.sourceRouteId || routeId,
    sourceSurfaceId: input.sourceSurfaceId || input.routeContext?.sourceSurfaceId || (input.eventEnvelope ? 'support.event' : input.entryEvent ? 'support.entry' : 'messenger.support'),
    source: input.eventEnvelope ? 'event' : input.entryEvent ? 'event-entry' : input.mode || 'production',
    routeContext: input.routeContext || {},
    supportChoice: input.routeContext?.supportChoice || null,
    attachments: input.attachments || [],
    requestBoundary: input.requestBoundary || null,
    rawInputEvidence: input.rawInputEvidence || null,
    now: input.now,
  })


  return Object.freeze({
    ...safeInput,
    verifiedActorIdHash: hashQl7SupportDeliveryText(
      input.verifiedActorId || input.actor?.canonicalAccountId || input.actor?.id || 'anonymous',
    ),
    mode: ql7Str(input.mode || 'production') || 'production',
    requestedLocale: localePolicy.requested,
    selectedLocale: localePolicy.locale,
    priorMemoryGraph: normalizedPriorMemoryGraph,
    productionQuestionCode,
    requestEnvelope,
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

export async function resolveQl7SupportProductionUnderstanding(input = {}) {
  const analysis = input.analysis && typeof input.analysis === 'object' ? input.analysis : {}
  if (input.eventEnvelope || input.entryEvent || analysis.neuralUnderstandingReceipt?.receiptId) return input

  const text = ql7Str(input.originalText || input.text || input.sourceText)
  const locale = ql7Str(input.selectedLocale || input.detectedLocale || input.locale || analysis.locale || 'en')
  const dependencies = {
    neuralProvider: input.neuralProvider || null,
    neuralProviderOptions: input.neuralProviderOptions || {},
  }

  if (input.authoritativeAnalysis === true && ql7Str(analysis.topic)) {
    const semantic = await enrichQl7SupportSemanticUnderstanding({
      semantic: Object.freeze({
        version: 'trusted-production-understanding',
        locale,
        normalization: analysis.normalization || null,
        safety: analysis.safety || {},
        tone: input.tone || {},
        route: input.route || {},
        analysis,
      }),
      text,
      locale,
      previousContext: {},
      provider: dependencies.neuralProvider,
      providerOptions: dependencies.neuralProviderOptions,
    })
    return {
      ...input,
      analysis: semantic.analysis,
      route: semantic.route,
      tone: semantic.tone,
      authoritativeAnalysis: true,
      baseAnalysisTrust: true,
    }
  }

  const canonical = await buildQl7SupportCanonicalTurnContextAsync({
    text,
    locale,
    conversationId: ql7Str(input.conversationId || input.caseId || input.requestId),
    turnId: ql7Str(input.userTurnId || input.messageId || input.requestId),
    previousCase: {
      conversationMemoryGraph: input.priorMemoryGraph || input.memoryGraph || input.memory || {},
    },
    tone: input.tone || {},
    now: input.now,
  }, dependencies)
  return {
    ...input,
    analysis: canonical.analysis,
    route: canonical.route,
    tone: canonical.tone,
    conversationDecision: canonical.conversationDecision,
    authoritativeAnalysis: true,
    baseAnalysisTrust: true,
    canonicalUnderstandingReceiptId: canonical.neuralUnderstandingReceipt?.receiptId || '',
  }
}

function deriveDeliveryKeyFromConfiguredSecret(secret = '', source = 'configured') {
  const raw = ql7Str(secret)
  if (!raw) return null
  const signingKey = crypto
    .createHmac('sha256', raw)
    .update('ql7-support-final-delivery:canonical.1')
    .digest('base64url')
  return Object.freeze({
    signingKey,
    keyId: `delivery-key:${source}:${ql7StableHash(signingKey)}`,
  })
}

export function resolveQl7SupportDeliverySigningMaterial(input = {}, runtime = {}) {
  const requestedMode = ql7Str(input.mode || runtime.mode).toLowerCase()
  const mode = requestedMode || (process.env.NODE_ENV === 'test' ? 'test' : 'production')
  const explicit = ql7Str(input.deliverySigningKey)
  const dedicated = ql7Str(process.env.QL7_SUPPORT_DELIVERY_SIGNING_KEY)
  const session = ql7Str(process.env.SESSION_SECRET)
  const supportChoice = ql7Str(process.env.QL7_SUPPORT_CHOICE_SECRET)
  const forumSecret = ql7Str(process.env.QL7_FORUM_CURSOR_SECRET || process.env.FORUM_CURSOR_HMAC_SECRET)
  // An explicit production mode always remains fail-closed, even when the
  // caller is executed under a test runner. NODE_ENV may select the default
  // only when the caller did not provide a runtime mode.
  const nonProduction = ['test', 'simulation', 'replay', 'development'].includes(mode)

  let material = null
  if (explicit) material = Object.freeze({ signingKey: explicit, keyId: `delivery-key:explicit:${ql7StableHash(explicit)}` })
  else if (dedicated) material = Object.freeze({ signingKey: dedicated, keyId: `delivery-key:dedicated:${ql7StableHash(dedicated)}` })
  else if (session) material = Object.freeze({ signingKey: session, keyId: `delivery-key:session:${ql7StableHash(session)}` })
  else if (supportChoice) material = deriveDeliveryKeyFromConfiguredSecret(supportChoice, 'support-choice')
  else if (forumSecret) material = deriveDeliveryKeyFromConfiguredSecret(forumSecret, 'forum-runtime-env')
  else if (nonProduction) material = Object.freeze({
    signingKey: 'ql7-support-non-production-delivery-key.1',
    keyId: 'delivery-key:non-production.1',
  })

  if (!material?.signingKey) {
    const error = new Error('ql7_support_delivery_signing_key_unavailable')
    error.code = 'ql7_support_delivery_signing_key_unavailable'
    error.status = 503
    throw error
  }
  return Object.freeze({
    signingKey: material.signingKey,
    keyId: ql7Str(
      input.deliverySigningKeyId ||
      process.env.QL7_SUPPORT_DELIVERY_SIGNING_KEY_ID ||
      material.keyId,
    ),
  })
}

export async function resolveQl7SupportDeliverySigningMaterialForServer(input = {}, runtime = {}) {
  try {
    return resolveQl7SupportDeliverySigningMaterial(input, runtime)
  } catch (error) {
    if (error?.code !== 'ql7_support_delivery_signing_key_unavailable') throw error
  }

  try {
    const { default: serverSecret } = await import('../../security/ql7-server-secret.cjs')
    let derived
    try {
      derived = await serverSecret.deriveForumRuntimeSecret('ql7-support-final-delivery:canonical.1')
    } catch (error) {
      if (error?.code !== 'QL7_FORUM_RUNTIME_SECRET_NOT_SEEDED') throw error
      await serverSecret.ensureForumRuntimeSecret()
      derived = await serverSecret.deriveForumRuntimeSecret('ql7-support-final-delivery:canonical.1')
    }
    if (derived?.key) {
      const signingKey = Buffer.from(derived.key).toString('base64url')
      return Object.freeze({
        signingKey,
        keyId: ql7Str(
          input.deliverySigningKeyId ||
          process.env.QL7_SUPPORT_DELIVERY_SIGNING_KEY_ID ||
          `delivery-key:server-runtime:v${Number(derived.rotationVersion || 1)}:${ql7StableHash(signingKey)}`,
        ),
      })
    }
  } catch (error) {
    if (error?.code !== 'QL7_FORUM_RUNTIME_SECRET_INVALID') throw error
  }

  const error = new Error('ql7_support_delivery_signing_key_unavailable')
  error.code = 'ql7_support_delivery_signing_key_unavailable'
  error.status = 503
  throw error
}

export function resolveQl7SupportProjectionSigningMaterial(runtime = {}, options = {}) {
  const injectedSigningKey = ql7Str(options.signingKey)
  if (injectedSigningKey) {
    return Object.freeze({
      signingKey: injectedSigningKey,
      keyId: ql7Str(options.keyId || `delivery-key:provided:${ql7StableHash(injectedSigningKey)}`),
      source: 'provided_server_material',
    })
  }
  return resolveQl7SupportDeliverySigningMaterial(options.input || {}, runtime)
}

export function projectQl7SupportProductionDelivery(runtime = {}, delivered = {}, options = {}) {
  // Server execution resolves/bootstraps signing material asynchronously before
  // projection. Do not re-enter the synchronous env-only resolver when that
  // authoritative material has already been injected; doing so made real
  // support-entry/send fail with ql7_support_delivery_signing_key_unavailable.
  const signing = resolveQl7SupportProjectionSigningMaterial(runtime, options)
  const candidate = prepareQl7SupportFinalDelivery({
    runtime,
    delivered,
    signingKey: signing.signingKey,
    keyId: signing.keyId,
    idempotencyKey: options.idempotencyKey || runtime.idempotencyKey,
    actor: options.actor || runtime.actor,
    sourceEventId: options.sourceEventId || runtime.turnId,
    createdAtServerUtc: options.createdAtServerUtc || runtime.now,
    deliveryBindingId: options.deliveryBindingId,
    allowCanonicalSurfaceFinalization: options.allowCanonicalSurfaceFinalization === true,
    allowCanonicalLocalization: options.allowCanonicalLocalization === true,
  })
  return Object.freeze({
    ...candidate,
    projectionVersion: QL7_SUPPORT_PRODUCTION_TURN_VERSION,
    localeKind: ql7Str(runtime.localePolicy?.kind),
    safetyCategory: ql7Str(runtime.safety?.category),
    insultDecision: ql7Str(runtime.safety?.insultAssessment?.decision),
    resultKind: ql7Str(runtime.plan?.resultKind),
    factHash: ql7Str(runtime.factProjection?.factHash),
    composerAllowed: candidate.composerPolicy.allowed !== false,
    projectionHash: hashQl7SupportDeliveryValue({
      receiptHash: candidate.receipt.receiptHash,
      candidateHash: candidate.candidateHash,
    }),
  })
}

function resolveDeliveryActor(input = {}, runtime = {}) {
  const source = input.actor || runtime.actor || {}
  const verifiedActorId = ql7Str(
    input.verifiedActorId || source.canonicalAccountId || source.id || source.accountId,
  )
  if (!verifiedActorId && ql7Str(input.mode || runtime.mode).toLowerCase() === 'production') {
    const error = new Error('ql7_support_verified_delivery_actor_required')
    error.code = 'ql7_support_verified_delivery_actor_required'
    error.status = 401
    throw error
  }
  return Object.freeze({
    ...source,
    id: verifiedActorId || `simulation:${ql7StableHash(runtime.conversationId || runtime.requestId)}`,
  })
}

async function finalizeCanonicalSurface({ runtime = {}, input = {}, signing = {} } = {}) {
  const actor = resolveDeliveryActor(input, runtime)
  const idempotencyKey = ql7Str(input.idempotencyKey || input.clientMutationId || input.requestId)
  const deliveryBindingId = buildQl7SupportDeliveryBindingId({
    requestId: runtime.requestId,
    conversationId: runtime.conversationId,
    turnId: runtime.turnId,
    actor,
    sourceEventId: input.sourceEventId || input.userTurnId || input.messageId || runtime.turnId,
    idempotencyKey,
    scopeReceipt: runtime.scopeReceipt,
    semanticPlan: runtime.semanticPlan,
    memoryBeforeHash: runtime.memoryBefore?.memoryHash,
    memoryBeforeVersion: runtime.memoryBefore?.memoryVersion,
  })
  const baseCard = buildQl7SupportCard({
    ...(runtime.surface || {}),
    locale: runtime.localePolicy?.locale || runtime.surface?.locale || 'en',
    caseId: runtime.surface?.caseId || input.caseId,
    asOf: runtime.surface?.checkedAt || '',
    checkedAt: runtime.surface?.checkedAt || '',
    signedAt: runtime.now,
  })
  const hasChoices = Boolean(
    (Array.isArray(baseCard.options) && baseCard.options.length) || baseCard.other,
  )
  if (!hasChoices) {
    return Object.freeze({ actor, deliveryBindingId, surface: baseCard, commitArtifacts: null })
  }
  const choiceSecret = ql7Str(
    input.choiceSigningKey || process.env.QL7_SUPPORT_CHOICE_SECRET,
  )
  const choiceKeyId = choiceSecret
    ? `choice-key:${ql7StableHash(choiceSecret)}`
    : 'choice-key:server-derived-canonical'
  const signed = await attachQl7SupportSignedChoices({
    card: baseCard,
    database: null,
    userId: actor.id,
    ownerCaseId: input.caseId || runtime.conversationId,
    issuedAt: Date.parse(runtime.now || '') || Date.now(),
    secret: choiceSecret,
    deliveryBindingId,
    scopeReceiptHash: runtime.scopeReceipt?.receiptHash,
    conversationId: runtime.conversationId,
    locale: runtime.localePolicy?.locale,
    keyId: choiceKeyId,
  })
  if (!signed.signed || !signed.pendingChoice) {
    const error = new Error('ql7_support_choice_delivery_binding_failed')
    error.code = 'ql7_support_choice_delivery_binding_failed'
    error.status = 503
    throw error
  }
  const surface = buildQl7SupportCard({
    ...(signed.card || baseCard),
    locale: runtime.localePolicy?.locale || baseCard.locale || 'en',
    caseId: input.caseId || baseCard.caseId,
    signedAt: runtime.now,
  })
  return Object.freeze({
    actor,
    deliveryBindingId,
    surface,
    commitArtifacts: Object.freeze({ pendingChoice: signed.pendingChoice }),
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
  signingKey = '',
  keyId = '',
  idempotencyKey = '',
  actor = null,
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
  }, {
    input: productionTurn.runtimeInput || {},
    signingKey,
    keyId,
    idempotencyKey: idempotencyKey || productionTurn.runtimeInput?.idempotencyKey,
    actor: actor || productionTurn.runtimeInput?.actor,
    deliveryBindingId: productionTurn.delivery?.deliveryBindingId,
  })
}

export async function finalizeQl7SupportCanonicalRuntimeDelivery(runtime = {}, input = {}) {
  const signing = await resolveQl7SupportDeliverySigningMaterialForServer(input, runtime)
  if (typeof input.finalizeSurface === 'function') {
    const error = new Error('ql7_support_external_surface_finalizer_forbidden')
    error.code = 'ql7_support_external_surface_finalizer_forbidden'
    error.status = 409
    throw error
  }
  const canonical = await finalizeCanonicalSurface({ runtime, input, signing })
  let delivered = {
    surface: canonical.surface,
    commitArtifacts: canonical.commitArtifacts,
  }
  let surfaceFinalized = true
  let localized = false
  if (!runtime.localePolicy.supported) {
    if (typeof input.localizeFinalDelivery !== 'function') {
      const error = new Error('support_locale_temporarily_unavailable')
      error.code = 'support_locale_temporarily_unavailable'
      error.status = 503
      throw error
    }
    const localization = await input.localizeFinalDelivery({
      text: runtime.text,
      surface: delivered.surface || runtime.surface,
      composerPolicy: runtime.composerPolicy,
      sourceLocale: runtime.localePolicy.locale,
      targetLocale: runtime.localePolicy.requested,
      runtime,
    })
    delivered = {
      ...delivered,
      text: localization?.text,
      surface: localization?.surface || delivered.surface || runtime.surface,
      composerPolicy: localization?.composerPolicy || runtime.composerPolicy,
      locale: localization?.locale || runtime.localePolicy.requested,
      localizationReceipt: localization?.receipt,
      commitArtifacts: delivered.commitArtifacts || null,
    }
    localized = true
    surfaceFinalized = true
  }
  const delivery = projectQl7SupportProductionDelivery(runtime, delivered, {
    input,
    signingKey: signing.signingKey,
    keyId: signing.keyId,
    idempotencyKey: input.idempotencyKey || input.clientMutationId || input.requestId,
    actor: canonical.actor,
    sourceEventId: input.sourceEventId || input.userTurnId || input.messageId,
    createdAtServerUtc: input.now,
    deliveryBindingId: canonical.deliveryBindingId,
    allowCanonicalSurfaceFinalization: surfaceFinalized,
    allowCanonicalLocalization: localized,
  })
  return delivery
}

export async function executeQl7SupportProductionTurn(input = {}, adapters = {}) {
  const understoodInput = await resolveQl7SupportProductionUnderstanding(input)
  const runtimeInput = buildQl7SupportProductionTurnInput(understoodInput)
  const runtime = executeQl7SupportTurnRuntime(runtimeInput, adapters)
  const delivery = await finalizeQl7SupportCanonicalRuntimeDelivery(runtime, understoodInput)

  return Object.freeze({
    version: QL7_SUPPORT_PRODUCTION_TURN_VERSION,
    runtimeInput,
    localePolicy: runtime.localePolicy,
    runtime,
    replyPlan: runtime.replyPlan,
    surface: runtime.surface,
    composerPolicy: runtime.composerPolicy,
    neuralUnderstandingReceipt: runtime.analysis?.neuralUnderstandingReceipt || null,
    delivery,
  })
}

// canonical sequencing contract: server.js serializes actor+conversation turns and passes turnSequenceReceipt into the canonical runtime/delivery context; no parallel executor is introduced.
