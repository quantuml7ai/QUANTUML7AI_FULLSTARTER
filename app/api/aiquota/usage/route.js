import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

import {
  AI_QUOTA_LIMIT_SEC,
  clampQuotaUsed,
  normalizeQuotaAccount,
  needsQuotaIdentitySync,
  planQuotaIncrement,
  resolveEffectiveQuotaUsage,
  selectQuotaClientIp,
} from '../../../../lib/exchange/aiQuotaIdentity'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const redis = Redis.fromEnv()
const DEFAULT_TICK = 1

function yyyymmdd() {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
}

function secondsToEndOfDay() {
  const now = new Date()
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  )
  return Math.max(1, Math.ceil((end - now) / 1000))
}

function ipQuotaKey(date, ip) {
  // Keep the original key format so already consumed IP quota is preserved.
  return `aiq:${date}:${ip}`
}

function accountQuotaKey(date, accountId) {
  const normalized = normalizeQuotaAccount(accountId)
  if (!normalized) return null
  const digest = createHash('sha256').update(normalized).digest('hex').slice(0, 40)
  return `aiq:${date}:account:${digest}`
}

function getAccountIdFromReq(req, body) {
  const query = req.nextUrl.searchParams
  const queryId = query.get('id') || query.get('accountId')
  if (queryId) return normalizeQuotaAccount(queryId)

  const bodyId = body?.accountId
  if (bodyId) return normalizeQuotaAccount(bodyId)

  try {
    const cookieString = req.headers.get('cookie') || ''
    const pick = (name) =>
      cookieString
        .split('; ')
        .find((item) => item.startsWith(`${name}=`))
        ?.split('=')[1]
    return normalizeQuotaAccount(
      pick('asherId') || pick('accountId') || pick('wallet') || null,
    )
  } catch {
    return null
  }
}

async function getVipStatus(req, accountId) {
  if (!accountId) return { isVip: false, untilISO: null, daysLeft: 0 }

  try {
    const url = new URL('/api/subscription/status', req.nextUrl)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId }),
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => ({}))
    return {
      isVip: Boolean(payload?.isVip),
      untilISO: payload?.untilISO || null,
      daysLeft: Number.isFinite(Number(payload?.daysLeft))
        ? Number(payload.daysLeft)
        : 0,
    }
  } catch {
    return { isVip: false, untilISO: null, daysLeft: 0 }
  }
}

async function readIdentityUsage({ date, ip, accountId }) {
  const ipKey = ipQuotaKey(date, ip)
  const accountKey = accountQuotaKey(date, accountId)
  const [rawIpUsed, rawAccountUsed] = await Promise.all([
    redis.get(ipKey),
    accountKey ? redis.get(accountKey) : Promise.resolve(0),
  ])

  const ipUsedSec = clampQuotaUsed(rawIpUsed, AI_QUOTA_LIMIT_SEC)
  const accountUsedSec = clampQuotaUsed(rawAccountUsed, AI_QUOTA_LIMIT_SEC)
  const usedSec = resolveEffectiveQuotaUsage({
    ipUsedSec,
    accountUsedSec,
    limitSec: AI_QUOTA_LIMIT_SEC,
  })

  return {
    ipKey,
    accountKey,
    ipUsedSec,
    accountUsedSec,
    usedSec,
  }
}

async function expireQuotaKey(key, ttl) {
  if (!key) return
  await redis.expire(key, ttl)
}

async function setQuotaKey(key, usedSec, ttl) {
  if (!key) return
  await redis.set(key, usedSec, { ex: ttl })
}

async function incrementIdentityUsage(identity, deltaSec, ttl) {
  const plan = planQuotaIncrement({
    ipUsedSec: identity.ipUsedSec,
    accountUsedSec: identity.accountUsedSec,
    deltaSec,
    limitSec: AI_QUOTA_LIMIT_SEC,
  })

  if (plan.addedSec <= 0) {
    return {
      ...plan,
      ipUsedSec: identity.ipUsedSec,
      accountUsedSec: identity.accountUsedSec,
    }
  }

  const incrementResults = await Promise.all([
    redis.incrby(identity.ipKey, plan.addedSec),
    identity.accountKey
      ? redis.incrby(identity.accountKey, plan.addedSec)
      : Promise.resolve(0),
  ])

  const observedIp = clampQuotaUsed(incrementResults[0], AI_QUOTA_LIMIT_SEC)
  const observedAccount = identity.accountKey
    ? clampQuotaUsed(incrementResults[1], AI_QUOTA_LIMIT_SEC)
    : 0
  const synchronizedUsed = Math.min(
    AI_QUOTA_LIMIT_SEC,
    Math.max(plan.nextUsedSec, observedIp, observedAccount),
  )

  // Backfill both identities to one monotonic value. Changing only the account,
  // browser or IP must not restore quota already consumed by the other identity.
  await Promise.all([
    setQuotaKey(identity.ipKey, synchronizedUsed, ttl),
    identity.accountKey
      ? setQuotaKey(identity.accountKey, synchronizedUsed, ttl)
      : Promise.resolve(),
  ])

  return {
    ...plan,
    nextUsedSec: synchronizedUsed,
    remainingSec: Math.max(0, AI_QUOTA_LIMIT_SEC - synchronizedUsed),
    capped: synchronizedUsed >= AI_QUOTA_LIMIT_SEC,
    ipUsedSec: synchronizedUsed,
    accountUsedSec: identity.accountKey ? synchronizedUsed : 0,
  }
}

