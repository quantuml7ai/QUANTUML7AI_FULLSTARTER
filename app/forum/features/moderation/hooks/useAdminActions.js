import { useCallback } from 'react'

export default function useAdminActions({
  isAdmin,
  api,
  persistSnap,
  toast,
  t,
  emitPostDeleted,
}) {
  const delTopic = useCallback(async (topic) => {
    if (!isAdmin) return
    const r = await api.adminDeleteTopic(topic.id)
    if (r?.ok) {
      persistSnap((prev) => ({
        ...prev,
        topics: prev.topics.filter((x) => x.id !== topic.id),
        posts: prev.posts.filter((p) => p.topicId !== topic.id),
      }))
      toast.ok('Topic removed')
      emitPostDeleted()
      return
    }
    console.error('adminDeleteTopic error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }, [isAdmin, api, persistSnap, toast, emitPostDeleted])

  const delPost = useCallback(async (post) => {
    if (!isAdmin) return
    const r = await api.adminDeletePost(post.id)
    if (r?.ok) {
      persistSnap((prev) => {
        const del = new Set([post.id])
        let grow = true
        while (grow) {
          grow = false
          for (const it of prev.posts) {
            if (it.parentId && del.has(it.parentId) && !del.has(it.id)) {
              del.add(it.id)
              grow = true
            }
          }
        }
        return { ...prev, posts: prev.posts.filter((x) => !del.has(x.id)) }
      })
      toast.ok('Post removed')
      emitPostDeleted(post.id, post.topicId)
      return
    }
    console.error('adminDeletePost error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }, [isAdmin, api, persistSnap, toast, emitPostDeleted])

  const banUser = useCallback(async (post) => {
    if (!isAdmin) return
    const id = post.accountId || post.userId
    const r = await api.adminBanUser(id)
    if (r?.ok) {
      persistSnap((prev) => {
        const bans = new Set(prev.bans || [])
        bans.add(id)
        return { ...prev, bans: Array.from(bans) }
      })
      toast.ok(t('forum_banned_ok'))
      return
    }
    console.error('adminBanUser error:', r)
    toast.err(r?.error || t('forum_admin_error'))
  }, [isAdmin, api, persistSnap, toast, t])

  const unbanUser = useCallback(async (post) => {
    if (!isAdmin) return
    const id = post.accountId || post.userId
    const r = await api.adminUnbanUser(id)
    if (r?.ok) {
      persistSnap((prev) => {
        const bans = new Set(prev.bans || [])
        bans.delete(id)
        return { ...prev, bans: Array.from(bans) }
      })
      toast.ok(t('forum_unbanned_ok'))
      return
    }
    console.error('adminUnbanUser error:', r)
    toast.err(r?.error || t('forum_admin_error'))
  }, [isAdmin, api, persistSnap, toast, t])

  return {
    delTopic,
    delPost,
    banUser,
    unbanUser,
  }
}
