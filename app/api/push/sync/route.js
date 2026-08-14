import { requireUserIdCanonical } from '../../dm/_utils.js'
import {
  markPushItemsRead,
  markPushSourcesRead,
  readPushState,
  syncPushCount,
  syncPushCounts,
} from '../../../../lib/webPush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    const userId = await requireUserIdCanonical(req)
    const result = await readPushState(userId)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || 'push_sync_failed') }, { status: error?.status || 401 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = await requireUserIdCanonical(req, body)
    const result = body?.readItems && typeof body.readItems === 'object'
      ? await markPushItemsRead(userId, body.readItems)
      : Array.isArray(body?.readSources) || body?.readSource
        ? await markPushSourcesRead(userId, body?.readSources || [body?.readSource], body?.readAt)
        : body?.counts && typeof body.counts === 'object'
          ? await syncPushCounts(userId, body.counts)
          : await syncPushCount(userId, body?.count)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || 'push_sync_failed') }, { status: error?.status || 401 })
  }
}
