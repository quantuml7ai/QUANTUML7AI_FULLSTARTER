import {buildQl7SupportCard, validateQl7SupportCard} from '../cardSchema.js'
import {
  buildQl7SupportFinalDeliveryReceipt,
  hashQl7SupportDeliveryText,
  hashQl7SupportDeliveryValue,
  validateQl7SupportFinalDeliveryReceipt,
} from '../contracts/finalDeliveryReceipt.js'
import {ql7Arr, ql7Locale, ql7Str} from '../internal/text.js'
import {critiqueQl7SupportResponse} from '../response/critiqueResponse.js'
import {evaluateQl7SupportFinalHumanQuality} from '../response/finalHumanQualityGate.js'
import {buildQl7SupportNoveltyReservationDescriptors} from '../response/noveltyReservation.js'
import {commitQl7SupportNoveltyFingerprint} from '../response/semanticNoveltyLedger.js'

export const QL7_SUPPORT_FINAL_DELIVERY_VERIFIER_VERSION = '5.1.0'
export const QL7_SUPPORT_FINAL_DELIVERY_VERIFIER_OWNER_ID = 'ql7-support.final-delivery-verifier'

function visibleSurfaceStrings(surface = {}) {
  const rows = [
    surface.title,
    surface.summary,
    surface.status?.label,
    surface.other?.label,
    surface.other?.placeholder,
    ...ql7Arr(surface.badges).map((row) => row?.label),
    ...ql7Arr(surface.actions).map((row) => row?.label),
    ...ql7Arr(surface.options).flatMap((row) => [row?.label, row?.description]),
  ]
  for (const table of ql7Arr(surface.tables)) {
    rows.push(table?.title)
    rows.push(...ql7Arr(table?.columns).map((column) => column?.label))
    for (const row of ql7Arr(table?.rows)) {
      rows.push(row?.label, row?.value, row?.displayValue, row?.explanation)
    }
  }
  if (surface.table) {
    rows.push(surface.table.title)
    rows.push(...ql7Arr(surface.table.columns).map((column) => column?.label))
    for (const row of ql7Arr(surface.table.rows)) {
      rows.push(row?.label, row?.value, row?.displayValue, row?.explanation)
    }
  }
  return rows.map(ql7Str).filter(Boolean).join(' ')
}

function integrityError(code, details = []) {
  const error = new Error(code)
  error.code = code
  error.status = code === 'response_quality_unavailable' ? 503 : 409
  error.details = Object.freeze(ql7Arr(details))
  return error
}

function canonicalSurface(surface = {}, runtime = {}, locale = 'en') {
  if (surface?.schema === 'ql7.support.card' || Number(surface?.version) === 4) {
    const checked = validateQl7SupportCard(surface)
    if (!checked.ok) throw integrityError('delivery_integrity_failed', [checked.error])
    return checked.card
  }
  const generatedAt = ql7Str(
    surface.generatedAt || runtime.replyPlan?.userFacingAsOf || runtime.memoryGraph?.updatedAt,
  )
  const card = buildQl7SupportCard({
    ...surface,
    locale,
    caseId: surface.caseId || runtime.replyPlan?.caseId,
    asOf: surface.checkedAt || '',
    checkedAt: surface.checkedAt || '',
    signedAt: generatedAt,
  })
  const checked = validateQl7SupportCard(card)
  if (!checked.ok) throw integrityError('delivery_integrity_failed', [checked.error])
  return checked.card
}

