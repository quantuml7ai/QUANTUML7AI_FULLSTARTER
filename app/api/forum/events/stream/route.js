// app/api/forum/events/stream/route.js
// SSE-хаб: ретранслирует локальные события (bus) и меж-инстансные (Redis Pub/Sub)
import { Redis } from '@upstash/redis'
import { bus } from '../../_bus.js'
import { redis as redisDirect, K } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'edge'

// --- singleton-объект для защиты от двойных подписок в DEV/HMR и на инстансе ---
const S = (globalThis.__forumSSE ||= {
  clients: new Set(),
  subscribed: false,
  subRunning: false,
  busHooked: false,
})

// один encoder на процесс
const encoder = new TextEncoder()

function safeEnqueue(controller, chunk) {
  try {
    const str = typeof chunk === 'string' ? chunk : String(chunk)
    controller.enqueue(encoder.encode(str)) // ← всегда байты
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

// локальные события из mutate: подписка один раз на процесс
if (!S.busHooked) {
  try {
    bus.on((evt) => broadcast(evt))
    S.busHooked = true
  } catch {
    // no-op
  }
}

// --- Redis subscription (однократно на процесс/инстанс) ---
async function ensureSubscribed() {
  if (S.subscribed || S.subRunning) return
  S.subRunning = true

  const loop = async () => {
    // бесконечный цикл переподключения (на случай разрывов)
    // Upstash Redis SDK в Edge поддерживает subscribe
    for (;;) {
      try {
        const redis = Redis.fromEnv()
        await redis.subscribe('forum:events', (raw) => {
          try {
            const evt = typeof raw === 'string' ? JSON.parse(raw) : raw
            broadcast(evt)
          } catch {
            /* ignore malformed */
          }
        })
        // если subscribe завершился (обычно не должен) — перепробуем
      } catch {
        // провал — подождём и повторим
        await new Promise((r) => setTimeout(r, 1000))
        continue
      }
      // На случай “тихого” завершения — маленькая задержка и переподписка
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  try {
    // отметим, что подписка активирована (хотя бы попытка)
    S.subscribed = true
    loop().finally(() => { S.subRunning = false })
  } catch {
    S.subRunning = false
  }
}

export async function GET(req) {
  // гарантируем подписку на канал
  await ensureSubscribed()

  const stream = new ReadableStream({
    async start(controller) {
      S.clients.add(controller)

      // подсказка клиенту о времени повторного коннекта
      safeEnqueue(controller, `retry: 1000\n\n`)

      // сразу отправим "connected" + текущую ревизию (чтобы клиент мог догнаться)
      let rev = 0
      try {
        const r = await redisDirect.get(K.rev)
        const n = parseInt(r, 10)
        rev = Number.isFinite(n) ? n : 0
      } catch {}
      write(controller, { type: 'connected', rev, ts: Date.now() })

      // heartbeat по протоколу SSE (комментарии), чтобы соединение не считалось «тихим»
      const hb = setInterval(() => {
        safeEnqueue(controller, `: ping ${Date.now()}\n\n`)
      }, 15000)

      const close = () => {
        clearInterval(hb)
        S.clients.delete(controller)
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
      // no-op (каждый контроллер удаляется в close)
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-transform, max-age=0',
      'connection': 'keep-alive',
      'x-no-compression': '1',   // подсказки прокси/компрессору
      'keep-alive': 'timeout=120',
    },
  })
}
