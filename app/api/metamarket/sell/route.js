import { requireMetaMarketUser } from '../_identity.js'
import { sellItem } from '../_transactions.js'
import { errorCode, errorStatus, jsonError } from '../_format.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  let body = {}
  try {
    body = await req.json().catch(() => ({}))
    const { userId } = await requireMetaMarketUser(req, body)
    const result = await sellItem({
      userId,
      itemId: body?.itemId,
      quantity: body?.quantity,
      tokenId: body?.tokenId || '',
      idempotencyKey: body?.idempotencyKey,
      source: body?.source,
      req,
    })
    return Response.json(result)
  } catch (error) {
    return jsonError(errorCode(error), errorStatus(error))
  }
}
