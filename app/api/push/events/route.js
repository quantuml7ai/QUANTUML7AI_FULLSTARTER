import { Redis } from '@upstash/redis'
import { requireUserIdCanonical } from '../../dm/_utils.js'
import { notificationImpulseChannel } from '../../../../lib/webPush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const maxDuration = 60

const encoder = new TextEncoder()
const STREAM_MAX_LIFETIME_MS = 50_000
const HEARTBEAT_MS = 15_000

function enqueue(controller, value) {
  try {
    controller.enqueue(encoder.encode(String(value)))
    return true
  } catch {
    return false
  }
}

export async function GET(req) {
  let userId = ''
  try {
    userId = await requireUserIdCanonical(req)
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error?.message || 'push_events_unauthorized') },
      { status: error?.status || 401 },
    )
  }

  const subscriber = Redis.fromEnv().subscribe(notificationImpulseChannel(userId))
  let cleanup = () => {}

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let heartbeat = null
      let lifetime = null

      const close = () => {
        if (closed) return
        closed = true
        clearInterval(heartbeat)
        clearTimeout(lifetime)
        subscriber.removeAllListeners()
        subscriber.unsubscribe().catch(() => {})
        try { controller.close() } catch {}
      }
      const onMessage = ({ message }) => {
        let payload = message
        try {
          if (typeof message === 'string') payload = JSON.parse(message)
        } catch {
          return
        }
        enqueue(controller, `data: ${JSON.stringify(payload)}\n\n`)
      }
      const onError = () => close()

      cleanup = close
      subscriber.on('message', onMessage)
      subscriber.on('error', onError)
      enqueue(controller, `event: ready\ndata: {"ok":true}\n\n`)
      heartbeat = setInterval(() => {
        if (!enqueue(controller, `: pulse ${Date.now()}\n\n`)) close()
      }, HEARTBEAT_MS)
      lifetime = setTimeout(() => close(), STREAM_MAX_LIFETIME_MS)

      if (req.signal?.aborted) close()
      else req.signal?.addEventListener('abort', close, { once: true })
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-transform, max-age=0',
      'connection': 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
