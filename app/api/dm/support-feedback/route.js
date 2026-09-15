import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/config/featureFlag.js'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { bad, ok } from '../_utils.js'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import { guardQl7SupportMutation } from '../../../../lib/ql7-support/http/requestGuard.js'
import { commitQl7SupportIdempotency } from '../../../../lib/ql7-support/http/idempotencyStore.js'
import { hashQl7SupportDeliveryText } from '../../../../lib/ql7-support/contracts/finalDeliveryReceipt.js'
import { readQl7SupportLearningConsent } from '../../../../lib/ql7-support/learning/consentReceipt.js'
import {
  readQl7SupportPersonalityState,
  recordQl7SupportActionOutcome,
  recordQl7SupportOutcome,
  resolveLatestQl7SupportCognitiveTurn,
  writeQl7SupportPersonalityState,
} from '../../../../lib/ql7-support/cognitiveMemory.js'
import { assertQl7SupportUserInput } from '../../../../lib/ql7-support/limits.js'
import { buildQl7SupportPersonalityEvidence, buildQl7SupportPersonalityState } from '../../../../lib/ql7-support/personalityEngine.js'
import { recordQl7SupportLearningSignal } from '../../../../lib/ql7-support/learningPipeline.js'
import { recordQl7SupportOutcomeCalibration } from '../../../../lib/ql7-support/learning/outcomeCalibrationLedger.js'

function str(value) { return String(value ?? '').trim() }
async function database() {
  const handle = await mongoClient.getMongoDb()
  return handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
}

const OUTCOMES = Object.freeze(['clicked_action', 'action_failed', 'helpful', 'not_helpful', 'corrected_system', 'resolved', 'preferred_brief', 'preferred_detail'])
const CALIBRATION_OUTCOMES = new Set(['action_failed', 'not_helpful', 'corrected_system'])

