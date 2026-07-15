'use client'

import { useEffect, useRef } from 'react'

const TOUCH_THROTTLE_MS = 2500

function normalizeAccountId(value) {
  return String(value || '').trim()
}

export default function GeoSessionTouchClient({ accountId = '' }) {
  const inFlightRef = useRef(new Set())
  const lastTouchRef = useRef(new Map())

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    let cancelled = false

    const touch = async (rawAccountId, reason = 'manual') => {
      const id = normalizeAccountId(rawAccountId)
      if (!id || cancelled) return
      if (inFlightRef.current.has(id)) return
      const now = Date.now()
      const last = Number(lastTouchRef.current.get(id) || 0)
      if (last && now - last < TOUCH_THROTTLE_MS) return

      inFlightRef.current.add(id)
      try {
        const response = await fetch('/api/geo/session-touch', {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'content-type': 'application/json',
            'x-forum-user-id': id,
          },
          body: JSON.stringify({ accountId: id, reason: String(reason || 'manual') }),
        })
        const json = await response.json().catch(() => null)
        if (response.ok && json?.ok) {
          lastTouchRef.current.set(id, Date.now())
          try {
            window.dispatchEvent(new CustomEvent('forum:geo-session-touch-ready', {
              detail: {
                accountId: id,
                reason: String(reason || 'manual'),
                geoStored: !!json.geoStored,
                known: json.known !== false,
              },
            }))
          } catch {}
        }
      } catch {
        // silent: geo touch must never break forum UI or show user-facing toasts
      } finally {
        inFlightRef.current.delete(id)
      }
    }

    const onReady = (event) => {
      const detail = event?.detail || {}
      const id = normalizeAccountId(detail.accountId || detail.userId || accountId)
      if (id) void touch(id, detail.reason || 'forum_post_auth_ready')
    }

    window.addEventListener('forum:post-auth-ready', onReady)
    const initial = normalizeAccountId(accountId)
    if (initial) {
      const timer = window.setTimeout(() => { void touch(initial, 'mount') }, 80)
      return () => {
        cancelled = true
        window.clearTimeout(timer)
        window.removeEventListener('forum:post-auth-ready', onReady)
      }
    }

    return () => {
      cancelled = true
      window.removeEventListener('forum:post-auth-ready', onReady)
    }
  }, [accountId])

  return null
}
