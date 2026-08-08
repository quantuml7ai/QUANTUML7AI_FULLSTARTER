import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/featureFlag.js'
import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { runQl7SupportScheduler } from '@/lib/ql7-support/scheduler.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function str(value) { return String(value ?? '').trim() }
function safeEqual(left, right) {
  const a = Buffer.from(str(left))
  const b = Buffer.from(str(right))
  return a.length > 0 && a.length === b.length && cryptoSafeEqual(a, b)
}
function cryptoSafeEqual(a, b) {
  try { return crypto.timingSafeEqual(a, b) } catch { return false }
}

function workerAuthorized(req) {
  const workerToken = str(process.env.QL7_SUPPORT_WORKER_TOKEN)
  const cronSecret = str(process.env.CRON_SECRET)
  const direct = str(req?.headers?.get?.('x-ql7-support-worker-token'))
  const authorization = str(req?.headers?.get?.('authorization'))
  if (workerToken && safeEqual(direct, workerToken)) return true
  if (cronSecret && authorization.toLowerCase().startsWith('bearer ')) {
    return safeEqual(authorization.slice(7), cronSecret)
  }
  return false
}

export async function POST(req) {
  if (!isQl7SupportActive()) return NextResponse.json(ql7SupportDisabledPayload(), { status: 404 })
  if (!workerAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'worker_unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const maxItems = Math.max(1, Math.min(100, Number(body?.maxItems || 25)))
  const result = await runQl7SupportScheduler({
    dryRun: false,
    workerId: `api:${process.pid}`,
    emailMaxItems: maxItems,
    emailMaxAttempts: 5,
  })
  return NextResponse.json({ ok: result?.ok !== false, result }, {
    status: result?.ok === false ? 500 : 200,
    headers: { 'cache-control': 'no-store, max-age=0' },
  })
}
