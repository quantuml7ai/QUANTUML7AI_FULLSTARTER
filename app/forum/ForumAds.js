// app/forum/ForumAds.js
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useI18n } from '../../components/i18n';
import { useRouter } from 'next/navigation';

/* ======================= CAMPAIGN META ======================= */
const AD_LABEL_FONT_SIZE_PX = 20;

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


/**
 * ВАЖНО: только статические обращения к NEXT_PUBLIC_*
 */
/* eslint-disable no-undef */
const ENV_AD = {
  EVERY: process.env.NEXT_PUBLIC_FORUM_AD_EVERY,
  ROTATE_MIN: process.env.NEXT_PUBLIC_FORUM_AD_ROTATE_MIN,
  DEBUG: process.env.NEXT_PUBLIC_FORUM_AD_DEBUG,
  LINKS: process.env.NEXT_PUBLIC_FORUM_AD_LINKS,
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
const adMediaResolveCache = new Map();
const adMediaResolveInflight = new Map();
const AD_MEDIA_RESOLVE_CACHE_OK_MS = 12 * 60 * 1000;
const AD_MEDIA_RESOLVE_CACHE_FAIL_MS = 10 * 60 * 1000;

// Visual default only. Runtime owners decide when to switch to auto/play.
const AD_NATIVE_VIDEO_PRELOAD_IDLE = 'metadata';

// ======================= ADS LINKS FROM REDIS =======================

let adsLinksMerged = false;
let adsLinksMergePromise = null;
let adsLinksLastAttemptTs = 0;
const ADS_LINKS_RETRY_MS = 5000;
export const FORUM_AD_LINKS_UPDATED_EVENT = 'forum:ads-links-updated';

function emitForumAdLinksUpdated(conf, detail = {}) {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(
      new CustomEvent(FORUM_AD_LINKS_UPDATED_EVENT, {
        detail: {
          source: 'forum-ads',
          links_len: Array.isArray(conf?.LINKS) ? conf.LINKS.length : 0,
          ...detail,
        },
      })
    );
  } catch {}
}

