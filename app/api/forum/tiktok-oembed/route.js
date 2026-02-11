// app/api/forum/tiktok-oembed/route.js
// Server-side helper to resolve TikTok thumbnail_url via official oEmbed.

import { createHash } from 'crypto'
import { json, bad, safeParse } from '../_utils.js'
import { redis } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

const TTL_SEC = 7 * 24 * 60 * 60

const sha1 = (s) =>
  createHash('sha1').update(String(s || '')).digest('hex')

function isAllowedTikTokUrl(raw) {
  const s = String(raw || '').trim()
  if (!s) return false
  if (s.length > 600) return false
  try {
    const u = new URL(s)
    const host = String(u.hostname || '').toLowerCase()
    if (!(host === 'tiktok.com' || host.endsWith('.tiktok.com'))) return false
    // allow only real playable URLs (the same ones we embed on the client)
    if (!/\/@[\w.\-]+\/video\/\d+/i.test(String(u.pathname || ''))) return false
    return true
  } catch {
    return false
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const url = String(searchParams.get('url') || '').trim()
    if (!url) return bad('missing_url', 400)
    if (!isAllowedTikTokUrl(url)) return bad('invalid_tiktok_url', 400)

    const cacheKey = `forum:tiktok:oembed:${sha1(url)}`

    try {
      const cached = await redis.get(cacheKey)
      const j = cached ? safeParse(cached, null) : null
      const thumb = j && typeof j.thumbnailUrl === 'string' ? String(j.thumbnailUrl).trim() : ''
      if (j?.ok && thumb) return json({ ok: true, thumbnailUrl: thumb })
    } catch {}

    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    const r = await fetch(oembedUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json,text/plain,*/*',
        // some CDNs block default fetch UA; provide a deterministic UA
        'user-agent': 'Mozilla/5.0 (compatible; Q-LineBot/1.0)',
      },
      cache: 'no-store',
    })

    const data = await r.json().catch(() => null)
    const thumb =
      data && typeof data.thumbnail_url === 'string'
        ? String(data.thumbnail_url).trim()
        : ''

    if (!r.ok || !thumb) {
      return json(
        {
          ok: false,
          error: data?.error || `oembed_http_${r.status}`,
          thumbnailUrl: null,
        },
        502,
        { 'cache-control': 'no-store, max-age=0' },
      )
    }

    const out = { ok: true, thumbnailUrl: thumb }
    try { await redis.set(cacheKey, JSON.stringify(out), { ex: TTL_SEC }) } catch {}
    return json(out)
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500, {
      'cache-control': 'no-store, max-age=0',
    })
  }
}