function ensureNoSemanticMutation(runtime = {}, delivered = {}, {
  allowCanonicalLocalization = false,
} = {}) {
  const failures = []
  const runtimeText = ql7Str(runtime.text || runtime.replyPlan?.text)
  const deliveredText = ql7Str(delivered.text || delivered.replyPlan?.text || runtimeText)
  const runtimeLocale = ql7Locale(runtime.localePolicy?.locale || runtime.replyPlan?.locale || 'en')
  const deliveredLocale = ql7Locale(delivered.locale || runtimeLocale)
  const localization = delivered.localizationReceipt || {}
  const localized = allowCanonicalLocalization &&
    localization.status === 'translated' &&
    localization.sourceTextHash === hashQl7SupportDeliveryText(runtimeText) &&
    localization.targetTextHash === hashQl7SupportDeliveryText(deliveredText) &&
    ql7Locale(localization.targetLocale) === deliveredLocale &&
    localization.intentParity === true &&
    localization.factParity === true &&
    localization.actionParity === true
  if (runtimeText && deliveredText !== runtimeText && !localized) failures.push('post_runtime_text_mutation')
  if (runtimeLocale !== deliveredLocale && !localized) failures.push('post_runtime_locale_mutation')
  const runtimeTopic = ql7Str(runtime.analysis?.topic || runtime.plan?.topic)
  if (delivered.topic && ql7Str(delivered.topic) !== runtimeTopic) failures.push('post_runtime_topic_mutation')
  const runtimeAct = ql7Str(runtime.analysis?.messageAct || runtime.plan?.messageAct)
  if (delivered.messageAct && ql7Str(delivered.messageAct) !== runtimeAct) failures.push('post_runtime_message_act_mutation')
  if (failures.length) throw integrityError('delivery_integrity_failed', failures)
  return Object.freeze({ text: deliveredText, locale: deliveredLocale })
}

