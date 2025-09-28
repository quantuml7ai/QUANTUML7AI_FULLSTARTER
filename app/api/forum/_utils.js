// app/api/forum/_utils.js

import { cookies } from 'next/headers'

export function json(obj, init) {
  return new Response(JSON.stringify(obj ?? {}), {
    status: init?.status || 200,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
}

export function bad(err, status = 400) {
  const msg = typeof err === 'string' ? err : (err?.message || 'error')
  console.error('API error:', err)
  return json({ ok: false, error: msg }, { status })
}

export function getUserFromCookies() {
  const c = cookies()
  // основной cookie
  let v = c.get('forum_uid')?.value
  // возможные альтернативные имена из твоих исходников
  if (!v) v = c.get('asherId')?.value
  if (!v) v = c.get('accountId')?.value
  if (!v) v = c.get('uid')?.value
  if (!v) return null
  return { accountId: String(v) }
}

export function requireUser() {
  const u = getUserFromCookies()
  if (!u?.accountId) throw Object.assign(new Error('unauthorized'), { status: 401 })
  return u
}

export function isAdminFromCookies() {
  const c = cookies()
  return c.get('forum_admin')?.value === '1'
}

export function requireAdmin() {
  if (!isAdminFromCookies()) throw Object.assign(new Error('admin_only'), { status: 401 })
  return true
}

// YYYY-MM-DD UTC
export function dayStr(date) {
  const d = date ? new Date(date) : new Date()
  return d.toISOString().slice(0, 10)
}
