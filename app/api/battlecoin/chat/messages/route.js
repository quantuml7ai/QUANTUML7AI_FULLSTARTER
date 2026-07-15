import { NextResponse } from 'next/server'
import battleChatAuth from '@/lib/auth/battlecoin-chat-auth.cjs'
import battleChatPrimary from '@/lib/mongo/battlecoin-chat-primary.cjs'
import battleChatEvents from '@/lib/battlecoin/battle-chat-events.cjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function noStore(data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'cache-control': 'no-store, no-cache, must-revalidate',
      ...(init.headers || {}),
    },
  })
}

async function safeJson(req) {
  try {
    return await req.json()
  } catch {
    return {}
  }
}

function statusFor(error, fallback = 500) {
  const status = Number(error?.status || error?.statusCode || fallback)
  return Number.isFinite(status) && status >= 400 && status <= 599 ? status : fallback
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const actor = await battleChatAuth.readOptionalBattleChatActor(req, {}).catch(() => null)
    const viewerAccountId = actor?.accountId || ''
    const limit = url.searchParams.get('limit') || undefined
    const after = String(url.searchParams.get('after') || '').trim()
    const data = after
      ? await battleChatPrimary.listBattleChatDelta({ since: after, limit, viewerAccountId })
      : await battleChatPrimary.listBattleChatMessages({ limit, viewerAccountId })
    return noStore(data)
  } catch (error) {
    return noStore({
      ok: false,
      error: error?.message || 'battlecoin_chat_messages_failed',
      storagePrimary: 'mongo',
    }, { status: statusFor(error) })
  }
}

export async function POST(req) {
  const body = await safeJson(req)
  try {
    const actor = await battleChatAuth.requireBattleChatActor(req, body)
    const result = await battleChatPrimary.sendBattleChatMessage({
      actor,
      text: body?.text,
      clientMutationId: body?.clientMutationId,
    })
    if (!result?.ok) {
      return noStore(result, { status: result?.status || 400 })
    }
    await battleChatEvents.publishBattleChatEvent({
      type: 'battlecoin-chat-message',
      message: result.message,
      syncToken: result.syncToken || '',
    })
    return noStore(result)
  } catch (error) {
    return noStore({
      ok: false,
      error: error?.message || 'battlecoin_chat_send_failed',
      storagePrimary: 'mongo',
    }, { status: statusFor(error) })
  }
}
