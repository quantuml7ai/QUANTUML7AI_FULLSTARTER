// app/api/geo/session-touch/route.js
// QL7_GEO111_GEO_IDENTITY_V1

import { NextResponse } from 'next/server'
import { resolveRequestGeo, publicSessionGeoSummary } from '../../../../lib/geo/request-geo.cjs'
import { resolveGeoActorIdentity } from '../../../../lib/identity/geo-identity.cjs'
import profileGeoPrimary from '../../../../lib/mongo/profile-geo-primary.cjs'
import { sanitizePublicForumPayload } from '../../../../lib/forum/public-sanitize.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function json(payload, status = 200) {
  return NextResponse.json(sanitizePublicForumPayload(payload), {
    status,
    headers: {
      'cache-control': 'no-store, max-age=0',
      'x-ql7-geo-session-touch': 'v2-city',
    },
  })
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const identity = await resolveGeoActorIdentity({ request, body }, {
      source: 'app/api/geo/session-touch/route.js:POST',
    })
    const accountId = String(identity?.canonicalAccountId || '').trim()
    if (!accountId) return json({ ok: false, error: 'missing_user_id' }, 401)

    const geo = resolveRequestGeo(request)
    const touch = await profileGeoPrimary.touchProfileGeo({
      accountId,
      geo,
      reason: body?.reason || 'session_touch',
      identitySafeDebug: identity.safeDebug || null,
    })
    const summary = publicSessionGeoSummary(geo, body?.lang || 'en', null)

    return json({
      ok: true,
      action: touch.action,
      accountId,
      known: summary.known,
      precision: summary.precision,
      countryCode: summary.countryCode,
      countryLabel: summary.countryLabel,
      region: summary.region,
      city: summary.city,
      cityLabel: summary.cityLabel,
      primaryLabel: summary.primaryLabel,
      geoStored: !!touch.geoStored,
      eventWritten: !!touch.eventWritten,
      storagePrimary: 'mongo',
    })
  } catch (error) {
    const code = String(error?.code || '')
    const status = code === 'QL7_GEO_IDENTITY_MISSING_CANONICAL' ? 401 : code === 'QL7_GEO_IDENTITY_ALIAS_CONFLICT' ? 409 : 500
    return json({ ok: false, error: String(error?.message || error), code }, status)
  }
}
