// app/api/forum/own/route.js
import { NextResponse } from 'next/server'
import { getClientIp, toStr } from '../_utils.js'

// Определяем origin из запроса (надёжно для любых рантаймов)
function getBaseUrl(req) {
  try {
    const u = new URL(req.url)
    return u.origin || ''
  } catch {
    return ''
  }
}

async function fetchJSON(url, init) {
  const r = await fetch(url, init)
  const text = await r.text().catch(() => '')
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}
  return { ok: r.ok, status: r.status, json: json ?? {} }
}

function isOwner(userId, entity) {
  const uid = String(userId || '').trim().toLowerCase()
  const owner = String(entity?.userId || entity?.accountId || '').trim().toLowerCase()
  return !!uid && !!owner && owner === uid
}

function ok(payload = {}, status = 200) {
  return NextResponse.json({ ok: true, ...payload }, { status })
}
function fail(code, status = 400, extra = {}) {
  // code — короткий ключ для клиента (через словарь t(code))
  return NextResponse.json({ ok: false, error: code, i18nKey: code, ...extra }, { status })
}

export async function POST(req) {
  try {
    const userId = String(req.headers.get('x-forum-user-id') || '').trim()
    if (!userId) return fail('forum_err_no_user', 401)

    const base = getBaseUrl(req)
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '').trim()

    // 1) Подтягиваем снапшот для проверки владения
    const snap = await fetchJSON(`${base}/api/forum/snapshot`, { cache: 'no-store' })
    const topics = Array.isArray(snap.json?.topics) ? snap.json.topics : []
    const posts  = Array.isArray(snap.json?.posts)  ? snap.json.posts  : []

    // Пробросим IP клиента в mutate, чтобы мгновенно срабатывали баны по IP
    const xfwd = req.headers.get('x-forwarded-for') || ''
    const xreal = req.headers.get('x-real-ip') || getClientIp(req) || ''
    const ipHeader = {}
    if (xfwd) ipHeader['x-forwarded-for'] = xfwd
    if (xreal) ipHeader['x-real-ip'] = xreal

    // Делегируем выполнение в mutate
    async function callMutate(ops) {
      return await fetchJSON(`${base}/api/forum/mutate`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forum-user-id': userId,
          ...ipHeader,
        },
        body: JSON.stringify({ userId, ops }),
      })
    }

    if (action === 'delete_topic') {
      const topicId = String(body?.topicId || '').trim()
      const topic = topics.find(t => String(t?.id) === topicId)
      if (!topic) return fail('forum_err_not_found', 404)
      if (!isOwner(userId, topic)) return fail('forum_err_forbidden', 403)

      const r = await callMutate([{ type: 'delete_topic', payload: { id: topicId } }])
      const applied = Array.isArray(r.json?.applied) ? r.json.applied : []
      const success = applied.some(x => !x?.error)
      return success
        ? ok({ applied })
        : fail(applied[0]?.error || 'forum_err_mutate_failed', r.status || 400, { applied })
    }

    if (action === 'delete_post') {
      const postId = String(body?.postId || '').trim()
      const post = posts.find(p => String(p?.id) === postId)
      if (!post) return fail('forum_err_not_found', 404)
      if (!isOwner(userId, post)) return fail('forum_err_forbidden', 403)

      const r = await callMutate([{ type: 'delete_post', payload: { id: postId } }])
      const applied = Array.isArray(r.json?.applied) ? r.json.applied : []
      const success = applied.some(x => !x?.error)
      return success
        ? ok({ applied })
        : fail(applied[0]?.error || 'forum_err_mutate_failed', r.status || 400, { applied })
    }

    if (action === 'edit_post') {
      const postId = String(body?.postId || '').trim()
      const text = String(body?.text || '')
      if (!text.trim()) return fail('forum_err_empty_text', 400)

      const post = posts.find(p => String(p?.id) === postId)
      if (!post) return fail('forum_err_not_found', 404)
      if (!isOwner(userId, post)) return fail('forum_err_forbidden', 403)

      const r = await callMutate([{ type: 'edit_post', payload: { id: postId, text } }])
      const applied = Array.isArray(r.json?.applied) ? r.json.applied : []
      const success = applied.some(x => !x?.error)
      return success
        ? ok({ applied })
        : fail(applied[0]?.error || 'forum_err_mutate_failed', r.status || 400, { applied })
    }

    return fail('forum_err_unknown_action', 400)
  } catch (e) {
    try { console.error('[own] error', e) } catch {}
    return fail('forum_err_internal', 500)
  }
}

// (опционально) запретим другие методы
export function GET()   { return fail('forum_err_method_not_allowed', 405) }
export function PUT()   { return fail('forum_err_method_not_allowed', 405) }
export function PATCH() { return fail('forum_err_method_not_allowed', 405) }
export function DELETE(){ return fail('forum_err_method_not_allowed', 405) }
