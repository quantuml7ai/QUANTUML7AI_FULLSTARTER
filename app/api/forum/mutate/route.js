
import { json, bad, requireUserId } from '../_utils.js'
import {
  createTopic,
  createPost,
  dbBanIp,
  dbBanUser,
  dbDeleteTopicHard,
  dbUnbanIp,
  dbUnbanUser,
  incrementTopicViewsUnique,
  incrementPostViewsUnique,
  nextRev,
  pushChange,
  rebuildSnapshot,
  redis as redisDirect,
  isBanned,
  patchSnapshotPartial,
  incrUserLikesTotal,  
} from '../_db.js'
import forumPrimary from '../../../../lib/mongo/forum-primary.cjs'
import { resolveRequestGeo } from '../../../../lib/geo/request-geo.cjs'
import forumIndexMaintenance from '../../../../lib/forum/forum-index-maintenance.cjs'
import { Redis } from '@upstash/redis'
import { bus } from '../_bus.js'
import crypto from 'node:crypto'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
import { sendBackgroundPush } from '../../../../lib/webPush.js'

const isForumSseEnabled = () => {
  const hardDisabled = String(process.env.FORUM_SSE_HARD_DISABLED ?? '1').trim() !== '0'
  if (hardDisabled) return false

  return String(process.env.FORUM_SSE_ENABLED || '').trim() === '1'
}

