import { getMetaMarketItem, serializeCatalogItem } from '../_catalog.js'
import { ensureItemState, listOwnedItems } from '../_db.js'
import { requireMetaMarketUser } from '../_identity.js'
import { clampLimit, dynamicPriceMicro, errorCode, errorStatus, jsonError, jsonOk, microToQcoin } from '../_format.js'

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
    const items = []
    for (const row of page.rows) {
      const item = getMetaMarketItem(row.itemId)
      if (!item) continue
      const state = await ensureItemState(item)
      const currentPriceMicro = dynamicPriceMicro(item, state)
      items.push(serializeCatalogItem(item, state, {
        count: Number(row.count || 0),
        basePriceQcoin: microToQcoin(state.priceMicro),
        sellPriceQcoin: microToQcoin(Math.floor((currentPriceMicro * state.sellRateBps) / 10000)),
        canSell: !!state.sellEnabled,
        canGift: !!state.giftEnabled,
      }))
    }
    const payload = {
      items,
      totalUniqueItems: page.totalUniqueItems,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    }

    return jsonOk(payload)
  } catch (error) {
    return jsonError(errorCode(error), errorStatus(error))
  }
}
