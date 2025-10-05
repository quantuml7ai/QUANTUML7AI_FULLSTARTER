// app/api/forum/mutate/route.js
import { json, bad, requireUserId } from '../_utils.js'
 import {
   createTopic,
   createPost,
   incrementTopicViews,
   incrementPostViews,
   // reactPost, // больше не нужен
   nextRev,
   pushChange,
   rebuildSnapshot,
   // для счётчиков и ключей
   redis as redisDirect,
   K,
 } from '../_db.js'
import { Redis } from '@upstash/redis'
// ДОПОЛНИ импортами в mutate/route.js
import { bus } from '../_bus.js'


// ЕДИНСТВЕННАЯ версия publishForumEvent
async function publishForumEvent(evt) {
  const payload = { ...evt, ts: Date.now() }

  // 1) Мгновенно в пределах процесса (слушатели SSE увидят сразу)
  try { bus.emit(payload) } catch {}

  // 2) Между инстансами — через Redis (если сконфигурирован)
  try {
    const redis = Redis.fromEnv()
    await redis.publish('forum:events', JSON.stringify(payload))
  } catch (e) {
    console.warn('publishForumEvent failed', e?.message || e)
  }
}

// Регэксп для картинок: /uploads/... и абсолютные http(s)-ссылки на изображения
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
  } else {
    throw new Error('unknown_op_type')
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const userId = requireUserId(request, body)
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

          const { topic, rev } = await createTopic({
            title, description, userId, nickname, icon, ts: Date.now(),
          })
          results.push({ op: 'create_topic', topic, rev })

          // событие о новой теме
          await publishForumEvent({
            type: 'topic_created',
            topicId: topic?.id,
            title: topic?.title ?? '',
            rev,
          })

        } else if (op.type === 'create_post') {
          const topicId   = p.topicId
          const parentId  = p.parentId ?? null
          const text      = trimStr(p.text, MAX_TEXT)
          const nickname  = trimStr(p.nickname || '', 80)
          const icon      = trimStr(p.icon || '', 32)

          const { post, rev } = await createPost({
            topicId, parentId, text, userId, nickname, icon, ts: Date.now(),
          })
          results.push({ op: 'create_post', post, rev })

          // событие о новом посте
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
          await incrementTopicViews(topicId, 1)
          let views = null
          try { views = parseInt(await redisDirect.get(K.topicViews(topicId)), 10) || 0 } catch {}
          results.push({ op: 'view_topic', topicId, views: Number.isFinite(views) ? views : undefined })
          await publishForumEvent({ type: 'view_topic', topicId, views })

        } else if (op.type === 'view_post') {
          const { postId } = p
          await incrementPostViews(postId, 1)
          let views = null
          try { views = parseInt(await redisDirect.get(K.postViews(postId)), 10) || 0 } catch {}
          results.push({ op: 'view_post', postId, views: Number.isFinite(views) ? views : undefined })
          await publishForumEvent({ type: 'view_post', postId, views })

        } else if (op.type === 'react') {
          const { postId, kind } = p
          const delta = Math.max(-1, Math.min(1, Number(p.delta ?? 1) || 1))

          // уникальные реакции: один пользователь = like или dislike
          let likes = null, dislikes = null
          try {
            if (!postId || !['like','dislike'].includes(kind)) {
              throw new Error('bad_react_args')
            }

            const likeSetKey = (K?.postLikesSet ? K.postLikesSet(postId) : `post:${postId}:likes:set`)
            const disSetKey  = (K?.postDislikesSet ? K.postDislikesSet(postId) : `post:${postId}:dislikes:set`)

            if (kind === 'like') {
              await redisDirect.srem(disSetKey, userId)
              await redisDirect.sadd(likeSetKey, userId)
            } else {
              await redisDirect.srem(likeSetKey, userId)
              await redisDirect.sadd(disSetKey, userId)
            }

            const [lcnt, dcnt] = await Promise.all([
              redisDirect.scard(likeSetKey),
              redisDirect.scard(disSetKey),
            ])

            likes = parseInt(lcnt, 10) || 0
            dislikes = parseInt(dcnt, 10) || 0

            // поддерживаем совместимость с числовыми ключами
            try {
              await Promise.all([
                redisDirect.set(K.postLikes(postId), String(likes)),
                redisDirect.set(K.postDislikes(postId), String(dislikes)),
              ])
            } catch {}
          } catch {}

          const rev = await nextRev()
          await pushChange({ rev, kind: 'react', id: String(postId), data: { kind, delta, likes, dislikes }, ts: Date.now() })
          results.push({ op: 'react', postId, kind, delta, rev, likes, dislikes })
          await publishForumEvent({ type: 'react', postId, kind, delta, likes, dislikes, rev })

        } else {
          results.push({ op: op.type, error: 'unknown_op_type' })
        }
      } catch (e) {
        results.push({ op: op?.type || 'unknown', error: String(e?.message || e || 'error') })
      }
    }

    // единая пересборка снимка — ОДИН раз, если были успешные операции
    if (results.some(r => !r.error)) {
      await rebuildSnapshot()
    }

    return json({ applied: results })
  } catch (err) {
    console.error('mutate error', err)
    return bad(err.message || 'internal_error', 500)
  }
}
