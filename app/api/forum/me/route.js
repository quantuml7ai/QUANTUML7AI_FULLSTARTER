// app/api/forum/me/route.js
// БОЕВАЯ: Профиль текущего пользователя (легкая проверка авторизации).
// Контракт: GET -> { ok, asherId, accountId }
// Ожидается credentials:'include' на клиенте.

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function parseCookies(header) {
  const out = {}
  if (!header) return out
  try {
    header.split(/;\s*/).forEach(pair => {
      const idx = pair.indexOf('=')
      if (idx > -1) {
        const k = decodeURIComponent(pair.slice(0, idx).trim())
        const v = decodeURIComponent(pair.slice(idx + 1).trim())
        if (k) out[k] = v
      }
    })
  } catch {}
  return out
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return null
}

export async function GET(req) {
  try {
    const headers = req.headers
    const cookies = parseCookies(headers.get('cookie') || '')

    // Популярные места, где ваш проект может держать идентификаторы:
    const asherId = firstNonEmpty(
      headers.get('x-asher-id'),
      cookies['__ASHER_ID__'],
      cookies['asherId'],
      cookies['ql7_uid'] // иногда сюда кладут внутренний user id
    )

    const accountId = firstNonEmpty(
      headers.get('x-account-id'),
      cookies['__AUTH_ACCOUNT__'],
      cookies['accountId'],
      cookies['account'],
      cookies['wallet'] // если авторизация через кошелёк
    )

    const ok = !!(asherId || accountId)

    return new Response(JSON.stringify({ ok, asherId, accountId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, asherId: null, accountId: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }
}
