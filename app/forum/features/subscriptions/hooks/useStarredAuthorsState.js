import { useCallback, useEffect, useMemo, useState } from 'react'
import { prioritizeStarredItems } from '../utils/starred'

export default function useStarredAuthorsState({
  viewerId,
  api,
  requireAuthStrict,
  starMode,
}) {
  const [starredAuthors, setStarredAuthors] = useState(() => new Set())
  const [myFollowersCount, setMyFollowersCount] = useState(0)
  const [myFollowersLoading, setMyFollowersLoading] = useState(false)

  useEffect(() => {
    let alive = true

    if (!viewerId) {
      setStarredAuthors(new Set())
      setMyFollowersCount(0)
      return () => { alive = false }
    }

    ;(async () => {
      const list = await api.subsList(viewerId)
      if (!alive) return
      const arr = Array.isArray(list?.authors) ? list.authors : []
      setStarredAuthors(new Set(arr.map((x) => String(x).trim()).filter(Boolean)))

      setMyFollowersLoading(true)
      const mc = await api.subsMyCount(viewerId)
      if (!alive) return
      setMyFollowersCount(Number(mc?.count || 0))
      setMyFollowersLoading(false)
    })()

    return () => { alive = false }
  }, [viewerId, api])

  const toggleAuthorStar = useCallback(async (authorIdRaw) => {
    const authorId = String(authorIdRaw || '').trim()
    if (!authorId) return
    if (viewerId && authorId === viewerId) return

    if (!viewerId) {
      try { await requireAuthStrict() } catch {}
      return
    }

    setStarredAuthors((prev) => {
      const next = new Set(prev)
      if (next.has(authorId)) next.delete(authorId)
      else next.add(authorId)
      return next
    })

    const res = await api.subsToggle(viewerId, authorId)
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
  }, [viewerId, api, requireAuthStrict])

  const activeStarredAuthors = useMemo(() => {
    if (!starMode) return null
    if (!starredAuthors || starredAuthors.size === 0) return null
    return starredAuthors
  }, [starMode, starredAuthors])

  const starredFirst = useCallback((arr, getAuthorId) => {
    return prioritizeStarredItems(arr, getAuthorId, activeStarredAuthors)
  }, [activeStarredAuthors])

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
