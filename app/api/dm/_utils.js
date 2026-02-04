// app/api/dm/_utils.js
import { cookies } from 'next/headers'
import { resolveCanonicalAccountId } from '../profile/_identity.js'

export function now() { return Date.now() }
export function toStr(x) { return String(x ?? '') }
export function normalizeRawUserId(raw) {
  const id = toStr(raw).trim()
  if (!id) return ''
  return id.replace(/^(?:tguid:|tg:)/i, '')
}
export function parseIntSafe(x, d = 0) { const n = parseInt(x, 10); return Number.isFinite(n) ? n : d }

export function safeParse(raw, fallback = null) {
  if (raw == null) return fallback
  if (typeof raw === 'object') return raw
  try { return JSON.parse(String(raw)) } catch { return fallback }
}

export function json(data, status = 200, extraHeaders = {}) {
  const headers = { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  return new Response(JSON.stringify(data), { status, headers })
}
export function bad(msg = 'bad_request', status = 400, extra = {}) {
  return json({ ok: false, error: msg, ...extra }, status)
}
export function ok(extra = {}, status = 200) {
  return json({ ok: true, ...extra }, status)
}

export function getUserIdFromReq(req, body = null) {
  const hdr = req?.headers?.get('x-forum-user-id') || ''
  const inline = body && (body.userId ?? body.accountId)
  return toStr(hdr || inline).trim()
}
export function requireUserId(req, body = null) {
  const uid = getUserIdFromReq(req, body)
  if (!uid) {
    const err = new Error('missing_user_id')
    err.status = 401
    throw err
  }
  return uid
}

export async function canonicalizeUserId(raw) {
  const id = normalizeRawUserId(raw)
  if (!id) return ''
  try {
    return String(await resolveCanonicalAccountId(id)).trim()
  } catch {
    return id
  }
}

export async function requireUserIdCanonical(req, body = null) {
  const uid = getUserIdFromReq(req, body)
  const canonical = await canonicalizeUserId(uid)
  if (!canonical) {
    const err = new Error('missing_user_id')
    err.status = 401
    throw err
  }
  return canonical
}

export function isAdminFromCookies() {
  try { return cookies().get('forum_admin')?.value === '1' } catch { return false }
}
