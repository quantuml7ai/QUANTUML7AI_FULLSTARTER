// components/TgMiniAppLogin.jsx
'use client'

import { useEffect, useState } from 'react'

export default function TgMiniAppLogin({ onDone }) {
  const [isTg, setIsTg] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const w = typeof window !== 'undefined' ? window : null
    setIsTg(!!(w && (w.Telegram?.WebApp || /telegram|tgwebapp/i.test(String(navigator.userAgent||'')))))
  }, [])

  const handle = async () => {
    setBusy(true); setErr('')
    try {
      const tg = window.Telegram?.WebApp
      const initData = String(tg?.initData || '')
      const user = tg?.initDataUnsafe?.user ? JSON.stringify(tg.initDataUnsafe.user) : ''

      const r = await fetch('/api/auth/telegram', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body: JSON.stringify({ initData, user })
      })
      const j = await r.json()
      if (!j?.ok) throw new Error(j?.error || 'Auth failed')

      // Локальная фиксация, как у тебя принято:
      try { localStorage.setItem('asherId', j.accountId) } catch {}
      try { window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: j.accountId, provider: 'telegram' } })) } catch {}

      onDone?.(j)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  if (!isTg) return null

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        className="btn btnGold"
      >
        {busy ? 'Connecting…' : 'Continue with Telegram'}
      </button>
      {err && <div className="meta" style={{ color:'#ff6b6b', marginTop:6 }}>{err}</div>}
    </div>
  )
}
