'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MetaMarketRuntime = dynamic(() => import('./MetaMarket'), {
  ssr: false,
})

const ALLOWED_SOURCES = new Set(['quantum-wallet', 'user-info-gift', 'topbar-brand', 'notification', 'dev'])

function isBrowser() {
  return typeof window !== 'undefined'
}

function readUnifiedAccountId() {
  if (!isBrowser()) return ''
  try {
    const w = window
    const ls = window.localStorage
    const fromGlobal = w.__AUTH_ACCOUNT__ || w.__ASHER_ID__ || w.__QL7_UID__ || w.__FORUM_USER__
    if (fromGlobal) return String(fromGlobal)
    return String(
      ls.getItem('account') ||
      ls.getItem('wallet') ||
      ls.getItem('asherId') ||
      ls.getItem('ql7_uid') ||
      ls.getItem('forum_user_id') ||
      '',
    )
  } catch {
    return ''
  }
}

function normalizeRecipient(raw) {
  if (!raw || typeof raw !== 'object') return null
  const userId = String(raw.userId || raw.accountId || raw.uid || '').trim()
  if (!userId) return null
  return {
    userId,
    nickname: String(raw.nickname || raw.nick || '').trim(),
    avatar: String(raw.avatar || raw.icon || '').trim(),
    icon: String(raw.icon || raw.avatar || '').trim(),
    vipActive: typeof raw.vipActive === 'boolean' ? raw.vipActive : !!raw.vip,
    sourceKind: String(raw.sourceKind || '').trim(),
    sourceId: String(raw.sourceId || '').trim(),
  }
}

function normalizeOpenDetail(detail) {
  const source = String(detail?.source || '').trim()
  if (!ALLOWED_SOURCES.has(source)) return null

  const initialMode = String(detail?.initialMode || '').trim() === 'collections' ? 'collections' : 'market'
  const giftFlow = !!detail?.giftFlow && source === 'user-info-gift'
  const viewerId = String(detail?.viewerId || detail?.userId || detail?.accountId || readUnifiedAccountId() || '').trim()

  return {
    key: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
    source,
    initialMode: giftFlow ? 'collections' : initialMode,
    giftFlow,
    recipient: normalizeRecipient(detail?.recipient),
    viewerId,
    vipActive: typeof detail?.vipActive === 'boolean' ? detail.vipActive : !!detail?.vip,
    openedAt: Date.now(),
  }
}

export default function MetaMarketHost() {
  const [runtime, setRuntime] = useState(null)

  const closeRuntime = useCallback(() => {
    setRuntime(null)
  }, [])

  const openRuntime = useCallback((event) => {
    const next = normalizeOpenDetail(event?.detail || {})
    if (!next) return
    if (next.source === 'notification') window.__QL7_PENDING_NOTIFICATION_SOURCE__ = ''
    try { window.dispatchEvent(new CustomEvent('quantum-wallet:close')) } catch {}
    setRuntime(next)
  }, [])

  useEffect(() => {
    if (!isBrowser()) return undefined
    window.addEventListener('metamarket:open', openRuntime)
    if (window.__QL7_PENDING_NOTIFICATION_SOURCE__ === 'metamarket_gifts') {
      openRuntime({ detail: { source: 'notification', initialMode: 'collections' } })
      window.__QL7_PENDING_NOTIFICATION_SOURCE__ = ''
    }
    return () => {
      window.removeEventListener('metamarket:open', openRuntime)
    }
  }, [openRuntime])

  if (!runtime) return null

  return (
    <MetaMarketRuntime
      key={runtime.key}
      source={runtime.source}
      initialMode={runtime.initialMode}
      giftFlow={runtime.giftFlow}
      recipient={runtime.recipient}
      viewerId={runtime.viewerId}
      vipActive={runtime.vipActive}
      openedAt={runtime.openedAt}
      onClose={closeRuntime}
    />
  )
}