async function publishForumEvent(evt) {
  if (!isForumSseEnabled()) return

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

const isForumViewRealtimeEnabled = () => (
  String(process.env.FORUM_VIEW_REALTIME_ENABLED || '').trim() === '1'
)

const topicCidKey = (cid) => `forum:cid:topic:${String(cid || '').trim()}`
const postCidKey = (cid) => `forum:cid:post:${String(cid || '').trim()}`
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

async function getPostObj(id) {
  const pid = String(id || '').trim()
  if (!pid) return null
  return forumPrimary.getPost(pid)
}

async function getTopicObj(id) {
  const tid = String(id || '').trim()
  if (!tid) return null
  return forumPrimary.getTopic(tid)
}

async function maintainProjectionUserLikes(authorId, delta) {
  const aid = String(authorId || '').trim()
  const n = Number(delta || 0)
  if (!aid || !Number.isFinite(n) || !n) return
  try {
    await forumIndexMaintenance.maintainForumUserStatsCountersChanged({ canonicalAuthorId: aid, likesDelta: n })
  } catch (e) {
    console.warn('[QL7][forum-index] user stats like maintenance failed:', e?.message || e)
  }
}

async function maintainProjectionPostViewsMap(viewsMap = {}) {
  const entries = Object.entries(viewsMap || {}).filter(([id, views]) => String(id || '').trim() && Number.isFinite(Number(views)))
  if (!entries.length) return
  await Promise.all(entries.map(([id, views]) => forumIndexMaintenance.maintainForumIndexesForPostCountersChanged({ postId: id, views }).catch((e) => {
    console.warn('[QL7][forum-index] batch post views maintenance failed:', e?.message || e)
  })))
}

async function maintainProjectionTopicViewsMap(viewsMap = {}) {
  const entries = Object.entries(viewsMap || {}).filter(([id, views]) => String(id || '').trim() && Number.isFinite(Number(views)))
  if (!entries.length) return
  await Promise.all(entries.map(([id, views]) => forumIndexMaintenance.maintainForumIndexesForTopicCountersChanged({ topicId: id, views }).catch((e) => {
    console.warn('[QL7][forum-index] batch topic views maintenance failed:', e?.message || e)
  })))
}

async function setPostReaction(postId, userId, state) {
  const pid = String(postId || '').trim()
  const uid = String(userId || '').trim()
  if (!pid || !uid) throw new Error('bad_react_args')
  return forumPrimary.setPostReactionState({ postId: pid, userId: uid, state })
}

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
    let userId = String(userIdRaw || '').trim()
    try {
      userId = String((await resolveCanonicalAccountId(userId)) || userId || '').trim()
    } catch {}

    const requestGeo = resolveRequestGeo(request)
    const forumGeoOrigin = forumIndexMaintenance.buildForumGeoOriginForWrite({ geo: requestGeo, capturedAt: Date.now() })

    // рџљ« РјРіРЅРѕРІРµРЅРЅС‹Рµ Р±Р°РЅС‹ (РїРѕ userId Рё IP)
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

          // anti-dup (cid РёР»Рё Р°РІС‚Рѕ)
          const cid = String(p.cid || '')
          if (cid) {
            try {
              const ok = await redisDirect.set(`forum:dedup:${cid}`, '1', { nx: true, ex: 60 })
              if (!ok) {
                let existingTopicId = ''
                try { existingTopicId = String(await redisDirect.get(topicCidKey(cid)) || '').trim() } catch {}
                if (existingTopicId) topicCidMap.set(cid, existingTopicId)
                results.push(existingTopicId
                  ? { op: 'create_topic', duplicate: true, cid, topicId: existingTopicId, opId: op.opId }
                  : { op: 'create_topic', error: 'duplicate_unresolved', cid, opId: op.opId })
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
            title, description, userId, nickname, icon, ts: Date.now(), _geoOrigin: forumGeoOrigin,
          })
          const cidVal = String(p.cid || p.id || '')
          if (cidVal) {
            const mappedTopicId = String(topic?.id || '')
            topicCidMap.set(cidVal, mappedTopicId)
            try { await redisDirect.set(topicCidKey(cidVal), mappedTopicId, { ex: 86400 }) } catch {}
          }
          try {
            await forumIndexMaintenance.maintainForumIndexesForTopicCreated({ topic, canonicalAuthorId: userId, geoOrigin: forumGeoOrigin })
          } catch (e) { console.warn('[QL7][forum-index] topic maintenance failed:', e?.message || e) }
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

          // anti-dup (cid РёР»Рё Р°РІС‚Рѕ)
          const cid = String(p.cid || '')
          if (cid) {
            try {
              const ok = await redisDirect.set(`forum:dedup:${cid}`, '1', { nx: true, ex: 60 })
              if (!ok) {
                let existingPostId = ''
                try { existingPostId = String(await redisDirect.get(postCidKey(cid)) || '').trim() } catch {}
                const existingPost = existingPostId ? await getPostObj(existingPostId) : null
                results.push(existingPostId
                  ? { op: 'create_post', duplicate: true, cid, postId: existingPostId, post: existingPost || undefined, opId: op.opId }
                  : { op: 'create_post', error: 'duplicate_unresolved', cid, opId: op.opId })
                continue
              }
            } catch {}
          } else {
            const autoKey = `forum:dedup:auto:post:${sha1(`${userId.toLowerCase()}|${topicId}|${text}`)}`
            try {
              const ok = await redisDirect.set(autoKey, '1', { nx: true, ex: 10 })
              if (!ok) { results.push({ op: 'create_post', duplicate: true, auto: true, opId: op.opId }); continue }
            } catch {}
          }

          const { post, rev } = await createPost({
            topicId, parentId, text, userId, nickname, icon, ts: Date.now(), _geoOrigin: forumGeoOrigin,
          })
          const postCid = String(p.cid || p.id || '')
          if (postCid) {
            try { await redisDirect.set(postCidKey(postCid), String(post?.id || ''), { ex: 86400 }) } catch {}
          }
          try {
            const topicForIndex = await getTopicObj(topicId)
            await forumIndexMaintenance.maintainForumIndexesForPostCreated({ post, topic: topicForIndex, canonicalAuthorId: userId, geoOrigin: forumGeoOrigin })
          } catch (e) { console.warn('[QL7][forum-index] post maintenance failed:', e?.message || e) }
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
          if (parentId) {
            try {
              const parent = await getPostObj(parentId)
              const rawRecipient = String(parent?.userId || parent?.accountId || '').trim()
              const recipient = rawRecipient
                ? String((await resolveCanonicalAccountId(rawRecipient)) || rawRecipient).trim()
                : ''
              if (recipient && recipient !== userId) {
                await sendBackgroundPush(recipient, {
                  source: 'messenger_replies',
                  minAlertIntervalSeconds: 60,
                  dedupeKey: `reply:${String(post?.id || p?.cid || op?.opId || '')}`,
                  itemId: String(post?.id || ''),
                })
              }
            } catch {}
          }

        } else if (op.type === 'view_topic') {
          const { topicId } = p
          const { inc, views } = await incrementTopicViewsUnique(topicId, userId)
          if (inc) {
            const rev = await nextRev()
            await pushChange({ rev, kind: 'views', topics: { [String(topicId)]: views }, ts: Date.now() })
            try {
              await patchSnapshotPartial({ rev, patch: { topics: { [String(topicId)]: { views } } } })
            } catch {}
            try { await forumIndexMaintenance.maintainForumIndexesForTopicCountersChanged({ topicId, views }) } catch (e) { console.warn('[QL7][forum-index] topic views maintenance failed:', e?.message || e) }
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

// вњ… С‚РѕС‡РµС‡РЅРѕ РѕР±РЅРѕРІРёРј full snapshot, Р±РµР· rebuild
try {
  await patchSnapshotPartial({ rev, patch: { posts: { [String(postId)]: { views } } } })
} catch {}

            try { await forumIndexMaintenance.maintainForumIndexesForPostCountersChanged({ postId, views }) } catch (e) { console.warn('[QL7][forum-index] post views maintenance failed:', e?.message || e) }
            results.push({ op: 'view_post', postId, views, delta: 1, rev, opId: op.opId })
            await publishForumEvent({ type: 'view_post', postId, views, rev })
          } else {
            results.push({ op: 'view_post', postId, views, delta: 0, opId: op.opId })
          }

        } else if (op.type === 'view_topics') {
          const ids = Array.from(new Set((Array.isArray(p.ids) ? p.ids : []).map(String).filter(Boolean)))
          const viewsMap = {}
          const snapshotTopicPatch = {}
          let changed = false
          for (const id of ids) {
            const { inc, views } = await incrementTopicViewsUnique(id, userId)
            viewsMap[id] = views
            if (Number.isFinite(Number(views))) {
              snapshotTopicPatch[id] = { views: Number(views) }
            }
            if (inc) changed = true
          }
          if (changed) await maintainProjectionTopicViewsMap(viewsMap)
if (changed && isForumViewRealtimeEnabled()) {
  const rev = await nextRev()
  await pushChange({ rev, kind: 'views', topics: viewsMap, ts: Date.now() })

  try {
    if (Object.keys(snapshotTopicPatch).length) {
      await patchSnapshotPartial({ rev, patch: { topics: snapshotTopicPatch } })
    }
  } catch {}

  results.push({ op: 'view_topics', ids, views: viewsMap, rev, opId: op.opId })
  await publishForumEvent({ type: 'view_topics', ids, views: viewsMap, rev })
} else {
  results.push({
    op: 'view_topics',
    ids,
    views: viewsMap,
    delta: changed ? 1 : 0,
    realtime: false,
    opId: op.opId,
  })
}

        } else if (op.type === 'view_posts') {
          const ids = Array.from(new Set((Array.isArray(p.ids) ? p.ids : []).map(String).filter(Boolean)))
          const viewsMap = {}
          const snapshotPostPatch = {}
          let changed = false
          for (const id of ids) {
            const { inc, views } = await incrementPostViewsUnique(id, userId)
            viewsMap[id] = views
            if (Number.isFinite(Number(views))) {
              snapshotPostPatch[id] = { views: Number(views) }
            }
            if (inc) changed = true
          }
          if (changed) await maintainProjectionPostViewsMap(viewsMap)
if (changed && isForumViewRealtimeEnabled()) {
  const rev = await nextRev()
  await pushChange({ rev, kind: 'views', posts: viewsMap, ts: Date.now() })

  try {
    if (Object.keys(snapshotPostPatch).length) {
      await patchSnapshotPartial({ rev, patch: { posts: snapshotPostPatch } })
    }
  } catch {}

  results.push({ op: 'view_posts', ids, views: viewsMap, rev, opId: op.opId })
  await publishForumEvent({ type: 'view_posts', ids, views: viewsMap, rev })
} else {
  results.push({
    op: 'view_posts',
    ids,
    views: viewsMap,
    delta: changed ? 1 : 0,
    realtime: false,
    opId: op.opId,
  })
}

        } else if (op.type === 'set_reaction') {
          const { postId, state } = p
          const r = await setPostReaction(postId, userId, state ?? null)
          if (r?.changed) {
            if (r.likeDelta && r.authorId) {
              try { await incrUserLikesTotal(r.authorId, r.likeDelta) } catch {}
              await maintainProjectionUserLikes(r.authorId, r.likeDelta)
            }            
            const rev = await nextRev()
            await pushChange({ rev, kind: 'post', id: String(postId), data: { likes: r.likes, dislikes: r.dislikes }, ts: Date.now() })

// вњ… С‚РѕС‡РµС‡РЅРѕ РѕР±РЅРѕРІРёРј full snapshot, Р±РµР· rebuild
try {
  await patchSnapshotPartial({
    rev,
    patch: { posts: { [String(postId)]: { likes: r.likes, dislikes: r.dislikes } } }
  })
} catch {}

            try { await forumIndexMaintenance.maintainForumIndexesForPostCountersChanged({ postId, likes: r.likes, dislikes: r.dislikes }) } catch (e) { console.warn('[QL7][forum-index] set_reaction maintenance failed:', e?.message || e) }
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
              await maintainProjectionUserLikes(r.authorId, r.likeDelta)
            }            
            const rev = r?.rev ?? await nextRev()
            await pushChange({ rev, kind: 'post', id: String(postId), data: { likes: r.likes, dislikes: r.dislikes }, ts: Date.now() })

// вњ… С‚РѕС‡РµС‡РЅРѕ РѕР±РЅРѕРІРёРј full snapshot, Р±РµР· rebuild
try {
  await patchSnapshotPartial({
    rev,
    patch: { posts: { [String(postId)]: { likes: r.likes, dislikes: r.dislikes } } }
  })
} catch {}

            try { await forumIndexMaintenance.maintainForumIndexesForPostCountersChanged({ postId, likes: r.likes, dislikes: r.dislikes }) } catch (e) { console.warn('[QL7][forum-index] react maintenance failed:', e?.message || e) }
            results.push({ op: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, changed: true, rev, opId: op.opId })
            await publishForumEvent({ type: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, rev })
          } else {
            results.push({ op: 'react', postId, state: r.state, likes: r.likes, dislikes: r.dislikes, changed: false, opId: op.opId })
          }
        } else if (op.type === 'edit_post') {
          const postId = String(p.id)
          const newText = trimStr(p.text, MAX_TEXT)
          const updated = await forumPrimary.updatePostText(postId, newText)
          if (!updated?.post || !Number.isFinite(Number(updated?.rev))) {
            results.push({ op: 'edit_post', error: 'not_found', opId: op.opId })
          } else {
            try { await forumIndexMaintenance.maintainForumIndexesForPostEdited({ postId, text: newText }) } catch (e) { console.warn('[QL7][forum-index] edit maintenance failed:', e?.message || e) }
            results.push({ op: 'edit_post', postId, text: newText, rev: updated.rev, opId: op.opId })
            await publishForumEvent({ type: 'post_edited', postId, rev: updated.rev })
          }

        } else if (op.type === 'delete_post') {
          const postId = String(p.id)
          const result = await forumPrimary.deletePostBranchHard(postId)
          const branch = Array.isArray(result?.deletedPostIds)
            ? result.deletedPostIds.map(String)
            : (Array.isArray(result?.deleted) ? result.deleted.map(String) : [postId])
          const rev = Number(result?.rev || 0) || await nextRev()
          results.push({
            op: 'delete_post',
            postId,
            deleted: branch,
            deletedPostIds: branch,
            rev,
            duplicate: !!result?.alreadyDeleted,
            alreadyDeleted: !!result?.alreadyDeleted,
            opId: op.opId,
          })
          await publishForumEvent({ type: 'post_deleted', postId, deleted: branch, deletedPostIds: branch, rev })

        } else if (op.type === 'delete_topic') {
          const topicId = String(p.id)
          const to = await getTopicObj(topicId)
          if (!to) {
            results.push({ op: 'delete_topic', duplicate: true, opId: op.opId })
          } else {
            const result = await dbDeleteTopicHard(topicId)
            const removedPosts = Array.isArray(result?.deletedPosts) ? result.deletedPosts.length : 0
            const rev = Number(result?.rev || 0) || await nextRev()
            try { await forumIndexMaintenance.maintainForumIndexesForTopicDeleted({ topicId, postIds: result?.deletedPosts || [] }) } catch (e) { console.warn('[QL7][forum-index] delete topic maintenance failed:', e?.message || e) }
            results.push({ op: 'delete_topic', topicId, removedPosts, rev, opId: op.opId })
            await publishForumEvent({ type: 'topic_deleted', topicId, removedPosts, rev })
          }

        } else if (op.type === 'ban_user') {
          const targetRaw = String(p.userId || '').trim()
          const targetLc  = targetRaw.toLowerCase()
          if (!targetLc) throw new Error('missing_userId')

          const banResult = await dbBanUser(targetLc)
          const rev = Number(banResult?.rev || 0) || await nextRev()
          results.push({ op: 'ban_user', userId: targetRaw, rev, opId: op.opId })
          await publishForumEvent({ type: 'ban_user', userId: targetLc, rev })

        } else if (op.type === 'unban_user') {
          const targetRaw = String(p.userId || '').trim()
          const targetLc  = targetRaw.toLowerCase()
          if (!targetLc) throw new Error('missing_userId')

          const unbanResult = await dbUnbanUser(targetLc)
          const rev = Number(unbanResult?.rev || 0) || await nextRev()
          results.push({ op: 'unban_user', userId: targetRaw, rev, opId: op.opId })
          await publishForumEvent({ type: 'unban_user', userId: targetLc, rev })

        } else if (op.type === 'ban_ip') {
          const ipVal = String(p.ip || '').trim().toLowerCase()
          if (!ipVal) throw new Error('missing_ip')
          const banIpResult = await dbBanIp(ipVal)
          const rev = Number(banIpResult?.rev || 0) || await nextRev()
          results.push({ op: 'ban_ip', ip: ipVal, rev, opId: op.opId })
          await publishForumEvent({ type: 'ban_ip', ip: ipVal, rev })

        } else if (op.type === 'unban_ip') {
          const ipVal = String(p.ip || '').trim().toLowerCase()
          if (!ipVal) throw new Error('missing_ip')
          const unbanIpResult = await dbUnbanIp(ipVal)
          const rev = Number(unbanIpResult?.rev || 0) || await nextRev()
          results.push({ op: 'unban_ip', ip: ipVal, rev, opId: op.opId })
          await publishForumEvent({ type: 'unban_ip', ip: ipVal, rev })

        } else {
          results.push({ op: op.type, error: 'unknown_op_type', opId: op.opId })
        }
      } catch (e) {
        results.push({ op: op?.type || 'unknown', error: String(e?.message || e || 'error'), opId: op?.opId })
      }
    }
    // РџРµСЂРµСЃР±РѕСЂРєР° СЃРЅР°РїС€РѕС‚Р° вЂ” РўРћР›Р¬РљРћ РєРѕРіРґР° РјРµРЅСЏСЋС‚СЃСЏ РґР°РЅРЅС‹Рµ С„РѕСЂСѓРјР°,
    // Р° РЅРµ РЅР° "С€СѓРј" (РїСЂРѕСЃРјРѕС‚СЂС‹).
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
    }

    return json({ applied: results })
  } catch (err) {
    console.error('mutate error', err)
    return bad(err.message || 'internal_error', 500)
  }
}
