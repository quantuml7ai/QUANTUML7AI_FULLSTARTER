// app/api/forum/mutate/route.js
import { json, bad, requireUserId } from '../_utils.js'
import {
  createTopic,
  createPost,
  incrementTopicViewsUnique,
  incrementPostViewsUnique,
  nextRev,
  pushChange,
  rebuildSnapshot,
  redis as redisDirect,
  K,
  getInt, 
  isBanned,
  safeParse, // ← добавили
  patchSnapshotPartial,
  incrUserLikesTotal,  
} from '../_db.js'
import { Redis } from '@upstash/redis'
import { bus } from '../_bus.js'
import crypto from 'node:crypto'

async function publishForumEvent(evt) {
  const payload = { ...evt, ts: Date.now() }
  try { bus.emit(payload) } catch {}
  try {
    const redis = Redis.fromEnv()
    await redis.publish('forum:events', JSON.stringify(payload))
  } catch (e) {
    console.warn('publishForumEvent failed', e?.message || e)
  }
}

const IMG_LINE_RE =
  /^(?:\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)|https?:\/\/[^\s]+?\.(?:webp|png|jpe?g|gif))(?:\?.*)?$/i
function textHasImages(s) {
  if (!s) return false
  const lines = String(s).split(/\r?\n/).map(x => x.trim())
  return lines.some(line => IMG_LINE_RE.test(line))
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const MAX_OPS_PER_BATCH = 25
const MAX_TITLE = 180
const MAX_TEXT  = 4000
const MAX_ICON  = 256
const topicCidKey = (cid) => `forum:cid:topic:${String(cid || '').trim()}`
function trimStr(v, max) {
  const s = String(v ?? '').trim()
  return s.length > max ? s.slice(0, max) : s
}

function validateOp(op) {
  if (!op || !op.type) throw new Error('missing_op_type')
  const t = op.type
  const p = op.payload || {}
  if (t === 'create_topic') {
    if (!p.title) throw new Error('missing_title')
  } else if (t === 'create_post') {
    if (!p.topicId && !p.topicCid) throw new Error('missing_topicId')
    if (!p.text)    throw new Error('missing_text')
  } else if (t === 'react') {
    if (!p.postId) throw new Error('missing_postId')
    if (!['like','dislike'].includes(p.kind)) throw new Error('bad_reaction_kind')
  } else if (t === 'set_reaction') {
    if (!p.postId) throw new Error('missing_postId')
    if (!['like','dislike',null].includes(p.state ?? null)) throw new Error('bad_reaction_state')
  } else if (t === 'view_topic' || t === 'view_post') {
    // ok
  } else if (t === 'view_topics' || t === 'view_posts') {
    if (!Array.isArray(p.ids) || !p.ids.length) throw new Error('missing_ids')    
  } else if (t === 'edit_post') {
    if (!p.id)   throw new Error('missing_postId')
    if (!p.text) throw new Error('missing_text')
  } else if (t === 'delete_post') {
    if (!p.id) throw new Error('missing_postId')
  } else if (t === 'delete_topic') {
    if (!p.id) throw new Error('missing_topicId')
  } else if (t === 'ban_user' || t === 'unban_user') {
    if (!p.userId) throw new Error('missing_userId')
  } else if (t === 'ban_ip' || t === 'unban_ip') {
    if (!p.ip) throw new Error('missing_ip')
  } else {
    throw new Error('unknown_op_type')
  }
}

// ===== helpers (K.* может быть строкой или функцией — поддерживаем оба варианта) =====
const postKey  = (id) => (K?.postKey ? K.postKey(id) : `forum:post:${id}`)
const topicKey = (id) => (K?.topicKey ? K.topicKey(id) : `forum:topic:${id}`)
const postsSetKey =
  (typeof K?.postsSet === 'function' ? K.postsSet()
   : (K?.postsSet || K?.POSTS_SET || 'forum:posts'))
const topicsSetKey =
  (typeof K?.topicsSet === 'function' ? K.topicsSet()
   : (K?.topicsSet || K?.TOPICS_SET || 'forum:topics'))
const topicPostsCountKey = (id) =>
  (K?.topicPostsCount ? K.topicPostsCount(id) : `forum:topic:${id}:posts_count`)

async function getPostObj(id) {
  try {
    const raw = await redisDirect.get(postKey(id))
    const obj = safeParse(raw) // ← фикс
    return obj || null
  } catch { return null }
}
async function getTopicObj(id) {
  try {
    const raw = await redisDirect.get(topicKey(id))
    const obj = safeParse(raw) // ← фикс
    return obj || null
  } catch { return null }
}
async function setPostReaction(postId, userId, state) {
  const pid = String(postId || '').trim()
  const uid = String(userId || '').trim()
  if (!pid || !uid) throw new Error('bad_react_args')

  const likeSet = typeof K?.postLikesSet === 'function' ? K.postLikesSet(pid) : `forum:post:${pid}:likes:set`
  const disSet  = typeof K?.postDislikesSet === 'function' ? K.postDislikesSet(pid) : `forum:post:${pid}:dislikes:set`
  const likeKey = typeof K?.postLikes === 'function' ? K.postLikes(pid) : `forum:post:${pid}:likes`
  const disKey  = typeof K?.postDislikes === 'function' ? K.postDislikes(pid) : `forum:post:${pid}:dislikes`

  const [hasLike, hasDis] = await Promise.all([
    redisDirect.sismember(likeSet, uid),
    redisDirect.sismember(disSet,  uid),
  ])
  const prev = hasLike ? 'like' : (hasDis ? 'dislike' : null)
  const next = (state === 'like' || state === 'dislike') ? state : null
  const likeDelta = (next === 'like' ? 1 : 0) - (prev === 'like' ? 1 : 0)
  if (prev === next) {
    const [likes, dislikes] = await Promise.all([ getInt(likeKey, 0), getInt(disKey, 0) ])
    return { state: next, likes, dislikes, changed: false, likeDelta: 0, authorId: null }
  }

  // 1) обновляем множества
  const pipe1 = redisDirect.multi()
  if (prev === 'like')    pipe1.srem(likeSet, uid)
  if (prev === 'dislike') pipe1.srem(disSet,  uid)
  if (next === 'like')    pipe1.sadd(likeSet, uid)
  if (next === 'dislike') pipe1.sadd(disSet,  uid)
  try { await pipe1.exec() } catch {}

  // 2) истина = SCARD
  let likes = 0, dislikes = 0
  try {
    const res = await redisDirect.multi().scard(likeSet).scard(disSet).exec()
    likes    = Number(res?.[0] ?? 0) || 0
    dislikes = Number(res?.[1] ?? 0) || 0
  } catch {
    const r = await Promise.allSettled([redisDirect.scard(likeSet), redisDirect.scard(disSet)])
    likes    = (r[0].status === 'fulfilled' ? Number(r[0].value) : 0) || 0
    dislikes = (r[1].status === 'fulfilled' ? Number(r[1].value) : 0) || 0
  }

  // 3) пишем кеш-числа
  try {
    await redisDirect.multi().set(likeKey, String(likes)).set(disKey, String(dislikes)).exec()
  } catch {}

  let authorId = null
  if (likeDelta) {
    const postObj = await getPostObj(pid)
    authorId = String(postObj?.userId || postObj?.accountId || '').trim() || null
  }

  return { state: next, likes, dislikes, changed: true, likeDelta, authorId }
}


async function delPostHard(id) {
  try { await redisDirect.srem(postsSetKey, String(id)) } catch {}
  const base = postKey(id)
  try {
    await Promise.allSettled([
      redisDirect.del(base),
      redisDirect.del(K?.postViews ? K.postViews(id) : `forum:post:${id}:views`),
      redisDirect.del(K?.postLikes ? K.postLikes(id) : `forum:post:${id}:likes`),
      redisDirect.del(K?.postDislikes ? K.postDislikes(id) : `forum:post:${id}:dislikes`),
      redisDirect.del(
        typeof K?.postLikesSet === 'function' ? K.postLikesSet(id) : (K?.postLikesSet || `post:${id}:likes:set`)
      ),
      redisDirect.del(
        typeof K?.postDislikesSet === 'function' ? K.postDislikesSet(id) : (K?.postDislikesSet || `post:${id}:dislikes:set`)
      ),
    ])
  } catch {}
}

async function decTopicPostsCount(topicId) {
  const key = topicPostsCountKey(topicId)
  try {
    const v = parseInt(await redisDirect.get(key), 10) || 0
    if (v > 0) await redisDirect.decr(key)
  } catch {}
}

// O(N) обход по всем постам — соответствует текущей схеме без индекса topic:{id}:posts
async function collectPostBranch(rootId) {
  const toDelete = new Set([String(rootId)])
  try {
    const all = await redisDirect.smembers(postsSetKey)
    let grow = true
    while (grow) {
      grow = false
      for (const pid of all || []) {
        if (toDelete.has(String(pid))) continue
        const po = await getPostObj(pid)
        if (po?.parentId && toDelete.has(String(po.parentId))) {
          toDelete.add(String(pid))
          grow = true
        }
      }
    }
  } catch {}
  return Array.from(toDelete)
}

// ===== анти-дубль без cid: авто-хеш (10 сек) =====
function sha1(s) {
  return crypto.createHash('sha1').update(String(s)).digest('hex')
}

function getClientIp(request) {
  const h = request.headers
  const xff = h.get('x-forwarded-for') || ''
  const ipFromXff = xff.split(',')[0]?.trim()
  return ipFromXff || h.get('x-real-ip') || ''
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const userIdRaw = requireUserId(request, body)
    const userId = String(userIdRaw || '').trim()

    // 🚫 мгновенные баны (по userId и IP)
    const ip = getClientIp(request)
    if (await isBanned(userId, ip)) {
      return bad('banned', 403)
    }

    const ops = Array.isArray(body.ops) ? body.ops : []
    if (!ops.length) return bad('missing_ops', 400)
    if (ops.length > MAX_OPS_PER_BATCH) return bad('too_many_ops', 413)

    const results = []
    const topicCidMap = new Map()
    for (const op of ops) {
      try {
        validateOp(op)
        const p = op.payload || {}

        if (op.type === 'create_topic') {
          const title       = trimStr(p.title, MAX_TITLE)
          const description = trimStr(p.description || '', MAX_TEXT)
          const nickname    = trimStr(p.nickname || '', 80)
          const icon        = trimStr(p.icon || '', MAX_ICON)

          // anti-dup (cid или авто)
          const cid = String(p.cid || '')
          if (cid) {
            try {
              const ok = await redisDirect.set(`forum:dedup:${cid}`, '1', { nx: true, ex: 60 })
              if (!ok) {
                let existingTopicId = ''
                try { existingTopicId = String(await redisDirect.get(topicCidKey(cid)) || '').trim() } catch {}
                if (existingTopicId) topicCidMap.set(cid, existingTopicId)
                results.push({ op: 'create_topic', duplicate: true, cid, topicId: existingTopicId || undefined, opId: op.opId })
                continue
              }
            } catch {}
          } else {
            const autoKey = `forum:dedup:auto:topic:${sha1(`${userId.toLowerCase()}|${title}|${description}`)}`
            try {
              const ok = await redisDirect.set(autoKey, '1', { nx: true, ex: 10 })
              if (!ok) { results.push({ op: 'create_topic', duplicate: true, auto: true, opId: op.opId }); continue }
            } catch {}
          }

          const { topic, rev } = await createTopic({
            title, description, userId, nickname, icon, ts: Date.now(),
          })
          const cidVal = String(p.cid || p.id || '')
          if (cidVal) {
            const mappedTopicId = String(topic?.id || '')
            topicCidMap.set(cidVal, mappedTopicId)
            try { await redisDirect.set(topicCidKey(cidVal), mappedTopicId, { ex: 86400 }) } catch {}
          }
          results.push({ op: 'create_topic', topic, rev, cid: cidVal || undefined, opId: op.opId })
          await publishForumEvent({ type: 'topic_created', topicId: topic?.id, title: topic?.title ?? '', rev })

        } else if (op.type === 'create_post') {
          const topicCid  = String(p.topicCid || '')
          let topicId     = String(p.topicId || topicCid || '')
          if (topicCidMap.has(topicId)) topicId = topicCidMap.get(topicId)
          else if (topicCid && topicCidMap.has(topicCid)) topicId = topicCidMap.get(topicCid)
          if ((!topicId || topicId.startsWith('tmp_t_')) && topicCid) {
            try {
              const fromCid = String(await redisDirect.get(topicCidKey(topicCid)) || '').trim()
              if (fromCid) {
                topicId = fromCid
                topicCidMap.set(topicCid, fromCid)
              }
            } catch {}
          }
          if (!topicId || topicId.startsWith('tmp_t_')) {
            results.push({ op: 'create_post', error: 'missing_topicId', opId: op.opId })
            continue
          }
          const parentId  = p.parentId ?? null
          const text      = trimStr(p.text, MAX_TEXT)
          const nickname  = trimStr(p.nickname || '', 80)
          const icon      = trimStr(p.icon || '', MAX_ICON)

          // anti-dup (cid или авто)
          const cid = String(p.cid || '')
          if (cid) {
            try {
              const ok = await redisDirect.set(`forum:dedup:${cid}`, '1', { nx: true, ex: 60 })
              if (!ok) { results.push({ op: 'create_post', duplicate: true, auto: true, opId: op.opId }); continue }
            } catch {}
          } else {
            const autoKey = `forum:dedup:auto:post:${sha1(`${userId.toLowerCase()}|${topicId}|${text}`)}`
            try {
              const ok = await redisDirect.set(autoKey, '1', { nx: true, ex: 10 })
              if (!ok) { results.push({ op: 'create_post', duplicate: true, auto: true, opId: op.opId }); continue }
            } catch {}
          }

          const { post, rev } = await createPost({
            topicId, parentId, text, userId, nickname, icon, ts: Date.now(),
          })
          const postCid = String(p.cid || p.id || '')
          results.push({ op: 'create_post', post, rev, cid: postCid || undefined, opId: op.opId })

          const hasImages = textHasImages?.(text) === true
          await publishForumEvent({
            type: 'post_created',
            topicId,
            postId: post?.id,
            parentId: parentId || null,
            hasImages,
            rev,
          })

        } else if (op.type === 'view_topic') {
          const { topicId } = p
          const { inc, views } = await incrementTopicViewsUnique(topicId, userId)
          if (inc) {
            const rev = await nextRev()
            await pushChange({ rev, kind: 'views', topics: { [String(topicId)]: views }, ts: Date.now() })
            results.push({ op: 'view_topic', topicId, views, delta: 1, rev, opId: op.opId })
            await publishForumEvent({ type: 'view_topic', topicId, views, rev })
          } else {
            results.push({ op: 'view_topic', topicId, views, delta: 0, opId: op.opId })
          }

        } else if (op.type === 'view_post') {
          const { postId } = p
          const { inc, views } = await incrementPostViewsUnique(postId, userId)
          if (inc) {
            const rev = await nextRev()
await pushChange({ rev, kind: 'views', posts: { [String(postId)]: views }, ts: Date.now() })

// ✅ точечно обновим full snapshot, без rebuild
try {
  await patchSnapshotPartial({ rev, patch: { posts: { [String(postId)]: { views } } } })
} catch {}

            results.push({ op: 'view_post', postId, views, delta: 1, rev, opId: op.opId })
            await publishForumEvent({ type: 'view_post', postId, views, rev })
          } else {
            results.push({ op: 'view_post', postId, views, delta: 0, opId: op.opId })
          }

        } else if (op.type === 'view_topics') {
          const ids = Array.from(new Set((Array.isArray(p.ids) ? p.ids : []).map(String).filter(Boolean)))
          const viewsMap = {}
          let changed = false
          for (const id of ids) {
            const { inc, views } = await incrementTopicViewsUnique(id, userId)
            viewsMap[id] = views
            if (inc) changed = true
          }
          if (changed) {
            const rev = await nextRev()
            await pushChange({ rev, kind: 'views', topics: viewsMap, ts: Date.now() })
            results.push({ op: 'view_topics', ids, views: viewsMap, rev, opId: op.opId })
            await publishForumEvent({ type: 'view_topics', ids, views: viewsMap, rev })
          } else {
            results.push({ op: 'view_topics', ids, views: viewsMap, delta: 0, opId: op.opId })
          }

        } else if (op.type === 'view_posts') {
          const ids = Array.from(new Set((Array.isArray(p.ids) ? p.ids : []).map(String).filter(Boolean)))
          const viewsMap = {}
          let changed = false
          for (const id of ids) {
            const { inc, views } = await incrementPostViewsUnique(id, userId)
            viewsMap[id] = views
            if (inc) changed = true
          }
          if (changed) {
            const rev = await nextRev()
            await pushChange({ rev, kind: 'views', posts: viewsMap, ts: Date.now() })
            results.push({ op: 'view_posts', ids, views: viewsMap, rev, opId: op.opId })
            await publishForumEvent({ type: 'view_posts', ids, views: viewsMap, rev })
          } else {
            results.push({ op: 'view_posts', ids, views: viewsMap, delta: 0, opId: op.opId })
          }

        } else if (op.type === 'set_reaction') {
          const { postId, state } = p
          const r = await setPostReaction(postId, userId, state ?? null)
          if (r?.changed) {
            if (r.likeDelta && r.authorId) {
              try { await incrUserLikesTotal(r.authorId, r.likeDelta) } catch {}
            }            
            const rev = await nextRev()
            await pushChange({ rev, kind: 'post', id: String(postId), data: { likes: r.likes, dislikes: r.dislikes }, ts: Date.now() })

// ✅ точечно обновим full snapshot, без rebuild
try {
  await patchSnapshotPartial({
    rev,
    patch: { posts: { [String(postId)]: { likes: r.likes, dislikes: r.dislikes } } }
  })
} catch {}

            results.push({ op: 'set_reaction', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, changed: true, rev, opId: op.opId })
            await publishForumEvent({ type: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, rev })
          } else {
            results.push({ op: 'set_reaction', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, changed: false, opId: op.opId })
          }
        } else if (op.type === 'react') {
          const { postId, kind } = p
          const r = await setPostReaction(postId, userId, kind)
          if (r?.changed) {
            if (r.likeDelta && r.authorId) {
              try { await incrUserLikesTotal(r.authorId, r.likeDelta) } catch {}
            }            
            const rev = r?.rev ?? await nextRev()
            await pushChange({ rev, kind: 'post', id: String(postId), data: { likes: r.likes, dislikes: r.dislikes }, ts: Date.now() })

// ✅ точечно обновим full snapshot, без rebuild
try {
  await patchSnapshotPartial({
    rev,
    patch: { posts: { [String(postId)]: { likes: r.likes, dislikes: r.dislikes } } }
  })
} catch {}

            results.push({ op: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, changed: true, rev, opId: op.opId })
            await publishForumEvent({ type: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, rev })
          } else {
            results.push({ op: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, changed: false, opId: op.opId })
          }
        } else if (op.type === 'edit_post') {
          const postId = String(p.id)
          const newText = trimStr(p.text, MAX_TEXT)
          const po = await getPostObj(postId)
          if (!po) {
            results.push({ op: 'edit_post', error: 'not_found', opId: op.opId })
          } else {
            po.text = newText
            po.tsEdited = Date.now()
            await redisDirect.set(postKey(postId), JSON.stringify(po))
            const rev = await nextRev()
            await pushChange({ rev, kind: 'post_edit', id: postId, data: { text: newText }, ts: Date.now() })
            results.push({ op: 'edit_post', postId, text: newText, rev, opId: op.opId })
            await publishForumEvent({ type: 'post_edited', postId, rev })
          }

        } else if (op.type === 'delete_post') {
          const postId = String(p.id)
          const po = await getPostObj(postId)
          if (!po) {
            results.push({ op: 'delete_post', duplicate: true, opId: op.opId })
          } else {
            const branch = await collectPostBranch(postId)
            for (const pid of branch) {
              const pObj = (pid === String(postId)) ? po : await getPostObj(pid)
              await delPostHard(pid)
              if (pObj?.topicId) await decTopicPostsCount(pObj.topicId)
            }
            const rev = await nextRev()
            await pushChange({ rev, kind: 'post',         id: postId, _del: 1, deleted: branch, ts: Date.now() })
            await pushChange({ rev, kind: 'post_deleted', id: postId,        deleted: branch, ts: Date.now() })
            results.push({ op: 'delete_post', postId, deleted: branch, rev, opId: op.opId })
            await publishForumEvent({ type: 'post_deleted', postId, deleted: branch, rev })
          }

        } else if (op.type === 'delete_topic') {
          const topicId = String(p.id)
          const to = await getTopicObj(topicId)
          if (!to) {
            results.push({ op: 'delete_topic', duplicate: true, opId: op.opId })
          } else {
            let affected = []
            try {
              const all = await redisDirect.smembers(postsSetKey)
              for (const pid of all || []) {
                const po = await getPostObj(pid)
                if (po?.topicId && String(po.topicId) === topicId) {
                  affected.push(String(pid))
                }
              }
            } catch {}
            for (const pid of affected) {
              await delPostHard(pid)
            }
            try { await redisDirect.srem(topicsSetKey, topicId) } catch {}
            try {
              await Promise.allSettled([
                redisDirect.del(topicKey(topicId)),
                redisDirect.del(K?.topicViews ? K.topicViews(topicId) : `forum:topic:${topicId}:views`),
                redisDirect.del(topicPostsCountKey(topicId)),
              ])
            } catch {}
            const rev = await nextRev()
            await pushChange({ rev, kind: 'topic',         id: topicId, _del: 1, deletedPosts: affected, ts: Date.now() })
            await pushChange({ rev, kind: 'topic_deleted', id: topicId,        deletedPosts: affected, ts: Date.now() })
            results.push({ op: 'delete_topic', topicId, removedPosts: affected.length, rev, opId: op.opId })
            await publishForumEvent({ type: 'topic_deleted', topicId, removedPosts: affected.length, rev })
          }

        } else if (op.type === 'ban_user') {
          const targetRaw = String(p.userId || '').trim()
          const targetLc  = targetRaw.toLowerCase()
          if (!targetLc) throw new Error('missing_userId')

          await redisDirect.sadd(K.bannedSet, targetLc)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'ban_user', id: targetLc, data: { userId: targetLc }, ts: Date.now() })
          results.push({ op: 'ban_user', userId: targetRaw, rev, opId: op.opId })
          await publishForumEvent({ type: 'ban_user', userId: targetLc, rev })

        } else if (op.type === 'unban_user') {
          const targetRaw = String(p.userId || '').trim()
          const targetLc  = targetRaw.toLowerCase()
          if (!targetLc) throw new Error('missing_userId')

          await redisDirect.srem(K.bannedSet, targetLc)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'unban_user', id: targetLc, data: { userId: targetLc }, ts: Date.now() })
          results.push({ op: 'unban_user', userId: targetRaw, rev, opId: op.opId })
          await publishForumEvent({ type: 'unban_user', userId: targetLc, rev })

        } else if (op.type === 'ban_ip') {
          const ipVal = String(p.ip || '').trim().toLowerCase()
          if (!ipVal) throw new Error('missing_ip')
          await redisDirect.sadd(K.bannedIpsSet || 'forum:banned:ips', ipVal)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'ban_ip', id: ipVal, data: { ip: ipVal }, ts: Date.now() })
          results.push({ op: 'ban_ip', ip: ipVal, rev, opId: op.opId })
          await publishForumEvent({ type: 'ban_ip', ip: ipVal, rev })

        } else if (op.type === 'unban_ip') {
          const ipVal = String(p.ip || '').trim().toLowerCase()
          if (!ipVal) throw new Error('missing_ip')
          await redisDirect.srem(K.bannedIpsSet || 'forum:banned:ips', ipVal)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'unban_ip', id: ipVal, data: { ip: ipVal }, ts: Date.now() })
          results.push({ op: 'unban_ip', ip: ipVal, rev, opId: op.opId })
          await publishForumEvent({ type: 'unban_ip', ip: ipVal, rev })

        } else {
          results.push({ op: op.type, error: 'unknown_op_type', opId: op.opId })
        }
      } catch (e) {
        results.push({ op: op?.type || 'unknown', error: String(e?.message || e || 'error'), opId: op?.opId })
      }
    }
    // Пересборка снапшота — ТОЛЬКО когда меняются данные форума,
    // а не на "шум" (просмотры).
const SNAPSHOT_REBUILD_OPS = new Set([
  'create_topic',
  'create_post',
  'edit_post',
  'delete_post',
  'delete_topic',
  'ban_user',
  'unban_user',
  'ban_ip',
  'unban_ip',
 
])

    const needRebuild = results.some(r => !r?.error && SNAPSHOT_REBUILD_OPS.has(String(r?.op || '')))

    if (needRebuild) {
      await rebuildSnapshot()
      try { await redisDirect.ltrim("forum:changes", -50000, -1) } catch (e) {
        console.error("failed to trim changes log", e)
      }
    }

    return json({ applied: results })
  } catch (err) {
    console.error('mutate error', err)
    return bad(err.message || 'internal_error', 500)
  }
}
