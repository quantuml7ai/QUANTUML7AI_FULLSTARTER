// app/api/forum/admin/banUser/route.js
import { json, bad, requireAdmin } from '../../_utils.js'
import { dbBanUser } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request) {
  try {
    await requireAdmin(request)
    const body = await request.json().catch(() => ({}))
    const accountId = String(body?.accountId || body?.userId || '')
    if (!accountId) return bad('missing_accountId', 400)
    const r = await dbBanUser(accountId)
    return json({ ok: true, rev: r.rev })
  } catch (err) {
    console.error('banUser error', err)
    return bad(err.message || 'internal_error', err.status || 500)
  }
}
