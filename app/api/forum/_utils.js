// app/api/forum/_utils.js
import { cookies } from 'next/headers'

/* =========================
   Lightweight helpers (совместимы с исходной базой)
========================= */
export function now() { return Date.now() }
export function toStr(x) { return String(x ?? '') }
export function parseIntSafe(x, d = 0) { const n = parseInt(x, 10); return Number.isFinite(n) ? n : d }
export function bool01(b) { return b ? '1' : '0' }

/** Безопасный JSON.parse */
export function safeParse(raw, fallback = null) {
  if (raw == null) return fallback
  if (typeof raw === 'object') return raw
  try { return JSON.parse(String(raw)) } catch { return fallback }
}

/** Унифицированный JSON-ответ */
export function json(data, status = 200, extraHeaders = {}) {
  const headers = { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  return new Response(JSON.stringify(data), { status, headers })
}
export function bad(msg = 'bad_request', status = 400, extra = {}) {
  return json({ error: msg, ...extra }, status)
}

/* =========================
   Admin cookie helpers
   - В проде кука ставится с Secure
========================= */
export function setAdminCookie(resHeaders = {}) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  // cookie format: forum_admin=1; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax; Secure (в проде)
  let cookie = `forum_admin=1; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  if (isProd) cookie += '; Secure'
  resHeaders['Set-Cookie'] = cookie
  return cookie
}
export function clearAdminCookie(resHeaders = {}) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  let cookie = `forum_admin=0; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  if (isProd) cookie += '; Secure'
  resHeaders['Set-Cookie'] = cookie
  return cookie
}
export function isAdminFromCookies() {
  try { return cookies().get('forum_admin')?.value === '1' } catch { return false }
}

/* =========================
   Identity helpers
   - Для мутаций требуется userId в заголовке или теле
   - Админ-эндпоинты принимают только admin cookie
========================= */

/** Получить userId из запроса: сначала из заголовка, потом из тела */
export function getUserIdFromReq(req, body = null) {
  const hdr = req?.headers?.get('x-forum-user-id') || ''
  const inline = body && (body.userId ?? body.accountId) // терпим зеркальные названия
  return toStr(hdr || inline).trim()
}

/** Требовать userId, иначе 401 */
export function requireUserId(req, body = null) {
  const uid = getUserIdFromReq(req, body)
  if (!uid) {
    const err = new Error('missing_user_id')
    err.status = 401
    throw err
  }
  return uid
}

/** Требовать admin-cookie, иначе 403 */
export function requireAdmin(_req) {
  try {
    const cookieStore = cookies()
    const isAdmin = cookieStore.get('forum_admin')?.value === '1'
    if (!isAdmin) {
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
   Network helpers
========================= */

/** Извлечь клиентский IP (X-Forwarded-For / X-Real-IP), с учётом прокси */
export function getClientIp(req) {
  try {
    const h = req?.headers
    if (!h || typeof h.get !== 'function') return ''
    const xff = h.get('x-forwarded-for') || ''
    const ipFromXff = xff.split(',')[0]?.trim()
    return ipFromXff || (h.get('x-real-ip') || '').trim()
  } catch {
    return ''
  }
}

/** Простой OK-ответ */
export function ok(extra = {}, status = 200) {
  return json({ ok: true, ...extra }, status)
}

/** Утилита для слияния заголовков-объектов */
export function mergeHeaders(a = {}, b = {}) {
  const out = { ...(a || {}) }
  for (const [k, v] of Object.entries(b || {})) out[k] = v
  return out
}
