import { useRef } from 'react'

import sendDmComposerMessage from '../../dm/services/sendDmComposerMessage'
import resolveComposerMediaPayload from '../../media/services/resolveComposerMediaPayload'

export default function useForumCreatePostAction({
  saveComposerScroll,
  restoreComposerScroll,
  editPostId,
  auth,
  getForumUserIdFn,
  text,
  setText,
  setOverlay,
  pushOp,
  setEditPostId,
  toast,
  t,
  rateLimiter,
  pendingVideo,
  pendingAudio,
  pendingImgs,
  beginMediaPipeline,
  pendingVideoRef,
  pendingVideoInfoRef,
  pendingVideoBlobMetaRef,
  forumVideoFaststartTranscodeMaxBytes,
  optimizeForumVideoFastStartFn,
  emitDiag,
  readVideoDurationSecFn,
  forumVideoMaxSeconds,
  forumVideoCameraRecordEpsilonSec,
  showVideoLimitOverlay,
  endMediaPipeline,
  forumVideoMaxBytes,
  viewerId,
  stopMediaProg,
  setMediaPhase,
  setVideoProgress,
  setMediaPct,
  readAudioDurationSecFn,
  forumAudioMaxSeconds,
  setPendingImgs,
  setPendingAudio,
  setPendingVideo,
  textLimit,
  dmMode,
  resolveProfileAccountId,
  dmWithUserId,
  selectedTopic,
  requireAuthStrict,
  vipActive,
  dmBlockedMap,
  setDmThreadItems,
  setDmDialogs,
  dmDialogsCacheRef,
  dmThreadCacheRef,
  loadDmDialogs,
  setDmBlockedByReceiverMap,
  toastI18n,
  hasAnyLink,
  safeReadProfile,
  resolveNickForDisplay,
  resolveIconForDisplay,
  replyTo,
  threadRoot,
  data,
  setThreadRoot,
  hasComposerMedia,
  syncNowRef,
  setComposerActive,
  emitPostCreated,
  setMediaPipelineOn,
  setMediaBarOn,
  setReplyTo,
  resetVideo,
  setVideoOpen,
  setVideoState,
  centerPostAfterDom,
}) {
  const postingRef = useRef(false)

  const createPost = async () => {
    if (postingRef.current) return
    postingRef.current = true
    try { saveComposerScroll() } catch {}

    // === Режим редактирования поста владельцем ===
    if (editPostId) {
      const done = () => { postingRef.current = false }
      try {
        const uid = (auth?.asherId || auth?.accountId || getForumUserIdFn?.())
        const safeText = String(text || '').slice(0, 8000)
        if (!safeText.trim()) {
          done()
          return
        }
        setOverlay((prev) => ({
          ...prev,
          edits: { ...prev.edits, [String(editPostId)]: { text: safeText } },
        }))
        pushOp('edit_post', { id: String(editPostId), text: safeText })
        setEditPostId(null)
        try { setText('') } catch {}
        try { toast?.ok?.(t?.('forum_ok_post_edited')) } catch {}
      } finally {
        done()
        try { restoreComposerScroll() } catch {}
      }
      return
    }

    // === Обычный режим: создание поста ===
    const fail = (msg) => {
      if (msg) {
        try { toast?.warn?.(msg) } catch {}
      }
      postingRef.current = false
      try { restoreComposerScroll() } catch {}
    }

    if (!rateLimiter?.allowAction?.()) return fail(t('forum_too_fast'))

    const dmTarget = dmMode ? String(resolveProfileAccountId(dmWithUserId) || '').trim() : ''
    const isDm = !!dmTarget

    if (isDm) {
      const r = await requireAuthStrict?.()
      if (!r) return fail()
      const uid = String(resolveProfileAccountId(r.asherId || r.accountId || '') || '').trim()
      const rawFromId = String(r.asherId || r.accountId || '').trim()

      await sendDmComposerMessage({
        uid,
        dmTarget,
        text,
        dmWithUserId,
        pendingImgs,
        audioUrlToSend: '',
        videoUrlToSend: '',
        resolveMediaPayloadFn: () => resolveComposerMediaPayload({
          pendingVideo,
          pendingAudio,
          beginMediaPipeline,
          pendingVideoRef,
          pendingVideoInfoRef,
          pendingVideoBlobMetaRef,
          forumVideoFaststartTranscodeMaxBytes,
          optimizeForumVideoFastStartFn,
          emitDiag,
          readVideoDurationSecFn,
          forumVideoMaxSeconds,
          forumVideoCameraRecordEpsilonSec,
          showVideoLimitOverlay,
          endMediaPipeline,
          forumVideoMaxBytes,
          viewerId,
          stopMediaProg,
          setMediaPhase,
          setVideoProgress,
          setMediaPct,
          readAudioDurationSecFn,
          forumAudioMaxSeconds,
          toast,
          t,
          onFail: fail,
        }),
        dmBlockedMap,
        t,
        onFail: fail,
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
      })
      return
    }

    const media = await resolveComposerMediaPayload({
      pendingVideo,
      pendingAudio,
      beginMediaPipeline,
      pendingVideoRef,
      pendingVideoInfoRef,
      pendingVideoBlobMetaRef,
      forumVideoFaststartTranscodeMaxBytes,
      optimizeForumVideoFastStartFn,
      emitDiag,
      readVideoDurationSecFn,
      forumVideoMaxSeconds,
      forumVideoCameraRecordEpsilonSec,
      showVideoLimitOverlay,
      endMediaPipeline,
      forumVideoMaxBytes,
      viewerId,
      stopMediaProg,
      setMediaPhase,
      setVideoProgress,
      setMediaPct,
      readAudioDurationSecFn,
      forumAudioMaxSeconds,
      toast,
      t,
      onFail: fail,
    })
    if (media.failed) return

    const { videoUrlToSend, audioUrlToSend } = media

    // 1) собираем текст
    const plain = (String(text || '').trim()
      || ((pendingImgs.length > 0 || audioUrlToSend || videoUrlToSend) ? '\u200B' : '')
    ).slice(0, textLimit)

    const body = [
      plain,
      ...pendingImgs,
      ...(audioUrlToSend ? [audioUrlToSend] : []),
      ...(videoUrlToSend ? [videoUrlToSend] : []),
    ].filter(Boolean).join('\n')

    if (!body || !selectedTopic?.id) return fail()

    // 2) auth
    const r = await requireAuthStrict?.()
    if (!r) return fail()
    const uid = String(resolveProfileAccountId(r.asherId || r.accountId || '') || '').trim()
    const isAdm = (typeof window !== 'undefined') && localStorage.getItem('ql7_admin') === '1'
    const isVip = !!vipActive

    // --- БЕЛЫЙ СПИСОК ДЛЯ НЕ-VIP/НЕ-АДМИНОВ ---
    if (!isAdm && !isVip && hasAnyLink(body)) {
      const sameHost = (typeof location !== 'undefined' ? location.host : '') || ''
      const URL_RE = /https?:\/\/[^\s<>"')]+/gi
      const ST_PREFIX = ['/vip-emoji/', '/emoji/', '/stickers/', '/assets/emoji/', '/Quest/']
      const ST_EXT = /\.(gif|png|webp|jpg|jpeg)$/i
      const AUD_EXT = /\.(mp3|webm|ogg|wav|m4a)$/i
      const VID_EXT = /\.(webm|mp4|mov|m4v|mkv)$/i

      const extractUrls = (s = '') => {
        const out = []
        String(s || '').split('\n').forEach((ln) => {
          const m = ln.match(URL_RE)
          if (m) out.push(...m)
          if (ln.startsWith('/')) out.push(ln.trim())
        })
        return out
      }

      const isAllowed = (uStr) => {
        try {
          if (uStr.startsWith('/')) {
            if (ST_PREFIX.some((p) => uStr.startsWith(p)) && ST_EXT.test(uStr)) return true
            if ((/\/uploads?\//i.test(uStr) || /\/media?\//i.test(uStr)) && (AUD_EXT.test(uStr) || VID_EXT.test(uStr))) return true
            if (uStr.startsWith('/_next/image')) return true
            return false
          }
          const u = new URL(uStr)
          if (sameHost && u.host === sameHost) {
            if (ST_PREFIX.some((p) => u.pathname.startsWith(p)) && ST_EXT.test(u.pathname)) return true
            if ((/\/uploads?\//i.test(u.pathname) || /\/media?\//i.test(u.pathname)) && (AUD_EXT.test(u.pathname) || VID_EXT.test(u.pathname))) return true
          }
          if (u.hostname.endsWith('vercel-storage.com') && (AUD_EXT.test(u.pathname) || VID_EXT.test(u.pathname))) return true
          return false
        } catch {
          return true
        }
      }

      const justSticker = /^\[(VIP_EMOJI|STICKER):\/[^\]]+\]$/.test(String(body).trim())
      const urls = extractUrls(body)
      const forbidden = justSticker ? false : urls.some((u) => !isAllowed(u))
      if (forbidden) {
        return fail(t('forum_links_admin_vip_only'))
      }
    }

    // профиль
    const prof = safeReadProfile(uid) || {}
    const nickForSend = resolveNickForDisplay(uid, prof.nickname)
    const iconForSend = resolveIconForDisplay(uid, prof.icon)

    // родитель
    const parentId = (replyTo?.id) || (threadRoot?.id) || null
    const isReply = !!parentId

    // OPTIMISTIC
    const tmpId = `tmp_p_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const p = {
      id: tmpId,
      cid: tmpId,
      topicId: String(selectedTopic.id),
      parentId: parentId ? String(parentId) : null,
      text: body,
      ts: Date.now(),
      userId: uid,
      nickname: nickForSend,
      icon: iconForSend,
      isAdmin: isAdm,
      likes: 0,
      dislikes: 0,
      views: 0,
      myReaction: null,
    }

    setOverlay((prev) => ({
      ...prev,
      creates: {
        ...prev.creates,
        posts: [...(prev.creates.posts || []), p],
      },
    }))

    try { centerPostAfterDom(tmpId, 'auto') } catch {}

    if (isReply) {
      const parentPost = (data?.posts || []).find((x) => String(x.id) === String(parentId))
      setThreadRoot(parentPost || { id: String(parentId) })
    }

    // батч на бэк
    try { if (hasComposerMedia) setMediaPhase('Sending') } catch {}
    try { if (hasComposerMedia) setMediaPct((pp) => Math.max(98, Number(pp || 0))) } catch {}
    pushOp('create_post', {
      topicId: selectedTopic.id,
      text: body,
      parentId,
      nickname: p.nickname,
      icon: p.icon,
      cid: tmpId,
      id: tmpId,
    })
    try { syncNowRef.current?.() } catch {}

    setComposerActive(false)
    emitPostCreated?.(p.id, selectedTopic.id)

    // сброс UI
    setText('')
    setPendingImgs([])
    try { if (pendingAudio && /^blob:/.test(pendingAudio)) URL.revokeObjectURL(pendingAudio) } catch {}
    setPendingAudio(null)

    // добив прогресса: таймер/пайплайн MUST die после отправки
    try { stopMediaProg() } catch {}
    try { setMediaPipelineOn(false) } catch {}
    try { setMediaBarOn(false) } catch {}
    try { setMediaPhase('idle') } catch {}
    try { setMediaPct(0) } catch {}
    try { setVideoProgress(0) } catch {}
    setReplyTo(null)
    toast?.ok?.(t('forum_post_sent'))
    postingRef.current = false
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
  }

  return {
    postingRef,
    createPost,
  }
}
