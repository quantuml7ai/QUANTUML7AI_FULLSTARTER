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
    const warmSweepMode = (() => {
      let explicit = '';
      try {
        const env = String(process.env.NEXT_PUBLIC_FORUM_LEGACY_WARM_SWEEP || '').trim().toLowerCase();
        if (env === '1' || env === 'true' || env === 'on') explicit = 'on';
        if (env === '0' || env === 'false' || env === 'off') explicit = 'off';
      } catch {}
      // По умолчанию legacy-контур выключен:
      // единым владельцем прогрева/старта является боевой координатор ниже.
      return explicit || 'off';
    })();
    if (warmSweepMode !== 'on') return;

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
        while (bucket.length > 320) bucket.shift();
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
    const warmResidentCap = isIOSWarm ? 4 : (isCoarseWarm ? 2 : 4);
    const eagerWarmCount = isIOSWarm ? 2 : 2;
    const warmLeaseMs = isIOSWarm ? 2200 : (isCoarseWarm ? 1500 : 1700);
    const residentLeaseMs = isIOSWarm ? 1800 : (isCoarseWarm ? 1200 : 1350);
    const farUnloadMargin = isIOSWarm
      ? Math.max(Math.round(poolMargin * 2.4), 2400)
      : isCoarseWarm
        ? Math.max(Math.round(poolMargin * 1.9), 1800)
        : Math.max(Math.round(poolMargin * 2.6), 2400);

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
  const now = Date.now();
  const minWarmGap = isIOSWarm ? 2200 : (isCoarseWarm ? 1900 : 1600);
  const lastWarmKickTs = Number(video.dataset?.__lastWarmLoadKickTs || 0);
  if (lastWarmKickTs > 0 && (now - lastWarmKickTs) < minWarmGap) return;
  try { video.dataset.__lastWarmLoadKickTs = String(now); } catch {}
  trace('warm_load', video);
  kickMediaLoad(video, {
    channel: 'warm_load',
    minGapMs: minWarmGap,
    burstWindowMs: isIOSWarm ? 22000 : 16000,
    burstLimit: isIOSWarm ? 2 : 3,
    blockMs: isIOSWarm ? 12000 : 9000,
  });
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
        const lastRestoreTs = Number(video.dataset?.__lastRestoreTs || 0);
        const lastHardUnloadTs = Number(video.dataset?.__lastHardUnloadTs || 0);
        const restoredRecently =
          lastRestoreTs > 0 &&
          (now - lastRestoreTs) < (isIOSWarm ? 22000 : (isCoarseWarm ? 18000 : 15000));
        const unloadedRecently =
          lastHardUnloadTs > 0 &&
          (now - lastHardUnloadTs) < (isIOSWarm ? 10000 : (isCoarseWarm ? 8200 : 7000));
        if (loadPending && (nearViewport || hasLease)) {
          video.dataset.__resident = '1';
          video.preload = 'auto';
          return;
        }
        video.preload = 'metadata';
        if (!farViewport) return;
        if (restoredRecently || unloadedRecently) return;
        if (hasLease && loadPending) return;
        // Hard-unload здесь не делаем: это зона ответственности
        // боевого контура координатора ниже (единственный владелец unload).
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
    const legacyIframePrewarmMode = (() => {
      let explicit = '';
      try {
        const env = String(process.env.NEXT_PUBLIC_FORUM_LEGACY_IFRAME_PREWARM || '').trim().toLowerCase();
        if (env === '1' || env === 'true' || env === 'on') explicit = 'on';
        if (env === '0' || env === 'false' || env === 'off') explicit = 'off';
      } catch {}
      // По умолчанию legacy iframe-прогрев выключен:
      // чтобы не конкурировать с основным near/focus контуром.
      return explicit || 'off';
    })();
    // Этот контур legacy; основной owner — нижний coordinator.
    if (legacyIframePrewarmMode !== 'on') return;

    const selector = 'iframe[data-forum-media="youtube"],iframe[data-forum-media="tiktok"],iframe[data-forum-media="iframe"]';
    const isCoarseUi = (() => {
      try {
        const ua = String(navigator?.userAgent || '');
        return /iP(hone|ad|od)|Android/i.test(ua) || !!window?.matchMedia?.('(pointer: coarse)')?.matches;
      } catch {
        return false;
      }
    })();
    const prewarmCap = isCoarseUi ? 3 : 4;

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
      const now = Date.now();
      const lastPrewarmTs = Number(el.dataset?.forumPrewarmTs || 0);
      if (lastPrewarmTs > 0 && (now - lastPrewarmTs) < 900) return;
      const src = String(el.getAttribute('data-src') || '').trim();
      if (!src) return;
      const cur = String(el.getAttribute('src') || '').trim();
      if (cur) {
        el.dataset.forumPrewarmInit = '1';
        el.dataset.forumPrewarmTs = String(now);
        return;
      }
      if (getLoadedIframeCount() >= prewarmCap) return;
      try { el.setAttribute('src', src); } catch {}
      try { el.setAttribute('data-forum-last-active-ts', String(now)); } catch {}
      try { el.dataset.forumPrewarmInit = '1'; } catch {}
      try { el.dataset.forumPrewarmTs = String(now); } catch {}
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
        rootMargin: `${Math.max(isCoarseUi ? 420 : 340, Math.round(__MEDIA_VIS_MARGIN_PX * 1.35))}px 0px ${Math.max(isCoarseUi ? 980 : 760, Math.round(__MEDIA_VIS_MARGIN_PX * 2.35))}px 0px`,
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
        while (bucket.length > 320) bucket.shift();
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
      window.dumpForumDomPressure = () => {
        try {
          const owners = Array.from(document.querySelectorAll('[data-forum-media]'));
          const videos = owners.filter((el) => el instanceof HTMLVideoElement);
          const iframes = owners.filter((el) => el instanceof HTMLIFrameElement);
          const qcast = owners.filter((el) => String(el?.getAttribute?.('data-forum-media') || '') === 'qcast');
          const videosWithSrc = videos.filter((el) => {
            try {
              return !!String(el.getAttribute('src') || el.currentSrc || '');
            } catch {
              return false;
            }
          }).length;
          const iframesLoaded = iframes.filter((el) => {
            try {
              return !!String(el.getAttribute('src') || '').trim();
            } catch {
              return false;
            }
          }).length;
          const totalDomNodes = (() => {
            try {
              return Number(document.getElementsByTagName('*')?.length || 0);
            } catch {
              return 0;
            }
          })();
          const postCards = (() => {
            try {
              return Number(document.querySelectorAll('article[data-forum-post-card="1"]')?.length || 0);
            } catch {
              return 0;
            }
          })();
          const mem = performance?.memory
            ? {
                usedMB: Math.round((Number(performance.memory.usedJSHeapSize || 0) / 1024 / 1024) * 10) / 10,
                totalMB: Math.round((Number(performance.memory.totalJSHeapSize || 0) / 1024 / 1024) * 10) / 10,
                limitMB: Math.round((Number(performance.memory.jsHeapSizeLimit || 0) / 1024 / 1024) * 10) / 10,
              }
            : null;
          return {
            ts: Date.now(),
            totalDomNodes,
            postCards,
            mediaOwners: owners.length,
            videos: videos.length,
            videosWithSrc,
            iframes: iframes.length,
            iframesLoaded,
            qcastOwners: qcast.length,
            ratiosTracked: ratios.size,
            readyReplayTracked: readyReplay.size,
            ytPlayersTracked: ytPlayers.size,
            unloadTimersTracked: unloadTimers.size,
            mem,
          };
        } catch (error) {
          return {
            ts: Date.now(),
            error: String(error?.message || error || 'dumpForumDomPressure_failed'),
          };
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
    // Единый источник mute-предпочтения для video/iframe/youtube — storage.
    // Для QCast используем отдельный ключ, чтобы звук QCast не "сбивался"
    // от глобального muted-состояния видеоленты.
    // В mediaLifecycleRuntime уже есть одноразовый session boot mute,
    // поэтому здесь нельзя каждый init насильно перетирать настройку.
    let mutedPref = null;
    try {
      mutedPref = readMutedPrefFromStorage();
    } catch {
      mutedPref = null;
    }
    if (typeof mutedPref !== 'boolean') mutedPref = true;

    const desiredMuted = () => (mutedPref == null ? true : !!mutedPref);
    const readQcastMutedPref = () => {
      return readMutedPrefFromStorage();
    };
const writeQcastMutedPref = (next) => {
  setMutedPref(!!next, 'qcast');
};
 

    const applyMutedPref = (el) => {
      if (!(el instanceof HTMLMediaElement)) return;
      const want = desiredMuted();
      if (el.muted !== want) el.muted = want;
    };
const applyMutedPrefToAll = () => {
  try {
    const want = desiredMuted();

    document.querySelectorAll('[data-forum-media]').forEach((el) => {
      const kind = String(el?.getAttribute?.('data-forum-media') || '');

      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        if (el.muted !== want) el.muted = want;
        el.defaultMuted = want;
        if (want) el.setAttribute('muted', '');
        else el.removeAttribute('muted');
        return;
      }

      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) {
          if (a.muted !== want) a.muted = want;
          a.defaultMuted = want;
          if (want) a.setAttribute('muted', '');
          else a.removeAttribute('muted');
        }
        return;
      }

      if (kind === 'tiktok' || kind === 'iframe') {
        try {
          el.contentWindow?.postMessage?.({ method: want ? 'mute' : 'unmute' }, '*');
        } catch {}
        try {
          el.contentWindow?.postMessage?.({
            event: 'command',
            func: want ? 'mute' : 'unMute',
            args: '',
          }, '*');
        } catch {}
      }
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
    const srcKickState = new Map();
    const MAX_CONCURRENT_LOAD_PENDING = (() => {
      try {
        const ua = String(navigator?.userAgent || '');
        const ios = /iP(hone|ad|od)/i.test(ua);
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches;
        const dm = Number(navigator?.deviceMemory || 0);
        const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 3;

        if (ios) return 1;
        if (lowMem) return 1;
        if (coarse) return 2;
        return 4;
      } catch {
        return 2;
      }
    })();
    let pendingLoadsCacheTs = 0;
    let pendingLoadsCacheVal = 0;
    const readPendingLoads = (force = false) => {
      try {
        const now = Date.now();
        if (!force && (now - pendingLoadsCacheTs) < 140) return pendingLoadsCacheVal;
        pendingLoadsCacheTs = now;
        const nodes = Array.from(document.querySelectorAll('video[data-forum-media],audio[data-forum-media],audio[data-qcast-audio="1"]'));
        const stalePendingMs = (() => {
          try {
            const ua = String(navigator?.userAgent || '');
            const ios = /iP(hone|ad|od)/i.test(ua);
            const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches;
            if (ios) return 3600;
            if (coarse) return 4800;
            return 6200;
          } catch {
            return 5200;
          }
        })();
        pendingLoadsCacheVal = nodes.reduce((acc, node) => {
          try {
            if (String(node?.dataset?.__loadPending || '') !== '1') return acc;
            const since = Number(node?.dataset?.__loadPendingSince || 0);
            const readyState = Number(node?.readyState || 0);
            const networkState = Number(node?.networkState || 0);
            const pendingForMs = since > 0 ? (now - since) : 0;
            const mayBeStuck =
              pendingForMs > stalePendingMs &&
              readyState === 0 &&
              (
                networkState === HTMLMediaElement.NETWORK_LOADING ||
                networkState === HTMLMediaElement.NETWORK_EMPTY ||
                networkState === HTMLMediaElement.NETWORK_NO_SOURCE
              );
            if (mayBeStuck) {
              try {
                node.dataset.__loadPending = '0';
                delete node.dataset.__loadPendingSince;
              } catch {}
              trace('load_pending_stale_reset', node, { pendingForMs, stalePendingMs });
              return acc;
            }
            return acc + 1;
          } catch {}
          return acc;
        }, 0);
        return pendingLoadsCacheVal;
      } catch {
        return 0;
      }
    };
    const getMediaSrcKey = (el) => {
      const media = getMediaStateNode(el);
      if (!(media instanceof HTMLMediaElement)) return '';
      try {
        const raw = String(
          media.dataset?.__src ||
          media.getAttribute?.('data-src') ||
          media.currentSrc ||
          media.getAttribute?.('src') ||
          ''
        ).trim();
        if (!raw) return '';
        return raw.slice(0, 1024);
      } catch {
        return '';
      }
    };
    const pruneSrcKickState = (nowTs) => {
      try {
        if (srcKickState.size <= 220) return;
        const now = Number(nowTs || Date.now());
        for (const [key, st] of srcKickState) {
          const touchedAt = Number(st?.touchedAt || 0);
          if (!touchedAt || (now - touchedAt) > 120000) srcKickState.delete(key);
        }
        if (srcKickState.size <= 220) return;
        const overflow = srcKickState.size - 220;
        let removed = 0;
        for (const key of srcKickState.keys()) {
          srcKickState.delete(key);
          removed += 1;
          if (removed >= overflow) break;
        }
      } catch {}
    };
    const canKickLoad = (
      el,
      {
        channel = 'generic',
        minGapMs = 1300,
        burstWindowMs = 16000,
        burstLimit = 5,
        blockMs = 10000,
        bypassSrcLimiter = false,
        bypassPendingBudget = false,
      } = {},
    ) => {
      const media = getMediaStateNode(el);
      if (!(media instanceof HTMLMediaElement)) return false;
      const now = Date.now();
      try {
        const isPending = String(media?.dataset?.__loadPending || '') === '1';
        const isRetry = String(channel || '').includes('retry');
        if (isPending && !isRetry) {
          trace('load_kick_skip_already_pending', media, { channel });
          return false;
        }
      } catch {}
      const isUserIntentChannel = (() => {
        try {
          const c = String(channel || '').toLowerCase();
          return c.startsWith('play_') || c.startsWith('qcast_') || c.startsWith('manual_') || c.includes('gesture');
        } catch {
          return false;
        }
      })();
      if (!bypassPendingBudget && !isUserIntentChannel) {
        const pendingLoads = readPendingLoads();
        if (pendingLoads >= Math.max(1, Number(MAX_CONCURRENT_LOAD_PENDING || 0))) {
          trace('load_kick_skip_budget', media, {
            channel,
            pendingLoads,
            cap: Number(MAX_CONCURRENT_LOAD_PENDING || 0),
          });
          return false;
        }
      }
      const srcKey = getMediaSrcKey(media);
      if (srcKey && !bypassSrcLimiter) {
        try {
          const state = srcKickState.get(srcKey) || {};
          const blockedUntil = Number(state?.blockedUntil || 0);
          if (blockedUntil > now) {
            trace('load_kick_skip_src_blocked', media, {
              channel,
              blockedForMs: blockedUntil - now,
            });
            return false;
          }
          const lastKickTs = Number(state?.lastKickTs || 0);
          if (lastKickTs > 0 && (now - lastKickTs) < Math.max(200, Number(minGapMs || 0))) {
            trace('load_kick_skip_src_gap', media, {
              channel,
              sinceMs: now - lastKickTs,
            });
            return false;
          }
          const winStart = Number(state?.windowStart || 0);
          let kickCount = Number(state?.count || 0);
          const inWindow = winStart > 0 && (now - winStart) < Math.max(1000, Number(burstWindowMs || 0));
          const nextWinStart = inWindow ? winStart : now;
          if (!inWindow) kickCount = 0;
          kickCount += 1;
          if (kickCount > Math.max(1, Number(burstLimit || 0))) {
            const until = now + Math.max(1500, Number(blockMs || 0));
            srcKickState.set(srcKey, {
              blockedUntil: until,
              lastKickTs,
              windowStart: nextWinStart,
              count: kickCount,
              touchedAt: now,
            });
            pruneSrcKickState(now);
            trace('load_kick_block_src', media, {
              channel,
              kicks: kickCount,
              blockedForMs: until - now,
            });
            return false;
          }
          srcKickState.set(srcKey, {
            blockedUntil: 0,
            lastKickTs: now,
            windowStart: nextWinStart,
            count: kickCount,
            touchedAt: now,
          });
          pruneSrcKickState(now);
        } catch {}
      }
      try {
        const blockedUntil = Number(media.dataset?.__loadKickBlockedUntil || 0);
        if (blockedUntil > now) {
          trace('load_kick_skip_blocked', media, {
            channel,
            blockedForMs: blockedUntil - now,
          });
          return false;
        }
      } catch {}
      try {
        const lastKickTs = Number(media.dataset?.__lastLoadKickTs || 0);
        if (lastKickTs > 0 && (now - lastKickTs) < Math.max(200, Number(minGapMs || 0))) {
          trace('load_kick_skip_gap', media, {
            channel,
            sinceMs: now - lastKickTs,
          });
          return false;
        }
      } catch {}
      try {
        const winStart = Number(media.dataset?.__loadKickWindowStart || 0);
        let kickCount = Number(media.dataset?.__loadKickCount || 0);
        const inWindow = winStart > 0 && (now - winStart) < Math.max(1000, Number(burstWindowMs || 0));
        if (!inWindow) {
          media.dataset.__loadKickWindowStart = String(now);
          kickCount = 0;
        }
        kickCount += 1;
        media.dataset.__loadKickCount = String(kickCount);
        if (kickCount > Math.max(1, Number(burstLimit || 0))) {
          const until = now + Math.max(1500, Number(blockMs || 0));
          media.dataset.__loadKickBlockedUntil = String(until);
          trace('load_kick_block', media, {
            channel,
            kicks: kickCount,
            blockedForMs: until - now,
          });
          return false;
        }
      } catch {}
      try { media.dataset.__lastLoadKickTs = String(now); } catch {}
      return true;
    };
const markLoadPending = (el, reason = 'load') => {
  const media = getMediaStateNode(el);
  if (!(media instanceof HTMLMediaElement)) return false;

  const now = Date.now();
  try {
    media.dataset.__loadPending = '1';
    media.dataset.__loadPendingSince = String(now);
    media.dataset.__loadPendingReason = String(reason || 'load');
    media.dataset.__warmReady = '0';
  } catch {}

  pendingLoadsCacheTs = 0;
  pendingLoadsCacheVal = 0;
  return true;
};

const clearLoadPending = (el, reason = 'clear', warmReady = false) => {
  const media = getMediaStateNode(el);
  if (!(media instanceof HTMLMediaElement)) return;

  try {
    media.dataset.__loadPending = '0';
    media.dataset.__warmReady = warmReady ? '1' : '0';
    media.dataset.__loadPendingClearReason = String(reason || 'clear');
    delete media.dataset.__loadPendingSince;
  } catch {}

  pendingLoadsCacheTs = 0;
  pendingLoadsCacheVal = 0;
};

const kickMediaLoad = (
  el,
  {
    channel = 'generic',
    minGapMs = 1300,
    burstWindowMs = 16000,
    burstLimit = 5,
    blockMs = 10000,
    bypassSrcLimiter = false,
    bypassPendingBudget = false,
  } = {},
) => {
  const media = getMediaStateNode(el);
  if (!(media instanceof HTMLMediaElement)) return false;

  if (!canKickLoad(media, {
    channel,
    minGapMs,
    burstWindowMs,
    burstLimit,
    blockMs,
    bypassSrcLimiter,
    bypassPendingBudget,
  })) return false;

  try {
    if (!String(media.getAttribute?.('src') || media.currentSrc || '').trim()) {
      __restoreVideoEl(media);
    }
  } catch {}

  markLoadPending(media, channel);

  try {
    media.load?.();
    return true;
  } catch {
    clearLoadPending(media, 'load_throw', false);
    return false;
  }
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
      const until = Date.now() + 1300;
      try {
        el.dataset.__systemPause = '1';
        el.dataset.__systemPauseUntil = String(until);
      } catch {}
      if (clearUser) clearUserPaused(el);
      try { fn?.(); } catch {}
      setTimeout(() => {
        try {
          delete el.dataset.__systemPause;
          delete el.dataset.__systemPauseUntil;
        } catch {}
      }, 1300);
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
      if (readyReplay.has(el)) return;
      const replay = () => {
        clearReadyReplay(el);
        if (isUserPaused(el)) {
          trace('ready_replay_skip_user_paused', el);
          return;
        }
        const owner = getOwnerNode(el) || (el instanceof Element ? el : null);
        const activeOwner = active instanceof Element ? active : null;
        const ownerMatchesActive =
          !!(owner instanceof Element && activeOwner &&
            (activeOwner === owner || activeOwner.contains?.(owner) || owner.contains?.(activeOwner)));
        const manualLease = hasManualLease(owner || el) || hasManualLease(el);
        const hasGesture = hasUserGestureIntent(owner || el) || hasUserGestureIntent(el);
        const visiblePxNow = getOwnerVisiblePx(owner || el);
        const minVisiblePx = getAutoplayMinVisiblePx(owner || el);
        const centerDistNow = getOwnerCenterDist(owner || el);
        const maxCenterDist = getPriorityCenterMaxDist(owner || el);
        if (!ownerMatchesActive && !manualLease && !hasGesture) {
          trace('ready_replay_skip_not_active', el, {
            visiblePx: visiblePxNow,
            minVisiblePx,
            centerDist: centerDistNow,
            maxCenterDist,
          });
          return;
        }
        if (!manualLease && !hasGesture && (visiblePxNow < minVisiblePx || centerDistNow > maxCenterDist)) {
          trace('ready_replay_skip_out_of_focus', el, {
            visiblePx: visiblePxNow,
            minVisiblePx,
            centerDist: centerDistNow,
            maxCenterDist,
          });
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

      const reasonTag = String(reason || '').trim();
      const highPriorityReason =
        reasonTag === 'activate_pending' ||
        reasonTag === 'play_wait_ready' ||
        reasonTag === 'visibility_recover';

      const isPrewarmOnly =
        reasonTag === 'pending_grace' ||
        reasonTag === 'early_prewarm' ||
        reasonTag === 'io_near_prewarm' ||
        reasonTag === 'candidate_near_prewarm';

try {
  applyMutedPref(el);
  el.playsInline = true;

  if (el instanceof HTMLVideoElement) {
    const isPostVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post';

    try { el.dataset.__resident = highPriorityReason ? '1' : '0'; } catch {}
    try { el.dataset.__prewarm = highPriorityReason ? '1' : '0'; } catch {}
    try { el.preload = highPriorityReason ? 'auto' : 'metadata'; } catch {}

    // Critical mobile fix:
    // low-priority near/prewarm must NOT attach src for post native video.
    // On iOS/Safari even src+metadata may start Range/206, then coordinator cancels it.
    // Only activation/play/visibility recovery is allowed to restore src and touch network.
    if (isPostVideo && isPrewarmOnly && !highPriorityReason) {
      trace('candidate_skip_low_priority_native_restore', el, { reason });
      return Number(el.readyState || 0) >= 2 || String(el.dataset?.__warmReady || '') === '1';
    }

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
        const stalePendingMs = isIOSUi ? 2400 : (isCoarseUi ? 3200 : 4200);
        if (
          String(el.dataset?.__loadPending || '') === '1' &&
          pendingSince > 0 &&
          readyState === 0 &&
          (now - pendingSince) > stalePendingMs
        ) {
          try {
            el.dataset.__loadPending = '0';
            delete el.dataset.__loadPendingSince;
          } catch {}
          trace('candidate_clear_stale_pending', el, { reason, pendingForMs: now - pendingSince });
        }
const cold = networkState === HTMLMediaElement.NETWORK_EMPTY || !el.currentSrc;
if (cold && (now - lastBoostTs) > 1500 && el.dataset?.__loadPending !== '1') {
  const isPostVideo =
    el instanceof HTMLVideoElement &&
    String(el?.getAttribute?.('data-forum-video') || '') === 'post';

  const allowDirectColdLoad =
    !isPostVideo ||
    highPriorityReason ||
    String(el?.dataset?.__playRequested || '') === '1' ||
    String(el?.dataset?.__active || '') === '1';

  if (!allowDirectColdLoad) {
    armReadyReplay(el);
    return false;
  }

  const minGapMs = highPriorityReason
    ? (isIOSUi ? 1300 : (isCoarseUi ? 1000 : 900))
    : (isIOSUi ? 1900 : (isCoarseUi ? 1600 : 1400));

  try { el.dataset.__candidateBoostTs = String(now); } catch {}
  trace('candidate_force_load', el, { reason: `${reason}:cold` });

  if (!kickMediaLoad(el, {
    channel: 'candidate_cold',
    minGapMs,
    burstWindowMs: isIOSUi ? 22000 : 16000,
    burstLimit: isIOSUi ? (highPriorityReason ? 3 : 2) : (highPriorityReason ? 4 : 3),
    blockMs: isIOSUi ? 14000 : 10000,
    bypassPendingBudget: false,
    bypassSrcLimiter: false,
  })) {
    armReadyReplay(el);
    return false;
  }
} 
        const stalledPending =
          String(el.dataset?.__loadPending || '') === '1' &&
          readyState === 0 &&
          networkState === HTMLMediaElement.NETWORK_LOADING &&
          pendingSince > 0 &&
          (now - pendingSince) > (isIOSUi ? 1100 : 1450);
        const maxReadyRetryCount = isIOSUi ? 2 : 1;
if (stalledPending && readyRetryCount < maxReadyRetryCount && (now - lastBoostTs) > 900) {
  const isPostVideo =
    el instanceof HTMLVideoElement &&
    String(el?.getAttribute?.('data-forum-video') || '') === 'post';

  if (isPostVideo) {
    const wantsRealPlayback =
      String(el?.dataset?.__playRequested || '') === '1' ||
      String(el?.dataset?.__active || '') === '1';

    try { el.dataset.__readyRetryCount = String(readyRetryCount + 1); } catch {}

    if (!el.getAttribute('src')) {
      trace('candidate_pending_stall_retry', el, {
        reason,
        stalledMs: now - pendingSince,
        mode: 'restore_only',
      });
      try { __restoreVideoEl(el); } catch {}
      armReadyReplay(el);
      return false;
    }

    if (!wantsRealPlayback) {
      armReadyReplay(el);
      return false;
    }

    clearLoadPending(el, 'candidate_retry_reset', false);
    try { el.dataset.__candidateBoostTs = String(now); } catch {}

    trace('candidate_pending_stall_retry', el, {
      reason,
      stalledMs: now - pendingSince,
      mode: 'load_only',
    });

    if (!kickMediaLoad(el, {
      channel: 'candidate_retry',
      minGapMs: isIOSUi ? 1600 : 1200,
      burstWindowMs: isIOSUi ? 22000 : 17000,
      burstLimit: isIOSUi ? 2 : 3,
      blockMs: isIOSUi ? 13000 : 9000,
      bypassPendingBudget: false,
      bypassSrcLimiter: false,
    })) {
      armReadyReplay(el);
      return false;
    }

    armReadyReplay(el);
    return false;
  }

  try { el.dataset.__candidateBoostTs = String(now); } catch {}
  try { el.dataset.__readyRetryCount = String(readyRetryCount + 1); } catch {}
  trace('candidate_pending_stall_retry', el, {
    reason,
    stalledMs: now - pendingSince,
  });

  if (!kickMediaLoad(el, {
    channel: 'candidate_retry',
    minGapMs: isIOSUi ? 1600 : 1200,
    burstWindowMs: isIOSUi ? 22000 : 17000,
    burstLimit: isIOSUi ? 2 : 3,
    blockMs: isIOSUi ? 13000 : 9000,
    bypassPendingBudget: false,
    bypassSrcLimiter: false,
  })) {
    armReadyReplay(el);
    return false;
  }
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
  try {
    const owner = getOwnerNode(el);
    const isQcastAudio =
      owner?.getAttribute?.('data-forum-media') === 'qcast' ||
      String(el?.dataset?.qcastAudio || '') === '1';
    if (isQcastAudio) {
      setMutedPref(!!el.muted, 'qcast');
      return;
    }
  } catch {}
  setMutedPref(!!el.muted, 'video');
};
      volHandlers.set(el, h);
      el.addEventListener('volumechange', h, { passive: true });
    };
const onMutedEvent = (e) => {
  const source = String(e?.detail?.source || 'external');
  const isAuthoritativeMuteSource =
    source === 'media_element' ||
    source === 'external' ||
    source === 'forum-splash' ||
    source === 'video' ||
    source === 'youtube' ||
    source === 'qcast' ||
    source === 'forum-ads' ||
    source === 'forum-ads-toggle';

  if (source === 'forum-coordinator') return;
  if (!isAuthoritativeMuteSource) return;
  if (typeof e?.detail?.muted !== 'boolean') return;

  setMutedPref(e.detail.muted, source, false);
};
    const onMediaPauseCaptured = (e) => {
      const target = e?.target;
      if (!(target instanceof HTMLVideoElement || target instanceof HTMLAudioElement)) return;
      const owner = getOwnerNode(target);
      if (!(owner instanceof Element)) return;
      const systemPauseUntil = Number(target?.dataset?.__systemPauseUntil || 0);
      if (String(target.dataset?.__systemPause || '') === '1' || systemPauseUntil > Date.now()) return;
      const manualLease = hasManualLease(owner) || hasManualLease(target);
      const hasGesture = hasUserGestureIntent(owner) || hasUserGestureIntent(target);
      const coordinatorPlay = hasCoordinatorPlayIntent(owner) || hasCoordinatorPlayIntent(target);
      const activeOwner = active instanceof Element ? active : null;
      const ownerMatchesActive =
        !!(activeOwner && (
          activeOwner === owner ||
          activeOwner.contains?.(owner) ||
          owner.contains?.(activeOwner)
        ));
      const nearViewport = isNearViewportElement(
        owner,
        isIOSUi ? 280 : (isCoarseUi ? 220 : 180),
      );
      if (!manualLease && !hasGesture && !nearViewport) {
        trace('pause_ignore_out_of_view', target);
        clearReadyReplay(target);
        clearCoordinatorPlayIntent(target);
        clearCoordinatorPlayIntent(owner);
        return;
      }
      if (!manualLease && !hasGesture && (coordinatorPlay || !ownerMatchesActive)) {
        trace('pause_ignore_non_user', target, {
          coordinatorPlay,
          ownerMatchesActive,
        });
        clearReadyReplay(target);
        clearCoordinatorPlayIntent(target);
        clearCoordinatorPlayIntent(owner);
        return;
      }
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
      const visiblePxNow = getOwnerVisiblePx(owner);
      const minVisiblePx = getAutoplayMinVisiblePx(owner);
      const centerDistNow = getOwnerCenterDist(owner);
      const maxCenterDist = getPriorityCenterMaxDist(owner);
      if (
        !coordinatorPlay &&
        !manualLease &&
        !hasGesture &&
        (visiblePxNow < minVisiblePx || centerDistNow > maxCenterDist)
      ) {
        trace('play_blocked_out_of_focus', target, {
          visiblePx: visiblePxNow,
          minVisiblePx,
          centerDist: centerDistNow,
          maxCenterDist,
        });
        clearReadyReplay(target);
        invalidatePlayRequest(target);
        markSuppressedPlayback(target, 1800);
        markSuppressedPlayback(owner, 1800);
        withSystemPause(target, () => {
          try { if (!target.paused) target.pause(); } catch {}
        });
        return;
      }
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
          // Любой play (и manual, и coordinator) должен жёстко гасить остальных,
          // иначе при гонках промисов возможен двойной autoplay.
          pauseForeignMedia(owner);
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
      const coordinatorUnloadUntil = Number(target?.dataset?.__coordinatorUnloadUntil || 0);
      if (coordinatorUnloadUntil > Date.now()) {
        trace('media_error_ignore', target, { code: errCode, reason: 'coordinator_unload_window' });
        return;
      }
      if (errCode === 2) {
        const now = Date.now();
        const lastKickTs = Math.max(
          Number(target?.dataset?.__lastLoadKickTs || 0),
          Number(target?.dataset?.__lastWarmLoadKickTs || 0),
          Number(target?.dataset?.__lastRestoreLoadTs || 0),
        );
        const kickedRecently = lastKickTs > 0 && (now - lastKickTs) < (isIOSUi ? 5200 : 4200);
        const loadingState =
          typeof HTMLMediaElement !== 'undefined' &&
          Number(target?.networkState || 0) === HTMLMediaElement.NETWORK_LOADING;
        if (kickedRecently || loadingState) {
          trace('media_error_ignore', target, {
            code: errCode,
            reason: kickedRecently ? 'transient_network_after_kick' : 'transient_network_loading',
          });
          return;
        }
      }
      if (errCode === 4) {
        const srcNow = String(target.getAttribute('src') || target.currentSrc || '').trim();
        const lazySrc = String(target.dataset?.__src || target.getAttribute('data-src') || '').trim();
        if (!srcNow && !!lazySrc) {
          trace('media_error_ignore', target, { code: errCode, reason: 'lazy_src_not_attached' });
          return;
        }
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
  clearLoadPending(target, e?.type === 'canplay' ? 'canplay' : 'loadeddata', target.readyState >= 2);

  try {
    const isPostVideo =
      target instanceof HTMLVideoElement &&
      String(target?.getAttribute?.('data-forum-video') || '') === 'post';

    const wantsAutoplay =
      (
        String(target?.dataset?.__playRequested || '') === '1' ||
        String(target?.dataset?.__active || '') === '1'
      ) &&
      !isUserPaused(target) &&
      !hasSuppressedPlayback(target);

    const lastLoadedRetryTs = Number(target?.dataset?.__loadedRetryTs || 0);
    const now = Date.now();

    const canAttemptAudible = hasUserGestureIntent(target) || hasManualLease(target);
    const allowRetry =
      isPostVideo
        ? true
        : (!!target.muted || canAttemptAudible);

    const nearViewport = isPostVideo
      ? isNearViewportElement(target, isCoarseUi ? 820 : 1100)
      : true;

    const readyPlayAttemptTs = Number(target?.dataset?.__readyPlayAttemptTs || 0);

    if (
      wantsAutoplay &&
      allowRetry &&
      nearViewport &&
      target.paused &&
      (now - lastLoadedRetryTs) > 900 &&
      (now - readyPlayAttemptTs) > 1200
    ) {
      try {
        target.dataset.__loadedRetryTs = String(now);
        target.dataset.__readyPlayAttemptTs = String(now);
      } catch {}
      trace('loaded_autoplay_retry', target, { type: e?.type || 'loaded' });
      startHtmlMedia(target, 'loaded_autoplay_retry');
    }
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
        try {
          el.dataset.__playRequested = '1';
          el.dataset.__prewarm = '1';
          el.dataset.__resident = '1';
          if (String(el.dataset?.__active || '') !== '1') {
            el.dataset.__active = '0';
          }
        } catch {}

        const p = el.play?.();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (!canContinue()) {
              try { el.dataset.__playRequested = '0'; } catch {}
              trace('play_started_stale', el, { reason, muted: !!el.muted });
              withSystemPause(el, () => {
                try { if (!el.paused) el.pause(); } catch {}
              });
              return;
            }
trace('play_started', el, { reason, muted: !!el.muted });
try {
  const confirmedReady =
    Number(el?.readyState || 0) >= 2 &&
    !!String(el?.getAttribute?.('src') || el?.currentSrc || '');

  el.dataset.__playRequested = '0';
  el.dataset.__active = '1';
  el.dataset.__prewarm = '1';
  el.dataset.__resident = '1';
  el.dataset.__loadPending = '0';
  el.dataset.__warmReady = confirmedReady ? '1' : '0';
  delete el.dataset.__loadPendingSince;
  el.preload = 'auto';
} catch {}

try { pauseForeignMedia(el); } catch {}

if (String(el?.dataset?.__warmReady || '') === '1') {
  try { __touchActiveVideoEl(el); } catch {}
  try { __enforceActiveVideoCap(el); } catch {}
}
          }).catch((err) => {
            if (!canContinue()) {
              try { el.dataset.__playRequested = '0'; } catch {}
              trace('play_reject_stale', el, { reason });
              return;
            }
            try { el.dataset.__playRequested = '0'; } catch {}
            trace('play_reject', el, {
              reason,
              name: String(err?.name || ''),
              message: String(err?.message || ''),
              muted: !!el.muted,
            });
            if (el.muted) return;
            const qcastHost = (() => {
              try { return el.closest?.('[data-forum-media="qcast"]') || null; } catch { return null; }
            })();
            const qcastUserUnmuteHoldUntil = Math.max(
              Number(el?.dataset?.__userUnmuteHoldUntil || 0),
              Number(qcastHost?.dataset?.__userUnmuteHoldUntil || 0),
              Number(window?.__forumQcastUnmuteHoldUntil || 0),
            );
            if (qcastHost && qcastUserUnmuteHoldUntil > Date.now()) {
              // Пользователь явно держит qcast в unmute:
              // не переводим в muted-fallback, иначе визуально "звук включён", а по факту тишина.
              trace('play_reject_qcast_hold', el, { reason });
              return;
            }
            try {
              markSkipMutePersist(el);
              el.dataset.__autoplayFallbackMuted = '1';
              el.muted = true;
              el.defaultMuted = true;
              el.setAttribute('muted', '');
              try {
                el.dispatchEvent?.(new Event('volumechange'));
              } catch {}
            } catch {}
            try {
              const retry = el.play?.();
              if (retry && typeof retry.then === 'function') {
                retry.then(() => {
                  if (!canContinue()) {
                    try { el.dataset.__playRequested = '0'; } catch {}
                    trace('play_retry_stale', el, { reason });
                    withSystemPause(el, () => {
                      try { if (!el.paused) el.pause(); } catch {}
                    });
                    return;
                  }
trace('play_retry_muted_ok', el, { reason });
try {
  const confirmedReady =
    Number(el?.readyState || 0) >= 2 &&
    !!String(el?.getAttribute?.('src') || el?.currentSrc || '');

  el.dataset.__playRequested = '0';
  el.dataset.__active = '1';
  el.dataset.__prewarm = '1';
  el.dataset.__resident = '1';
  el.dataset.__loadPending = '0';
  el.dataset.__warmReady = confirmedReady ? '1' : '0';
  delete el.dataset.__loadPendingSince;
  el.preload = 'auto';
} catch {}

try { pauseForeignMedia(el); } catch {}

if (String(el?.dataset?.__warmReady || '') === '1') {
  try { __touchActiveVideoEl(el); } catch {}
  try { __enforceActiveVideoCap(el); } catch {}
}                 
                }).catch((retryErr) => {
                  try { el.dataset.__playRequested = '0'; } catch {}
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
    let nearIo = null;

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
    const IFRAME_HARD_UNLOAD_MS = isIOSUi ? 9800 : (isCoarseUi ? 7600 : 5200);
    const IFRAME_RESIDENT_CAP = (() => {
      try {
        if (isIOSUi) return 1;
        if (isCoarseUi) return 2;
        const dm = Number(navigator?.deviceMemory || 0);
        if (Number.isFinite(dm) && dm > 0 && dm <= 4) return 3;
        return 4;
      } catch {
        return 2;
      }
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

    const hardUnloadPending =
      String(mediaDataset?.__pendingHardUnload || ownerDataset?.__pendingHardUnload || '') === '1';

    if (hardUnloadPending) return false;

    if (String(mediaDataset?.__active || ownerDataset?.__active || '') === '1') return true;

    if (String(mediaDataset?.__prewarm || ownerDataset?.__prewarm || '') === '1') {
      return isNearViewportElement(owner || mediaEl, isIOSUi ? 520 : 760);
    }

    if (String(mediaDataset?.__resident || ownerDataset?.__resident || '') === '1') {
      return isNearViewportElement(owner || mediaEl, isIOSUi ? 420 : 640);
    }

    if (String(mediaDataset?.__loadPending || ownerDataset?.__loadPending || '') === '1') {
      const since = Number(mediaDataset?.__loadPendingSince || ownerDataset?.__loadPendingSince || 0);
      if (since > 0 && Date.now() - since < (isIOSUi ? 2600 : 3600)) return true;
      return false;
    }

    if (isNearViewportElement(owner || mediaEl, isIOSUi ? 360 : 520)) return true;
  } catch {}

  return false;
};
    const mediaSrcBlockMap = new Map();
    // Keep source blocking short/adaptive: damp retry storms,
    // but avoid multi-minute false blacklisting after transient errors.
    const MEDIA_SRC_BLOCK_BASE_MS = isIOSUi ? 2800 : (isCoarseUi ? 2200 : 1800);
    const MEDIA_SRC_BLOCK_MAX_MS = isIOSUi ? 30000 : 24000;
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
      const errCode = Number(String(reason || '').match(/html_error_(\d+)/)?.[1] || 0);
      const baseByCode = (() => {
        if (errCode === 4) return Math.max(7000, MEDIA_SRC_BLOCK_BASE_MS * 2.4);
        if (errCode === 3) return Math.max(2800, MEDIA_SRC_BLOCK_BASE_MS * 1.6);
        if (errCode === 2) return Math.max(2200, MEDIA_SRC_BLOCK_BASE_MS * 1.3);
        return MEDIA_SRC_BLOCK_BASE_MS;
      })();
      const penalty = Math.min(MEDIA_SRC_BLOCK_MAX_MS, baseByCode * Math.pow(1.8, Math.min(hits - 1, 4)));
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
          if (isIOSUi) return 5600;
          return isCoarseUi ? 4600 : 5200;
        }
        if (reason === 'out_of_view') {
          if (isIOSUi) return 7000;
          return isCoarseUi ? 5200 : 6200;
        }
        if (isIOSUi) return 6400;
        return isCoarseUi ? 5000 : 5800;
      }
      if (reason === 'cleanup' || reason === 'resident_cap') return 0;
      if (!isCoarseUi && (reason === 'focus_switch' || reason === 'below_stop_ratio' || reason === 'candidate_replace')) {
        return 5200;
      }
      if (isCoarseUi && (reason === 'focus_switch' || reason === 'below_stop_ratio' || reason === 'candidate_replace')) {
        return 4600;
      }
      if (!isCoarseUi && reason === 'out_of_view') return 5200;
      if (isCoarseUi && reason === 'out_of_view') return 5000;
      return isCoarseUi ? 5000 : 5600;
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
    const settlingUntil = new WeakMap();
    const markSettling = (el, ms = null, reason = 'settling') => {
      if (!(el instanceof Element)) return 0;
      const now = Date.now();
      const holdMs = Number.isFinite(ms)
        ? Number(ms)
        : (isIOSUi ? 1800 : (isCoarseUi ? 1400 : 1100));
      const until = now + Math.max(220, holdMs);
      settlingUntil.set(el, until);
      try { el.setAttribute('data-forum-settling-until', String(until)); } catch {}
      trace('markSettling', el, { reason, until });
      return until;
    };
    const isSettling = (el) => {
      if (!(el instanceof Element)) return false;
      return Number(settlingUntil.get(el) || 0) > Date.now();
    };
    emitMediaDiag('media_coordinator_init', {
      iframeHardUnloadMs: IFRAME_HARD_UNLOAD_MS,
      iframeResidentCap: IFRAME_RESIDENT_CAP,
      isCoarseUi,
      ...getIframeSnapshot(),
    }, true);
    try { window.__forumMediaCoordinatorActive = '1'; } catch {}

    const softPauseMedia = (el, reason = 'soft_pause') => {
      if (!el) return;
      clearReadyReplay(el);
      trace('soft_pause', el, { reason });
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
    const getOwnerVisiblePx = (el) => {
      try {
        const owner = getOwnerNode(el) || (el instanceof Element ? el : null);
        if (!(owner instanceof Element)) return 0;
        const rect = owner.getBoundingClientRect?.();
        if (!rect) return 0;
        const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        return Math.max(0, Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0));
      } catch {}
      return 0;
    };
    const getAutoplayMinVisiblePx = (el) => {
      const kind = String(getOwnerNode(el)?.getAttribute?.('data-forum-media') || el?.getAttribute?.('data-forum-media') || '');
      if (kind === 'qcast') return isIOSUi ? 64 : (isCoarseUi ? 98 : 80);
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return isIOSUi ? 96 : (isCoarseUi ? 150 : 140);
      return isIOSUi ? 72 : (isCoarseUi ? 128 : 120);
    };
    const getOwnerCenterDist = (el) => {
      try {
        const owner = getOwnerNode(el) || (el instanceof Element ? el : null);
        if (!(owner instanceof Element)) return Number.POSITIVE_INFINITY;
        const rect = owner.getBoundingClientRect?.();
        if (!rect) return Number.POSITIVE_INFINITY;
        const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        const viewportCenter = viewportH / 2;
        const center = (Number(rect.top || 0) + Number(rect.bottom || 0)) / 2;
        return Math.abs(center - viewportCenter);
      } catch {}
      return Number.POSITIVE_INFINITY;
    };
    const getPriorityCenterMaxDist = (el) => {
      const kind = String(getOwnerNode(el)?.getAttribute?.('data-forum-media') || el?.getAttribute?.('data-forum-media') || '');
      const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
      if (kind === 'qcast') return Math.max(150, Math.round(viewportH * (isIOSUi ? 0.62 : (isCoarseUi ? 0.44 : 0.36))));
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') {
        return Math.max(170, Math.round(viewportH * (isIOSUi ? 0.6 : (isCoarseUi ? 0.42 : 0.34))));
      }
      return Math.max(140, Math.round(viewportH * (isIOSUi ? 0.56 : (isCoarseUi ? 0.40 : 0.30))));
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
        markSuppressedPlayback(node, 1200);
        try {
          const owner = getOwnerNode(node);
          if (owner instanceof Element) markSuppressedPlayback(owner, 1200);
        } catch {}
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
          markSuppressedPlayback(a, 1200);
          markSuppressedPlayback(node, 1200);
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
        // Не делаем отложенный hard-unload на обычном foreign pause:
        // это давало визуальное исчезновение iframe и дергания ленты.
      }
    }); 
  } catch {}
}; 
    const hardUnloadMedia = (...args) => {
      const el = args?.[0];
      const unloadReason = String(args?.[1] || 'unknown');
      if (!el) return;
      clearReadyReplay(el);
      trace('hard_unload', el, { reason: unloadReason });
      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        invalidatePlayRequest(el);
        try { el.dataset.__coordinatorUnloadUntil = String(Date.now() + 2500); } catch {}
        try {
          const farOutOfView = unloadReason === 'out_of_view' && !isNearViewportElement(el, isIOSUi ? 2200 : (isCoarseUi ? 1500 : 1200));
          const forceHard =
            unloadReason === 'cleanup' ||
            unloadReason === 'resident_cap' ||
            unloadReason === 'error_blocked' ||
            (farOutOfView && (isIOSUi || isCoarseUi));
          if (forceHard) el.dataset.__forceHardUnload = '1';
          else delete el.dataset.__forceHardUnload;
        } catch {}
        try { __dropActiveVideoEl(el); } catch {}
        if (el instanceof HTMLVideoElement) {
          withSystemPause(el, () => {
            try { __unloadVideoEl(el); } catch {}
          });
        } else {
          withSystemPause(el, () => {
            try { if (!el.paused) el.pause(); } catch {}
          });
          try { el.dataset.__active = '0'; } catch {}
        }
        return;
      }
      const kind = el.getAttribute('data-forum-media');
      const hardIframeReason =
        (unloadReason === 'cleanup' && !(el instanceof Element && el.isConnected)) ||
        unloadReason === 'resident_cap' ||
        unloadReason === 'error_blocked';
      const softIframeCooldown = !hardIframeReason;
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
        if (softIframeCooldown) {
          try { el.removeAttribute('data-forum-iframe-active'); } catch {}
          emitMediaDiag('iframe_soft_cooldown', { kind, reason: unloadReason, ...getIframeSnapshot() });
          return;
        }
        try {
          try { player?.destroy?.(); } catch {}
          try { ytPlayers.delete(el); } catch {}
          try { ytMuteLast.delete(player); } catch {}
        } catch {}
        try {
          const ds = el.getAttribute('data-src') || el.getAttribute('src') || '';
          if (ds && !el.getAttribute('data-src')) {
            try { el.setAttribute('data-src', ds); } catch {}
          }
          try { el.removeAttribute('data-forum-iframe-active'); } catch {}
          try { el.removeAttribute('data-forum-last-active-ts'); } catch {}
          if (el.getAttribute('src')) { try { el.setAttribute('src', ''); } catch {} }
        } catch {}
        emitMediaDiag('iframe_hard_unload', { kind, reason: unloadReason, ...getIframeSnapshot() });
        return;
      } 
      if (kind === 'tiktok' || kind === 'iframe') { 
        try { el.contentWindow?.postMessage?.({ method: 'pause' }, '*'); } catch {}
        try { el.contentWindow?.postMessage?.({ event: 'command', func: 'pauseVideo', args: '' }, '*'); } catch {}
        if (softIframeCooldown) {
          try { el.removeAttribute('data-forum-iframe-active'); } catch {}
          emitMediaDiag('iframe_soft_cooldown', { kind, reason: unloadReason, ...getIframeSnapshot() });
          return;
        }
        const src = el.getAttribute('data-src') || el.getAttribute('src') || '';
        if (src && !el.getAttribute('data-src')) { try { el.setAttribute('data-src', src); } catch {} }
        try { el.removeAttribute('data-forum-iframe-active'); } catch {}
        try { el.removeAttribute('data-forum-last-active-ts'); } catch {}
        if (el.getAttribute('src')) { try { el.setAttribute('src', ''); } catch {} }
        emitMediaDiag('iframe_hard_unload', { kind, reason: unloadReason, ...getIframeSnapshot() });
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
      if (
        ms == null &&
        reason !== 'cleanup' &&
        reason !== 'resident_cap' &&
        isSettling(el)
      ) {
        const deferredMs = isIOSUi ? 1800 : (isCoarseUi ? 1500 : 1200);
        trace('hard_unload_deferred_settling', el, { reason, deferredMs });
        ms = deferredMs;
      }
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
    const ensureYouTubeEmbedSrc = (src) => {
      try {
        const next = String(src || '').trim();
        if (!next) return '';
        const u = new URL(next, window.location.href);
        const host = String(u.hostname || '').toLowerCase();
        if (!host.includes('youtube.com') && !host.includes('youtube-nocookie.com') && !host.includes('youtu.be')) return next;
        if ((host.includes('youtube.com') || host.includes('youtu.be')) && !host.includes('youtube-nocookie.com')) {
          u.hostname = 'www.youtube-nocookie.com';
        }
        if (!u.searchParams.has('enablejsapi')) u.searchParams.set('enablejsapi', '1');
        if (!u.searchParams.has('playsinline')) u.searchParams.set('playsinline', '1');
        if (!u.searchParams.has('rel')) u.searchParams.set('rel', '0');
        if (!u.searchParams.has('modestbranding')) u.searchParams.set('modestbranding', '1');
        if (!u.searchParams.has('origin')) u.searchParams.set('origin', window.location.origin);
        return u.toString();
      } catch {
        return String(src || '');
      }
    };
    const prepareExternalMedia = (el, reason = 'prewarm') => {
      if (!(el instanceof HTMLIFrameElement)) return false;
      const kind = String(el.getAttribute('data-forum-media') || '');
      if (kind !== 'youtube' && kind !== 'tiktok' && kind !== 'iframe') return false;
      const now = Date.now();
      const lastPrewarmTs = Number(el.getAttribute('data-forum-prewarm-ts') || 0);
      if (lastPrewarmTs > 0 && (now - lastPrewarmTs) < 700) {
        return !!String(el.getAttribute('src') || '').trim();
      }
      const raw = String(el.getAttribute('data-src') || el.getAttribute('src') || '').trim();
      if (!raw) return false;
      const nextSrc =
        kind === 'youtube'
          ? ensureYouTubeEmbedSrc(raw)
          : ensureIframeLoopParam(raw);
      if (!nextSrc) return false;
      try {
        if (el.getAttribute('data-src') !== nextSrc) el.setAttribute('data-src', nextSrc);
      } catch {}
      let hadSrc = false;
      try {
        hadSrc = !!String(el.getAttribute('src') || '').trim();
      } catch {}
      if (!hadSrc) {
        try { el.setAttribute('src', nextSrc); } catch {}
      }
      try { el.setAttribute('data-forum-last-active-ts', String(now)); } catch {}
      try { el.setAttribute('data-forum-prewarm-ts', String(now)); } catch {}
      try { enforceIframeResidentCap(el); } catch {}
      trace('iframe_prewarm', el, { kind, reason, hadSrc });
      emitMediaDiag('iframe_prewarm', { kind, reason, hadSrc, ...getIframeSnapshot() });
      return !!String(el.getAttribute('src') || '').trim();
    };
    const isSplashGateActive = () => {
      try {
        if (window.__forumBootSplashActive === '1') return true;
      } catch {}
      try {
        return !!document.querySelector('.forum-boot-splash, [data-runtime-owner="forum-boot-splash"]');
      } catch {
        return false;
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
      const manualLease = hasManualLease(el);
      const hasGesture = hasUserGestureIntent(el);
      const visiblePxNow = getOwnerVisiblePx(el);
      const minVisiblePx = getAutoplayMinVisiblePx(el);
      const centerDistNow = getOwnerCenterDist(el);
      const maxCenterDist = getPriorityCenterMaxDist(el);
      const strictManualLease = manualLease && !hasGesture;
      const leaseVisibleFloor = isCoarseUi ? 160 : 120;
      const minVisibleWithLease = strictManualLease
        ? Math.max(leaseVisibleFloor, Math.round(minVisiblePx * 0.9))
        : (manualLease ? Math.max(48, Math.round(minVisiblePx * 0.55)) : minVisiblePx);
      const maxCenterWithLease = strictManualLease
        ? Math.max(180, Math.round(maxCenterDist * 0.82))
        : (manualLease ? (maxCenterDist + Math.max(80, Math.round(maxCenterDist * 0.25))) : maxCenterDist);
      if (!hasGesture && (visiblePxNow < minVisibleWithLease || centerDistNow > maxCenterWithLease)) {
        trace('play_skip_not_visible', el, {
          visiblePx: visiblePxNow,
          minVisiblePx: minVisibleWithLease,
          centerDist: centerDistNow,
          maxCenterDist: maxCenterWithLease,
          manualLease,
        });
        return;
      }
      if (isSplashGateActive()) {
        trace('play_skip_splash_gate', el, {
          source: 'forum-boot-splash',
        });
        return;
      }
      markSettling(el, null, 'play_request');
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
  const isPostVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post';
  let restoredNow = false;

  if (!hasSrc) {
    trace('play_restore', el);
    __restoreVideoEl(el);
    restoredNow = true;
  }

  try { el.dataset.__prewarm = '1'; } catch {}
  try { el.dataset.__resident = '1'; } catch {}
  try {
    if (String(el.dataset?.__active || '') !== '1') {
      el.dataset.__active = '0';
    }
  } catch {}
  try { el.preload = 'auto'; } catch {}

  try {
    const empty = (el.networkState === HTMLMediaElement.NETWORK_EMPTY) || !el.currentSrc;
    const userIntentKick = hasUserGestureIntent(el) || hasManualLease(el);

    const shouldKickAfterRestore =
      restoredNow &&
      isPostVideo &&
      empty &&
      el.dataset?.__loadPending !== '1' &&
      el.paused &&
      (el.currentTime === 0);

    const shouldKickCold =
      !restoredNow &&
      empty &&
      el.dataset?.__loadPending !== '1' &&
      el.paused &&
      (el.currentTime === 0);

    if (shouldKickAfterRestore || shouldKickCold) {
      trace(shouldKickAfterRestore ? 'play_restore_load' : 'play_load', el);

      if (!kickMediaLoad(el, {
        channel: shouldKickAfterRestore ? 'play_restore' : 'play_cold',
        minGapMs: isIOSUi ? 1700 : (isCoarseUi ? 1500 : 1300),
        burstWindowMs: isIOSUi ? 22000 : 15000,
        burstLimit: isIOSUi ? 3 : 4,
        blockMs: isIOSUi ? 12000 : 9000,
        bypassSrcLimiter: userIntentKick,
        bypassPendingBudget: userIntentKick,
      })) return;
    } 
  } catch {}
}

  applyMutedPref(el);
  el.playsInline = true;
  el.loop = true;

  if ((el.readyState || 0) < 2) {
    ensurePendingHtmlMediaReady(el, 'play_wait_ready');
    trace('play_wait_ready', el);
    armReadyReplay(el);

    const canMutedAutoplayKick =
      el instanceof HTMLVideoElement &&
      !!el.muted &&
      !isUserPaused(el) &&
      !hasSuppressedPlayback(el);

    if (canMutedAutoplayKick && el.paused) {
      trace('play_pending_muted', el);
      startHtmlMedia(el, 'play_pending_muted');
    }
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
            const keepManualQcastSound =
              !a.muted &&
              (
                hasManualLease(el) ||
                hasManualLease(a) ||
                hasUserGestureIntent(el) ||
                hasUserGestureIntent(a)
              );
            const userUnmuteHoldUntil = Math.max(
              Number(a?.dataset?.__userUnmuteHoldUntil || 0),
              Number(el?.dataset?.__userUnmuteHoldUntil || 0),
              Number(window?.__forumQcastUnmuteHoldUntil || 0),
            );
            const keepUserUnmutedQcast = userUnmuteHoldUntil > Date.now();
            if (keepUserUnmutedQcast) {
              try {
                a.dataset.__userUnmuteHoldUntil = String(userUnmuteHoldUntil);
                if (el?.dataset) el.dataset.__userUnmuteHoldUntil = String(userUnmuteHoldUntil);
              } catch {}
            }
            const persistedQcastMuted = readQcastMutedPref();
            const nextQcastMuted =
              typeof persistedQcastMuted === 'boolean'
                ? persistedQcastMuted
                : desiredMuted();
            if (!keepManualQcastSound && !keepUserUnmutedQcast) {
              try {
                a.muted = !!nextQcastMuted;
                a.defaultMuted = !!nextQcastMuted;
                if (nextQcastMuted) a.setAttribute?.('muted', '');
                else a.removeAttribute?.('muted');
              } catch {}
            } else {
              try {
                a.muted = false;
                a.defaultMuted = false;
                a.removeAttribute?.('muted');
              } catch {}
            }
            try { writeQcastMutedPref(!!a.muted); } catch {}
            // LOOP: qcast-аудио тоже зацикливаем
            a.loop = true;
            try { a.preload = 'auto'; } catch {}
            if ((a.readyState || 0) < 2) {
              try {
                const empty = (a.networkState === HTMLMediaElement.NETWORK_EMPTY) || !a.currentSrc;
                const userIntentKick = hasUserGestureIntent(a) || hasManualLease(el) || hasManualLease(a);
                if (empty && a.paused && canKickLoad(a, {
                  channel: 'qcast_cold',
                  minGapMs: isIOSUi ? 1800 : 1500,
                  burstWindowMs: isIOSUi ? 20000 : 15000,
                  burstLimit: isIOSUi ? 3 : 4,
                  blockMs: isIOSUi ? 12000 : 9000,
                  bypassSrcLimiter: userIntentKick || isIOSUi,
                  // QCast is single-audio focus content: keep it responsive on mobile
                  // even when video prewarm budget is occupied.
                  bypassPendingBudget: true,
                })) a.load?.();
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
          const raw = String(el.getAttribute('data-src') || el.getAttribute('src') || '');
          const ds = ensureYouTubeEmbedSrc(raw);
          const cur = String(el.getAttribute('src') || '');
          if (ds && el.getAttribute('data-src') !== ds) {
            try { el.setAttribute('data-src', ds); } catch {}
          }
          if (ds && (!cur || cur !== ds)) el.setAttribute('src', ds);
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

    const ACTIVE_SWITCH_HOLD_MS = isIOSUi ? 900 : (isCoarseUi ? 760 : 620);
    const SWITCH_RATIO_DELTA = 0.16;
    const SWITCH_SCORE_DELTA = 240;
    const PENDING_READY_GRACE_MS = isIOSUi ? 980 : (isCoarseUi ? 620 : 420);
    const PENDING_READY_GRACE_RATIO = 0.12;
    const getMediaKind = (el) => String(el?.getAttribute?.('data-forum-media') || '');
    const getStartRatio = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return isIOSUi ? 0.08 : (isCoarseUi ? 0.14 : 0.18);
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return isIOSUi ? 0.12 : (isCoarseUi ? 0.22 : 0.3);
      return isIOSUi ? 0.11 : (isCoarseUi ? 0.24 : 0.35);
    };
    const getStartVisiblePx = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return isIOSUi ? 64 : (isCoarseUi ? 110 : 80);
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return isIOSUi ? 96 : (isCoarseUi ? 180 : 140);
      return isIOSUi ? 72 : (isCoarseUi ? 150 : 120);
    };
    const getStopCenterMaxDist = (el) => {
      const startDist = getPriorityCenterMaxDist(el);
      return Math.max(startDist + (isIOSUi ? 110 : 80), Math.round(startDist * 1.28));
    };
    const isStartableCandidate = (el, ratio, visiblePx, centerDist) => {
      if (!(el instanceof Element)) return false;
      const needRatio = getStartRatio(el);
      const needVisiblePx = getStartVisiblePx(el);
      const maxCenterDist = getPriorityCenterMaxDist(el);
      return (
        Number(ratio || 0) >= needRatio &&
        Number(visiblePx || 0) >= needVisiblePx &&
        Number(centerDist || Number.POSITIVE_INFINITY) <= maxCenterDist
      );
    };
    const getStopRatio = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return isIOSUi ? 0.01 : (isCoarseUi ? 0.02 : 0.03);
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return isIOSUi ? 0.06 : (isCoarseUi ? 0.08 : 0.12);
      return isIOSUi ? 0.1 : (isCoarseUi ? 0.14 : 0.22);
    };
    const getSwitchHoldMs = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return isCoarseUi ? 2600 : 2200;
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return isCoarseUi ? 1700 : 1300;
      return ACTIVE_SWITCH_HOLD_MS;
    };
    const getSwitchRatioDelta = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return 0.28;
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return 0.24;
      return SWITCH_RATIO_DELTA;
    };
    const getSwitchScoreDelta = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'qcast') return 380;
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') return 260;
      return SWITCH_SCORE_DELTA;
    };

    const isReadyCandidate = (el) => {
      const kind = getMediaKind(el);
      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') {
        const frame = el instanceof HTMLIFrameElement ? el : null;
        if (!frame) return true;
        const hasSrc = !!String(frame.getAttribute('src') || '').trim();
        if (!hasSrc) return false;
        const prewarmTs = Number(frame.getAttribute('data-forum-prewarm-ts') || 0);
        if (prewarmTs > 0 && (Date.now() - prewarmTs) < (isCoarseUi ? 300 : 220)) return false;
        return true;
      }
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
          const PREWARM_RATIO = Math.max(0.04, START_RATIO * (isIOSUi ? 0.34 : 0.38));

          if (candidate && ratio >= PREWARM_RATIO && !isReadyCandidate(candidate)) {
            const candidateKind = getMediaKind(candidate);
            const isExternalCandidate =
              candidateKind === 'youtube' || candidateKind === 'tiktok' || candidateKind === 'iframe';
            const externalCanPrepare =
              !isExternalCandidate ||
              (
                visiblePx >= getStartVisiblePx(candidate) &&
                centerDist <= getPriorityCenterMaxDist(candidate)
              );
            const prepared = externalCanPrepare
              ? (
                  isExternalCandidate
                    ? prepareExternalMedia(candidate, 'early_prewarm')
                    : ensurePendingHtmlMediaReady(candidate, 'early_prewarm')
                )
              : false;
            traceCandidate('candidate_early_prewarm', candidate, {
              ratio,
              score,
              visiblePx,
              centerDist,
              threshold: PREWARM_RATIO,
              prepared,
              externalCanPrepare,
            });
          }

          // Если есть активный элемент — держим его, пока он не "выпал" ниже STOP_RATIO.
          // Это убирает "стоп/плей" при лёгком смещении вверх/вниз.
          if (active) {
            const ar = ratios.get(active) || 0;
            const activeMetrics = getCandidateMetrics(active, ar);
            const activeScore = Number(activeMetrics?.score ?? -Infinity);
            const STOP_RATIO = getStopRatio(active);
            const activeVisiblePx = Number(activeMetrics?.visiblePx || 0);
            const activeCenterDist = Number(activeMetrics?.centerDist ?? Number.POSITIVE_INFINITY);
            const stopCenterMaxDist = getStopCenterMaxDist(active);
            const activeKind = getMediaKind(active);
            const manualLeaseActive = hasManualLease(active);
            const hardOutOfView = activeVisiblePx < 24;
            const keepByVisiblePx =
              (activeKind === 'qcast' && activeVisiblePx >= 120) ||
              ((activeKind === 'youtube' || activeKind === 'tiktok' || activeKind === 'iframe') && activeVisiblePx >= 220);
            if (
              !hardOutOfView &&
              activeCenterDist <= stopCenterMaxDist &&
              (ar >= STOP_RATIO || keepByVisiblePx || (manualLeaseActive && activeVisiblePx >= 120))
            ) {
              // Если кандидат другой — переключаемся только когда он уверенно лучше.
              // (иначе будет флаттер между двумя элементами рядом)
              const switchHoldMs = Math.max(getSwitchHoldMs(active), getSwitchHoldMs(candidate));
              const switchRatioDelta = Math.max(getSwitchRatioDelta(active), getSwitchRatioDelta(candidate));
              const switchScoreDelta = Math.max(getSwitchScoreDelta(active), getSwitchScoreDelta(candidate));
              if (
                candidate &&
                candidate !== active &&
                isStartableCandidate(candidate, ratio, visiblePx, centerDist) &&
                (ratio > ar + switchRatioDelta || score > activeScore + switchScoreDelta)
              ) {
                const now = Date.now();
                if (!isReadyCandidate(candidate) && ar >= STOP_RATIO) {
                  const candidateKind = getMediaKind(candidate);
                  const prepared =
                    candidateKind === 'youtube' || candidateKind === 'tiktok' || candidateKind === 'iframe'
                      ? prepareExternalMedia(candidate, 'reject_not_ready')
                      : ensurePendingHtmlMediaReady(candidate, 'reject_not_ready');
                  traceCandidate('candidate_reject_not_ready', candidate, {
                    ratio,
                    score,
                    visiblePx,
                    centerDist,
                    activeRatio: ar,
                    activeScore,
                    reason: prepared ? 'not_ready_prewarm' : 'not_ready',
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
            if (
              candidate &&
              isStartableCandidate(candidate, ratio, visiblePx, centerDist) &&
              !isReadyCandidate(candidate) &&
              ar >= PENDING_READY_GRACE_RATIO
            ) {
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

          const relaxedStartForIOS = (() => {
            if (!isIOSUi) return false;
            if (!(candidate instanceof Element)) return false;
            const ratioGate = Math.max(0.08, Number(getStartRatio(candidate) || 0) * 0.82);
            const pxGate = Math.max(58, Math.round(Number(getStartVisiblePx(candidate) || 0) * 0.78));
            const centerGate = Math.max(140, Number(getPriorityCenterMaxDist(candidate) || 0) + 40);
            return (
              Number(ratio || 0) >= ratioGate &&
              Number(visiblePx || 0) >= pxGate &&
              Number(centerDist || Number.POSITIVE_INFINITY) <= centerGate
            );
          })();
          // Нет активного — берём кандидата, только если он попал в расширенную зону.
          // На iPhone добавляем мягкий relaxed-start, чтобы не требовался ручной старт при уже прогретом кадре.
          if (!candidate || (!isStartableCandidate(candidate, ratio, visiblePx, centerDist) && !relaxedStartForIOS)) {
            if (candidate) {
              pendingReadyGrace.delete(candidate);
              traceCandidate('candidate_below_start', candidate, {
                ratio,
                score,
                visiblePx,
                centerDist,
                reason: relaxedStartForIOS ? 'ios_relaxed_gate_hold' : 'below_start_gate',
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
            const candidateKind = getMediaKind(candidate);
            const isExternalCandidate =
              candidateKind === 'youtube' || candidateKind === 'tiktok' || candidateKind === 'iframe';
            const isNativeVideoCandidate =
              candidate instanceof HTMLVideoElement ||
              candidateKind === 'video';

            const prepared =
              isExternalCandidate
                ? prepareExternalMedia(candidate, 'activate_pending')
                : ensurePendingHtmlMediaReady(candidate, 'activate_pending');

            if (isNativeVideoCandidate) {
              // Critical mobile autoplay fix:
              // Do NOT wait for loadeddata/canplay before calling play().
              // iOS/Safari often will not fetch the first frame from load() alone.
              // The active muted native video must receive a play() kick immediately.
              traceCandidate('candidate_activate_native_pending_play', candidate, {
                ratio,
                score,
                visiblePx,
                centerDist,
                prepared,
                reason: 'native_pending_play_kick',
              });
              active = candidate;
              activeSinceTs = Date.now();
              cancelUnload(active);
              emitMediaDiag('media_focus_switch', { ratio, prevRatio: 0, score });
              playMedia(active);
              return;
            }

            if (prepared && isExternalCandidate) {
              traceCandidate('candidate_prepare_before_activate', candidate, {
                ratio,
                score,
                visiblePx,
                centerDist,
                reason: 'prepared_wait_next_tick',
              });
            }
            traceCandidate('candidate_activate_pending', candidate, {
              ratio,
              score,
              visiblePx,
              centerDist,
              reason: 'pending_ready_hold',
            });
            return;
          }
          traceCandidate('candidate_activate', candidate, {
            ratio,
            score,
            visiblePx,
            centerDist,
            reason: 'ready',
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

    const prewarmAhead = (el, reason = 'near_viewport') => {
      if (!(el instanceof Element)) return false;
      if (isUserPaused(el) || hasSuppressedPlayback(el)) return false;
      const kind = getMediaKind(el);

      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') {
        // Heavy iframe providers are activated only inside the focus/start zone.
        // Near prewarm must not create far YouTube/TikTok frames and compete
        // with the current native video on mobile browsers.
        const visiblePx = getOwnerVisiblePx(el);
        const centerDist = getOwnerCenterDist(el);
        if (visiblePx < getStartVisiblePx(el) || centerDist > getPriorityCenterMaxDist(el)) {
          return false;
        }
        return prepareExternalMedia(el, reason);
      }

      return ensurePendingHtmlMediaReady(el, reason);
    }; 

    nearIo = new IntersectionObserver(
      (entries) => {
        const intersecting = (entries || [])
          .filter((entry) => !!entry?.isIntersecting && entry?.target instanceof Element)
          .map((entry) => {
            const metrics = getCandidateMetrics(entry.target, Number(entry.intersectionRatio || 0));
            return {
              entry,
              metrics,
              centerDist: Number(metrics?.centerDist ?? Number.POSITIVE_INFINITY),
              visiblePx: Number(metrics?.visiblePx || 0),
            };
          })
          .sort((a, b) => {
            if (a.centerDist !== b.centerDist) return a.centerDist - b.centerDist;
            return b.visiblePx - a.visiblePx;
          });
        if (!intersecting.length) return;

        const maxBatch = isIOSUi ? 1 : (isCoarseUi ? 1 : 2);
        let preparedCount = 0;
        for (const item of intersecting) {
          if (preparedCount >= maxBatch) break;
          const el = item.entry.target;
          const pendingLoads = readPendingLoads();
          if (
            pendingLoads >= Math.max(1, Number(MAX_CONCURRENT_LOAD_PENDING || 0)) &&
            item.centerDist > Math.max(getPriorityCenterMaxDist(el) * 1.2, 220)
          ) {
            continue;
          }
          const prepared = prewarmAhead(el, 'io_near_prewarm');
          if (!prepared) continue;
          preparedCount += 1;
          try {
            traceCandidate('candidate_near_prewarm', el, {
              ratio: Number(item.entry.intersectionRatio || 0),
              centerDist: item.centerDist,
              visiblePx: item.visiblePx,
              reason: 'io_near_prewarm',
              queueIndex: preparedCount,
            });
          } catch {}
        }
      },
      {
        threshold: 0.001,
        rootMargin: `${
          Math.max(isIOSUi ? 520 : (isCoarseUi ? 420 : 420), Math.round(__MEDIA_VIS_MARGIN_PX * (isIOSUi ? 1.45 : 1.25)))
        }px 0px ${
          Math.max(isIOSUi ? 860 : (isCoarseUi ? 720 : 920), Math.round(__MEDIA_VIS_MARGIN_PX * (isIOSUi ? 2.15 : 1.85)))
        }px 0px`,
      },
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
        nearIo?.observe?.(el);
      } catch {}
    };

    const observeAll = () => {
      try { document.querySelectorAll(selector).forEach(observeOne); } catch {}
      sweepDetachedMediaState('observe_all', true);
    };
    const promoteExternalActive = (el, reason = 'external_play', { manual = false } = {}) => {
      try {
        const candidate = el instanceof Element
          ? (el.matches?.(selector) ? el : el.closest?.(selector))
          : null;
        if (!(candidate instanceof Element)) return;
        const manualLease = hasManualLease(candidate);
        const visiblePxNow = getOwnerVisiblePx(candidate);
        const minVisiblePx = getStartVisiblePx(candidate);
        const centerDistNow = getOwnerCenterDist(candidate);
        const maxCenterDist = getPriorityCenterMaxDist(candidate);
        if (!manual && !manualLease && (visiblePxNow < minVisiblePx || centerDistNow > maxCenterDist)) {
          traceCandidate('candidate_external_ignored', candidate, {
            reason,
            visiblePx: visiblePxNow,
            minVisiblePx,
            centerDist: centerDistNow,
            maxCenterDist,
          });
          return;
        }
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
 
  const isAdSource =
    source === 'ad' ||
    source === 'forum_ads' ||
    source === 'forum-ads' ||
    source === 'forum-ads-toggle' ||
    source.startsWith('ad_');

  if (isAdSource) return;

  if (!['qcast', 'youtube', 'tiktok', 'iframe'].includes(source)) return;

  const candidate = e?.detail?.element || null;
  const manual = !!e?.detail?.manual;

  if ((isUserPaused(candidate) || hasSuppressedPlayback(candidate)) && !manual && !hasManualLease(candidate)) {
    traceCandidate('candidate_external_ignored', candidate, { reason: source });
    return;
  }

  if (!manual && active && candidate && active !== candidate) {
    traceCandidate('candidate_external_hold_active', candidate, {
      reason: source,
    });
    return;
  }

  promoteExternalActive(candidate, `${source}_external_play`, { manual });
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
  trace('visibility_restore', mediaEl, { reason, mode: 'kick_stalled' });

  if (!kickMediaLoad(mediaEl, {
    channel: 'visibility_recover',
    minGapMs: isIOSUi ? 2100 : (isCoarseUi ? 1800 : 1500),
    burstWindowMs: isIOSUi ? 24000 : 18000,
    burstLimit: isIOSUi ? 2 : 3,
    blockMs: isIOSUi ? 15000 : 11000,
    bypassSrcLimiter: false,
    bypassPendingBudget: false,
  })) return;
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
    let mutationSweepRaf = 0;
    let mutationSweepPending = false;
    const scheduleMutationSweep = () => {
      if (mutationSweepRaf) return;
      try {
        mutationSweepRaf = requestAnimationFrame(() => {
          mutationSweepRaf = 0;
          if (!mutationSweepPending) return;
          mutationSweepPending = false;
          sweepDetachedMediaState('mutation_batch', false);
        });
      } catch {
        try {
          mutationSweepRaf = setTimeout(() => {
            mutationSweepRaf = 0;
            if (!mutationSweepPending) return;
            mutationSweepPending = false;
            sweepDetachedMediaState('mutation_batch', false);
          }, 48);
        } catch {}
      }
    };
    let mo = null;
    try {
      mo = new MutationObserver((mutations) => {
        let touchedMedia = false;
        for (const m of mutations) {
          for (const n of (m.addedNodes || [])) {
            if (!(n instanceof Element)) continue;
            if (n.matches?.(selector)) {
              observeOne(n);
              touchedMedia = true;
            }
            try {
              const nested = n.querySelector?.(selector);
              if (nested) {
                touchedMedia = true;
                n.querySelectorAll?.(selector)?.forEach?.(observeOne);
              }
            } catch {}
          }
          for (const n of (m.removedNodes || [])) {
            if (!(n instanceof Element)) continue;
            let hasMedia = false;
            try {
              hasMedia = !!(n.matches?.(selector) || n.querySelector?.(selector));
            } catch {}
            if (!hasMedia) continue;
            touchedMedia = true;
            cleanupObservedMediaNode(n, 'mutation_removed');
          }
        }
        if (!touchedMedia) return;
        mutationSweepPending = true;
        scheduleMutationSweep();
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
      if (mutationSweepRaf) {
        try {
          if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(mutationSweepRaf);
        } catch {}
        try { clearTimeout(mutationSweepRaf); } catch {}
        mutationSweepRaf = 0;
      }
      mutationSweepPending = false;
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
      nearIo?.disconnect?.();
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
      try {
        if (window.__forumMediaCoordinatorActive === '1') delete window.__forumMediaCoordinatorActive;
      } catch {}
      emitMediaDiag('media_coordinator_cleanup', {
        ...getIframeSnapshot(),
      }, true);
    }; 
  }, [emitDiag]);
}

