// app/api/forum/events/stream/route.js
// SSE-хаб: подписывается на Redis Pub/Sub (forum:events) и ретранслирует всем клиентам.

import { Redis } from '@upstash/redis'
import { bus } from '../../_bus.js'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
// ... после функции broadcast(evt) { ... }
bus.on((evt) => broadcast(evt))  // <— добавили

// --- подключенные клиенты SSE ---
const clients = new Set()

function write(ctrl, obj) {
  try {
    ctrl.enqueue(`data: ${JSON.stringify(obj)}\n\n`)
  } catch {}
}

// Экспортируем для "лучшего усилия": если в том же процессе кто-то вызовет broadcast(evt)
export function broadcast(evt) {
  for (const c of clients) write(c, evt)
}

// --- Redis subscription (однократно на процесс/лямбду) ---
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
          } catch {}
        })
        // если вышли из subscribe без ошибки — считаем подписанными
        subscribed = true
        subRunning = false
        return
      } catch (e) {
        // это тот самый BodyTimeout/terminated: подождём и попробуем снова
        console.warn('events_stream_subscribe_retry', e?.code || e?.message || String(e))
        await new Promise(r => setTimeout(r, 3000))
        // цикл повторится
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
      write(controller, { type: 'connected', ts: Date.now() })

      // heartbeat каждые 15с (комментарий по протоколу SSE)
      const hb = setInterval(() => {
        try { controller.enqueue(`:hb ${Date.now()}\n\n`) } catch {}
      }, 15000)

      const close = () => {
        clearInterval(hb)
        clients.delete(controller)
        try { controller.close() } catch {}
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
