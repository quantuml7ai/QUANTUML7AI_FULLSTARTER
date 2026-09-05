import { getMetaMarketItem, serializeCatalogItem } from '../_catalog.js'
import { ensureItemStates, listOwnedItems } from '../_db.js'
import { requireMetaMarketUser } from '../_identity.js'
import { clampLimit, dynamicPriceMicro, errorCode, errorStatus, jsonError, jsonOk, microToQcoin, publicErrorCode } from '../_format.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const { userId } = await requireMetaMarketUser(req)
    const limit = clampLimit(searchParams.get('limit'), 50, 100)
    const cursor = String(searchParams.get('cursor') || '').trim()
    const page = await listOwnedItems(userId, {
      limit,
      cursor,
    })
    const rowsWithItems = page.rows
      .map((row) => ({ row, item: getMetaMarketItem(row.itemId) }))
      .filter(({ item }) => !!item)
    const stateMap = await ensureItemStates(rowsWithItems.map(({ item }) => item))
    const items = rowsWithItems.map(({ row, item }) => {
      const state = stateMap.get(item.itemId) || {}
      const currentPriceMicro = dynamicPriceMicro(item, state)
      return serializeCatalogItem(item, state, {
        count: Number(row.count || 0),
        basePriceQcoin: microToQcoin(state.priceMicro),
        sellPriceQcoin: microToQcoin(Math.floor((currentPriceMicro * state.sellRateBps) / 10000)),
        canSell: !!state.sellEnabled,
        canGift: !!state.giftEnabled,
      })
    })
    const payload = {
      items,
      totalUniqueItems: page.totalUniqueItems,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    }

    return jsonOk(payload)
  } catch (error) {
    console.error('metamarket_my_collection_failed', { code: errorCode(error) })
    return jsonError(publicErrorCode(error), errorStatus(error))
  }
}
