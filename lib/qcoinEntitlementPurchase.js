import crypto from 'node:crypto'

import { getAdsPackageConfig, grantAdsPackageForAccount } from './adsCore.js'
import { addVipDays } from './subscriptions.js'
import { notifyQl7AdsActivated, notifyQl7VipActivated } from './ql7-support/integration/productEventBridge.js'
import mongoClient from './mongo/client.cjs'
import qcoinPrimary from './mongo/qcoin-primary.cjs'
import transactionContext from './mongo/transaction-context.cjs'
import economicRoute from './economic-integrity/productionRoute.cjs'

const QCOIN_PER_USD = 1
const MONEY_SCALE = 1_000_000
const PURCHASE_COLLECTION = 'qcoin_entitlement_purchases'
const indexedPurchaseDatabases = new WeakSet()
const PRODUCTION_CONFIGURATION = Object.freeze([
  Object.freeze({ name: 'QL7_ECONOMIC_SOURCE_HMAC_KEY', minLength: 32 }),
  Object.freeze({ name: 'QL7_ECONOMIC_DECISION_HMAC_KEY', minLength: 32 }),
  Object.freeze({ name: 'QL7_DEVICE_EVIDENCE_SALT', minLength: 16 }),
])

function str(value) {
  return String(value ?? '').trim()
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function money(value) {
  return Math.round(Number(value || 0) * MONEY_SCALE) / MONEY_SCALE
}

function hash(value) {
  return crypto.createHash('sha256').update(str(value)).digest('hex')
}

function purchaseFailure(code, status = 400, details = {}) {
  const error = new Error(code)
  error.code = code
  error.status = status
  Object.assign(error, details)
  return error
}

export function inspectQcoinPurchaseRuntimeConfiguration(env = process.env) {
  const production = String(env?.NODE_ENV || '').trim().toLowerCase() === 'production'
  const missing = production
    ? PRODUCTION_CONFIGURATION
      .filter(({ name, minLength }) => String(env?.[name] || '').trim().length < minLength)
      .map(({ name }) => name)
    : []
  return Object.freeze({ production, configured: missing.length === 0, missing: Object.freeze(missing) })
}

export function assertQcoinPurchaseRuntimeConfiguration(env = process.env) {
  const status = inspectQcoinPurchaseRuntimeConfiguration(env)
  if (!status.configured) {
    throw purchaseFailure('PAYMENT_CONFIGURATION_UNAVAILABLE', 503, {
      configurationStage: 'economic-runtime',
      missingConfiguration: [...status.missing],
    })
  }
  return status
}

async function database() {
  const handle = await mongoClient.getMongoDb()
  const raw = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!raw || typeof raw.collection !== 'function') throw new Error('mongo_db_unavailable')
  return transactionContext.bindMongoDatabase(raw)
}

async function ensurePurchaseStorage() {
  const handle = await mongoClient.getMongoDb()
  const raw = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!raw || typeof raw.collection !== 'function') throw new Error('mongo_db_unavailable')
  if (indexedPurchaseDatabases.has(raw)) return

  const purchases = raw.collection(PURCHASE_COLLECTION)
  await Promise.all([
    purchases.createIndex({ accountId: 1, completedAt: -1 }),
    purchases.createIndex({ purchaseId: 1 }, { unique: true }),
  ])
  indexedPurchaseDatabases.add(raw)
}

function vipProduct() {
  const amountUsd = positiveNumber(process.env.PLAN_PRICE_USD, 19.99)
  const days = Math.floor(
    positiveNumber(process.env.PLAN_DAYS, 0) ||
    positiveNumber(process.env.NEXT_PUBLIC_PLAN_DAYS, 0) ||
    positiveNumber(process.env.VIP_PLAN_DAYS, 0) ||
    30
  )
  return {
    purpose: 'vip',
    productKey: 'vip',
    adsPackage: null,
    amountUsd: money(amountUsd),
    amountQcoin: money(amountUsd * QCOIN_PER_USD),
    currency: 'USD',
    qcoinRate: QCOIN_PER_USD,
    vipDays: days,
    entitlementId: 'vip',
  }
}

