// app/api/forum/own/route.js
import { NextResponse } from 'next/server'
import { getClientIp } from '../_utils.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
import forumPrimary from '../../../../lib/mongo/forum-primary.cjs'

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
  let parsed = null
  try { parsed = text ? JSON.parse(text) : null } catch {}
  return { ok: r.ok, status: r.status, json: parsed ?? {} }
}

function normOwnerId(value) {
  return String(value || '').trim().toLowerCase()
}

async function collectCanonicalOwnerIds(...values) {
  const ids = new Set()
  for (const value of values) {
    const raw = String(value || '').trim()
    if (!raw) continue
    ids.add(normOwnerId(raw))
    try {
      const canonical = String((await resolveCanonicalAccountId(raw)) || raw || '').trim()
      if (canonical) ids.add(normOwnerId(canonical))
    } catch {}
  }
  return ids
}

async function isOwner(userId, entity) {
  const userIds = await collectCanonicalOwnerIds(userId)
  const ownerIds = await collectCanonicalOwnerIds(entity?.userId, entity?.accountId)
  if (!userIds.size || !ownerIds.size) return false
  for (const id of userIds) if (ownerIds.has(id)) return true
  return false
}

function ok(payload = {}, status = 200) {
  return NextResponse.json({ ok: true, ...payload }, { status })
}

function fail(code, status = 400, extra = {}) {
  return NextResponse.json({ ok: false, error: code, i18nKey: code, ...extra }, { status })
}

async function getById(kind, id) {
  const sid = String(id || '').trim()
  if (!sid) return null
  return kind === 'post' ? forumPrimary.getPost(sid) : forumPrimary.getTopic(sid)
}

async function isOwnerOfEntity(userId, kind, id, entity) {
  if (await isOwner(userId, entity)) return true
  const fresh = await getById(kind, id)
  if (!fresh || fresh === entity) return false
  return isOwner(userId, fresh)
}

export async function POST(req) {
  try {
    const userId = String(req.headers.get('x-forum-user-id') || '').trim()
    if (!userId) return fail('forum_err_no_user', 401)

    const base = getBaseUrl(req)
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '').trim()
    // QL7_GEO111_OWN_ROUTE_NO_SNAPSHOT_FETCH_V1
    // Ownership checks read the exact entity from Mongo primary by id; no full forum snapshot is fetched.

    const xfwd = req.headers.get('x-forwarded-for') || ''
    const xreal = req.headers.get('x-real-ip') || getClientIp(req) || ''
    const ipHeader = {}
    if (xfwd) ipHeader['x-forwarded-for'] = xfwd
    if (xreal) ipHeader['x-real-ip'] = xreal

    async function callMutate(ops) {
      return fetchJSON(`${base}/api/forum/mutate`, {
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
      const topic = await getById('topic', topicId)
      if (!topic) return fail('forum_err_not_found', 404)
      if (!(await isOwnerOfEntity(userId, 'topic', topicId, topic))) return fail('forum_err_forbidden', 403)
      const r = await callMutate([{ type: 'delete_topic', payload: { id: topicId } }])
      const applied = Array.isArray(r.json?.applied) ? r.json.applied : []
      const success = applied.some((x) => !x?.error)
      return success ? ok({ applied }) : fail(applied[0]?.error || 'forum_err_mutate_failed', r.status || 400, { applied })
    }

    if (action === 'delete_post') {
      const postId = String(body?.postId || '').trim()
      const post = await getById('post', postId)
      if (!post) return fail('forum_err_not_found', 404)
      if (!(await isOwnerOfEntity(userId, 'post', postId, post))) return fail('forum_err_forbidden', 403)
      const r = await callMutate([{ type: 'delete_post', payload: { id: postId } }])
      const applied = Array.isArray(r.json?.applied) ? r.json.applied : []
      const success = applied.some((x) => !x?.error)
      return success ? ok({ applied }) : fail(applied[0]?.error || 'forum_err_mutate_failed', r.status || 400, { applied })
    }

    if (action === 'edit_post') {
      const postId = String(body?.postId || '').trim()
      const text = String(body?.text || '')
      if (!text.trim()) return fail('forum_err_empty_text', 400)
      const post = await getById('post', postId)
      if (!post) return fail('forum_err_not_found', 404)
      if (!(await isOwnerOfEntity(userId, 'post', postId, post))) return fail('forum_err_forbidden', 403)
      const r = await callMutate([{ type: 'edit_post', payload: { id: postId, text } }])
      const applied = Array.isArray(r.json?.applied) ? r.json.applied : []
      const success = applied.some((x) => !x?.error)
      return success ? ok({ applied }) : fail(applied[0]?.error || 'forum_err_mutate_failed', r.status || 400, { applied })
    }

    return fail('forum_err_unknown_action', 400)
  } catch (e) {
    try { console.error('[own] error', e) } catch {}
    return fail('forum_err_internal', 500)
  }
}

export function GET() { return fail('forum_err_method_not_allowed', 405) }
export function PUT() { return fail('forum_err_method_not_allowed', 405) }
export function PATCH() { return fail('forum_err_method_not_allowed', 405) }
export function DELETE() { return fail('forum_err_method_not_allowed', 405) }
