// app/api/profile/check-nick/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import { resolveCanonicalAccountId } from '../_identity.js'
import profilePrimary from '../../../../lib/mongo/profile-primary.cjs'
import { isQl7SupportId } from '../../../../lib/ql7-support/systemActor.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const nick = profilePrimary.normNick(searchParams.get('nick') || '')
    if (!nick) return NextResponse.json({ ok: false, error: 'empty_nick' }, { status: 400 })
    if (isQl7SupportId(nick)) {
      return NextResponse.json({ ok: true, free: false, nick, reserved: true, storagePrimary: 'mongo' })
    }

    let uid = ''
    try { uid = requireUserId(req, {}) } catch {}
    if (!uid) uid = searchParams.get('uid') || ''
    const accountId = uid ? await resolveCanonicalAccountId(uid) : ''
    const free = await profilePrimary.isNickAvailable(nick, accountId || uid)

    return NextResponse.json({ ok: true, free, nick, storagePrimary: 'mongo' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
