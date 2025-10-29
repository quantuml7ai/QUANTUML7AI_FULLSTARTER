import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function b64urlEncode(obj) {
  const s = JSON.stringify(obj)
  return Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}

export async function GET(req) {
  try {
    const { searchParams, origin } = new URL(req.url)
    const provider = (searchParams.get('provider') || '').toLowerCase() // 'google' | 'apple' | ...
    const ret = searchParams.get('return') || '/'
    const bridge = (searchParams.get('bridge') || '').toLowerCase()     // '' | 'tma' | 'gsa'

    if (!provider) {
      return NextResponse.json({ ok:false, error:'NO_PROVIDER' }, { status:400 })
    }

    // Сформируй URL провайдера. Ниже — пример для Google OAuth 2.0.
    // Подставь свои CLIENT_ID/REDIRECT_URI в .env
    const GOOGLE_CLIENT_ID   = process.env.GOOGLE_CLIENT_ID
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/callback?provider=google`

    const state = b64urlEncode({
      r: ret,           // куда вернуться на сайте
      b: bridge,        // как возвращаемся (tma/gsa/empty)
      t: Date.now()     // метка времени (защита от реплея — доп.проверки можно добавить)
    })

    if (provider === 'google') {
      const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authURL.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authURL.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
      authURL.searchParams.set('response_type', 'code')
      authURL.searchParams.set('scope', 'openid email profile')
      authURL.searchParams.set('include_granted_scopes', 'true')
      authURL.searchParams.set('state', state)
      // ВАЖНО: никаких target=_blank — просто редирект в той же вкладке
      return NextResponse.redirect(authURL.toString(), { status: 302 })
    }

    // Добавь здесь другие провайдеры (apple/discord/x) по аналогии,
    // главное: в их callback тоже придёт наш state.

    return NextResponse.json({ ok:false, error:'PROVIDER_NOT_IMPLEMENTED' }, { status:501 })
  } catch (err) {
    return NextResponse.json({ ok:false, error:'SERVER_ERROR', message: String(err?.message || err) }, { status:500 })
  }
}
