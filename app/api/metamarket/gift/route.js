import { requireMetaMarketUser, resolveRecipientId } from '../_identity.js'
import { giftItem } from '../_transactions.js'
import { errorCode, errorStatus, jsonError } from '../_format.js'
import { sendBackgroundPush } from '../../../../lib/webPush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  let body = {}
  try {
    body = await req.json().catch(() => ({}))
    const { userId } = await requireMetaMarketUser(req, body)
    const result = await giftItem({
      userId,
      itemId: body?.itemId,
      recipientId: body?.recipientId,
      quantity: body?.quantity,
      tokenId: body?.tokenId || '',
      idempotencyKey: body?.idempotencyKey,
      source: body?.source,
      req,
    })
    try {
      const recipientId = await resolveRecipientId(body?.recipientId)
      if (recipientId) {
        await sendBackgroundPush(recipientId, {
          source: 'metamarket_gifts',
          dedupeKey: `gift:${String(result?.txId || body?.idempotencyKey || '')}`,
        })
      }
    } catch {}
    return Response.json(result)
  } catch (error) {
    return jsonError(errorCode(error), errorStatus(error))
  }
}
