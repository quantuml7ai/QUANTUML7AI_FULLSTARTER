// app/api/forum/admin/deleteTopic/route.js

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { json, bad, requireAdmin } from '../../_utils.js'
import { dbDeleteTopic } from '../../_db.js'

export async function POST(request) {
  try {
    requireAdmin()
    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || '')
    if (!id) return bad('missing_id', 400)
    await dbDeleteTopic(id)
    return json({ ok: true })
  } catch (e) {
    return bad(e, e?.status || 500)
  }
}
