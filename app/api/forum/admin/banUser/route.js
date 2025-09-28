// app/api/forum/admin/banUser/route.js

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { json, bad, requireAdmin } from '../../_utils.js'
import { dbBanUser } from '../../_db.js'

export async function POST(request) {
  try {
    requireAdmin()
    const body = await request.json().catch(() => ({}))
    const accountId = String(body?.accountId || '')
    if (!accountId) return bad('missing_accountId', 400)
    await dbBanUser(accountId)
    return json({ ok: true })
  } catch (e) {
    return bad(e, e?.status || 500)
  }
}
