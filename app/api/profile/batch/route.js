// app/api/profile/batch/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { K } from '../../forum/_db.js'
import { resolveCanonicalAccountIds } from '../_identity.js'
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

const unwrapResult = (value) => {
  if (value && typeof value === 'object' && 'result' in value) return value.result
  return value
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawIds = normalizeIdList(body?.ids)
    const map = {}

    if (!rawIds.length) {
      return NextResponse.json({ ok: true, map, aliases: {} })
    }

    const redis = Redis.fromEnv()
    const { ids, aliases } = await resolveCanonicalAccountIds(rawIds, redis)
    // WHY: normalize non-canonical ids (tgUid/hasher) to canonical accountId for a single source of truth.
    if (!ids.length) {
      return NextResponse.json({ ok: true, map, aliases })
    }    
    const pipe = redis.multi()
    ids.forEach((uid) => {
      pipe.get(K.userNick(uid))
      pipe.get(K.userAvatar(uid))
            pipe.get(K.userAbout(uid))
    })

    const raw = await pipe.exec()
    const flat = Array.isArray(raw) ? raw.map(unwrapResult) : []

    ids.forEach((uid, idx) => {
      const nick = String(flat[idx * 3] || '').trim()
      const icon = String(flat[idx * 3 + 1] || '').trim()
      const about = String(flat[idx * 3 + 2] || '').trim()
      map[uid] = { nickname: nick, icon, about }
    })

    return NextResponse.json({ ok: true, map, aliases })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}