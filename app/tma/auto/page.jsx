// app/tma/auto/page.jsx
'use client'

import { useEffect, useState } from 'react'

export default function TmaAutoPage() {
  const [msg, setMsg] = useState('Authorizing…')

  useEffect(() => {
    (async () => {
      try {
        // Telegram WebApp SDK должен быть доступен ТОЛЬКО внутри мини-аппа
        const raw = window?.Telegram?.WebApp?.initData
        if (!raw || typeof raw !== 'string' || !raw.includes('hash=')) {
          setMsg('No valid initData (open inside Telegram Mini App)')
          return
        }

        // на всякий случай «разбудим» WebApp
        try { window.Telegram.WebApp.ready?.() } catch {}

        const ret = new URL(window.location.href).searchParams.get('return') || '/forum'

        // Отправляем СЫРУЮ строку initData без изменений
        const res = await fetch('/api/tma/auto?return=' + encodeURIComponent(ret), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: raw })
        })

        const j = await res.json().catch(() => ({}))
        if (!j.ok) {
          setMsg(`Auth failed: ${j.error || 'unknown'}`)
          return
        }

        // Локальные маркеры авторизации
        try {
          localStorage.setItem('ql7_uid', String(j.accountId))
          window.__AUTH_ACCOUNT__ = String(j.accountId)
          window.dispatchEvent(new CustomEvent('auth:ok', {
            detail: { accountId: String(j.accountId), provider: 'tg' }
          }))
        } catch {}

        window.location.replace(j.return || ret)
      } catch (e) {
        setMsg('Network error: ' + (e?.message || e))
      }
    })()
  }, [])

  const hasInit = typeof window !== 'undefined' && !!window?.Telegram?.WebApp?.initData

  return (
    <div style={{ color: '#9cf', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Quantum L7 — Telegram Mini App</h1>
      <p>{msg}</p>
      <small>{hasInit ? 'initData present' : 'no initData'}</small>
    </div>
  )
}
