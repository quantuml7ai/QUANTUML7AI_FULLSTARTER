import { useEffect } from 'react'

export default function useForumSyncLoop({
  isBrowserFn,
  flushMutations,
  tombstonesRef,
  snapRef,
  lastFullSnapshotRef,
  sseHintRef,
  applyFullSnapshotRef,
  applyEventsRef,
  pruneTombstonesRef,
  persistSnapRef,
  persistTombstonesRef,
  syncInFlightRef,
  syncNowRef,
  api,
  writeProfileAlias,
  mergeProfileCache,
  setProfileBump,
}) {
  useEffect(() => {
    if (!isBrowserFn()) return
    let stop = false
    const TICK_MS = 30_000
    const FULL_EVERY_MS = 10 * 60 * 1000
    const readScrollIdleState = () => {
      try {
        const now = Date.now()
        const lastUserScrollTs = Number(window.__forumUserScrollTs || 0)
        const lastProgrammaticScrollTs = Number(window.__forumProgrammaticScrollTs || 0)
        const lastScrollTs = Math.max(lastUserScrollTs, lastProgrammaticScrollTs)
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
        const idleMs = coarse ? 1600 : 1200
        return {
          now,
          coarse,
          idle: (now - lastScrollTs) >= idleMs,
        }
      } catch {
        return { now: Date.now(), coarse: false, idle: true }
      }
    }
    const canApplyIncrementalNow = () => {
      try {
        if (!snapRef.current?.rev) return true
        const state = readScrollIdleState()
        if (!state.idle) return false
        const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null
        const innerTop = Number(scrollEl?.scrollTop || 0)
        const winTop =
          Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0)
        const top = Math.max(innerTop, winTop)
        if (top > (state.coarse ? 320 : 240)) return false
        return true
      } catch {
        return true
      }
    }
    const canApplyFullSnapshotNow = () => {
      try {
        // First bootstrap full snapshot should always apply immediately.
        if (!snapRef.current?.rev) return true
        const state = readScrollIdleState()
        if (!state.idle) return false

        // Не применяем full-снапшот глубоко в ленте:
        // именно это давало заметные прыжки/перетряхивание DOM во время чтения.
        const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null
        const innerTop = Number(scrollEl?.scrollTop || 0)
        const winTop =
          Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0)
        const top = Math.max(innerTop, winTop)
        if (top > (state.coarse ? 280 : 220)) return false

        return true
      } catch {
        return true
      }
    }

    const runTick = async () => {
      if (stop || syncInFlightRef.current) return
      syncInFlightRef.current = true
      try {
        await flushMutations()
        const tombstones = tombstonesRef.current || { topics: {}, posts: {} }

        const now = Date.now()
        try {
          if (typeof document !== 'undefined' && document.hidden) return
        } catch {}

        const needFull = !snapRef.current?.rev || (now - (lastFullSnapshotRef.current || 0) > FULL_EVERY_MS)
        const canApplyFullNow = canApplyFullSnapshotNow()
        const canApplyEventsNow = canApplyIncrementalNow()
        if (needFull && snapRef.current?.rev && !canApplyFullNow) {
          // Defer heavy full snapshots while user is deep in feed.
          return
        }
        if (needFull) {
          const r = await api.snapshot({ full: 1 })
          if (r?.ok) {
            const idsSet = new Set()
            try {
              for (const t of (r.topics || [])) {
                const id = String(t?.authorId || t?.userId || t?.ownerId || t?.uid || '').trim()
                if (id) idsSet.add(id)
              }
              for (const p of (r.posts || [])) {
                const id = String(p?.authorId || p?.userId || p?.ownerId || p?.uid || '').trim()
                if (id) idsSet.add(id)
              }
            } catch {}

            const ids = Array.from(idsSet)
            if (ids.length) {
              const vm = await api.vipBatch(ids)
              if (vm?.ok && vm?.map && typeof vm.map === 'object') {
                const vipMap = vm.map
                r.vipMap = vipMap
                if (Array.isArray(r.topics)) {
                  r.topics = r.topics.map((t) => {
                    const aid = String(t?.authorId || t?.userId || t?.ownerId || t?.uid || '').trim()
                    if (!aid) return t
                    const v = vipMap[aid]
                    if (!v) return t
                    return {
                      ...t,
                      vipActive: !!v.active,
                      vipUntil: Number(v.untilMs || 0),
                      isVip: !!v.active,
                    }
                  })
                }
                if (Array.isArray(r.posts)) {
                  r.posts = r.posts.map((p) => {
                    const aid = String(p?.authorId || p?.userId || p?.ownerId || p?.uid || '').trim()
                    if (!aid) return p
                    const v = vipMap[aid]
                    if (!v) return p
                    return {
                      ...p,
                      vipActive: !!v.active,
                      vipUntil: Number(v.untilMs || 0),
                      isVip: !!v.active,
                    }
                  })
                }
              }

              const pm = await api.profileBatch(ids)
              if (pm?.ok && pm?.map && typeof pm.map === 'object') {
                try {
                  const aliases = pm.aliases && typeof pm.aliases === 'object' ? pm.aliases : {}
                  Object.entries(aliases).forEach(([rawId, accountId]) => {
                    writeProfileAlias(rawId, accountId)
                  })
                  Object.entries(pm.map).forEach(([accountId, profile]) => {
                    mergeProfileCache(accountId, {
                      nickname: profile?.nickname || '',
                      icon: profile?.icon || '',
                      updatedAt: Date.now(),
                    })
                  })
                  // Keep raw-id profiles in sync too: some legacy cards still render by raw ids.
                  Object.entries(aliases).forEach(([rawId, accountId]) => {
                    const profile = pm.map?.[accountId]
                    if (!profile) return
                    mergeProfileCache(rawId, {
                      nickname: profile?.nickname || '',
                      icon: profile?.icon || '',
                      updatedAt: Date.now(),
                    })
                  })
                  setProfileBump((x) => x + 1)
                } catch {}
              }
            }
            lastFullSnapshotRef.current = now
            if (canApplyFullNow) {
              persistSnapRef.current((prev) => applyFullSnapshotRef.current(prev, r, tombstones))
            }
          }
        } else {
          const since = Number(snapRef.current?.rev || 0)
          const hintedRev = Number(sseHintRef.current || 0)
          const shouldBypassCache = hintedRev > since
          const q = shouldBypassCache
            ? { since, rev: hintedRev, b: `${hintedRev}:${Date.now()}` }
            : { since }
          const r = await api.snapshot(q)
          if (r?.ok) {
            const useFullFallback =
              !!r?.full ||
              (
                Array.isArray(r?.topics) &&
                Array.isArray(r?.posts) &&
                !Array.isArray(r?.events)
              )

            if (useFullFallback) {
              if (canApplyFullNow) {
                persistSnapRef.current((prev) => applyFullSnapshotRef.current(prev, r, tombstones))
                lastFullSnapshotRef.current = now
              }
            } else if (canApplyEventsNow) {
              persistSnapRef.current((prev) => {
                const next = applyEventsRef.current(prev, r.events || [], tombstones)
                return { ...next, rev: r.rev ?? next.rev }
              })
            } else {
              // Пока пользователь активно скроллит/читает глубоко, не перетряхиваем DOM событиями.
              // Иначе получаются заметные подпрыгивания ленты в фоне.
              const hinted = Number(sseHintRef.current || 0)
              const revNow = Number(r?.rev || 0)
              sseHintRef.current = Math.max(hinted, revNow, since)
            }
            if (shouldBypassCache && Number(r?.rev || 0) >= hintedRev) {
              sseHintRef.current = 0
            }
          }
        }
        const cleaned = pruneTombstonesRef.current(tombstones)
        const same =
          JSON.stringify(cleaned.topics) === JSON.stringify(tombstones.topics) &&
          JSON.stringify(cleaned.posts) === JSON.stringify(tombstones.posts)
        if (!same) persistTombstonesRef.current(cleaned)
      } catch (e) {
        console.error('sync tick error', e)
      } finally {
        syncInFlightRef.current = false
      }
    }

    syncNowRef.current = runTick
    runTick()
    const id = setInterval(runTick, TICK_MS)

    return () => {
      stop = true
      syncNowRef.current = () => {}
      clearInterval(id)
    }
  }, [
    isBrowserFn,
    flushMutations,
    tombstonesRef,
    snapRef,
    lastFullSnapshotRef,
    sseHintRef,
    applyFullSnapshotRef,
    applyEventsRef,
    pruneTombstonesRef,
    persistSnapRef,
    persistTombstonesRef,
    syncInFlightRef,
    syncNowRef,
    api,
    writeProfileAlias,
    mergeProfileCache,
    setProfileBump,
  ])
}
