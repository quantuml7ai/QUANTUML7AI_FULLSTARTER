// app/forum/ForumAds.js
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useI18n } from '../../components/i18n';
import { useRouter } from 'next/navigation';

/* ======================= CAMPAIGN META ======================= */
const AD_LABEL_FONT_SIZE_PX = 20;

/* ======================= GLOBAL SOUND MEMORY (Forum-compatible) ======================= */
// Shared mute memory for forum media and ad media.
const MEDIA_MUTED_KEY = 'forum:mediaMuted';
const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'; // legacy fallback
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

function writeMutedPrefToStorage(val) {
  if (!isBrowser()) return;
  try {
    const next = val ? '1' : '0';
    window.localStorage?.setItem(MEDIA_MUTED_KEY, next);
    window.localStorage?.setItem(MEDIA_VIDEO_MUTED_KEY, next)
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
  // Default to muted when there is no stored pref; autoplay is more reliable this way.
  return pref == null ? true : !!pref;
}
// ===== FIXED AD SLOT HEIGHT (px) =====
// Keep the slot height fixed; media should fit inside instead of resizing the card.
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
 * Read the forum ad config from NEXT_PUBLIC_* env vars.
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

// ======================= ADS LINKS FROM REDIS =======================

let adsLinksMerged = false;

async function mergeLinksFromRedisOnce() {
  if (!isBrowser()) return;
  if (adsLinksMerged) return;
  adsLinksMerged = true;

  try {
    // Browser-side fetch of extra ad links via /api/ads?action=links.
    const res = await fetch('/api/ads?action=links', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return;
    const j = await res.json().catch(() => null);
    if (!j || !j.ok || !j.linksString) return;

    const extraParsed = parseLinks(j.linksString);
    if (!extraParsed.links || !extraParsed.links.length) return;

    const base = getForumAdConf(); // current cached config
    const baseLinks = Array.isArray(base.LINKS) ? base.LINKS : [];

    // If ENV links are empty, use only the DB-sourced set.
    // If ENV links exist, merge ENV links with DB links without dedupe.
    const mergedLinks = baseLinks.length
      ? [...baseLinks, ...extraParsed.links]
      : extraParsed.links;

    // MEDIA_BY_CLICK stores clickUrl -> media array.
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

    // Keep all ad-link entries; do not dedupe repeated campaign links.
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
 * Р В РЎСџР РЋР вЂљР В РЎвЂР В РЎвЂўР РЋР вЂљР В РЎвЂР РЋРІР‚С™Р В Р’ВµР РЋРІР‚С™:
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

  // Normalize query params in a stable order before hashing.
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
 * LINKS accepts CSV, semicolon, newline, or whitespace-separated entries.
 *
 * Supported forms:
 *   https://site.com
 *   https://click.url|https://media.url
 *
 * Format:
 *   https://site.com
 *   https://click.url|https://media.url
 * Keep duplicates; each entry stays in the rotation pool.
 * MEDIA_BY_CLICK stores clickUrl -> media array.
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

    // Keep a deterministic list of click URLs in insertion order.
    links.push(clickNorm);

    // Seed the media list for this click URL with its primary resolved media.
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
  // In the browser, try to merge extra campaigns from Redis into the cached client config.
  if (isBrowser()) {
    // Fire-and-forget; cachedClientConf is updated in place when the merge completes.
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
    this.history = []; // recent global picks
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
    if (bucket.has(url)) return false; // avoid duplicate URL inside the same pick frame
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
      // avoid repeating the same global URL when alternatives exist
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
 * Deterministic ad URL picker.
 * - Rotates on ROTATE_MIN buckets
 * - Seeded by campaign, client, slot, and time bucket
 * - Avoids duplicate picks in the same frame
 * - Avoids repeating the same global URL when alternatives exist
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

    // Avoid repeating the same URL for the same seeded slot when alternatives exist.
    if (lastForSeed && thisUrl === lastForSeed && perm.length > 1) continue;

    // Also avoid immediately repeating the most recent globally shown URL.
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
let pageActivityCleanup = null;
let pageActivityBound = false;
let pageActivityValue = true;
const pageActivitySubscribers = new Set();
let ytIframeApiPromise = null;

function readPageActivityValue() {
  if (!isBrowser()) return true;
  try {
    return document.visibilityState === 'visible' && document.hasFocus();
  } catch {
    return true;
  }
}

function notifyPageActivity(next) {
  pageActivityValue = !!next;
  pageActivitySubscribers.forEach((fn) => {
    try {
      fn(pageActivityValue);
    } catch {}
  });
}

function bindPageActivity() {
  if (!isBrowser() || pageActivityBound) return;
  const sync = () => {
    const next = readPageActivityValue();
    if (next === pageActivityValue) return;
    notifyPageActivity(next);
  };
  pageActivityBound = true;
  pageActivityValue = readPageActivityValue();
  try { document.addEventListener('visibilitychange', sync, { passive: true }); } catch {}
  try { window.addEventListener('focus', sync, { passive: true }); } catch {}
  try { window.addEventListener('blur', sync, { passive: true }); } catch {}
  pageActivityCleanup = () => {
    try { document.removeEventListener('visibilitychange', sync); } catch {}
    try { window.removeEventListener('focus', sync); } catch {}
    try { window.removeEventListener('blur', sync); } catch {}
    pageActivityBound = false;
    pageActivityCleanup = null;
  };
}

function subscribePageActivity(fn) {
  if (!isBrowser() || typeof fn !== 'function') return () => {};
  bindPageActivity();
  pageActivitySubscribers.add(fn);
  try { fn(pageActivityValue); } catch {}
  return () => {
    pageActivitySubscribers.delete(fn);
    if (!pageActivitySubscribers.size && typeof pageActivityCleanup === 'function') {
      pageActivityCleanup();
    }
  };
}

function usePageActiveState() {
  const [active, setActive] = useState(() => readPageActivityValue());

  useEffect(() => subscribePageActivity(setActive), []);

  return active;
}

function ensureYouTubeIframeApi() {
  if (!isBrowser()) return Promise.resolve(null);
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytIframeApiPromise) return ytIframeApiPromise;

  ytIframeApiPromise = new Promise((resolve) => {
    const done = () => resolve(window.YT || null);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReadyPatched() {
      try {
        if (typeof prev === 'function') prev();
      } catch {}
      done();
    };

    const existing = document.getElementById('yt-iframe-api');
    if (!existing) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => {
        ytIframeApiPromise = null;
        resolve(null);
      };
      document.head.appendChild(tag);
      return;
    }

    const checkReady = () => {
      if (window.YT?.Player) {
        done();
        return;
      }
      window.setTimeout(checkReady, 100);
    };
    checkReady();
  });

  return ytIframeApiPromise;
}

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

  // Fire analytics through the shared /api/ads endpoint.
  if (type === 'ad_impression' || type === 'ad_click') {
    try {
      const body = {
        action: 'event', // shared ads analytics endpoint
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
  if (adImageProbeCache.has(src)) {
    return Promise.resolve(!!adImageProbeCache.get(src));
  }
  return new Promise((resolve) => {
    if (!src || !isBrowser() || !('Image' in window)) {
      resolve(false);
      return;
    }
    const img = new window.Image();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.src = src;
  }).then((ok) => {
    try { setBoundedMap(adImageProbeCache, src, !!ok, 320); } catch {}
    return !!ok;
  });
}

function canProbeMediaKind(raw) {
  if (!raw || !isBrowser()) return false;
  const s = String(raw).trim();
  if (!s || /^blob:/i.test(s) || /^data:/i.test(s)) return false;
  if (/\.(webm|mp4|mov|m4v|mkv|jpe?g|png|webp|gif|avif|svg)(?:$|[?#])/i.test(s)) return true;
  if (/[?&](?:filename|file|src|url)=.*\.(webm|mp4|mov|m4v|mkv|jpe?g|png|webp|gif|avif|svg)(?:$|[&#])/i.test(s)) return true;
  try {
    const u = new URL(s, window.location.href);
    if (u.origin === window.location.origin) return true;
    if (/vercel-storage|public\.blob\.vercel-storage|storage\.googleapis|cloudfront|cloudinary|imgix|cdn/i.test(String(u.hostname || ''))) {
      return true;
    }
  } catch {}
  return false;
}

// Detect media type via Content-Type from a HEAD request.
async function detectMediaKind(url, timeoutMs = 3000) {
  if (!url || !isBrowser() || typeof fetch === 'undefined') return null;
  if (adMediaKindCache.has(url)) return adMediaKindCache.get(url);
  if (adMediaKindPending.has(url)) {
    try {
      return await adMediaKindPending.get(url);
    } catch {
      return null;
    }
  }
  if (!canProbeMediaKind(url)) {
    setBoundedMap(adMediaKindCache, url, null, 320);
    return null;
  }

  const probe = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      }).catch(() => null);

      if (!resp) return null;

      const ct = (resp.headers.get('content-type') || '').toLowerCase();

      if (ct.startsWith('video/')) {
        setBoundedMap(adMediaKindCache, url, 'video', 320);
        return 'video';
      }
      if (ct.startsWith('image/')) {
        setBoundedMap(adMediaKindCache, url, 'image', 320);
        return 'image';
      }

      setBoundedMap(adMediaKindCache, url, null, 320);
      return null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      adMediaKindPending.delete(url);
    }
  })();

  adMediaKindPending.set(url, probe);
  return probe;
}

function isLikelyVideoUrl(raw) {
  if (!raw) return false;
  const s = String(raw).trim();
  if (!s) return false;

  if (/^blob:/i.test(s)) return true;

  // Р В Р вЂ¦Р В РЎвЂўР РЋР вЂљР В РЎВР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р В Р вЂ Р В РЎвЂР В РўвЂР В Р’ВµР В РЎвЂў Р В РЎвЂ”Р В РЎвЂў Р РЋР вЂљР В Р’В°Р РЋР С“Р РЋРІвЂљВ¬Р В РЎвЂР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР вЂ№
  if (/\.(webm|mp4|mov|m4v|mkv)(?:$|[?#])/i.test(s)) return true;

  // filename=...mp4 Р В Р вЂ  query
  if (/[?&]filename=.*\.(webm|mp4|mov|m4v|mkv)(?:$|[?#])/i.test(s)) return true;

  // Р РЋРІР‚С™Р В РЎвЂўР В Р’В»Р РЋР Р‰Р В РЎвЂќР В РЎвЂў Р РЋР РЏР В Р вЂ Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ video-Р РЋР РЉР В Р вЂ¦Р В РўвЂР В РЎвЂ”Р В РЎвЂўР В РЎвЂР В Р вЂ¦Р РЋРІР‚С™Р РЋРІР‚в„–
  if (
    /vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo/i.test(
      s
    )
  ) {
    return true;
  }

  return false;
}

function isLikelyImageUrl(raw) {
  if (!raw) return false;
  const s = String(raw).trim();
  if (!s) return false;
  if (/\.(jpe?g|png|webp|gif|avif|svg)(?:$|[?#])/i.test(s)) return true;
  if (/[?&](?:filename|file|src|url)=.*\.(jpe?g|png|webp|gif|avif|svg)(?:$|[&#])/i.test(s)) return true;
  return false;
}

const YT_RE =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;

const TIKTOK_RE =
  /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/(?:@[\w.\-]+\/video\/(\d+)|t\/[A-Za-z0-9]+)(?:[?#].*)?$/i;

/* ====== Shared resolve caches for anti-reroll media lookup ====== */

const lastMediaIndexByKey = new Map();
const adMediaKindCache = new Map();
const adMediaKindPending = new Map();
const adMediaResolveCache = new Map();
const adMediaResolvePending = new Map();
const adImageProbeCache = new Map();
const pruneBoundedMap = (map, cap = 240) => {
  try {
    while (map.size > cap) {
      const oldest = map.keys().next()?.value;
      if (typeof oldest === 'undefined') break;
      map.delete(oldest);
    }
  } catch {}
};
const setBoundedMap = (map, key, value, cap = 240) => {
  try {
    if (map.has(key)) map.delete(key);
    map.set(key, value);
    pruneBoundedMap(map, cap);
  } catch {}
  return value;
};

/* ======================= AdCard ======================= */
/**
 * OG video/screenshot/image -> direct file -> YouTube/TikTok -> screenshot CDNs -> favicon -> placeholder
 * Ad label text is taken from forum_ad_label.
 * Keep the card stable even when no external preview is available.
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
  const mediaKind = media.kind;
  const mediaSrc = media.src;

  // Unique instance id so global mute sync ignores self-emitted events.
  const playerIdRef = useRef(
    `ad_${Math.random().toString(36).slice(2)}_${Date.now()}`
  );

  // init muted from global pref (forum scheme)
  useEffect(() => {
    const pref = readMutedPrefFromStorage();
    const want = desiredMutedFromPref(pref);
    setMuted(want);
  }, []);
  // Р РЋРІР‚С™Р В Р’ВµР В РЎвЂќР РЋРЎвЂњР РЋРІР‚В°Р В РЎвЂР В РІвЂћвЂ“ Р В Р вЂ Р РЋРІР‚в„–Р В Р’В±Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В Р вЂ¦Р РЋРІР‚в„–Р В РІвЂћвЂ“ mediaHref (Р В РЎвЂќР В РЎвЂўР В Р вЂ¦Р В РЎвЂќР РЋР вЂљР В Р’ВµР РЋРІР‚С™Р В Р вЂ¦Р РЋРІР‚в„–Р В РІвЂћвЂ“ youtube / Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В Р вЂ¦Р В РЎвЂќР В Р’В° Р В РЎвЂ Р РЋРІР‚С™.Р В РЎвЂ”.)
  const [mediaHref, setMediaHref] = useState(null);

  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const ytIframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const coarseUi = useMemo(() => {
    try {
      const ua = String(navigator?.userAgent || '');
      return /iP(hone|ad|od)|Android/i.test(ua) || !!window?.matchMedia?.('(pointer: coarse)')?.matches;
    } catch {
      return false;
    }
  }, []);
  const isAttachedYtPlayer = useCallback((player = ytPlayerRef.current) => {
    try {
      const iframe = player?.getIframe?.() || ytIframeRef.current;
      return !!(iframe && iframe.isConnected);
    } catch {
      return !!ytIframeRef.current?.isConnected;
    }
  }, []);
  // ===== Focus / attention gating =====
  // isNear: Р В Р’В±Р В Р’В»Р В РЎвЂўР В РЎвЂќ Р РЋР вЂљР РЋР РЏР В РўвЂР В РЎвЂўР В РЎВ (Р В РЎВР В РЎвЂўР В Р’В¶Р В Р вЂ¦Р В РЎвЂў Р В РЎвЂ”Р В РЎвЂўР В РўвЂР В РЎвЂ“Р РЋР вЂљР РЋРЎвЂњР В Р’В¶Р В Р’В°Р РЋРІР‚С™Р РЋР Р‰, Р В Р вЂ¦Р В РЎвЂў Р В Р вЂ¦Р В Р’Вµ Р В РЎвЂР В РЎвЂ“Р РЋР вЂљР В Р’В°Р РЋРІР‚С™Р РЋР Р‰)
  // isFocused: Р В Р’В±Р В Р’В»Р В РЎвЂўР В РЎвЂќ Р РЋР вЂљР В Р’ВµР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂў Р В Р вЂ  Р В Р’В·Р В РЎвЂўР В Р вЂ¦Р В Р’Вµ Р В Р вЂ Р В Р вЂ¦Р В РЎвЂР В РЎВР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋР РЏ (Р В РЎвЂР В РЎвЂ“Р РЋР вЂљР В Р’В°Р В Р’ВµР В РЎВ)
  // isPageActive: Р В Р вЂ Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂќР В Р’В°/Р В РЎвЂўР В РЎвЂќР В Р вЂ¦Р В РЎвЂў Р В Р’В°Р В РЎвЂќР РЋРІР‚С™Р В РЎвЂР В Р вЂ Р В Р вЂ¦Р В РЎвЂў (Р В РЎвЂР В Р вЂ¦Р В Р’В°Р РЋРІР‚РЋР В Р’Вµ Р В Р вЂ Р РЋР С“Р В Р’ВµР В РЎвЂ“Р В РўвЂР В Р’В° Р В РЎвЂ”Р В Р’В°Р РЋРЎвЂњР В Р’В·Р В Р’В°)
  const [isNear, setIsNear] = useState(false);
  const [isPrepareNear, setIsPrepareNear] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPageActive = usePageActiveState();
  const [mediaResident, setMediaResident] = useState(false);

  const shouldPlay = isFocused && isPageActive;
  const shouldResolveMedia = isPrepareNear || isNear || shouldPlay;
  const shouldPlayRef = useRef(false);
  const mutedRef = useRef(muted);
  const mediaHrefRef = useRef(null);
  const slotCssVars = {
    '--ad-slot-h-m': `${AD_SLOT_HEIGHT_PX.mobile}px`,
    '--ad-slot-h-t': `${AD_SLOT_HEIGHT_PX.tablet}px`,
    '--ad-slot-h-d': `${AD_SLOT_HEIGHT_PX.desktop}px`,
  };

  useEffect(() => {
    shouldPlayRef.current = shouldPlay;
  }, [shouldPlay]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    mediaHrefRef.current = mediaHref;
  }, [mediaHref]);

  useEffect(() => {
    let timer = null;
    if (isNear || shouldPlay) {
      setMediaResident(true);
      return undefined;
    }
    const holdMs =
      mediaKind === 'youtube' || mediaKind === 'tiktok'
        ? 650
        : mediaKind === 'video'
          ? 1800
          : 1200;
    timer = setTimeout(() => {
      setMediaResident(false);
    }, holdMs);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isNear, shouldPlay, mediaKind]);

  // Intersection: near + focused
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !isBrowser() || typeof IntersectionObserver === 'undefined')
      return;

    const prepareMargin = coarseUi ? '980px 0px' : '720px 0px';
    const nearMargin = coarseUi ? '560px 0px' : '360px 0px';

    const prepareObs = new IntersectionObserver(
      ([e]) => setIsPrepareNear(!!e?.isIntersecting),
      { rootMargin: prepareMargin, threshold: 0 }
    );

    // near: Р В Р’В·Р В Р’В°Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В Р’ВµР В Р’Вµ Р вЂ™Р’В«Р В РЎвЂ”Р В РЎвЂўР В РўвЂР В РЎвЂўР В РІвЂћвЂ“Р РЋРІР‚С™Р В РЎвЂР вЂ™Р’В» Р В РЎвЂќ Р В Р’В±Р В Р’В»Р В РЎвЂўР В РЎвЂќР РЋРЎвЂњ (Р В Р’В±Р В Р’ВµР В Р’В· Р В РЎвЂР В РЎвЂ“Р РЋР вЂљР РЋРІР‚в„–)
    const nearObs = new IntersectionObserver(
      ([e]) => setIsNear(!!e?.isIntersecting),
      { rootMargin: nearMargin, threshold: 0 }
    );

    // focused: Р РЋР вЂљР В Р’ВµР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂў Р В Р вЂ Р В РЎвЂР В РўвЂР В Р вЂ¦Р В РЎвЂў (>= 60% Р В РЎвЂ”Р В Р’В»Р В РЎвЂўР РЋРІР‚В°Р В Р’В°Р В РўвЂР В РЎвЂ)
    const focusObs = new IntersectionObserver(
      ([e]) => setIsFocused((e?.intersectionRatio || 0) >= 0.6),
      { threshold: [0, 0.25, 0.6, 0.75, 1] }
    );

    prepareObs.observe(el);
    nearObs.observe(el);
    focusObs.observe(el);

    return () => {
      prepareObs.disconnect();
      nearObs.disconnect();
      focusObs.disconnect();
    };
  }, [coarseUi]);

  // ===== Global mute sync from forum =====
  useEffect(() => {
    if (!isBrowser()) return;

    const onMuted = (e) => {
      const d = e?.detail || {};
      if (d?.id && d.id === playerIdRef.current) return; // ignore self
      if (typeof d?.muted !== 'boolean') return;

      const next = !!d.muted;
      setMuted(next);

      // HTML5
      if (videoRef.current) {
        try {
          videoRef.current.muted = next;
        } catch {}
      }

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

  // Р В РЎвЂќР В Р’В»Р РЋР вЂ№Р РЋРІР‚РЋ Р В РўвЂР В Р’В»Р РЋР РЏ Р РЋР С“Р В Р’В»Р В РЎвЂўР РЋРІР‚С™Р В Р’В°, Р РЋРІР‚РЋР РЋРІР‚С™Р В РЎвЂўР В Р’В±Р РЋРІР‚в„– Р В Р вЂ¦Р В Р’Вµ Р В РЎвЂ”Р В РЎвЂўР В Р вЂ Р РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР РЋР РЏР РЋРІР‚С™Р РЋР Р‰ Р В РЎвЂўР В РўвЂР В Р вЂ¦Р РЋРЎвЂњ Р В РЎвЂ Р РЋРІР‚С™Р РЋРЎвЂњ Р В Р’В¶Р В Р’Вµ Р В РЎВР В Р’ВµР В РўвЂР В РЎвЂР РЋРЎвЂњ Р В РЎвЂ”Р В РЎвЂўР В РўвЂР РЋР вЂљР РЋР РЏР В РўвЂ
  const mediaKey = useMemo(
    () => `${url}::${slotKind || ''}::${nearId || ''}`,
    [url, slotKind, nearId]
  );

  const mediaChoices = useMemo(() => {
    if (!safeClick) return [];

    const clickHref = safeClick.toString();
    const entry = conf.MEDIA_BY_CLICK?.[clickHref] ?? null;
    if (Array.isArray(entry) && entry.length) return entry.filter(Boolean);
    if (typeof entry === 'string' && entry.trim()) return [entry.trim()];
    return [clickHref];
  }, [safeClick, conf]);

  const pickNextMediaHref = useCallback(() => {
    if (!mediaChoices.length) {
      setMediaHref(null);
      return null;
    }

    let idx = lastMediaIndexByKey.has(mediaKey)
      ? Number(lastMediaIndexByKey.get(mediaKey) || 0)
      : -1;

    if (mediaChoices.length === 1) {
      idx = 0;
    } else {
      let tries = 0;
      let next = idx;
      while (tries < 5 && next === idx) {
        next = Math.floor(Math.random() * mediaChoices.length);
        tries += 1;
      }
      if (next < 0) next = 0;
      idx = next;
    }

    setBoundedMap(lastMediaIndexByKey, mediaKey, idx, 240);
    const nextHref = mediaChoices[idx] || null;
    setMediaHref(nextHref);
    return nextHref;
  }, [mediaChoices, mediaKey]);

  useEffect(() => {
    if (!safeClick || !mediaChoices.length) {
      setMediaHref(null);
      return;
    }

    const currentHref = mediaHrefRef.current;
    if (currentHref && mediaChoices.includes(currentHref)) {
      const currentIdx = mediaChoices.indexOf(currentHref);
      if (currentIdx >= 0) {
        setBoundedMap(lastMediaIndexByKey, mediaKey, currentIdx, 240);
        return;
      }
    }

    pickNextMediaHref();
  }, [safeClick, mediaChoices, mediaKey, pickNextMediaHref]);

  useEffect(() => {
    if (!safeClick || mediaChoices.length <= 1) return undefined;
    if (!(isNear || shouldPlay || mediaResident) || !isPageActive) return undefined;

    const rotateMs = Math.max(
      10_000,
      Number(conf.ROTATE_MIN || 1) * 60_000
    );

    let timer = null;
    const schedule = () => {
      timer = setTimeout(() => {
        pickNextMediaHref();
        schedule();
      }, rotateMs);
    };
    schedule();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    safeClick,
    mediaChoices,
    mediaResident,
    isNear,
    shouldPlay,
    isPageActive,
    conf,
    pickNextMediaHref,
  ]);

  // 2) Р В РЎв„ўР В Р’В°Р РЋР С“Р В РЎвЂќР В Р’В°Р В РўвЂ Р В РЎвЂўР В РЎвЂ”Р РЋР вЂљР В Р’ВµР В РўвЂР В Р’ВµР В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ Р РЋРІР‚С™Р В РЎвЂР В РЎвЂ”Р В Р’В° Р В РЎВР В Р’ВµР В РўвЂР В РЎвЂР В Р’В° Р В РўвЂР В Р’В»Р РЋР РЏ Р РЋРІР‚С™Р В Р’ВµР В РЎвЂќР РЋРЎвЂњР РЋРІР‚В°Р В Р’ВµР В РЎвЂ“Р В РЎвЂў mediaHref
  useEffect(() => {
    if (!safeClick || !mediaHref) {
      setMedia({ kind: 'skeleton', src: null });
      return;
    }
    const cacheKey = `${mediaHref}::${slotKind || ''}`;
    const cachedResolved = adMediaResolveCache.get(cacheKey);
    if (cachedResolved) {
      setMedia(cachedResolved);
    }
    if (!shouldResolveMedia) {
      return;
    }
    let cancelled = false;

    const clickHref = safeClick.toString();
    const landingHost = safeClick.hostname;

    const thumbs =
      conf.THUMBS && conf.THUMBS.length
        ? conf.THUMBS
        : DEFAULT_THUMB_SERVICES;

    const isDirectImg = isLikelyImageUrl(mediaHref);

    const setResolved = (next) => {
      if (!next) return next;
      try { setBoundedMap(adMediaResolveCache, cacheKey, next, 320); } catch {}
      if (!cancelled) setMedia(next);
      return next;
    };

        async function run() {
      if (cachedResolved) return;
      if (adMediaResolvePending.has(cacheKey)) {
        try {
          const resolved = await adMediaResolvePending.get(cacheKey);
          if (!cancelled && resolved) setMedia(resolved);
        } catch {}
        return;
      }
      // 0) direct video by URL heuristics
      if (!cancelled && isLikelyVideoUrl(mediaHref)) {
        setResolved({ kind: 'video', src: mediaHref, step: 'env_video' });
        emitAdEvent(
          'ad_fallback',
          { url: clickHref, cascade_step: 'env_video', slot_kind: slotKind },
          conf
        );
        return;
      }

      // 1) direct image by URL heuristics
      if (!cancelled && isDirectImg) {
        setResolved({ kind: 'image', src: mediaHref, step: 'env_image' });
        emitAdEvent(
          'ad_fallback',
          { url: clickHref, cascade_step: 'env_image', slot_kind: slotKind },
          conf
        );
        return;
      }

      // 2) YouTube
      const ytMatch = mediaHref.match(YT_RE);
      if (!cancelled && ytMatch) {
        const videoId = ytMatch[1];
        if (videoId) {
          setResolved({ kind: 'youtube', src: videoId, step: 'env_youtube' });
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
          setResolved({ kind: 'tiktok', src: videoId, step: 'env_tiktok' });
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

      // 4) HEAD probe only for likely direct-media URLs to avoid CORS noise on landing pages
      if (!cancelled) {
        const detected = await detectMediaKind(mediaHref).catch(() => null);
        if (cancelled) return;

        if (detected === 'video') {
          setResolved({ kind: 'video', src: mediaHref, step: 'head_video' });
          emitAdEvent(
            'ad_fallback',
            { url: clickHref, cascade_step: 'head_video', slot_kind: slotKind },
            conf
          );
          return;
        }

        if (detected === 'image') {
          setResolved({ kind: 'image', src: mediaHref, step: 'head_image' });
          emitAdEvent(
            'ad_fallback',
            { url: clickHref, cascade_step: 'head_image', slot_kind: slotKind },
            conf
          );
          return;
        }
      }

      // 5) Microlink (OG screenshot / image)
      if (!cancelled && conf.PREVIEW !== 'favicon') {
        try {
          const q =
            'https://api.microlink.io/?url=' +
            encodeURIComponent(mediaHref) +
            '&screenshot=true&meta=true&video=false&audio=false&iframe=false' +
            '&waitFor=2000';

          const resp = await fetch(q).catch(() => null);
          const data = await resp?.json().catch(() => null);
          const meta = data?.data || {};

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
                setResolved({ kind: 'image', src: cu.toString(), step: c.step });
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

      // 5) Р В РЎвЂ”Р РЋР вЂљР РЋР РЏР В РЎВР В РЎвЂўР В РІвЂћвЂ“ Р РЋРІР‚С›Р В Р’В°Р В РІвЂћвЂ“Р В Р’В»-Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В Р вЂ¦Р В РЎвЂќР В Р’В°
      if (!cancelled && conf.PREVIEW !== 'favicon' && isDirectImg) {
        const ok = await tryLoadImage(mediaHref);
        if (ok && !cancelled) {
          setResolved({ kind: 'image', src: mediaHref, step: 'direct_image' });
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
              setResolved({ kind: 'image', src: uShot.toString(), step: 'shot' });
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
            setResolved({ kind: 'favicon', src: ico, step: 'favicon' });
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
        setResolved({ kind: 'placeholder', src: null, step: 'placeholder' });
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

    const pendingRun = run().finally(() => {
      try { adMediaResolvePending.delete(cacheKey); } catch {}
    });
    try { adMediaResolvePending.set(cacheKey, pendingRun); } catch {}
    return () => {
      cancelled = true;
    };
  }, [safeClick, conf, slotKind, nearId, mediaHref, shouldResolveMedia]);

  const shouldMountYouTube = mediaKind === 'youtube' && !!mediaSrc && shouldPlay;
  const shouldMountTikTok = mediaKind === 'tiktok' && !!mediaSrc && shouldPlay;
  const youtubeThumbSrc =
    mediaKind === 'youtube' && mediaSrc
      ? `https://i.ytimg.com/vi/${mediaSrc}/hqdefault.jpg`
      : null;


  // YouTube Iframe API Р Т‘Р В»РЎРЏ РЎС“Р С—РЎР‚Р В°Р Р†Р В»Р ВµР Р…Р С‘РЎРЏ Р В·Р Р†РЎС“Р С”Р С•Р С
  useEffect(() => {
    if (!isBrowser()) return;
    if (!shouldMountYouTube) {
      try { ytPlayerRef.current?.destroy?.(); } catch {}
      ytPlayerRef.current = null;
      return;
    }

    let cancelled = false;
    if (ytPlayerRef.current && isAttachedYtPlayer(ytPlayerRef.current)) {
      try {
        if (mutedRef.current) ytPlayerRef.current.mute?.();
        else ytPlayerRef.current.unMute?.();
        if (shouldPlayRef.current) ytPlayerRef.current.playVideo?.();
        else ytPlayerRef.current.pauseVideo?.();
      } catch {}
      return;
    }

    function createPlayer() {
      if (cancelled) return;
      if (!window.YT || !window.YT.Player || !ytIframeRef.current) return;

      try {
        const player = new window.YT.Player(ytIframeRef.current, {
          videoId: mediaSrc,
          playerVars: {
            autoplay: 0,
            controls: 0,
            mute: mutedRef.current ? 1 : 0,
            rel: 0,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            loop: 1,
            playlist: mediaSrc,
          },
          events: {
            onReady: (ev) => {
              if (cancelled || !isAttachedYtPlayer(ev?.target)) {
                try { ev?.target?.destroy?.(); } catch {}
                return;
              }
              ytPlayerRef.current = ev.target;
              try {
                if (mutedRef.current) ev.target.mute?.();
                else ev.target.unMute?.();
                if (shouldPlayRef.current) ev.target.playVideo?.();
                else ev.target.pauseVideo?.();
              } catch {}
            },
          },
        });

        ytPlayerRef.current = player;
      } catch {}
    }

    ensureYouTubeIframeApi().then(() => {
      if (cancelled) return;
      createPlayer();
    }).catch(() => {});

    return () => {
      cancelled = true;
      try { ytPlayerRef.current?.destroy?.(); } catch {}
      ytPlayerRef.current = null;
    };
  }, [shouldMountYouTube, mediaSrc, isAttachedYtPlayer]);

  useEffect(() => {
    const el = videoRef.current;
    if (!(el instanceof HTMLVideoElement)) return undefined;

    return () => {
      try { el.pause?.(); } catch {}
      try { el.removeAttribute('src'); } catch {}
      try { el.load?.(); } catch {}
    };
  }, [mediaKind, mediaSrc]);

  // ===== Hard stop / resume playback depending on attention =====
  useEffect(() => {
    // HTML5 video
    if (mediaKind === 'video' && videoRef.current) {
      const v = videoRef.current;
      if (shouldPlay) {
        // Keep the HTML video muted state aligned before play.
        try {
          v.muted = !!muted;
        } catch {}

        v.play?.().catch(() => {
          // If autoplay with sound is blocked, retry muted without changing the global pref.
          if (!muted) {
            setMuted(true);
            try { v.muted = true; } catch {}
          }
        });
      } else {
        v.pause?.();
      }
    }

    // YouTube player (Iframe API)
    if (shouldMountYouTube && ytPlayerRef.current && isAttachedYtPlayer(ytPlayerRef.current)) {
      const p = ytPlayerRef.current;
      try {
        if (shouldPlay) {
          if (muted) p.mute?.();
          p.playVideo?.();
        } else {
          p.pauseVideo?.();
        }
      } catch {}
    }
  }, [shouldPlay, mediaKind, muted, isAttachedYtPlayer, shouldMountYouTube]);

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
      try { observer.disconnect(); } catch {}
    };
  }, [safeClick, slotKind, nearId, conf]);

  if (!safeClick) return null;

  const clickHref = safeClick.toString();
  const host = safeClick.hostname.replace(/^www\./i, '');
  const label =
    typeof t === 'function'
      ? t('forum_ad_label', 'Advertisement')
      : 'Advertisement';

  // Open the /ads page directly without following the outbound ad link.
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

    // 1) Р РЋР С“Р В РЎвЂўР РЋРІР‚В¦Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚С™Р РЋР Р‰ Р В РЎвЂ“Р В Р’В»Р В РЎвЂўР В Р’В±Р В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂў + Р В РЎвЂўР В РЎвЂ”Р В РЎвЂўР В Р вЂ Р В Р’ВµР РЋР С“Р РЋРІР‚С™Р В РЎвЂР РЋРІР‚С™Р РЋР Р‰ Р В Р вЂ Р РЋР С“Р В Р’ВµР РЋРІР‚В¦
    writeMutedPrefToStorage(next);
    emitMutedPref(next, playerIdRef.current, 'forum-ads-toggle');

    // 2) Р В Р’В»Р В РЎвЂўР В РЎвЂќР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂў
    setMuted(next);

    // HTML5
    if (media.kind === 'video' && videoRef.current) {
      const v = videoRef.current;
      try {
        v.muted = next;
      } catch {}
      if (v.paused && !next && shouldPlayRef.current) v.play?.().catch(() => {});
      return;
    }

    // YouTube
    if (shouldMountYouTube && ytPlayerRef.current && isAttachedYtPlayer(ytPlayerRef.current)) {
      const p = ytPlayerRef.current;
      try { 
        if (next) p.mute?.();
        else {
          p.unMute?.();
          if (shouldPlayRef.current) p.playVideo?.();
        }
      } catch {} 
    } 
  };

  const showSoundButton =
    shouldPlay && (media.kind === 'video' || (media.kind === 'youtube' && shouldMountYouTube));

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
    position: relative;         /* Р В РЎвЂќР В Р’В»Р РЋР вЂ№Р РЋРІР‚РЋ: Р РЋР РЏР В РЎвЂќР В РЎвЂўР РЋР вЂљР РЋР Р‰ Р В РўвЂР В Р’В»Р РЋР РЏ absolute Р В РЎВР В Р’ВµР В РўвЂР В РЎвЂР В Р’В° */
    overflow: hidden;
    border-radius: 0.5rem;
    background: var(--bg-soft, #020817);
  }
  /* ===== FIXED (Р В РЎвЂќР В Р’В°Р В РЎвЂќ Р В Р вЂ  Р РЋРІР‚С›Р В РЎвЂўР РЋР вЂљР РЋРЎвЂњР В РЎВР В Р’Вµ Р РЋР С“Р В Р’ВµР В РІвЂћвЂ“Р РЋРІР‚РЋР В Р’В°Р РЋР С“) ===== */
  .forum-ad-media-slot[data-layout="fixed"] {
    height: var(--ad-slot-h-m);
  }
  @media (min-width: 640px) {
.forum-ad-media-slot[data-layout="fixed"] {
      height: var(--ad-slot-h-t);
    }
  }

  @media (min-width: 1024px) {
    .forum-ad-media-slot {
      height: var(--ad-slot-h-d);
    }
  }

  /* ===== FLUID (Р В РўвЂР В Р’В»Р РЋР РЏ Р РЋР вЂљР В Р’ВµР В Р вЂ¦Р В РўвЂР В Р’ВµР РЋР вЂљР В Р’В° Р В РЎвЂ”Р В РЎвЂў Р В Р вЂ Р РЋР С“Р В Р’ВµР В РЎВР РЋРЎвЂњ Р РЋР С“Р В Р’В°Р В РІвЂћвЂ“Р РЋРІР‚С™Р РЋРЎвЂњ) ===== */
  .forum-ad-media-slot[data-layout="fluid"] {
    height: auto;
    overflow: visible;
  }

  /* fixed: Р РЋР С“Р В Р’В»Р В РЎвЂўР В РІвЂћвЂ“ Р В РЎВР В Р’ВµР В РўвЂР В РЎвЂР В Р’В° Р РЋР вЂљР В Р’В°Р РЋР С“Р РЋРІР‚С™Р РЋР РЏР В РЎвЂ“Р В РЎвЂР В Р вЂ Р В Р’В°Р В Р’ВµР В РЎВ Р В Р вЂ¦Р В Р’В° Р В Р вЂ Р В Р’ВµР РЋР С“Р РЋР Р‰ Р РЋР С“Р В Р’В»Р В РЎвЂўР РЋРІР‚С™ */
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

  /* fluid: Р РЋР С“Р В Р’В»Р В РЎвЂўР В РІвЂћвЂ“ Р В РЎВР В Р’ВµР В РўвЂР В РЎвЂР В Р’В° Р В Р вЂ¦Р В Р’Вµ absolute Р Р†Р вЂљРІР‚Сњ Р В РЎвЂР В Р вЂ¦Р В Р’В°Р РЋРІР‚РЋР В Р’Вµ Р В Р вЂ Р РЋРІР‚в„–Р РЋР С“Р В РЎвЂўР РЋРІР‚С™Р В Р’В° Р В Р вЂ¦Р В Р’Вµ Р РЋР С“Р РЋРІР‚РЋР В РЎвЂР РЋРІР‚С™Р В Р’В°Р В Р’ВµР РЋРІР‚С™Р РЋР С“Р РЋР РЏ */
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
        aria-label={`${label} Р Р†Р вЂљРЎС› ${host}`}
        className="block no-underline focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
      >
        <div className="flex flex-col gap-1 h-full">
          {/* header: Р РЋРІР‚С™Р В РЎвЂўР В Р’В»Р РЋР Р‰Р В РЎвЂќР В РЎвЂў Р В Р’В±Р В Р’ВµР В РІвЂћвЂ“Р В РўвЂР В Р’В¶ + Р В РўвЂР В РЎвЂўР В РЎВР В Р’ВµР В Р вЂ¦, Р В Р’В±Р В Р’ВµР В Р’В· url-Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В РЎвЂќР В РЎвЂ */}
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
                {/* Р В РўвЂР В РЎвЂўР В РЎВР В Р’ВµР В Р вЂ¦ Р В РЎВР В РЎвЂўР В Р’В¶Р В Р вЂ¦Р В РЎвЂў Р В Р вЂ Р В Р’ВµР РЋР вЂљР В Р вЂ¦Р РЋРЎвЂњР РЋРІР‚С™Р РЋР Р‰ Р РЋР С“Р РЋР вЂ№Р В РўвЂР В Р’В°, Р В Р’ВµР РЋР С“Р В Р’В»Р В РЎвЂ Р В Р’В·Р В Р’В°Р РЋРІР‚В¦Р В РЎвЂўР РЋРІР‚РЋР В Р’ВµР РЋРІвЂљВ¬Р РЋР Р‰ */}
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
                ? t('forum_ad_place', 'Place Ad')
                : 'Place Ad'}
            </button>
          </div>

          {/* media: Р В Р’В·Р В Р’В°Р В РЎвЂ”Р В РЎвЂўР В Р’В»Р В Р вЂ¦Р РЋР РЏР В Р’ВµР РЋРІР‚С™ Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂўР РЋРІР‚РЋР В РЎвЂќР РЋРЎвЂњ */}
<div
  className="relative mt-0.5 border border-[color:var(--border,#27272a)] forum-ad-media-slot"
data-layout={isFluid ? 'fluid' : 'fixed'}
>
          
 {media.kind === 'skeleton' && (
              <div className="animate-pulse w-full h-full bg-[color:var(--skeleton,#111827)]" />
            )}

{media.kind === 'video' && media.src && mediaResident && (
  <div className="forum-ad-media-fill">
    <video
      ref={videoRef}
      src={media.src}
      className="forum-ad-fit"
      muted={muted}
      defaultMuted={muted}
      loop
      playsInline
      preload={shouldPlay ? 'metadata' : 'none'}
      controls={false}
      disablePictureInPicture
    />
  </div>
)}

            {media.kind === 'video' && media.src && !mediaResident && (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-[color:var(--muted-fore,#9ca3af)]">
                {host}
              </div>
            )}

            {media.kind === 'youtube' && media.src && shouldMountYouTube && (
<div
  className="relative overflow-hidden rounded-lg"
  style={isFluid ? { width: '100%', aspectRatio: '16 / 9' } : { width: '100%', height: '100%' }}
>
  <iframe
    ref={ytIframeRef}
    src={`https://www.youtube.com/embed/${media.src}?enablejsapi=1&controls=0&rel=0&fs=0&modestbranding=1&playsinline=1`}
    title="YouTube video"
    frameBorder="0"
    loading="lazy"
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

            {media.kind === 'youtube' && media.src && !shouldMountYouTube && (
              youtubeThumbSrc ? (
                <div className="forum-ad-media-fill">
                  <img
                    src={youtubeThumbSrc}
                    alt={host}
                    className="forum-ad-fit"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] text-[color:var(--muted-fore,#9ca3af)]">
                  {host}
                </div>
              )
            )}

            {media.kind === 'tiktok' && media.src && shouldMountTikTok && (
<div
  className="relative overflow-hidden rounded-lg"
  style={isFluid ? { width: '100%', aspectRatio: '9 / 16' } : { width: '100%', height: '100%' }}
>
  <iframe
    src={`https://www.tiktok.com/embed/v2/${media.src}`}
    title="TikTok video"
    frameBorder="0"
    loading="lazy"
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

            {media.kind === 'tiktok' && media.src && !shouldMountTikTok && (
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
      />
    ) : (
      <NextImage
        src={media.src}
        alt={host}
        fill
        className="forum-ad-fit transition-opacity duration-200"
        style={{ objectFit: 'contain', objectPosition: 'center' }}
        unoptimized
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
                aria-label={muted ? 'Enable sound' : 'Mute sound'}
                title={muted ? 'Enable sound' : 'Mute sound'}
              >
                <span className="ico" aria-hidden="true">
                  {muted ? '🔇' : '🔊'}
                </span>
              </button>
            )}

            <div className="pointer-events-none Р В Р’В°Р В Р’В±Р РЋР С“Р В РЎвЂўР В Р’В»Р РЋР вЂ№Р РЋРІР‚С™ inset-0 rounded-lg border border-transparent qshine" />
          </div>
        </div> 
      </a>
    </div>
  );
}
