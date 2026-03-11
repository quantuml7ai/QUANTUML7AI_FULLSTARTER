function mergeDmDialogs(existing, incoming) {
  if (!Array.isArray(existing) || !existing.length) return incoming
  const byUid = new Map(incoming.map((d) => [String(d?.userId || ''), d]))
  const merged = []
  const used = new Set()
  for (const d of existing) {
    const uid = String(d?.userId || '')
    if (!uid) {
      merged.push(d)
      continue
    }
    const inc = byUid.get(uid)
    if (inc) {
      const prevLast = d?.lastMessage || null
      const nextLast = inc?.lastMessage || null
      let lastMessage = nextLast || prevLast
      if (prevLast && nextLast) {
        const prevSending = String(prevLast.status || '') === 'sending'
        // Server is authoritative for persisted dialog preview.
        // Keep local preview only for unsent optimistic messages.
        if (prevSending) lastMessage = prevLast
        else lastMessage = nextLast
      }
      merged.push({ ...inc, lastMessage })
      used.add(uid)
    } else {
      const prevLast = d?.lastMessage || null
      const prevId = String(prevLast?.id || '')
      const prevSending =
        String(prevLast?.status || '') === 'sending' ||
        prevId.startsWith('tmp_dm_')
      // Keep local-only dialog only while optimistic send is still pending.
      if (prevSending) {
        merged.push(d)
        used.add(uid)
      }
    }
  }
  for (const d of incoming) {
    const uid = String(d?.userId || '')
    if (!uid || used.has(uid)) continue
    merged.push(d)
    used.add(uid)
  }
  merged.sort((a, b) => Number(b?.lastMessage?.ts || 0) - Number(a?.lastMessage?.ts || 0))
  return merged
}

function mergeDmThreadRefresh(existing, itemsAsc, deletedMap) {
  if (!Array.isArray(existing) || !existing.length) {
    return (Array.isArray(itemsAsc) ? itemsAsc : []).filter(
      (m) => !deletedMap[String(m?.id || '')]
    )
  }
  if (!Array.isArray(itemsAsc) || !itemsAsc.length) {
    // Server is authoritative on refresh:
    // if thread is now empty, keep only local optimistic sends.
    const optimisticOnly = existing.filter((m) => {
      const id = String(m?.id || '')
      return String(m?.status || '') === 'sending' || id.startsWith('tmp_dm_')
    })
    return optimisticOnly.filter((m) => !deletedMap[String(m?.id || '')])
  }
  const minIncomingTs = itemsAsc.length
    ? Math.min(...itemsAsc.map((m) => Number(m?.ts || 0)))
    : Number.POSITIVE_INFINITY
  const byId = new Map(itemsAsc.map((m) => [String(m?.id || ''), m]))
  let changed = false
  const merged = []
  for (const m of existing) {
    const id = String(m?.id || '')
    if (!byId.has(id)) {
      const prevTs = Number(m?.ts || 0)
      const prevSending =
        String(m?.status || '') === 'sending' ||
        id.startsWith('tmp_dm_')
      // If refreshed recent window doesn't contain this persisted message,
      // it was likely deleted server-side: drop it.
      if (!prevSending && prevTs >= minIncomingTs) {
        changed = true
        continue
      }
      merged.push(m)
      continue
    }
    const inc = byId.get(id)
    const prevTs = Number(m?.ts || 0)
    const nextTs = Number(inc?.ts || 0)
    const prevSt = String(m?.status || '')
    const nextSt = String(inc?.status || '')
    const prevTxt = String(m?.text || m?.message || m?.body || '')
    const nextTxt = String(inc?.text || inc?.message || inc?.body || '')
    if (prevTs !== nextTs || prevSt !== nextSt || prevTxt !== nextTxt) changed = true
    merged.push({ ...m, ...inc })
  }
  const existingIds = new Set(merged.map((m) => String(m?.id || '')))
  for (const m of itemsAsc) {
    const id = String(m?.id || '')
    if (id && !existingIds.has(id)) {
      merged.push(m)
      changed = true
    }
  }
  if (!changed) return existing
  return merged.filter((m) => !deletedMap[String(m?.id || '')])
}

function mergeDmThreadInitial(existing, itemsAsc, deletedMap) {
  if (!Array.isArray(existing) || !existing.length) return itemsAsc
  const pending = existing.filter(
    (m) =>
      String(m?.status || '') === 'sending' ||
      String(m?.id || '').startsWith('tmp_dm_')
  )
  if (!pending.length) return itemsAsc
  const existingIds = new Set(itemsAsc.map((m) => String(m?.id || '')))
  const add = pending
    .filter((m) => {
      const id = String(m?.id || '')
      return id && !existingIds.has(id)
    })
    .sort((a, b) => Number(a?.ts || 0) - Number(b?.ts || 0))
  const next = add.length ? [...itemsAsc, ...add] : itemsAsc
  return next.filter((m) => !deletedMap[String(m?.id || '')])
}

export async function dmFetchCached({
  meId,
  cacheRef,
  inflightRef,
  key,
  url,
  opts = {},
  fetchImpl = fetch,
}) {
  if (!meId) return null
  if (opts?.force) cacheRef.current.delete(key)
  if (!opts?.force && cacheRef.current.has(key)) return cacheRef.current.get(key)
  if (inflightRef.current.has(key)) return inflightRef.current.get(key)
  const p = (async () => {
    const r = await fetchImpl(url, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'x-forum-user-id': String(meId) },
    })
    const j = await r.json().catch(() => null)
    return j
  })()
  inflightRef.current.set(key, p)
  try {
    const j = await p
    cacheRef.current.set(key, j)
    return j
  } finally {
    inflightRef.current.delete(key)
  }
}

