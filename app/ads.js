// app/ads.js
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getForumAdConf,
  resolveCurrentAdUrl,
  AdCard,
  AdsCoordinator,
  FORUM_AD_LINKS_UPDATED_EVENT,
} from './forum/ForumAds';

/* ========= helpers ========= */

function isBrowser() {
  return typeof window !== 'undefined';
}

const MEDIA_MUTED_KEY = 'forum:mediaMuted';
const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted';
const MEDIA_MUTED_EVENT = 'forum:media-mute';
const SITE_MEDIA_PLAY_EVENT = 'site-media-play';
const SITE_AD_DEFAULT_MUTED = true;
const SITE_AD_NATIVE_VIDEO_PRELOAD_IDLE = 'metadata';
const SITE_AD_NATIVE_VIDEO_PRELOAD_PLAY = 'auto';
const SITE_AD_NATIVE_WARM_RELOAD_GAP_MS = 15000;
const YOUTUBE_NOCOOKIE_HOST = 'youtube-nocookie';

function normalizeSiteMuted(value) {
  return value === false ? false : true;
}

function parseMutedRaw(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'muted') return true;
  if (s === '0' || s === 'false' || s === 'no' || s === 'unmuted') return false;
  return null;
}

function readMutedPrefFromDocument() {
  if (!isBrowser()) return null;
  try { if (typeof window.__FORUM_MEDIA_MUTED__ === 'boolean') return window.__FORUM_MEDIA_MUTED__; } catch {}
  try { if (typeof window.__SITE_MEDIA_MUTED__ === 'boolean') return window.__SITE_MEDIA_MUTED__; } catch {}
  try {
    const root = document?.documentElement;
    const body = document?.body;
    return parseMutedRaw(
      root?.dataset?.forumMediaMuted ??
        root?.dataset?.mediaMuted ??
        body?.dataset?.forumMediaMuted ??
        body?.dataset?.mediaMuted ??
        null
    );
  } catch { return null; }
}

function readMutedPrefFromStorage() {
  if (!isBrowser()) return null;
  try {
    let v = window.localStorage?.getItem(MEDIA_MUTED_KEY);
    if (v == null) v = window.localStorage?.getItem(MEDIA_VIDEO_MUTED_KEY);
    return parseMutedRaw(v);
  } catch { return null; }
}

function readMutedPref() {
  const fromDocument = readMutedPrefFromDocument();
  if (typeof fromDocument === 'boolean') return fromDocument;
  const fromStorage = readMutedPrefFromStorage();
  if (typeof fromStorage === 'boolean') return fromStorage;
  return SITE_AD_DEFAULT_MUTED;
}

function writeMutedPrefToStorage(nextMuted) {
  if (!isBrowser()) return;
  const v = nextMuted ? '1' : '0';
  try {
    window.localStorage?.setItem(MEDIA_MUTED_KEY, v);
    window.localStorage?.setItem(MEDIA_VIDEO_MUTED_KEY, v);
  } catch {}
}

function writeMutedPrefToDocument(nextMuted, userSet = false) {
  if (!isBrowser()) return;
  const nextBool = !!nextMuted;
  const nextStr = nextBool ? '1' : '0';
  try { window.__FORUM_MEDIA_MUTED__ = nextBool; } catch {}
  try { window.__SITE_MEDIA_MUTED__ = nextBool; } catch {}
  try { window.__FORUM_MEDIA_SOUND_UNLOCKED__ = !nextBool; } catch {}
  try { window.__SITE_MEDIA_SOUND_UNLOCKED__ = !nextBool; } catch {}
  if (userSet) {
    try { window.__FORUM_MEDIA_SOUND_USER_SET__ = true; } catch {}
    try { window.__SITE_MEDIA_SOUND_USER_SET__ = true; } catch {}
  }
  try {
    const root = document?.documentElement;
    if (root?.dataset) {
      root.dataset.forumMediaMuted = nextStr;
      root.dataset.mediaMuted = nextStr;
      root.dataset.forumMediaSoundUnlocked = nextBool ? '0' : '1';
      if (userSet) root.dataset.forumMediaSoundUserSet = '1';
    }
  } catch {}
}

function emitMutedPref(nextMuted, id, source = 'site-ads') {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(new CustomEvent(MEDIA_MUTED_EVENT, { detail: { muted: !!nextMuted, id, source } }));
  } catch {}
}

function syncMutedPrefEverywhere(nextMuted, id, source = 'site-ads') {
  const next = normalizeSiteMuted(nextMuted);
  const userSet = source === 'site-ads-toggle' || String(source || '').endsWith('-toggle');
  writeMutedPrefToDocument(next, userSet);
  writeMutedPrefToStorage(next);
  emitMutedPref(next, id, source);
  return next;
}

