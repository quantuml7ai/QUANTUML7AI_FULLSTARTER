// app/api/dm/send/route.js
import { bad, json, requireUserId } from '../../forum/_utils.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
import { createDmMessage } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request) {
  let body = null
  try { body = await request.json() } catch { body = null }

  let senderId = ''
  try {
    senderId = String(requireUserId(request, body) || '').trim()
  } catch (err) {
    return bad(err?.message || 'missing_user_id', err?.status || 401)
  }

  const rawTo = String(body?.to || '').trim()
  if (!rawTo) return bad('missing_to')

  const senderAccountId = await resolveCanonicalAccountId(senderId)
  const toAccountId = await resolveCanonicalAccountId(rawTo)
  if (!toAccountId) return bad('bad_to')
  if (String(senderAccountId) === String(toAccountId)) {
    return bad('dm_self_send_forbidden')
  }

  const text = String(body?.text || '').trim().slice(0, 4000)
  const attachments = Array.isArray(body?.attachments)
    ? body.attachments.map((x) => String(x || '').trim()).filter(Boolean)
    : []

  if (!text && !attachments.length) return bad('empty_message')

  const msg = await createDmMessage({
    from: senderAccountId,
    to: toAccountId,
    text,
    attachments,
  })

  return json({ ok: true, id: msg.id, ts: msg.ts })
}
