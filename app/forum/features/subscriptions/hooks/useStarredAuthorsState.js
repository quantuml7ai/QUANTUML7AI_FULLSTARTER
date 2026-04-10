import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeStarredAuthorId, prioritizeStarredItems } from '../utils/starred'

export default function useStarredAuthorsState({
  viewerId,
  api,
  requireAuthStrict,
  starMode,
  resolveProfileAccountIdFn,
}) {
  const [starredAuthors, setStarredAuthors] = useState(() => new Set())
  const [myFollowersCount, setMyFollowersCount] = useState(0)
  const [myFollowersLoading, setMyFollowersLoading] = useState(false)
  const normalizedViewerId = useMemo(
    () => normalizeStarredAuthorId(viewerId, resolveProfileAccountIdFn),
    [viewerId, resolveProfileAccountIdFn],
  )

  useEffect(() => {
    let alive = true

    if (!normalizedViewerId) {
      setStarredAuthors(new Set())
      setMyFollowersCount(0)
      return () => { alive = false }
    }

    ;(async () => {
      const list = await api.subsList(normalizedViewerId)
      if (!alive) return
      const arr = Array.isArray(list?.authors) ? list.authors : []
      setStarredAuthors(new Set(
        arr
          .map((authorId) => normalizeStarredAuthorId(authorId, resolveProfileAccountIdFn))
          .filter(Boolean),
      ))

      setMyFollowersLoading(true)
      const mc = await api.subsMyCount(normalizedViewerId)
      if (!alive) return
      setMyFollowersCount(Number(mc?.count || 0))
      setMyFollowersLoading(false)
    })()

    return () => { alive = false }
  }, [normalizedViewerId, api, resolveProfileAccountIdFn])

  const toggleAuthorStar = useCallback(async (authorIdRaw) => {
    const authorId = normalizeStarredAuthorId(authorIdRaw, resolveProfileAccountIdFn)
    if (!authorId) return
    if (normalizedViewerId && authorId === normalizedViewerId) return

    if (!normalizedViewerId) {
      try { await requireAuthStrict() } catch {}
      return
    }

    setStarredAuthors((prev) => {
      const next = new Set(prev)
      if (next.has(authorId)) next.delete(authorId)
      else next.add(authorId)
      return next
    })

    const res = await api.subsToggle(normalizedViewerId, authorId)
    if (!res?.ok) {
      setStarredAuthors((prev) => {
        const next = new Set(prev)
        if (next.has(authorId)) next.delete(authorId)
        else next.add(authorId)
        return next
      })
      return
    }

    setStarredAuthors((prev) => {
      const shouldBeSubscribed = !!res.subscribed
      const isNowSubscribed = prev.has(authorId)
      if (shouldBeSubscribed === isNowSubscribed) return prev
      const next = new Set(prev)
      if (shouldBeSubscribed) next.add(authorId)
      else next.delete(authorId)
      return next
    })
  }, [normalizedViewerId, api, requireAuthStrict, resolveProfileAccountIdFn])

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
    myFollowersLoading,
    toggleAuthorStar,
    activeStarredAuthors,
    starredFirst,
  }
}
