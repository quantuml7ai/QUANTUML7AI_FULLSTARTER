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

function writeMutedPrefToStorage(val) {
  if (!isBrowser()) return;
  try {
    window.localStorage?.setItem(MEDIA_MUTED_KEY, val ? '1' : '0');
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
  });
}

// Определяем тип медиа по Content-Type через HEAD
async function detectMediaKind(url, timeoutMs = 3000) {
  if (!url || !isBrowser() || typeof fetch === 'undefined') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);

    if (!resp) return null;

    const ct = (resp.headers.get('content-type') || '').toLowerCase();

    if (ct.startsWith('video/')) return 'video';
    if (ct.startsWith('image/')) return 'image';

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
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

export function AdCard({ url, slotKind, nearId }) {
  const conf = getForumAdConf();
  useAdPreconnect(conf);
  const i18n = useI18n();
  const t = i18n?.t;
  const router = useRouter();

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
  // ===== Focus / attention gating =====
  // isNear: блок рядом (можно подгружать, но не играть)
  // isFocused: блок реально в зоне внимания (играем)
  // isPageActive: вкладка/окно активно (иначе всегда пауза)
  const [isNear, setIsNear] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPageActive, setIsPageActive] = useState(true);

  const shouldPlay = isFocused && isPageActive;
  const shouldPlayRef = useRef(false);
  const slotCssVars = {
    '--ad-slot-h-m': `${AD_SLOT_HEIGHT_PX.mobile}px`,
    '--ad-slot-h-t': `${AD_SLOT_HEIGHT_PX.tablet}px`,
    '--ad-slot-h-d': `${AD_SLOT_HEIGHT_PX.desktop}px`,
  };

  useEffect(() => {
    shouldPlayRef.current = shouldPlay;
  }, [shouldPlay]);

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
      { rootMargin: '800px 0px', threshold: 0 }
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
    let cancelled = false;

    const clickHref = safeClick.toString();
    const landingHost = safeClick.hostname;

    const thumbs =
      conf.THUMBS && conf.THUMBS.length
        ? conf.THUMBS
        : DEFAULT_THUMB_SERVICES;

    const isDirectImg = /\.(jpe?g|png|webp|gif|avif)(?:$|[?#])/i.test(
      mediaHref
    );

    async function run() {
      // 0) сначала пробуем определить тип по Content-Type (HEAD)
      if (!cancelled) {
        const detected = await detectMediaKind(mediaHref).catch(() => null);
        if (cancelled) return;

        if (detected === 'video') {
          setMedia({ kind: 'video', src: mediaHref, step: 'head_video' });
          emitAdEvent(
            'ad_fallback',
            { url: clickHref, cascade_step: 'head_video', slot_kind: slotKind },
            conf
          );
          return;
        }

        if (detected === 'image') {
          setMedia({ kind: 'image', src: mediaHref, step: 'head_image' });
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
        setMedia({ kind: 'video', src: mediaHref, step: 'env_video' });
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
          setMedia({ kind: 'youtube', src: videoId, step: 'env_youtube' });
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
          setMedia({ kind: 'tiktok', src: videoId, step: 'env_tiktok' });
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
                setMedia({ kind: 'image', src: cu.toString(), step: c.step });
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
          setMedia({ kind: 'image', src: mediaHref, step: 'direct_image' });
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
              setMedia({ kind: 'image', src: uShot.toString(), step: 'shot' });
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
            setMedia({ kind: 'favicon', src: ico, step: 'favicon' });
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
        setMedia({ kind: 'placeholder', src: null, step: 'placeholder' });
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

    run();
    return () => {
      cancelled = true;
    };
  }, [safeClick, conf, slotKind, nearId, mediaHref]);

  // YouTube Iframe API для управления звуком
  useEffect(() => {
    if (!isBrowser()) return;
    if (media.kind !== 'youtube' || !media.src) return;

    let cancelled = false;

    function createPlayer() {
      if (cancelled) return;
      if (!window.YT || !window.YT.Player || !ytIframeRef.current) return;

      try {
        const player = new window.YT.Player(ytIframeRef.current, {
          videoId: media.src,
          playerVars: {
            autoplay: 0,
            controls: 0,
            mute: muted ? 1 : 0,
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
                if (muted) ev.target.mute?.();
                else ev.target.unMute?.();
                // Играем только если реально в фокусе внимания
                if (shouldPlayRef.current) ev.target.playVideo?.();
                else ev.target.pauseVideo?.();
              } catch {}
            },
          },
        });

        ytPlayerRef.current = player;
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
    };
  }, [media, muted]);
  // ===== Hard stop / resume playback depending on attention =====
  useEffect(() => {
    // HTML5 video
    if (media.kind === 'video' && videoRef.current) {
      const v = videoRef.current;
      if (shouldPlay) {
        // синхроним mute ДО play
        try {
          v.muted = !!muted;
        } catch {}

        v.play?.().catch(() => {
          // если пробовали со звуком и браузер запретил — откатим в mute глобально
          if (!muted) {
            writeMutedPrefToStorage(true);
            emitMutedPref(true, playerIdRef.current, 'forum-ads-autoplay-fallback');
            setMuted(true);
            try { v.muted = true; } catch {}
          }
        });
      } else {
        v.pause?.();
      }
    }

    // YouTube player (Iframe API)
    if (media.kind === 'youtube' && ytPlayerRef.current) {
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
  }, [shouldPlay, media.kind, muted]);

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
    if (media.kind === 'youtube' && ytPlayerRef.current) {
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
      height: var(--ad-slot-h-m);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 0.5rem;
      background: var(--bg-soft, #020817);
    }
    @media (min-width: 640px) {
      .forum-ad-media-slot {
        height: var(--ad-slot-h-t);
      }
    }
    @media (min-width: 1024px) {
      .forum-ad-media-slot {
        height: var(--ad-slot-h-d);
      }
    }

    /* Вписать целиком, без обрезки */
    .forum-ad-fit {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
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
>
          
 {media.kind === 'skeleton' && (
              <div className="animate-pulse w-full h-full bg-[color:var(--skeleton,#111827)]" />
            )}

            {media.kind === 'video' && media.src && (
<video
  ref={videoRef}
  src={media.src}
  className="forum-ad-fit"
  muted={muted}
  loop
  playsInline
  preload={isNear ? 'metadata' : 'none'}
/>

            )}


            {media.kind === 'youtube' && media.src && (
<div className="w-full h-full relative overflow-hidden rounded-lg">
  <iframe
    ref={ytIframeRef}
    src={`https://www.youtube.com/embed/${media.src}?enablejsapi=1&controls=0&rel=0&fs=0&modestbranding=1&playsinline=1`}
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
<div className="w-full h-full relative overflow-hidden rounded-lg">
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
           <div className="w-full h-full flex items-center justify-center">
<NextImage
  src={media.src}
  alt={host}
  width={1920}
  height={1080}
  className="forum-ad-fit transition-opacity duration-200"
  unoptimized
/>

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
                aria-label={muted ? 'Включить звук' : 'Выключить звук'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
            )}

            <div className="pointer-events-none абсолют inset-0 rounded-lg border border-transparent qshine" />
          </div>
        </div> 
      </a>
    </div>
  );
}
