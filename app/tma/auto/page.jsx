'use client'

import { useEffect, useState } from 'react'

function readInitDataSafe() {
  // 1) SDK
  try {
    const tg = window?.Telegram?.WebApp
    if (tg?.initDataUnsafe && tg.initDataUnsafe.user?.id) {
      return tg.initDataUnsafe
    }
  } catch {}

  // 2) Прямо из hash (Telegram кладёт tgWebAppData в #)
  try {
    const h = (window.location.hash || '').replace(/^#/, '')
    const params = new URLSearchParams(h)
    const raw = params.get('tgWebAppData') || params.get('tgwebappdata')
    // если нужен парсинг — back/route будет принимать raw строку
    if (raw) return { __raw: raw } // отдаём сырой blob, бэкенд проверит подпись
  } catch {}

  return null
}

export default function TmaAutoPage() {
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const data = readInitDataSafe()
      if (!data) { setMsg('No initData from Telegram'); return }

      try {
        // отправляем на серверную проверку/запись в Redis
        const r = await fetch('/api/tma/auto', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ initData: data.__raw || data })
        })
        const j = await r.json()
        if (!j.ok) { setMsg(`Auth failed: ${j.error || 'unknown'}`); return }

        // кладём локальные маркеры, чтобы AuthNavClient понял "мы авторизованы"
        try {
          if (j.accountId) {
            localStorage.setItem('ql7_uid', String(j.accountId))
            window.__AUTH_ACCOUNT__ = String(j.accountId)
            window.dispatchEvent(new CustomEvent('auth:ok', {
              detail: { accountId: String(j.accountId), provider: 'tg' }
            }))
          }
        } catch {}

        // редирект туда, откуда просили
        const url = new URL(window.location.href)
        const ret = url.searchParams.get('return') || '/forum'
        window.location.replace(ret)
      } catch (e) {
        setMsg('Network error')
      }
    })()
  }, [])

  return (
    <div style={{color:'#9cf', padding:'24px', fontFamily:'system-ui, sans-serif'}}>
      <h1>Quantum L7 — Telegram Mini App</h1>
      <p>{msg || 'Authorizing…'}</p>
      {/* На время отладки можно подсветить хэш */}
      <small>hash: {typeof window!=='undefined' ? window.location.hash : ''}</small>
    </div>
  )
}
