'use client'

import { useEffect, useState } from 'react'

/** Ждём появления Telegram.WebApp какое-то время */
async function waitForTg(msTotal = 2500, step = 150) {
  const t0 = Date.now()
  while (Date.now() - t0 < msTotal) {
    const tg = globalThis?.Telegram?.WebApp
    if (tg) return tg
    await new Promise(r => setTimeout(r, step))
  }
  return globalThis?.Telegram?.WebApp || null
}

/** Достаём СЫРОЙ initData (строку), пригодную для бэка */
function readInitDataRaw() {
  // 1) Из SDK: tg.initData — уже строка вида "user=...&hash=..."
  try {
    const tg = globalThis?.Telegram?.WebApp
    if (tg?.initData && String(tg.initData).includes('hash=')) {
      return String(tg.initData)
    }
  } catch {}

  // 2) Из location.hash: Telegram кладёт blob в #tgWebAppData=...
  try {
    const hash = (globalThis.location?.hash || '').replace(/^#/, '')
    if (!hash) return null

    // Если есть явный tgWebAppData — берём его значение
    const qs = new URLSearchParams(hash)
    const rawParam =
      qs.get('tgWebAppData') ||
      qs.get('tgwebappdata') ||
      null
    if (rawParam) {
      // Может быть url-encoded — но сервер сам умеет, отдадим как есть
      return rawParam
    }

    // Иначе многие клиенты кладут весь blob прямо в hash: "user=...&chat_instance=...&hash=..."
    if (hash.includes('hash=')) {
      return hash
    }
  } catch {}

  return null
}

export default function TmaAutoPage() {
  const [msg, setMsg] = useState('Authorizing…')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      // Ждём SDK, расширяем канву и отмечаем ready (на всякий случай)
      const tg = await waitForTg()
      try { tg?.expand?.() } catch {}
      try { tg?.ready?.() } catch {}

      // Пару ретраев чтения initData на медленных клиентах
      let raw = readInitDataRaw()
      if (!raw) {
        for (let i = 0; i < 6 && !raw; i++) {
          await new Promise(r => setTimeout(r, 150))
          raw = readInitDataRaw()
        }
      }

      if (!raw) {
        if (!cancelled) setMsg('No initData from Telegram (open from Mini App).')
        return
      }

      // Пробрасываем на серверную проверку + запись в Redis
      // Передаём именно СТРОКУ — наш /api/tma/auto это ожидает
      const url = new URL(globalThis.location?.href || 'https://quantuml7ai.com/tma/auto')
      const ret = url.searchParams.get('return') || '/forum'

      try {
        const r = await fetch(`/api/tma/auto?return=${encodeURIComponent(ret)}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ initData: raw })
        })

        const j = await r.json().catch(() => null)

        if (!j?.ok) {
          if (!cancelled) setMsg(`Auth failed: ${j?.error || r.status || 'unknown'}`)
          return
        }

        // Локальные маркеры, чтобы фронт жил "как авторизованный"
        try {
          if (j.accountId) {
            localStorage.setItem('ql7_uid', String(j.accountId))
            globalThis.__AUTH_ACCOUNT__ = String(j.accountId)
            globalThis.dispatchEvent?.(
              new CustomEvent('auth:ok', {
                detail: { accountId: String(j.accountId), provider: 'tg' }
              })
            )
          }
        } catch {}

        // Редирект на целевую страницу
        globalThis.location?.replace(j.return || ret)
      } catch (e) {
        if (!cancelled) setMsg('Network error')
      }
    })()

    return () => { cancelled = true }
  }, [])

  return (
    <div style={{ color:'#9cf', padding:'24px', fontFamily:'system-ui, sans-serif' }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>Quantum L7 — Telegram Mini App</h1>
      <p style={{ marginTop: 8 }}>{msg}</p>
      {/* Отладка: покажем сырое наличие initData/хэша */}
      <pre style={{ opacity:.6, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {typeof window !== 'undefined' ? window.location.hash : ''}
      </pre>
    </div>
  )
}
