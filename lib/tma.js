// lib/tma.js
import crypto from 'crypto'

export function parseQS(qs) {
  const out = {}
  if (!qs) return out
  for (const part of qs.split('&')) {
    const [k, v] = part.split('=')
    if (!k) continue
    out[decodeURIComponent(k)] = decodeURIComponent(v || '')
  }
  return out
}

/**
 * Проверка подписи Telegram initData/tgWebAppData.
 * @param {string|object} initData - строка querystring или объект ключ-значение
 * @param {string} botToken - токен бота (из .env)
 * @returns { ok:boolean, data?:object, user?:object, error?:string }
 */
export function verifyInitData(initData, botToken) {
  try {
    if (!initData || !botToken) return { ok: false, error: 'NO_DATA_OR_TOKEN' }

    const obj = typeof initData === 'string' ? parseQS(initData) : { ...initData }

    const hash = obj.hash || obj.signature || ''
    if (!hash) return { ok: false, error: 'NO_HASH' }
    delete obj.hash
    delete obj.signature

    const dataCheckString = Object.keys(obj)
      .sort()
      .map(k => `${k}=${obj[k]}`)
      .join('\n')

    const secret = crypto.createHash('sha256').update(botToken).digest()
    const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')

    if (hmac !== String(hash).toLowerCase()) {
      return { ok: false, error: 'BAD_SIGNATURE' }
    }

    let user = null
    if (obj.user) { try { user = JSON.parse(obj.user) } catch {} }

    return { ok: true, data: obj, user }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) }
  }
}