function adsProduct(adsPackage) {
  const plan = getAdsPackageConfig(adsPackage)
  if (!plan) throw purchaseFailure('UNKNOWN_ADS_PACKAGE', 400)
  const amountUsd = positiveNumber(plan.price, 0)
  if (!amountUsd) throw purchaseFailure('ADS_BAD_PRICE', 500)
  return {
    purpose: 'ads',
    productKey: `ads:${plan.internalName}`,
    adsPackage: plan.internalName,
    amountUsd: money(amountUsd),
    amountQcoin: money(amountUsd * QCOIN_PER_USD),
    currency: String(plan.currency || 'USD').toUpperCase(),
    qcoinRate: QCOIN_PER_USD,
    durationDays: Number(plan.durationDays || 0),
    maxCampaigns: Number(plan.maxCampaigns || 0),
    maxMediaPerCampaign: Number(plan.maxMediaPerCampaign || 0),
    entitlementId: `ads:${plan.internalName}`,
  }
}

export function resolveQcoinPurchaseProduct({ purpose, adsPackage } = {}) {
  const cleanPurpose = str(purpose).toLowerCase()
  if (cleanPurpose === 'vip') return vipProduct()
  if (cleanPurpose === 'ads') return adsProduct(adsPackage)
  throw purchaseFailure('UNKNOWN_PURPOSE', 400)
}

function publicQuote(product, balanceQcoin) {
  const balance = money(balanceQcoin)
  return {
    ok: true,
    purpose: product.purpose,
    productKey: product.productKey,
    adsPackage: product.adsPackage,
    amountUsd: product.amountUsd,
    amountQcoin: product.amountQcoin,
    currency: product.currency,
    qcoinRate: product.qcoinRate,
    balanceQcoin: balance,
    sufficient: balance + (1 / MONEY_SCALE) >= product.amountQcoin,
    ...(product.purpose === 'vip'
      ? { vipDays: product.vipDays }
      : { durationDays: product.durationDays }),
  }
}

export async function quoteQcoinEntitlementPurchase({ accountId, purpose, adsPackage } = {}) {
  assertQcoinPurchaseRuntimeConfiguration()
  const uid = str(accountId)
  if (!uid) throw purchaseFailure('VERIFIED_ACCOUNT_REQUIRED', 401)
  const product = resolveQcoinPurchaseProduct({ purpose, adsPackage })
  const account = await qcoinPrimary.readAccount(uid)
  return publicQuote(product, Number(account?.balance || 0))
}

function publicPurchaseResult(receipt = {}, replay = false) {
  return {
    ok: true,
    activated: true,
    replay: replay === true,
    purchaseId: str(receipt.purchaseId),
    accountId: str(receipt.accountId),
    purpose: str(receipt.purpose),
    adsPackage: receipt.adsPackage || null,
    packageId: receipt.packageId || null,
    vipUntil: receipt.vipUntil || null,
    amountUsd: Number(receipt.amountUsd || 0),
    amountQcoin: Number(receipt.amountQcoin || 0),
    balanceQcoin: Number(receipt.balanceAfterQcoin || 0),
    currency: str(receipt.currency || 'USD'),
  }
}

