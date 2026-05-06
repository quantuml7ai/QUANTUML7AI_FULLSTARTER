import { useEffect } from 'react'

import { isBrowser } from '../../../shared/utils/browser'
import {
  MEDIA_MUTED_KEY,
  MEDIA_VIDEO_MUTED_KEY,
  MEDIA_MUTED_EVENT,
  readMutedPrefFromStorage,
  readMutedPrefFromDocument,
  writeMutedPrefToDocument,
  __touchActiveVideoEl,
  __dropActiveVideoEl,
  __enforceActiveVideoCap,
  __restoreVideoEl,
  __unloadVideoEl,
  __hasLazyVideoSourceWithoutSrc,
  __isVideoNearViewport,
  __MEDIA_VIS_MARGIN_PX,
} from '../utils/mediaLifecycleRuntime'
import {
  commandExternalVideo,
  emitExternalVideoState,
  ensureExternalVideoSrc,
  ensureTikTokPlayerSrc,
  ensureYouTubeEmbedSrc as normalizeYouTubeEmbedSrc,
} from '../utils/externalVideoBridge'
export default function useForumMediaCoordinator({ emitDiag }) {
  // Single owner for forum media warmup, focus playback, pause, and unload policy.
  useEffect(() => {
    if (!isBrowser()) return;

    const selector = '[data-forum-media]';
    const AD_MEDIA_ATTR = 'data-ad-media';
    const isAdMediaElement = (el) => String(el?.getAttribute?.(AD_MEDIA_ATTR) || '') === '1';
    const managedForumVideoSelector = 'video[data-forum-media="video"][data-forum-video="post"],video[data-forum-media="video"][data-forum-video="ad"]';
    const isManagedForumVideoKind = (el) => {
      const kind = String(el?.getAttribute?.('data-forum-video') || '');
      return kind === 'post' || kind === 'ad';
    };
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
          adMedia: isAdMediaElement(el) ? '1' : '0',
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

    const isUserSoundSource = (source) => {
      const s = String(source || '').trim();
      return (
        s === 'video' ||
        s === 'qcast' ||
        s === 'youtube' ||
        s === 'media_element' ||
        s === 'forum-ads-toggle' ||
        s === 'user' ||
        s.startsWith('user-') ||
        s.endsWith('-toggle')
      );
    };

    const writeMutedPref = (val, userSet = false) => {
      const nextBool = !!val;
      const next = nextBool ? '1' : '0';
      try {
        localStorage.setItem(MEDIA_MUTED_KEY, next);
        localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, next);
      } catch {}
      try {
        writeMutedPrefToDocument(nextBool, !!userSet);
      } catch {}
    };
    // Единственный runtime-документ звука для native/video/audio/QCast/YouTube/TikTok/iframe/Ads.
    // На каждый новый page load runtime сбрасывает документ в muted=true ради splash/BG-audio.
    // После пользовательского выбора все контуры читают document/window, storage — только legacy mirror.
    let mutedPref = null;
    try {
      const fromDocument = readMutedPrefFromDocument();
      mutedPref = typeof fromDocument === 'boolean' ? fromDocument : readMutedPrefFromStorage();
    } catch {
      mutedPref = null;
    }
    if (typeof mutedPref !== 'boolean') mutedPref = true;
    try { writeMutedPrefToDocument(mutedPref, false); } catch {}
    const desiredMuted = () => {
      try {
        const fromDocument = readMutedPrefFromDocument();
        if (typeof fromDocument === 'boolean') {
          mutedPref = fromDocument;
          return fromDocument;
        }
      } catch {}
      return mutedPref == null ? true : !!mutedPref;
     };
    const readQcastMutedPref = () => desiredMuted();
const writeQcastMutedPref = (next) => {
  setMutedPref(!!next, 'qcast');
};


    const applyMutedPref = (el) => {
      if (!(el instanceof HTMLMediaElement)) return;
      if (shouldSkipMutePersist(el)) return;
      const want = desiredMuted();
      if (el.muted !== want) el.muted = want;
      try {
        el.defaultMuted = want;
        if (want) el.setAttribute('muted', '');
        else el.removeAttribute('muted');
      } catch {}
    };
const applyMutedPrefToAll = () => {
  try {
    const want = desiredMuted();

    document.querySelectorAll('[data-forum-media]').forEach((el) => {
      const kind = String(el?.getAttribute?.('data-forum-media') || '');

      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        if (shouldSkipMutePersist(el)) return;
        if (el.muted !== want) el.muted = want;
        el.defaultMuted = want;
        if (want) el.setAttribute('muted', '');
        else el.removeAttribute('muted');
        return;
      }

      if (kind === 'qcast') {
        const a = el.querySelector?.('audio');
        if (a instanceof HTMLAudioElement) {
          if (shouldSkipMutePersist(a) || shouldSkipMutePersist(el)) return;
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
      const userSet = isUserSoundSource(source);
      if (mutedPref === next && source === 'forum-coordinator') {
        writeMutedPref(next, false);
        return;
      }
      mutedPref = next;
      writeMutedPref(next, userSet);
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
        if (coarse) return 1;
        return 2;
      } catch {
        return 2;
      }
    })();
    const getLoadPendingStaleMs = () => {
      try {
        if (isIOSUi) return 3600;
        if (isCoarseUi) return 4800;
        return 6200;
      } catch {
        return 5200;
      }
    };
let pendingLoadsCacheTs = 0;
let pendingLoadsCacheVal = 0;
let nativePrewarmEl = null;
let nativePrewarmTs = 0;
const nativePauseRecovery = new WeakMap();
const nativePrimeSrcState = new Map();
const clearNativePauseRecovery = (media) => {
  try {
    const st = media ? nativePauseRecovery.get(media) : null;
    if (st?.timer) clearTimeout(st.timer);
    if (media) nativePauseRecovery.delete(media);
  } catch {}
};
const POST_NATIVE_SRC_CAP = (() => {
      try {
        const ua = String(navigator?.userAgent || '');
        const ios = /iP(hone|ad|od)/i.test(ua);
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches;
        const dm = Number(navigator?.deviceMemory || 0);
        const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 3;
        // One active native video + one prepared neighbor is the stable mobile budget.
        // cap=1 was tearing down the prewarm node right after it attached src,
        // which caused repeat bytes=0-/tail Range cycles and black viewport entry.
        if (lowMem) return 2;
        if (ios || coarse || /Android/i.test(ua)) return 2;
        return 3;
      } catch {
        return 2;
      }
    })();
const readPendingLoads = (force = false) => {
      try {
        const now = Date.now();
        if (!force && (now - pendingLoadsCacheTs) < 140) return pendingLoadsCacheVal;
        pendingLoadsCacheTs = now;
        const nodes = Array.from(document.querySelectorAll('video[data-forum-media],audio[data-forum-media],audio[data-qcast-audio="1"]'));
        const stalePendingMs = getLoadPendingStaleMs();
        pendingLoadsCacheVal = nodes.reduce((acc, node) => {
          try {
            if (String(node?.dataset?.__loadPending || '') !== '1') return acc;
            const since = Number(node?.dataset?.__loadPendingSince || 0);
            const readyState = Number(node?.readyState || 0);
            const networkState = Number(node?.networkState || 0);
            const pendingForMs = since > 0 ? (now - since) : 0;
            const isNetworkLoading = networkState === HTMLMediaElement.NETWORK_LOADING;
            const isNetworkIdleLike =
              networkState === HTMLMediaElement.NETWORK_EMPTY ||
              networkState === HTMLMediaElement.NETWORK_IDLE ||
              networkState === HTMLMediaElement.NETWORK_NO_SOURCE;
            const mayBeStuck =
              pendingForMs > stalePendingMs &&
              (
                readyState < 2 ||
                isNetworkIdleLike ||
                !isNetworkLoading
              );
            if (mayBeStuck) {
              try {
                node.dataset.__loadPending = '0';
                node.dataset.__warmReady = readyState >= 2 ? '1' : '0';
                node.dataset.__loadPendingClearReason = 'stale_budget_reset';
                delete node.dataset.__loadPendingSince;
              } catch {}
              trace('load_pending_stale_reset', node, {
                pendingForMs,
                stalePendingMs,
                readyState,
                networkState,
              });
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
    const pruneNativePrimeSrcState = (nowTs = Date.now()) => {
      try {
        const now = Number(nowTs || Date.now());
        for (const [key, st] of nativePrimeSrcState) {
          const touchedAt = Number(st?.touchedAt || 0);
          const pendingUntil = Number(st?.pendingUntil || 0);
          const blockedUntil = Number(st?.blockedUntil || 0);
          if (
            (!touchedAt || (now - touchedAt) > 150000) &&
            pendingUntil <= now &&
            blockedUntil <= now
          ) {
            nativePrimeSrcState.delete(key);
          }
        }

        while (nativePrimeSrcState.size > 160) {
          const firstKey = nativePrimeSrcState.keys().next().value;
          if (!firstKey) break;
          nativePrimeSrcState.delete(firstKey);
        }
      } catch {}
    };

    const canStartNativePrimeForSrc = (media, reason = 'native_prime', warmupOnlyPrime = false) => {
      if (!(media instanceof HTMLVideoElement)) return false;
      const srcKey = getMediaSrcKey(media);
      if (!srcKey) return true;

      const now = Date.now();
      try {
        const state = nativePrimeSrcState.get(srcKey) || {};
        const blockedUntil = Number(state?.blockedUntil || 0);
        if (blockedUntil > now) {
          trace('native_prime_skip_src_blocked', media, {
            reason,
            blockedForMs: blockedUntil - now,
          });
          return false;
        }

        const pendingUntil = Number(state?.pendingUntil || 0);
        if (pendingUntil > now) {
          trace('native_prime_skip_src_pending', media, {
            reason,
            pendingForMs: pendingUntil - now,
          });
          return false;
        }

        const minGapMs = warmupOnlyPrime
          ? (isIOSUi ? 4600 : (isCoarseUi ? 3400 : 2400))
          : (isIOSUi ? 1800 : 1500);
        const lastPrimeTs = Number(state?.lastPrimeTs || 0);
        if (lastPrimeTs > 0 && (now - lastPrimeTs) < minGapMs) {
          trace('native_prime_skip_src_gap', media, {
            reason,
            sinceMs: now - lastPrimeTs,
            minGapMs,
          });
          return false;
        }

        const burstWindowMs = isIOSUi ? 24000 : 18000;
        const burstLimit = warmupOnlyPrime ? 2 : 3;
        const winStart = Number(state?.windowStart || 0);
        let primeCount = Number(state?.count || 0);
        const inWindow = winStart > 0 && (now - winStart) < burstWindowMs;
        const nextWinStart = inWindow ? winStart : now;
        if (!inWindow) primeCount = 0;
        primeCount += 1;

        if (primeCount > burstLimit) {
          const until = now + (warmupOnlyPrime ? (isIOSUi ? 15000 : 11000) : (isIOSUi ? 9000 : 7000));
          nativePrimeSrcState.set(srcKey, {
            ...state,
            blockedUntil: until,
            pendingUntil: 0,
            lastPrimeTs,
            windowStart: nextWinStart,
            count: primeCount,
            touchedAt: now,
          });
          pruneNativePrimeSrcState(now);
          trace('native_prime_block_src', media, {
            reason,
            primes: primeCount,
            blockedForMs: until - now,
          });
          return false;
        }

        nativePrimeSrcState.set(srcKey, {
          ...state,
          blockedUntil: 0,
          pendingUntil: now + (warmupOnlyPrime ? (isIOSUi ? 2600 : 2200) : 1600),
          lastPrimeTs: now,
          windowStart: nextWinStart,
          count: primeCount,
          touchedAt: now,
        });
        pruneNativePrimeSrcState(now);
        return true;
      } catch {
        return true;
      }
    };

    const finishNativePrimeForSrc = (media, state = 'done') => {
      if (!(media instanceof HTMLVideoElement)) return;
      const srcKey = getMediaSrcKey(media);
      if (!srcKey) return;

      try {
        const now = Date.now();
        const prev = nativePrimeSrcState.get(srcKey) || {};
        nativePrimeSrcState.set(srcKey, {
          ...prev,
          pendingUntil: 0,
          touchedAt: now,
          readyTs: Number(media.readyState || 0) >= 2 ? now : Number(prev?.readyTs || 0),
          lastState: String(state || 'done'),
        });
        pruneNativePrimeSrcState(now);
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

const getHtmlMediaNetworkSnapshot = (el) => {
  const media = getMediaStateNode(el);
  const snap = {
    media,
    hasSrc: false,
    readyState: 0,
    networkState: 0,
    loadPending: false,
    pendingForMs: 0,
  };
  if (!(media instanceof HTMLMediaElement)) return snap;
  try {
    snap.hasSrc = !!String(media.currentSrc || media.getAttribute?.('src') || '').trim();
    snap.readyState = Number(media.readyState || 0);
    snap.networkState = Number(media.networkState || 0);
    snap.loadPending = String(media.dataset?.__loadPending || '') === '1';
    const since = Number(media.dataset?.__loadPendingSince || 0);
    snap.pendingForMs = since > 0 ? Date.now() - since : 0;
  } catch {}
  return snap;
};

const isHtmlMediaLoadingOrBuffered = (el) => {
  const snap = getHtmlMediaNetworkSnapshot(el);
  const media = snap.media;
  if (!(media instanceof HTMLMediaElement)) return false;
  try {
    if (!snap.hasSrc) return false;
    if (snap.readyState >= 2) return true;

    const staleMs = getLoadPendingStaleMs();
    const isLoading = snap.networkState === HTMLMediaElement.NETWORK_LOADING;
    const pendingFresh = snap.loadPending && snap.pendingForMs < staleMs;
    const metadataFresh = snap.readyState >= 1 && snap.pendingForMs < Math.max(900, Math.round(staleMs * 0.55));

    if (isLoading && (pendingFresh || snap.pendingForMs <= 0)) return true;
    if (pendingFresh) return true;
    if (metadataFresh) return true;

    if (snap.loadPending && snap.pendingForMs >= staleMs) {
      try {
        media.dataset.__loadPending = '0';
        media.dataset.__warmReady = snap.readyState >= 2 ? '1' : '0';
        media.dataset.__loadPendingClearReason = 'stale_buffer_check';
        delete media.dataset.__loadPendingSince;
      } catch {}
      trace('load_pending_stale_buffer_reset', media, {
        pendingForMs: snap.pendingForMs,
        staleMs,
        readyState: snap.readyState,
        networkState: snap.networkState,
      });
    }
  } catch {}
  return false;
};

const clampPostNativeWarmBuffer = (el, reason = 'warm_buffer_clamp') => {
  const media = getMediaStateNode(el);
  if (!(media instanceof HTMLVideoElement)) return false;
  try {
    if (!isManagedForumVideoKind(media)) return false;
    if (String(media?.getAttribute?.('data-forum-media') || '') !== 'video') return false;

    const owner = getOwnerNode(media) || media;
    const activeOwner = active instanceof Element ? active : null;
    const ownerMatchesActive =
      !!(owner instanceof Element && activeOwner && (
        activeOwner === owner ||
        activeOwner.contains?.(owner) ||
        owner.contains?.(activeOwner)
      ));
    const wantsRealPlayback =
      ownerMatchesActive ||
      String(media?.dataset?.__active || '') === '1' ||
      String(media?.dataset?.__playRequested || '') === '1' ||
      hasUserGestureIntent(owner || media) ||
      hasUserGestureIntent(media) ||
      hasManualLease(owner || media) ||
      hasManualLease(media);

    if (wantsRealPlayback) return false;

    const ready = Number(media.readyState || 0) >= 2;
    if (ready) {
      media.dataset.__warmReady = '1';
      media.dataset.__resident = '1';
      media.dataset.__prewarm = '1';
      media.dataset.__nativeWarmClampedReason = String(reason || 'warm_buffer_clamp');
      const holdMs = isIOSUi ? 4200 : (isCoarseUi ? 3000 : 1800);
      const until = Date.now() + holdMs;
      const prevUntil = Number(media.dataset?.__nativePrimeHoldUntil || 0);
      media.dataset.__nativePrimeHoldUntil = String(Math.max(prevUntil, until));
    }

    if (media.paused || String(media?.dataset?.__nativePrimeWarmupOnly || '') === '1') {
      media.preload = 'metadata';
    }
    return true;
  } catch {
    return false;
  }
};

const enforcePostNativeSrcCap = (keepEl = null, reason = 'post_native_src_cap') => {
  try {
    const nodes = Array.from(document.querySelectorAll(managedForumVideoSelector))
      .filter((node) => {
        try {
          return (
            node instanceof HTMLVideoElement &&
            node.isConnected &&
            !!String(node.currentSrc || node.getAttribute?.('src') || '').trim()
          );
        } catch {
          return false;
        }
      });
    if (nodes.length <= POST_NATIVE_SRC_CAP) return;

    const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
    const nearProtectPx = (() => {
      try {
        if (isIOSUi) return Math.max(1120, Math.min(1800, Math.round(viewportH * 1.35)));
        if (isCoarseUi) return Math.max(920, Math.min(1500, Math.round(viewportH * 1.08)));
        return Math.max(560, Math.min(980, Math.round(viewportH * 0.72)));
      } catch {
        return isIOSUi ? 1120 : (isCoarseUi ? 920 : 560);
      }
    })();
    const keepMedia = getMediaStateNode(keepEl);
    const activeOwner = active instanceof Element ? active : null;
    const scored = nodes
      .map((node) => {
        const owner = getOwnerNode(node) || node;
        const isKeep =
          node === keepEl ||
          node === keepMedia ||
          node === nativePrewarmEl ||
          !!(activeOwner && owner instanceof Element && (
            activeOwner === owner ||
            activeOwner === node ||
            activeOwner.contains?.(owner) ||
            owner.contains?.(activeOwner)
          ));
        const playing = !node.paused && !node.ended;
        const visiblePx = getOwnerVisiblePx(owner || node);
        const gapPx = getOwnerViewportGapPx(owner || node);
        const holdUntil = Number(node.dataset?.__nativePrimeHoldUntil || 0);
        const holdActive = holdUntil > Date.now();
        const ready = Number(node.readyState || 0) >= 2 || String(node.dataset?.__warmReady || '') === '1';
        const nearProtected =
          visiblePx > 0 ||
          holdActive ||
          Number(gapPx || Number.POSITIVE_INFINITY) <= nearProtectPx;
        const hardProtected = isKeep || playing || visiblePx > 0 || holdActive;
        const priority =
          (isKeep ? -1000000 : 0) +
          (playing ? -900000 : 0) +
          (nearProtected ? -760000 : 0) +
          (holdActive ? -120000 : 0) +
          (ready ? -40000 : 0) +
          Math.max(0, Number(gapPx || 0)) -
          (visiblePx * 24);
        return { node, owner, isKeep, playing, priority, visiblePx, gapPx, holdActive, nearProtected, hardProtected, ready };
      })
      .sort((a, b) => b.priority - a.priority);

    let attached = nodes.length;
    for (const item of scored) {
      if (attached <= POST_NATIVE_SRC_CAP) break;
      if (item.hardProtected || (item.nearProtected && attached <= POST_NATIVE_SRC_CAP)) {
        if (item.nearProtected) {
          try {
            item.node.preload = item.playing ? 'auto' : 'metadata';
            item.node.dataset.__resident = '1';
          } catch {}
          trace('post_native_src_cap_keep_near', item.node, {
            reason,
            attachedBefore: nodes.length,
            cap: POST_NATIVE_SRC_CAP,
            visiblePx: item.visiblePx,
            gapPx: item.gapPx,
            nearProtectPx,
            holdActive: item.holdActive,
            ready: item.ready,
          });
        }
        continue;
      }
      try {
        item.node.dataset.__nativeSrcCapReason = String(reason || 'post_native_src_cap');
        item.node.dataset.__nativePrimeHoldUntil = '0';
        item.node.dataset.__prewarm = '0';
        item.node.dataset.__resident = '0';
      } catch {}
      scheduleHardUnload(item.node, 0, 'resident_cap');
      attached -= 1;
      trace('post_native_src_cap_release', item.node, {
        reason,
        attachedBefore: nodes.length,
        cap: POST_NATIVE_SRC_CAP,
        visiblePx: item.visiblePx,
        gapPx: item.gapPx,
        nearProtectPx,
        holdActive: item.holdActive,
        ready: item.ready,
      });
    }
  } catch {}
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

  if (isHtmlMediaLoadingOrBuffered(media)) {
    const snap = getHtmlMediaNetworkSnapshot(media);
    trace('load_kick_hold_existing_fetch', media, {
      channel,
      readyState: snap.readyState,
      networkState: snap.networkState,
      loadPending: snap.loadPending ? '1' : '0',
      pendingForMs: snap.pendingForMs,
    });
    if (snap.readyState >= 2) clearLoadPending(media, 'already_buffered', true);
    else if (!snap.loadPending && snap.networkState === HTMLMediaElement.NETWORK_LOADING) {
      markLoadPending(media, `${channel}_existing_fetch`);
    }
    return true;
  }

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

  try {
    if (!String(media.getAttribute?.('src') || media.currentSrc || '').trim()) {
      trace('load_kick_missing_src_after_restore', media, { channel });
      return false;
    }
  } catch {}

  markLoadPending(media, channel);

  try {
    if (media instanceof HTMLVideoElement) media.preload = 'auto';
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
            const isPostVideo = isManagedForumVideoKind(el);
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
  reasonTag === 'visibility_recover' ||
  reasonTag === 'native_priority_prewarm';

      const isPrewarmOnly =
        reasonTag === 'pending_grace' ||
        reasonTag === 'early_prewarm' ||
        reasonTag === 'io_near_prewarm' ||
        reasonTag === 'candidate_near_prewarm';

try {
  applyMutedPref(el);
  el.playsInline = true;

  if (el instanceof HTMLVideoElement) {
    const isPostVideo = isManagedForumVideoKind(el);
    const allowNearViewportRestore =
      isPostVideo &&
      isPrewarmOnly &&
      !highPriorityReason &&
      (() => {
        try {
          if (getOwnerVisiblePx(el) > 16) return true;
          return getOwnerViewportGapPx(el) <= getNativeEarlyPrimeGapLimit();
        } catch {
          return false;
        }
      })();
    const keepWarm = highPriorityReason || allowNearViewportRestore;

    try { el.dataset.__resident = keepWarm ? '1' : '0'; } catch {}
    try { el.dataset.__prewarm = keepWarm ? '1' : '0'; } catch {}
    try { el.preload = keepWarm ? 'auto' : (isPostVideo ? 'none' : 'metadata'); } catch {}

    // Critical mobile fix:
    // low-priority near/prewarm must NOT attach src for post native video.
    // On iOS/Safari even src+metadata may start Range/206, then coordinator cancels it.
    // Only activation/play/visibility recovery is allowed to restore src and touch network.
    if (isPostVideo && isPrewarmOnly && !keepWarm) {
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
        const stalePendingMs = getLoadPendingStaleMs();
const pendingForMs = pendingSince > 0 ? (now - pendingSince) : 0;
        if (
          String(el.dataset?.__loadPending || '') === '1' &&
          pendingSince > 0 &&
          readyState < 2 &&
          pendingForMs > stalePendingMs
        ) {
          try {
            el.dataset.__loadPending = '0';
            el.dataset.__warmReady = readyState >= 2 ? '1' : '0';
            el.dataset.__loadPendingClearReason = 'candidate_stale_reset';
            delete el.dataset.__loadPendingSince;
          } catch {}
          trace('candidate_clear_stale_pending', el, { reason, pendingForMs, readyState, networkState });
        }
const cold = networkState === HTMLMediaElement.NETWORK_EMPTY || !el.currentSrc;
if (cold && (now - lastBoostTs) > 1500 && el.dataset?.__loadPending !== '1') {
  const isPostVideo =
    el instanceof HTMLVideoElement &&
    isManagedForumVideoKind(el);

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
  channel: highPriorityReason ? reasonTag || 'candidate_cold' : 'candidate_cold',
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
    isManagedForumVideoKind(el);

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
const hasAttachedSrcForRetry = !!String(el.currentSrc || el.getAttribute?.('src') || '').trim();
if (networkState === HTMLMediaElement.NETWORK_LOADING && hasAttachedSrcForRetry) {
  // Do not call load() again while the browser is already fetching the same MP4.
  // Re-load here aborts the current Range request and creates the 206/cancel loop.
  trace('candidate_pending_stall_hold_loading', el, {
    reason,
    stalledMs: now - pendingSince,
    readyRetryCount,
    networkState,
  });
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
    const now = Date.now();
    const persistUntil = Number(el?.dataset?.__persistMuteUntil || owner?.dataset?.__persistMuteUntil || 0);
    const manualSoundChange =
      persistUntil > now ||
      hasManualLease(el) ||
      hasManualLease(owner) ||
      hasUserGestureIntent(el) ||
      hasUserGestureIntent(owner);

    // Programmatic muted fallback / coordinator sync must not become a user sound choice.
    if (!manualSoundChange) return;
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
    source === 'tiktok' ||
    source === 'iframe' ||
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
      const isNativeAutoplayPause =
        target instanceof HTMLVideoElement &&
        isManagedForumVideoKind(target) &&
        !manualLease &&
        !hasGesture &&
        ownerMatchesActive &&
        nearViewport &&
        getOwnerVisiblePx(owner) >= Math.max(48, Math.round(getAutoplayMinVisiblePx(owner) * 0.58)) &&
        getOwnerCenterDist(owner) <= Math.max(190, getPriorityCenterMaxDist(owner) + (isIOSUi ? 120 : 80));

      if (isNativeAutoplayPause) {
        trace('pause_recover_active_native', target, {
          visiblePx: getOwnerVisiblePx(owner),
          centerDist: getOwnerCenterDist(owner),
          coordinatorPlay,
          ownerMatchesActive,
        });
        clearReadyReplay(target);
        clearSuppressedPlayback(target);
        clearSuppressedPlayback(owner);
        clearCoordinatorPlayIntent(target);
        clearCoordinatorPlayIntent(owner);
        cancelUnload(owner);
        scheduleNativePauseRecovery(target, owner, 'pause_event_active_native');
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
      const activeOwnerNow = active instanceof Element ? active : null;
      const ownerMatchesActiveNow = !!(activeOwnerNow && (
        activeOwnerNow === owner ||
        activeOwnerNow.contains?.(owner) ||
        owner.contains?.(activeOwnerNow)
      ));
      const isNativePrimePlay =
        target instanceof HTMLVideoElement &&
        isManagedForumVideoKind(target) &&
        String(target?.dataset?.__nativePrimePending || '') === '1' &&
        String(target?.dataset?.__nativePrewarm || '') === '1' &&
        coordinatorPlay &&
        !manualLease &&
        !hasGesture &&
        !ownerMatchesActiveNow;

      if (isNativePrimePlay) {
        trace('native_prime_play_no_focus_steal', target, {
          activeKind: String(activeOwnerNow?.getAttribute?.('data-forum-media') || ''),
          visiblePx: getOwnerVisiblePx(owner),
          centerDist: getOwnerCenterDist(owner),
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
          try { nativePauseRecovery.delete(target); } catch {}
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
      const isPostVideoError =
        target instanceof HTMLVideoElement &&
        isManagedForumVideoKind(target);
      if (isPostVideoError && errCode >= 2 && errCode <= 4) {
        const now = Date.now();
        const readyState = Number(target?.readyState || 0);
        const networkState = Number(target?.networkState || 0);
        const visiblePx = owner instanceof Element ? getOwnerVisiblePx(owner) : getOwnerVisiblePx(target);
        const gapPx = owner instanceof Element ? getOwnerViewportGapPx(owner) : getOwnerViewportGapPx(target);
        const nearErrorSurface =
          visiblePx > 0 ||
          gapPx <= (isIOSUi ? 1400 : (isCoarseUi ? 1220 : 880));
        const lastLifecycleTs = Math.max(
          Number(target?.dataset?.__lastLoadKickTs || 0),
          Number(target?.dataset?.__lastWarmLoadKickTs || 0),
          Number(target?.dataset?.__lastRestoreLoadTs || 0),
          Number(target?.dataset?.__attachedSrcTs || 0),
          Number(target?.dataset?.__lastLifecycleTouchTs || 0),
        );
        const recentLifecycle = lastLifecycleTs > 0 && (now - lastLifecycleTs) < (isIOSUi ? 9000 : 6200);
        const loadingState =
          typeof HTMLMediaElement !== 'undefined' &&
          networkState === HTMLMediaElement.NETWORK_LOADING;
        const srcNow = String(target.getAttribute('src') || target.currentSrc || '').trim();
        const lazySrc = String(target.dataset?.__src || target.getAttribute('data-src') || '').trim();
        const transientPostSurfaceError =
          !!(srcNow || lazySrc) &&
          (
            nearErrorSurface ||
            recentLifecycle ||
            loadingState ||
            readyState >= 1 ||
            String(target?.dataset?.__loadPending || '') === '1'
          );

        if (transientPostSurfaceError) {
          try {
            target.dataset.__loadPending = '0';
            target.dataset.__warmReady = readyState >= 2 ? '1' : String(target.dataset?.__warmReady || '0');
            target.dataset.__transientPostMediaErrorTs = String(now);
            target.dataset.__transientPostMediaErrorCode = String(errCode || 0);
            delete target.dataset.__blockedMediaUntil;
          } catch {}
          clearMediaSrcBlocked(target, 'transient_post_media_error');
          clearReadyReplay(target);
          if (owner instanceof Element) cancelUnload(owner);
          try { target.preload = readyState >= 2 ? 'metadata' : 'auto'; } catch {}
          trace('media_error_ignore', target, {
            code: errCode,
            reason: 'transient_post_surface_error',
            readyState,
            networkState,
            visiblePx,
            gapPx,
            recentLifecycle,
            loadingState,
          });
          return;
        }
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
      isManagedForumVideoKind(target);

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

    if (isPostVideo && !wantsAutoplay) {
      clampPostNativeWarmBuffer(target, `loaded_${e?.type || 'ready'}`);
      enforcePostNativeSrcCap(target, 'loaded_warm_ready');
    }

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
            try { clearNativePauseRecovery(owner); } catch {}
            try { __dropActiveVideoEl(owner); } catch {}
            if (nativePrewarmEl === owner) {
              nativePrewarmEl = null;
              nativePrewarmTs = 0;
            }
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
      try {
        if (nativePrewarmEl instanceof HTMLVideoElement && !nativePrewarmEl.isConnected) {
          clearNativePauseRecovery(nativePrewarmEl);
          nativePrewarmEl = null;
          nativePrewarmTs = 0;
        }
      } catch {}
      try { pruneNativePrimeSrcState(now); } catch {}
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
    const restoreUserSoundAfterSafeAutoplay = (el, reason = 'autoplay_started') => {
      try {
        if (!(el instanceof HTMLMediaElement)) return;
        if (desiredMuted() !== false) return;
        if (!el.muted) return;
        const unlocked = (() => {
          try {
            return window.__FORUM_MEDIA_SOUND_UNLOCKED__ === true ||
              window.__SITE_MEDIA_SOUND_UNLOCKED__ === true ||
              document?.documentElement?.dataset?.forumMediaSoundUnlocked === '1' ||
              document?.body?.dataset?.forumMediaSoundUnlocked === '1';
          } catch {
            return false;
          }
        })();
        if (!unlocked) return;
        markSkipMutePersist(el, 1400);
        el.dataset.__restoreUserSoundAfterAutoplay = String(Date.now());
        el.muted = false;
        el.defaultMuted = false;
        el.removeAttribute('muted');
        trace('restore_user_sound_after_autoplay', el, { reason });
      } catch {}
    };
    const hasMediaUserLeaseNow = (el) => {
      try {
        const owner = getOwnerNode(el);
        const now = Date.now();
        const leaseUntil = Math.max(
          Number(el?.dataset?.__manualLeaseUntil || 0),
          Number(el?.dataset?.__userGestureUntil || 0),
          Number(owner?.dataset?.__manualLeaseUntil || 0),
          Number(owner?.dataset?.__userGestureUntil || 0),
        );
        return leaseUntil > now;
      } catch {
        return false;
      }
    };
    const isHtmlMediaPlaybackViewportAllowed = (el) => {
      try {
        if (hasMediaUserLeaseNow(el)) return true;
        const owner = getOwnerNode(el) || el;
        if (!(owner instanceof Element)) return true;
        const rect = owner.getBoundingClientRect?.();
        const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        if (!rect || viewportH <= 0) return true;
        const visiblePx = Math.max(0, Math.min(Number(rect.bottom || 0), viewportH) - Math.max(Number(rect.top || 0), 0));
        const center = (Number(rect.top || 0) + Number(rect.bottom || 0)) / 2;
        const centerDist = Math.abs(center - (viewportH / 2));
        const minVisiblePx = isIOSUi
          ? Math.max(126, Math.round(viewportH * 0.17))
          : (isCoarseUi ? Math.max(156, Math.round(viewportH * 0.21)) : 96);
        const maxCenterDist = isCoarseUi ? Math.round(viewportH * 0.72) : Math.round(viewportH * 0.76);
        return visiblePx >= minVisiblePx && centerDist <= maxCenterDist;
      } catch {
        return true;
      }
    };
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
            if (!isHtmlMediaPlaybackViewportAllowed(el)) {
              try { el.dataset.__playRequested = '0'; } catch {}
              trace('play_started_out_of_focus_guard', el, { reason, muted: !!el.muted });
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

try { restoreUserSoundAfterSafeAutoplay(el, reason); } catch {}

if (String(el?.dataset?.__warmReady || '') === '1') {
  try { __touchActiveVideoEl(el); } catch {}
  try { __enforceActiveVideoCap(el); } catch {}
  try { enforcePostNativeSrcCap(el, 'play_started'); } catch {}
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
                  if (!isHtmlMediaPlaybackViewportAllowed(el)) {
                    try { el.dataset.__playRequested = '0'; } catch {}
                    trace('play_retry_out_of_focus_guard', el, { reason });
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

try { restoreUserSoundAfterSafeAutoplay(el, reason); } catch {}

if (String(el?.dataset?.__warmReady || '') === '1') {
  try { __touchActiveVideoEl(el); } catch {}
  try { __enforceActiveVideoCap(el); } catch {}
  try { enforcePostNativeSrcCap(el, 'play_retry_started'); } catch {}
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
 const normalizeExternalUrlForCompare = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try { return new URL(raw, window.location.href).href; } catch {}
  return raw;
};

const isYouTubeIframeReadyForApi = (iframe, expectedSrc = '') => {
  if (!(iframe instanceof HTMLIFrameElement)) return false;
  const src = normalizeExternalUrlForCompare(iframe.getAttribute('src') || '');
  const expected = normalizeExternalUrlForCompare(expectedSrc || iframe.getAttribute('data-src') || src);
  if (!src || !expected || src !== expected) return false;
  try {
    const url = new URL(src, window.location.href);
    if (!/(^|\.)youtube(?:-nocookie)?\.com$/i.test(url.hostname || '')) return false;
    if (url.searchParams.get('enablejsapi') !== '1') return false;
  } catch {
    return false;
  }
  try {
    const loaded = iframe.getAttribute('data-forum-iframe-loaded') === '1';
    const loadedSrc = normalizeExternalUrlForCompare(iframe.getAttribute('data-forum-loaded-src') || '');
    if (!loaded || loadedSrc !== src) return false;
  } catch {
    return false;
  }
  return true;
};

const scheduleYouTubeApiInitRetry = (iframe, reason = 'yt_api_wait') => {
  try {
    if (!(iframe instanceof HTMLIFrameElement) || !iframe.isConnected) return;
    const now = Date.now();
    const last = Number(iframe.getAttribute('data-forum-yt-api-retry-ts') || 0);
    if (last > 0 && now - last < 180) return;
    iframe.setAttribute('data-forum-yt-api-retry-ts', String(now));
    setTimeout(() => {
      try {
        if (!(iframe instanceof HTMLIFrameElement) || !iframe.isConnected) return;
        if (isUserPaused(iframe)) return;
        playMedia(iframe);
      } catch {}
    }, reason === 'yt_api_load_timeout' ? 260 : 160);
  } catch {}
};
    const initYouTubePlayer = async (iframe) => {
      if (!iframe || !(iframe instanceof HTMLIFrameElement)) return null;
      const expectedSrc = ensureYouTubeEmbedSrc(iframe.getAttribute('data-src') || iframe.getAttribute('src') || '');
      if (!isYouTubeIframeReadyForApi(iframe, expectedSrc)) {
        scheduleYouTubeApiInitRetry(iframe, 'yt_api_not_ready');
        return null;
      }
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
                  emitExternalVideoState(iframe, { ready: true, muted: desiredMuted(), paused: true });
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
                    emitExternalVideoState(iframe, { paused: false, muted: !!player?.isMuted?.() });
                    window.dispatchEvent(new CustomEvent('site-media-play', {
                      detail: { source: 'youtube', element: iframe }
                    }));
                  }
                  // LOOP: когда ролик закончился — стартуем заново без reload iframe
                  if (state === YT.PlayerState?.ENDED) {
                    emitExternalVideoState(iframe, { paused: true });
                    try { player?.seekTo?.(0, true); } catch {}
                    try { player?.playVideo?.(); } catch {}
                    return;
                  }
                  if (state === YT.PlayerState?.PAUSED) {
                    stopYtMutePoll(player);
                    emitExternalVideoState(iframe, { paused: true, muted: !!player?.isMuted?.() });
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
    const mediaDomOrder = new WeakMap();
    let mediaDomOrderSeq = 1;
    let coordinatorLastScrollTop = 0;
    let coordinatorScrollDirection = 1;
    const readCoordinatorScrollTop = () => {
      try {
        const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null;
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) return Number(scrollEl.scrollTop || 0);
      } catch {}
      try { return Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0); } catch {}
      return 0;
    };
    const updateCoordinatorScrollDirection = () => {
      const top = readCoordinatorScrollTop();
      const delta = top - Number(coordinatorLastScrollTop || 0);
      if (Math.abs(delta) > 2) coordinatorScrollDirection = delta > 0 ? 1 : -1;
      coordinatorLastScrollTop = top;
      return coordinatorScrollDirection || 1;
    };
    const getMediaDomOrder = (el) => {
      try {
        if (!(el instanceof Element)) return Number.MAX_SAFE_INTEGER;
        if (!mediaDomOrder.has(el)) mediaDomOrder.set(el, mediaDomOrderSeq++);
        return Number(mediaDomOrder.get(el) || Number.MAX_SAFE_INTEGER);
      } catch {
        return Number.MAX_SAFE_INTEGER;
      }
    };
    const getNearQueuePlacement = (el, dir = 1) => {
      try {
        const rect = el?.getBoundingClientRect?.();
        const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        if (!rect || viewportH <= 0) return { band: 9, top: 0, bottom: 0, order: getMediaDomOrder(el) };
        const top = Number(rect.top || 0);
        const bottom = Number(rect.bottom || 0);
        const inViewport = bottom > 0 && top < viewportH;
        if (dir < 0) {
          if (bottom <= viewportH * 0.9) return { band: 0, top, bottom, order: getMediaDomOrder(el) };
          if (inViewport) return { band: 1, top, bottom, order: getMediaDomOrder(el) };
          return { band: 2, top, bottom, order: getMediaDomOrder(el) };
        }
        if (top >= viewportH * 0.1) return { band: 0, top, bottom, order: getMediaDomOrder(el) };
        if (inViewport) return { band: 1, top, bottom, order: getMediaDomOrder(el) };
        return { band: 2, top, bottom, order: getMediaDomOrder(el) };
      } catch {
        return { band: 9, top: 0, bottom: 0, order: getMediaDomOrder(el) };
      }
    };
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
    const NATIVE_EARLY_PRIME_HOLD_MS = isIOSUi ? 3600 : (isCoarseUi ? 2800 : 1600);
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
    const isEmergencyHtmlMediaUnloadReason = (reason = 'timeout') => {
      const next = String(reason || 'timeout');
      return (
        next === 'cleanup' ||
        next === 'resident_cap' ||
        next === 'error_blocked' ||
        next === 'forceHardUnload' ||
        next === 'native_warm_owner_lost'
      );
    };
    const isSoftPostVideoUnloadReason = (reason = 'timeout') => {
      const next = String(reason || 'timeout');
      if (
        next === 'timeout' ||
        next === 'out_of_view' ||
        next === 'focus_switch' ||
        next === 'below_stop_ratio' ||
        next === 'candidate_replace' ||
        next === 'native_prewarm_replace'
      ) {
        return true;
      }
      return next.endsWith('_external_play');
    };
    const isConnectedPostVideoOwner = (el) => {
      try {
        const media = getMediaStateNode(el);
        return (
          media instanceof HTMLVideoElement &&
          media.isConnected &&
          isManagedForumVideoKind(media) &&
          String(media?.getAttribute?.('data-forum-media') || '') === 'video'
        );
      } catch {
        return false;
      }
    };
    const setPendingHardUnload = (el, next = false) => {
      const applyFlag = (node) => {
        if (!(node instanceof Element) || !node.dataset) return;
        try {
          if (next) node.dataset.__pendingHardUnload = '1';
          else delete node.dataset.__pendingHardUnload;
        } catch {}
      };
      try {
        const media = getMediaStateNode(el);
        const owner = getOwnerNode(el) || (el instanceof Element ? el : null);
        applyFlag(media);
        if (owner !== media) applyFlag(owner);
      } catch {}
    };

    const cancelUnload = (el) => {
      const id = unloadTimers.get(el);
      if (id) clearTimeout(id);
      unloadTimers.delete(el);
      setPendingHardUnload(el, false);
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
        const managedNativeForumVideo =
          el instanceof HTMLVideoElement &&
          isManagedForumVideoKind(el) &&
          String(el.getAttribute?.('data-forum-media') || '') === 'video';
        if (managedNativeForumVideo) {
          // Coordinator-driven pause is a lifecycle transition, not a user pause.
          // Keeping suppression here blocks the reverse/forward runway prewarm and
          // causes late first frames plus retry load/play cycles on mobile.
          clearSuppressedPlayback(el);
        } else {
          markSuppressedPlayback(el, 1400);
        }
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
        try { emitExternalVideoState(el, { paused: true }); } catch {}
        try { stopYtMutePoll(player); } catch {}
        return;
      }
      if (kind === 'tiktok' || kind === 'iframe') {
        markSuppressedPlayback(el, 1400);
      try { commandExternalVideo(el, 'pause'); } catch {}
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
        const managedNativeForumVideo =
          node instanceof HTMLVideoElement &&
          isManagedForumVideoKind(node) &&
          String(node.getAttribute?.('data-forum-media') || '') === 'video';
        if (managedNativeForumVideo) {
          clearSuppressedPlayback(node);
          try {
            const owner = getOwnerNode(node);
            if (owner instanceof Element) clearSuppressedPlayback(owner);
          } catch {}
        } else {
          markSuppressedPlayback(node, 1200);
          try {
            const owner = getOwnerNode(node);
            if (owner instanceof Element) markSuppressedPlayback(owner, 1200);
          } catch {}
        }
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
      const emergencyHtmlMediaUnload = isEmergencyHtmlMediaUnloadReason(unloadReason);
      const connectedPostVideoOwner = isConnectedPostVideoOwner(el);
      trace(
        connectedPostVideoOwner && !emergencyHtmlMediaUnload && isSoftPostVideoUnloadReason(unloadReason)
          ? 'soft_post_video_unload'
          : 'hard_unload',
        el,
        { reason: unloadReason },
      );
      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        invalidatePlayRequest(el);
        try { el.dataset.__coordinatorUnloadUntil = String(Date.now() + 2500); } catch {}
        try {
          const forceHard =
            emergencyHtmlMediaUnload ||
            String(el?.dataset?.__forceHardUnload || '') === '1';
          const detachHard = forceHard && unloadReason !== 'native_warm_owner_lost';
          if (detachHard) el.dataset.__forceHardUnload = '1';
          else delete el.dataset.__forceHardUnload;
          if (detachHard) el.dataset.__pendingHardUnload = '1';
          else delete el.dataset.__pendingHardUnload;
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
        try { delete el.dataset.__pendingHardUnload; } catch {}
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
        .filter((frame) => {
          if (frame === keepEl) return false;

          try {
            const visiblePx = getOwnerVisiblePx(frame);
            if (visiblePx > 48) return false;

            if (isNearViewportElement(frame, isIOSUi ? 1200 : (isCoarseUi ? 980 : 1100))) {
              return false;
            }
          } catch {}

          return true;
        })
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
      const emergencyHtmlMediaUnload = isEmergencyHtmlMediaUnloadReason(reason);
      setPendingHardUnload(el, emergencyHtmlMediaUnload);
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

        try {
          const visiblePx = getOwnerVisiblePx(el);
          const nearVisible = isNearViewportElement(
            el,
            isIOSUi ? 1200 : (isCoarseUi ? 980 : 1100),
          );
          const protectedReason = !emergencyHtmlMediaUnload;

          if (protectedReason && (visiblePx > 48 || nearVisible)) {
            if (isIframeLike(el)) {
              trace('hard_unload_skip_visible_iframe', el, { reason, visiblePx });
              return;
            }

            if (shouldRetainHtmlMedia(el)) {
              trace('hard_unload_skip_visible_html_media', el, { reason, visiblePx });
              return;
            }
          }

          if (
            emergencyHtmlMediaUnload &&
            reason !== 'cleanup' &&
            reason !== 'forceHardUnload' &&
            isConnectedPostVideoOwner(el)
          ) {
            const media = getMediaStateNode(el);
            const gapPx = getOwnerViewportGapPx(el);
            const nearPostSurface =
              visiblePx > 0 ||
              gapPx <= (isIOSUi ? 1700 : (isCoarseUi ? 1500 : 980));
            if (nearPostSurface) {
              setPendingHardUnload(el, false);
              try {
                if (media?.dataset) {
                  delete media.dataset.__forceHardUnload;
                  delete media.dataset.__pendingHardUnload;
                  media.dataset.__resident = '1';
                  media.dataset.__prewarm = '0';
                  media.dataset.__loadPending = '0';
                  if (Number(media.readyState || 0) >= 2) media.dataset.__warmReady = '1';
                }
              } catch {}
              try {
                if (media instanceof HTMLMediaElement && !media.paused) {
                  withSystemPause(media, () => {
                    try { media.pause?.(); } catch {}
                  });
                }
                if (media instanceof HTMLVideoElement) media.preload = 'metadata';
              } catch {}
              trace('hard_unload_softened_visible_post_video', media || el, {
                reason,
                visiblePx,
                gapPx,
              });
              return;
            }
          }
        } catch {}

        if (!isIframeLike(el) && shouldRetainHtmlMedia(el)) {
          trace('hard_unload_skip_retained', el, { reason });
          return;
        }
        hardUnloadMedia(el, reason);
      }, delay);
      unloadTimers.set(el, id);
    };
    const getOwnerViewportGapPx = (el) => {
      try {
        const owner = getOwnerNode(el) || (el instanceof Element ? el : null);
        if (!(owner instanceof Element)) return Number.POSITIVE_INFINITY;
        const rect = owner.getBoundingClientRect?.();
        if (!rect) return Number.POSITIVE_INFINITY;
        const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        if (rect.bottom < 0) return Math.abs(Number(rect.bottom || 0));
        if (rect.top > viewportH) return Number(rect.top || 0) - viewportH;
        return 0;
      } catch {
        return Number.POSITIVE_INFINITY;
      }
    };

    const getNativePrewarmGapLimit = () => {
      const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
      // Prewarm must begin before the card is visible, but only one/two managed
      // native pipelines are allowed to keep src, so this wider runway does not
      // grow into a Range/decoder storm.
      if (isIOSUi) return Math.max(900, Math.min(1580, Math.round(viewportH * 1.36)));
      if (isCoarseUi) return Math.max(720, Math.min(1240, Math.round(viewportH * 1.08)));
      return Math.max(320, Math.min(620, Math.round(viewportH * 0.58)));
    };

const getNativePrimeGapLimit = () => {
  const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
  // Real decode/play priming is still close to the viewport, but must happen
  // before intersection so iPhone enters Viewport with a decoded first frame.
  if (isIOSUi) return Math.max(640, Math.min(1120, Math.round(viewportH * 0.92)));
  if (isCoarseUi) return Math.max(440, Math.min(780, Math.round(viewportH * 0.7)));
  return Math.max(160, Math.min(340, Math.round(viewportH * 0.32)));
};

const getNativeEarlyPrimeGapLimit = () => {
  const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
  if (isIOSUi) return Math.max(820, Math.min(1420, Math.round(viewportH * 1.18)));
  if (isCoarseUi) return Math.max(560, Math.min(980, Math.round(viewportH * 0.86)));
  return Math.max(getNativePrimeGapLimit(), Math.min(440, Math.round(viewportH * 0.42)));
};

    const isNativePostVideoCandidate = (el) => {
      try {
        const media = getMediaStateNode(el);
        return (
          media instanceof HTMLVideoElement &&
          isManagedForumVideoKind(media) &&
          String(media?.getAttribute?.('data-forum-media') || '') === 'video'
        );
      } catch {
        return false;
      }
    };

    const getNativePrewarmPipelineState = (el) => {
      const media = getMediaStateNode(el);
      const state = {
        media,
        hasSrc: false,
        ready: false,
        loading: false,
        loadPending: false,
        pendingForMs: 0,
      };
      if (!(media instanceof HTMLVideoElement)) return state;
      try {
        state.hasSrc = !!String(media.getAttribute?.('src') || media.currentSrc || '').trim();
        state.ready = Number(media.readyState || 0) >= 2 || String(media.dataset?.__warmReady || '') === '1';
        state.loadPending = String(media.dataset?.__loadPending || '') === '1';
        const since = Number(media.dataset?.__loadPendingSince || 0);
        state.pendingForMs = since > 0 ? Date.now() - since : 0;
        const networkState = Number(media.networkState || 0);
        state.loading =
          state.hasSrc &&
          (
            state.ready ||
            state.loadPending ||
            networkState === HTMLMediaElement.NETWORK_LOADING ||
            Number(media.readyState || 0) >= 1
          );
      } catch {}
      return state;
    };

    const isNativePrewarmEligible = (el) => {
      try {
        const media = getMediaStateNode(el);
        if (!(media instanceof HTMLVideoElement)) return false;
        if (!media.isConnected) return false;
        if (isUserPaused(media) || isUserPaused(el)) return false;
        if (isMediaSrcBlocked(media)) return false;
        const visiblePx = getOwnerVisiblePx(media);
        const centerDist = getOwnerCenterDist(media);
        const gapPx = getOwnerViewportGapPx(media);
        const startDist = getPriorityCenterMaxDist(media);
        if (visiblePx > 0 && centerDist <= Math.max(180, startDist + (isIOSUi ? 160 : 120))) return true;
        return gapPx <= getNativePrewarmGapLimit();
      } catch {
        return false;
      }
    };
    const isActiveNativeOwner = (media, owner = null) => {
      try {
        if (!(media instanceof HTMLVideoElement)) return false;
        const targetOwner = owner instanceof Element ? owner : getOwnerNode(media);
        if (!(targetOwner instanceof Element)) return false;
        return !!(active && (
          active === media ||
          active === targetOwner ||
          active.contains?.(media) ||
          active.contains?.(targetOwner) ||
          media.contains?.(active) ||
          targetOwner.contains?.(active)
        ));
      } catch {
        return false;
      }
    };

    const scheduleNativePauseRecovery = (media, owner = null, reason = 'native_pause_recover') => {
      try {
        if (!(media instanceof HTMLVideoElement)) return false;
        if (!media.isConnected) return false;
        if (isUserPaused(media) || hasSuppressedPlayback(media)) return false;

        const targetOwner = owner instanceof Element ? owner : getOwnerNode(media);
        if (!(targetOwner instanceof Element)) return false;
        if (!isActiveNativeOwner(media, targetOwner)) return false;

        const now = Date.now();
        const prev = nativePauseRecovery.get(media) || { ts: 0, count: 0, timer: 0 };
        const windowMs = isIOSUi ? 9000 : 7000;
        const nextCount = prev.ts > 0 && (now - prev.ts) < windowMs
          ? Number(prev.count || 0) + 1
          : 1;

        if (nextCount > (isIOSUi ? 3 : 2)) {
          trace('pause_recover_active_native_skip_limit', media, { reason, count: nextCount });
          return false;
        }

        try { if (prev.timer) clearTimeout(prev.timer); } catch {}

        const delay = isIOSUi ? 140 : (isCoarseUi ? 120 : 90);
        const timer = setTimeout(() => {
          try {
            const currentOwner = getOwnerNode(media);
            if (!(currentOwner instanceof Element)) return;
            if (!isActiveNativeOwner(media, currentOwner)) return;
            if (isUserPaused(media) || hasSuppressedPlayback(media)) return;
            if (!media.paused) return;

            const visiblePxNow = getOwnerVisiblePx(currentOwner);
            const centerDistNow = getOwnerCenterDist(currentOwner);
            if (visiblePxNow < Math.max(44, Math.round(getAutoplayMinVisiblePx(currentOwner) * 0.56))) return;
            if (centerDistNow > Math.max(200, getPriorityCenterMaxDist(currentOwner) + (isIOSUi ? 130 : 80))) return;

            trace('pause_recover_active_native_retry', media, {
              reason,
              count: nextCount,
              visiblePx: visiblePxNow,
              centerDist: centerDistNow,
            });

            clearSuppressedPlayback(media);
            clearSuppressedPlayback(currentOwner);
            markCoordinatorPlayIntent(media, isIOSUi ? 2600 : 2200);
            markCoordinatorPlayIntent(currentOwner, isIOSUi ? 2600 : 2200);
            cancelUnload(currentOwner);
            playMedia(currentOwner);
          } catch {} finally {
            try { nativePauseRecovery.delete(media); } catch {}
          }
        }, delay);

        nativePauseRecovery.set(media, { ts: now, count: nextCount, timer });
        return true;
      } catch {
        return false;
      }
    };
    const getNativeWarmOwnerLostDelay = (media) => {
      try {
        const now = Date.now();
        const visiblePx = getOwnerVisiblePx(media);
        const gapPx = getOwnerViewportGapPx(media);
        const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        const holdUntil = Number(media?.dataset?.__nativePrimeHoldUntil || 0);
        const holdLeft = holdUntil > now ? holdUntil - now : 0;
        const nearOneCard =
          visiblePx > 0 ||
          gapPx <= Math.max(
            getNativePrimeGapLimit(),
            Math.round(viewportH * (isIOSUi ? 1.05 : (isCoarseUi ? 0.92 : 0.72))),
          );
        const runwayDelay = nearOneCard
          ? (isIOSUi ? 900 : (isCoarseUi ? 760 : 520))
          : (isIOSUi ? 360 : (isCoarseUi ? 300 : 240));
        return Math.max(runwayDelay, Math.min(holdLeft, isIOSUi ? 1100 : (isCoarseUi ? 900 : 650)));
      } catch {
        return isIOSUi ? 900 : (isCoarseUi ? 760 : 560);
      }
    };
    const releaseNativePrewarmExcept = (keepEl = null, reason = 'native_prewarm_replace') => {
      try {
        const prev = nativePrewarmEl;
        if (!(prev instanceof HTMLVideoElement)) return;
        if (keepEl && prev === keepEl) return;
        if (active && (active === prev || active.contains?.(prev) || prev.contains?.(active))) return;
        nativePrewarmEl = null;
        try {
          prev.dataset.__prewarm = '0';
          prev.dataset.__resident = '0';
          prev.dataset.__nativePrewarm = '0';
        } catch {}

        // Keep one strict warm owner, but do not tear down the previous source
        // inside the one-card mobile runway: it is the window where first frames
        // are most often reused during small scroll corrections.
        scheduleHardUnload(prev, getNativeWarmOwnerLostDelay(prev), 'native_warm_owner_lost');
      } catch {}
    };

    const primeNativeFirstFrame = (el, reason = 'native_prime') => {
      const media = getMediaStateNode(el);
      if (!(media instanceof HTMLVideoElement)) return false;
      if (!(isIOSUi || isCoarseUi)) return false;
      if (Number(media.readyState || 0) >= 2) return true;
      if (isUserPaused(media) || hasSuppressedPlayback(media)) return false;

      const visiblePx = getOwnerVisiblePx(media);
      const gapPx = getOwnerViewportGapPx(media);
      const primeLimit = getNativePrimeGapLimit();
      const earlyPrimeLimit = getNativeEarlyPrimeGapLimit();
      const owner = getOwnerNode(media);
      const activeOwnerNow = active instanceof Element ? active : null;
      const ownerMatchesActiveNow = !!(activeOwnerNow && owner instanceof Element && (
        activeOwnerNow === owner ||
        activeOwnerNow.contains?.(owner) ||
        owner.contains?.(activeOwnerNow)
      ));
      const reasonLooksWarmup = /prewarm|candidate|early|predictive|near|priority/i.test(String(reason || ''));
      const warmupOnlyPrime =
        !ownerMatchesActiveNow &&
        !hasUserGestureIntent(media) &&
        !hasCoordinatorPlayIntent(media) &&
        reasonLooksWarmup;
      const allowedPrimeGap = warmupOnlyPrime ? earlyPrimeLimit : primeLimit;
      if (visiblePx <= 0 && gapPx > allowedPrimeGap) {
        trace('native_prime_skip_far_offscreen', media, {
          reason,
          warmupOnlyPrime,
          gapPx,
          primeLimit,
          earlyPrimeLimit,
        });
        return false;
      }
      const activeKind = (() => {
        try { return String(activeOwnerNow?.getAttribute?.('data-forum-media') || ''); } catch { return ''; }
      })();
      const activeHasNativePostVideo = (() => {
        try {
          return !!(
            activeOwnerNow instanceof Element &&
            activeOwnerNow.querySelector?.(managedForumVideoSelector)
          );
        } catch {
          return false;
        }
      })();
      const allowHiddenWarmupPrime =
        warmupOnlyPrime &&
        (isIOSUi || isCoarseUi) &&
        (!activeOwnerNow || !activeKind || activeHasNativePostVideo);

      // Mobile WebKit/Chrome often allow only one real playing media pipeline.
      // Prewarm may attach src/load, but it must not play-prime while splash, BG audio,
      // QCast, Ads, YouTube bridge or another native video is already playing.
      const foreignPlaying = (() => {
        try {
          return Array.from(document.querySelectorAll('video,audio')).some((node) => {
            if (!(node instanceof HTMLMediaElement)) return false;
            if (node === media) return false;
            if (node.paused || node.ended) return false;
            if (owner instanceof Element && owner.contains?.(node)) return false;
            return Number(node.readyState || 0) >= 2;
          });
        } catch {
          return false;
        }
      })();

      const foreignPlaybackBlocksPrime = foreignPlaying && !allowHiddenWarmupPrime;
      if (!ownerMatchesActiveNow && (foreignPlaybackBlocksPrime || (activeOwnerNow instanceof Element && !allowHiddenWarmupPrime))) {
        trace('native_prime_skip_active_playing', media, {
          reason,
          warmupOnlyPrime,
          foreignPlaying,
          allowHiddenWarmupPrime,
          activeKind,
          gapPx,
          visiblePx,
        });
        return false;
      }
const now = Date.now();
const lastPrimeTs = Number(media.dataset?.__nativePrimeTs || 0);
// iOS prime now starts earlier, so allow one safe retry before the card reaches
// viewport if WebKit rejected or stalled the first muted decode tick.
if (lastPrimeTs > 0 && (now - lastPrimeTs) < (isIOSUi ? 1800 : 1800)) return false;
if (String(media.dataset?.__nativePrimePending || '') === '1') return true;
if (!canStartNativePrimeForSrc(media, reason, warmupOnlyPrime)) return false;
      const wantedMutedBeforePrime = desiredMuted();
      try {
        media.dataset.__nativePrimeTs = String(now);
        media.dataset.__nativePrimePending = '1';
        media.dataset.__nativePrimeReason = String(reason || 'native_prime');
        media.dataset.__nativePrimeWarmupOnly = warmupOnlyPrime ? '1' : '0';
      } catch {}

      try { markSkipMutePersist(media, 2600); } catch {}
      try {
        media.muted = true;
        media.defaultMuted = true;
        media.setAttribute('muted', '');
        media.playsInline = true;
        media.setAttribute('playsinline', '');
        media.setAttribute('webkit-playsinline', '');
        media.preload = 'auto';
      } catch {}

      try { markCoordinatorPlayIntent(media, warmupOnlyPrime ? (isIOSUi ? 1800 : 1400) : (isIOSUi ? 1800 : 1500)); } catch {}

      const rememberPrimeReady = (holdMs = 0) => {
        let ready = false;
        try {
          ready = Number(media.readyState || 0) >= 2;
          if (ready) {
            media.dataset.__warmReady = '1';
            media.dataset.__loadPending = '0';
            delete media.dataset.__loadPendingSince;
            media.dataset.__nativePrimeReadyTs = String(Date.now());
          }
          if (holdMs > 0) {
            const until = Date.now() + holdMs;
            const prevUntil = Number(media.dataset?.__nativePrimeHoldUntil || 0);
            media.dataset.__nativePrimeHoldUntil = String(Math.max(prevUntil, until));
            media.dataset.__resident = '1';
            media.dataset.__prewarm = '1';
          }
        } catch {}
        return ready;
      };

let primeFinished = false;
const finishPrime = (state = 'done') => {
  if (primeFinished) return;
  primeFinished = true;
  try { finishNativePrimeForSrc(media, state); } catch {}
  try { media.dataset.__nativePrimePending = '0'; } catch {}
  try {
    const holdMs = warmupOnlyPrime ? NATIVE_EARLY_PRIME_HOLD_MS : 0;
          const warmedReady = rememberPrimeReady(holdMs);
          const stillActive = !!(active && (active === media || active.contains?.(media) || media.contains?.(active)));
          const nowVisiblePx = getOwnerVisiblePx(media);
          const nowCenterDist = getOwnerCenterDist(media);
          const shouldKeepPlaying =
            stillActive ||
            (
              !warmupOnlyPrime &&
              nowVisiblePx >= getAutoplayMinVisiblePx(media) &&
              nowCenterDist <= getPriorityCenterMaxDist(media)
            );
          if (!shouldKeepPlaying && !media.paused) {
            withSystemPause(media, () => {
              try { media.pause?.(); } catch {}
            });
          }
          if (!shouldKeepPlaying && warmupOnlyPrime && warmedReady) {
            try { media.preload = 'metadata'; } catch {}
          }
          if (warmupOnlyPrime && warmedReady) {
            try { enforcePostNativeSrcCap(media, 'native_prime_finish'); } catch {}
          }
          if (!shouldKeepPlaying && wantedMutedBeforePrime === false && media.paused) {
            try { markSkipMutePersist(media, 900); } catch {}
            try {
              media.muted = false;
              media.defaultMuted = false;
              media.removeAttribute('muted');
            } catch {}
          }
          trace('native_prime_finish', media, { reason, state, readyState: Number(media.readyState || 0) });
        } catch {}
      };

      if (warmupOnlyPrime && visiblePx <= 0) {
        try {
          media.dataset.__nativePrimeSkipped = '0';
          media.dataset.__nativePrimeOffscreen = '1';
          media.dataset.__resident = '1';
          media.dataset.__prewarm = '1';
        } catch {}
        trace('native_prime_offscreen_warmup_play', media, {
          reason,
          gapPx,
          visiblePx,
          earlyPrimeLimit,
        });
      }

      try {
const p = media.play?.();
if (p && typeof p.then === 'function') {
  p.then(() => {
    let frameCallbackArmed = false;
    if (warmupOnlyPrime && typeof media.requestVideoFrameCallback === 'function') {
      try {
        frameCallbackArmed = true;
        media.requestVideoFrameCallback(() => {
          setTimeout(() => finishPrime('first_frame'), isIOSUi ? 48 : 32);
        });
      } catch {
        frameCallbackArmed = false;
      }
    }
    const holdDelay = warmupOnlyPrime ? (isIOSUi ? 640 : 380) : (isIOSUi ? 180 : 110);
    setTimeout(() => finishPrime(frameCallbackArmed ? 'played_timeout' : 'played'), holdDelay);
  }).catch((err) => {
    try { finishNativePrimeForSrc(media, 'reject'); } catch {}
    try { media.dataset.__nativePrimePending = '0'; } catch {}
    trace('native_prime_reject', media, {
      reason,
      name: String(err?.name || ''),
      message: String(err?.message || ''),
    });
  });
} else {
  setTimeout(() => finishPrime('sync_play'), 120);
}
return true;
      } catch (err) {
        try { finishNativePrimeForSrc(media, 'throw'); } catch {}
        try { media.dataset.__nativePrimePending = '0'; } catch {}
        trace('native_prime_throw', media, { reason, message: String(err?.message || err || '') });
        return false;
      }
    };

    const prepareNativePriorityPrewarm = (el, reason = 'native_priority_prewarm') => {
      const media = getMediaStateNode(el);
      if (!(media instanceof HTMLVideoElement)) return false;
      if (!isNativePostVideoCandidate(media)) return false;
      if (!isNativePrewarmEligible(media)) return false;
      if (isUserPaused(media) || hasSuppressedPlayback(media)) return false;
      const prev = nativePrewarmEl;
      if (prev instanceof HTMLVideoElement && prev !== media && prev.isConnected && !isActiveNativeOwner(prev)) {
        const now = Date.now();
        const age = now - Number(nativePrewarmTs || 0);
        const prevGap = getOwnerViewportGapPx(prev);
        const nextGap = getOwnerViewportGapPx(media);
        const prevVisible = getOwnerVisiblePx(prev);
        const nextVisible = getOwnerVisiblePx(media);
        const prevPipeline = getNativePrewarmPipelineState(prev);
        const prevStillInRunway =
          prevVisible > 0 ||
          prevGap <= Math.round(getNativePrewarmGapLimit() * (isIOSUi ? 1.18 : 1.12));
        const nextInFocusRunway =
          nextVisible > Math.max(46, Math.round(getStartVisiblePx(media) * 0.44)) ||
          nextGap <= Math.max(getNativeEarlyPrimeGapLimit(), isIOSUi ? 520 : 420);
        const nextClearlyBetter =
          nextVisible > Math.max(0, prevVisible + 36) ||
          nextGap + (isIOSUi ? 180 : 140) < prevGap ||
          getOwnerCenterDist(media) + (isIOSUi ? 120 : 90) < getOwnerCenterDist(prev);
        const holdLoadingPrev =
          prevPipeline.loading &&
          !prevPipeline.ready &&
          prevStillInRunway &&
          (!nextInFocusRunway || !nextClearlyBetter) &&
          age < (isIOSUi ? 7200 : (isCoarseUi ? 6200 : 5200));
        if (holdLoadingPrev) {
          trace('native_prewarm_hold_loading_slot', prev, {
            reason,
            age,
            prevGap,
            nextGap,
            prevVisible,
            nextVisible,
            pendingForMs: prevPipeline.pendingForMs,
          });
          return true;
        }
        const canHoldPrev =
          age < (isIOSUi ? 2400 : (isCoarseUi ? 1900 : 1600)) &&
          isNativePrewarmEligible(prev) &&
          !nextClearlyBetter;
        if (canHoldPrev) {
          trace('native_prewarm_keep_existing', prev, {
            reason,
            age,
            prevGap,
            nextGap,
            prevVisible,
            nextVisible,
          });
          return true;
        }
      }
      releaseNativePrewarmExcept(media, 'native_prewarm_replace');

      try {
        applyMutedPref(media);
        media.playsInline = true;
        media.setAttribute('playsinline', '');
        media.setAttribute('webkit-playsinline', '');
        media.dataset.__resident = '1';
        media.dataset.__prewarm = '1';
        media.dataset.__nativePrewarm = '1';
        media.dataset.__nativePrewarmReason = String(reason || 'native_priority_prewarm');
        media.preload = 'auto';
      } catch {}

      nativePrewarmEl = media;
      nativePrewarmTs = Date.now();
      try { enforcePostNativeSrcCap(media, 'native_prewarm_claim'); } catch {}

      if (Number(media.readyState || 0) >= 2 || String(media.dataset?.__warmReady || '') === '1') {
        trace('native_prewarm_ready', media, { reason });
        return true;
      }

      const alreadyLoadingOrBuffered = (() => {
        try {
          const hasSrc = !!String(media.getAttribute?.('src') || media.currentSrc || '').trim();
          const networkState = Number(media.networkState || 0);
          const loadPending = String(media.dataset?.__loadPending || '') === '1';
          return hasSrc && (
            loadPending ||
            networkState === HTMLMediaElement.NETWORK_LOADING ||
            Number(media.readyState || 0) >= 1
          );
        } catch {
          return false;
        }
      })();

      if (alreadyLoadingOrBuffered) {
        trace('native_prewarm_keep_loading', media, {
          reason,
          readyState: Number(media.readyState || 0),
          networkState: Number(media.networkState || 0),
          gapPx: getOwnerViewportGapPx(media),
          visiblePx: getOwnerVisiblePx(media),
        });
        armReadyReplay(media);
        return true;
      }

      const kicked = kickMediaLoad(media, {
        channel: 'native_priority_prewarm',
        minGapMs: isIOSUi ? 720 : (isCoarseUi ? 820 : 980),
        burstWindowMs: isIOSUi ? 18000 : 16000,
        burstLimit: isIOSUi ? 3 : 3,
        blockMs: isIOSUi ? 6200 : 5600,
        bypassSrcLimiter: isAdMediaElement(media),
        bypassPendingBudget: false,
      });

      if (!kicked && String(media.dataset?.__loadPending || '') !== '1') {
        trace('native_prewarm_kick_skip', media, { reason });
        return false;
      }

      trace('native_prewarm_kick', media, {
        reason,
        kicked,
        gapPx: getOwnerViewportGapPx(media),
        visiblePx: getOwnerVisiblePx(media),
        centerDist: getOwnerCenterDist(media),
      });

      if (!primeNativeFirstFrame(media, reason)) {
        trace('native_prewarm_prime_deferred', media, {
          reason,
          readyState: Number(media.readyState || 0),
          networkState: Number(media.networkState || 0),
          gapPx: getOwnerViewportGapPx(media),
          visiblePx: getOwnerVisiblePx(media),
        });
      }
      armReadyReplay(media);
      return true;
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
    const ensureYouTubeEmbedSrc = (src) => normalizeYouTubeEmbedSrc(src);
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
          : (kind === 'tiktok' ? ensureTikTokPlayerSrc(raw) : ensureIframeLoopParam(raw));
      if (!nextSrc) return false;
      try {
        if (el.getAttribute('data-src') !== nextSrc) el.setAttribute('data-src', nextSrc);
      } catch {}
      let hadSrc = false;
      let curSrc = '';
      try {
        curSrc = String(el.getAttribute('src') || '').trim();
        hadSrc = !!curSrc;
      } catch {}
      if (!hadSrc || curSrc !== nextSrc) {
        try {
          el.setAttribute('data-forum-iframe-loaded', '0');
          el.removeAttribute('data-forum-loaded-src');
          el.setAttribute('src', nextSrc);
        } catch {}
      }
      try { el.setAttribute('data-forum-last-active-ts', String(now)); } catch {}
      try { el.setAttribute('data-forum-prewarm-ts', String(now)); } catch {}
      try { enforceIframeResidentCap(el); } catch {}
      trace('iframe_prewarm', el, { kind, reason, hadSrc });
      emitMediaDiag('iframe_prewarm', { kind, reason, hadSrc, ...getIframeSnapshot() });
      return !!String(el.getAttribute('src') || '').trim();
};

const waitExternalIframeLoad = (iframe, expectedSrc = '', timeoutMs = 1400) => {
  if (!(iframe instanceof HTMLIFrameElement)) return Promise.resolve(false);
  const src = String(expectedSrc || iframe.getAttribute('src') || '').trim();
  if (!src) return Promise.resolve(false);
  try {
    const loaded = iframe.getAttribute('data-forum-iframe-loaded') === '1';
    const loadedSrc = String(iframe.getAttribute('data-forum-loaded-src') || '').trim();
    if (loaded && loadedSrc === src) return Promise.resolve(true);
  } catch {}
  return new Promise((resolve) => {
    let done = false;
    let timer = 0;
    const finish = (ok) => {
      if (done) return;
      done = true;
      try { if (timer) clearTimeout(timer); } catch {}
      try { iframe.removeEventListener('load', onLoad); } catch {}
      resolve(!!ok);
    };
    const onLoad = () => {
      try {
        iframe.setAttribute('data-forum-iframe-loaded', '1');
        iframe.setAttribute('data-forum-loaded-src', iframe.getAttribute('src') || src);
      } catch {}
      finish(true);
    };
    try { iframe.addEventListener('load', onLoad, { once: true }); } catch {}
    try { timer = setTimeout(() => finish(false), timeoutMs); } catch { finish(false); }
  });
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

const isPostNativeVideo =
  el instanceof HTMLVideoElement &&
  isManagedForumVideoKind(el);

if (el instanceof HTMLVideoElement) {
  const hasSrc = !!el.getAttribute('src');
  const isPostVideo = isPostNativeVideo;
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
        minGapMs: isIOSUi ? 1100 : (isCoarseUi ? 950 : 900),
        burstWindowMs: isIOSUi ? 18000 : 14000,
        burstLimit: isIOSUi ? 4 : 5,
        blockMs: isIOSUi ? 8000 : 6500,
        // Focus/play is the user-visible path. It must not be blocked by a stale
        // global source-key budget left from previous slots using the same MP4.
        bypassSrcLimiter: true,
        bypassPendingBudget: true,
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

    const canNativeAutoplayKick =
      el instanceof HTMLVideoElement &&
      !isUserPaused(el) &&
      !hasSuppressedPlayback(el);

    if (canNativeAutoplayKick && el.paused) {
      const wantedMuted = desiredMuted();
      // If the user already enabled sound in this runtime session, try audible start.
      // If the browser rejects it, startHtmlMedia() will do a transient muted retry
      // without writing that fallback into the global sound document.
      trace(el.muted ? 'play_pending_muted' : 'play_pending_user_sound', el, { wantedMuted });
      startHtmlMedia(el, el.muted ? 'play_pending_muted' : 'play_pending_user_sound');
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
            try {
              if (keepManualQcastSound || keepUserUnmutedQcast) {
                writeQcastMutedPref(!!a.muted);
              }
            } catch {}
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
              if (a.paused && !isUserPaused(a) && !isUserPaused(el)) {
                startHtmlMedia(a, 'qcast_pending_play_kick');
              }
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
          let readyForYouTubeApi = false;
          if (ds && (!cur || cur !== ds)) {
            try {
              el.setAttribute('data-forum-iframe-loaded', '0');
              el.removeAttribute('data-forum-loaded-src');
            } catch {}
            el.setAttribute('src', ds);
            readyForYouTubeApi = await waitExternalIframeLoad(el, ds, isIOSUi ? 2200 : 1800);
          } else if (ds) {
            readyForYouTubeApi = await waitExternalIframeLoad(el, ds, 700);
          }
          if (ds && !readyForYouTubeApi && !isYouTubeIframeReadyForApi(el, ds)) {
            scheduleYouTubeApiInitRetry(el, 'yt_api_load_timeout');
            return;
          }
          el.setAttribute('data-forum-last-active-ts', String(Date.now()));
        } catch {}
        const player = await initYouTubePlayer(el);
        if (!player) return;
        try {
          const kickYoutube = () => {
            try { commandExternalVideo(el, 'play', { muted: desiredMuted() }); } catch {}
          };
          kickYoutube();
          scheduleExternalPlayKick(el, kickYoutube, 'youtube_viewport_autoplay');
          enforceIframeResidentCap(el);
          emitMediaDiag('iframe_play', { kind: 'youtube', ...getIframeSnapshot() });
        } catch {}
        return;
      }

      if (kind === 'tiktok' || kind === 'iframe') {
        // ВАЖНО: НЕ делаем force-reset на каждом "фокусе" — это и есть перезапуск при микроскролле.
        const rawSrc = el.getAttribute('data-src') || el.getAttribute('src') || '';
        const src = rawSrc ? ensureExternalVideoSrc(kind, rawSrc) : '';
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
        const kickExternalFrame = () => {
        try { commandExternalVideo(el, 'play', { muted: desiredMuted() }); } catch {}
        };
        kickExternalFrame();
        scheduleExternalPlayKick(el, kickExternalFrame, `${kind}_viewport_autoplay`);
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
    const externalPlayKickTimers = new Map();
    const clearExternalPlayKick = (el) => {
      try {
        const id = externalPlayKickTimers.get(el);
        if (id) clearTimeout(id);
        externalPlayKickTimers.delete(el);
      } catch {}
    };
    const isExternalKickAllowed = (el) => {
      try {
        if (!(el instanceof Element) || !el.isConnected) return false;
        const kind = getMediaKind(el);
        if (kind !== 'youtube' && kind !== 'tiktok' && kind !== 'iframe') return false;
        if (active && active !== el) return false;
        return isStartableCandidate(el, Number(ratios.get(el) || 0), getOwnerVisiblePx(el), getOwnerCenterDist(el));
      } catch {
        return false;
      }
    };
    const scheduleExternalPlayKick = (el, runner, reason = 'external_viewport_kick') => {
      try {
        if (!(el instanceof Element) || typeof runner !== 'function') return;
        clearExternalPlayKick(el);
        let count = 0;
        const maxCount = isIOSUi ? 9 : (isCoarseUi ? 7 : 5);
        const delayMs = isIOSUi ? 320 : (isCoarseUi ? 360 : 420);
        const tick = () => {
          if (!isExternalKickAllowed(el)) {
            clearExternalPlayKick(el);
            return;
          }
          count += 1;
          traceCandidate('external_focus_play_kick', el, { reason, count });
          try { runner(); } catch {}
          if (count >= maxCount) {
            clearExternalPlayKick(el);
            return;
          }
          const id = setTimeout(tick, delayMs);
          externalPlayKickTimers.set(el, id);
        };
        tick();
      } catch {}
    };
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
            const isNativeCandidate = isNativePostVideoCandidate(candidate);
            const externalRunwayPx = isIOSUi ? 520 : (isCoarseUi ? 440 : 360);
            const externalVisibleGate = Math.max(
              36,
              Math.round(getStartVisiblePx(candidate) * (isIOSUi ? 0.42 : 0.5))
            );
            const externalCanPrepare =
              !isExternalCandidate ||
              (
                visiblePx >= externalVisibleGate ||
                (
                  getOwnerViewportGapPx(candidate) <= externalRunwayPx &&
                  centerDist <= getPriorityCenterMaxDist(candidate) + externalRunwayPx
                )
              );
            const prepared = isNativeCandidate
              ? prepareNativePriorityPrewarm(candidate, 'early_native_candidate')
              : (
                  externalCanPrepare
                    ? (
                        isExternalCandidate
                          ? prepareExternalMedia(candidate, 'early_prewarm')
                          : ensurePendingHtmlMediaReady(candidate, 'early_prewarm')
                      )
                    : false
                );
            traceCandidate('candidate_early_prewarm', candidate, {
              ratio,
              score,
              visiblePx,
              centerDist,
              threshold: PREWARM_RATIO,
              prepared,
              externalCanPrepare,
              isNativeCandidate,
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
            const candidateKind = getMediaKind(candidate);
            if (candidate instanceof HTMLVideoElement || candidateKind === 'video') return false;
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
              // External players (YouTube/TikTok/iframe) do not always produce another
              // IntersectionObserver tick right after src/API bootstrap. If we only
              // prepare and wait, autoplay can stay stuck. Start the active candidate now;
              // playMedia() will initialize YouTube API and then call playVideo().
              traceCandidate('candidate_external_activate_after_prepare', candidate, {
                ratio,
                score,
                visiblePx,
                centerDist,
                reason: 'external_prepared_play_now',
               });
              active = candidate;
              activeSinceTs = Date.now();
              cancelUnload(active);
              emitMediaDiag('media_focus_switch', { ratio, prevRatio: 0, score });
              playMedia(active);
              return;
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

      if (isNativePostVideoCandidate(el)) {
        const media = getMediaStateNode(el);
        const isActiveNative = !!(active && media && (active === media || active.contains?.(media) || media.contains?.(active)));
        if (isActiveNative && isReadyCandidate(media)) return false;
        return prepareNativePriorityPrewarm(media || el, reason === 'io_near_prewarm' ? 'native_near_prewarm' : reason);
      }

      if (kind === 'youtube' || kind === 'tiktok' || kind === 'iframe') {
        // External providers also participate in the same pipeline, but with a soft runway:
        // prepare iframe shortly before focus, not several cards away and not only after focus.
        const visiblePx = getOwnerVisiblePx(el);
        const centerDist = getOwnerCenterDist(el);
        const gapPx = getOwnerViewportGapPx(el);
        const startPx = getStartVisiblePx(el);
        const startCenter = getPriorityCenterMaxDist(el);
        const externalRunwayPx = isIOSUi ? 520 : (isCoarseUi ? 440 : 360);
        const externalVisibleGate = Math.max(36, Math.round(startPx * (isIOSUi ? 0.42 : 0.5)));
        const canPrepareExternal =
          visiblePx >= externalVisibleGate ||
          (gapPx <= externalRunwayPx && centerDist <= startCenter + externalRunwayPx);
        if (!canPrepareExternal) return false;

        return prepareExternalMedia(el, reason);
      }

      return ensurePendingHtmlMediaReady(el, reason);
    };

    let nativePrewarmScanRaf = 0;
    let nativePrewarmScanLastTs = 0;
    const pickPredictiveNativePrewarmTarget = (dir = 1) => {
      try {
        const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
        if (viewportH <= 0) return null;
        const runway = getNativePrewarmGapLimit();
        const nodes = Array.from(document.querySelectorAll(managedForumVideoSelector));
        const rows = nodes
          .map((node) => {
            if (!(node instanceof HTMLVideoElement)) return null;
            if (!node.isConnected) return null;
            if (isUserPaused(node) || hasSuppressedPlayback(node) || isMediaSrcBlocked(node)) return null;
            const owner = getOwnerNode(node) || node;
            if (!(owner instanceof Element)) return null;
            if (active && (active === node || active === owner || active.contains?.(node) || owner.contains?.(active))) {
              return null;
            }
            const rect = owner.getBoundingClientRect?.();
            if (!rect) return null;
            const top = Number(rect.top || 0);
            const bottom = Number(rect.bottom || 0);
            if (bottom < -Math.round(runway * 0.42) || top > viewportH + runway) return null;
            const visiblePx = Math.max(0, Math.min(bottom, viewportH) - Math.max(top, 0));
            const gapPx = getOwnerViewportGapPx(node);
            if (visiblePx <= 0 && gapPx > runway) return null;
            const ahead =
              dir < 0
                ? bottom <= viewportH * 0.94
                : top >= viewportH * 0.06;
            const inViewport = visiblePx > 0;
            const band = ahead ? 0 : (inViewport ? 1 : 2);
            const pipeline = getNativePrewarmPipelineState(node);
            const readyBonus = pipeline.ready ? -420 : 0;
            const pendingBonus = pipeline.loading ? -180 : 0;
            const distance = dir < 0
              ? Math.max(0, viewportH - bottom)
              : Math.max(0, top);
            const score =
              (band * 100000) +
              distance +
              (getOwnerCenterDist(node) * 0.18) -
              (visiblePx * 2.2) +
              readyBonus +
              pendingBonus +
              (getMediaDomOrder(owner) * 0.001);
            return { node, score, gapPx, visiblePx, top, bottom, band };
          })
          .filter(Boolean)
          .sort((a, b) => a.score - b.score);
        return rows[0] || null;
      } catch {
        return null;
      }
    };
    const scheduleNativePrewarmScan = (reason = 'predictive_native_scan') => {
      try {
        const now = Date.now();
        if (nativePrewarmScanRaf) return;
        if ((now - Number(nativePrewarmScanLastTs || 0)) < (isIOSUi ? 60 : 80)) return;
        nativePrewarmScanLastTs = now;
        nativePrewarmScanRaf = requestAnimationFrame(() => {
          nativePrewarmScanRaf = 0;
          const dir = updateCoordinatorScrollDirection();
          const picked = pickPredictiveNativePrewarmTarget(dir);
          if (!picked?.node) return;
          const prepared = prewarmAhead(picked.node, reason);
          traceCandidate('candidate_predictive_native_prewarm', picked.node, {
            reason,
            prepared,
            dir,
            gapPx: picked.gapPx,
            visiblePx: picked.visiblePx,
            band: picked.band,
          });
        });
      } catch {
        nativePrewarmScanRaf = 0;
      }
    };

    nearIo = new IntersectionObserver(
      (entries) => {
        const dir = updateCoordinatorScrollDirection();
        const intersecting = (entries || [])
          .filter((entry) => !!entry?.isIntersecting && entry?.target instanceof Element)
          .map((entry) => {
            const target = entry.target;
            const metrics = getCandidateMetrics(target, Number(entry.intersectionRatio || 0));
            const placement = getNearQueuePlacement(target, dir);
            return {
              entry,
              metrics,
              placement,
              centerDist: Number(metrics?.centerDist ?? Number.POSITIVE_INFINITY),
              visiblePx: Number(metrics?.visiblePx || 0),
            };
          })
          .sort((a, b) => {
            if (a.placement.band !== b.placement.band) return a.placement.band - b.placement.band;
            if (dir < 0) {
              if (a.placement.bottom !== b.placement.bottom) return b.placement.bottom - a.placement.bottom;
            } else if (a.placement.top !== b.placement.top) {
              return a.placement.top - b.placement.top;
            }
            if (a.placement.order !== b.placement.order) return a.placement.order - b.placement.order;
            if (a.centerDist !== b.centerDist) return a.centerDist - b.centerDist;
            return b.visiblePx - a.visiblePx;
          });
        if (!intersecting.length) return;
        scheduleNativePrewarmScan('near_io_predictive_native');

        const maxBatch = 1;
        let preparedCount = 0;
        for (const item of intersecting) {
          if (preparedCount >= maxBatch) break;
          const el = item.entry.target;
          const media = getMediaStateNode(el);
          const isActiveItem = !!(active && (active === el || active === media || active.contains?.(el) || el.contains?.(active)));
          const isReadyActiveNative = isActiveItem && isNativePostVideoCandidate(el) && isReadyCandidate(el);
          if (isReadyActiveNative) continue;

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
              gapPx: getOwnerViewportGapPx(el),
              reason: 'io_near_prewarm',
              queueIndex: preparedCount,
            });
          } catch {}
        }
      },
      {
        threshold: 0.001,
        rootMargin: `${
          Math.max(isIOSUi ? 560 : (isCoarseUi ? 440 : 280), Math.round(__MEDIA_VIS_MARGIN_PX * (isIOSUi ? 1.2 : 0.9)))
        }px 0px ${
          Math.max(isIOSUi ? 980 : (isCoarseUi ? 820 : 520), Math.round(__MEDIA_VIS_MARGIN_PX * (isIOSUi ? 2.05 : 1.35)))
        }px 0px`,
      },
    );

    const observeOne = (el) => {
      try {
        if (!(el instanceof Element)) return;
        if (observed.has(el)) return;
        observed.add(el);
        getMediaDomOrder(el);

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

        if (isNativePostVideoCandidate(el)) {
          const media = getMediaStateNode(el);
          const visiblePx = getOwnerVisiblePx(el);
          const gapPx = getOwnerViewportGapPx(el);
          const shouldRestoreSurface =
            visiblePx > 0 ||
            gapPx <= Math.max(getNativeEarlyPrimeGapLimit(), isCoarseUi ? 560 : 460);
          if (
            shouldRestoreSurface &&
            media instanceof HTMLVideoElement &&
            !isUserPaused(media) &&
            !hasSuppressedPlayback(media) &&
            !isMediaSrcBlocked(media)
          ) {
            if (!String(media.getAttribute?.('src') || media.currentSrc || '').trim() && __hasLazyVideoSourceWithoutSrc(media)) {
              trace('observe_native_visible_restore', media, { visiblePx, gapPx });
              try { __restoreVideoEl(media); } catch {}
            }
            if (visiblePx > Math.max(40, Math.round(getStartVisiblePx(media) * 0.32))) {
              try { prepareNativePriorityPrewarm(media, 'observe_visible_native'); } catch {}
            } else {
              try { scheduleNativePrewarmScan('observe_near_native_predictive_scan'); } catch {}
            }
          }
        }
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
    scheduleNativePrewarmScan('initial_native_predictive_scan');
    const onCoordinatorScroll = () => {
      updateCoordinatorScrollDirection();
      scheduleNativePrewarmScan('scroll_native_predictive_scan');
    };
    let coordinatorScrollEl = null;
    try {
      coordinatorScrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null;
      coordinatorScrollEl?.addEventListener?.('scroll', onCoordinatorScroll, { passive: true });
    } catch {}
    window.addEventListener('scroll', onCoordinatorScroll, { passive: true });
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
      scheduleNativePrewarmScan('visibility_native_predictive_scan');
      recoverVisibleHtmlMedia('visibility_visible');
    };
    const onPageShowRecover = () => {
      try { observeAll(); } catch {}
      scheduleNativePrewarmScan('pageshow_native_predictive_scan');
      recoverVisibleHtmlMedia('pageshow');
    };
    const onWindowFocusRecover = () => {
      scheduleNativePrewarmScan('focus_native_predictive_scan');
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
        scheduleNativePrewarmScan('mutation_native_predictive_scan');
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
      try { coordinatorScrollEl?.removeEventListener?.('scroll', onCoordinatorScroll); } catch {}
      window.removeEventListener('scroll', onCoordinatorScroll);
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
      if (nativePrewarmScanRaf) {
        try { cancelAnimationFrame(nativePrewarmScanRaf); } catch {}
        nativePrewarmScanRaf = 0;
      }
      try { if (nativePrewarmEl instanceof HTMLVideoElement) clearNativePauseRecovery(nativePrewarmEl); } catch {}
      try { releaseNativePrewarmExcept(null, 'cleanup'); } catch {}
      try { sweepDetachedMediaState('cleanup', true); } catch {}

      try {
        unloadTimers.forEach((id) => clearTimeout(id));
        unloadTimers.clear();
        externalPlayKickTimers.forEach((id) => clearTimeout(id));
        externalPlayKickTimers.clear();
      } catch {}
      try {
        readyReplay.forEach?.((cleanup) => { try { cleanup(); } catch {} });
        readyReplay.clear?.();
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
