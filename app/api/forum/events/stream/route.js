// app/api/forum/events/stream/route.js
export const runtime    = 'edge';
export const dynamic    = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { Redis } from '@upstash/redis';

// 🔔 ВАЖНО: этот маршрут рассчитан на Edge (Vercel). В деве он тоже работает.
// Локальный process-bus на Edge недоступен — работаем через Redis Pub/Sub.

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const write = (s) => controller.enqueue(encoder.encode(s));
      const send  = (evt) => write(`data: ${JSON.stringify(evt)}\n\n`);
      const hb    = () => write(`:hb ${Date.now()}\n\n`);

      // немедленный connect-событие — чтобы curl/EventSource увидел живой стрим
      send({ type: 'connected', ts: Date.now() });

      // heartbeat каждые 15с (держит соединение «тёплым» у прокси)
      const hbId = setInterval(hb, 15000);

      // Подписка на Redis Pub/Sub
      let unsubscribe = null;
      (async () => {
        try {
          const redis = Redis.fromEnv();
          unsubscribe = await redis.subscribe('forum:events', (raw) => {
            let evt = raw;
            try { if (typeof raw === 'string') evt = JSON.parse(raw) } catch {}
            try { send(evt) } catch {}
          });
        } catch (e) {
          // можно вывести разовый тех. эвент, чтобы видеть, что подписка не удалась
          write(`event: warn\ndata: ${JSON.stringify({ msg: 'subscribe_failed', err: String(e?.message || e) })}\n\n`);
        }
      })();

      // Закрытие
      const close = () => {
        clearInterval(hbId);
        try { unsubscribe && unsubscribe() } catch {}
        try { controller.close() } catch {}
      };

      // В Edge ReadableStream нет oncancel — завершим по return
      // Возвращаем функцию, которую Next вызовет при обрыве клиента
      return close;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      // Ни gzip, ни proxy-буферизацию
      'X-Accel-Buffering': 'no'
    }
  });
}