async function mergeLinksFromRedisOnce() {
  if (!isBrowser()) return cachedClientConf;
  if (adsLinksMerged) return cachedClientConf;
  if (adsLinksMergePromise) return adsLinksMergePromise;

  const now = Date.now();
  if (adsLinksLastAttemptTs && now - adsLinksLastAttemptTs < ADS_LINKS_RETRY_MS) {
    return cachedClientConf;
  }
  adsLinksLastAttemptTs = now;

  adsLinksMergePromise = (async () => {
    try {
      // берём ссылки через универсальный /api/ads?action=links
      const res = await fetch('/api/ads?action=links', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) return cachedClientConf;
      const j = await res.json().catch(() => null);
      if (!j || !j.ok || !j.linksString) return cachedClientConf;

      const extraParsed = parseLinks(j.linksString);
      if (!extraParsed.links || !extraParsed.links.length) return cachedClientConf;

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
      cachedClientConf = base;
      adsLinksMerged = true;

      debugLog(base, 'merge_links_from_redis', {
        env_len: baseLinks.length,
        extra_len: extraParsed.links.length,
        final_len: cleanedLinks.length,
      });

      emitForumAdLinksUpdated(base, {
        source: 'redis',
        env_len: baseLinks.length,
        extra_len: extraParsed.links.length,
        final_len: cleanedLinks.length,
      });

      return base;
    } catch {
      return cachedClientConf;
    } finally {
      adsLinksMergePromise = null;
    }
  })();

  return adsLinksMergePromise;
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

export function getForumAdConf() {
  // ENV-ссылки и Redis/DB-ссылки — независимые источники.
  // Даже если cache уже создан из пустого NEXT_PUBLIC_FORUM_AD_LINKS,
  // Redis merge всё равно должен иметь шанс наполнить тот же cache.
  if (isBrowser()) {
    mergeLinksFromRedisOnce().catch(() => {});
  }

  if (isBrowser() && cachedClientConf) return cachedClientConf;

  const EVERY = parseNumber(readRaw('EVERY'), 0);
  const ROTATE_MIN = parseNumber(readRaw('ROTATE_MIN'), 1);

  const parsed = parseLinks(readRaw('LINKS') || '');
  const LINKS = parsed.links || [];
  const MEDIA_BY_CLICK = parsed.mediaByClick || {};

  const DEBUG = String(readRaw('DEBUG') || '').trim() === '1';

  const conf = {
    EVERY,
    ROTATE_MIN,
    LINKS,
    MEDIA_BY_CLICK,
    DEBUG,
    seed: hash32(`${CAMPAIGN_ID}:${FALLBACK_CAMPAIGN_SEED}:${LINKS.length}`),
  };

  if (isBrowser()) cachedClientConf = conf;

  debugLog(conf, 'config_built', {
    EVERY,
    ROTATE_MIN,
    LINKS_LEN: LINKS.length,
  });

  return conf;
}

/* ======================= INTERLEAVE ======================= */

export function interleaveAds(items, EVERY, opts = {}) {
  const { isSkippable, getId } = opts;
  const out = [];

  if (!Array.isArray(items) || !items.length) return [];

  const resolveItemKey = (item, index) => {
    const raw =
      (typeof getId === 'function' && getId(item)) ||
      item?.id ||
      item?.postId ||
      item?._id ||
      item?.uuid ||
      item?.key ||
      item?.topicId ||
      `idx${index}`;
    const stable = String(raw || `idx${index}`).trim();
    return stable || `idx${index}`;
  };

  if (!EVERY || EVERY <= 0) {
    return items.map((item, i) => {
      const itemKey = resolveItemKey(item, i);
      return { type: 'item', item, key: `item:${itemKey}` };
    });
  }

  let contentCount = 0;
  let adIndex = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemKey = resolveItemKey(item, i);
    out.push({ type: 'item', item, key: `item:${itemKey}` });

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

export function useAdPreconnect() {
  useEffect(() => {
    // Direct-media-only mode: no external page-preview preconnects.
  }, []);
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

/* ====== controlled visual helpers ====== */

function normalizeAdMuted(value) {
  // Only explicit false means sound is on. Safe default: muted.
  return value === false ? false : true;
}

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        try { ref(node); } catch {}
      } else {
        try { ref.current = node; } catch {}
      }
    });
  };
}

function toSafeClickUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
}