export async function loadDmDialogs(cursor = null, opts = {}, ctx = {}) {
  const {
    meId,
    dmDialogsHasMore,
    dmDialogsLoadingRef,
    dmDialogsLastFetchRef,
    DM_BG_THROTTLE_MS,
    DM_ACTIVE_THROTTLE_MS,
    DM_PAGE_SIZE,
    setDmDialogsLoading,
    dmFetchCachedFn,
    dmDialogsCacheRef,
    dmDialogsInFlightRef,
    setDmDialogs,
    setDmDialogsCursor,
    setDmDialogsHasMore,
    setDmDialogsLoaded,
  } = ctx

  if (!meId) return
  const isPaginating = !!cursor
  if (cursor && !dmDialogsHasMore && !opts.force) return
  if (dmDialogsLoadingRef.current) return

  const nowTs = Date.now()
  const isBackground = !!opts.background
  const throttleMs = Number(
    opts.throttleMs || (isBackground ? DM_BG_THROTTLE_MS : DM_ACTIVE_THROTTLE_MS)
  )
  const shouldThrottle = !isPaginating && (opts.refresh || isBackground)
  if (shouldThrottle && throttleMs > 0) {
    const throttleKey = isBackground ? 'bg' : 'active'
    const last = Number(dmDialogsLastFetchRef.current?.[throttleKey] || 0)
    if (nowTs - last < throttleMs) return
    dmDialogsLastFetchRef.current = {
      ...(dmDialogsLastFetchRef.current || {}),
      [throttleKey]: nowTs,
    }
  }

  const showLoading = !opts.refresh && !opts.background && !isPaginating
  dmDialogsLoadingRef.current = true
  if (showLoading) setDmDialogsLoading(true)

  const qs = new URLSearchParams()
  qs.set('limit', String(DM_PAGE_SIZE))
  if (cursor) qs.set('cursor', String(cursor))
  const key = `dlg:${meId}:${cursor || ''}:${DM_PAGE_SIZE}`
  try {
    const j = await dmFetchCachedFn(
      dmDialogsCacheRef,
      dmDialogsInFlightRef,
      key,
      `/api/dm/dialogs?${qs.toString()}`,
      opts
    )
    if (j?.ok) {
      const incoming = Array.isArray(j.items) ? j.items : []
      setDmDialogs((prev) => {
        const existing = Array.isArray(prev) ? prev : []
        if (cursor) return [...existing, ...incoming]
        return mergeDmDialogs(existing, incoming)
      })
      setDmDialogsCursor(j.nextCursor || null)
      setDmDialogsHasMore(!!j.hasMore)
      setDmDialogsLoaded(true)
    }
  } finally {
    dmDialogsLoadingRef.current = false
    if (showLoading) setDmDialogsLoading(false)
  }
}

export async function loadDmThread(withUserId, cursor = null, opts = {}, ctx = {}) {
  const {
    meId,
    dmThreadHasMore,
    dmThreadLoadingRef,
    dmThreadLastFetchRef,
    DM_ACTIVE_THROTTLE_MS,
    DM_PAGE_SIZE,
    setDmThreadLoading,
    dmFetchCachedFn,
    dmThreadCacheRef,
    dmThreadInFlightRef,
    dmDeletedMsgMap,
    setDmThreadItems,
    setDmThreadCursor,
    setDmThreadHasMore,
    setDmThreadSeenTs,
  } = ctx

  const uid = String(withUserId || '').trim()
  if (!meId || !uid) return
  const isPaginating = !!cursor
  if (cursor && !dmThreadHasMore && !opts.force) return
  if (dmThreadLoadingRef.current) return

  const nowTs = Date.now()
  const throttleMs = Number(opts.throttleMs || DM_ACTIVE_THROTTLE_MS)
  const shouldThrottle = !isPaginating && !!opts.refresh
  if (shouldThrottle && throttleMs > 0) {
    const tKey = `refresh:${uid}`
    const lastTs = Number(dmThreadLastFetchRef.current.get(tKey) || 0)
    if (nowTs - lastTs < throttleMs) return
    dmThreadLastFetchRef.current.set(tKey, nowTs)
  }

  const showLoading = !opts.refresh && !isPaginating
  dmThreadLoadingRef.current = true
  if (showLoading) setDmThreadLoading(true)

  const qs = new URLSearchParams()
  qs.set('limit', String(DM_PAGE_SIZE))
  qs.set('dir', 'older')
  qs.set('with', uid)
  if (cursor) qs.set('cursor', String(cursor))
  const key = `thr:${meId}:${uid}:${cursor || ''}:${DM_PAGE_SIZE}`
  try {
    const j = await dmFetchCachedFn(
      dmThreadCacheRef,
      dmThreadInFlightRef,
      key,
      `/api/dm/thread?${qs.toString()}`,
      opts
    )
    if (j?.ok) {
      const deletedMap = dmDeletedMsgMap || {}
      const rawItems = Array.isArray(j.items) ? j.items : []
      const items = rawItems.filter((m) => !deletedMap[String(m?.id || '')])
      const itemsAsc = items.slice().reverse()
      setDmThreadItems((prev) => {
        const existing = Array.isArray(prev) ? prev : []
        if (cursor) return [...itemsAsc, ...existing]
        if (opts?.refresh) return mergeDmThreadRefresh(existing, itemsAsc, deletedMap)
        return mergeDmThreadInitial(existing, itemsAsc, deletedMap)
      })
      setDmThreadCursor(j.nextCursor || null)
      setDmThreadHasMore(!!j.hasMore)
      setDmThreadSeenTs(Number(j.peerSeenTs || 0))
    }
  } finally {
    dmThreadLoadingRef.current = false
    if (showLoading) setDmThreadLoading(false)
  }
}
