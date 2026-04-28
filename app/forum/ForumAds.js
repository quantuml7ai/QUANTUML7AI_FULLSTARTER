// app/forum/ForumAds.js
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useI18n } from '../../components/i18n';
import { useRouter } from 'next/navigation';

/* ======================= CAMPAIGN META ======================= */
const AD_LABEL_FONT_SIZE_PX = 20;

/* ======================= GLOBAL SOUND MEMORY (Forum.jsx-compatible) ======================= */
// ДОЛЖНО совпадать со схемой форума:
const MEDIA_MUTED_KEY = 'forum:mediaMuted';
const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'; // fallback совместимости
const MEDIA_MUTED_EVENT = 'forum:media-mute';

function readMutedPrefFromStorage() {
  if (!isBrowser()) return null;
  try {
    let v = window.localStorage?.getItem(MEDIA_MUTED_KEY);
    if (v == null) v = window.localStorage?.getItem(MEDIA_VIDEO_MUTED_KEY);
    if (v == null) return null;
    return v === '1' || v === 'true';
  } catch {
    return null;
  }
}

function readMutedPrefFromDocument() {
  if (!isBrowser()) return null;

  try {
    if (typeof window.__FORUM_MEDIA_MUTED__ === 'boolean') {
      return window.__FORUM_MEDIA_MUTED__;
    }
  } catch {}

  try {
    if (typeof window.__SITE_MEDIA_MUTED__ === 'boolean') {
      return window.__SITE_MEDIA_MUTED__;
    }
  } catch {}

  try {
    const root = document?.documentElement;
    const body = document?.body;

    const raw =
      root?.dataset?.forumMediaMuted ??
      root?.dataset?.mediaMuted ??
      body?.dataset?.forumMediaMuted ??
      body?.dataset?.mediaMuted ??
      null;

    if (raw == null || raw === '') return null;
    return raw === '1' || raw === 'true';
  } catch {
    return null;
  }
}

function readMutedPref() {
  const fromDocument = readMutedPrefFromDocument();
  if (typeof fromDocument === 'boolean') return fromDocument;
  return readMutedPrefFromStorage();
}

function writeMutedPrefToStorage(val) {
  if (!isBrowser()) return;
  const next = val ? '1' : '0';
  try {
    window.localStorage?.setItem(MEDIA_MUTED_KEY, next);
    window.localStorage?.setItem(MEDIA_VIDEO_MUTED_KEY, next);
  } catch {}
}

function writeMutedPrefToDocument(val, userSet = false) {
  if (!isBrowser()) return;

  const nextBool = !!val;
  const nextStr = nextBool ? '1' : '0';

  try {
    window.__FORUM_MEDIA_MUTED__ = nextBool;
  } catch {}

  try {
    window.__SITE_MEDIA_MUTED__ = nextBool;
  } catch {}
  try {
    window.__FORUM_MEDIA_SOUND_UNLOCKED__ = !nextBool;
  } catch {}

  try {
    window.__SITE_MEDIA_SOUND_UNLOCKED__ = !nextBool;
  } catch {}

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

  try {
    const body = document?.body;
    if (body?.dataset) {
      body.dataset.forumMediaMuted = nextStr;
      body.dataset.mediaMuted = nextStr;
      body.dataset.forumMediaSoundUnlocked = nextBool ? '0' : '1';
      if (userSet) body.dataset.forumMediaSoundUserSet = '1';
    }
  } catch {}
}

function emitMutedPref(val, id, source = 'forum-ads') {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(
      new CustomEvent(MEDIA_MUTED_EVENT, {
        detail: { muted: !!val, id, source },
      })
    );
  } catch {}
}

function syncMutedPrefEverywhere(val, id, source = 'forum-ads') {
  const userSet = source === 'forum-ads-toggle' || String(source || '').endsWith('-toggle');
  writeMutedPrefToStorage(val);
  writeMutedPrefToDocument(val, userSet);
  emitMutedPref(val, id, source);
}

const FORUM_AD_DEFAULT_MUTED = true;

function normalizeForumAdMuted(value) {
  // Только явный false означает "звук включён".
  // null / undefined / любое неизвестное состояние = безопасный muted.
  return value === false ? false : true;
}

function resolveForumAdStartupMuted() {
  // ВАЖНО:
  // Для старта рекламы главным источником считаем именно document/window,
  // потому что туда текущий модуль уже раскладывает глобальное состояние.
  const fromDocument = readMutedPrefFromDocument();

  if (typeof fromDocument === 'boolean') {
    return {
      muted: fromDocument,
      source: 'document',
      hadDocumentState: true,
    };
  }

  return {
    muted: FORUM_AD_DEFAULT_MUTED,
    source: 'fallback-muted',
    hadDocumentState: false,
  };
}

function commitForumAdMutedState(val) {
  const next = normalizeForumAdMuted(val);

  // Оставляем текущую архитектуру совместимости:
  // document/window — главный глобальный контур,
  // storage — fallback/совместимость с форумом.
  writeMutedPrefToDocument(next, false);
  writeMutedPrefToStorage(next);

  return next;
}

function applyForumAdMutedToVideo(videoEl, val) {
  if (!videoEl) return;

  const next = normalizeForumAdMuted(val);

  try {
    videoEl.muted = next;
  } catch {}

  try {
    videoEl.defaultMuted = next;
  } catch {}

  try {
    if (next) {
      videoEl.setAttribute('muted', '');
    } else {
      videoEl.removeAttribute('muted');
    }
  } catch {}
}

function desiredMutedFromPref(pref) {
  // Совместимость со старым вызовом.
  // Раньше null означал "не форсим".
  // Для рекламы null больше нельзя отдавать в video,
  // потому что на мобильных autoplay должен стартовать muted.
  return typeof pref === 'boolean'
    ? pref
    : FORUM_AD_DEFAULT_MUTED;
}
// ===== FIXED AD SLOT HEIGHT (px) =====
// Контент внутри вписывается, но высота/ширина слота не растут.
const AD_SLOT_HEIGHT_PX = {
  mobile: 520,   // < 640px
  tablet: 620,   // 640..1023px
  desktop: 650,  // >= 1024px
};
const AD_LENS_UI = Object.freeze({
  sizePx: 40,
  rightPx: 10,
  bottomPx: 10,

  strokeColor: '#6fe7ff',
  handleColor: '#b77dff',
  outlineColor: 'rgba(255, 215, 120, .96)',
  glowColor: 'rgba(111, 231, 255, .42)',
  glowColor2: 'rgba(183, 125, 255, .22)',

  opacity: 0.98,
  outlineWidth: 1,
  ringWidth: 1.8,
  handleWidth: 2.2,
  orbitWidth: 1,

  floatDurationMs: 2800,
  sweepDurationMs: 2400,
  pulseDurationMs: 1800,
  sparkleDurationMs: 1600,
});
const CAMPAIGN_ID = 'forum_ads_v1';
const FALLBACK_CAMPAIGN_SEED = 'forum_ads_seed';


const DEFAULT_THUMB_SERVICES = [
  'https://image.thum.io/get/width/960/{url}',
  'https://s.wordpress.com/mshots/v1/{url}?w=960',
  'https://image.microlink.io/?url={url}&screenshot=true&meta=false',
];
 
/**
 * ВАЖНО: только статические обращения к NEXT_PUBLIC_*
 */
/* eslint-disable no-undef */
const ENV_AD = {
  EVERY: process.env.NEXT_PUBLIC_FORUM_AD_EVERY,
  ROTATE_MIN: process.env.NEXT_PUBLIC_FORUM_AD_ROTATE_MIN,
  PREVIEW: process.env.NEXT_PUBLIC_FORUM_AD_PREVIEW,
  DEBUG: process.env.NEXT_PUBLIC_FORUM_AD_DEBUG,
  LINKS: process.env.NEXT_PUBLIC_FORUM_AD_LINKS,
  THUMB_SERVICES: process.env.NEXT_PUBLIC_FORUM_AD_THUMB_SERVICES,
};
/* eslint-enable no-undef */

let cachedClientConf = null;
const mediaKindDetectCache = new Map();
const mediaKindDetectInflight = new Map();
const MEDIA_KIND_CACHE_OK_MS = 10 * 60 * 1000;
const MEDIA_KIND_CACHE_FAIL_MS = 45 * 1000;
const imageProbeCache = new Map();
const imageProbeInflight = new Map();
const IMAGE_PROBE_CACHE_OK_MS = 12 * 60 * 1000;
const IMAGE_PROBE_CACHE_FAIL_MS = 75 * 1000;
const microlinkMetaCache = new Map();
const microlinkMetaInflight = new Map();
const MICROLINK_META_CACHE_OK_MS = 10 * 60 * 1000;
const MICROLINK_META_CACHE_FAIL_MS = 90 * 1000;
const adMediaResolveCache = new Map();
const adMediaResolveInflight = new Map();
const AD_MEDIA_RESOLVE_CACHE_OK_MS = 12 * 60 * 1000;
const AD_MEDIA_RESOLVE_CACHE_FAIL_MS = 10 * 60 * 1000;

// Native video must be attached imperatively, not through React `src` state.
// Otherwise every visibility / preload re-render may reset the <video src>
// and Chrome starts a new set of HTTP Range / 206 requests.
const AD_NATIVE_VIDEO_PRELOAD_IDLE = 'none';
const AD_NATIVE_VIDEO_PRELOAD_PLAY = 'auto';

function getAdVideoNodeSrc(videoEl) {
  if (!videoEl) return '';
  try {
    return String(videoEl.currentSrc || videoEl.getAttribute('src') || '').trim();
  } catch {
    return '';
  }
}

function detachAdNativeVideo(videoEl) {
  if (!videoEl) return;
const hadSrc = (() => {
  try {
    return !!String(videoEl.currentSrc || videoEl.getAttribute?.('src') || videoEl.dataset?.adNativeSrc || '').trim();
  } catch {
    return false;
  }
})();

if (!hadSrc) {
  try { videoEl.preload = AD_NATIVE_VIDEO_PRELOAD_IDLE; } catch {}

  try {
    if (videoEl.dataset) {
      videoEl.dataset.__adLoadPending = '0';
      videoEl.dataset.__adWarmOwner = '0';
    }
  } catch {}

  return;
}  
  try { videoEl.pause?.(); } catch {}
  try { videoEl.removeAttribute('src'); } catch {}
  try { videoEl.removeAttribute('data-ad-native-src'); } catch {}
  try { if (videoEl.dataset) videoEl.dataset.__adLoadPending = '0'; } catch {}
  try { videoEl.preload = AD_NATIVE_VIDEO_PRELOAD_IDLE; } catch {}
  try { videoEl.load?.(); } catch {}
}

