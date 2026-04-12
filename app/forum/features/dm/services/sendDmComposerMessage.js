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
}) {
  const fail = (msg) => {
    try { onFail?.(msg) } catch {}
    return true
  }

  if (String(uid) === String(dmTarget)) return fail(t('dm_blocked'))
  if (dmBlockedMap?.[dmTarget]) return fail(t('dm_you_blocked'))

  const dmText = [
    String(text || '').trim(),
    pendingSticker?.src
      ? `[${String(pendingSticker?.kind || '') === 'mozi' ? 'MOZI' : 'VIP_EMOJI'}:${String(pendingSticker.src)}]`
      : '',
  ].filter(Boolean).join('\n')
  const rawToId = String(dmWithUserId || '').trim()
  const pendingAudioUrl = String(pendingAudio || '').trim()
  const pendingVideoUrl = String(pendingVideo || '').trim()
  const optimisticAudioUrl =
    String(audioUrlToSend || '').trim() ||
    pendingAudioUrl
  const optimisticVideoUrl =
    String(videoUrlToSend || '').trim() ||
    pendingVideoUrl

  const buildAttachments = ({ audioUrl = '', videoUrl = '' } = {}) => {
    const au = String(audioUrl || '').trim()
    const vv = String(videoUrl || '').trim()
    return [
      ...(Array.isArray(pendingImgs) ? pendingImgs : []).map((u) => ({ url: u, type: 'image' })),
      ...(au ? [{ url: au, type: 'audio' }] : []),
      ...(vv ? [{ url: vv, type: 'video' }] : []),
    ].filter(Boolean)
  }

  let attachments = buildAttachments({
    audioUrl: optimisticAudioUrl,
    videoUrl: optimisticVideoUrl,
  })
  if (!dmText && !attachments.length) return fail()

  const tmpId = `tmp_dm_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const optimistic = {
    id: tmpId,
    from: uid,
    to: dmTarget,
    text: dmText,
    attachments,
    ts: Date.now(),
    status: 'sending',
  }
  setDmThreadItems((prev) => [...(prev || []), optimistic])
  setDmDialogs((prev) => {
    const list = Array.isArray(prev) ? prev.slice() : []
    const idx = list.findIndex((x) => String(x?.userId || '') === String(dmTarget))
    const prevLastMessage = idx >= 0 ? (list[idx]?.lastMessage || null) : null
    const lastMessage = { ...optimistic, __optimisticPrevLastMessage: prevLastMessage }
    if (idx >= 0) {
      const next = { ...list[idx], lastMessage }
      list.splice(idx, 1)
      return [next, ...list]
    }
    return [{ userId: dmTarget, lastMessage }, ...list]
  })
  dmDialogsCacheRef.current.clear()
  dmThreadCacheRef.current.clear()

  const removeOptimisticMessage = () => {
    setDmThreadItems((prev) => (prev || []).filter((m) => String(m?.id || '') !== String(tmpId)))
    setDmDialogs((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const out = []
      for (const d of list) {
        if (String(d?.userId || '') !== String(dmTarget)) {
          out.push(d)
          continue
        }
        const last = d?.lastMessage || null
        if (!last || String(last?.id || '') !== String(tmpId)) {
          out.push(d)
          continue
        }
        const prevLast = last?.__optimisticPrevLastMessage || null
        if (prevLast) out.push({ ...d, lastMessage: prevLast })
      }
      return out
    })
  }

  const patchOptimisticAttachments = (nextAttachments = []) => {
    const list = Array.isArray(nextAttachments) ? nextAttachments : []
    setDmThreadItems((prev) => (prev || []).map((m) =>
      (String(m?.id || '') === String(tmpId))
        ? { ...m, attachments: list }
        : m
    ))
    setDmDialogs((prev) => (prev || []).map((d) => {
      if (String(d?.userId || '') !== String(dmTarget)) return d
      const last = d?.lastMessage || null
      if (!last || String(last?.id || '') !== String(tmpId)) return d
      return { ...d, lastMessage: { ...last, attachments: list } }
    }))
  }

  let dmSendOk = false
  try {
    let finalAudioUrl = String(audioUrlToSend || '').trim()
    let finalVideoUrl = String(videoUrlToSend || '').trim()
    const needsResolve =
      (typeof resolveMediaPayloadFn === 'function') &&
      (
        (/^blob:/i.test(pendingAudioUrl) && !finalAudioUrl) ||
        (/^blob:/i.test(pendingVideoUrl) && !finalVideoUrl)
      )

    if (needsResolve) {
      const media = await resolveMediaPayloadFn()
      if (!media || media.failed) {
        removeOptimisticMessage()
        return fail()
      }
      finalAudioUrl = String(media?.audioUrlToSend || finalAudioUrl || '').trim()
      finalVideoUrl = String(media?.videoUrlToSend || finalVideoUrl || '').trim()
      attachments = buildAttachments({
        audioUrl: finalAudioUrl,
        videoUrl: finalVideoUrl,
      })
      if (!dmText && !attachments.length) {
        removeOptimisticMessage()
        return fail()
      }
      patchOptimisticAttachments(attachments)
    }

    const payload = { to: dmTarget, text: dmText, attachments }
    if (rawToId && rawToId !== dmTarget) payload.toRaw = rawToId
    if (rawFromId && rawFromId !== uid) payload.fromRaw = rawFromId
    const resp = await fetch('/api/dm/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forum-user-id': String(uid) },
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
      setDmDialogs((prev) => (prev || []).map((d) => {
        if (String(d?.userId || '') !== String(dmTarget)) return d
        const last = d?.lastMessage || null
        if (!last || String(last.id) !== String(tmpId)) return d
        const { __optimisticPrevLastMessage, ...safeLast } = (last || {})
        return { ...d, lastMessage: { ...safeLast, id: realId, ts: realTs, status: 'sent' } }
      }))
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
  if (dmSendOk) {
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
  try { restoreComposerScroll() } catch {}

  return true
}

export default sendDmComposerMessage
