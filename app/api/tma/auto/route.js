// app/api/tma/auto/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { verifyInitData, parseQS } from '@/lib/tma'

export const dynamic = 'force-dynamic'
const redis = Redis.fromEnv()

function setCookie(res, name, value, opts = {}) {
  res.cookies.set(name, value, {
    path: '/',
    sameSite: 'Lax',
    secure: true,
    ...opts,
  })
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    // по умолчанию отправляем на /forum
    const returnTo = url.searchParams.get('return') || '/forum'

    // initData может прийти как tgWebAppData или initData
    let initData = url.searchParams.get('tgWebAppData') || url.searchParams.get('initData') || ''

    // Если открыли напрямую из WebApp и Telegram положил init data в hash (#tgWebAppData=...)
    // попробуем вытащить из фейкового ?__hash= (подхватят прокси/реверсы)
    if (!initData) {
      const hash = url.searchParams.get('__hash')
      if (hash && hash.includes('=') && hash.includes('&')) {
        const obj = parseQS(hash.replace(/^#/, ''))
        initData = obj.tgWebAppData || obj.initData || ''
      }
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 })
    }

    const ver = verifyInitData(initData, botToken)
    if (!ver.ok) {
      return NextResponse.json({ ok: false, error: ver.error }, { status: 400 })
    }

    const tgUser = ver.user || {}
    const tgId = String(tgUser.id || '').trim()
    if (!tgId) {
      return NextResponse.json({ ok: false, error: 'NO_TG_USER_ID' }, { status: 400 })
    }

    // tgId -> accountId (создаём, если нет)
    let accountId = await redis.get(`tg:uid:${tgId}`)
    if (!accountId) {
      accountId = `tg:${tgId}`
      await redis.set(`tg:uid:${tgId}`, accountId, { ex: 60 * 60 * 24 * 365 }) // 1 год
    }

    // профиль (hash acc:<accountId>)
    const name =
      (tgUser.username ? '@' + tgUser.username : '') ||
      [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') ||
      `tg_${tgId}`

    await redis.hset(`acc:${accountId}`, {
      tg_id: tgId,
      tg_name: name,
      updated_at: Date.now(),
    })

    // Мгновенная авторизация на фронте: куки + localStorage + событие
    const html = `<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>
(function(){
  var id = ${JSON.stringify(String(accountId))};
  try {
    localStorage.setItem('asherId', id);
    localStorage.setItem('ql7_uid', id);
    window.__AUTH_ACCOUNT__ = id;
    window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: id, provider: 'tma' } }));
  } catch(e){}
  try { if (window.Telegram && Telegram.WebApp && Telegram.WebApp.ready) Telegram.WebApp.ready(); } catch(e){}
  // Возврат на указанный маршрут
  location.replace(${JSON.stringify(returnTo)});
})();
</script>`

    const res = new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    // фронту нужны не-httpOnly — чтобы AuthNav/форум сразу увидели id
    setCookie(res, 'asherId', accountId, { httpOnly: false })
    setCookie(res, 'ql7_uid', accountId, { httpOnly: false })
    // опциональная httpOnly-сессия (если нужна)
    setCookie(res, 'sid', `tg.${tgId}.${accountId}`, { httpOnly: true })
    return res
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
