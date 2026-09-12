import { requireUserIdCanonical } from '../../../dm/_utils.js'
import { createNativePushLink } from '../../../../../lib/nativePush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = await requireUserIdCanonical(req, body)
    const result = await createNativePushLink(userId, { lang: body?.lang })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || 'native_push_link_failed') }, { status: error?.status || 401 })
  }
}
