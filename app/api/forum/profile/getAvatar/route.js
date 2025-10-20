import { json, bad } from '../../_utils.js'
import { getUserIcon, getUserNick } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = String(searchParams.get('userId')||'').trim()
    if (!userId) return bad('missing_userId', 400)

    const [icon, nick] = await Promise.all([
      getUserIcon(userId).catch(()=>''), getUserNick(userId).catch(()=> '')
    ])
    return json({ ok:true, userId, icon, nick })
  } catch (e) {
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
