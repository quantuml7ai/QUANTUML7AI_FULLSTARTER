import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeStarredAuthorId, prioritizeStarredItems } from '../utils/starred'

function clean(value) {
  return String(value || '').trim()
}

function addStarIdentityVariants(out, raw, resolveProfileAccountIdFn) {
  const original = clean(raw)
  const resolved = clean(resolveProfileAccountIdFn?.(original) || original)
  const normalized = clean(normalizeStarredAuthorId(resolved || original, resolveProfileAccountIdFn))
  const values = [original, resolved, normalized]

  for (const value of values) {
    const v = clean(value)
    if (!v) continue

    out.add(v)

    if (/^0x[a-f0-9]{40}$/i.test(v)) {
      out.add(v.toLowerCase())
      out.add(`wallet:${v.toLowerCase()}`)
    } else if (/^wallet:0x[a-f0-9]{40}$/i.test(v)) {
      const wallet = v.slice('wallet:'.length)
      out.add(wallet)
      out.add(wallet.toLowerCase())
      out.add(`wallet:${wallet.toLowerCase()}`)
    }

    const lower = v.toLowerCase()
    for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']) {
      if (lower.startsWith(prefix)) {
        const bare = clean(v.slice(prefix.length))
        if (bare) out.add(bare)
        break
      }
    }
  }

  return out
}

function starIdentityVariants(raw, resolveProfileAccountIdFn) {
  return Array.from(addStarIdentityVariants(new Set(), raw, resolveProfileAccountIdFn)).filter(Boolean)
}

function hasAnyStarIdentity(set, variants) {
  if (!set || !variants?.length) return false
  return variants.some((id) => set.has(id))
}

function addAllStarIdentities(set, variants) {
  for (const id of variants || []) {
    if (id) set.add(id)
  }
}

function deleteAllStarIdentities(set, variants) {
  for (const id of variants || []) {
    if (id) set.delete(id)
  }
}

function extractAuthors(list) {
  if (Array.isArray(list?.authors)) return list.authors
  if (Array.isArray(list?.subscriptions)) return list.subscriptions
  if (Array.isArray(list?.ids)) return list.ids
  return []
}

export default function useStarredAuthorsState({
  viewerId,
  api,
  requireAuthStrict,
  starMode,
  resolveProfileAccountIdFn,
}) {
  const [starredAuthors, setStarredAuthors] = useState(() => new Set())
  const [myFollowersCount, setMyFollowersCount] = useState(0)
  const [myFollowingCount, setMyFollowingCount] = useState(0)
  const [myFollowersLoading, setMyFollowersLoading] = useState(false)
  const normalizedViewerId = useMemo(
    () => normalizeStarredAuthorId(viewerId, resolveProfileAccountIdFn),
    [viewerId, resolveProfileAccountIdFn],
  )
  const viewerVariants = useMemo(
    () => starIdentityVariants(viewerId || normalizedViewerId, resolveProfileAccountIdFn),
    [viewerId, normalizedViewerId, resolveProfileAccountIdFn],
  )

  const loadServerState = useCallback(async (aliveRef = { current: true }) => {
    if (!normalizedViewerId) {
      if (aliveRef.current) {
        setStarredAuthors(new Set())
        setMyFollowersCount(0)
        setMyFollowingCount(0)
        setMyFollowersLoading(false)
      }
      return
    }

    const list = await api.subsList(normalizedViewerId)
    if (!aliveRef.current) return

    const arr = extractAuthors(list)
    const nextSet = new Set()
    for (const authorId of arr) addStarIdentityVariants(nextSet, authorId, resolveProfileAccountIdFn)
    setStarredAuthors(nextSet)

    setMyFollowersLoading(true)
    const mc = await api.subsMyCount(normalizedViewerId)
    if (!aliveRef.current) return

    setMyFollowersCount(Number(mc?.count || mc?.followersCount || mc?.counts?.followers || 0))
    setMyFollowingCount(Number(mc?.followingCount ?? mc?.counts?.following ?? arr.length ?? 0))
    setMyFollowersLoading(false)
  }, [normalizedViewerId, api, resolveProfileAccountIdFn])

  useEffect(() => {
    const aliveRef = { current: true }

    loadServerState(aliveRef).catch(() => {
      if (!aliveRef.current) return
      setStarredAuthors(new Set())
      setMyFollowersLoading(false)
    })

    return () => { aliveRef.current = false }
  }, [loadServerState])

  const toggleAuthorStar = useCallback(async (authorIdRaw) => {
    const variants = starIdentityVariants(authorIdRaw, resolveProfileAccountIdFn)
    const authorId = normalizeStarredAuthorId(authorIdRaw, resolveProfileAccountIdFn)
    if (!authorId || !variants.length) return
    if (normalizedViewerId && (
      authorId === normalizedViewerId ||
      variants.some((id) => viewerVariants.includes(id))
    )) return

    if (!normalizedViewerId) {
      try { await requireAuthStrict() } catch {}
      return
    }

    const before = new Set(starredAuthors)
    const wasSubscribed = hasAnyStarIdentity(before, variants)

    setStarredAuthors((prev) => {
      const next = new Set(prev)
      if (hasAnyStarIdentity(next, variants)) deleteAllStarIdentities(next, variants)
      else addAllStarIdentities(next, variants)
      return next
    })

    const res = await api.subsToggle(normalizedViewerId, authorId)
    if (!res?.ok) {
      setStarredAuthors(before)
      return
    }

    const finalVariants = new Set(variants)
    addStarIdentityVariants(finalVariants, res.authorId || authorId, resolveProfileAccountIdFn)

    setStarredAuthors((prev) => {
      const next = new Set(prev)
      if (res.subscribed) addAllStarIdentities(next, Array.from(finalVariants))
      else deleteAllStarIdentities(next, Array.from(finalVariants))
      return next
    })

    setMyFollowingCount((cur) => {
      const current = Number(cur || 0) || 0
      if (res.followingCount != null) return Number(res.followingCount || 0) || 0
      if (res.subscribed && !wasSubscribed) return current + 1
      if (!res.subscribed && wasSubscribed) return Math.max(0, current - 1)
      return current
    })

    const aliveRef = { current: true }
    loadServerState(aliveRef).catch(() => {})
  }, [
    normalizedViewerId,
    api,
    requireAuthStrict,
    resolveProfileAccountIdFn,
    viewerVariants,
    starredAuthors,
    loadServerState,
  ])

  const activeStarredAuthors = useMemo(() => {
    if (!starMode) return null
    if (!starredAuthors || starredAuthors.size === 0) return null
    return starredAuthors
  }, [starMode, starredAuthors])

  const starredFirst = useCallback((arr, getAuthorId) => {
    return prioritizeStarredItems(arr, getAuthorId, activeStarredAuthors, resolveProfileAccountIdFn)
  }, [activeStarredAuthors, resolveProfileAccountIdFn])

  return {
    starredAuthors,
    setStarredAuthors,
    myFollowersCount,
    myFollowingCount,
    myFollowersLoading,
    toggleAuthorStar,
    activeStarredAuthors,
    starredFirst,
  }
}
