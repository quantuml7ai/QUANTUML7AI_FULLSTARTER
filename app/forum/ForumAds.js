// app/forum/ForumAds.js
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useI18n } from '../../components/i18n';

/* ======================= CAMPAIGN META ======================= */

const CAMPAIGN_ID = 'forum_ads_v1';
const FALLBACK_CAMPAIGN_SEED = 'forum_ads_seed';

const DEFAULT_THUMB_SERVICES = [
  'https://image.thum.io/get/width/960/{url}',
  'https://s.wordpress.com/mshots/v1/{url}?w=960',
  'https://image.microlink.io/?url={url}&screenshot=true&meta=false',
];

const FALLBACK_LINKS = [
  'https://web.telegram.org/k/',
  'https://www.youtube.com/',
  'https://vercel.com/',
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

/* ======================= UTILS ======================= */

function isBrowser() {
  return typeof window !== 'undefined';
}

function getWin() {
  return isBrowser() ? window : null;
}

function debugLog(conf, ...args) {
  if (conf?.DEBUG && typeof console !== 'undefined') {
    console.log('[ADS]', ...args);
  }
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
 * дедуп по host+pathname
 */
function parseLinks(raw) {
  if (!raw) return [];
  const tokens = String(raw)
    .split(/[\s,;]+/)
    .map((s) => s.replace(/#.*/, '').trim())
    .filter(Boolean);

  const seen = new Set();
  const res = [];

  for (const t of tokens) {
    const n = normalizeUrl(t);
    if (!n) continue;
    let u;
    try {
      u = new URL(n);
    } catch {
      continue;
    }
    const key = `${u.hostname}${u.pathname}`;
    if (seen.has(key)) continue;
    seen.add(key);
    res.push(u.toString());
  }

  return res;
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

  const EVERY = parseNumber(readRaw('EVERY'), 0);
  const ROTATE_MIN = parseNumber(readRaw('ROTATE_MIN'), 1);

  const PREVIEW_RAW = (readRaw('PREVIEW') || 'auto').toLowerCase();
  const PREVIEW =
    PREVIEW_RAW === 'screenshot' || PREVIEW_RAW === 'favicon'
      ? PREVIEW_RAW
      : 'auto';

  const LINKS = parseLinks(readRaw('LINKS') || '');
  const THUMBS_RAW = parseThumbs(readRaw('THUMB_SERVICES') || '');
  const DEBUG = String(readRaw('DEBUG') || '').trim() === '1';

  const conf = {
    EVERY,
    ROTATE_MIN,
    PREVIEW,
    LINKS,
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
  if (!links.length) links = FALLBACK_LINKS.slice();

  if (!links.length) {
    debugLog(conf, 'slot_no_links', { slotKey });
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
    const url = perm[i];
    if (!url) continue;

    // не повторяем подряд для этого слота
    if (lastForSeed && url === lastForSeed && perm.length > 1) continue;

    // не повторяем подряд глобально, если есть выбор
    if (lastGlobal && url === lastGlobal && perm.length > 1) continue;

    if (coordinator && !coordinator.allowed(url, perm.length)) continue;
    if (coordinator && frameId != null && !coordinator.reserve(url, frameId))
      continue;

    chosen = url;
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
  if (!w || typeof w.dispatchEvent !== 'function') return;

  try {
    w.dispatchEvent(new CustomEvent('ads:event', { detail }));
  } catch {}
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

/* ======================= AdCard ======================= */
/**
 * OG video/screenshot/image → direct file → YouTube thumb → screenshot CDNs → favicon → placeholder
 * Без сырых URL.
 * Бейдж "Реклама" из словаря: ключ forum_ad_label.
 * Превью тянет карточку на всю доступную высоту.
 */

export function AdCard({ url, slotKind, nearId }) {
  const conf = getForumAdConf();
  useAdPreconnect(conf);
  const i18n = useI18n();
  const t = i18n?.t;

  const [media, setMedia] = useState({ kind: 'skeleton', src: null });
  const rootRef = useRef(null);

  const safe = useMemo(() => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      return u;
    } catch {
      return null;
    }
  }, [url]);

  useEffect(() => {
    if (!safe) return;
    let cancelled = false;

    const u = safe;
    const host = u.hostname;
    const href = u.toString();
    const thumbs =
      conf.THUMBS && conf.THUMBS.length
        ? conf.THUMBS
        : DEFAULT_THUMB_SERVICES;

    const isYouTube =
      /(^|\.)youtube\.com$/i.test(host) ||
      /(^|\.)youtu\.be$/i.test(host);

    const isDirectVideo = /\.(mp4|webm|mov|m4v)$/i.test(href);
    const isDirectImg = /\.(jpe?g|png|webp|gif|avif)$/i.test(href);

    async function run() {
      // 1) Microlink OG / screenshot
      if (!cancelled && conf.PREVIEW !== 'favicon') {
        try {
          const q =
            'https://api.microlink.io/?url=' +
            encodeURIComponent(href) +
            '&screenshot=true&meta=true&video=true&audio=false&iframe=false' +
            '&waitFor=2000'; // ждём ~2 сек перед скриншотом
         
            const resp = await fetch(q).catch(() => null);
          const data = await resp?.json().catch(() => null);
          const meta = data?.data || {};

          const candShot = meta.screenshot?.url || meta.image?.url || null;
          const candVideo = meta.video?.url || null;
          const candLogo = meta.logo?.url || null;

          const ogList = [
            candShot && { kind: 'image', src: candShot, step: 'og_screenshot' },
            candVideo && { kind: 'video', src: candVideo, step: 'og_video' },
            candLogo && { kind: 'image', src: candLogo, step: 'og_logo' },
          ].filter(Boolean);

          for (const c of ogList) {
            if (cancelled) return;
            try {
              const cu = new URL(c.src);
              if (cu.protocol !== 'https:') continue;

              if (c.kind === 'image') {
                const ok = await tryLoadImage(cu.toString());
                if (ok && !cancelled) {
                  setMedia({ kind: 'image', src: cu.toString(), step: c.step });
                  emitAdEvent(
                    'ad_fallback',
                    { url: href, cascade_step: c.step, slot_kind: slotKind },
                    conf
                  );
                  return;
                }
              } else if (c.kind === 'video') {
                setMedia({ kind: 'video', src: cu.toString(), step: c.step });
                emitAdEvent(
                  'ad_fallback',
                  { url: href, cascade_step: c.step, slot_kind: slotKind },
                  conf
                );
                return;
              }
            } catch {}
          }
        } catch {}
      }

      // 2) прямой файл
      if (!cancelled && conf.PREVIEW !== 'favicon') {
        if (isDirectImg) {
          const ok = await tryLoadImage(href);
          if (ok && !cancelled) {
            setMedia({ kind: 'image', src: href, step: 'direct_image' });
            emitAdEvent(
              'ad_fallback',
              { url: href, cascade_step: 'direct_image', slot_kind: slotKind },
              conf
            );
            return;
          }
        } else if (isDirectVideo) {
          setMedia({ kind: 'video', src: href, step: 'direct_video' });
          emitAdEvent(
            'ad_fallback',
            { url: href, cascade_step: 'direct_video', slot_kind: slotKind },
            conf
          );
          return;
        }
      }

      // 3) YouTube превью
      if (!cancelled && isYouTube && conf.PREVIEW !== 'favicon') {
        let vid = null;
        try {
          if (u.hostname.includes('youtu.be')) vid = u.pathname.slice(1);
          else vid = u.searchParams.get('v');
        } catch {}
        if (vid) {
          const yt =
            'https://i.ytimg.com/vi/' +
            encodeURIComponent(vid) +
            '/hqdefault.jpg';
          const ok = await tryLoadImage(yt);
          if (ok && !cancelled) {
            setMedia({ kind: 'image', src: yt, step: 'youtube_thumb' });
            emitAdEvent(
              'ad_fallback',
              { url: href, cascade_step: 'youtube_thumb', slot_kind: slotKind },
              conf
            );
            return;
          }
        }
      }

      // 4) Screenshot CDNs
      if (!cancelled && conf.PREVIEW !== 'favicon') {
        for (const tpl of thumbs) {
          if (cancelled) break;
          try {
            const shotUrl = tpl.replace('{url}', encodeURIComponent(href));
            const uShot = new URL(shotUrl);
            if (uShot.protocol !== 'https:') continue;
            const ok = await tryLoadImage(uShot.toString());
            if (ok && !cancelled) {
              setMedia({ kind: 'image', src: uShot.toString(), step: 'shot' });
              emitAdEvent(
                'ad_fallback',
                { url: href, cascade_step: 'shot', slot_kind: slotKind },
                conf
              );
              return;
            }
          } catch {}
        }
      }

      // 5) Favicon
      if (!cancelled && (conf.PREVIEW === 'auto' || conf.PREVIEW === 'favicon')) {
        try {
          const ico = 'https://icons.duckduckgo.com/ip3/' + host + '.ico';
          const ok = await tryLoadImage(ico);
          if (ok && !cancelled) {
            setMedia({ kind: 'favicon', src: ico, step: 'favicon' });
            emitAdEvent(
              'ad_fallback',
              { url: href, cascade_step: 'favicon', slot_kind: slotKind },
              conf
            );
            return;
          }
        } catch {}
      }

      // 6) Placeholder
      if (!cancelled) {
        setMedia({ kind: 'placeholder', src: null, step: 'placeholder' });
        emitAdEvent(
          'ad_fallback',
          { url: href, cascade_step: 'placeholder', slot_kind: slotKind },
          conf
        );
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [safe, conf, slotKind]);

  // Impression tracking
  useEffect(() => {
    const el = rootRef.current;
    if (
      !el ||
      !isBrowser() ||
      typeof IntersectionObserver === 'undefined' ||
      !safe
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
                  url: safe.toString(),
                  url_hash: hash32(safe.toString()),
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
  }, [safe, slotKind, nearId, conf]);

  if (!safe) return null;

  const href = safe.toString();
  const host = safe.hostname.replace(/^www\./i, '');
  const label =
    typeof t === 'function'
      ? t('forum_ad_label', 'Реклама')
      : 'Реклама';

  const handleClick = () => {
    emitAdEvent(
      'ad_click',
      {
        url: href,
        url_hash: hash32(href),
        slot_kind: slotKind,
        near_id: nearId,
      },
      conf
    );
  };

  return (
    <div
      ref={rootRef}
      className="item forum-ad-card"
      data-slot-kind={slotKind}
      data-ads="1"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        onClick={handleClick}
        aria-label={`${label} • ${host}`}
        className="block no-underline focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
      >
        <div className="flex flex-col gap-1 h-full">
          {/* header: только бейдж + домен, без url-строки */}
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-wide text-[color:var(--muted-fore,#9ca3af)]">
            <span className="px-1.5 py-0.5 rounded-md border border-[color:var(--accent,#fbbf24)] bg-black/40">
              {label}
            </span>
            <span className="truncate max-w-[200px] font-medium">
              
            </span>
          </div>

          {/* media: заполняет карточку */}
          <div className="relative mt-0.5 overflow-hidden rounded-lg border border-[color:var(--border,#27272a)] bg-[color:var(--bg-soft,#020817)] flex-1 min-h-[140px] max-h-[400px]">
            {media.kind === 'skeleton' && (
              <div className="animate-pulse w-full h-full bg-[color:var(--skeleton,#111827)]" />
            )}

            {media.kind === 'video' && media.src && (
              <video
                src={media.src}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            )}

            {media.kind === 'image' && media.src && (
              <NextImage
                src={media.src}
                alt={host}
                width={1920}
                height={1080}
                className="w-full h-full object-cover transition-opacity duration-200"
                unoptimized
              />
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

            <div className="pointer-events-none absolute inset-0 rounded-lg border border-transparent qshine" />
          </div>
        </div>
      </a>
    </div>
  );
}