function ensureAdNativeVideoSrc(videoEl, src, muted) {
  if (!videoEl) return false;

  const nextSrc = String(src || '').trim();
  if (!nextSrc) return false;

  applyForumAdMutedToVideo(videoEl, muted);

  const currentSrc = getAdVideoNodeSrc(videoEl);
  const attachedSrc = (() => {
    try { return String(videoEl.dataset?.adNativeSrc || '').trim(); }
    catch { return ''; }
  })();

  if (currentSrc === nextSrc || attachedSrc === nextSrc) {
    try { videoEl.preload = AD_NATIVE_VIDEO_PRELOAD_PLAY; } catch {}
    return true;
  }

  try { videoEl.pause?.(); } catch {}
  try { videoEl.preload = AD_NATIVE_VIDEO_PRELOAD_PLAY; } catch {}
  try { videoEl.src = nextSrc; } catch {
    try { videoEl.setAttribute('src', nextSrc); } catch {}
  }
  try { videoEl.dataset.adNativeSrc = nextSrc; } catch {}

  // load() разрешён только при реальной смене URL, не на scroll/focus jitter.
  try {
    if (videoEl.dataset) {
      const now = Date.now();
      videoEl.dataset.__adLoadPending = '1';
      videoEl.dataset.__adLastAttachTs = String(now);
      videoEl.dataset.__adLastWarmLoadTs = String(now);
    }
    videoEl.load?.();
  } catch {}

  return true;
}
const AD_NATIVE_WARM_STICKY_MS = 3000;
const AD_NATIVE_WARM_RELOAD_GAP_MS = 14000;
let adNativeWarmSlot = { video: null, src: '', ts: 0 };

function getAdViewportState(el) {
  try {
    if (!el?.isConnected) {
      return { gapPx: Number.POSITIVE_INFINITY, isAbove: false, isBelow: false, inViewport: false };
    }
    const rect = el.getBoundingClientRect?.();
    const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0;
    if (!rect || viewportH <= 0) {
      return { gapPx: Number.POSITIVE_INFINITY, isAbove: false, isBelow: false, inViewport: false };
    }
    if (rect.bottom < 0) return { gapPx: Math.abs(Number(rect.bottom || 0)), isAbove: true, isBelow: false, inViewport: false };
    if (rect.top > viewportH) return { gapPx: Number(rect.top || 0) - viewportH, isAbove: false, isBelow: true, inViewport: false };
    return { gapPx: 0, isAbove: false, isBelow: false, inViewport: true };
  } catch {
    return { gapPx: Number.POSITIVE_INFINITY, isAbove: false, isBelow: false, inViewport: false };
  }
}

function getAdViewportGapPx(el) {
  return getAdViewportState(el).gapPx;
}

function isAdNativeVideoLoadingOrReady(videoEl) {
  try {
    if (!videoEl) return false;
    const hasSrc = !!String(videoEl.currentSrc || videoEl.getAttribute?.('src') || '').trim();
    if (!hasSrc) return false;
    if (Number(videoEl.readyState || 0) >= 1) return true;
    const ns = Number(videoEl.networkState || 0);
    if (typeof HTMLMediaElement !== 'undefined') {
      return ns === HTMLMediaElement.NETWORK_LOADING || ns === HTMLMediaElement.NETWORK_IDLE;
    }
    return ns === 2 || ns === 1;
  } catch {
    return false;
  }
}

function releaseAdNativeWarmSlot(videoEl, reason = 'release') {
  try {
    if (!videoEl || adNativeWarmSlot.video !== videoEl) return;

    const reasonKey = String(reason || 'release');
    const state = getAdViewportState(videoEl);
    const keepNearExitWarm =
      reasonKey === 'near_exit' &&
      videoEl.paused &&
      isAdNativeVideoLoadingOrReady(videoEl) &&
      state.gapPx <= 2200;

    // Near observer может мигнуть на резком scroll/windowing. Если в этот момент оборвать
    // единственный warm-slot, Chrome отменяет текущий Range и при возврате начинает новый 206.
    // Поэтому near_exit не убивает живой близкий warm; replace/unmount/bad_src по-прежнему освобождают.
    if (keepNearExitWarm) {
      adNativeWarmSlot = {
        video: videoEl,
        src: String(videoEl.dataset?.adNativeSrc || videoEl.currentSrc || videoEl.getAttribute?.('src') || adNativeWarmSlot.src || ''),
        ts: Date.now(),
      };
      try {
        if (videoEl.dataset) videoEl.dataset.__adWarmOwner = '1';
        videoEl.preload = AD_NATIVE_VIDEO_PRELOAD_PLAY;
      } catch {}
      return;
    }

    adNativeWarmSlot = { video: null, src: '', ts: 0 };
    try { if (videoEl.dataset) videoEl.dataset.__adWarmOwner = '0'; } catch {}

    // Single-source rule: when a slot really loses the controlled warm owner and is not playing,
    // detach it. Only the near_exit jitter path above is allowed to keep the single warm alive.
    if (videoEl.paused) detachAdNativeVideo(videoEl);
  } catch {}
}

function claimAdNativeWarmSlot(videoEl, src, ownerEl) {
  try {
    const nextSrc = String(src || '').trim();
    if (!videoEl || !nextSrc) return false;

    const prev = adNativeWarmSlot.video;
    if (prev === videoEl && adNativeWarmSlot.src === nextSrc) {
      adNativeWarmSlot.ts = Date.now();
      return true;
    }

    if (prev && prev !== videoEl && prev.isConnected) {
      if (!prev.paused) return false;

      const now = Date.now();
      const age = now - Number(adNativeWarmSlot.ts || 0);
const prevState = getAdViewportState(prev);
const nextState = getAdViewportState(ownerEl || videoEl);
const prevGap = prevState.gapPx;
const nextGap = nextState.gapPx;
const prevLoading = isAdNativeVideoLoadingOrReady(prev);
const sameSrc = String(adNativeWarmSlot.src || '') === nextSrc;
const prevIsBehindRunway = (prevState.isAbove || prevState.isBelow) && prevGap > 900;
const nextInsideRunway = nextGap <= 1900;
const nextClearlyCloser =
  nextGap + 180 < prevGap ||
  (prevIsBehindRunway && nextInsideRunway);

// Если тот же ADS.mp4 уже греется, не переключаем owner при каждом jitter/scroll.
// Но если прошлый owner уже уехал за runway, а следующий слот входит в runway — передаём warm.
if (sameSrc && prevLoading && age < AD_NATIVE_WARM_RELOAD_GAP_MS && !nextClearlyCloser) {
  return false;
}

if (age < AD_NATIVE_WARM_STICKY_MS && !nextClearlyCloser) {
  return false;
}

      releaseAdNativeWarmSlot(prev, 'replace');
    }

    adNativeWarmSlot = { video: videoEl, src: nextSrc, ts: Date.now() };
    try { if (videoEl.dataset) videoEl.dataset.__adWarmOwner = '1'; } catch {}
    return true;
  } catch {
    return false;
  }
}
// ======================= ADS LINKS FROM REDIS =======================

let adsLinksMerged = false;

