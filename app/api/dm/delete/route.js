// app/api/dm/delete/route.js
import { getMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import { NOTIFICATION_SOURCES } from '../../../../lib/notificationCenter.js'
import { publishStoredNotificationImpulse } from '../../../../lib/webPush.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'

const toStr = (v) => String(v ?? '').trim()

async function publishDmDeleteImpulse(entries = [], reason = 'dm_delete') {
  const list = Array.isArray(entries) ? entries : []
  const jobs = []
  const seen = new Set()
  for (const entry of list) {
    const value = entry && typeof entry === 'object' ? entry : { userId: entry }
    const userId = String(value.userId || '').trim()
    if (!userId) continue
    const key = [
      userId,
      String(value.peerId || ''),
      String(value.messageId || ''),
      value.dialog === true ? 'dialog' : 'message',
    ].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    jobs.push(publishStoredNotificationImpulse(userId, {
      source: NOTIFICATION_SOURCES.MESSENGER_MESSAGES,
      count: 0,
      totalCount: 0,
      forceSync: true,
      reason,
      dmDeletedMessageId: value.messageId,
      dmDeletedPeerId: value.peerId,
      dmDeletedDialog: value.dialog === true,
    }))
  }
  if (!jobs.length) return
  await Promise.allSettled(jobs)
}

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
      await publishDmDeleteImpulse([
        { userId: from, peerId: to, messageId: msgId },
        { userId: to, peerId: from, messageId: msgId },
      ], 'dm_message_delete_for_all')
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
      await publishDmDeleteImpulse([
        { userId: me, peerId: withId, dialog: true },
        { userId: withId, peerId: me, dialog: true },
      ], 'dm_dialog_delete_for_all')

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
