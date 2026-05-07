import { Buffer } from 'node:buffer'
import { json, parseIntSafe } from '../../_utils.js'
import { K, getFollowersCount, redis, subscriptionScore } from '../../_db.js'
import { resolveCanonicalAccountId, resolveCanonicalAccountIds } from '../../../profile/_identity.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const VIEWER_PREFIX = 'forum:subs:viewer:'
const DEFAULT_VIEWER_COUNT = 20
const MAX_VIEWER_COUNT = 100
const DEFAULT_LINK_COUNT = 500
const MAX_LINK_COUNT = 2000

const encodeCursor = (payload) => {
  try { return Buffer.from(JSON.stringify(payload || {}), 'utf8').toString('base64url') } catch { return null }
}

const decodeCursor = (raw) => {
  const s = String(raw || '').trim()
  if (!s || s === '0') return {}
  try { return JSON.parse(Buffer.from(s, 'base64url').toString('utf8')) || {} } catch { return {} }
}

const normalizeScanResult = (raw) => {
  const list = Array.isArray(raw) ? raw : []
  return {
    cursor: String(list[0] ?? '0'),
    values: Array.isArray(list[1]) ? list[1].map((v) => String(v || '').trim()).filter(Boolean) : [],
  }
}

const requireAdminSecret = (req) => {
  const expected = String(process.env.FORUM_ADMIN_SECRET || '').trim()
  const got = String(req?.headers?.get('x-admin-secret') || '').trim()
  return !!expected && got === expected
}

async function canonicalizeIdsPreservingOrder(ids) {
  const raw = Array.isArray(ids) ? ids.map((id) => String(id || '').trim()).filter(Boolean) : []
  if (!raw.length) return []
  const resolved = await resolveCanonicalAccountIds(raw)
  const aliases = resolved?.aliases || {}
  const fallback = Array.isArray(resolved?.ids) ? resolved.ids : raw
  const out = []
  raw.forEach((id, idx) => {
    const next = String(aliases[id] || fallback[idx] || id || '').trim()
    if (next && !out.includes(next)) out.push(next)
  })
  return out
}

async function processViewerSet({ viewerId, setCursor, linkBudget }) {
  const raw = await redis.sscan(K.subsViewerSet(viewerId), setCursor || '0', {
    count: Math.max(1, Math.min(500, linkBudget)),
  })
  const page = normalizeScanResult(raw)
  if (!page.values.length) {
    return {
      nextSetCursor: page.cursor,
      processedLinks: 0,
      addedLinks: 0,
      touchedAuthors: [],
    }
  }

  const canonicalViewer = await resolveCanonicalAccountId(viewerId)
  if (!canonicalViewer) {
    return {
      nextSetCursor: page.cursor,
      processedLinks: page.values.length,
      addedLinks: 0,
      touchedAuthors: [],
    }
  }

  const canonicalAuthors = await canonicalizeIdsPreservingOrder(page.values)
  const authors = canonicalAuthors.filter((authorId) => authorId && authorId !== canonicalViewer)
  if (!authors.length) {
    return {
      nextSetCursor: page.cursor,
      processedLinks: page.values.length,
      addedLinks: 0,
      touchedAuthors: [],
    }
  }

  const pipe = redis.multi()
  authors.forEach((authorId, idx) => {
    const score = subscriptionScore(canonicalViewer, authorId, Date.now() - idx)
    pipe.sadd(K.subsFollowersSet(authorId), canonicalViewer)
    pipe.zadd(K.subsFollowingZSet(canonicalViewer), { score, member: authorId })
    pipe.zadd(K.subsFollowersZSet(authorId), { score, member: canonicalViewer })
  })

  const rawExec = await pipe.exec()
  const flat = Array.isArray(rawExec) ? rawExec.map((value) => (value?.result ?? value)) : []
  let addedLinks = 0
  for (let i = 0; i < authors.length; i += 1) {
    if (flat[i * 3] === 1 || flat[i * 3] === true || flat[i * 3] === '1') addedLinks += 1
  }

  return {
    nextSetCursor: page.cursor,
    processedLinks: page.values.length,
    addedLinks,
    touchedAuthors: Array.from(new Set(authors)),
  }
}

