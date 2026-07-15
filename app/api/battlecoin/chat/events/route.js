import battleChatEvents from '@/lib/battlecoin/battle-chat-events.cjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()

export async function GET(req) {
  let removeClient = null
  let heartbeat = null
  let lifetime = null
  let closed = false

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
          try { removeClient?.() } catch {}
        }
      }

      removeClient = battleChatEvents.addBattleChatSseClient(send)
      send(battleChatEvents.serializeSse('battlecoin-chat-ready', {
        ok: true,
        channel: 'global',
        storagePrimary: 'mongo',
        redisRole: 'pubsub-accelerator-only',
        ts: Date.now(),
      }))

      heartbeat = setInterval(() => {
        send(battleChatEvents.serializeSse('battlecoin-chat-heartbeat', {
          ok: true,
          ts: Date.now(),
        }))
      }, battleChatEvents.constants.BATTLE_CHAT_SSE_HEARTBEAT_MS)

      lifetime = setTimeout(() => {
        closed = true
        try { removeClient?.() } catch {}
        try { controller.close() } catch {}
      }, battleChatEvents.constants.BATTLE_CHAT_SSE_LIFETIME_MS)
    },
    cancel() {
      closed = true
      if (heartbeat) clearInterval(heartbeat)
      if (lifetime) clearTimeout(lifetime)
      try { removeClient?.() } catch {}
    },
  })

  req.signal?.addEventListener?.('abort', () => {
    closed = true
    if (heartbeat) clearInterval(heartbeat)
    if (lifetime) clearTimeout(lifetime)
    try { removeClient?.() } catch {}
  }, { once: true })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
