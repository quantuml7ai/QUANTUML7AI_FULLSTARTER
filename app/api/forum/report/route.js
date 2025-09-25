// app/api/forum/report/route.js
// БОЕВАЯ: Репорт поста.
// Контракт: POST { target:'post', id, reason? } -> { ok }

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const RURL = process.env.UPSTASH_REDIS_REST_URL
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN

async function rcmd(command, ...args) {
  const r = await fetch(RURL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RTOK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: [command, ...args] }),
    cache: 'no-store',
  })
  const j = await r.json().catch(() => null)
  if (!j) throw new Error('upstash_error')
  return j.result
}

// ключи
const K = {
  post:    (id) => `forum:post:${id}`, // JSON (существование поста)
  reports:       'forum:reports',      // LIST (LPUSH JSON)
}

function pickUser(req) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') || ''
    const asherId   = req.headers.get('x-asher-id')   || null
    const accountId = req.headers.get('x-account-id') || null
    return asherId || accountId || ip || 'anon'
  } catch {
    return 'anon'
  }
}

function nowTs(){ return Date.now() }

export async function POST(req) {
  try {
    if (!RURL || !RTOK) {
      return new Response(JSON.stringify({ ok:false, error:'misconfig' }), { status: 500 })
    }

    const { target, id, reason } = await req.json()
    if (target !== 'post' || !id) {
      return new Response(JSON.stringify({ ok:false, error:'bad_args' }), { status: 400 })
    }

    // проверим, что пост существует (мягко)
    const postRaw = await rcmd('GET', K.post(id))
    if (!postRaw) {
      return new Response(JSON.stringify({ ok:false, error:'post_not_found' }), { status: 404 })
    }

    const payload = {
      target: 'post',
      id: String(id),
      user: pickUser(req),
      reason: String(reason ?? 'abuse').slice(0, 128),
      ts: nowTs(),
    }

    await rcmd('LPUSH', K.reports, JSON.stringify(payload))

    return Response.json({ ok:true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:'srv' }), { status: 500 })
  }
}
