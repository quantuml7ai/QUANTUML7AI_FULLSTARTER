// app/api/forum/mediaLock/route.js
import { bad, json, requireUserId } from '../_utils.js'
import { isMediaLocked } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const uidParam = String(searchParams.get('uid') || '').trim()
    const userId = uidParam || String(requireUserId(request) || '').trim()
    if (!userId) return bad('missing_user_id', 401)

    const { locked, untilMs } = await isMediaLocked(userId)
    return json({ ok: true, locked, untilMs })
  } catch (e) {
    const msg = String(e?.message || 'bad_request')
    const status = Number(e?.status || 400)
    return bad(msg, status)
  }
}