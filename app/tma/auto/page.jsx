// app/tma/auto/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/i18n' // поправь путь, если без алиаса
import Image from 'next/image'             // ← добавлено

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
    <main className="tma-full">
      <div className="tma-inner">
        {/* Приветственное сообщение по центру */}
        <h1 className="tma-title">{t('tma_welcome_title')}</h1>

        {/* GIF всегда на всю ширину контейнера */}
        <div className="gif-wrap">
          <Image
            src="/click/authorization.gif"
            alt=""
            className="auth-gif"
            width={1600}
            height={900}
            draggable={false}
            unoptimized      // чтобы не ломать анимацию GIF
          />
        </div>

        {/* Служебный статус (как было) */}
        <small className="tma-status">{hasInit ? msg : 'no initData'}</small>
      </div>

      <style jsx>{`
        /* Чёрный контейнер на весь экран по ширине и высоте */
        .tma-full{
          min-height: 60vh;
          width: 100%;
          background: #000;
          display: grid;
          place-items: center; /* центр по вертикали и горизонтали */
          overflow: hidden;
        }

        /* Внутренний блок контента */
        .tma-inner{
          width: 100%;
          max-width: 1600px;
          padding: min(24px, 5vw);
          text-align: center;
          color: #e6f0ff;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .tma-title{
          margin: 0;
          font-size: clamp(24px, 4.6vw, 40px);
          line-height: 1.15;
          letter-spacing: .02em;
          text-shadow: 0 0 10px rgba(64,200,255,.55);
        }

        .gif-wrap{
          width: 100%;
          max-width: 2000px;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 14px 40px -10px rgba(0,0,0,.55), 0 0 40px rgba(0,200,255,.15) inset;
        }
        .auth-gif{
          display: block;
          width: 100%;  /* растягиваем под ширину экрана */
          height: auto; /* сохраняем пропорции */
          image-rendering: auto;
        }

        .tma-status{
          opacity: .7;
          display: block;
          margin-top: 6px;
        }
      `}</style>
    </main>
  )
}
