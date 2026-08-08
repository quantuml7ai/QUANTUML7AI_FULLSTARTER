import { getMetaMarketItem } from '../_catalog.js'
import { ensureItemState, listOwners } from '../_db.js'
import { requireMetaMarketUser } from '../_identity.js'
import { clampLimit, errorCode, errorStatus, jsonError, jsonOk } from '../_format.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    await requireMetaMarketUser(req)
    const itemId = String(searchParams.get('itemId') || '').trim()
    const item = getMetaMarketItem(itemId)
    if (!item) return jsonError('item_not_found', 404)
    await ensureItemState(item)
    const limit = clampLimit(searchParams.get('limit'), 50, 100)
    const cursor = String(searchParams.get('cursor') || '').trim()
    const payload = await listOwners(item.itemId, {
      limit,
      cursor,
    })

    return jsonOk(payload)
  } catch (error) {
    return jsonError(errorCode(error), errorStatus(error))
  }
}
