// app/api/dm/send/route.js
import { nextMsgId, saveMessage, normalizeMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import { sendBackgroundPush } from '../../../../lib/webPush.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'

export async function POST(req) {
  const body = await req.json().catch(() => null)
  try {
    const from = await requireUserIdCanonical(req, body)
    const rawFromHeader = String(getUserIdFromReq(req, body) || '').trim()
    const rawFromInput = String(body?.fromRaw || body?.rawFrom || rawFromHeader || '').trim()
    const rawFrom = normalizeRawUserId(rawFromInput)
    const rawToInput = String(body?.toRaw || body?.rawTo || body?.to || '').trim()
    const rawTo = normalizeRawUserId(rawToInput)
    const to = await canonicalizeUserId(rawToInput || rawTo)
    if (!to) return bad('missing_to', 400)
    if (String(from) === String(to)) return bad('self_send', 400)

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
    }).catch(() => {})

    return ok({ id, ts: msg.ts, storagePrimary: 'mongo' })
  } catch (e) {
    return bad(e?.message || 'send_failed', e?.status || 500)
  }
}
