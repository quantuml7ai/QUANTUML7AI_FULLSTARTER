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

function isSplashMutedHoldActive() {
  if (!isBrowser()) return false;
  try {
    return !!window.__forumBootSplashActive;
  } catch {
    return false;
  }
}

function readMutedPrefFromStorage() {
  if (!isBrowser()) return null;
  try {
    if (isSplashMutedHoldActive()) return true;
    let v = window.localStorage?.getItem(MEDIA_MUTED_KEY);
    if (v == null) v = window.localStorage?.getItem(MEDIA_VIDEO_MUTED_KEY);
    if (v == null) return null;
    return v === '1' || v === 'true';
  } catch {
    return null;
  }
}

function writeMutedPrefToStorage(val) {
  if (!isBrowser()) return;
  try {
    const next = val ? '1' : '0';
    window.localStorage?.setItem(MEDIA_MUTED_KEY, next);
    window.localStorage?.setItem(MEDIA_VIDEO_MUTED_KEY, next);
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

function desiredMutedFromPref(pref) {
  // Если префа нет — стартуем muted=true (иначе автоплей часто будет блокироваться браузером).
  return pref == null ? true : !!pref;
}

function applyHtmlMediaMutedState(videoEl, nextMuted) {
  if (!(videoEl instanceof HTMLMediaElement)) return;
  try {
    videoEl.muted = !!nextMuted;
    videoEl.defaultMuted = !!nextMuted;
    if (nextMuted) videoEl.setAttribute('muted', '');
    else videoEl.removeAttribute('muted');
  } catch {}
}

function bumpGlobalAdPlaybackHold(ms = 1400) {
  if (!isBrowser()) return;
  try {
    const until = Date.now() + Math.max(240, Number(ms || 0));
    const prev = Number(window.__forumAdPlaybackHoldUntil || 0);
    window.__forumAdPlaybackHoldUntil = Math.max(prev, until);
  } catch {}
}

const AD_NEAR_ROOT_MARGIN = '760px 0px 1040px 0px';
const AD_FOCUS_START_RATIO = 0.52;
const AD_FOCUS_STOP_RATIO = 0.16;

function isPageActuallyActive() {
  if (!isBrowser()) return true;
  try {
    const visible = document.visibilityState === 'visible';
    const focused =
      typeof document.hasFocus === 'function' ? document.hasFocus() : true;
    return visible && focused;
  } catch {
    return true;
  }
}
// ===== FIXED AD SLOT HEIGHT (px) =====
// Контент внутри вписывается, но высота/ширина слота не растут.
const AD_SLOT_HEIGHT_PX = {
  mobile: 520,   // < 640px
  tablet: 620,   // 640..1023px
  desktop: 650,  // >= 1024px
};

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
async function detectMediaKind(url, timeoutMs = 3000) {
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
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      }).catch(() => null);
      if (headResp) {
        const byHeadCt = classify(headResp.headers.get('content-type'));
        if (byHeadCt) return persist(byHeadCt, true);
      }

      // Некоторые хранилища/прокси режут HEAD, но GET работает.
      const getResp = await fetch(key, {
        method: 'GET',
        headers: { Range: 'bytes=0-1' },
        signal: controller.signal,
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      }).catch(() => null);
      if (getResp) {
        const byGetCt = classify(getResp.headers.get('content-type'));
        if (byGetCt) return persist(byGetCt, true);
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
  const [muted, setMuted] = useState(true);

  // уникальный id инстанса, чтобы не ловить свой же event
  const playerIdRef = useRef(
    `ad_${Math.random().toString(36).slice(2)}_${Date.now()}`
  );

  // init muted from global pref (forum scheme)
  useEffect(() => {
    const pref = readMutedPrefFromStorage();
    const want = desiredMutedFromPref(pref);
    setMuted(want);
  }, []);
  // текущий выбранный mediaHref (конкретный youtube / картинка и т.п.)
  const [mediaHref, setMediaHref] = useState(null);

  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const ytIframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const videoErrorUntilRef = useRef(new Map());
  const isVideoSrcTemporarilyBlocked = React.useCallback((src) => {
    const key = String(src || '').trim();
    if (!key) return false;
    const until = Number(videoErrorUntilRef.current.get(key) || 0);
    if (!until) return false;
    if (until <= Date.now()) {
      videoErrorUntilRef.current.delete(key);
      return false;
    }
    return true;
  }, []);
  const markVideoSrcTemporarilyBlocked = React.useCallback((src, ms = 20000) => {
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
  }, []);
  const clearVideoSrcBlock = React.useCallback((src) => {
    const key = String(src || '').trim();
    if (!key) return;
    videoErrorUntilRef.current.delete(key);
  }, []);
  // ===== Focus / attention gating =====
  // isNear: блок рядом (можно подгружать, но не играть)
  // isFocused: блок реально в зоне внимания (играем)
  // isPageActive: вкладка/окно активно (иначе всегда пауза)
  const [isNear, setIsNear] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPageActive, setIsPageActive] = useState(() => isPageActuallyActive());

  const shouldPlay = isFocused && isPageActive;
  const shouldPrimeAdMedia = (isNear && isPageActive) || shouldPlay;

  const shouldPlayRef = useRef(false);
  const shouldPrimeAdMediaRef = useRef(false);
  const mutedRef = useRef(true);
  const adPlayEventTsRef = useRef(0);
  const autoplayRetryTimerRef = useRef(0);
  const autoplayRetryStageRef = useRef(0);
  const autoplayRetryTotalRef = useRef(0);
  const adPlaybackConfirmRef = useRef(null);
  const adPlaybackConfirmUntilRef = useRef(0);
  const adLastPrimeLoadTsRef = useRef(0);
  const adLastStartAttemptTsRef = useRef(0);
  const tryStartAdVideoRef = useRef(() => false);
  const tryStartAdYoutubeRef = useRef(() => false);

  const setAdPlaybackState = React.useCallback((state = 'idle') => {
    const root = rootRef.current;
    if (!root) return;
    try { root.dataset.adPlayState = String(state || 'idle'); } catch {}
    try { root.dataset.adShouldPlay = shouldPlayRef.current ? '1' : '0'; } catch {}
  }, []);

  const emitAdPlayToCoordinator = React.useCallback((source = 'ad') => {
    if (!isBrowser()) return;
    try {
      const now = Date.now();
      if ((now - Number(adPlayEventTsRef.current || 0)) < 320) return;
      adPlayEventTsRef.current = now;

      const el =
        videoRef.current ||
        ytIframeRef.current ||
        rootRef.current ||
        null;

      window.dispatchEvent(
        new CustomEvent('site-media-play', {
          detail: {
            source,
            element: el,
            manual: false,
            id: playerIdRef.current,
          },
        })
      );
    } catch {}
  }, []);

  const clearAdAutoplayRetry = React.useCallback(() => {
    const tid = Number(autoplayRetryTimerRef.current || 0);
    if (!tid) return;
    try { clearTimeout(tid); } catch {}
    autoplayRetryTimerRef.current = 0;
  }, []);

  const clearAdPlaybackConfirm = React.useCallback(() => {
    const cleanup = adPlaybackConfirmRef.current;
    if (typeof cleanup === 'function') {
      try { cleanup(); } catch {}
    }
    adPlaybackConfirmRef.current = null;
    adPlaybackConfirmUntilRef.current = 0;
  }, []);

  const isAdPlaybackConfirmPending = React.useCallback(() => {
    if (typeof adPlaybackConfirmRef.current !== 'function') return false;
    return Number(adPlaybackConfirmUntilRef.current || 0) > Date.now();
  }, []);

  const resetAdAutoplayRetry = React.useCallback(() => {
    autoplayRetryStageRef.current = 0;
    autoplayRetryTotalRef.current = 0;
    adLastStartAttemptTsRef.current = 0;
    clearAdAutoplayRetry();
    clearAdPlaybackConfirm();
  }, [clearAdAutoplayRetry, clearAdPlaybackConfirm]);

  const markAdPlaybackStarted = React.useCallback(() => {
    clearAdPlaybackConfirm();
    setAdPlaybackState('playing');
    bumpGlobalAdPlaybackHold(1800);
    emitAdPlayToCoordinator('ad_video');
    resetAdAutoplayRetry();
  }, [clearAdPlaybackConfirm, emitAdPlayToCoordinator, resetAdAutoplayRetry, setAdPlaybackState]);

  const scheduleAdAutoplayRetry = React.useCallback((reason = 'retry', { rearm = false } = {}) => {
    if (!isBrowser()) return false;
    if (!shouldPlayRef.current) {
      clearAdPlaybackConfirm();
      clearAdAutoplayRetry();
      return false;
    }
    if (rearm && isAdPlaybackConfirmPending()) {
      return true;
    }
    if (rearm) autoplayRetryStageRef.current = Math.min(autoplayRetryStageRef.current, 1);
    if (autoplayRetryTotalRef.current >= 14) return false;
    if (autoplayRetryStageRef.current >= 7) return false;

    const delays = [120, 220, 360, 560, 840, 1280, 1860];
    const delay = delays[Math.min(autoplayRetryStageRef.current, delays.length - 1)];
    autoplayRetryStageRef.current += 1;
    autoplayRetryTotalRef.current += 1;
    setAdPlaybackState('retrying');
    clearAdAutoplayRetry();
    autoplayRetryTimerRef.current = window.setTimeout(() => {
      autoplayRetryTimerRef.current = 0;
      if (!shouldPlayRef.current) return;
      if (media.kind === 'video') {
        tryStartAdVideoRef.current?.(`${reason}:retry`);
        return;
      }
      if (media.kind === 'youtube') {
        tryStartAdYoutubeRef.current?.(`${reason}:retry`);
        return;
      }
      if (media.kind === 'tiktok') {
        emitAdPlayToCoordinator('ad_tiktok');
      }
    }, delay);
    return true;
  }, [clearAdAutoplayRetry, clearAdPlaybackConfirm, emitAdPlayToCoordinator, isAdPlaybackConfirmPending, media.kind, setAdPlaybackState]);

  const destroyLocalYtPlayer = React.useCallback((blankIframe = false) => {
    const player = ytPlayerRef.current;
    ytPlayerRef.current = null;

    try { player?.pauseVideo?.(); } catch {}
    try { player?.stopVideo?.(); } catch {}
    try { player?.destroy?.(); } catch {}

    if (blankIframe) {
      try {
        const iframe = ytIframeRef.current;
        if (iframe) {
          iframe.removeAttribute('src');
          iframe.src = 'about:blank';
        }
      } catch {}
    }
  }, []);
  const primeAdVideo = React.useCallback(() => {
    const v = videoRef.current;
    if (!v || media.kind !== 'video' || !media.src) return false;
    if (!shouldPrimeAdMediaRef.current && !shouldPlayRef.current) return false;
    if (isVideoSrcTemporarilyBlocked(media.src)) return false;

    const desiredSrc = String(v.getAttribute('data-src') || media.src || '').trim();

    try {
      v.playsInline = true;
      v.loop = true;
      v.preload = 'auto';
    } catch {}

    applyHtmlMediaMutedState(v, mutedRef.current);

    try {
      if (desiredSrc && String(v.getAttribute('src') || '').trim() !== desiredSrc) {
        v.setAttribute('src', desiredSrc);
      }
    } catch {}

    try {
      if (Number(v.readyState || 0) >= 2) return true;
      const isCold =
        (typeof HTMLMediaElement !== 'undefined' &&
          (
            v.networkState === HTMLMediaElement.NETWORK_EMPTY ||
            v.networkState === HTMLMediaElement.NETWORK_IDLE
          )) ||
        !v.currentSrc;
      if (!isCold && Number(v.readyState || 0) > 0) return false;
      const now = Date.now();
      if ((now - Number(adLastPrimeLoadTsRef.current || 0)) < 1200) return false;
      adLastPrimeLoadTsRef.current = now;
      setAdPlaybackState(shouldPlayRef.current ? 'priming' : 'warming');
      try { v.load?.(); } catch {}
    } catch {}

    return Number(v.readyState || 0) >= 2;
  }, [isVideoSrcTemporarilyBlocked, media.kind, media.src, setAdPlaybackState]);

  const confirmAdPlaybackStart = React.useCallback((reason = 'play') => {
    const v = videoRef.current;
    if (!v) return false;

    clearAdPlaybackConfirm();

    const confirmWindowMs = 760;
    const startTime = Number(v.currentTime || 0);
    let settled = false;
    let timerId = 0;
    let frameId = 0;

    const cleanup = () => {
      try { v.removeEventListener('playing', onPlaying); } catch {}
      try { v.removeEventListener('timeupdate', onTimeUpdate); } catch {}
      try { v.removeEventListener('ended', onEnded); } catch {}
      try { v.removeEventListener('emptied', onAbortLike); } catch {}
      try { v.removeEventListener('error', onAbortLike); } catch {}
      try { v.removeEventListener('abort', onAbortLike); } catch {}
      try {
        if (timerId) clearTimeout(timerId);
      } catch {}
      timerId = 0;
      try {
        if (frameId && typeof v.cancelVideoFrameCallback === 'function') {
          v.cancelVideoFrameCallback(frameId);
        }
      } catch {}
      frameId = 0;
    };

    const settleStarted = (trigger = 'playing') => {
      if (settled) return true;
      settled = true;
      cleanup();
      adPlaybackConfirmRef.current = null;
      markAdPlaybackStarted(trigger);
      return true;
    };

    const settlePending = (trigger = 'timeout') => {
      if (settled) return false;
      settled = true;
      cleanup();
      adPlaybackConfirmRef.current = null;
      if (!shouldPlayRef.current) return false;
      setAdPlaybackState('retrying');
      scheduleAdAutoplayRetry(`${reason}:${trigger}`);
      return false;
    };

    const maybeStarted = (trigger = 'probe') => {
      try {
        const currentTime = Number(v.currentTime || 0);
        const progressed = currentTime > (startTime + 0.033);
        const readyEnough = Number(v.readyState || 0) >= 2;
        if ((!v.paused && readyEnough && currentTime > 0.033) || progressed) {
          return settleStarted(trigger);
        }
      } catch {}
      return false;
    };

    const onPlaying = () => {
      settleStarted('playing_event');
    };
    const onTimeUpdate = () => {
      maybeStarted('timeupdate');
    };
    const onEnded = () => {
      if (!settled) settlePending('ended_before_confirm');
    };
    const onAbortLike = () => {
      if (!settled) settlePending('abort_like');
    };

    if (maybeStarted('sync')) return true;

    try { v.addEventListener('playing', onPlaying, { passive: true }); } catch {}
    try { v.addEventListener('timeupdate', onTimeUpdate, { passive: true }); } catch {}
    try { v.addEventListener('ended', onEnded, { passive: true }); } catch {}
    try { v.addEventListener('emptied', onAbortLike, { passive: true }); } catch {}
    try { v.addEventListener('error', onAbortLike, { passive: true }); } catch {}
    try { v.addEventListener('abort', onAbortLike, { passive: true }); } catch {}

    try {
      if (typeof v.requestVideoFrameCallback === 'function') {
        const watchFrame = () => {
          try {
            frameId = v.requestVideoFrameCallback((_now, meta) => {
              if (settled) return;
              const mediaTime = Number(meta?.mediaTime || 0);
              if (mediaTime > (startTime + 0.02) || maybeStarted('video_frame')) return;
              watchFrame();
            });
          } catch {}
        };
        watchFrame();
      }
    } catch {}

    timerId = window.setTimeout(() => {
      settlePending('timeout');
    }, confirmWindowMs);

    adPlaybackConfirmRef.current = cleanup;
    adPlaybackConfirmUntilRef.current = Date.now() + confirmWindowMs;
    setAdPlaybackState('attempting');
    return false;
  }, [clearAdPlaybackConfirm, markAdPlaybackStarted, scheduleAdAutoplayRetry, setAdPlaybackState]);

const tryStartAdVideo = React.useCallback((reason = 'play') => {
  const v = videoRef.current;
  if (!v) return false;
  if (!shouldPlayRef.current) return false;
  if (isVideoSrcTemporarilyBlocked(media.src)) return false;
  {
    const now = Date.now();
    if (isAdPlaybackConfirmPending() && (now - Number(adLastStartAttemptTsRef.current || 0)) < 140) {
      return true;
    }
    adLastStartAttemptTsRef.current = now;
  }

  bumpGlobalAdPlaybackHold(960);
  primeAdVideo(reason);

  try {
    v.playsInline = true;
    v.loop = true;
    v.preload = 'auto';
  } catch {}

  applyHtmlMediaMutedState(v, mutedRef.current);

  try {
    const isCold =
      (typeof HTMLMediaElement !== 'undefined' &&
        (
          v.networkState === HTMLMediaElement.NETWORK_EMPTY ||
          v.networkState === HTMLMediaElement.NETWORK_IDLE
        )) ||
      !v.currentSrc;

    if (isCold && Number(v.readyState || 0) < 2) {
      scheduleAdAutoplayRetry(`${reason}:cold`);
      return false;
    }
  } catch {}

  const retryMutedFallback = () => {
    if (!shouldPlayRef.current) return false;
    if (v.muted) {
      scheduleAdAutoplayRetry(`${reason}:muted_blocked`);
      return false;
    }

    applyHtmlMediaMutedState(v, true);
    try { writeMutedPrefToStorage(true); } catch {}
    try { emitMutedPref(true, playerIdRef.current, 'forum-ads-autoplay-fallback'); } catch {}
    mutedRef.current = true;
    setMuted(true);

    try {
      const retry = v.play?.();
      if (retry && typeof retry.then === 'function') {
        retry
          .then(() => {
            confirmAdPlaybackStart(`${reason}:muted_retry`);
          })
          .catch(() => {
            scheduleAdAutoplayRetry(`${reason}:muted_retry_fail`);
          });
        return true;
      }
    } catch {}

    if (!v.paused) {
      confirmAdPlaybackStart(`${reason}:muted_retry_sync`);
      return true;
    }

    scheduleAdAutoplayRetry(`${reason}:muted_pending`);
    return false;
  };

  try {
    const p = v.play?.();

    if (p && typeof p.then === 'function') {
      p.then(() => {
        confirmAdPlaybackStart(reason);
      }).catch(() => {
        retryMutedFallback();
      });
      return true;
    }
  } catch {
    retryMutedFallback();
    return false;
  }

  if (!v.paused) {
    confirmAdPlaybackStart(`${reason}:sync`);
    return true;
  }

  scheduleAdAutoplayRetry(`${reason}:pending`);
  return false;
}, [
  confirmAdPlaybackStart,
  isAdPlaybackConfirmPending,
  isVideoSrcTemporarilyBlocked,
  media.src,
  primeAdVideo,
  scheduleAdAutoplayRetry,
]);
tryStartAdVideoRef.current = tryStartAdVideo;
  const slotCssVars = {
    '--ad-slot-h-m': `${AD_SLOT_HEIGHT_PX.mobile}px`,
    '--ad-slot-h-t': `${AD_SLOT_HEIGHT_PX.tablet}px`,
    '--ad-slot-h-d': `${AD_SLOT_HEIGHT_PX.desktop}px`,
  };

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    shouldPlayRef.current = shouldPlay;
    shouldPrimeAdMediaRef.current = shouldPrimeAdMedia;
    setAdPlaybackState(shouldPlay ? 'armed' : 'idle');
    if (!shouldPlay) {
      clearAdPlaybackConfirm();
      clearAdAutoplayRetry();
      autoplayRetryStageRef.current = 0;
      autoplayRetryTotalRef.current = 0;
    }
  }, [clearAdAutoplayRetry, clearAdPlaybackConfirm, setAdPlaybackState, shouldPlay, shouldPrimeAdMedia]);

  const tryStartAdYoutube = React.useCallback((reason = 'ad_youtube') => {
    const player = ytPlayerRef.current;
    if (!player) return false;
    if (!shouldPlayRef.current) return false;
    {
      const now = Date.now();
      if (isAdPlaybackConfirmPending() && (now - Number(adLastStartAttemptTsRef.current || 0)) < 140) {
        return true;
      }
      adLastStartAttemptTsRef.current = now;
    }

    try {
      bumpGlobalAdPlaybackHold(960);
      if (mutedRef.current) player.mute?.();
      else player.unMute?.();
      setAdPlaybackState('attempting');
      player.playVideo?.();
      scheduleAdAutoplayRetry(`${reason}:watchdog`);
      return true;
    } catch {
      scheduleAdAutoplayRetry(`${reason}:throw`);
      return false;
    }
  }, [isAdPlaybackConfirmPending, scheduleAdAutoplayRetry, setAdPlaybackState]);
  tryStartAdYoutubeRef.current = tryStartAdYoutube;

  useEffect(() => {
    if (media.kind === 'video' || media.kind === 'youtube' || media.kind === 'tiktok') return;
    resetAdAutoplayRetry();
    setAdPlaybackState('idle');
  }, [media.kind, resetAdAutoplayRetry, setAdPlaybackState]);

  useEffect(() => {
    if (media.kind !== 'video' || !media.src) return;
    if (!shouldPrimeAdMedia) return;
    primeAdVideo('near_prime');
  }, [media.kind, media.src, primeAdVideo, shouldPrimeAdMedia]);

  // Page visibility + focus/blur
  useEffect(() => {
    if (!isBrowser()) return;

    const sync = () => {
      setIsPageActive(isPageActuallyActive());
    };

    sync();

    document.addEventListener('visibilitychange', sync, true);
    window.addEventListener('focus', sync, true);
    window.addEventListener('blur', sync, true);
    window.addEventListener('pageshow', sync, true);

    return () => {
      document.removeEventListener('visibilitychange', sync, true);
      window.removeEventListener('focus', sync, true);
      window.removeEventListener('blur', sync, true);
      window.removeEventListener('pageshow', sync, true);
    };
  }, []);

  // Intersection: near + focused
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !isBrowser() || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const nearObs = new IntersectionObserver( 
      ([entry]) => {
        setIsNear(!!entry?.isIntersecting);
      },
      {
        rootMargin: AD_NEAR_ROOT_MARGIN,
        threshold: 0.001,
      }
    );

    const focusObs = new IntersectionObserver( 
      ([entry]) => {
        const ratio = Number(entry?.intersectionRatio || 0);
        setIsFocused((prev) =>
          prev ? ratio >= AD_FOCUS_STOP_RATIO : ratio >= AD_FOCUS_START_RATIO
        );
      },
      {
        threshold: [0, 0.15, 0.35, 0.6, 0.85, 1],
        rootMargin: '-10% 0px -10% 0px',
      }
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

      const next = !!d.muted;
      const changed = mutedRef.current !== next;
      mutedRef.current = next;
      setMuted(next);

      // HTML5
      if (videoRef.current) {
        applyHtmlMediaMutedState(videoRef.current, next);
      }

      // YouTube
      if (ytPlayerRef.current) {
        try {
          if (next) ytPlayerRef.current.mute?.();
          else ytPlayerRef.current.unMute?.();
        } catch {}
      }

      if (shouldPlayRef.current && changed) {
        scheduleAdAutoplayRetry('global_mute_change', { rearm: true });
      }
    };

    window.addEventListener(MEDIA_MUTED_EVENT, onMuted);
    return () => window.removeEventListener(MEDIA_MUTED_EVENT, onMuted);
  }, [scheduleAdAutoplayRetry]);
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
      // 0) сначала пробуем определить тип по Content-Type (HEAD)
      if (!cancelled && shouldProbeMediaKind(mediaHref)) {
        const detected = await detectMediaKind(mediaHref).catch(() => null);
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

    if (media.kind !== 'youtube' || !media.src || !shouldPrimeAdMedia) {
      clearAdAutoplayRetry();
      destroyLocalYtPlayer(!shouldPrimeAdMedia);
      return;
    }

    let cancelled = false;
    let localPlayer = null;

    const applyPlayerState = (player) => {
      if (!player || cancelled) return;
      try {
        if (mutedRef.current) player.mute?.();
        else player.unMute?.();

        if (shouldPlayRef.current) {
          tryStartAdYoutube('yt_apply_state');
        } else {
          resetAdAutoplayRetry();
          player.pauseVideo?.();
        }
      } catch {}
    };

    const mountPlayer = () => {
      if (cancelled) return;
      if (!window.YT || !window.YT.Player || !ytIframeRef.current) return;

      destroyLocalYtPlayer(false);

      try {
        localPlayer = new window.YT.Player(ytIframeRef.current, {
          videoId: media.src,
          playerVars: {
            autoplay: 0,
            controls: 0,
            mute: mutedRef.current ? 1 : 0,
            rel: 0,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            loop: 1,
            playlist: media.src,
          },
          events: {
            onReady: (ev) => {
              if (cancelled) {
                try { ev.target?.destroy?.(); } catch {}
                return;
              }
              ytPlayerRef.current = ev.target;
              applyPlayerState(ev.target);
            },
            onStateChange: (ev) => {
              if (cancelled) return;
              const st = ev?.data;

              if (st === window.YT?.PlayerState?.PLAYING) {
                setAdPlaybackState('playing');
                bumpGlobalAdPlaybackHold(1800);
                resetAdAutoplayRetry();
                emitAdPlayToCoordinator('ad_youtube');
                return;
              }

              if (
                shouldPlayRef.current &&
                (
                  st === window.YT?.PlayerState?.BUFFERING ||
                  st === window.YT?.PlayerState?.UNSTARTED ||
                  st === window.YT?.PlayerState?.CUED
                )
              ) {
                setAdPlaybackState('attempting');
                scheduleAdAutoplayRetry(`yt_state_${String(st || 'pending')}`, { rearm: true });
              }

              if (st === window.YT?.PlayerState?.ENDED) {
                try { ev.target?.seekTo?.(0, true); } catch {}
                tryStartAdYoutube('yt_ended');
              }
            },
            onError: () => {
              clearAdPlaybackConfirm();
              clearAdAutoplayRetry();
              setAdPlaybackState('error');
              destroyLocalYtPlayer(true);
            },
          },
        }); 
      } catch {}
    };

    if (window.YT?.Player) {
      mountPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        try {
          if (typeof prev === 'function') prev();
        } catch {}
        mountPlayer();
      };

      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.head.appendChild(tag);
      }
    }

    return () => {
      cancelled = true;
      if (localPlayer) {
        try { localPlayer.pauseVideo?.(); } catch {}
        try { localPlayer.destroy?.(); } catch {}
        if (ytPlayerRef.current === localPlayer) ytPlayerRef.current = null;
      }
    };
  }, [
    media.kind,
    media.src,
    shouldPrimeAdMedia,
    clearAdAutoplayRetry,
    clearAdPlaybackConfirm,
    destroyLocalYtPlayer,
    emitAdPlayToCoordinator,
    resetAdAutoplayRetry,
    scheduleAdAutoplayRetry,
    setAdPlaybackState,
    tryStartAdYoutube,
  ]);

  useEffect(() => {
    return () => {
      clearAdPlaybackConfirm();
      clearAdAutoplayRetry();
      setAdPlaybackState('idle');
      destroyLocalYtPlayer(true);
    };
  }, [clearAdAutoplayRetry, clearAdPlaybackConfirm, destroyLocalYtPlayer, setAdPlaybackState]);
  // ===== Hard stop / resume playback depending on attention =====
