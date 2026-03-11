import { useEffect } from 'react'

import { isBrowser } from '../../../shared/utils/browser'
import {
  MEDIA_MUTED_KEY,
  MEDIA_VIDEO_MUTED_KEY,
  MEDIA_MUTED_EVENT,
  readMutedPrefFromStorage,
  __touchActiveVideoEl,
  __enforceActiveVideoCap,
  __restoreVideoEl,
  __hasLazyVideoSourceWithoutSrc,
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
      if (!['youtube', 'tiktok', 'iframe'].includes(source)) return;
      try {
        document.querySelectorAll('video').forEach((v) => {
          if (v === activeEl) return;
          if (!(v instanceof HTMLVideoElement)) return;
          if (!v.controls) return;
          v.pause();
        });
        document.querySelectorAll('audio').forEach((a) => {
          if (a === activeEl) return;
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

    const pending = new WeakMap();
    const schedulePrepare = (fn) => {
      let done = false;
      const run = () => {
        if (done) return;
        done = true;
        try { fn(); } catch {}
      };
      const rafId = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : 0;
      const timeoutId = setTimeout(run, 32);
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

    const prepare = (video) => {
      if (!(video instanceof HTMLVideoElement)) return;
      if (video.dataset.previewInit === '1') return;
      video.dataset.previewInit = '1';

      try {
        // Более ранний prewarm: к зоне фокуса хотим уже готовый первый кадр.
        video.dataset.__prewarm = '1';
        video.preload = 'auto';

        // Если первый кадр/данные уже готовы — ничего не делаем
        if (video.readyState >= 2) return;
        if (__hasLazyVideoSourceWithoutSrc(video)) {
          // Prime the lazy source before entering the autoplay focus zone for TikTok-like instant start.
          __restoreVideoEl(video);
          __touchActiveVideoEl(video);
          __enforceActiveVideoCap(video);
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
            if (safe) video.load?.();
          } catch {}
        });
        pending.set(video, job);
      } catch {}
    };

    // если нет IntersectionObserver — готовим всё сразу
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(selector).forEach(prepare);
      return () => {
        try {
          pending.forEach((job) => { try { cancelPrepare(job); } catch {} });
          pending.clear?.();
        } catch {}
      };
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          prepare(entry.target);
          io.unobserve(entry.target); // один раз на видео
        });
      },
      {
        // Чуть раньше подготавливаем медиа, чтобы автоплей не "спотыкался"
        // при входе в зону фокуса на мобильных.
        threshold: 0.01,
        rootMargin: `${Math.max(320, Math.round(__MEDIA_VIS_MARGIN_PX * 1.35))}px 0px ${Math.max(520, Math.round(__MEDIA_VIS_MARGIN_PX * 1.95))}px 0px`,
      }
    );

    document.querySelectorAll(selector).forEach((v) => io.observe(v));

    return () => {
      io.disconnect();
      try {
        pending.forEach((job) => { try { cancelPrepare(job); } catch {} });
        pending.clear?.();
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
      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        try { if (!el.paused) el.pause(); } catch {}
        return;
      }
      const kind = el.getAttribute('data-forum-media');
      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) { try { if (!a.paused) a.pause(); } catch {} }
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
      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        try { if (!el.paused) el.pause(); } catch {}
        return;
      }
      const kind = el.getAttribute('data-forum-media');
      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) { try { if (!a.paused) a.pause(); } catch {} }
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

      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        try {
          if (el instanceof HTMLVideoElement) {
            const hasSrc = !!el.getAttribute('src');
            if (!hasSrc) __restoreVideoEl(el);
            __touchActiveVideoEl(el);
            __enforceActiveVideoCap(el);
          }
          applyMutedPref(el);
          el.playsInline = true;
          // LOOP: автоплей всегда зацикленный 
          el.loop = true;
          if (el.paused) {
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
            if (a.paused) {
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

    const pickMostVisible = () => {
      let best = null;
      let bestRatio = 0;
      for (const [el, r] of ratios.entries()) { 
        if (r > bestRatio) {
          bestRatio = r;
          best = el;
        }
      }
      return { el: best, ratio: bestRatio };
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
          const { el: candidate, ratio } = pickMostVisible();
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
            if (ar >= STOP_RATIO) {
              // Если кандидат другой — переключаемся только когда он уверенно лучше.
              // (иначе будет флаттер между двумя элементами рядом)
              if (candidate && candidate !== active && ratio >= START_RATIO && ratio > ar + 0.08) {
                softPauseMedia(active);
                scheduleHardUnload(active, null, 'focus_switch');
                active = candidate;
                cancelUnload(active);
                emitMediaDiag('media_focus_switch', { ratio, prevRatio: ar });
                playMedia(active);
              }
              return;
            }
            // Активный выпал ниже STOP_RATIO — мягко отпускаем
            softPauseMedia(active);
            scheduleHardUnload(active, null, 'below_stop_ratio');
            active = null;
          } 

          // Нет активного — берём кандидата, только если он попал в расширенную зону
          if (!candidate || ratio < START_RATIO) return;
 

          if (active && active !== candidate) {
            // старый — мягко стоп + hard unload с задержкой
            softPauseMedia(active);
            scheduleHardUnload(active, null, 'candidate_replace');
          }

          active = candidate;
          cancelUnload(active);
          emitMediaDiag('media_focus_switch', { ratio, prevRatio: 0 });
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

      if (active) {
        softPauseMedia(active);
        scheduleHardUnload(active, 0, 'cleanup');
      }
      active = null;
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

