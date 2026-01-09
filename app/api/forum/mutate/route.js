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
  getBannedUsers,
  reactPostExclusiveDaily,
  isBanned,
  safeParse, // ← добавили
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

const VIDEO_URL_RE =
  /(https?:\/\/[^\s<>'")]+?\.(?:mp4|webm|mov|m4v|mkv)(?:[?#][^\s<>'")]+)?)/i
const VIDEO_HINT_RE =
  /(vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo)/i
function textHasVideo(s) {
  const str = String(s || '')
  if (!str) return false
  return VIDEO_URL_RE.test(str) || VIDEO_HINT_RE.test(str)
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const MAX_OPS_PER_BATCH = 25
const MAX_TITLE = 180
const MAX_TEXT  = 4000

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
    if (!p.topicId) throw new Error('missing_topicId')
    if (!p.text)    throw new Error('missing_text')
  } else if (t === 'react') {
    if (!p.postId) throw new Error('missing_postId')
    if (!['like','dislike'].includes(p.kind)) throw new Error('bad_reaction_kind')
  } else if (t === 'view_topic' || t === 'view_post') {
    // ok
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
async function removePostIndexes(po) {
  if (!po) return
  const pid = String(po.id || '')
  const tid = String(po.topicId || '')
  if (!pid || !tid) return
  try { await redisDirect.zrem(K.zTopicAll(tid), pid) } catch {}
  if (po.parentId) {
    try { await redisDirect.zrem(K.zParentReplies(String(po.parentId)), pid) } catch {}
    try {
      const parent = await getPostObj(String(po.parentId))
      const parentAuthorId = String(parent?.userId || parent?.accountId || '')
      if (parentAuthorId) {
        await redisDirect.zrem(K.zInbox(parentAuthorId), pid)
      }
    } catch {}
  } else {
    try { await redisDirect.zrem(K.zTopicRoots(tid), pid) } catch {}
  }
  if (textHasVideo(po.text)) {
    try { await redisDirect.zrem(K.zVideoFeed, pid) } catch {}
  }
  try {
    const [views, likes, dislikes] = await Promise.all([
      redisDirect.get(K.postViews(pid)),
      redisDirect.get(K.postLikes(pid)),
      redisDirect.get(K.postDislikes(pid)),
    ])
    const v = parseInt(views, 10) || 0
    const l = parseInt(likes, 10) || 0
    const d = parseInt(dislikes, 10) || 0
    if (v) await redisDirect.decrby(K.topicViewsTotal(tid), v)
    if (l) await redisDirect.decrby(K.topicLikes(tid), l)
    if (d) await redisDirect.decrby(K.topicDislikes(tid), d)
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

    for (const op of ops) {
      try {
        validateOp(op)
        const p = op.payload || {}

        if (op.type === 'create_topic') {
          const title       = trimStr(p.title, MAX_TITLE)
          const description = trimStr(p.description || '', MAX_TEXT)
          const nickname    = trimStr(p.nickname || '', 80)
          const icon        = trimStr(p.icon || '', 32)

          // anti-dup (cid или авто)
          const cid = String(p.cid || '')
          if (cid) {
            try {
              const ok = await redisDirect.set(`forum:dedup:${cid}`, '1', { nx: true, ex: 60 })
              if (!ok) { results.push({ op: 'create_topic', duplicate: true, cid }); continue }
            } catch {}
          } else {
            const autoKey = `forum:dedup:auto:topic:${sha1(`${userId.toLowerCase()}|${title}|${description}`)}`
            try {
              const ok = await redisDirect.set(autoKey, '1', { nx: true, ex: 10 })
              if (!ok) { results.push({ op: 'create_topic', duplicate: true, auto: true }); continue }
            } catch {}
          }

          const { topic, rev } = await createTopic({
            title, description, userId, nickname, icon, ts: Date.now(),
          })
          results.push({ op: 'create_topic', topic, rev })
          await publishForumEvent({ type: 'topic_created', topicId: topic?.id, title: topic?.title ?? '', rev })

        } else if (op.type === 'create_post') {
          const topicId   = p.topicId
          const parentId  = p.parentId ?? null
          const text      = trimStr(p.text, MAX_TEXT)
          const nickname  = trimStr(p.nickname || '', 80)
          const icon      = trimStr(p.icon || '', 32)

          // anti-dup (cid или авто)
          const cid = String(p.cid || '')
          if (cid) {
            try {
              const ok = await redisDirect.set(`forum:dedup:${cid}`, '1', { nx: true, ex: 60 })
              if (!ok) { results.push({ op: 'create_post', duplicate: true, cid }); continue }
            } catch {}
          } else {
            const autoKey = `forum:dedup:auto:post:${sha1(`${userId.toLowerCase()}|${topicId}|${text}`)}`
            try {
              const ok = await redisDirect.set(autoKey, '1', { nx: true, ex: 10 })
              if (!ok) { results.push({ op: 'create_post', duplicate: true, auto: true }); continue }
            } catch {}
          }

          const { post, rev } = await createPost({
            topicId, parentId, text, userId, nickname, icon, ts: Date.now(),
          })
          results.push({ op: 'create_post', post, rev })

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
          const rev = await nextRev()
          await pushChange({ rev, kind: 'topic', id: String(topicId), data: { views }, ts: Date.now() })
          results.push({ op: 'view_topic', topicId, views, delta: inc ? 1 : 0, rev })
          await publishForumEvent({ type: 'view_topic', topicId, views, rev })

        } else if (op.type === 'view_post') {
          const { postId } = p
          const { inc, views } = await incrementPostViewsUnique(postId, userId)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'post', id: String(postId), data: { views }, ts: Date.now() })
          results.push({ op: 'view_post', postId, views, delta: inc ? 1 : 0, rev })
          await publishForumEvent({ type: 'view_post', postId, views, rev })

        } else if (op.type === 'react') {
          const { postId, kind } = p
          const r = await reactPostExclusiveDaily(postId, userId, kind)
          const rev = r?.rev ?? await nextRev()
          await pushChange({ rev, kind: 'post', id: String(postId), data: { likes: r.likes, dislikes: r.dislikes }, ts: Date.now() })
          results.push({ op: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, changed: !!r.changed, rev })
          await publishForumEvent({ type: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, rev })

        } else if (op.type === 'edit_post') {
          const postId = String(p.id)
          const newText = trimStr(p.text, MAX_TEXT)
          const po = await getPostObj(postId)
          if (!po) {
            results.push({ op: 'edit_post', error: 'not_found' })
          } else {
            po.text = newText
            po.tsEdited = Date.now()
            await redisDirect.set(postKey(postId), JSON.stringify(po))
            const rev = await nextRev()
            await pushChange({ rev, kind: 'post_edit', id: postId, data: { text: newText }, ts: Date.now() })
            results.push({ op: 'edit_post', postId, rev })
            await publishForumEvent({ type: 'post_edited', postId, rev })
          }

        } else if (op.type === 'delete_post') {
          const postId = String(p.id)
          const po = await getPostObj(postId)
          if (!po) {
            results.push({ op: 'delete_post', duplicate: true })
          } else {
            const branch = await collectPostBranch(postId)
            for (const pid of branch) {
              const pObj = (pid === String(postId)) ? po : await getPostObj(pid)
             await removePostIndexes(pObj)
              await delPostHard(pid)
              if (pObj?.topicId) await decTopicPostsCount(pObj.topicId)
            }
            const rev = await nextRev()
            await pushChange({ rev, kind: 'post',         id: postId, _del: 1, deleted: branch, ts: Date.now() })
            await pushChange({ rev, kind: 'post_deleted', id: postId,        deleted: branch, ts: Date.now() })
            results.push({ op: 'delete_post', postId, deleted: branch, rev })
            await publishForumEvent({ type: 'post_deleted', postId, deleted: branch, rev })
          }

        } else if (op.type === 'delete_topic') {
          const topicId = String(p.id)
          const to = await getTopicObj(topicId)
          if (!to) {
            results.push({ op: 'delete_topic', duplicate: true })
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
             const pObj = await getPostObj(pid)
              await removePostIndexes(pObj)

              await delPostHard(pid)
            }
            try { await redisDirect.srem(topicsSetKey, topicId) } catch {}
            try {
              await Promise.allSettled([
                redisDirect.del(topicKey(topicId)),
                redisDirect.del(K?.topicViews ? K.topicViews(topicId) : `forum:topic:${topicId}:views`),
                redisDirect.del(K?.topicLikes ? K.topicLikes(topicId) : `forum:topic:${topicId}:likes`),
                redisDirect.del(K?.topicDislikes ? K.topicDislikes(topicId) : `forum:topic:${topicId}:dislikes`),
                redisDirect.del(K?.topicViewsTotal ? K.topicViewsTotal(topicId) : `forum:topic:${topicId}:views_total`),
                redisDirect.del(topicPostsCountKey(topicId)),
                redisDirect.zrem(K?.zTopics || 'forum:z:topics', topicId),
                redisDirect.del(K?.zTopicRoots ? K.zTopicRoots(topicId) : `forum:z:topic:${topicId}:roots`),
                redisDirect.del(K?.zTopicAll ? K.zTopicAll(topicId) : `forum:z:topic:${topicId}:all`),
              ])
            } catch {}
            const rev = await nextRev()
            await pushChange({ rev, kind: 'topic',         id: topicId, _del: 1, deletedPosts: affected, ts: Date.now() })
            await pushChange({ rev, kind: 'topic_deleted', id: topicId,        deletedPosts: affected, ts: Date.now() })
            results.push({ op: 'delete_topic', topicId, removedPosts: affected.length, rev })
            await publishForumEvent({ type: 'topic_deleted', topicId, removedPosts: affected.length, rev })
          }

        } else if (op.type === 'ban_user') {
          const targetRaw = String(p.userId || '').trim()
          const targetLc  = targetRaw.toLowerCase()
          if (!targetLc) throw new Error('missing_userId')

          await redisDirect.sadd(K.bannedSet, targetLc)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'ban_user', id: targetLc, data: { userId: targetLc }, ts: Date.now() })
          results.push({ op: 'ban_user', userId: targetRaw, rev })
          await publishForumEvent({ type: 'ban_user', userId: targetLc, rev })

        } else if (op.type === 'unban_user') {
          const targetRaw = String(p.userId || '').trim()
          const targetLc  = targetRaw.toLowerCase()
          if (!targetLc) throw new Error('missing_userId')

          await redisDirect.srem(K.bannedSet, targetLc)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'unban_user', id: targetLc, data: { userId: targetLc }, ts: Date.now() })
          results.push({ op: 'unban_user', userId: targetRaw, rev })
          await publishForumEvent({ type: 'unban_user', userId: targetLc, rev })

        } else if (op.type === 'ban_ip') {
          const ipVal = String(p.ip || '').trim().toLowerCase()
          if (!ipVal) throw new Error('missing_ip')
          await redisDirect.sadd(K.bannedIpsSet || 'forum:banned:ips', ipVal)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'ban_ip', id: ipVal, data: { ip: ipVal }, ts: Date.now() })
          results.push({ op: 'ban_ip', ip: ipVal, rev })
          await publishForumEvent({ type: 'ban_ip', ip: ipVal, rev })

        } else if (op.type === 'unban_ip') {
          const ipVal = String(p.ip || '').trim().toLowerCase()
          if (!ipVal) throw new Error('missing_ip')
          await redisDirect.srem(K.bannedIpsSet || 'forum:banned:ips', ipVal)
          const rev = await nextRev()
          await pushChange({ rev, kind: 'unban_ip', id: ipVal, data: { ip: ipVal }, ts: Date.now() })
          results.push({ op: 'unban_ip', ip: ipVal, rev })
          await publishForumEvent({ type: 'unban_ip', ip: ipVal, rev })

        } else {
          results.push({ op: op.type, error: 'unknown_op_type' })
        }
      } catch (e) {
        results.push({ op: op?.type || 'unknown', error: String(e?.message || e || 'error') })
      }
    }

    if (results.some(r => !r.error)) {
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
