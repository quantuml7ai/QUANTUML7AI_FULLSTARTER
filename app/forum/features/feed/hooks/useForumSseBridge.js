import { useEffect, useRef } from 'react'

export default function useForumSseBridge({
  snapRef,
  sseHintRef,
  syncNowRef,
  writeProfileAlias,
  mergeProfileCache,
  setProfileBump,
}) {
  const sseSyncTimerRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.__forumSSE) {
      try {
        window.__forumSSE.close()
      } catch {}
    }
    const es = new EventSource('/api/forum/events/stream', { withCredentials: false })
    window.__forumSSE = es

    es.onmessage = (e) => {
      if (!e?.data) return
      if (e.data.startsWith(':')) return
      try {
        const evt = JSON.parse(e.data)
        if (!evt?.type) return

        const bindProfileAliases = (accountId) => {
          const aliasSet = new Set()
          ;[
            evt.userId,
            evt.sourceUserId,
            evt.sourceAccountId,
            evt.sourceAsherId,
            evt.sourceForumUserId,
            evt.rawUserId,
          ].forEach((v) => {
            const s = String(v || '').trim()
            if (!s) return
            aliasSet.add(s)
            const cleaned = s.replace(/^(?:tguid:|tg:)/i, '')
            if (cleaned) aliasSet.add(cleaned)
            if (/^\d+$/.test(cleaned)) {
              aliasSet.add(`tguid:${cleaned}`)
              aliasSet.add(`tg:${cleaned}`)
            }
          })
          const aliasCandidates = Array.from(aliasSet)
          const profilePatch = {
            nickname: evt.nickname || evt.nick,
            icon: evt.icon || evt.avatar,
            vipIcon: evt.vipIcon,
            updatedAt: evt.ts || Date.now(),
          }
          aliasCandidates.forEach((rawId) => {
            try {
              writeProfileAlias(rawId, accountId)
            } catch {}
            try {
              const key = String(rawId || '').trim()
              if (key) mergeProfileCache(key, profilePatch)
            } catch {}
          })
        }

        if ((evt.type === 'profile.avatar' || evt.type === 'profile.updated') && (evt.accountId || evt.userId)) {
          const accountId = String(evt.accountId || evt.userId || '').trim()
          if (accountId) {
            try {
              bindProfileAliases(accountId)
              mergeProfileCache(accountId, {
                nickname: evt.nickname || evt.nick,
                icon: evt.icon || evt.avatar,
                vipIcon: evt.vipIcon,
                updatedAt: evt.ts || Date.now(),
              })
            } catch {}
            setProfileBump((x) => x + 1)
          }
          return
        }

        if (evt.type === 'profile.about.updated' && (evt.accountId || evt.userId)) {
          const accountId = String(evt.accountId || evt.userId || '').trim()
          if (accountId) {
            try {
              bindProfileAliases(accountId)
              mergeProfileCache(accountId, {
                about: evt.about || '',
                updatedAt: evt.ts || Date.now(),
              })
            } catch {}
            setProfileBump((x) => x + 1)
          }
          return
        }

        const nextRev = Number(evt?.rev || 0)
        if (Number.isFinite(nextRev) && nextRev > 0) {
          sseHintRef.current = Math.max(sseHintRef.current, nextRev)
          const currentRev = Number(snapRef.current?.rev || 0)
          if (nextRev > currentRev && !sseSyncTimerRef.current) {
            sseSyncTimerRef.current = setTimeout(() => {
              sseSyncTimerRef.current = null
              try {
                syncNowRef.current?.()
              } catch {}
            }, 120)
          }
        }
      } catch {}
    }

    es.onerror = () => {}

    return () => {
      if (sseSyncTimerRef.current) {
        clearTimeout(sseSyncTimerRef.current)
        sseSyncTimerRef.current = null
      }
      try {
        es.close()
      } catch {}
      if (window.__forumSSE === es) window.__forumSSE = null
    }
  }, [snapRef, sseHintRef, syncNowRef, writeProfileAlias, mergeProfileCache, setProfileBump])
}