function applyMutedToVideo(videoEl, nextMuted) {
  if (!videoEl) return;
  const next = normalizeSiteMuted(nextMuted);
  try { videoEl.muted = next; } catch {}
  try { videoEl.defaultMuted = next; } catch {}
  try { if (next) videoEl.setAttribute('muted', ''); else videoEl.removeAttribute('muted'); } catch {}
}

function getSiteAdVideoNodeSrc(videoEl) {
  if (!videoEl) return '';
  try {
    return String(videoEl.currentSrc || videoEl.getAttribute?.('src') || videoEl.dataset?.siteAdNativeSrc || '').trim();
  } catch { return ''; }
}

function detachSiteNativeVideo(videoEl, opts = {}) {
  if (!videoEl) return;
  const hard = !!(opts === true || opts?.hard);
  const reason = String(opts?.reason || (hard ? 'hard_detach' : 'soft_detach'));
  const resetPipeline = !!(opts?.resetPipeline || hard);
  try { videoEl.pause?.(); } catch {}
  if (!hard) {
    try {
      if (videoEl.dataset) {
        videoEl.dataset.__siteAdLoadPending = '0';
        videoEl.dataset.__siteAdDetachedSoft = '1';
        videoEl.dataset.__siteAdDetachedReason = reason;
        videoEl.dataset.__siteAdDetachedSoftTs = String(Date.now());
      }
    } catch {}
    try { videoEl.preload = SITE_AD_NATIVE_VIDEO_PRELOAD_IDLE; } catch {}
    return;
  }
  try {
    if (videoEl.dataset) {
      videoEl.dataset.__siteAdLoadPending = '0';
      videoEl.dataset.__siteAdDetachedSoft = '0';
      videoEl.dataset.__siteAdDetachedHard = '1';
      videoEl.dataset.__siteAdDetachedReason = reason;
      videoEl.dataset.__siteAdDetachedHardTs = String(Date.now());
      delete videoEl.dataset.siteAdNativeSrc;
    }
  } catch {}
  try { videoEl.removeAttribute('src'); } catch {}
  try { videoEl.removeAttribute('data-site-ad-native-src'); } catch {}
  try { videoEl.preload = 'none'; } catch {}
  if (resetPipeline) { try { videoEl.load?.(); } catch {} }
}

function ensureSiteNativeVideoSrc(videoEl, src, muted) {
  if (!videoEl) return false;
  const nextSrc = String(src || '').trim();
  if (!nextSrc) return false;
  applyMutedToVideo(videoEl, muted);
  const currentSrc = getSiteAdVideoNodeSrc(videoEl);
  if (currentSrc === nextSrc) {
    try { videoEl.preload = SITE_AD_NATIVE_VIDEO_PRELOAD_PLAY; } catch {}
    try {
      if (videoEl.dataset) {
        videoEl.dataset.siteAdNativeSrc = nextSrc;
        videoEl.dataset.__siteAdDetachedSoft = '0';
        videoEl.dataset.__siteAdDetachedHard = '0';
        delete videoEl.dataset.__siteAdDetachedReason;
      }
    } catch {}
    return true;
  }
  try { videoEl.pause?.(); } catch {}
  try { videoEl.preload = 'none'; } catch {}
  try { videoEl.src = nextSrc; } catch { try { videoEl.setAttribute('src', nextSrc); } catch {} }
  try {
    if (videoEl.dataset) {
      const now = Date.now();
      videoEl.dataset.siteAdNativeSrc = nextSrc;
      videoEl.dataset.__siteAdLoadPending = '1';
      videoEl.dataset.__siteAdLastAttachTs = String(now);
      videoEl.dataset.__siteAdLastWarmLoadTs = String(now);
      videoEl.dataset.__siteAdDetachedSoft = '0';
      videoEl.dataset.__siteAdDetachedHard = '0';
      delete videoEl.dataset.__siteAdDetachedReason;
    }
  } catch {}
  try { videoEl.preload = SITE_AD_NATIVE_VIDEO_PRELOAD_PLAY; videoEl.load?.(); } catch {}
  return true;
}

function isSiteNativeVideoLoadingOrReady(videoEl) {
  try {
    if (!videoEl) return false;
    const hasSrc = !!getSiteAdVideoNodeSrc(videoEl);
    if (!hasSrc) return false;
    const readyState = Number(videoEl.readyState || 0);
    if (readyState >= 1) return true;
    const ns = Number(videoEl.networkState || 0);
    if (typeof HTMLMediaElement !== 'undefined') return ns === HTMLMediaElement.NETWORK_LOADING;
    return ns === 2;
  } catch { return false; }
}

