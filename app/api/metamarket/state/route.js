import { getUsersPublicMini } from '../../forum/_db.js'
import { isVipNow } from '../../../../lib/subscriptions.js'
import {
  getMetaMarketItem,
  listMetaMarketCollections,
  listMetaMarketItems,
  serializeCatalogCollection,
  serializeCatalogItem,
} from '../_catalog.js'
import {
  ensureItemStates,
  getUserItemCounts,
  listOwnedItems,
  readQcoinBalanceMicro,
} from '../_db.js'
import { requireMetaMarketUser, resolveRecipientId } from '../_identity.js'
import { dynamicPriceMicro, errorCode, errorStatus, jsonError, jsonOk, microToQcoin, publicErrorCode } from '../_format.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'


// QL7_METAMARKET_STATE_FAST_MONGO_PRIMARY_V10_BEGIN
function ql7MetaMarketStateFastPrimaryAllowedV10() {
  // QL7_MONGO_PERMANENT_CODE_POLICY_V16: MetaMarket state fast Mongo-primary is permanent.
  return true
}

function ql7MetaShortErrorV10(error) {
  const message = String(error?.message || error?.code || error || '').replace(/\s+/g, ' ').slice(0, 240)
  return message || ''
}

function ql7ApplyMetaMarketStateHeadersV10(response, { readSource, fallbackReason = 'none', error = null, durationMs = null, timings = null } = {}) {
  try {
    response.headers.set('x-ql7-read-source', String(readSource || 'unknown'))
    response.headers.set('x-ql7-mongo-primary-guard', 'ql7-metamarket-state-fast-primary-v10')
    response.headers.set('x-ql7-mongo-primary-fallback-reason', String(fallbackReason || 'none'))
    response.headers.set('x-ql7-metamarket-fast-primary', ql7MetaMarketStateFastPrimaryAllowedV10() ? 'true' : 'false')
    if (durationMs != null) response.headers.set('x-ql7-mongo-primary-duration-ms', String(durationMs))
    if (timings && typeof timings === 'object') {
      const serverTiming = Object.entries(timings)
        .filter(([, value]) => Number.isFinite(Number(value)))
        .map(([name, value]) => `${String(name).replace(/[^a-zA-Z0-9_-]/g, '_')};dur=${Math.max(0, Number(value)).toFixed(1)}`)
        .join(', ')
      if (serverTiming) response.headers.set('server-timing', serverTiming)
    }
    if (error) response.headers.set('x-ql7-mongo-primary-error', ql7MetaShortErrorV10(error))
  } catch {}
  return response
}
// QL7_METAMARKET_STATE_FAST_MONGO_PRIMARY_V10_END

function summarizeCollections(stateMap) {
  const out = []
  for (const collection of listMetaMarketCollections()) {
    const items = listMetaMarketItems(collection.id)
    let marketAvailable = 0
    let totalSupply = 0
    for (const item of items) {
      const state = stateMap.get(item.itemId) || {}
      marketAvailable += Number(state.marketAvailable || 0)
      totalSupply += Number(state.totalSupply || 0)
    }
    out.push(serializeCatalogCollection(collection, {
      itemCount: items.length,
      totalSupply,
      marketAvailable,
    }))
  }
  return out
}

function serializeOwnedRows(rows, stateMap, ownedCountMap) {
  const out = []
  for (const row of rows) {
    const item = getMetaMarketItem(row.itemId)
    if (!item) continue
    const state = stateMap.get(item.itemId) || {}
    const currentPriceMicro = dynamicPriceMicro(item, state)
    out.push(serializeCatalogItem(item, state, {
      count: Number(row.count || 0),
      basePriceQcoin: microToQcoin(state.priceMicro),
      sellPriceQcoin: microToQcoin(Math.floor((currentPriceMicro * state.sellRateBps) / 10000)),
      canSell: !!state.sellEnabled,
      canGift: !!state.giftEnabled,
      ownedCount: Number(ownedCountMap.get(item.itemId) || 0),
    }))
  }
  return out
}

async function hydrateRecipient(rawRecipientId) {
  const recipientId = await resolveRecipientId(rawRecipientId)
  if (!recipientId) return null
  const [profile] = await getUsersPublicMini([recipientId]).catch(() => [])
  const vip = await isVipNow(recipientId).catch(() => ({ active: false }))
  return {
    userId: recipientId,
    nickname: profile?.nickname || '',
    icon: profile?.icon || '',
    avatar: profile?.icon || '',
    vipActive: !!vip?.active,
  }
}

async function timed(timings, name, fn) {
  const startedAt = Date.now()
  try {
    return await fn()
  } finally {
    timings[name] = Date.now() - startedAt
  }
}

export async function GET(req) {
  const startedAt = Date.now()
  const timings = {}
  try {
    const { searchParams } = new URL(req.url)
    const { userId } = await timed(timings, 'identity', () => requireMetaMarketUser(req))
    const balanceMicro = await timed(timings, 'balance', () => readQcoinBalanceMicro(userId))
    const ownedPage = await timed(timings, 'owned', () => listOwnedItems(userId, { limit: 50, cursor: '' }))

    const allItems = listMetaMarketCollections().flatMap((collection) => listMetaMarketItems(collection.id))
    const stateMap = await timed(timings, 'item_states', () => ensureItemStates(allItems))
    const ownedCountMap = await timed(timings, 'owned_counts', () => getUserItemCounts(userId, ownedPage.rows.map((row) => row.itemId)))
    const recipient = searchParams.get('recipientId')
      ? await timed(timings, 'recipient', () => hydrateRecipient(searchParams.get('recipientId')))
      : null

    const serializeStartedAt = Date.now()
    const payload = {
      viewerId: userId,
      balanceQcoin: microToQcoin(balanceMicro),
      collections: summarizeCollections(stateMap),
      marketState: {},
      ownedSummary: {
        items: serializeOwnedRows(ownedPage.rows, stateMap, ownedCountMap),
        totalUniqueItems: ownedPage.totalUniqueItems,
        nextCursor: ownedPage.nextCursor,
        hasMore: ownedPage.hasMore,
      },
      recipient,
    }
    timings.serialize = Date.now() - serializeStartedAt

    const response = jsonOk(payload)
    return ql7ApplyMetaMarketStateHeadersV10(response, {
      readSource: 'mongo_primary',
      fallbackReason: 'none',
      durationMs: Date.now() - startedAt,
      timings,
    })
  } catch (error) {
    console.error('metamarket_state_failed', { code: errorCode(error) })
    return jsonError(publicErrorCode(error), errorStatus(error))
  }
}
