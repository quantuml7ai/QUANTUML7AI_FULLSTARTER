'use client'

import { useEffect } from 'react'

export default function AuthBridgePage() {
  useEffect(() => {
    const isTg = typeof window !== 'undefined' && (
      (window.Telegram && window.Telegram.WebApp) ||
      /telegram|tgwebapp/i.test(String(navigator.userAgent || ''))
    )

    // Куда вести на внешний браузер/обычный сайт
    // Можно поменять на свою страницу авторизации, если нужно
    const extUrl = 'https://www.quantuml7ai.com/subscribe?auth=start&from=tg-miniapp'

    if (isTg) {
      // Внутри Telegram — открываем внешний браузер через Telegram API
      try {
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(extUrl, { try_instant_view: false })
          // закрыть текущее WebApp-окно после запуска внешней ссылки
          setTimeout(() => { try { window.Telegram.WebApp.close() } catch {} }, 300)
        } else {
          window.location.href = extUrl
        }
      } catch {
        window.location.href = extUrl
      }
    } else {
      // Обычный браузер — триггерим вашу модалку и страхуемся редиректом
      try { window.dispatchEvent(new Event('open-auth')) } catch {}
      try { window.location.replace('/subscribe?auth=start') } catch {}
    }
  }, [])

  return (
    <main style={{ minHeight:'60vh', display:'grid', placeItems:'center', textAlign:'center' }}>
      <div>
        <h1 style={{ fontSize:24, marginBottom:8 }}>Redirecting to sign-in…</h1>
        <p>
          If nothing happens,&nbsp;
          <a href="/subscribe?auth=start">open the sign-in page</a>.
        </p>
      </div>
    </main>
  )
}
