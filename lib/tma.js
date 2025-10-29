// lib/tma.js
import crypto from 'crypto'

/** Разобрать сырую строку initData ("tgWebAppData") в объект, не портя значения */
export function parseInitDataStr(initDataRaw = '') {
  const out = {}
  const s = String(initDataRaw || '')
  if (!s) return out
  for (const part of s.split('&')) {
    if (!part) continue
    const [k, v] = part.split('=')
    if (!k) continue
    // Берём именно URI-decoded строку как есть (user — это JSON-строка)
    out[k] = decodeURIComponent(v || '')
  }
  return out
}

/** Проверка подписи WebApp.initData согласно документации TG */
export function verifyInitData(initDataRaw, botToken) {
  const data = parseInitDataStr(initDataRaw)
  const hash = data.hash || ''
  if (!hash) return { ok: false, error: 'NO_HASH', data }

  // Строим data_check_string: сортированные пары key=value, кроме hash
  const checkString = Object.keys(data)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n')

  // Секрет = SHA256(bot_token)
  const secretKey = crypto.createHash('sha256').update(String(botToken || '')).digest()
  const calc = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  const ok = calc === hash
  return ok ? { ok: true, data } : { ok: false, error: 'BAD_HASH', calc, got: hash, data }
}

/** Достаём user.id из уже проверенного initData */
export function extractTelegramUserId(verifiedData) {
  try {
    const s = verifiedData?.user
    if (!s) return null
    const u = JSON.parse(s)
    return u && u.id ? String(u.id) : null
  } catch { return null }
}