async function notifyPurchase(receipt) {
  const db = await database()
  const collection = db.collection(PURCHASE_COLLECTION)
  const current = await collection.findOne({ _id: receipt._id }).catch(() => null)
  if (current?.supportNotifiedAt) return

  try {
    if (receipt.purpose === 'vip') {
      await notifyQl7VipActivated({
        userId: receipt.accountId,
        userAliases: [],
        until: receipt.vipUntil,
        paymentId: receipt.purchaseId,
        activatedAt: receipt.completedAt,
      })
    } else {
      await notifyQl7AdsActivated({
        userId: receipt.accountId,
        packageName: receipt.adsPackage,
        campaign: `qcoin:${receipt.purchaseId}`,
        invoiceId: receipt.packageId,
        activatedAt: receipt.completedAt,
      })
    }
    await collection.updateOne(
      { _id: receipt._id, supportNotifiedAt: { $exists: false } },
      { $set: { supportNotifiedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
    )
  } catch (error) {
    console.warn('[qcoin-entitlement-purchase:notification]', error?.message || error)
  }
}

export async function purchaseEntitlementWithQcoin({
  actor,
  purpose,
  adsPackage,
  clientRequestId,
  request = null,
} = {}) {
  assertQcoinPurchaseRuntimeConfiguration()
  const accountId = str(actor?.canonicalAccountId)
  if (!actor?.valid || !accountId) throw purchaseFailure('VERIFIED_SESSION_REQUIRED', 401)

  const requestId = str(clientRequestId)
  if (!/^[A-Za-z0-9:_-]{8,160}$/.test(requestId)) {
    throw purchaseFailure('INVALID_PURCHASE_REQUEST_ID', 400)
  }

  const product = resolveQcoinPurchaseProduct({ purpose, adsPackage })
  const purchaseHash = hash(`${accountId.toLowerCase()}|${product.productKey}|${requestId}`)
  const purchaseId = `qcp_${purchaseHash.slice(0, 32)}`
  const recordId = `qcoin-purchase:${purchaseId}`
  const debitEventId = `${purchaseId}:debit`
  const entitlementEventId = `${purchaseId}:entitlement`

  // Index creation is deliberately completed before opening the transaction;
  // MongoDB does not allow a transaction to own collection/index DDL safely.
  await ensurePurchaseStorage()

  const transactionResult = await transactionContext.withMongoTransaction(async () => {
    const db = await database()
    const purchases = db.collection(PURCHASE_COLLECTION)
    const existing = await purchases.findOne({ _id: recordId })
    if (existing?.status === 'completed') {
      return { receipt: existing, replay: true }
    }

    const quote = await quoteQcoinEntitlementPurchase({
      accountId,
      purpose: product.purpose,
      adsPackage: product.adsPackage,
    })
    if (!quote.sufficient) {
      throw purchaseFailure('INSUFFICIENT_QCOIN', 409, {
        balanceQcoin: quote.balanceQcoin,
        requiredQcoin: quote.amountQcoin,
      })
    }

    const sourceEvidence = {
      purchaseId,
      actorReceiptId: str(actor.actorReceiptId),
      authMode: str(actor.authMode),
      productKey: product.productKey,
      amountUsd: product.amountUsd,
      amountQcoin: product.amountQcoin,
      qcoinRate: QCOIN_PER_USD,
      pricingOwner: product.purpose === 'ads' ? 'lib/adsCore.js' : 'PLAN_PRICE_USD',
      clientRequestHash: hash(requestId),
    }

    const debit = await economicRoute.executeVerifiedEconomicOperation({
      routeId: 'qcoin.entitlement.purchase.debit',
      operationType: 'debit',
      actorAccountId: accountId,
      targetAccountId: accountId,
      amount: product.amountQcoin,
      currency: 'QCOIN',
      entitlementId: product.entitlementId,
      orderId: purchaseId,
      sourceEventId: debitEventId,
      idempotencyKey: debitEventId,
      sourceType: 'qcoin-purchase',
      sourceOwner: 'lib/qcoinEntitlementPurchase.js',
      sourceEvidence,
      deterministicProof: true,
      request,
      writer: (decisionReceipt) => qcoinPrimary.debitBalanceIfSufficient({
        uid: accountId,
        amount: product.amountQcoin,
        eventKind: product.purpose === 'vip' ? 'qcoin_vip_purchase' : 'qcoin_ads_purchase',
        route: '/api/pay/qcoin-purchase',
        economicRouteId: 'qcoin.entitlement.purchase.debit',
        sourceEventId: debitEventId,
        idempotencyKey: debitEventId,
        decisionReceipt,
        meta: {
          purchaseId,
          productKey: product.productKey,
          amountUsd: product.amountUsd,
          qcoinRate: QCOIN_PER_USD,
        },
      }),
    })

    let entitlement = null
    if (product.purpose === 'vip') {
      const activation = await economicRoute.executeVerifiedEconomicOperation({
        routeId: 'vip.qcoin.activation',
        operationType: 'entitlement_extend',
        actorAccountId: accountId,
        targetAccountId: accountId,
        amount: product.vipDays,
        currency: 'QCOIN',
        entitlementId: 'vip',
        orderId: purchaseId,
        sourceEventId: entitlementEventId,
        idempotencyKey: entitlementEventId,
        sourceType: 'qcoin-purchase',
        sourceOwner: 'lib/qcoinEntitlementPurchase.js',
        sourceEvidence: { ...sourceEvidence, vipDays: product.vipDays },
        deterministicProof: true,
        request,
        writer: (decisionReceipt) => addVipDays(accountId, product.vipDays, {
          paymentId: purchaseId,
          economicRouteId: 'vip.qcoin.activation',
          operationType: 'entitlement_extend',
          idempotencyKey: entitlementEventId,
          decisionReceipt,
          notify: false,
        }),
      })
      entitlement = activation.result
    } else {
      const deterministicPackageId = `pkg_qcoin_${purchaseHash.slice(0, 36)}`
      const activation = await economicRoute.executeVerifiedEconomicOperation({
        routeId: 'ads.qcoin.activation',
        operationType: 'entitlement_activate',
        actorAccountId: accountId,
        targetAccountId: accountId,
        amount: product.durationDays,
        currency: 'QCOIN',
        entitlementId: product.entitlementId,
        packageId: product.adsPackage,
        orderId: purchaseId,
        sourceEventId: entitlementEventId,
        idempotencyKey: entitlementEventId,
        sourceType: 'qcoin-purchase',
        sourceOwner: 'lib/qcoinEntitlementPurchase.js',
        sourceEvidence: { ...sourceEvidence, durationDays: product.durationDays },
        deterministicProof: true,
        request,
        writer: (decisionReceipt) => grantAdsPackageForAccount({
          accountId,
          pkgType: product.adsPackage,
          packageId: deterministicPackageId,
          note: `qcoin:${purchaseId}`,
          economicRouteId: 'ads.qcoin.activation',
          operationType: 'entitlement_activate',
          idempotencyKey: entitlementEventId,
          decisionReceipt,
          notify: false,
        }),
      })
      entitlement = activation.result
    }

    const completedAt = new Date().toISOString()
    const receipt = {
      _id: recordId,
      purchaseId,
      status: 'completed',
      accountId,
      authMode: str(actor.authMode),
      actorReceiptId: str(actor.actorReceiptId),
      purpose: product.purpose,
      productKey: product.productKey,
      adsPackage: product.adsPackage,
      packageId: entitlement?.id || null,
      vipUntil: entitlement?.until || null,
      vipDays: product.vipDays || null,
      durationDays: product.durationDays || null,
      amountUsd: product.amountUsd,
      amountQcoin: product.amountQcoin,
      currency: product.currency,
      qcoinRate: QCOIN_PER_USD,
      balanceBeforeQcoin: quote.balanceQcoin,
      balanceAfterQcoin: Number(debit.result?.balance || 0),
      debitEventId,
      entitlementEventId,
      clientRequestHash: hash(requestId),
      completedAt,
      createdAt: completedAt,
      updatedAt: completedAt,
      storagePrimary: 'mongo',
    }
    await purchases.insertOne(receipt)
    return { receipt, replay: false }
  })

  await notifyPurchase(transactionResult.receipt)
  return publicPurchaseResult(transactionResult.receipt, transactionResult.replay)
}

export const qcoinEntitlementPurchaseConstants = Object.freeze({
  QCOIN_PER_USD,
  PURCHASE_COLLECTION,
})
