// app/api/forum/events/stream/route.js
// SSE-хаб: мгновенно ретранслирует локальные события (bus) и меж-инстансные (Redis Pub/Sub)

import { Redis } from '@upstash/redis'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'edge'

const clients = new Set()
const heartbeats = new Map() // controller -> interval id

function sseChunk(evt) {
  const e = (evt && typeof evt === 'object') ? evt : { message: String(evt || '') }
  const lines = []
  // поддержка Last-Event-ID
  if (Number.isFinite(+e.rev)) lines.push(`id: ${+e.rev}`)
  if (typeof e.type === 'string') lines.push(`event: ${e.type}`)
  lines.push(`data: ${JSON.stringify(e)}`)
  return lines.join('\n') + '\n\n'
}

function safeEnqueue(controller, chunk) {
  try { controller.enqueue(chunk) } catch { clients.delete(controller) }
}

function write(controller, obj) {
  safeEnqueue(controller, sseChunk(obj))
}

// ЕДИНСТВЕННАЯ функция broadcast
function broadcast(evt) {
  const chunk = sseChunk(evt)
  for (const c of Array.from(clients)) safeEnqueue(c, chunk)
}

// Локальные события из mutate (через процессную шину) — увидеть сразу
bus.on((evt) => {
  const e = (evt && typeof evt === 'object') ? evt : { message: String(evt || '') }
  if (e.ts == null) e.ts = Date.now()
  broadcast(e)
})

// --- Redis subscription (однократно на процесс/инстанс) ---
let subscribed = false
let subRunning = false

async function ensureSubscribed() {
  if (subscribed || subRunning) return
  subRunning = true

  const tryLoop = async () => {
    for (;;) {
      try {
        // В Edge нужны REST-переменные Upstash: UPSTASH_REDIS_REST_URL/TOKEN
        const redis = Redis.fromEnv()
        await redis.subscribe('forum:events', (raw) => {
          try {
            const evt = typeof raw === 'string' ? JSON.parse(raw) : raw
            broadcast(evt)
          } catch { /* no-op */ }
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

      safeEnqueue(controller, `retry: 1000\n\n`) 
      write(controller, { type: 'connected', ts: Date.now() }) 
      // heartbeat по протоколу SSE (комментарии), чтобы соединение не считалось «тихим»
      const hb = setInterval(() => {
        safeEnqueue(controller, `: ping ${Date.now()}\n\n`)
      }, 15000)
       heartbeats.set(controller, hb)
      const close = () => {
        try { clearInterval(heartbeats.get(controller)) } catch {}
        heartbeats.delete(controller)        
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
      // симметричный клинап при явной отмене потока
     // (в ряде рантаймов сюда тоже попадаем)
      try { clearInterval(heartbeats.get(this)) } catch {}
      // у ReadableStream нет this=controller, поэтому пройдёмся по набору
      for (const c of Array.from(clients)) {
        try { clearInterval(heartbeats.get(c)) } catch {}
        heartbeats.delete(c)
        clients.delete(c)
      }
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
