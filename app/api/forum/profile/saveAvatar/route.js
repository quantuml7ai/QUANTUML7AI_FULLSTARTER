import { json, bad, requireUserId } from '../../_utils.js'
import { setUserIcon, getUserNick, nextRev, pushChange, rebuildSnapshot } from '../../_db.js'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    const body = await req.json().catch(()=>({}))
    const userId = requireUserId(req, body)
    const icon = String(body.icon || body.avatar || '').trim()
    if (!icon) return bad('missing_icon', 400)

    await setUserIcon(userId, icon)

    // двигаем ревизию и пишем change для совместимости
    const rev = await nextRev()
    await pushChange({ rev, kind:'profile', id:String(userId), data:{ icon }, ts:Date.now() })

    // пересобираем снапшот (единоразово)
    await rebuildSnapshot()

    // оповещаем клиентов через SSE
    try {
      const r = Redis.fromEnv()
      await r.publish('forum:events',
        JSON.stringify({ type:'profile.avatar', accountId:String(userId), icon, rev, ts:Date.now() })
      )
    } catch {}

    // для удобства клиента вернём ещё ник
    const nick = await getUserNick(userId).catch(()=>'')

    return json({ ok:true, rev, icon, nick })
  } catch (e) {
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
