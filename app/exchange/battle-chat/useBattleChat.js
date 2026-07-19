'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { runAuthorizedClientAction } from '../../../lib/authActionGateClient'
import {
  BATTLE_CHAT_FALLBACK_FOREGROUND_MS,
  BATTLE_CHAT_FALLBACK_HIDDEN_MS,
  BATTLE_CHAT_SESSION_HARD_LIMIT,
  fetchBattleChatDelta,
  fetchBattleChatSnapshot,
  makeBattleChatMutationId,
  postBattleChatMessage,
  postBattleChatReaction,
} from './battleChatClient'

function normalizeMessage(message) {
  if (!message?.id) return null
  return {
    ...message,
    likesCount: Math.max(0, Math.floor(Number(message.likesCount || 0))),
    myLiked: !!message.myLiked,
  }
}

function mergeMessages(prev, incoming) {
  const map = new Map()
  for (const row of prev || []) {
    const msg = normalizeMessage(row)
    if (msg) map.set(msg.id, msg)
  }
  for (const row of incoming || []) {
    const msg = normalizeMessage(row)
    if (!msg) continue
    const old = map.get(msg.id)
    map.set(msg.id, old ? { ...old, ...msg } : msg)
  }
  return Array.from(map.values())
    .sort((a, b) => Number(a.createdAtMs || 0) - Number(b.createdAtMs || 0) || String(a.id).localeCompare(String(b.id)))
    .slice(-BATTLE_CHAT_SESSION_HARD_LIMIT)
}

