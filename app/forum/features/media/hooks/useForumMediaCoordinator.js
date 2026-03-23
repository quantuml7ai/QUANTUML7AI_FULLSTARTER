import { useEffect } from 'react'

import { isBrowser } from '../../../shared/utils/browser'
import {
  MEDIA_MUTED_KEY,
  MEDIA_VIDEO_MUTED_KEY,
  MEDIA_MUTED_EVENT,
  readMutedPrefFromStorage,
  __touchActiveVideoEl,
  __dropActiveVideoEl,
  __enforceActiveVideoCap,
  __restoreVideoEl,
  __unloadVideoEl,
  __hasLazyVideoSourceWithoutSrc,
  __isVideoNearViewport,
  __MEDIA_VIS_MARGIN_PX,
} from '../utils/mediaLifecycleRuntime'

export default function useForumMediaCoordinator({ emitDiag }) {
  // === Ленивая подгрузка превью видео в постах ===
  useEffect(() => { 
    if (!isBrowser()) return;
    const enableLegacyWarmSweep = (() => {
      try {
        if (String(process.env.NEXT_PUBLIC_FORUM_LEGACY_WARM_SWEEP || '') === '1') return true;
      } catch {}
      try {
        const qs = new URLSearchParams(window.location.search || '');
        const fromQuery = String(qs.get('legacyWarmSweep') || '').trim().toLowerCase();
        return fromQuery === '1' || fromQuery === 'true' || fromQuery === 'on';
      } catch {}
      return false;
    })();
    // Legacy warm-sweep по умолчанию отключен: он конфликтует с основным coordinator
    // и может создавать лишние restore/load циклы.
    if (!enableLegacyWarmSweep) return;

    const selector = 'video[data-forum-video="post"]';

    const pending = new Map();
    let warmSweepRaf = 0;
    let warmSweepTimeout = 0;
    let warmSweepSettleTimer = 0;
    let lastWarmSweepTs = 0;
    let lastWarmSweepTop = -1;
    const warmLeaseUntil = new WeakMap();
    const traceEnabled = (() => {
      try {
        if (String(process.env.NEXT_PUBLIC_FORUM_VIDEO_TRACE || '') === '1') return true;
      } catch {}
      try {
        const qs = new URLSearchParams(window.location.search || '');
        const fromQuery = String(qs.get('videoTrace') || '').trim();
        if (fromQuery === '1' || fromQuery.toLowerCase() === 'true') return true;
      } catch {}
      return false;
    })();
    const trace = (event, video, extra = {}) => {
      if (!traceEnabled) return;
      try {
        const bucket = Array.isArray(window.__forumVideoTrace) ? window.__forumVideoTrace : [];
        const src = String(
          video?.dataset?.__src ||
          video?.getAttribute?.('data-src') ||
          video?.currentSrc ||
          video?.getAttribute?.('src') ||
          ''
        );
        bucket.push({
          ts: Date.now(),
          event,
          id: String(video?.dataset?.__mid || ''),
          src,
          readyState: Number(video?.readyState || 0),
          networkState: Number(video?.networkState || 0),
          loadPending: String(video?.dataset?.__loadPending || ''),
          warmReady: String(video?.dataset?.__warmReady || ''),
          active: String(video?.dataset?.__active || ''),
          prewarm: String(video?.dataset?.__prewarm || ''),
          resident: String(video?.dataset?.__resident || ''),
          ...extra,
        });
        while (bucket.length > 500) bucket.shift();
        window.__forumVideoTrace = bucket;
      } catch {}
    };
    try {
      if (traceEnabled && typeof window.dumpForumVideoTrace !== 'function') {
        window.dumpForumVideoTrace = () => {
          try {
            return Array.isArray(window.__forumVideoTrace) ? [...window.__forumVideoTrace] : [];
          } catch {
            return [];
          }
        };
      }
    } catch {}
    const schedulePrepare = (fn) => {
      let done = false;
      const run = () => {
        if (done) return;
        done = true;
        try { fn(); } catch {}
      };
      const rafId = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : 0;
      const timeoutId = setTimeout(run, 12);
      return { rafId, timeoutId };
    };
    const cancelPrepare = (job) => {
      try {
        if (job?.rafId) cancelAnimationFrame(job.rafId);
      } catch {}
      try {
        if (job?.timeoutId) clearTimeout(job.timeoutId);
      } catch {}
    };

    const isIOSWarm = (() => {
      try {
        return /iP(hone|ad|od)/i.test(String(navigator?.userAgent || ''));
      } catch {
        return false;
      }
    })();
    const isCoarseWarm = (() => {
      try {
        return !!window?.matchMedia?.('(pointer: coarse)')?.matches;
      } catch {
        return false;
      }
    })();
    const warmMarginTop = Math.max(isIOSWarm ? 560 : 420, Math.round(__MEDIA_VIS_MARGIN_PX * (isIOSWarm ? 1.9 : 1.6)));
    const warmMarginBottom = Math.max(isIOSWarm ? 1120 : 760, Math.round(__MEDIA_VIS_MARGIN_PX * (isIOSWarm ? 2.85 : 2.35)));
    const poolMargin = Math.max(warmMarginTop, warmMarginBottom);
    const warmResidentCap = isIOSWarm ? 3 : (isCoarseWarm ? 1 : 3);
    const eagerWarmCount = isIOSWarm ? 2 : 1;
    const warmLeaseMs = isIOSWarm ? 1480 : (isCoarseWarm ? 820 : 900);
    const residentLeaseMs = isIOSWarm ? 980 : (isCoarseWarm ? 480 : 650);
    const farUnloadMargin = isIOSWarm
      ? Math.max(Math.round(poolMargin * 1.7), 1680)
      : isCoarseWarm
        ? Math.max(Math.round(poolMargin * 1.25), 980)
        : Math.max(Math.round(poolMargin * 1.85), 1400);

    const extendWarmLease = (video, ms) => {
      try {
        warmLeaseUntil.set(video, Date.now() + Math.max(120, Number(ms || 0)));
      } catch {}
    };

    const warm = (video) => {
      if (!(video instanceof HTMLVideoElement)) return;

      try {
        // Более ранний prewarm: к зоне фокуса хотим уже готовый первый кадр.
        video.dataset.__resident = '1';
        video.dataset.__prewarm = '1';
        video.preload = 'auto';
        extendWarmLease(video, warmLeaseMs);
        trace('warm', video);

        // Если первый кадр/данные уже готовы — ничего не делаем
        if (video.readyState >= 2) return;
        if (video.dataset?.__loadPending === '1') return;
        if (__hasLazyVideoSourceWithoutSrc(video)) {
          // Prime the lazy source before entering the autoplay focus zone for TikTok-like instant start.
          trace('warm_restore', video);
          __restoreVideoEl(video);
          return;
        }

        // Подготовка должна происходить заранее, а не ждать idle во время скролла.
        if (pending.has(video)) return;
        const job = schedulePrepare(() => {
          pending.delete(video);
          try {
            if (!video.isConnected) return;
            if (__hasLazyVideoSourceWithoutSrc(video)) return;
            const cold = (video.readyState === 0 || !video.currentSrc);
            const safe = cold && video.paused && (video.currentTime === 0);
            if (safe && video.dataset?.__loadPending !== '1') {
              try { video.dataset.__loadPending = '1'; } catch {}
              trace('warm_load', video);
              video.load?.();
            }
          } catch {}
        });
        pending.set(video, job);
      } catch {}
    };

    const keepResident = (video) => {
      if (!(video instanceof HTMLVideoElement)) return;
      try {
        video.dataset.__resident = '1';
        if (video.dataset?.__active !== '1') video.dataset.__prewarm = '0';
        extendWarmLease(video, residentLeaseMs);
        if (__hasLazyVideoSourceWithoutSrc(video)) {
          __restoreVideoEl(video);
        }
        if (video.dataset?.__active !== '1') {
          video.preload = 'metadata';
        }
        trace('resident', video);
      } catch {}
    };

    const cool = (video) => {
      if (!(video instanceof HTMLVideoElement)) return;
      const now = Date.now();
      try {
        video.dataset.__prewarm = '0';
        video.dataset.__resident = '0';
        trace('cool', video);
      } catch {}
      try {
        if (video.dataset?.__active === '1') return;
        const hasLease = Number(warmLeaseUntil.get(video) || 0) > now;
        const nearViewport = __isVideoNearViewport(video, poolMargin);
        const farViewport = !__isVideoNearViewport(video, farUnloadMargin);
        const loadPending = video.dataset?.__loadPending === '1';
        if (loadPending && (nearViewport || hasLease)) {
          video.dataset.__resident = '1';
          video.preload = 'auto';
          return;
        }
        video.preload = 'metadata';
        if (!farViewport) return;
        if (hasLease && loadPending) return;
        __dropActiveVideoEl(video);
        __unloadVideoEl(video);
      } catch {}
    };

    const runWarmSweep = () => {
      try {
        const vh = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        const centerY = vh / 2;
        const keepCount = Math.max(eagerWarmCount, warmResidentCap);
        const ranked = Array.from(document.querySelectorAll(selector))
          .filter((video) => video instanceof HTMLVideoElement && video.isConnected)
          .map((video) => {
            try {
              const rect = video.getBoundingClientRect?.();
              const center = rect ? ((rect.top + rect.bottom) / 2) : 0;
              const dist = Math.abs(center - centerY);
              const near = __isVideoNearViewport(video, poolMargin);
              return { video, dist, near };
            } catch {
              return { video, dist: Number.MAX_SAFE_INTEGER, near: false };
            }
          })
          .filter((item) => item.near)
          .sort((a, b) => a.dist - b.dist);

        const keep = ranked.slice(0, keepCount);
        const keepSet = new Set(keep.map((item) => item.video));

        keep.forEach(({ video }, index) => {
          if (index < eagerWarmCount) warm(video);
          else keepResident(video);
        });

        Array.from(document.querySelectorAll(selector)).forEach((video) => {
          if (!(video instanceof HTMLVideoElement)) return;
          if (keepSet.has(video)) return;
          cool(video);
        });
      } catch {}
    };

    const cancelWarmSweepSchedule = () => {
      if (warmSweepRaf) {
        try { cancelAnimationFrame(warmSweepRaf); } catch {}
        warmSweepRaf = 0;
      }
      if (warmSweepTimeout) {
        try { clearTimeout(warmSweepTimeout); } catch {}
        warmSweepTimeout = 0;
      }
      if (warmSweepSettleTimer) {
        try { clearTimeout(warmSweepSettleTimer); } catch {}
        warmSweepSettleTimer = 0;
      }
    };

    const readWarmSweepScrollTop = () => {
      try {
        const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null;
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
          return Number(scrollEl.scrollTop || 0);
        }
      } catch {}
      try {
        return Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0);
      } catch {}
      return 0;
    };

    const scheduleWarmSweep = (mode = 'debounce') => {
      if (mode === 'debounce') {
        if (warmSweepSettleTimer) {
          try { clearTimeout(warmSweepSettleTimer); } catch {}
          warmSweepSettleTimer = 0;
        }
        warmSweepSettleTimer = setTimeout(() => {
          warmSweepSettleTimer = 0;
          scheduleWarmSweep('immediate');
        }, isCoarseWarm ? 220 : 128);
        return;
      }
      if (warmSweepRaf || warmSweepTimeout) return;
      const runner = () => {
        warmSweepRaf = 0;
        warmSweepTimeout = 0;
        const now = Date.now();
        const top = readWarmSweepScrollTop();
        const topDelta = Math.abs(top - lastWarmSweepTop);
        if ((now - lastWarmSweepTs) < (isCoarseWarm ? 280 : 180) && topDelta < (isCoarseWarm ? 420 : 220)) return;
        lastWarmSweepTs = now;
        lastWarmSweepTop = top;
        runWarmSweep();
      };
      try {
        warmSweepRaf = requestAnimationFrame(runner);
      } catch {
        warmSweepTimeout = setTimeout(runner, 32);
      }
    };

    // если нет IntersectionObserver — готовим всё сразу
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(selector).forEach(warm);
      return () => {
        try {
          pending.forEach((job) => { try { cancelPrepare(job); } catch {} });
          pending.clear();
        } catch {}
      };
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runWarmSweep();
            return;
          }
          cool(entry.target);
        });
      },
      {
        // Чуть раньше подготавливаем медиа, чтобы автоплей не "спотыкался"
        // при входе в зону фокуса на мобильных.
        threshold: 0.01,
        rootMargin: `${warmMarginTop}px 0px ${warmMarginBottom}px 0px`,
      }
    );

    document.querySelectorAll(selector).forEach((v) => {
      io.observe(v);
    });
    runWarmSweep();

    const onWarmSweepResize = () => runWarmSweep();
    const onWarmSweepScroll = () => {
      const now = Date.now();
      const top = readWarmSweepScrollTop();
      const topDelta = Math.abs(top - lastWarmSweepTop);
      if (lastWarmSweepTop >= 0 && topDelta < (isCoarseWarm ? 72 : 24)) return;
      if (topDelta > (isCoarseWarm ? 900 : 1400) && (now - lastWarmSweepTs) > (isCoarseWarm ? 260 : 320)) {
        scheduleWarmSweep('immediate');
        return;
      }
      scheduleWarmSweep('debounce');
    };
    const onWarmSweepVisibility = () => {
      try {
        if (document.visibilityState === 'visible') runWarmSweep();
      } catch {}
    };
    const scrollEl = (() => {
      try {
        const el = document.querySelector?.('[data-forum-scroll="1"]') || null;
        if (el && el.scrollHeight > el.clientHeight + 1) return el;
      } catch {}
      return null;
    })();
    try { window.addEventListener('resize', onWarmSweepResize, { passive: true }); } catch {}
    if (scrollEl) {
      try { scrollEl.addEventListener('scroll', onWarmSweepScroll, { passive: true }); } catch {}
    } else {
      try { window.addEventListener('scroll', onWarmSweepScroll, { passive: true }); } catch {}
    }
    try { document.addEventListener('visibilitychange', onWarmSweepVisibility); } catch {}

    return () => {
      io.disconnect();
      try { window.removeEventListener('resize', onWarmSweepResize); } catch {}
      if (scrollEl) {
        try { scrollEl.removeEventListener('scroll', onWarmSweepScroll); } catch {}
      } else {
        try { window.removeEventListener('scroll', onWarmSweepScroll); } catch {}
      }
      try { document.removeEventListener('visibilitychange', onWarmSweepVisibility); } catch {}
      cancelWarmSweepSchedule();
      try {
        pending.forEach((job) => { try { cancelPrepare(job); } catch {} });
        pending.clear();
      } catch {}
    };
  }, []);
  // === Ранний prewarm iframe (YouTube/TikTok/other embeds) для более быстрого старта в зоне фокуса ===
  useEffect(() => {
    if (!isBrowser()) return;
    if (!('IntersectionObserver' in window)) return;
    const iOSLikeUi = (() => {
      try {
        const ua = String(navigator?.userAgent || '');
        return /iP(hone|ad|od)/i.test(ua);
      } catch {
        return false;
      }
    })();
    const coarseUi = (() => {
      try {
        return !!window?.matchMedia?.('(pointer: coarse)')?.matches;
      } catch {
        return false;
      }
    })();
    const enableLegacyIframePrewarm = (() => {
      try {
        if (String(process.env.NEXT_PUBLIC_FORUM_LEGACY_IFRAME_PREWARM || '') === '1') return true;
      } catch {}
      try {
        const qs = new URLSearchParams(window.location.search || '');
        const fromQuery = String(qs.get('legacyIframePrewarm') || '').trim().toLowerCase();
        return fromQuery === '1' || fromQuery === 'true' || fromQuery === 'on';
      } catch {}
      return false;
    })();
    const autoEnableMobileWarm = iOSLikeUi || coarseUi;
    if (!enableLegacyIframePrewarm && !autoEnableMobileWarm) return;

    const selector = 'iframe[data-forum-media="youtube"],iframe[data-forum-media="tiktok"],iframe[data-forum-media="iframe"]';
    const isCoarseUi = (() => {
      try {
        const ua = String(navigator?.userAgent || '');
        return /iP(hone|ad|od)|Android/i.test(ua) || !!window?.matchMedia?.('(pointer: coarse)')?.matches;
      } catch {
        return false;
      }
    })();
    const prewarmCap = isCoarseUi ? 1 : 2;

    const getLoadedIframeCount = () => {
      try {
        return Array.from(document.querySelectorAll(selector)).filter((el) => {
          try { return !!el.getAttribute('src'); } catch { return false; }
        }).length;
      } catch {
        return 0;
      }
    };

    const prewarm = (node) => {
      const el = node instanceof HTMLIFrameElement ? node : null;
      if (!el) return;
      if (el.dataset.forumPrewarmInit === '1') return;
      const src = String(el.getAttribute('data-src') || '').trim();
      if (!src) return;
      const cur = String(el.getAttribute('src') || '').trim();
      if (cur) {
        el.dataset.forumPrewarmInit = '1';
        return;
      }
      if (getLoadedIframeCount() >= prewarmCap) return;
      try { el.setAttribute('src', src); } catch {}
      try { el.setAttribute('data-forum-last-active-ts', String(Date.now())); } catch {}
      try { el.dataset.forumPrewarmInit = '1'; } catch {}
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          prewarm(entry.target);
        }
      },
      {
        threshold: 0.01,
        rootMargin: `${Math.max(210, Math.round(__MEDIA_VIS_MARGIN_PX * 1.0))}px 0px ${Math.max(290, Math.round(__MEDIA_VIS_MARGIN_PX * 1.35))}px 0px`,
      }
    );

    try { document.querySelectorAll(selector).forEach((el) => io.observe(el)); } catch {}

    let mo = null;
    try {
      mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const n of (m.addedNodes || [])) {
            if (!(n instanceof Element)) continue;
            if (n.matches?.(selector)) io.observe(n);
            try { n.querySelectorAll?.(selector)?.forEach?.((el) => io.observe(el)); } catch {}
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch {}

    return () => {
      try { mo?.disconnect?.(); } catch {}
      try { io.disconnect(); } catch {}
    };
  }, []);
  // === Shorts-like autoplay: play when in focus, pause when out ===
  // Расширено для video + audio + iframe (YouTube/TikTok best-effort).
  useEffect(() => {
    if (!isBrowser()) return;

    const selector = '[data-forum-media]';
    const readyReplay = new Map();
    const pendingReadyGrace = new WeakMap();
    let lastDetachedSweepTs = 0;
    const traceEnabled = (() => {
      try {
        if (String(process.env.NEXT_PUBLIC_FORUM_VIDEO_TRACE || '') === '1') return true;
      } catch {}
      try {
        const qs = new URLSearchParams(window.location.search || '');
        const fromQuery = String(qs.get('videoTrace') || '').trim();
        if (fromQuery === '1' || fromQuery.toLowerCase() === 'true') return true;
      } catch {}
      return false;
    })();
    const trace = (event, el, extra = {}) => {
      if (!traceEnabled) return;
      try {
        const bucket = Array.isArray(window.__forumVideoTrace) ? window.__forumVideoTrace : [];
        const src = String(
          el?.dataset?.__src ||
          el?.getAttribute?.('data-src') ||
          el?.currentSrc ||
          el?.getAttribute?.('src') ||
          ''
        );
        bucket.push({
          ts: Date.now(),
          event,
          kind: String(el?.getAttribute?.('data-forum-media') || ''),
          id: String(el?.dataset?.__mid || ''),
          src,
          readyState: Number(el?.readyState || 0),
          networkState: Number(el?.networkState || 0),
          loadPending: String(el?.dataset?.__loadPending || ''),
          warmReady: String(el?.dataset?.__warmReady || ''),
          active: String(el?.dataset?.__active || ''),
          ...extra,
        });
        while (bucket.length > 500) bucket.shift();
        window.__forumVideoTrace = bucket;
      } catch {}
    };
    const candidateTraceState = { key: '', ts: 0 };
    const traceCandidate = (event, el, extra = {}) => {
      if (!traceEnabled) return;
      try {
        const key = [
          event,
          String(el?.dataset?.__mid || el?.getAttribute?.('data-src') || ''),
          Math.round(Number(extra?.ratio || 0) * 100),
          Math.round(Number(extra?.activeRatio || 0) * 100),
          String(extra?.reason || ''),
        ].join('|');
        const now = Date.now();
        if (candidateTraceState.key === key && (now - candidateTraceState.ts) < 140) return;
        candidateTraceState.key = key;
        candidateTraceState.ts = now;
      } catch {}
      trace(event, el, extra);
    };
    try {
      window.dumpForumMediaState = () => {
        try {
          return Array.from(document.querySelectorAll(selector)).map((el) => {
            const mediaEl =
              el instanceof HTMLMediaElement
                ? el
                : el.querySelector?.('audio[data-qcast-audio="1"],video');
            const rect = el.getBoundingClientRect?.();
            const isHtml = mediaEl instanceof HTMLMediaElement;
            const playing = isHtml
              ? (!mediaEl.paused && !mediaEl.ended && Number(mediaEl.readyState || 0) >= 2)
              : false;
            return {
              kind: String(el?.getAttribute?.('data-forum-media') || ''),
              id: String(el?.dataset?.__mid || mediaEl?.dataset?.__mid || ''),
              src: String(
                mediaEl?.currentSrc ||
                mediaEl?.getAttribute?.('src') ||
                el?.getAttribute?.('src') ||
                el?.getAttribute?.('data-src') ||
                ''
              ),
              readyState: Number(mediaEl?.readyState || 0),
              networkState: Number(mediaEl?.networkState || 0),
              isHtml,
              paused: isHtml ? !!mediaEl?.paused : false,
              playing,
              muted: !!mediaEl?.muted,
              active: String(mediaEl?.dataset?.__active || el?.dataset?.__active || ''),
              prewarm: String(mediaEl?.dataset?.__prewarm || el?.dataset?.__prewarm || ''),
              resident: String(mediaEl?.dataset?.__resident || el?.dataset?.__resident || ''),
              warmReady: String(mediaEl?.dataset?.__warmReady || ''),
              loadPending: String(mediaEl?.dataset?.__loadPending || ''),
              userPaused: String(mediaEl?.dataset?.__userPaused || el?.dataset?.__userPaused || ''),
              systemPause: String(mediaEl?.dataset?.__systemPause || ''),
              manualLeaseUntil: Number(mediaEl?.dataset?.__manualLeaseUntil || el?.dataset?.__manualLeaseUntil || 0),
              rectTop: Number(rect?.top || 0),
              rectBottom: Number(rect?.bottom || 0),
            };
          });
        } catch {
          return [];
        }
      };
      window.dumpForumMediaSummary = () => {
        try {
          const rows = typeof window.dumpForumMediaState === 'function' ? window.dumpForumMediaState() : [];
          return rows.reduce((acc, row) => {
            acc.total += 1;
            if (row.active === '1') acc.active += 1;
            if (row.prewarm === '1') acc.prewarm += 1;
            if (row.resident === '1') acc.resident += 1;
            if (row.loadPending === '1') acc.loadPending += 1;
            if (row.warmReady === '1') acc.warmReady += 1;
            if (row.userPaused === '1') acc.userPaused += 1;
            if (row.isHtml && row.paused) acc.paused += 1;
            if (row.playing) acc.playing += 1;
            if (!row.isHtml && row.active === '1') acc.activeExternal += 1;
            return acc;
          }, {
            total: 0,
            active: 0,
            prewarm: 0,
            resident: 0,
            loadPending: 0,
            warmReady: 0,
            userPaused: 0,
            paused: 0,
            playing: 0,
            activeExternal: 0,
          });
        } catch {
          return {};
        }
      };
      window.dumpForumMediaInternals = () => {
        try {
          const ytValues = new Set();
          try {
            ytPlayers.forEach((player) => ytValues.add(player));
          } catch {}
          let detachedRatios = 0;
          let detachedReadyReplay = 0;
          let detachedYtPlayers = 0;
          let detachedYtPolls = 0;
          try {
            ratios.forEach((_, el) => {
              if (!(el instanceof Element) || !el.isConnected) detachedRatios += 1;
            });
          } catch {}
          try {
            readyReplay.forEach((_, el) => {
              if (!(el instanceof Element) || !el.isConnected) detachedReadyReplay += 1;
            });
          } catch {}
          try {
            ytPlayers.forEach((player, iframe) => {
              if (!(iframe instanceof HTMLIFrameElement) || !iframe.isConnected) detachedYtPlayers += 1;
            });
          } catch {}
          try {
            ytMutePolls.forEach((_, player) => {
              if (!ytValues.has(player)) detachedYtPolls += 1;
            });
          } catch {}
          return {
            ratiosSize: ratios.size,
            detachedRatios,
            readyReplaySize: readyReplay.size,
            detachedReadyReplay,
            ytPlayersSize: ytPlayers.size,
            detachedYtPlayers,
            ytMutePollsSize: ytMutePolls.size,
            detachedYtPolls,
            activeConnected: !!(active instanceof Element && active.isConnected),
          };
        } catch {
          return {};
        }
      };
    } catch {}

    const writeMutedPref = (val) => {
      try {
        const next = val ? '1' : '0';
        localStorage.setItem(MEDIA_MUTED_KEY, next);
        localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, next);
      } catch {}
    };
    // На каждый полный перезапуск страницы стартуем ленту в muted-режиме:
    // это стабилизирует autoplay на iPhone и не конфликтует со звуком заставки.
    let mutedPref = true;
    try {
      writeMutedPref(true);
    } catch {}

    const desiredMuted = () => (mutedPref == null ? true : !!mutedPref);
 

    const applyMutedPref = (el) => {
      if (!(el instanceof HTMLMediaElement)) return;
      const want = desiredMuted();
      if (el.muted !== want) el.muted = want;
    };
    const applyMutedPrefToAll = () => {
      try {
        const want = desiredMuted();
        document.querySelectorAll('[data-forum-media]').forEach((el) => {
          if (!(el instanceof HTMLMediaElement)) return;
          if (el.muted !== want) el.muted = want;
        });
        if (window.__forumYtPlayers && window.__forumYtPlayers instanceof Map) {
          window.__forumYtPlayers.forEach((player) => {
            try {
              if (want) player?.mute?.();
              else player?.unMute?.();
            } catch {}
          });
        }
      } catch {}
    };

    const setMutedPref = (val, source = 'forum-coordinator', emit = true) => {
      const next = !!val;
      if (mutedPref === next && source === 'forum-coordinator') return;
      mutedPref = next;
      writeMutedPref(next);
      applyMutedPrefToAll();
      if (emit) {
        try {
          window.dispatchEvent(new CustomEvent(MEDIA_MUTED_EVENT, {
            detail: { muted: next, source }
          }));
        } catch {}
      }
    };
    const getQCastAudio = (el) => {
      try {
        if (el instanceof Element && el.getAttribute?.('data-forum-media') === 'qcast') {
          const audio = el.querySelector?.('audio[data-qcast-audio="1"]');
          if (audio instanceof HTMLAudioElement) return audio;
        }
      } catch {}
      return null;
    };
    const getMediaStateNode = (el) => {
      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) return el;
      return getQCastAudio(el);
    };
    const getOwnerNode = (el) => {
      try {
        if (el instanceof Element) {
          if (el.matches?.(selector)) return el;
          return el.closest?.(selector) || null;
        }
      } catch {}
      return null;
    };
    const forEachMediaOwner = (root, fn) => {
      if (!(root instanceof Element)) return;
      try {
        if (root.matches?.(selector)) fn(root);
      } catch {}
      try {
        root.querySelectorAll?.(selector)?.forEach?.((node) => {
          if (node instanceof Element) fn(node);
        });
      } catch {}
    };
    const markSkipMutePersist = (el, ms = 650) => {
      const until = String(Date.now() + Math.max(180, Number(ms || 0)));
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) media.dataset.__skipMutePersistUntil = until;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) owner.dataset.__skipMutePersistUntil = until;
      } catch {}
    };
    const shouldSkipMutePersist = (el) => {
      try {
        const media = getMediaStateNode(el);
        const owner = getOwnerNode(el);
        const mediaUntil = Number(media?.dataset?.__skipMutePersistUntil || 0);
        const ownerUntil = Number(owner?.dataset?.__skipMutePersistUntil || 0);
        return Math.max(mediaUntil, ownerUntil) > Date.now();
      } catch {}
      return false;
    };
    const clearSkipMutePersist = (el) => {
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) delete media.dataset.__skipMutePersistUntil;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) delete owner.dataset.__skipMutePersistUntil;
      } catch {}
    };
    const clearManualLease = (el) => {
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) delete media.dataset.__manualLeaseUntil;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) delete owner.dataset.__manualLeaseUntil;
      } catch {}
    };
    const bumpPlayRequestToken = (el) => {
      let next = 1;
      try {
        const media = getMediaStateNode(el);
        const owner = getOwnerNode(el);
        const mediaToken = Number(media?.dataset?.__playReqToken || 0);
        const ownerToken = Number(owner?.dataset?.__playReqToken || 0);
        next = Math.max(0, mediaToken, ownerToken) + 1;
        const token = String(next);
        if (media?.dataset) media.dataset.__playReqToken = token;
        if (owner instanceof Element && owner.dataset) owner.dataset.__playReqToken = token;
      } catch {}
      return String(next);
    };
    const invalidatePlayRequest = (el) => {
      try {
        bumpPlayRequestToken(el);
      } catch {}
    };
    const isPlayRequestCurrent = (el, token) => {
      try {
        const media = getMediaStateNode(el);
        const owner = getOwnerNode(el);
        const mediaToken = String(media?.dataset?.__playReqToken || '');
        const ownerToken = String(owner?.dataset?.__playReqToken || '');
        const current = mediaToken || ownerToken;
        return !!String(token || '') && current === String(token);
      } catch {}
      return false;
    };
    const markSuppressedPlayback = (el, ms = 1200) => {
      const until = String(Date.now() + Math.max(200, Number(ms || 0)));
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) media.dataset.__suppressedPlayUntil = until;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) owner.dataset.__suppressedPlayUntil = until;
      } catch {}
    };
    const hasSuppressedPlayback = (el) => {
      try {
        const media = getMediaStateNode(el);
        const owner = getOwnerNode(el);
        const mediaUntil = Number(media?.dataset?.__suppressedPlayUntil || 0);
        const ownerUntil = Number(owner?.dataset?.__suppressedPlayUntil || 0);
        return Math.max(mediaUntil, ownerUntil) > Date.now();
      } catch {}
      return false;
    };
    const clearSuppressedPlayback = (el) => {
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) delete media.dataset.__suppressedPlayUntil;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) delete owner.dataset.__suppressedPlayUntil;
      } catch {}
    };
    const markUserGestureIntent = (el, ms = 1500) => {
      const until = String(Date.now() + Math.max(240, Number(ms || 0)));
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) media.dataset.__userGestureUntil = until;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) owner.dataset.__userGestureUntil = until;
      } catch {}
    };
    const hasUserGestureIntent = (el) => {
      try {
        const media = getMediaStateNode(el);
        const owner = getOwnerNode(el);
        const mediaUntil = Number(media?.dataset?.__userGestureUntil || 0);
        const ownerUntil = Number(owner?.dataset?.__userGestureUntil || 0);
        return Math.max(mediaUntil, ownerUntil) > Date.now();
      } catch {}
      return false;
    };
    const clearUserGestureIntent = (el) => {
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) delete media.dataset.__userGestureUntil;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) delete owner.dataset.__userGestureUntil;
      } catch {}
    };
    const markCoordinatorPlayIntent = (el, ms = 1200) => {
      const until = String(Date.now() + Math.max(240, Number(ms || 0)));
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) media.dataset.__coordinatorPlayUntil = until;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) owner.dataset.__coordinatorPlayUntil = until;
      } catch {}
    };
    const hasCoordinatorPlayIntent = (el) => {
      try {
        const media = getMediaStateNode(el);
        const owner = getOwnerNode(el);
        const mediaUntil = Number(media?.dataset?.__coordinatorPlayUntil || 0);
        const ownerUntil = Number(owner?.dataset?.__coordinatorPlayUntil || 0);
        return Math.max(mediaUntil, ownerUntil) > Date.now();
      } catch {}
      return false;
    };
    const clearCoordinatorPlayIntent = (el) => {
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) delete media.dataset.__coordinatorPlayUntil;
      } catch {}
      try {
        const owner = getOwnerNode(el);
        if (owner instanceof Element && owner.dataset) delete owner.dataset.__coordinatorPlayUntil;
      } catch {}
    };
    const clearUserPaused = (el) => {
      try {
        const media = getMediaStateNode(el);
        if (media?.dataset) {
          delete media.dataset.__userPaused;
          delete media.dataset.__userPausedAt;
          delete media.dataset.__autoplayFallbackMuted;
        }
        if (el instanceof Element && el.getAttribute?.('data-forum-media') === 'qcast' && el.dataset) {
          delete el.dataset.__userPaused;
          delete el.dataset.__userPausedAt;
          delete el.dataset.__autoplayFallbackMuted;
        }
      } catch {}
      clearSkipMutePersist(el);
    };
    const markUserPaused = (el) => {
      try {
        const ts = String(Date.now());
        const media = getMediaStateNode(el);
        if (media?.dataset) {
          media.dataset.__userPaused = '1';
          media.dataset.__userPausedAt = ts;
        }
        if (el instanceof Element && el.getAttribute?.('data-forum-media') === 'qcast' && el.dataset) {
          el.dataset.__userPaused = '1';
          el.dataset.__userPausedAt = ts;
        }
      } catch {}
    };
    const isUserPaused = (el) => {
      try {
        const media = getMediaStateNode(el);
        if (String(media?.dataset?.__userPaused || '') === '1') return true;
        if (el instanceof Element && String(el?.dataset?.__userPaused || '') === '1') return true;
      } catch {}
      return false;
    };
    const withSystemPause = (el, fn, { clearUser = false } = {}) => {
      if (!(el instanceof HTMLMediaElement)) {
        try { fn?.(); } catch {}
        if (clearUser) clearUserPaused(el);
        return;
      }
      try { el.dataset.__systemPause = '1'; } catch {}
      if (clearUser) clearUserPaused(el);
      try { fn?.(); } catch {}
      setTimeout(() => {
        try { delete el.dataset.__systemPause; } catch {}
      }, 0);
    };
    const clearReadyReplay = (el) => {
      const cleanup = readyReplay.get(el);
      if (cleanup) {
        try { cleanup(); } catch {}
      }
      readyReplay.delete(el);
    };
    const armReadyReplay = (el) => {
      const mediaEl = getMediaStateNode(el);
      if (!(mediaEl instanceof HTMLVideoElement || mediaEl instanceof HTMLAudioElement)) return;
      if (isUserPaused(el)) {
        trace('ready_replay_skip_user_paused', mediaEl);
        return;
      }
      el = mediaEl;
      clearReadyReplay(el);
      const replay = () => {
        clearReadyReplay(el);
        if (isUserPaused(el)) {
          trace('ready_replay_skip_user_paused', el);
          return;
        }
        trace('ready_replay', el);
        try {
          applyMutedPref(el);
          el.playsInline = true;
          if (el instanceof HTMLVideoElement) {
            try { el.loop = true; } catch {}
          }
          if (el.paused) startHtmlMedia(el, 'ready_replay');
        } catch {}
      };
      const onReady = () => replay();
      try { el.addEventListener('loadeddata', onReady, { once: true }); } catch {}
      try { el.addEventListener('canplay', onReady, { once: true }); } catch {}
      readyReplay.set(el, () => {
        try { el.removeEventListener('loadeddata', onReady); } catch {}
        try { el.removeEventListener('canplay', onReady); } catch {}
      });
    };
    const ensurePendingHtmlMediaReady = (el, reason = 'candidate_pending') => {
      const mediaEl = getMediaStateNode(el);
      if (!(mediaEl instanceof HTMLVideoElement || mediaEl instanceof HTMLAudioElement)) return false;
      if (isUserPaused(el)) return false;
      const blocked = readMediaSrcBlocked(mediaEl);
      if (blocked) {
        trace('candidate_skip_blocked_src', mediaEl, {
          reason,
          blockedForMs: Math.max(0, Number(blocked.until || 0) - Date.now()),
          hits: Number(blocked.hits || 0),
        });
        return false;
      }
      el = mediaEl;
      try {
        applyMutedPref(el);
        el.playsInline = true;
        if (el instanceof HTMLVideoElement) {
          try { el.dataset.__resident = '1'; } catch {}
          try { el.dataset.__prewarm = '1'; } catch {}
          try { el.preload = 'auto'; } catch {}
          if (!el.getAttribute('src')) {
            trace('candidate_restore', el, { reason });
            __restoreVideoEl(el);
          }
        } else {
          try { el.preload = 'auto'; } catch {}
        }
        const readyState = Number(el.readyState || 0);
        if (readyState >= 2 || String(el.dataset?.__warmReady || '') === '1') return true;

        const now = Date.now();
        const lastBoostTs = Number(el.dataset?.__candidateBoostTs || 0);
        const pendingSince = Number(el.dataset?.__loadPendingSince || 0);
        const readyRetryCount = Number(el.dataset?.__readyRetryCount || 0);
        const networkState = Number(el.networkState || 0);
        const cold = networkState === HTMLMediaElement.NETWORK_EMPTY || !el.currentSrc;
        if (cold && (now - lastBoostTs) > 1500 && el.dataset?.__loadPending !== '1') {
          try { el.dataset.__candidateBoostTs = String(now); } catch {}
          try { el.dataset.__loadPending = '1'; } catch {}
          trace('candidate_force_load', el, { reason: `${reason}:cold` });
          try { el.load?.(); } catch {}
        }
        const stalledPending =
          String(el.dataset?.__loadPending || '') === '1' &&
          readyState === 0 &&
          networkState === HTMLMediaElement.NETWORK_LOADING &&
          pendingSince > 0 &&
          (now - pendingSince) > (isIOSWarm ? 1100 : 1450);
        if (stalledPending && readyRetryCount < 1 && (now - lastBoostTs) > 900) {
          try { el.dataset.__candidateBoostTs = String(now); } catch {}
          try { el.dataset.__readyRetryCount = String(readyRetryCount + 1); } catch {}
          trace('candidate_pending_stall_retry', el, {
            reason,
            stalledMs: now - pendingSince,
          });
          try {
            if (!el.getAttribute('src')) __restoreVideoEl(el);
          } catch {}
          try { el.load?.(); } catch {}
        }
        armReadyReplay(el);
      } catch {}
      return false;
    };
    const volHandlers = new WeakMap();
    const bindVolumeListener = (el) => { 
      const isMedia =
        el instanceof HTMLVideoElement || el instanceof HTMLAudioElement;
      if (!isMedia) return;
      if (el.dataset.forumSoundBound === '1') return;
      el.dataset.forumSoundBound = '1';
      applyMutedPref(el);
      const h = () => {
        if (shouldSkipMutePersist(el)) return;
        setMutedPref(!!el.muted);
      };
      volHandlers.set(el, h);
      el.addEventListener('volumechange', h, { passive: true });
    };
    const onMutedEvent = (e) => {
      if (e?.detail?.source === 'forum-coordinator') return;
      if (typeof e?.detail?.muted !== 'boolean') return;
      setMutedPref(e.detail.muted, e.detail.source || 'external', false);
    };
    const onMediaPauseCaptured = (e) => {
      const target = e?.target;
      if (!(target instanceof HTMLVideoElement || target instanceof HTMLAudioElement)) return;
      const owner = getOwnerNode(target);
      if (!(owner instanceof Element)) return;
      if (String(target.dataset?.__systemPause || '') === '1') return;
      clearReadyReplay(target);
      markUserPaused(target);
      clearUserGestureIntent(target);
      clearManualLease(target);
      invalidatePlayRequest(target);
      markSuppressedPlayback(target, 4200);
      markSuppressedPlayback(owner, 4200);
      pendingReadyGrace.delete(owner);
      cancelUnload(owner);
      try {
        const qcastHost = target.closest?.('[data-forum-media="qcast"]');
        if (qcastHost instanceof Element) {
          markUserPaused(qcastHost);
          clearUserGestureIntent(qcastHost);
          clearManualLease(qcastHost);
          invalidatePlayRequest(qcastHost);
          markSuppressedPlayback(qcastHost, 4200);
        }
      } catch {}
      try {
        if (active && (active === target || active === owner || active.contains?.(target))) {
          traceCandidate('candidate_manual_pause', owner || target, { reason: 'user_pause' });
          active = null;
          activeSinceTs = 0;
        }
      } catch {}
      trace('user_pause', target);
    };
    const onMediaPointerCaptured = (e) => {
      const target = e?.target;
      if (!(target instanceof Element)) return;
      const owner = getOwnerNode(target);
      if (!(owner instanceof Element)) return;
      markUserGestureIntent(owner);
      trace('user_pointer', owner);
    };
    const onMediaPlayCaptured = (e) => {
      const target = e?.target;
      if (!(target instanceof HTMLVideoElement || target instanceof HTMLAudioElement)) return;
      const owner = getOwnerNode(target);
      if (!(owner instanceof Element)) return;
      const coordinatorPlay = hasCoordinatorPlayIntent(target) || hasCoordinatorPlayIntent(owner);
      const manualLease = hasManualLease(owner) || hasManualLease(target);
      const hasGesture = hasUserGestureIntent(owner) || hasUserGestureIntent(target);
      const isSuppressed = hasSuppressedPlayback(owner) || hasSuppressedPlayback(target);
      if (isUserPaused(owner) || isUserPaused(target)) {
        if (!manualLease && !hasGesture) {
          trace('user_play_blocked_paused_lock', target);
          clearReadyReplay(target);
          invalidatePlayRequest(target);
          withSystemPause(target, () => {
            try { if (!target.paused) target.pause(); } catch {}
          });
          return;
        }
      }
      if (isSuppressed && !manualLease && !hasGesture) {
        trace('user_play_blocked_suppressed', target);
        clearReadyReplay(target);
        invalidatePlayRequest(target);
        withSystemPause(target, () => {
          try { if (!target.paused) target.pause(); } catch {}
        });
        return;
      }
      clearSuppressedPlayback(target);
      clearSuppressedPlayback(owner);
      clearUserGestureIntent(target);
      clearUserGestureIntent(owner);
      clearCoordinatorPlayIntent(target);
      clearCoordinatorPlayIntent(owner);
      clearUserPaused(target);
      clearSkipMutePersist(target);
      try {
        const qcastHost = target.closest?.('[data-forum-media="qcast"]');
        if (qcastHost instanceof Element) {
          clearUserPaused(qcastHost);
          clearSkipMutePersist(qcastHost);
        }
      } catch {}
      try {
        if (owner instanceof Element) {
          cancelUnload(owner);
          active = owner;
          activeSinceTs = Date.now();
          if (!coordinatorPlay) pauseForeignMedia(owner);
        }
      } catch {}
      try {
        window.dispatchEvent(new CustomEvent('site-media-play', {
          detail: { source: 'html5', element: owner }
        }));
      } catch {}
      trace(coordinatorPlay ? 'coordinator_play' : 'user_play', target);
    };
    const onMediaErrorCaptured = (e) => {
      const target = e?.target;
      if (!(target instanceof HTMLVideoElement || target instanceof HTMLAudioElement)) return;
      const owner = getOwnerNode(target);
      const errCode = Number(target?.error?.code || 0);
      // MEDIA_ERR_ABORTED(1) и пустой код часто прилетают как служебный след
      // при штатных pause/unload/reload сценариях; не считаем это "битым" src.
      if (errCode <= 1) {
        try {
          target.dataset.__loadPending = '0';
          if ((target.readyState || 0) < 2) target.dataset.__warmReady = '0';
        } catch {}
        trace('media_error_ignore', target, { code: errCode, reason: 'benign_abort' });
        return;
      }
      const blocked = markMediaSrcBlocked(target, `html_error_${errCode || 0}`);
      clearReadyReplay(target);
      invalidatePlayRequest(target);
      markSuppressedPlayback(target, 3800);
      if (owner instanceof Element) {
        markSuppressedPlayback(owner, 3800);
        pendingReadyGrace.delete(owner);
        cancelUnload(owner);
      }
      withSystemPause(target, () => {
        try { if (!target.paused) target.pause(); } catch {}
      });
      try {
        target.dataset.__loadPending = '0';
        target.dataset.__warmReady = '0';
      } catch {}
      if (owner instanceof Element) {
        scheduleHardUnload(owner, 0, 'error_blocked');
      }
      try {
        if (active && (active === target || active === owner || active.contains?.(target))) {
          active = null;
          activeSinceTs = 0;
        }
      } catch {}
      trace('media_error_block', target, {
        code: errCode,
        hits: Number(blocked?.hits || 0),
        blockedForMs: Math.max(0, Number(blocked?.until || 0) - Date.now()),
      });
    };
    const onMediaLoadedCaptured = (e) => {
      const target = e?.target;
      if (!(target instanceof HTMLVideoElement || target instanceof HTMLAudioElement)) return;
      clearMediaSrcBlocked(target, e?.type === 'canplay' ? 'canplay' : 'loadeddata');
      try {
        target.dataset.__loadPending = '0';
        if (target.readyState >= 2) target.dataset.__warmReady = '1';
      } catch {}
    };
    const detachYouTubePlayer = (iframe, reason = 'detached') => {
      try {
        if (!(iframe instanceof HTMLIFrameElement)) return;
        const player = ytPlayers.get(iframe);
        if (player) {
          try { stopYtMutePoll(player); } catch {}
          try { player?.destroy?.(); } catch {}
          ytMuteLast.delete(player);
        }
        ytPlayers.delete(iframe);
        traceCandidate('candidate_external_ignored', iframe, { reason });
      } catch {}
    };
    const cleanupObservedMediaNode = (node, reason = 'removed') => {
      if (!(node instanceof Element)) return;
      forEachMediaOwner(node, (owner) => {
        try { cancelUnload(owner); } catch {}
        try { clearReadyReplay(owner); } catch {}
        try { pendingReadyGrace.delete(owner); } catch {}
        try { ratios.delete(owner); } catch {}
        if (active === owner || active?.contains?.(owner) || owner.contains?.(active)) {
          active = null;
          activeSinceTs = 0;
        }
        const kind = String(owner.getAttribute?.('data-forum-media') || '');
        if (kind === 'youtube') {
          detachYouTubePlayer(owner, reason);
        }
        if (kind === 'qcast') {
          const audio = getQCastAudio(owner);
          if (audio instanceof HTMLAudioElement) {
            try { clearReadyReplay(audio); } catch {}
            try { invalidatePlayRequest(audio); } catch {}
          }
        }
        if (owner instanceof HTMLVideoElement || owner instanceof HTMLAudioElement) {
          try { clearReadyReplay(owner); } catch {}
          try { invalidatePlayRequest(owner); } catch {}
          if (owner instanceof HTMLVideoElement) {
            try { __dropActiveVideoEl(owner); } catch {}
          }
        }
      });
    };
    const sweepDetachedMediaState = (reason = 'detached_sweep', force = false) => {
      const now = Date.now();
      if (!force && (now - lastDetachedSweepTs) < 900) return;
      lastDetachedSweepTs = now;
      try {
        if (active instanceof Element && !active.isConnected) {
          active = null;
          activeSinceTs = 0;
        }
      } catch {}
      try {
        for (const [el] of ratios.entries()) {
          if (!(el instanceof Element) || !el.isConnected) {
            ratios.delete(el);
          }
        }
      } catch {}
      try {
        for (const [el, cleanup] of readyReplay.entries()) {
          if (!(el instanceof Element) || !el.isConnected) {
            try { cleanup?.(); } catch {}
            readyReplay.delete(el);
          }
        }
      } catch {}
      try {
        for (const [iframe] of ytPlayers.entries()) {
          if (!(iframe instanceof HTMLIFrameElement) || !iframe.isConnected) {
            detachYouTubePlayer(iframe, reason);
          }
        }
      } catch {}
      try {
        const livePlayers = new Set();
        ytPlayers.forEach((player) => livePlayers.add(player));
        for (const [player, id] of ytMutePolls.entries()) {
          if (!livePlayers.has(player)) {
            try { clearInterval(id); } catch {}
            ytMutePolls.delete(player);
            ytMuteLast.delete(player);
          }
        }
      } catch {}
      try { pruneMediaSrcBlockMap(force); } catch {}
    };
    try {
      window.sweepForumMediaLeaks = () => {
        try { sweepDetachedMediaState('manual_sweep', true); } catch {}
        return typeof window.dumpForumMediaInternals === 'function'
          ? window.dumpForumMediaInternals()
          : {};
      };
    } catch {}
    const startHtmlMedia = (el, reason = 'play') => {
      if (!(el instanceof HTMLMediaElement)) return;
      const playToken = bumpPlayRequestToken(el);
      const canContinue = () => {
        try {
          return isPlayRequestCurrent(el, playToken) && !isUserPaused(el) && !hasSuppressedPlayback(el);
        } catch {}
        return false;
      };
      try {
        markCoordinatorPlayIntent(el, 1500);
        const p = el.play?.();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (!canContinue()) {
              trace('play_started_stale', el, { reason, muted: !!el.muted });
              withSystemPause(el, () => {
                try { if (!el.paused) el.pause(); } catch {}
              });
              return;
            }
            trace('play_started', el, { reason, muted: !!el.muted });
          }).catch((err) => {
            if (!canContinue()) {
              trace('play_reject_stale', el, { reason });
              return;
            }
            trace('play_reject', el, {
              reason,
              name: String(err?.name || ''),
              message: String(err?.message || ''),
              muted: !!el.muted,
            });
            if (el.muted) return;
            try {
              markSkipMutePersist(el);
              el.dataset.__autoplayFallbackMuted = '1';
              el.muted = true;
              el.defaultMuted = true;
              el.setAttribute('muted', '');
            } catch {}
            try {
              const retry = el.play?.();
              if (retry && typeof retry.then === 'function') {
                retry.then(() => {
                  if (!canContinue()) {
                    trace('play_retry_stale', el, { reason });
                    withSystemPause(el, () => {
                      try { if (!el.paused) el.pause(); } catch {}
                    });
                    return;
                  }
                  trace('play_retry_muted_ok', el, { reason });
                }).catch((retryErr) => {
                  trace('play_retry_muted_fail', el, {
                    reason,
                    name: String(retryErr?.name || ''),
                    message: String(retryErr?.message || ''),
                  });
                });
              }
            } catch {}
          });
        }
      } catch {}
    };
    let ytApiPromise = null;
    const ensureYouTubeAPI = () => {
      if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
      if (ytApiPromise) return ytApiPromise;
      ytApiPromise = new Promise((resolve) => {
        const existing = document.querySelector('script[data-forum-yt="1"]');
        if (existing) {
          const check = () => {
            if (window.YT && window.YT.Player) resolve(window.YT);
            else setTimeout(check, 60);
          };
          check();
          return;
        }
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.dataset.forumYt = '1';
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
          try { if (typeof prev === 'function') prev(); } catch {}
          resolve(window.YT);
        };
        document.head.appendChild(tag);
      });
      return ytApiPromise;
    };
    const ytPlayers = new Map();
    const ytMutePolls = new Map();
    const ytMuteLast = new Map();    
    try { window.__forumYtPlayers = ytPlayers; } catch {}
    const isAttachedYtPlayer = (player, iframeRef = null) => {
      try {
        const iframe = iframeRef instanceof HTMLIFrameElement ? iframeRef : (player?.getIframe?.() || null);
        return !!(iframe && iframe.isConnected);
      } catch {}
      return false;
    };
    const stopYtMutePoll = (player) => {
      const id = ytMutePolls.get(player);
      if (id) clearInterval(id);
      ytMutePolls.delete(player);
    };
    const startYtMutePoll = (player) => {
      if (!player || ytMutePolls.has(player)) return;
      const id = setInterval(() => {
        try {
          if (!isAttachedYtPlayer(player)) {
            stopYtMutePoll(player);
            ytMuteLast.delete(player);
            return;
          }
          const muted = !!player?.isMuted?.();
          const last = ytMuteLast.get(player);
          if (last !== muted) {
            ytMuteLast.set(player, muted);
            setMutedPref(muted, 'youtube');
          }
        } catch {}
      }, 650);
      ytMutePolls.set(player, id);
    };    
    const initYouTubePlayer = async (iframe) => {
      if (!iframe || !(iframe instanceof HTMLIFrameElement)) return null;
      if (ytPlayers.has(iframe)) {
        const existing = ytPlayers.get(iframe);
        if (isAttachedYtPlayer(existing, iframe)) return existing;
        try { stopYtMutePoll(existing); } catch {}
        try { existing?.destroy?.(); } catch {}
        ytPlayers.delete(iframe);
        ytMuteLast.delete(existing);
      }
      const YT = await ensureYouTubeAPI();
      if (!YT?.Player) return null;
      return new Promise((resolve) => {
        try {
          const player = new YT.Player(iframe, {
            events: {
              onReady: () => { 
                if (!isAttachedYtPlayer(player, iframe)) {
                  try { stopYtMutePoll(player); } catch {}
                  try { player?.destroy?.(); } catch {}
                  ytPlayers.delete(iframe);
                  ytMuteLast.delete(player);
                  resolve(null);
                  return;
                }
                try {
                  if (desiredMuted()) player?.mute?.();
                  else player?.unMute?.();
                } catch {}
                resolve(player);
              },
              onStateChange: (evt) => {
                try {
                  if (!isAttachedYtPlayer(player, iframe)) {
                    stopYtMutePoll(player);
                    ytPlayers.delete(iframe);
                    ytMuteLast.delete(player);
                    return;
                  }
                  const state = evt?.data; 
                  if (state === YT.PlayerState?.PLAYING) { 
                    startYtMutePoll(player);
                    window.dispatchEvent(new CustomEvent('site-media-play', {
                      detail: { source: 'youtube', element: iframe }
                    }));
                  }
                  // LOOP: когда ролик закончился — стартуем заново без reload iframe
                  if (state === YT.PlayerState?.ENDED) {
                    try { player?.seekTo?.(0, true); } catch {}
                    try { player?.playVideo?.(); } catch {}
                    return;
                  }
                  if (state === YT.PlayerState?.PAUSED) {
                    stopYtMutePoll(player);
                  }
                } catch {}
              }
            },
          });
          ytPlayers.set(iframe, player);
        } catch {
          resolve(null);
        }
      });
    };

    const ratios = new Map();
    let active = null;
    let activeSinceTs = 0;
    let rafId = 0;
    let io = null;

    const observed = new WeakSet();
    const unloadTimers = new Map(); // el -> timeoutId 
    const isIOSUi = (() => {
      try {
        return /iP(hone|ad|od)/i.test(String(navigator?.userAgent || ''));
      } catch {
        return false;
      }
    })();
    const isCoarseUi = (() => {
      try {
        const uaMobile = /iP(hone|ad|od)|Android/i.test(String(navigator?.userAgent || ''));
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches;
        return uaMobile || coarse;
      } catch {
        return false;
      }
    })();
    const IFRAME_HARD_UNLOAD_MS = isIOSUi ? 7600 : (isCoarseUi ? 5200 : 3000);
    const IFRAME_RESIDENT_CAP = (() => {
      if (isCoarseUi) return 1;
      const dm = Number(navigator?.deviceMemory || 0);
      if (Number.isFinite(dm) && dm > 0 && dm <= 4) return 2;
      return 3;
    })();
    let mediaDiagLastTs = 0;
    const emitMediaDiag = (event, extra = {}, force = false) => {
      try {
        const now = Date.now();
        if (!force && now - mediaDiagLastTs < 1100) return;
        mediaDiagLastTs = now;
        emitDiag(event, { scope: 'forum-media', ...extra }, { force });
      } catch {}
    };
    const isIframeLike = (el) => {
      const kind = el?.getAttribute?.('data-forum-media');
      return kind === 'youtube' || kind === 'tiktok' || kind === 'iframe';
    };
    const isNearViewportElement = (el, marginPx = isCoarseUi ? 980 : 1320) => {
      try {
        const node = getOwnerNode(el) || el;
        if (!(node instanceof Element)) return false;
        const rect = node.getBoundingClientRect?.();
        if (!rect) return false;
        const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        return rect.bottom >= -marginPx && rect.top <= viewportH + marginPx;
      } catch {}
      return false;
    };
    const shouldRetainHtmlMedia = (el) => {
      const mediaEl = getMediaStateNode(el);
      if (!(mediaEl instanceof HTMLMediaElement)) return false;
      try {
        const owner = getOwnerNode(el);
        const ownerDataset = owner instanceof Element ? owner.dataset : null;
        const mediaDataset = mediaEl.dataset || null;
        if (String(mediaDataset?.__active || ownerDataset?.__active || '') === '1') return true;
        if (String(mediaDataset?.__prewarm || ownerDataset?.__prewarm || '') === '1') return true;
        if (String(mediaDataset?.__resident || ownerDataset?.__resident || '') === '1') return true;
        if (String(mediaDataset?.__loadPending || ownerDataset?.__loadPending || '') === '1') return true;
        if (isNearViewportElement(owner || mediaEl)) return true;
      } catch {}
      return false;
    };
    const mediaSrcBlockMap = new Map();
    const MEDIA_SRC_BLOCK_BASE_MS = isIOSUi ? 24000 : (isCoarseUi ? 22000 : 18000);
    const MEDIA_SRC_BLOCK_MAX_MS = isIOSUi ? (5 * 60 * 1000) : (4 * 60 * 1000);
    let lastMediaSrcBlockPruneTs = 0;
    const pruneMediaSrcBlockMap = (force = false) => {
      const now = Date.now();
      if (!force && (now - lastMediaSrcBlockPruneTs) < 12000 && mediaSrcBlockMap.size < 120) return;
      lastMediaSrcBlockPruneTs = now;
      for (const [key, data] of mediaSrcBlockMap.entries()) {
        const until = Number(data?.until || 0);
        if (!until || until <= now) {
          mediaSrcBlockMap.delete(key);
        }
      }
      if (mediaSrcBlockMap.size <= 260) return;
      const sorted = Array.from(mediaSrcBlockMap.entries())
        .sort((a, b) => Number(a?.[1]?.until || 0) - Number(b?.[1]?.until || 0));
      const drop = sorted.slice(0, mediaSrcBlockMap.size - 260);
      drop.forEach(([key]) => mediaSrcBlockMap.delete(key));
    };
    const normalizeMediaSrcKey = (raw = '') => {
      try {
        const next = String(raw || '').trim();
        if (!next) return '';
        const u = new URL(next, window.location.origin);
        u.hash = '';
        u.search = '';
        return u.toString();
      } catch {
        return String(raw || '').trim();
      }
    };
    const resolveMediaSrcKey = (el) => {
      try {
        const mediaEl = getMediaStateNode(el);
        if (!(mediaEl instanceof HTMLMediaElement)) return '';
        const src = String(
          mediaEl?.dataset?.__src ||
          mediaEl?.getAttribute?.('data-src') ||
          mediaEl?.currentSrc ||
          mediaEl?.getAttribute?.('src') ||
          '',
        ).trim();
        return normalizeMediaSrcKey(src);
      } catch {}
      return '';
    };
    const readMediaSrcBlocked = (el) => {
      const key = resolveMediaSrcKey(el);
      if (!key) return null;
      const blocked = mediaSrcBlockMap.get(key);
      if (!blocked) return null;
      const until = Number(blocked?.until || 0);
      if (!until || until <= Date.now()) {
        mediaSrcBlockMap.delete(key);
        return null;
      }
      return { key, ...blocked };
    };
    const isMediaSrcBlocked = (el) => !!readMediaSrcBlocked(el);
    const clearMediaSrcBlocked = (el, reason = 'ready') => {
      const key = resolveMediaSrcKey(el);
      if (!key) return;
      if (!mediaSrcBlockMap.has(key)) return;
      mediaSrcBlockMap.delete(key);
      try {
        const mediaEl = getMediaStateNode(el);
        if (mediaEl instanceof HTMLMediaElement) {
          delete mediaEl.dataset.__blockedMediaUntil;
          delete mediaEl.dataset.__errorStreak;
        }
      } catch {}
      trace('media_unblock', getMediaStateNode(el) || el, { reason });
    };
    const markMediaSrcBlocked = (el, reason = 'error') => {
      const key = resolveMediaSrcKey(el);
      if (!key) return null;
      const prev = mediaSrcBlockMap.get(key);
      const hits = Math.max(1, Number(prev?.hits || 0) + 1);
      const penalty = Math.min(MEDIA_SRC_BLOCK_MAX_MS, MEDIA_SRC_BLOCK_BASE_MS * Math.pow(2, Math.min(hits - 1, 3)));
      const until = Date.now() + penalty;
      const next = { hits, until, reason };
      mediaSrcBlockMap.set(key, next);
      pruneMediaSrcBlockMap();
      try {
        const mediaEl = getMediaStateNode(el);
        if (mediaEl instanceof HTMLMediaElement) {
          mediaEl.dataset.__blockedMediaUntil = String(until);
          mediaEl.dataset.__errorStreak = String(hits);
        }
      } catch {}
      trace('media_block', getMediaStateNode(el) || el, { reason, hits, penaltyMs: penalty });
      return { key, ...next };
    };
    const getUnloadDelay = (el, reason = 'timeout') => {
      if (!isIframeLike(el)) {
        if (reason === 'cleanup') return 0;
        if (reason === 'resident_cap' || reason === 'error_blocked') return 0;
        if (reason === 'focus_switch' || reason === 'below_stop_ratio' || reason === 'candidate_replace') {
          if (isIOSUi) return 9000;
          return isCoarseUi ? 7000 : 8400;
        }
        if (reason === 'out_of_view') {
          if (isIOSUi) return 11000;
          return isCoarseUi ? 7800 : 9600;
        }
        if (isIOSUi) return 10000;
        return isCoarseUi ? 7600 : 9200;
      }
      if (reason === 'cleanup' || reason === 'resident_cap') return 0;
      if (!isCoarseUi && (reason === 'focus_switch' || reason === 'below_stop_ratio' || reason === 'candidate_replace')) {
        return 12000;
      }
      if (isCoarseUi && (reason === 'focus_switch' || reason === 'below_stop_ratio' || reason === 'candidate_replace')) {
        return 5200;
      }
      if (!isCoarseUi && reason === 'out_of_view') return 6000;
      if (isCoarseUi && reason === 'out_of_view') return 6200;
      return IFRAME_HARD_UNLOAD_MS;
    };
    const getLoadedIframes = () => {
      try {
        return Array.from(document.querySelectorAll('iframe[data-forum-media]')).filter((frame) => {
          try { return !!frame.getAttribute('src'); } catch { return false; }
        });
      } catch {
        return [];
      }
    };
    const getIframeSnapshot = () => {
      try {
        const all = Array.from(document.querySelectorAll('iframe[data-forum-media]'));
        const loaded = all.filter((frame) => {
          try { return !!frame.getAttribute('src'); } catch { return false; }
        }).length;
        return { total: all.length, loaded };
      } catch {
        return { total: 0, loaded: 0 };
      }
    };

    const cancelUnload = (el) => {
      const id = unloadTimers.get(el);
      if (id) clearTimeout(id);
      unloadTimers.delete(el);
    };
    emitMediaDiag('media_coordinator_init', {
      iframeHardUnloadMs: IFRAME_HARD_UNLOAD_MS,
      iframeResidentCap: IFRAME_RESIDENT_CAP,
      isCoarseUi,
      ...getIframeSnapshot(),
    }, true);

    const softPauseMedia = (el) => {
      if (!el) return;
      clearReadyReplay(el);
      trace('soft_pause', el);
      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        invalidatePlayRequest(el);
        markSuppressedPlayback(el, 1400);
        withSystemPause(el, () => {
          try { if (!el.paused) el.pause(); } catch {}
        });
        try { el.dataset.__active = '0'; } catch {}
        if (el instanceof HTMLVideoElement) {
          try { __dropActiveVideoEl(el); } catch {}
        }
        return;
      }
      const kind = el.getAttribute('data-forum-media');
      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) {
          invalidatePlayRequest(a);
          markSuppressedPlayback(a, 1800);
          markSuppressedPlayback(el, 1800);
          clearReadyReplay(a);
          withSystemPause(a, () => {
            try { if (!a.paused) a.pause(); } catch {}
          });
        }
        return;
      }
      if (kind === 'youtube') {
        markSuppressedPlayback(el, 1400);
        const player = ytPlayers.get(el);
        try { player?.pauseVideo?.(); } catch {}
        try { stopYtMutePoll(player); } catch {}
        return;
      }
      if (kind === 'tiktok' || kind === 'iframe') {
        markSuppressedPlayback(el, 1400);
        try {
          el.contentWindow?.postMessage?.({ method: 'pause' }, '*');
        } catch {}
        try {
          el.contentWindow?.postMessage?.({ event: 'command', func: 'pauseVideo', args: '' }, '*');
        } catch {}
      }
    };
    const pauseForeignMedia = (keepEl = null) => {
      try {
        document.querySelectorAll(selector).forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node === keepEl) return;
          if (keepEl instanceof Element && keepEl.contains?.(node)) return;
          if (node.contains?.(keepEl)) return;
          if (node instanceof HTMLVideoElement || node instanceof HTMLAudioElement) {
            invalidatePlayRequest(node);
            withSystemPause(node, () => {
              try { if (!node.paused) node.pause(); } catch {}
            });
            return;
          }
          const kind = String(node.getAttribute?.('data-forum-media') || '');
          if (kind === 'qcast') {
            const a = node.querySelector?.('audio[data-qcast-audio="1"]');
            if (a instanceof HTMLAudioElement) {
              invalidatePlayRequest(a);
              withSystemPause(a, () => {
                try { if (!a.paused) a.pause(); } catch {}
              });
            }
            return;
          }
          if (kind === 'youtube') {
            const player = ytPlayers.get(node);
            try { player?.pauseVideo?.(); } catch {}
            try { stopYtMutePoll(player); } catch {}
            return;
          }
          if (kind === 'tiktok' || kind === 'iframe') {
            try { node.contentWindow?.postMessage?.({ method: 'pause' }, '*'); } catch {}
            try { node.contentWindow?.postMessage?.({ event: 'command', func: 'pauseVideo', args: '' }, '*'); } catch {}
          }
        });
      } catch {}
    };

    const hardUnloadMedia = (el, reason = 'unknown') => {
      if (!el) return;
      clearReadyReplay(el);
      trace('hard_unload', el, { reason });
      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        invalidatePlayRequest(el);
        try { __dropActiveVideoEl(el); } catch {}
        if (el instanceof HTMLVideoElement) {
          try { __unloadVideoEl(el); } catch {}
        } else {
          withSystemPause(el, () => {
            try { if (!el.paused) el.pause(); } catch {}
          });
          try { el.dataset.__active = '0'; } catch {}
        }
        return;
      }
      const kind = el.getAttribute('data-forum-media');
      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) {
          invalidatePlayRequest(a);
          clearReadyReplay(a);
          withSystemPause(a, () => {
            try { if (!a.paused) a.pause(); } catch {}
          });
        }
        return;
      }
      if (kind === 'youtube') { 
        const player = ytPlayers.get(el);
        try { player?.pauseVideo?.(); } catch {}
        try { stopYtMutePoll(player); } catch {}
        try {
          const ds = el.getAttribute('data-src') || el.getAttribute('src') || '';
          if (ds && !el.getAttribute('data-src')) {
            try { el.setAttribute('data-src', ds); } catch {}
          }
          try { el.removeAttribute('data-forum-iframe-active'); } catch {}
          try { el.removeAttribute('data-forum-last-active-ts'); } catch {}
          if (el.getAttribute('src')) { try { el.setAttribute('src', ''); } catch {} }
        } catch {}
        try { player?.destroy?.(); } catch {}
        try { ytPlayers.delete(el); } catch {}
        try { ytMuteLast.delete(player); } catch {}
        emitMediaDiag('iframe_hard_unload', { kind, reason, ...getIframeSnapshot() });
        return;
      } 
      if (kind === 'tiktok' || kind === 'iframe') { 
        const src = el.getAttribute('data-src') || el.getAttribute('src') || '';
        if (src && !el.getAttribute('data-src')) { try { el.setAttribute('data-src', src); } catch {} }
        try { el.removeAttribute('data-forum-iframe-active'); } catch {}
        try { el.removeAttribute('data-forum-last-active-ts'); } catch {}
        if (el.getAttribute('src')) { try { el.setAttribute('src', ''); } catch {} }
        emitMediaDiag('iframe_hard_unload', { kind, reason, ...getIframeSnapshot() });
        return;
      }
    };

    const enforceIframeResidentCap = (keepEl = null) => {
      if (IFRAME_RESIDENT_CAP <= 0) return;
      const loaded = getLoadedIframes();
      const extra = loaded.length - IFRAME_RESIDENT_CAP;
      if (extra <= 0) return;

      const sorted = loaded
        .filter((frame) => frame !== keepEl)
        .sort((a, b) => {
          const ta = Number(a?.getAttribute?.('data-forum-last-active-ts') || 0);
          const tb = Number(b?.getAttribute?.('data-forum-last-active-ts') || 0);
          return ta - tb;
        });
      const victims = sorted.slice(0, extra);
      if (!victims.length) return;

      victims.forEach((frame) => {
        cancelUnload(frame);
        hardUnloadMedia(frame, 'resident_cap');
      });
      emitMediaDiag('iframe_resident_cap', {
        cap: IFRAME_RESIDENT_CAP,
        dropped: victims.length,
        ...getIframeSnapshot(),
      }, true);
    };

    const scheduleHardUnload = (el, ms = null, reason = 'timeout') => {
      if (!el) return;
      cancelUnload(el);
      const delay = Number.isFinite(ms) ? ms : getUnloadDelay(el, reason);
      const id = setTimeout(() => {
        unloadTimers.delete(el);
        if (!isIframeLike(el) && shouldRetainHtmlMedia(el)) {
          trace('hard_unload_skip_retained', el, { reason });
          return;
        }
        hardUnloadMedia(el, reason);
      }, delay);
      unloadTimers.set(el, id);
    }; 
    // Best-effort loop для iframe (Vimeo/встроенные плееры/прочее):
    // добавляем loop=1 ОДИН РАЗ (не на каждом фокусе), чтобы не было дергания.
    const ensureIframeLoopParam = (src) => {
      try {
        const u = new URL(src, window.location.href);
        if (!u.searchParams.has('loop')) u.searchParams.set('loop', '1');
        return u.toString();
      } catch {
        return src;
      }
    };

    const playMedia = async (el) => {
      if (!el) return;
      cancelUnload(el);
      trace('play_request', el);
      if (isUserPaused(el)) {
        trace('play_skip_user_paused', el);
        return;
      }
      pauseForeignMedia(el);

      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        const blocked = readMediaSrcBlocked(el);
        if (blocked) {
          trace('play_skip_blocked_src', el, {
            blockedForMs: Math.max(0, Number(blocked.until || 0) - Date.now()),
            hits: Number(blocked.hits || 0),
          });
          markSuppressedPlayback(el, 2200);
          return;
        }
        try {
          clearSuppressedPlayback(el);
          if (el instanceof HTMLVideoElement) {
            const hasSrc = !!el.getAttribute('src');
            let restoredNow = false;
            if (!hasSrc) {
              trace('play_restore', el);
              __restoreVideoEl(el);
              restoredNow = true;
            }
            try { el.dataset.__prewarm = '1'; } catch {}
            try { el.dataset.__active = '1'; } catch {}
            try { el.preload = 'auto'; } catch {}
            try {
              const empty = (el.networkState === HTMLMediaElement.NETWORK_EMPTY) || !el.currentSrc;
              if (!restoredNow && empty && el.dataset?.__loadPending !== '1' && el.paused && (el.currentTime === 0)) {
                try { el.dataset.__loadPending = '1'; } catch {}
                trace('play_load', el);
                el.load?.();
              }
            } catch {}
            __touchActiveVideoEl(el);
            __enforceActiveVideoCap(el);
          }
          applyMutedPref(el);
          el.playsInline = true;
          // LOOP: автоплей всегда зацикленный 
          el.loop = true;
          if ((el.readyState || 0) < 2) {
            ensurePendingHtmlMediaReady(el, 'play_wait_ready');
            trace('play_wait_ready', el);
            armReadyReplay(el);
          } else if (el.paused) {
            trace('play_now', el);
            startHtmlMedia(el, 'play_now');
          }
        } catch {}
        return;
      }

      const kind = el.getAttribute('data-forum-media');
      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) {
          try {
            if (isUserPaused(el) || isUserPaused(a)) {
              trace('play_skip_user_paused', a, { reason: 'qcast_user_paused' });
              return;
            }
            clearSuppressedPlayback(a);
            clearSuppressedPlayback(el);
            applyMutedPref(a);
            // LOOP: qcast-аудио тоже зацикливаем
            a.loop = true;
            try { a.preload = 'auto'; } catch {}
            if ((a.readyState || 0) < 2) {
              try {
                const empty = (a.networkState === HTMLMediaElement.NETWORK_EMPTY) || !a.currentSrc;
                if (empty && a.paused) a.load?.();
              } catch {}
              armReadyReplay(a);
            } else if (a.paused) {
              startHtmlMedia(a, 'qcast_play_now');
            }
          } catch {}
        }
        return;
      }

      if (kind === 'youtube') {
        try {
          const ds = el.getAttribute('data-src') || '';
          const cur = el.getAttribute('src') || ''; 
          if (ds && !cur) el.setAttribute('src', ds);
          el.setAttribute('data-forum-last-active-ts', String(Date.now()));
        } catch {}
        const player = await initYouTubePlayer(el);
        if (!player) return;
        try {
          if (desiredMuted()) player?.mute?.();
          else player?.unMute?.();
          player?.playVideo?.();
          enforceIframeResidentCap(el);
          emitMediaDiag('iframe_play', { kind: 'youtube', ...getIframeSnapshot() });
        } catch {}
        return;
      }

      if (kind === 'tiktok' || kind === 'iframe') {
        // ВАЖНО: НЕ делаем force-reset на каждом "фокусе" — это и есть перезапуск при микроскролле.
        const rawSrc = el.getAttribute('data-src') || el.getAttribute('src') || '';
        const src = rawSrc ? ensureIframeLoopParam(rawSrc) : '';
        if (!src) return;
        // сохраняем уже "loop-версию" в data-src, чтобы дальше не мутить url повторно
        if (!el.getAttribute('data-src')) { try { el.setAttribute('data-src', src); } catch {} }
      
        const alreadyActive = el.getAttribute('data-forum-iframe-active') === '1';
        const cur = el.getAttribute('src') || '';
        if (!alreadyActive || !cur) { 
          try { el.setAttribute('data-forum-iframe-active', '1'); } catch {}
          try { el.setAttribute('src', src); } catch {}
        }
        try { el.setAttribute('data-forum-last-active-ts', String(Date.now())); } catch {}
        enforceIframeResidentCap(el);
        emitMediaDiag('iframe_play', { kind, ...getIframeSnapshot() });
        window.dispatchEvent(new CustomEvent('site-media-play', {
          detail: { source: kind, element: el }
        }));
      }
    };

    const getCandidateMetrics = (el, ratioOverride = null) => {
      if (!(el instanceof Element)) return null;
      const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
      const viewportCenter = viewportH / 2;
      try {
        const rect = el.getBoundingClientRect?.();
        if (!rect) return null;
        const ratio = Number(ratioOverride == null ? (ratios.get(el) || 0) : ratioOverride);
        const visiblePx = Math.max(0, Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0));
        const center = (rect.top + rect.bottom) / 2;
        const centerDist = Math.abs(center - viewportCenter);
        const score = (visiblePx * 1.15) + (ratio * 420) - (centerDist * 0.45);
        return { el, ratio, score, visiblePx, centerDist };
      } catch {}
      return null;
    };

    const pickMostVisible = () => {
      sweepDetachedMediaState('pick_sweep');
      let best = null;
      let bestScore = -Infinity;
      let bestRatio = 0;
      let bestVisiblePx = 0;
      let bestCenterDist = 0;
      for (const [el, r] of ratios.entries()) {
        if (isUserPaused(el)) continue;
        if (isMediaSrcBlocked(el)) continue;
        const metrics = getCandidateMetrics(el, r);
        if (!metrics) continue;
        if (metrics.score > bestScore) {
          bestScore = metrics.score;
          bestRatio = metrics.ratio;
          bestVisiblePx = metrics.visiblePx;
          bestCenterDist = metrics.centerDist;
          best = el;
        }
      }
      if (!best) {
        for (const [el, r] of ratios.entries()) {
          if (isMediaSrcBlocked(el)) continue;
          if (r > bestRatio) {
            bestRatio = r;
            best = el;
          }
        }
      }
      return { el: best, ratio: bestRatio, score: bestScore, visiblePx: bestVisiblePx, centerDist: bestCenterDist };
    };

    const ACTIVE_SWITCH_HOLD_MS = isIOSUi ? 620 : (isCoarseUi ? 520 : 420);
    const SWITCH_RATIO_DELTA = 0.12;
    const SWITCH_SCORE_DELTA = 180;
    const PENDING_READY_GRACE_MS = isIOSUi ? 720 : (isCoarseUi ? 420 : 260);
    const PENDING_READY_GRACE_RATIO = 0.12;
    const getMediaKind = (el) => String(el?.getAttribute?.('data-forum-media') || '');
    const getStartRatio = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return isIOSUi ? 0.12 : (isCoarseUi ? 0.14 : 0.18);
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return isIOSUi ? 0.2 : (isCoarseUi ? 0.22 : 0.3);
      return isIOSUi ? 0.2 : (isCoarseUi ? 0.24 : 0.35);
    };
    const getStopRatio = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return isIOSUi ? 0.01 : (isCoarseUi ? 0.02 : 0.03);
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return isIOSUi ? 0.06 : (isCoarseUi ? 0.08 : 0.12);
      return isIOSUi ? 0.1 : (isCoarseUi ? 0.14 : 0.22);
    };
    const getSwitchHoldMs = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return isCoarseUi ? 2200 : 1800;
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return isCoarseUi ? 1200 : 880;
      return ACTIVE_SWITCH_HOLD_MS;
    };
    const getSwitchRatioDelta = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return 0.28;
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return 0.18;
      return SWITCH_RATIO_DELTA;
    };
    const getSwitchScoreDelta = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return 380;
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return 260;
      return SWITCH_SCORE_DELTA;
    };

    const isReadyCandidate = (el) => {
      const mediaEl = getMediaStateNode(el) || el;
      if (!(mediaEl instanceof HTMLVideoElement || mediaEl instanceof HTMLAudioElement)) return true;
      try {
        if ((mediaEl.readyState || 0) >= 2) return true;
        if (String(mediaEl.dataset?.__warmReady || '') === '1') return true;
      } catch {}
      return false;
    };
    const hasManualLease = (el) => {
      try {
        const mediaEl = getMediaStateNode(el);
        const ts = Number(mediaEl?.dataset?.__manualLeaseUntil || el?.dataset?.__manualLeaseUntil || 0);
        return ts > Date.now();
      } catch {}
      return false;
    };

    if (!('IntersectionObserver' in window)) return;

    io = new IntersectionObserver(
      (entries) => {
        // обновляем ratios
        for (const entry of entries) {
          const el = entry.target;
          const r = entry.isIntersecting ? (entry.intersectionRatio || 0) : 0;
          if (r <= 0) {
            ratios.delete(el);
            // ВАЖНО: НЕ трогаем неактивные элементы (иначе unload/reload thrash)
            if (active === el) {
              softPauseMedia(el);
              // iframe/youtube — освобождаем ресурсы с задержкой (анти-микроскролл)
              scheduleHardUnload(el, null, 'out_of_view');
              active = null;
            } 
          } else {
            ratios.set(el, r);
          }
        }

        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          const { el: candidate, ratio, score, visiblePx, centerDist } = pickMostVisible();
          const START_RATIO = getStartRatio(candidate);

          // Если есть активный элемент — держим его, пока он не "выпал" ниже STOP_RATIO.
          // Это убирает "стоп/плей" при лёгком смещении вверх/вниз.
          if (active) {
            const ar = ratios.get(active) || 0;
            const activeMetrics = getCandidateMetrics(active, ar);
            const activeScore = Number(activeMetrics?.score ?? -Infinity);
            const STOP_RATIO = getStopRatio(active);
            const activeVisiblePx = Number(activeMetrics?.visiblePx || 0);
            const activeKind = getMediaKind(active);
            const manualLeaseActive = hasManualLease(active);
            const keepByVisiblePx =
              (activeKind === 'qcast' && activeVisiblePx >= 120) ||
              ((activeKind === 'youtube' || activeKind === 'tiktok' || activeKind === 'iframe') && activeVisiblePx >= 220);
            if (ar >= STOP_RATIO || keepByVisiblePx || (manualLeaseActive && activeVisiblePx >= 64)) {
              // Если кандидат другой — переключаемся только когда он уверенно лучше.
              // (иначе будет флаттер между двумя элементами рядом)
              const switchHoldMs = Math.max(getSwitchHoldMs(active), getSwitchHoldMs(candidate));
              const switchRatioDelta = Math.max(getSwitchRatioDelta(active), getSwitchRatioDelta(candidate));
              const switchScoreDelta = Math.max(getSwitchScoreDelta(active), getSwitchScoreDelta(candidate));
              if (
                candidate &&
                candidate !== active &&
                ratio >= getStartRatio(candidate) &&
                (ratio > ar + switchRatioDelta || score > activeScore + switchScoreDelta)
              ) {
                const now = Date.now();
                if (!isReadyCandidate(candidate) && ar >= STOP_RATIO) {
                  ensurePendingHtmlMediaReady(candidate, 'reject_not_ready');
                  traceCandidate('candidate_reject_not_ready', candidate, {
                    ratio,
                    score,
                    visiblePx,
                    centerDist,
                    activeRatio: ar,
                    activeScore,
                    reason: 'not_ready',
                  });
                  return;
                }
                if (manualLeaseActive || ((now - activeSinceTs) < switchHoldMs && ar >= STOP_RATIO)) {
                  traceCandidate('candidate_hold_active', candidate, {
                    ratio,
                    score,
                    visiblePx,
                    centerDist,
                    activeRatio: ar,
                    activeScore,
                    reason: manualLeaseActive ? 'manual_lease' : 'switch_hold',
                  });
                  return;
                }
                traceCandidate('candidate_switch', candidate, {
                  ratio,
                  score,
                  visiblePx,
                  centerDist,
                  activeRatio: ar,
                  activeScore,
                });
                softPauseMedia(active);
                scheduleHardUnload(active, null, 'focus_switch');
                active = candidate;
                activeSinceTs = now;
                cancelUnload(active);
                emitMediaDiag('media_focus_switch', { ratio, prevRatio: ar, score, prevScore: activeScore });
                playMedia(active);
              }
              if (candidate && candidate !== active) {
                traceCandidate('candidate_keep_active', active, {
                  ratio: ar,
                  score: activeScore,
                  visiblePx: Number(activeMetrics?.visiblePx || 0),
                  centerDist: Number(activeMetrics?.centerDist || 0),
                  activeRatio: ar,
                  activeScore,
                  reason: 'active_still_valid',
                });
              }
              return;
            }
            if (candidate && ratio >= START_RATIO && !isReadyCandidate(candidate) && ar >= PENDING_READY_GRACE_RATIO) {
              const now = Date.now();
              const graceUntil = Number(pendingReadyGrace.get(candidate) || 0);
              if (!graceUntil || graceUntil < now) pendingReadyGrace.set(candidate, now + PENDING_READY_GRACE_MS);
              ensurePendingHtmlMediaReady(candidate, 'pending_grace');
              if (now < Number(pendingReadyGrace.get(candidate) || 0)) {
                traceCandidate('candidate_hold_active', candidate, {
                  ratio,
                  score,
                  visiblePx,
                  centerDist,
                  activeRatio: ar,
                  activeScore,
                  reason: 'pending_ready_grace',
                });
                return;
              }
              pendingReadyGrace.delete(candidate);
            }
            // Активный выпал ниже STOP_RATIO — мягко отпускаем
            traceCandidate('candidate_release_active', active, {
              ratio: ar,
              score: activeScore,
              visiblePx: Number(activeMetrics?.visiblePx || 0),
              centerDist: Number(activeMetrics?.centerDist || 0),
              reason: 'below_stop_ratio',
            });
            softPauseMedia(active);
            scheduleHardUnload(active, null, 'below_stop_ratio');
            active = null;
          } 

          // Нет активного — берём кандидата, только если он попал в расширенную зону
          if (!candidate || ratio < START_RATIO) {
            if (candidate) {
              pendingReadyGrace.delete(candidate);
              traceCandidate('candidate_below_start', candidate, {
                ratio,
                score,
                visiblePx,
                centerDist,
                reason: 'below_start_ratio',
              });
            }
            return;
          }
 

          if (active && active !== candidate) {
            // старый — мягко стоп + hard unload с задержкой
            softPauseMedia(active);
            scheduleHardUnload(active, null, 'candidate_replace');
          }

          pendingReadyGrace.delete(candidate);
          if (!isReadyCandidate(candidate)) {
            ensurePendingHtmlMediaReady(candidate, 'activate_pending');
          }
          traceCandidate(isReadyCandidate(candidate) ? 'candidate_activate' : 'candidate_activate_pending', candidate, {
            ratio,
            score,
            visiblePx,
            centerDist,
            reason: isReadyCandidate(candidate) ? 'ready' : 'pending_ready',
          });
          active = candidate;
          activeSinceTs = Date.now();
          cancelUnload(active);
          emitMediaDiag('media_focus_switch', { ratio, prevRatio: 0, score });
          playMedia(active);
        });
      },
      {
        threshold: [0, 0.15, 0.35, 0.6, 0.85, 1],
        // Было: '0px 0px -20% 0px' > фокусная зона смещалась вверх (особенно на мобилках).
        // Делаем симметрично, ближе к настоящему центру, и шире по ощущению.
        rootMargin: '-10% 0px -10% 0px',
      }
    );

    const observeOne = (el) => {
      try {
        if (!(el instanceof Element)) return;
        if (observed.has(el)) return;
        observed.add(el);

        // аудио/видео: следим за mute, чтобы запоминать выбор
        if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
          bindVolumeListener(el);
        }

        // Q-Cast: mute/unmute берём с вложенного <audio>
        const kind = el?.getAttribute?.('data-forum-media');
        if (kind === 'qcast') {
          const a = el.querySelector?.('audio');
          if (a instanceof HTMLAudioElement) bindVolumeListener(a);
        }

        // iframe/tiktok: гарантируем data-src
        if ((kind === 'tiktok' || kind === 'iframe') && el?.getAttribute) {
          const src = el.getAttribute('data-src') || el.getAttribute('src') || '';
          if (src && !el.getAttribute('data-src')) {
            try { el.setAttribute('data-src', src); } catch {}
          }
        }
 
        io?.observe?.(el);
      } catch {}
    };

    const observeAll = () => {
      try { document.querySelectorAll(selector).forEach(observeOne); } catch {}
      sweepDetachedMediaState('observe_all', true);
    };
    const promoteExternalActive = (el, reason = 'external_play') => {
      try {
        const candidate = el instanceof Element
          ? (el.matches?.(selector) ? el : el.closest?.(selector))
          : null;
        if (!(candidate instanceof Element)) return;
        pendingReadyGrace.delete(candidate);
        cancelUnload(candidate);
        if (active && active !== candidate) {
          softPauseMedia(active);
          scheduleHardUnload(active, null, reason);
        }
        active = candidate;
        activeSinceTs = Date.now();
        pauseForeignMedia(candidate);
        traceCandidate('candidate_external_promote', candidate, { reason });
      } catch {}
    };
    const onExternalMediaPlay = (e) => {
      const source = String(e?.detail?.source || '');
      if (!['qcast', 'youtube', 'tiktok', 'iframe'].includes(source)) return;
      const candidate = e?.detail?.element || null;
      const manual = !!e?.detail?.manual;
      if ((isUserPaused(candidate) || hasSuppressedPlayback(candidate)) && !manual && !hasManualLease(candidate)) {
        traceCandidate('candidate_external_ignored', candidate, { reason: source });
        return;
      }
      promoteExternalActive(candidate, `${source}_external_play`);
    };

    observeAll();
    const recoverVisibleHtmlMedia = (reason = 'visibility_recover') => {
      try {
        document.querySelectorAll(selector).forEach((owner) => {
          if (!(owner instanceof Element)) return;
          if (!owner.isConnected) return;
          if (!isNearViewportElement(owner, isCoarseUi ? 360 : 520)) return;

          const mediaEl = getMediaStateNode(owner);
          if (!(mediaEl instanceof HTMLVideoElement || mediaEl instanceof HTMLAudioElement)) return;
          if (isUserPaused(owner) || isUserPaused(mediaEl)) return;
          if (hasSuppressedPlayback(owner) || hasSuppressedPlayback(mediaEl)) return;
          if (isMediaSrcBlocked(mediaEl)) return;

          const hasSrcNow = !!mediaEl.getAttribute('src') || !!mediaEl.currentSrc;
          if (!hasSrcNow && __hasLazyVideoSourceWithoutSrc(mediaEl)) {
            trace('visibility_restore', mediaEl, { reason, mode: 'restore_src' });
            __restoreVideoEl(mediaEl);
            return;
          }
          const readyStateNow = Number(mediaEl.readyState || 0);
          const networkEmpty =
            typeof HTMLMediaElement !== 'undefined' &&
            Number(mediaEl.networkState || 0) === HTMLMediaElement.NETWORK_EMPTY;
          if (hasSrcNow && readyStateNow === 0 && networkEmpty && mediaEl.dataset?.__loadPending !== '1') {
            try { mediaEl.dataset.__loadPending = '1'; } catch {}
            trace('visibility_restore', mediaEl, { reason, mode: 'kick_stalled' });
            try { mediaEl.load?.(); } catch {}
          }
        });
      } catch {}
    };
    const onVisibilityRecover = () => {
      try {
        if (document.visibilityState !== 'visible') return;
      } catch {
        return;
      }
      try { observeAll(); } catch {}
      recoverVisibleHtmlMedia('visibility_visible');
    };
    const onPageShowRecover = () => {
      try { observeAll(); } catch {}
      recoverVisibleHtmlMedia('pageshow');
    };
    const onWindowFocusRecover = () => {
      recoverVisibleHtmlMedia('window_focus');
    };

    // Вместо setInterval(querySelectorAll...) — MutationObserver на новые медиа-узлы
    let mo = null;
    try {
      mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const n of (m.addedNodes || [])) {
            if (!(n instanceof Element)) continue;
            if (n.matches?.(selector)) observeOne(n);
            try { n.querySelectorAll?.(selector)?.forEach?.(observeOne); } catch {}
          }
          for (const n of (m.removedNodes || [])) {
            if (!(n instanceof Element)) continue;
            cleanupObservedMediaNode(n, 'mutation_removed');
          }
        }
        sweepDetachedMediaState('mutation_batch', true);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch { mo = null; }
    window.addEventListener(MEDIA_MUTED_EVENT, onMutedEvent);
    window.addEventListener('site-media-play', onExternalMediaPlay);
    document.addEventListener('visibilitychange', onVisibilityRecover, true);
    window.addEventListener('pageshow', onPageShowRecover);
    window.addEventListener('focus', onWindowFocusRecover, true);
    document.addEventListener('pointerdown', onMediaPointerCaptured, true);
    document.addEventListener('pause', onMediaPauseCaptured, true);
    document.addEventListener('play', onMediaPlayCaptured, true);
    document.addEventListener('error', onMediaErrorCaptured, true);
    document.addEventListener('loadeddata', onMediaLoadedCaptured, true);
    document.addEventListener('canplay', onMediaLoadedCaptured, true);
    return () => { 
      try { mo?.disconnect?.(); } catch {}
      window.removeEventListener(MEDIA_MUTED_EVENT, onMutedEvent);
      window.removeEventListener('site-media-play', onExternalMediaPlay);
      document.removeEventListener('visibilitychange', onVisibilityRecover, true);
      window.removeEventListener('pageshow', onPageShowRecover);
      window.removeEventListener('focus', onWindowFocusRecover, true);
      document.removeEventListener('pointerdown', onMediaPointerCaptured, true);
      document.removeEventListener('pause', onMediaPauseCaptured, true);
      document.removeEventListener('play', onMediaPlayCaptured, true);
      document.removeEventListener('error', onMediaErrorCaptured, true);
      document.removeEventListener('loadeddata', onMediaLoadedCaptured, true);
      document.removeEventListener('canplay', onMediaLoadedCaptured, true);
      try { if (rafId) cancelAnimationFrame(rafId); } catch {}
      io?.disconnect?.();
      try { sweepDetachedMediaState('cleanup', true); } catch {}

      try {
        unloadTimers.forEach((id) => clearTimeout(id));
        unloadTimers.clear();
      } catch {}
      try {
        readyReplay.forEach?.((cleanup) => { try { cleanup(); } catch {} });
      } catch {}

      if (active) {
        softPauseMedia(active);
        scheduleHardUnload(active, 0, 'cleanup');
      }
      active = null;
      activeSinceTs = 0;
      ratios.clear();
 
      try {
        document.querySelectorAll(selector).forEach((el) => {
          if (!(el instanceof HTMLVideoElement || el instanceof HTMLAudioElement)) return;
          const h = volHandlers.get(el);
          if (h) el.removeEventListener('volumechange', h);
        });
      } catch {}
      try { 
        if (window.__forumYtPlayers === ytPlayers) {
          delete window.__forumYtPlayers;
        }
      } catch {}  
      // Полная очистка YouTube player'ов, чтобы не держать WebGL/GPU ресурсы
      try {
        ytPlayers.forEach((player, iframe) => {
          try { stopYtMutePoll(player); } catch {}
          try { player?.destroy?.(); } catch {}
          try { if (iframe?.getAttribute?.('src')) iframe.setAttribute('src', ''); } catch {}
        });
      } catch {}
      try { ytPlayers.clear(); } catch {}       
      ytMutePolls.forEach((id) => clearInterval(id));
      ytMutePolls.clear();
      ytMuteLast.clear();
      try { mediaSrcBlockMap.clear(); } catch {}
      emitMediaDiag('media_coordinator_cleanup', {
        ...getIframeSnapshot(),
      }, true);
    }; 
  }, [emitDiag]);
}

