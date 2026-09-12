// app/api/profile/batch/route.js
import { NextResponse } from 'next/server'
import { resolveCanonicalAccountIds } from '../_identity.js'
import profilePrimary from '../../../../lib/mongo/profile-primary.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const MAX_IDS = 500

const normalizeIdList = (ids) => {
  const cleaned = (Array.isArray(ids) ? ids : [])
    .map((id) => String(id || '').trim())
    .filter(Boolean)
  return Array.from(new Set(cleaned)).slice(0, MAX_IDS)
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawIds = normalizeIdList(body?.ids)
    const map = {}

    if (!rawIds.length) {
      return NextResponse.json({ ok: true, map, aliases: {}, storagePrimary: 'mongo' })
    }

    const { ids, aliases } = await resolveCanonicalAccountIds(rawIds)
    if (!ids.length) {
      return NextResponse.json({ ok: true, map, aliases, storagePrimary: 'mongo' })
    }

    await Promise.all(ids.map(async (uid) => {
      const profile = await profilePrimary.getUserProfile(uid)
      map[uid] = {
        nickname: String(profile?.nickname || '').trim(),
        icon: String(profile?.icon || '').trim(),
      }
    }))

    return NextResponse.json({ ok: true, map, aliases, storagePrimary: 'mongo' })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}