export function prepareQl7SupportFinalDelivery({
  runtime = {},
  delivered = {},
  signingKey = '',
  keyId = '',
  idempotencyKey = '',
  actor = {},
  sourceEventId = '',
  createdAtServerUtc = '',
  deliveryBindingId = '',
  allowCanonicalSurfaceFinalization = false,
  allowCanonicalLocalization = false,
} = {}) {
  const mutationCheck = ensureNoSemanticMutation(runtime, delivered, { allowCanonicalLocalization })
  const replyPlan = delivered.replyPlan || runtime.replyPlan || {}
  const rawSurface = delivered.surface || replyPlan.cardSpec || runtime.surface || {}
  const surface = canonicalSurface(rawSurface, runtime, mutationCheck.locale)
  const runtimeSurface = canonicalSurface(runtime.surface || runtime.replyPlan?.cardSpec || {}, runtime, runtime.localePolicy?.locale)
  if (delivered.surface && !allowCanonicalSurfaceFinalization && surface.integrity.signature !== runtimeSurface.integrity.signature) {
    throw integrityError('delivery_integrity_failed', ['post_runtime_surface_mutation'])
  }
  const actions = ql7Arr(surface.actions).length ? surface.actions : ql7Arr(surface.options)
  const composerPolicy = delivered.composerPolicy || runtime.composerPolicy || {}
  if (delivered.composerPolicy && !allowCanonicalLocalization && hashQl7SupportDeliveryValue(composerPolicy) !== hashQl7SupportDeliveryValue(runtime.composerPolicy || {})) {
    throw integrityError('delivery_integrity_failed', ['post_runtime_composer_policy_mutation'])
  }
  const critic = critiqueQl7SupportResponse({
    text: mutationCheck.text,
    surface,
    locale: mutationCheck.locale,
    plan: runtime.plan,
    receipts: runtime.receipts,
    expectedLocale: mutationCheck.locale,
  })
  const qualityGate = evaluateQl7SupportFinalHumanQuality({
    text: mutationCheck.text,
    title: surface.title,
    visibleSurfaceText: visibleSurfaceStrings(surface),
    locale: mutationCheck.locale,
    scopeReceipt: runtime.scopeReceipt,
    semanticPlan: runtime.semanticPlan,
    noveltyLedger: runtime.noveltyBefore,
    actions,
    legacyCritic: critic,
    immutableFactFragments: runtime.realized?.immutableFactFragments,
    realizationPropositionIds: runtime.realized?.propositions || [],
    contentPlan: runtime.plan || {},
    memoryGraph: runtime.memoryGraph || {},
  })
  if (!['allow', 'allow_with_observation'].includes(qualityGate.decision)) {
    throw integrityError('response_quality_unavailable', qualityGate.coherenceFailures)
  }
  const noveltyReservationDescriptors = buildQl7SupportNoveltyReservationDescriptors({
    actorIdHash: hashQl7SupportDeliveryText(
      actor?.canonicalAccountId || actor?.id || actor?.accountId || 'anonymous',
    ),
    conversationId: runtime.conversationId || runtime.memoryBefore?.conversationId,
    turnId: runtime.turnId || runtime.scopeReceipt?.turnId,
    locale: mutationCheck.locale,
    scopeReceipt: runtime.scopeReceipt,
    semanticPlan: runtime.semanticPlan,
    qualityGate,
  })
  const noveltyReservationIds = Object.freeze(
    noveltyReservationDescriptors.map((row) => row.reservationId),
  )
  const noveltyLedgerAfter = commitQl7SupportNoveltyFingerprint(
    runtime.noveltyBefore,
    mutationCheck.text,
    {
      locale: mutationCheck.locale,
      branch: `${runtime.scopeReceipt?.primaryDomainId}:${runtime.scopeReceipt?.selectedIntentId}`,
      title: surface.title,
      semanticPlanHash: runtime.semanticPlan?.planHash,
      immutableFactFragments: runtime.realized?.immutableFactFragments,
    },
  )
  const commitArtifacts = delivered.commitArtifacts || null
  const commitArtifactHash = hashQl7SupportDeliveryValue(commitArtifacts)
  const now = ql7Str(createdAtServerUtc || runtime.now || new Date().toISOString())
  const receipt = buildQl7SupportFinalDeliveryReceipt({
    requestId: runtime.requestId,
    conversationId: runtime.conversationId || runtime.memoryBefore?.conversationId,
    turnId: runtime.turnId || runtime.scopeReceipt?.turnId,
    actor,
    actorId: actor.canonicalAccountId || actor.id,
    sourceEventId: sourceEventId || runtime.scopeReceipt?.turnId,
    idempotencyKey,
    deliveryBindingId,
    runtimeVersion: runtime.runtimeVersion || runtime.version,
    executorId: runtime.executorId,
    behaviorManifestHash: runtime.behaviorManifestHash,
    scopeReceipt: runtime.scopeReceipt,
    semanticPlan: runtime.semanticPlan,
    qualityGate,
    memoryBeforeHash: runtime.memoryBefore?.memoryHash,
    memoryAfterHash: runtime.memoryGraph?.memoryHash,
    memoryBeforeVersion: runtime.memoryBefore?.memoryVersion,
    memoryAfterVersion: runtime.memoryGraph?.memoryVersion,
    text: mutationCheck.text,
    surface,
    actions,
    inputPolicy: composerPolicy,
    factReceipts: runtime.receipts,
    noveltyReservationIds,
    commitArtifacts,
    commitArtifactHash,
    commitState: 'prepared',
    createdAtServerUtc: now,
    keyId,
    signingKey,
  })
  const validation = validateQl7SupportFinalDeliveryReceipt(receipt, {
    signingKey,
    requireCommitted: false,
    requireSignature: Boolean(signingKey),
  })
  if (!validation.ok) throw integrityError('delivery_integrity_failed', validation.failures)
  const body = {
    schema: 'ql7.support.prepared-final-delivery',
    schemaVersion: QL7_SUPPORT_FINAL_DELIVERY_VERIFIER_VERSION,
    ownerId: QL7_SUPPORT_FINAL_DELIVERY_VERIFIER_OWNER_ID,
    deliveryStage: 'prepared',
    runtimeVersion: ql7Str(runtime.runtimeVersion || runtime.version),
    behaviorManifestHash: ql7Str(runtime.behaviorManifestHash),
    executorId: ql7Str(runtime.executorId),
    locale: mutationCheck.locale,
    topic: ql7Str(runtime.analysis?.topic || runtime.plan?.topic),
    messageAct: ql7Str(runtime.analysis?.messageAct || runtime.plan?.messageAct),
    responseCode: ql7Str(replyPlan.responseCode),
    text: mutationCheck.text,
    textHash: receipt.textHash,
    surface,
    surfaceHash: receipt.surfaceHash,
    composerPolicy: Object.freeze({ ...composerPolicy }),
    inputPolicyHash: receipt.inputPolicyHash,
    actions: Object.freeze(actions),
    actionIds: receipt.actionIds,
    actionSetHash: receipt.actionSetHash,
    qualityGate,
    noveltyReservationDescriptors,
    noveltyReservationIds,
    noveltyLedgerAfter,
    qualityReceiptHash: qualityGate.receiptHash,
    scopeReceiptHash: receipt.scopeReceiptHash,
    deliveryBindingId: receipt.deliveryBindingId,
    semanticPlanHash: receipt.semanticPlanHash,
    commitArtifactHash,
    finalMessageId: '',
    receipt,
    commitArtifacts,
  }
  return Object.freeze({
    ...body,
    candidateHash: hashQl7SupportDeliveryValue({
      textHash: body.textHash,
      surfaceHash: body.surfaceHash,
      inputPolicyHash: body.inputPolicyHash,
      qualityReceiptHash: body.qualityReceiptHash,
      scopeReceiptHash: body.scopeReceiptHash,
      deliveryBindingId: body.deliveryBindingId,
      memoryBeforeVersion: receipt.memoryBeforeVersion,
      memoryAfterVersion: receipt.memoryAfterVersion,
      commitArtifactHash: body.commitArtifactHash,
    }),
  })
}

