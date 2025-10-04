// app/api/forum/mutate/route.js
import { json, bad, requireUserId } from '../_utils.js'
import {
  createTopic,
  createPost,
  incrementTopicViews,
  incrementPostViews,
  reactPost,
} from '../_db.js'
import { Redis } from '@upstash/redis'

// Паблишер в канал forum:events (не валит запрос, если Redis недоступен)
async function publishForumEvent(evt) {
  try {
    const redis = Redis.fromEnv()
    await redis.publish('forum:events', JSON.stringify({ ...evt, ts: Date.now() }))
  } catch (e) {
    console.warn('publishForumEvent failed', e)
  }
}

// Регэксп для картинок: /uploads/... и абсолютные http(s)-ссылки на изображения
const IMG_LINE_RE = /^(?:\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)|https?:\/\/[^\s]+?\.(?:webp|png|jpe?g|gif))(?:\?.*)?$/i
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
          const title = trimStr(p.title, MAX_TITLE)
          const description = trimStr(p.description || '', MAX_TEXT)
          const nickname = trimStr(p.nickname || '', 80)
          const icon = trimStr(p.icon || '', 32)
          const { topic, rev } = await createTopic({
            title, description, userId, nickname, icon, ts: Date.now(),
          })
          results.push({ op: 'create_topic', topic, rev })

          // События по созданию темы не шлём — пушим только картинки в постах.

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

          // Публикуем событие для live-обновлений.
          // Клиент по SSE дергает refresh() только если hasImages === true
          const hasImages = textHasImages(text)
          await publishForumEvent({
            type: 'post_created',
            topicId,
            postId: post?.id,
            hasImages,
          })

        } else if (op.type === 'view_topic') {
          const { topicId } = p
          const r = await incrementTopicViews(topicId, 1)
          results.push({ op: 'view_topic', topicId, rev: r?.rev })

        } else if (op.type === 'view_post') {
          const { postId } = p
          const r = await incrementPostViews(postId, 1)
          results.push({ op: 'view_post', postId, rev: r?.rev })

        } else if (op.type === 'react') {
          const { postId, kind } = p
          const delta = Math.max(-1, Math.min(1, Number(p.delta ?? 1) || 1))
          const maybeWithUser = reactPost.length >= 4
            ? await reactPost(postId, kind, delta, userId)
            : await reactPost(postId, kind, delta)
          results.push({ op: 'react', postId, kind, delta, rev: maybeWithUser?.rev })

        } else {
          results.push({ op: op.type, error: 'noop' })
        }
      } catch (e) {
        results.push({ op: op?.type || 'unknown', error: String(e?.message || e || 'error') })
      }
    }

    return json({ applied: results })
  } catch (err) {
    console.error('mutate error', err)
    return bad(err.message || 'internal_error', 500)
  }
}
