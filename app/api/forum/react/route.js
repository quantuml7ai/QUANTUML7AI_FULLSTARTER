// app/api/forum/react/route.js
// БОЕВАЯ: Реакции на пост (эмодзи). 👍/👎 — взаимоисключение.
// Контракт: POST { target:'post', id, reaction, remove? } -> { ok }

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

const K = {
  post:       (id) => `forum:post:${id}`,                // JSON (существование поста)
  postReact:  (id) => `forum:post:${id}:reactions`,      // HMAP emoji -> count
  postReactBy:(id,emoji)=> `forum:post:${id}:reactions:users:${emoji}`, // SET of users (кто поставил)
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

// безопасный инкремент с «зажимом» не ниже 0
async function hincrClampZero(hashKey, field, delta) {
  const v = Number(await rcmd('HINCRBY', hashKey, field, delta)) || 0
  if (v < 0) {
    await rcmd('HSET', hashKey, field, 0)
    return 0
  }
  return v
}

export async function POST(req) {
  try {
    if (!RURL || !RTOK) {
      return new Response(JSON.stringify({ ok:false, error:'misconfig' }), { status: 500 })
    }

    const { target, id, reaction, remove = false } = await req.json()
    if (target !== 'post' || !id || !reaction) {
      return new Response(JSON.stringify({ ok:false, error:'bad_args' }), { status: 400 })
    }

    // убедимся, что пост существует (мягко)
    const postRaw = await rcmd('GET', K.post(id))
    if (!postRaw) {
      return new Response(JSON.stringify({ ok:false, error:'post_not_found' }), { status: 404 })
    }

    const uid = pickUser(req)
    const emoji = String(reaction)

    const hash = K.postReact(id)
    const set  = K.postReactBy(id, emoji)

    // Взаимоисключение для пары 👍/👎
    const isThumb = (emoji === '👍' || emoji === '👎')
    const other   = emoji === '👍' ? '👎' : (emoji === '👎' ? '👍' : null)

    if (isThumb && other) {
      const otherSet = K.postReactBy(id, other)
      const hadOther = await rcmd('SISMEMBER', otherSet, uid)
      if (hadOther) {
        await rcmd('SREM', otherSet, uid)
        await hincrClampZero(hash, other, -1)
      }
    }

    // Тоггл текущей реакции
    const has = await rcmd('SISMEMBER', set, uid)
    if (remove || has) {
      await rcmd('SREM', set, uid)
      await hincrClampZero(hash, emoji, -1)
    } else {
      await rcmd('SADD', set, uid)
      // если поле ещё не существует, HINCRBY создаст с 0
      await hincrClampZero(hash, emoji, +1)
    }

    return Response.json({ ok:true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:'srv' }), { status: 500 })
  }
}