export function verifyQl7SupportPreparedFinalDelivery(candidate = {}, {
  signingKey = '',
} = {}) {
  const failures = []
  const receiptCheck = validateQl7SupportFinalDeliveryReceipt(candidate.receipt, {
    signingKey,
    requireCommitted: false,
    requireSignature: Boolean(signingKey),
  })
  if (!receiptCheck.ok) failures.push(...receiptCheck.failures)
  if (candidate.deliveryStage !== 'prepared') failures.push('candidate_not_prepared')
  if (hashQl7SupportDeliveryText(candidate.text) !== candidate.textHash) failures.push('candidate_text_hash_mismatch')
  const surfaceCheck = validateQl7SupportCard(candidate.surface)
  if (!surfaceCheck.ok) failures.push(surfaceCheck.error || 'candidate_surface_invalid')
  else if (surfaceCheck.card.integrity.signature !== candidate.surfaceHash) failures.push('candidate_surface_hash_mismatch')
  if (candidate.receipt?.payloadHash && candidate.receipt.payloadHash !== hashQl7SupportDeliveryValue({
    textHash: candidate.textHash,
    surfaceHash: candidate.surfaceHash,
    actionSetHash: candidate.actionSetHash,
    inputPolicyHash: candidate.inputPolicyHash,
    scopeReceiptHash: candidate.scopeReceiptHash,
    deliveryBindingId: candidate.deliveryBindingId,
    memoryAfterHash: candidate.receipt.memoryAfterHash,
    memoryAfterVersion: candidate.receipt.memoryAfterVersion,
    commitArtifactHash: candidate.commitArtifactHash,
  })) failures.push('candidate_payload_hash_mismatch')
  if (candidate.deliveryBindingId !== candidate.receipt?.deliveryBindingId) failures.push('candidate_delivery_binding_mismatch')
  if (hashQl7SupportDeliveryValue(candidate.commitArtifacts || null) !== candidate.commitArtifactHash ||
    candidate.commitArtifactHash !== candidate.receipt?.commitArtifactHash) failures.push('candidate_commit_artifact_mismatch')
  const expectedCandidateHash = hashQl7SupportDeliveryValue({
    textHash: candidate.textHash,
    surfaceHash: candidate.surfaceHash,
    inputPolicyHash: candidate.inputPolicyHash,
    qualityReceiptHash: candidate.qualityReceiptHash,
    scopeReceiptHash: candidate.scopeReceiptHash,
    deliveryBindingId: candidate.deliveryBindingId,
    memoryBeforeVersion: candidate.receipt?.memoryBeforeVersion,
    memoryAfterVersion: candidate.receipt?.memoryAfterVersion,
    commitArtifactHash: candidate.commitArtifactHash,
  })
  if (!candidate.candidateHash || candidate.candidateHash !== expectedCandidateHash) failures.push('candidate_hash_mismatch')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze([...new Set(failures)]) })
}
