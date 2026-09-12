import crypto from 'node:crypto'

import { NextResponse } from 'next/server'

import mongoClient from '@/lib/mongo/client.cjs'
import { resolveQl7VerifiedActor } from '@/lib/ql7-support/identityResolver.js'
import {
  purchaseEntitlementWithQcoin,
  quoteQcoinEntitlementPurchase,
} from '@/lib/qcoinEntitlementPurchase.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const PUBLIC_ERRORS = new Set([
  'UNKNOWN_PURPOSE',
  'UNKNOWN_ADS_PACKAGE',
  'INVALID_PURCHASE_REQUEST_ID',
  'INSUFFICIENT_QCOIN',
  'VERIFIED_SESSION_REQUIRED',
  'VERIFIED_ACCOUNT_REQUIRED',
  'PAYMENT_CONFIGURATION_UNAVAILABLE',
])

function json(payload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { 'cache-control': 'no-store, max-age=0' },
  })
}

async function getDatabase() {
  const handle = await mongoClient.getMongoDb()
  return handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
}

export async function POST(req) {
  const traceId = crypto.randomUUID()
  let body = null
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, error: 'BAD_JSON' }, 400)
  }

  try {
    const database = await getDatabase()
    const actor = await resolveQl7VerifiedActor({ req, body: body || {}, database })
    if (!actor?.valid || !actor?.canonicalAccountId) {
      return json({
        ok: false,
        error: actor?.failureCode || 'VERIFIED_SESSION_REQUIRED',
      }, 401)
    }

    const action = String(body?.action || '').trim().toLowerCase()
    const product = {
      purpose: body?.purpose,
      adsPackage: body?.adsPackage,
    }

    if (action === 'quote') {
      const quote = await quoteQcoinEntitlementPurchase({
        accountId: actor.canonicalAccountId,
        ...product,
      })
      return json(quote)
    }

    if (action === 'purchase') {
      const result = await purchaseEntitlementWithQcoin({
        actor,
        ...product,
        clientRequestId: body?.clientRequestId,
        request: req,
      })
      return json(result)
    }

    return json({ ok: false, error: 'UNKNOWN_ACTION' }, 400)
  } catch (error) {
    const code = String(error?.code || error?.message || 'PURCHASE_FAILED')
    const publicCode = PUBLIC_ERRORS.has(code) ? code : 'PURCHASE_FAILED'
    const status = publicCode === 'INSUFFICIENT_QCOIN'
      ? 409
      : Math.max(400, Math.min(599, Number(error?.status || 500)))

    if (publicCode === 'PURCHASE_FAILED') {
      console.error(`[qcoin-entitlement-purchase:${traceId}]`, error)
    } else if (publicCode === 'PAYMENT_CONFIGURATION_UNAVAILABLE') {
      console.error(`[qcoin-entitlement-purchase:${traceId}]`, {
        error: publicCode,
        stage: error?.configurationStage || 'economic-runtime',
        missing: Array.isArray(error?.missingConfiguration) ? error.missingConfiguration : [],
      })
    }

    return json({
      ok: false,
      error: publicCode,
      traceId,
      ...(publicCode === 'INSUFFICIENT_QCOIN'
        ? {
          balanceQcoin: Number(error?.balanceQcoin ?? error?.balance ?? 0),
          requiredQcoin: Number(error?.requiredQcoin ?? error?.required ?? 0),
        }
        : {}),
    }, status)
  }
}
