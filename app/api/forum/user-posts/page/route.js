import { json, requireUserId } from '../../_utils.js'
import reader from '../../../../../lib/forum/forum-server-complete-reader.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function readBody(req) { try { return await req.json() } catch { return {} } }
function statusFor(error) { return Number(error?.status || error?.statusCode || 500) || 500 }
function noStore(source = 'mongo_projection_index') { return { 'cache-control': 'no-store, max-age=0', 'x-ql7-read-source': source } }

export async function POST(req) {
  try {
    const body = await readBody(req)

    const payload = await reader.readForumUserPostsPage({ request: req, input: body })
    return json(payload, 200, noStore())
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error), code: error?.code || null }, statusFor(error), noStore('mongo_projection_index_error'))
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const body = Object.fromEntries(searchParams.entries())

    const payload = await reader.readForumUserPostsPage({ request: req, input: body })
    return json(payload, 200, noStore())
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error), code: error?.code || null }, statusFor(error), noStore('mongo_projection_index_error'))
  }
}
