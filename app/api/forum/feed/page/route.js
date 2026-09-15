import { createRequire } from 'node:module'
import { withRouteTelemetry } from '@/lib/runtime/routeTelemetry'

const require = createRequire(import.meta.url)
const { readForumFeedPage } = require('../../../../../lib/forum/forum-server-page-reader.cjs')

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

function telemetryVariant(input = {}) {
  return String(input?.mode || '').trim().toLowerCase() === 'world' ? 'world' : 'geo'
}

async function readPage(req, input) {
  return withRouteTelemetry({
    route: 'api.forum.feed.page',
    method: req?.method || 'GET',
    variant: telemetryVariant(input),
  }, async (telemetry) => {
    try {
      const payload = await readForumFeedPage({ request: req, input })
      telemetry.setResultCount(payload?.count ?? payload?.items?.length)
      return json(payload)
    } catch (error) {
      return json({ ok: false, kind: 'ql7-forum-feed-page-error', error: String(error?.message || error), code: error?.code || null }, 500)
    }
  })
}

export async function POST(req) {
  return readPage(req, await readJson(req))
}

export async function GET(req) {
  return readPage(req, inputFromUrl(req))
}
