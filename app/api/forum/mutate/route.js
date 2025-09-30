// app/api/forum/mutate/route.js
import { json, bad, requireUserId } from '../_utils.js'
import {
  createTopic,
  createPost,
  incrementTopicViews,
  incrementPostViews,
  reactPost,
} from '../_db.js'

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
      // По-операционный try/catch: не валим весь батч
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
          // delta ограничим ±1; по умолчанию 1
          const delta = Math.max(-1, Math.min(1, Number(p.delta ?? 1) || 1))
          // совместимо с текущей сигнатурой; если reactPost принимает userId - используем
          const maybeWithUser = reactPost.length >= 4
            ? await reactPost(postId, kind, delta, userId)
            : await reactPost(postId, kind, delta)
          results.push({ op: 'react', postId, kind, delta, rev: maybeWithUser?.rev })

        } else {
          results.push({ op: op.type, error: 'noop' })
        }
      } catch (e) {
        // фиксируем ошибку конкретной операции и идём дальше
        results.push({ op: op?.type || 'unknown', error: String(e?.message || e || 'error') })
      }
    }

    return json({ applied: results })
  } catch (err) {
    console.error('mutate error', err)
    return bad(err.message || 'internal_error', 500)
  }
}