async function refreshFollowerCounts(authorIds) {
  const authors = Array.from(new Set((Array.isArray(authorIds) ? authorIds : []).map((id) => String(id || '').trim()).filter(Boolean)))
  for (const authorId of authors) {
    const [zCount, setCount, existing] = await Promise.all([
      redis.zcard(K.subsFollowersZSet(authorId)).catch(() => 0),
      redis.scard(K.subsFollowersSet(authorId)).catch(() => 0),
      getFollowersCount(authorId),
    ])
    const next = Math.max(Number(zCount || 0), Number(setCount || 0), Number(existing || 0))
    await redis.set(K.subsFollowersCount(authorId), String(next))
  }
}

export async function POST(req) {
  if (!requireAdminSecret(req)) {
    return json({ ok: false, error: 'forbidden' }, 403)
  }

  const { searchParams } = new URL(req.url)
  const payload = decodeCursor(searchParams.get('cursor'))
  const viewerCount = Math.max(1, Math.min(MAX_VIEWER_COUNT, parseIntSafe(searchParams.get('count'), DEFAULT_VIEWER_COUNT)))
  let linkBudget = Math.max(1, Math.min(MAX_LINK_COUNT, parseIntSafe(searchParams.get('linkCount'), DEFAULT_LINK_COUNT)))
  let scanCursor = String(payload.scanCursor || '0')
  let activeViewer = String(payload.activeViewer || '').trim()
  let setCursor = String(payload.setCursor || '0')
  let scannedViewerSets = 0
  let processedLinks = 0
  let addedLinks = 0
  const touchedAuthors = new Set()

  try {
    while (linkBudget > 0 && scannedViewerSets < viewerCount) {
      if (activeViewer) {
        const result = await processViewerSet({ viewerId: activeViewer, setCursor, linkBudget })
        processedLinks += result.processedLinks
        addedLinks += result.addedLinks
        result.touchedAuthors.forEach((authorId) => touchedAuthors.add(authorId))
        linkBudget -= result.processedLinks

        if (result.nextSetCursor && result.nextSetCursor !== '0') {
          setCursor = result.nextSetCursor
          break
        }

        activeViewer = ''
        setCursor = '0'
        scannedViewerSets += 1
      }

      if (!activeViewer) {
        const rawScan = await redis.scan(scanCursor, { match: `${VIEWER_PREFIX}*`, count: viewerCount })
        const scan = normalizeScanResult(rawScan)
        scanCursor = scan.cursor

        for (const key of scan.values) {
          if (scannedViewerSets >= viewerCount || linkBudget <= 0) break
          const viewerId = key.startsWith(VIEWER_PREFIX) ? key.slice(VIEWER_PREFIX.length) : ''
          if (!viewerId) continue
          const result = await processViewerSet({ viewerId, setCursor: '0', linkBudget })
          scannedViewerSets += 1
          processedLinks += result.processedLinks
          addedLinks += result.addedLinks
          linkBudget -= result.processedLinks
          result.touchedAuthors.forEach((authorId) => touchedAuthors.add(authorId))
          if (result.nextSetCursor && result.nextSetCursor !== '0') {
            activeViewer = viewerId
            setCursor = result.nextSetCursor
            break
          }
        }

        if (scanCursor === '0' && !activeViewer) break
      }
    }

    await refreshFollowerCounts(Array.from(touchedAuthors))

    const hasMore = !!activeViewer || scanCursor !== '0'
    const nextCursor = hasMore ? encodeCursor({ scanCursor, activeViewer, setCursor }) : null

    return json({
      ok: true,
      scannedViewerSets,
      processedLinks,
      addedLinks,
      touchedAuthors: touchedAuthors.size,
      mode: 'safe',
      hasMore,
      nextCursor,
    }, 200)
  } catch (e) {
    return json({
      ok: false,
      error: String(e?.message || e || 'rebuild_followers_failed'),
      scannedViewerSets,
      processedLinks,
      addedLinks,
      touchedAuthors: touchedAuthors.size,
    }, 500)
  }
}
