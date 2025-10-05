// app/api/forum/events/stream/route.js
// SSE-хаб: мгновенно ретранслирует локальные события (bus) и меж-инстансные (Redis Pub/Sub)

import { Redis } from '@upstash/redis'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = (process.env.VERCEL === '1') ? 'edge' : 'nodejs'

// --- подключенные клиенты SSE ---
const clients = new Set()

function write(controller, obj) {
  try {
    controller.enqueue(`data: ${JSON.stringify(obj)}\n\n`)
  } catch {
    /* no-op */
  }
}

function broadcast(evt) {
  for (const c of clients) write(c, evt)
}

// Локальные события из mutate (через процессную шину) — увидеть сразу
bus.on((evt) => broadcast(evt))

// --- Redis subscription (однократно на процесс/инстанс) ---
let subscribed = false
let subRunning = false

async function ensureSubscribed() {
  if (subscribed || subRunning) return
  subRunning = true

  const tryLoop = async () => {
    for (;;) {
      try {
        const redis = Redis.fromEnv()
        await redis.subscribe('forum:events', (raw) => {
          try {
            const evt = typeof raw === 'string' ? JSON.parse(raw) : raw
            broadcast(evt)
          } catch {
            /* no-op */
          }
        })
        subscribed = true
        subRunning = false
        return
      } catch (e) {
        // временная ошибка/разрыв — подождём и попробуем снова
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  tryLoop().finally(() => {
    subRunning = false
  })
}

export async function GET(req) {
  await ensureSubscribed()

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller)
      write(controller, { type: 'connected', ts: Date.now() })

      // heartbeat по протоколу SSE (комментарии)
      const hb = setInterval(() => {
        try {
          controller.enqueue(`:hb ${Date.now()}\n\n`)
        } catch {
          /* no-op */
        }
      }, 15000)

      const close = () => {
        clearInterval(hb)
        clients.delete(controller)
        try {
          controller.close()
        } catch {
          /* no-op */
        }
      }

      // закрытие по аборту запроса/разрыву сети
      const { signal } = req
      if (signal) {
        if (signal.aborted) close()
        else signal.addEventListener('abort', close, { once: true })
      }
    },
    cancel() {
      // no-op
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'connection': 'keep-alive',
    },
  })
}
