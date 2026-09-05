import { requireUserIdCanonical } from '../../../dm/_utils.js'
import { getNativePushStatusReadOnly } from '../../../../../lib/nativePush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// QL7_MONGO_PUSH_NATIVE_STATUS_ROUTE_SAFE_READ_V1
// Redis runtime status read is side-effect-safe: no stale-device cleanup during GET.

export async function GET(req) {
  try {
    const userId = await requireUserIdCanonical(req)
    const result = await getNativePushStatusReadOnly(userId)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || 'native_push_status_failed') }, { status: error?.status || 401 })
  }
}
