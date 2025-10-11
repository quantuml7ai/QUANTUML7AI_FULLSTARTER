// app/api/forum/_utils.js
import { cookies } from 'next/headers'

// ---------- lightweight helpers ----------
export function now() { return Date.now() }
export function toStr(x) { return String(x ?? '') }
export function parseIntSafe(x, d = 0) { const n = parseInt(x, 10); return Number.isFinite(n) ? n : d }
export function bool01(b) { return b ? '1' : '0' }

// Создаёт JSON-ответ с нужными заголовками
export function json(data, status = 200, extraHeaders) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
  })
  if (extraHeaders) {
    // корректно вливаем любые внешние хедеры
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (v != null) headers.set(k, String(v))
    }
  }
  return new Response(JSON.stringify(data), { status, headers })
}
export function bad(msg = 'bad_request', status = 400) {
  return json({ ok: false, error: msg }, status)
}

/* =========================
   Admin cookie helpers
   - On Vercel/production выставляем Secure
   - HttpOnly, SameSite=Lax по умолчанию
========================= */
function isProd() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

export function setAdminCookie(resHeaders = {}) {
  let cookie = `forum_admin=1; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  if (isProd()) cookie += '; Secure'
  resHeaders['Set-Cookie'] = cookie
  return cookie
}

export function clearAdminCookie(resHeaders = {}) {
  let cookie = `forum_admin=0; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  if (isProd()) cookie += '; Secure'
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
   Request identity / guards
   - Запись требует header 'x-forum-user-id' ИЛИ 'userId' в JSON body
   - Admin endpoints требуют валидную forum_admin cookie
========================= */
export function getUserIdFromReq(req, body = null) {
  // приоритет: заголовок → поле в body
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
  return uid
}

export function requireAdmin(_req) {
  try {
    const cookieStore = cookies()
    const ok = cookieStore.get('forum_admin')?.value === '1'
    if (!ok) {
      const err = new Error('not admin')
      err.status = 403
      throw err
    }
  } catch {
    const err = new Error('not admin')
    err.status = 403
    throw err
  }
}

/* =========================
   Small helpers for routes
========================= */

// Сливает Headers/объект заголовков в plain-объект (удобно для Response(..., { headers }))
export function headersToObject(h) {
  if (!h) return {}
  if (h instanceof Headers) {
    const o = {}
    for (const [k, v] of h.entries()) o[k] = v
    return o
  }
  return { ...h }
}

// Создаёт plain headers с возможностью добавить Set-Cookie заранее
export function makeHeaders(base = {}) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
    ...base,
  }
}
