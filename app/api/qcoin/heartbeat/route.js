// app/api/qcoin/heartbeat/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { requireUserId } from '../../forum/_utils.js'
import qcoinPrimary from '../../../../lib/mongo/qcoin-primary.cjs'

const redis = Redis.fromEnv()

const INC_PER_SEC = 1 / (365 * 24 * 60 * 60)
const GRACE_MS = 4 * 60 * 60 * 1000
const aliveKey = (uid, cid = '') => cid ? `qcoin:alive:${uid}:${cid}` : `qcoin:alive:${uid}`

async function getUid(req, body) {
  const hx = (req.headers.get('x-forum-user') || '').trim()
  if (hx) return hx
  if (body?.accountId) return String(body.accountId)
  if (body?.asherId) return String(body.asherId)
  try { return requireUserId(req) } catch {}
  return ''
}

export async function POST(req) {
  try {
    const isVip = (req.headers.get('x-forum-vip') === '1')
    const rate = isVip ? (INC_PER_SEC * 2) : INC_PER_SEC

    let body = {}
    try { body = await req.json() } catch {}

    const uid = await getUid(req, body)
    if (!uid) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 })

    const now = Number(body?.now || Date.now())
    const activeFlag = !!body?.active

    let cid = (req.headers.get('x-forum-client-id') || '').trim()
    if (cid && !/^[A-Za-z0-9_\-:.]{1,64}$/.test(cid)) cid = ''

    let anyClientAlive = false
    if (cid) {
      try {
        await redis.set(aliveKey(uid, cid), 1, { px: 60_000 })
        // The successful SET already proves this exact client is alive.
        // Avoid the old read-after-write GET on the same qcoin:alive:* key.
        anyClientAlive = true
      } catch {
        anyClientAlive = false
      }
    }

    const result = await qcoinPrimary.heartbeat({
      uid,
      now,
      active: activeFlag,
      isVip,
      anyClientAlive,
    })
    const s = result.state
    return NextResponse.json({
      ok: true,
      userId: uid,
      startedAt: s.startedAt,
      lastActiveAt: s.lastActiveAt,
      lastConfirmAt: s.lastConfirmAt,
      seconds: s.seconds,
      minutes: Math.floor((s.seconds || 0) / 60),
      balance: s.balance,
      addedSeconds: result.addedSeconds,
      added: result.addedBalance,
      incPerSec: rate,
      effectiveActive: result.effectiveActive,
      anyClientAlive,
      graceMs: GRACE_MS,
      vip: isVip ? 1 : 0,
      storagePrimary: 'mongo',
    })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 })
  }
}
