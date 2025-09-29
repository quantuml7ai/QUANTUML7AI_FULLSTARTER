import { json, bad } from '../_utils.js'
import { snapshot } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const since = parseInt(url.searchParams.get('since') || '0', 10) || 0
    const res = await snapshot(since)
    return json(res)
  } catch (err) {
    console.error('snapshot error', err)
    return bad('internal_error', 500)
  }
}
