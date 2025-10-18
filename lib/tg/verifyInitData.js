// lib/tg/verifyInitData.js
import crypto from 'crypto'

function getSecretKey(botToken) {
  // secret = HMAC_SHA256("WebAppData", botToken)
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
}

function parseInitData(initData) {
  // initData — это querystring, например "query_id=...&user=%7B...%7D&hash=..."
  const params = new URLSearchParams(initData)
  const obj = {}
  for (const [k, v] of params) obj[k] = v
  return obj
}

export function verifyInitData(initData, botToken) {
  const parsed = parseInitData(initData)
  const hash = parsed.hash
  if (!hash) throw new Error('HASH_MISSING')

  // собираем data_check_string (все поля кроме hash, сортировка по ключу, "k=value" на каждой строке)
  const check = Object.keys(parsed)
    .filter(k => k !== 'hash')
    .sort()
    .map(k => `${k}=${parsed[k]}`)
    .join('\n')

  const secretKey = getSecretKey(botToken)
  const hmac = crypto.createHmac('sha256', secretKey).update(check).digest('hex')

  if (hmac !== hash) throw new Error('INVALID_SIGNATURE')

  // распакуем user (в initData — это JSON-строка)
  let user = null
  try { user = JSON.parse(parsed.user || 'null') } catch {}

  return {
    raw: parsed,
    user,
    auth_date: Number(parsed.auth_date || 0) || 0,
    query_id: parsed.query_id || null,
  }
}
