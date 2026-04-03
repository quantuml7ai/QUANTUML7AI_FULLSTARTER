import { K, redis, nextMsgId, saveMessage, normalizeMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'

const truthy = (v) => v === 1 || v === '1' || v === true

export async function POST(req) {
  let body = null
  try { body = await req.json() } catch {}
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

    const fromIds = new Set(await expandAliasIds([from, rawFromInput, rawFrom]))
    const toIds = new Set(await expandAliasIds([to, rawToInput, rawTo]))

    let isBlocked = false
    if (to && fromIds.size) {
      const pipe = redis.multi()
      for (const fid of fromIds) pipe.sismember(K.blockSet(to), fid)
      const res = await pipe.exec()
      isBlocked = (Array.isArray(res) ? res : []).some((r) => truthy(r?.result ?? r))
    }
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

    const score = Number(msg.ts || Date.now())
    const threadKeys = new Set()
    for (const a of fromIds) {
      for (const b of toIds) threadKeys.add(K.threadZ(a, b))
    }
    const pipe = redis.multi()
    for (const uid of toIds) pipe.zadd(K.inboxZ(uid), { score, member: id })
    for (const uid of fromIds) pipe.zadd(K.outboxZ(uid), { score, member: id })
    for (const tkey of threadKeys) pipe.zadd(tkey, { score, member: id })
    await pipe.exec()

    return ok({ id, ts: msg.ts })
  } catch (e) {
    return bad(e?.message || 'send_failed', e?.status || 500)
  }
}
