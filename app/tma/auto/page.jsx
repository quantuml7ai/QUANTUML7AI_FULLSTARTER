'use client'

import { useEffect, useState } from 'react'

export default function TmaAutoPage() {
  const [msg, setMsg] = useState('Authorizing…')

  useEffect(() => {
    (async () => {
      try {
        // получаем именно СЫРУЮ строку initData
        const raw = window?.Telegram?.WebApp?.initData
        if (!raw || typeof raw !== 'string' || !raw.includes('hash=')) {
          setMsg('No valid initData (Mini App must be opened inside Telegram)')
          return
        }

        // отправляем эту строку без изменений
        const res = await fetch('/api/tma/auto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: raw })  // ← важно: не JSON.stringify(raw)
        })

        const j = await res.json().catch(() => ({}))
        if (!j.ok) {
          setMsg(`Auth failed: ${j.error || 'unknown'}`)
          return
        }

        localStorage.setItem('ql7_uid', j.accountId)
        window.__AUTH_ACCOUNT__ = j.accountId
        window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: j.accountId, provider: 'tg' } }))

        const ret = new URL(window.location.href).searchParams.get('return') || '/forum'
        window.location.replace(ret)
      } catch (e) {
        setMsg('Network error: ' + e.message)
      }
    })()
  }, [])

  return (
    <div style={{ color: '#9cf', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Quantum L7 — Telegram Mini App</h1>
      <p>{msg}</p>
      <small>{typeof window !== 'undefined' && window.Telegram?.WebApp?.initData ? 'initData present' : 'no initData'}</small>
    </div>
  )
}
