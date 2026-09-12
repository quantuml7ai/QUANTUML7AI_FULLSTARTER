import { requireUserIdCanonical } from '../../dm/_utils.js'
import { savePushSubscription } from '../../../../lib/webPush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = await requireUserIdCanonical(req, body)
    const result = await savePushSubscription(userId, body?.subscription, {
      lang: body?.lang,
      nativeShell: body?.nativeShell === true,
      userAgent: req.headers.get('user-agent') || '',
    })
    return Response.json({ ok: true, id: result.id })
  } catch (error) {
    const status = error?.status || (String(error?.message || '').startsWith('invalid_push_') ? 400 : 401)
    return Response.json({ ok: false, error: String(error?.message || 'push_subscribe_failed') }, { status })
  }
}
