import { useCallback } from 'react'

export default function useForumMutationActions({
  requireAuthStrictFn,
  rateLimiter,
  toast,
  t,
  setOverlay,
  pushOp,
  requestFlushSoon,
  authAsherId,
  authAccountId,
  api,
  persistTombstones,
  selectedTopicId,
  setSelectedTopic,
  emitPostDeletedFn,
}) {
  const reactMut = useCallback(async (post, kind) => {
    if (!rateLimiter?.allowAction?.()) {
      if (toast?.warn) toast.warn(t('forum_too_fast'))
      return
    }
    const r = await requireAuthStrictFn?.()
    if (!r) return

    const postId = String(post?.id || '').trim()
    if (!postId) return
    const nextState = kind === 'dislike' ? 'dislike' : 'like'
    const current = post?.myReaction === 'like' || post?.myReaction === 'dislike'
      ? post.myReaction
      : null
    // Premium UX rule: same reaction cannot be removed by repeat click.
    if (current === nextState) return

    const baseLikes = Number(post.likes ?? 0)
    const baseDislikes = Number(post.dislikes ?? 0)

    let likes = baseLikes
    let dislikes = baseDislikes
    // If current reaction is unknown (null), don't optimistic-shift counters:
    // this prevents visual jumps when server already has a prior reaction.
    if (current) {
      if (current === 'like') likes = Math.max(0, likes - 1)
      if (current === 'dislike') dislikes = Math.max(0, dislikes - 1)
      if (nextState === 'like') likes += 1
      if (nextState === 'dislike') dislikes += 1
    }

    setOverlay((prev) => ({
      ...prev,
      reactions: {
        ...prev.reactions,
        [postId]: { state: nextState, likes, dislikes },
      },
    }))

    // Reactions should be flushed faster than generic queue actions.
    pushOp('set_reaction', { postId, state: nextState }, { flushDelayMs: 35 })
    requestFlushSoon?.(35)
  }, [pushOp, rateLimiter, requestFlushSoon, requireAuthStrictFn, setOverlay, t, toast])

  const delTopicOwn = useCallback(async (topic) => {
    const uid = authAsherId || authAccountId || ''
    if (!uid) {
      toast.warn(t('forum_auth_required'))
      return
    }

    const topicId = String(topic?.id || '')
    if (!topicId) return
    if (topicId.startsWith('tmp_t_')) {
      setOverlay((prev) => ({
        ...prev,
        creates: {
          ...prev.creates,
          topics: (prev.creates.topics || []).filter((x) => String(x.id) !== topicId),
          posts: (prev.creates.posts || []).filter((x) => String(x.topicId) !== topicId),
        },
      }))
      return
    }

    persistTombstones((prev) => {
      const topics = { ...prev.topics, [topicId]: Date.now() }
      return { ...prev, topics }
    })

    if (String(selectedTopicId || '') === topicId) {
      try {
        setSelectedTopic(null)
      } catch {}
    }

    const r = await api.ownerDeleteTopic(topicId, uid)
    if (r?.ok) {
      toast.ok(t('forum_delete_ok'))
      return
    }

    persistTombstones((prev) => {
      const topics = { ...prev.topics }
      delete topics[topicId]
      return { ...prev, topics }
    })
    console.error('ownerDeleteTopic error:', r)
    toast.err((r?.error && String(r.error)) || t('forum_delete_failed'))
  }, [
    api,
    authAccountId,
    authAsherId,
    persistTombstones,
    selectedTopicId,
    setOverlay,
    setSelectedTopic,
    t,
    toast,
  ])

  const delPostOwn = useCallback(async (post) => {
    const uid = authAsherId || authAccountId || ''
    if (!uid) {
      toast.warn(t('forum_auth_required'))
      return
    }

    const postId = String(post?.id || '')
    if (!postId) return
    if (postId.startsWith('tmp_p_')) {
      setOverlay((prev) => ({
        ...prev,
        creates: {
          ...prev.creates,
          posts: (prev.creates.posts || []).filter((x) => String(x.id) !== postId),
        },
      }))
      return
    }

    persistTombstones((prev) => {
      const posts = { ...prev.posts, [postId]: Date.now() }
      return { ...prev, posts }
    })

    const r = await api.ownerDeletePost(postId, uid)
    if (r?.ok) {
      try {
        emitPostDeletedFn?.(postId, post?.topicId)
      } catch {}
      toast.ok(t('forum_delete_ok'))
      return
    }

    persistTombstones((prev) => {
      const posts = { ...prev.posts }
      delete posts[postId]
      return { ...prev, posts }
    })
    console.error('ownerDeletePost error:', r)
    toast.err((r?.error && String(r.error)) || t('forum_delete_failed'))
  }, [
    api,
    authAccountId,
    authAsherId,
    emitPostDeletedFn,
    persistTombstones,
    setOverlay,
    t,
    toast,
  ])

  return {
    reactMut,
    delTopicOwn,
    delPostOwn,
  }
}
