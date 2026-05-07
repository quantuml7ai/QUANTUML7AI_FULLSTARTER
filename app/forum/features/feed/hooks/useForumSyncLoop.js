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
    const TICK_MS = Math.max(
      60_000,
      Number(process.env.NEXT_PUBLIC_FORUM_SYNC_TICK_MS || 180_000),
    )
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

    const pendingRunRef = { current: null }

    const runTick = async (options = {}) => {
      if (stop) return

      if (syncInFlightRef.current) {
        if (options?.forceApply || options?.full) {
          const prev = pendingRunRef.current || {}
          pendingRunRef.current = {
            ...prev,
            ...options,
            forceApply: !!(prev.forceApply || options?.forceApply),
            full: !!(prev.full || options?.full),
            reason: options?.reason || prev.reason || 'queued_force',
          }
        }
        return
      }

      const forceApply = !!options?.forceApply
      const forceFull = !!options?.full

      syncInFlightRef.current = true
      try {
        await flushMutations()
        const tombstones = tombstonesRef.current || { topics: {}, posts: {} }

        const now = Date.now()
        try {
          if (typeof document !== 'undefined' && document.hidden && !forceApply) return
        } catch {}

        const sinceNow = Number(snapRef.current?.rev || 0)

        // Дешёвый фоновый режим: сначала читаем только forum:rev.
        // Если ревизия не изменилась — не тянем snapshot/changes вообще.
        // Если изменилась, но пользователь глубоко читает ленту — копим pending rev
        // и применим его при безопасном surface-refresh.
        if (!forceApply && sinceNow > 0 && typeof api?.rev === 'function') {
          const rr = await api.rev()
          const liveRev = Number(rr?.rev || 0) || 0

          if (!rr?.ok || liveRev <= sinceNow) {
            return
          }

          sseHintRef.current = Math.max(Number(sseHintRef.current || 0), liveRev)

          const canApplyEventsNow = canApplyIncrementalNow()
          const canApplyFullNow = canApplyFullSnapshotNow()

          if (!canApplyEventsNow && !canApplyFullNow) {
            return
          }
        }

        const needFull =
          forceFull ||
          !snapRef.current?.rev ||
          (now - (lastFullSnapshotRef.current || 0) > FULL_EVERY_MS)
        const canApplyFullNow = forceApply || canApplyFullSnapshotNow()
        const canApplyEventsNow = forceApply || canApplyIncrementalNow()
        if (needFull && snapRef.current?.rev && !canApplyFullNow && !forceFull) {
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
              const isGapFallback = !!r?.gap

              if (canApplyFullNow || forceApply || isGapFallback) {
                persistSnapRef.current((prev) => applyFullSnapshotRef.current(prev, r, tombstones))
                lastFullSnapshotRef.current = now
              } else {
                const hinted = Number(sseHintRef.current || 0)
                const revNow = Number(r?.rev || 0)
                sseHintRef.current = Math.max(hinted, revNow, since)
              }
            } else if (canApplyEventsNow || forceApply) {
              persistSnapRef.current((prev) => {
                const next = applyEventsRef.current(prev, r.events || [], tombstones)
                return { ...next, rev: r.rev ?? next.rev }
              })
            } else {
              // Пользователь глубоко читает/скроллит: не трогаем DOM, только копим ревизию.
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
        const pending = pendingRunRef.current
        if (pending && !stop) {
          pendingRunRef.current = null
          setTimeout(() => {
            try { runTick(pending) } catch {}
          }, 0)
        }
      }
    }

    syncNowRef.current = (options = {}) => runTick(options)

    runTick({ reason: 'bootstrap', forceApply: true })

    const id = setInterval(() => {
      runTick({ reason: 'interval' })
    }, TICK_MS)

    const requestVisibleSync = () => {
      try {
        if (document.hidden) return
      } catch {}

      setTimeout(() => {
        try {
          syncNowRef.current?.({
            reason: 'visible',
            forceApply: false,
          })
        } catch {}
      }, 120)
    }

    try {
      document.addEventListener('visibilitychange', requestVisibleSync)
      window.addEventListener('focus', requestVisibleSync)
    } catch {}

    return () => {
      stop = true
      syncNowRef.current = () => {}
      clearInterval(id)

      try {
        document.removeEventListener('visibilitychange', requestVisibleSync)
        window.removeEventListener('focus', requestVisibleSync)
      } catch {}
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
