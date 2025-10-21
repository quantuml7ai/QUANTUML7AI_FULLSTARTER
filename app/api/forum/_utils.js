// app/api/forum/_utils.js
import { cookies } from 'next/headers'

export const UID_RE = /^[A-Za-z0-9:_-]{1,64}$/  // допустимые userId (анти-инъекции в ключи/логи)


// lightweight helpers (совместимы с исходной кодовой базой)
export function now() { return Date.now() }
export function toStr(x) { return String(x ?? '') }
export function parseIntSafe(x, d=0) { const n = parseInt(x,10); return Number.isFinite(n) ? n : d }
export function bool01(b) { return b ? '1' : '0' }

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
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
  // Caller должен проставить header 'Set-Cookie'
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
  } catch {
    return false
  }
}

/* =========================
   Helpers for request identity:
   - For writes we require header 'x-forum-user-id' OR 'userId' in JSON body
   - Admin endpoints accept only existing forum_admin cookie
========================= */

export function getUserIdFromReq(req, body = null) {
  // prefer header
  const raw = req.headers.get('x-forum-user-id') || (body && body.userId) || ''
  return toStr(raw).trim()
}

export function requireUserId(req, body = null) {
  const uid = getUserIdFromReq(req, body)
  if (!uid) {
    const err = new Error('missing_user_id')
    err.status = 401
    throw err
  }
  // строгая валидация идентификатора (без пробелов/юникода/SQL/Redis-якорей)
  if (!UID_RE.test(uid)) {
    const err = new Error('bad_user_id')
    err.status = 400
    throw err
  }  
  return uid
}

export function requireAdmin(req) {
  try {
    const cookieStore = cookies()
    const isAdmin = cookieStore.get('forum_admin')?.value === '1'
    if (!isAdmin) {
      const err = new Error('not admin')
      err.status = 403
      throw err
    }
  } catch (e) {
    // если cookies() недоступны по каким-то причинам — тоже 403
    const err = new Error('not admin')
    err.status = 403
    throw err
  }
}
