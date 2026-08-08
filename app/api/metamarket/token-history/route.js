import { getUsersPublicMini } from '../../forum/_db.js'
import { isVipNow } from '../../../../lib/subscriptions.js'
import { getMetaMarketItem, serializeCatalogItem } from '../_catalog.js'
import { readToken, listTokenHistory, listUserHistory } from '../_db.js'
import { requireMetaMarketUser } from '../_identity.js'
import { clampLimit, errorCode, errorStatus, jsonError, jsonOk, microToQcoin } from '../_format.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const MARKET_OWNER_ID = 'MARKET'

function resolveAction(event, userId) {
  const type = String(event?.type || '').toUpperCase()
  if (type === 'BUY') return 'buy'
  if (type === 'SELL') return 'sell'
  if (type === 'GIFT') {
    return String(event?.toOwnerId || '') === userId && String(event?.actorId || '') !== userId ? 'receive' : 'gift'
  }
  return 'event'
}

function resolveCounterpartyId(event, userId) {
  const type = String(event?.type || '').toUpperCase()
  const actor = String(event?.actorId || '').trim()
  const from = String(event?.fromOwnerId || '').trim()
  const to = String(event?.toOwnerId || '').trim()
  if (type === 'BUY') return from && from !== MARKET_OWNER_ID ? from : ''
  if (type === 'SELL') return to && to !== MARKET_OWNER_ID ? to : ''
  if (type === 'GIFT') return actor === userId ? to : from
  return actor && actor !== userId ? actor : ''
}

async function hydrateUsers(userIds) {
  const unique = [...new Set(userIds.map((id) => String(id || '').trim()).filter(Boolean))]
  if (!unique.length) return {}
  const publicUsers = await getUsersPublicMini(unique).catch(() => [])
  const vipPairs = await Promise.all(unique.map(async (userId) => {
    const vip = await isVipNow(userId).catch(() => ({ active: false }))
    return [userId, !!vip?.active]
  }))
  const vipMap = Object.fromEntries(vipPairs)
  return Object.fromEntries((publicUsers || []).map((user) => [user.userId, {
    userId: user.userId,
    nickname: user.nickname || '',
    icon: user.icon || '',
    avatar: user.icon || '',
    vipActive: !!vipMap[user.userId],
  }]))
}

function serializeHistoryEvent(event, userId, userMap) {
  const item = getMetaMarketItem(event.itemId)
  const counterpartyId = resolveCounterpartyId(event, userId)
  const quantity = Math.max(1, Math.floor(Number(event.quantity || 1) || 1))
  return {
    ...event,
    quantity,
    action: resolveAction(event, userId),
    item: item ? serializeCatalogItem(item, {}, {
      priceQcoin: microToQcoin(event.unitPriceMicro || event.priceMicro || item.priceMicro || 0),
    }) : null,
    counterparty: counterpartyId ? (userMap[counterpartyId] || { userId: counterpartyId, nickname: '', icon: '', avatar: '', vipActive: false }) : null,
    priceQcoin: microToQcoin(event.priceMicro || 0),
    unitPriceQcoin: microToQcoin(event.unitPriceMicro || event.priceMicro || 0),
    qcoinDeltaActorQcoin: microToQcoin(event.qcoinDeltaActor || 0),
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const { userId } = await requireMetaMarketUser(req)
    const tokenId = String(searchParams.get('tokenId') || '').trim()
    const limit = clampLimit(searchParams.get('limit'), 50, 100)
    const cursor = String(searchParams.get('cursor') || '').trim()

    if (!tokenId) {
      const page = await listUserHistory(userId, { limit, cursor })
      const userMap = await hydrateUsers(page.events.flatMap((event) => [
        event.actorId,
        event.fromOwnerId,
        event.toOwnerId,
      ]))
      const payload = {
        events: page.events.map((event) => serializeHistoryEvent(event, userId, userMap)),
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
      }

      return jsonOk(payload)
    }

    const token = tokenId ? await readToken(tokenId) : null
    if (!token) return jsonError('item_not_found', 404)
    const page = await listTokenHistory(tokenId, {
      limit,
      cursor,
    })
    const userMap = await hydrateUsers(page.events.flatMap((event) => [
      event.actorId,
      event.fromOwnerId,
      event.toOwnerId,
    ]))
    const payload = {
      token,
      events: page.events.map((event) => serializeHistoryEvent(event, userId, userMap)),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    }

    return jsonOk(payload)
  } catch (error) {
    return jsonError(errorCode(error), errorStatus(error))
  }
}
