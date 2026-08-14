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

export async function POST(req) {
  const body = await safeJson(req)
  try {
    const actor = await battleChatAuth.requireBattleChatActor(req, body)
    const result = await battleChatPrimary.toggleBattleChatLike({
      actor,
      messageId: body?.messageId,
      like: body?.like !== false,
    })
    if (!result?.ok) return noStore(result, { status: result?.status || 400 })
    await battleChatEvents.publishBattleChatEvent({
      type: 'battlecoin-chat-reaction',
      message: result.message,
      syncToken: result.syncToken || '',
    })
    return noStore(result)
  } catch (error) {
    return noStore({
      ok: false,
      error: error?.message || 'battlecoin_chat_reaction_failed',
      storagePrimary: 'mongo',
    }, { status: statusFor(error) })
  }
}
