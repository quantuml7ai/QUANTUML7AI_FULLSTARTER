// app/api/forum/post-locate/route.js
import { json, bad } from '../_utils.js'
import { redis, K, safeParse } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = String(searchParams.get('postId') || '').trim()
    if (!postId) return bad('missing_postId', 400)

    const raw = await redis.get(K.postKey(postId))
    if (!raw) return json({ ok: false, error: 'not_found' }, 404)
    const post = safeParse(raw)
    if (!post) return json({ ok: false, error: 'not_found' }, 404)

    return json({
      ok: true,
      postId: String(postId),
      topicId: post?.topicId != null ? String(post.topicId) : null,
      parentId: post?.parentId != null ? String(post.parentId) : null,
      createdAt: Number(post?.ts || 0) || null,
    })
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500, {
      'cache-control': 'no-store, max-age=0',
    })
  }
}

