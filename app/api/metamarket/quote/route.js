import { requireMetaMarketUser } from '../_identity.js'
import { quoteTransaction } from '../_transactions.js'
import { errorCode, errorStatus, jsonError, jsonOk } from '../_format.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const { userId } = await requireMetaMarketUser(req)
    const quoteInput = {
      action: searchParams.get('action'),
      itemId: searchParams.get('itemId'),
      userId,
      recipientId: searchParams.get('recipientId') || '',
      quantity: searchParams.get('quantity') || 1,
    }
    const quote = await quoteTransaction(quoteInput)

    return jsonOk(quote)
  } catch (error) {
    return jsonError(errorCode(error), errorStatus(error))
  }
}