function getClientIdSafe() {
  if (!isBrowser()) return 'guest';
  try {
    const w = window;
    return w.__forumClientId || w.__clientId || w.__qClientId || w.localStorage?.getItem('forum_client_id') || 'guest';
  } catch { return 'guest'; }
}

function getPageKey() {
  if (!isBrowser()) return 'ssr';
  try {
    const { hostname = '', pathname = '' } = window.location || {};
    const raw = `${hostname}${pathname}` || 'page';
    const norm = raw.replace(/[^a-zA-Z0-9]+/g, '_');
    return norm || 'page';
  } catch { return 'page'; }
}

let globalInstanceCounter = 0;

function buildInternalSlotKey(slotKeyProp, slotKindProp) {
  const base = (slotKeyProp && String(slotKeyProp)) || (slotKindProp && String(slotKindProp)) || 'ads';
  const page = getPageKey();
  globalInstanceCounter += 1;
  return `${base}__${page}__${globalInstanceCounter}`;
}

function commandExternalFrame(frame, command, muted) {
  if (!frame || !isBrowser()) return;
  const nextMuted = normalizeSiteMuted(muted);
  const youtubeCommand = command === 'play' ? 'playVideo' : 'pauseVideo';
  const tiktokCommand = command === 'play' ? 'play' : 'pause';
  try { frame.contentWindow?.postMessage?.({ event: 'command', func: nextMuted ? 'mute' : 'unMute', args: '' }, '*'); } catch {}
  try { frame.contentWindow?.postMessage?.({ event: 'command', func: youtubeCommand, args: '' }, '*'); } catch {}
  try { frame.contentWindow?.postMessage?.({ method: tiktokCommand, value: command === 'play' ? 1 : 0, muted: nextMuted }, '*'); } catch {}
  try { frame.contentWindow?.postMessage?.({ type: command, command: tiktokCommand, muted: nextMuted }, '*'); } catch {}
}

function emitSiteMediaPlay(source, element, id, muted, lastTsRef) {
  if (!isBrowser()) return;
  try {
    const now = Date.now();
    if (lastTsRef && (now - Number(lastTsRef.current || 0)) < 320) return;
    if (lastTsRef) lastTsRef.current = now;
    const nextMuted = normalizeSiteMuted(muted);
    window.dispatchEvent(new CustomEvent(SITE_MEDIA_PLAY_EVENT, {
      detail: { source, element, manual: false, id, muted: nextMuted, audible: source === 'site_ad_video' || source === 'site_ad_youtube' ? !nextMuted : undefined },
    }));
  } catch {}
}

/* ========= основной компонент ========= */