useEffect(() => {
  // HTML5 video
  if (media.kind === 'video' && videoRef.current) {
    const v = videoRef.current;
    const srcKey = String(media.src || '');

    if (isVideoSrcTemporarilyBlocked(srcKey)) {
      try { v.pause?.(); } catch {}
      setAdPlaybackState('blocked');
      return;
    }

    if (shouldPlay) {
      tryStartAdVideo('attention_resume');
    } else {
      resetAdAutoplayRetry();
      clearAdPlaybackConfirm();
      setAdPlaybackState('idle');
      try { v.pause?.(); } catch {}
    }
  }

  // YouTube player (Iframe API)
  if (media.kind === 'youtube' && ytPlayerRef.current) {
    const p = ytPlayerRef.current;
    try {
      if (shouldPlay) {
        tryStartAdYoutube('attention_resume');
      } else {
        resetAdAutoplayRetry();
        clearAdPlaybackConfirm();
        setAdPlaybackState('idle');
        p.pauseVideo?.();
      }
    } catch {}
  }

  if (media.kind === 'tiktok' && shouldPlay) {
    emitAdPlayToCoordinator('ad_tiktok');
  }
}, [
  emitAdPlayToCoordinator,
  isVideoSrcTemporarilyBlocked,
  shouldPlay,
  media.kind,
  media.src,
  clearAdPlaybackConfirm,
  resetAdAutoplayRetry,
  setAdPlaybackState,
  tryStartAdVideo,
  tryStartAdYoutube,
]);

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
    const next = !muted;

    // 1) сохранить глобально + оповестить всех
    writeMutedPrefToStorage(next);
    emitMutedPref(next, playerIdRef.current, 'forum-ads-toggle');

    // 2) локально
    mutedRef.current = next;
    setMuted(next);

    // HTML5
    if (media.kind === 'video' && videoRef.current) {
      const v = videoRef.current;
      applyHtmlMediaMutedState(v, next);
      if (shouldPlayRef.current) {
        if (next) scheduleAdAutoplayRetry('manual_toggle', { rearm: true });
        else tryStartAdVideoRef.current?.('manual_toggle');
      }
      return;
    }

    // YouTube
    if (media.kind === 'youtube' && ytPlayerRef.current) {
      const p = ytPlayerRef.current;
      try { 
        if (next) p.mute?.();
        else {
          p.unMute?.();
          if (shouldPlayRef.current) tryStartAdYoutube('manual_toggle');
        }
      } catch {} 
    } 
  };

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
    height: var(--ad-slot-h-m);
  }
  @media (min-width: 640px) {
.forum-ad-media-slot[data-layout="fixed"] {
      height: var(--ad-slot-h-t);
    }
  }

  @media (min-width: 1024px) {
    .forum-ad-media-slot[data-layout="fixed"] {
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
                fontSize: '12px',
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
      src={
        shouldPrimeAdMedia && !isVideoSrcTemporarilyBlocked(media.src)
          ? media.src
          : undefined
      }
      data-src={media.src}
      className="forum-ad-fit"
      muted={muted}
      defaultMuted={muted}
      loop
      playsInline
      referrerPolicy="no-referrer"
      preload={shouldPrimeAdMedia ? 'auto' : 'none'}
      onLoadedMetadata={() => {
        try { clearVideoSrcBlock(media?.src); } catch {}
        primeAdVideo('loadedmetadata');
        scheduleAdAutoplayRetry('loadedmetadata', { rearm: true });
      }}
      onLoadedData={() => {
        try { clearVideoSrcBlock(media?.src); } catch {}
        primeAdVideo('loadeddata');
        scheduleAdAutoplayRetry('loadeddata', { rearm: true });
      }}
      onCanPlay={() => {
        try { clearVideoSrcBlock(media?.src); } catch {}
        primeAdVideo('canplay');
        scheduleAdAutoplayRetry('canplay', { rearm: true });
      }}
      onPlaying={() => {
        try { clearVideoSrcBlock(media?.src); } catch {}
        markAdPlaybackStarted('dom_playing');
      }}
      onPause={() => {
        const v = videoRef.current;
        if (!v) return;
        if (!shouldPlayRef.current) return;
        if (v.ended) return;
        setAdPlaybackState('paused');
        scheduleAdAutoplayRetry('pause', { rearm: true });
      }}
      onWaiting={() => {
        if (!shouldPlayRef.current) return;
        setAdPlaybackState('waiting');
        scheduleAdAutoplayRetry('waiting', { rearm: true });
      }}
      onStalled={() => {
        if (!shouldPlayRef.current) return;
        setAdPlaybackState('stalled');
        scheduleAdAutoplayRetry('stalled', { rearm: true });
      }}
      onError={() => {
        clearAdPlaybackConfirm();
        clearAdAutoplayRetry();
        setAdPlaybackState('error');
        try {
          markVideoSrcTemporarilyBlocked(media?.src, isNear ? 12000 : 20000);
        } catch {}
        try {
          videoRef.current?.pause?.();
        } catch {}
      }}
    />
  </div>
)}
 
            {media.kind === 'youtube' && media.src && shouldPrimeAdMedia && (
              <div
                className="relative overflow-hidden rounded-lg"
                style={
                  isFluid
                    ? { width: '100%', aspectRatio: '16 / 9' }
                    : { width: '100%', height: '100%' }
                }
              >
                <iframe
                  ref={ytIframeRef}
                  src={`https://www.youtube.com/embed/${media.src}?enablejsapi=1&controls=0&rel=0&fs=0&modestbranding=1&playsinline=1`}
                  data-src={`https://www.youtube.com/embed/${media.src}?enablejsapi=1&controls=0&rel=0&fs=0&modestbranding=1&playsinline=1`}
                  loading="lazy"
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

            {media.kind === 'youtube' && media.src && !shouldPrimeAdMedia && (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-[color:var(--muted-fore,#9ca3af)]">
                {host}
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
      <NextImage
        src={media.src}
        alt={host}
        fill
        className="forum-ad-fit"
        style={{ objectFit: 'contain', objectPosition: 'center' }}
        unoptimized
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
                className="audio-toggle"
                aria-label={muted ? 'Включить звук' : 'Выключить звук'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
            )}

            <div className="pointer-events-none absolute inset-0 rounded-lg border border-transparent qshine" />
          </div>
        </div> 
      </a>
    </div>
  );
}
