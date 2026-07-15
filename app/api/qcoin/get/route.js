// app/api/qcoin/get/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import qcoinPrimary from '@/lib/mongo/qcoin-primary.cjs'

const INC_PER_SEC = 1 / (365 * 24 * 60 * 60)
const GRACE_MS = 4 * 60 * 60 * 1000

async function getUid(req) {
  const hx = (req.headers.get('x-forum-user') || '').trim()
  if (hx) return hx
  try { return requireUserId(req) } catch {}
  return ''
}

function defaultPayload(uid, isVip) {
  const now = Date.now()
  return {
    ok: true,
    userId: uid,
    startedAt: now,
    lastActiveAt: now,
    lastConfirmAt: 0,
    seconds: 0,
    minutes: 0,
    balance: 0,
    paused: false,
    incPerSec: isVip ? (INC_PER_SEC * 2) : INC_PER_SEC,
    graceMs: GRACE_MS,
    vip: isVip ? 1 : 0,
    storagePrimary: 'mongo',
  }
}

export async function GET(req) {
  try {
    const uid = await getUid(req)
    if (!uid) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 })

    const isVip = (req.headers.get('x-forum-vip') === '1')
    const account = await qcoinPrimary.readAccount(uid)
    const payload = account
      ? await qcoinPrimary.getPayload({ uid, isVip })
      : defaultPayload(uid, isVip)
    payload.storagePrimary = 'mongo'
    return NextResponse.json(payload, {
      headers: {
        'x-ql7-read-source': 'mongo_primary',
        'x-ql7-mongo-primary-fallback-reason': 'none',
      },
    })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 })
  }
}