export async function POST(req) {
  if (!isQl7SupportActive()) return bad(ql7SupportDisabledPayload().error, 404)
  const body = await req.json().catch(() => null)
  try {
    const db = await database()
    const actor = await resolveQl7VerifiedActor({ req, body: body || {}, database: db })
    if (!actor?.valid || !actor?.canonicalAccountId) return bad(actor?.failureCode || 'verified_session_required', 401)
    const operationId = str(body?.clientMutationId || body?.feedbackId || `${body?.outcomeType || 'feedback'}:${body?.messageId || body?.caseId || ''}`)
    const requestGuard = await guardQl7SupportMutation({ req, database: db, actorId: actor.canonicalAccountId, routeId: 'dm.support-feedback.post', operationId, payload: { outcomeType: body?.outcomeType, actionId: body?.actionId, routeId: body?.routeId, caseId: body?.caseId, messageId: body?.messageId, value: body?.value }, rateLimit: 30, rateWindowMs: 60000 })
    if (requestGuard.idempotency.replay && requestGuard.idempotency.result) return ok(requestGuard.idempotency.result)
    const outcomeType = str(body?.outcomeType).slice(0, 80)
    const actionId = str(body?.actionId).slice(0, 120)
    const routeId = str(body?.routeId).slice(0, 120)
    const caseId = str(body?.caseId).slice(0, 160)
    const messageId = str(body?.messageId).slice(0, 160)
    const value = str(body?.value)
    if (!OUTCOMES.includes(outcomeType)) return bad('invalid_support_outcome', 400)
    if (!caseId && !messageId) return bad('missing_support_reference', 400)
    const actorIdHash = hashQl7SupportDeliveryText(actor.canonicalAccountId)
    const deliveryQuery = { actorIdHash, commitState: 'committed', ...(messageId ? { finalMessageId: messageId } : { conversationId: caseId }) }
    const ownedDelivery = await db.collection('ql7_support_delivery_receipts').findOne(deliveryQuery).catch(() => null)
    if (!ownedDelivery) return bad('support_feedback_delivery_not_owned_or_missing', 404)
    if (value) assertQl7SupportUserInput(value, { locale: str(body?.locale || 'en') })

    const latestTurn = await resolveLatestQl7SupportCognitiveTurn({ database: db, userId: actor.canonicalAccountId, caseId, messageId })
    if (!latestTurn?.turnId) return bad('support_turn_not_found', 404)
    const turnId = str(latestTurn.turnId)
    const metadata = { caseId, messageId, routeId, topic: str(latestTurn.topic).slice(0, 80), subIntent: str(latestTurn.subIntent).slice(0, 120) }
    const result = await recordQl7SupportOutcome({ database: db, userId: actor.canonicalAccountId, turnId, outcomeType, value: actionId || value || outcomeType, metadata })

    if (actionId && ['clicked_action', 'action_failed'].includes(outcomeType)) {
      await recordQl7SupportActionOutcome({ database: db, userId: actor.canonicalAccountId, turnId, actionId, routeId, outcomeType, metadata }).catch(() => null)
    }

    const previousPersonality = await readQl7SupportPersonalityState({ database: db, userId: actor.canonicalAccountId }).catch(() => null)
    const evidence = buildQl7SupportPersonalityEvidence({ outcomeType, actionId, value, metadata: body?.metadata || {} })
    if (evidence.length) {
      const nextPersonality = buildQl7SupportPersonalityState({ previous: previousPersonality, evidence, locale: str(body?.locale || latestTurn.locale || 'en') })
      await writeQl7SupportPersonalityState({ database: db, userId: actor.canonicalAccountId, state: nextPersonality, evidenceType: outcomeType }).catch(() => null)
    }

    const learningConsent = await readQl7SupportLearningConsent({ database: db, actorId: actor.canonicalAccountId, purpose: 'quality_improvement' })
    const outcomeCalibration = await recordQl7SupportOutcomeCalibration({
      database: db, actorId: actor.canonicalAccountId, turnId, deliveryReceiptId: str(ownedDelivery.receiptId),
      outcomeType, topic: str(latestTurn.topic), locale: str(body?.locale || latestTurn.locale || 'en'),
      decisionMathReceipt: latestTurn?.decisionMathReceipt || null, objectiveReceipt: body?.objectiveReceipt || null,
      userExplicit: true, createdAt: new Date().toISOString(),
    }).catch(() => null)
    let candidateId = ''
    if (CALIBRATION_OUTCOMES.has(outcomeType) && learningConsent.granted === true && learningConsent.receipt?.receiptId) {
      const candidate = await recordQl7SupportLearningSignal({
        database: db,
        userId: actor.canonicalAccountId,
        caseId,
        topic: str(latestTurn.topic),
        subIntent: str(latestTurn.subIntent),
        sourceLocale: str(body?.locale || latestTurn.locale || 'en'),
        signalType: outcomeType,
        expected: value,
        actual: str(latestTurn.resultClass || latestTurn.responseMode),
        evidence: { turnId, actionId, routeId, responsePlanHash: str(latestTurn.responsePlanHash), userExplicitFeedback: true },
        consent: true,
        consentReceiptId: str(learningConsent.receipt?.receiptId),
      }).catch(() => null)
      candidateId = str(candidate?.candidateId)
    }

    const feedbackReceipt = {
      schema: 'ql7.support.feedback-receipt', schemaVersion: '5.1.0',
      actorIdHash, deliveryReceiptId: str(ownedDelivery.receiptId), deliveryReceiptHash: str(ownedDelivery.receiptHash),
      outcomeType, actionId, routeId, turnId, candidateId, learningConsentReceiptId: str(learningConsent.receipt?.receiptId),
      trustedGroundTruth: false, objectiveOutcomeVerified: outcomeCalibration?.trustedGroundTruth === true, outcomeCalibrationReceiptId: str(outcomeCalibration?.receiptId), outcomeCalibrationHash: str(outcomeCalibration?.receiptHash), createdAtServerUtc: new Date().toISOString(), requestGuardReceiptHash: requestGuard.guardReceiptHash,
    }
    feedbackReceipt.receiptHash = hashQl7SupportDeliveryText(JSON.stringify(feedbackReceipt))
    feedbackReceipt.receiptId = `feedback:${feedbackReceipt.receiptHash}`
    await db.collection('ql7_support_feedback_receipts').updateOne({ _id: feedbackReceipt.receiptId }, { $setOnInsert: { ...feedbackReceipt, _id: feedbackReceipt.receiptId } }, { upsert: true })
    const response = { ok: result?.ok === true, outcomeId: result?.id || '', candidateId, personalityUpdated: evidence.length > 0, outcomeCalibration: outcomeCalibration ? { receiptId: outcomeCalibration.receiptId || '', trustedGroundTruth: false, objectiveOutcomeVerified: outcomeCalibration.trustedGroundTruth === true, evidenceWeight: outcomeCalibration.evidenceWeight, calibrationError: outcomeCalibration.calibrationError } : null, feedbackReceipt }
    await commitQl7SupportIdempotency({ database: db, keyHash: requestGuard.idempotencyKeyHash, result: response })
    return ok(response)
  } catch (error) {
    const code = str(error?.message).slice(0, 160)
    if (/input_(?:empty|over_limit)/u.test(code)) return bad(code, 400)
    console.error('[QL7_SUPPORT_FEEDBACK_FAILED]', { code })
    return bad('ql7_support_feedback_unavailable', 500)
  }
}
