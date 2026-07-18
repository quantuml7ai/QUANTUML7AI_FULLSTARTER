// app/api/dm/seen/route.js
import { addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, parseIntSafe, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import { markPushItemsRead, publishNotificationImpulse, publishStoredNotificationImpulse } from '../../../../lib/webPush.js'
import { NOTIFICATION_SOURCES } from '../../../../lib/notificationCenter.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'

export async function POST(req) {
  const body = await req.json().catch(() => null)
  try {
    const me = await requireUserIdCanonical(req, body)
    const rawMeHeader = String(getUserIdFromReq(req, body) || '').trim()
    const rawMe = normalizeRawUserId(rawMeHeader)
    const rawWithInput = String(body?.with || '').trim()
    const rawWith = normalizeRawUserId(rawWithInput)
    const withId = await canonicalizeUserId(rawWithInput || rawWith)
    const lastSeenTs = parseIntSafe(body?.lastSeenTs, 0)
    if (!withId) return bad('missing_with', 400)

    await addAliasesFor(me, [rawMeHeader, rawMe])
    await addAliasesFor(withId, [rawWithInput, rawWith])
    const meIds = await expandAliasIds([me, rawMeHeader, rawMe])
    const withIds = await expandAliasIds([withId, rawWithInput, rawWith])
    const currentMax = await dmPrimary.readLastSeenMax(meIds, withIds)
    const nextSeenTs = Math.max(Number(lastSeenTs || 0), Number(currentMax || 0))
    const newlySeenMessageIds = nextSeenTs > Number(currentMax || 0)
      ? await dmPrimary.listIncomingMessageIdsForSeenWindow(meIds, withIds, currentMax, nextSeenTs)
      : []
    await dmPrimary.markSeenForPairs(meIds, withIds, nextSeenTs)
    if (nextSeenTs > Number(currentMax || 0)) {
      if (newlySeenMessageIds.length) {
        const pushState = await markPushItemsRead(me, {
          [NOTIFICATION_SOURCES.MESSENGER_MESSAGES]: newlySeenMessageIds,
        }).catch(() => null)
        if (pushState) {
          await publishStoredNotificationImpulse(me, {
            source: NOTIFICATION_SOURCES.MESSENGER_MESSAGES,
            count: pushState?.counts?.[NOTIFICATION_SOURCES.MESSENGER_MESSAGES] || 0,
            totalCount: pushState?.totalCount || 0,
            forceSync: true,
            reason: 'dm_messages_seen',
          }).catch(() => {})
        }
      }
      await publishNotificationImpulse(withId, {
        source: NOTIFICATION_SOURCES.MESSENGER_MESSAGES,
        count: 0,
        totalCount: 0,
        forceSync: true,
        reason: 'dm_seen_receipt',
      }).catch(() => {})
    }

    return ok({ with: withId, lastSeenTs: Number(nextSeenTs || 0), storagePrimary: 'mongo' })
  } catch (e) {
    return bad(e?.message || 'seen_failed', e?.status || 500)
  }
}
