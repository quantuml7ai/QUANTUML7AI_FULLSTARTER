import { useCallback, useEffect, useRef } from 'react'
import {
  shouldThrottleDiagEvent,
  shouldRefreshDiagMediaSnapshot,
  emptyDiagMediaSnapshot,
} from '../utils/emitPolicy'

const FORUM_DIAG_ENV_ENABLED = String(process.env.NEXT_PUBLIC_FORUM_DIAG || '') === '1'
const FORUM_PERF_TRACE_ENV_ENABLED = String(process.env.NEXT_PUBLIC_FORUM_PERF_TRACE || '') === '1'
const FORUM_DIAG_QUERY_ALLOWED = process.env.NODE_ENV !== 'production'

function isDiagEnabled() {
  if (FORUM_DIAG_ENV_ENABLED) return true
  if (!FORUM_DIAG_QUERY_ALLOWED) return false
  try {
    const qs = new URLSearchParams(window.location.search || '')
    const fromQuery = String(qs.get('forumDiag') || '').trim()
    if (fromQuery === '1' || fromQuery.toLowerCase() === 'true') return true
  } catch {}
  return false
}

function isPerfTraceEnabled() {
  if (FORUM_PERF_TRACE_ENV_ENABLED) return true
  if (!FORUM_DIAG_QUERY_ALLOWED) return false
  try {
    const qs = new URLSearchParams(window.location.search || '')
    const fromQuery = String(qs.get('forumPerf') || '').trim()
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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const readPerfSample = (event = 'sample', extra = {}) => {
      try {
        const scrollEl =
          document.querySelector('[data-forum-scroll="1"]') ||
          null
        const nav = (() => {
          try {
            const row = performance.getEntriesByType('navigation')?.[0]
            return row
              ? {
                  type: String(row.type || ''),
                  domComplete: Number(row.domComplete || 0),
                  loadEventEnd: Number(row.loadEventEnd || 0),
                }
              : null
          } catch {
            return null
          }
        })()
        const mem = performance?.memory
          ? {
              usedJSHeapSize: Number(performance.memory.usedJSHeapSize || 0),
              totalJSHeapSize: Number(performance.memory.totalJSHeapSize || 0),
              jsHeapSizeLimit: Number(performance.memory.jsHeapSizeLimit || 0),
            }
          : null
        const media =
          typeof window.dumpForumMediaSummary === 'function'
            ? window.dumpForumMediaSummary()
            : null
        const resources = (() => {
          try {
            const rows = performance.getEntriesByType('resource') || []
            const tail = rows.slice(Math.max(0, rows.length - 160))
            let media = 0
            let forumMedia = 0
            let transfer = 0
            let decoded = 0
            for (const row of tail) {
              const name = String(row?.name || '')
              const initiator = String(row?.initiatorType || '')
              if (initiator === 'media' || /\.mp4(?:$|[?#])|\.webm(?:$|[?#])/i.test(name)) {
                media += 1
                if (/\/forum\/|forum\/video-|blob\.vercel-storage\.com\/forum\//i.test(name)) {
                  forumMedia += 1
                }
              }
              transfer += Number(row?.transferSize || 0)
              decoded += Number(row?.decodedBodySize || 0)
            }
            return {
              total: rows.length,
              tail: tail.length,
              media,
              forumMedia,
              transfer,
              decoded,
            }
          } catch {
            return null
          }
        })()

        return {
          ts: Date.now(),
          event,
          vis: String(document.visibilityState || ''),
          href: String(location?.href || ''),
          wasDiscarded: !!document?.wasDiscarded,
          nav,
          scrollY: Number(window.scrollY || 0),
          innerScrollTop: Number(scrollEl?.scrollTop || 0),
          innerScrollHeight: Number(scrollEl?.scrollHeight || 0),
          innerClientHeight: Number(scrollEl?.clientHeight || 0),
          media,
          mem,
          resources,
          extra,
        }
      } catch {
        return { ts: Date.now(), event, extra: { failed: true, ...extra } }
      }
    }

    const ensurePerfHelpers = () => {
      if (typeof window.dumpForumDiagConfig !== 'function') {
        window.dumpForumDiagConfig = () => ({
          clientDiagEnabled: !!enabledRef.current,
          perfTraceAutoEnabled: isPerfTraceEnabled(),
          perfTraceRunning: !!window.__forumPerfTraceCtl,
          videoTraceEnabled: (() => {
            try {
              if (String(process.env.NEXT_PUBLIC_FORUM_VIDEO_TRACE || '') === '1') return true
            } catch {}
            try {
              const qs = new URLSearchParams(window.location.search || '')
              const fromQuery = String(qs.get('videoTrace') || '').trim()
              return fromQuery === '1' || fromQuery.toLowerCase() === 'true'
            } catch {}
            return false
          })(),
        })
      }

      if (typeof window.snapshotForumPerf !== 'function') {
        window.snapshotForumPerf = (event = 'snapshot', extra = {}) => readPerfSample(event, extra)
      }
      if (typeof window.dumpForumPerfTrace !== 'function') {
        window.dumpForumPerfTrace = () => {
          try {
            return Array.isArray(window.__forumPerfTrace) ? [...window.__forumPerfTrace] : []
          } catch {
            return []
          }
        }
      }
      if (typeof window.dumpForumPerfDigest !== 'function') {
        window.dumpForumPerfDigest = () => {
          try {
            const rows = typeof window.dumpForumPerfTrace === 'function' ? window.dumpForumPerfTrace() : []
            return rows.reduce((acc, row) => {
              const usedHeap = Number(row?.mem?.usedJSHeapSize || 0)
              const transfer = Number(row?.resources?.transfer || 0)
              const decoded = Number(row?.resources?.decoded || 0)
              const mediaTotal = Number(row?.resources?.media || 0)
              const forumMedia = Number(row?.resources?.forumMedia || 0)
              const longTaskDuration = row?.event === 'longtask' ? Number(row?.extra?.duration || 0) : 0
              const layoutShiftValue = row?.event === 'layout_shift' ? Number(row?.extra?.value || 0) : 0
              const active = Number(row?.media?.active || 0)
              const prewarm = Number(row?.media?.prewarm || 0)
              const resident = Number(row?.media?.resident || 0)
              const loadPending = Number(row?.media?.loadPending || 0)
              acc.samples += 1
              acc.events[String(row?.event || 'unknown')] = (acc.events[String(row?.event || 'unknown')] || 0) + 1
              acc.peakHeapMB = Math.max(acc.peakHeapMB, Math.round((usedHeap / 1024 / 1024) * 10) / 10)
              acc.peakTransferMB = Math.max(acc.peakTransferMB, Math.round((transfer / 1024 / 1024) * 10) / 10)
              acc.peakDecodedMB = Math.max(acc.peakDecodedMB, Math.round((decoded / 1024 / 1024) * 10) / 10)
              acc.peakMediaTail = Math.max(acc.peakMediaTail, mediaTotal)
              acc.peakForumMediaTail = Math.max(acc.peakForumMediaTail, forumMedia)
              acc.peakActive = Math.max(acc.peakActive, active)
              acc.peakPrewarm = Math.max(acc.peakPrewarm, prewarm)
              acc.peakResident = Math.max(acc.peakResident, resident)
              acc.peakLoadPending = Math.max(acc.peakLoadPending, loadPending)
              acc.longTaskCount += row?.event === 'longtask' ? 1 : 0
              acc.maxLongTaskMs = Math.max(acc.maxLongTaskMs, longTaskDuration)
              acc.layoutShiftCount += row?.event === 'layout_shift' ? 1 : 0
              acc.maxLayoutShift = Math.max(acc.maxLayoutShift, layoutShiftValue)
              if (!acc.firstTs) acc.firstTs = Number(row?.ts || 0)
              acc.lastTs = Number(row?.ts || 0)
              return acc
            }, {
              samples: 0,
              firstTs: 0,
              lastTs: 0,
              peakHeapMB: 0,
              peakTransferMB: 0,
              peakDecodedMB: 0,
              peakMediaTail: 0,
              peakForumMediaTail: 0,
              peakActive: 0,
              peakPrewarm: 0,
              peakResident: 0,
              peakLoadPending: 0,
              longTaskCount: 0,
              maxLongTaskMs: 0,
              layoutShiftCount: 0,
              maxLayoutShift: 0,
              events: {},
            })
          } catch {
            return {}
          }
        }
      }
      if (typeof window.dumpForumDomPressure !== 'function') {
        window.dumpForumDomPressure = () => {
          try {
            const allNodes = Number(document.getElementsByTagName('*')?.length || 0)
            const mediaOwners = Array.from(document.querySelectorAll('[data-forum-media]'))
            const videos = Array.from(document.querySelectorAll('video[data-forum-video="post"]'))
            const iframes = Array.from(document.querySelectorAll('iframe[data-forum-media]'))
            const cards = Number(document.querySelectorAll('article[data-forum-post-card="1"]')?.length || 0)
            const videosWithSrc = videos.filter((v) => {
              try {
                return !!String(v.getAttribute('src') || v.currentSrc || '').trim()
              } catch {
                return false
              }
            }).length
            const iframesLoaded = iframes.filter((f) => {
              try {
                return !!String(f.getAttribute('src') || '').trim()
              } catch {
                return false
              }
            }).length
            const mediaSummary =
              typeof window.dumpForumMediaSummary === 'function'
                ? window.dumpForumMediaSummary()
                : null
            const mediaInternals =
              typeof window.dumpForumMediaInternals === 'function'
                ? window.dumpForumMediaInternals()
                : null
            const mem = performance?.memory
              ? {
                  usedMB:
                    Math.round((Number(performance.memory.usedJSHeapSize || 0) / 1024 / 1024) * 10) / 10,
                  totalMB:
                    Math.round((Number(performance.memory.totalJSHeapSize || 0) / 1024 / 1024) * 10) / 10,
                  limitMB:
                    Math.round((Number(performance.memory.jsHeapSizeLimit || 0) / 1024 / 1024) * 10) / 10,
                }
              : null
            return {
              ts: Date.now(),
              allNodes,
              postCards: cards,
              mediaOwners: mediaOwners.length,
              videos: videos.length,
              videosWithSrc,
              iframes: iframes.length,
              iframesLoaded,
              mem,
              mediaSummary,
              mediaInternals,
            }
          } catch (error) {
            return {
              ts: Date.now(),
              error: String(error?.message || error || 'dump_forum_dom_pressure_failed'),
            }
          }
        }
      }
      if (typeof window.clearForumPerfTrace !== 'function') {
        window.clearForumPerfTrace = () => {
          try { window.__forumPerfTrace = [] } catch {}
          return []
        }
      }
      if (typeof window.stopForumPerfTrace !== 'function') {
        window.stopForumPerfTrace = () => {
          try {
            const ctl = window.__forumPerfTraceCtl
            ctl?.stop?.()
            delete window.__forumPerfTraceCtl
          } catch {}
          return typeof window.dumpForumPerfTrace === 'function' ? window.dumpForumPerfTrace() : []
        }
      }
      if (typeof window.startForumPerfTrace !== 'function') {
        window.startForumPerfTrace = (opts = {}) => {
          try {
            window.stopForumPerfTrace?.()
          } catch {}
          try {
            performance?.setResourceTimingBufferSize?.(4000)
          } catch {}
          if (opts?.clearResources !== false) {
            try { performance?.clearResourceTimings?.() } catch {}
          }

          const bucket = []
          const push = (event, extra = {}) => {
            try {
              bucket.push(readPerfSample(event, extra))
              while (bucket.length > 600) bucket.shift()
              window.__forumPerfTrace = bucket
            } catch {}
          }

          const sampleMs = Math.max(300, Number(opts?.sampleMs || 1200))
          const scrollDelta = Math.max(60, Number(opts?.scrollDelta || 240))
          let lastScrollTop = Number(window.scrollY || 0)
          let scrollRaf = 0

          const onScroll = () => {
            if (scrollRaf) return
            scrollRaf = requestAnimationFrame(() => {
              scrollRaf = 0
              const scrollEl = document.querySelector('[data-forum-scroll="1"]') || null
              const top = Number(scrollEl?.scrollTop || window.scrollY || 0)
              if (Math.abs(top - lastScrollTop) < scrollDelta) return
              lastScrollTop = top
              push('scroll', { top })
            })
          }
          const onVisibility = () => push('visibilitychange')
          const onPageHide = (e) => push('pagehide', { persisted: !!e?.persisted })
          const onPageShow = (e) => push('pageshow', { persisted: !!e?.persisted })
          const onFreeze = () => push('freeze')
          const onResume = () => push('resume')
          const onResize = () => push('resize', { w: Number(window.innerWidth || 0), h: Number(window.innerHeight || 0) })

          const perfObservers = []
          const observeEntryType = (type, handler) => {
            try {
              if (typeof PerformanceObserver === 'undefined') return
              const po = new PerformanceObserver((list) => {
                try {
                  handler(list.getEntries() || [])
                } catch {}
              })
              po.observe({ type, buffered: true })
              perfObservers.push(po)
            } catch {}
          }

          observeEntryType('longtask', (entries) => {
            for (const entry of entries.slice(-6)) {
              push('longtask', {
                duration: Number(entry?.duration || 0),
                name: String(entry?.name || ''),
              })
            }
          })
          observeEntryType('layout-shift', (entries) => {
            for (const entry of entries.slice(-6)) {
              if (entry?.hadRecentInput) continue
              const sources = (() => {
                try {
                  return Array.from(entry?.sources || []).slice(0, 3).map((src) => {
                    const node = src?.node
                    if (!(node instanceof Element)) return null
                    return {
                      tag: String(node.tagName || '').toLowerCase(),
                      cls: String(node.className || '').slice(0, 120),
                      forumMedia: String(node.getAttribute?.('data-forum-media') || ''),
                      forumVideo: String(node.getAttribute?.('data-forum-video') || ''),
                      adSlot: String(node.getAttribute?.('data-ad-slot') || ''),
                    }
                  }).filter(Boolean)
                } catch {
                  return []
                }
              })()
              push('layout_shift', {
                value: Number(entry?.value || 0),
                sources,
              })
            }
          })

          const timer = setInterval(() => {
            push('tick')
          }, sampleMs)

          try { window.addEventListener('scroll', onScroll, { passive: true, capture: true }) } catch {}
          try { document.addEventListener('visibilitychange', onVisibility) } catch {}
          try { window.addEventListener('pagehide', onPageHide) } catch {}
          try { window.addEventListener('pageshow', onPageShow) } catch {}
          try { document.addEventListener('freeze', onFreeze) } catch {}
          try { document.addEventListener('resume', onResume) } catch {}
          try { window.addEventListener('resize', onResize, { passive: true }) } catch {}

          push('trace_start', { sampleMs, scrollDelta })

          window.__forumPerfTraceCtl = {
            stop() {
              try { clearInterval(timer) } catch {}
              try { window.removeEventListener('scroll', onScroll, { capture: true }) } catch {}
              try { document.removeEventListener('visibilitychange', onVisibility) } catch {}
              try { window.removeEventListener('pagehide', onPageHide) } catch {}
              try { window.removeEventListener('pageshow', onPageShow) } catch {}
              try { document.removeEventListener('freeze', onFreeze) } catch {}
              try { document.removeEventListener('resume', onResume) } catch {}
              try { window.removeEventListener('resize', onResize) } catch {}
              try { if (scrollRaf) cancelAnimationFrame(scrollRaf) } catch {}
              try { perfObservers.forEach((po) => po?.disconnect?.()) } catch {}
              push('trace_stop')
            },
          }

          return bucket
        }
      }
      if (typeof window.markForumPerf !== 'function') {
        window.markForumPerf = (label = 'mark', extra = {}) => {
          try {
            const bucket = Array.isArray(window.__forumPerfTrace) ? window.__forumPerfTrace : []
            bucket.push(readPerfSample('mark', { label: String(label || 'mark'), ...extra }))
            while (bucket.length > 600) bucket.shift()
            window.__forumPerfTrace = bucket
            return bucket
          } catch {
            return []
          }
        }
      }
    }

    ensurePerfHelpers()
    if (isPerfTraceEnabled() && !window.__forumPerfTraceCtl) {
      try { window.startForumPerfTrace() } catch {}
    }
    return () => {}
  }, [])

  return emitDiag
}
