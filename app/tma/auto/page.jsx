// app/tma/auto/page.jsx
'use client'

import React from 'react'
// Если у тебя настроен алиас "@", оставь так.
// Если нет — замени на относительный путь: "../../../components/i18n"
import { useI18n } from '@/components/i18n'

export default function TmaAutoPage() {
  const { t } = useI18n()

  return (
    <main
      style={{
        padding: 'min(24px, 5vw)',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif',
        color: '#e6f0ff',
      }}
    >
      {/* Заголовок с переводом */}
      <h1
        style={{
          margin: '0 0 14px',
          fontSize: 'clamp(24px, 4.6vw, 40px)',
          lineHeight: 1.15,
          letterSpacing: '.02em',
          textShadow: '0 0 10px rgba(64,200,255,.55)',
        }}
      >
        {t('tma_welcome_title')}
      </h1>

      {/* GIF на всю ширину, адаптивно */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '12px auto 0',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 14px 40px -10px rgba(0,0,0,.55), 0 0 40px rgba(0,200,255,.15) inset',
        }}
      >
        <img
          src="/click/authorization.gif" // файл лежит в public/click/authorization.gif
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            imageRendering: 'auto',
          }}
          draggable={false}
        />
      </div>
    </main>
  )
}
