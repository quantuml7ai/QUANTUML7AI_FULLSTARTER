// components/TelegramAuthButton.js
'use client'

export default function TelegramAuthButton() {
  const isTg = typeof window !== 'undefined' && !!(window.Telegram && window.Telegram.WebApp)

  const loginViaTelegramWebApp = async () => {
    try {
      const tg = window?.Telegram?.WebApp
      if (!tg) return
      tg.expand?.()
      const initData = tg.initData || ''
      const r = await fetch('/api/tg/webapp-login', {
        method: 'POST',
        headers: {
          'content-type':'application/json',
          'x-telegram-init-data': initData, // можно и в body, но так проще
        },
        body: JSON.stringify({ initData }), // дублируем для надёжности
        credentials: 'include',
      })
      const j = await r.json()
      if (j?.ok) {
        // перезагрузим, чтобы страница увидела авторизацию (кука уже стоит)
        window.location.reload()
      } else {
        alert('Telegram login failed: ' + (j?.error || 'Unknown error'))
      }
    } catch (e) {
      alert('Telegram login error: ' + e)
    }
  }

  if (!isTg) return null

  return (
    <button
      type="button"
      className="nav-auth-btn nav-auth-btn--tg"
      onClick={loginViaTelegramWebApp}
    >
      Continue with Telegram
    </button>
  )
}
