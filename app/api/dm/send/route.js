// app/api/dm/send/route.js
import { nextMsgId, saveMessage, normalizeMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import { sendBackgroundPush } from '../../../../lib/webPush.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { assertNotQl7SupportSender, isQl7SupportId, normalizeQl7SupportText } from '../../../../lib/ql7-support/systemActor.js'
import { isQl7SupportActive } from '../../../../lib/ql7-support/featureFlag.js'
import { createQl7SupportUserMessage, getQl7SupportRuntimeStateForUser } from '../../../../lib/ql7-support/server.js'
import { maybeRunQl7SupportDmBroadcastCommand } from '../../../../lib/ql7-support/broadcast.js'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import { evaluateQl7SupportInputAttempt } from '../../../../lib/ql7-support/inputPolicy.js'
import { ql7SupportContainsUserUrlV9 } from '../../../../lib/ql7-support/turnSemanticFrameV9.js'
import { assertQl7SupportUserInputV11 } from '../../../../lib/ql7-support/limitsV11.js'
import { hasQl7SupportChoiceSelectionAttemptV11, sanitizeQl7SupportChoiceTransportV11 } from '../../../../lib/ql7-support/choiceContractV11.js'

function str(value) { return String(value ?? '').trim() }

async function supportDatabase() {
  const handle = await mongoClient.getMongoDb()
  return handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
}

export async function POST(req) {
  const body = await req.json().catch(() => null)
  try {
    const rawToInput = str(body?.toRaw || body?.rawTo || body?.to)
    const rawTo = normalizeRawUserId(rawToInput)
    const to = await canonicalizeUserId(rawToInput || rawTo)
    if (!to) return bad('missing_to', 400)

    if (isQl7SupportId(to)) {
      if (!isQl7SupportActive()) return bad('ql7_support_disabled', 404)
      const attachments = Array.isArray(body?.attachments) ? body.attachments : []
      if (attachments.length) return bad('ql7_support_text_only', 400)
      const text = normalizeQl7SupportText(body?.text || '')
      const inputValidation = assertQl7SupportUserInputV11(text, { locale: str(body?.locale || req?.headers?.get?.('x-forum-locale') || 'en') })
      const database = await supportDatabase()
      const actor = await resolveQl7VerifiedActor({ req, body: body || {}, database })
      if (!actor?.valid || !actor?.canonicalAccountId) return bad(actor?.failureCode || 'verified_session_required', 401)
      const from = str(actor.canonicalAccountId)
      assertNotQl7SupportSender(from)
      const runtimeState = await getQl7SupportRuntimeStateForUser({ userId: from }).catch(() => null)
      const routeContextInput = body?.routeContext && typeof body.routeContext === 'object' ? body.routeContext : {}
      const rawSupportChoice = body?.supportChoice && typeof body.supportChoice === 'object' ? body.supportChoice : null
      const supportChoice = sanitizeQl7SupportChoiceTransportV11(rawSupportChoice)
      if (hasQl7SupportChoiceSelectionAttemptV11(rawSupportChoice) && !str(supportChoice?.signedToken)) {
        return bad('ql7_support_choice_token_required', 400)
      }
      const requestedLocale = str(routeContextInput?.preferredLocale || routeContextInput?.documentLang || body?.locale || req?.headers?.get?.('x-forum-locale'))
      const inputAttempt = evaluateQl7SupportInputAttempt({
        policy: runtimeState?.inputPolicy || { canSend: true },
        text,
        locale: requestedLocale,
      })
      if (!inputAttempt.allowed) {
        return ok({
          ok: false,
          error: 'ql7_support_input_paused',
          supportThread: true,
          inputPolicy: inputAttempt.policy,
          caseId: str(runtimeState?.caseId),
          correlationId: str(runtimeState?.correlationId || body?.correlationId || body?.clientMutationId),
        }, 429)
      }
      const rawFromHeader = str(getUserIdFromReq(req, body))
      const rawFromInput = str(body?.fromRaw || body?.rawFrom || rawFromHeader)
      const rawFrom = normalizeRawUserId(rawFromInput)
      const locale = requestedLocale
      const broadcastCommand = await maybeRunQl7SupportDmBroadcastCommand({
        fromUserId: from,
        rawFromIds: [rawFromInput, rawFrom, ...(actor.aliases || [])],
        text,
        locale,
      })
      if (broadcastCommand?.handled) return ok({ ...broadcastCommand, correlationId: str(body?.correlationId || body?.clientMutationId) })
      if (ql7SupportContainsUserUrlV9(text)) return bad('ql7_support_url_forbidden', 400)
      const result = await createQl7SupportUserMessage({
        actor,
        fromUserId: from,
        rawFromIds: [rawFromInput, rawFrom, ...(actor.aliases || [])],
        text,
        locale,
        clientMutationId: str(body?.clientMutationId),
        correlationId: str(body?.correlationId || body?.clientMutationId),
        routeContext: {
          ...routeContextInput,
          inputGraphemes: inputValidation.graphemes,
          supportChoice,
        },
      })
      return ok({
        id: result.id,
        ts: result.ts,
        deduped: result.deduped === true,
        pending: result.pending === true,
        storagePrimary: result.storagePrimary,
        supportThread: true,
        supportBridgeOk: result.bridge?.ok !== false,
        supportBridgeSkipped: result.bridge?.skipped === true,
        caseId: result.caseId || '',
        role: result.requestRole || '',
        subIntent: result.requestSubIntent || '',
        caseStatus: result.caseStatus || '',
        diagnosticStatus: result.diagnosticStatus || '',
        correlationId: result.correlationId || str(body?.correlationId || body?.clientMutationId),
        clientMutationId: result.clientMutationId || str(body?.clientMutationId),
        replyMessageId: str(result.autoReply?.id),
        inputPolicy: result.inputPolicy || null,
        ecosystemRating: result.ecosystemRating || null,
      })
    }

    const from = await requireUserIdCanonical(req, body)
    assertNotQl7SupportSender(from)
    if (String(from) === String(to)) return bad('self_send', 400)
    const rawFromHeader = str(getUserIdFromReq(req, body))
    const rawFromInput = str(body?.fromRaw || body?.rawFrom || rawFromHeader)
    const rawFrom = normalizeRawUserId(rawFromInput)

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
    await dmPrimary.addMessageIndexes({ msg, fromIds, toIds, score: Number(msg.ts || Date.now()) })
    await sendBackgroundPush(to, { source: 'messenger_messages', dedupeKey: `dm:${id}`, itemId: id }).catch(() => {})
    return ok({ id, ts: msg.ts, storagePrimary: 'mongo' })
  } catch (e) {
    console.error('[QL7_SUPPORT_SEND_FAILED]', {
      code: String(e?.code || e?.message || 'send_failed').slice(0, 160),
      status: Number(e?.status || 500),
    })
    const status = Number(e?.status || 500)
    const safeCode = status >= 500 ? 'ql7_support_temporarily_unavailable' : String(e?.message || 'send_failed')
    return bad(safeCode, status)
  }
}
