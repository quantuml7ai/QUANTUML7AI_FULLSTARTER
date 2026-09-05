import crypto from 'node:crypto'
// app/api/dm/send/route.js
import { nextMsgId, saveMessage, normalizeMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import { sendBackgroundPush } from '../../../../lib/webPush.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { assertNotQl7SupportSender, isQl7SupportId, normalizeQl7SupportText } from '../../../../lib/ql7-support/systemActor.js'
import { isQl7SupportActive } from '../../../../lib/ql7-support/config/featureFlag.js'
import composerGate from '../../../../lib/composer-safety/serverGate.cjs'
import restrictionGuard from '../../../../lib/account-restrictions/businessActionGuard.cjs'
import { isR2PublicUrl } from '../../../../lib/storage/r2.js'
import videoReceipt from '../../../../lib/forum/video-precommit-moderation-receipt.cjs'

let ql7SupportDmRuntimePromise = null

function loadQl7SupportDmRuntime() {
  if (!ql7SupportDmRuntimePromise) {
    ql7SupportDmRuntimePromise = Promise.all([
      import('../../../../lib/ql7-support/server.js'),
      import('../../../../lib/ql7-support/broadcast.js'),
      import('../../../../lib/ql7-support/identityResolver.js'),
      import('../../../../lib/ql7-support/http/requestGuard.js'),
      import('../../../../lib/ql7-support/http/idempotencyStore.js'),
      import('../../../../lib/ql7-support/inputPolicy.js'),
      import('../../../../lib/ql7-support/turnSemanticFrame.js'),
      import('../../../../lib/ql7-support/limits.js'),
      import('../../../../lib/ql7-support/choiceContract.js'),
    ]).then(([
      supportServer,
      supportBroadcast,
      supportIdentity,
      supportRequestGuard,
      supportIdempotency,
      supportInputPolicy,
      supportSemanticFrame,
      supportLimits,
      supportChoice,
    ]) => ({
      createQl7SupportUserMessage: supportServer.createQl7SupportUserMessage,
      getQl7SupportRuntimeStateForUser: supportServer.getQl7SupportRuntimeStateForUser,
      maybeRunQl7SupportDmBroadcastCommand: supportBroadcast.maybeRunQl7SupportDmBroadcastCommand,
      resolveQl7VerifiedActor: supportIdentity.resolveQl7VerifiedActor,
      guardQl7SupportMutation: supportRequestGuard.guardQl7SupportMutation,
      commitQl7SupportIdempotency: supportIdempotency.commitQl7SupportIdempotency,
      evaluateQl7SupportInputAttempt: supportInputPolicy.evaluateQl7SupportInputAttempt,
      ql7SupportContainsUserUrl: supportSemanticFrame.ql7SupportContainsUserUrl,
      assertQl7SupportUserInput: supportLimits.assertQl7SupportUserInput,
      hasQl7SupportChoiceSelectionAttempt: supportChoice.hasQl7SupportChoiceSelectionAttempt,
      sanitizeQl7SupportChoiceTransport: supportChoice.sanitizeQl7SupportChoiceTransport,
    })).catch((error) => {
      ql7SupportDmRuntimePromise = null
      throw error
    })
  }
  return ql7SupportDmRuntimePromise
}

function str(value) { return String(value ?? '').trim() }
function rawInputEvidence(value, locale = 'en') {
  const text = String(value ?? '')
  let graphemes = Array.from(text).length
  try { if (typeof Intl?.Segmenter === 'function') graphemes = Array.from(new Intl.Segmenter(locale || 'en', { granularity: 'grapheme' }).segment(text)).length } catch {}
  return Object.freeze({ rawInputHash: crypto.createHash('sha256').update(text).digest('hex'), rawInputByteLength: Buffer.byteLength(text, 'utf8'), rawInputGraphemeLength: graphemes })
}

async function supportDatabase() {
  const handle = await mongoClient.getMongoDb()
  return handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
}

export async function POST(req) {
  let scope = 'unresolved_dm'
  let stage = 'read_request_body'
  try {
    const body = await req.json().catch(() => null)
    stage = 'resolve_recipient'
    const rawToInput = str(body?.toRaw || body?.rawTo || body?.to)
    const rawTo = normalizeRawUserId(rawToInput)
    const to = await canonicalizeUserId(rawToInput || rawTo)
    if (!to) return bad('missing_to', 400)

    if (isQl7SupportId(to)) {
      scope = 'ql7_support_dm'
      stage = 'support_guard'
      if (!isQl7SupportActive()) return bad('ql7_support_disabled', 404)

      const {
        createQl7SupportUserMessage,
        getQl7SupportRuntimeStateForUser,
        maybeRunQl7SupportDmBroadcastCommand,
        resolveQl7VerifiedActor,
        guardQl7SupportMutation,
        commitQl7SupportIdempotency,
        evaluateQl7SupportInputAttempt,
        ql7SupportContainsUserUrl,
        assertQl7SupportUserInput,
        hasQl7SupportChoiceSelectionAttempt,
        sanitizeQl7SupportChoiceTransport,
      } = await loadQl7SupportDmRuntime()

      const attachments = Array.isArray(body?.attachments) ? body.attachments : []
      if (attachments.length) return bad('ql7_support_text_only', 400)
      const rawSupportText = String(body?.text ?? '')
      const text = normalizeQl7SupportText(rawSupportText)
      const inputValidation = assertQl7SupportUserInput(text, { locale: str(body?.locale || req?.headers?.get?.('x-forum-locale') || 'en') })
      const database = await supportDatabase()
      const actor = await resolveQl7VerifiedActor({ req, body: body || {}, database })
      if (!actor?.valid || !actor?.canonicalAccountId) return bad(actor?.failureCode || 'verified_session_required', 401)
      const from = str(actor.canonicalAccountId)
      const supportOperationId = str(body?.clientMutationId || body?.correlationId || req?.headers?.get?.('x-idempotency-key'))
      if (!supportOperationId) return bad('support_idempotency_key_required', 400)
      const requestGuard = await guardQl7SupportMutation({ req, database, actorId: from, routeId: 'dm.support-send.post', operationId: supportOperationId, payload: { to, textHash: normalizeQl7SupportText(body?.text || ''), supportChoice: body?.supportChoice || null }, rateLimit: 40, rateWindowMs: 60000 })
      if (requestGuard.idempotency.replay && requestGuard.idempotency.result) return ok(requestGuard.idempotency.result)
      assertNotQl7SupportSender(from)
      const runtimeState = await getQl7SupportRuntimeStateForUser({ userId: from }).catch(() => null)
      const routeContextInput = body?.routeContext && typeof body.routeContext === 'object' ? body.routeContext : {}
      const rawSupportChoice = body?.supportChoice && typeof body.supportChoice === 'object' ? body.supportChoice : null
      const supportChoice = sanitizeQl7SupportChoiceTransport(rawSupportChoice)
      if (hasQl7SupportChoiceSelectionAttempt(rawSupportChoice) && !str(supportChoice?.signedToken)) {
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
      if (broadcastCommand?.handled) {
        const broadcastResponse = {
          ...broadcastCommand,
          correlationId: str(body?.correlationId || body?.clientMutationId),
          clientMutationId: str(body?.clientMutationId),
          requestGuardReceiptHash: requestGuard.guardReceiptHash,
        }
        await commitQl7SupportIdempotency({ database, keyHash: requestGuard.idempotencyKeyHash, result: broadcastResponse })
        return ok(broadcastResponse)
      }
      if (ql7SupportContainsUserUrl(text)) return bad('ql7_support_url_forbidden', 400)
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
          sourceSurfaceId: 'messenger.support',
        },
        requestBoundary: requestGuard,
        rawInputEvidence: rawInputEvidence(rawSupportText, requestedLocale || 'en'),
      })
      const response = {
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
        requestGuardReceiptHash: requestGuard.guardReceiptHash,
      }
      await commitQl7SupportIdempotency({ database, keyHash: requestGuard.idempotencyKeyHash, result: response })
      return ok(response)
    }

    scope = 'ordinary_peer_dm'
    stage = 'resolve_sender'
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

    stage = 'read_business_restriction'
    const restriction = await restrictionGuard.guardBusinessAction({ accountId: from, actionId: 'dm.send' })
    if (!restriction.allowed) return bad(restriction.error || 'account_quarantined', restriction.status || 423)
    const ordinaryText = String(body?.text || '')

    const rawAttachments = Array.isArray(body?.attachments) ? body.attachments : []
    const rawVideoAttachments = rawAttachments.filter((entry) => {
      if (!entry || typeof entry !== 'object') return false
      const type = str(entry.type || entry.mime || entry.mediaType || entry.kind).toLowerCase()
      const url = str(entry.url || entry.src || entry.href || entry.file)
      return /video/.test(type) || /\.(?:mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(url)
    })
    for (const entry of rawVideoAttachments) {
      const mediaUrl = str(entry.url || entry.src || entry.href || entry.file)
      const approvalToken = str(entry.moderationApprovalToken)
      if (!isR2PublicUrl(mediaUrl) || !approvalToken) return bad('video_moderation_approval_required', 400)
      try {
        await videoReceipt.verifyVideoApprovalToken(approvalToken, { actorId: from, surface: 'dm', mediaUrl })
      } catch {
        return bad('video_moderation_approval_required', 400)
      }
    }

    const id = await nextMsgId()
    const dmOperationId = str(body?.clientMutationId) || `dm:${id}`
    stage = 'evaluate_composer_policy'
    const composer = await composerGate.evaluateComposerSubmit({
      actorAccountId: from,
      surface: 'dm',
      text: ordinaryText,
      targeted: true,
      isQl7SupportMode: false,
      clientMutationId: dmOperationId,
      locale: str(body?.locale || req.headers.get('x-forum-locale') || req.headers.get('accept-language') || 'und').split(',')[0].trim(),
      quotedRanges: Array.isArray(body?.quotedRanges) ? body.quotedRanges : [],
      conversationReferences: Array.isArray(body?.conversationReferences) ? body.conversationReferences : [str(body?.replyToId || body?.threadId)].filter(Boolean),
      context: { route: '/api/dm/send', conversationKind: 'ordinary_dm' },
    })
    if (!composer.allowed) return ok({
      ok: false,
      error: composer.error || 'composer_send_blocked',
      composerDecision: composer.decision || 'BLOCK',
      composerClass: composer.classId || '',
      decisionId: str(composer.receipt?.decisionId),
      securityCaseId: str(composer.securityCaseId),
    }, composer.status || 403)
    const composerDelivery = composerGate.createComposerDeliveryBinding(composer, {
      kind: 'dm_message',
      operationId: dmOperationId,
      entityId: id,
    })
    const msg = normalizeMessage({
      id,
      from,
      to,
      text: body?.text || '',
      attachments: rawAttachments,
      ts: Date.now(),
      ...composerDelivery.documentFields,
    })
    if (rawVideoAttachments.length) {
      msg.attachments = (Array.isArray(msg.attachments) ? msg.attachments : []).map((entry) => {
        if (!entry || typeof entry !== 'object') return entry
        const type = str(entry.type || entry.mime || entry.mediaType || entry.kind).toLowerCase()
        const url = str(entry.url || entry.src || entry.href || entry.file)
        const isVideo = /video/.test(type) || /\.(?:mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(url)
        return isVideo ? { ...entry, moderationStatus: 'approved' } : entry
      })
    }

    stage = 'persist_message_and_policy_intent'
    const mongo = await mongoClient.getMongoDb()
    const session = mongo.client.startSession()
    try {
      await session.withTransaction(async () => {
        await composerGate.prepareComposerOutcome(composer, {
          delivery: composerDelivery.delivery,
          session,
        })
        await saveMessage(msg, { database: mongo.db, session })
        await dmPrimary.addMessageIndexes(
          { msg, fromIds, toIds, score: Number(msg.ts || Date.now()) },
          { database: mongo.db, session },
        )
      }, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      })
    } finally {
      await session.endSession()
    }
    stage = 'commit_composer_outcome'
    const composerOutcome = await composerGate.commitComposerOutcome(composer, {
      sent: true,
      deliveryRef: { entityId: id, storagePrimary: 'mongo' },
    })
    stage = 'dispatch_push'
    await sendBackgroundPush(to, { source: 'messenger_messages', dedupeKey: `dm:${id}`, itemId: id }).catch(() => {})
    return ok({
      id,
      ts: msg.ts,
      storagePrimary: 'mongo',
      composerDecision: composer.decision || 'ALLOW',
      composerClass: composer.classId || '',
      composerDecisionId: str(composer.receipt?.decisionId),
      warningCommitted: composerOutcome?.warningCommitted === true,
      policyOutcomePending: composerOutcome?.policyOutcomePending === true,
    })
  } catch (e) {
    console.error('[DM_SEND_FAILED]', {
      scope,
      stage,
      code: String(e?.code || e?.message || 'send_failed').slice(0, 160),
      syscall: String(e?.syscall || '').slice(0, 40),
      status: Number(e?.status || 500),
    })
    const status = Number(e?.status || 500)
    const safeCode = status >= 500
      ? (scope === 'ql7_support_dm' ? 'ql7_support_temporarily_unavailable' : 'dm_temporarily_unavailable')
      : String(e?.message || 'send_failed')
    return bad(safeCode, status)
  }
}
