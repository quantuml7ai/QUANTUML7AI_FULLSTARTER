// app/tma/auto/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/i18n' // поправь путь, если без алиаса

export default function TmaAutoPage() {
  const { t } = useI18n()
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
    <main
      style={{
        padding: 'min(24px, 5vw)',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif',
        color: '#e6f0ff'
      }}
    >
      {/* Верх: локализованный заголовок */}
      <h1
        style={{
          margin: '0 0 14px',
          fontSize: 'clamp(24px, 4.6vw, 40px)',
          lineHeight: 1.15,
          letterSpacing: '.02em',
          textShadow: '0 0 10px rgba(64,200,255,.55)'
        }}
      >
        {t('tma_welcome_title')}
      </h1>

      {/* Низ: гифка авторизации на всю ширину (лежит в /public/click/authorization.gif) */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '12px auto 0',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 14px 40px -10px rgba(0,0,0,.55), 0 0 40px rgba(0,200,255,.15) inset'
        }}
      >
        <img
          src="/click/authorization.gif"
          alt=""
          style={{ display: 'block', width: '100%', height: 'auto', imageRendering: 'auto' }}
          draggable={false}
        />
      </div>

      {/* Служебный статус (оставил как у тебя) */}
      <small style={{ opacity: .7, display: 'block', marginTop: 10 }}>
        {hasInit ? msg : 'no initData'}
      </small>
    </main>
  )
}
