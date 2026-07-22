import { dedupeDmDialogs, dialogMatchesUser } from '../utils/dmLoaders'

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
  toastI18n,
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
}) {
  const fail = (msg) => {
    try { onFail?.(msg) } catch {}
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
    if (!frontCameraMirror) return null
    return {
      source: String(meta?.source || 'camera_record'),
      cameraFacingMode: 'user',
      frontCameraMirror: true,
      mirrorVideo: true,
    }
  }

  const buildAttachments = ({ imageUrls = pendingImgs, audioUrl = '', videoUrl = '', videoMeta = null } = {}) => {
    const au = String(audioUrl || '').trim()
    const vv = String(videoUrl || '').trim()
    const safeVideoMeta = vv ? readVideoMetaForUrl(vv, videoMeta) : null
    return [
      ...(!dmSupportMode && Array.isArray(imageUrls) ? imageUrls : []).map((u) => ({ url: u, type: 'image' })),
      ...(au ? [{ url: au, type: 'audio' }] : []),
      ...(vv ? [{ url: vv, type: 'video', ...(safeVideoMeta || {}) }] : []),
    ].filter(Boolean)
  }

  let attachments = buildAttachments({
    audioUrl: optimisticAudioUrl,
    videoUrl: optimisticVideoUrl,
  })
  if (!dmText && !attachments.length) return fail()

  const tmpId = `tmp_dm_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const focusMessage = (messageId, reason = 'dm-send') => {
    const id = String(messageId || '').trim()
    if (!id || typeof onDmMessageFocus !== 'function') return
    try { onDmMessageFocus(id, reason) } catch {}
    try { setTimeout(() => onDmMessageFocus(id, `${reason}:retry-1`), 80) } catch {}
    try { setTimeout(() => onDmMessageFocus(id, `${reason}:retry-2`), 260) } catch {}
  }
  const optimistic = {
    id: tmpId,
    from: uid,
    to: dmTarget,
    text: dmText,
    attachments,
    ts: Date.now(),
    status: 'sending',
  }
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
  try {
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
      attachments = buildAttachments({
        imageUrls: finalImageUrls,
        audioUrl: finalAudioUrl,
        videoUrl: finalVideoUrl,
        videoMeta: media?.videoMetaToSend || null,
      })
      if (!dmText && !attachments.length) {
        removeOptimisticMessage()
        return fail()
      }
      patchOptimisticAttachments(attachments)
    }

    const payload = { to: dmTarget, text: dmText, attachments, locale: String(locale || '') }
    if (rawToId && rawToId !== dmTarget) payload.toRaw = rawToId
    if (rawFromId && rawFromId !== uid) payload.fromRaw = rawFromId
    const resp = await fetch('/api/dm/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forum-user-id': String(uid),
        'x-forum-locale': String(locale || ''),
      },
      body: JSON.stringify(payload),
    })
    const j = await resp.json().catch(() => null)
    if (!resp.ok || !j?.ok) {
      const blockedByReceiver = j?.error === 'blocked_by_receiver'
      const blockedByMe = j?.error === 'blocked' || j?.error === 'dm_blocked' || j?.error === 'blocked_by_you'
      const errKey = blockedByReceiver
        ? 'dm_blocked_by_receiver'
        : (blockedByMe ? 'dm_blocked' : 'dm_send_failed')
      if (blockedByReceiver) {
        setDmBlockedByReceiverMap((prev) => ({ ...(prev || {}), [String(dmTarget)]: 1 }))
      }
      removeOptimisticMessage()
      try { loadDmDialogs(null, { force: true, refresh: true, throttleMs: 0 }) } catch {}
      if (blockedByReceiver) {
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
        dmBroadcastOk = true
        removeOptimisticMessage()
        try { toastI18n?.('ok', 'ql7_support_broadcast_sent') } catch {}
      } else {
        setDmBlockedByReceiverMap((prev) => {
          if (!prev || !prev[String(dmTarget)]) return prev
          const next = { ...(prev || {}) }
          delete next[String(dmTarget)]
          return next
        })
        setDmThreadItems((prev) => (prev || []).map((m) =>
          (String(m.id) === String(tmpId))
            ? { ...m, id: realId, ts: realTs, status: 'sent' }
            : m
        ))
        focusMessage(realId, 'dm-send-confirmed')
        setDmDialogs((prev) =>
          dedupeDmDialogs(
            (prev || []).map((d) => {
              if (!matchesTargetDialog(d)) return d
              const last = d?.lastMessage || null
              if (!last || String(last.id) !== String(tmpId)) return d
              const { __optimisticPrevLastMessage, ...safeLast } = (last || {})
              return {
                ...d,
                userId: dmTarget,
                lastMessage: { ...safeLast, id: realId, ts: realTs, status: 'sent' },
              }
            }),
            uid,
          )
        )
      }
    }
  } catch {
    removeOptimisticMessage()
    try { loadDmDialogs(null, { force: true, refresh: true, throttleMs: 0 }) } catch {}
    try { toastI18n('warn', 'dm_send_failed') } catch {}
  }

  setComposerActive(false)
  try { setText('') } catch {}
  try { setPendingImgs([]) } catch {}
  try { setPendingSticker?.(null) } catch {}
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
