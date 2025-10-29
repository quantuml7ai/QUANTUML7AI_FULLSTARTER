'use client'

import { useEffect, useState } from 'react'

function readInitDataSafe() {
  // 1) Сырая строка initData (есть у Main App, то что нужно для верификации)
  try {
    const raw = window?.Telegram?.WebApp?.initData
    if (raw && typeof raw === 'string' && raw.includes('hash=')) {
      return { __raw: raw }
    }
  } catch {}

  // 2) Объект initDataUnsafe (если вдруг есть, но это НЕ сырая строка)
  try {
    const u = window?.Telegram?.WebApp?.initDataUnsafe
    if (u && u.user && u.user.id) {
      // серверу всё равно нужна сырая строка; тут сырых нет — пойдём в hash
      // оставим «метку», что TMA точно есть
    }
  } catch {}

  // 3) tgWebAppData в #hash (частый вариант при запуске по прямой ссылке)
  try {
    const h = (window.location.hash || '').slice(1)
    if (h) {
      const params = new URLSearchParams(h)
      const raw = params.get('tgWebAppData') || params.get('tgwebappdata')
      if (raw) return { __raw: decodeURIComponent(raw) }
    }
  } catch {}

  return null
}

export default function TmaAutoPage() {
  const [msg, setMsg] = useState('Authorizing…')

  useEffect(() => {
    (async () => {
      const data = readInitDataSafe()
      if (!data?.__raw) { setMsg('No initData from Telegram'); return }

      try {
        const r = await fetch('/api/tma/auto', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ initData: data.__raw })
        })
        const j = await r.json()
        if (!j.ok) { setMsg(`Auth failed: ${j.error || 'unknown'}`); return }

        try {
          if (j.accountId) {
            localStorage.setItem('ql7_uid', String(j.accountId))
            window.__AUTH_ACCOUNT__ = String(j.accountId)
            window.dispatchEvent(new CustomEvent('auth:ok', {
              detail: { accountId: String(j.accountId), provider: 'tg' }
            }))
          }
        } catch {}

        const url = new URL(window.location.href)
        const ret = url.searchParams.get('return') || '/forum'
        window.location.replace(ret)
      } catch {
        setMsg('Network error')
      }
    })()
  }, [])

  return (
    <div style={{color:'#9cf', padding:'24px', fontFamily:'system-ui, sans-serif'}}>
      <h1>Quantum L7 — Telegram Mini App</h1>
      <p>{msg}</p>
      <small>
        {typeof window!=='undefined' ? (window.Telegram?.WebApp?.initData ? 'initData present' : 'no initData') : ''}
      </small>
    </div>
  )
}
