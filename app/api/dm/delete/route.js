// app/api/dm/delete/route.js
import { getMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'

const toStr = (v) => String(v ?? '').trim()

export async function POST(req) {
  const body = await req.json().catch(() => null)
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

      await dmPrimary.deleteMessage(msgId)
      return ok({ deleted: true, id: msgId, storagePrimary: 'mongo' })
    }

    if (action === 'dialog') {
      const rawWithInput = toStr(body?.with || body?.userId || body?.peer)
      const rawWith = normalizeRawUserId(rawWithInput)
      const withId = await canonicalizeUserId(rawWithInput || rawWith)
      if (!withId) return bad('missing_with', 400)
      await addAliasesFor(withId, [rawWithInput, rawWith])

      const deleteDialogForAll = body?.deleteForAll !== false
      if (!deleteDialogForAll) return ok({ localOnly: true })

      const meIds = await expandAliasIds([me, rawMeHeader, rawMe])
      const withIds = await expandAliasIds([withId, rawWithInput, rawWith])
      const result = await dmPrimary.deleteDialog({
        meIds,
        withIds,
        deletedAt: Date.now(),
      })

      return ok({
        deleted: true,
        count: Number(result?.count || 0),
        deletedAt: Number(result?.deletedAt || Date.now()),
        storagePrimary: 'mongo',
      })
    }

    return bad('bad_action', 400)
  } catch (e) {
    return bad(e?.message || 'delete_failed', e?.status || 500)
  }
}
