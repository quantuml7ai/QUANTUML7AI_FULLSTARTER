import { K, redis, getMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'

const toStr = (v) => String(v ?? '').trim()

export async function POST(req) {
  let body = null
  try { body = await req.json() } catch {}
  try {
    const me = await requireUserIdCanonical(req, body)
    const rawMeHeader = toStr(getUserIdFromReq(req, body))
    const rawMe = normalizeRawUserId(rawMeHeader)
    await addAliasesFor(me, [rawMeHeader, rawMe])

    const action = toStr(body?.action || body?.type || (body?.messageId ? 'message' : 'dialog'))
    const deleteForAll = !!body?.deleteForAll

    if (action === 'message') {
      const msgId = toStr(body?.messageId || body?.id)
      if (!msgId) return bad('missing_message', 400)
      if (!deleteForAll) return ok({ localOnly: true })

      const msgRaw = await getMessage(msgId)
      if (!msgRaw?.id) return bad('not_found', 404)
      const from = await canonicalizeUserId(msgRaw.from)
      const to = await canonicalizeUserId(msgRaw.to)
      const meIds = new Set(await expandAliasIds([me, rawMeHeader, rawMe]))
      const fromIds = new Set(await expandAliasIds([from, msgRaw.from]))
      const toIds = new Set(await expandAliasIds([to, msgRaw.to]))

      let isParticipant = false
      for (const id of fromIds) if (meIds.has(String(id))) { isParticipant = true; break }
      if (!isParticipant) for (const id of toIds) if (meIds.has(String(id))) { isParticipant = true; break }
      if (!isParticipant) return bad('forbidden', 403)

      const threadKeys = new Set()
      for (const a of fromIds) for (const b of toIds) threadKeys.add(K.threadZ(a, b))

      const pipe = redis.multi()
      for (const uid of toIds) pipe.zrem(K.inboxZ(uid), msgId)
      for (const uid of fromIds) pipe.zrem(K.outboxZ(uid), msgId)
      for (const key of threadKeys) pipe.zrem(key, msgId)
      pipe.del(K.msgKey(msgId))
      pipe.del(K.delivered(msgId))
      await pipe.exec()

      return ok({ deleted: true, id: msgId })
    }

    if (action === 'dialog') {
      const rawWithInput = toStr(body?.with || body?.userId || body?.peer)
      const rawWith = normalizeRawUserId(rawWithInput)
      const withId = await canonicalizeUserId(rawWithInput || rawWith)
      if (!withId) return bad('missing_with', 400)
      await addAliasesFor(withId, [rawWithInput, rawWith])

      if (!deleteForAll) return ok({ localOnly: true })

      const meIds = new Set(await expandAliasIds([me, rawMeHeader, rawMe]))
      const withIds = new Set(await expandAliasIds([withId, rawWithInput, rawWith]))
      const threadKeys = new Set()
      for (const a of meIds) for (const b of withIds) threadKeys.add(K.threadZ(a, b))

      const canonicalThread = K.threadZ(me, withId)
      const msgIdSet = new Set()
      const canonicalList = await redis.zrange(canonicalThread, 0, -1).catch(() => null)
      if (Array.isArray(canonicalList)) canonicalList.forEach((id) => msgIdSet.add(String(id)))
      if (!msgIdSet.size && threadKeys.size) {
        const keyList = Array.from(threadKeys).filter((k) => k !== canonicalThread)
        const ranges = await Promise.all(keyList.map((k) => redis.zrange(k, 0, -1).catch(() => null)))
        for (const list of ranges) {
          if (!Array.isArray(list)) continue
          for (const id of list) msgIdSet.add(String(id))
        }
      }

      const pipe = redis.multi()
      for (const key of threadKeys) pipe.del(key)
      for (const id of msgIdSet) {
        pipe.del(K.msgKey(id))
        pipe.del(K.delivered(id))
        for (const uid of meIds) { pipe.zrem(K.inboxZ(uid), id); pipe.zrem(K.outboxZ(uid), id) }
        for (const uid of withIds) { pipe.zrem(K.inboxZ(uid), id); pipe.zrem(K.outboxZ(uid), id) }
      }
      await pipe.exec()

      return ok({ deleted: true, count: msgIdSet.size })
    }

    return bad('bad_action', 400)
  } catch (e) {
    return bad(e?.message || 'delete_failed', e?.status || 500)
  }
}
