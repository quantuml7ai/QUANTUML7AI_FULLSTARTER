import { Buffer } from 'node:buffer'
import { json, parseIntSafe } from '../../_utils.js'
import { indexUserSearchNick, redis } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NICK_KEY_RE = /^forum:user:(.+):nick$/
const DEFAULT_COUNT = 100
const MAX_COUNT = 500

const requireAdminSecret = (req) => {
  const expected = String(process.env.FORUM_ADMIN_SECRET || '').trim()
  const got = String(req?.headers?.get('x-admin-secret') || '').trim()
  return !!expected && got === expected
}

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

export async function POST(req) {
  if (!requireAdminSecret(req)) {
    return json({ ok: false, error: 'forbidden' }, 403)
  }

  const { searchParams } = new URL(req.url)
  const payload = decodeCursor(searchParams.get('cursor'))
  const count = Math.max(1, Math.min(MAX_COUNT, parseIntSafe(searchParams.get('count'), DEFAULT_COUNT)))
  const rawScan = await redis.scan(String(payload.scanCursor || '0'), {
    match: 'forum:user:*:nick',
    count,
  })
  const scan = normalizeScanResult(rawScan)
  const keys = scan.values

  let processed = 0
  let indexed = 0

  try {
    const pipe = redis.multi()
    keys.forEach((key) => pipe.get(key))
    const rawNicks = keys.length ? await pipe.exec() : []
    const nicks = Array.isArray(rawNicks) ? rawNicks.map((value) => (value?.result ?? value)) : []

    for (let i = 0; i < keys.length; i += 1) {
      const match = keys[i].match(NICK_KEY_RE)
      const userId = String(match?.[1] || '').trim()
      const nick = String(nicks[i] || '').trim()
      if (!userId || !nick) continue
      processed += 1
      indexed += await indexUserSearchNick(userId, nick)
    }

    const hasMore = scan.cursor !== '0'
    return json({
      ok: true,
      processed,
      indexed,
      hasMore,
      nextCursor: hasMore ? encodeCursor({ scanCursor: scan.cursor }) : null,
    }, 200)
  } catch (e) {
    return json({
      ok: false,
      error: String(e?.message || e || 'user_search_rebuild_failed'),
      processed,
      indexed,
    }, 500)
  }
}
