import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { readForumMediaFeedPage } = require('../../../../../lib/forum/forum-server-page-reader.cjs')

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-ql7-read-source': status < 400 ? 'mongo_projection_index' : 'mongo_projection_index_error',
      ...extraHeaders,
    },
  })
}

function inputFromUrl(req) {
  const { searchParams } = new URL(req.url)
  return Object.fromEntries(searchParams.entries())
}

async function readJson(req) {
  try { return await req.json() } catch { return {} }
}

export async function POST(req) {
  try {
    const body = await readJson(req)
    const payload = await readForumMediaFeedPage({ request: req, input: body })
    return json(payload)
  } catch (error) {
    return json({ ok: false, kind: 'ql7-forum-media-feed-page-error', error: String(error?.message || error), code: error?.code || null }, 500)
  }
}

export async function GET(req) {
  try {
    const payload = await readForumMediaFeedPage({ request: req, input: inputFromUrl(req) })
    return json(payload)
  } catch (error) {
    return json({ ok: false, kind: 'ql7-forum-media-feed-page-error', error: String(error?.message || error), code: error?.code || null }, 500)
  }
}
