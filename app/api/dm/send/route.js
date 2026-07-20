// app/api/dm/send/route.js
import { nextMsgId, saveMessage, normalizeMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import { sendBackgroundPush } from '../../../../lib/webPush.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'
import { assertNotQl7SupportSender, isQl7SupportId, normalizeQl7SupportText } from '../../../../lib/ql7-support/systemActor.js'
import { createQl7SupportUserMessage } from '../../../../lib/ql7-support/server.js'
import { maybeRunQl7SupportDmBroadcastCommand } from '../../../../lib/ql7-support/broadcast.js'

export async function POST(req) {
  const body = await req.json().catch(() => null)
  try {
    const from = await requireUserIdCanonical(req, body)
    assertNotQl7SupportSender(from)
    const rawFromHeader = String(getUserIdFromReq(req, body) || '').trim()
    const rawFromInput = String(body?.fromRaw || body?.rawFrom || rawFromHeader || '').trim()
    const rawFrom = normalizeRawUserId(rawFromInput)
    const rawToInput = String(body?.toRaw || body?.rawTo || body?.to || '').trim()
    const rawTo = normalizeRawUserId(rawToInput)
    const to = await canonicalizeUserId(rawToInput || rawTo)
    if (!to) return bad('missing_to', 400)
    if (String(from) === String(to)) return bad('self_send', 400)

    if (isQl7SupportId(to)) {
      const attachments = Array.isArray(body?.attachments) ? body.attachments : []
      if (attachments.length) return bad('ql7_support_text_only', 400)
      const text = normalizeQl7SupportText(body?.text || '')
      if (!text) return bad('ql7_support_text_required', 400)
      const broadcastCommand = await maybeRunQl7SupportDmBroadcastCommand({
        fromUserId: from,
        rawFromIds: [rawFromInput, rawFrom],
        text,
        locale: body?.locale || req?.headers?.get?.('x-forum-locale') || '',
      })
      if (broadcastCommand?.handled) return ok(broadcastCommand)
      const result = await createQl7SupportUserMessage({
        fromUserId: from,
        rawFromIds: [rawFromInput, rawFrom],
        text,
        locale: body?.locale || req?.headers?.get?.('x-forum-locale') || '',
      })
      return ok({
        id: result.id,
        ts: result.ts,
        storagePrimary: result.storagePrimary,
        supportThread: true,
        supportBridgeOk: result.bridge?.ok === true && result.bridge?.skipped !== true,
      })
    }

    await addAliasesFor(from, [rawFromInput, rawFrom])
    await addAliasesFor(to, [rawToInput, rawTo])

    const fromIds = await expandAliasIds([from, rawFromInput, rawFrom])
    const toIds = await expandAliasIds([to, rawToInput, rawTo])
    const isBlocked = await dmPrimary.isBlockedBy([to], fromIds)
    if (isBlocked) return ok({ ok: false, error: 'blocked_by_receiver' }, 200)

    const id = await nextMsgId()
    const msg = normalizeMessage({
      id,
      from,
      to,
      text: body?.text || '',
      attachments: Array.isArray(body?.attachments) ? body.attachments : [],
      ts: Date.now(),
    })

    await saveMessage(msg)
    await dmPrimary.addMessageIndexes({
      msg,
      fromIds,
      toIds,
      score: Number(msg.ts || Date.now()),
    })

    await sendBackgroundPush(to, {
      source: 'messenger_messages',
      dedupeKey: `dm:${id}`,
      itemId: id,
    }).catch(() => {})

    return ok({ id, ts: msg.ts, storagePrimary: 'mongo' })
  } catch (e) {
    return bad(e?.message || 'send_failed', e?.status || 500)
  }
}
