import { NextResponse } from 'next/server'
import battleChatAuth from '@/lib/auth/battlecoin-chat-auth.cjs'
import battleChatPrimary from '@/lib/mongo/battlecoin-chat-primary.cjs'
import battleChatEvents from '@/lib/battlecoin/battle-chat-events.cjs'
import composerGate from '@/lib/composer-safety/serverGate.cjs'
import restrictionGuard from '@/lib/account-restrictions/businessActionGuard.cjs'

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
      ? await battleChatPrimary.listBattleChatDelta({ since: after, limit, viewerAccountId, viewerIdentityIds: actor?.identityIds || [] })
      : await battleChatPrimary.listBattleChatMessages({ limit, viewerAccountId, viewerIdentityIds: actor?.identityIds || [] })
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
  let composer = null
  let composerPrepared = false
  let stage = 'authenticate'
  try {
    const actor = await battleChatAuth.requireBattleChatActor(req, body)
    const accountId = String(actor?.accountId || '').trim()
    stage = 'read_business_restriction'
    const restriction = await restrictionGuard.guardBusinessAction({ accountId, actionId: 'battle_chat.send' })
    if (!restriction.allowed) return noStore(restriction, { status: restriction.status || 423 })
    stage = 'evaluate_composer_policy'
    composer = await composerGate.evaluateComposerSubmit({
      actorAccountId: accountId,
      surface: 'battle_chat',
      text: body?.text,
      targeted: true,
      clientMutationId: String(body?.clientMutationId || ''),
      locale: String(body?.locale || req.headers.get('x-forum-locale') || req.headers.get('accept-language') || 'und').split(',')[0].trim(),
      quotedRanges: Array.isArray(body?.quotedRanges) ? body.quotedRanges : [],
      conversationReferences: Array.isArray(body?.conversationReferences) ? body.conversationReferences : [],
      context: { route: '/api/battlecoin/chat/messages', conversationKind: 'battle_chat' },
    })
    if (!composer.allowed) return noStore({
      ok: false,
      error: composer.error || 'composer_send_blocked',
      composerDecision: composer.decision || 'BLOCK',
      composerClass: composer.classId || '',
      decisionId: String(composer.receipt?.decisionId || ''),
      clearSubmittedDraft: composer.clearSubmittedDraft === true,
      inputHash: String(composer.inputHash || composer.receipt?.inputHash || ''),
      clientMutationId: String(composer.clientMutationId || body?.clientMutationId || ''),
      storagePrimary: 'mongo',
    }, { status: composer.status || 403 })
    const composerDelivery = composerGate.createComposerDeliveryBinding(composer, {
      kind: 'battle_chat_message',
      operationId: String(body?.clientMutationId || composer.receipt?.decisionId || ''),
    })
    stage = 'prepare_composer_outbox'
    await composerGate.prepareComposerOutcome(composer, { delivery: composerDelivery.delivery })
    composerPrepared = composer.commitWarningAfterSend === true
    stage = 'save_message'
    const result = await battleChatPrimary.sendBattleChatMessage({
      actor,
      text: body?.text,
      clientMutationId: body?.clientMutationId,
      composerPolicyBinding: composerDelivery.documentFields,
    })
    if (!result?.ok) {
      if (composerPrepared) {
        await composerGate.cancelComposerOutcome(composer, { reason: 'battle_chat_definitive_not_sent' })
        composerPrepared = false
      }
      return noStore(result, { status: result?.status || 400 })
    }
    stage = 'commit_composer_outcome'
    const composerOutcome = await composerGate.commitComposerOutcome(composer, {
      sent: true,
      deliveryRef: { entityId: result.message?.id || result.message?.messageId, storagePrimary: 'mongo' },
    })
    let eventPending = false
    stage = 'publish_event'
    try {
      await battleChatEvents.publishBattleChatEvent({
        type: 'battlecoin-chat-message',
        message: result.message,
        syncToken: result.syncToken || '',
      })
    } catch (eventError) {
      eventPending = true
      console.error('[BATTLE_CHAT_EVENT_PUBLISH_FAILED]', {
        code: String(eventError?.code || eventError?.message || 'event_publish_failed').slice(0, 160),
        messageId: String(result.message?.id || result.message?.messageId || ''),
      })
    }
    return noStore({
      ...result,
      composerDecision: composer.decision || 'ALLOW',
      composerClass: composer.classId || '',
      composerDecisionId: String(composer.receipt?.decisionId || ''),
      warningCommitted: composerOutcome?.warningCommitted === true,
      policyOutcomePending: composerOutcome?.policyOutcomePending === true,
      eventPending,
    })
  } catch (error) {
    if (composerPrepared && composer) {
      try { await composerGate.cancelComposerOutcome(composer, { reason: `battle_chat_failed_at:${stage}` }) } catch {}
    }
    console.error('[BATTLE_CHAT_SEND_FAILED]', {
      stage,
      code: String(error?.code || error?.message || 'battlecoin_chat_send_failed').slice(0, 160),
      status: statusFor(error),
    })
    const status = statusFor(error)
    return noStore({
      ok: false,
      error: status >= 500 ? 'battlecoin_chat_temporarily_unavailable' : (error?.message || 'battlecoin_chat_send_failed'),
      storagePrimary: 'mongo',
    }, { status })
  }
}
