// app/api/profile/save-icon/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import { setUserIcon, nextRev, pushChange, redis as redisDirect } from '../../forum/_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))

    let userId = ''
    try { userId = requireUserId(req, body) } catch {}
    if (!userId) userId = body.accountId || body.asherId || ''
    if (!userId) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 })

    const icon = String(body?.icon || '').trim()
    if (!icon) return NextResponse.json({ ok:false, error:'empty_icon' }, { status:400 })

    const saved = await setUserIcon(userId, icon) // реализуй в _db.js
    const rev = await nextRev()

    // событие для лайв-синхронизации
    const evt = { type:'profile.avatar', accountId:userId, icon:saved, rev, ts:Date.now() }
    await pushChange(evt)
    try { await redisDirect.publish('forum:events', JSON.stringify(evt)) } catch {}

    return NextResponse.json({ ok:true, icon:saved, rev })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status:500 })
  }
}