export function HomeBetweenBlocksAd({ slotKey, slotKind }) {
  const conf = useMemo(() => getForumAdConf(), []);
  const clientId = getClientIdSafe();
  const internalKeyRef = useRef(null);
  if (!internalKeyRef.current) internalKeyRef.current = buildInternalSlotKey(slotKey, slotKind);
  const internalSlotKey = internalKeyRef.current;
  const playerIdRef = useRef(`site_ad_${Math.random().toString(36).slice(2)}_${Date.now()}`);
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const attachedVideoSrcRef = useRef('');
  const adNativePauseRecoveryRef = useRef({ timer: 0, ts: 0, count: 0 });
  const adNativeFocusKickTsRef = useRef(0);
  const adPlayEventTsRef = useRef(0);
  const shouldPlayRef = useRef(false);
  const mutedRef = useRef(normalizeSiteMuted(readMutedPref()));
  const videoErrorUntilRef = useRef(new Map());
  const [mediaInfo, setMediaInfo] = useState({ media: { kind: 'skeleton', src: null }, mediaHref: '', clickHref: '' });
  const [muted, setMuted] = useState(() => normalizeSiteMuted(readMutedPref()));
  const [isNear, setIsNear] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPageActive, setIsPageActive] = useState(true);
  const shouldPlay = isFocused && isPageActive;
  const currentMedia = mediaInfo?.media || { kind: 'skeleton', src: null };
  const currentKind = String(currentMedia?.kind || '');
  const currentSrc = String(currentMedia?.src || '');
  const initialNowRef = useRef(null);
  if (initialNowRef.current == null) initialNowRef.current = isBrowser() ? Date.now() : 0;
  const [adsLinksRefreshTick, setAdsLinksRefreshTick] = useState(0);
  const [url, setUrl] = useState(() => resolveCurrentAdUrl(conf, clientId, initialNowRef.current || undefined, internalSlotKey, AdsCoordinator));

  const isVideoSrcTemporarilyBlocked = useCallback((src) => {
    const key = String(src || '').trim();
    if (!key) return false;
    const until = Number(videoErrorUntilRef.current.get(key) || 0);
    if (!until) return false;
    if (until <= Date.now()) { videoErrorUntilRef.current.delete(key); return false; }
    return true;
  }, []);

  const markVideoSrcTemporarilyBlocked = useCallback((src, ms = 20000) => {
    const key = String(src || '').trim();
    if (!key) return;
    videoErrorUntilRef.current.set(key, Date.now() + Math.max(2500, Number(ms || 0)));
    if (videoErrorUntilRef.current.size > 120) {
      let drop = videoErrorUntilRef.current.size - 120;
      for (const oldKey of videoErrorUntilRef.current.keys()) {
        videoErrorUntilRef.current.delete(oldKey); drop -= 1; if (drop <= 0) break;
      }
    }
  }, []);

  const clearVideoSrcBlock = useCallback((src) => {
    const key = String(src || '').trim();
    if (key) videoErrorUntilRef.current.delete(key);
  }, []);

  const emitAdPlayToCoordinator = useCallback((source = 'site_ad') => {
    let el = null;
    if (source === 'site_ad_video') el = videoRef.current || rootRef.current || null;
    else if (source === 'site_ad_youtube' || source === 'site_ad_tiktok') el = iframeRef.current || rootRef.current || null;
    else el = videoRef.current || iframeRef.current || rootRef.current || null;
    emitSiteMediaPlay(source, el, playerIdRef.current, mutedRef.current, adPlayEventTsRef);
  }, []);


  const repickAdUrl = useCallback(() => {
    const freshConf = getForumAdConf();
    const nextUrl = resolveCurrentAdUrl(
      freshConf,
      getClientIdSafe(),
      Date.now(),
      internalSlotKey,
      AdsCoordinator
    );
    if (nextUrl) setUrl(nextUrl);
    return nextUrl;
  }, [internalSlotKey]);

  useEffect(() => {
    if (!isBrowser()) return undefined;

    let stopped = false;
    const timers = [];
    const repick = () => {
      if (stopped) return;
      repickAdUrl();
      setAdsLinksRefreshTick((value) => value + 1);
    };

    window.addEventListener(FORUM_AD_LINKS_UPDATED_EVENT, repick);

    if (!url) {
      [120, 350, 800, 1500, 3000, 5000, 8000].forEach((delay) => {
        timers.push(window.setTimeout(repick, delay));
      });
    }

    return () => {
      stopped = true;
      window.removeEventListener(FORUM_AD_LINKS_UPDATED_EVENT, repick);
      timers.forEach((timer) => {
        try { window.clearTimeout(timer); } catch {}
      });
    };
  }, [repickAdUrl, url]);

  const playSiteNativeVideo = useCallback((reason = 'focus') => {
    const v = videoRef.current;
    const srcKey = String(currentSrc || '').trim();
    if (currentKind !== 'video') return false;
    if (!v || !srcKey || isVideoSrcTemporarilyBlocked(srcKey)) return false;
    if (!shouldPlayRef.current || !isPageActive) return false;
    const now = Date.now();
    const minGapMs = reason === 'focus_retry' ? 520 : 260;
    if ((now - Number(adNativeFocusKickTsRef.current || 0)) < minGapMs) return false;
    adNativeFocusKickTsRef.current = now;
    try {
      const nextMuted = normalizeSiteMuted(mutedRef.current);
      const attached = ensureSiteNativeVideoSrc(v, srcKey, nextMuted);
      if (attached) attachedVideoSrcRef.current = srcKey;
      applyMutedToVideo(v, nextMuted);
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.preload = SITE_AD_NATIVE_VIDEO_PRELOAD_PLAY;
      if (!v.paused && !v.ended) { emitAdPlayToCoordinator('site_ad_video'); return true; }
      if (v.ended) { try { v.currentTime = 0; } catch {}; try { delete v.dataset.__siteAdEndedHold; } catch {} }
      const playAttempt = v.play?.();
      if (playAttempt && typeof playAttempt.then === 'function') {
        playAttempt.then(() => {
          try { const st = adNativePauseRecoveryRef.current || {}; if (st.timer) clearTimeout(st.timer); adNativePauseRecoveryRef.current = { timer: 0, ts: Date.now(), count: 0 }; } catch {}
          emitAdPlayToCoordinator('site_ad_video');
        }).catch(() => {
          try { if (!shouldPlayRef.current || normalizeSiteMuted(mutedRef.current) !== false) return; applyMutedToVideo(v, true); v.play?.().catch(() => {}); } catch {}
        });
      } else {
        try { const st = adNativePauseRecoveryRef.current || {}; if (st.timer) clearTimeout(st.timer); adNativePauseRecoveryRef.current = { timer: 0, ts: Date.now(), count: 0 }; } catch {}
        emitAdPlayToCoordinator('site_ad_video');
      }
      return true;
    } catch { return false; }
  }, [currentKind, currentSrc, emitAdPlayToCoordinator, isPageActive, isVideoSrcTemporarilyBlocked]);

  useEffect(() => { shouldPlayRef.current = shouldPlay; }, [shouldPlay]);
  useEffect(() => { mutedRef.current = normalizeSiteMuted(muted); applyMutedToVideo(videoRef.current, mutedRef.current); }, [muted]);
  useEffect(() => {
    const startup = normalizeSiteMuted(readMutedPref());
    const synced = syncMutedPrefEverywhere(startup, playerIdRef.current, 'site-ads-startup');
    mutedRef.current = synced;
    setMuted((prev) => (prev === synced ? prev : synced));
    applyMutedToVideo(videoRef.current, synced);
  }, []);

  useEffect(() => {
    if (!isBrowser()) return undefined;
    const onMuted = (e) => {
      const detail = e?.detail || {};
      if (detail?.id && detail.id === playerIdRef.current) return;
      if (typeof detail?.muted !== 'boolean') return;
      const next = syncMutedPrefEverywhere(detail.muted, playerIdRef.current, 'site-ads-sync');
      mutedRef.current = next;
      setMuted((prev) => (prev === next ? prev : next));
      applyMutedToVideo(videoRef.current, next);
      try { if (ytPlayerRef.current) { if (next) ytPlayerRef.current.mute?.(); else ytPlayerRef.current.unMute?.(); } } catch {}
      commandExternalFrame(iframeRef.current, shouldPlayRef.current ? 'play' : 'pause', next);
    };
    window.addEventListener(MEDIA_MUTED_EVENT, onMuted);
    return () => window.removeEventListener(MEDIA_MUTED_EVENT, onMuted);
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    return () => {
      try { const st = adNativePauseRecoveryRef.current || {}; if (st.timer) clearTimeout(st.timer); adNativePauseRecoveryRef.current = { timer: 0, ts: 0, count: 0 }; } catch {}
      attachedVideoSrcRef.current = '';
      detachSiteNativeVideo(node, { hard: true, reason: 'unmount', resetPipeline: true });
    };
  }, []);

  useEffect(() => {
    if (!isBrowser()) return undefined;
    const sync = () => setIsPageActive(document.visibilityState === 'visible');
    sync();
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('blur', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('blur', sync);
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !isBrowser() || typeof IntersectionObserver === 'undefined') { setIsNear(true); setIsFocused(true); return undefined; }
    const nearObs = new IntersectionObserver(([entry]) => setIsNear(!!entry?.isIntersecting), { rootMargin: '820px 0px 1650px 0px', threshold: 0 });
    const focusObs = new IntersectionObserver(([entry]) => setIsFocused((entry?.intersectionRatio || 0) >= 0.6), { threshold: [0, 0.25, 0.6, 0.75, 1] });
    nearObs.observe(el);
    focusObs.observe(el);
    return () => { nearObs.disconnect(); focusObs.disconnect(); };
  }, [url]);

  useEffect(() => {
    if (!isBrowser()) return undefined;
    const rotateMin = Number(conf.ROTATE_MIN || 1);
    const periodMs = Math.max(1, rotateMin) * 60_000;
    if (!Number.isFinite(periodMs) || periodMs <= 0) return undefined;
    let timer = null;
    const schedule = () => {
      const now = Date.now();
      const currentBucket = Math.floor(now / periodMs);
      const nextBucketStart = (currentBucket + 1) * periodMs;
      const delay = Math.max(500, nextBucketStart - now + 10);
      timer = setTimeout(() => {
        const nextUrl = resolveCurrentAdUrl(getForumAdConf(), getClientIdSafe(), Date.now(), internalSlotKey, AdsCoordinator);
        if (nextUrl) setUrl(nextUrl);
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (timer) clearTimeout(timer); };
  }, [adsLinksRefreshTick, conf, internalSlotKey]);

  useEffect(() => {
    const node = videoRef.current;
    if (currentKind !== 'video') { attachedVideoSrcRef.current = ''; detachSiteNativeVideo(node, { hard: true, reason: 'kind_change', resetPipeline: true }); return undefined; }
    const nextSrc = String(currentSrc || '').trim();
    if (!nextSrc || isVideoSrcTemporarilyBlocked(nextSrc)) { attachedVideoSrcRef.current = ''; detachSiteNativeVideo(node, { hard: true, reason: 'blocked_or_empty_src', resetPipeline: true }); return undefined; }
    if (attachedVideoSrcRef.current && attachedVideoSrcRef.current !== nextSrc) { detachSiteNativeVideo(node, { hard: true, reason: 'src_change', resetPipeline: true }); attachedVideoSrcRef.current = ''; }
    return undefined;
  }, [currentKind, currentSrc, isVideoSrcTemporarilyBlocked]);

  useEffect(() => {
    const v = videoRef.current;
    if (currentKind !== 'video' || !isPageActive || !isNear) { if (v && !shouldPlayRef.current) detachSiteNativeVideo(v, { hard: false, reason: 'near_exit' }); return undefined; }
    if (!v) return undefined;
    const srcKey = String(currentSrc || '').trim();
    if (!srcKey || isVideoSrcTemporarilyBlocked(srcKey)) { detachSiteNativeVideo(v, { hard: true, reason: 'bad_src', resetPipeline: true }); return undefined; }
    if (!shouldPlayRef.current) {
      const nextMuted = normalizeSiteMuted(mutedRef.current);
      const attached = ensureSiteNativeVideoSrc(v, srcKey, nextMuted);
      if (attached) attachedVideoSrcRef.current = srcKey;
      try {
        applyMutedToVideo(v, nextMuted);
        v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        v.preload = SITE_AD_NATIVE_VIDEO_PRELOAD_PLAY;
        const now = Date.now();
        const lastLoadTs = Number(v.dataset?.__siteAdLastWarmLoadTs || 0);
        const loadingOrReady = isSiteNativeVideoLoadingOrReady(v);
        if (!loadingOrReady && (now - lastLoadTs) > SITE_AD_NATIVE_WARM_RELOAD_GAP_MS) { v.dataset.__siteAdLastWarmLoadTs = String(now); v.dataset.__siteAdLoadPending = '1'; v.load?.(); }
      } catch {}
    }
    return undefined;
  }, [currentKind, currentSrc, isNear, isPageActive, isVideoSrcTemporarilyBlocked]);

  useEffect(() => {
    if (currentKind !== 'youtube' || !currentSrc || !isBrowser()) {
      const existing = ytPlayerRef.current;
      if (existing) { try { existing.destroy?.(); } catch {}; ytPlayerRef.current = null; }
      return undefined;
    }
    let cancelled = false;
    let localPlayer = null;
    const cleanupPlayer = () => { if (localPlayer) { try { localPlayer.destroy?.(); } catch {} } if (ytPlayerRef.current === localPlayer) ytPlayerRef.current = null; };
    const createPlayer = () => {
      if (cancelled) return;
      if (!window.YT || !window.YT.Player || !iframeRef.current) return;
      try {
        localPlayer = new window.YT.Player(iframeRef.current, {
          videoId: currentSrc,
          playerVars: { autoplay: 0, controls: 0, rel: 0, fs: 0, modestbranding: 1, playsinline: 1, loop: 1, playlist: currentSrc },
          events: { onReady: (ev) => {
            if (cancelled) return;
            ytPlayerRef.current = ev.target;
            try {
              if (mutedRef.current === true) ev.target.mute?.(); else if (mutedRef.current === false) ev.target.unMute?.();
              if (shouldPlayRef.current) { emitAdPlayToCoordinator('site_ad_youtube'); ev.target.playVideo?.(); } else ev.target.pauseVideo?.();
            } catch {}
          } },
        });
        ytPlayerRef.current = localPlayer;
      } catch {}
    };
    if (window.YT && window.YT.Player) createPlayer();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() { if (typeof prev === 'function') prev(); createPlayer(); };
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script'); tag.id = 'yt-iframe-api'; tag.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(tag);
      }
    }
    return () => { cancelled = true; cleanupPlayer(); };
  }, [currentKind, currentSrc, emitAdPlayToCoordinator]);

  useEffect(() => {
    if (currentKind === 'video' && videoRef.current) {
      const v = videoRef.current;
      const srcKey = String(currentSrc || '').trim();
      const nextMuted = normalizeSiteMuted(muted);
      applyMutedToVideo(v, nextMuted);
      if (!srcKey || isVideoSrcTemporarilyBlocked(srcKey)) { try { v.pause?.(); } catch {}; return; }
      if (shouldPlay) playSiteNativeVideo('focus');
      else { try { v.pause?.(); } catch {}; try { v.preload = SITE_AD_NATIVE_VIDEO_PRELOAD_IDLE; } catch {} }
    }
    if (currentKind === 'youtube') {
      const p = ytPlayerRef.current;
      const nextMuted = normalizeSiteMuted(muted);
      try {
        if (p) {
          if (shouldPlay) { if (nextMuted) p.mute?.(); else p.unMute?.(); emitAdPlayToCoordinator('site_ad_youtube'); p.playVideo?.(); }
          else p.pauseVideo?.();
        }
      } catch {}
      commandExternalFrame(iframeRef.current, shouldPlay ? 'play' : 'pause', nextMuted);
    }
    if (currentKind === 'tiktok') { if (shouldPlay) emitAdPlayToCoordinator('site_ad_tiktok'); commandExternalFrame(iframeRef.current, shouldPlay ? 'play' : 'pause', muted); }
  }, [currentKind, currentSrc, emitAdPlayToCoordinator, isVideoSrcTemporarilyBlocked, muted, playSiteNativeVideo, shouldPlay]);

  useEffect(() => {
    if (currentKind !== 'video') return undefined;
    if (!shouldPlay || !isPageActive) return undefined;
    let cancelled = false;
    let timer = 0;
    const kick = () => { if (!cancelled) playSiteNativeVideo('focus_retry'); };
    kick();
    timer = window.setInterval(() => {
      try {
        const v = videoRef.current;
        if (!shouldPlayRef.current || !v || !v.paused || v.ended) { if (timer) window.clearInterval(timer); timer = 0; return; }
        kick();
      } catch {}
    }, 520);
    return () => { cancelled = true; if (timer) window.clearInterval(timer); };
  }, [currentKind, currentSrc, isPageActive, playSiteNativeVideo, shouldPlay]);

  if (!url) return null;
  const effectiveSlotKind = (slotKind && String(slotKind)) || (slotKey && String(slotKey)) || 'home_between';
  const handleSoundToggle = (event, info) => {
    const next = syncMutedPrefEverywhere(info?.nextMuted, playerIdRef.current, 'site-ads-toggle');
    mutedRef.current = next;
    setMuted((prev) => (prev === next ? prev : next));
    applyMutedToVideo(videoRef.current, next);
    try { if (ytPlayerRef.current) { if (next) ytPlayerRef.current.mute?.(); else ytPlayerRef.current.unMute?.(); if (shouldPlayRef.current) ytPlayerRef.current.playVideo?.(); } } catch {}
    commandExternalFrame(iframeRef.current, shouldPlayRef.current ? 'play' : 'pause', next);
    if (currentKind === 'video' && videoRef.current && shouldPlayRef.current) videoRef.current.play?.().catch(() => {});
  };

  const videoHandlers = {
    onPlaying: () => {
      try {
        const v = videoRef.current;
        if (v?.dataset) v.dataset.__siteAdLoadPending = '0';
        if (v?.dataset) delete v.dataset.__siteAdEndedHold;
        if (!shouldPlayRef.current) { try { v?.pause?.(); } catch {}; return; }
        const st = adNativePauseRecoveryRef.current || {};
        if (st.timer) clearTimeout(st.timer);
        adNativePauseRecoveryRef.current = { timer: 0, ts: Date.now(), count: 0 };
        emitAdPlayToCoordinator('site_ad_video');
      } catch {}
    },
    onPause: () => {
      try {
        const v = videoRef.current;
        const srcKey = String(currentSrc || '').trim();
        if (!v || !shouldPlayRef.current || !srcKey || isVideoSrcTemporarilyBlocked(srcKey)) return;
        if (v.ended) { const st = adNativePauseRecoveryRef.current || {}; if (st.timer) clearTimeout(st.timer); adNativePauseRecoveryRef.current = { timer: 0, ts: Date.now(), count: 0 }; return; }
        const prev = adNativePauseRecoveryRef.current || { timer: 0, ts: 0, count: 0 };
        const now = Date.now();
        const nextCount = prev.ts > 0 && (now - prev.ts) < 7000 ? Number(prev.count || 0) + 1 : 1;
        if (nextCount > 2) return;
        if (prev.timer) clearTimeout(prev.timer);
        const timer = setTimeout(() => { try { if (!shouldPlayRef.current || !v.paused) return; applyMutedToVideo(v, normalizeSiteMuted(mutedRef.current)); v.play?.().catch(() => {}); } catch {} }, 140);
        adNativePauseRecoveryRef.current = { timer, ts: now, count: nextCount };
      } catch {}
    },
    onLoadedData: () => {
      try { const v = videoRef.current; if (v?.dataset) v.dataset.__siteAdLoadPending = '0'; if (v?.dataset) v.dataset.__siteAdWarmReady = '1'; applyMutedToVideo(v, mutedRef.current); clearVideoSrcBlock(currentSrc); if (shouldPlayRef.current && v?.paused) v.play?.().catch(() => {}); else if (v) v.preload = SITE_AD_NATIVE_VIDEO_PRELOAD_IDLE; } catch {}
    },
    onCanPlay: () => {
      try { const v = videoRef.current; if (v?.dataset) v.dataset.__siteAdLoadPending = '0'; if (v?.dataset) v.dataset.__siteAdWarmReady = '1'; applyMutedToVideo(v, mutedRef.current); clearVideoSrcBlock(currentSrc); if (shouldPlayRef.current && v?.paused) v.play?.().catch(() => {}); else if (v) v.preload = SITE_AD_NATIVE_VIDEO_PRELOAD_IDLE; } catch {}
    },
    onEnded: () => {
      try {
        const st = adNativePauseRecoveryRef.current || {};
        if (st.timer) clearTimeout(st.timer);
        adNativePauseRecoveryRef.current = { timer: 0, ts: Date.now(), count: 0 };
        const v = videoRef.current;
        if (v?.dataset) { v.dataset.__siteAdLoadPending = '0'; v.dataset.__siteAdWarmReady = '1'; delete v.dataset.__siteAdEndedHold; }
        if (v) { v.preload = shouldPlayRef.current ? SITE_AD_NATIVE_VIDEO_PRELOAD_PLAY : SITE_AD_NATIVE_VIDEO_PRELOAD_IDLE; if (shouldPlayRef.current) { try { v.currentTime = 0; } catch {}; v.play?.().catch(() => {}); } }
      } catch {}
    },
    onError: () => {
      try {
        const v = videoRef.current;
        const code = Number(v?.error?.code || 0);
        const now = Date.now();
        const recentAttach = (now - Number(v?.dataset?.__siteAdLastAttachTs || 0)) < 6500;
        const loading = typeof HTMLMediaElement !== 'undefined' && Number(v?.networkState || 0) === HTMLMediaElement.NETWORK_LOADING;
        const hasFrame = Number(v?.readyState || 0) >= 1;
        if (code <= 1 || recentAttach || loading || hasFrame) { if (v?.dataset) { v.dataset.__siteAdLoadPending = '0'; v.dataset.__siteAdTransientErrorTs = String(now); } return; }
        markVideoSrcTemporarilyBlocked(currentSrc, isNear ? 12000 : 20000);
        attachedVideoSrcRef.current = '';
        detachSiteNativeVideo(videoRef.current, { hard: true, reason: 'error', resetPipeline: true });
      } catch {}
    },
  };

  return (
    <>
      <section
        ref={rootRef}
        className="panel"
        data-ads-slot={internalSlotKey}
        data-ads-base-slot={slotKey || ''}
        data-ads-kind={effectiveSlotKind}
        data-site-ad-owner="1"
        aria-label="Реклама"
      >
        <AdCard
          url={url}
          slotKind={effectiveSlotKind}
          nearId={internalSlotKey}
          layout="flex"
          muted={muted}
          onSoundToggle={handleSoundToggle}
          rootRef={rootRef}
          videoRef={videoRef}
          iframeRef={iframeRef}
          rootAttrs={{ 'data-site-ad-card': '1', 'data-site-ad-slot-key': internalSlotKey }}
          mediaSlotAttrs={{ 'data-site-ad-media-slot': '1', 'data-site-ad-kind': currentKind, 'data-site-ad-src': currentSrc }}
          videoAttrs={{ 'data-site-ad-media': 'video', 'data-site-ad-slot-key': internalSlotKey, 'data-site-ad-click-url': url, ...videoHandlers }}
          youtubeAttrs={{ 'data-site-ad-media': 'youtube', 'data-site-ad-youtube-host': YOUTUBE_NOCOOKIE_HOST, 'data-site-ad-slot-key': internalSlotKey, 'data-site-ad-click-url': url }}
          tiktokAttrs={{ 'data-site-ad-media': 'tiktok', 'data-site-ad-slot-key': internalSlotKey, 'data-site-ad-click-url': url }}
          deferNativeSrc
          deferExternalSrc={false}
          tiktokActive
          onMediaChange={setMediaInfo}
        />
      </section>

      {/* Локальные стили только для рекламного слота */}
      <style jsx>{`
        /* Любой медиа-контент внутри рекламного секшена:
           - старается занять всю ширину
           - если меньше, то по центру с одинаковыми отступами слева/справа */
section[data-ads-slot] :global(img),
section[data-ads-slot] :global(video) {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

        /* Для iframe / svg / canvas — только центрируем и ограничиваем ширину,
           размеры (width/height) берём из inline-стилей AdCard (YouTube и т.п.) */
        section[data-ads-slot] :global(iframe),
        section[data-ads-slot] :global(svg),
        section[data-ads-slot] :global(canvas) {
          display: block;
          margin-left: auto;
          margin-right: auto;
          max-width: 100%;
        }
      `}</style>
    </>
  );
}

export default HomeBetweenBlocksAd;
