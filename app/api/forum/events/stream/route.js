// QL7_EDGE_SAFE_FORUM_SSE_NO_MONGO_IMPORT_V38_VERIFYFIX
// app/api/forum/events/stream/route.js
// SSE hub: relays local forum events and optional Redis Pub/Sub events.
// QL7_EDGE_SAFE_FORUM_SSE_NO_MONGO_IMPORT_V37_DIRECTFILE: Edge route must not import app/api/forum/_db.js because that file can transitively import the MongoDB Node driver.

import { Redis } from '@upstash/redis'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'edge'

const isForumSseEnabled = () => (
  String(
    process.env.FORUM_SSE_ENABLED ||
    process.env.NEXT_PUBLIC_FORUM_SSE_ENABLED ||
    ''
  ).trim() === '1'
)

const S = (globalThis.__forumSSE ||= {
  clients: new Set(),
  subscribed: false,
  subRunning: false,
  busHooked: false,
})

const encoder = new TextEncoder()
const STREAM_MAX_LIFETIME_MS = 55_000
const BASE_RETRY_MS = 30_000
const MAX_RETRY_MS = 30_000

function safeEnqueue(controller, chunk) {
  try {
    const str = typeof chunk === 'string' ? chunk : String(chunk)
    controller.enqueue(encoder.encode(str))
  } catch {
    S.clients.delete(controller)
  }
}

function write(controller, obj) {
  safeEnqueue(controller, `data: ${JSON.stringify(obj)}\n\n`)
}

function broadcast(evt) {
  const chunk = `data: ${JSON.stringify(evt)}\n\n`
  for (const c of Array.from(S.clients)) safeEnqueue(c, chunk)
}

async function readForumRevEdgeSafe(req) {
  try {
    const url = new URL('/api/forum/rev', req.url)
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json().catch(() => null)
    const n = parseInt(String(data?.rev ?? '0'), 10)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

if (!S.busHooked) {
  try {
    bus.on((evt) => broadcast(evt))
    S.busHooked = true
  } catch {
    // no-op
  }
}

async function ensureSubscribed() {
  if (S.subscribed || S.subRunning) return
  S.subRunning = true

  const loop = async () => {
    let attempt = 0
    for (;;) {
      try {
        const redis = Redis.fromEnv()
        await redis.subscribe('forum:events', (raw) => {
          try {
            const evt = typeof raw === 'string' ? JSON.parse(raw) : raw
            broadcast(evt)
          } catch {
            // ignore malformed payloads
          }
        })
      } catch {
        attempt = Math.min(attempt + 1, 10)
        const jitter = Math.floor(Math.random() * 750)
        const waitMs = Math.min(MAX_RETRY_MS, BASE_RETRY_MS) + jitter
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        continue
      }

      attempt = Math.min(attempt + 1, 10)
      const jitter = Math.floor(Math.random() * 750)
      const waitMs = Math.min(MAX_RETRY_MS, BASE_RETRY_MS) + jitter
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }

  try {
    S.subscribed = true
    loop().finally(() => { S.subRunning = false })
  } catch {
    S.subRunning = false
  }
}

export async function GET(req) {
  if (!isForumSseEnabled()) {
    return new Response(null, {
      status: 204,
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    })
  }

  await ensureSubscribed()

  const stream = new ReadableStream({
    async start(controller) {
      S.clients.add(controller)
      safeEnqueue(controller, `retry: 30000\n\n`)

      let rev = await readForumRevEdgeSafe(req)
      write(controller, { type: 'connected', rev, ts: Date.now() })

      const hb = setInterval(() => {
        safeEnqueue(controller, `: ping ${Date.now()}\n\n`)
      }, 15000)

      let closed = false
      let maxLife = null
      const close = () => {
        if (closed) return
        closed = true
        clearInterval(hb)
        if (maxLife) clearTimeout(maxLife)
        S.clients.delete(controller)
        try { controller.close() } catch { /* no-op */ }
      }

      maxLife = setTimeout(() => {
        try {
          write(controller, { type: 'reconnect', rev, ts: Date.now() })
        } catch {}
        close()
      }, STREAM_MAX_LIFETIME_MS)

      const { signal } = req
      if (signal) {
        if (signal.aborted) close()
        else signal.addEventListener('abort', close, { once: true })
      }
    },
    cancel() {
      // controller cleanup is handled by close/abort path
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-transform, max-age=0',
      connection: 'keep-alive',
      'x-no-compression': '1',
      'keep-alive': 'timeout=120',
    },
  })
}
