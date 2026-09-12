import { useCallback } from 'react'

export default function useForumCreateTopicAction({
  rateLimiter,
  toast,
  t,
  requireAuthStrict,
  resolveProfileAccountId,
  safeReadProfile,
  resolveNickForDisplay,
  resolveIconForDisplay,
  hasAnyLink,
  isBrowserFn,
  setOverlay,
  setSel,
  pushOp,
  syncNowRef,
  setText,
  setPendingImgs,
  setPendingAudio,
  resetVideo,
  setReplyTo,
}) {
  const createTopic = useCallback(async (title, description, first) => {
    if (!rateLimiter?.allowAction?.()) {
      toast?.warn?.(t?.('forum_too_fast'))
      return
    }

    const r = await requireAuthStrict?.()
    if (!r) return

    const uid = resolveProfileAccountId?.(r.asherId || r.accountId || '')
    const prof = safeReadProfile?.(uid) || {}
    const nickForSend = resolveNickForDisplay?.(uid, prof.nickname)
    const iconForSend = resolveIconForDisplay?.(uid, prof.icon)

    const safeTitle = String(title || '')
    const safeDesc = String(description || '').slice(0, 90)
    const safeFirst = String(first || '').slice(0, 400)

    const tmpT = `tmp_t_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const tmpP = `tmp_p_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const isAdm = !!isBrowserFn?.() && localStorage.getItem('ql7_admin') === '1'

    if (!isAdm) {
      const rawTitle = String(title || '')
      const rawDesc = String(description || '')
      const rawFirst = String(first || '')
      if (hasAnyLink?.(rawTitle) || hasAnyLink?.(rawDesc) || hasAnyLink?.(rawFirst)) {
        toast?.warn?.(t?.('forum_links_admin_only'))
        return
      }
    }

    const t0 = {
      id: tmpT,
      title: safeTitle,
      description: safeDesc,
      ts: Date.now(),
      userId: uid,
      nickname: nickForSend,
      icon: iconForSend,
      isAdmin: isAdm,
      views: 0,
    }
    const p0 = {
      id: tmpP,
      cid: tmpP,
      topicId: tmpT,
      parentId: null,
      text: safeFirst,
      ts: Date.now(),
      userId: uid,
      nickname: t0.nickname,
      icon: t0.icon,
      isAdmin: isAdm,
      likes: 0,
      dislikes: 0,
      views: 0,
      myReaction: null,
    }

    setOverlay?.((prev) => ({
      ...prev,
      creates: {
        topics: [t0, ...(prev.creates.topics || [])],
        posts: [...(prev.creates.posts || []), p0],
      },
    }))
    setSel?.(t0)
    toast?.ok?.(t?.('forum_create_ok'))

    pushOp?.('create_topic', {
      title: safeTitle,
      description: safeDesc,
      nickname: t0.nickname,
      icon: t0.icon,
      cid: tmpT,
      id: tmpT,
    })
    pushOp?.('create_post', {
      topicId: tmpT,
      topicCid: tmpT,
      text: safeFirst,
      nickname: t0.nickname,
      icon: t0.icon,
      parentId: null,
      cid: tmpP,
      id: tmpP,
    })

    try {
      syncNowRef.current?.()
    } catch {}

    try {
      setText?.('')
    } catch {}
    try {
      setPendingImgs?.([])
    } catch {}
    try {
      setPendingAudio?.(null)
    } catch {}
    try {
      resetVideo?.()
    } catch {}
    try {
      setReplyTo?.(null)
    } catch {}
  }, [
    hasAnyLink,
    isBrowserFn,
    pushOp,
    rateLimiter,
    requireAuthStrict,
    resetVideo,
    resolveIconForDisplay,
    resolveNickForDisplay,
    resolveProfileAccountId,
    safeReadProfile,
    setOverlay,
    setPendingAudio,
    setPendingImgs,
    setReplyTo,
    setSel,
    setText,
    syncNowRef,
    t,
    toast,
  ])

  return {
    createTopic,
  }
}
