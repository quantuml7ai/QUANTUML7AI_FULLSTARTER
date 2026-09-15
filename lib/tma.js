// This file is CommonJS because it is loaded directly from both CommonJS and
// ESM server owners. Keeping the format explicit avoids Node's typeless-ESM
// reparsing path without changing the module mode of the rest of the project.
const crypto = require('node:crypto')

/** Разобрать сырую строку initData ("tgWebAppData") в объект, не портя значения */
function parseInitDataStr(initDataRaw = '') {
  const out = {}
  const s = String(initDataRaw || '')
  if (!s) return out
  for (const kv of s.split('&')) {
    if (!kv) continue
    const i = kv.indexOf('=')
    const k = i >= 0 ? kv.slice(0, i) : kv
    const v = i >= 0 ? kv.slice(i + 1) : ''
    out[k] = decodeURIComponent(v || '')
  }
  return out
}

/** Проверка подписи WebApp.initData (секрет = HMAC_SHA256("WebAppData", bot_token)) */
function verifyInitData(initDataRaw, botToken) {
  const data = parseInitDataStr(initDataRaw)
  const gotHash = String(data.hash || '').toLowerCase()
  if (!gotHash) return { ok: false, error: 'NO_HASH', data }

  // check_string: сортированные key=value, кроме hash
  const checkString = Object.keys(data)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n')

  // secret = HMAC_SHA256("WebAppData", bot_token)
  const secret = crypto.createHmac('sha256', 'WebAppData').update(String(botToken || '')).digest()
  const calc = crypto.createHmac('sha256', secret).update(checkString).digest('hex')

  const ok = calc === gotHash
  return ok ? { ok: true, data } : { ok: false, error: 'BAD_HASH', calc, got: gotHash, data }
}

/** Достать user.id из проверенных данных (поле user — JSON-строка) */
function extractTelegramUserId(verifiedDataObj) {
  try {
    const s = verifiedDataObj?.user
    if (!s) return null
    const u = typeof s === 'string' ? JSON.parse(s) : s
    return u && (u.id || u.user_id) ? String(u.id || u.user_id) : null
  } catch { return null }
}

exports.parseInitDataStr = parseInitDataStr
exports.verifyInitData = verifyInitData
exports.extractTelegramUserId = extractTelegramUserId
