import {
  getMetaMarketCollection,
  listMetaMarketItems,
  serializeCatalogItem,
} from '../_catalog.js'
import { ensureItemStates, getUserItemCounts } from '../_db.js'
import { requireMetaMarketUser } from '../_identity.js'
import { clampLimit, decodeCursor, encodeCursor, errorCode, errorStatus, jsonError, jsonOk, publicErrorCode } from '../_format.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const { userId } = await requireMetaMarketUser(req)
    const collectionId = String(searchParams.get('collectionId') || '').trim()
    const collection = getMetaMarketCollection(collectionId)
    if (!collection) return jsonError('collection_not_found', 404)

    const limit = clampLimit(searchParams.get('limit'), 50, 100)
    const offset = Math.max(0, Number(decodeCursor(searchParams.get('cursor'))?.offset || 0))
    const allItems = listMetaMarketItems(collection.id)
    const page = allItems.slice(offset, offset + limit)
    const stateMap = await ensureItemStates(page)
    const ownedCountMap = await getUserItemCounts(userId, page.map((item) => item.itemId))
    const items = page.map((item) => serializeCatalogItem(
      item,
      stateMap.get(item.itemId) || {},
      { ownedCount: Number(ownedCountMap.get(item.itemId) || 0) },
    ))
    const nextOffset = offset + limit
    const payload = {
      collectionId: collection.id,
      items,
      nextCursor: nextOffset < allItems.length ? encodeCursor({ offset: nextOffset }) : null,
      hasMore: nextOffset < allItems.length,
    }

    return jsonOk(payload)
  } catch (error) {
    console.error('metamarket_collection_failed', { code: errorCode(error) })
    return jsonError(publicErrorCode(error), errorStatus(error))
  }
}
