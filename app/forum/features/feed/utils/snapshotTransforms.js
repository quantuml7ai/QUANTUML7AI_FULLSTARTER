import { sigTopic, sigPost } from './signatures'

export function dedupeForumSnapshot(prev) {
  const bySigT = new Map()
  const betterT = (a, b) => {
    const aReal = !a.id?.startsWith?.('tmp_t_')
    const bReal = !b.id?.startsWith?.('tmp_t_')
    if (aReal !== bReal) return aReal ? a : b
    const aAdm = !!a.isAdmin
    const bAdm = !!b.isAdmin
    if (aAdm !== bAdm) return aAdm ? a : b
    if ((a.ts || 0) !== (b.ts || 0)) return (a.ts || 0) > (b.ts || 0) ? a : b
    return a
  }
  for (const topic of (prev.topics || [])) {
    const s = sigTopic(topic)
    const chosen = bySigT.get(s)
    bySigT.set(s, chosen ? betterT(chosen, topic) : topic)
  }
  const topics = Array.from(bySigT.values())

  const bySigP = new Map()
  const betterP = (a, b) => {
    const aReal = !a.id?.startsWith?.('tmp_p_')
    const bReal = !b.id?.startsWith?.('tmp_p_')
    if (aReal !== bReal) return aReal ? a : b
    const aAdm = !!a.isAdmin
    const bAdm = !!b.isAdmin
    if (aAdm !== bAdm) return aAdm ? a : b
    if ((a.ts || 0) !== (b.ts || 0)) return (a.ts || 0) > (b.ts || 0) ? a : b
    return a
  }
  for (const post of (prev.posts || [])) {
    const s = sigPost(post)
    const chosen = bySigP.get(s)
    bySigP.set(s, chosen ? betterP(chosen, post) : post)
  }
  const posts = Array.from(bySigP.values())

  return { ...prev, topics, posts }
}

export function pruneForumTombstones(next, ttlMs) {
  const now = Date.now()
  const dropExpired = (bucket) => {
    const out = {}
    for (const [id, ts] of Object.entries(bucket || {})) {
      if (now - Number(ts || 0) < ttlMs) out[id] = ts
    }
    return out
  }
  return { topics: dropExpired(next.topics), posts: dropExpired(next.posts) }
}

export function applyForumFullSnapshot(prev, snapshot, tombstones) {
  const isTomb = (bucket, id) => !!tombstones?.[bucket]?.[String(id)]
  const snapshotTopics = (snapshot.topics || []).filter((t) => !isTomb('topics', t.id))
  const snapshotPosts = (snapshot.posts || []).filter((p) => !isTomb('posts', p.id))

  const mergeStableOrder = (prevList, nextList, mergeItem) => {
    const nextById = new Map()
    for (const item of (nextList || [])) {
      const id = String(item?.id || '').trim()
      if (!id) continue
      nextById.set(id, item)
    }

    const out = []
    const used = new Set()

    for (const prevItem of (prevList || [])) {
      const id = String(prevItem?.id || '').trim()
      if (!id) continue
      const fresh = nextById.get(id)
      if (!fresh) continue
      out.push(mergeItem(prevItem, fresh))
      used.add(id)
    }

    for (const fresh of (nextList || [])) {
      const id = String(fresh?.id || '').trim()
      if (!id || used.has(id)) continue
      out.push(mergeItem(null, fresh))
      used.add(id)
    }

    return out
  }

  const topics = mergeStableOrder(prev.topics || [], snapshotTopics, (_prevTopic, freshTopic) => ({ ...freshTopic }))
  const posts = mergeStableOrder(prev.posts || [], snapshotPosts, (prevPost, freshPost) => ({
    ...freshPost,
    myReaction: prevPost?.myReaction ?? freshPost.myReaction ?? null,
  }))

  const out = {
    ...prev,
    topics,
    posts,
    bans: Array.isArray(snapshot.bans) ? snapshot.bans : prev.bans,
    admins: Array.isArray(snapshot.admins) ? snapshot.admins : prev.admins,
    rev: snapshot.rev,
    cursor: snapshot.cursor ?? prev.cursor,
  }
  if (snapshot.vipMap && typeof snapshot.vipMap === 'object') out.vipMap = snapshot.vipMap
  return dedupeForumSnapshot(out)
}

export function applyForumEvents(prev, events, tombstones, overlay) {
  const isTomb = (bucket, id) => !!tombstones?.[bucket]?.[String(id)]
  const topicsById = new Map((prev.topics || []).map((t) => [String(t.id), { ...t }]))
  const postsById = new Map((prev.posts || []).map((p) => [String(p.id), { ...p }]))
  const deletedTopics = new Set()
  const deletedPosts = new Set()
  const pendingReactions = overlay?.reactions || {}
  const pendingViews = overlay?.views || { topics: {}, posts: {} }

  for (const evt of (events || [])) {
    const kind = evt?.kind
    if (kind === 'topic') {
      const id = String(evt.id || '')
      if (!id || isTomb('topics', id)) continue
      if (evt._del) {
        deletedTopics.add(id)
        continue
      }
      const data = evt.data || {}
      topicsById.set(id, { ...(topicsById.get(id) || {}), ...data, id })
    }

    if (kind === 'post') {
      const id = String(evt.id || '')
      if (!id || isTomb('posts', id)) continue
      if (evt._del) {
        const ids = Array.isArray(evt.deleted) ? evt.deleted.map(String) : [id]
        ids.forEach((pid) => deletedPosts.add(pid))
        continue
      }
      const data = evt.data || {}
      const prior = postsById.get(id) || {}
      const next = { ...prior, ...data, id, myReaction: prior.myReaction ?? data.myReaction ?? null }
      if (pendingReactions[String(id)]) {
        next.likes = prior.likes
        next.dislikes = prior.dislikes
        next.myReaction = prior.myReaction ?? next.myReaction ?? null
      }
      postsById.set(id, next)
    }

    if (kind === 'views') {
      const posts = evt.posts && typeof evt.posts === 'object' ? evt.posts : {}
      const topics = evt.topics && typeof evt.topics === 'object' ? evt.topics : {}

      for (const [idRaw, val] of Object.entries(posts)) {
        const id = String(idRaw)
        if (!id || isTomb('posts', id)) continue
        if (typeof pendingViews.posts?.[id] === 'number') continue
        const views = Number(val)
        if (!Number.isFinite(views)) continue
        const prior = postsById.get(id)
        if (prior) postsById.set(id, { ...prior, views })
      }

      for (const [idRaw, val] of Object.entries(topics)) {
        const id = String(idRaw)
        if (!id || isTomb('topics', id)) continue
        if (typeof pendingViews.topics?.[id] === 'number') continue
        const views = Number(val)
        if (!Number.isFinite(views)) continue
        const prior = topicsById.get(id)
        if (prior) topicsById.set(id, { ...prior, views })
      }
    }
  }

  deletedTopics.forEach((id) => {
    topicsById.delete(id)
    for (const [pid, post] of postsById.entries()) {
      if (String(post.topicId) === id) postsById.delete(pid)
    }
  })
  deletedPosts.forEach((id) => postsById.delete(String(id)))

  const out = {
    ...prev,
    topics: Array.from(topicsById.values()).filter((t) => !isTomb('topics', t.id)),
    posts: Array.from(postsById.values()).filter((p) => !isTomb('posts', p.id)),
  }
  return dedupeForumSnapshot(out)
}
