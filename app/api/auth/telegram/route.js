// app/api/auth/telegram/route.js
import crypto from 'crypto'

/** Проверка initData по токену бота */
function verifyTelegramInitData(initData, botToken) {
  // initData — это строка из window.Telegram.WebApp.initData
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return false
  params.delete('hash')

  // Сортируем по ключу и собираем data_check_string
  const dataCheckArr = []
  for (const [k, v] of Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    dataCheckArr.push(`${k}=${v}`)
  }
  const dataCheckString = dataCheckArr.join('\n')

  // Секретный ключ = HMAC_SHA256(key="WebAppData", msg=botToken)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  // Правильный хеш = HMAC_SHA256(key=secretKey, msg=dataCheckString) в hex
  const calcHex = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  // Сравниваем байты (оба буфера из hex)
  const a = Buffer.from(calcHex, 'hex')
  const b = Buffer.from(hash, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const initData = body?.initData || ''
    const tgUserJson = body?.user || '' // необязательно, просто кэш user

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    if (!BOT_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'NO_BOT_TOKEN' }), { status: 500 })
    }
    if (!initData) {
      return new Response(JSON.stringify({ ok: false, error: 'NO_INITDATA' }), { status: 400 })
    }

    const ok = verifyTelegramInitData(initData, BOT_TOKEN)
    if (!ok) {
      return new Response(JSON.stringify({ ok: false, error: 'BAD_SIGNATURE' }), { status: 401 })
    }

    // Достаём user из initData (URLSearchParams уже декодит)
    const params = new URLSearchParams(initData)
    const userRaw = params.get('user') || tgUserJson || ''
    let user = null
    try { user = userRaw ? JSON.parse(userRaw) : null } catch { user = null }

    if (!user || !user.id) {
      return new Response(JSON.stringify({ ok: false, error: 'NO_USER' }), { status: 400 })
    }

    // Мэппинг: по tg_user_id получаем (или создаём) локальный аккаунт
    const accountId = `tg:${user.id}`
    const display = user.username
      ? `@${user.username}`
      : `${user.first_name || ''} ${user.last_name || ''}`.trim()

    // TODO: проверь VIP в Redis/БД
    // const isVip = await redis.sIsMember('vip_users', accountId)
    const isVip = false

    // Возвращаем payload (cookie/сессию можешь выставлять в своём middleware)
    return new Response(JSON.stringify({
      ok: true,
      accountId,
      isVip,
      display
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500 })
  }
}
