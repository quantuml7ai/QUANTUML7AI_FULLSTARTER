import { dedupeDmDialogs, dialogMatchesUser } from '../utils/dmLoaders.js'
import {
  buildQl7SupportAuthHeaders,
  buildQl7SupportRouteContext,
  fetchQl7SupportAuthenticated,
  fetchQl7SupportRuntimeState,
  waitForQl7SupportAuthReady,
} from './supportAuthClient.js'
import {
  buildQl7SupportInputPolicy,
  normalizeQl7SupportInputPolicy,
} from '../../../../../lib/ql7-support/inputPolicy.js'
import { normalizeQl7SupportOperatorState } from '../../../../../lib/ql7-support/ecosystemCatalog.js'
import { shouldApplyQl7SupportRuntimeEvent, sortQl7SupportRuntimeHistory } from './ql7SupportRuntimeStateReducer.js'

export async function sendDmComposerMessage({
  uid,
  dmTarget,
  text,
  pendingSticker,
  dmWithUserId,
  pendingImgs,
  audioUrlToSend,
  videoUrlToSend,
  resolveMediaPayloadFn,
  dmBlockedMap,
  dmSupportMode = false,
  locale = '',
  t,
  onFail,
  setDmThreadItems,
  setDmDialogs,
  dmDialogsCacheRef,
  dmThreadCacheRef,
  setDmBlockedByReceiverMap,
  loadDmDialogs,
  loadDmThread,
  toastI18n,
  moderateVideoSource,
  reasonKey,
  setMediaLock,
  rawFromId,
  setComposerActive,
  setText,
  setPendingImgs,
  setPendingSticker,
  pendingAudio,
  setPendingAudio,
  stopMediaProg,
  setMediaPipelineOn,
  setMediaBarOn,
  setMediaPhase,
  setMediaPct,
  setVideoProgress,
  setReplyTo,
  toast,
  postingRef,
  resetVideo,
  pendingVideo,
  pendingVideoBlobMetaRef,
  setPendingVideo,
  pendingVideoInfoRef,
  setVideoOpen,
  setVideoState,
  restoreComposerScroll,
  onDmMessageFocus,
  onQl7SupportUiState,
}) {
  const clientMutationId = `ql7dm_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`
  const tmpId = `tmp_dm_${clientMutationId}`
  const emitSupportUi = (supportUiState, extra = {}) => {
    if (!dmSupportMode || typeof onQl7SupportUiState !== 'function') return
    const { inputPolicy: incomingInputPolicy, ...restExtra } = extra && typeof extra === 'object' ? extra : {}
    const state = normalizeQl7SupportOperatorState(supportUiState || incomingInputPolicy?.runtimeStage || 'idle')
    const caseId = String(restExtra?.caseId || incomingInputPolicy?.caseId || '').trim()
    const inputPolicy = incomingInputPolicy && typeof incomingInputPolicy === 'object'
      ? normalizeQl7SupportInputPolicy(incomingInputPolicy, { locale: locale || incomingInputPolicy?.locale || 'en' })
      : buildQl7SupportInputPolicy({
        state,
        caseId,
        locale: String(locale || ''),
        now: Date.now,
      })
    try {
      onQl7SupportUiState({
        supportUiState: state,
        correlationId: clientMutationId,
        changedAt: Date.now(),
        ...restExtra,
        inputPolicy,
      })
    } catch {}
  }
  const fail = (msg, { supportState = 'temporarily_unavailable', resetPosting = true } = {}) => {
    try { onFail?.(msg) } catch {}
    if (dmSupportMode && supportState) emitSupportUi(supportState)
    if (resetPosting) {
      try { postingRef.current = false } catch {}
      try { setComposerActive(false) } catch {}
      try { restoreComposerScroll() } catch {}
    }
    return true
  }

  if (String(uid) === String(dmTarget)) return fail(t('dm_blocked'))
  if (!dmSupportMode && dmBlockedMap?.[dmTarget]) return fail(t('dm_you_blocked'))

  const dmText = [
    String(text || '').trim(),
    !dmSupportMode && pendingSticker?.src
      ? `[${String(pendingSticker?.kind || '') === 'mozi' ? 'MOZI' : 'VIP_EMOJI'}:${String(pendingSticker.src)}]`
      : '',
  ].filter(Boolean).join('\n')
  const dmSupportBroadcastCommandMode = !!dmSupportMode && /^\s*Admin\b/iu.test(dmText)
  const rawToId = String(dmWithUserId || '').trim()
  const pendingAudioUrl = dmSupportMode ? '' : String(pendingAudio || '').trim()
  const pendingVideoUrl = dmSupportMode ? '' : String(pendingVideo || '').trim()
  const optimisticAudioUrl =
    String(audioUrlToSend || '').trim() ||
    pendingAudioUrl
  const optimisticVideoUrl =
    String(videoUrlToSend || '').trim() ||
    pendingVideoUrl

  const readVideoMetaForUrl = (url, fallbackMeta = null) => {
    const src = String(url || '').trim()
    let meta = fallbackMeta
    try {
      meta = pendingVideoBlobMetaRef?.current?.get?.(src) || meta
    } catch {}
    try {
      if (!meta && src && src === pendingVideoUrl) meta = pendingVideoInfoRef?.current || null
    } catch {}
    const facingMode = String(meta?.cameraFacingMode || '').toLowerCase()
    const frontCameraMirror = !!(meta?.frontCameraMirror || meta?.mirrorVideo || facingMode === 'user' || facingMode === 'front')
    const posterUrl = String(meta?.posterUrl || '').trim()
    if (!frontCameraMirror && !posterUrl) return null
    return {
      source: String(meta?.source || (frontCameraMirror ? 'camera_record' : '')),
      cameraFacingMode: frontCameraMirror ? 'user' : '',
      frontCameraMirror,
      mirrorVideo: frontCameraMirror,
      ...(posterUrl ? { posterUrl } : {}),
    }
  }

  const buildAttachments = ({ imageUrls = pendingImgs, audioUrl = '', videoUrl = '', videoMeta = null, videoApprovalToken = '' } = {}) => {
    const au = String(audioUrl || '').trim()
    const vv = String(videoUrl || '').trim()
    const safeVideoMeta = vv ? readVideoMetaForUrl(vv, videoMeta) : null
    return [
      ...(!dmSupportMode && Array.isArray(imageUrls) ? imageUrls : []).map((u) => ({ url: u, type: 'image' })),
      ...(au ? [{ url: au, type: 'audio' }] : []),
      ...(vv ? [{ url: vv, type: 'video', moderationStatus: videoApprovalToken ? 'approved' : 'pending', ...(videoApprovalToken ? { moderationApprovalToken: videoApprovalToken } : {}), ...(safeVideoMeta || {}) }] : []),
    ].filter(Boolean)
  }

  let attachments = buildAttachments({
    audioUrl: optimisticAudioUrl,
    videoUrl: optimisticVideoUrl,
  })
  let videoApprovalToken = ''
  if (!dmText && !attachments.length) return fail()
  if (dmSupportMode) {
    emitSupportUi('checking')
    const supportAuth = await waitForQl7SupportAuthReady({ timeoutMs: 2500 })
    if (!supportAuth?.ready) return fail(t('dm_send_failed'))
  }

  const finalSupportStateFor = (caseStatus = '') => {
    const status = String(caseStatus || '').trim().toLowerCase()
    if (status === 'awaiting_admin' || status === 'admin_notified') return 'attention_required'
    if (
      status === 'awaiting_user' ||
      status === 'collecting_context' ||
      status === 'partial'
    ) return 'needs_clarification'
    return 'idle'
  }
  const shouldCancelFocusRetry = (startedAt = 0) => {
    if (typeof window === 'undefined') return false
    try {
      const userScrollTs = Number(window.__forumUserScrollTs || 0)
      const programmaticScrollTs = Number(window.__forumProgrammaticScrollTs || 0)
      if (!userScrollTs || userScrollTs < Number(startedAt || 0)) return false
      return !programmaticScrollTs || userScrollTs >= programmaticScrollTs
    } catch {
      return false
    }
  }
  const focusMessage = (messageId, reason = 'dm-send') => {
    const id = String(messageId || '').trim()
    if (!id || typeof onDmMessageFocus !== 'function') return
    const startedAt = Date.now()
    try { onDmMessageFocus(id, reason) } catch {}
    const retryFocus = (suffix) => {
      if (shouldCancelFocusRetry(startedAt)) return
      try { onDmMessageFocus(id, `${reason}:${suffix}`) } catch {}
    }
    try { setTimeout(() => retryFocus('retry-1'), 80) } catch {}
    try { setTimeout(() => retryFocus('retry-2'), 260) } catch {}
  }
  const optimistic = {
    id: tmpId,
    from: uid,
    to: dmTarget,
    text: dmText,
    attachments,
    ts: Date.now(),
    status: 'sending',
    clientMutationId,
    correlationId: clientMutationId,
    composerSnapshot: Object.freeze({ text: dmText, createdAt: Date.now() }),
  }
  emitSupportUi(dmSupportBroadcastCommandMode ? 'preparing_response' : 'understanding')
  const matchesTargetDialog = (dialog) => dialogMatchesUser(dialog, dmTarget, uid)
  if (!dmSupportBroadcastCommandMode) {
    setDmThreadItems((prev) => [...(prev || []), optimistic])
    focusMessage(tmpId, 'dm-send-optimistic')
    setDmDialogs((prev) => {
      const list = dedupeDmDialogs(Array.isArray(prev) ? prev.slice() : [], uid)
      const idx = list.findIndex(matchesTargetDialog)
      const prevLastMessage = idx >= 0 ? (list[idx]?.lastMessage || null) : null
      const lastMessage = { ...optimistic, __optimisticPrevLastMessage: prevLastMessage }
      if (idx >= 0) {
        const next = { ...list[idx], userId: dmTarget, lastMessage }
        list.splice(idx, 1)
        return dedupeDmDialogs([next, ...list], uid)
      }
      return dedupeDmDialogs([{ userId: dmTarget, lastMessage }, ...list], uid)
    })
    dmDialogsCacheRef.current.clear()
    dmThreadCacheRef.current.clear()
  }

  const removeOptimisticMessage = () => {
    setDmThreadItems((prev) => (prev || []).filter((m) => String(m?.id || '') !== String(tmpId)))
    setDmDialogs((prev) => {
      const list = dedupeDmDialogs(Array.isArray(prev) ? prev : [], uid)
      const out = []
      for (const d of list) {
        if (!matchesTargetDialog(d)) {
          out.push(d)
          continue
        }
        const last = d?.lastMessage || null
        if (!last || String(last?.id || '') !== String(tmpId)) {
          out.push(d)
          continue
        }
        const prevLast = last?.__optimisticPrevLastMessage || null
        if (prevLast) out.push({ ...d, userId: dmTarget, lastMessage: prevLast })
      }
      return dedupeDmDialogs(out, uid)
    })
  }

  const patchOptimisticAttachments = (nextAttachments = []) => {
    const list = Array.isArray(nextAttachments) ? nextAttachments : []
    setDmThreadItems((prev) => (prev || []).map((m) =>
      (String(m?.id || '') === String(tmpId))
        ? { ...m, attachments: list }
        : m
    ))
    setDmDialogs((prev) =>
      dedupeDmDialogs(
        (prev || []).map((d) => {
          if (!matchesTargetDialog(d)) return d
          const last = d?.lastMessage || null
          if (!last || String(last?.id || '') !== String(tmpId)) return d
          return { ...d, userId: dmTarget, lastMessage: { ...last, attachments: list } }
        }),
        uid,
      )
    )
  }

  let dmSendOk = false
  let dmBroadcastOk = false
  let preserveSupportDraft = false
  try {
    emitSupportUi(dmSupportBroadcastCommandMode ? 'preparing_response' : 'analyzing')
    let finalImageUrls = Array.isArray(pendingImgs) ? pendingImgs : []
    let finalAudioUrl = String(audioUrlToSend || '').trim()
    let finalVideoUrl = String(videoUrlToSend || '').trim()
    const needsResolve =
      (typeof resolveMediaPayloadFn === 'function') &&
      (
        finalImageUrls.some((url) => /^blob:/i.test(String(url || ''))) ||
        (/^blob:/i.test(pendingAudioUrl) && !finalAudioUrl) ||
        (/^blob:/i.test(pendingVideoUrl) && !finalVideoUrl)
      )

    if (needsResolve) {
      const media = await resolveMediaPayloadFn()
      if (!media || media.failed) {
        removeOptimisticMessage()
        return fail()
      }
      finalImageUrls = Array.isArray(media?.imageUrlsToSend) ? media.imageUrlsToSend : finalImageUrls
      finalAudioUrl = String(media?.audioUrlToSend || finalAudioUrl || '').trim()
      finalVideoUrl = String(media?.videoUrlToSend || finalVideoUrl || '').trim()
      videoApprovalToken = String(media?.videoApprovalToken || '')
      attachments = buildAttachments({
        imageUrls: finalImageUrls,
        audioUrl: finalAudioUrl,
        videoUrl: finalVideoUrl,
        videoMeta: media?.videoMetaToSend || null,
        videoApprovalToken,
      })
      if (!dmText && !attachments.length) {
        removeOptimisticMessage()
        return fail()
      }
      patchOptimisticAttachments(attachments)
    }


    const payload = {
      to: dmTarget,
      text: dmText,
      attachments,
      locale: String(locale || ''),
      clientMutationId,
      correlationId: clientMutationId,
      routeContext: dmSupportMode ? buildQl7SupportRouteContext() : undefined,
    }
    if (rawToId && rawToId !== dmTarget) payload.toRaw = rawToId
    if (rawFromId && rawFromId !== uid) payload.fromRaw = rawFromId
    const supportSeenEvents = new Set()
    let supportStateBusy = false
    let supportStateStopped = false
    let supportPollInterval = 0
    let supportCommittedSeen = false
    let supportLastAppliedState = null
    const stopSupportReplay = () => { supportStateStopped = true }
    const emitRuntimeEvent = (event = {}) => {
      if (supportStateStopped || !shouldApplyQl7SupportRuntimeEvent(supportLastAppliedState || {}, event)) return false
      const runtimeState = String(event?.state || event?.stateReceipt?.phase || 'idle')
      supportLastAppliedState = { ...event, supportUiState: runtimeState }
      if (normalizeQl7SupportOperatorState(runtimeState) === 'answer_ready') supportCommittedSeen = true
      emitSupportUi(runtimeState, {
        caseId: String(event?.caseId || ''),
        correlationId: String(event?.correlationId || event?.stateReceipt?.correlationId || clientMutationId),
        attemptId: String(event?.attemptId || event?.stateReceipt?.attemptId || ''),
        sequence: Number(event?.sequence ?? event?.stateReceipt?.sequence ?? 0),
        stateVersion: Number(event?.stateVersion ?? event?.stateReceipt?.stateVersion ?? 0),
        phaseRank: Number(event?.phaseRank ?? event?.stateReceipt?.phaseRank ?? 0),
        terminal: event?.terminal === true || event?.stateReceipt?.terminal === true,
        stateReceipt: event?.stateReceipt && typeof event.stateReceipt === 'object' ? event.stateReceipt : null,
        detailCode: String(event?.detailCode || ''),
        finalMessageId: String(event?.finalMessageId || event?.stateReceipt?.messageId || ''),
        changedAt: Date.parse(event?.changedAt || event?.stateReceipt?.changedAtServerUtc || '') || Date.now(),
        inputPolicy: event?.inputPolicy && typeof event.inputPolicy === 'object' ? event.inputPolicy : null,
      })
      return true
    }
    const queueRuntimeHistory = (state = {}) => {
      const history = sortQl7SupportRuntimeHistory(Array.isArray(state?.history) ? state.history : [])
      let applied = 0
      for (const event of history) {
        const eventId = String(event?.eventId || `${event?.correlationId || clientMutationId}:${event?.changedAt || ''}:${event?.sequence || 0}:${event?.state || ''}`)
        if (!eventId || supportSeenEvents.has(eventId)) continue
        supportSeenEvents.add(eventId)
        if (emitRuntimeEvent(event)) applied += 1
      }
      if (!applied && state?.state) emitRuntimeEvent(state)
    }
    const pollSupportState = async () => {
      if (!dmSupportMode || supportStateStopped || supportStateBusy) return
      supportStateBusy = true
      try {
        const state = await fetchQl7SupportRuntimeState({ correlationId: clientMutationId })
        if (state) queueRuntimeHistory(state)
      } catch {}
      finally { supportStateBusy = false }
    }
    if (dmSupportMode) {
      try {
        void pollSupportState()
        supportPollInterval = window.setInterval(() => { void pollSupportState() }, 180)
      } catch {}
    }
    let resp
    let j
    try {
      if (dmSupportMode) {
        const result = await fetchQl7SupportAuthenticated('/api/dm/send', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forum-user-id': String(uid),
            'x-forum-locale': String(locale || ''),
            ...buildQl7SupportAuthHeaders(),
          },
          body: JSON.stringify(payload),
        }, { waitTimeoutMs: 12000, retryOnFreshAuth: true })
        resp = result.response
        j = result.data
      } else {
        resp = await fetch('/api/dm/send', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forum-user-id': String(uid),
            'x-forum-locale': String(locale || ''),
          },
          body: JSON.stringify(payload),
        })
        j = await resp.json().catch(() => null)
      }
    } finally {
      if (dmSupportMode) {
        try { await pollSupportState() } catch {}
      }
      if (supportPollInterval) {
        try { window.clearInterval(supportPollInterval) } catch {}
        supportPollInterval = 0
      }
    }
    if (!resp?.ok || !j?.ok) {
      stopSupportReplay()
      const supportInputPaused = dmSupportMode && j?.error === 'ql7_support_input_paused'
      const blockedByReceiver = j?.error === 'blocked_by_receiver'
      const blockedByMe = j?.error === 'blocked' || j?.error === 'dm_blocked' || j?.error === 'blocked_by_you'
      const errKey = blockedByReceiver
        ? 'dm_blocked_by_receiver'
        : (blockedByMe ? 'dm_blocked' : 'dm_send_failed')
      if (blockedByReceiver) {
        setDmBlockedByReceiverMap((prev) => ({ ...(prev || {}), [String(dmTarget)]: 1 }))
      }
      removeOptimisticMessage()
      if (supportInputPaused) {
        preserveSupportDraft = true
        emitSupportUi(String(j?.inputPolicy?.runtimeStage || 'cooldown'), {
          caseId: String(j?.caseId || ''),
          correlationId: String(j?.correlationId || clientMutationId),
          inputPolicy: j?.inputPolicy || null,
        })
      } else emitSupportUi('temporarily_unavailable')
      try { loadDmDialogs(null, { force: true, refresh: true, throttleMs: 0 }) } catch {}
      if (supportInputPaused) {
        try { toast?.warn?.(String(j?.inputPolicy?.message || 'Support is completing the current check.')) } catch {}
      } else if (blockedByReceiver) {
        toastI18n('warn', 'dm_blocked_by_receiver')
      } else if (blockedByMe) {
        toastI18n('warn', 'dm_you_blocked')
      } else {
        toastI18n('warn', errKey)
      }
    } else {
      const realId = String(j?.id || tmpId)
      const realTs = Number(j?.ts || optimistic.ts)
      dmSendOk = true
      if (j?.supportBroadcast) {
        stopSupportReplay()
        dmBroadcastOk = true
        removeOptimisticMessage()
        emitSupportUi('preparing_response', {
          caseId: String(j?.caseId || ''),
          caseStatus: String(j?.caseStatus || 'resolved'),
          diagnosticStatus: String(j?.diagnosticStatus || ''),
          nextAfterDelivered: 'idle',
        })
        try { toastI18n?.('ok', 'ql7_support_broadcast_sent') } catch {}
      } else {
        setDmBlockedByReceiverMap((prev) => {
          if (!prev || !prev[String(dmTarget)]) return prev
          const next = { ...(prev || {}) }
          delete next[String(dmTarget)]
          return next
        })
        setDmThreadItems((prev) => (prev || []).map((m) =>
          (String(m.id) === String(tmpId) || String(m?.clientMutationId || '') === clientMutationId)
            ? { ...m, id: realId, ts: realTs, status: 'sent', clientMutationId, correlationId: String(j?.correlationId || clientMutationId) }
            : m
        ))
        const nextAfterDelivered = finalSupportStateFor(j?.caseStatus) === 'idle' ? 'answer_ready' : finalSupportStateFor(j?.caseStatus)
        // Legacy V7 marker: ? 'answer_committed' : 'sending'. Public UI now emits answer_ready/preparing_response.
        const committedState = (String(j?.replyMessageId || '').trim() || supportCommittedSeen) ? 'answer_ready' : 'preparing_response'
        if (committedState === 'answer_ready') stopSupportReplay()
        emitSupportUi(committedState, {
          caseId: String(j?.caseId || ''),
          caseStatus: String(j?.caseStatus || ''),
          diagnosticStatus: String(j?.diagnosticStatus || ''),
          finalMessageId: String(j?.replyMessageId || ''),
          nextAfterDelivered,
          inputPolicy: j?.inputPolicy || null,
        })
        // Server reconciliation must replace the optimistic message without moving the user's viewport.
        setDmDialogs((prev) =>
          dedupeDmDialogs(
            (prev || []).map((d) => {
              if (!matchesTargetDialog(d)) return d
              const last = d?.lastMessage || null
              if (!last || (String(last.id) !== String(tmpId) && String(last?.clientMutationId || '') !== clientMutationId)) return d
              const { __optimisticPrevLastMessage, ...safeLast } = (last || {})
              return {
                ...d,
                userId: dmTarget,
                lastMessage: { ...safeLast, id: realId, ts: realTs, status: 'sent', clientMutationId, correlationId: String(j?.correlationId || clientMutationId) },
              }
            }),
            uid,
          )
        )

        if (dmSupportMode && typeof loadDmThread === 'function') {
          dmThreadCacheRef.current.clear()
          try {
            await loadDmThread(dmTarget, null, {
              force: true,
              refresh: true,
              throttleMs: 0,
              supportAuthTimeoutMs: 12000,
              canonicalAfterSend: true,
            })
          } catch {}
        }
      }
    }
  } catch {
    removeOptimisticMessage()
    emitSupportUi('temporarily_unavailable')
    try { loadDmDialogs(null, { force: true, refresh: true, throttleMs: 0 }) } catch {}
    try { toastI18n('warn', 'dm_send_failed') } catch {}
  }

  if (preserveSupportDraft) {
    try { setComposerActive(true) } catch {}
    try { restoreComposerScroll() } catch {}
  } else {
    setComposerActive(false)
    try { setText('') } catch {}
    try { setPendingImgs([]) } catch {}
    try { setPendingSticker?.(null) } catch {}
  }
  try { if (pendingAudio && /^blob:/.test(pendingAudio)) URL.revokeObjectURL(pendingAudio) } catch {}
  try { setPendingAudio(null) } catch {}
  try { stopMediaProg() } catch {}
  try { setMediaPipelineOn(false) } catch {}
  try { setMediaBarOn(false) } catch {}
  try { setMediaPhase('idle') } catch {}
  try { setMediaPct(0) } catch {}
  try { setVideoProgress(0) } catch {}
  try { setReplyTo(null) } catch {}
  if (dmSendOk && !dmBroadcastOk) {
    try { toast?.ok?.(t('dm_sent')) } catch {}
  }
  try { postingRef.current = false } catch {}
  try { resetVideo() } catch {}
  try {
    if (pendingVideo && /^blob:/.test(pendingVideo)) {
      try { pendingVideoBlobMetaRef.current?.delete?.(String(pendingVideo)) } catch {}
      URL.revokeObjectURL(pendingVideo)
    }
  } catch {}
  try { setPendingVideo(null) } catch {}
  try { pendingVideoInfoRef.current = { source: '', durationSec: NaN } } catch {}
  try { setVideoOpen(false); setVideoState('idle') } catch {}
  if (!dmSendOk) {
    try { restoreComposerScroll() } catch {}
  }

  return true
}

export default sendDmComposerMessage
