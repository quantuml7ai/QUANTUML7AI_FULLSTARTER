import { NextResponse } from 'next/server'
import { getUserIdFromReq } from '../../_utils.js'
import { resolveCanonicalAccountId, resolveCanonicalAccountIds } from '../../../profile/_identity.js'
import recommendationPool from '../../../../../lib/forum/forum-user-recommendation-pool.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// QL7_GEO111_RECOMMENDATIONS_PROJECTION_CANDIDATES_V1
// QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_ROUTE_V1
// Ordinary GET reads the materialized Mongo Top-500 only. Heavy ranking happens only in POST/CLI rebuild.

const DEFAULT_BATCH_SIZE = 15
const DEFAULT_BATCHES_PER_REQUEST = 4
const MAX_BATCH_SIZE = 24
const MAX_BATCHES_PER_REQUEST = 8

const normalizeId = (value) => String(value || '').trim()
const normalizeIdList = (values) => Array.from(new Set((Array.isArray(values) ? values : []).map(normalizeId).filter(Boolean)))

function parseCsvParam(searchParams, key) {
  const chunks = searchParams.getAll(key)
  if (!chunks.length) return []
  return normalizeIdList(chunks.flatMap((chunk) => String(chunk || '').split(',').map((value) => value.trim())))
}

function readBoundedNumber(searchParams, key, fallback, max) {
  const raw = Number(searchParams.get(key) || fallback)
  if (!Number.isFinite(raw)) return fallback
  return Math.max(1, Math.min(max, Math.trunc(raw)))
}

async function resolveViewerAndExcludes(req, searchParams) {
  const viewerIdRaw = normalizeId(getUserIdFromReq(req) || searchParams.get('viewerId') || '')
  const viewerId = viewerIdRaw ? await resolveCanonicalAccountId(viewerIdRaw) : ''
  const excludeRawIds = parseCsvParam(searchParams, 'excludeIds')
  const resolvedExclude = await resolveCanonicalAccountIds(excludeRawIds)
  const excludeIds = normalizeIdList([...(resolvedExclude?.ids || []), ...excludeRawIds])
  return { viewerIdRaw, viewerId: normalizeId(viewerId || viewerIdRaw), excludeIds }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    // Product invariant: every recommendation rail requests exactly 15 users.
    // Ignore legacy/client batchSize overrides (including the old value 6).
    const batchSize = DEFAULT_BATCH_SIZE
    const batchCount = readBoundedNumber(searchParams, 'batches', DEFAULT_BATCHES_PER_REQUEST, MAX_BATCHES_PER_REQUEST)
    const feedMode = normalizeId(searchParams.get('feedMode') || 'video')
    const sort = normalizeId(searchParams.get('sort') || 'random')
    const cursor = normalizeId(searchParams.get('cursor') || '')
    const { viewerId, excludeIds } = await resolveViewerAndExcludes(req, searchParams)

    const payload = await recommendationPool.getPage({
      viewerId,
      excludeIds,
      cursor,
      batchSize,
      batchCount,
      feedMode,
      sort,
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

export async function POST() {
  try {
    // Any open forum client may trigger this cheap endpoint when GET reports rebuildDue=true.
    // Atomic Mongo lease guarantees that only one server process actually rebuilds the pool.
    const result = await recommendationPool.rebuildPool({ force: false, reason: 'client_due_trigger' })
    return NextResponse.json({ ok: true, ...result }, { status: 200, headers: { 'cache-control': 'no-store, max-age=0' } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error?.message || error || 'recommendation_pool_rebuild_failed') }, { status: 500 })
  }
}