export function useBattleChat() {
  const [messages, setMessages] = useState([])
  const [syncToken, setSyncToken] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [likingId, setLikingId] = useState('')
  const mountedRef = useRef(false)
  const syncTokenRef = useRef('')
  const requestSeqRef = useRef(0)
  const deltaRefreshTimerRef = useRef(null)
  const deltaRefreshInFlightRef = useRef(false)

  const acceptPayload = useCallback((payload) => {
    if (!payload) return
    const rows = Array.isArray(payload.messages)
      ? payload.messages
      : payload.message
        ? [payload.message]
        : []
    if (rows.length) setMessages((prev) => mergeMessages(prev, rows))
    if (payload.syncToken) {
      syncTokenRef.current = payload.syncToken
      setSyncToken(payload.syncToken)
    }
    setError('')
    setStatus('ready')
  }, [])

  const loadSnapshot = useCallback(async () => {
    const seq = ++requestSeqRef.current
    setStatus((value) => (value === 'ready' ? 'refreshing' : 'loading'))
    try {
      const data = await fetchBattleChatSnapshot()
      if (seq !== requestSeqRef.current) return
      setMessages(mergeMessages([], data.messages || []))
      syncTokenRef.current = data.syncToken || ''
      setSyncToken(data.syncToken || '')
      setStatus('ready')
      setError('')
    } catch (err) {
      if (seq !== requestSeqRef.current) return
      setStatus('error')
      setError(err?.message || 'battlecoin_chat_error')
    }
  }, [])

  const loadDelta = useCallback(async () => {
    const token = syncTokenRef.current
    try {
      const data = await fetchBattleChatDelta({ syncToken: token })
      if (data?.requiresSnapshot) {
        await loadSnapshot()
        return
      }
      acceptPayload(data)
    } catch {
      setStatus((value) => (value === 'loading' ? 'error' : value))
    }
  }, [acceptPayload, loadSnapshot])

  const scheduleDeltaRefresh = useCallback((delay = 60) => {
    if (!mountedRef.current) return
    if (typeof window === 'undefined') {
      void loadDelta()
      return
    }
    if (deltaRefreshTimerRef.current) window.clearTimeout(deltaRefreshTimerRef.current)
    deltaRefreshTimerRef.current = window.setTimeout(async () => {
      deltaRefreshTimerRef.current = null
      if (!mountedRef.current) return
      if (deltaRefreshInFlightRef.current) {
        scheduleDeltaRefresh(160)
        return
      }
      deltaRefreshInFlightRef.current = true
      try {
        await loadDelta()
      } finally {
        deltaRefreshInFlightRef.current = false
      }
    }, delay)
  }, [loadDelta])

  useEffect(() => {
    mountedRef.current = true
    loadSnapshot()
    return () => {
      mountedRef.current = false
      if (deltaRefreshTimerRef.current && typeof window !== 'undefined') {
        window.clearTimeout(deltaRefreshTimerRef.current)
        deltaRefreshTimerRef.current = null
      }
      requestSeqRef.current += 1
    }
  }, [loadSnapshot])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    let timer = null
    const refresh = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = null
        if (mountedRef.current) void loadSnapshot()
      }, 80)
    }
    window.addEventListener('auth:ok', refresh)
    window.addEventListener('auth:success', refresh)
    window.addEventListener('wallet-session:verified', refresh)
    window.addEventListener('tg:link-status', refresh)
    return () => {
      if (timer) window.clearTimeout(timer)
      window.removeEventListener('auth:ok', refresh)
      window.removeEventListener('auth:success', refresh)
      window.removeEventListener('wallet-session:verified', refresh)
      window.removeEventListener('tg:link-status', refresh)
    }
  }, [loadSnapshot])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource !== 'function') return undefined
    let closed = false
    let es = null
    let reconnectTimer = null
    const handleRealtimeEvent = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload?.compact && !payload?.message && !payload?.messages) {
          scheduleDeltaRefresh()
          return
        }
        acceptPayload(payload)
      } catch {}
    }
    const closeEventSource = () => {
      if (!es) return
      try { es.removeEventListener('battlecoin-chat-message', handleRealtimeEvent) } catch {}
      try { es.removeEventListener('battlecoin-chat-reaction', handleRealtimeEvent) } catch {}
      try { es.close?.() } catch {}
      es = null
    }

    const connect = () => {
      if (closed) return
      try {
        es = new window.EventSource('/api/battlecoin/chat/events')
        es.addEventListener('battlecoin-chat-message', handleRealtimeEvent)
        es.addEventListener('battlecoin-chat-reaction', handleRealtimeEvent)
        es.onerror = () => {
          closeEventSource()
          if (!closed) reconnectTimer = window.setTimeout(connect, 1800)
        }
      } catch {}
    }

    connect()
    return () => {
      closed = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      closeEventSource()
    }
  }, [acceptPayload, scheduleDeltaRefresh])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    let timer = null
    let stopped = false
    const tick = async () => {
      if (stopped) return
      await loadDelta()
      const hidden = document.visibilityState === 'hidden'
      timer = window.setTimeout(tick, hidden ? BATTLE_CHAT_FALLBACK_HIDDEN_MS : BATTLE_CHAT_FALLBACK_FOREGROUND_MS)
    }
    timer = window.setTimeout(tick, BATTLE_CHAT_FALLBACK_FOREGROUND_MS)
    return () => {
      stopped = true
      if (timer) window.clearTimeout(timer)
    }
  }, [loadDelta])

  const sendMessage = useCallback(async (text) => {
    const clean = String(text || '').trim()
    if (!clean) return { ok: false, error: 'battlecoin_chat_empty' }
    setSending(true)
    try {
      const result = await runAuthorizedClientAction({
        actionKey: 'battlecoin-chat-send',
        source: 'battlecoin-chat',
        action: async () => {
          const data = await postBattleChatMessage({
            text: clean,
            clientMutationId: makeBattleChatMutationId(),
          })
          acceptPayload(data)
        },
      })
      if (!result?.ok) setError('battlecoin_chat_auth_required')
      return result
    } catch (err) {
      setError(err?.message || 'battlecoin_chat_error')
      return { ok: false, error: err?.message || 'battlecoin_chat_error' }
    } finally {
      if (mountedRef.current) setSending(false)
    }
  }, [acceptPayload])

  const toggleLike = useCallback(async (message) => {
    if (!message?.id) return
    const nextLike = !message.myLiked
    setLikingId(message.id)
    setMessages((prev) => mergeMessages(prev.map((row) => {
      if (row.id !== message.id) return row
      const likesCount = Math.max(0, Number(row.likesCount || 0) + (nextLike ? 1 : -1))
      return { ...row, myLiked: nextLike, likesCount }
    }), []))
    try {
      const result = await runAuthorizedClientAction({
        actionKey: `battlecoin-chat-like:${message.id}`,
        source: 'battlecoin-chat-like',
        action: async () => {
          const data = await postBattleChatReaction({ messageId: message.id, like: nextLike })
          acceptPayload(data)
        },
      })
      if (!result?.ok) await loadDelta()
    } catch (err) {
      setError(err?.message || 'battlecoin_chat_error')
      await loadDelta()
    } finally {
      if (mountedRef.current) setLikingId('')
    }
  }, [acceptPayload, loadDelta])

  return useMemo(() => ({
    error,
    likingId,
    loadSnapshot,
    messages,
    sendMessage,
    sending,
    status,
    syncToken,
    toggleLike,
  }), [error, likingId, loadSnapshot, messages, sendMessage, sending, status, syncToken, toggleLike])
}
