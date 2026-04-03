// app/api/forum/post-chain/route.js
// Build ancestor chain for deep links: root -> ... -> target.

import { json, bad } from '../_utils.js'
import { redis, K, safeParse } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const MAX_DEPTH = 60

async function readPost(id) {
  const pid = String(id || '').trim()
  if (!pid) return null
  try {
    const raw = await redis.get(K.postKey(pid))
    return raw ? safeParse(raw) : null
  } catch {
    return null
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = String(searchParams.get('postId') || '').trim()
    if (!postId) return bad('missing_postId', 400)

    let curId = postId
    let cur = await readPost(curId)
    if (!cur) return json({ ok: false, error: 'not_found' }, 404)

    const topicId = cur?.topicId != null ? String(cur.topicId) : null

    const visited = new Set()
    const chainRev = []

    for (let depth = 0; depth < MAX_DEPTH; depth += 1) {
      const cid = String(curId || '').trim()
      if (!cid) break

      if (visited.has(cid)) {
        return json({ ok: false, error: 'cycle' }, 409, {
          'cache-control': 'no-store, max-age=0',
        })
      }
      visited.add(cid)
      chainRev.push(cid)

      const parentIdRaw = cur?.parentId
      const parentId = parentIdRaw != null ? String(parentIdRaw).trim() : ''
      if (!parentId) break

      const parent = await readPost(parentId)
      if (!parent) break

      curId = String(parent?.id || parentId).trim() || parentId
      cur = parent
    }

    const chain = chainRev.slice().reverse()
    const rootId = chain[0] || postId

    return json(
      {
        ok: true,
        postId: String(postId),
        topicId,
        rootId,
        chain,
      },
      200,
      { 'cache-control': 'no-store, max-age=0' },
    )
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500, {
      'cache-control': 'no-store, max-age=0',
    })
  }
}