function buildYouTubeEmbedSrc(videoId) {
  const id = String(videoId || '').trim();
  if (!id) return '';

  const url = new URL(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`);
  url.searchParams.set('enablejsapi', '1');
  url.searchParams.set('controls', '0');
  url.searchParams.set('rel', '0');
  url.searchParams.set('fs', '0');
  url.searchParams.set('modestbranding', '1');
  url.searchParams.set('playsinline', '1');
  url.searchParams.set('loop', '1');
  url.searchParams.set('playlist', id);
  url.searchParams.set('autoplay', '0');
  url.searchParams.set('mute', '1');

  try {
    if (isBrowser() && window.location?.origin) {
      url.searchParams.set('origin', window.location.origin);
    }
  } catch {}

  return url.toString();
}

function buildTikTokEmbedSrc(videoId) {
  const id = String(videoId || '').trim();
  if (!id) return '';

  const url = new URL(`https://www.tiktok.com/embed/v2/${encodeURIComponent(id)}`);
  return url.toString();
}

function readMediaListForClick(conf, clickHref) {
  const entry = conf?.MEDIA_BY_CLICK?.[clickHref] ?? null;

  if (Array.isArray(entry) && entry.length) return entry.filter(Boolean);
  if (typeof entry === 'string' && entry.trim()) return [entry.trim()];

  return clickHref ? [clickHref] : [];
}

function emitAdFallback(conf, clickHref, slotKind, cascadeStep) {
  emitAdEvent(
    'ad_fallback',
    { url: clickHref, cascade_step: cascadeStep, slot_kind: slotKind },
    conf
  );
}

export async function resolveAdMediaPayload(mediaHref, opts = {}) {
  const key = String(mediaHref || '').trim();
  if (!key) return { kind: 'skeleton', src: null };

  const cached = readCachedAdResolvedMedia(key);
  if (cached) return cached;

  const inflight = adMediaResolveInflight.get(key);
  if (inflight) return inflight;

  const task = (async () => {
    const conf = opts.conf || getForumAdConf();
    const clickHref = String(opts.clickHref || key);
    const slotKind = opts.slotKind;

    const publish = (media, okCache = true, cascadeStep = '') => {
      cacheAdResolvedMedia(key, media, okCache);
      if (cascadeStep) emitAdFallback(conf, clickHref, slotKind, cascadeStep);
      return media;
    };

    if (isLikelyVideoUrl(key)) {
      return publish({ kind: 'video', src: key, step: 'env_video' }, true, 'env_video');
    }

    if (shouldProbeMediaKind(key)) {
      const detected = await detectMediaKind(key, 3000, {
        allowRangeFallback: false,
      }).catch(() => null);

      if (detected === 'video') {
        return publish({ kind: 'video', src: key, step: 'head_video' }, true, 'head_video');
      }

      if (detected === 'image') {
        return publish({ kind: 'image', src: key, step: 'head_image' }, true, 'head_image');
      }
    }

    const ytMatch = key.match(YT_RE);
    if (ytMatch?.[1]) {
      return publish({ kind: 'youtube', src: ytMatch[1], step: 'env_youtube' }, true, 'env_youtube');
    }

    const ttMatch = key.match(TIKTOK_RE);
    if (ttMatch) {
      let videoId = ttMatch[1] || null;
      if (!videoId) {
        try {
          videoId = new URL(key).pathname.match(/\/video\/(\d+)/)?.[1] || null;
        } catch {}
      }
      if (videoId) {
        return publish({ kind: 'tiktok', src: videoId, step: 'env_tiktok' }, true, 'env_tiktok');
      }
    }

    if (/\.(jpe?g|png|webp|gif|avif)(?:$|[?#])/i.test(key)) {
      const ok = await tryLoadImage(key);
      if (ok) return publish({ kind: 'image', src: key, step: 'direct_image' }, true, 'direct_image');
    }

    return publish({ kind: 'placeholder', src: null, step: 'placeholder' }, false, 'placeholder');
  })();

  adMediaResolveInflight.set(key, task);
  try {
    return await task;
  } finally {
    adMediaResolveInflight.delete(key);
  }
}

export function useAdMediaPayload({ url, slotKind, nearId, conf: confProp } = {}) {
  const conf = useMemo(() => confProp || getForumAdConf(), [confProp]);
  const safeClick = useMemo(() => toSafeClickUrl(url), [url]);
  const clickHref = safeClick ? safeClick.toString() : '';
  const host = safeClick ? safeClick.hostname.replace(/^www\./i, '') : '';
  const mediaKey = useMemo(
    () => `${clickHref}::${slotKind || ''}::${nearId || ''}`,
    [clickHref, slotKind, nearId]
  );
  const [mediaHref, setMediaHref] = useState(null);
  const [media, setMedia] = useState({ kind: 'skeleton', src: null });

  useEffect(() => {
    if (!clickHref) {
      setMediaHref(null);
      setMedia({ kind: 'skeleton', src: null });
      return undefined;
    }

    const list = readMediaListForClick(conf, clickHref);
    if (!list.length) {
      setMediaHref(null);
      setMedia({ kind: 'placeholder', src: null, step: 'placeholder' });
      return undefined;
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

    pickNext();

    const rotateMs = Math.max(
      10_000,
      Number(conf?.ROTATE_MIN || 1) * 60_000
    );
    const timer = setInterval(pickNext, rotateMs);

    return () => {
      clearInterval(timer);
    };
  }, [clickHref, conf, mediaKey]);

  useEffect(() => {
    if (!clickHref || !mediaHref) {
      setMedia({ kind: 'skeleton', src: null });
      return undefined;
    }

    let cancelled = false;
    const key = String(mediaHref || '').trim();
    const cached = readCachedAdResolvedMedia(key);
    if (cached) {
      setMedia(cached);
      return undefined;
    }

    if (isLikelyVideoUrl(key)) setMedia({ kind: 'video', src: key, step: 'env_video_idle' });
    else setMedia({ kind: 'skeleton', src: null });

    resolveAdMediaPayload(key, { conf, clickHref, slotKind })
      .then((next) => {
        if (!cancelled && next) setMedia(next);
      })
      .catch(() => {
        if (!cancelled) setMedia({ kind: 'placeholder', src: null, step: 'placeholder_error' });
      });

    return () => {
      cancelled = true;
    };
  }, [clickHref, conf, mediaHref, slotKind]);

  return { conf, safeClick, clickHref, host, mediaHref, media };
}

/* ======================= AdCard ======================= */
/**
 * Direct media only: native video → direct image → YouTube/TikTok → placeholder.
 * Бейдж "Реклама" из словаря: ключ forum_ad_label.
 * Внешние page-preview ветки отключены: OpenGraph/Microlink/screenshot/favicon.
 */

export function AdCard({
  url,
  slotKind,
  nearId,
  layout = 'fixed',
  muted = true,
  onSoundToggle,
  rootRef,
  videoRef,
  iframeRef,
  rootAttrs,
  mediaSlotAttrs,
  videoAttrs,
  youtubeAttrs,
  tiktokAttrs,
  deferNativeSrc = false,
  deferExternalSrc = false,
  tiktokActive = true,
  onMediaChange,
}) {
  const conf = getForumAdConf();
  useAdPreconnect(conf);
  const i18n = useI18n();
  const t = i18n?.t;
  const router = useRouter();
  const isFluid = layout === 'fluid';
  const localRootRef = useRef(null);
  const localVideoRef = useRef(null);
  const localIframeRef = useRef(null);
  const { safeClick, clickHref, host, mediaHref, media } = useAdMediaPayload({
    url,
    slotKind,
    nearId,
    conf,
  });

  useEffect(() => {
    onMediaChange?.({ media, mediaHref, clickHref, slotKind, nearId });
  }, [clickHref, media, mediaHref, nearId, onMediaChange, slotKind]);

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

  // Impression tracking
  useEffect(() => {
    const el = localRootRef.current;
    if (
      !el ||
      !isBrowser() ||
      typeof IntersectionObserver === 'undefined' ||
      !safeClick
    ) {
      return undefined;
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

  const isAdMuted = normalizeAdMuted(muted);

  const handleToggleSound = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSoundToggle?.(e, {
      muted: isAdMuted,
      nextMuted: !isAdMuted,
      media,
      mediaHref,
      clickHref,
      slotKind,
      nearId,
    });
  };

  const showSoundButton =
    (media.kind === 'video' || media.kind === 'youtube') &&
    typeof onSoundToggle === 'function';

  const videoAttrBag = videoAttrs || {};
  const youtubeAttrBag = youtubeAttrs || {};
  const tiktokAttrBag = tiktokAttrs || {};
  const {
    className: videoClassName,
    ...restVideoAttrs
  } = videoAttrBag;
  const {
    className: youtubeClassName,
    ...restYoutubeAttrs
  } = youtubeAttrBag;
  const {
    className: tiktokClassName,
    ...restTiktokAttrs
  } = tiktokAttrBag;

  const youtubeSrc = media.kind === 'youtube' && media.src ? buildYouTubeEmbedSrc(media.src) : '';
  const tiktokSrc = media.kind === 'tiktok' && media.src ? buildTikTokEmbedSrc(media.src) : '';

  return (
<div
  ref={mergeRefs(localRootRef, rootRef)}
  className="item forum-ad-card"
  data-slot-kind={slotKind}
  data-ads="1"
  data-stable-shell="1"
  data-windowing-keepalive="media"
  data-forum-windowing-stable="1"
  style={slotCssVars}
  {...(rootAttrs || {})}
>
<style jsx>{`
  .forum-ad-card {
    width: 100%;
    min-height: var(--ad-slot-h-m);
    height: var(--ad-slot-h-m);
    max-height: var(--ad-slot-h-m);
    overflow: hidden;
    contain: layout paint;
  }
  @media (min-width: 640px) {
    .forum-ad-card {
      min-height: var(--ad-slot-h-t);
      height: var(--ad-slot-h-t);
      max-height: var(--ad-slot-h-t);
    }
  }
  @media (min-width: 1024px) {
    .forum-ad-card {
      min-height: var(--ad-slot-h-d);
      height: var(--ad-slot-h-d);
      max-height: var(--ad-slot-h-d);
    }
  }
  .forum-ad-link {
    display: block;
    height: 100%;
    min-height: 0;
  }
  .forum-ad-card-body {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: .25rem;
  }
  .forum-ad-header {
    flex: 0 0 auto;
    min-height: 30px;
  }
  .forum-ad-media-slot {
    width: 100%;
    position: relative;         /* ключ: якорь для absolute медиа */
    overflow: hidden;
    border-radius: 0.5rem;
    background: var(--bg-soft, #000000);
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
  .forum-ad-card .forum-ad-media-slot[data-layout="fixed"] {
    flex: 1 1 auto;
    min-height: 0;
    height: auto;
  }

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
        className="forum-ad-link no-underline focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
      >
        <div className="forum-ad-card-body">
          {/* header: только бейдж + домен, без url-строки */}
          <div
            className="forum-ad-header flex items-center gap-2 text-[9px] uppercase tracking-wide text-[color:var(--muted-fore,#9ca3af)]"
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
{...(mediaSlotAttrs || {})}
>

 {media.kind === 'skeleton' && (
              <div className="animate-pulse w-full h-full bg-[color:var(--skeleton,#111827)]" />
            )}

{media.kind === 'video' && media.src && (
  <div className="forum-ad-media-fill">
<video
  ref={mergeRefs(localVideoRef, videoRef)}
  className={['forum-ad-fit', videoClassName].filter(Boolean).join(' ')}
  src={deferNativeSrc ? undefined : media.src}
  data-src={media.src}
  data-ad-media-src={media.src}
  data-ad-media-kind="video"
  muted={isAdMuted}
  playsInline
  referrerPolicy="no-referrer"
  preload={AD_NATIVE_VIDEO_PRELOAD_IDLE}
  loop
  {...restVideoAttrs}
/>
  </div>
)}

            {media.kind === 'youtube' && media.src && (
<div
  className="relative overflow-hidden rounded-lg"
  style={isFluid ? { width: '100%', aspectRatio: '16 / 9' } : { width: '100%', height: '100%' }}
>
  <iframe
    ref={mergeRefs(localIframeRef, iframeRef)}
    className={youtubeClassName || undefined}
    src={deferExternalSrc ? undefined : youtubeSrc}
    data-src={youtubeSrc}
    data-ad-media-src={media.src}
    data-ad-media-kind="youtube"
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
    {...restYoutubeAttrs}
  />
</div>

            )}

            {media.kind === 'tiktok' && media.src && tiktokActive && (
<div
  className="relative overflow-hidden rounded-lg"
  style={isFluid ? { width: '100%', aspectRatio: '9 / 16' } : { width: '100%', height: '100%' }}
>
  <iframe
    ref={mergeRefs(localIframeRef, iframeRef)}
    className={tiktokClassName || undefined}
    src={deferExternalSrc ? undefined : tiktokSrc}
    data-src={tiktokSrc}
    data-ad-media-src={media.src}
    data-ad-media-kind="tiktok"
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
    {...restTiktokAttrs}
  />
</div>

            )}

            {media.kind === 'tiktok' && media.src && !tiktokActive && (
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
    data-ad-sound-toggle="1"
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
