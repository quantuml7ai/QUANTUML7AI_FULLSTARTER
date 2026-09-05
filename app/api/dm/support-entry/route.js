import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/config/featureFlag.js'
import { NextResponse } from 'next/server'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import { guardQl7SupportMutation } from '../../../../lib/ql7-support/http/requestGuard.js'
import {
  commitQl7SupportIdempotency,
  waitForQl7SupportIdempotency,
} from '../../../../lib/ql7-support/http/idempotencyStore.js'
import { buildQl7SupportEntryOperation } from '../../../../lib/ql7-support/http/entryOperation.js'
import { normalizeQl7SupportTimeZone } from '../../../../lib/ql7-support/conversation/temporalContext.js'
import {
  createQl7SupportEntryGreeting,
  createQl7SupportIdleNudge,
  removeQl7SupportEntryGreetings,
} from '../../../../lib/ql7-support/server.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'cache-control': 'no-store, max-age=0' } })
}
async function actorFor(req, body = {}) {
  const handle = await mongoClient.getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  const actor = await resolveQl7VerifiedActor({ req, body, database })
  return { actor, database }
}

async function commitOrReconcile({ database, requestGuard, response }) {
  try {
    await commitQl7SupportIdempotency({
      database,
      keyHash: requestGuard.idempotencyKeyHash,
      result: response,
      ownerToken: requestGuard.idempotency.ownerToken,
    })
    return response
  } catch (error) {
    const code = String(error?.code || error?.message || '')
    if (code !== 'support_idempotency_fencing_conflict') throw error
    const settled = await waitForQl7SupportIdempotency({
      database,
      keyHash: requestGuard.idempotencyKeyHash,
      timeoutMs: 30_000,
      pollMs: 250,
    })
    if (settled.state === 'committed' && settled.result) {
      return { ...settled.result, ok: true, deduped: true, reconciled: true }
    }
    const pending = new Error('support_entry_reconciliation_pending')
    pending.code = 'support_entry_reconciliation_pending'
    pending.status = 503
    throw pending
  }
}

export async function POST(req) {
  if (!isQl7SupportActive()) return json(ql7SupportDisabledPayload(), 404)
  try {
    const body = await req.json().catch(() => ({}))
    const { actor, database } = await actorFor(req, body)
    if (!actor?.valid) return json({ ok: false, error: actor?.failureCode || 'verified_session_required' }, 401)
    const entryOperation = buildQl7SupportEntryOperation({ action: body?.action || 'entry', entryNonce: body?.entryNonce || '', anchorId: body?.anchorId || '', clientMutationId: body?.clientMutationId || '' })
    const entryPayload = entryOperation.payload
    const operationId = entryOperation.operationId
    const requestGuard = await guardQl7SupportMutation({ req, database, actorId: actor.canonicalAccountId, routeId: 'dm.support-entry.post', operationId, payload: entryPayload, rateLimit: 20, rateWindowMs: 60000 })
    if (requestGuard.idempotency.replay && requestGuard.idempotency.result) return json(requestGuard.idempotency.result)
    if (requestGuard.idempotency.owner === false && requestGuard.idempotency.state === 'reserved') {
      const settled = await waitForQl7SupportIdempotency({
        database,
        keyHash: requestGuard.idempotencyKeyHash,
        timeoutMs: 30_000,
        pollMs: 400,
      })
      if (settled.state === 'committed' && settled.result) return json(settled.result)
      const pending = new Error('support_entry_reconciliation_pending')
      pending.code = 'support_entry_reconciliation_pending'
      pending.status = 503
      throw pending
    }
    const routeContextInput = body?.routeContext && typeof body.routeContext === 'object' ? body.routeContext : {}
    const routeContext = { ...routeContextInput, browserTimeZone: normalizeQl7SupportTimeZone(routeContextInput?.browserTimeZone || 'UTC') }
    const locale = String(routeContext?.preferredLocale || routeContext?.documentLang || body?.locale || req.headers.get('x-forum-locale') || 'en')
    if (body?.action === 'idle_nudge') {
      const result = await createQl7SupportIdleNudge({
        actor,
        locale,
        anchorId: String(body?.anchorId || ''),
      })
      if (result?.skipped) return json(result)
      const response = {
        ok: true,
        deduped: result.deduped === true,
        messageId: result.messageId,
        deliveryReceipt: result.productionDelivery?.receipt || null,
        requestGuardReceiptHash: requestGuard.guardReceiptHash,
      }
      return json(await commitOrReconcile({ database, requestGuard, response }))
    }
    const result = await createQl7SupportEntryGreeting({
      actor,
      locale,
      entryNonce: String(body?.entryNonce || ''),
      routeContext: { ...routeContext, sourceSurfaceId: 'messenger.support-entry' },
      requestBoundary: requestGuard,
    })
    const response = {
      ok: true,
      deduped: result.deduped === true,
      messageId: result.messageId,
      deliveryReceipt: result.productionDelivery?.receipt || null,
      requestGuardReceiptHash: requestGuard.guardReceiptHash,
    }
    return json(await commitOrReconcile({ database, requestGuard, response }))
  } catch (error) {
    const code = String(error?.code || error?.message || '')
    if (code === 'idempotency_conflict' || code === 'duplicate_operation' || code === 'operation_already_exists') {
      return json({ ok: true, deduped: true, duplicate: true, error: '' }, 200)
    }
    return json({ ok: false, error: String(error?.message || 'support_entry_failed') }, Number(error?.status || 503))
  }
}

export async function DELETE(req) {
  if (!isQl7SupportActive()) return json(ql7SupportDisabledPayload(), 404)
  try {
    const body = await req.json().catch(() => ({}))
    const { actor, database } = await actorFor(req, body)
    if (!actor?.valid) return json({ ok: false, error: actor?.failureCode || 'verified_session_required' }, 401)
    const requestGuard = await guardQl7SupportMutation({ req, database, actorId: actor.canonicalAccountId, routeId: 'dm.support-entry.delete', operationId: String(body?.clientMutationId || `delete-entry:${Math.floor(Date.now()/300000)}`), payload: { action: 'delete_entry_greetings' }, rateLimit: 10, rateWindowMs: 60000 })
    if (requestGuard.idempotency.replay && requestGuard.idempotency.result) return json(requestGuard.idempotency.result)
    if (requestGuard.idempotency.owner === false && requestGuard.idempotency.state === 'reserved') {
      const settled = await waitForQl7SupportIdempotency({ database, keyHash: requestGuard.idempotencyKeyHash, timeoutMs: 30_000, pollMs: 400 })
      if (settled.state === 'committed' && settled.result) return json(settled.result)
      return json({ ok: false, error: 'support_entry_reconciliation_pending' }, 503)
    }
    const response = await removeQl7SupportEntryGreetings({ actor })
    const committed = await commitOrReconcile({ database, requestGuard, response: { ...response, requestGuardReceiptHash: requestGuard.guardReceiptHash } })
    return json(committed)
  } catch (error) {
    return json({ ok: false, error: String(error?.message || 'support_entry_cleanup_failed') }, Number(error?.status || 503))
  }
}
