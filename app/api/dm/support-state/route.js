import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/featureFlag.js'
import { NextResponse } from 'next/server'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import { getQl7SupportRuntimeStateForUser } from '../../../../lib/ql7-support/server.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'cache-control': 'no-store, max-age=0' } })
}

export async function GET(req) {
  if (!isQl7SupportActive()) return json(ql7SupportDisabledPayload(), 404)
  try {
    const handle = await mongoClient.getMongoDb()
    const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
    const actor = await resolveQl7VerifiedActor({ req, body: {}, database })
    if (!actor?.valid || !actor?.canonicalAccountId) return json({ ok: false, error: actor?.failureCode || 'verified_session_required' }, 401)
    const { searchParams } = new URL(req.url)
    const correlationId = String(searchParams.get('correlationId') || '').trim()
    const state = await getQl7SupportRuntimeStateForUser({ userId: actor.canonicalAccountId, correlationId })
    return json({ ok: true, state: state ? {
      state: String(state.state || 'idle'),
      caseId: String(state.caseId || ''),
      correlationId: String(state.correlationId || ''),
      detailCode: String(state.detailCode || ''),
      changedAt: String(state.changedAt || ''),
      expired: state.expired === true,
      inputPolicy: state.inputPolicy && typeof state.inputPolicy === 'object' ? state.inputPolicy : null,
      history: Array.isArray(state.history) ? state.history.slice(-64).map((event) => ({
        eventId: String(event?.eventId || ''),
        sequence: Number(event?.sequence || 0),
        state: String(event?.state || 'idle'),
        detailCode: String(event?.detailCode || ''),
        caseId: String(event?.caseId || ''),
        correlationId: String(event?.correlationId || ''),
        changedAt: String(event?.changedAt || ''),
        finalMessageId: String(event?.finalMessageId || ''),
        surfaceHash: String(event?.surfaceHash || ''),
        inputPolicy: event?.inputPolicy && typeof event.inputPolicy === 'object' ? event.inputPolicy : null,
      })) : [],
    } : null })
  } catch (error) {
    console.error('[QL7_SUPPORT_STATE_FAILED]', String(error?.message || error).slice(0, 160))
    return json({ ok: false, error: 'ql7_support_state_unavailable' }, 503)
  }
}
