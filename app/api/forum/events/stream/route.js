// app/api/forum/events/stream/route.js
// SSE-хаб: мгновенно ретранслирует локальные события (bus) и меж-инстансные (Redis Pub/Sub)

import { Redis } from '@upstash/redis'
import { bus, instanceId } from '../../_bus.js'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = (process.env.VERCEL === '1') ? 'edge' : 'nodejs'

// --- подключенные клиенты SSE ---
const clients = new Set()

function safeEnqueue(controller, chunk) {
  try { controller.enqueue(typeof chunk === 'string' ? chunk : String(chunk)) }
  catch { clients.delete(controller) }
}

function write(controller, obj) {
  safeEnqueue(controller, `data: ${JSON.stringify(obj)}\n\n`)
}

// ЕДИНСТВЕННАЯ функция broadcast
function broadcast(evt) {
  const payload = `data: ${JSON.stringify(evt)}\n\n`
  for (const c of Array.from(clients)) safeEnqueue(c, payload)
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
            if (evt && evt.origin && evt.origin === instanceId) return
            broadcast(evt)
          } catch {
            /* no-op */
          }
        })
        subscribed = true
        subRunning = false
        return
      } catch {
        // временная ошибка/разрыв — подождём и попробуем снова
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  tryLoop().finally(() => { subRunning = false })
}

export async function GET(req) {
  await ensureSubscribed()

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller)

      // подсказка клиенту о времени повторного коннекта
      safeEnqueue(controller, `retry: 1000\n\n`)
      write(controller, { type: 'connected', ts: Date.now() })

      // heartbeat по протоколу SSE (комментарии), чтобы соединение не считалось «тихим»
      const hb = setInterval(() => {
        safeEnqueue(controller, `: ping ${Date.now()}\n\n`)
      }, 15000)

      const close = () => {
        clearInterval(hb)
        clients.delete(controller)
        try { controller.close() } catch { /* no-op */ }
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
      'cache-control': 'no-store, no-transform, max-age=0',
      'connection': 'keep-alive',
      // подсказки прокси/компрессору
      'x-no-compression': '1',
      'keep-alive': 'timeout=120',
    },
  })
}
