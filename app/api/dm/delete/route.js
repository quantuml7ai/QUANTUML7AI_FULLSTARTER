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
      const meIdList = Array.from(meIds).map(String).filter(Boolean)
      const withIdList = Array.from(withIds).map(String).filter(Boolean)
      const meIdSet = new Set(meIdList)
      const withIdSet = new Set(withIdList)
      const threadKeys = new Set()
      for (const a of meIdSet) for (const b of withIdSet) threadKeys.add(K.threadZ(a, b))

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

      const collectMailboxIds = async (uids) => {
        const out = new Set()
        const list = Array.from(uids || []).map(String).filter(Boolean)
        if (!list.length) return out
        const pipe = redis.multi()
        for (const uid of list) {
          pipe.zrange(K.inboxZ(uid), 0, -1)
          pipe.zrange(K.outboxZ(uid), 0, -1)
        }
        const raw = await pipe.exec().catch(() => null)
        const rows = Array.isArray(raw) ? raw.map((v) => (v?.result ?? v)) : []
        for (const row of rows) {
          if (!Array.isArray(row)) continue
          for (const id of row) {
            const mid = String(id || '').trim()
            if (mid) out.add(mid)
          }
        }
        return out
      }

      // fallback: если thread-index рассинхронизирован, чистим и по inbox/outbox пересечению участников
      const meMailboxIds = await collectMailboxIds(meIdSet)
      const withMailboxIds = await collectMailboxIds(withIdSet)
      const candidateMsgIds = new Set(msgIdSet)
      for (const id of meMailboxIds) {
        if (withMailboxIds.has(id)) candidateMsgIds.add(id)
      }

      if (candidateMsgIds.size) {
        const checks = await Promise.all(
          Array.from(candidateMsgIds).map(async (id) => {
            const msg = await getMessage(id).catch(() => null)
            return { id, msg }
          })
        )
        for (const it of checks) {
          const from = String(it?.msg?.from || '').trim()
          const to = String(it?.msg?.to || '').trim()
          if (!from || !to) continue
          const between =
            (meIdSet.has(from) && withIdSet.has(to)) ||
            (meIdSet.has(to) && withIdSet.has(from))
          if (between) msgIdSet.add(String(it.id))
        }
      }

      const pipe = redis.multi()
      for (const key of threadKeys) pipe.del(key)
      for (const a of meIdSet) {
        for (const b of withIdSet) {
          pipe.del(K.lastSeen(a, b))
          pipe.del(K.lastSeen(b, a))
        }
      }
      for (const id of msgIdSet) {
        pipe.del(K.msgKey(id))
        pipe.del(K.delivered(id))
        for (const uid of meIdSet) { pipe.zrem(K.inboxZ(uid), id); pipe.zrem(K.outboxZ(uid), id) }
        for (const uid of withIdSet) { pipe.zrem(K.inboxZ(uid), id); pipe.zrem(K.outboxZ(uid), id) }
      }
      await pipe.exec()

      return ok({ deleted: true, count: msgIdSet.size })
    }

    return bad('bad_action', 400)
  } catch (e) {
    return bad(e?.message || 'delete_failed', e?.status || 500)
  }
}