async function synchronizeIdentityUsage(identity, ttl) {
  const synchronizedUsed = resolveEffectiveQuotaUsage({
    ipUsedSec: identity.ipUsedSec,
    accountUsedSec: identity.accountUsedSec,
    limitSec: AI_QUOTA_LIMIT_SEC,
  })

  await Promise.all([
    setQuotaKey(identity.ipKey, synchronizedUsed, ttl),
    identity.accountKey
      ? setQuotaKey(identity.accountKey, synchronizedUsed, ttl)
      : Promise.resolve(),
  ])

  return synchronizedUsed
}

function quotaResponse({
  ip,
  date,
  accountId,
  usedSec,
  ipUsedSec,
  accountUsedSec,
  added = 0,
  capped = false,
  identitySyncNeeded = false,
}) {
  return {
    ok: true,
    ip,
    date,
    usedSec,
    limitSec: AI_QUOTA_LIMIT_SEC,
    remainingSec: Math.max(0, AI_QUOTA_LIMIT_SEC - usedSec),
    unlimited: false,
    isVip: false,
    untilISO: null,
    daysLeft: 0,
    added,
    capped,
    quotaScope: accountId ? 'ip+account' : 'ip',
    ipUsedSec,
    accountUsedSec: accountId ? accountUsedSec : null,
    identitySyncNeeded: Boolean(identitySyncNeeded),
  }
}

export async function GET(req) {
  try {
    const date = yyyymmdd()
    const ip = selectQuotaClientIp(req.headers)
    const accountId = getAccountIdFromReq(req, null)
    const vip = await getVipStatus(req, accountId)

    if (vip.isVip) {
      return NextResponse.json({
        ok: true,
        ip,
        date,
        usedSec: 0,
        limitSec: null,
        remainingSec: null,
        unlimited: true,
        isVip: true,
        untilISO: vip.untilISO,
        daysLeft: vip.daysLeft,
        quotaScope: accountId ? 'ip+account' : 'ip',
      }, { headers: { 'cache-control': 'no-store' } })
    }

    const identity = await readIdentityUsage({ date, ip, accountId })
    return NextResponse.json(
      quotaResponse({
        ip,
        date,
        accountId,
        usedSec: identity.usedSec,
        ipUsedSec: identity.ipUsedSec,
        accountUsedSec: identity.accountUsedSec,
        capped: identity.usedSec >= AI_QUOTA_LIMIT_SEC,
        identitySyncNeeded: needsQuotaIdentitySync({
          ipUsedSec: identity.ipUsedSec,
          accountUsedSec: identity.accountUsedSec,
          hasAccount: Boolean(identity.accountKey),
          limitSec: AI_QUOTA_LIMIT_SEC,
        }),
      }),
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500, headers: { 'cache-control': 'no-store' } },
    )
  }
}

export async function POST(req) {
  const ttl = secondsToEndOfDay()

  try {
    const body = await req.json().catch(() => ({}))
    const op = body?.op || 'tick'
    const deltaSec = Number.isFinite(Number(body?.deltaSec))
      ? Math.max(0, Math.floor(Number(body.deltaSec)))
      : DEFAULT_TICK

    if (op !== 'tick') {
      return NextResponse.json(
        { ok: false, error: 'UNSUPPORTED_OP' },
        { status: 400, headers: { 'cache-control': 'no-store' } },
      )
    }

    const date = yyyymmdd()
    const ip = selectQuotaClientIp(req.headers)
    const accountId = getAccountIdFromReq(req, body)
    const vip = await getVipStatus(req, accountId)

    if (vip.isVip) {
      return NextResponse.json({
        ok: true,
        ip,
        date,
        usedSec: 0,
        limitSec: null,
        remainingSec: null,
        unlimited: true,
        isVip: true,
        untilISO: vip.untilISO,
        daysLeft: vip.daysLeft,
        added: 0,
        quotaScope: accountId ? 'ip+account' : 'ip',
      }, { headers: { 'cache-control': 'no-store' } })
    }

    const identity = await readIdentityUsage({ date, ip, accountId })
    if (identity.usedSec >= AI_QUOTA_LIMIT_SEC || deltaSec <= 0) {
      const shouldSynchronize = needsQuotaIdentitySync({
        ipUsedSec: identity.ipUsedSec,
        accountUsedSec: identity.accountUsedSec,
        hasAccount: Boolean(identity.accountKey),
        limitSec: AI_QUOTA_LIMIT_SEC,
      })
      const synchronizedUsed = shouldSynchronize
        ? await synchronizeIdentityUsage(identity, ttl)
        : identity.usedSec

      if (!shouldSynchronize) {
        await Promise.all([
          expireQuotaKey(identity.ipKey, ttl),
          identity.accountKey
            ? expireQuotaKey(identity.accountKey, ttl)
            : Promise.resolve(),
        ])
      }

      return NextResponse.json(
        quotaResponse({
          ip,
          date,
          accountId,
          usedSec: synchronizedUsed,
          ipUsedSec: synchronizedUsed,
          accountUsedSec: identity.accountKey ? synchronizedUsed : 0,
          added: 0,
          capped: synchronizedUsed >= AI_QUOTA_LIMIT_SEC,
          identitySyncNeeded: false,
        }),
        { headers: { 'cache-control': 'no-store' } },
      )
    }

    const incremented = await incrementIdentityUsage(identity, deltaSec, ttl)
    return NextResponse.json(
      quotaResponse({
        ip,
        date,
        accountId,
        usedSec: incremented.nextUsedSec,
        ipUsedSec: incremented.ipUsedSec,
        accountUsedSec: incremented.accountUsedSec,
        added: incremented.addedSec,
        capped: incremented.capped,
      }),
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500, headers: { 'cache-control': 'no-store' } },
    )
  }
}