async function mergeLinksFromRedisOnce() {
  if (!isBrowser()) return;
  if (adsLinksMerged) return;
  adsLinksMerged = true;

  try {
    // берём ссылки через универсальный /api/ads?action=links
    const res = await fetch('/api/ads?action=links', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return;
    const j = await res.json().catch(() => null);
    if (!j || !j.ok || !j.linksString) return;

    const extraParsed = parseLinks(j.linksString);
    if (!extraParsed.links || !extraParsed.links.length) return;

    const base = getForumAdConf(); // берём текущий кэш
    const baseLinks = Array.isArray(base.LINKS) ? base.LINKS : [];

    // Если ENV пустые — baseLinks = [], значит используем только базу.
    // Если ENV есть — объединяем ENV + база.
    const mergedLinks = baseLinks.length
      ? [...baseLinks, ...extraParsed.links]
      : extraParsed.links;

    // MEDIA_BY_CLICK теперь: clickUrl -> массив медиа
    const mergedMedia = { ...(base.MEDIA_BY_CLICK || {}) };
    const extraMedia = extraParsed.mediaByClick || {};

    for (const [clickUrl, list] of Object.entries(extraMedia)) {
      if (!Array.isArray(list) || !list.length) continue;
      const prev = mergedMedia[clickUrl];
      if (!prev) {
        mergedMedia[clickUrl] = [...list];
      } else if (Array.isArray(prev)) {
        mergedMedia[clickUrl] = [...prev, ...list];
      } else {
        mergedMedia[clickUrl] = [prev, ...list];
      }
    }

    // БОЛЬШЕ НЕ ДЕДУПИМ ссылки — оставляем все вхождения
    const cleanedLinks = mergedLinks.filter(Boolean);

    base.LINKS = cleanedLinks;
    base.MEDIA_BY_CLICK = mergedMedia;

    debugLog(base, 'merge_links_from_redis', {
      env_len: baseLinks.length,
      extra_len: extraParsed.links.length,
      final_len: cleanedLinks.length,
    });
  } catch {
    /* no-op */
  }
}

/* ======================= UTILS ======================= */

function isBrowser() {
  return typeof window !== 'undefined';
}

function getWin() {
  return isBrowser() ? window : null;
}

function debugLog(conf, ...args) {
  // ads debug disabled: no console output in browser
  return;
}


function hash32(str) {
  str = String(str || '');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function stableShuffle(arr, seed) {
  const res = arr.slice();
  let s = seed || 1;
  for (let i = res.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = res[i];
    res[i] = res[j];
    res[j] = t;
  }
  return res;
}

/* ======================= CONFIG ======================= */
/**
 * Приоритет:
 * 1) ?FORUM_AD_*
 * 2) localStorage.FORUM_AD_*
 * 3) window.FORUM_CONF.FORUM_AD_*
 * 4) NEXT_PUBLIC_FORUM_AD_* (ENV_AD)
 */

function readRaw(key) {
  const queryKey = `FORUM_AD_${key}`;

  const pick = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
  };

  // 1) query
  if (isBrowser()) {
    try {
      const sp = new URLSearchParams(window.location.search || '');
      if (sp.has(queryKey)) {
        const v = pick(sp.get(queryKey));
        if (v !== null) return v;
      }
    } catch {}
  }

  // 2) localStorage
  if (isBrowser()) {
    try {
      const v = pick(window.localStorage?.getItem(queryKey));
      if (v !== null) return v;
    } catch {}
  }

  // 3) window.FORUM_CONF / __FORUM_CONF__
  if (isBrowser()) {
    try {
      const src = window.FORUM_CONF || window.__FORUM_CONF__;
      if (src && Object.prototype.hasOwnProperty.call(src, queryKey)) {
        const v = pick(src[queryKey]);
        if (v !== null) return v;
      }
    } catch {}
  }

  // 4) ENV
  const envVal = pick(ENV_AD[key]);
  if (envVal !== null) return envVal;

  return null;
}

function parseNumber(v, def) {
  if (v == null) return def;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

function normalizeUrl(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;

  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;

  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  u.hostname = u.hostname.toLowerCase();

  if (u.pathname !== '/' && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.slice(0, -1);
  }

  // сортированный query для стабильного hash
  if (u.search) {
    const entries = Array.from(u.searchParams.entries()).sort((a, b) =>
      a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0
    );
    u.search = '';
    for (const [k, val] of entries) u.searchParams.append(k, val);
  }

  return u.toString();
}

/**
 * LINKS: CSV / ; / пробел / \n, поддержка # комментариев
 *
 * Формат одной записи:
 *   https://site.com
 *   https://click.url|https://media.url
 *
 * ▸ если одна часть → и кликаем, и показываем её
 * ▸ если через | → слева clickUrl, справа mediaUrl
 *
 * ВАЖНО: больше НЕТ дедупа — каждое вхождение остаётся.
 * Дополнительно:
 *   MEDIA_BY_CLICK[clickUrl] = [media1, media2, ...]
 */
function parseLinks(raw) {
  if (!raw) return { links: [], mediaByClick: {} };

  const tokens = String(raw)
    .split(/[\s,;]+/)
    .map((s) => s.replace(/#.*/, '').trim())
    .filter(Boolean);

  const links = [];
  const mediaByClick = {};

  for (const t of tokens) {
    const parts = t.split('|');
    const clickRaw = (parts[0] || '').trim();
    const mediaRaw = (parts[1] || '').trim();

    const clickNorm = normalizeUrl(clickRaw);
    if (!clickNorm) continue;

    const mediaNorm = normalizeUrl(mediaRaw || clickNorm) || clickNorm;

    // добавляем каждое вхождение в общий список
    links.push(clickNorm);

    // собираем массив медиа для каждого клик-URL
    if (!mediaByClick[clickNorm]) {
      mediaByClick[clickNorm] = [mediaNorm];
    } else if (Array.isArray(mediaByClick[clickNorm])) {
      mediaByClick[clickNorm].push(mediaNorm);
    } else {
      mediaByClick[clickNorm] = [mediaByClick[clickNorm], mediaNorm];
    }
  }

  return { links, mediaByClick };
}

function parseThumbs(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[\s,;]+/)
    .map((s) => s.replace(/#.*/, '').trim())
    .filter(Boolean);
}

export function getForumAdConf() {
  if (isBrowser() && cachedClientConf) return cachedClientConf;
  // Параллельно пробуем подтянуть рекламные кампании из Redis
  if (isBrowser()) {
    // fire-and-forget, результат мутирует cachedClientConf, когда готово
    mergeLinksFromRedisOnce().catch(() => {});
  }
  const EVERY = parseNumber(readRaw('EVERY'), 0);
  const ROTATE_MIN = parseNumber(readRaw('ROTATE_MIN'), 1);

  const PREVIEW_RAW = (readRaw('PREVIEW') || 'auto').toLowerCase();
  const PREVIEW =
    PREVIEW_RAW === 'screenshot' || PREVIEW_RAW === 'favicon'
      ? PREVIEW_RAW
      : 'auto';

  const parsed = parseLinks(readRaw('LINKS') || '');
  const LINKS = parsed.links || [];
  const MEDIA_BY_CLICK = parsed.mediaByClick || {};

  const THUMBS_RAW = parseThumbs(readRaw('THUMB_SERVICES') || '');
  const DEBUG = String(readRaw('DEBUG') || '').trim() === '1';

  const conf = {
    EVERY,
    ROTATE_MIN,
    PREVIEW,
    LINKS,
    MEDIA_BY_CLICK,
    THUMBS: THUMBS_RAW.length ? THUMBS_RAW : DEFAULT_THUMB_SERVICES.slice(),
    DEBUG,
    seed: hash32(`${CAMPAIGN_ID}:${FALLBACK_CAMPAIGN_SEED}:${LINKS.length}`),
  };

  if (isBrowser()) cachedClientConf = conf;

  debugLog(conf, 'config_built', {
    EVERY,
    ROTATE_MIN,
    PREVIEW,
    LINKS_LEN: LINKS.length,
    THUMBS_LEN: conf.THUMBS.length,
  });

  return conf;
}

/* ======================= INTERLEAVE ======================= */

export function interleaveAds(items, EVERY, opts = {}) {
  const { isSkippable, getId } = opts;
  const out = [];

  if (!Array.isArray(items) || !items.length) return [];

  if (!EVERY || EVERY <= 0) {
    return items.map((item, i) => ({ type: 'item', item, key: `i:${i}` }));
  }

  let contentCount = 0;
  let adIndex = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    out.push({ type: 'item', item, key: `i:${i}` });

    const skip =
      typeof isSkippable === 'function' ? !!isSkippable(item) : false;

    if (!skip) {
      contentCount++;
      if (contentCount % EVERY === 0) {
        const rawId =
          (typeof getId === 'function' && getId(item)) ||
          item?.id ||
          item?.postId ||
          item?.topicId ||
          `idx${i}`;
        const nearId = String(rawId || `idx${i}`);
        const key = `ad:${nearId}:${adIndex++}`;
        out.push({ type: 'ad', key, nearId });
      }
    }
  }

  const conf = getForumAdConf();
  debugLog(conf, 'interleave', {
    EVERY,
    in: items.length,
    out: out.length,
    ads: out.filter((s) => s.type === 'ad').length,
  });

  return out;
}

/* ======================= COORDINATOR ======================= */

class AdsCoordinatorImpl {
  constructor() {
    this.frames = new Map(); // frameId -> Set(url)
    this.history = []; // последние показы (глобально)
    this.lastBySeedKey = new Map(); // slotKey -> url
    this.lastFrameId = 0;
    this.lastFrameTs = 0;
  }

  _ensureFrame(frameId) {
    if (!this.frames.has(frameId)) {
      this.frames.set(frameId, new Set());
    }
    return this.frames.get(frameId);
  }

  getFrameId(nowMs) {
    const now = Number.isFinite(nowMs) ? nowMs : Date.now();

    if (!this.lastFrameId) {
      this.lastFrameId = 1;
      this.lastFrameTs = now;
    } else if (now - this.lastFrameTs > 250) {
      this.lastFrameId++;
      this.lastFrameTs = now;

      if (this.lastFrameId > 40) {
        const dropTo = this.lastFrameId - 20;
        for (const id of this.frames.keys()) {
          if (id < dropTo) this.frames.delete(id);
        }
      }
    }

    this._ensureFrame(this.lastFrameId);
    return this.lastFrameId;
  }

  reserve(url, frameId) {
    if (!url || frameId == null) return true;
    const bucket = this._ensureFrame(frameId);
    if (bucket.has(url)) return false; // не рисуем один и тот же урл в нескольких слотах одного кадра
    bucket.add(url);
    return true;
  }

  bump(url) {
    if (!url) return;
    this.history.push(url);
    if (this.history.length > 200) {
      this.history = this.history.slice(-200);
    }
  }

  getLastGlobal() {
    if (!this.history.length) return null;
    return this.history[this.history.length - 1];
  }

  allowed(url, linksLen) {
    if (!url) return false;
    const last = this.getLastGlobal();
    if (last && last === url && linksLen > 1) {
      // не даём тот же урл подряд глобально, если есть альтернатива
      return false;
    }
    return true;
  }

  setLastForSeed(seedKey, url) {
    if (!seedKey || !url) return;
    this.lastBySeedKey.set(String(seedKey), url);
  }

  getLastForSeed(seedKey) {
    if (!seedKey) return null;
    return this.lastBySeedKey.get(String(seedKey)) || null;
  }
}

export const AdsCoordinator = new AdsCoordinatorImpl();

/* ======================= URL PICKER ======================= */
/**
 * Детально:
 * - ротация по ROTATE_MIN минут
 * - сид завязан на (campaign, seed, clientId, slotKey, timeBucket)
 * - каждый слот — своя перестановка ссылок
 * - не даём подряд одинаковый урл глобально и для данного slotKey, если есть выбор
 */

export function resolveCurrentAdUrl(
  rawConf,
  clientId,
  nowMs,
  slotKey,
  coordinator = AdsCoordinator
) {
  const baseConf = rawConf || getForumAdConf();
  const conf = { ...baseConf };

  let links = Array.isArray(conf.LINKS) ? conf.LINKS.filter(Boolean) : [];
 
  if (!links.length) {
    debugLog(conf, 'slot_no_links_no_fallback', { slotKey });
    return null;
  }

  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const cid = String(clientId || 'guest');
  const key = String(slotKey || 'slot');

  const rotateMin = Number(conf.ROTATE_MIN || 1);
  const periodMs = Math.max(1, rotateMin) * 60_000;
  const timeBucket = Math.floor(now / periodMs);

  // фиксированный сид для конкретного слота и тайм-слота
  const seed = hash32(
    [CAMPAIGN_ID, conf.seed || 1, cid, key, timeBucket, links.length].join('|')
  );

  const perm = stableShuffle(links, seed);
  if (!perm.length) {
    debugLog(conf, 'slot_no_perm', { slotKey });
    return null;
  }

  const frameId = coordinator?.getFrameId(now);
  const lastForSeed = coordinator?.getLastForSeed(key);
  const lastGlobal = coordinator?.getLastGlobal();

  let chosen = null;

  for (let i = 0; i < perm.length; i++) {
    const thisUrl = perm[i];
    if (!thisUrl) continue;

    // не повторяем подряд для этого слота
    if (lastForSeed && thisUrl === lastForSeed && perm.length > 1) continue;

    // не повторяем подряд глобально, если есть выбор
    if (lastGlobal && thisUrl === lastGlobal && perm.length > 1) continue;

    if (coordinator && !coordinator.allowed(thisUrl, perm.length)) continue;
    if (coordinator && frameId != null && !coordinator.reserve(thisUrl, frameId))
      continue;

    chosen = thisUrl;
    break;
  }

  if (!chosen) {
    chosen = perm[0];
    if (!chosen) {
      debugLog(conf, 'slot_no_pick', { slotKey, linksLen: perm.length });
      return null;
    }
  }

  if (coordinator) {
    coordinator.bump(chosen);
    coordinator.setLastForSeed(key, chosen);
  }

  debugLog(conf, 'slot_pick', { slotKey: key, url: chosen });

  return chosen;
}

/* ======================= PRECONNECT ======================= */

let preconnectDone = false;

export function useAdPreconnect(conf) {
  conf = conf || getForumAdConf();

  useEffect(() => {
    if (preconnectDone || !isBrowser()) return;
    const doc = document;
    if (!doc?.head) return;

    const templates =
      conf.THUMBS && conf.THUMBS.length
        ? conf.THUMBS
        : DEFAULT_THUMB_SERVICES;

    const origins = new Set();
    for (const tpl of templates) {
      try {
        const test = tpl.replace('{url}', 'https://example.com');
        const u = new URL(test);
        origins.add(u.origin);
      } catch {}
    }

    origins.forEach((origin) => {
      try {
        if (doc.querySelector(`link[data-ads-preconnect="${origin}"]`)) return;

        const l1 = doc.createElement('link');
        l1.rel = 'preconnect';
        l1.href = origin;
        l1.setAttribute('data-ads-preconnect', origin);
        doc.head.appendChild(l1);

        const l2 = doc.createElement('link');
        l2.rel = 'dns-prefetch';
        l2.href = origin;
        l2.setAttribute('data-ads-preconnect', origin + ':dns');
        doc.head.appendChild(l2);
      } catch {}
    });

    preconnectDone = true;
  }, [conf]);
}

/* ======================= EVENTS & MEDIA ======================= */

function emitAdEvent(type, payload, conf) {
  const detail = {
    type,
    ts: Date.now(),
    campaignId: CAMPAIGN_ID,
    ...payload,
  };
  debugLog(conf, type, detail);

  const w = getWin();
  if (w && typeof w.dispatchEvent === 'function') {
    try {
      w.dispatchEvent(new CustomEvent('ads:event', { detail }));
    } catch {}
  }

  // Серверная аналитика для пользовательских кампаний
  if (type === 'ad_impression' || type === 'ad_click') {
    try {
      const body = {
        action: 'event', // работаем через единый /api/ads
        type, // 'ad_impression' | 'ad_click'
        url_hash: detail.url_hash,
        slot_kind: detail.slot_kind,
        near_id: detail.near_id,
      };
      fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* no-op */
    }
  }
}

function tryLoadImage(src, timeoutMs = 3000) {
  const key = String(src || '').trim();
  if (!key || !isBrowser() || !('Image' in window)) return Promise.resolve(false);

  const now = Date.now();
  const cached = imageProbeCache.get(key);
  if (cached && Number(cached.until || 0) > now) return Promise.resolve(!!cached.ok);
  if (cached) imageProbeCache.delete(key);

  const inflight = imageProbeInflight.get(key);
  if (inflight) return inflight;

  const task = new Promise((resolve) => {
    const img = new window.Image();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      imageProbeCache.set(key, {
        ok: !!ok,
        until: Date.now() + (ok ? IMAGE_PROBE_CACHE_OK_MS : IMAGE_PROBE_CACHE_FAIL_MS),
      });
      if (imageProbeCache.size > 360) {
        let drop = imageProbeCache.size - 360;
        for (const oldKey of imageProbeCache.keys()) {
          imageProbeCache.delete(oldKey);
          drop -= 1;
          if (drop <= 0) break;
        }
      }
      resolve(!!ok);
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    try { img.referrerPolicy = 'no-referrer'; } catch {}
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.src = key;
  });

  imageProbeInflight.set(key, task);
  return task.finally(() => {
    imageProbeInflight.delete(key);
  });
}

function shouldProbeMediaKind(rawUrl) {
  const s = String(rawUrl || '').trim();
  if (!s) return false;
  if (/^blob:/i.test(s)) return true;
  if (/\.(webm|mp4|mov|m4v|mkv|jpe?g|png|webp|gif|avif)(?:$|[?#])/i.test(s)) return true;
  if (/[?&]filename=.*\.(webm|mp4|mov|m4v|mkv|jpe?g|png|webp|gif|avif)(?:$|[?#])/i.test(s)) return true;
  if (/vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo/i.test(s)) return true;
  try {
    const u = new URL(s, window.location.href);
    if (u.origin === window.location.origin) {
      // Не пробуем HEAD/GET на произвольных slug-страницах внутри нашего origin
      // (например news/article permalink), иначе это создаёт лишние красные ошибки в HAR.
      const path = String(u.pathname || '').toLowerCase();
      if (/\.(webm|mp4|mov|m4v|mkv|jpe?g|png|webp|gif|avif)$/.test(path)) return true;
      if (
        path.startsWith('/forum/video') ||
        path.startsWith('/uploads/video') ||
        path.startsWith('/api/forum/uploadvideo') ||
        path.startsWith('/api/forum/wa-preview')
      ) return true;
      return false;
    }
  } catch {}
  return false;
}

// Определяем тип медиа по Content-Type через HEAD
async function detectMediaKind(url, timeoutMs = 3000, opts = {}) {
  if (!url || !isBrowser() || typeof fetch === 'undefined') return null;

  const key = String(url).trim();
  if (!key) return null;
  if (!shouldProbeMediaKind(key)) return null;

  const now = Date.now();
  const cached = mediaKindDetectCache.get(key);
  if (cached && Number(cached.until || 0) > now) {
    return cached.kind || null;
  }
  if (cached) mediaKindDetectCache.delete(key);

  const inflight = mediaKindDetectInflight.get(key);
  if (inflight) return inflight;

  const classify = (ct) => {
    const s = String(ct || '').toLowerCase();
    if (!s) return null;
    if (s.startsWith('video/')) return 'video';
    if (s.startsWith('image/')) return 'image';
    return null;
  };
  const persist = (kind, ok = false) => {
    mediaKindDetectCache.set(key, {
      kind: kind || null,
      until: Date.now() + (ok ? MEDIA_KIND_CACHE_OK_MS : MEDIA_KIND_CACHE_FAIL_MS),
    });
    if (mediaKindDetectCache.size > 320) {
      let drop = mediaKindDetectCache.size - 320;
      for (const oldKey of mediaKindDetectCache.keys()) {
        mediaKindDetectCache.delete(oldKey);
        drop -= 1;
        if (drop <= 0) break;
      }
    }
    return kind || null;
  };

  const task = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
const headResp = await fetch(key, {
  method: 'HEAD',
  signal: controller.signal,
  cache: 'default',
  referrerPolicy: 'no-referrer',
}).catch(() => null);
      if (headResp) {
        const byHeadCt = classify(headResp.headers.get('content-type'));
        if (byHeadCt) return persist(byHeadCt, true);
      }

// В рекламе по умолчанию НЕ делаем GET Range bytes=0-1.
// Такой probe сам даёт лишний 206 для native video.
if (opts?.allowRangeFallback === true) {
  const getResp = await fetch(key, {
    method: 'GET',
    headers: { Range: 'bytes=0-1' },
    signal: controller.signal,
    cache: 'default',
    referrerPolicy: 'no-referrer',
  }).catch(() => null);
  if (getResp) {
    const byGetCt = classify(getResp.headers.get('content-type'));
    if (byGetCt) return persist(byGetCt, true);
  }
}

      return persist(null, false);
    } catch {
      return persist(null, false);
    } finally {
      clearTimeout(timer);
    }
  })();

  mediaKindDetectInflight.set(key, task);
  try {
    return await task;
  } finally {
    mediaKindDetectInflight.delete(key);
  }
}

function readCachedAdResolvedMedia(key) {
  const nextKey = String(key || '').trim();
  if (!nextKey) return null;
  const row = adMediaResolveCache.get(nextKey);
  if (!row) return null;
  if (Number(row.until || 0) <= Date.now()) {
    adMediaResolveCache.delete(nextKey);
    return null;
  }
  return row.media || null;
}

function cacheAdResolvedMedia(key, media, ok = true) {
  const nextKey = String(key || '').trim();
  if (!nextKey || !media) return;
  adMediaResolveCache.set(nextKey, {
    media,
    until: Date.now() + (ok ? AD_MEDIA_RESOLVE_CACHE_OK_MS : AD_MEDIA_RESOLVE_CACHE_FAIL_MS),
  });
  if (adMediaResolveCache.size > 420) {
    let drop = adMediaResolveCache.size - 420;
    for (const oldKey of adMediaResolveCache.keys()) {
      adMediaResolveCache.delete(oldKey);
      drop -= 1;
      if (drop <= 0) break;
    }
  }
}

async function fetchMicrolinkMeta(url) {
  const key = String(url || '').trim();
  if (!key || !isBrowser() || typeof fetch === 'undefined') return null;
  const now = Date.now();
  const cached = microlinkMetaCache.get(key);
  if (cached && Number(cached.until || 0) > now) return cached.value || null;
  if (cached) microlinkMetaCache.delete(key);
  const inflight = microlinkMetaInflight.get(key);
  if (inflight) return inflight;

  const task = (async () => {
    try {
      const q =
        'https://api.microlink.io/?url=' +
        encodeURIComponent(key) +
        '&screenshot=true&meta=true&video=false&audio=false&iframe=false&waitFor=2000';
      const resp = await fetch(q).catch(() => null);
      const data = await resp?.json().catch(() => null);
      const meta = data?.data || null;
      microlinkMetaCache.set(key, {
        value: meta,
        until: Date.now() + (meta ? MICROLINK_META_CACHE_OK_MS : MICROLINK_META_CACHE_FAIL_MS),
      });
      return meta;
    } catch {
      microlinkMetaCache.set(key, {
        value: null,
        until: Date.now() + MICROLINK_META_CACHE_FAIL_MS,
      });
      return null;
    }
  })();

  microlinkMetaInflight.set(key, task);
  try {
    return await task;
  } finally {
    microlinkMetaInflight.delete(key);
  }
}

function isLikelyVideoUrl(raw) {
  if (!raw) return false;
  const s = String(raw).trim();
  if (!s) return false;

  if (/^blob:/i.test(s)) return true;

  // нормальные видео по расширению
  if (/\.(webm|mp4|mov|m4v|mkv)(?:$|[?#])/i.test(s)) return true;

  // filename=...mp4 в query
  if (/[?&]filename=.*\.(webm|mp4|mov|m4v|mkv)(?:$|[?#])/i.test(s)) return true;

  // только явные video-эндпоинты
  if (
    /vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo/i.test(
      s
    )
  ) {
    return true;
  }

  return false;
}

const YT_RE =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;

const TIKTOK_RE =
  /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/(?:@[\w.\-]+\/video\/(\d+)|t\/[A-Za-z0-9]+)(?:[?#].*)?$/i;

/* ====== вспомогательное хранилище для анти-повтора медиы по слоту ====== */

const lastMediaIndexByKey = new Map();

/* ======================= AdCard ======================= */
/**
 * OG video/screenshot/image → direct file → YouTube/TikTok → screenshot CDNs → favicon → placeholder
 * Бейдж "Реклама" из словаря: ключ forum_ad_label.
 * Превью тянет карточку на всю доступную высоту.
 */

export function AdCard({ url, slotKind, nearId, layout = 'fixed' }) {
  const conf = getForumAdConf();
  useAdPreconnect(conf);
  const i18n = useI18n();
  const t = i18n?.t;
  const router = useRouter();
  const isFluid = layout === 'fluid';
  const [media, setMedia] = useState({ kind: 'skeleton', src: null });

  // Стартовое состояние рекламы:
  // 1) сначала читаем document/window;
  // 2) если там пусто — fallback muted=true;
  // 3) это состояние сразу используется первым render.
  const startupMutedRef = useRef(null);
  if (startupMutedRef.current == null) {
    startupMutedRef.current = resolveForumAdStartupMuted();
  }

  const [muted, setMuted] = useState(() =>
    normalizeForumAdMuted(startupMutedRef.current?.muted)
  );

  // уникальный id инстанса, чтобы не ловить свой же event
  const playerIdRef = useRef(
    `ad_${Math.random().toString(36).slice(2)}_${Date.now()}`
  );

  // init muted from global document/window state.
  // Если document/window был пустой — сюда уже пришёл fallback muted=true,
  // и мы сразу раскладываем его в общий document/window + storage.
useEffect(() => {
  const startup = startupMutedRef.current || resolveForumAdStartupMuted();
  const next = commitForumAdMutedState(startup.muted);

  setMuted((prev) => (prev === next ? prev : next));

  // Если video уже существует — синхронизируем DOM property/attribute.
  applyForumAdMutedToVideo(videoRef.current, next);

  // Если YouTube player уже существует — синхронизируем его тоже.
  if (ytPlayerRef.current) {
    try {
      if (next) ytPlayerRef.current.mute?.();
      else ytPlayerRef.current.unMute?.();
    } catch {}
  }
}, []);
  // текущий выбранный mediaHref (конкретный youtube / картинка и т.п.)
  const [mediaHref, setMediaHref] = useState(null);

const rootRef = useRef(null);
const videoRef = useRef(null);
const attachedVideoSrcRef = useRef('');
const adNativePrimeTsRef = useRef(0);
const adNativePauseRecoveryRef = useRef({ timer: 0, ts: 0, count: 0 });
const adNativeFocusKickTsRef = useRef(0);
const ytIframeRef = useRef(null);
const ytPlayerRef = useRef(null);
  const videoErrorUntilRef = useRef(new Map());
  const isVideoSrcTemporarilyBlocked = (src) => {
    const key = String(src || '').trim();
    if (!key) return false;
    const until = Number(videoErrorUntilRef.current.get(key) || 0);
    if (!until) return false;
    if (until <= Date.now()) {
      videoErrorUntilRef.current.delete(key);
      return false;
    }
    return true;
  };
  const markVideoSrcTemporarilyBlocked = (src, ms = 20000) => {
    const key = String(src || '').trim();
    if (!key) return;
    videoErrorUntilRef.current.set(key, Date.now() + Math.max(2500, Number(ms || 0)));
    if (videoErrorUntilRef.current.size > 120) {
      let drop = videoErrorUntilRef.current.size - 120;
      for (const oldKey of videoErrorUntilRef.current.keys()) {
        videoErrorUntilRef.current.delete(oldKey);
        drop -= 1;
        if (drop <= 0) break;
      }
    }
  };
  const clearVideoSrcBlock = (src) => {
    const key = String(src || '').trim();
    if (!key) return;
    videoErrorUntilRef.current.delete(key);
  };
  // ===== Focus / attention gating =====
  // isNear: блок рядом (можно подгружать, но не играть)
  // isFocused: блок реально в зоне внимания (играем)
  // isPageActive: вкладка/окно активно (иначе всегда пауза)
  const [isNear, setIsNear] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPageActive, setIsPageActive] = useState(true);

  const shouldPlay = isFocused && isPageActive;
  const shouldPlayRef = useRef(false);
  const mutedRef = useRef(normalizeForumAdMuted(muted));
  const adPlayEventTsRef = useRef(0);
  const emitAdPlayToCoordinator = React.useCallback((source = 'ad') => {
  if (!isBrowser()) return;

  try {
    const now = Date.now();
    if ((now - Number(adPlayEventTsRef.current || 0)) < 320) return;
    adPlayEventTsRef.current = now;

        const isMutedNow = normalizeForumAdMuted(mutedRef.current);

    let el = null;
    if (source === 'ad_video') {
      el = videoRef.current || rootRef.current || null;
    } else if (source === 'ad_youtube') {
      el = ytIframeRef.current || rootRef.current || null;
    } else {
      el = videoRef.current || ytIframeRef.current || rootRef.current || null;
    }

    window.dispatchEvent(
      new CustomEvent('site-media-play', {
        detail: {
          source,
          element: el,
          manual: false,
          id: playerIdRef.current,
          muted: isMutedNow,
          audible:
            source === 'ad_video' || source === 'ad_youtube'
              ? !isMutedNow
              : undefined,
        },
      })
    );
  } catch {}
}, []);
const slotCssVars = {
  '--ad-slot-h-m': `${AD_SLOT_HEIGHT_PX.mobile}px`,
  '--ad-slot-h-t': `${AD_SLOT_HEIGHT_PX.tablet}px`,
  '--ad-slot-h-d': `${AD_SLOT_HEIGHT_PX.desktop}px`,

  '--forum-ad-lens-size': `${AD_LENS_UI.sizePx}px`,
  '--forum-ad-lens-right': `${AD_LENS_UI.rightPx}px`,
  '--forum-ad-lens-bottom': `${AD_LENS_UI.bottomPx}px`,

  '--forum-ad-lens-stroke': AD_LENS_UI.strokeColor,
  '--forum-ad-lens-handle': AD_LENS_UI.handleColor,
  '--forum-ad-lens-outline': AD_LENS_UI.outlineColor,
  '--forum-ad-lens-glow': AD_LENS_UI.glowColor,
  '--forum-ad-lens-glow-2': AD_LENS_UI.glowColor2,

  '--forum-ad-lens-opacity': String(AD_LENS_UI.opacity),
  '--forum-ad-lens-outline-w': `${AD_LENS_UI.outlineWidth}px`,
  '--forum-ad-lens-ring-w': `${AD_LENS_UI.ringWidth}px`,
  '--forum-ad-lens-handle-w': `${AD_LENS_UI.handleWidth}px`,
  '--forum-ad-lens-orbit-w': `${AD_LENS_UI.orbitWidth}px`,

  '--forum-ad-lens-float-dur': `${AD_LENS_UI.floatDurationMs}ms`,
  '--forum-ad-lens-sweep-dur': `${AD_LENS_UI.sweepDurationMs}ms`,
  '--forum-ad-lens-pulse-dur': `${AD_LENS_UI.pulseDurationMs}ms`,
  '--forum-ad-lens-sparkle-dur': `${AD_LENS_UI.sparkleDurationMs}ms`,
};

useEffect(() => {
  shouldPlayRef.current = shouldPlay;
}, [shouldPlay]);

useEffect(() => {
  const node = videoRef.current;
  return () => {
    try { releaseAdNativeWarmSlot(node, 'unmount'); } catch {}
  };
}, []);

useEffect(() => {
  const next = normalizeForumAdMuted(muted);
  mutedRef.current = next;
  applyForumAdMutedToVideo(videoRef.current, next);
}, [muted]);

useEffect(() => {
  const node = videoRef.current;

  if (media.kind !== 'video') {
    attachedVideoSrcRef.current = '';
    detachAdNativeVideo(node);
    return undefined;
  }

  const nextSrc = String(media.src || '').trim();

  if (!nextSrc || isVideoSrcTemporarilyBlocked(nextSrc)) {
    attachedVideoSrcRef.current = '';
    detachAdNativeVideo(node);
    return undefined;
  }

  // Не привязываем native video к isNear / shouldPlay.
  // Скролл и IntersectionObserver не должны менять <video src>.
  // Если URL реально сменился — очищаем старый ресурс один раз.
  if (attachedVideoSrcRef.current && attachedVideoSrcRef.current !== nextSrc) {
    attachedVideoSrcRef.current = '';
    detachAdNativeVideo(node);
  }

  return undefined;
}, [media.kind, media.src]);

useEffect(() => {
  
  const v = videoRef.current;

  if (media.kind !== 'video' || !isPageActive || !isNear) {
    if (v && !shouldPlayRef.current) releaseAdNativeWarmSlot(v, 'near_exit');
    return undefined;
  }

  if (!v) return undefined;
  
  const srcKey = String(media.src || '').trim();
  if (!srcKey || isVideoSrcTemporarilyBlocked(srcKey)) {
    releaseAdNativeWarmSlot(v, 'bad_src');
    return undefined;
  }

  // Controlled ad prewarm:
  // near = src/load/preload for ONE ad native video only; no play(), no site-media-play.
  if (!shouldPlayRef.current) {
    const canOwnWarm = claimAdNativeWarmSlot(v, srcKey, rootRef.current);
    if (!canOwnWarm) {
      // This ad card is near, but another card owns the single native warm slot.
      // Keep this node network-cold to avoid parallel ADS.mp4 206/cancel chains.
      try {
        if (v.paused && String(v.dataset?.__adWarmOwner || '') !== '1') detachAdNativeVideo(v);
      } catch {}
      return undefined;
    }
    const nextMuted = normalizeForumAdMuted(mutedRef.current);
    const attached = ensureAdNativeVideoSrc(v, srcKey, nextMuted);
    if (attached) attachedVideoSrcRef.current = srcKey;
 
    try {
      applyForumAdMutedToVideo(v, nextMuted);
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.preload = AD_NATIVE_VIDEO_PRELOAD_PLAY;

      const now = Date.now();
      const lastLoadTs = Number(v.dataset?.__adLastWarmLoadTs || 0);
      const loadingOrReady = isAdNativeVideoLoadingOrReady(v);

      // ensureAdNativeVideoSrc() уже вызывает load() при реальной смене URL.
      // Повторный load() здесь разрешаем только если источник есть, но браузер не грузит и давно не было warm-kick.
      if (!loadingOrReady && (now - lastLoadTs) > AD_NATIVE_WARM_RELOAD_GAP_MS) {
        v.dataset.__adLastWarmLoadTs = String(now);
        v.dataset.__adLoadPending = '1';
        v.load?.();
      }
    } catch {}
  }

  return undefined;
}, [isNear, isPageActive, media.kind, media.src]);

  // Page visibility + focus/blur
  useEffect(() => {
    if (!isBrowser()) return;

    const sync = () => {
      const visible = document.visibilityState === 'visible';
      setIsPageActive(visible);
    };

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

  // Intersection: near + focused
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !isBrowser() || typeof IntersectionObserver === 'undefined')
      return;

    // near: заранее «подойти» к блоку (без игры)
    const nearObs = new IntersectionObserver(
      ([e]) => setIsNear(!!e?.isIntersecting),
      // Enough runway for first frame, while global warm slot prevents ad 206 storms.
      { rootMargin: '760px 0px 1500px 0px', threshold: 0 }
    );

    // focused: реально видно (>= 60% площади)
    const focusObs = new IntersectionObserver(
      ([e]) => setIsFocused((e?.intersectionRatio || 0) >= 0.6),
      { threshold: [0, 0.25, 0.6, 0.75, 1] }
    );

    nearObs.observe(el);
    focusObs.observe(el);

    return () => {
      nearObs.disconnect();
      focusObs.disconnect();
    };
  }, []);

  // ===== Global mute sync from forum =====
useEffect(() => {
  if (!isBrowser()) return;

  const onMuted = (e) => {
    const d = e?.detail || {};
    if (d?.id && d.id === playerIdRef.current) return; // ignore self
    if (typeof d?.muted !== 'boolean') return;

    const next = commitForumAdMutedState(d.muted);

    mutedRef.current = next;
    setMuted((prev) => (prev === next ? prev : next));

    // HTML5
    applyForumAdMutedToVideo(videoRef.current, next);

    // YouTube
    if (ytPlayerRef.current) {
      try {
        if (next) ytPlayerRef.current.mute?.();
        else ytPlayerRef.current.unMute?.();
      } catch {}
    }
  };

  window.addEventListener(MEDIA_MUTED_EVENT, onMuted);
  return () => window.removeEventListener(MEDIA_MUTED_EVENT, onMuted);
}, []);
  const safeClick = useMemo(() => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      return u;
    } catch {
      return null;
    }
  }, [url]);

  // ключ для слота, чтобы не повторять одну и ту же медиу подряд
  const mediaKey = useMemo(
    () => `${url}::${slotKind || ''}::${nearId || ''}`,
    [url, slotKind, nearId]
  );

  // 1) Выбор конкретного mediaHref из MEDIA_BY_CLICK[clickHref] по таймеру
  useEffect(() => {
    if (!safeClick) return;

    const clickHref = safeClick.toString();
    const entry = conf.MEDIA_BY_CLICK?.[clickHref] ?? null;

    let list = [];
    if (Array.isArray(entry) && entry.length) {
      list = entry.filter(Boolean);
    } else if (typeof entry === 'string' && entry.trim()) {
      list = [entry.trim()];
    } else {
      // если нет отдельной медиы — крутим сам clickHref
      list = [clickHref];
    }

    if (!list.length) {
      setMediaHref(null);
      return;
    }

    let idx = lastMediaIndexByKey.has(mediaKey)
      ? lastMediaIndexByKey.get(mediaKey)
      : -1;

    const pickNext = () => {
      if (list.length === 1) {
        idx = 0;
      } else {
        let tries = 0;
        let next = idx;
        while (tries < 5 && next === idx) {
          next = Math.floor(Math.random() * list.length);
          tries += 1;
        }
        idx = next;
      }
      lastMediaIndexByKey.set(mediaKey, idx);
      setMediaHref(list[idx]);
    };

    // сразу выбираем первую медиу
    pickNext();

    // период ротации медиы — завязан на ROTATE_MIN,
    // но не меньше 10 секунд, чтобы был заметен эффект
    const rotateMs = Math.max(
      10_000,
      Number(conf.ROTATE_MIN || 1) * 60_000
    );
    const timer = setInterval(pickNext, rotateMs);

    return () => {
      clearInterval(timer);
    };
  }, [safeClick, conf, mediaKey]);

  // 2) Каскад определения типа медиа для текущего mediaHref
  useEffect(() => {
    if (!safeClick || !mediaHref) {
      setMedia({ kind: 'skeleton', src: null });
      return;
    }
    const canResolveNow = !!isNear || !!isFocused;
    if (!canResolveNow) {
      const cachedOnly = readCachedAdResolvedMedia(String(mediaHref || '').trim());
      if (cachedOnly) setMedia(cachedOnly);
      else setMedia({ kind: 'skeleton', src: null });
      return;
    }
    let cancelled = false;

    const clickHref = safeClick.toString();
    const landingHost = safeClick.hostname;
    const mediaResolveKey = String(mediaHref || '').trim();
    const cachedResolved = readCachedAdResolvedMedia(mediaResolveKey);
    if (cachedResolved) {
      setMedia(cachedResolved);
      return () => {
        cancelled = true;
      };
    }
    const inflightResolved = adMediaResolveInflight.get(mediaResolveKey);
    if (inflightResolved) {
      inflightResolved
        .then(() => {
          if (cancelled) return;
          const synced = readCachedAdResolvedMedia(mediaResolveKey);
          if (synced) setMedia(synced);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    const thumbs =
      conf.THUMBS && conf.THUMBS.length
        ? conf.THUMBS
        : DEFAULT_THUMB_SERVICES;

    const isDirectImg = /\.(jpe?g|png|webp|gif|avif)(?:$|[?#])/i.test(
      mediaHref
    );
    const publishResolved = (next, okCache = true) => {
      if (!next) return;
      cacheAdResolvedMedia(mediaResolveKey, next, okCache);
      if (!cancelled) setMedia(next);
    };

async function run() {
  // 0) Прямое native-video определяем по URL ДО любых сетевых probe.
  // Для .mp4/.webm это убирает лишний HEAD/GET Range перед установкой <video>.
  if (!cancelled && isLikelyVideoUrl(mediaHref)) {
    publishResolved({ kind: 'video', src: mediaHref, step: 'env_video' }, true);
    emitAdEvent(
      'ad_fallback',
      { url: clickHref, cascade_step: 'env_video', slot_kind: slotKind },
      conf
    );
    return;
  }

  // 1) Content-Type probe оставляем для неочевидных image/video URL.
  // Range fallback выключен: он сам создавал лишний 206.
  if (!cancelled && shouldProbeMediaKind(mediaHref)) {
    const detected = await detectMediaKind(mediaHref, 3000, {
      allowRangeFallback: false,
    }).catch(() => null);

    if (cancelled) return;

    if (detected === 'video') {
      publishResolved({ kind: 'video', src: mediaHref, step: 'head_video' }, true);
      emitAdEvent(
        'ad_fallback',
        { url: clickHref, cascade_step: 'head_video', slot_kind: slotKind },
        conf
      );
      return;
    }

    if (detected === 'image') {
      publishResolved({ kind: 'image', src: mediaHref, step: 'head_image' }, true);
      emitAdEvent(
        'ad_fallback',
        { url: clickHref, cascade_step: 'head_image', slot_kind: slotKind },
        conf
      );
      return;
    }
  }

      // 1) прямое видео (blob, mp4 и т.п.) по URL-эвристике
      if (!cancelled && isLikelyVideoUrl(mediaHref)) {
        publishResolved({ kind: 'video', src: mediaHref, step: 'env_video' }, true);
        emitAdEvent(
          'ad_fallback',
          { url: clickHref, cascade_step: 'env_video', slot_kind: slotKind },
          conf
        );
        return;
      }

      // 2) YouTube
      const ytMatch = mediaHref.match(YT_RE);
      if (!cancelled && ytMatch) {
        const videoId = ytMatch[1];
        if (videoId) {
          publishResolved({ kind: 'youtube', src: videoId, step: 'env_youtube' }, true);
          emitAdEvent(
            'ad_fallback',
            {
              url: clickHref,
              cascade_step: 'env_youtube',
              slot_kind: slotKind,
            },
            conf
          );
          return;
        }
      }

      // 3) TikTok
      const ttMatch = mediaHref.match(TIKTOK_RE);
      if (!cancelled && ttMatch) {
        let videoId = null;
        try {
          const u = new URL(mediaHref);
          const m = u.pathname.match(/\/video\/(\d+)/);
          if (m) videoId = m[1];
        } catch {}
        if (videoId) {
          publishResolved({ kind: 'tiktok', src: videoId, step: 'env_tiktok' }, true);
          emitAdEvent(
            'ad_fallback',
            {
              url: clickHref,
              cascade_step: 'env_tiktok',
              slot_kind: slotKind,
            },
            conf
          );
          return;
        }
      }

      // 4) Microlink (OG screenshot / image)
      if (!cancelled && conf.PREVIEW !== 'favicon') {
        try {
          const meta = (await fetchMicrolinkMeta(mediaHref).catch(() => null)) || {};

          const candShot = meta.screenshot?.url || meta.image?.url || null;
          const candLogo = meta.logo?.url || null;

          const ogList = [
            candShot && { kind: 'image', src: candShot, step: 'og_screenshot' },
            candLogo && { kind: 'image', src: candLogo, step: 'og_logo' },
          ].filter(Boolean);

          for (const c of ogList) {
            if (cancelled) return;
            try {
              const cu = new URL(c.src);
              if (cu.protocol !== 'https:') continue;

              const ok = await tryLoadImage(cu.toString());
              if (ok && !cancelled) {
                publishResolved({ kind: 'image', src: cu.toString(), step: c.step }, true);
                emitAdEvent(
                  'ad_fallback',
                  {
                    url: clickHref,
                    cascade_step: c.step,
                    slot_kind: slotKind,
                  },
                  conf
                );
                return;
              }
            } catch {}
          }
        } catch {}
      }

      // 5) прямой файл-картинка
      if (!cancelled && conf.PREVIEW !== 'favicon' && isDirectImg) {
        const ok = await tryLoadImage(mediaHref);
        if (ok && !cancelled) {
          publishResolved({ kind: 'image', src: mediaHref, step: 'direct_image' }, true);
          emitAdEvent(
            'ad_fallback',
            {
              url: clickHref,
              cascade_step: 'direct_image',
              slot_kind: slotKind,
            },
            conf
          );
          return;
        }
      }

      // 6) Screenshot CDNs
      if (!cancelled && conf.PREVIEW !== 'favicon') {
        for (const tpl of thumbs) {
          if (cancelled) break;
          try {
            const shotUrl = tpl.replace('{url}', encodeURIComponent(mediaHref));
            const uShot = new URL(shotUrl);
            if (uShot.protocol !== 'https:') continue;
            const ok = await tryLoadImage(uShot.toString());
            if (ok && !cancelled) {
              publishResolved({ kind: 'image', src: uShot.toString(), step: 'shot' }, true);
              emitAdEvent(
                'ad_fallback',
                { url: clickHref, cascade_step: 'shot', slot_kind: slotKind },
                conf
              );
              return;
            }
          } catch {}
        }
      }

      // 7) Favicon
      if (
        !cancelled &&
        (conf.PREVIEW === 'auto' || conf.PREVIEW === 'favicon')
      ) {
        try {
          const ico =
            'https://icons.duckduckgo.com/ip3/' + landingHost + '.ico';
          const ok = await tryLoadImage(ico);
          if (ok && !cancelled) {
            publishResolved({ kind: 'favicon', src: ico, step: 'favicon' }, true);
            emitAdEvent(
              'ad_fallback',
              {
                url: clickHref,
                cascade_step: 'favicon',
                slot_kind: slotKind,
              },
              conf
            );
            return;
          }
        } catch {}
      }

      // 8) Placeholder
      if (!cancelled) {
        publishResolved({ kind: 'placeholder', src: null, step: 'placeholder' }, false);
        emitAdEvent(
          'ad_fallback',
          {
            url: clickHref,
            cascade_step: 'placeholder',
            slot_kind: slotKind,
          },
          conf
        );
      }
    }

    const runPromise = Promise.resolve(run()).catch(() => {});
    adMediaResolveInflight.set(mediaResolveKey, runPromise);
    runPromise.finally(() => {
      adMediaResolveInflight.delete(mediaResolveKey);
    });
    return () => {
      cancelled = true;
    };
  }, [safeClick, conf, slotKind, mediaHref, isNear, isFocused]);

  // YouTube Iframe API для управления звуком
useEffect(() => {
  if (!isBrowser()) return;
  if (media.kind !== 'youtube' || !media.src) {
    const existing = ytPlayerRef.current;
    if (existing) {
      try { existing.destroy?.(); } catch {}
      ytPlayerRef.current = null;
    }
    return;
  }

  let cancelled = false;
  let localPlayer = null;

  const cleanupPlayer = () => {
    if (localPlayer) {
      try { localPlayer.destroy?.(); } catch {}
    }
    if (ytPlayerRef.current === localPlayer) {
      ytPlayerRef.current = null;
    }
  };

  function createPlayer() {
    if (cancelled) return;
    if (!window.YT || !window.YT.Player || !ytIframeRef.current) return;

    try {
      localPlayer = new window.YT.Player(ytIframeRef.current, {
        videoId: media.src,
playerVars: {
  autoplay: 0,
  controls: 0,
  rel: 0,
  fs: 0,
  modestbranding: 1,
  playsinline: 1,
  loop: 1,
  playlist: media.src,
},
        events: {
onReady: (ev) => {
  if (cancelled) return;
  ytPlayerRef.current = ev.target;
  try {
    if (mutedRef.current === true) {
      ev.target.mute?.();
    } else if (mutedRef.current === false) {
      ev.target.unMute?.();
    }
    if (shouldPlayRef.current) ev.target.playVideo?.();
    else ev.target.pauseVideo?.();
  } catch {}
},
        },
      });

      ytPlayerRef.current = localPlayer;
    } catch {}
  }

  if (window.YT && window.YT.Player) {
    createPlayer();
  } else {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') prev();
      createPlayer();
    };
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  return () => {
    cancelled = true;
    cleanupPlayer();
  };
}, [media.kind, media.src]);
  // ===== Hard stop / resume playback depending on attention =====
  useEffect(() => {
    // HTML5 video
if (media.kind === 'video' && videoRef.current) {
  const v = videoRef.current;
  const srcKey = String(media.src || '').trim();
  const nextMuted = normalizeForumAdMuted(muted);

  applyForumAdMutedToVideo(v, nextMuted);

  if (!srcKey || isVideoSrcTemporarilyBlocked(srcKey)) {
    try { v.pause?.(); } catch {}
    return;
  }

  if (shouldPlay) {
    const attached = ensureAdNativeVideoSrc(v, srcKey, nextMuted);
    if (attached) attachedVideoSrcRef.current = srcKey;

    const playAttempt = v.play?.();

    if (playAttempt && typeof playAttempt.then === 'function') {
      playAttempt      
        .then(() => {
          try {
            const st = adNativePauseRecoveryRef.current || {};
            if (st.timer) clearTimeout(st.timer);
            adNativePauseRecoveryRef.current = { timer: 0, ts: Date.now(), count: 0 };
          } catch {}          
          emitAdPlayToCoordinator('ad_video');
        })
        .catch(() => {
          try {
            if (!shouldPlayRef.current || normalizeForumAdMuted(mutedRef.current) !== false) return;
            applyForumAdMutedToVideo(v, true);
            v.play?.().catch(() => {});
          } catch {}
        });
    } else {
      try {
        const st = adNativePauseRecoveryRef.current || {};
        if (st.timer) clearTimeout(st.timer);
        adNativePauseRecoveryRef.current = { timer: 0, ts: Date.now(), count: 0 };
      } catch {}      
      emitAdPlayToCoordinator('ad_video');
    }
  } else {
    // Пауза без removeAttribute('src') и без load().
    // Так браузер не начинает новый набор 206 при каждом повторном входе в viewport.
    try { v.pause?.(); } catch {}
  }
}

    // YouTube player (Iframe API)
if (media.kind === 'youtube' && ytPlayerRef.current) {
  const p = ytPlayerRef.current;
  const nextMuted = normalizeForumAdMuted(muted);

  try {
    if (shouldPlay) {
      if (nextMuted) p.mute?.();
      else p.unMute?.();

      emitAdPlayToCoordinator('ad_youtube');
      p.playVideo?.();
    } else {
      p.pauseVideo?.();
    }
  } catch {}
}
    if (media.kind === 'tiktok' && shouldPlay) {
      emitAdPlayToCoordinator('ad_tiktok');
    }
  }, [emitAdPlayToCoordinator, shouldPlay, media.kind, media.src, muted]);
  // Focus-only autoplay retry for mobile ads.
  // Работает только когда карточка реально в focus-zone; near/offscreen не играет.
  useEffect(() => {
    if (media.kind !== 'video') return undefined;
    if (!shouldPlay || !isPageActive) return undefined;

    let cancelled = false;
    let timer = 0;

    const kick = () => {
      if (cancelled) return;
      const v = videoRef.current;
      const srcKey = String(media.src || '').trim();
      if (!v || !srcKey || isVideoSrcTemporarilyBlocked(srcKey)) return;
      const now = Date.now();
      if ((now - Number(adNativeFocusKickTsRef.current || 0)) < 420) return;
      adNativeFocusKickTsRef.current = now;

      try {
        const nextMuted = normalizeForumAdMuted(mutedRef.current);
        const attached = ensureAdNativeVideoSrc(v, srcKey, nextMuted);
        if (attached) attachedVideoSrcRef.current = srcKey;
        applyForumAdMutedToVideo(v, nextMuted);
        v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        v.preload = AD_NATIVE_VIDEO_PRELOAD_PLAY;
        if (v.paused) {
          const p = v.play?.();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {
              try {
                if (!shouldPlayRef.current || normalizeForumAdMuted(mutedRef.current) !== false) return;
                applyForumAdMutedToVideo(v, true);
                v.play?.().catch(() => {});
              } catch {}
            });
          }
        }
      } catch {}
    };

    kick();
    timer = window.setInterval(() => {
      try {
        const v = videoRef.current;
        if (!shouldPlayRef.current || !v || !v.paused) {
          if (timer) window.clearInterval(timer);
          timer = 0;
          return;
        }
        kick();
      } catch {}
    }, 520);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [isPageActive, media.kind, media.src, shouldPlay]);
  // Impression tracking
  useEffect(() => {
    const el = rootRef.current;
    if (
      !el ||
      !isBrowser() ||
      typeof IntersectionObserver === 'undefined' ||
      !safeClick
    ) {
      return;
    }

    let seen = false;
    let timer = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e || seen) return;

        if (e.intersectionRatio >= 0.5) {
          if (!timer) {
            timer = setTimeout(() => {
              if (seen) return;
              seen = true;
              emitAdEvent(
                'ad_impression',
                {
                  url: safeClick.toString(),
                  url_hash: hash32(safeClick.toString()),
                  slot_kind: slotKind,
                  near_id: nearId,
                },
                conf
              );
            }, 800);
          }
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [safeClick, slotKind, nearId, conf]);

  if (!safeClick) return null;

  const clickHref = safeClick.toString();
  const host = safeClick.hostname.replace(/^www\./i, '');
  const label =
    typeof t === 'function'
      ? t('forum_ad_label', 'Реклама')
      : 'Реклама';

  // Кнопка «Разместить» — переходим на страницу /ads, не кликая по рекламной ссылке
  const handleOpenAdsPage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      router.push('/ads');
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/ads';
      }
    }
  };

  const handleClick = () => {
    emitAdEvent(
      'ad_click',
      {
        url: clickHref,
        url_hash: hash32(clickHref),
        slot_kind: slotKind,
        near_id: nearId,
      },
      conf
    );
  };

const handleToggleSound = (e) => {
  e.preventDefault();
  e.stopPropagation();

  const currentMuted = normalizeForumAdMuted(muted);
  const next = !currentMuted;

  // 1) сохранить и разложить состояние ВЕЗДЕ:
  // storage + document/window + global event
  syncMutedPrefEverywhere(next, playerIdRef.current, 'forum-ads-toggle');

  // 2) локально
  mutedRef.current = next;
  setMuted((prev) => (prev === next ? prev : next));

  // HTML5
  if (media.kind === 'video' && videoRef.current) {
    const v = videoRef.current;

    applyForumAdMutedToVideo(v, next);

    if (v.paused && shouldPlayRef.current) {
      v.play?.().catch(() => {});
    }

    return;
  }

  // YouTube
  if (media.kind === 'youtube' && ytPlayerRef.current) {
    const p = ytPlayerRef.current;

    try {
      if (next) {
        p.mute?.();
      } else {
        p.unMute?.();
      }

      if (shouldPlayRef.current) {
        p.playVideo?.();
      }
    } catch {}
  }
};

  const isAdMuted = normalizeForumAdMuted(muted);

  const showSoundButton =
    media.kind === 'video' || media.kind === 'youtube';

  return (
<div
  ref={rootRef}
  className="item forum-ad-card"
  data-slot-kind={slotKind}
  data-ads="1"
  style={slotCssVars}
>
<style jsx>{`
  .forum-ad-media-slot {
    width: 100%; 
    position: relative;         /* ключ: якорь для absolute медиа */
    overflow: hidden;
    border-radius: 0.5rem;
    background: var(--bg-soft, #020817);
  }
  /* ===== FIXED (как в форуме сейчас) ===== */
  .forum-ad-media-slot[data-layout="fixed"] {
    min-height: var(--ad-slot-h-m);
    height: var(--ad-slot-h-m);
  }
  @media (min-width: 640px) {
.forum-ad-media-slot[data-layout="fixed"] {
      min-height: var(--ad-slot-h-t);
      height: var(--ad-slot-h-t);
    }
  }

  @media (min-width: 1024px) {
    .forum-ad-media-slot[data-layout="fixed"] {
      min-height: var(--ad-slot-h-d);
      height: var(--ad-slot-h-d);
    }
  }

  /* ===== FLUID (для рендера по всему сайту) ===== */
  .forum-ad-media-slot[data-layout="fluid"] {
    height: auto;
    overflow: visible;
  }

  /* fixed: слой медиа растягиваем на весь слот */
  .forum-ad-media-slot[data-layout="fixed"] .forum-ad-media-fill {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

.forum-ad-media-slot[data-layout="fixed"] .forum-ad-fit {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    display: block;
  }

  /* fluid: слой медиа не absolute — иначе высота не считается */
  .forum-ad-media-slot[data-layout="fluid"] .forum-ad-media-fill {
    position: static;
    width: 100%;
    height: auto;
  }

  .forum-ad-media-slot[data-layout="fluid"] .forum-ad-fit {
    width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
  }

  .forum-ad-lens {
    position: absolute;
    right: var(--forum-ad-lens-right, 10px);
    bottom: var(--forum-ad-lens-bottom, 10px);
    width: var(--forum-ad-lens-size, 40px);
    height: var(--forum-ad-lens-size, 40px);
    z-index: 5;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    opacity: var(--forum-ad-lens-opacity, .98);
    transform: translateZ(0);
    transform-origin: 50% 50%;
    filter:
      drop-shadow(0 0 8px var(--forum-ad-lens-glow, rgba(111, 231, 255, .42)))
      drop-shadow(0 0 16px var(--forum-ad-lens-glow-2, rgba(183, 125, 255, .22)));
    animation: forumAdLensFloat var(--forum-ad-lens-float-dur, 2800ms) ease-in-out infinite;
  }
  .forum-ad-audio-toggle{
    position:absolute;
    left: calc(
      var(--forum-ad-lens-right, 10px) +
      var(--forum-ad-lens-size, 10px) - 35px
    );
    bottom: var(--forum-ad-lens-bottom, 10px);
    width: 40px;
    height: 40px;
    border-radius: 999px;
    display:grid;
    place-items:center;
    z-index: 7;
    pointer-events:auto;
    touch-action: manipulation;
    user-select:none;
    -webkit-user-select:none;

    border: 1px solid rgba(157,220,255,.35);
    color:#e6f4ff;
    background:
      radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,.12), rgba(255,255,255,0) 60%),
      radial-gradient(100% 100% at 70% 70%, rgba(0,200,255,.16), rgba(0,200,255,0) 60%),
      linear-gradient(180deg, rgba(0,35,60,.28), rgba(0,35,60,.42));
    box-shadow:
      inset 0 0 18px rgba(0,180,255,.16),
      0 8px 20px rgba(0,0,0,.35);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);

    transition:
      transform .18s ease,
      filter .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .forum-ad-audio-toggle:hover{
    transform: translateY(-1px) scale(1.03);
    filter: brightness(1.06);
  }

  .forum-ad-audio-toggle:active{
    transform: scale(.98);
  }

  .forum-ad-audio-toggle .ico{
    font-size:18px;
    line-height:1;
    filter: drop-shadow(0 0 6px rgba(64,200,255,.7));
  }

  .forum-ad-audio-toggle.on{
    animation: forumAdAudioPulse 3s ease-out infinite;
  }

  @keyframes forumAdAudioPulse{
    0%{
      box-shadow:
        inset 0 0 18px rgba(0,180,255,.16),
        0 0 0 0 rgba(0,194,255,.35);
    }
    60%{
      box-shadow:
        inset 0 0 18px rgba(0,180,255,.16),
        0 0 0 12px rgba(0,194,255,0);
    }
    100%{
      box-shadow:
        inset 0 0 18px rgba(0,180,255,.16),
        0 0 0 0 rgba(0,194,255,0);
    }
  }

  @media (max-width: 640px){
    .forum-ad-audio-toggle{
      width:36px;
      height:36px;
      right: calc(
        var(--forum-ad-lens-right, 10px) +
        (var(--forum-ad-lens-size, 40px) - 6px) + 8px
      );
    }
    .forum-ad-audio-toggle .ico{
      font-size:16px;
    }
  }

  @media (prefers-reduced-motion: reduce){
    .forum-ad-audio-toggle.on{
      animation:none !important;
    }
  }
  .forum-ad-lensSvg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  .forum-ad-lensOrbit {
    fill: none;
    stroke: var(--forum-ad-lens-outline, rgba(255, 215, 120, .96));
    stroke-width: var(--forum-ad-lens-orbit-w, 1px);
    stroke-linecap: round;
    stroke-dasharray: 2.2 4.4;
    opacity: .92;
    transform-origin: 16px 16px;
    animation: forumAdLensSweep var(--forum-ad-lens-sweep-dur, 2400ms) linear infinite;
  }

  .forum-ad-lensRingOutline {
    fill: none;
    stroke: var(--forum-ad-lens-outline, rgba(255, 215, 120, .96));
    stroke-width: var(--forum-ad-lens-outline-w, 1px);
    opacity: .98;
  }

  .forum-ad-lensRing {
    fill: none;
    stroke: var(--forum-ad-lens-stroke, #6fe7ff);
    stroke-width: var(--forum-ad-lens-ring-w, 1.8px);
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: .98;
    animation: forumAdLensPulse var(--forum-ad-lens-pulse-dur, 1800ms) ease-in-out infinite;
  }

  .forum-ad-lensHandleOutline {
    fill: none;
    stroke: var(--forum-ad-lens-outline, rgba(255, 215, 120, .96));
    stroke-width: var(--forum-ad-lens-outline-w, 1px);
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: .98;
  }

  .forum-ad-lensHandle {
    fill: none;
    stroke: var(--forum-ad-lens-handle, #b77dff);
    stroke-width: var(--forum-ad-lens-handle-w, 2.2px);
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: .98;
    animation: forumAdLensPulse var(--forum-ad-lens-pulse-dur, 1800ms) ease-in-out infinite;
  }

  .forum-ad-lensCore {
    fill: rgba(255,255,255,.16);
    stroke: var(--forum-ad-lens-outline, rgba(255, 215, 120, .96));
    stroke-width: .8px;
    opacity: .92;
  }

  .forum-ad-lensSpark {
    fill: rgba(255,255,255,.95);
    filter: drop-shadow(0 0 6px rgba(255,255,255,.45));
    transform-origin: 24px 9px;
    animation: forumAdLensSparkle var(--forum-ad-lens-sparkle-dur, 1600ms) ease-in-out infinite;
  }

  @keyframes forumAdLensFloat {
    0%, 100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(0, -1.5px, 0) scale(1.03);
    }
  }

  @keyframes forumAdLensSweep {
    0% {
      stroke-dashoffset: 0;
      transform: rotate(0deg);
    }
    100% {
      stroke-dashoffset: -13.2;
      transform: rotate(360deg);
    }
  }

  @keyframes forumAdLensPulse {
    0%, 100% {
      filter: brightness(1);
      opacity: .92;
    }
    50% {
      filter: brightness(1.18);
      opacity: 1;
    }
  }

  @keyframes forumAdLensSparkle {
    0%, 100% {
      opacity: .35;
      transform: scale(.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.18);
    }
  }

  @media (max-width: 640px) {
    .forum-ad-lens {
      width: calc(var(--forum-ad-lens-size, 40px) - 6px);
      height: calc(var(--forum-ad-lens-size, 40px) - 6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .forum-ad-lens,
    .forum-ad-lensOrbit,
    .forum-ad-lensRing,
    .forum-ad-lensHandle,
    .forum-ad-lensSpark {
      animation: none !important;
    }
  }
`}</style>


      <a
        href={clickHref}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        onClick={handleClick}
        aria-label={`${label} • ${host}`}
        className="block no-underline focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
      >
        <div className="flex flex-col gap-1 h-full">
          {/* header: только бейдж + домен, без url-строки */}
          <div
            className="flex items-center gap-2 text-[9px] uppercase tracking-wide text-[color:var(--muted-fore,#9ca3af)]"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'nowrap',
              width: '100%',
            }}
          >
            <div className="flex items-center gap-2">
            <span
                className="qcoinLabel"
                style={{ fontSize: `${AD_LABEL_FONT_SIZE_PX}px` }}
             >
                {label}
              </span>
              <span className="truncate max-w-[140px] font-medium">
                {/* домен можно вернуть сюда, если захочешь */}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenAdsPage}
              className="btn"
              style={{
                fontSize: '12x',
                padding: '6px 12px',
                borderRadius: 999,
                marginLeft: 'auto',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {typeof t === 'function'
                ? t('forum_ad_place', 'Разместить')
                : 'Разместить'}
            </button>
          </div>

          {/* media: заполняет карточку */}
<div
  className="relative mt-0.5 border border-[color:var(--border,#27272a)] forum-ad-media-slot"
data-layout={isFluid ? 'fluid' : 'fixed'}
>
          
 {media.kind === 'skeleton' && (
              <div className="animate-pulse w-full h-full bg-[color:var(--skeleton,#111827)]" />
            )}

{media.kind === 'video' && media.src && (
  <div className="forum-ad-media-fill">
<video
  ref={videoRef} 
  className="forum-ad-fit"
  muted={isAdMuted}
  loop
  playsInline 
  referrerPolicy="no-referrer"
  preload={AD_NATIVE_VIDEO_PRELOAD_IDLE}
  onPlaying={() => {
    try {
      const v = videoRef.current;
      if (v?.dataset) v.dataset.__adLoadPending = '0';
      if (!shouldPlayRef.current) {
        // Defensive: если браузер всё-таки стартанул рекламу до focus, гасим её молча
        // и не отправляем site-media-play, чтобы не выключать активное видео форума.
        try { v?.pause?.(); } catch {}
        return;
      }      
      const st = adNativePauseRecoveryRef.current || {};
      if (st.timer) clearTimeout(st.timer);
      adNativePauseRecoveryRef.current = { timer: 0, ts: Date.now(), count: 0 };
      emitAdPlayToCoordinator('ad_video');
    } catch {}
  }}
  onPause={() => {
    try {
      const v = videoRef.current;
      const srcKey = String(media?.src || '').trim();
      if (!v || !shouldPlayRef.current || !srcKey || isVideoSrcTemporarilyBlocked(srcKey)) return;

      const prev = adNativePauseRecoveryRef.current || { timer: 0, ts: 0, count: 0 };
      const now = Date.now();
      const nextCount = prev.ts > 0 && (now - prev.ts) < 7000 ? Number(prev.count || 0) + 1 : 1;
      if (nextCount > 2) return;

      if (prev.timer) clearTimeout(prev.timer);
      const timer = setTimeout(() => {
        try {
          if (!shouldPlayRef.current || !v.paused) return;
          applyForumAdMutedToVideo(v, normalizeForumAdMuted(mutedRef.current));
          v.play?.().catch(() => {});
        } catch {}
      }, 140);
      adNativePauseRecoveryRef.current = { timer, ts: now, count: nextCount };
    } catch {}
  }}  
  onLoadedData={() => {
    try {
      const v = videoRef.current;
      if (v?.dataset) v.dataset.__adLoadPending = '0';
      applyForumAdMutedToVideo(v, isAdMuted);
      clearVideoSrcBlock(media?.src);
      if (shouldPlayRef.current && v?.paused) v.play?.().catch(() => {});
    } catch {}
  }}
  onCanPlay={() => {
    try {
      const v = videoRef.current;
      if (v?.dataset) v.dataset.__adLoadPending = '0';
      applyForumAdMutedToVideo(v, isAdMuted);
      clearVideoSrcBlock(media?.src);
      if (shouldPlayRef.current && v?.paused) v.play?.().catch(() => {});
    } catch {}
  }}
onError={() => {
  try {
    markVideoSrcTemporarilyBlocked(media?.src, isNear ? 12000 : 20000);
    attachedVideoSrcRef.current = '';
    detachAdNativeVideo(videoRef.current);
  } catch {}
}}
/>
  </div>
)}
 
            {media.kind === 'youtube' && media.src && (
<div
  className="relative overflow-hidden rounded-lg"
  style={isFluid ? { width: '100%', aspectRatio: '16 / 9' } : { width: '100%', height: '100%' }}
>
  <iframe
    ref={ytIframeRef}
    src={`https://www.youtube-nocookie.com/embed/${media.src}?enablejsapi=1&controls=0&rel=0&fs=0&modestbranding=1&playsinline=1`}
    title="YouTube video"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      borderRadius: 10,
      pointerEvents: 'none',
    }}
  />
</div>

            )}

            {media.kind === 'tiktok' && media.src && shouldPlay && (
<div
  className="relative overflow-hidden rounded-lg"
  style={isFluid ? { width: '100%', aspectRatio: '9 / 16' } : { width: '100%', height: '100%' }}
>
  <iframe
    src={`https://www.tiktok.com/embed/v2/${media.src}`}
    title="TikTok video"
    frameBorder="0"
    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      borderRadius: 10,
      pointerEvents: 'none',
    }}
  />
</div>

            )}

            {media.kind === 'tiktok' && media.src && !shouldPlay && (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-[color:var(--muted-fore,#9ca3af)]">
                {host}
              </div>
            )}


{media.kind === 'image' && media.src && (
  <div className="forum-ad-media-fill">
    {isFluid ? (
      <img
        src={media.src}
        alt={host}
        className="forum-ad-fit"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    ) : (
      <NextImage
        src={media.src}
        alt={host}
        fill
        className="forum-ad-fit transition-opacity duration-200"
        style={{ objectFit: 'contain', objectPosition: 'center' }}
        unoptimized
        referrerPolicy="no-referrer"
      />
    )}
  </div>
)}


            {media.kind === 'favicon' && media.src && (
              <div className="w-full h-full flex items-center justify-center bg-[color:var(--bg-soft,#020817)]">
                <NextImage
                  src={media.src}
                  alt={host}
                  width={64}
                  height={64}
                  className="object-contain"
                  unoptimized
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {media.kind === 'placeholder' && (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-[color:var(--muted-fore,#9ca3af)]">
                {host}
              </div>
            )}

{showSoundButton && (
  <button
    type="button"
    onClick={handleToggleSound}
    className={`forum-ad-audio-toggle ${isAdMuted ? 'on' : 'off'}`}
    aria-label={isAdMuted ? 'muted' : 'unmuted'}
  >
    <span className="ico" aria-hidden="true">
      {isAdMuted ? '🔇' : '🔊'}
    </span>
  </button>
)}

            <div className="forum-ad-lens" aria-hidden="true">
              <svg
                className="forum-ad-lensSvg"
                viewBox="0 0 40 40"
                focusable="false"
                aria-hidden="true"
              >
                <circle
                  className="forum-ad-lensOrbit"
                  cx="16"
                  cy="16"
                  r="10.75"
                />
                <circle
                  className="forum-ad-lensRingOutline"
                  cx="16"
                  cy="16"
                  r="7.7"
                />
                <circle
                  className="forum-ad-lensRing"
                  cx="16"
                  cy="16"
                  r="7.1"
                />
                <path
                  className="forum-ad-lensHandleOutline"
                  d="M21.15 21.15 L30.15 30.15"
                />
                <path
                  className="forum-ad-lensHandle"
                  d="M21.15 21.15 L30.15 30.15"
                />
                <circle
                  className="forum-ad-lensCore"
                  cx="16"
                  cy="16"
                  r="1.55"
                />
                <circle
                  className="forum-ad-lensSpark"
                  cx="24.2"
                  cy="8.9"
                  r="1.05"
                />
              </svg>
            </div>

            <div className="pointer-events-none абсолют inset-0 rounded-lg border border-transparent qshine" />
          </div>
        </div> 
      </a>
    </div>
  );
}
