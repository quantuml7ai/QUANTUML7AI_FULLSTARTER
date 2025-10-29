// app/tma/auto/page.jsx
'use client'
import { useEffect, useState } from 'react'

export default function TmaAutoPage() {
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null
        const initData = (wa && wa.initData) ? wa.initData : ''
        const ret = new URLSearchParams(window.location.search).get('return') || '/forum'

        if (!initData) {
          setMsg('No initData from Telegram (open from Mini App).')
          return
        }

        const r = await fetch('/api/tma/auto', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ initData, return: ret }),
          credentials: 'include',
        })
        const j = await r.json().catch(() => ({}))

        if (!j?.ok) {
          setMsg(`Auth failed: ${j?.error || r.status}`)
          return
        }

        // Синхронизируем глобалку и уведомляем фронт
        try {
          window.__AUTH_ACCOUNT__ = j.accountId
          window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: j.accountId, provider: 'tma' } }))
        } catch {}

        // Возврат туда, откуда пришли (внутри Mini App)
        const backTo = j.return || ret || '/'
        if (wa && typeof wa.openLink === 'function') {
          wa.openLink(window.location.origin + backTo)
        } else {
          window.location.replace(backTo)
        }
      } catch (e) {
        setMsg('Auth error: ' + String(e?.message || e))
      }
    })()
  }, [])

  return (
    <div style={{padding:'24px', color:'#fff'}}>
      <h2>Quantum L7 — Telegram Mini App</h2>
      {msg && <p>{msg}</p>}
    </div>
  )
}
