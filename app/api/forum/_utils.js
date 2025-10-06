// app/api/forum/_utils.js
import { cookies } from 'next/headers'

// lightweight helpers (совместимы с исходной кодовой базой)
export function now() { return Date.now() }
export function toStr(x) { return String(x ?? '') }
export function parseIntSafe(x, d=0) { const n = parseInt(x,10); return Number.isFinite(n) ? n : d }
export function bool01(b) { return b ? '1' : '0' }

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
export function bad(msg = 'bad_request', status = 400) {
  return json({ error: msg }, status)
}

/* =========================
   Admin cookie helpers
   - FOR DEPLOY ON VERCEL: cookie must have secure flag when in prod (NODE_ENV === 'production')
========================= */

export function setAdminCookie(resHeaders) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  // cookie format: forum_admin=1; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax; Secure (in prod)
  let cookie = `forum_admin=1; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  if (isProd) cookie += '; Secure'
  // We cannot set headers on Response object from here; caller should set header 'Set-Cookie' equal to cookie string
  resHeaders['Set-Cookie'] = cookie
  return cookie
}

export function clearAdminCookie(resHeaders) {
  let cookie = `forum_admin=0; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  if (isProd) cookie += '; Secure'
  resHeaders['Set-Cookie'] = cookie
  return cookie
}

export function isAdminFromCookies() {
  try {
    const c = cookies()
    return c.get('forum_admin')?.value === '1'
  } catch (e) {
    return false
  }
}

/* =========================
   Helpers for request identity:
   - For writes we require header 'x-forum-user-id' OR 'userId' in JSON body
   - Admin endpoints accept either:
       * existing forum_admin cookie OR
       * header 'x-admin-token' === process.env.FORUM_ADMIN_PASS
========================= */

export function getUserIdFromReq(req, body = null) {
  // prefer header
  const uid = req.headers.get('x-forum-user-id') || (body && body.userId) || ''
  return toStr(uid)
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

export function requireAdmin(req) {
  // 1) cookie
  if (isAdminFromCookies()) return true
  // 2) header token
  const token = req.headers.get('x-admin-token') || ''
  const pass = process.env.FORUM_ADMIN_PASS || ''
  if (token && pass && token === pass) return true
  const err = new Error('admin_only')
  err.status = 401
  throw err
}
