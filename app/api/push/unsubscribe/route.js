import { requireUserIdCanonical } from '../../dm/_utils.js'
import { removePushSubscription } from '../../../../lib/webPush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = await requireUserIdCanonical(req, body)
    await removePushSubscription(userId, body?.endpoint)
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || 'push_unsubscribe_failed') }, { status: error?.status || 401 })
  }
}
