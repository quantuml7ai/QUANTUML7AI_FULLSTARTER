import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/featureFlag.js'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { bad, ok } from '../_utils.js'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import {
  readQl7SupportPersonalityStateV11,
  recordQl7SupportActionOutcomeV11,
  recordQl7SupportOutcomeV11,
  resolveLatestQl7SupportCognitiveTurnV11,
  writeQl7SupportPersonalityStateV11,
} from '../../../../lib/ql7-support/cognitiveMemoryV11.js'
import { assertQl7SupportUserInputV11 } from '../../../../lib/ql7-support/limitsV11.js'
import { buildQl7SupportPersonalityEvidenceV11, buildQl7SupportPersonalityStateV11 } from '../../../../lib/ql7-support/personalityEngineV11.js'
import { recordQl7SupportLearningSignal } from '../../../../lib/ql7-support/learningPipeline.js'

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
    const outcomeType = str(body?.outcomeType).slice(0, 80)
    const actionId = str(body?.actionId).slice(0, 120)
    const routeId = str(body?.routeId).slice(0, 120)
    const caseId = str(body?.caseId).slice(0, 160)
    const messageId = str(body?.messageId).slice(0, 160)
    const value = str(body?.value)
    if (!OUTCOMES.includes(outcomeType)) return bad('invalid_support_outcome', 400)
    if (!caseId && !messageId) return bad('missing_support_reference', 400)
    if (value) assertQl7SupportUserInputV11(value, { locale: str(body?.locale || 'en') })

    const latestTurn = await resolveLatestQl7SupportCognitiveTurnV11({ database: db, userId: actor.canonicalAccountId, caseId, messageId })
    if (!latestTurn?.turnId) return bad('support_turn_not_found', 404)
    const turnId = str(latestTurn.turnId)
    const metadata = { caseId, messageId, routeId, topic: str(latestTurn.topic).slice(0, 80), subIntent: str(latestTurn.subIntent).slice(0, 120) }
    const result = await recordQl7SupportOutcomeV11({ database: db, userId: actor.canonicalAccountId, turnId, outcomeType, value: actionId || value || outcomeType, metadata })

    if (actionId && ['clicked_action', 'action_failed'].includes(outcomeType)) {
      await recordQl7SupportActionOutcomeV11({ database: db, userId: actor.canonicalAccountId, turnId, actionId, routeId, outcomeType, metadata }).catch(() => null)
    }

    const previousPersonality = await readQl7SupportPersonalityStateV11({ database: db, userId: actor.canonicalAccountId }).catch(() => null)
    const evidence = buildQl7SupportPersonalityEvidenceV11({ outcomeType, actionId, value, metadata: body?.metadata || {} })
    if (evidence.length) {
      const nextPersonality = buildQl7SupportPersonalityStateV11({ previous: previousPersonality, evidence, locale: str(body?.locale || latestTurn.locale || 'en') })
      await writeQl7SupportPersonalityStateV11({ database: db, userId: actor.canonicalAccountId, state: nextPersonality, evidenceType: outcomeType }).catch(() => null)
    }

    let candidateId = ''
    if (CALIBRATION_OUTCOMES.has(outcomeType)) {
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
        consent: body?.learningConsent === true,
      }).catch(() => null)
      candidateId = str(candidate?.candidateId)
    }

    return ok({ ok: result?.ok === true, outcomeId: result?.id || '', candidateId, personalityUpdated: evidence.length > 0 })
  } catch (error) {
    const code = str(error?.message).slice(0, 160)
    if (/input_(?:empty|over_limit)/u.test(code)) return bad(code, 400)
    console.error('[QL7_SUPPORT_FEEDBACK_FAILED]', { code })
    return bad('ql7_support_feedback_unavailable', 500)
  }
}
