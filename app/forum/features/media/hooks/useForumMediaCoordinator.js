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
  // === Глобальный контроллер HTML5-медиа в постах ===
  // В любой момент времени играет только один <video>/<audio> controls.
  // Видео без controls (обложки, рекламные петельки и т.п.) не трогаем.
  useEffect(() => { 
    if (!isBrowser()) return;
    const pauseOtherIframes = (activeEl) => {
      try {
        document.querySelectorAll('iframe[data-forum-media]').forEach((frame) => {
          if (!(frame instanceof HTMLIFrameElement)) return;
          if (frame === activeEl) return;
          const kind = frame.getAttribute('data-forum-media');
          if (kind === 'youtube') {
            if (window.__forumYtPlayers && window.__forumYtPlayers instanceof Map) {
              const player = window.__forumYtPlayers.get(frame);
              try { player?.pauseVideo?.(); } catch {}
            }
            return;
          }
          // IMPORTANT: no hard src reset here.
          // Resetting iframe src on every media focus causes reload thrash,
          // visible flashes and high memory churn on mobile.
          try {
            frame.contentWindow?.postMessage?.({ method: 'pause' }, '*');
          } catch {}
          try {
            frame.contentWindow?.postMessage?.({ event: 'command', func: 'pauseVideo', args: '' }, '*');
          } catch {}
        });
      } catch {}
    };

    const onSiteMediaPlay = (e) => {
      if (e?.detail?.source === 'bg-audio') return;
      const activeEl = e?.detail?.element || null;
      const source = e?.detail?.source || '';
      if (!['youtube', 'tiktok', 'iframe', 'qcast'].includes(source)) return;
      const containsActive = (node) => {
        try {
          if (!activeEl || !(activeEl instanceof Element)) return false;
          return !!activeEl.contains?.(node);
        } catch {
          return false;
        }
      };
      try {
        document.querySelectorAll('video').forEach((v) => {
          if (v === activeEl) return;
          if (containsActive(v)) return;
          if (!(v instanceof HTMLVideoElement)) return;
          if (!v.controls) return;
          v.pause();
        });
        document.querySelectorAll('audio').forEach((a) => {
          if (a === activeEl) return;
          if (containsActive(a)) return;
          if (!(a instanceof HTMLAudioElement)) return;
          a.pause();
        });
        pauseOtherIframes(activeEl);
      } catch {}
    };
    const handlePlay = (e) => {
      const target = e.target;
      const isVideo = target instanceof HTMLVideoElement;
      const isAudio = target instanceof HTMLAudioElement;
      if (!isVideo && !isAudio) return;
      if (isVideo && !target.controls) return;


      try {
        document.querySelectorAll('video').forEach((v) => {
          if (v === target) return;
          if (!(v instanceof HTMLVideoElement)) return;
          if (!v.controls) return;
          v.pause();
        });
        document.querySelectorAll('audio').forEach((a) => {
          if (a === target) return;
          if (!(a instanceof HTMLAudioElement)) return;
          a.pause();
        });
        if (window.__forumYtPlayers && window.__forumYtPlayers instanceof Map) {
          window.__forumYtPlayers.forEach((player) => {
            try { player?.pauseVideo?.(); } catch {}
          });
        }   
        pauseOtherIframes(target);
        window.dispatchEvent(new CustomEvent('site-media-play', {
          detail: { source: 'html5', element: target }
        }));             
      } catch {
        // чтобы в случае чего не уронить UI
      }
    };

    // ловим play на CAPTURE-фазе, чтобы сработать раньше всяких слушателей глубже
    document.addEventListener('play', handlePlay, true);
    window.addEventListener('site-media-play', onSiteMediaPlay);    
    return () => {
      document.removeEventListener('play', handlePlay, true);
      window.removeEventListener('site-media-play', onSiteMediaPlay);      
    };
  },[])
  // === Ленивая подгрузка превью видео в постах ===
  useEffect(() => { 
    if (!isBrowser()) return;

    const selector = 'video[data-forum-video="post"]';

    const pending = new Map();
    let warmSweepRaf = 0;
    let warmSweepTimeout = 0;
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

    const warmMarginTop = Math.max(420, Math.round(__MEDIA_VIS_MARGIN_PX * 1.6));
    const warmMarginBottom = Math.max(760, Math.round(__MEDIA_VIS_MARGIN_PX * 2.35));
    const poolMargin = Math.max(warmMarginTop, warmMarginBottom);
    const isCoarseWarm = (() => {
      try {
        return !!window?.matchMedia?.('(pointer: coarse)')?.matches;
      } catch {
        return false;
      }
    })();
    const warmResidentCap = isCoarseWarm ? 2 : 3;
    const eagerWarmCount = 1;
    const warmLeaseMs = isCoarseWarm ? 1300 : 900;
    const residentLeaseMs = isCoarseWarm ? 950 : 650;
    const farUnloadMargin = Math.max(Math.round(poolMargin * 1.85), 1400);

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

    const scheduleWarmSweep = () => {
      if (warmSweepRaf || warmSweepTimeout) return;
      const runner = () => {
        warmSweepRaf = 0;
        warmSweepTimeout = 0;
        const now = Date.now();
        const top = readWarmSweepScrollTop();
        const topDelta = Math.abs(top - lastWarmSweepTop);
        if ((now - lastWarmSweepTs) < 120 && topDelta < 180) return;
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
    const onWarmSweepScroll = () => scheduleWarmSweep();
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

    const writeMutedPref = (val) => {
      try {
        const next = val ? '1' : '0';
        localStorage.setItem(MEDIA_MUTED_KEY, next);
        localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, next);
      } catch {}
    };
    let mutedPref = readMutedPrefFromStorage();

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
    const clearReadyReplay = (el) => {
      const cleanup = readyReplay.get(el);
      if (cleanup) {
        try { cleanup(); } catch {}
      }
      readyReplay.delete(el);
    };
    const armReadyReplay = (el) => {
      if (!(el instanceof HTMLVideoElement || el instanceof HTMLAudioElement)) return;
      clearReadyReplay(el);
      const replay = () => {
        clearReadyReplay(el);
        trace('ready_replay', el);
        try {
          applyMutedPref(el);
          el.playsInline = true;
          if (el instanceof HTMLVideoElement) {
            try { el.loop = true; } catch {}
          }
          if (el.paused) {
            const p = el.play?.();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }
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
    const volHandlers = new WeakMap();
    const bindVolumeListener = (el) => { 
      const isMedia =
        el instanceof HTMLVideoElement || el instanceof HTMLAudioElement;
      if (!isMedia) return;
      if (el.dataset.forumSoundBound === '1') return;
      el.dataset.forumSoundBound = '1';
      applyMutedPref(el);
      const h = () => {
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
    const stopYtMutePoll = (player) => {
      const id = ytMutePolls.get(player);
      if (id) clearInterval(id);
      ytMutePolls.delete(player);
    };
    const startYtMutePoll = (player) => {
      if (!player || ytMutePolls.has(player)) return;
      const id = setInterval(() => {
        try {
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
      if (ytPlayers.has(iframe)) return ytPlayers.get(iframe);
      const YT = await ensureYouTubeAPI();
      if (!YT?.Player) return null;
      return new Promise((resolve) => {
        try {
          const player = new YT.Player(iframe, {
            events: {
              onReady: () => { 
                try {
                  if (desiredMuted()) player?.mute?.();
                  else player?.unMute?.();
                } catch {}
                resolve(player);
              },
              onStateChange: (evt) => {
                try {
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
    const unloadTimers = new WeakMap(); // el -> timeoutId 
    const isCoarseUi = (() => {
      try {
        const uaMobile = /iP(hone|ad|od)|Android/i.test(String(navigator?.userAgent || ''));
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches;
        return uaMobile || coarse;
      } catch {
        return false;
      }
    })();
    const IFRAME_HARD_UNLOAD_MS = isCoarseUi ? 9000 : 3000;
    const IFRAME_RESIDENT_CAP = (() => {
      if (isCoarseUi) return 2;
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
    const getUnloadDelay = (el, reason = 'timeout') => {
      if (!isIframeLike(el)) {
        if (reason === 'cleanup') return 0;
        return 1200;
      }
      if (reason === 'cleanup' || reason === 'resident_cap') return 0;
      if (!isCoarseUi && (reason === 'focus_switch' || reason === 'below_stop_ratio' || reason === 'candidate_replace')) {
        return 12000;
      }
      if (isCoarseUi && (reason === 'focus_switch' || reason === 'below_stop_ratio' || reason === 'candidate_replace')) {
        return 9500;
      }
      if (!isCoarseUi && reason === 'out_of_view') return 6000;
      if (isCoarseUi && reason === 'out_of_view') return 9000;
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
        try { if (!el.paused) el.pause(); } catch {}
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
          clearReadyReplay(a);
          try { if (!a.paused) a.pause(); } catch {}
        }
        return;
      }
      if (kind === 'youtube') {
        const player = ytPlayers.get(el);
        try { player?.pauseVideo?.(); } catch {}
        try { stopYtMutePoll(player); } catch {}
        return;
      }
      // iframe/tiktok: softPause ничего не делает (иначе будет reload thrash)
    };

    const hardUnloadMedia = (el, reason = 'unknown') => {
      if (!el) return;
      clearReadyReplay(el);
      trace('hard_unload', el, { reason });
      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        try { __dropActiveVideoEl(el); } catch {}
        if (el instanceof HTMLVideoElement) {
          try { __unloadVideoEl(el); } catch {}
        } else {
          try { if (!el.paused) el.pause(); } catch {}
          try { el.dataset.__active = '0'; } catch {}
        }
        return;
      }
      const kind = el.getAttribute('data-forum-media');
      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) {
          clearReadyReplay(a);
          try { if (!a.paused) a.pause(); } catch {}
        }
        return;
      }
      if (kind === 'youtube') { 
        const player = ytPlayers.get(el);
        try { player?.pauseVideo?.(); } catch {}
        try { stopYtMutePoll(player); } catch {}

        // Destroy ТОЛЬКО при hardUnload (debounce), чтобы не дёргать при микроскролле
        try {
          const ds = el.getAttribute('data-src') || el.getAttribute('src') || '';
          const parent = el.parentNode;
          if (parent && el instanceof HTMLIFrameElement) {
            const clean = el.cloneNode(false);
            try { clean.setAttribute('src', ''); } catch {}
            if (ds && !clean.getAttribute('data-src')) {
              try { clean.setAttribute('data-src', ds); } catch {}
            }
            parent.replaceChild(clean, el);
            try { io?.unobserve?.(el); } catch {}
            try { io?.observe?.(clean); } catch {}
          }
        } catch {}

        try { player?.destroy?.(); } catch {}
        try { ytPlayers.delete(el); } catch {}
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

      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        try {
          if (el instanceof HTMLVideoElement) {
            const hasSrc = !!el.getAttribute('src');
            if (!hasSrc) {
              trace('play_restore', el);
              __restoreVideoEl(el);
            }
            try { el.dataset.__prewarm = '1'; } catch {}
            try { el.dataset.__active = '1'; } catch {}
            try { el.preload = 'auto'; } catch {}
            try {
              const empty = (el.networkState === HTMLMediaElement.NETWORK_EMPTY) || !el.currentSrc;
              if (empty && el.dataset?.__loadPending !== '1' && el.paused && (el.currentTime === 0)) {
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
            trace('play_wait_ready', el);
            armReadyReplay(el);
          } else if (el.paused) {
            trace('play_now', el);
            const p = el.play?.();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }
        } catch {}
        return;
      }

      const kind = el.getAttribute('data-forum-media');
      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) {
          try {
            applyMutedPref(a);
            // LOOP: qcast-аудио тоже зацикливаем
            a.loop = true;
            if ((a.readyState || 0) < 2) {
              try {
                const empty = (a.networkState === HTMLMediaElement.NETWORK_EMPTY) || !a.currentSrc;
                if (empty && a.paused) a.load?.();
              } catch {}
              armReadyReplay(a);
            } else if (a.paused) {
              const p = a.play?.();
              if (p && typeof p.catch === 'function') p.catch(() => {});
            }
            window.dispatchEvent(new CustomEvent('site-media-play', {
              detail: { source: 'qcast', element: el }
            }));
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
        try {
          if (desiredMuted()) player?.mute?.();
          else player?.unMute?.();
          player?.playVideo?.();
          enforceIframeResidentCap(el);
          emitMediaDiag('iframe_play', { kind: 'youtube', ...getIframeSnapshot() });
          window.dispatchEvent(new CustomEvent('site-media-play', {
            detail: { source: 'youtube', element: el }
          }));
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
      let best = null;
      let bestScore = -Infinity;
      let bestRatio = 0;
      let bestVisiblePx = 0;
      let bestCenterDist = 0;
      for (const [el, r] of ratios.entries()) {
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
          if (r > bestRatio) {
            bestRatio = r;
            best = el;
          }
        }
      }
      return { el: best, ratio: bestRatio, score: bestScore, visiblePx: bestVisiblePx, centerDist: bestCenterDist };
    };

    const ACTIVE_SWITCH_HOLD_MS = 420;
    const SWITCH_RATIO_DELTA = 0.12;
    const SWITCH_SCORE_DELTA = 180;

    const isReadyCandidate = (el) => {
      if (!(el instanceof HTMLVideoElement || el instanceof HTMLAudioElement)) return true;
      try {
        if ((el.readyState || 0) >= 2) return true;
        if (String(el.dataset?.__warmReady || '') === '1') return true;
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
          // Расширяем "зону удержания" автоплея примерно на 30–40%:
          //  - раньше было 0.5 (нужно было видеть ?50% элемента)
          //  - теперь стартуем при ~35% и выключаемся только при падении ниже ~22%
          // Это даёт широкий диапазон без дергания при микроскролле.
          const START_RATIO = 0.35; // было 0.5
          const STOP_RATIO  = 0.22; // гистерезис: не выключаемся сразу

          // Если есть активный элемент — держим его, пока он не "выпал" ниже STOP_RATIO.
          // Это убирает "стоп/плей" при лёгком смещении вверх/вниз.
          if (active) {
            const ar = ratios.get(active) || 0;
            const activeMetrics = getCandidateMetrics(active, ar);
            const activeScore = Number(activeMetrics?.score ?? -Infinity);
            if (ar >= STOP_RATIO) {
              // Если кандидат другой — переключаемся только когда он уверенно лучше.
              // (иначе будет флаттер между двумя элементами рядом)
              if (
                candidate &&
                candidate !== active &&
                ratio >= START_RATIO &&
                (ratio > ar + SWITCH_RATIO_DELTA || score > activeScore + SWITCH_SCORE_DELTA)
              ) {
                const now = Date.now();
                if (!isReadyCandidate(candidate) && ar >= STOP_RATIO) {
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
                if ((now - activeSinceTs) < ACTIVE_SWITCH_HOLD_MS && ar >= STOP_RATIO) {
                  traceCandidate('candidate_hold_active', candidate, {
                    ratio,
                    score,
                    visiblePx,
                    centerDist,
                    activeRatio: ar,
                    activeScore,
                    reason: 'switch_hold',
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
    };

    observeAll();

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
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch { mo = null; }
    window.addEventListener(MEDIA_MUTED_EVENT, onMutedEvent);
    return () => { 
      try { mo?.disconnect?.(); } catch {}
      window.removeEventListener(MEDIA_MUTED_EVENT, onMutedEvent);       
      try { if (rafId) cancelAnimationFrame(rafId); } catch {}
      io?.disconnect?.();

      try {
        unloadTimers.forEach?.((id) => clearTimeout(id));
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
      emitMediaDiag('media_coordinator_cleanup', {
        ...getIframeSnapshot(),
      }, true);
    }; 
  }, [emitDiag]);
}

