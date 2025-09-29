// app/api/forum/mutate/route.js
import { json, bad, requireUserId } from '../_utils.js'
import { createTopic, createPost, incrementTopicViews, incrementPostViews, reactPost } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function validateOp(op) {
  if (!op || !op.type) throw new Error('missing_op_type')
  const t = op.type
  if (t === 'create_topic') {
    if (!op.payload?.title) throw new Error('missing_title')
  } else if (t === 'create_post') {
    if (!op.payload?.topicId) throw new Error('missing_topicId')
    if (!op.payload?.text) throw new Error('missing_text')
  } else if (t === 'react') {
    if (!op.payload?.postId) throw new Error('missing_postId')
    if (!['like','dislike'].includes(op.payload.kind)) throw new Error('bad_reaction_kind')
  } else if (t === 'view_topic' || t === 'view_post') {
    // ok
  } else {
    throw new Error('unknown_op_type')
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    // require a user id for any write
    const userId = requireUserId(request, body)
    const ops = Array.isArray(body.ops) ? body.ops : []
    if (!ops.length) return bad('missing_ops', 400)

    const results = []
    for (const op of ops) {
      try {
        validateOp(op)
      } catch (e) {
        return bad(e.message || 'invalid_op', 400)
      }

      const p = op.payload || {}
      if (op.type === 'create_topic') {
        const { title, description, nickname, icon } = p
        const { topic, rev } = await createTopic({
          title, description,
          userId,
          nickname, icon,
          ts: Date.now(),
        })
        results.push({ op: 'create_topic', topic, rev })
      } else if (op.type === 'create_post') {
        const { topicId, parentId, text, nickname, icon } = p
        const { post, rev } = await createPost({
          topicId, parentId, text,
          userId,
          nickname, icon,
          ts: Date.now(),
        })
        results.push({ op: 'create_post', post, rev })
      } else if (op.type === 'view_topic') {
        const { topicId } = p
        await incrementTopicViews(topicId, 1)
        results.push({ op: 'view_topic', topicId })
      } else if (op.type === 'view_post') {
        const { postId } = p
        await incrementPostViews(postId, 1)
        results.push({ op: 'view_post', postId })
      } else if (op.type === 'react') {
        const { postId, kind, delta = 1 } = p
        const r = await reactPost(postId, kind, delta)
        results.push({ op: 'react', postId, kind, delta, rev: r.rev })
      } else {
        // should not occur due to validateOp
        results.push({ op: op.type, error: 'noop' })
      }
    }

    return json({ applied: results })
  } catch (err) {
    console.error('mutate error', err)
    return bad(err.message || 'internal_error', 500)
  }
}
