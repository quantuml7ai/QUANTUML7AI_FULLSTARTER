import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/featureFlag.js'
import { NextResponse } from 'next/server'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import {
  createQl7SupportEntryGreetingV8,
  removeQl7SupportEntryGreetingsV11,
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

export async function POST(req) {
  if (!isQl7SupportActive()) return json(ql7SupportDisabledPayload(), 404)
  try {
    const body = await req.json().catch(() => ({}))
    const { actor } = await actorFor(req, body)
    if (!actor?.valid) return json({ ok: false, error: actor?.failureCode || 'verified_session_required' }, 401)
    const routeContextInput = body?.routeContext && typeof body.routeContext === 'object' ? body.routeContext : {}
    const browserTimeZone = String(routeContextInput?.browserTimeZone || '').trim()
    const routeContext = { ...routeContextInput, browserTimeZone: /^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+.-]+)+$/.test(browserTimeZone) ? browserTimeZone : '' }
    const locale = String(routeContext?.preferredLocale || routeContext?.documentLang || body?.locale || req.headers.get('x-forum-locale') || 'en')
    const result = await createQl7SupportEntryGreetingV8({
      actor,
      locale,
      entryNonce: String(body?.entryNonce || ''),
      entryVariantId: String(body?.entryVariantId || ''),
      routeContext,
    })
    return json(result)
  } catch (error) {
    return json({ ok: false, error: String(error?.message || 'support_entry_failed') }, Number(error?.status || 503))
  }
}

export async function DELETE(req) {
  if (!isQl7SupportActive()) return json(ql7SupportDisabledPayload(), 404)
  try {
    const body = await req.json().catch(() => ({}))
    const { actor } = await actorFor(req, body)
    if (!actor?.valid) return json({ ok: false, error: actor?.failureCode || 'verified_session_required' }, 401)
    return json(await removeQl7SupportEntryGreetingsV11({ actor }))
  } catch (error) {
    return json({ ok: false, error: String(error?.message || 'support_entry_cleanup_failed') }, Number(error?.status || 503))
  }
}
