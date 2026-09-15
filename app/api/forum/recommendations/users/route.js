import { NextResponse } from 'next/server'
import { getUserIdFromReq } from '../../_utils.js'
import { resolveCanonicalAccountId, resolveCanonicalAccountIds } from '../../../profile/_identity.js'
import recommendationPool from '../../../../../lib/forum/forum-user-recommendation-pool.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// QL7_GEO111_RECOMMENDATIONS_PROJECTION_CANDIDATES_V1
// QL7_FORUM_USER_RECOMMENDATIONS_WEEKLY_SNAPSHOT_ROUTE_V2
// GET returns one weekly materialized snapshot. Rails are shuffled locally.
// POST is only a device-fired signal; the atomic Mongo lease owns build authority.

const normalizeId = (value) => String(value || '').trim()
const normalizeIdList = (values) => Array.from(new Set((Array.isArray(values) ? values : []).map(normalizeId).filter(Boolean)))

function parseCsvParam(searchParams, key) {
  const chunks = searchParams.getAll(key)
  if (!chunks.length) return []
  return normalizeIdList(chunks.flatMap((chunk) => String(chunk || '').split(',').map((value) => value.trim())))
}

async function resolveViewerAndExcludes(req, searchParams) {
  const viewerIdRaw = normalizeId(getUserIdFromReq(req) || searchParams.get('viewerId') || '')
  const excludeRawIds = parseCsvParam(searchParams, 'excludeIds')
  const [viewerId, resolvedExclude] = await Promise.all([
    viewerIdRaw ? resolveCanonicalAccountId(viewerIdRaw) : '',
    resolveCanonicalAccountIds(excludeRawIds),
  ])
  const excludeIds = normalizeIdList([...(resolvedExclude?.ids || []), ...excludeRawIds])
  return { viewerIdRaw, viewerId: normalizeId(viewerId || viewerIdRaw), excludeIds }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const { viewerId, excludeIds } = await resolveViewerAndExcludes(req, searchParams)

    const payload = await recommendationPool.getSnapshot({
      viewerId,
      excludeIds,
      requestIdentityResolved: true,
    })

    return NextResponse.json({ ...payload, viewerCanonicalId: viewerId }, {
      status: 200,
      headers: {
        'cache-control': 'no-store, max-age=0',
        'x-ql7-read-source': 'mongo_primary_top500',
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error?.message || error || 'recommendations_failed') }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const nowMs = Date.now()
    const targetBuildWeek = recommendationPool.weeklyBuildKey(nowMs)
    if (normalizeId(body?.targetBuildWeek) !== targetBuildWeek) {
      return NextResponse.json({
        ok: false,
        error: 'invalid_target_build_week',
        targetBuildWeek,
      }, { status: 409, headers: { 'cache-control': 'no-store, max-age=0' } })
    }

    const result = await recommendationPool.rebuildPool({
      force: false,
      reason: 'first_active_device_weekly_trigger',
      nowMs,
    })
    return NextResponse.json({ ok: true, ...result }, { status: 200, headers: { 'cache-control': 'no-store, max-age=0' } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error?.message || error || 'recommendation_pool_rebuild_failed') }, { status: 500 })
  }
}
