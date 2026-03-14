import { useCallback, useEffect, useRef } from 'react'
import {
  shouldThrottleDiagEvent,
  shouldRefreshDiagMediaSnapshot,
  emptyDiagMediaSnapshot,
} from '../utils/emitPolicy'

function isDiagEnabled() {
  try {
    if (String(process.env.NEXT_PUBLIC_FORUM_DIAG || '') === '1') return true
  } catch {}
  try {
    const qs = new URLSearchParams(window.location.search || '')
    const fromQuery = String(qs.get('forumDiag') || '').trim()
    if (fromQuery === '1' || fromQuery.toLowerCase() === 'true') return true
  } catch {}
  return false
}

export default function useForumDiagnostics() {
  const diagSeqRef = useRef(0)
  const diagLastSentRef = useRef(0)
  const diagSnapshotRef = useRef({ ts: 0, media: null })
  const diagLastScrollYRef = useRef(0)
  const enabledRef = useRef(false)

  const emitDiag = useCallback(async (event, extra = {}, opts = {}) => {
    try {
      if (!enabledRef.current) return
      const now = Date.now()
      const force = !!opts?.force
      const throttleState = shouldThrottleDiagEvent(
        event,
        now,
        diagLastSentRef.current,
        force,
      )
      if (throttleState.skip) return
      diagLastSentRef.current = throttleState.nextLastSentTs

      const needsFreshMedia = shouldRefreshDiagMediaSnapshot(
        event,
        now,
        diagSnapshotRef.current,
        force,
      )

      let mediaSnapshot = diagSnapshotRef.current?.media || null
      if (needsFreshMedia) {
        const videos = Array.from(document.querySelectorAll('video'))
        const audios = Array.from(document.querySelectorAll('audio'))
        const iframes = Array.from(document.querySelectorAll('iframe[data-forum-media]'))
        const qcastAudios = Array.from(document.querySelectorAll('audio[data-qcast-audio="1"]'))
        let playing = 0
        for (const v of videos) {
          try {
            if (!v.paused && !v.ended && v.readyState >= 2) playing++
          } catch {}
        }
        let audioPlaying = 0
        for (const a of audios) {
          try {
            if (!a.paused && !a.ended && a.readyState >= 2) audioPlaying++
          } catch {}
        }
        let qcastPlaying = 0
        for (const a of qcastAudios) {
          try {
            if (!a.paused && !a.ended && a.readyState >= 2) qcastPlaying++
          } catch {}
        }

        const iframesLoaded = iframes.filter((f) => {
          try {
            return !!f.getAttribute('src')
          } catch {
            return false
          }
        }).length
        const iframesActive = iframes.filter((f) => {
          try {
            return f.getAttribute('data-forum-iframe-active') === '1'
          } catch {
            return false
          }
        }).length
        const ytIframes = iframes.filter((f) => {
          try {
            return f.getAttribute('data-forum-media') === 'youtube'
          } catch {
            return false
          }
        }).length
        const ttIframes = iframes.filter((f) => {
          try {
            return f.getAttribute('data-forum-media') === 'tiktok'
          } catch {
            return false
          }
        }).length
        const genericIframes = iframes.filter((f) => {
          try {
            return f.getAttribute('data-forum-media') === 'iframe'
          } catch {
            return false
          }
        }).length
        mediaSnapshot = {
          videos: videos.length,
          videosPlaying: playing,
          audios: audios.length,
          audiosPlaying: audioPlaying,
          qcastAudios: qcastAudios.length,
          qcastPlaying,
          iframes: iframes.length,
          iframesLoaded,
          iframesActive,
          ytIframes,
          ttIframes,
          genericIframes,
        }
        diagSnapshotRef.current = { ts: now, media: mediaSnapshot }
      }
      if (!mediaSnapshot) {
        mediaSnapshot = emptyDiagMediaSnapshot()
      }
      const ytPlayers = (() => {
        try {
          const mapRef = window?.__forumYtPlayers
          return mapRef && mapRef instanceof Map ? mapRef.size : 0
        } catch {
          return 0
        }
      })()

      const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : ''
      const isIOS = /iP(hone|ad|od)/i.test(ua)
      const isAndroid = /Android/i.test(ua)
      const isTelegramMiniApp = /Telegram/i.test(ua) || !!window?.Telegram?.WebApp
      const isChromeLike = /Chrome|Chromium|CriOS|Edg|OPR/i.test(ua)
      const isSafariLike = /Safari/i.test(ua) && !isChromeLike && !/FxiOS/i.test(ua)
      const coarsePointer = !!window?.matchMedia?.('(pointer: coarse)')?.matches

      const mem = performance && performance.memory
        ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          }
        : null

      const payload = {
        seq: ++diagSeqRef.current,
        event,
        href: String(location?.href || ''),
        vis: String(document?.visibilityState || ''),
        ua,
        deviceMemory: typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined,
        env: {
          isIOS,
          isAndroid,
          isSafariLike,
          isChromeLike,
          isTelegramMiniApp,
          coarsePointer,
        },
        scrollY: typeof window !== 'undefined' ? window.scrollY : undefined,
        innerH: typeof window !== 'undefined' ? window.innerHeight : undefined,
        docH: document?.documentElement?.scrollHeight,
        videos: mediaSnapshot.videos,
        videosPlaying: mediaSnapshot.videosPlaying,
        audios: mediaSnapshot.audios,
        audiosPlaying: mediaSnapshot.audiosPlaying,
        qcastAudios: mediaSnapshot.qcastAudios,
        qcastPlaying: mediaSnapshot.qcastPlaying,
        iframes: mediaSnapshot.iframes,
        iframesLoaded: mediaSnapshot.iframesLoaded,
        iframesActive: mediaSnapshot.iframesActive,
        ytIframes: mediaSnapshot.ytIframes,
        ttIframes: mediaSnapshot.ttIframes,
        genericIframes: mediaSnapshot.genericIframes,
        ytPlayers,
        mem,
        extra,
      }

      await fetch('/api/debug/forum-diag', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      }).catch(() => {})
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    enabledRef.current = isDiagEnabled()
    if (!enabledRef.current) return
    let stopped = false

    emitDiag('mount', {}, { force: true })

    const onErr = (e) => {
      emitDiag('error', {
        message: String(e?.message || ''),
        filename: String(e?.filename || ''),
        lineno: e?.lineno,
        colno: e?.colno,
        stack: String(e?.error?.stack || '').slice(0, 4000),
      })
    }

    const onRej = (e) => {
      const r = e?.reason
      emitDiag('unhandledrejection', {
        reason: typeof r === 'string' ? r : r?.message || '[non-string reason]',
        stack: String(r?.stack || '').slice(0, 4000),
      })
    }

    const onVis = () => {
      if (!stopped) emitDiag('visibilitychange')
    }
    const onHide = (e) => {
      if (!stopped) emitDiag('pagehide', { persisted: !!e?.persisted }, { force: true })
    }
    const onBeforeUnload = () => {
      if (!stopped) emitDiag('beforeunload', {}, { force: true })
    }

    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('beforeunload', onBeforeUnload)

    const id = setInterval(() => {
      if (stopped) return
      if (document.visibilityState !== 'visible') return
      emitDiag('tick')
    }, 5000)

    let raf = 0
    const onScroll = () => {
      if (stopped) return
      if (raf) return
      raf = requestAnimationFrame(() => {
        if (stopped) return
        raf = 0
        const y = Number(window?.scrollY || 0)
        if (Math.abs(y - Number(diagLastScrollYRef.current || 0)) < 420) return
        diagLastScrollYRef.current = y
        emitDiag('scroll')
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      stopped = true
      try {
        clearInterval(id)
      } catch {}
      try {
        window.removeEventListener('error', onErr)
      } catch {}
      try {
        window.removeEventListener('unhandledrejection', onRej)
      } catch {}
      try {
        document.removeEventListener('visibilitychange', onVis)
      } catch {}
      try {
        window.removeEventListener('pagehide', onHide)
      } catch {}
      try {
        window.removeEventListener('beforeunload', onBeforeUnload)
      } catch {}
      try {
        window.removeEventListener('scroll', onScroll)
      } catch {}
      try {
        if (raf) cancelAnimationFrame(raf)
      } catch {}
      emitDiag('unmount', {}, { force: true })
    }
  }, [emitDiag])

  return emitDiag
}
