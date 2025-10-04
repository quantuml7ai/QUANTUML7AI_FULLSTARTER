// app/api/forum/events/stream/route.js
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

let clients = new Set()

function write(ctrl, obj) {
  try {
    ctrl.enqueue(`data: ${JSON.stringify(obj)}\n\n`)
  } catch {}
}

export async function GET(req) {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller)
      write(controller, { type: 'connected', ts: Date.now() })

      // heartbeat
      const hb = setInterval(() => {
        // если контроллер уже закрыт — просто выходим
        try { controller.enqueue(`:hb ${Date.now()}\n\n`) } catch {}
      }, 1500)

      // закрытие соединения
      const close = () => {
        clearInterval(hb)
        clients.delete(controller)
        try { controller.close() } catch {}
      }

      // если абортнули запрос
      const signal = req.signal
      if (signal) {
        if (signal.aborted) close()
        else signal.addEventListener('abort', close, { once: true })
      }
    },
    cancel() {
      // тут нас тоже могут закрыть — без ошибок
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

// общая “шина”: вызвать из mutate
export function broadcast(evt) {
  for (const c of clients) write(c, evt)
}
