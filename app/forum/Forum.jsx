// app/forum/Forum.jsx
 
'use client'
 
import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../components/i18n' 
import { broadcast as forumBroadcast } from './events/bus'
import Image from 'next/image'
// [ADS:IMPORT]
import {
  getForumAdConf,
  interleaveAds,
  resolveCurrentAdUrl,
  AdCard,
  AdsCoordinator,
} from './ForumAds';

// хелперы для отправки событий (строки, защита от undefined)
function emitCreated(pId, tId) {
  try { forumBroadcast({ type: 'post_created', postId: String(pId), topicId: String(tId) }); } catch {}
}
function emitDeleted(pId, tId) {
  try { forumBroadcast({ type: 'post_deleted', postId: String(pId), topicId: String(tId) }); } catch {}
 
}
const INVITE_BTN_SIZE = 50        // общий размер кнопки
const INVITE_GIF_SIZE = 40        // размер самой гифки внутри
const INVITE_BTN_OFFSET_X = 0     // при необходимости сдвиг по X
const INVITE_BTN_OFFSET_Y = 0     // при необходимости сдвиг по Y

/* =========================================================
   helpers
========================================================= */
// Оставляем только ASCII (HTTP headers требуют 0x00..0x7F)

// ---- отображение имени/аватарки ---- 
const isBrowser = () => typeof window !== 'undefined'
const cls = (...xs) => xs.filter(Boolean).join(' ')
const shortId = id => id ? `${String(id).slice(0,6)}…${String(id).slice(-4)}` : '—'
const human = ts => new Date(ts || Date.now()).toLocaleString()
const now = () => Date.now()
const formatCount = (n) => {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return '0';
  const abs = Math.abs(x);
  if (abs < 1000) return String(Math.trunc(x));
  const units = [
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' },
  ];
  for (const { v, s } of units) {
    if (abs >= v) {
      const num = x / v;
      const out = num >= 10 ? Math.round(num) : Math.round(num * 10) / 10; // 1.2K, 12K
      return `${out}${s}`;
    }
  }
  return String(Math.trunc(x));
}
const safeHtml = s => String(s || '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/(https?:\/\/[^\s<]+)(?=\s|$)/g,'<a target="_blank" rel="noreferrer noopener nofollow ugc" href="$1">$1</a>')
  .replace(/\n/g,'<br/>')
const rich = s => safeHtml(s).replace(/\*\*(.*?)\*\*/g,'<b>$1</b>').replace(/\*(.*?)\*/g,'<i>$1</i>')
// детектор любых ссылок/адресов (URL/email/markdown/localhost/IP/укороченные)
const hasAnyLink = (s) => {
  const str = String(s || '');
  if (!str) return false;

  // 1) markdown: [текст](url) или <url>
  const md1 = /\[[^\]]+\]\(([^)]+)\)/i;          // [text](http://…)
  const md2 = /<\s*([a-z]+:\/\/|www\.)[^>]+>/i;  // <http://…> или <www.…>

  // 2) с протоколом (любой валидный scheme://)
  const proto = /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"'`]+/i;

  // 3) "www." + что-то доменное
  const www = /\bwww\.[^\s<>"'`]+/i;

  // 4) обычные домены с TLD (поддержка punycode, поддоменов, пути/порта)
  const domain = /\b(?:[a-z0-9-]+\.)+(?:xn--[a-z0-9-]+|[a-z]{2,})(?::\d+)?(?:\/[^\s<>"'`]*)?/i;

  // 5) популярные укороченные/мессенджер-домены
  const shorters = /\b(?:t\.me|telegram\.me|wa\.me|bit\.ly|t\.co|goo\.gl|is\.gd|tinyurl\.com)\/[^\s<>"'`]+/i;

  // 6) IPv4 и localhost (с портом/путём)
  const ipLocal = /\b(?:(?:\d{1,3}\.){3}\d{1,3}|localhost)(?::\d+)?(?:\/[^\s<>"'`]*)?/i;

  // 7) email (как ссылка-контакт)
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

  return md1.test(str) || md2.test(str) || proto.test(str) || www.test(str)
      || shorters.test(str) || ipLocal.test(str) || domain.test(str) || email.test(str);
};

// --- общий клиентский враппер над /api/deep-translate ---
// используется и в новостях, и в форуме
async function translateText(text, targetLocale) {
  if (!text) return text;

  let target = targetLocale;

  if (!target && typeof navigator !== 'undefined') {
    target = navigator.language; // например, "ru-RU"
  }

  const targetLang = (target || 'en').split('-')[0] || 'en';

  try {
    const res = await fetch('/api/deep-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang: 'auto',
        targetLang,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    // роут возвращает { text, provider } — но на всякий случай поддерживаем и translatedText
    return data?.text || data?.translatedText || text;
  } catch (e) {
    console.error('translate error', e);
    return text;
  }
}
const readAuth = () => ({
  accountId: isBrowser() && (window.__AUTH_ACCOUNT__ || localStorage.getItem('account') || localStorage.getItem('wallet')) || null,
  asherId:   isBrowser() && (window.__ASHER_ID__      || localStorage.getItem('asherId') || localStorage.getItem('ql7_uid')) || null,
})

async function openAuth({ timeoutMs = 15000 } = {}) {
  try { window.dispatchEvent(new CustomEvent('open-auth')) } catch {}
  (document.querySelector('[data-auth-open]') || document.querySelector('#nav-auth-btn'))?.click?.();

  return new Promise((resolve) => {
    let done = false;
    const finish = (val) => { if (done) return; done = true; cleanup(); resolve(val); };

    const ok = () => finish(readAuth());
    const cancel = () => finish(null);
    const cleanup = () => {
      window.removeEventListener('auth:ok', ok);
      window.removeEventListener('auth:success', ok);
      window.removeEventListener('auth:cancel', cancel);
      window.removeEventListener('auth:fail', cancel);
      clearTimeout(timer);
    };

    window.addEventListener('auth:ok', ok, { once: true });
    window.addEventListener('auth:success', ok, { once: true });
    window.addEventListener('auth:cancel', cancel, { once: true });
    window.addEventListener('auth:fail', cancel, { once: true });

    const timer = setTimeout(() => cancel(), timeoutMs);
  });
}
 
function ensureClientId(){
  try{
    let v = localStorage.getItem('forum:cid')
    if(!v){ v = (crypto?.randomUUID?.() || `c_${Math.random().toString(36).slice(2)}${Date.now()}`); localStorage.setItem('forum:cid', v) }
    return v
  }catch{ return `c_${Date.now()}` }
}
const PROFILE_ALIAS_PREFIX = 'profile:alias:'

function resolveProfileAccountId(userId) {
  const raw = String(userId || '').trim()
  if (!raw || typeof window === 'undefined') return raw
  try {
    const alias = localStorage.getItem(PROFILE_ALIAS_PREFIX + raw)
    return alias ? String(alias).trim() : raw
  } catch {
    return raw
  }
}
// --- hydration-safe helpers (вставь выше разметки) ---
function safeReadProfile(userId) {
  if (typeof window === 'undefined' || !userId) return {};
  const uid = resolveProfileAccountId(userId)
  try { return JSON.parse(localStorage.getItem('profile:' + uid) || '{}'); }
  catch { return {}; }
}
function writeProfileAlias(rawId, accountId) {
  if (!rawId || !accountId || typeof window === 'undefined') return
  const from = String(rawId).trim()
  const to = String(accountId).trim()
  if (!from || !to || from === to) return
  try { localStorage.setItem(PROFILE_ALIAS_PREFIX + from, to) } catch {}
}

function mergeProfileCache(accountId, patch) {
  if (!accountId || typeof window === 'undefined') return null
  const key = 'profile:' + accountId
  let cur = {}
  try { cur = JSON.parse(localStorage.getItem(key) || '{}') || {} } catch { cur = {} }
  const next = { ...cur, ...(patch || {}) }
  try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
  return next
}
// --- Профиль: подтянуть ник/аватар с бэка и записать в localStorage ---
function useSyncForumProfileOnMount(onProfileUpdate) {
  React.useEffect(() => {
    if (!isBrowser()) return

    const { accountId, asherId } = readAuth()
    const uid = asherId || accountId
    if (!uid) return


    let cancelled = false

    async function sync() {
      try {
        const r = await fetch(`/api/profile/get-profile?uid=${encodeURIComponent(uid)}`, {
          method: 'GET',
          cache: 'no-store',
        })
        const j = await r.json().catch(() => null)
        if (!j?.ok || cancelled) return
        const resolvedAccountId = String(j.accountId || uid).trim()
        if (resolvedAccountId) writeProfileAlias(uid, resolvedAccountId)
        let cur = {}
        try { cur = JSON.parse(localStorage.getItem('profile:' + resolvedAccountId) || '{}') || {} } catch { cur = {} }
const vipUntil = Number(j?.vipUntil ?? j?.vipExpiresAt ?? j?.vip_until ?? j?.vip_exp ?? 0) || 0;
const vipActive = !!(j?.vipActive ?? j?.isVip ?? j?.vip ?? false) || (vipUntil && vipUntil > Date.now());

const next = {
  ...cur,
  nickname: j.nickname || j.nick || cur.nickname || '',
  icon: j.icon || cur.icon || '',
  vipActive,
  vipUntil,
}


        mergeProfileCache(resolvedAccountId, next)
        onProfileUpdate?.()
      } catch {
        // сеть/бэк лёг — просто молча игнорим
      }
    }

    sync()
    return () => { cancelled = true }
  }, [])
}

// [VIP AVATAR FIX] выбираем, что показывать на карточках
function resolveNickForDisplay(userId, fallbackNick) {
  const uid = resolveProfileAccountId(userId)
  const prof = safeReadProfile(uid) || {}
  // WHY: nickname must always come from canonical profile cache, props are fallback only.
  return prof.nickname || fallbackNick || (uid ? shortId(uid) : '')
}
function resolveIconForDisplay(userId, pIcon) {
  const uid = resolveProfileAccountId(userId)
  const prof = safeReadProfile(uid) || {};
  // приоритет: vipIcon (URL) → vipEmoji (эмодзи) → то, что пришло с сервера
  return prof.vipIcon || prof.vipEmoji || prof.icon || pIcon || '👤';
}
// =========================================================
// VIP badge над ником (1.png 20s / 2.png 5s) — только для VIP
// =========================================================
const VIP_BADGE_IMG_1 = '/isvip/1.png';
const VIP_BADGE_IMG_2 = '/isvip/2.png';

// не даём бомбить /api/profile/get-profile по 100 раз
const __vipProbeOnce = new Set();

function __vipFromHint(h) {
  if (h === true) return true;
  if (h === false) return false;
  // иногда бэк может прислать timestamp (vipUntil)
  if (typeof h === 'number' && Number.isFinite(h)) return h > Date.now();
  if (typeof h === 'string' && /^\d{10,}$/.test(h)) {
    const n = Number(h);
    if (Number.isFinite(n)) return n > Date.now();
  }
  return null;
}

function __vipFromProfile(prof) {
  if (!prof || typeof prof !== 'object') return null;

  // явные флаги
  if (prof.vipActive === true || prof.isVip === true || prof.vip === true) return true;
  if (prof.vipActive === false || prof.isVip === false || prof.vip === false) return false;

  // timestamp-истечение
  const until = Number(prof.vipUntil ?? prof.vipExpiresAt ?? prof.vip_until ?? prof.vip_exp ?? 0);
  if (Number.isFinite(until) && until > Date.now()) return true;

  // иногда отдают уровень
  const lvl = Number(prof.vipLevel ?? prof.vip_level ?? 0);
  if (Number.isFinite(lvl) && lvl > 0) return true;

  // fallback: если твой бек кладёт эти поля только VIP-пользователям
  if (prof.vipIcon || prof.vipEmoji) return true;

  return null;
}

function useVipFlag(userId, hint) {
  const uid = String(resolveProfileAccountId(userId) || '').trim();

  const [vip, setVip] = React.useState(() => {
    const fromHint = __vipFromHint(hint);
    if (fromHint !== null) return fromHint;
    const fromProf = __vipFromProfile(safeReadProfile(uid));
    return fromProf; // true | false | null
  });

  React.useEffect(() => {
    const uid = String(resolveProfileAccountId(userId) || '').trim();
    if (!uid) { setVip(false); return; }

    const fromHint = __vipFromHint(hint);
    if (fromHint !== null) { setVip(fromHint); return; }

    const fromProf = __vipFromProfile(safeReadProfile(uid));
    if (fromProf !== null) { setVip(fromProf); return; }

    // неизвестно → один раз попробуем спросить профиль
    if (__vipProbeOnce.has(uid)) return;
    __vipProbeOnce.add(uid);

    let cancelled = false;
    (async () => {
      try {
const r = await fetch('/api/forum/vip/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  cache: 'no-store',
  body: JSON.stringify({ ids: [uid] }),
});
const j = await r.json().catch(() => null);
if (!j?.ok || cancelled) return;

const v = j?.map?.[uid] || null;
const vipUntil = Number(v?.untilMs || 0) || 0;
const vipActive = !!v?.active || (vipUntil && vipUntil > Date.now());
        // сохраним в localStorage, чтобы дальше не гадать
        try {
          mergeProfileCache(uid, { vipActive, vipUntil });
        } catch {}

        setVip(vipActive);
      } catch {
        // no-op
      }
    })();

    return () => { cancelled = true; };
  }, [userId, hint]);

  return vip === true;
}

function VipFlipBadge({ className = '' }) {
  return (
    <span className={cls('vipFlip', className)} aria-label="VIP" title="VIP">
      <img className="vipFlipImg vip1" src={VIP_BADGE_IMG_1} alt="" loading="lazy" />
      <img className="vipFlipImg vip2" src={VIP_BADGE_IMG_2} alt="" loading="lazy" />
    </span>
  );
}

// iconId → канон
function normalizeIconId(v) {
  if (!v) return ''
  const s = String(v).trim()
  if (s.startsWith('e:')) {
    // e:1F60A → e:1f60a
    return 'e:' + s.slice(2).toLowerCase()
  }
  if (s.startsWith('v:') || s.startsWith('s:')) return s
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('/uploads/') || s.startsWith('/vip/') || s.startsWith('/avatars/')) return s
  // если пришло эмодзи 1–2 символа — переведём в e:xxxx
  const asCode = emojiToCodepoints(s)
  return asCode ? `e:${asCode}` : s
}

function emojiToCodepoints(str) {
  if (!str) return ''
  try {
    const cps = Array.from(str).map(ch => ch.codePointAt(0).toString(16))
    if (!cps.length) return ''
    return cps.join('-').toLowerCase()
  } catch { return '' }
}

// строго детерминированный URL и только <img>
function resolveIconUrl(iconId, userId = '') {
  if (!iconId) return defaultAvatarUrl(userId)
  // прямые URL/пути
  if (/^https?:\/\//i.test(iconId)) return iconId
  if (iconId.startsWith('/uploads/')) return iconId
  if (iconId.startsWith('/vip/')) return iconId
  if (iconId.startsWith('/avatars/')) return iconId

  // VIP (v:name) → /vip/name.webp
  if (iconId.startsWith('v:')) {
    const name = iconId.slice(2)
    return `/vip/${name}.webp`
  }

  // stock (s:N) → upload.jpg
  if (iconId.startsWith('s:')) {
    return `/upload.jpg`
  }

  // emoji (e:1f60a-1f44d) → twemoji svg (стабильно на SSR/CSR)
  if (iconId.startsWith('e:')) {
    const code = iconId.slice(2)
    return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`
  }

  // fallback: если прислали «живое» эмодзи
  if (iconId.length <= 4) {
    const code = emojiToCodepoints(iconId)
    if (code) return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`
  }

  return defaultAvatarUrl(userId)
}

function defaultAvatarUrl(userId = '') {
  // детерминированный fallback по userId
  return `/upload.jpg`
}

/**
 * SSR-safe AvatarEmoji
 * — ВНЕШНИЙ ТЕГ ВСЕГДА <div> (совпадает на SSR и на первом CSR-рендере)
 * — На сервере и до mount рендерим только текст ssrFallback
 * — После mount, если icon — картинка, показываем <img> внутри того же <div>
 */
function AvatarEmoji({ userId, pIcon, className }) {
  // 1) нормализуем вход (iconId) → детерминированный URL на SSR
  const initialUrl = React.useMemo(
    () => resolveIconUrl(normalizeIconId(pIcon), userId),
    [pIcon, userId]
  )
  const [url, setUrl] = React.useState(initialUrl)
  const fallbackUrl = React.useMemo(() => defaultAvatarUrl(userId), [userId])
  // 2) после mount можно «уточнить» из локального профиля, но структура не меняется
  React.useEffect(() => {
    try {
      const prof = safeReadProfile(userId) // может вернуть { icon: 'e:1f60a' | 'v:...' | '/uploads/...' | ... }
      const iconId = normalizeIconId(prof?.icon || pIcon)
      setUrl(resolveIconUrl(iconId, userId))
    } catch {
      // no-op
    }
  }, [userId, pIcon])

  return (
    <span className={className || 'avaWrap'}>
      <Image
        src={url}
        alt=""
        width={64}
        height={64}
        unoptimized
        onError={() => setUrl(fallbackUrl)}        
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 'inherit',
          display: 'block'
       }}
      />
    </span>
  )
}



/** сигнатуры для схлопывания дублей (tmp_* против пришедших с сервера) */
const sigTopic = (t) => `${(t.title||'').slice(0,80)}|${t.userId||t.accountId||''}|${Math.round((t.ts||0)/60000)}`
const sigPost  = (p) => `${(p.text||'').slice(0,120)}|${p.userId||p.accountId||''}|${p.topicId||''}|${p.parentId||''}|${Math.round((p.ts||0)/10000)}`
// берем из window.__FORUM_CONF__ (его отдаёт сервер из env), иначе — дефолты
const CFG = (typeof window!=='undefined' && window.__FORUM_CONF__) || {};
const MIN_INTERVAL_MS   = Math.max(0, Number(CFG.FORUM_MIN_INTERVAL_SEC   ?? 1)*1000);
const REACTS_PER_MINUTE = Number(CFG.FORUM_REACTS_PER_MINUTE ?? 120);
const VIEW_TTL_SEC      = Number(CFG.FORUM_VIEW_TTL_SEC      ?? 0);


function getBucket(ttlSec=VIEW_TTL_SEC){ return Math.floor((Date.now()/1000)/ttlSec) }

function rateLimiter(){
  let lastActionAt = 0;
  let stamps = [];
  return {
    allowAction(){
      const now = Date.now();
      if (now - lastActionAt < MIN_INTERVAL_MS) return false;
      const windowStart = now - 60_000;
      stamps = stamps.filter(ts => ts >= windowStart);
      if (stamps.length >= REACTS_PER_MINUTE) return false;
      stamps.push(now);
      lastActionAt = now;
      return true;
    }
  }
}

/* =========================================================
   toasts (single)
========================================================= */
function useToast(){
  const [t, set] = useState(null);

  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => set(null), 6500);
    return () => clearTimeout(id);
  }, [t]);

  const show = (kind, m) => {
    const msg = (m == null) ? '' : String(m);
    set({ kind, msg });
  };

  return {
    view: t ? (
      <div className="qft_toast_wrap">
        <div className={cls('qft_toast', t.kind)}>{t.msg}</div>
      </div>
    ) : null,

    ok: (m) => show('ok', m),
    success: (m) => show('ok', m),     // alias, чтобы toast.success работал
    warn: (m) => show('warn', m),
    err: (m) => show('err', m),
    info: (m) => show('info', m),      // ВОТ ЭТО КЛЮЧЕВО ДЛЯ ТВОЕГО “в обработке”
  };
}

// === helpers: images in post text ==========================================
function hasImageLines(text) {
  const lines = String(text || '').split(/\r?\n/);
  return lines.some((s) =>
    /^\/uploads\/[A-Za-z0-9._\-\/]+?\.(webp|png|jpe?g|gif)$/i.test(s.trim())
  );
}

/* =========================================================
   API (клиент) — ЗАМЕНИТЬ ВЕСЬ ОБЪЕКТ ПОЛНОСТЬЮ
========================================================= */

// === Auth helpers (cookie-only) ===
function getForumUserId() {
  if (typeof window === 'undefined') return 'srv';
  const KEY = 'forum_user_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'web_' + (crypto?.randomUUID?.() || Date.now().toString(36));
    localStorage.setItem(KEY, id);
  }
  return id;
}

// --- Админ: cookie-only ---
async function adminLogin(password) {
  try {
    const r = await fetch('/api/forum/admin/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: String(password || '') }),
    });
    const j = await r.json().catch(() => ({}));
    return j; // { ok: true } при успехе; cookie HttpOnly ставится сервером
  } catch {
    return { ok: false, error: 'network' };
  }
}

async function adminLogout() {
  try {
    const r = await fetch('/api/forum/admin/verify', { method: 'DELETE' });
    const j = await r.json().catch(() => ({}));
    return j; // { ok: true }
  } catch {
    return { ok: false, error: 'network' };
  }
}

/** @deprecated Токены не используются. Оставлено как шина совместимости. */
function setAdminToken(token) {
  // если где-то старый код зовёт setAdminToken('пароль') — прокинем в cookie-логин
  try {
    const t = String(token || '').trim();
    if (t) adminLogin(t);
  } catch {}
}

/** @deprecated Токены не используются (cookie-only). */
function getAdminToken() {
  return '';
}

// Чтобы IDE не подсвечивала как «неиспользуемые» и было удобно дергать из консоли:
if (typeof window !== 'undefined') {
  // namespaced, чтобы не конфликтовать
  window.__forumAdmin = Object.freeze({
    login:  adminLogin,
    logout: adminLogout,
    setAdminToken,   // совместимость
    getAdminToken,   // всегда вернёт ''
  });
}


// ==== API (клиент) ====
const api = {

  // Снимок базы: full или инкрементальный (since)
  async snapshot(q = {}) {
    try {
      const params = new URLSearchParams();
      if (q.b)     params.set('b',     String(q.b));
      if (q.rev)   params.set('rev',   String(q.rev));
      if (q.since) params.set('since', String(q.since));
      if (q.full)  params.set('full',  '1');
      const url = '/api/forum/snapshot' + (params.toString() ? `?${params}` : '');
      const r   = await fetch(url, { cache: 'no-store' });

      const raw = await r.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      const topics = Array.isArray(data?.topics) ? data.topics : [];
      const posts  = Array.isArray(data?.posts)  ? data.posts  : [];
      const events = Array.isArray(data?.events) ? data.events : [];      
      // server -> 'banned'; поддерживаем обратную совместимость с 'bans'
      const bans   = Array.isArray(data?.banned) ? data.banned
                    : Array.isArray(data?.bans)  ? data.bans : [];
      const rev    = Number.isFinite(+data?.rev) ? +data.rev   : 0;
      const cursor = data?.cursor ?? null;

      const __reset = !!q.full;
      return { ok: r.ok, status: r.status, topics, posts, bans, rev, cursor, events, __reset };
    } catch {
      return { ok:false, error:'network', topics:[], posts:[], bans:[], rev:0, cursor:null, events:[], __reset:false };
    }
  },

  // Батч-мутации
  async mutate(batch, userId) {
    try {
      const actorId =
        userId ??
        batch?.userId ??
        batch?.accountId ??
        batch?.asherId ??
        (typeof getForumUserId === 'function' ? getForumUserId() : '');

      const headers = {
        'Content-Type': 'application/json',
        'x-forum-user-id': String(actorId || ''), // сервер читает через requireUserId
      };

      // (cookie-only) — НЕ прикладываем x-admin-token
      // оставлено намеренно пустым для совместимости

      const payload = {
        ops: Array.isArray(batch?.ops) ? batch.ops : [],
        userId: String(actorId || ''),
      };
      if (!payload.ops.length) return { ok: false, error: 'empty_ops' };

      const url = '/api/forum/mutate';
      const body = JSON.stringify(payload);
      const r = await fetch(url, { method: 'POST', headers, body });

      const text = await r.text().catch(() => '');
      let json = null; try { json = text ? JSON.parse(text) : null; } catch {}

      try {
        window.__lastMutate = () => ({
          url,
          req:{ headers, body },
          res:{ status:r.status, ok:r.ok, body: json ?? text }
        });
      } catch {}

      if (!r.ok) console.warn('mutate non-2xx', r.status, text, payload);
      return json ?? { ok: r.ok, status: r.status };
    } catch (e) {
      console.error('mutate error', e);
      return { ok: false, error: 'network' };
    }
  },

  // Удалить тему (со всем деревом)
  async adminDeleteTopic(id) {
    try {
      const r = await fetch('/api/forum/admin/deleteTopic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // cookie-only: не отправляем x-admin-token
        },
        body: JSON.stringify({ topicId: id }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  // Удалить пост (ветка удалится каскадно на сервере)
  async adminDeletePost(id) {
    try {
      const r = await fetch('/api/forum/admin/deletePost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // cookie-only: не отправляем x-admin-token
        },
        body: JSON.stringify({ postId: id }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  // Бан пользователя
  async adminBanUser(accountId) {
    try {
      const r = await fetch('/api/forum/admin/banUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // cookie-only: не отправляем x-admin-token
        },
        body: JSON.stringify({ accountId }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  // Снять бан
  async adminUnbanUser(accountId) {
    try {
      const r = await fetch('/api/forum/admin/unbanUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // cookie-only: не отправляем x-admin-token
        },
        body: JSON.stringify({ accountId }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
    } 
 },
  // ===== OWNER API (владелец темы/поста) =====
  async ownerDeleteTopic(id, userId) {
    try {
      const r = await fetch('/api/forum/own', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forum-user-id': String(userId || '') },
        body: JSON.stringify({ action: 'delete_topic', topicId: String(id) }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },
  async ownerDeletePost(id, userId) {
    try {
      const r = await fetch('/api/forum/own', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forum-user-id': String(userId || '') },
        body: JSON.stringify({ action: 'delete_post', postId: String(id) }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },
  async ownerEditPost(id, text, userId) {
    try {
      const r = await fetch('/api/forum/own', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forum-user-id': String(userId || '') },
        body: JSON.stringify({ action: 'edit_post', postId: String(id), text: String(text || '') }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  // ===== SUBSCRIPTIONS (author subscribe) =====
  async subsList(viewerId) {
    try {
      const r = await fetch('/api/forum/subs/list', {
        method: 'GET',
        headers: { 'x-forum-user-id': String(viewerId || '') },
        cache: 'no-store',
      })
      return await r.json().catch(() => ({ ok: false, authors: [] }))
    } catch {
      return { ok: false, error: 'network', authors: [] }
    }
  },

  async subsToggle(viewerId, authorId) {
    try {
      const r = await fetch('/api/forum/subs/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forum-user-id': String(viewerId || ''),
        },
        cache: 'no-store',
        body: JSON.stringify({ authorId: String(authorId || '') }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  async subsMyCount(viewerId) {
    try {
      const r = await fetch('/api/forum/subs/my-count', {
        method: 'GET',
        headers: { 'x-forum-user-id': String(viewerId || '') },
        cache: 'no-store',
      })
      return await r.json().catch(() => ({ ok: false, count: 0 }))
    } catch {
      return { ok: false, error: 'network', count: 0 }
    }
  },

  async subsCount(authorId) {
    try {
      const params = new URLSearchParams({ authorId: String(authorId || '') })
      const r = await fetch('/api/forum/subs/count?' + params.toString(), { cache: 'no-store' })
      return await r.json().catch(() => ({ ok: false, count: 0 }))
    } catch {
      return { ok: false, error: 'network', count: 0 }
    }
  },

  // ===== VIP (batch) =====
  async vipBatch(ids) {
    try {
      const arr = Array.isArray(ids) ? ids : []
      const r = await fetch('/api/forum/vip/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ ids: arr }),
      })
      return await r.json().catch(() => ({ ok: false, map: {} }))
    } catch {
      return { ok: false, error: 'network', map: {} }
    }
  },  
  async profileBatch(ids) {
    try {
      const arr = Array.isArray(ids) ? ids : []
      const r = await fetch('/api/profile/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ ids: arr }),
      })
      return await r.json().catch(() => ({ ok: false, map: {}, aliases: {} }))
    } catch {
      return { ok: false, error: 'network', map: {}, aliases: {} }
    }
  },
};
 
 
/* =========================================================
   КОНЕЦ API
========================================================= */

// === Q COIN: helpers ===
function resolveForumUserId(explicit){
  // 1) приоритет — то, что передали извне
  if (explicit && String(explicit).trim()) return String(explicit).trim();

  // 2) то, что уже кладёшь в window/localStorage
  try{
    const w  = typeof window!=='undefined' ? window : {};
    const ls = typeof localStorage!=='undefined' ? localStorage : null;

    const fromWin =
      w.__FORUM_USER__ || w.__AUTH_ACCOUNT__ || w.__ASHER_ID__ ||
      w.wallet || w.account || '';
    if (fromWin) return String(fromWin);

    if (ls){
      const fromLS =
        ls.getItem('account') || ls.getItem('wallet') || ls.getItem('asherId') || ls.getItem('ql7_uid') || '';
      if (fromLS) return String(fromLS);
    }
  }catch{}

  // 3) крайний вариант — пусто
  return '';
}

// === Q COIN: client-side live ticker with rare sync (AUTH-ONLY) ===
function useQCoinLive(userKey, isVip){
  // uid берём через helper и мягко санитизируем под серверную схему
  const rawUid = resolveForumUserId(userKey);
  let uid = typeof rawUid === 'string' ? rawUid.trim() : '';
  if (uid && !/^[A-Za-z0-9_\-:.]{1,64}$/.test(uid)) uid = '';

  // стабильный client-id для alive (один на вкладку/браузер)
  const cidRef = React.useRef('');
  if (!cidRef.current) {
    try {
      const ls = typeof localStorage!=='undefined' ? localStorage : null;
      const fromLS = ls ? ls.getItem('forum_client_id') : '';
      const fresh  = 'cid_' + (typeof crypto!=='undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36)));
      const val    = (fromLS && /^[A-Za-z0-9_\-:.]{1,64}$/.test(fromLS)) ? fromLS : fresh;
      cidRef.current = val;
      if (ls) ls.setItem('forum_client_id', val);
    } catch {
      cidRef.current = 'cid_' + Date.now().toString(36);
    }
  }

  // Константы модели
  const INC_PER_SEC = 1 / (365 * 24 * 60 * 60); // за 365 дней = 1
  const GRACE_MS    = 4 * 60 * 60 * 1000;       // 4 часа
  const SYNC_MS     = 10 * 60 * 1000;           // раз в 10 минут синк

  // Серверные значения (последний снимок)
  const [server, setServer] = React.useState({
    startedAt: Date.now(),
    lastActiveAt: Date.now(),
    lastConfirmAt: 0,
    seconds: 0,
    balance: 0,
    paused: !uid,                 // без UID сразу пауза
    loading: !!uid,               // грузимся только если есть UID
    modal: false,
    incPerSec: uid ? INC_PER_SEC : 0, // без UID инкремент 0
    graceMs: GRACE_MS,
  });

  // Локальные маркеры активности
  const lastUiRef       = React.useRef(0);
  const lastSyncRef     = React.useRef(0);
  const becameActiveRef = React.useRef(true);
  const displayRef      = React.useRef(server.balance);

  // Защиты для heartbeat
  const heartbeatInFlight = React.useRef(false);
  const syncErrors        = React.useRef(0); // для мягкого backoff

  const markUi = React.useCallback(function(){
    lastUiRef.current = Date.now();
    becameActiveRef.current = true;
  }, []);
  // === Next-up video warmup (preload the next video while current plays) ===
  useEffect(() => {
    if (!isBrowser()) return;

    const selector = 'video[data-forum-video="post"]';
    let warmed = null;
    const warmedOnce = new WeakSet();
    let warmIdleId = null;

    const idle = (fn) => {
      try {
        if ('requestIdleCallback' in window) {
          return window.requestIdleCallback(fn, { timeout: 1200 });
        }
      } catch {}
      return setTimeout(fn, 120);
    };
    const cancelIdle = (id) => {
      try {
        if ('cancelIdleCallback' in window) return window.cancelIdleCallback(id);
      } catch {}
      clearTimeout(id);
    };

    const isSlowNetwork = () => {
      try {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const type = String(conn?.effectiveType || '');
        return !!conn?.saveData || /(^|-)2g/.test(type);
      } catch {
        return false;
      }
    };

    const clearWarm = () => {
      if (!(warmed instanceof HTMLVideoElement)) { warmed = null; return; }
      try {
        if (warmIdleId != null) { try { cancelIdle(warmIdleId); } catch {} warmIdleId = null; }
       
        const slow = isSlowNetwork();
        warmed.preload = slow ? 'metadata' : 'auto'; 

        // НЕ дергаем load() на каждом play (это и даёт дерганье/CPU).
        // Подогреваем мягко и ОДИН раз на видео, в idle, только если совсем "холодное".
        if (!warmedOnce.has(warmed)) {
          warmedOnce.add(warmed);
          warmIdleId = idle(() => {
            warmIdleId = null;
            try {
              const cold = (warmed.readyState === 0 || !warmed.currentSrc);
              const safe = cold && warmed.paused && (warmed.currentTime === 0);
              if (safe) warmed.load?.();
            } catch {}
          });
        }
      } catch {}
      warmed = null;
    };

    const warmNext = (current) => {
      if (!(current instanceof HTMLVideoElement)) return;
      const list = Array.from(document.querySelectorAll(selector));
      const idx = list.indexOf(current);
      if (idx < 0) return;
      const next = list[idx + 1];
      if (!next || next === warmed) return;
      clearWarm();
      warmed = next;
      const slow = isSlowNetwork();
      try {
        warmed.preload = slow ? 'metadata' : 'auto';
        warmed.setAttribute('data-forum-warm', '1');
        warmed.load();
      } catch {}
    };

    const onPlay = (e) => {
      const target = e.target;
      if (!(target instanceof HTMLVideoElement)) return;
      if (target.getAttribute('data-forum-video') !== 'post') return;
      warmNext(target);
    };

    const onStop = (e) => {
      const target = e.target;
      if (!(target instanceof HTMLVideoElement)) return;
      if (target.getAttribute('data-forum-video') !== 'post') return;
      clearWarm();
    };

    document.addEventListener('play', onPlay, true);
    document.addEventListener('pause', onStop, true);
    document.addEventListener('ended', onStop, true);

    return () => {
      document.removeEventListener('play', onPlay, true);
      document.removeEventListener('pause', onStop, true);
      document.removeEventListener('ended', onStop, true);
      clearWarm();
    };
  }, []);
  // Считаем открытие страницы «активностью», чтобы тикер сразу начал тикать
  React.useEffect(function(){
    lastUiRef.current = Date.now();
    becameActiveRef.current = true;
  }, []);

  // Сброс при смене UID (логин/логаут)
  React.useEffect(function(){
    setServer(s => ({
      ...s,
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      lastConfirmAt: 0,
      seconds: 0,
      balance: 0,
      paused: !uid,                   // логаут -> пауза
      loading: !!uid,                 // логин -> загрузка
      incPerSec: uid ? INC_PER_SEC : 0,
    }));
    displayRef.current = 0;
    lastSyncRef.current = 0;
    becameActiveRef.current = !!uid;
  }, [uid]);

  // Стартовый GET (с timeout и санитайзингом чисел) — ТОЛЬКО если есть UID
  React.useEffect(function(){
    if (!uid) return; // не авторизован — ничего не грузим

    let dead = false;

    async function load(){
      try{
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 8000);

        const r = await fetch('/api/qcoin/get', {
          headers:{
            'x-forum-user-id': uid,   // сервер: requireUserId
            'x-forum-vip': isVip ? '1' : '0',
          },
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        let j = null;
        try { j = await r.json(); } catch(e){ j = null; }

        if (!dead && j && j.ok){
          const inc0     = (j.incPerSec ?? INC_PER_SEC);
          const grace0   = (j.graceMs   ?? GRACE_MS);

          const safeInc0   = Math.max(0, Number(inc0));
          const safeGrace0 = Math.max(60000, Number(grace0));
          const clampedInc = Math.min(safeInc0,  INC_PER_SEC * 100);
          const clampedGr  = Math.min(safeGrace0,24*60*60*1000);

          setServer(s => ({
            ...s,
            startedAt:     (j.startedAt    ?? s.startedAt),
            lastActiveAt:  (j.lastActiveAt ?? s.lastActiveAt),
            lastConfirmAt: (j.lastConfirmAt?? 0),
            seconds: Number(j.seconds ?? 0),
            balance: Number(j.balance ?? 0),
            paused: !!j.paused,
            loading: false,
            incPerSec: clampedInc,
            graceMs: clampedGr,
          }));

          displayRef.current   = Number(j.balance ?? 0);
          lastSyncRef.current  = Date.now();
          lastUiRef.current    = Date.now();
          becameActiveRef.current = false;
        } else if (!dead){
          setServer(s => ({ ...s, loading:false, paused:true, incPerSec:0 }));
          displayRef.current = 0;
        }
      } catch(e){
        if (!dead){
          setServer(s => ({ ...s, loading:false, paused:true, incPerSec:0 }));
          displayRef.current = 0;
        }
      }
    }

    load();
    return () => { dead = true; };
  }, [uid, isVip]);

  // Локальные события активности (любое действие в форуме)
  React.useEffect(function(){
    if (typeof window==='undefined') return;
    const root = document.querySelector('.forum_root') || document.body;
    const onAny = () => { if (uid) markUi(); };
    const onVis = () => { if (uid && document.visibilityState === 'visible') markUi(); };

    ['click','keydown'].forEach((e)=>{
      root.addEventListener(e, onAny, {passive:true});
    });
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onAny);

    return function(){
      ['click','keydown'].forEach((e)=>{
        root.removeEventListener(e, onAny);
      });
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onAny);
    };
  }, [markUi, uid]);

  // Локальный «живой» тикер — каждую секунду дорисовываем баланс
  const [displayBalance, setDisplayBalance] = React.useState(0);
  React.useEffect(function(){
    setDisplayBalance(server.balance);
    displayRef.current = server.balance;
  }, [server.balance]);

  // Интервальный тик + heartbeat
  React.useEffect(function(){
    if (!uid) return; // нет UID — не тикаем вообще

    const id = setInterval(async function(){
      const now = Date.now();

      const graceMs = (server.graceMs ?? GRACE_MS);
      const lastC   = server.lastConfirmAt || 0;
      const lastUi  = lastUiRef.current || 0;

      const effectiveLast = (lastC > lastUi) ? lastC : lastUi;
      const withinGrace   = (now - effectiveLast) < graceMs;

      const incPerSec = (server.incPerSec ?? INC_PER_SEC);
      if (withinGrace && !server.paused){
        displayRef.current += incPerSec;
        setDisplayBalance(displayRef.current);
      }

      const needPeriodicSync  = (now - (lastSyncRef.current || 0)) >= SYNC_MS;
      const needImmediateSync = becameActiveRef.current;
      const backoffDelayMs    = Math.min(5, syncErrors.current) * 2000;

      if ((needPeriodicSync || needImmediateSync) && uid && !heartbeatInFlight.current){
        if (now - (lastSyncRef.current || 0) < backoffDelayMs) return;

        becameActiveRef.current = false;
        lastSyncRef.current = now;
        heartbeatInFlight.current = true;

        // active: были ли действия в последнюю минуту — чтобы сервер обновил lastConfirmAt
        const active = (now - (lastUiRef.current || 0)) < 60000;

        try{
          const controller = new AbortController();
          const timeoutId  = setTimeout(() => controller.abort(), 8000);

          const res = await fetch('/api/qcoin/heartbeat', {
            method:'POST',
            headers:{
              'content-type':'application/json',
              'x-forum-user-id': uid,               // сервер: requireUserId
              'x-forum-client-id': cidRef.current,  // для alive-ключей
              'x-forum-vip': isVip ? '1' : '0',     // ← VIP-множитель (Х2)
            },
            body: JSON.stringify({ active: !!active, now }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          let j = null;
          try { j = await res.json(); } catch(e){ j = null; }

          if (j && j.ok){
            const incFromSrv   = (j.incPerSec ?? incPerSec);
            const graceFromSrv = (j.graceMs   ?? graceMs);

            const safeInc       = Math.max(0, Number(incFromSrv));
            const safeGrace     = Math.max(60000, Number(graceFromSrv));
            const clampedInc    = Math.min(safeInc,   INC_PER_SEC * 100);
            const clampedGrace  = Math.min(safeGrace, 24 * 60 * 60 * 1000);

            setServer(s => ({
              ...s,
              startedAt:     (j.startedAt     ?? s.startedAt),
              lastActiveAt:  (j.lastActiveAt  ?? s.lastActiveAt),
              lastConfirmAt: (j.lastConfirmAt ?? s.lastConfirmAt),
              seconds: Number(j.seconds ?? s.seconds),
              balance: Number(j.balance ?? s.balance),
              paused: !!j.paused,
              incPerSec: clampedInc,
              graceMs: clampedGrace,
            }));

            displayRef.current = Number(j.balance ?? displayRef.current);
            setDisplayBalance(displayRef.current);
            syncErrors.current = 0;
          } else {
            syncErrors.current = Math.min(10, syncErrors.current + 1);
          }
        } catch(e){
          syncErrors.current = Math.min(10, syncErrors.current + 1);
        } finally {
          heartbeatInFlight.current = false;
        }
      }
    }, 1000);

    return function(){ clearInterval(id); };
 }, [uid, isVip, server.paused, server.incPerSec, server.graceMs, server.lastConfirmAt]);

  return {
    ...server,
    balanceDisplay: uid ? displayBalance : 0,  // без UID всегда показываем 0
    open:  function(){ setServer(s => ({ ...s, modal:true  })); },
    close: function(){ setServer(s => ({ ...s, modal:false })); },
  };
}

function openPaymentWindow(url) {
  if (!url) return

  try {
    // Для отладки можешь оставить этот лог — увидишь, что Safari реально получает URL
    console.log('[PAY] redirect to', url)

    // Самый надёжный способ для всех браузеров, особенно Safari:
    window.location.href = url
  } catch (e) {
    try { window.location.assign(url) } catch {}
  }
} 

/* =========================================================
   Styles (global)
========================================================= */
const Styles = () => (
  <style jsx global>{`
    :root{ --ink:#eaf4ff; --b:rgba(80,167,255,.32) }
    .forum_root{ color:var(--ink) }
    .glass{ background:rgba(8,13,20,.94); border:1px solid rgba(255,255,255,.10); border-radius:16px; backdrop-filter: blur(12px) }
    .neon{ box-shadow:0 0 28px rgba(25,129,255,.14), inset 0 0 18px rgba(25,129,255,.06) }
    .postBody{ white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word }
    .forum_root{
      --mb-video-h-mobile: 630px;
      --mb-video-h-tablet: 650px;
      --mb-video-h-desktop: 700px;
      --mb-image-h-mobile: 630px;
      --mb-image-h-tablet: 650px;
      --mb-image-h-desktop: 700px;
      --mb-iframe-h-mobile: 630px;
      --mb-iframe-h-tablet: 650px;
      --mb-iframe-h-desktop: 700px;
      --mb-audio-h-mobile: 630px;
      --mb-audio-h-tablet: 650px;
      --mb-audio-h-desktop: 700px;
      --mb-ad-h-mobile: 200px;
      --mb-ad-h-tablet: 260px;
      --mb-ad-h-desktop: 320px;

  /* VIP emoji / MOZI sticker cards fixed height (как mediaBox) */
  --mb-vip-emoji-h-mobile: 260px;
  --mb-vip-emoji-h-tablet: 320px;
  --mb-vip-emoji-h-desktop: 380px;

  --mb-sticker-h-mobile: 260px;
  --mb-sticker-h-tablet: 320px;
  --mb-sticker-h-desktop: 380px;      
      --mb-video-h: var(--mb-video-h-mobile);
      --mb-image-h: var(--mb-image-h-mobile);
      --mb-iframe-h: var(--mb-iframe-h-mobile);
      --mb-audio-h: var(--mb-audio-h-mobile);
      --mb-ad-h: var(--mb-ad-h-mobile);
 --mb-vip-emoji-h: var(--mb-vip-emoji-h-mobile);
  --mb-sticker-h: var(--mb-sticker-h-mobile);   
      }
    @media (min-width: 640px){
      .forum_root{
        --mb-video-h: var(--mb-video-h-tablet);
        --mb-image-h: var(--mb-image-h-tablet);
        --mb-iframe-h: var(--mb-iframe-h-tablet);
        --mb-audio-h: var(--mb-audio-h-tablet);
        --mb-ad-h: var(--mb-ad-h-tablet);

    --mb-vip-emoji-h: var(--mb-vip-emoji-h-tablet);
    --mb-sticker-h: var(--mb-sticker-h-tablet);        
      }
    }
    @media (min-width: 1024px){
      .forum_root{
        --mb-video-h: var(--mb-video-h-desktop);
        --mb-image-h: var(--mb-image-h-desktop);
        --mb-iframe-h: var(--mb-iframe-h-desktop);
        --mb-audio-h: var(--mb-audio-h-desktop);
        --mb-ad-h: var(--mb-ad-h-desktop);

    --mb-vip-emoji-h: var(--mb-vip-emoji-h-desktop);
    --mb-sticker-h: var(--mb-sticker-h-desktop);        
      }
    }
    /* =========================================================
       VIP emoji / MOZI sticker fixed card (аналог mediaBox)
    ========================================================= */
    .vipMediaBox{
      position: relative;
      width: 100%;
      height: var(--vipmb-h, 260px);
      overflow: hidden;
      border-radius: 12px;
      background: rgba(8,12,20,.7);
      border: 1px solid rgba(140,170,255,.25);
      contain: layout paint;
      display:flex;
      align-items:center;
      justify-content:center;
      padding: 10px;
    }

    .vipMediaBox[data-kind="vip-emoji"]{ --vipmb-h: var(--mb-vip-emoji-h); }
    .vipMediaBox[data-kind="sticker"]{  --vipmb-h: var(--mb-sticker-h); }

    .vipMediaBox > img{
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display:block;
      border-radius: 10px;
    }
    .mediaBox{
      position:relative;
      width:100%;
      height:var(--mb-h, 240px);
      overflow:hidden;
      border-radius:12px;
      background:rgba(8,12,20,.7);
      border:1px solid rgba(140,170,255,.25);
      contain: layout paint;
    }
    .mediaBox[data-kind="video"]{ --mb-h: var(--mb-video-h); background:#000; }
    .mediaBox[data-kind="image"]{ --mb-h: var(--mb-image-h); }
    .mediaBox[data-kind="iframe"]{ --mb-h: var(--mb-iframe-h); background:#000; }
    .mediaBox[data-kind="audio"]{ --mb-h: var(--mb-audio-h); }
    .mediaBox[data-kind="ad"]{ --mb-h: var(--mb-ad-h); background:rgba(2,8,23,.7); }

    .mediaBoxItem{
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
    }
    .mediaBox > img,
    .mediaBox > video{
      object-fit:contain;
    }
    .mediaBox > iframe{
      border:0;
    }
    .mediaBoxInner{
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:0 14px;
    }
    .mediaBoxAudio{
      width:100%;
      height:auto;
      color-scheme:dark;
    }   
    :root{
  --vip-emoji-size: 48px;      /* можно быстро настроить под себя */
  --vip-emoji-size-sm: 48px;   /* на мобильных */
}
.vipEmojiBig{
  width: var(--vip-emoji-size);
  height: var(--vip-emoji-size);
  display: inline-block;
  vertical-align: middle;
}
@media (max-width:480px){
  .vipEmojiBig{ width: var(--vip-emoji-size-sm); height: var(--vip-emoji-size-sm); }
} 


/* превью-контейнер и крестик удаления */
.vipComposerPreview{ position:relative; display:inline-block; margin-top:6px }
.vipComposerPreview .vipRemove{
  position:absolute; top:-6px; right:-6px;
  border:0; border-radius:8px; padding:2px 5px; line-height:1;
  background:rgba(0,0,0,.7); color:#fff; cursor:pointer;
}
/* поддержка MOZI-эмодзи (размер — теми же переменными, можно разделить при желании) */
.moziEmojiBig{ width: var(--mozi-emoji-size, var(--vip-emoji-size)); height: var(--mozi-emoji-size, var(--vip-emoji-size)); display:inline-block; vertical-align:middle; }
    .btn, .tag, .iconBtn, .adminBtn, .emojiBtn { cursor:pointer }
    /* === clicky effects for small chips/buttons === */
    .tag,
    .item .tag,
    .reactionBtn {
      cursor: pointer;
      transition: transform .08s ease, box-shadow .18s ease, filter .14s ease;
      user-select: none;
    }

    .tag:hover,
    .item .tag:hover,
    .reactionBtn:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 18px rgba(80,167,255,.25);
      filter: brightness(1.08);
    }

    .tag:active,
    .item .tag:active,
    .reactionBtn:active {
      transform: translateY(0) scale(.97);
    }

    /* компактный вариант для action-кнопок на карточке */
    .btnSm { padding: 6px 8px; font-size: 12px; line-height: 1; }
/* ----- Reply-chip около ника ----- */

@media (max-width: 680px) {
  /* строка с аватаром и ником + чипом ответа */
  .postUserRow {
    display: flex;
    align-items: center;
    flex-wrap: wrap; /* разрешаем перенос на новую строку */
  }

  /* ник не даём сжимать вообще */
  .postUserRow .nick-badge {
    flex-shrink: 0;
  }

  /* сам чип "Ответ для ..." */
  .postUserRow .replyTag {
    font-size: 10px;          /* поменьше шрифт на мобиле */
    line-height: 1.1;
    white-space: normal;      /* разрешаем перенос по словам */
    word-break: normal;
    overflow-wrap: break-word;/* если очень длинный ник/текст – переносим, но не по буквам */

    max-width: 100%;
    flex-basis: 100%;         /* при нехватке места уходит НА СЛЕДУЮЩУЮ СТРОКУ под ником */
    margin-left: 0;           /* под ником, а не сбоку */
    margin-top: 2px;
  }
}

/* --- header: ... --- */
.head{
  position:sticky; top:0; z-index:70; overflow:visible;
  padding:12px 14px;
  border-bottom:1px solid rgba(255,255,255,.1);
  /* collapse animation */
  transition: transform 220ms ease, opacity 160ms ease;
  will-change: transform;
  transform: translateY(0);
  opacity: 1;
}
.headInner{
  display:flex; align-items:center; gap:12px;
  flex-wrap:wrap;
  width:100%;
}
.head.head--collapsed{
  transform: translateY(calc(-100% - 12px));
  opacity: 0;
  pointer-events: none;
}
.headPeekBtn{
  position: fixed;
  left: 50%;
  top: calc(70px + env(safe-area-inset-top, 0px));
  transform: translateX(-50%);
  z-index: 91;
  width: 54px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(0, 255, 255, 0);
  background: rgba(10, 16, 26, 0.21);
  color: rgb(255, 255, 255);
  display:flex;
  align-items:center;
  justify-content:center;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 22px rgb(80, 205, 255), inset 0 0 16px rgba(80, 167, 255, .14);
  cursor:pointer;
}
.headPeekBtn:active{ transform: translateX(-50%) scale(.97); }
.headCollapseBtn{
  position: absolute;
  left: 50%;
  bottom: -45px;
  transform: translateX(-50%);
  z-index: 60;
  width: 54px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(120, 201, 255, 0);
  background: rgb(10, 16, 26);
  color: rgb(255, 255, 255);
  display:flex;
  align-items:center;
  justify-content:center;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 22px rgb(80, 205, 255), inset 0 0 16px rgba(80, 167, 255, .10);
  cursor:pointer;
}
.headCollapseBtn:active{ transform: translateX(-50%) scale(.97); }

.headArrowSvg{ width: 26px; height: 26px; display:block; }
.headArrowSvg.up{ transform: rotate(180deg); transform-origin: 50% 50%; }
.headArrowSvg .chev{
  opacity: .20;
  filter: drop-shadow(0 0 0 rgba(80,167,255,0));
  animation: headChev 1.1s infinite ease-in-out;
}
.headArrowSvg .chev2{ animation-delay: .12s; }
.headArrowSvg .chev3{ animation-delay: .24s; }
@keyframes headChev{
  0%{ opacity:.15; filter: drop-shadow(0 0 0 rgba(80,167,255,0)); }
  35%{ opacity: 1; filter: drop-shadow(0 0 8px rgba(80,167,255,.75)); }
  70%{ opacity:.15; filter: drop-shadow(0 0 0 rgba(80,167,255,0)); }
  100%{ opacity:.15; filter: drop-shadow(0 0 0 rgba(80,167,255,0)); }
}
@media (prefers-reduced-motion: reduce){
  .head{ transition: none; }
  .headArrowSvg .chev{ opacity: .85; }
}
/* [STYLES:BODY-SCOPE] — ограничиваем область действия .body только форумом */
.forum_root .body{ padding:12px; overflow:visible }

/* [STYLES:LAYOUT-FLEX] — делаем «коридор» высоты и скроллящиеся тела секций */
.forum_root{
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.forum_root .grid2{
  /* в рендере ты уже добавил inline flex, дублируем на всякий в CSS, чтобы не зависеть от inline */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;         /* ← даём детям право сжиматься по высоте */
}

/* каждая секция (список тем / выбранная тема) — колонка, занимающая остаток */
.forum_root .grid2 > section{
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;         /* ← критично для появления внутреннего скролла */
}

/* собственно скролл включаем ТОЛЬКО на «телах» секций */
.forum_root .grid2 > section > .body{
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;                 /* стабилизирует высоту области скролла */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
/* [STYLES:OVERFLOW-PROBE] — на всякий, не даём карточке-обёртке резать содержимое */
.forum_root .glass.neon{ overflow: visible !important; }

    /* ДОБАВЬ в Styles() (любой блок <style jsx global>) */
    .tagOk{ border-color: rgba(110,240,170,.45)!important; color:#baf7d6!important; background: rgba(70,210,120,.12)!important }
    .tagDanger{ border-color: rgba(255,120,120,.45)!important; color:#ffb1a1!important; background: rgba(255,90,90,.10)!important }

    /* эффекты клика уже есть: для .btn, .tag, .reactionBtn — hover/active добавлены */

    .btn{ border:1px solid var(--b); background:linear-gradient(180deg, rgba(25,129,255,.28),rgba(25,129,255,.15));
      padding:.62rem .95rem; border-radius:12px; color:var(--ink); display:inline-flex; align-items:center; gap:.6rem;
      box-shadow:0 0 14px rgba(25,129,255,.18); transition:filter .14s, transform .08s, box-shadow .2s; white-space:nowrap }
    .btn:hover{ filter:brightness(1.08); box-shadow:0 0 26px rgba(25,129,255,.32) } .btn:active{ transform:scale(.985) }
    .btnGhost{ background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.16) }

    .tag{ border-radius:10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.14); padding:.35rem .52rem; display:inline-flex; align-items:center; gap:.35rem }
    .item{ border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); border-radius:14px; padding:12px; transition:transform .08s, background .15s }
    .item:hover{ background:rgba(255,255,255,.08); transform:translateY(-1px) }
    .title{ font-size:1.8rem; font-weight:800; letter-spacing:.2px;  color: #febf01ff; }
    .meta{ font-size:.84rem; opacity:.78 }
    .nick{ font-weight:700; letter-spacing:.15px }

    .input,.ta{ width:100%; background:#0b1018; color:var(--ink); border:1px solid rgba(255,255,255,.16); border-radius:12px; padding:.7rem .9rem; outline:none }
    .input:focus,.ta:focus{ box-shadow:0 0 0 2px rgba(80,167,255,.35) }
    .ta{ min-height:80px; resize:vertical }

    .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px }
    @media (max-width:1024px){ .grid2{ grid-template-columns:1fr } }
/* [SCROLL_FIX] — внутри форума .grid2 ДОЛЖНА быть flex-колонкой */
.forum_root .grid2{
  display:flex !important;
  flex-direction:column;
  flex:1 1 auto;
  min-height:0;           /* критично для появления внутреннего скролла */
}

/* каждая секция внутри grid2 — тоже колонка, которая занимает остаток */
.forum_root .grid2 > section{
  display:flex;
  flex-direction:column;
  flex:1 1 auto;
  min-height:0;           /* не даём секции «распереть» родителя по высоте */
}

/* скроллим ИМЕННО тело секции */
.forum_root .grid2 > section > .body{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
}
/* [TOPICS_BODY_OVERRIDE] — жёстко включаем скролл тела в режиме списка тем */
.forum_root[data-view="topics"] .grid2{ min-height:0 !important; }
.forum_root[data-view="topics"] .grid2 > section{
  display:flex !important;
  flex-direction:column !important;
  flex:1 1 auto !important;
  min-height:0 !important;
}
.forum_root[data-view="topics"] .grid2 > section > .body{
  flex:1 1 auto !important;
  min-height:0 !important;
  max-height:none !important;
  overflow-y:auto !important;
  -webkit-overflow-scrolling:touch;
}


    .composer{ position:sticky; bottom:0; z-index:5; border-top:1px solid rgba(255,255,255,.1); background:rgba(10,14,22,.96); padding:.8rem }

    .emojiPanel{ margin-top:10px; background:rgba(10,14,20,.98); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:10px; max-height:300px; overflow:auto }
    .emojiTitle{ font-size:.86rem; opacity:.8; margin:2px 2px 6px }
    .emojiGrid{ display:grid; grid-template-columns: repeat(auto-fit, 38px); gap:6px }
    .emojiBtn{ width:38px; height:38px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05); font-size:22px; color:#fff; transition: transform .06s }
    .emojiBtn:hover{ transform:translateY(-1px); background:rgba(255,255,255,.12) }
    .emojiOutline{ background:none; border:none; padding:0; width:38px; height:38px; display:inline-flex; align-items:center; justify-content:center; color:#eaf4ff }
    /* VIP emoji preview in panel */
.vipEmojiIcon { display:inline-block; width:100%; height:100%; }
.vipEmojiIcon img, .vipEmojiIcon { object-fit:cover; border-radius:8px }

/* Big VIP emoji in posts */
:root{
  --vip-emoji-size: 48px;      /* базовый размер */
  --vip-emoji-size-sm: 40px;   /* на узких экранах */
}
 /* --- Emoji panel tabs --------------------------------------------------- */
.emojiTabs{
  display:flex;
  gap: 6px;
  margin: 0 2px 8px;
}

.emojiTabBtn{
  --btn-h: 28px;
  height: var(--btn-h);
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.06);
  color: #eaf4ff;
  font-size: .88rem;
  line-height: calc(var(--btn-h) - 2px);
  cursor: pointer;
  user-select: none;
  transition: background .12s ease, border-color .12s ease, transform .06s ease;
}

/* hover / focus (оба таба) */
.emojiTabBtn:hover{
  background: rgba(255,255,255,.12);
  transform: translateY(-1px);
}
.emojiTabBtn:focus-visible{
  outline: none;
  box-shadow: 0 0 0 2px rgba(80,167,255,.35);
  border-color: rgba(80,167,255,.55);
}

/* активная вкладка: читаемо и «горит» */
/* более яркий актив */
.emojiTabBtn[aria-pressed="true"]{
  background: linear-gradient(0deg, rgba(80,167,255,.22), rgba(80,167,255,.22));
  border-color: rgba(80,167,255,.65);
  box-shadow: 0 0 0 1px rgba(80,167,255,.35) inset, 0 1px 6px rgba(80,167,255,.18);
}


/* мобильный компакт */
@media (max-width: 420px){
  .emojiTabBtn{
    --btn-h: 26px;
    padding: 0 10px;
    font-size: .84rem;
    border-radius: 8px;
  }
}
 
.vipEmojiBig{
  width: var(--vip-emoji-size);
  height: var(--vip-emoji-size);
  display:inline-block;
  vertical-align:middle;
  image-rendering:auto;
}
@media (max-width:480px){
  .vipEmojiBig{ width: var(--vip-emoji-size-sm); height: var(--vip-emoji-size-sm); }
}

    .iconWrap{ display:flex; flex-wrap:wrap; gap:10px }
    .avaBig{ width:112px; height:112px; border-radius:16px; border:1px solid rgba(1, 204, 255, 0.31); display:grid; place-items:center; font-size:48px; background:rgba(119, 0, 255, 0.09) }
    .avaMini{ width:60px; height:60px; border-radius:10px; font-size:18px }
/* === AVATAR FILL (добавка) ============================= */
    /* плавность для мелких аватарок */
    .profileList .avaMini{
      transition: transform .12s ease-out, box-shadow .12s ease-out, outline-color .12s ease-out;
    }

    /* выбранный аватар — чуть крупнее и с ярким контуром */
    .profileList .avaMini.tag{
      transform: translateY(-2px) scale(1.06);
      box-shadow: 0 0 0 2px rgba(56, 189, 248, .9), 0 0 16px rgba(56, 189, 248, .5);
      outline: 2px solid rgba(15, 118, 110, .8);
      outline-offset: 0;
    }
/* ===== Profile popover: badge + avatar upload (header) ===== */
.profileTopRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin: 4px 0 10px;
}

.profileTopRow .profileBadgeLeft{ min-width:0; }

/* квадратная кнопка справа: по клику — выбор файла; после выбора — превью внутри */
.avaUploadSquare{
  --s: clamp(74px, 14vw, 96px);
  width: var(--s);
  height: var(--s);
  flex: 0 0 auto;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    radial-gradient(120% 120% at 30% 20%, rgba(80,167,255,.20), rgba(0,0,0,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.06),
    0 10px 26px rgba(0,0,0,.35);
  overflow:hidden;
  display:grid;
  place-items:center;
  padding:0;
  position:relative;
  cursor:pointer;
  user-select:none;
  touch-action:none;
}
.avaUploadSquare:focus-visible{
  outline:none;
  box-shadow:
    0 0 0 2px rgba(80,167,255,.35),
    inset 0 0 0 1px rgba(255,255,255,.06),
    0 10px 26px rgba(0,0,0,.35);
}
.avaUploadSquare::before{
  content:"";
  position:absolute;
  inset:-2px;
  border-radius: 16px;
  pointer-events:none;
  background: conic-gradient(
    from 180deg,
    rgba(80,167,255,0) 0deg,
    rgba(80,167,255,.65) 40deg,
    rgba(80,167,255,0) 95deg,
    rgba(155,91,255,.55) 150deg,
    rgba(80,167,255,0) 240deg,
    rgba(80,167,255,.65) 320deg,
    rgba(80,167,255,0) 360deg
  );
  opacity:.35;
  filter: blur(.2px);
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite:exclude;
  -webkit-mask-composite:xor;
  padding:2px;
}

.avaUploadSquareCanvas{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  display:block;
  pointer-events:none;
  /* canvas: внутри рисуем сами, поэтому object-fit НЕ нужен */
  will-change: contents;
}



.avaUploadSquareTxt{
  position:relative;
  z-index:1;
  text-align:center;
  font-size:10px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
  opacity:.78;
  line-height:1.2;
  text-shadow: 0 0 12px rgba(80,167,255,.22);
}

.avaUploadSquareBusy{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  font-size:11px;
  letter-spacing:.08em;
  background: rgba(0,0,0,.35);
  backdrop-filter: blur(3px);
}

/* Зум-строка: всегда следующей строкой и на всю ширину поповера */
.avaZoomWideRow{
  display:flex;
  align-items:center;
  gap:10px;
  margin: 2px 0 12px;
}
.avaZoomWideRow .avaZoomLbl{
  flex:0 0 auto;
  font-size:11px;
  opacity:.78;
  width:44px;
}

/* cyber range */
.cyberRange{
  -webkit-appearance:none;
  appearance:none;
  width:100%;
  height: 28px;
  background: transparent;
  cursor: pointer;
}
.cyberRange:disabled{ opacity:.45; cursor:not-allowed; }
.cyberRange::-webkit-slider-runnable-track{
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    linear-gradient(90deg, rgba(80,167,255,.45), rgba(155,91,255,.35));
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.35), 0 0 18px rgba(80,167,255,.14);
}
.cyberRange::-webkit-slider-thumb{
  -webkit-appearance:none;
  appearance:none;
  width: 18px;
  height: 18px;
  margin-top: -6px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.22);
  background:
    radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,.40), rgba(255,255,255,.08) 60%),
    linear-gradient(180deg, rgba(80,167,255,.55), rgba(155,91,255,.35));
  box-shadow:
    0 0 0 3px rgba(80,167,255,.12),
    0 10px 20px rgba(0,0,0,.35);
}
.cyberRange::-moz-range-track{
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background: linear-gradient(90deg, rgba(80,167,255,.45), rgba(155,91,255,.35));
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.35), 0 0 18px rgba(80,167,255,.14);
}
.cyberRange::-moz-range-thumb{
  width: 18px;
  height: 18px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.22);
  background: radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,.40), rgba(255,255,255,.08) 60%),
              linear-gradient(180deg, rgba(80,167,255,.55), rgba(155,91,255,.35));
  box-shadow: 0 0 0 3px rgba(80,167,255,.12), 0 10px 20px rgba(0,0,0,.35);
}

.avaFileInput{ display:none; }

.avaUploadMini{
  --u:44px;
  width:var(--u);
  height:var(--u);
  border-radius:12px;
  border:1px solid rgba(255,255,255,.10);
  background:rgba(8,10,16,.72);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 10px 22px rgba(0,0,0,.35);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  cursor:pointer;
  overflow:hidden;
}

.avaUploadMiniTxt{
  font-size:10px;
  font-weight:900;
  letter-spacing:.14em;
  opacity:.65;
  display:flex;
  flex-direction:column;
  gap:3px;
  text-transform:uppercase;
}

.avaUploadMiniImg{
  width:100%;
  height:100%;
  object-fit:cover;
}
/* NOTE: duplicate legacy rule removed (was breaking layout with display:absolute) */

/* 1) Контейнер: ничего не меняем кроме обрезки и контекста позиционирования */
.avaBig,
.avaMini{
  overflow: hidden;         /* чтобы лишнее обрезалось по рамке */
  position: relative;       /* нужно, чтобы next/image не «убежал» */
}

/* 2) Обычные <img>/<video>/<canvas>/<svg> внутри — растянуть и покрыть */
.avaBig :is(img, video, canvas, svg),
.avaMini :is(img, video, canvas, svg){
  width: 100%;
  height: 100%;
  object-fit: cover;        /* заполняем без «писем» */
  object-position: center;
  display: block;
  border-radius: inherit;   /* скругление как у контейнера */
}

/* 3) Если используется next/image (img позиционируется абсолютно внутри span) */
.avaBig :is(span, div) > img,
.avaMini :is(span, div) > img{
  inset: 0 !important;      /* растягиваем во весь контейнер */
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
}

/* 4) На всякий случай растянем сам обёрточный span next/image */
.avaBig :is(span, div):has(> img),
.avaMini :is(span, div):has(> img){
  position: absolute;       /* заполняет всю кнопку */
  inset: 0;
}
.avaCropStage{
  position:absolute;
  inset:0;
  transform-origin:center;
  will-change:transform;
}
.avaCropImg{
  width:100%;
  height:100%;
  object-fit:contain;
  pointer-events:none;
  display:block;
}

/* ====== НОВОЕ: правый блок управления в хедере ====== */
.controls{
  margin-left:auto;
  display:flex; align-items:center; gap:6px;
  flex-wrap: nowrap;            /* ← КНОПКИ НЕ ПЕРЕНОСЯТСЯ */
  flex: 1 1 auto;
  min-width: 0;                 /* ← можно ужиматься */
  max-width: 100%;
  order: 2;
}

/* Поиск встроен в .controls и сжимается по ширине на узких экранах */
.search{
  position:relative;
  display:flex; align-items:center; gap:8px;
  z-index:60; overflow:visible;
  flex: 1 1 auto;               /* ← поле поиска резиновое */
  min-width: 80px;              /* нижняя граница на очень узких экранах */
}

/* инпут занимает всё оставшееся место и ужимается первым */
.searchInput{
  flex: 1 1 auto; min-width: 60px; max-width:100%;
  height:40px; border-radius:12px; padding:.55rem .9rem;
  background:#0b1018; color:var(--ink); border:1px solid rgba(255,255,255,.16);
}

/* кнопки/чипы — фикс. ширина, не сжимаются и не переносятся */
.iconBtn,
.sortWrap,
.adminWrap,
.adminBtn{ flex:0 0 auto; }

.iconBtn{ width:40px; height:40px; border-radius:12px; border:1px solid rgba(255,255,255,.18); background:transparent; display:grid; place-items:center; transition:transform .08s, box-shadow .2s }
.iconBtn:hover{ box-shadow:0 0 18px rgba(80,167,255,.25) } .iconBtn:active{ transform:scale(.96) }

.searchDrop{ position:absolute; top:48px; right:0; width:100%; max-height:360px; overflow:auto; border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98); border-radius:12px; padding:8px; z-index:3000 }
.sortDrop{ position:absolute; top:68px; right:100px; width:120px; border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98); border-radius:12px; padding:6px; z-index:3000 }

.starBtn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  
  width:30px;
  height:30px;
  margin-left:6px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.14);
  background:rgba(10,16,28,.25);
}
.starBtn .starPath{
  fill:none;
  stroke:rgba(255,255,255,.75);
  stroke-width:1.8;
  stroke-linejoin:round;
}
.starBtn.on{
  border-color:rgba(255,215,90,.55);
  background:rgba(255,215,90,.12);
}
.starBtn.on .starPath{
  fill:rgba(255,215,90,.95);
  stroke:rgba(255,215,90,.95);
}
.starBtn.dis{ opacity:.45; pointer-events:none; }

.subsCounter{

  position:relative;
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:10px 50px;
  margin-left:0px;
  border-radius:999px;
  border:1px solid rgba(255,215,90,.22);
  background:rgba(10,16,28,.25);
  white-space:nowrap;
  overflow:hidden;
}
.subsCounter .subsRing{
  position:absolute;
  inset:-2px;
  border-radius:999px;
  pointer-events:none;
  background:conic-gradient(
    from 180deg,
    rgba(255,215,90,0) 0deg,
    rgba(255,215,90,.85) 40deg,
    rgba(255,215,90,0) 90deg,
    rgba(255,215,90,.55) 140deg,
    rgba(255,215,90,0) 220deg,
    rgba(255,215,90,.85) 290deg,
    rgba(255,215,90,0) 360deg
  );
  filter:blur(.2px);
  opacity:.75;
  animation:subsRingSpin 2.6s linear infinite;
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite:exclude;
  -webkit-mask-composite:xor;
  padding:2px;
}
@keyframes subsRingSpin{ to{ transform:rotate(360deg); } }

.subsCounter.noAuth{
  border-color:rgba(255,80,80,.35);
  animation:subsNoAuthPulse 1.2s ease-in-out infinite;
}
@keyframes subsNoAuthPulse{
  0%,100%{ box-shadow:0 0 0 0 rgba(255,80,80,.0); }
  50%{ box-shadow:0 0 0 6px rgba(255,80,80,.12); }
}

.subsCounter .subsStar{ color:rgba(255,215,90,.98); font-size:16px; line-height:1; position:relative; z-index:1; }
.subsCounter .subsValue{ font-variant-numeric:tabular-nums; font-size:12px; position:relative; z-index:1; }

@media (max-width:520px){
  .subsCounter{ margin-left:0; margin-top:8px; }
  .qRowRight{ flex-wrap:wrap; }
}
.subsCounter.noAuth{
  border-color:rgba(255,70,70,.55);
  box-shadow:0 0 0 0 rgba(255,70,70,.35);
  animation:subsPulse 1.2s infinite;
}
.subsCounter.noAuth .starDot{ color:rgba(255,70,70,.95); }

@keyframes subsPulse{
  0%{ box-shadow:0 0 0 0 rgba(255,70,70,.35); }
  70%{ box-shadow:0 0 0 10px rgba(255,70,70,0); }
  100%{ box-shadow:0 0 0 0 rgba(255,70,70,0); }
}

.starModeIcon{ color:rgba(255,215,90,.95); }
.starModeOn{ border-color:rgba(255,215,90,.55) !important; }

.starModeBtn{
  width:44px;
  height:44px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.14);
  background:rgba(10,16,28,.25);
}
.starModeBtn .starPath{ fill:none; stroke:rgba(255,215,90,.8); stroke-width:1.8; stroke-linejoin:round; }
.starModeBtn.on{ border-color:rgba(255,215,90,.55); box-shadow:0 0 0 3px rgba(255,215,90,.08); }

.starModeBtn.on .starPath{ fill:rgba(255,215,90,.95); stroke:rgba(255,215,90,.95); }
    .adminWrap{ position:relative; flex:0 0 auto } /* справа от поиска, в рамках .controls */
    .adminBtn{ border:1px solid rgba(255,255,255,.16); border-radius:12px; padding:.55rem .8rem; font-weight:700; letter-spacing:.4px }
    .adminOff{ background:rgba(255,90,90,.10); border-color:rgba(255,120,120,.45); color:#ffb1a1 }
    .adminOn{ background:rgba(70,210,120,.12); border-color:rgba(110,240,170,.45); color:#baf7d6 }
 
    .qft_toast_wrap{ position:fixed; right:16px; bottom:16px; z-index:4000 }
    .qft_toast{ max-width:min(420px,90vw); padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(10,14,22,.94); color:#eaf4ff; box-shadow:0 10px 28px rgba(0,0,0,.45) }
    .qft_toast.ok{ border-color:rgba(70,220,130,.5) } .qft_toast.warn{ border-color:rgba(255,200,80,.5) } .qft_toast.err{ border-color:rgba(255,90,90,.5) }

    /* мини-поповеры */
    .adminPop{
      position:absolute; width: min(62vw, 360px);
      border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98);
      border-radius:12px; padding:10px; z-index:3200; box-shadow:0 10px 30px rgba(0,0,0,.45)
    }
      .profilePop{

      position:absolute; width: min(75vw, 500px);
      border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98);
      border-radius:12px; padding:10px; z-index:3200; box-shadow:0 10px 30px rgba(0,0,0,.45)
    }
    .profileList{ max-height:260px; overflow:auto; padding:4px; border:1px solid rgba(255,255,255,.08); border-radius:10px; background:rgba(255,255,255,.03) }

    /* ===== Avatar Upload UI (ProfilePopover) ===== */
    .profileAvatarHead{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:6px;
    }

    .avaUploadCard{
      flex:0 0 auto;
      display:flex;
      align-items:center;
      justify-content:flex-end;
    }

    .avaUploadBtn{
      width:96px;
      height:34px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(10,16,28,.25);
      color:#eaf4ff;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:0;
      line-height:1;
      cursor:pointer;
      user-select:none;
    }
    .avaUploadLabel{ font-weight:900; letter-spacing:.12em; font-size:11px; opacity:.95; }
    .avaUploadSub{ font-size:10px; opacity:.65; margin-top:2px; }
    @media (hover:hover){
      .avaUploadBtn:hover{ transform:translateY(-1px); filter:saturate(1.15); }
      .avaUploadBtn:active{ transform:translateY(0); }
    }

    .avaCropPanel{
      margin:6px 0 10px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(255,255,255,.03);
      border-radius:12px;
      padding:10px;
      display:grid;
      grid-template-columns: 120px 1fr;
      gap:10px;
      align-items:stretch;
    }

    .avaCropBox{
      width:120px;
      height:120px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(0,0,0,.35);
      overflow:hidden;
      position:relative;
      touch-action:none;
    }

    .avaCropImg{
      position:absolute;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      transform-origin:center center;
      width:auto;
      height:auto;
      max-width:none;
      max-height:none;
      user-select:none;
      pointer-events:none;
    }

    .avaCropHint{
      position:absolute;
      left:8px;
      bottom:8px;
      font-size:10px;
      padding:4px 6px;
      border-radius:10px;
      background:rgba(0,0,0,.35);
      border:1px solid rgba(255,255,255,.10);
      color:rgba(240,248,255,.85);
    }

    .avaCropRight{ display:flex; flex-direction:column; gap:8px; min-width:0; }
    .avaCropMeta{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
    .avaCropName{ font-weight:800; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .avaCropDims{ font-size:11px; opacity:.7; flex:0 0 auto; }

    .avaZoomRow{
      display:flex;
      align-items:center;
      gap:10px;
    }
    .avaZoomTxt{ font-size:11px; opacity:.8; width:44px; }
    .avaZoomRow input[type="range"]{ width:100%; }

    .avaCropBtns{ display:flex; gap:8px; justify-content:flex-end; }

    /* На мобиле делаем превью “выше/ниже”, как ты просил */
    @media (max-width:520px){
      .avaUploadBtn{ width:86px; height:32px; border-radius:12px; }
      .avaCropPanel{
        grid-template-columns: 1fr;
      }
      .avaCropBox{
        width:100%;
        height:140px;   /* чуть выше на мобиле */
      }
    }
/* Вьюпорты: переносим ВЕСЬ ряд под аватар, но внутри — одна строка */
@media (max-width:860px){
  .controls{
    order:3;
    flex:0 0 100%;
    min-width:100%;
    display:flex;
    align-items:center;
    gap:6px;
    flex-wrap:nowrap;         /* ← НЕ ПЕРЕНОСИТСЯ ВНУТРИ */
  }
  .search{ flex:1 1 0; min-width:120px } /* сжимается первой */
}

/* Уже уже: ещё сильнее ужимаем поиск, кнопки остаются */
@media (max-width:560px){
  .head{ padding:10px }
  .controls{
    order:3;
    flex:0 0 100%;
    min-width:100%;
    flex-wrap:nowrap;         /* ← всё ещё одна линия */
  }
  .search{ flex:1 1 0; min-width:90px }
  .iconBtn{ width:36px; height:36px }
}

/* Совсем узко: минимальный допуск для поиска */
@media (max-width:420px){
  .search{ flex:1 1 0; min-width:70px }
}
/* === VIP styles (кнопка + поповер) === */
.iconBtn.vip { border-color: rgba(255,215,0,.55); color:#ffd700; box-shadow:0 0 14px rgba(255,215,0,.25) }
.iconBtn.vipGray { opacity:.85 }
.vipWrap { position:relative }

/* вне медиа: фиксируем, что кнопки/чипы не сжимаются */
.iconBtn,
.sortWrap,
.adminWrap,
.adminBtn{ flex:0 0 auto; }
/* в твои глобалы/модуль */
.emojiGrid.vip { outline: 1px dashed rgba(255,215,0,.25); border-radius: 10px; padding: 6px; }
.emojiBtn.vipAnim { will-change: transform; }
.emojiBtn.vipAnim:hover { transform: translateY(-1px) scale(1.02); }

/* лёгкое подпрыгивание на hover */
.hoverPop {
  transition: filter .12s ease, color .12s ease, background-color .12s ease, border-color .12s ease;
  will-change: auto;
}
@media (hover:hover) {
@media (hover:hover) and (pointer:fine){
  .hoverPop:hover{ filter: brightness(1.06); }
}
.hoverPop:active{ filter: brightness(0.98); }
.hoverPop:focus-visible{
  outline: 2px solid rgba(120, 200, 255, .55);
  outline-offset: 2px;
}
  .hoverPop:active {
    transform: translateY(0) scale(0.98);
  }
}
.vipEmojiIcon { display:block; width:100%; height:100%; object-fit:cover; }
.emojiBtn { position: relative; }
.vipLock { position:absolute; right:-4px; top:-4px; font-size:12px; pointer-events:none; }
.vipComposerPreview{ margin-top:6px; }
:root{ --vip-emoji-size:48px; }
.vipEmojiBig{ display:inline-block; vertical-align:middle; }
.vipComposerPreview{ margin-top:6px; }
:root{ --vip-emoji-size:48px; --vip-emoji-size-sm:32px; }
.vipEmojiBig{ display:inline-block; vertical-align:middle; }
@media (max-width:480px){
  .vipEmojiBig{ width:var(--vip-emoji-size-sm); height:var(--vip-emoji-size-sm); }
}
/* Крупный аккуратный бейдж ника (единый для всех) */
.nick-badge{
  display:inline-flex;
  align-items:center;
  padding:.3rem .6rem;
  border:2px solid transparent;
  border-radius:12px;
  background:
    linear-gradient(#0b1220,#0b1220) padding-box,
    linear-gradient(135deg,#5b9dff,#9b5bff,#ff5bb2) border-box;
  box-shadow:
    0 0 .5rem rgba(91,157,255,.3),
    inset 0 0 .35rem rgba(155,91,255,.18);
  color:#eaf4ff;
  font-weight:800;
  font-size:1.05rem;
  line-height:1;
}
.nick-text{
  max-width:22ch;
  overflow:hidden;
  white-space:nowrap;
  text-overflow:ellipsis;
}
@media (max-width:640px){
  .nick-text{ max-width:16ch; }
}
/* --- VIP badge над ником (20s / 5s) ---
   Настройка позиционирования/размера:
   --vip-badge-w, --vip-badge-h  (размер)
   --vip-badge-gap              (расстояние между бейджем и ником)
   --vip-badge-shift-x/y        (сдвиг бейджа)
*/
:root{
  --vip-badge-w: clamp(42px, 9vw, 54px);
  --vip-badge-h: clamp(42px, 8.2vw, 58px);
  --vip-badge-gap: 2px;
  --vip-badge-shift-x: 0px;
  --vip-badge-shift-y: 0px;
}

.nick-badge.vipNick{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap: var(--vip-badge-gap);
  line-height: 1.1;
}

.vipFlip{

  position:relative;
  width: var(--vip-badge-w);
  height: var(--vip-badge-h);
  transform: translate(var(--vip-badge-shift-x), var(--vip-badge-shift-y));
}

.vipFlipImg{
 
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:contain;
  display:block;
  will-change: opacity;
}

/* общий цикл 25s: 1.png видно 0..20s (80%), 2.png видно 20..25s (20%) */
@keyframes vipFlipA{
  0%, 79.99% { opacity: 1; }
  80%, 100%  { opacity: 0; }
}
@keyframes vipFlipB{
  0%, 79.99% { opacity: 0; }
  80%, 100%  { opacity: 1; }
}
.vipFlipImg.vip1{ animation: vipFlipA 25s infinite linear; }
.vipFlipImg.vip2{ animation: vipFlipB 25s infinite linear; }

@media (prefers-reduced-motion: reduce){
  .vipFlipImg.vip1, .vipFlipImg.vip2{ animation:none; }
  .vipFlipImg.vip2{ opacity:0; }
}


/* ====== АНИМАЦИЯ НИКА ====== */
.nick-animate{
  position: relative;
  /* бегущий градиент по рамке */
  background:
    linear-gradient(#0b1220,#0b1220) padding-box,
    linear-gradient(135deg,#5b9dff,#9b5bff,#ff5bb2,#5b9dff) border-box;
  background-size: 200% 200%, 300% 300%;
  animation: nickGradient 6s linear infinite, nickGlow 2.2s ease-in-out infinite;
}

/* мягкое свечение */
@keyframes nickGlow{
  0%,100%{ box-shadow: 0 0 .5rem rgba(91,157,255,.28), inset 0 0 .35rem rgba(155,91,255,.16) }
  50%   { box-shadow: 0 0 1.15rem rgba(91,157,255,.55), inset 0 0 .55rem rgba(155,91,255,.28) }
}

/* движение градиента рамки */
@keyframes nickGradient{
  0%   { background-position: 0% 0%, 0% 50% }
  100%{ background-position: 200% 200%, 300% 50% }
}

/* уважение к reduced motion */
@media (prefers-reduced-motion: reduce){
  .nick-animate{ animation: none }
}
    /* === char counters === */
    .charRow{
      display:flex; align-items:center; gap:6px;
      margin-top:6px; font-size:.82rem; opacity:.9;
    }
    .charNow{ font-weight:800; letter-spacing:.2px }
    .charSep{ opacity:.6 }
    .charMax{ opacity:.7 }
    .charOver{ color:#ffb1a1; text-shadow:0 0 12px rgba(255,90,90,.25) }
/* --- lockable attach button --- */
.lockable{ position:relative }
.lockable[data-locked="true"]{ opacity:.6; cursor:not-allowed; }
.lockable[data-locked="true"] .clipSvg{ filter:grayscale(1); opacity:.8 }
.lockBadge{
  position:absolute; right:-6px; top:0px;
  font-size:14px; line-height:1;
  background:rgba(15, 25, 45, 0); border:1px solid rgba(255, 140, 140, 0);
  border-radius:8px; padding:2px 4px;
  box-shadow:0 0 10px rgba(90, 120, 255, 0);
}
/* галерея изображений в посте */
.postGallery{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin-top:8px }
.postGallery .thumb{ position:relative; padding:0; border:0; background:transparent; border-radius:8px; overflow:hidden; outline:1px solid rgba(140,170,255,.25) }
.postGallery img{ width:100%; height:100%; object-fit:cover; display:block; aspect-ratio:1 / 1; }

/* лайтбокс */
.lightbox{
  position:fixed; inset:0; background:rgba(8,12,22,.9);
  display:flex; align-items:center; justify-content:center; z-index:1000;
}
.lightbox img{ max-width:96vw; max-height:92vh; border-radius:10px; outline:1px solid rgba(160,180,255,.25) }
.lightbox .nav{
  position:fixed; top:50%; transform:translateY(-50%);
  background:rgba(20,30,55,.7); border:1px solid rgba(160,180,255,.4);
  color:#eaf4ff; font-size:28px; line-height:1; padding:8px 12px; border-radius:10px;
}
.lightbox .prev{ left:16px }
.lightbox .next{ right:16px }
/* локализация только внутри строки композера */
.forumComposer .attachPreviewRow{
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 0 0 8px !important;
}

.forumComposer .attachPreviewItem{
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.forumComposer .attachPreviewItem img{
  display: block;
}

/* cерость могла приходить от глобальных стилей button */
.forumComposer .attachPreviewRow button{
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0;
}

/* а для крестика задаём свой тёмный кружок отдельно */
.forumComposer .attachPreviewRemove{
  position: absolute;
  top: -6px; right: -6px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: rgba(0,0,0,.6) !important;
  color: #fff;
  line-height: 18px;
  font-size: 12px;
  cursor: pointer;
}

/* === Q COIN (инлайн + модалка) === */
.qcoinRow{
  display:inline-flex; align-items:center; gap:10px; margin-left:10px;
}

/* Золотая надпись с переливом и свечением */
.qcoinLabel{
  font-size:2.4em; font-weight:900; letter-spacing:.4px;
  background:
    linear-gradient(135deg,
      #7a5c00 0%,
      #ffd700 18%,
      #fff4b3 32%,
      #ffd700 46%,
      #ffea80 60%,
      #b38400 74%,
      #ffd700 88%,
      #7a5c00 100%);
  background-size:200% 100%;
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation:qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
  text-shadow:0 0 .3rem rgba(255,215,0,.35), 0 0 .1rem rgba(255,255,180,.35);
}
@keyframes qcoinShine{ 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
@keyframes qcoinGlow{
  0%{ text-shadow:0 0 .3rem rgba(255,215,0,.35), 0 0 .1rem rgba(255,255,180,.35) }
  50%{ text-shadow:0 0 .9рем rgba(255,215,0,.55), 0 0 .25rem rgba(255,255,190,.55) }
  100%{ text-shadow:0 0 .3rem rgba(255,215,0,.35), 0 0 .1rem rgba(255,255,180,.35) }
}

/* Само число — крупнее, с «стеклянной» подложкой */
.qcoinValue{
  font-size:1.5em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight:800; padding:.20em .66em; border-radius:.36em;
  border:1px solid rgba(255,255,255,.14);
  background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05));
  backdrop-filter: blur(6px);
}
.qcoinValue.live{ color:#ffd700 }
.qcoinValue.paused{ color:#ff8c8c; animation:blinkPause .9s steps(1) infinite }
@keyframes blinkPause{ 50%{ opacity:.45 } }

/* модалка — скроллим подложку, карточка растягивается по контенту */
.qcoinModal{
  position:fixed; inset:0; z-index:3200;
  display:grid; align-items:start; justify-items:center; /* вместо place-items:center */
  overflow:auto;                     /* скролл у подложки */
  padding:16px 10px;                 /* запас от краёв экрана */
  background:rgba(8,12,22,.8);
}
.qcoinCard{
  width:min(520px, 88vw);            /* ширину НЕ трогаем */
  height:auto !important;
  max-height:none !important;        /* убираем ограничение по высоте */
  overflow:visible !important;       /* без внутреннего скролла */
  border:1px solid rgba(255,255,255,.14); border-radius:14px;
  background:rgba(10,14,20,.96); padding:14px;
  box-shadow:0 10px 30px rgba(0,0,0,.45);
}
.qcoinCardHdr{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px }

/* гиф/аватар — одна версия (убраны дубли) */
.qcoinMini{
  width:  clamp(108px, 12.6vw, 144px);
  height: clamp(108px, 12.6vw, 144px);
  border-radius:10px;
  object-fit:cover;
  border:1px solid rgba(255,215,0,.4);
  flex:0 0 auto;
  background:#000;                   /* на случай загрузки метаданных */
  box-shadow:0 4px 12px rgba(50,80,160,.25);
}

.qcoinPopBody{
  max-height:none !important;        /* снимаем второй лимит */
  overflow:visible !important;       /* скролл не здесь */
}
.qcoinCardHdr img, .qcoinPopBody img{ max-width:100%; height:auto }

/* кнопки (старые) */
.qcoinBtn{
  border:1px solid rgba(255,255,255,.16);
  background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
  padding:.45rem .7rem; border-radius:.7rem; font-weight:700;
  box-shadow:0 0 14px rgba(25,129,255,.18); backdrop-filter: blur(8px);
}
.qcoinBtn.gold{
  border-color:rgba(255,215,0,.55); color:#1a1f2b;
  background:linear-gradient(180deg,#ffe680,#ffd04d);
  box-shadow:0 0 22px rgba(255,215,0,.35);
}

/* НЕОНОВАЯ «Биржа» в модалке */
.qcoinExchangeBtn{
  position:relative;
  padding:.55rem 1rem; border-radius:.8rem; font-weight:800; letter-spacing:.4px;
  color:#0b1220; background:#ffe680; border:1px solid rgba(255,215,0,.65);
  box-shadow:0 0 22px rgba(255,215,0,.35), inset 0 0 12px rgba(255,255,255,.35);
  text-transform:uppercase;
  overflow:hidden; isolation:isolate;
  transition: transform .15s ease-out, box-shadow .15s ease-out;
}
.qcoinExchangeBtn::before{
  content:""; position:absolute; inset:-2px;
  background:
    radial-gradient(60% 80% at 20% 0%, rgba(255,255,255,.35), transparent 60%),
    linear-gradient(135deg, rgba(255,215,0,.35), rgba(255,215,0,.05));
  filter:blur(8px); opacity:.6; z-index:-1;
  animation: exchangeNeon 2.6s ease-in-out infinite;
}
.qcoinExchangeBtn::after{
  content:""; position:absolute; left:-40%; top:-120%; width:80%; height:300%;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent);
  transform: rotate(20deg);
  animation: exchangeShine 3.2s linear infinite;
}
.qcoinExchangeBtn:hover{ transform: translateY(-1px); box-shadow:0 0 28px rgba(255,215,0,.55), inset 0 0 14px rgba(255,255,255,.45) }
.qcoinExchangeBtn:active{ transform: translateY(0) scale(.99) }

@keyframes exchangeNeon{
  0%,100%{ box-shadow:0 0 22px rgba(255,215,0,.35) }
  50%    { box-shadow:0 0 36px rgba(255,215,0,.55) }
}
@keyframes exchangeShine{
  0%{ left:-40% } 100%{ left:140% }
}

/* анимации off при reduced motion */
@media (prefers-reduced-motion: reduce){
  .qcoinLabel{ animation:none }
  .qcoinValue.paused{ animation:none }
  .qcoinExchangeBtn::before, .qcoinExchangeBtn::after{ animation:none }
}

.forumSingle { display: grid; gap: 16px; }
.panel { background: rgba(10,14,22,.96); border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:12px; }
.panelTitle { margin:0 0 8px; font-weight:600; opacity:.9; }


.forumTopbar{
  display:flex; gap:8px; align-items:center; justify-content:space-between;
  margin-bottom:10px; flex-wrap:wrap;
}
.forumTopbar .left{ display:flex; gap:6px; align-items:center; }
.forumTopbar .right{ display:flex; gap:6px; align-items:center; }

/* карточки можно переиспользовать из левой/правой колонок без изменений */

/* === Thread view: фикс обрезаний справа и стопроцентная адаптивность === */
.forum_root, .forum_root * { box-sizing: border-box; }

/* Ключевое: позволяем детям в grid/flex сжиматься, убираем «невидимую» половину */
.forum_root .body,
.forum_root .head,
.forum_root .title,
.forum_root .composer { max-width: 100%; min-width: 0; }

/* Список постов внутри .body может быть grid/flex — тоже даём сжиматься */
.forum_root .body > .grid,
.forum_root .body > .flex { min-width: 0; }

/* На всякий — если используется двухколоночная сетка .grid2 */
.grid2 > * { min-width: 0; }

/* Вертикальный скролл, а по X — не режем (контент сам сожмётся) */
.forum_root .body { overflow-y: auto; overflow-x: visible; }

/* Липкий композер растягиваем по ширине контейнера-скролла */
.forum_root .composer { left: 0; right: 0; width: auto; }

/* === FIX: кнопки действий в карточках постов всегда в один ряд и сжимаются === */

/* 1) Страхуем контейнеры карточек от обрезания контента */
[id^="post_"],
[id^="post_"] > div,
.postCard {
  min-width: 0;         /* позволяет flex-детям сжиматься */
  overflow: visible;    /* исключает внутреннее «подрезание» */
}

/* 2) Ряд с кнопками действий поста: запрещаем перенос, даём сжатие */
[id^="post_"] .actions,
.postCard .actions,
.post .actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;    /* никогда не переносить на вторую строку */
  min-width: 0;
  overflow: visible;
  white-space: nowrap;  /* тексты на кнопках в одну строку */
}
/* [ACTIONS-SHRINK-EXTRA] ещё сильнее разрешаем сжатие на сверхузких */
.post .actions .btn,
.post .actions .iconBtn {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
}
.post .actions .btn > span { 
  display: inline-block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 3) Сами кнопки: разрешаем сжиматься, уменьшаем паддинги и шрифт по мере сужения */
[id^="post_"] .actions .btn,
[id^="post_"] .actions .iconBtn,
.postCard .actions .btn,
.postCard .actions .iconBtn,
.post .actions .btn,
.post .actions .iconBtn {
  flex: 0 1 auto;                    /* можно сжиматься */
  min-width: 0;                      /* чтобы не держали ширину */
  height: clamp(26px, 4.2vw, 32px);  /* ниже — уже неудобно нажимать */
  padding-inline: clamp(6px, 1.4vw, 12px);
  padding-block: 4px;
  font-size: clamp(11px, 1.6vw, 14px);
  line-height: 1;                    /* компактнее строка */
}

/* 4) Если в кнопке есть текстовый сын — пусть он ужимается с троеточием */
[id^="post_"] .actions .btn > span,
.postCard .actions .btn > span,
.post .actions .btn > span {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 5) На сверхузких — чуть уменьшаем зазоры, но всё ещё в один ряд */
@media (max-width: 360px) {
  [id^="post_"] .actions,
  .postCard .actions,
  .post .actions {
    gap: 6px;
  }
  [id^="post_"] .actions .btn,
  [id^="post_"] .actions .iconBtn,
  .postCard .actions .btn,
  .postCard .actions .iconBtn,
  .post .actions .btn,
  .post .actions .iconBtn {
    padding-inline: clamp(4px, 1.2vw, 10px);
    font-size: clamp(10px, 1.4vw, 13px);
    height: clamp(24px, 3.8vw, 30px);
  }
}
/* === FIX: перенос длинных title/description в карточках тем === */

/* страхуем контейнеры карточек тем от «расталкивания» соседей */
[id^="topic_"],
.topicCard {
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden; /* не даём горизонтальный скролл из-за длинных слов */
}

/* заголовок темы */
[id^="topic_"] .title,
.topicCard .title,
[id^="topic_"] h2,
.topicCard h2,
[id^="topic_"] h3,
.topicCard h3 {
  white-space: normal !important;   /* разрешаем перенос строк */
  overflow-wrap: anywhere;          /* переносим даже «слитки» символов */
  word-break: break-word;           /* классический перенос длинных слов */
  hyphens: auto;                    /* расставляем мягкие переносы там, где можно */
  min-width: 0;
  max-width: 100%;
}

/* описание темы (подзаголовок/превью) */
[id^="topic_"] .desc,
.topicCard .desc,
[id^="topic_"] .subtitle,
.topicCard .subtitle,
[id^="topic_"] p.topic-desc,
.topicCard p.topic-desc {
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  min-width: 0;
  max-width: 100%;
}

/* если внутри попадаются длинные URL — не ломаем раскладку, но переносим */
[id^="topic_"] .title a,
[id^="topic_"] .desc  a,
.topicCard .title a,
.topicCard .desc  a {
  word-break: break-all;    /* адрес можно рубить в любом месте */
  overflow-wrap: anywhere;
  text-decoration: inherit;
}

/* на сверхузких — слегка уменьшаем межстрочные/отступы, чтобы текст «умещался красиво» */
@media (max-width: 360px) {
  [id^="topic_"] .title,
  .topicCard .title { line-height: 1.15; }
  [id^="topic_"] .desc,
  .topicCard .desc  { line-height: 1.2; }
}
/* === HARD FIX: темы не вылезают, любые длинные строки переносятся === */

/* 0) Страхуем карточку темы и всех её детей: можно сжиматься, нельзя распихивать */
[id^="topic_"],
.topicCard {
  max-width: 100% !important;
  min-width: 0 !important;
  overflow-x: hidden !important;
}
[id^="topic_"] * ,
.topicCard * {
  min-width: 0 !important;            /* ключ к нормальному сжатию во flex/grid */
}

/* 1) Сам заголовок темы — ломаем даже «оооооооо» и длинные URL/слитки */
[id^="topic_"] .title,
.topicCard .title,
[id^="topic_"] h1, [id^="topic_"] h2, [id^="topic_"] h3,
.topicCard h1, .topicCard h2, .topicCard h3 {
  display: block;
  white-space: normal !important;
  overflow-wrap: anywhere !important;  /* главный герой */
  word-break: break-word !important;   /* классика */

  hyphens: auto;
  max-width: 100%;

} 


/* Текстовые узлы внутри заголовка (span/a/strong и т.п.) — тоже ломаем */
[id^="topic_"] .title *, .topicCard .title * {
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
}

/* 2) Описание темы — те же правила */
[id^="topic_"] .desc,
.topicCard .desc,
[id^="topic_"] .subtitle,
.topicCard .subtitle,
[id^="topic_"] p.topic-desc,
.topicCard p.topic-desc {
  display: block;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
  hyphens: auto;
  max-width: 100%;
}

/* Любые ссылки внутри title/desc — позволяем рубить в любом месте */
[id^="topic_"] .title a,
[id^="topic_"] .desc a,
.topicCard .title a,
.topicCard .desc a {
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
}

/* 3) Если шапка карточки — flex/grid: контентная колонка должна иметь min-width:0 */
[id^="topic_"] .header,
.topicCard .header,
[id^="topic_"] .content,
.topicCard .content {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden;                   /* на всякий, чтобы не появлялся горизонтальный скролл */
}

/* 4) Бейджи/аватар не тянут ширину: не растягиваются и не ломают строку */
[id^="topic_"] .avatar,
.topicCard .avatar,
[id^="topic_"] .badge,
.topicCard .badge {
  flex: 0 0 auto;
}

/* 5) На сверхузких — уменьшаем межстрочные, чтобы визуально аккуратно умещалось */
@media (max-width: 360px) {
  [id^="topic_"] .title,
  .topicCard .title { line-height: 1.15; }
  [id^="topic_"] .desc,
  .topicCard .desc  { line-height: 1.2; }
}
/* === FORCE WRAP for topic title/desc (перекрываем старые правила) === */
.topicTitle, .topicTitle * {
  white-space: normal !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;

  max-width: 100% !important;
}
.topicDesc, .topicDesc * {
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;

  max-width: 100% !important;
}

/* OWNER kebab/menu — общий для тем и постов */
.ownerKebab { position: absolute; right: 8px; top: 8px; }
.kebabBtn{
  width:28px; height:28px; border:0; border-radius:6px;
  background:rgba(255,255,255,.06); color:#eaf4ff; cursor:pointer;
}
.kebabBtn:hover{ filter:brightness(1.1); }
.ownerMenu{
position:absolute; right:0; top:30px; display:flex; flex-direction:column; gap:6px;
padding:8px; background:rgba(12,18,34,.96); border:1px solid rgba(170,200,255,.14);
  border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.35); z-index:20; visibility:hidden;
}
.ownerKebab:focus-within .ownerMenu,
.ownerKebab:hover .ownerMenu{ visibility:visible; }
.ownerMenu .danger{
  padding:8px 10px; border-radius:8px; background:rgba(255,60,60,.12); color:#ff6a6a; border:1px solid rgba(255,80,80,.25);
}
.ownerMenu .danger:hover{ filter:brightness(1.1) saturate(1.05); }
/* [FOCUS_TOOLS_STYLES:BEGIN] — панель инструментов композера по фокусу */
.composer .tools{
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: max-height .2s ease, opacity .2s ease;
}
.composer[data-active="true"] .tools{
  max-height: 480px; /* достаточно для 2-3 рядов */
  opacity: 1;
  pointer-events: auto;
}
/* [FOCUS_TOOLS_STYLES:END] */
/* === sticky bottom fix === */
.forum_root[data-view="topics"] .body { padding-bottom: 0 !important; margin-bottom: 0 !important; }
.forum_root[data-view="thread"] .body { padding-bottom: 96px !important; } /* высота композера + чуть воздуха */
.forum_root .body > :last-child { margin-bottom: 0 !important; }

/* title wrap in thread header */
.forum_root .head .title,
.forum_root .head .title * {
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
  min-width: 0;
}
/* [STICKY-HEADER] верхний блок всегда прилипает к верху окна прокрутки форума */
.forum_root .head {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--glass, rgba(8,13,20,.94));
  backdrop-filter: saturate(140%) blur(8px);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid rgba(255,255,255,.06);
}
/* [BACK-TO-TOP] плавающая кнопка наверх (над композером) */
.backToTop{
  position: fixed;
  right: clamp(12px, 3vw, 20px);
  bottom: clamp(110px, 12vh, 140px);
  z-index: 40;
  padding: .55rem .7rem;
  font-size: 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(20,26,36,.8);
  color: #fff;
  box-shadow: 0 6px 20px rgba(0,0,0,.35);
  transition: transform .2s ease, opacity .2s ease;
}
.backToTop:hover{ transform: translateY(-1px); }
@media (max-width: 480px){
  .backToTop{ bottom: clamp(84px, 16dvh, 120px); }
}
/* === PostCard: перевод текста === */
.translateToggleBtn {
  position: relative;
  display: flex;                 /* растягиваем контент по ширине */
  align-items: center;
  justify-content: center;       /* текст и иконки по центру */

  width: 100%;                   /* ВСЯ ширина карточки */
  box-sizing: border-box;
  margin-top: 8px;               /* отступ от даты */
  margin-left: 0;                /* больше не нужен смещающий left */

  gap: 8px;                      /* у тебя было 70x — опечатка */
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background:
    radial-gradient(circle at top left, rgba(0, 200, 255, 0.22), rgba(7, 10, 24, 0.96));
  color: #e5f2ff;
  font-size: 15px;
  line-height: 1.1;
  cursor: pointer;
  overflow: hidden;
  opacity: 0.9;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease,
    transform 0.12s ease,
    opacity 0.12s ease;
}

.translateToggleBtn:hover:not(:disabled) {

  box-shadow: 0 0 18px rgba(0, 200, 255, 0.75);
  border-color: rgba(0, 200, 255, 0.95);
  background:
    linear-gradient(120deg, rgba(0, 200, 255, 0.35), rgba(255, 188, 56, 0.45));
  opacity: 1;
}

.translateToggleBtnOn {
  border-color: rgba(255, 188, 56, 0.95);
  box-shadow: 0 0 20px rgba(255, 188, 56, 0.75);
  background:
    linear-gradient(120deg, rgba(255, 188, 56, 0.5), rgba(0, 200, 255, 0.35));
}

.translateToggleBtn:disabled {
  cursor: default;
  opacity: 0.6;
  box-shadow: none;
}

.translateToggleIcon {
  font-size: 13px;
}

/* текст внутри — под обрез, чтобы на маленьких экранах не ломало разметку */
.translateToggleText {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* адаптив: чуть меньше шрифт и паддинги на узких экранах */
@media (max-width: 640px) {
  .translateToggleBtn {
    padding: 8px 10px;
    font-size: 13px;
  }
}

/* компактнее, чем .btnSm — под иконки/счётчики */
.btnXs{
  padding: 3px 6px;
  font-size: 11px;
  line-height: 1;
  height: 26px;            /* удобный минимум */
  border-radius: 10px;
}
@media (max-width:360px){
  .btnXs{ padding: 2px 5px; font-size: 10px; height: 24px; }
}
  /* Полоса действий поста: кнопки занимают доступную ширину и сжимаются без скролла */
  .actionBar > * { min-width: 0; }                /* детям разрешаем сжиматься */
  .actionBar .btnXs { flex: 1 1 0; min-width: 0; }/* сами маленькие кнопки — гибкие */
  .actionBar .tag  { min-width: 0; }              /* счётчики тоже не фиксируем */
/* ---- VOICE dock ---- */
.forumComposer { position: relative; --voice-size: 48px; --voice-right: 10px; }

.voiceDock{
  position:absolute;
  right: var(--voice-right);
  bottom: calc(-1 * (var(--voice-size) - 4px));
  display:inline-flex; align-items:center; gap:8px;
  pointer-events:auto;
  height: var(--voice-size);
  z-index: 1; /* ниже поповеров/тостов */
}

/* прячем док, когда композер не активен */
.composer:not([data-active="true"]) .voiceDock{
  opacity: 0; pointer-events: none;
  transform: translateY(4px) scale(.98);
  transition: opacity .12s ease, transform .12s ease;
}
.composer[data-active="true"] .voiceDock{
  opacity: 1; pointer-events: auto;
  transition: opacity .12s ease, transform .12s ease;
}

/* кнопка микрофона */
.voiceBtn{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  width:var(--voice-size); height:var(--voice-size);
  border-radius:50%; border:0; background:transparent;
  color:#cfe0ff; cursor:pointer;
  transition: transform .12s ease, filter .18s ease;
}
.voiceBtn:hover{ filter:brightness(1.08) saturate(1.1); }
.voiceBtn:active{ transform:translateY(1px) scale(.98); }

/* запись */
.voiceBtn.rec{

  box-shadow:0 0 0 2px rgba(255,90,90,.9), 0 0 14px 2px rgba(255,90,90,.25);
  color:#ffd1d1;
}
.voiceBtn .recDot{
  position:absolute; top:6px; right:6px; width:7px; height:7px; border-radius:50%;
  background:#ff5959; box-shadow:0 0 6px rgba(255,0,0,.75);
}

/* авто-масштаб иконки под размер кнопки */
.voiceBtn svg{
  width:calc(var(--voice-size)*.46);
  height:calc(var(--voice-size)*.46);
}
    .micBtn { position: relative; }
    .micBtn .micTimer{
      position:absolute; top:-30px; left:50%; transform:translateX(-50%);
      font-size:11px; line-height:1; padding:5px 10px; border-radius:4px;
      background:rgba(252, 0, 0, 0.34); color:#fff; pointer-events:none;
    }
/* бейдж-замок: по умолчанию скрыт */
.voiceBtn .lockBadge{
  position:absolute; top:-4px; right:-4px;
  display:none; align-items:center; justify-content:center;
  width:16px; height:16px; border-radius:50%;
  font-size:11px; line-height:1;
  background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.18);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.6));
  pointer-events:none; z-index:2; /* поверх svg */
}
/* показать замок, когда нет VIP — ровно как у скрепки */
.voiceBtn[data-locked="true"] .lockBadge{
  display:inline-flex;
}
/* таймер-пилюля над кнопкой */
.voiceTimerPill{
  position:absolute; right:0; bottom:calc(var(--voice-size) + 8px);
  padding:4px 10px; border-radius:999px;
  font:600 12px/1 ui-monospace,monospace;
  color:#ffecec;
  background:rgba(255,80,80,.22);
  border:1px solid rgba(255,120,120,.45);
  box-shadow:0 6px 16px rgba(255,80,80,.18), inset 0 0 0 1px rgba(255,255,255,.04);
  backdrop-filter: blur(6px) saturate(120%);
}

/* ---- AUDIO card (превью + пост) ---- */
.audioCard{
  position:relative;
  display:flex; align-items:center; gap:10px;
  padding:10px 12px; border-radius:12px;
  background:linear-gradient(180deg, rgba(18,26,46,.45), rgba(12,18,34,.35));
  border:1px solid rgba(160,180,255,.22);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.03), 0 10px 30px rgba(10,20,40,.22);
  backdrop-filter: blur(8px) saturate(120%);
}
  .audioCard.mediaBox{
  display:block;
  padding:0;
  border-radius:12px;
}
.audioCard.preview{ max-width:min(90%, 520px); }

.audioIcon{
  width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center;
  color:#9fb7ff; opacity:.95;
}
  .audioCard.mediaBox .audioIcon{
  position:absolute;
  top:10px;
  left:12px;
  z-index:2;
  background:rgba(5,10,18,.4);
  border-radius:8px;
  padding:4px;
}
.audioCard audio{ display:block; width:100%; color-scheme:dark; }
/* убираем серую плашку у Chromium */
.audioCard audio::-webkit-media-controls-panel{ background:transparent !important; }
.audioCard audio::-webkit-media-controls-enclosure{ background:transparent !important; }
.audioCard audio::-webkit-media-controls{ background:transparent !important; }

.audioRemove{
  position:absolute; top:30px; left:5px;
  width:18px; height:18px; border-radius:50%;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:18px; line-height:1;
  background:rgba(0, 0, 0, 0.51); border:1px solid rgba(255, 255, 255, 0.27);
}

.qcastPlayer{
  position:absolute;
  inset:0;
  display:flex;
  align-items:stretch;
  justify-content:center;
  background:#060b16;
  cursor:pointer;
}
.qcastCover{
  width:100%;
  height:100%;
  object-fit:cover;
}
.qcastAudio{
  position:absolute;
  width:1px;
  height:1px;
  opacity:0;
  pointer-events:none;
}
.qcastControls{
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  padding:12px 14px 10px;
  display:flex;
  flex-direction:column;
  gap:8px;
  background:linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,.78) 35%, rgba(5,8,16,.92) 100%);
  opacity:0;
  transform:translateY(8px);
  transition:opacity .2s ease, transform .2s ease;
  pointer-events:none;
}
.qcastControls[data-visible="1"]{
  opacity:1;
  transform:translateY(0);
  pointer-events:auto;
}
.qcastRow{
  display:flex;
  align-items:center;
  gap:10px;
}
.qcastRowTop{
  justify-content:flex-start;
}
.qcastBtn{
  width:36px;
  height:36px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(10,14,26,.6);
  color:#eaf2ff;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transition:transform .12s ease, box-shadow .2s ease;
}
.qcastBtn:hover{ transform:translateY(-1px); box-shadow:0 0 12px rgba(124,161,255,.35); }
.qcastIcon{ width:18px; height:18px; fill:currentColor; }
.qcastRowTimeline{
  gap:8px;
}
.qcastTime{
  font:600 11px/1 ui-monospace,monospace;
  color:#d8e4ff;
  min-width:42px;
  text-align:center;
}
.qcastRange{
  flex:1;
  appearance:none;
  height:4px;
  border-radius:999px;
  background:rgba(255,255,255,.25);
  outline:none;
}
.qcastRange::-webkit-slider-thumb{
  appearance:none;
  width:14px;
  height:14px;
  border-radius:50%;
  background:#fff;
  box-shadow:0 0 10px rgba(255,255,255,.45);
}
.qcastRange::-moz-range-thumb{
  width:14px;
  height:14px;
  border-radius:50%;
  background:#fff;
  border:0;
}
.qcastRowSpeed{
  gap:6px;
  flex-wrap:wrap;
}
.qcastSpeed{
  padding:4px 8px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.2);
  background:rgba(10,14,26,.55);
  color:#dbe7ff;
  font-size:11px;
}
.qcastSpeed.active{
  background:rgba(140,170,255,.85);
  color:#091227;
  border-color:rgba(180,210,255,.95);
}
.qcastRemove{
  font-size:20px;
  margin-left:auto;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.25);
  background:rgba(10,14,26,.65);
  color:#fff;
  padding:4px 10px;
}  
.loadMoreFooter{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  padding:12px 0 4px;
  color:#cfe0ff;
  font-size:12px;
  opacity:.85;
}
.loadMoreShimmer{
  position:relative;
  overflow:hidden;
  padding:6px 16px;
  border-radius:999px;
  border:1px solid rgba(140,170,255,.25);
  background:rgba(8,12,20,.6);
  box-shadow: inset 0 0 18px rgba(80,167,255,.08);
}
.loadMoreShimmer::after{
  content:'';
  position:absolute;
  inset:-40% -60%;
  background:linear-gradient(110deg, transparent 35%, rgba(140,170,255,.35) 50%, transparent 65%);
  animation: shimmer 1.6s linear infinite;
}
@media (prefers-reduced-motion: reduce){
  .loadMoreShimmer::after{ animation: none; }
}
@keyframes shimmer{
  0%{ transform: translateX(-60%); }
  100%{ transform: translateX(60%); }
}
.loadMoreSentinel{ width:100%; height:1px; }
/* --- avatar + nick (ник всегда под аватаром) --- */
.avaNick{
  display:inline-flex;
  align-items:center; justify-content:center;
  margin-top:14px;
  width:84px; 
   width:120px;                  /* = ширина твоего .avaBig; если другая — подставь её */
  text-align:center;
  max-width:clamp;
  padding:2 88px;
  white-space:nowrap;          /* не переносим ник */
  overflow:hidden; text-overflow:ellipsis;
}

/* --- правая полоса с Q COIN --- */
.qRowRight{
  /* контейнер QCoin занимает всю правую часть и по высоте ровно аватар */
  flex:1 1 auto; min-width:0; width:100%;
  align-self:center;                      /* центр по колонке аватара */
  height:var(--ava-size);
  display:flex; align-items:center; justify-content:flex-end; /* прижимаем контент вправо */
  /* тонкая вертикальная подстройка от середины аватара (можно крутить инлайном) */
  --qcoin-y: 0px;
  transform: translateY(var(--qcoin-y));
  transform-origin:left center;
}

/* сам блок QCoin растягивается на всю доступную ширину,
   но не переносится и не вылазит */
.qRowRight > *{
  flex:1 1 auto; min-width:0; width:100%;
  display:inline-flex; align-items:center; justify-content:flex-end;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  text-align:right;
  font-size:clamp(12px, 2.8vw, 24px);     /* адаптивный размер шрифта */
  max-width:100%;
}

/* --- Поповер QCoin контейнер --- */
.qcoinPop{
  /* если у тебя уже стоит position/left/top/width — оставь их */
  max-width: 520px;
  z-index: 3200;
}

/* Карточка: делаем колоночный лэйаут с прокручиваемым body */
.qcoinCard{
  display:flex; flex-direction:column;
  max-height: min(72vh, 1060px);   /* ограничим высоту поповера */
  overflow:hidden;                /* скролл только в body */
}

/* Шапка фикс сверху */
.qcoinCardHdr{
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; padding:10px 12px;
  border-bottom:1px solid rgba(160,180,255,.15);
}

/* Тело: именно оно скроллится */
.qcoinPopBody{
  padding:12px; overflow:auto;
  overscroll-behavior: contain;
  max-height: 100%;
}

/* --- Полоса действий: всегда один ряд, адаптивно сжимается --- */
.qcActions{
  display:flex; flex-wrap:nowrap; gap:10px;
  align-items:center; justify-content:space-between;
  padding:10px 12px; border-top:1px solid rgba(160,180,255,.15);
}

.qcBtn{
  flex:1 1 0;                    /* равные доли, сжиматься можно */
  min-width:0;                   /* позволяем ужиматься реально */
  white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis;
  font-size: clamp(12px, 2.6vw, 14px);
  line-height: 1.15;
  padding: 10px 12px;
}

/* Спецэффект на "Биржа" — лёгкий шимер + неоновый ховер */
.qcBtn.qcExchange{
  position:relative;
  border:1px solid rgba(160,180,255,.28);
  background: linear-gradient(180deg, rgba(20,28,52,.35), rgba(12,18,34,.3));
}
.qcBtn.qcExchange::after{
  content:"";
  position:absolute; inset:0;
  background: linear-gradient(120deg, transparent 0%, rgba(170,200,255,.10) 35%, transparent 70%);
  transform: translateX(-120%);
  transition: transform .6s ease;
  pointer-events:none;
}
.qcBtn.qcExchange:hover::after{ transform: translateX(0%); }
.qcBtn.qcExchange:hover{
  box-shadow: 0 0 12px rgba(120,160,255,.22), inset 0 0 0 1px rgba(255,255,255,.05);
  border-color: rgba(180,200,255,.45);
}

/* "Вывод" — золотая, когда доступно; серая, когда disabled */
.qcBtn.qcWithdraw[disabled]{
  opacity:.7;
  border:1px solid rgba(160,180,255,.22);
  background: linear-gradient(180deg, rgba(18,26,46,.38), rgba(12,18,34,.32));
  cursor:not-allowed;
}
.qcBtn.qcWithdraw:not([disabled]){
  color:#1d1400;
  background:
    linear-gradient(180deg, rgba(255,233,140,1) 0%, rgba(255,220,90,1) 60%, rgba(250,205,70,1) 100%);
  border:1px solid rgba(255,210,80,.9);
  box-shadow:
    0 6px 18px rgba(255,200,80,.25),
    inset 0 0 0 1px rgba(255,255,255,.35);
}
.qcBtn.qcWithdraw:not([disabled]):hover{
  filter: saturate(1.1) brightness(1.03);
}

/* На очень узких экранах — жмём плотнее */
@media (max-width: 360px){
  .qcBtn{ font-size: clamp(11px, 3.2vw, 13px); padding:8px 10px; }
}
.topicTitle{ font-size: clamp(16px, 2.2vw, 18px); line-height: 1.25; }
.topicDesc { line-height: 1.35; }

/* --- TopicItem: аватар слева, ник справа В ОДНУ СТРОКУ --- */
.item .topicUserRow{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:nowrap;   /* запрещаем перенос ника вниз */
  min-width:0;        /* разрешаем реальное сжатие строки */
}
.item .topicUserRow .avaMini{
  flex:0 0 auto;      /* аватар фиксированный */
}
 .item .topicUserRow .nick-badge{
   display:inline-flex;
   align-items:center;
   flex:0 1 auto;        /* ← больше НЕ растягиваемся */
   min-width:0;
   width:auto;
   max-width:clamp(96px, 40vw, 240px);  /* аккуратный предел для обрезки */
 }
 .item .topicUserRow .nick-badge .nick-text{
   display:block;
   white-space:nowrap;
   overflow:hidden;
   text-overflow:ellipsis;
   max-width:100%;
 }
 /* PostCard: аватар слева, ник справа — одна строка, без растяжения */
.item .postUserRow{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:nowrap;
  min-width:0;
}
.item .postUserRow .avaMini{ flex:0 0 auto; }
.item .postUserRow .nick-badge{
  display:inline-flex;
  align-items:center;
  flex:0 1 auto;      /* не растягиваемся на всю ширину */
  min-width:0;
  width:auto;
  max-width:clamp(96px, 40vw, 260px);  /* аккуратный предел под ellipsis */
}
.item .postUserRow .nick-badge .nick-text{
  display:block;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  max-width:100%;
}
/* ---- INBOX (конверт справа в шапке списка) ---- */
.head .flex.items-center.justify-between{ flex-wrap:nowrap; } /* не переносим ряд */

.iconBtn.inboxBtn{
  position:relative;
  display:inline-flex; align-items:center; justify-content:center;
  width:42px; height:42px;
  border:0; background:transparent; color:#cfe0ff;
  transition: transform .12s ease, filter .18s ease;
}
.iconBtn.inboxBtn:hover{ filter:brightness(1.08) saturate(1.08); }
.iconBtn.inboxBtn:active{ transform:translateY(1px) scale(.98); }

/* красный бейдж непрочитанного */
.inboxBadge{
  position:absolute; right:-2px; top:-2px;
  min-width:16px; height:16px; padding:0 4px;
  display:inline-flex; align-items:center; justify-content:center;
  font:600 10px/1 ui-monospace,monospace;
  color:#fff; background:#ff4d4d;
  border:1px solid rgba(255,255,255,.45);
  border-radius:999px;
  box-shadow:0 0 10px rgba(255,60,60,.5);
}

/* тело «Inbox» — карточки ровно как посты */
.inboxList{ display:grid; gap:10px; }
.inboxEmpty{ opacity:.75; padding:8px 2px; }

/* ---- INBOX button ---- */
.iconBtn.inboxBtn{
  position:relative;
  /* делаем крупной и без фона */
  width: 64px !important;
  height: 64px !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  color: #cfe0ff;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transition: transform .12s ease, filter .18s ease;
}
.iconBtn.inboxBtn svg{
  width: 38px !important;
  height: 38px !important;
}
.iconBtn.inboxBtn:hover{ filter:brightness(1.08) saturate(1.08); }
.iconBtn.inboxBtn:active{ transform: translateY(1px) scale(.98); }

/* красный бейдж */
.inboxBadge{
  position:absolute; right:-2px; top:-2px;
  min-width:16px; height:16px; padding:0 4px;
  display:inline-flex; align-items:center; justify-content:center;
  font:600 10px/1 ui-monospace,monospace;
  color:#fff; background:#ff4d4d;
  border:1px solid rgba(255,255,255,.45);
  border-radius:999px;
  box-shadow:0 0 10px rgba(255,60,60,.5);
}
/* ---- ATTACH (скрепка) — стиль как у voiceBtn ---- */
.attachBtn{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  /* единый размер; можно переопределить через inline style: '--attach-size':'56px' */
  --attach-size: 48px;
  width: var(--attach-size); height: var(--attach-size);
  border:0; background:transparent; color:#cfe0ff;
  cursor:pointer; transition: transform .12s ease, filter .18s ease;
}
.attachBtn:hover{ filter:brightness(1.08) saturate(1.1); }
.attachBtn:active{ transform:translateY(1px) scale(.98); }

/* состояние «замок» */
.attachBtn[data-locked="true"]{ opacity:.55; cursor:not-allowed; filter:saturate(.6); }

/* авто-масштаб иконки под размер кнопки */
.attachBtn svg{ width:calc(var(--attach-size)*.46); height:calc(var(--attach-size)*.46); }

/* бейдж-замок, как у микрофона */
.attachBtn .lockBadge{
  position:absolute; top:-4px; right:-4px;
  display:none; align-items:center; justify-content:center;
  width:16px; height:16px; border-radius:50%;
  font-size:11px; line-height:1;
  background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.18);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.6));
  pointer-events:none; z-index:2;
}
.attachBtn[data-locked="true"] .lockBadge{ display:inline-flex; }
.input.ok  { outline:2px solid rgba(80,220,140,.9); box-shadow:0 0 12px rgba(80,220,140,.25); }
.input.bad { outline:2px solid rgba(255,110,110,.95); box-shadow:0 0 12px rgba(255,110,110,.25); }

/* Q COIN: золотой мигающий бейдж ×2 справа от лейбла */
.qcoinLabel{
  display:inline-flex; align-items:center; gap:8px;
}
.qcoinX2{
  display:inline-flex; align-items:center; justify-content:center;
  min-width: 48px; height: 28px; padding: 0 6px;
  border-radius: 999px;
  font: 700 16px/1.1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto;
  letter-spacing: .5px;
  color:#211;             /* тёмный текст не нужен — делаем «свечение» текста */
  background: linear-gradient(180deg,#ffde6a,#ffbc3d);
  box-shadow:
     0 0 12px rgba(255,210,90,.45),
     inset 0 0 0 1px rgba(255,255,255,.25),
     0 1px 0 0 rgba(0,0,0,.35);
  color: #1a1200;
  text-shadow: 0 0 8px rgba(255,220,120,.65);
  position: relative;
  overflow: hidden;
  animation: qcoinX2Pulse 1.6s ease-in-out infinite;
}
  /* Базовый вид .qcoinX2 уже есть */

/* Активный VIP — золотой с переливом (повторяем эффекты заголовка) */
.qcoinX2.vip{
  background:
    linear-gradient(135deg,
      #7a5c00 0%, #ffd700 18%, #fff4b3 32%, #ffd700 46%,
      #ffea80 60%, #b38400 74%, #ffd700 88%, #7a5c00 100%);
  background-size:200% 100%;
  color:#1a1000;
  border:1px solid rgba(255,215,0,.45);
  box-shadow:0 0 18px rgba(255,215,0,.25);
  animation:qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
  cursor:default;
}

/* Не VIP — заметно мигает красным и кликабельно */
.qcoinX2.needVip{
  background:rgba(255,70,70,.18);
  color:#fff;
  border:1px solid rgba(255,120,120,.6);
  box-shadow:0 0 12px rgba(255,70,70,.35);
  animation:blinkPause .9s steps(1) infinite;
  cursor:pointer;
}

@keyframes qcoinX2Pulse{
  0%,100%{ filter:brightness(1); box-shadow:
     0 0 10px rgba(255,210,90,.3),
     inset 0 0 0 1px rgba(255,255,255,.22),
     0 1px 0 0 rgba(0,0,0,.35); }
  50%{ filter:brightness(1.15); box-shadow:
     0 0 16px rgba(255,210,90,.7),
     inset 0 0 0 1px rgba(255,255,255,.35),
     0 1px 0 0 rgba(0,0,0,.35); }
}
 .qcoinCol{
  flex-direction: column;       /* теперь колонкой */
  align-items: flex-end;        /* выравнивание вправо, как и раньше */
  gap: 18px;                     /* вертикальный зазор между строками */
}
.qcoinTop{
  display: inline-flex;
  align-items: center;
  gap: 20px;                     /* расстояние между Q COIN и ×2 */
}
    
/* Базовая икон-кнопка без фона */
.iconBtn{
  display:inline-flex; align-items:center; justify-content:center;
  width:46px; height:46px;
  border-radius:10px;
  background:transparent;
  color:#cfe0ff;
  border:1px solid transparent;
  transition: transform .12s ease, box-shadow .18s ease, color .12s ease, border-color .18s ease;
  cursor:pointer;
}
.iconBtn.ghost{
  background:transparent;
  border-color: rgba(160,180,255,.12);
}
.iconBtn:hover{
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(80,140,255,.15), inset 0 0 0 1px rgba(255,255,255,.04);
  border-color: rgba(160,180,255,.28);
  color:#eaf4ff;
}
.iconBtn:active{
  transform: translateY(0) scale(.98);
  box-shadow: 0 2px 10px rgba(80,140,255,.12), inset 0 0 0 1px rgba(255,255,255,.03);
}
.iconBtn[disabled], .iconBtn[aria-disabled="true"]{
  opacity:.5; cursor:not-allowed;
  filter:saturate(.6);
}

/* SVG автоподгон */
.iconBtn svg{ display:block; width:30px; height:30px; }
/* встроенный композер */
.forumComposer { position: relative; }

.taWrap{
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  border-radius: 14px;
  background: rgba(10,16,24,.55);
  backdrop-filter: blur(8px) saturate(120%);
  border: 1px solid rgba(255,255,255,.08);
  padding: 12px 64px;      /* место под рельсы */
  padding-left: 10px;
  padding-right: 10px;
  min-height: 50px;
}
.taWrap::before,
.taWrap::after{
  content:"";
  position:absolute; top:8px; bottom:8px; width:1px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,.12), transparent);
  pointer-events:none;
}
.taWrap::before{ left:0px; }
.taWrap::after { right:0px; }

.taInput{
  width:100%;
  min-height:10px;
  max-height:240px;
  resize:vertical;
  background:transparent;
  border:0; outline:none;
  color:#eaf1ff; font:inherit; line-height:1.35;
}



/* кнопки-иконки */
.iconBtn{
  position:relative;
  display:inline-flex; align-items:center; justify-content:center;
  width:36px; height:36px; border-radius:10px;
  border:1px solid rgba(160,180,255,.25);
  background: rgba(20,30,55,.55);
  color:#cfe0ff; cursor:pointer;
  transition: transform .12s ease, filter .2s ease, opacity .2s ease;
}
.iconBtn:hover{ filter:brightness(1.08) saturate(1.08); }
.iconBtn:active{ transform: translateY(1px) scale(.98); }
.iconBtn.ghost{ background:rgba(12,18,28,.35); border-color:rgba(160,180,255,.15); }
.iconBtn.locked{ opacity:.6; cursor:not-allowed; filter:saturate(.75); }
.iconBtn svg{ width:22px; height:22px; }

.iconBtn .lockBadge{
  position:absolute; top:-4px; right:-4px;
  display:inline-flex; align-items:center; justify-content:center;
  width:16px; height:16px; border-radius:50%;
  font-size:11px; line-height:1;
  background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.18);
  pointer-events:none;
}

/* самолётик */
.planeBtn .plane{ fill:#2b8cff; width:22px; height:22px; }
.planeBtn.disabled .plane{ fill:none; stroke:#6f88b3; stroke-width:1.8; opacity:.7; }

/* микрофон при записи */
.micBtn.rec{
  box-shadow:0 0 0 2px rgba(255,90,90,.9), 0 0 14px 2px rgba(255,90,90,.25);
  color:#ffd1d1;
}
 .questBtn.red{
   background:#ff2340; color:#fff;
   box-shadow:0 0 0 1px rgba(255,0,32,.35) inset, 0 6px 18px -8px rgba(255,0,32,.45);
 }
 .questBtn.green{
   background:#16a34a; color:#fff;
   box-shadow:0 0 0 1px rgba(22,163,74,.35) inset, 0 6px 18px -8px rgba(22,163,74,.45);
 }

 /* Quest vibro button (в поповере QCoin) */
 .questBtn{
   display:inline-flex; align-items:center; gap:8px;
   background:#ff2340; color:#fff; border:0;
   padding:6px 10px; border-radius:10px; font-weight:700;
   box-shadow:0 0 0 1px rgba(255,0,32,.35) inset, 0 6px 18px -8px rgba(255,0,32,.45);
 }
 .questBtn:hover{ filter:brightness(1.05) saturate(1.05); }
 .questBtn:active{ transform:translateY(1px) scale(.98) }
 .questBtn .dot{ width:8px; height:8px; border-radius:50%; background:#fff }
 .questBtn.vibrate{
   animation: quest-vibrate .38s infinite cubic-bezier(.36,.07,.19,.97);
 }
 .questBtn.blink{
   animation: quest-blink 1.1s infinite;
 }
 @keyframes quest-vibrate{
   0% { transform: translate(0); }
   20% { transform: translate(-1px, 1px) rotate(-0.5deg); }
   40% { transform: translate( 1px,-1px) rotate( 0.6deg); }
   60% { transform: translate(-1px, 0px) rotate(-0.4deg); }
   80% { transform: translate( 1px, 1px) rotate( 0.4deg); }
   100%{ transform: translate(0); }
 }
 @keyframes quest-blink{
   0%, 60%, 100% { filter: none; }
   30% { filter: drop-shadow(0 0 10px rgba(255,0,32,.75)); }
 }
/* === QUEST: full-width cards, like TopicItem/PostCard === */
.questList { display: grid; gap: .5rem; }
.questItem {                       /* базовый контейнер квеста */
  width: 100%;                     /* во всю ширину колонки */
}
.questItem.item {                  /* наследуем визуал от .item */
  padding: 10px 12px;
  min-height: auto;                /* по контенту */
}
/* превью и заголовки */
.questHead{ display:flex; align-items:center; gap:.6rem; }
.questThumb{
  width: 98px; height: 98px; border-radius: .6rem;
  object-fit: cover; flex: 0 0 38px;
}
.questTitle{ font-weight:700; line-height:1.15; }
.questMeta{ font-size:.82rem; opacity:.8; }

/* задачи внутри квеста — те же полноширинные карточки */
.questTaskList{ display:grid; gap:.5rem; }
.questTask.item{ padding:10px 12px; }
.questTask .right{ margin-left:auto; display:flex; align-items:center; gap:.5rem; }

/* состояния кнопок выполнения */
.btnQuest.do     { background:#1e66ff; }
.btnQuest.done   { background:#16a34a; }
.btnQuest.locked { background:#7a7a7a; cursor:not-allowed; opacity:.7; }

/* мини-счётчик */
.miniCounter{
  position:absolute; left:10px; bottom:6px;
  font-size:12px; opacity:.75; user-select:none;
}
.miniCounter .sep{ opacity:.6; padding:0 2px; }
.miniCounter .max{ opacity:.75; }
.miniCounter .over{ color:#ff7f7f; opacity:1; }

/* старые элементы композера прячем (если остались в DOM) */
.tools{ display:none !important; }
/* Базовая икон-кнопка */
.iconBtn{
  -webkit-tap-highlight-color: transparent;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255,255,255,.18);
  background: transparent;
  color: #d9e6ff;
  border-radius: 12px;
  cursor: pointer;
  transition: transform .12s ease, filter .15s ease, border-color .15s ease, background-color .15s ease;
  outline: none;
}
.iconBtn[disabled],
.iconBtn[aria-disabled="true"]{
  opacity: .85;
  cursor: not-allowed;
  filter: saturate(.7);
}

/* Большой контурный плюс */
.bigPlus{
  width: 48px;
  height: 48px;
  border-radius: 14px;
  backdrop-filter: blur(6px);
  background: rgba(255,255,255,.03);
}
.bigPlus:hover{ 
  filter: brightness(1.08) saturate(1.06);
  border-color: rgba(255,255,255,.32);
  background: rgba(255,255,255,.06);
}
.bigPlus:active{ transform: translateY(1px) scale(.98); }
.iconBtn:focus-visible{ box-shadow: 0 0 0 3px rgba(100,150,255,.35); }
.iconBtn svg{ width: 28px; height: 28px; display: block; }

@media (prefers-color-scheme: dark){
  .iconBtn{ border-color: rgba(255,255,255,.16); }
}
/* Полоса над списком тем с кнопкой-плюсом */
.createTopicRow{
  /* отступ сверху от шапки блока тем */
  margin-block-start: 8px;        /* = margin-top, логично для RTL */
  /* внутренний паддинг, чтобы плюс не прилипал к левому бордюру карточки */
  padding-inline-start: 10px;     /* = padding-left в LTR, padding-right в RTL */
  padding-inline-end: 10px;
  padding-block-start: 6px;
  padding-block-end: 0;
}

/* сам плюс — небольшой зазор от верхней кромки и левого борта */
.createTopicRow .bigPlus{
  margin-block-start: 2px;        /* ↓ отступ от верхней кромки */
  margin-inline-start: 6px;       /* ← отступ от левого (или правого в RTL) */
}

/* если хочется чуть больше воздуха над первой карточкой темы */
.createTopicRow + .item,
.createTopicRow + div .item{
  margin-block-start: 14px;        /* первая карточка тем отъедет вниз */
}

/* на очень узких экранах можно слегка увеличить внутренние поля */
@media (max-width: 420px){
  .createTopicRow{
    padding-inline-start: 12px;
    padding-inline-end: 12px;
    margin-block-start: 10px;
  }
}

/* Единая горизонтальная рельса — визуально как сам композер */
.topRail{
  width:100%;
  margin-bottom:8px;
}
.topRail .railInner{
  display:grid;
  grid-template-columns: repeat(6, 1fr); /* 6 равных зон */
  align-items:center;
  gap: clamp(8px, 2vw, 16px);
  padding: 8px 10px;

  /* подгон под стиль композера */
  border:1px solid rgba(255, 255, 255, 0);
  border-radius:14px;
  background: rgba(10, 14, 22, 0);
  box-shadow: 0 0 0 1px rgba(255,255,255,.02) inset;
  backdrop-filter: blur(6px);
}

.topRail .railItem{
  display:flex;
  justify-content:center;
  align-items:center;
  min-width:0;
}

.topRail .iconBtn{
  width:36px; height:36px;
  display:inline-flex; align-items:center; justify-content:center;
  padding:0; /* не меняем твои классы, только габариты */
}

.topRail .miniCounter{
  display:inline-flex; align-items:center; gap:4px;
  font-size:12px; opacity:.8;
}

/* Чтоб между рельсой и полем ввода было ровно как по бокам раньше */
.taWrap { gap: 8px; display:flex; flex-direction:column; }

/* ===========================================
   Q-shine: мягкий золотой перелив для карточек
   =========================================== */
 /* Золотой VIP-перелив для суммы награды — как у .qcoinX2.vip */
.goldReward{
  display:inline-block;
  font-weight:800;
  font-size:1.15rem;
  letter-spacing:.02em;
  /* тот же градиент и скорость «shine», что у qcoinX2.vip */
  background:
    linear-gradient(135deg,
      #7a5c00 0%, #ffd700 18%, #fff4b3 32%, #ffd700 46%,
      #ffea80 60%, #b38400 74%, #ffd700 88%, #7a5c00 100%);
  background-size:200% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent; /* сам текст «золотится» градиентом */
  /* свечение как у бейджа X2 */
  text-shadow:
     0 0 8px  rgba(255,220,120,.65),
     0 0 18px rgba(255,215,0,.35);
  filter: drop-shadow(0 0 8px rgba(255, 211, 90, 0));
  animation: qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
  white-space:nowrap;
}
.goldReward.big{
  font-size:1.35rem;
}
/* Кадры анимаций — в точности повторяем идею бейджа X2 */
@keyframes qcoinShine {
  0%   { background-position:   0% 50% }
  100% { background-position: 200% 50% }
}
@keyframes qcoinGlow {
  0%,100% { text-shadow: 0 0 8px rgba(255,220,120,.55), 0 0 16px rgba(255,215,0,.25) }
  50%     { text-shadow: 0 0 12px rgba(255,220,120,.85), 0 0 24px rgba(255,215,0,.45) }
}

.qshine{
  position: relative;
  isolation: isolate;          /* псевдо-элементы не вылезают наружу */
  overflow: hidden;            /* срезаем блик по радиусу */
  /* лёгкое тёплое свечение рамки */
  box-shadow:
    0 0 0 1px rgba(255,215,130,.16) inset,
    0 0 0 0 rgba(255,215,130,0),
    0 10px 24px -18px rgba(255,200,120,.25);
}

/* тонкая «золотая» кромка, переливающаяся по кругу (очень деликатно) */
.qshine::before{
  content:"";
  position:absolute; inset:-1px; border-radius:inherit; pointer-events:none;
  background:
    conic-gradient(from 0deg,
      rgba(255,199,120,.22),
      rgba(255,230,160,.08) 20%,
      rgba(255,255,255,0) 33%,
      rgba(255,230,160,.10) 60%,
      rgba(255,199,120,.22) 100%);
  -webkit-mask: 
    linear-gradient(#000 0 0) content-box, 
    linear-gradient(#000 0 0); /* вычитаем внутренность — остаётся «рамка» */
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  padding:1px;                 /* толщина «рамки» */
  opacity:.6;
  animation: qshine-rotate 9s linear infinite;
}
 
/* вариант: блик только на hover/focus — добавь класс .qshine-hover вместо .qshine */
.qshine-hover::after{ opacity:0; transform: translateX(-70%) rotate(8deg); }
.qshine-hover:hover::after,
.qshine-hover:focus-within::after{
  opacity:.8; animation: qshine-sweep 1.8s ease-out forwards;
}

/* анимации */
@keyframes qshine-rotate{
  from{ transform: rotate(0deg);   }
  to  { transform: rotate(360deg); }
}
@keyframes qshine-sweep{
  0%   { transform: translateX(-70%) rotate(8deg); }
  48%  { transform: translateX(70%)  rotate(8deg); }
  100% { transform: translateX(80%)  rotate(8deg); }
}

/* уважение к reduce-motion */
@media (prefers-reduced-motion: reduce){
  .qshine::before{ animation: none; }
  .qshine::after { animation: none; opacity:.12; }
}

/* если эффект хочется сделать чуть тише/ярче — вот ручки */
.qshine[data-intensity="soft"]::after{ opacity:.4 }
.qshine[data-intensity="hard"]{ box-shadow:0 0 0 1px rgba(255,215,130,.22) inset, 0 12px 28px -14px rgba(255,200,120,.35); }
.qshine[data-intensity="hard"]::after{ opacity:.85 }
 .tag.ok{ background:#16a34a; color:#fff; border-color:#15803d }
.tag.info{ background:#6366f1; color:#fff; border-color:#4f46e5 }
.tag.warn { background:#ef4444; color:#fff; border:1px solid #dc2626 } /* как было */

/* увеличенный крестик в превью VIP/MOZI */
.emojiRemoveBtn {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 30px;
  height: 30px;
  line-height: 30px;
  font-size: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s ease;
}
.emojiRemoveBtn:hover {
  transform: scale(1.2);
}

/* размер превью VIP/MOZI в composer */
.emojiPreviewBig {
  width: 80px;
  height: 80px;
  display: inline-block;
  vertical-align: middle;
}

/* размер VIP/MOZI в постах */
.emojiPostBig {
  width: 64px;
  height: 64px;
  display: inline-block;
  vertical-align: middle;
}
/* обёртка под крупные эмодзи в карточке */
.emojiPostWrap {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 0;
}

/* размер VIP/MOZI эмодзи в карточках */
.emojiPostBig {
  width: 250px;
  height: 250px;
  display: inline-block;
  vertical-align: middle;
  transition: transform .15s ease;
}
.emojiPostBig:hover {
  transform: scale(1.08);
}

/* при необходимости для MOZI можно задать свой размер */
.moziEmojiBig.emojiPostBig {
  width: 84px;
  height: 84px;
}
/* Абсолютно «чистая» картинка: ни фона, ни рамок, ни подсветки фокуса */
.questIconPure {
  width: var(--quest-w, 64px);
  height: var(--quest-h, auto);
  display: inline-block;
  background: transparent !important;
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0;
  margin: 0;
  cursor: var(--quest-cursor, pointer);
  image-rendering: auto;
  transform: translateY(var(--quest-y, 0));
/* убираем мобильный tap-highlight, выделение и кольца фокуса */
  -webkit-tap-highlight-color: transparent;
  -webkit-focus-ring-color: rgba(0,0,0,0);
  -webkit-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* Выключенное состояние */
.questIconPure[aria-disabled="true"] {
  opacity: 0.5;
  pointer-events: none;
}

/* гасим визуальный «клик»/focus */
.questIconPure:active,
.questIconPure:focus,
.questIconPure:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* на всякий случай — убираем подсветку выделения пикчи при тапе/дабл-тапе */
.questIconPure::selection {
  background: transparent;
} 
/* === Forum Topic Title Controls === */
:root{
  --forum-topic-title-font: var(--font-forum-title), system-ui, -apple-system, "Segoe UI", sans-serif;
  --forum-topic-title-size: 25px;
  --forum-topic-title-color: #fec301ff;
}

/* Единый стиль заголовков тем в форуме */
.forum_root [id^="topic_"] .title,
.forum_root .topicCard .title,
.forum_root .topicTitle,
.forum_root [id^="topic_"] h1,
.forum_root [id^="topic_"] h2,
.forum_root [id^="topic_"] h3,
.forum_root .topicCard h1,
.forum_root .topicCard h2,
.forum_root .topicCard h3 {
  font-family: var(--forum-topic-title-font) !important;
  font-weight: 800;
  font-size: var(--forum-topic-title-size) !important;
  color: var(--forum-topic-title-color) !important;

  letter-spacing: .06em;
  text-transform: none;

  /* лёгкий «крипто-неон» спецэффект */
  text-shadow:
    0 0 6px rgba(0, 200, 255, 0.55),
    0 0 14px rgba(0, 0, 0, 0.85);
}
/* общий липкий док внизу окна — держит композер и FAB на месте */
.composeDock{
  position: sticky;
  bottom: 0;
  z-index: 40;          /* поверх контента со скроллом */
  pointer-events: none; /* сам док клики не перехватывает */
}
/* его дети кликабельны */
.composeDock > *{ pointer-events: auto; }

/* прячем композер, когда он выключен — если у тебя это уже есть, оставь своё */
.composer:not([data-active="true"]){
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
  transition: transform .18s ease, opacity .12s ease;
}

/* FAB внутри дока: позиционируем к правому нижнему углу дока */
.fabCompose{
  --fab-size: 50px;
  --fab-right: 16px;   /* можно менять позицию */
  --fab-bottom: 36px;  /* можно менять позицию */

  position: absolute;
  right: max(var(--fab-right), env(safe-area-inset-right));
  bottom: max(var(--fab-bottom), env(safe-area-inset-bottom));
  width: var(--fab-size);
  height: var(--fab-size);
  border: 0;
  border-radius: 50%;
  background: #00aeff8c;
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 28px rgba(252, 191, 7, 0.47), 0 0 24px rgba(248, 249, 252, 1);
  cursor: pointer;
  z-index: 4000;
  transition: transform .12s ease, filter .14s ease, box-shadow .18s ease;
}
.fabCompose svg{ width: 28px; height: 28px; display:block; }

/* прячем FAB, когда композер активен */
.composer[data-active="true"] ~ .fabCompose{
  opacity: 0; transform: translateY(4px) scale(.98); pointer-events: none;
}


`}</style>
)


/* =========================================================
   constants (иконки/эмодзи)
========================================================= */
const ICONS = '👦 👧 🧑 🧑‍🦱 🧑‍🦰 🧑‍🦳 🧑‍🦲 🧔 🧕 🧑‍🎓 🧑‍💻 🧑‍🚀 🕵️ 🦸 🦹 🧑‍✈️ 🧑‍🎤 🤖 👺 👻 👽 😼 😺 😾 🦊 🐼 🐻 🐨 🐯 🐸'.split(' ')
// ---------- Helpers ----------
const _dedupe = (arr) => Array.from(new Set(arr.filter(Boolean)));
const _split = (s) => _dedupe(s.trim().split(/\s+/));
const _mkFlag = (iso2) => {
  const A = 0x1F1E6; // REGIONAL INDICATOR A
  return String.fromCodePoint(...iso2.toUpperCase().split('').map(c => A + (c.charCodeAt(0) - 65)));
};

// ---------- Data pools ----------
const FLAG_ISO = _split(`
  US GB EU UA PL FR DE ES IT PT NL SE NO DK FI IS IE CH AT BE CZ SK HU RO BG GR TR
  CA MX BR AR CL PE CO VE UY PY BO
  CN JP KR HK TW SG MY TH VN PH ID IN PK BD LK NP AE SA IL QA KW OM BH JO EG MA TN ZA NG KE GH ET DZ
  AU NZ FJ PG
`).map(_mkFlag);

const CLOCKS = _split('🕐 🕜 🕑 🕝 🕒 🕞 🕓 🕟 🕔 🕠 🕕 🕡 🕖 🕢 🕗 🕣 🕘 🕤 🕙 🕥 🕚 🕦 🕛 🕧');
const KEYPADS = _split('0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ *️⃣ #️⃣ 🔟');
const ARROWS  = _split('⬆️ ⬇️ ⬅️ ➡️ ↗️ ↘️ ↙️ ↖️ ↩️ ↪️ ⤴️ ⤵️ 🔼 🔽 ▶️ ◀️ ⏩ ⏪ ⏫ ⏬');

const SEED_SMILEYS = _split(`
  😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 😐 😑 😶 🙄
  😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥱 😤 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 🤯
  😵 😵‍💫 😴 🤤 🤧 🤮 🤢 🤒 🤕 🤠 😎 🤓 🥸 🤥 🤫 🤭 🫢 🫣 🤔 🫡 🤗 🫶 😶‍🌫️ 😮‍💨 😮‍💫
  👻 💀 ☠️ 👽 👾 🤖 🎃
`);
const SEED_HANDS = _split(`
  👍 👎 👊 ✊ 🤛 🤜 ✋ 🤚 🖐 🖖 👋 🤙 💪 🙏 🤝 👏 🙌 🤲 👐 🫶
  👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 ☝️ 👆 👇 👉 👈 ✍️
  🤜🏻 🤜🏼 🤜🏽 🤜🏾 🤜🏿  👍🏻 👍🏼 👍🏽 👍🏾 👍🏿  👋🏻 👋🏼 👋🏽 👋🏾 👋🏿
`);
const SEED_PEOPLE = _split(`
  👶 🧒 👦 👧 🧑 👨 👩 🧓 👴 👵
  🧔 🧔‍♂️ 🧔‍♀️ 👱 👱‍♂️ 👱‍♀️ 👨‍🦰 👩‍🦰 👨‍🦱 👩‍🦱 👨‍🦳 👩‍🦳 👨‍🦲 👩‍🦲
  👮 👮‍♂️ 👮‍♀️ 👷 👷‍♂️ 👷‍♀️ 💂 💂‍♂️ 💂‍♀️ 🕵️ 🕵️‍♂️ 🕵️‍♀️
  👨‍⚕️ 👩‍⚕️ 👨‍🎓 👩‍🎓 👨‍🏫 👩‍🏫 👨‍⚖️ 👩‍⚖️ 👨‍🌾 👩‍🌾
  👨‍🍳 👩‍🍳 👨‍🔧 👩‍🔧 👨‍🏭 👩‍🏭 👨‍💼 👩‍💼 👨‍🔬 👩‍🔬 👨‍💻 👩‍💻
  👨‍🎤 👩‍🎤 👨‍🎨 👩‍🎨 👨‍✈️ 👩‍✈️ 👨‍🚀 👩‍🚀 👨‍🚒 👩‍🚒
  🤵 👰 🤵‍♂️ 👰‍♀️ 👩‍❤️‍👨 👨‍❤️‍👨 👩‍❤️‍👩 💑 💏
  🤱 🧑‍🍼 👩‍🍼 👨‍🍼 👯 👯‍♂️ 👯‍♀️ 💃 🕺 🕴️
  🧘 🧘‍♂️ 🧘‍♀️ 🏃 🏃‍♂️ 🏃‍♀️ 🚶 🚶‍♂️ 🚶‍♀️
  🧎 🧎‍♂️ 🧎‍♀️ 🧍 🧍‍♂️ 🧍‍♀️
  🧑‍🦽 👨‍🦽 👩‍🦽 🧑‍🦼 👨‍🦼 👩‍🦼
`);
const SEED_ANIMALS = _split(`
  🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐽 🐸 🐵 🙈 🙉 🙊
  🐒 🦍 🦧 🦮 🐕 🐩 🐺 🐈 🐈‍⬛
  🐴 🦄 🐎 🐂 🐃 🐄 🐖 🐗 🐏 🐑 🐐 🦌
  🐘 🦣 🦏 🦛 🦒 🐫 🐪 🐿️ 🦫 🦦 🦥 🦨
  🐍 🦎 🐢 🐊 🐉 🐲
  🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🦑 🦐 🦞 🦀 🪼
  🐚 🐌 🦋 🐛 🐜 🐝 🪲 🦗 🕷️ 🕸️ 🦂 🪳 🪰 🪱 🐾
`);
const SEED_FOOD = _split(`
  🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝
  🍅 🍆 🥑 🥦 🥬 🧄 🧅 🥔 🥕 🌽 🫑 🥒 🫘 🥜 🌰
  🍞 🥐 🥖 🫓 🥨 🥯 🧇 🥞 🧀
  🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🫔 🥙 🧆 🥘 🍲
  🍛 🍣 🍱 🥟 🥠 🥡 🍜 🍝 🍚 🍥
  🍰 🎂 🧁 🍮 🍨 🍧 🍦 🍩 🍪 🍫 🍬 🍭 🍯
  ☕ 🍵 🧉 🧋 🥤 🥛 🍶 🍺 🍻 🍷 🥂 🍸 🍹 🍾
`);
const SEED_ACTIVITIES = _split(`
  ⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🪀 🏓 🏸 🥅 🥊 🥋 🥏 🪁
  ⛳ 🏌️ 🏌️‍♂️ 🏌️‍♀️ 🏇 🧗 🧗‍♂️ 🧗‍♀️
  🚴 🚴‍♂️ 🚴‍♀️ 🚵 🚵‍♂️ 🚵‍♀️ 🛼 ⛸️ 🎿 ⛷️ 🏂
  🎣 🏹 🤿 🛶 🚣 🚣‍♂️ 🚣‍♀️
  🎽 🎖️ 🏆 🥇 🥈 🥉
  🎟️ 🎭 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🎸 🪗
  🎮 🕹️ 🎲 ♟️ 🧩 🧸 🎯 🎳 🎰
`);
const SEED_TRAVEL = _split(`
  🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🚚 🚛 🚜 🛻
  🛵 🏍️ 🚲 🛴 🦽 🦼
  ✈️ 🛫 🛬 🛩️ 🚁 🚀 🛸
  ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 🛶
  🚂 🚆 🚇 🚊 🚉 🚝 🚞 🚈 🚅 🚄
  🛰️ 🛗 🛝 🛤️ 🛣️ 🗺️
  🏙️ 🏗️ 🏭 🏠 🏡 🏘️ 🏚️ 🏥 🏦 🏫 🏛️ 🕌 🛕 ⛪ 🕍
  🗽 🗼 🗿 🏰 🏯 ⛩️ 🌉
`);
const SEED_OBJECTS = _split(`
  ⌚ 📱 💻 🖥️ 🖨️ ⌨️ 🖱️ 🖲️ 💽 💾 💿 📀
  📷 📸 🎥 📹 📼 📡 📺 📻
  🔊 🔉 🔈 🔇 🧭 ⏱️ ⏲️ ⏰ ⏳ ⌛
  🔋 🔌 💡 🔦 🕯️ 🧯 🔧 🔨 ⚒️ 🛠️ 🧱 ⚙️ 🪛 🪚 🪜 ⚗️ 🧪 🧫 🧬 🔬 🔭
  💊 💉 🩹 🩺 🩻
  🧰 🧲 🧵 🧶 🪡 🪢
  📦 📫 📮 📬 📭 📪 📩 ✉️ 📧
  📰 📖 📚 📒 📓 📔 📕 📗 📘 📙 📑 🔖
  ✏️ ✒️ 🖋️ 🖊️ 🖌️ 🖍️ 📝 📎 🖇️ 📐 📏 📌 📍
  🔒 🔓 🔑 🗝️ 🧿 🪬
  💼 🎒 🧳 🛍️ 👝 👛 👜 👓 🕶️ 🥽
  🧴 🧼 🪥 🧻 🧽 🪣
`);
const SEED_SYMBOLS = _split(`
  ❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 💖 💗 💓 💞 💕 💘 💝 💟 ❣️ 💔 ❤️‍🔥 ❤️‍🩹
  💬 💭 🗯️ 💢 💥 💦 💨 ✨ ⭐ 🌟 💫 🎇 🎆
  🔥 ⚡ ❄️ 💧 🌈 ☀️ ⛅ ☁️ 🌧️ ⛈️ 🌩️ 🌨️ 🌪️ 🌫️ 🌙 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔
  ♻️ ♾️ ⛔ 🚫 ❌ ✅ ☑️ ✔️ ➕ ➖ ➗ ✖️
  ™️ ©️ ®️ ℹ️ Ⓜ️ 🅿️ 🆘 🆗 🆒 🆕 🆙 🆚 🆓
  🔞 🚸 ⚠️ ☢️ ☣️ 🔰 🔱 ♠️ ♥️ ♦️ ♣️ 🎴 🀄
  🔯 ✡️ ☪️ ☮️ ☯️ ✝️ ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓
  🧿 🔅 🔆 🛑 ⛳ 🚩 🏁 🎌
`);

// Дополнение для объёма (стрелки/цифры/часы/флаги)
const EXTRA = _dedupe([...CLOCKS, ...KEYPADS, ...ARROWS, ...FLAG_ISO]);

// ---------- Итог: категории с отдельными i18n-ключами ----------
const EMOJI = [
  { k: 'smileys',    title: 'forum_emoji_cat_smileys',    list: _dedupe([...SEED_SMILEYS]) },
  { k: 'hands',      title: 'forum_emoji_cat_hands',      list: _dedupe([...SEED_HANDS]) },
  { k: 'people',     title: 'forum_emoji_cat_people',     list: _dedupe([...SEED_PEOPLE]) },
  { k: 'animals',    title: 'forum_emoji_cat_animals',    list: _dedupe([...SEED_ANIMALS]) },
  { k: 'food',       title: 'forum_emoji_cat_food',       list: _dedupe([...SEED_FOOD]) },
  { k: 'activities', title: 'forum_emoji_cat_activities', list: _dedupe([...SEED_ACTIVITIES]) },
  { k: 'travel',     title: 'forum_emoji_cat_travel',     list: _dedupe([...SEED_TRAVEL]) },
  { k: 'objects',    title: 'forum_emoji_cat_objects',    list: _dedupe([...SEED_OBJECTS]) },
  { k: 'symbols',    title: 'forum_emoji_cat_symbols',    list: _dedupe([...SEED_SYMBOLS, ...EXTRA]) },
  { k: 'flags',      title: 'forum_emoji_cat_flags',      list: _dedupe([...FLAG_ISO]) },
];

// VIP эмодзи (анимированные), пути из /public
const VIP_EMOJI = [
  '/vip/emoji/e1.gif',
  '/vip/emoji/e2.gif',
  '/vip/emoji/e3.gif',
  '/vip/emoji/e4.gif',
  '/vip/emoji/e5.gif',
  '/vip/emoji/e6.gif',
  '/vip/emoji/e7.gif',
  '/vip/emoji/e8.gif',
  '/vip/emoji/e9.gif',
  '/vip/emoji/e10.gif',
  '/vip/emoji/e11.gif',
  '/vip/emoji/e12.gif',
  '/vip/emoji/e13.gif',
  '/vip/emoji/e14.gif',
  '/vip/emoji/e15.gif',
  '/vip/emoji/e16.gif',
  '/vip/emoji/e17.gif',
  '/vip/emoji/e18.gif',
  '/vip/emoji/e19.gif',
  '/vip/emoji/e20.gif',
  '/vip/emoji/e21.gif',
  '/vip/emoji/e22.gif',
  '/vip/emoji/e23.gif',
  '/vip/emoji/e24.gif',
  '/vip/emoji/e25.gif',
  '/vip/emoji/e26.gif',
  '/vip/emoji/e27.gif',
  '/vip/emoji/e28.gif',
  '/vip/emoji/e29.gif',
  '/vip/emoji/e30.gif',
  '/vip/emoji/e31.gif',
  '/vip/emoji/e32.gif',
  '/vip/emoji/e33.gif',
  '/vip/emoji/e34.gif',
  '/vip/emoji/e35.gif',
  '/vip/emoji/e36.gif',
  '/vip/emoji/e37.gif',
  '/vip/emoji/e38.gif',
  '/vip/emoji/e39.gif',
  '/vip/emoji/e40.gif',
  '/vip/emoji/e41.gif',
  '/vip/emoji/e42.gif',
  '/vip/emoji/e43.gif',
  '/vip/emoji/e44.gif',
  '/vip/emoji/e45.gif',
  '/vip/emoji/e46.gif',
  '/vip/emoji/e47.gif',
  '/vip/emoji/e48.gif',
  '/vip/emoji/e49.gif',
  '/vip/emoji/e50.gif',
  '/vip/emoji/e51.gif',
  '/vip/emoji/e52.gif',
  '/vip/emoji/e53.gif',
  '/vip/emoji/e54.gif',
  '/vip/emoji/e55.gif',
  '/vip/emoji/e56.gif',
  '/vip/emoji/e57.gif',
  '/vip/emoji/e58.gif',
  '/vip/emoji/e59.gif',
  '/vip/emoji/e60.gif',
  '/vip/emoji/e61.gif',
  '/vip/emoji/e62.gif',
  '/vip/emoji/e63.gif',
  '/vip/emoji/e64.gif',
  '/vip/emoji/e65.gif',
  '/vip/emoji/e66.gif',
  '/vip/emoji/e67.gif',
  '/vip/emoji/e68.gif',
  '/vip/emoji/e69.gif',
  '/vip/emoji/e70.gif',
  '/vip/emoji/e71.gif',
  '/vip/emoji/e72.gif',
  '/vip/emoji/e73.gif',
  '/vip/emoji/e74.gif',
  '/vip/emoji/e75.gif',
  '/vip/emoji/e76.gif',
  '/vip/emoji/e77.gif',
  '/vip/emoji/e78.gif',
  '/vip/emoji/e79.gif',
  '/vip/emoji/e80.gif',
  '/vip/emoji/e81.gif',
  '/vip/emoji/e82.gif',
  '/vip/emoji/e83.gif',
  '/vip/emoji/e84.gif',
  '/vip/emoji/e85.gif',
  '/vip/emoji/e86.gif',
  '/vip/emoji/e87.gif',
  '/vip/emoji/e88.gif',
  '/vip/emoji/e89.gif',
  '/vip/emoji/e90.gif',
  '/vip/emoji/e91.gif',
  '/vip/emoji/e92.gif',
  '/vip/emoji/e93.gif',
  '/vip/emoji/e94.gif',
  '/vip/emoji/e95.gif',
  '/vip/emoji/e96.gif',
  '/vip/emoji/e97.gif',
  '/vip/emoji/e98.gif',
  '/vip/emoji/e99.gif',
  '/vip/emoji/e100.gif',
  '/vip/emoji/e101.gif',
  '/vip/emoji/e102.gif',
  '/vip/emoji/e103.gif',
  '/vip/emoji/e104.gif',
  '/vip/emoji/e105.gif',
  '/vip/emoji/e106.gif',
  '/vip/emoji/e107.gif',
'/vip/emoji/e108.gif',
'/vip/emoji/e109.gif',
'/vip/emoji/e110.gif',
'/vip/emoji/e111.gif',
'/vip/emoji/e112.gif',
'/vip/emoji/e113.gif',
'/vip/emoji/e114.gif',
'/vip/emoji/e115.gif',
'/vip/emoji/e116.gif',
'/vip/emoji/e117.gif',
'/vip/emoji/e118.gif',
'/vip/emoji/e119.gif',
'/vip/emoji/e120.gif',
'/vip/emoji/e121.gif',
'/vip/emoji/e122.gif',
'/vip/emoji/e123.gif',
'/vip/emoji/e124.gif',
'/vip/emoji/e125.gif',
'/vip/emoji/e126.gif',
'/vip/emoji/e127.gif',
'/vip/emoji/e128.gif',
'/vip/emoji/e129.gif',
'/vip/emoji/e130.gif',
'/vip/emoji/e131.gif',
'/vip/emoji/e132.gif',
'/vip/emoji/e133.gif',
'/vip/emoji/e134.gif',
'/vip/emoji/e135.gif',
'/vip/emoji/e136.gif',
'/vip/emoji/e137.gif',
'/vip/emoji/e138.gif',
'/vip/emoji/e139.gif',
'/vip/emoji/e140.gif',
'/vip/emoji/e141.gif',
'/vip/emoji/e142.gif',
'/vip/emoji/e143.gif',
'/vip/emoji/e144.gif',
'/vip/emoji/e145.gif',
'/vip/emoji/e146.gif',
'/vip/emoji/e147.gif',
'/vip/emoji/e148.gif',
'/vip/emoji/e149.gif',
'/vip/emoji/e150.gif',

];


// анимированные VIP-аватары (путь из public/)
const VIP_AVATARS = [
  '/vip/avatars/a1.gif',
  '/vip/avatars/a2.gif',
  '/vip/avatars/a3.gif',
  '/vip/avatars/a4.gif',
  '/vip/avatars/a5.gif',
  '/vip/avatars/a6.gif',
  '/vip/avatars/a7.gif',
  '/vip/avatars/a8.gif',
  '/vip/avatars/a9.gif',
  '/vip/avatars/a10.gif',
  '/vip/avatars/a11.gif',
  '/vip/avatars/a12.gif',
  '/vip/avatars/a13.gif',
  '/vip/avatars/a14.gif',
  '/vip/avatars/a15.gif',
  '/vip/avatars/a16.gif',
  '/vip/avatars/a17.gif',
  '/vip/avatars/a18.gif',
  '/vip/avatars/a19.gif',
  '/vip/avatars/a20.gif',
  '/vip/avatars/a21.gif',
  '/vip/avatars/a22.gif',
  '/vip/avatars/a23.gif',
  '/vip/avatars/a24.gif',
  '/vip/avatars/a25.gif',
  '/vip/avatars/a26.gif',
  '/vip/avatars/a27.gif',
  '/vip/avatars/a28.gif',
  '/vip/avatars/a29.gif',
  '/vip/avatars/a30.gif',
  '/vip/avatars/a31.gif',
  '/vip/avatars/a32.gif',
  '/vip/avatars/a33.gif',
  '/vip/avatars/a34.gif',
  '/vip/avatars/a35.gif',
  '/vip/avatars/a36.gif',
  '/vip/avatars/a37.gif',
  '/vip/avatars/a38.gif',
  '/vip/avatars/a39.gif',
  '/vip/avatars/a40.gif',
  '/vip/avatars/a41.gif',
  '/vip/avatars/a42.gif',
  '/vip/avatars/a43.gif',
  '/vip/avatars/a44.gif',
  '/vip/avatars/a45.gif',
  '/vip/avatars/a46.gif',
  '/vip/avatars/a47.gif',
  '/vip/avatars/a48.gif',
  '/vip/avatars/a49.gif',
  '/vip/avatars/a50.gif',
  '/vip/avatars/a51.gif',
  '/vip/avatars/a52.gif',
  '/vip/avatars/a53.gif',
  '/vip/avatars/a54.gif',
  '/vip/avatars/a55.gif',
  '/vip/avatars/a56.gif',
  '/vip/avatars/a57.gif',
  '/vip/avatars/a58.gif',
  '/vip/avatars/a59.gif',
  '/vip/avatars/a60.gif',
  '/vip/avatars/a61.gif',
  '/vip/avatars/a62.gif',
  '/vip/avatars/a63.gif',
  '/vip/avatars/a64.gif',
  '/vip/avatars/a65.gif',
  '/vip/avatars/a66.gif',
  '/vip/avatars/a67.gif',
  '/vip/avatars/a68.gif',
  '/vip/avatars/a69.gif',
  '/vip/avatars/a70.gif',
  '/vip/avatars/a71.gif',
  '/vip/avatars/a72.gif',
  '/vip/avatars/a73.gif',
  '/vip/avatars/a74.gif',
  '/vip/avatars/a75.gif',
  '/vip/avatars/a76.gif',
  '/vip/avatars/a77.gif',
  '/vip/avatars/a78.gif',
  '/vip/avatars/a79.gif',
  '/vip/avatars/a80.gif',
  '/vip/avatars/a81.gif',
  '/vip/avatars/a82.gif',
  '/vip/avatars/a83.gif',
  '/vip/avatars/a84.gif',
  '/vip/avatars/a85.gif',
  '/vip/avatars/a86.gif',
  '/vip/avatars/a87.gif',
  '/vip/avatars/a88.gif',
  '/vip/avatars/a89.gif',
  '/vip/avatars/a90.gif',
  '/vip/avatars/a91.gif',
  '/vip/avatars/a92.gif',
  '/vip/avatars/a93.gif',
  '/vip/avatars/a94.gif',
  '/vip/avatars/a95.gif',
  '/vip/avatars/a96.gif',
  '/vip/avatars/a97.gif',
  '/vip/avatars/a98.gif',
  '/vip/avatars/a99.gif',
  '/vip/avatars/a100.gif',
  '/vip/avatars/a101.gif',
'/vip/avatars/a102.gif',
'/vip/avatars/a103.gif',
'/vip/avatars/a104.gif',
'/vip/avatars/a105.gif',
'/vip/avatars/a106.gif',
'/vip/avatars/a107.gif',
'/vip/avatars/a108.gif',
'/vip/avatars/a109.gif',
'/vip/avatars/a110.gif',
'/vip/avatars/a111.gif',
'/vip/avatars/a112.gif',
'/vip/avatars/a113.gif',
'/vip/avatars/a114.gif',
'/vip/avatars/a115.gif',
'/vip/avatars/a116.gif',
'/vip/avatars/a117.gif',
'/vip/avatars/a118.gif',
'/vip/avatars/a119.gif',
'/vip/avatars/a120.gif',
'/vip/avatars/a121.gif',
'/vip/avatars/a122.gif',
'/vip/avatars/a123.gif',
'/vip/avatars/a124.gif',
'/vip/avatars/a125.gif',
'/vip/avatars/a126.gif',
'/vip/avatars/a127.gif',
'/vip/avatars/a128.gif',
'/vip/avatars/a129.gif',
'/vip/avatars/a130.gif',

];



/* =========================================================
   маленькие поповеры
========================================================= */
function AdminPopover({ anchorRef, open, onClose, t, isActive, onActivated, onDeactivated }) {
  const [pass, setPass] = useState('');
  useEffect(() => { if (open) setPass(''); }, [open]);
  if (!open || !anchorRef?.current) return null;

const btn = anchorRef.current;

const isRtl =
  typeof document !== 'undefined' &&
  (document.documentElement?.dir === 'rtl' ||
    getComputedStyle(document.documentElement).direction === 'rtl');

const GAP = 8;
const WANT_W = 260;

// родитель, относительно которого работает absolute
const parent = btn.offsetParent || btn.parentElement;
const pRect = parent?.getBoundingClientRect?.() || { left: 0, right: window.innerWidth };
const r = btn.getBoundingClientRect();

// ширину ограничиваем экраном
const maxW = Math.max(200, Math.min(WANT_W, window.innerWidth - GAP * 2));

// top в координатах parent (важно!)
const top = Math.round((r.bottom - (parent?.getBoundingClientRect?.()?.top || 0)) + GAP);

// “идеальная” привязка к кнопке:
// LTR — правым краем к правому краю кнопки
// RTL — левым краем к левому краю кнопки
let leftAbs = isRtl ? r.left : (r.right - maxW);

// clamp в пределах viewport
leftAbs = Math.max(GAP, Math.min(leftAbs, window.innerWidth - maxW - GAP));

// переводим в координаты parent
const left = Math.round(leftAbs - pRect.left);

  const activate = async () => {
    const password = pass.trim();
    if (!password) return;
    try {
      let r;
      if (typeof api?.adminVerify === 'function') {
        // если у тебя уже есть обёртка в api — используем её
        r = await api.adminVerify(password);
      } else {
        // прямой вызов существующего роута
        const res = await fetch('/api/forum/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'cache-control': 'no-store' },
          body: JSON.stringify({ password }),
          cache: 'no-store',
        });
        r = await res.json().catch(() => null);
      }
      if (r?.ok) {
        try { localStorage.setItem('ql7_admin', '1'); } catch {}
        onActivated?.();
        onClose?.();
         try { location.reload(); } catch {}
      }
    } catch {}
  };

  const exit = async () => {
    try { await fetch('/api/forum/admin/verify', { method: 'DELETE', cache: 'no-store' }); } catch {}
    try { localStorage.removeItem('ql7_admin'); } catch {}
    onDeactivated?.();
    onClose?.();
  };

  return (
<div className="adminPop" style={{ top, left, width: maxW }}>
      {isActive ? (
        <div className="grid gap-2">
          <div className="meta">{t('forum_admin_active')}</div>
          <button className="btn" onClick={exit}>
            {t('forum_admin_exit')}
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <label className="block">
            <div className="meta mb-1">{t('forum_admin_pass')}</div>
            <input
              className="input"
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <div className="flex items-center justify-end gap-2">
            <button className="btn btnGhost" onClick={onClose}>{t('forum_cancel')}</button>
            <button className="btn" onClick={activate}>
              {t('forum_activate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function VipPopover({ anchorRef, open, onClose, t, vipActive, onPay }){
  const el = anchorRef?.current
  if (!open || !el) return null
const btn = el;

const isRtl =
  typeof document !== 'undefined' &&
  (document.documentElement?.dir === 'rtl' ||
    getComputedStyle(document.documentElement).direction === 'rtl');

const GAP = 8;
const WANT_W = 280;

// absolute относительно offsetParent (якорный контейнер кнопки)
const parent = btn.offsetParent || btn.parentElement;
const pRect = parent?.getBoundingClientRect?.() || { left: 0, right: window.innerWidth };
const r = btn.getBoundingClientRect();

// ширина + защита от вылезания за экран
const maxW = Math.max(220, Math.min(WANT_W, window.innerWidth - GAP * 2));

// top в координатах parent
const top = Math.round((r.bottom - (parent?.getBoundingClientRect?.()?.top || 0)) + GAP);

// идеальная привязка к кнопке
let leftAbs = isRtl ? r.left : (r.right - maxW);

// clamp по viewport
leftAbs = Math.max(GAP, Math.min(leftAbs, window.innerWidth - maxW - GAP));

// в координаты parent
const left = Math.round(leftAbs - pRect.left);

return (
  <div className="adminPop" style={{ top, left, width: maxW }}>

      {vipActive ? (
        <div className="grid gap-2">
          <div className="meta">{t('forum_vip_active')}</div>
          <div className="text-sm opacity-80">{t('forum_vip_thanks')}</div>
          <button className="btn" onClick={onClose}>{t('forum_close')}</button>
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="text-lg font-bold">{t('forum_vip_title')}</div>
          <div className="meta">{t('forum_vip_desc')}</div>
          <div className="flex items-center justify-end gap-2">
            <button className="btn btnGhost" onClick={onClose}>{t('forum_cancel')}</button>
            <button className="btn" onClick={onPay}>{t('forum_vip_pay')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
function QCoinWithdrawPopover({ anchorRef, onClose, onOpenQuests, t, questEnabled = false, isAuthed = false }) {
  const [pos, setPos] = useState({ top: 0, left: 0, maxW: 520, maxH: 600 });

  useEffect(() => {
    const btn = anchorRef?.current;
    if (!btn) return;

    const popParent  = btn.closest('section'); // .glass
    const parentRect = popParent?.getBoundingClientRect?.() || { top: 0, left: 0, width: window.innerWidth, bottom: window.innerHeight };
    const r = btn.getBoundingClientRect();
    const gap = 8;

    const maxW = Math.min(520, (parentRect.width || window.innerWidth) - 16);
    let left = r.left - parentRect.left;
    if (left + maxW > (parentRect.width || window.innerWidth)) left = Math.max(8, (parentRect.width || window.innerWidth) - maxW - 8);

    // сколько пикселей осталось до низа вьюпорта (на мобилках используем 100dvh/innerHeight)
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 800;
    const spaceBelow = Math.max(160, Math.min(viewportH, parentRect.bottom || viewportH) - r.bottom - gap);
    const maxH = Math.min(1060, Math.floor(spaceBelow - 8)); // запас 8px

    setPos({ top: (r.bottom - parentRect.top) + gap, left, maxW, maxH });
  }, [anchorRef]);

  // закрытие по Esc/клик вне
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    const onClick = (e) => {
      const el = document.querySelector('.qcoinPop');
      if (el && !el.contains(e.target)) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onClick);
    };
  }, [onClose]);

  // --- КНОПКА QUEST: вычисляем состояние и классы ---
  const questState = !questEnabled ? 'off' : (isAuthed ? 'ready' : 'need-auth');
  // базовые эффекты оставил как были (vibrate/blink); добавил цветовые модификаторы
  const questBtnClass =
`btn questBtn ${!questEnabled ? 'disabled' : (isAuthed ? 'green pulse' : 'red pulse')} ${questEnabled ? 'vibrate blink' : ''}`;

  const handleQuestClick = async () => {
    if (!questEnabled) return;
    if (!isAuthed) {
      const ok = await openAuth().catch(() => null);
      if (!ok) return;
    }
    try { onClose?.(); } catch {}
    try { onOpenQuests?.(); } catch {}
  };

  return (
    <div
      className="qcoinPop"
      style={{
        position: 'absolute',
        zIndex: 3200,
        top: pos.top,
        left: pos.left,
        width: pos.maxW,
      }}
    >
      <div className="qcoinCard" style={{ '--qcoin-maxh': `${pos.maxH}px` }}>
        <div className="qcoinCardHdr">
          <div className="flex items-center gap-3">
            <video
              className="qcoinMini"
              src="/qcoind/mini.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>

{/* «Чистая» иконка квеста — без кнопки/фона/рамок */}
<Image
  src="/click/quest.gif"
  alt=""
  width={72}
  height={72}
  unoptimized
  role="button"
  aria-label={t('quest_open') || 'Quests'}
  aria-disabled={!questEnabled}
  tabIndex={questEnabled ? 0 : -1}
  onClick={questEnabled ? handleQuestClick : undefined}
  onKeyDown={(e) => {
    if (!questEnabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleQuestClick();
    }
  }}
  draggable={false}
  className={`questIconPure ${questBtnClass}`}
  style={{
    ['--quest-w']: '72px',
    ['--quest-h']: 'auto',
    ['--quest-cursor']: questEnabled ? 'pointer' : 'default',
    ['--quest-y']: '-14px',
    width: 'var(--quest-w)',
    height: 'var(--quest-h)'
  }}
/>

          <button className="btn btnGhost" onClick={onClose}>{t('forum_close')}</button>
        </div>

        <div>
          <div className="qcoinLabel" style={{ fontSize: '2.00rem' }}>Q COIN</div>
          <div className="meta">{t('forum_qcoin_desc')}</div>
        </div>

        {/* тело — скроллимое */}
        <div className="qcoinPopBody">
          <div className="meta">{t('forum_qcoin_withdraw_note') || ''}</div>
          {/* ...тут может быть длинное описание/правила и т.д. ... */}
        </div>

        {/* ДЕЙСТВИЯ: всегда в одну строку, адаптивные */}
        <div className="qcActions">
          <a
            className="btn qcBtn qcExchange"
            href="https://www.quantuml7ai.com/exchange"
            target="_blank"
            rel="noopener noreferrer"
            title={t('forum_qcoin_exchange') || 'Биржа'}
          >
            {t('forum_qcoin_exchange') || 'Биржа'}
          </a>
          <button
            type="button"
            className="btn qcBtn qcWithdraw"
            disabled
            title={t('forum_qcoin_withdraw')}
          >
            {t('forum_qcoin_withdraw')}
          </button>
        </div>
      </div>
    </div>
  );
}



function QCoinInline({ t, userKey, vipActive, anchorRef }) {
  const q = useQCoinLive(userKey, !!vipActive)
  const clsVal = q.paused ? 'qcoinValue paused' : 'qcoinValue live'

  // ==== формат баланса: всегда 10 цифр, точка двигается ====
  const TOTAL_DIGITS = 11
  const raw = Number(q.balanceDisplay ?? q.balance ?? 0)

  let formattedBalance

  if (!Number.isFinite(raw) || raw <= 0) {
    // 0 -> "0.000000000" (1 цифра слева + 9 справа = 10)
    formattedBalance = '0.' + '0'.repeat(TOTAL_DIGITS - 1)
  } else {
    const abs = Math.abs(raw)
    // количество цифр в целой части
    const intDigits = Math.max(1, Math.floor(Math.log10(abs)) + 1)
    // сколько знаков после точки, чтобы всего было 10 цифр
    const decimals = Math.max(0, TOTAL_DIGITS - intDigits)
    formattedBalance = raw.toFixed(decimals)
  }
  // ========================================================

  return (
    <div className="qcoinRow qcoinCol"
    translate="no"
    >
      <div className="qcoinTop">
        <span className="qcoinLabel">Q COIN</span>
        <span
          className={cls('qcoinX2', vipActive ? 'vip' : 'needVip', 'hoverPop')}
          role="button"
          tabIndex={0}
          aria-label="x2 VIP"
          title={
            vipActive
              ? (t('forum_qcoin_x2_active') || '×2 за VIP — активно')
              : (t('forum_qcoin_x2_get') || 'Купить VIP+ чтобы получить ×2')
          }
          onClick={() => { try { window.dispatchEvent(new Event('vip:open')) } catch {} }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              try { window.dispatchEvent(new Event('vip:open')) } catch {}
            }
          }}
          suppressHydrationWarning
        >
          ×2
        </span>
      </div>

      <span
        ref={anchorRef}
        className={clsVal}
        onClick={() => {
          try { window.dispatchEvent(new Event('qcoin:open')) } catch {}
          try { q.open?.() } catch {}
        }}
        style={{ cursor: 'pointer' }}
        title={t('forum_qcoin_open_hint') || 'Открыть Q COIN'}
        suppressHydrationWarning
      >
        {formattedBalance}
      </span>
    </div>
  )
}

function FollowersCounterInline({ t, viewerId, count, loading }) {
  const noAuth = !String(viewerId || '').trim()
  const v = noAuth ? 0 : Number(count || 0)

  return (
    <button
      type="button"
      className={`subsCounter ${noAuth ? 'noAuth' : 'authed'}`}
      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
      title={t?.('forum_followers') || 'Подписчики'}
     aria-label="Followers count"
      aria-disabled={noAuth}
    >
      <span className="subsRing" aria-hidden />
      <span className="subsStar" aria-hidden>★</span>
<span className="subsValue" suppressHydrationWarning>
  {loading ? '…' : <HydrateText value={formatCount(v)} />}
</span>

    </button>
  )
}

/** мини-поповер профиля рядом с аватаром */
function ProfilePopover({
  anchorRef,
  open,
  onClose,
  t,
  auth,
  vipActive,
  onSaved,

  viewerId,
  myFollowersCount,
  myFollowersLoading,

  // 👇 deps from Forum scope (moderation + toasts)
  moderateImageFiles,
  toastI18n,
  reasonKey,
  reasonFallbackEN,
}) {


  // нормализуем UID через общий хелпер, чтобы TG и веб совпадали
  const baseAuth = auth || {};
  const base = baseAuth.asherId || baseAuth.accountId || '';
  const resolved = resolveForumUserId(base);
  const uid = resolveProfileAccountId(resolved);

  const readLocal = React.useCallback(() => {
    if (!uid || typeof window === 'undefined') return null;
    return safeReadProfile(uid) || null;
  }, [uid]);

  const initialLocal = readLocal() || {};
  const [nick, setNick] = useState(initialLocal.nickname || '');
  const [icon, setIcon] = useState(initialLocal.icon || ICONS[0]);
 
  // ===== Upload Avatar (custom photo) =====
  // ВАЖНО: превью и сохранение используют ОДИН И ТОТ ЖЕ canvas-рендер -> идеальное совпадение.
  const fileRef = useRef(null);
  const avaBoxRef = useRef(null);


  const [uploadFile, setUploadFile] = useState(null);      // File выбранный пользователем
  const [imgInfo, setImgInfo] = useState({ w: 0, h: 0 });  // натуральные размеры
  // crop:
  //  - x/y: относительный сдвиг (доля от стороны квадрата превью), чтобы одинаково смотрелось на desktop/mobile
  //  - z: zoom (mult)
  const [crop, setCrop] = useState({ x: 0, y: 0, z: 1 });  const [uploadBusy, setUploadBusy] = useState(false);
  const [finalAvatarBlob, setFinalAvatarBlob] = useState(null);
  const [finalAvatarUrl, setFinalAvatarUrl] = useState('');
  const finalAvatarUrlRef = useRef('');
  // ✅ мгновенное превью сразу после выбора файла (до canvas-crop)
  const [rawAvatarUrl, setRawAvatarUrl] = useState('');
  const rawAvatarUrlRef = useRef('');
  const pickTokenRef = useRef(0); // защита от гонок при быстром выборе файлов

  // ✅ защита от setState после unmount (save может продолжаться после onClose)
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const dragRef = useRef({ on: false, moved: false, canDrag: false, x: 0, y: 0, sx: 0, sy: 0, sz: 1 });
 
  const bmpRef = useRef(null); // ImageBitmap
  const boxSizeRef = useRef(0);

  // ===== Avatar preview (canvas) =====
  // WHY: <img> + object-fit:cover обрезает картинку в квадрат сразу после выбора.
  // Canvas-рендер рисует ПОЛНОЕ изображение и режет только при Save.
  const previewCanvasRef = useRef(null);
  const rafRef = useRef(0);
  const drawPendingRef = useRef(false);
  const dprRef = useRef(1);
  const cropLiveRef = useRef({ x: 0, y: 0, z: 1 });
  // x/y храним как долю от стороны квадрата (относительно),
  // чтобы превью не плавало между desktop/mobile и точно совпадало с сохранением.
  const relToPx = (rel, size) => (Number(rel) || 0) * (Number(size) || 0);
  const pxToRel = (px, size) => {
    const s = Number(size) || 0;
    if (!s) return 0;
    return (Number(px) || 0) / s;
  };

  const getDpr = () => {
    try {
      const v = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
      // clamp: 1..2 (retina, но без лишней нагрузки)
      return Math.max(1, Math.min(2, Number(v) || 1));
    } catch {     
   return 1;
    }
  };

  const ensurePreviewCanvasSize = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const size = boxSizeRef.current || 0;
    if (!canvas || !size) return;

    const dpr = getDpr();
    dprRef.current = dpr;

    const w = Math.max(1, Math.round(size * dpr));
    const h = Math.max(1, Math.round(size * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    // css size — в CSS-пикселях
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
  }, []);

  const drawAvatarPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const bmp = bmpRef.current;
    const size = boxSizeRef.current || 0;
    if (!canvas || !bmp || !size) return;

    ensurePreviewCanvasSize();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current || 1;
    // рисуем в CSS-пикселях, масштаб задаём transform-ом
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const iw = bmp.width || 1;
    const ih = bmp.height || 1;
    const base = Math.max(size / iw, size / ih);

    const c = cropLiveRef.current || { x: 0, y: 0, z: 1 };
    const z = Math.max(1, Number(c.z || 1));
    const scale = base * z;

    const dw = iw * scale;
    const dh = ih * scale;
	    const cx = size / 2 + relToPx(c.x, size);
	    const cy = size / 2 + relToPx(c.y, size);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }, [ensurePreviewCanvasSize]);

  const requestPreviewDraw = useCallback(() => {
    if (drawPendingRef.current) return;
    drawPendingRef.current = true;
    try {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } catch {}
    rafRef.current = requestAnimationFrame(() => {
      drawPendingRef.current = false;
      drawAvatarPreview();
    });
  }, [drawAvatarPreview]);

  // держим live-crop в ref (drag обновляет ref без лишних re-render)
  useEffect(() => {
    cropLiveRef.current = crop;
    requestPreviewDraw();
  }, [crop, requestPreviewDraw]);
  const shouldKeepObjectUrl = (url) => {
    if (!url || typeof window === 'undefined' || !uid) return false;
    try {
      const prof = safeReadProfile(uid);
      return prof?.icon === url;
    } catch {
      return false;
    }
  };
  const revokeObjectUrlIfSafe = (url) => {
    if (!url || shouldKeepObjectUrl(url)) return false;
    try {
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  };
  const cleanupObjectUrlsIfStale = () => {
    if (finalAvatarUrlRef.current && revokeObjectUrlIfSafe(finalAvatarUrlRef.current)) {
      finalAvatarUrlRef.current = '';
    }
    if (rawAvatarUrlRef.current && revokeObjectUrlIfSafe(rawAvatarUrlRef.current)) {
      rawAvatarUrlRef.current = '';
    }
  };
  // финальная уборка (на размонтирование)
  useEffect(() => {
    return () => {
      try { bmpRef.current?.close?.(); } catch {}
      bmpRef.current = null;
      if (finalAvatarUrlRef.current) {
        if (revokeObjectUrlIfSafe(finalAvatarUrlRef.current)) {
          finalAvatarUrlRef.current = '';
        }          
       }
      if (rawAvatarUrlRef.current) {
        if (revokeObjectUrlIfSafe(rawAvatarUrlRef.current)) {
          rawAvatarUrlRef.current = '';
        }
      }   
      };
  }, []);
  // когда поповер открывается — сбрасываем превью (чтобы не "тащилось" по страницам)
  useEffect(() => {
    if (!open) return;
    // не трогаем icon/nick (они уже выставляются ниже)
    // сбрасываем только upload-панель
    setUploadFile(null);
    setImgInfo({ w: 0, h: 0 });
    setCrop({ x: 0, y: 0, z: 1 });
    setUploadBusy(false);
    setFinalAvatarBlob(null);
    setFinalAvatarUrl('');
    if (finalAvatarUrlRef.current) {
      if (revokeObjectUrlIfSafe(finalAvatarUrlRef.current)) {
        finalAvatarUrlRef.current = '';
      }
    }  

    setRawAvatarUrl('');
    if (rawAvatarUrlRef.current) {
      if (revokeObjectUrlIfSafe(rawAvatarUrlRef.current)) {
        rawAvatarUrlRef.current = '';
      }
    }      
    try { bmpRef.current?.close?.(); } catch {}
    bmpRef.current = null;
  }, [open]);

  // resize: держим превью-канвас = размеру квадрата (адаптив)
  useEffect(() => {
    if (!open) return;
    const el = avaBoxRef.current;
    if (!el) return;

    const applySize = () => {
      const r = el.getBoundingClientRect();
      const sz = Math.max(1, Math.round(Math.min(r.width, r.height)));
      boxSizeRef.current = sz;
      // если квадрат по размеру поменялся (desktop<->mobile/ресайз),
      // кроп мог оказаться вне границ -> клэмпим лайв сразу.
      try {
        const cur = cropLiveRef.current || { x: 0, y: 0, z: 1 };
        const clamped = clampCrop(cur);
        cropLiveRef.current = clamped;
        // синхронизируем state только если не тащим прямо сейчас
        if (!dragRef.current?.on) {
          if (clamped.x !== cur.x || clamped.y !== cur.y || clamped.z !== cur.z) {
            setCrop(clamped);
          }
        }
      } catch {}      
      try { ensurePreviewCanvasSize(); } catch {}
      try { requestPreviewDraw(); } catch {}
    };

    applySize();
    const ro = new ResizeObserver(() => applySize());
    ro.observe(el);
    window.addEventListener('resize', applySize, { passive: true });
    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener('resize', applySize);
    };
  }, [open]);

  const clampCrop = React.useCallback((next) => {
    const bmp = bmpRef.current;
    const size = boxSizeRef.current || 0;
    if (!bmp || !size) return next;
    const iw = bmp.width || 1;
    const ih = bmp.height || 1;
    const base = Math.max(size / iw, size / ih);
    const scale = base * Math.max(1, Number(next?.z || 1));
    const drawW = iw * scale;
    const drawH = ih * scale;
    const maxX = Math.max(0, (drawW - size) / 2);
    const maxY = Math.max(0, (drawH - size) / 2);
    // x/y тут в относительных единицах (1.0 = ширинаквадрата)
    const maxXRel = maxX / size;
    const maxYRel = maxY / size;
    const x = Math.min(maxXRel, Math.max(-maxXRel, Number(next?.x || 0)));
    const y = Math.min(maxYRel, Math.max(-maxYRel, Number(next?.y || 0)));
    return { x, y, z: Math.max(1, Number(next?.z || 1)) };
  }, []);

 
  const openFilePicker = () => fileRef.current?.click?.();

  const onPickFile = (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    // 1) мгновенно показываем выбранное изображение (без "PROCESSING")
    const token = ++pickTokenRef.current;  
    try {
      if (finalAvatarUrlRef.current) {
        if (revokeObjectUrlIfSafe(finalAvatarUrlRef.current)) {
          finalAvatarUrlRef.current = '';
        }
      }      
      if (rawAvatarUrlRef.current) {
        if (revokeObjectUrlIfSafe(rawAvatarUrlRef.current)) {
          rawAvatarUrlRef.current = '';
        }
      }
      const url = URL.createObjectURL(f);
      rawAvatarUrlRef.current = url;
      setRawAvatarUrl(url);
      setFinalAvatarUrl('');
      finalAvatarUrlRef.current = ''; } catch {}

    // 2) базовые стейты
    setUploadFile(f);
    setFinalAvatarBlob(null);    
    setCrop({ x: 0, y: 0, z: 1 });
    setImgInfo({ w: 0, h: 0 });
    // 3) декод в bitmap + натуральные размеры (асинхронно)
    (async () => {
      try {
        try { bmpRef.current?.close?.(); } catch {}
        const bmp = await createImageBitmap(f);
        if (pickTokenRef.current !== token) {
          try { bmp?.close?.(); } catch {}
          return;
        }
        bmpRef.current = bmp;
        setImgInfo({ w: bmp?.width || 0, h: bmp?.height || 0 });
        try { requestPreviewDraw(); } catch {}
      } catch {
        // если bitmap не создался — оставляем raw превью
      }
    })();

    try { e.target.value = ''; } catch {}
  };

  const onPointerDown = (e) => {

    e.preventDefault();
    e.stopPropagation();
    const p = dragRef.current;
    p.on = true;
    p.moved = false;
    p.canDrag = !!uploadFile && !!bmpRef.current;    
    p.x = e.clientX;
    p.y = e.clientY;
    // фиксируем размер квадрата на момент начала drag,
    // чтобы расчёт dx/dy был стабильным даже если layout чуть "дышит".
    p.sz = boxSizeRef.current || 1;    
    // стартуем от актуального live-crop (а не от стейта, чтобы всё совпадало с canvas)
    const c0 = cropLiveRef.current || crop;
    p.sx = Number(c0?.x || 0);
    p.sy = Number(c0?.y || 0);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
  };
  const onPointerMove = (e) => {
    const p = dragRef.current;
    if (!p.on) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.moved && (dx * dx + dy * dy > 9)) {
      p.moved = true;
    }
    if (!p.moved || !p.canDrag) return;    
    // PERF: не setState на каждом пикселе — обновляем ref и перерисовываем в rAF
    const sz = p.sz || boxSizeRef.current || 1;
    const dxRel = dx / sz;
    const dyRel = dy / sz;    
    const next = clampCrop({
      ...(cropLiveRef.current || crop),
      x: p.sx + dxRel,
      y: p.sy + dyRel,
    });
    cropLiveRef.current = next;
    requestPreviewDraw();
  };
  const onPointerUp = (e) => {
    const p = dragRef.current;
    if (!p.on) return;
    p.on = false;
    p.canDrag = false;   
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
    if (!p.moved) {
      openFilePicker();
      return;
    }

    // commit: один setState на release
    const committed = clampCrop(cropLiveRef.current || crop);
    cropLiveRef.current = committed;
    setCrop(committed);
    requestPreviewDraw();  
  };

  // делаем квадратный PNG из превью (клиентский кроп)
const makeCroppedPngBlob = React.useCallback(async ({ size = 512 } = {}) => {
    const bmp = bmpRef.current;
    if (!bmp) return null;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const iw = bmp.width || 1;
    const ih = bmp.height || 1;
    const base = Math.max(size / iw, size / ih);

    // IMPORTANT: берём live-crop (drag может ещё не успеть прожечь setState)
    const c = cropLiveRef.current || { x: 0, y: 0, z: 1 };
    const z = Math.max(1, Number(c?.z || 1));
    const scale = base * z;
    const dw = iw * scale;
    const dh = ih * scale;
    const cx = size / 2 + relToPx(c?.x, size);
    const cy = size / 2 + relToPx(c?.y, size);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png', 0.92);
    });
 }, []);


  // грузим на сервер и ставим icon=url (но НЕ сохраняем профиль — это сделает основной Save)
  const useUploadedPhoto = async () => {
    if (!uid || !finalAvatarBlob || uploadBusy) return;
    setUploadBusy(true);
    try {
 
      const fd = new FormData();
      fd.append('uid', uid);
      fd.append('file', finalAvatarBlob, 'avatar.png');

      const r = await fetch('/api/profile/upload-avatar', { method: 'POST', body: fd });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok || !j?.url) return;

      // важно: icon становится url, но сохранение только по главной кнопке Save
      setIcon(j.url);
    } finally {
      setUploadBusy(false);
    }
  };

  // валидация ника
  const [nickFree, setNickFree] = useState(null)   // null|true|false
  const [nickBusy, setNickBusy] = useState(false)  // идет проверка
  const [busy, setBusy] = useState(false)          // сохранение
  useEffect(() => {
  if (!open || !uid) return;
  const l = readLocal() || {};
  setNick(l.nickname || '');
  setIcon(l.icon || ICONS[0]);
}, [open, uid, readLocal]);

// дебаунс-проверка ника в базе
useEffect(() => {
  if (!open || !uid) {
    setNickFree(null);
    setNickBusy(false);
    return;
  }

  const val = String(nick || '').trim();
  if (!val) {
    setNickFree(null);
    setNickBusy(false);
    return;
  }

  setNickBusy(true);
  const h = setTimeout(async () => {
    try {
      const url = `/api/profile/check-nick?nick=${encodeURIComponent(val)}&uid=${encodeURIComponent(uid)}`;
      const r = await fetch(url, { method: 'GET', cache: 'no-store' });
      const j = await r.json().catch(() => null);

      // j?.ok === false или странный ответ — считаем «не знаем», но НЕ кидаем ошибок
      if (!j || j.error) {
        setNickFree(null);
      } else {
        setNickFree(!!j.free);
      }
    } catch {
      // любая сеть/бэк — просто "не знаем"
      setNickFree(null);
    } finally {
      setNickBusy(false);
    }
  }, 300);

  return () => clearTimeout(h);
}, [open, nick, uid]);


if (!open || !anchorRef?.current || !uid) return null;

// ===== позиционирование попапа (LTR/RTL) =====
const isRtl =
  typeof document !== 'undefined' &&
  (document.documentElement?.dir === 'rtl' ||
    getComputedStyle(document.documentElement).direction === 'rtl');

const el = anchorRef.current;

// ищем ближайшего “контейнерного” родителя, относительно которого будет absolute-позиционирование
const parent =
  el.offsetParent ||
  el.parentElement ||
  el.closest('section') ||
  document.body;

const parentRect = parent?.getBoundingClientRect?.() || { top: 0, left: 0, right: 0 };
const rect = el.getBoundingClientRect();

// top/left/right — теперь ВНУТРИ parent (а не в координатах окна)
const top = Math.round((rect.bottom - parentRect.top) + 8);

// LTR — обычный left
const left = isRtl ? undefined : Math.round(rect.left - parentRect.left);

// RTL — прижимаем по правому краю parent
const right = isRtl ? Math.round(parentRect.right - rect.right) : undefined;

const save = async () => {
  const n = String(nick || '').trim();
  if (!n || nickFree === false || busy || !uid) return;

  // ===== OPTIMISTIC UI (сразу обновляем всё в интерфейсе пользователя) =====
  const prevLocal = readLocal() || {};
  const prevNick = prevLocal.nickname || '';
  const prevIcon = prevLocal.icon || ICONS[0];

  // если выбран файл — показываем везде то, что уже есть в превью
  const optimisticIcon = uploadFile ? (finalAvatarUrl || rawAvatarUrl || icon) : icon;

  mergeProfileCache(uid, { nickname: n, icon: optimisticIcon, updatedAt: Date.now() });
  onSaved?.({ nickname: n, icon: optimisticIcon });

  // закрываем поповер мгновенно (дальше всё догружается в фоне)
  onClose?.();

  // ===== серверная часть (в фоне): загрузка аватара + сохранение =====
  if (mountedRef.current) setBusy(true);
  try {
    let iconToSend = icon;

    // Если выбрано пользовательское фото — модерируем и грузим в /api/forum/upload.
    if (uploadFile) {
      if (mountedRef.current) setUploadBusy(true);
      try {
        // 0) MODERATION: точно так же, как в attach (paperclip)
        try {
          const mod = await moderateImageFiles([uploadFile]);
          if (mod?.decision === 'block') {
            toastI18n('warn', 'forum_image_blocked', 'Image rejected by community rules');
            toastI18n('info', reasonKey(mod?.reason), reasonFallbackEN(mod?.reason));
            // rollback optimistic
            mergeProfileCache(uid, { nickname: prevNick, icon: prevIcon, updatedAt: Date.now() });
            onSaved?.({ nickname: prevNick, icon: prevIcon });
            cleanupObjectUrlsIfStale();      
            return;
          }
          if (mod?.decision === 'review') {
            try { console.warn('[moderation] avatar review -> allow (balanced)', mod?.reason, mod?.raw); } catch {}
          }
        } catch (err) {
          console.error('[moderation] avatar check failed', err);
          toastI18n('err', 'forum_moderation_error', 'Moderation service is temporarily unavailable');          toastI18n('info', 'forum_moderation_try_again', 'Please try again');
          // rollback optimistic
          mergeProfileCache(uid, { nickname: prevNick, icon: prevIcon, updatedAt: Date.now() });
          onSaved?.({ nickname: prevNick, icon: prevIcon });
           cleanupObjectUrlsIfStale();     
          return;
        }

        // 1) берём финальный кроп-blob; если ещё не готов — пробуем собрать прямо сейчас
        let blob = finalAvatarBlob;
        if (!blob) blob = await makeCroppedPngBlob({ size: 512 });

        const fd = new FormData();
        if (blob) {
          const file = new File([blob], `avatar-${uid}-${Date.now()}.png`, { type: 'image/png' });
          fd.append('files', file);
        } else {
          // крайний случай: отправляем исходный файл (без кропа), чтобы не стопорить UX
          fd.append('files', uploadFile);
        }

        const up = await fetch('/api/forum/upload', { method: 'POST', body: fd, cache: 'no-store' });
        const uj = await up.json().catch(() => ({}));
        if (!up.ok || !uj?.urls?.[0]) {
          console.warn('avatar upload failed', uj);
          // rollback optimistic
          mergeProfileCache(uid, { nickname: prevNick, icon: prevIcon, updatedAt: Date.now() });
          onSaved?.({ nickname: prevNick, icon: prevIcon });
          cleanupObjectUrlsIfStale();     
          return;
        }

        iconToSend = uj.urls[0];

        // ✅ reconcile: подменяем blob-превью на реальный URL (чтобы пережило перезагрузку)
        mergeProfileCache(uid, { icon: iconToSend, updatedAt: Date.now() });
        onSaved?.({ nickname: n, icon: iconToSend });
        cleanupObjectUrlsIfStale();     
      } finally {
        if (mountedRef.current) setUploadBusy(false);
      }
    } else {
      iconToSend = icon;
    }


    const r = await fetch('/api/profile/save-nick', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nick: n,
        icon: iconToSend,
        accountId: uid,  // основной ID
        asherId: uid,    // зеркало, чтоб бэку было всё равно
      }),
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      if (j?.error === 'nick_taken' && mountedRef.current) setNickFree(false);
      // rollback optimistic
      mergeProfileCache(uid, { nickname: prevNick, icon: prevIcon, updatedAt: Date.now() });
      onSaved?.({ nickname: prevNick, icon: prevIcon });
      cleanupObjectUrlsIfStale();    
      return;
    }

    const savedNick = j.nick || n;
    const savedIcon = j.icon || iconToSend || optimisticIcon;
    const savedAccountId = String(j.accountId || uid || '').trim();

    writeProfileAlias(uid, savedAccountId);
    mergeProfileCache(savedAccountId, { nickname: savedNick, icon: savedIcon, updatedAt: Date.now() });
  // финальный reconcile на ответ бэка
    onSaved?.({ nickname: savedNick, icon: savedIcon });
    cleanupObjectUrlsIfStale();
  } finally {
if (mountedRef.current) setBusy(false);
  }
};


  return (

    <div className="profilePop" 
    style={{ top, left, right }}
    translate="no"
    >
  
      <div className="text-lg font-bold mb-2">{t('forum_account_settings')}</div>

      {/* Под заголовком: слева бейдж со звездой, справа квадратный Upload Avatar (одна линия) */}
      <div className="profileTopRow">
        <div className="profileBadgeLeft">
          <FollowersCounterInline
            t={t}
            viewerId={viewerId}
            count={myFollowersCount}
            loading={myFollowersLoading}
          />
        </div>

        <button
          type="button"
          ref={avaBoxRef}
          className="avaUploadSquare" 
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}       
          title="Upload avatar"
          aria-label="Upload avatar"
        >
          {/* PREVIEW:
              - до декода показываем исходник (без квадратного object-fit crop)
              - после декода рисуем на canvas (полное изображение + drag/zoom),
                а кроп в PNG делаем ТОЛЬКО при Save.
          */}
          {rawAvatarUrl && !uploadFile && (
            <img
              src={rawAvatarUrl}
              alt=""
              className="avaUploadSquareImgFallback"
            />
          )}

          {rawAvatarUrl && uploadFile && !(imgInfo.w && imgInfo.h) && (
            <img
              src={rawAvatarUrl}
              alt=""
              className="avaUploadSquareImgFallback"
            />
          )}

          {uploadFile && (imgInfo.w && imgInfo.h) && (
            <canvas
              ref={previewCanvasRef}
              className="avaUploadSquareCanvas" 
            />
          )}
          {!uploadFile && (
            <div className="avaUploadSquareTxt">UPLOAD<br/>AVATAR</div>
          )}
          {uploadFile && !finalAvatarUrl && !rawAvatarUrl && (
            <div className="avaUploadSquareTxt">PROCESSING…</div>
          )}          
          {uploadBusy && (
            <div className="avaUploadSquareBusy">{t('saving') || 'Saving…'}</div>
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="avaFileInput"
          onChange={onPickFile}
        />
      </div>

      {/* Zoom: следующей строкой, на всю ширину, адаптив */}
      <div className="avaZoomWideRow">
        <span className="avaZoomLbl">Zoom</span>
        <input
          type="range"
          className="cyberRange"
          min="1"
          max="3"
          step="0.01"
          value={crop.z}
          disabled={!uploadFile}
          onChange={(e) => {
            const v = Number(e.target.value);
            setCrop((c) => {
              const next = clampCrop({ ...c, z: v });
              cropLiveRef.current = next;
              try { requestPreviewDraw(); } catch {}
              return next;
            });
          }}
        />
      </div>
      <div className="grid gap-2">
        <label className="block">
          <div className="meta mb-1">{t('forum_profile_nickname')}</div>
          <input
            className={['input',
              nickFree===true ? 'ok' : '',
              nickFree===false ? 'bad' : ''
            ].join(' ')}
            maxLength={24}
            value={nick}
            onChange={e => setNick(e.target.value)}
            placeholder={t('forum_profile_nickname_ph')}
          />
        <div className="meta mt-1">
            {nickBusy && (t('checking') || 'Проверяю…')}
            {!nickBusy && nickFree===true  && (t('nick_free')  || 'Ник свободен')}
            {!nickBusy && nickFree===false && (t('nick_taken') || 'Ник уже занят')}
          </div>
        </label>
        <div>
           
          <div className="profileAvatarHead">
            <div className="meta">{t('forum_profile_avatar')}</div>
            <div className="meta" style={{ opacity: .7 }}>
              {uploadFile ? `${imgInfo.w || 0}×${imgInfo.h || 0}` : (t('') || '')}
            </div>
          </div>
<div className="profileList">
  {/* VIP блок (верхняя строка) */}
  <div className="p-1">
    <div className="emojiTitle">{t('') /* "VIP+ аватары" */}</div>
    <div className="iconWrap">
      {VIP_AVATARS.slice(0,130).map(src => (
        <button
          key={src}
          className={cls('avaMini', icon===src && 'tag', 'hoverPop')}
          onClick={()=>{

  if (!vipActive){
    try { toast?.warn?.(t?.('forum_vip_required') || 'VIP+ only') } catch {}
    try { document.activeElement?.blur?.() } catch {}
    return;
  }
  
            setIcon(src) }}
          title={vipActive ? '' : (t('forum_vip_only') || 'Только для VIP+')}
          style={{ position:'relative', width:40, height:40, padding:0 }}
        >
          <Image src={src} alt="" width={40} height={40} unoptimized style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }}/>
         {!vipActive && <span className="lockBadge" aria-hidden>🔒</span>}
        </button>       
      ))}
    </div>
  </div>

  {/* разделитель между VIP и обычными */}
  <div style={{height:1,opacity:.2,background:'currentColor',margin:'20px 4px'}} />

  {/* обычные эмодзи-аватары ниже (как было) */}
  <div className="iconWrap p-1">
    {ICONS.map(ic => (
      <button
        key={ic}
        className={cls('avaMini', icon === ic && 'tag', vipActive && 'vip')}
        onClick={() => setIcon(ic)}
        title={ic}
        style={{ width: 40, height: 40, fontSize: 22 }}
      >
        {ic}
      </button>
    ))}
  </div>
</div>

        </div>
        <div className="flex items-center justify-end gap-2">
          <button className="btn btnGhost" onClick={onClose}>{t('forum_cancel')}</button>
          <button
            className="btn"
            disabled={busy || nickBusy || !String(nick||'').trim() || nickFree===false}
            onClick={save}
          >
            {busy ? (t('saving')||'Сохраняю…') : t('forum_save')}
          </button>
        </div>
      </div>
    </div>
    
  )
}


/* =========================================================
   UI: посты/темы
========================================================= */

function TopicItem({ t, agg, onOpen, onView, isAdmin, onDelete, authId, onOwnerDelete, viewerId, starredAuthors, onToggleStar }) {

  const { posts, likes, dislikes, views } = agg || {};
  const authorId = String(resolveProfileAccountId(t?.userId || t?.accountId) || '').trim();
  const isSelf = !!viewerId && authorId && (String(viewerId) === authorId);
  const isStarred = !!authorId && !!starredAuthors?.has?.(authorId);
  const isVipAuthor = useVipFlag(authorId, t?.vipActive ?? t?.isVip ?? t?.vip ?? t?.vipUntil ?? null);

  // считаем просмотр темы, когда карточка попадает в viewport (не чаще 1 раза на bucket в LS)
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ref.current) return;
    if (typeof onView !== 'function') return;

    const el = ref.current;
    let fired = false;
    const io = new IntersectionObserver((entries) => {
      const e = entries && entries[0];
      if (!e) return;
      if (fired) return;
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        fired = true;
        onView(t?.id);
       io.disconnect();
      }
    }, { threshold: [0.6] });

    io.observe(el);
    return () => { try { io.disconnect(); } catch {} };
 }, [onView, t?.id]);

  return (
    <div ref={ref} className="item qshine cursor-pointer" onClick={() => onOpen?.(t)} style={{ position: 'relative' }}>
      <div className="flex flex-col gap-3">
        {/* верх: аватар → ник */}
        {(t.nickname || t.icon) && (
  <div className="topicUserRow">
    <div className="avaMini">
      <AvatarEmoji
        userId={authorId}
        pIcon={resolveIconForDisplay(authorId, t.icon)}
      />
    </div> 
    <button
      type="button"
      className={cls('nick-badge nick-animate', isVipAuthor && 'vipNick')}
      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
      title={authorId || ''}
      style={{ flex: '0 1 auto', minWidth: 0 }}
      translate="no"
   >
    
      <span className="nick-text">
        {resolveNickForDisplay(authorId, t.nickname)}
      </span>
    </button>

    {!!authorId && !isSelf && (
      <StarButton
        on={isStarred}
        onClick={() => onToggleStar?.(authorId)}
        title={isStarred ? 'Вы подписаны' : 'Подписаться на автора'}
      />
    )}
{isVipAuthor && <VipFlipBadge />}   
  </div>

        )}

        {/* контент: заголовок → описание → время */}
        <div className="min-w-0"> 
<div
  className="
    topicTitle text-[#eaf4ff]
    !whitespace-normal break-words
    [overflow-wrap:anywhere]
    max-w-full"
>
  {t.title}
</div>

{t.description && (
  <div
    className="
      topicDesc text-[#eaf4ff]/75 text-sm
      !whitespace-normal break-words
      [overflow-wrap:anywhere]
      max-w-full mt-1"
  >
    {t.description}
  </div>
)}


          <div className="meta mt-1" suppressHydrationWarning>
            <HydrateText value={human(t.ts)} />
          </div> 
        </div>

        {/* низ: счётчики/кнопки (как было) */}
        <div className="flex items-center gap-2 pt-1">
          <span className="tag">👓 <HydrateText value={formatCount(views)} /></span>
          <span className="tag">📣 <HydrateText value={formatCount(posts)} /></span>
          <span className="tag">💕 <HydrateText value={formatCount(likes)} /></span>
          <span className="tag">🤮 <HydrateText value={formatCount(dislikes)} /></span>
          {isAdmin && (
            <button
              className="tag"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(t);
              }}
              title="Удалить тему"
            >
              🗑
            </button>
          )}
        </div>

        {/* OWNER: меню троеточия для владельца темы */}
        {(authId && (authId === (t.userId || t.accountId))) && (
          <div className="ownerKebab" onClick={(e)=>{ e.stopPropagation(); }}>
            <button className="kebabBtn" type="button" aria-label="Меню темы">⋮</button>     
            <div className="ownerMenu">
              <button
                type="button"
                className="danger"
                onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onOwnerDelete?.(t); }}
              >
                🗑
              </button>
            </div>
          </div>
        )}        
      </div>
    </div>
  );
}

function StarButton({ on, onClick, title, disabled=false }) {
  return (
    <button
      type="button"
      className={`starBtn ${on ? 'on' : 'off'} ${disabled ? 'dis' : ''}`}
      title={title || (on ? 'Отписаться' : 'Подписаться')}
      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); if(!disabled) onClick?.(e); }}
      data-no-thread-open="1"
      aria-pressed={!!on}
      aria-disabled={disabled}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
          d="M12 17.3l-5.4 3.2 1.5-6.2-4.9-4.1 6.4-.5L12 3.8l2.4 5.9 6.4.5-4.9 4.1 1.5 6.2L12 17.3Z"
          className="starPath"
        />
      </svg>
    </button>
  );
}


function PostCard({
  p,
  parentAuthor,
  onReport, 
  onOpenThread,
  onReact,
  isAdmin,
  onDeletePost,
  onOwnerDelete,  
  onBanUser,
  onUnbanUser,
  isBanned,
  authId,
  markView,
  t, // локализация
  isVideoFeed = false, // ✅ NEW
  viewerId,
  starredAuthors,
  onToggleStar,
}) {


  // берём locale из того же хука, что и в новостном хабе
  const { locale } = useI18n();
 
  // сниппет текста родителя (до 40 символов)
  const parentSnippet = (() => {
    const raw = p?.parentText || p?._parentText || '';
 

    if (!raw) return null;
    const s = String(raw).replace(/\s+/g, ' ').trim();
    return s.length > 40 ? s.slice(0, 40) + '…' : s;
  })();


  const [lightbox, setLightbox] = React.useState({ open:false, src:null, idx:0, list:[] });

  // безопасные числовые поля
  const views    = Number(p?.views ?? 0);
  const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim();
  const isSelf = !!viewerId && authorId && (String(viewerId) === authorId);
  const isStarred = !!authorId && !!starredAuthors?.has?.(authorId);
  const isVipAuthor = useVipFlag(authorId, p?.vipActive ?? p?.isVip ?? p?.vip ?? p?.vipUntil ?? null);

  const replies  =   Number(
    p?.replyCount ??
    p?.repliesCount ??
    p?.answersCount ??
    p?.commentsCount ??
    p?.__repliesCount ??
    0
  );
  const likes    = Number(p?.likes ?? 0);
  const dislikes = Number(p?.dislikes ?? 0);

  const IMG_RE = /^(?:\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)|https?:\/\/[^\s]+?\.(?:webp|png|jpe?g|gif))(?:[?#].*)?$/i;
  // видео: blob: (локальный превью) или публичные ссылки /video-*.webm|.mp4 (и любые .mp4)

  // видео: blob: (локальный превью) или публичные ссылки /video-*.webm|.mp4 (и любые .mp4)
  const VIDEO_RE =
    /^(?:blob:[^\s]+|https?:\/\/[^\s]+(?:\/video-\d+\.(?:webm|mp4)|\.mp4)(?:[?#].*)?)$/i;

  // YouTube: обычные watch + короткие youtu.be
  const YT_RE =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;

  // TikTok: базовые форматы ссылок на видео
  const TIKTOK_RE =
    /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/(@[\w.\-]+\/video\/(\d+)|t\/[A-Za-z0-9]+)(?:[?#].*)?$/i;

// аудио: поддерживаем https и blob: (blob используется только локально, но подстрахуемся)
  const AUDIO_EXT = /\.(?:webm|ogg|mp3|m4a|wav)(?:$|[?#])/i;
  const isAudioLine = (s) => {
    const t = String(s).trim();
    if (!t) return false;
    // одиночный URL в строке
    if (!/^\S+$/.test(t)) return false;
    // blob: — тип неизвестен (может быть видео) → не относим к аудио
    if (/^blob:/.test(t)) return false;
    // https://… или твои относительные пути
    if (/^https?:\/\//i.test(t) || /^\/uploads\/audio\//i.test(t) || /\/forum\/voice/i.test(t)) {
      if (AUDIO_EXT.test(t)) return true;
      if (/[?&]filename=.*\.(webm|ogg|mp3|m4a|wav)(?:$|[&#])/i.test(t)) return true;
    }
    return false;
  };

  // --- ДОБАВЛЕНО: общий извлекатель URL из строки (ловит любые http/https-URL внутри текста)
  const URL_RE = /(https?:\/\/[^\s<>'")]+)/ig;
  const collectMatches = (lines, testRe) => {
    const out = [];
    for (const s of lines) {
     const str = String(s || '');
      if (!str) continue;
      const it = str.matchAll(URL_RE);
      for (const m of it) {
        const u = m[0];
        if (testRe.test(u)) out.push(u);
      }
    }
    // убираем дубли, сохраняя порядок
    return Array.from(new Set(out));
  };
  const allLines   = String(p?.text || '').split(/\r?\n/);
  const trimmed    = allLines.map(s => s.trim());

  // --- ДОБАВЛЕНО: собираем медиа-URL не только из «одиночных» строк,
  // но и из любых строк, где они встречаются.
  const imgInline   = collectMatches(allLines, IMG_RE);
  const videoInline = collectMatches(allLines, VIDEO_RE);
  const audioInline = collectMatches(allLines, AUDIO_EXT);
  const ytInline    = collectMatches(allLines, YT_RE);
  const tiktokInline = collectMatches(allLines, TIKTOK_RE);

  const ytLines     = Array.from(new Set(ytInline));
  const tiktokLines = Array.from(new Set(tiktokInline));

  const imgLines = Array.from(new Set([
    ...trimmed.filter(s => IMG_RE.test(s)),
    ...imgInline
  ]));

  const videoLines = Array.from(new Set([
    ...trimmed.filter(s => VIDEO_RE.test(s)),
    ...videoInline
  ]));

  const audioLines = Array.from(new Set([
    // прежняя логика одиночной строки + защита от попадания видео в аудио
    ...trimmed.filter(isAudioLine).filter(s => !VIDEO_RE.test(s)),
    // а также ссылки на аудио, встречающиеся внутри текста
    ...audioInline.filter(u => !VIDEO_RE.test(u))
  ]));

  // очищаем текст: убираем из строк видео/yt/tiktok/аудио/картинки, но оставляем обычные ссылки
const cleanedText = allLines
  .map((s) => {
    let line = String(s ?? '');
    const raw = line.trim();
    if (!raw) return '';

    // ✅ NEW: в видеоленте скрываем строки, которые состоят ТОЛЬКО из "не-медиа" ссылки
    if (isVideoFeed) {
      const mOnlyUrl = raw.match(/^(https?:\/\/\S+)$/i);
      if (mOnlyUrl) {
        const u = mOnlyUrl[1];
        const playable =
          IMG_RE.test(u) ||
          VIDEO_RE.test(u) ||
          isAudioLine(u) ||
          YT_RE.test(u) ||
          // TikTok playable только /@.../video/ID
          /^(?:https?:\/\/)?(?:(?:www|m)\.)?tiktok\.com\/@[\w.\-]+\/video\/\d+(?:[?#].*)?$/i.test(u);

        if (!playable) return ''; // 👈 вот это убирает голые ссылки в видеоленте
      }
    }

    // вырезаем из строки все "медийные" URL ...
    line = line.replace(URL_RE, (u) => {
      const uTrim = u.trim();
      if (
        IMG_RE.test(uTrim) ||
        VIDEO_RE.test(uTrim) ||
        isAudioLine(uTrim) ||
        YT_RE.test(uTrim) ||
        TIKTOK_RE.test(uTrim)
      ) {
        return '';
      }
      return u;
    });

    line = line.replace(/\s{2,}/g, ' ').trim();
    return line;
  })

    // и дополнительно отсекаем пустые строки и строки, которые всё ещё состоят только из вложений
    .filter((line) => {
      if (!line) return false;
      const t = line.trim();
      return (
        t &&
        !IMG_RE.test(t) &&
        !VIDEO_RE.test(t) &&
        !isAudioLine(t) &&
        !YT_RE.test(t) &&
        !TIKTOK_RE.test(t)
      );
    })
    .join('\n');
 // --- перевод основного текста поста (ТОЛЬКО текст, без медиа) ---
  const [isTranslated, setIsTranslated] = React.useState(false);
  const [translateLoading, setTranslateLoading] = React.useState(false);
  const [translatedBody, setTranslatedBody] = React.useState(null);

  // при смене поста или изменении очищенного текста — сбрасываем перевод
  React.useEffect(() => {
    setIsTranslated(false);
    setTranslateLoading(false);
    setTranslatedBody(null);
  }, [p?.id, cleanedText]);

  // какой текст сейчас показывать в теле поста
  const displayText =
    isTranslated && translatedBody ? translatedBody : cleanedText;

  async function handleToggleTranslate(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!cleanedText?.trim()) return;

    // если уже перевели — просто показываем оригинал
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    setTranslateLoading(true);
    try {
      const tBody = await translateText(cleanedText, locale);
      setTranslatedBody(tBody);
      setIsTranslated(true);
    } finally {
      setTranslateLoading(false);
    }
  }

  const translateBtnLabel = translateLoading
    ? (t?.('crypto_news_translate_loading') || 'Перевод...')
    : isTranslated
      ? (t?.('crypto_news_show_original') || 'Показать оригинал')
      : (t?.('crypto_news_translate') || 'Перевести');
        const hasCleanedText = !!cleanedText.trim();
  const ytOrigin = React.useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    []
  );
  const ytEmbedParams = React.useMemo(() => {
    const params = new URLSearchParams({
      enablejsapi: '1',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
    });
    if (ytOrigin) params.set('origin', ytOrigin);
    return params.toString();
  }, [ytOrigin]);
  // ===== OWNER-меню (⋮) — только если владелец поста =====
  const isOwner = !!authId && (String(authId) === String(resolveProfileAccountId(p?.userId || p?.accountId)));
  const ownerEdit = (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('forum:edit', { detail: { postId: p.id, text: p.text } }));
    }
  };
  const ownerDelete = async (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    onOwnerDelete?.(p);
  };

// 👇 добавь рядом с PostCard (прямо над return), как константу
const NO_THREAD_OPEN_SELECTOR =
  'button,.tag,a,svg,' +
  'video,audio,iframe,' +                 // медиа-элементы
  '.imgWrap,.videoCard,.audioCard,' +     // твои карточки/обёртки
  '[data-no-thread-open="1"]';            // универсальный флажок на будущее

  return (
    <article
      className="item qshine"
      data-forum-post-card="1"
      data-forum-post-id={String(p?.id || '')}
      onClick={(e) => {
        if (e.target.closest(NO_THREAD_OPEN_SELECTOR)) return;
        onOpenThread?.(p);
      }}
      role="article"
      aria-label="Пост форума"
>
      {/* OWNER kebab (⋮) в правом верхнем углу — не трогаем существующую разметку */}
      {isOwner && (
        <div className="ownerKebab" onClick={(e)=>{ e.stopPropagation(); }} style={{ position:'absolute', right:8, top:8 }}>
          <button className="kebabBtn" type="button" aria-label="Меню поста">⋮</button>
          <div className="ownerMenu">
            <button type="button" onClick={ownerEdit}>✏️</button>
            <button type="button" className="danger" onClick={ownerDelete}>🗑</button>
          </div>
        </div>
      )}

      {/* шапка: Аватар слева, Ник справа (в одну строку), без времени */}
      <div className="postUserRow mb-2">
        <div className="avaMini">
          <AvatarEmoji
            userId={authorId}
            pIcon={resolveIconForDisplay(authorId, p.icon)}
          />
        </div>
      
<span className={cls('nick-badge nick-animate', isVipAuthor && 'vipNick')} translate="no">

  <span className="nick-text truncate">
    {resolveNickForDisplay(authorId, p.nickname)}
  </span>
</span>


        {!!authorId && !isSelf && (
          <StarButton
            on={isStarred}
            onClick={() => onToggleStar?.(authorId)}
            title={isStarred ? 'Вы подписаны' : 'Подписаться на автора'}
          />
        )}
{isVipAuthor && <VipFlipBadge />}
      </div> 
        {p.parentId && (
          <span className="tag ml-1 replyTag" aria-label={t?.('forum_reply_to') || 'Ответ для'}>
            {(t?.('forum_reply_to') || 'ответ для') + ' '}
            {parentAuthor ? '@' + parentAuthor : '…'}
            {parentSnippet && <>: “{parentSnippet}”</>}
          </span>
        )} 
 
      {/* изображения: естественные пропорции, без квадратного кропа */}
      {imgLines.length > 0 && (
        <div className="postImages" style={{display:'grid', gap:8, marginTop:8}}>
          {imgLines.map((src, i) => (
            <figure
              key={i}
              className="imgWrap mediaBox"
              data-kind="image"
              style={{ margin: 0 }}
            onClick={(e)=>{ e.stopPropagation(); setLightbox({ open:true, src, idx:i, list:imgLines }); }}>
             <Image
                src={src}
                alt=""
               width={1200}
                height={800}
                unoptimized
                loading="lazy"
                className="mediaBoxItem"
                style={{ objectFit: 'contain' }}
              />
            </figure>
          ))}
        </div>
      )}

      {/* видео: отдельные карточки с <video controls> */}
      {videoLines.length > 0 && (
        <div className="postVideo" style={{display:'grid', gap:8, marginTop:8}}>
          {videoLines.map((src, i) => (
            <div key={`v${i}`} className="videoCard mediaBox" data-kind="video" style={{ margin: 0 }}>
        <video
          data-forum-video="post"   // ← помечаем, что это плеер из поста
          data-forum-media="video"
          src={src}
          controls
          playsInline
          preload="none"
          className="mediaBoxItem"
          style={{
            objectFit: 'contain', 
            background: '#000'
          }}
        /> 
 
            </div>
          ))}
        </div>
      )}
      {/* YouTube-видео: рендерим в тех же карточках через iframe */}
      {ytLines.length > 0 && (
        <div className="postVideo" style={{display:'grid', gap:8, marginTop:8}}>
          {ytLines.map((src, i) => {
            const m = src.match(YT_RE);
            if (!m) return null;
            const videoId = m[1];
            return (
              <div
                key={`yt${i}`}
                className="videoCard mediaBox"
                data-kind="iframe"
                style={{ margin: 0 }}
              >
<iframe
  src=""
  data-src={`https://www.youtube.com/embed/${videoId}?${ytEmbedParams}`}
  title="YouTube video"
  id={`yt_${p?.id || 'post'}_${i}`}
  data-yt-id={videoId}
  data-forum-media="youtube"
  loading="lazy"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowFullScreen
  className="mediaBoxItem"
/>

              </div>
            );
          })}
        </div>
      )}
      {/* TikTok-видео: встраиваем через iframe */}
      {tiktokLines.length > 0 && (
        <div className="postVideo" style={{display:'grid', gap:8, marginTop:8}}>
{tiktokLines.map((src, i) => {
  // Пробуем вытащить ID (работает для /@user/video/ID)
  let videoId = null;
  try {
    const u = new URL(src);
    const m = u.pathname.match(/\/video\/(\d+)/);
    if (m) videoId = m[1];
  } catch {}

  // ✅ если ID нет (например, vm.tiktok.com/....) — не рендерим iframe,
  // а показываем аккуратную карточку-ссылку (НЕ голый URL в тексте)
  if (!videoId) {
    return (
      <div
        key={`tt_link_${i}`}
        className="videoCard"
        style={{
          margin:0,
          padding:10,
          background:'rgba(10,16,28,.35)',
          border:'1px solid rgba(140,170,255,.25)',
          borderRadius:10,
          overflow:'hidden',
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          gap:10
        }}
      >
        <div style={{minWidth:0}}>
          <div style={{fontWeight:700, fontSize:14}}>TikTok</div>
          <div style={{opacity:.75, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
            {src}
          </div>
        </div>

        <a
          className="btn btnGhost btnSm"
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e)=>e.stopPropagation()}
          style={{flex:'0 0 auto'}}
          title="Open"
        >
          Open
        </a>
      </div>
    );
  }

  // ✅ обычный embed по ID
  return (
    <div
      key={`tt${i}`}
      className="videoCard mediaBox"
      data-kind="iframe"
      style={{ margin: 0 }}
    >
      <iframe
        src=""
        title="TikTok video"
        data-forum-media="tiktok"
        data-src={`https://www.tiktok.com/embed/v2/${videoId}`} 
        loading="lazy"       
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="mediaBoxItem"
      />
    </div>
  );
})}

        </div>
      )}

      {/* аудио: «невидимая» ссылка → карточка с плеером */}
      {audioLines.length > 0 && (
        <div className="postAudio" style={{display:'grid', gap:8, marginTop:8}}>
          {audioLines.map((src, i) => (
            <div key={i} className="audioCard mediaBox" data-kind="audio">
              <QCastPlayer src={src} />
            </div>
          ))}
        </div>
      )}

      {/* время создания + переключатель перевода — ниже контента */}
      <div
        className="meta mt-2 flex items-center justify-between gap-2"
        suppressHydrationWarning
      >
        <HydrateText value={human(p.ts)} />

      </div>

      {/* тело поста — крупные эмодзи (VIP/MOZI) как картинка, иначе очищенный текст */}
      {(/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/).test(p.text || '') ? (
        <div className="postBody emojiPostWrap">
          <div className="vipMediaBox" data-kind="sticker">
          <Image
            src={(p.text || '').replace(/^\[(VIP_EMOJI|MOZI):(.*?)\]$/, '$2')}
            alt=""
            width={512}
            height={512}
            unoptimized
            className={
              (p.text || '').startsWith('[MOZI:')
                ? 'moziEmojiBig emojiPostBig'
                : 'vipEmojiBig emojiPostBig'
            }
            style={{ width: '100%', height: 'auto' }}
          />
          </div>
        </div>
      ) : (
        displayText.trim() && (
          <div
            className="text-[15px] leading-relaxed postBody whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: rich(displayText) }}
          />
        )
      )}
      {/* нижняя полоса: СЧЁТЧИКИ + РЕАКЦИИ + (ПЕРЕНЕСЁННЫЕ) ДЕЙСТВИЯ — В ОДНУ СТРОКУ */}
      <div
        className="mt-3 flex items-center gap-2 text-[13px] opacity-80 actionBar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1.5vw, 8px)',     // адаптивный зазор вместо фикс. 20px
          flexWrap: 'nowrap',                 // в одну линию
          overflowX: 'clip',                  // без горизонтальной прокрутки
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          fontSize: 'clamp(9px, 1.1vw, 13px)' // можно оставить как было
        }}
      >
        <span className="tag" title={t?.('forum_views') || 'Просмотры'} suppressHydrationWarning>
          🔎 <HydrateText value={views} />
        </span>

        <span
          className="tag cursor-pointer"
          title={t?.('forum_replies') || 'Ответы'}
          onClick={(e) => { e.stopPropagation(); onOpenThread?.(p); }}
          suppressHydrationWarning>
          💬 <HydrateText value={replies} />
        </span>

        <button
          type="button"
          className="btn btnGhost btnXs"
          title={t?.('forum_like') || 'Лайк'}
          onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onReact?.(p,'like'); }}
        >
          💘 <HydrateText value={likes} />
        </button>

        <button
          type="button"
          className="btn btnGhost btnXs"
          title={t?.('forum_dislike') || 'Дизлайк'}
          onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onReact?.(p,'dislike'); }}
        >
          👎 <HydrateText value={dislikes} />
        </button>

        {/* разделяем левый и правый края, но остаёмся в одном ряду */}
        <div style={{ flex: '0 0 clamp(8px, 2vw, 16px)' }} />

        {/* действия (пожаловаться, ответить, бан/разбан, удалить) — справа в той же строке */}
        <button
          type="button"
          className="btn btnGhost btnXs"
          title={t?.('forum_report') || 'Пожаловаться'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReport?.(p); }}
        >⚠️</button>

        {isAdmin && (
          <>
            <button
              type="button"
              className="btn btnGhost btnXs"
              title={t?.('forum_delete') || 'Удалить'}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeletePost?.(p); }}
            >🗑</button>

            {isBanned ? (
              <button
                type="button"
                className="btn btnGhost btnXs"
                title={t?.('forum_unban') || 'Снять бан'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnbanUser?.(p); }}
              >✅</button>
            ) : (
              <button
                type="button"
                className="btn btnGhost btnXs"
                title={t?.('forum_ban') || 'Забанить'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBanUser?.(p); }}
              >⛔</button>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        className={`btn translateToggleBtn  ${isTranslated ? 'translateToggleBtnOn' : ''}`}
        onClick={handleToggleTranslate}
        disabled={translateLoading || !hasCleanedText}
      >
        <span className="translateToggleIcon">🌐</span>
        <span className="translateToggleText">{translateBtnLabel}</span>
        <span className="translateToggleIcon">🌐</span>
      </button>
    </article>
  );
}
function LoadMoreSentinel({ onVisible, disabled = false, rootMargin = '200px 0px' }) {
  const ref = React.useRef(null);
  const handlerRef = React.useRef(onVisible);

  React.useEffect(() => {
    handlerRef.current = onVisible;
  }, [onVisible]);

  React.useEffect(() => {
    if (disabled) return;
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      handlerRef.current?.();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) handlerRef.current?.();
        });
      },
      { root: null, rootMargin, threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [disabled, rootMargin]);

  return <div ref={ref} className="loadMoreSentinel" aria-hidden="true" />;
}

// --- helper: стабилизирует текст на время гидрации ---
function HydrateText({ value }) {
  const [mounted, setMounted] = React.useState(false);
  const initial = React.useRef(String(value)); // то, что отрендерил SSR
  React.useEffect(() => { setMounted(true); }, []);
  return (
    <span suppressHydrationWarning>
      {mounted ? String(value) : initial.current}
    </span>
  );
}
// --- live preview video: не перерисовывается каждую секунду таймера
function LivePreview({ streamRef, mirror }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    const s  = streamRef?.current;
    if (!el || !s) return;
    if (el.srcObject !== s) el.srcObject = s;
    el.muted = true;
    el.playsInline = true;
    el.play?.();
  }, [streamRef?.current]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
style={{
  width: '100%',
  height: '100%',
  // ВАЖНО: в оверлее НИЧЕГО не обрезаем ни в 9:16, ни в 16:9.
  // Должны быть «чёрные поля» если аспект не совпадает с экраном.
  objectFit: 'contain',
  borderRadius: 12,
  background: '#000',
        // mirror=true → визуально раззеркаливаем системную фронталку
        transform: mirror ? 'scaleX(-1)' : 'none'
      }}
    />
  );
}


// --- overlay камеры/плеера: fullscreen + старт/стоп ИМЕННО из оверлея ---
export function VideoOverlay({
  open,
  state,                 // 'live' | 'recording' | 'preview' | 'hidden'
  elapsed = 0,
  onStart,               // ← старт записи по REC в оверлее
  onStop,                // ← стоп записи по STOP в оверлее
  onResetConfirm,        // ← закрыть/сбросить
  streamRef,
  previewUrl,
  mediaKind = 'video',   // 'video' | 'image'  (для fullscreen-превью загруженного медиа)
  onAccept,              // ← зелёная галочка: принять (перенести в маленькое превью под композером)
  t,
}) {
  const tt = t || ((k)=>k);
  const rootRef = React.useRef(null);

  // нормализуем состояние
  const st = !open ? 'hidden' : (state || 'live');

  // антидубль кликов
  const blockClicksRef = React.useRef(false);

  // ===== служебные хуки: блок скролла/кликов фона + флаг на <html> =====
  usePageLock(!!open); // гасим скролл страницы
  useHtmlFlag('data-vo-open', open ? '1' : null); // даёт CSS-хук в layout

  // автофокус для ESC
  React.useEffect(() => { if (open) rootRef.current?.focus?.(); }, [open]);

  // ───────────────────────────────────────────────────────────
  // КЭШ УСТРОЙСТВ (чтобы на Android не дёргать разрешения по кругу)
  const devicesRef = React.useRef({ front: null, back: null, all: [] });
  const [facing, setFacing] = React.useState('user');

  const enumerateVideoInputs = React.useCallback(async () => {
    try {
      const list = (await navigator.mediaDevices.enumerateDevices())
        .filter(d => d.kind === 'videoinput');
      devicesRef.current.all = list;
      // эвристики по label
      const front = list.find(d => /front|user|face|facetime/i.test(d.label || '')) || list[0] || null;
      const back  = list.find(d => /back|rear|environment|wide|main/i.test(d.label || '')) || list[1] || list[0] || null;
      devicesRef.current.front = front?.deviceId || null;
      devicesRef.current.back  = back?.deviceId || null;
    } catch {}
  }, []);

  // при открытии live/recording — поднимем камеру, если ещё нет
  React.useEffect(() => {
    if (!open) return;
    if (!(st === 'live' || st === 'recording')) return;
    const cur = streamRef?.current;
    const hasTracks = !!cur && (cur.getVideoTracks?.().length || 0) > 0;
    if (hasTracks) return;
    (async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' } },
          audio: true,
        });
        streamRef.current = ms;
        try {
          // после первого разрешения станут доступны labels
          await enumerateVideoInputs();
          const s = ms.getVideoTracks?.()[0]?.getSettings?.();
          if (s?.facingMode) setFacing(s.facingMode);
        } catch {}
      } catch {}
    })();
  }, [open, st, streamRef, enumerateVideoInputs]);

  const previewVidRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    const v = previewVidRef.current;
    if (!v) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => setIsPlaying(false);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnd);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnd);
    };
  }, [open, state]);

  // === ЛОКАЛЬНАЯ НАСТРОЙКА ВЕРХНЕГО ОТСТУПА СЧЁТЧИКА ===
  React.useEffect(() => {
    if (!open) return;
    const TOP_OFFSET = '52px'; // ← ЗАДАЙ СВОЙ ОТСТУП (px, %, calc(...))
    try { rootRef.current?.style?.setProperty('--vo-top-offset', TOP_OFFSET); } catch {}
    return () => { try { rootRef.current?.style?.removeProperty('--vo-top-offset'); } catch {} };
  }, [open]);

  // аспект
  const [aspect, setAspect] = React.useState('16 / 9');
  const calcAspectFromTrack = React.useCallback(() => {
    try {
      const track = streamRef?.current?.getVideoTracks?.()[0];
      const s = track?.getSettings?.();
      const w = Number(s?.width || 0), h = Number(s?.height || 0);
      if (w && h) setAspect(w < h ? '9 / 16' : '16 / 9');
    } catch {}
  }, [streamRef]);

  React.useEffect(() => {
    if (open && (st==='live' || st==='recording')) calcAspectFromTrack();
  }, [open, st, calcAspectFromTrack]);

  const onMeta = React.useCallback((ev) => {
    const v = ev?.currentTarget;
    const w = v?.videoWidth || 0, h = v?.videoHeight || 0;
    if (w && h) setAspect(w < h ? '9 / 16' : '16 / 9');
  }, []);

  // Torch
  const [torchOn, setTorchOn] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const track = streamRef?.current?.getVideoTracks?.()[0];
    const s = track?.getSettings?.();
    if (s?.facingMode) setFacing(s.facingMode);
  }, [open, streamRef]);

  // при выходе из записи — выключить фонарик
  React.useEffect(() => {
    if (!open) return;
    if (st !== 'recording' && torchOn) {
      (async () => {
        try {
          const track = streamRef?.current?.getVideoTracks?.()[0];
          const caps  = track?.getCapabilities?.();
          if (caps && 'torch' in caps) await track.applyConstraints({ advanced: [{ torch: false }] });
        } catch {}
        setTorchOn(false);
      })();
    }
  }, [st, open, torchOn, streamRef]);

  // клик по галочке: жмём кнопку отправки композера
  const pressComposerSend = () => {
    try {
      const btn =
        document.querySelector('[data-composer-send]') ||
        document.querySelector('.forumComposer .planeBtn:not(.disabled)');
      if (btn) btn.click();
    } catch {}
  };

  const toggleTorch = async () => {
    try {
      const track = streamRef?.current?.getVideoTracks?.()[0];
      const caps  = track?.getCapabilities?.();
      if (!caps || !('torch' in caps)) return;
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(v => !v);
    } catch {}
  };

  // ───────────────────────────────────────────────────────────
  // СМЕНА КАМЕРЫ БЕЗ ПОВТОРНЫХ РАЗРЕШЕНИЙ (Android-friendly)
  const getStreamVideoOnlyByDeviceId = async (deviceId) => {
    return await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false, // важно: не просим аудио заново → меньше всплывающих разрешений
    });
  };

  const getStreamVideoOnlyByFacing = async (want /* 'user' | 'environment' */) => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: want } },
        audio: false,
      });
    } catch {}
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: want } },
        audio: false,
      });
    } catch {}
    return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  };

  // аккуратно освобождаем текущую видеокамеру (для Android)
  const stopVideoOnly = async (stream) => {
    try {
      const vts = stream?.getVideoTracks?.() || [];
      vts.forEach(t => t.stop());
      await new Promise(r => setTimeout(r, 30));
    } catch {}
  };

  const flipCamera = async () => {
    // переключаем только в live-превью; при записи и превью файла — выходим тихо
    if (st !== 'live') return;

    try {
      const next = facing === 'user' ? 'environment' : 'user';

      // пробуем без нового потока: applyConstraints на текущем видеотреке
      const curStream = streamRef?.current;
      const curVideoTrack = curStream?.getVideoTracks?.()[0];
      if (curVideoTrack) {
        try {
          await curVideoTrack.applyConstraints({ facingMode: { exact: next } });
          const s1 = curVideoTrack.getSettings?.();
          setFacing(s1?.facingMode || next);
          setTimeout(calcAspectFromTrack, 0);
          return;
        } catch {}
      }

      // убедимся, что у нас актуальный список девайсов (после первого разрешения)
      await enumerateVideoInputs();

      // освобождаем камеру перед новым getUserMedia (критично для Android)
      await stopVideoOnly(curStream);

      // пробуем через конкретный deviceId
      const deviceId =
        (next === 'user' ? devicesRef.current.front : devicesRef.current.back) ||
        null;

      let onlyVideoStream = null;
      if (deviceId) {
        try {
          onlyVideoStream = await getStreamVideoOnlyByDeviceId(deviceId);
        } catch {}
      }
      if (!onlyVideoStream) {
        // каскад по facingMode
        onlyVideoStream = await getStreamVideoOnlyByFacing(next);
      }

      const newVideoTrack = onlyVideoStream.getVideoTracks?.()[0];
      if (!newVideoTrack) throw new Error('no_video_track');

      // собираем новый общий поток: старые аудио + новый видео (без запроса audio)
      const oldAudio = (curStream?.getAudioTracks?.() || []).filter(t => t.readyState === 'live');
      const merged = new MediaStream([
        ...oldAudio,
        newVideoTrack,
      ]);

      streamRef.current = merged;

      // чистим временный только-видео поток
      try { onlyVideoStream.getTracks().forEach(t => { if (t !== newVideoTrack) t.stop(); }); } catch {}

      try {
        const s = newVideoTrack.getSettings?.();
        setFacing(s?.facingMode || next);
      } catch { setFacing(next); }

      setTimeout(calcAspectFromTrack, 0);
    } catch (e) {
      // крайний случай: не трогаем audio в live, чтобы не плодить диалоги
      // (ничего не делаем, т.к. цель — избежать доп. разрешений)
    }
  };

  const fmtTime = (sec) => {
    const m = Math.floor((sec||0) / 60);
    const s = String((sec||0) % 60).padStart(2,'0');
    return `${m}:${s}`;
  };

  if (!open) return null;

  // перехват кликов/скролла фоном (оверлей подложка)
  const stopAll = (e) => { e.preventDefault(); e.stopPropagation(); };

  // **ВАЖНО:** убираем любые флипы/зеркала в live и preview
  const fixMirrorClass = 'voVideoFix';

  return (
    <div
      ref={rootRef}
      className="forum_video_overlay"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Escape') onResetConfirm?.(); }}
      // подложка: перехватывает любые события
      onWheel={stopAll}
      onTouchMove={stopAll}
      onPointerDown={stopAll}
      style={{
        position:'fixed',
        inset:0,
        zIndex: 2147483000,          // поверх всего, включая «музыку»
        background:'transparent',
        backdropFilter:'none',
      }}
    >
      {/* кликаемая/блокирующая подложка */}
      <div
        onClick={stopAll}
        style={{
          position:'absolute', inset:0,
          pointerEvents:'auto', // блокирует фон
        }}
      />

      {/* top: таймер */}
      <div className="voTop" style={{ pointerEvents:'none' }}>
        <div className={`voTimer ${st==='recording' ? 'isRec' : 'isIdle'}`} aria-live="polite">
          {st === 'recording' && (<><span className="dot" /><span className="rec">REC</span></>)}
          <span className="time">{fmtTime(elapsed)}</span>
        </div>
      </div>

      {/* видео (сам рендер не ловит клики, всё управление — ниже) */}
      <div style={{
        position:'absolute', inset:0, display:'flex',
        alignItems:'center', justifyContent:'center',
        pointerEvents: st === 'preview' ? 'auto' : 'none'
      }}>
        <div style={{ width:'100%', height:'100%', aspectRatio: aspect, overflow:'hidden' }}>
{(st === 'live' || st === 'recording') ? (
  <div className={fixMirrorClass}>
    <LivePreview
      streamRef={streamRef}
      // фронталка (user/front) → раззеркаливаем превью, чтобы совпадало с финальным видео
      mirror={facing === 'user' || facing === 'front'}
    />
  </div>
) : (
  <div className={fixMirrorClass}>
    {mediaKind === 'image' ? (
      <img
        src={previewUrl || ''}
        alt=""
        draggable={false}
        onLoad={(e) => {
          try {
            const img = e?.currentTarget;
            const w = img?.naturalWidth || 0;
            const h = img?.naturalHeight || 0;
            if (w && h) setAspect(w < h ? '9 / 16' : '16 / 9');
          } catch {}
        }}
        style={{ width:'100%', height:'100%', objectFit:'contain', background:'#000' }}
      />
    ) : (
      <video
        ref={previewVidRef}
        src={previewUrl || ''}
        controls
        playsInline
        onLoadedMetadata={onMeta}
        style={{
  width: '100%',
  height: '100%',
  objectFit:'contain',
  background: '#000'
}}
      />
    )}
  </div>
)}

        </div>
      </div>

      {/* низ: кнопки — кликабельно и поверх */}
      {(st === 'live' || st === 'recording') && (
        <div className="voBottom" style={{ pointerEvents:'auto', zIndex:6 }}>
          <button
            type="button"
            className="voBtn voSwitch"
            aria-label={tt('forum_camera_switch') || 'Switch camera'}
            title={tt('forum_camera_switch') || 'Switch camera'}
            onClick={flipCamera}
            disabled={st === 'recording'}
            aria-disabled={st === 'recording' ? 'true' : undefined}
          >
            <svg viewBox="0 0 24 24" className="ico">
              <path d="M9 7l-2-2H5a 3 3 0 00-3 3v3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M15 17l2 2h2a 3 3 0 003-3v-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M7 12a5 5 0 0110 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path className="rot" d="M12 5v2M12 17v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </button>

          {st !== 'recording' ? (
            <button
              type="button"
              className="voRec idle"
              aria-label={tt('forum_record')||'Record'}
              title={tt('forum_record')||'Record'}
              onClick={()=>{
                if (blockClicksRef.current) return;
                blockClicksRef.current = true;
                Promise.resolve(onStart?.()).finally(()=>{ blockClicksRef.current = false; });
              }}
            >
              <svg viewBox="0 0 120 120" className="recSvg" aria-hidden>
                <circle cx="60" cy="60" r="50" className="ring" />
                <circle cx="60" cy="60" r="34" className="glow" />
                <rect x="45" y="45" width="30" height="30" rx="8" className="core" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="voRec rec"
              aria-label={tt('forum_stop')||'Stop'}
              title={tt('forum_stop')||'Stop'}
              onClick={()=>{
                if (blockClicksRef.current) return;
                blockClicksRef.current = true;
                Promise.resolve(onStop?.()).finally(()=>{ blockClicksRef.current = false; });
              }}
            >
              <svg viewBox="0 0 120 120" className="recSvg" aria-hidden>
                <circle cx="60" cy="60" r="50" className="ring" />
                <circle cx="60" cy="60" r="34" className="glow" />
                <rect x="45" y="45" width="30" height="30" rx="8" className="core" />
              </svg>
            </button>
          )}

          <div className="voSpacer" />
        </div>
      )}

      {/* низ-право: фонарик + закрыть — на ОДНОЙ линии с REC/flip */}
      <div
        className="voCornerBR"
        style={{
          // одна линия со всеми режимами
          bottom: 'calc(var(--vo-pad-y) + (var(--vo-line-h) - 44px)/2)',
          pointerEvents:'auto',
          zIndex:7
        }}
      >
        {st === 'recording' && (
          <button
            type="button"
            className="voBtn voFlash"
            aria-label={tt('forum_flash') || 'Flash'}
            title={tt('forum_flash') || 'Flash'}
            data-on={torchOn ? '1' : '0'}
            onClick={toggleTorch}
          >
            <svg viewBox="0 0 24 24" className="ico">
              <path className="strokeAnim" d="M13 2L6 14h5l-1 8 8-14h-5l1-6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            <span className="flashDot" aria-hidden />
          </button>
        )}

        <button
          type="button"
          className="voBtn voClose"
          aria-label={tt('forum_video_reset') || 'Close'}
          title={tt('forum_video_reset') || 'Close'}
          onClick={()=>{
            if (st === 'recording') {
              if (confirm(tt('forum_video_reset_confirm'))) onResetConfirm?.();
            } else {
              onResetConfirm?.();
            }
          }}
        >
          <svg viewBox="0 0 24 24" className="ico">
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {st === 'preview' && (
        <div className="voCornerBL" style={{
          bottom: 'calc(var(--vo-pad-y) + (var(--vo-line-h) - 44px)/2)',
          pointerEvents:'auto', zIndex:7
        }}>
          <button
            type="button"
            className="voBtn voAccept"
            aria-label={tt('forum_video_accept') || 'Accept & send'}
            title={tt('forum_video_accept') || 'Accept & send'}
            onClick={() => { if (onAccept) onAccept(); else pressComposerSend(); }}
          >
            <svg viewBox="0 0 24 24" className="ico ok">
              <path d="M4 12.5l5 5L20 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* стили */}
      <style jsx>{`
        /* === ПАРАМЕТРЫ ЛИНИИ (можно настраивать где угодно через .forum_video_overlay) === */
        .forum_video_overlay{
          --vo-line-h: 96px;  /* высота нижней линии */
          --vo-pad-y: 54px;   /* отступ линии от низа */
          --vo-pad-x: 30px;   /* боковые отступы для угловых кнопок */
        }

        .voTop{
          position:absolute; left:0; right:0; top: var(--vo-top-offset, env(safe-area-inset-top));
          height:60px;
          display:flex; align-items:center; justify-content:center;
          padding:8px 10px; z-index:6;
        }
        .voBottom{
          position:absolute; left:0; right:0; bottom: var(--vo-pad-y); height: var(--vo-line-h);
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 18px; gap:12px;
        }
        .voCornerBR{ position:absolute; right: var(--vo-pad-x); display:flex; gap:10px; }
        .voCornerBL{ position:absolute; left: var(--vo-pad-x); display:flex; gap:10px; }

/* === Контейнер превью; управление зеркалом делаем из JS по facing === */
.voVideoFix{
  width:100%;
  height:100%;
  background:#000;
}


        .voBtn{
          width:44px; height:44px; border-radius:12px;
          display:inline-flex; align-items:center; justify-content:center;
          border:1px solid rgba(255,255,255,.18);
          background:rgba(0,0,0,.48); color:#fff;
          transition:transform .12s ease, box-shadow .2s ease, background .2s;
          box-shadow:0 0 0 rgba(0,0,0,0);
          position:relative;
        }
        .voBtn:hover{ transform:translateY(-1px); box-shadow:0 0 18px rgba(255,255,255,.2) }
        .voBtn .ico{ width:22px; height:22px; }

        .voFlash[data-on="1"]{
          color:#ffd857; box-shadow:0 0 20px rgba(255,216,87,.45);
          border-color: rgba(255,216,87,.6);
        }
        .voFlash[data-on="1"] .strokeAnim{ filter:drop-shadow(0 0 6px rgba(255,216,87,.9)); }
        .flashDot{
          position:absolute; right:-3px; top:-3px; width:10px; height:10px; border-radius:50%;
          background:#ffd857; box-shadow:0 0 10px rgba(255,216,87,.9);
          opacity:0; transform:scale(.6);
          transition:opacity .15s ease, transform .15s ease;
        }
        .voFlash[data-on="1"] .flashDot{ opacity:1; transform:scale(1); }

        .voClose{ border-radius:50%; width:38px; height:38px; }
        .voSpacer{ width:44px; height:44px; }

        .strokeAnim{ stroke-dasharray:140; stroke-dashoffset:140; animation:dash 1.2s ease forwards; }
        @keyframes dash{ to{ stroke-dashoffset:0 } }

        .voTimer{
          margin:auto; display:inline-flex; align-items:center; gap:10px;
          padding:8px 16px; border-radius:999px; font-weight:800; letter-spacing:.6px;
          background:rgba(0,0,0,.52); color:#fff; border:1px solid rgba(255,255,255,.18);
          text-transform:uppercase;
        }
        .voTimer .dot{
          width:10px; height:10px; border-radius:50%; background:#ff3b30;
          box-shadow:0 0 12px rgba(255,59,48,.9); animation:blink .95s steps(1) infinite;
        }
        .voTimer .rec{ color:#ffd0d0; font-size:12px; letter-spacing:1.6px }
        .voTimer .time{ font:700 14px/1.1 ui-monospace,monospace; }
        @keyframes blink{ 0%,50%{opacity:1} 51%,100%{opacity:.35} }
        .voTimer.isIdle{ background:rgba(0,0,0,.40); border-color:rgba(255,255,255,.12); }

        .voRec{
          width:66px; height:66px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          background:radial-gradient(circle at 50% 50%, #ff0505ff 0%, #f8f6f606 70%);
          border:2px solid rgba(250, 4, 4, 1);
          box-shadow:0 14px 40px rgba(254, 5, 5, 0);
          transition:transform .08s ease;
        }
        .voRec.idle{ animation:pulse 1.6s ease-in-out infinite; }
        .voRec:active{ transform:scale(.98) }
        @keyframes pulse{ 0%,100%{ box-shadow:0 0 0 rgba(255, 0, 0, 1) } 50%{ box-shadow:0 0 36px rgba(255,0,0,.45) } }
        .recSvg{ width:84px; height:84px; }
        .ring{ fill:none; stroke:rgba(255,255,255,.25); stroke-width:2; }
        .glow{ fill:none; stroke:rgba(255,80,80,.55); stroke-width:10; filter:blur(1px); opacity:.45; }
        .core{ fill:#fff; opacity:.12; rx:10; transition:opacity .15s ease }
        .voRec.rec .core{ opacity:.22 }

        .voSwitch .rot{ transform-origin:12px 12px; animation:spin 1.8s linear infinite; opacity:.65 }
        @keyframes spin{ to{ transform:rotate(360deg) } }

        @media (max-width:520px){
          .forum_video_overlay{ --vo-line-h: 88px; }
          .voRec{ width:86px; height:86px }
          .recSvg{ width:76px; height:76px }
        }

        .voAccept{
          border-color: rgba(56,255,172,.6);
          background: rgba(0,30,24,.55);
          color:#46ffb0;
          box-shadow: 0 0 0 rgba(56,255,172,0);
          animation: acceptPulse 1.8s ease-in-out infinite;
        }
        @keyframes acceptPulse{
          0%{ box-shadow: 0 0 0 0 rgba(56,255,172,.35) }
          70%{ box-shadow: 0 0 0 12px rgba(56,255,172,0) }
          100%{ box-shadow: 0 0 0 0 rgba(56,255,172,0) }
        }
      `}</style>
    </div>
  );
}



/* ===== утилиты — прямо в этом файле ===== */

// Блокирует скролл страницы и перехватывает колесо/тач, пока active=true
function usePageLock(active) {
  React.useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const { body, documentElement } = document;
    const y = window.scrollY || window.pageYOffset;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overscroll: documentElement.style.overscrollBehaviorY,
    };

    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    documentElement.style.overscrollBehaviorY = 'none';

    const prevent = (e) => e.preventDefault();
    window.addEventListener('wheel', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });

    return () => {
      window.removeEventListener('wheel', prevent);
      window.removeEventListener('touchmove', prevent);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      documentElement.style.overscrollBehaviorY = prev.overscroll;
      window.scrollTo(0, y);
    };
  }, [active]);
}

// Ставит/снимает атрибут на <html> (для глобального CSS-правила)
function useHtmlFlag(attr, value) {
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    if (value == null) {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, String(value));
    }
    return () => el.removeAttribute(attr);
  }, [attr, value]);
}

const MEDIA_MUTED_KEY = 'forum:mediaMuted';
const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted';
const MEDIA_MUTED_EVENT = 'forum:media-mute';

function readMutedPrefFromStorage() {
  try {
    let v = localStorage.getItem(MEDIA_MUTED_KEY);
    if (v == null) v = localStorage.getItem(MEDIA_VIDEO_MUTED_KEY);
    if (v == null) return null;
    return v === '1' || v === 'true';
  } catch {
    return null;
  }
}

function formatMediaTime(value) {
  const total = Math.max(0, Math.floor(value || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function QCastPlayer({ src, onRemove, preview = false }) {
  const audioRef = React.useRef(null);
  const playerIdRef = React.useRef(`qcast_${Math.random().toString(36).slice(2)}`);
  const hideTimerRef = React.useRef(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [rate, setRate] = React.useState(1);
  const [showControls, setShowControls] = React.useState(false);
  const [muted, setMuted] = React.useState(false);

  const bumpControls = React.useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

const initialMuted = readMutedPrefFromStorage();
// ВАЖНО: автоплей аудио в браузерах почти всегда разрешён только в muted.
// Поэтому если преф не задан — стартуем в muted, чтобы Q-Cast участвовал в автоплее.
audio.muted = (initialMuted == null) ? true : initialMuted;
setMuted(!!audio.muted);

    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolume = () => setMuted(!!audio.muted);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('volumechange', onVolume);

    const onMutedEvent = (e) => {
      if (!audioRef.current) return;
      if (e?.detail?.id && e.detail.id === playerIdRef.current) return;
      if (typeof e?.detail?.muted !== 'boolean') return;
      if (audioRef.current.muted !== e.detail.muted) {
        audioRef.current.muted = e.detail.muted;
      }
    };

    window.addEventListener(MEDIA_MUTED_EVENT, onMutedEvent);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('volumechange', onVolume);
      window.removeEventListener(MEDIA_MUTED_EVENT, onMutedEvent);
    };
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
  }, [rate]);

  React.useEffect(() => () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const togglePlay = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    bumpControls();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {}
    } else {
      try { audio.pause(); } catch {}
    }
  };

  const skipBy = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    bumpControls();
    const next = Math.min(Math.max(0, audio.currentTime + delta), audio.duration || audio.currentTime + delta);
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const onSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    bumpControls();
    const next = Number(e.target.value || 0);
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const toggleMute = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    bumpControls();
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    window.dispatchEvent(new CustomEvent(MEDIA_MUTED_EVENT, {
      detail: { muted: audio.muted, source: 'qcast', id: playerIdRef.current }
    }));
  };

  return (
<div
  className="qcastPlayer"
  onClick={() => bumpControls()}
  data-preview={preview ? '1' : '0'}
  // делаем ВИДИМЫЙ контейнер объектом автоплея (а не <audio>, который может быть 0x0)
  data-forum-media="qcast"
  data-qcast="1"
>

      <img className="qcastCover" src="/audio/Q-Cast.png" alt="Q-Cast" />

<audio
  ref={audioRef}
  src={src}
  preload="metadata"
  playsInline
  data-qcast-audio="1"
  className="qcastAudio"
/>

      <div className="qcastControls" data-visible={showControls ? '1' : '0'} onClick={(e) => e.stopPropagation()}>
        <div className="qcastRow qcastRowTop">
          <button type="button" className="qcastBtn" onClick={togglePlay} aria-label="Play/Pause">
            {isPlaying ? (
              <svg viewBox="0 0 24 24" className="qcastIcon" aria-hidden>
                <rect x="6" y="5" width="4" height="14" rx="1.2" />
                <rect x="14" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="qcastIcon" aria-hidden>
                <path d="M7 5l12 7-12 7z" />
              </svg>
            )}
          </button>
          <button type="button" className="qcastBtn" onClick={() => skipBy(-10)} aria-label="Back 10 seconds">
            <svg viewBox="0 0 24 24" className="qcastIcon" aria-hidden>
              <path d="M11 6l-5 6 5 6V6zm1 6c0-2.2 1.8-4 4-4v2c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2v2c-2.2 0-4-1.8-4-4z" />
            </svg>
          </button>
          <button type="button" className="qcastBtn" onClick={() => skipBy(10)} aria-label="Forward 10 seconds">
            <svg viewBox="0 0 24 24" className="qcastIcon" aria-hidden>
              <path d="M13 6v12l5-6-5-6zm-1 6c0 2.2-1.8 4-4 4v-2c1.1 0 2-.9 2-2 0-1.1-.9-2-2-2V8c2.2 0 4 1.8 4 4z" />
            </svg>
          </button>
          <button type="button" className="qcastBtn" onClick={toggleMute} aria-label="Mute">
            {muted ? (
              <svg viewBox="0 0 24 24" className="qcastIcon" aria-hidden>
                <path d="M4 9v6h4l5 4V5L8 9H4z" />
                <path d="M16 8l4 8M20 8l-4 8" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="qcastIcon" aria-hidden>
                <path d="M4 9v6h4l5 4V5L8 9H4z" />
                <path d="M16 9a4 4 0 010 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            )}
          </button>
        </div>

        <div className="qcastRow qcastRowTimeline">
          <span className="qcastTime">{formatMediaTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={onSeek}
            className="qcastRange"
            aria-label="Seek"
          />
          <span className="qcastTime">{formatMediaTime(duration)}</span>
        </div>

        <div className="qcastRow qcastRowSpeed">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((val) => (
            <button
              key={val}
              type="button"
              className={`qcastSpeed ${rate === val ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                bumpControls();
                setRate(val);
              }}
            >
              {val}x
            </button>
          ))}
          {preview && (
            <button type="button" className="qcastRemove" onClick={onRemove} title="Remove">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function HeadChevronIcon({ dir = 'down' }) {
  const isUp = dir === 'up';
  return (
    <svg
      className={cls('headArrowSvg', isUp && 'up')}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="chev chev1" d="M6 6l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path className="chev chev2" d="M6 11l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path className="chev chev3" d="M6 16l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/* =========================================================
   Основной компонент
========================================================= */
export default function Forum(){
  const [profileBump, setProfileBump] = useState(0)
  useSyncForumProfileOnMount(() => setProfileBump((x) => x + 1))
  void profileBump
  const { t } = useI18n()
  const toast = useToast()
  const rl = useMemo(rateLimiter, [])
  /* ---- auth ---- */
  const [auth,setAuth] = useState(()=>readAuth())
  const viewerId = String(resolveProfileAccountId(auth?.asherId || auth?.accountId) || '').trim()

  const [starredAuthors, setStarredAuthors] = useState(() => new Set())
  const [starMode, setStarMode] = useState(false)

  const [myFollowersCount, setMyFollowersCount] = useState(0)
  const [myFollowersLoading, setMyFollowersLoading] = useState(false)

  useEffect(()=>{
    const upd=()=>setAuth(readAuth())
    if(!isBrowser()) return
    window.addEventListener('auth:ok',upd)
    window.addEventListener('auth:success',upd)
    const id=setInterval(upd,3000)
    return ()=>{ window.removeEventListener('auth:ok',upd); window.removeEventListener('auth:success',upd); clearInterval(id) }
  },[])

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
          const src = frame.getAttribute('data-src');
          if (src && frame.getAttribute('src')) frame.setAttribute('src', '');
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
    const idle = (fn) => {
      try {
        if ('requestIdleCallback' in window) {
          return window.requestIdleCallback(fn, { timeout: 1500 });
        }
      } catch {}
      return setTimeout(fn, 120);
    };
    const cancelIdle = (id) => {
      try {
        if ('cancelIdleCallback' in window) return window.cancelIdleCallback(id);
      } catch {}
      clearTimeout(id);
    };

    const prepare = (video) => {
      if (!(video instanceof HTMLVideoElement)) return;
      if (video.dataset.previewInit === '1') return;
      video.dataset.previewInit = '1';

      try {
        // Мягко просим метаданные (без постоянных reset/load на скролле)
        video.preload = 'metadata';

        // Если метаданные уже есть — ничего не делаем
        if (video.readyState >= 1) return;

        // Тяжёлый load() — только в idle и только если видео реально "холодное"
        if (pending.has(video)) return;
        const id = idle(() => {
          pending.delete(video);
          try {
            const cold = (video.readyState === 0 || !video.currentSrc);
            const safe = cold && video.paused && (video.currentTime === 0);
            if (safe) video.load?.();
          } catch {}
        });
        pending.set(video, id);
      } catch {}
    };

    // если нет IntersectionObserver — готовим всё сразу
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(selector).forEach(prepare);
      return () => {
        try {
          pending.forEach((id) => { try { cancelIdle(id); } catch {} });
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
        threshold: 0.25, // считается «в фокусе», когда ≥25% видно
      }
    );

    document.querySelectorAll(selector).forEach((v) => io.observe(v));

    return () => {
      io.disconnect();
            try {
        pending.forEach((id) => { try { cancelIdle(id); } catch {} });
        pending.clear?.();
      } catch {}     
    };
  }, []);
  // === Shorts-like autoplay: play when in focus, pause when out ===
  // Расширено для video + audio + iframe (YouTube/TikTok best-effort).
  useEffect(() => {
    if (!isBrowser()) return;

    const selector = '[data-forum-media]';

    const writeMutedPref = (val) => {
      try { localStorage.setItem(MEDIA_MUTED_KEY, val ? '1' : '0'); } catch {}
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
                  if (state === YT.PlayerState?.PAUSED || state === YT.PlayerState?.ENDED) {
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

    const cancelUnload = (el) => {
      const id = unloadTimers.get(el);
      if (id) clearTimeout(id);
      unloadTimers.delete(el);
    };

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

    const hardUnloadMedia = (el) => {
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
        return;
      }
      if (kind === 'tiktok' || kind === 'iframe') {
        const src = el.getAttribute('data-src') || el.getAttribute('src') || '';
        if (src && !el.getAttribute('data-src')) { try { el.setAttribute('data-src', src); } catch {} }
        try { el.removeAttribute('data-forum-iframe-active'); } catch {}
        if (el.getAttribute('src')) { try { el.setAttribute('src', ''); } catch {} }
        return;
      }
    };

    const scheduleHardUnload = (el, ms = 800) => {
      if (!el) return;
      cancelUnload(el);
      const id = setTimeout(() => {
        unloadTimers.delete(el);
        hardUnloadMedia(el);
      }, ms);
      unloadTimers.set(el, id);
    };

    const playMedia = async (el) => {
      if (!el) return;
      cancelUnload(el);

      if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
        try {
          applyMutedPref(el);
          el.playsInline = true;
          // НЕ выставляем loop=true (это ломает пользовательский контроль)
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
        } catch {}
        const player = await initYouTubePlayer(el);
        try {
          if (desiredMuted()) player?.mute?.();
          else player?.unMute?.();
          player?.playVideo?.();
          window.dispatchEvent(new CustomEvent('site-media-play', {
            detail: { source: 'youtube', element: el }
          }));
        } catch {}
        return;
      }

      if (kind === 'tiktok' || kind === 'iframe') {
        // ВАЖНО: НЕ делаем force-reset на каждом "фокусе" — это и есть перезапуск при микроскролле.
        const src = el.getAttribute('data-src') || el.getAttribute('src') || '';
        if (!src) return;
        if (!el.getAttribute('data-src')) { try { el.setAttribute('data-src', src); } catch {} }
        const alreadyActive = el.getAttribute('data-forum-iframe-active') === '1';
        const cur = el.getAttribute('src') || '';
        if (!alreadyActive || !cur) {
          try { el.setAttribute('data-forum-iframe-active', '1'); } catch {}
          try { el.setAttribute('src', src); } catch {}
        }
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
              scheduleHardUnload(el, 900);
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
          const FOCUS_RATIO = 0.5;

          if (!candidate || ratio < FOCUS_RATIO) {
            if (active) {
              softPauseMedia(active);
              scheduleHardUnload(active, 900);
              active = null;
            }
            return;
          }

          if (active && active !== candidate) {
            // старый — мягко стоп + hard unload с задержкой
            softPauseMedia(active);
            scheduleHardUnload(active, 900);
          }

          active = candidate;
          cancelUnload(active);
          playMedia(active);
        });
      },
      {
        threshold: [0, 0.15, 0.35, 0.6, 0.85, 1],
        rootMargin: '0px 0px -20% 0px',
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
        scheduleHardUnload(active, 0);
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
    };
  }, []);
    useEffect(() => {
    let alive = true

    if (!viewerId) {
      setStarredAuthors(new Set())
      setMyFollowersCount(0)
      return
    }

    ;(async () => {
      const list = await api.subsList(viewerId)
      if (!alive) return
      const arr = Array.isArray(list?.authors) ? list.authors : []
      setStarredAuthors(new Set(arr.map(x => String(x).trim()).filter(Boolean)))

      setMyFollowersLoading(true)
      const mc = await api.subsMyCount(viewerId)
      if (!alive) return
      setMyFollowersCount(Number(mc?.count || 0))
      setMyFollowersLoading(false)
    })()

    return () => { alive = false }
  }, [viewerId])

  const toggleAuthorStar = useCallback(async (authorIdRaw) => {
    const authorId = String(authorIdRaw || '').trim()
    if (!authorId) return
    if (viewerId && authorId === viewerId) return

    if (!viewerId) {
      // у тебя уже есть requireAuthStrict — используем его
      try { await requireAuthStrict() } catch {}
      return
    }

    // optimistic flip
    setStarredAuthors(prev => {
      const next = new Set(prev)
      if (next.has(authorId)) next.delete(authorId)
      else next.add(authorId)
      return next
    })

    const res = await api.subsToggle(viewerId, authorId)
    if (!res?.ok) {
      // rollback
      setStarredAuthors(prev => {
        const next = new Set(prev)
        if (next.has(authorId)) next.delete(authorId)
        else next.add(authorId)
        return next
      })
      return
    }

    // reconcile from server truth
    setStarredAuthors(prev => {
      const next = new Set(prev)
      if (res.subscribed) next.add(authorId)
      else next.delete(authorId)
      return next
    })
  }, [viewerId])
   const starredFirst = useCallback((arr, getAuthorId) => {
    if (!starMode) return arr
    if (!starredAuthors || starredAuthors.size === 0) return arr

    const a = []
    const b = []
    for (const it of arr) {
      const id = String(getAuthorId(it) || '').trim()
      if (id && starredAuthors.has(id)) a.push(it)
      else b.push(it)
    }
    return a.concat(b)
  }, [starMode, starredAuthors])

const requireAuthStrict = async () => {
  const cur = readAuth();
  if (cur?.asherId || cur?.accountId) { setAuth(cur); return cur; }
  const r = await openAuth({ timeoutMs: 20000 });
  if (r?.asherId || r?.accountId) { setAuth(r); return r; }
  toast.warn(t('forum_auth_required') || 'Нужна авторизация');
  return null;
};
// QCoin: управлялка модалкой из инлайна
React.useEffect(()=>{
  const open = ()=> openOnly('qcoin')
  window.addEventListener('qcoin:open', open)
  return ()=> window.removeEventListener('qcoin:open', open)
},[])


// VIP: открывать VipPopover по событию из бейджа ×2
React.useEffect(()=>{
  const openVip = () => openOnly('vip')
  window.addEventListener('vip:open', openVip)
  return () => window.removeEventListener('vip:open', openVip)
},[])
// === Режим редактирования поста (owner) ===
const [editPostId, setEditPostId] = React.useState(null);

React.useEffect(() => {
  const onEdit = (e) => {
    try {
      const d = e?.detail || {};
      if (!d?.postId || typeof d?.text !== 'string') return;

      // какой пост правим + текст в композер
      setEditPostId(String(d.postId));
      setText(String(d.text));

      // сразу открыть композер
      try {
        setComposerActive(true);
      } catch {}

      // после рендера — проскроллить и фокуснуть поле
      try {
        requestAnimationFrame(() => {
          const root =
            (composerRef && composerRef.current) ||
            document.getElementById('forum-composer');

          if (root && root.scrollIntoView) {
            root.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // ищем textarea: либо по классу .taInput, либо любую textarea внутри
          const ta =
            root?.querySelector?.('.taInput') ||
            root?.querySelector?.('textarea');

          if (ta && typeof ta.focus === 'function') {
            ta.focus();
          }
        });
      } catch {}

      // тост про режим редактирования
      try {
        toast?.ok?.(t?.('forum_edit_mode') || 'Режим редактирования');
      } catch {}
    } catch {}
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('forum:edit', onEdit);
    return () => window.removeEventListener('forum:edit', onEdit);
  }
}, [t, toast]); // ВАЖНО: без setComposerActive и composerRef

/* ---- локальный снап, overlay, tombstones и очередь ---- */
const [snap,setSnap] = useState(()=>{
  if(!isBrowser()) return { topics:[], posts:[], bans:[], admins:[], rev:null }
  try{
    return JSON.parse(localStorage.getItem('forum:snap')||'null') || { topics:[], posts:[], bans:[], admins:[], rev:null }
  }catch{
    return { topics:[], posts:[], bans:[], admins:[], rev:null }
  }
})
const persistSnap = useCallback((patch) => {
  setSnap(prev => {
    const next = typeof patch==='function' ? patch(prev) : ({ ...prev, ...patch })
    try{ localStorage.setItem('forum:snap', JSON.stringify(next)) }catch{}
    return next
  })
}, [])
const TOMBSTONE_TTL_MS = 10 * 60 * 1000;
const [tombstones, setTombstones] = useState(() => {
  if (!isBrowser()) return { topics: {}, posts: {} };
  try {
    const raw = JSON.parse(localStorage.getItem('forum:tombstones') || 'null');
    return raw && typeof raw === 'object'
      ? { topics: raw.topics || {}, posts: raw.posts || {} }
      : { topics: {}, posts: {} };
  } catch {
    return { topics: {}, posts: {} };
  }
});
const persistTombstones = useCallback((patch) => {
  setTombstones((prev) => {
    const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
    try { localStorage.setItem('forum:tombstones', JSON.stringify(next)); } catch {}
    return next;
  });
}, []);
const [overlay, setOverlay] = useState(() => ({
  reactions: {},
  edits: {},
  creates: { topics: [], posts: [] },
  views: { topics: {}, posts: {} },
}));
const data = useMemo(() => {
  const isTomb = (bucket, id) => !!tombstones?.[bucket]?.[String(id)];
  const applyEdits = (p) => {
    const edit = overlay.edits[String(p.id)];
    return edit ? { ...p, text: edit.text } : p;
  };
  const applyReactions = (p) => {
    const pending = overlay.reactions[String(p.id)];
    if (!pending) return p;
    return {
      ...p,
      myReaction: pending.state ?? null,
      likes: pending.likes ?? p.likes,
      dislikes: pending.dislikes ?? p.dislikes,
    };
  };
  const applyViews = (p) => {
    const view = overlay.views.posts[String(p.id)];
    return typeof view === 'number' ? { ...p, views: view } : p;
  };
  const baseTopics = (snap.topics || []).filter(t => !isTomb('topics', t.id));
  const basePosts  = (snap.posts  || []).filter(p => !isTomb('posts',  p.id));
  const nextTopics = baseTopics.map(t => {
    const view = overlay.views.topics[String(t.id)];
    return typeof view === 'number' ? { ...t, views: view } : t;
  });
  const nextPosts = basePosts.map(p => applyViews(applyReactions(applyEdits(p))));
  const createdTopics = (overlay.creates.topics || []).filter(t => !isTomb('topics', t.id));
  const createdPosts = (overlay.creates.posts || []).filter(p => !isTomb('posts', p.id));
  return {
    ...snap,
    topics: [...createdTopics, ...nextTopics],
    posts: [...nextPosts, ...createdPosts],
  };
}, [snap, overlay, tombstones]);
const withdrawBtnRef = useRef(null);

const [qcoinModalOpen, setQcoinModalOpen] = useState(false);

const [queue,setQueue] = useState(()=>{
  if(!isBrowser()) return []
  try{ return JSON.parse(localStorage.getItem('forum:queue')||'[]') }catch{ return [] }
})
const saveQueue = q => { setQueue(q); try{ localStorage.setItem('forum:queue', JSON.stringify(q)) }catch{} }
const makeOpId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const pushOp = (type, payload) => {
  const cur = Array.isArray(queueRef.current) ? queueRef.current : [];
  const op  = { type, payload, opId: makeOpId() };
  const next = [...cur, op];
  saveQueue(next);
}// всегда иметь «свежие» значения внутри async-кода (без устаревших замыканий)
const queueRef = useRef(queue);  useEffect(()=>{ queueRef.current = queue }, [queue])
const authRef  = useRef(auth);   useEffect(()=>{ authRef.current  = auth  }, [auth])
const snapRef  = useRef(snap);   useEffect(()=>{ snapRef.current  = snap  }, [snap])
const lastFullSnapshotRef = useRef(0);
const syncInFlightRef = useRef(false);
const sseHintRef = useRef(0);
const pendingViewsPostsRef = useRef(new Set());
const pendingViewsTopicsRef = useRef(new Set());
const busyRef=useRef(false)
const compactOps = (ops) => {
  const out = [];
  const seenReactions = new Set();
  const seenEdits = new Set();
  const deletedPosts = new Set();
  const deletedTopics = new Set();
  const viewPosts = new Set();
  const viewTopics = new Set();

  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    const t = op?.type;
    const p = op?.payload || {};

    if (t === 'delete_post') {
      const id = String(p.id ?? p.postId ?? '');
      if (!id || deletedPosts.has(id)) continue;
      deletedPosts.add(id);
      out.push(op);
      continue;
    }
    if (t === 'delete_topic') {
      const id = String(p.id ?? p.topicId ?? '');
      if (!id || deletedTopics.has(id)) continue;
      deletedTopics.add(id);
      out.push(op);
      continue;
    }
    if (t === 'set_reaction') {
      const id = String(p.postId ?? '');
      if (!id || deletedPosts.has(id) || seenReactions.has(id)) continue;
      seenReactions.add(id);
      out.push(op);
      continue;
    }
    if (t === 'edit_post') {
      const id = String(p.id ?? '');
      if (!id || deletedPosts.has(id) || seenEdits.has(id)) continue;
      seenEdits.add(id);
      out.push(op);
      continue;
    }
    if (t === 'view_posts') {
      (Array.isArray(p.ids) ? p.ids : []).forEach((id) => {
        const pid = String(id);
        if (pid && !deletedPosts.has(pid)) viewPosts.add(pid);
      });
      continue;
    }
    if (t === 'view_topics') {
      (Array.isArray(p.ids) ? p.ids : []).forEach((id) => {
        const tid = String(id);
        if (tid && !deletedTopics.has(tid)) viewTopics.add(tid);
      });
      continue;
    }
    if (t === 'create_topic') {
      const id = String(p.id ?? p.cid ?? '');
      if (id && deletedTopics.has(id)) continue;
    }
    if (t === 'create_post') {
      const id = String(p.id ?? p.cid ?? '');
      if (id && deletedPosts.has(id)) continue;
      const tid = String(p.topicId ?? p.topicCid ?? '');
      if (tid && deletedTopics.has(tid)) continue;
    }
    out.push(op);
  }

  out.reverse();
  if (viewPosts.size) out.push({ type: 'view_posts', payload: { ids: Array.from(viewPosts) }, opId: makeOpId() });
  if (viewTopics.size) out.push({ type: 'view_topics', payload: { ids: Array.from(viewTopics) }, opId: makeOpId() });
  return out;
};
const flushMutations = useCallback(async () => {
  if (busyRef.current) return;

  let snapshot = Array.isArray(queueRef.current) ? queueRef.current.slice() : [];
  if (!snapshot.length) {
    try { snapshot = JSON.parse(localStorage.getItem('forum:queue')||'[]') || [] } catch {}
  }
  let patched = false;
  snapshot = snapshot.map(op => {
    if (op?.opId) return op;
    patched = true;
    return { ...op, opId: makeOpId() };
  });
  if (patched) saveQueue(snapshot);

  const pendingPosts = Array.from(pendingViewsPostsRef.current || []);
  const pendingTopics = Array.from(pendingViewsTopicsRef.current || []);
  if (pendingPosts.length) {
    snapshot.push({ type: 'view_posts', payload: { ids: pendingPosts }, opId: makeOpId() });
  }
  if (pendingTopics.length) {
    snapshot.push({ type: 'view_topics', payload: { ids: pendingTopics }, opId: makeOpId() });
  }

  const toSend = compactOps(snapshot);
  if (!toSend.length) return;

  busyRef.current = true;
  try {
    const userId = authRef.current?.accountId || authRef.current?.asherId || getForumUserId();
    const resp = await api.mutate({ ops: toSend }, userId);

    if (resp && Array.isArray(resp.applied)) {
      const applied = resp.applied || [];
      const sentIds = new Set(toSend.map(x => x.opId).filter(Boolean));
      const current = Array.isArray(queueRef.current) ? queueRef.current : [];
      const leftover = current.filter(x => !sentIds.has(x.opId));
      saveQueue(leftover);

      if (pendingPosts.length) pendingPosts.forEach(id => pendingViewsPostsRef.current.delete(id));
      if (pendingTopics.length) pendingTopics.forEach(id => pendingViewsTopicsRef.current.delete(id));

      const clearOverlay = {
        reactions: new Set(),
        edits: new Set(),
        viewPosts: new Set(),
        viewTopics: new Set(),
        createTopics: new Set(),
        createPosts: new Set(),
        deletePosts: new Set(),
        deleteTopics: new Set(),
      };

      persistSnap(prev => {
        const next = { ...prev };
        for (const it of applied) {
          if (it.op === 'create_topic' && it.topic) {
            next.topics = [ ...(next.topics || []), it.topic ];
            if (it.cid) clearOverlay.createTopics.add(String(it.cid));
          }
          if (it.op === 'create_topic' && it.duplicate && it.cid) {
            clearOverlay.createTopics.add(String(it.cid));
          }
          if (it.op === 'create_post' && it.post) {
            next.posts  = [ ...(next.posts  || []), it.post  ];
            if (it.cid) clearOverlay.createPosts.add(String(it.cid));
          }
          if (it.op === 'create_post' && it.duplicate && it.cid) {
            clearOverlay.createPosts.add(String(it.cid));
          }
          if (it.op === 'delete_topic' && it.topicId) {
            const id = String(it.topicId);
            next.topics = (next.topics || []).filter(t => String(t.id) !== id);
            next.posts  = (next.posts  || []).filter(p => String(p.topicId) !== id);
            clearOverlay.deleteTopics.add(id);
          }
          if (it.op === 'delete_post') {
            const ids = Array.isArray(it.deleted) ? it.deleted.map(String) : [String(it.postId || it.id || '')];
            const delSet = new Set(ids.filter(Boolean));
            next.posts = (next.posts || []).filter(p => !delSet.has(String(p.id)));
            ids.forEach(id => clearOverlay.deletePosts.add(String(id)));
          }
          if (it.op === 'edit_post' && it.postId) {
            const id = String(it.postId);
            if (it.text) {
              next.posts = (next.posts || []).map(p => String(p.id) === id ? { ...p, text: it.text } : p);
            }
            clearOverlay.edits.add(id);
          }
          if (it.op === 'set_reaction' && it.postId) {
            const id = String(it.postId);
            next.posts = (next.posts || []).map(p => {
              if (String(p.id) !== id) return p;
              return {
                ...p,
                likes: Number(it.likes ?? p.likes ?? 0),
                dislikes: Number(it.dislikes ?? p.dislikes ?? 0),
                myReaction: it.state ?? p.myReaction ?? null,
              };
            });
            clearOverlay.reactions.add(id);
          }
          if (it.op === 'view_posts' && it.views && typeof it.views === 'object') {
            next.posts = (next.posts || []).map(p => {
              const v = it.views[String(p.id)];
              if (!Number.isFinite(v)) return p;
              return { ...p, views: v };
            });
            Object.keys(it.views || {}).forEach(id => clearOverlay.viewPosts.add(String(id)));
          }
          if (it.op === 'view_post' && it.postId != null) {
            const id = String(it.postId);
            const views = Number(it.views ?? 0);
            if (Number.isFinite(views)) {
              next.posts = (next.posts || []).map(p => String(p.id) === id ? { ...p, views } : p);
            }

            clearOverlay.viewPosts.add(id);
          }
          if (it.op === 'view_topics' && it.views && typeof it.views === 'object') {
            next.topics = (next.topics || []).map(t => {
              const v = it.views[String(t.id)];
              if (!Number.isFinite(v)) return t;
              return { ...t, views: v };
            });
            Object.keys(it.views || {}).forEach(id => clearOverlay.viewTopics.add(String(id)));
          }
          if (it.op === 'view_topic' && it.topicId != null) {
            const id = String(it.topicId);
            const views = Number(it.views ?? 0);
            if (Number.isFinite(views)) {
              next.topics = (next.topics || []).map(t => String(t.id) === id ? { ...t, views } : t);
            }
           clearOverlay.viewTopics.add(id);
          }
          if (it.op === 'ban_user' && it.accountId) {
            const bans = new Set(next.bans || []);
            bans.add(it.accountId);
            next.bans = Array.from(bans);
          }
          if (it.op === 'unban_user' && it.accountId) {
            next.bans = (next.bans || []).filter(b => b !== it.accountId);
          }
        }

        return dedupeAll(next);
      });

      setOverlay(prev => {
        const next = { ...prev };
        if (clearOverlay.reactions.size) {
          const reactions = { ...next.reactions };
          clearOverlay.reactions.forEach(id => { delete reactions[id]; });
          next.reactions = reactions;
        }
        if (clearOverlay.edits.size) {
          const edits = { ...next.edits };
          clearOverlay.edits.forEach(id => { delete edits[id]; });
          next.edits = edits;
        }
        if (clearOverlay.viewPosts.size || clearOverlay.viewTopics.size) {
          const views = {
            topics: { ...next.views.topics },
            posts: { ...next.views.posts },
          };
          clearOverlay.viewPosts.forEach(id => { delete views.posts[id]; });
          clearOverlay.viewTopics.forEach(id => { delete views.topics[id]; });
          next.views = views;
        }
        if (clearOverlay.createTopics.size || clearOverlay.createPosts.size) {
          const creates = {
            topics: (next.creates.topics || []).filter(t => !clearOverlay.createTopics.has(String(t.id || t.cid || ''))),
            posts: (next.creates.posts || []).filter(p => !clearOverlay.createPosts.has(String(p.id || p.cid || ''))),
          };
          next.creates = creates;
        }
        return next;
      });

      if (clearOverlay.deletePosts.size || clearOverlay.deleteTopics.size) {
        persistTombstones(prev => {
          const posts = { ...prev.posts };
          const topics = { ...prev.topics };
          clearOverlay.deletePosts.forEach(id => { delete posts[id]; });
          clearOverlay.deleteTopics.forEach(id => { delete topics[id]; });
          return { posts, topics };
        });
      }

    }
  } catch (e) {
    console.error('flushMutations', e);
  } finally {
    busyRef.current = false;
  }
}, [persistSnap, persistTombstones]);
// === QCOIN: автопинг активности (CLIENT) ===
const activeRef  = React.useRef(false);
const visibleRef = React.useRef(true);

// отмечаем ручную активность в пределах форума
React.useEffect(()=>{
  const mark = ()=> { activeRef.current = true };
  const el = document.querySelector('.forum_root') || document.body;
  ['click','keydown'].forEach(e => el.addEventListener(e, mark, { passive:true }));
  return ()=> ['click','keydown'].forEach(e => el.removeEventListener(e, mark));
},[]);

// следим за видимостью вкладки (если видима — считаем «мягкой активностью»)
React.useEffect(()=>{
  const upd = ()=> { visibleRef.current = (document.visibilityState !== 'hidden') };
  upd();
  document.addEventListener('visibilitychange', upd);
  window.addEventListener('focus', upd);
  window.addEventListener('blur',  upd);
  return ()=>{
    document.removeEventListener('visibilitychange', upd);
    window.removeEventListener('focus', upd);
    window.removeEventListener('blur',  upd);
  };
},[]);

// каждые 20с — помечаем активность, пока вкладка видима
React.useEffect(()=>{
  const id = setInterval(()=>{ if (visibleRef.current) activeRef.current = true }, 20000);
  return ()=> clearInterval(id);
},[]);

 
  // >>>>>>>>> Единственное изменение логики: усиленные антидубликаты
  function dedupeAll(prev){
    // -------- Темы: дедуп по сигнатуре, предпочтение real > admin > новее ts
    const bySigT = new Map() // sig -> topic
    const betterT = (a,b)=>{
      const aReal = !a.id?.startsWith?.('tmp_t_'); const bReal = !b.id?.startsWith?.('tmp_t_')
      if(aReal!==bReal) return aReal ? a : b
      const aAdm = !!a.isAdmin, bAdm = !!b.isAdmin
      if(aAdm!==bAdm) return aAdm ? a : b
      if((a.ts||0)!==(b.ts||0)) return (a.ts||0)>(b.ts||0) ? a : b
      return a // стабильность
    }
    for(const t of prev.topics){
      const s = sigTopic(t)
      const chosen = bySigT.get(s)
      bySigT.set(s, chosen ? betterT(chosen, t) : t)
    }
    const topics = Array.from(bySigT.values())

    // -------- Посты: дедуп по сигнатуре, предпочтение real > admin > новее ts
    const bySigP = new Map()
    const betterP = (a,b)=>{
      const aReal = !a.id?.startsWith?.('tmp_p_'); const bReal = !b.id?.startsWith?.('tmp_p_')
      if(aReal!==bReal) return aReal ? a : b
      const aAdm = !!a.isAdmin, bAdm = !!b.isAdmin
      if(aAdm!==bAdm) return aAdm ? a : b
      if((a.ts||0)!==(b.ts||0)) return (a.ts||0)>(b.ts||0) ? a : b
      return a
    }
    for(const p of prev.posts){
      const s = sigPost(p)
      const chosen = bySigP.get(s)
      bySigP.set(s, chosen ? betterP(chosen, p) : p)
    }
    const posts = Array.from(bySigP.values())

    return { ...prev, topics, posts }
  }
  // <<<<<<<<<<< конец изменения

  const pruneTombstones = (next) => {
    const now = Date.now();
    const dropExpired = (bucket) => {
      const out = {};
      for (const [id, ts] of Object.entries(bucket || {})) {
        if (now - Number(ts || 0) < TOMBSTONE_TTL_MS) out[id] = ts;
      }
      return out;
    };
    return { topics: dropExpired(next.topics), posts: dropExpired(next.posts) };
  };
  const applyFullSnapshot = (prev, r, ts) => {
    const isTomb = (bucket, id) => !!ts?.[bucket]?.[String(id)];
    const topics = (r.topics || []).filter(t => !isTomb('topics', t.id));
    const prevPosts = new Map((prev.posts || []).map(p => [String(p.id), p]));
    const posts = (r.posts || []).filter(p => !isTomb('posts', p.id)).map(p => {
      const prior = prevPosts.get(String(p.id));
      return { ...p, myReaction: prior?.myReaction ?? p.myReaction ?? null };
    });
    const out = {
      ...prev,
      topics,
      posts,
      bans: Array.isArray(r.bans) ? r.bans : prev.bans,
      admins: Array.isArray(r.admins) ? r.admins : prev.admins,
      rev: r.rev,
      cursor: r.cursor ?? prev.cursor,
    };
    if (r.vipMap && typeof r.vipMap === 'object') out.vipMap = r.vipMap;
    return dedupeAll(out);
  };


  const applyEvents = (prev, events, ts) => {
    const isTomb = (bucket, id) => !!ts?.[bucket]?.[String(id)];
    const topicsById = new Map((prev.topics || []).map(t => [String(t.id), { ...t }]));
    const postsById = new Map((prev.posts || []).map(p => [String(p.id), { ...p }]));
    const deletedTopics = new Set();
    const deletedPosts = new Set();
    const pendingReactions = overlay?.reactions || {};
    const pendingViews = overlay?.views || { topics: {}, posts: {} };
    for (const evt of events || []) {
      const kind = evt?.kind;
      if (kind === 'topic') {
        const id = String(evt.id || '');
        if (!id || isTomb('topics', id)) continue;
        if (evt._del) {
          deletedTopics.add(id);
          continue;
        }
        const data = evt.data || {};
        topicsById.set(id, { ...(topicsById.get(id) || {}), ...data, id });
      }

      if (kind === 'post') {
        const id = String(evt.id || '');
        if (!id || isTomb('posts', id)) continue;
        if (evt._del) {
          const ids = Array.isArray(evt.deleted) ? evt.deleted.map(String) : [id];
          ids.forEach(pid => deletedPosts.add(pid));
          continue;
        }
        const data = evt.data || {};
        const prior = postsById.get(id) || {};
        const next = { ...prior, ...data, id, myReaction: prior.myReaction ?? data.myReaction ?? null };
        if (pendingReactions[String(id)]) {
          next.likes = prior.likes;
          next.dislikes = prior.dislikes;
          next.myReaction = prior.myReaction ?? next.myReaction ?? null;
        }
        postsById.set(id, next);
      }

      if (kind === 'views') {
        const posts = evt.posts && typeof evt.posts === 'object' ? evt.posts : {};
        const topics = evt.topics && typeof evt.topics === 'object' ? evt.topics : {};

        for (const [idRaw, val] of Object.entries(posts)) {
          const id = String(idRaw);
          if (!id || isTomb('posts', id)) continue;
          if (typeof pendingViews.posts?.[id] === 'number') continue;
          const views = Number(val);
          if (!Number.isFinite(views)) continue;
          const prior = postsById.get(id);
          if (prior) postsById.set(id, { ...prior, views });
        }

        for (const [idRaw, val] of Object.entries(topics)) {
          const id = String(idRaw);
          if (!id || isTomb('topics', id)) continue;
          if (typeof pendingViews.topics?.[id] === 'number') continue;
          const views = Number(val);
          if (!Number.isFinite(views)) continue;
          const prior = topicsById.get(id);
          if (prior) topicsById.set(id, { ...prior, views });
        }
      }
    }
    deletedTopics.forEach(id => {
      topicsById.delete(id);
      for (const [pid, p] of postsById.entries()) {
        if (String(p.topicId) === id) postsById.delete(pid);
      }
    });
    deletedPosts.forEach(id => postsById.delete(String(id)));

    const out = {
      ...prev,
      topics: Array.from(topicsById.values()).filter(t => !isTomb('topics', t.id)),
      posts: Array.from(postsById.values()).filter(p => !isTomb('posts', p.id)),
    };
    return dedupeAll(out);
  };



// === Incremental sync loop: 2m flush + snapshot ===
useEffect(() => {
  if (!isBrowser()) return;
  let stop = false;
  const TICK_MS = 500_000;
  const FULL_EVERY_MS = 10 * 60 * 1000;

  const runTick = async () => {
    if (stop || syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      await flushMutations();

      const now = Date.now();
      const needFull = !snapRef.current?.rev || (now - (lastFullSnapshotRef.current || 0) > FULL_EVERY_MS);
      if (needFull) {
        const r = await api.snapshot({ full: 1 });
        if (r?.ok) {
          const idsSet = new Set();
          try {
            for (const t of (r.topics || [])) {
              const id = String(t?.authorId || t?.userId || t?.ownerId || t?.uid || '').trim();
              if (id) idsSet.add(id);
            }
            for (const p of (r.posts || [])) {
              const id = String(p?.authorId || p?.userId || p?.ownerId || p?.uid || '').trim();
              if (id) idsSet.add(id);
            }
          } catch {}

          const ids = Array.from(idsSet);
          if (ids.length) {
            const vm = await api.vipBatch(ids);
            if (vm?.ok && vm?.map && typeof vm.map === 'object') {
              const vipMap = vm.map;
              r.vipMap = vipMap;
              if (Array.isArray(r.topics)) {
                r.topics = r.topics.map(t => {
                  const aid = String(t?.authorId || t?.userId || t?.ownerId || t?.uid || '').trim();
                  if (!aid) return t;
                  const v = vipMap[aid];
                  if (!v) return t;
                  return {
                    ...t,
                    vipActive: !!v.active,
                    vipUntil: Number(v.untilMs || 0),
                    isVip: !!v.active,
                  };
                });
              }
              if (Array.isArray(r.posts)) {
                r.posts = r.posts.map(p => {
                  const aid = String(p?.authorId || p?.userId || p?.ownerId || p?.uid || '').trim();
                  if (!aid) return p;
                  const v = vipMap[aid];
                  if (!v) return p;
                  return {
                    ...p,
                    vipActive: !!v.active,
                    vipUntil: Number(v.untilMs || 0),
                    isVip: !!v.active,
                  };
                });
              }
            }

            const pm = await api.profileBatch(ids)
            if (pm?.ok && pm?.map && typeof pm.map === 'object') {
              // WHY: hydrate canonical profile cache for all authors after a full snapshot.
              try {
                const aliases = pm.aliases && typeof pm.aliases === 'object' ? pm.aliases : {}
                Object.entries(aliases).forEach(([rawId, accountId]) => {
                  writeProfileAlias(rawId, accountId)
                })
                Object.entries(pm.map).forEach(([accountId, profile]) => {
                  mergeProfileCache(accountId, {
                    nickname: profile?.nickname || '',
                    icon: profile?.icon || '',
                    updatedAt: Date.now(),
                  })
                })
                setProfileBump((x) => x + 1)
              } catch {}
            }          
          }
          lastFullSnapshotRef.current = now;
          persistSnap(prev => applyFullSnapshot(prev, r, tombstones));
        }
      } else {
        const since = Number(snapRef.current?.rev || 0);
        const r = await api.snapshot({ since });
        if (r?.ok) {
          persistSnap(prev => {
            const next = applyEvents(prev, r.events || [], tombstones);
            return { ...next, rev: r.rev ?? next.rev };
          });
        }
      }
      const cleaned = pruneTombstones(tombstones);
      const same =
        JSON.stringify(cleaned.topics) === JSON.stringify(tombstones.topics) &&
        JSON.stringify(cleaned.posts) === JSON.stringify(tombstones.posts);
      if (!same) persistTombstones(cleaned);
    } catch (e) {
      console.error('sync tick error', e);      
    } finally {
      syncInFlightRef.current = false;;
    }
  };

  runTick();
  const id = setInterval(runTick, TICK_MS);

  return () => {
    stop = true;
    clearInterval(id);
  };
}, [flushMutations, tombstones]);


const sseAliveRef = useRef(false)

React.useEffect(() => {
  if (typeof window === 'undefined') return;

  // защитимся от двойного подключения в React StrictMode
  if (window.__forumSSE) { try { window.__forumSSE.close(); } catch {} }
  const es = new EventSource('/api/forum/events/stream', { withCredentials: false });
  window.__forumSSE = es;


es.onmessage = (e) => { 
  sseAliveRef.current = true 
  if (!e?.data) return; 
  if (e.data.startsWith(':')) return; 
 try { const evt = JSON.parse(e.data); 
  if (!evt?.type) return; 
    // --- [PROFILE AVATAR LIVE SYNC] ---
    // Если пришло событие обновления аватара — кладём в локальный профиль и мягко перерисовываем UI.
    if ((evt.type === 'profile.avatar' || evt.type === 'profile.updated') && (evt.accountId || evt.userId)) {
      const accountId = String(evt.accountId || evt.userId || '').trim()
      if (accountId) {
        try {
          writeProfileAlias(evt.userId, accountId)
          mergeProfileCache(accountId, {
            nickname: evt.nickname || evt.nick,
            icon: evt.icon || evt.avatar,
            vipIcon: evt.vipIcon,
            updatedAt: evt.ts || Date.now(),
          })
        } catch { /* no-op */ }
        setProfileBump((x) => x + 1)
      }

      // hint only, без немедленного fetch
      return; // дальше ничего не делаем — снапшоты/ревизии не нужны для этого события
    }


    const nextRev = Number(evt?.rev || 0);
    if (Number.isFinite(nextRev) && nextRev > 0) {
      sseHintRef.current = Math.max(sseHintRef.current, nextRev);
    }
   } catch {}
 };


es.onerror = () => { /* no-op */ }

return () => {
  try { es.close(); } catch {}
  if (window.__forumSSE === es) window.__forumSSE = null; 
};
}, []);


// ---- VIP ----
const [vipOpen, setVipOpen] = useState(false)
const vipBtnRef = useRef(null)
const [vipActive, setVipActive] = useState(false)

// локальный геттер/сеттер флага VIP
const readLocalVip = () => {
  try {
    return (
      localStorage.getItem('ql7_vip') === '1' ||
      localStorage.getItem('ai_quota_vip') === '1'
    )
  } catch { return false }
}
const writeLocalVip = (on) => {
  try {
    if (on) {
      localStorage.setItem('ql7_vip', '1')
      localStorage.setItem('ai_quota_vip', '1')
    } else {
      localStorage.removeItem('ql7_vip')
      localStorage.removeItem('ai_quota_vip')
    }
  } catch {}
}

// первичная инициализация + проверка статуса через существующую ручку AI-квоты
useEffect(() => {
  setVipActive(readLocalVip())

  const accountId = auth?.accountId || auth?.asherId || ''
  if (!accountId) return

  ;(async () => {
    try {
      const r = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId }),
        cache: 'no-store',
      })
      const j = await r.json().catch(() => null)

      // считаем VIP, если хоть одно из ожидаемых полей истинно
      const isVip =
        !!j?.isVip ||
        !!j?.vip ||
        !!j?.quota?.vip ||
        String(j?.plan || '').toLowerCase() === 'vip' ||
        String(j?.status || '').toLowerCase() === 'active'

      setVipActive(isVip)
      writeLocalVip(isVip)
    } catch {
      // сеть/сервер недоступен — оставляем локальный флаг как есть
    }
  })()

  // синхронизация между вкладками
  const onStorage = (e) => {
    if (e.key === 'ql7_vip' || e.key === 'ai_quota_vip') {
      setVipActive(readLocalVip())
    }
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}, [auth?.accountId])
// ===== ONE-POPOVER-AT-A-TIME (exclusive open) =====
const openOnly = React.useCallback((name) => {
  // закрываем всё
  setProfileOpen(false);
  setVipOpen(false);
  setAdminOpen(false);
  setQcoinModalOpen(false);
  setSortOpen(false);
  setDrop(false);
  // если есть ещё попапы (inbox и т.п.) — добавь сюда по желанию:
  // setInboxOpen(false);

  // открываем только один
  if (name === 'profile') setProfileOpen(true);
  else if (name === 'vip') setVipOpen(true);
  else if (name === 'admin') setAdminOpen(true);
  else if (name === 'qcoin') setQcoinModalOpen(true);
  else if (name === 'sort') setSortOpen(true);
  else if (name === 'search') setDrop(true);
}, []);

/* ---- admin ---- */
const [adminOpen, setAdminOpen] = useState(false)
const adminBtnRef = useRef(null)
const [isAdmin, setIsAdmin] = useState(() => isBrowser() && localStorage.getItem('ql7_admin') === '1');
 useEffect(() => {
   if (!isBrowser()) return;
   // первичная синхронизация
   setIsAdmin(localStorage.getItem('ql7_admin') === '1');
   // обновление при смене во вкладке/в поповере
   const onStorage = (e) => {
     if (e.key === 'ql7_admin') setIsAdmin(e.newValue === '1');
   };
   window.addEventListener('storage', onStorage);
   return () => window.removeEventListener('storage', onStorage);
 }, []);
const delTopic = async (t) => {
  if (!isAdmin) return
  const r = await api.adminDeleteTopic(t.id)
  if (r?.ok) {
    persistSnap(prev => ({
      ...prev,
      topics: prev.topics.filter(x => x.id !== t.id),
      posts:  prev.posts.filter(p => p.topicId !== t.id),
    }))
    toast.ok('Topic removed')
    forumBroadcast({ type: 'post_deleted' }); // без id — просто триггерим перечитку 
  } else {
    console.error('adminDeleteTopic error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }
}


const delPost = async (p) => {
  if (!isAdmin) return
  const r = await api.adminDeletePost(p.id)
  if (r?.ok) {
    persistSnap(prev => {
      const del = new Set([p.id]); let grow = true
      while (grow) {
        grow = false
        for (const it of prev.posts) {
          if (it.parentId && del.has(it.parentId) && !del.has(it.id)) {
            del.add(it.id); grow = true
          }
        }
      }
      return { ...prev, posts: prev.posts.filter(x => !del.has(x.id)) }
    })
    toast.ok('Post removed')
    emitDeleted(p.id, p.topicId);   // ← сообщить об удалении 
  } else {
    console.error('adminDeletePost error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }
}


const banUser = async (p) => {
  if (!isAdmin) return
  const id = p.accountId || p.userId
  const r = await api.adminBanUser(id)
  if (r?.ok) {
    persistSnap(prev => {
      const bans = new Set(prev.bans || [])
      bans.add(id)
      return { ...prev, bans: Array.from(bans) }
    })
    toast.ok(t('forum_banned_ok') || 'User banned') 
  } else {
    console.error('adminBanUser error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }
}


const unbanUser = async (p) => {
  if (!isAdmin) return
  const id = p.accountId || p.userId
  const r = await api.adminUnbanUser(id)
  if (r?.ok) {
    persistSnap(prev => {
      const bans = new Set(prev.bans || [])
      bans.delete(id)
      return { ...prev, bans: Array.from(bans) }
    })
    toast.ok(t('forum_unbanned_ok') || 'User unbanned') 
  } else {
    console.error('adminUnbanUser error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }
}

// Владелец удаляет ТЕМУ (каскадно)
const delTopicOwn = async (topic) => {
  const uid = auth?.asherId || auth?.accountId || '';
  if (!uid) {
    toast.warn(t('forum_auth_required') || 'Нужна авторизация');
    return;
  }

  const topicId = String(topic?.id || '');
  if (!topicId) return;
  if (topicId.startsWith('tmp_t_')) {
    setOverlay(prev => ({
      ...prev,
      creates: {
        ...prev.creates,
        topics: (prev.creates.topics || []).filter(t => String(t.id) !== topicId),
        posts: (prev.creates.posts || []).filter(p => String(p.topicId) !== topicId),
      },
    }));
    return;
  }

  persistTombstones(prev => {
    const topics = { ...prev.topics, [topicId]: Date.now() };
    return { ...prev, topics };
  });
  pushOp('delete_topic', { id: topicId });
  if (String(sel?.id || '') === topicId) {
    try { setSel(null); } catch {}
  }
  toast.ok(t('forum_delete_ok') || 'Удалено');
};
const delPostOwn = (post) => {
  const postId = String(post?.id || '');
  if (!postId) return;
  if (postId.startsWith('tmp_p_')) {
    setOverlay(prev => ({
      ...prev,
      creates: {
        ...prev.creates,
        posts: (prev.creates.posts || []).filter(p => String(p.id) !== postId),
      },
    }));
    return;
  }
  persistTombstones(prev => {
    const posts = { ...prev.posts, [postId]: Date.now() };
    return { ...prev, posts };
  });
  pushOp('delete_post', { id: postId });
  toast.ok(t('forum_delete_ok') || 'Удалено');
};


/* ---- выбор темы и построение данных ---- */
const [sel, setSel] = useState(null);
// [HEAD_COLLAPSE:STATE]
const bodyRef = useRef(null);
const [headHidden, setHeadHidden] = useState(false);
const [headPinned, setHeadPinned] = useState(false);
const headHiddenRef = useRef(false);
const headPinnedRef = useRef(false);
useEffect(() => { headHiddenRef.current = headHidden }, [headHidden]);
useEffect(() => { headPinnedRef.current = headPinned }, [headPinned]);

// сброс при смене вида (список тем ↔ тред)
useEffect(() => {
  setHeadPinned(false);
  setHeadHidden(false);
}, [sel?.id]);

// авто-скрытие по скроллу (лёгкий listener + rAF)
useEffect(() => {
  if (!isBrowser()) return;

  const HIDE_THRESHOLD = 800;
  const TOP_THRESHOLD = 800;

  const getScrollTop = () => {
    const el = bodyRef.current;
    if (el && el.scrollHeight > el.clientHeight + 1) return el.scrollTop || 0;
    return (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);
  };

  let raf = 0;
  const onScroll = () => {
    if (headPinnedRef.current) return;
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      const st = getScrollTop();
      if (st > HIDE_THRESHOLD) {
        if (!headHiddenRef.current) setHeadHidden(true);
      } else if (st <= TOP_THRESHOLD) {
        if (headHiddenRef.current) setHeadHidden(false);
      }
    });
  };

  const el = bodyRef.current;
  const opts = { passive: true };

  // слушаем и body (если скролл внутри), и window (если скролл на странице)
  try { el?.addEventListener?.('scroll', onScroll, opts); } catch {}
  window.addEventListener('scroll', onScroll, opts);

  // initial sync
  onScroll();

  return () => {
    try { el?.removeEventListener?.('scroll', onScroll); } catch {}
    window.removeEventListener('scroll', onScroll);
    if (raf) { try { window.cancelAnimationFrame(raf) } catch {} raf = 0; }
  };
}, [sel?.id]);
 

// [SORT_STATE:AFTER]
const [q, setQ] = useState('');
const [topicFilterId, setTopicFilterId] = useState(null);
const [topicSort, setTopicSort] = useState('top');   // сортировка тем
const [postSort,  setPostSort]  = useState('new');   // сортировка сообщений  ← ДОЛЖНА быть объявлена до flat
const [drop, setDrop] = useState(false);
const [sortOpen, setSortOpen] = useState(false);
const VIDEO_PAGE_SIZE = 5;
const TOPIC_PAGE_SIZE = 10;
const REPLIES_PAGE_SIZE = 5;
const THREAD_PAGE_SIZE = 5;
const [visibleVideoCount, setVisibleVideoCount] = useState(VIDEO_PAGE_SIZE);
const [visibleTopicsCount, setVisibleTopicsCount] = useState(TOPIC_PAGE_SIZE);
const [visibleRepliesCount, setVisibleRepliesCount] = useState(REPLIES_PAGE_SIZE);
const [visibleThreadPostsCount, setVisibleThreadPostsCount] = useState(THREAD_PAGE_SIZE);
// [INBOX:STATE] — безопасно для SSR (никакого localStorage в рендере)
const [inboxOpen, setInboxOpen] = useState(false);
const [mounted, setMounted] = useState(false);           // ← флаг «мы на клиенте»
useEffect(()=>{ setMounted(true) }, []);
useEffect(() => {
  setVisibleTopicsCount(TOPIC_PAGE_SIZE);
}, [topicSort, topicFilterId, starMode, starredAuthors]);
const meId = auth?.asherId || auth?.accountId || '';
const seenKey = meId ? `forum:seenReplies:${meId}` : null;

// все мои посты (id)
const myPostIds = useMemo(() => {
  if (!meId) return new Set();
  const s = new Set();
  for (const p of (data.posts || [])) {
    if (String(p.userId || p.accountId || '') === String(meId)) s.add(String(p.id));
  }
  return s;
}, [data.posts, meId]);

// ответы на мои посты (не я автор)
const repliesToMe = useMemo(() => {
  if (!meId || !myPostIds.size) return [];
  return (data.posts || []).filter(p =>
    p.parentId &&
    myPostIds.has(String(p.parentId)) &&
    String(p.userId || p.accountId || '') !== String(meId)
  );
}, [data.posts, myPostIds, meId]);
useEffect(() => {
  if (!inboxOpen) return;
  setVisibleRepliesCount(REPLIES_PAGE_SIZE);
}, [inboxOpen, repliesToMe.length]);
const sortedRepliesToMe = useMemo(
  () => (repliesToMe || []).slice().sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0)),
  [repliesToMe]
);
const visibleRepliesToMe = useMemo(
  () => sortedRepliesToMe.slice(0, visibleRepliesCount),
  [sortedRepliesToMe, visibleRepliesCount]
);
const repliesHasMore = visibleRepliesToMe.length < sortedRepliesToMe.length;
// прочитанные — храним в state, загружаем/сохраняем только на клиенте
const [readSet, setReadSet] = useState(() => new Set());
useEffect(() => {
  if (!seenKey) { setReadSet(new Set()); return; }
  try {
    const arr = JSON.parse(localStorage.getItem(seenKey) || '[]');
    setReadSet(new Set(Array.isArray(arr) ? arr.map(String) : []));
  } catch {
    setReadSet(new Set());
  }
}, [seenKey]);

const unreadCount = useMemo(() => {
  if (!mounted) return 0; // до монтирования не подсвечиваем бейдж
  let n = 0;
  for (const p of repliesToMe) if (!readSet.has(String(p.id))) n++;
  return n;
}, [mounted, repliesToMe, readSet]);

// при открытии Inbox — пометить как прочитанные и сразу обновить state
useEffect(() => {
if (!mounted || !inboxOpen || !seenKey) return;
  const allIds = new Set([
    ...repliesToMe.map(p => String(p.id)),
    ...Array.from(readSet)
  ]);
  try { localStorage.setItem(seenKey, JSON.stringify(Array.from(allIds))); } catch {}
  setReadSet(allIds); // чтобы бейдж погас сразу без повторного чтения из LS
}, [mounted, inboxOpen, seenKey, repliesToMe, readSet]);

// все посты выбранной темы (строго сравниваем как строки)
const allPosts = useMemo(() => (
  sel?.id ? (data.posts || []).filter(p => String(p.topicId) === String(sel.id)) : []
), [data.posts, sel?.id]);

// корневые посты (без parentId), новые сверху
const rootPosts = useMemo(
  () => allPosts
        .filter(p => !p.parentId)
        .sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0)),
  [allPosts]
);

// индекс по id и подготовка узлов с children — ВСЕГДА ключ как String
const idMap = useMemo(() => {
  const m = new Map(allPosts.map(p => [String(p.id), { ...p, children: [] }]));
  // связываем детей с родителями (детерминированно, без setState)
  for (const node of m.values()) {
    const pid = node.parentId != null ? String(node.parentId) : null;
    if (pid && m.has(pid)) m.get(pid).children.push(node);
  }
  return m;
}, [allPosts]);

// выбранный корень ветки (null = режим списка корней)
const [threadRoot, setThreadRoot] = useState(null);

// --- OPEN THREAD: сохраняем открытие ветки при переходе в другую тему ---
// Иначе эффект на смену sel?.id сбрасывает threadRoot и получается «просто список темы».
const pendingThreadRootIdRef = useRef(null);
const pendingScrollToPostIdRef = useRef(null);

// единая точка: открыть ветку по посту (хед = именно пост, по которому кликнули)
const openThreadForPost = useCallback((post, opts = {}) => {
  if (!post || !post.id) return;
  const topicId = post.topicId;
  const rootId = String(post.id);

  pendingScrollToPostIdRef.current = rootId;

  // закрываем панели, если попросили
  try { if (opts.closeInbox) setInboxOpen(false); } catch {}
  try { if (opts.closeVideoFeed) setVideoFeedOpen(false); } catch {}

  // если уже в нужной теме — открываем ветку сразу
  if (sel?.id && String(sel.id) === String(topicId)) {
    const node = idMap?.get?.(rootId) || post;
    try { setThreadRoot(node); } catch {}
    return;
  }

  // иначе: сначала переключаем тему, а threadRoot применится после смены sel?.id
  const tt = (data?.topics || []).find(t => String(t.id) === String(topicId));
  if (!tt) return;
  pendingThreadRootIdRef.current = rootId;
  try { setSel(tt); } catch {}
}, [sel?.id, data?.topics, idMap]);

// при смене темы: либо выходим из ветки, либо применяем «ожидаемое» открытие ветки
useEffect(() => {
  const pendingId = pendingThreadRootIdRef.current;
  if (pendingId) {
    pendingThreadRootIdRef.current = null;
    const node = idMap?.get?.(String(pendingId))
      || (data?.posts || []).find(x => String(x.id) === String(pendingId))
      || null;
    try { setThreadRoot(node || { id: String(pendingId) }); } catch {}
  } else {
    try { setThreadRoot(null); } catch {}
  }
}, [sel?.id]); // намеренно только sel?.id

// мягкий скролл к посту после открытия ветки/темы
useEffect(() => {
  const pid = pendingScrollToPostIdRef.current;
  if (!pid) return;
  if (!threadRoot) return;
  if (!isBrowser?.()) return;
  pendingScrollToPostIdRef.current = null;

  setTimeout(() => {
    try {
      document.getElementById(`post_${pid}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    } catch {}
  }, 120);
}, [sel?.id, threadRoot]);
useEffect(() => {
  setVisibleThreadPostsCount(THREAD_PAGE_SIZE);
}, [sel?.id, threadRoot, postSort]);
 // === Views: refs to avoid TDZ when effects run before callbacks are initialized ===

 const markViewPostRef  = React.useRef(null);

// === Навигация для одного блока (safe-версия, без чтения до инициализации) ===
const selRef = React.useRef(null);
const threadRootRef = React.useRef(null);


React.useEffect(() => { selRef.current = sel }, [sel]);
React.useEffect(() => { threadRootRef.current = threadRoot }, [threadRoot]);
 
// === BEGIN flat (REPLACE WHOLE BLOCK) ===
const flat = useMemo(() => {
  if (!sel?.id) return [];
  // общий «вес» поста для сортировки (и для корней, и для детей)
  const postScore = (p) => {
    // для корней берём «детей» из idMap (чтобы корректно работал 'replies')
    const node = p?.children ? p : (idMap.get(String(p.id)) || p);
    const ts = Number(node.ts || 0);
    const lk = Number(node.likes || 0);
    const vw = Number(node.views || 0);
    const rc = Number((node.children || []).length || 0);
    switch (postSort) {
      case 'likes':   return lk;
      case 'views':   return vw;
      case 'replies': return rc;
      case 'top':     return (lk * 2) + rc + Math.floor(vw * 0.2);
      case 'new':
      default:        return ts;
    }
  };

 // без ветки: только корни — но уже отсортированные по postSort
if (!threadRoot) {
  const roots = rootPosts
    .slice()
    .sort((a, b) => {
      const sb = postScore(b), sa = postScore(a);
      if (sb !== sa) return sb - sa;                         // основной ключ
      const tb = Number(b.ts || 0), ta = Number(a.ts || 0);   // тай-брейк: новее выше
      if (tb !== ta) return tb - ta;
      return String(b.id || '').localeCompare(String(a.id || '')); // стабильность
    })
    .map(r => ({
      ...r,
      _lvl: 0,
      repliesCount: (idMap.get(String(r.id))?.children || []).length,
    }));
  return roots;
}


  // выбрана ветка: обходим всё поддерево
  const start = idMap.get(String(threadRoot.id));
  if (!start) return [];

  const out = [];
  const countDeep = (n) =>
    (n.children || []).reduce((a, ch) => a + 1 + countDeep(ch), 0);

// [FLAT_WALK:AFTER] 

const walk = (n, level = 0) => {
  out.push({ ...n, _lvl: level, repliesCount: countDeep(n) });
  // сортируем детей перед обходом
  const kids = [...(n.children || [])].sort((a,b) => {
    const sa = postScore(a), sb = postScore(b);
    if (sb !== sa) return sb - sa;        // по убыванию «веса»
    const ta = Number(a.ts || 0), tb = Number(b.ts || 0);
    if (tb !== ta) return tb - ta;        // тай-брейк: новее выше
    return String(b.id || '').localeCompare(String(a.id || '')); // стабильность
  });
  kids.forEach(c => walk(c, level + 1));
};


  walk(start, 0);
  return out;
}, [sel?.id, threadRoot, rootPosts, idMap, postSort]);

// === END flat ===
const visibleFlat = useMemo(
  () => (flat || []).slice(0, visibleThreadPostsCount),
  [flat, visibleThreadPostsCount]
);
const threadHasMore = visibleFlat.length < (flat || []).length;
    // Множество забаненных (по userId/accountId)
  const bannedSet = useMemo(() => new Set(data.bans || []), [data.bans])

// ===== ПУНКТ 5: Агрегаты по темам (полные счётчики) =====
// Считаем ВСЕ сообщения и просмотры: тема + все посты/ответы внутри
const aggregates = useMemo(() => {
  const byTopic = new Map();

  // 1) Базовые значения из темы (в т.ч. initial views самой темы)
  for (const t of (data.topics || [])) {
    byTopic.set(String(t.id), {
      posts: 0,
      likes: 0,
      dislikes: 0,
      views: Number(t?.views ?? 0),
    });
  }

  // 2) Накидываем агрегацию по ВСЕМ постам (включая вложенные)
  for (const p of (data.posts || [])) {
    const tid = String(p.topicId);
    const a =
      byTopic.get(tid) || { posts: 0, likes: 0, dislikes: 0, views: 0 };

    // 🔹 каждое сообщение = +1 к общему количеству
    a.posts    += 1;
   
    // 🔹 суммируем реакции по всем постам
    a.likes    += Number(p.likes    || 0);
    a.dislikes += Number(p.dislikes || 0);

    // 🔹 ДОБАВЛЯЕМ просмотры всех постов/ответов внутрь агрегата темы
    a.views    += Number(p.views    || 0);

    byTopic.set(tid, a);
  }

  return byTopic;
}, [data.topics, data.posts]);



  // результаты поиска (темы + посты)
  const results = useMemo(()=>{
    const term = q.trim().toLowerCase(); if(!term) return [];
    const ts = (data.topics||[])
      .filter(x => (x.title||'').toLowerCase().includes(term) || (x.description||'').toLowerCase().includes(term))
      .slice(0,20).map(x => ({ k:'t', id:x.id, title:x.title, desc:x.description }));
    const ps = (data.posts||[])
      .filter(p => (p.text||'').toLowerCase().includes(term))
      .slice(0,40).map(p => ({ k:'p', id:p.id, topicId:p.topicId, text:(p.text||'').slice(0,140) }));
    return [...ts, ...ps];
  }, [q, data.topics, data.posts]);


  // очистка фильтра при очистке поля поиска
  useEffect(()=>{ if (!q.trim()) setTopicFilterId(null); }, [q]);

  // ===== ПУНКТ 5: Сортировка тем с использованием агрегатов =====
  const sortedTopics = useMemo(()=>{
    let topics = [...(data.topics || [])];
    if (topicFilterId) topics = topics.filter(t => String(t.id) === String(topicFilterId));
    const score = (t) => {
      const agg = aggregates.get(t.id) || { posts:0, likes:0, dislikes:0, views:0 };
      switch (topicSort) {
        case 'new':     return t.ts || 0;
        case 'likes':   return agg.likes;
        case 'views':   return agg.views;
        case 'replies': return agg.posts;
        case 'top':
        default:
          return (agg.likes * 2) + agg.posts + Math.floor(agg.views * 0.2);
      }
    };
    const base = topics.sort((a,b) => (score(b) - score(a)) || ((b.ts||0) - (a.ts||0)));
    return starredFirst(base, (x) => x?.userId || x?.accountId);
  }, [data.topics, aggregates, topicSort, topicFilterId, starredFirst]);

  const visibleTopics = useMemo(
    () => (sortedTopics || []).slice(0, visibleTopicsCount),
    [sortedTopics, visibleTopicsCount]
  );
  const topicsHasMore = visibleTopics.length < (sortedTopics || []).length;

  /* ---- composer ---- */
  const [text,setText] = useState('')
  const [replyTo,setReplyTo] = useState(null)
// превью прикреплённых картинок (НЕ пишем URL в текст)
const [pendingImgs, setPendingImgs] = useState([]);
// [FOCUS_TOOLS_STATE:BEGIN]
const [composerActive, setComposerActive] = useState(false);
const composerRef = React.useRef(null);

// закрывать панель инструментов при клике вне композера
React.useEffect(() => {
  const onPointerDown = (e) => {
    const el = composerRef.current;
    if (el && !el.contains(e.target)) setComposerActive(false);
  };
  document.addEventListener('pointerdown', onPointerDown);
  return () => document.removeEventListener('pointerdown', onPointerDown);
}, []);
// [FOCUS_TOOLS_STATE:END]
// [SEND_COOLDOWN:STATE]
const [cooldownLeft, setCooldownLeft] = useState(0);

useEffect(() => {
  if (cooldownLeft <= 0) return;
  const id = setInterval(() => setCooldownLeft(s => Math.max(0, s - 1)), 1000);
  return () => clearInterval(id);
}, [cooldownLeft]);

const startSendCooldown = React.useCallback((sec = 10) => {
  setCooldownLeft(sec);
}, []);
// по клику вне композера — закрываем
useEffect(() => {
  if (!composerActive) return;
  const onDown = (e) => {
    const el = composerRef?.current;
    if (el && !el.contains(e.target)) {
      setComposerActive(false);
    }
  };
  document.addEventListener('pointerdown', onDown, true);
  return () => document.removeEventListener('pointerdown', onDown, true);
}, [composerActive, composerRef, setComposerActive]);
useEffect(() => {
  const sendBtn = document.querySelector('[data-composer-send], .forumComposer .planeBtn');
  if (!sendBtn) return;
  const onClick = () => setComposerActive(false);
  sendBtn.addEventListener('click', onClick);
  return () => sendBtn.removeEventListener('click', onClick);
}, [composerActive]);

 // --- voice recording state ---
 const [pendingAudio, setPendingAudio] = useState(null); // data: URL на blob (webm/ogg)
 
 const [recState, setRecState] = useState('idle');       // 'idle' | 'rec'
 const mediaRef = useRef(null);      // MediaRecorder
 const chunksRef = useRef([]);       // буфер чанков
 // — таймер записи

 const [recElapsed, setRecElapsed] = useState(0);     // sec
 const recTimerRef = useRef(null);
 const fmtSec = (n) => {
   const m = Math.floor((n||0)/60), s = (n||0)%60;
   return `${m}:${String(s).padStart(2,'0')}`;
 };
  // --- video recording state machine ---
 const [videoState, setVideoState] = useState('idle'); // 'idle'|'opening'|'recording'|'processing'|'preview'|'uploading'
 const [videoOpen, setVideoOpen]   = useState(false);
 const [videoElapsed, setVideoElapsed] = useState(0);
 const videoTimerRef = useRef(null);
 const videoStreamRef = useRef(null);   // MediaStream
 const videoRecRef    = useRef(null);   // MediaRecorder
 const videoChunksRef = useRef([]);     // BlobParts
const [pendingVideo, setPendingVideo] = useState(null);

// fullscreen overlay для загруженных файлов (видео/картинка)
const [overlayMediaKind, setOverlayMediaKind] = useState('video'); // 'video' | 'image'
const [overlayMediaUrl, setOverlayMediaUrl] = useState(null);      // string | null
const videoCancelRef = useRef(false); // true => onstop не собирает blob (отмена)
const videoMirrorRef = useRef(null);  // вспомогательный незеркальный front-поток для записи
 
// --- voice handlers (зажал/держишь/отпустил) ---
   const startRecord = async () => {
     if (recState === 'rec') return;
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
       chunksRef.current = [];
       mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data) };
       mr.onstop = async () => {
         try {
           const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
           const url  = URL.createObjectURL(blob);
           setPendingAudio(url);
         } catch {}
       };
       mr.start();
       mediaRef.current = mr;
       setRecState('rec');
      // — запуск таймера    
      setRecElapsed(0);
      const started = Date.now();
      clearInterval(recTimerRef.current);
      recTimerRef.current = setInterval(() => {
        setRecElapsed(Math.min(60, Math.floor((Date.now() - started)/1000)));
      }, 200);
     } catch (e) {
       console.warn('mic denied', e);
     }
   };

   const stopRecord = () => {
     if (recState !== 'rec') return;
     try { mediaRef.current?.stop(); } catch {}
     try { mediaRef.current?.stream?.getTracks?.().forEach(tr => tr.stop()); } catch {}
     mediaRef.current = null;
     setRecState('idle');
    // — стоп таймера
    clearInterval(recTimerRef.current);
    recTimerRef.current = null;    
    setRecElapsed(0);
   };

   // ==== CAMERA: открыть → запись → стоп → превью (фиксы для старта из overlay 'live') ====
// Строит незеркальный видеопоток для фронтальной камеры
// на основе уже открытого baseStream (без нового getUserMedia).
async function createUnmirroredFrontStream(baseStream) {
  try {
    const srcTrack = baseStream?.getVideoTracks?.()[0];
    if (!srcTrack) return null;

    const s = srcTrack.getSettings?.() || {};
    const facing = String(s.facingMode || '').toLowerCase();
    const isFront =
      facing.includes('user') ||
      facing.includes('front') ||
      facing.includes('face');
    if (!isFront) return null;

    const srcStream = new MediaStream([srcTrack]);

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = srcStream;
    video.style.position = 'fixed';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.left = '-10px';
    video.style.top = '-10px';
    document.body.appendChild(video);

    await new Promise((resolve) => {
      if (video.readyState >= 1 && (video.videoWidth || video.videoHeight)) return resolve();
      const onMeta = () => {
        video.removeEventListener('loadedmetadata', onMeta);
        resolve();
      };
      video.addEventListener('loadedmetadata', onMeta);
      setTimeout(resolve, 400);
    });

    try { await video.play(); } catch {}

    const w = video.videoWidth || s.width || 0;
    const h = video.videoHeight || s.height || 0;
    if (!w || !h) {
      try { video.remove(); } catch {}
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.style.position = 'fixed';
    canvas.style.opacity = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.width = '1px';
    canvas.style.height = '1px';
    canvas.style.left = '-10px';
    canvas.style.top = '-10px';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let rafId = null;
    const loop = () => {
      try {
        ctx.setTransform(-1, 0, 0, 1, w, 0); // зеркалим по X
        ctx.drawImage(video, 0, 0, w, h);
      } catch {}
      rafId = requestAnimationFrame(loop);
    };
    loop();

    const outStream = canvas.captureStream(30);
    const outTrack = outStream.getVideoTracks?.()[0];
    if (!outTrack) {
      try { if (rafId) cancelAnimationFrame(rafId); } catch {}
      try { outStream.getTracks().forEach(t => t.stop()); } catch {}
      try { canvas.remove(); } catch {}
      try { video.remove(); } catch {}
      return null;
    }

    const stopMirror = () => {
      try { if (rafId) cancelAnimationFrame(rafId); } catch {}
      try { outStream.getTracks().forEach(t => t.stop()); } catch {}
      try { canvas.remove(); } catch {}
      try { video.remove(); } catch {}
    };

    // повесим на поток, чтобы удобно гасить
    outStream.__stopMirror = stopMirror;
    return outStream;
  } catch {
    return null;
  }
}
   const startVideo = async () => {
  // Разрешаем старт из idle, preview, live
  const badStates = new Set(['opening', 'recording', 'processing', 'uploading']);
  if (badStates.has(videoState)) return;

  try {
    // Оверлей может быть уже открыт — это ок
    setVideoOpen(true);
    setVideoState('opening');

    // не создаём лишний базовый стрим, если уже есть живой
    let baseStream = videoStreamRef.current;
    const hasTracks = !!baseStream && (baseStream.getTracks?.().length || 0) > 0;

    if (!hasTracks) {
      try { videoCancelRef.current = false; } catch {}
      baseStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: { ideal: 'user' } },
        audio: true,
      });
      videoStreamRef.current = baseStream;
    }

    // если до этого был вспомогательный поток — гасим
    try {
      if (videoMirrorRef.current?.__stopMirror) videoMirrorRef.current.__stopMirror();
    } catch {}
    videoMirrorRef.current = null;

    const mime =
      MediaRecorder.isTypeSupported?.('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';


    // строим поток для записи:
    //  - для задней камеры: baseStream как есть
    //  - для фронтальной: canvas.captureStream() с разворотом (не зеркально)
    const vTrack = baseStream.getVideoTracks?.()[0] || null;
    const aTracks = (baseStream.getAudioTracks?.() || []).filter(t => t.readyState === 'live');

    let recStream = baseStream;
    if (vTrack) {
      const s = vTrack.getSettings?.() || {};
      const facing = String(s.facingMode || '').toLowerCase();
      const isFront =
        facing.includes('user') ||
        facing.includes('front') ||
        facing.includes('face');

      if (isFront) {
        const mirrorStream = await createUnmirroredFrontStream(baseStream);
        const fixedTrack = mirrorStream?.getVideoTracks?.()[0] || null;
        if (mirrorStream && fixedTrack) {
          recStream = new MediaStream([
            ...aTracks,
            fixedTrack,
          ]);
          videoMirrorRef.current = mirrorStream;
        }
      }
    }

    const mr = new MediaRecorder(recStream, { mimeType: mime });    videoChunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e?.data?.size) videoChunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      clearInterval(videoTimerRef.current); videoTimerRef.current = null;

      // в любом случае гасим вспомогательный зеркальный поток (если был)
      try {
        if (videoMirrorRef.current?.__stopMirror) videoMirrorRef.current.__stopMirror();
      } catch {}
      videoMirrorRef.current = null;
      try {
        if (videoCancelRef.current) {
          // отмена — ничего не собираем
          videoChunksRef.current = [];
          setPendingVideo(null);
          setVideoState('idle');
          videoCancelRef.current = false;
          return;
        }

        const blob = new Blob(videoChunksRef.current, { type: mr.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);

        // освободим предыдущий blob:URL
        try {
          const prev = pendingVideo;
          if (prev && /^blob:/.test(prev)) URL.revokeObjectURL(prev);
        } catch {}

        setPendingVideo(url);
        setVideoState('preview');
      } catch {
        setVideoState('idle');
      }
    };

    videoRecRef.current = mr;
    mr.start(250);

    // — таймер
    setVideoState('recording');
    setVideoElapsed(0);

    const started = Date.now();
    clearInterval(videoTimerRef.current);
    videoTimerRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - started) / 1000);
      setVideoElapsed(Math.min(600, sec)); // лимит 10:00
      if (sec >= 600) stopVideo();         // авто-стоп
    }, 200);
  } catch (e) {
    setVideoState('idle'); setVideoOpen(false);
    try { toast?.warn?.(t?.('forum_camera_denied') || 'Нет доступа к камере/микрофону') } catch {}
  }
};

const stopVideo = () => {
  if (videoState !== 'recording') return;
  setVideoState('processing');
  try { videoRecRef.current?.stop?.(); } catch {}
  // основной стрим и спец-потоки гасим здесь: камера реально выключается
  try { videoStreamRef.current?.getTracks?.().forEach(tr => tr.stop()); } catch {}
  try {
    if (videoMirrorRef.current?.__stopMirror) videoMirrorRef.current.__stopMirror();
  } catch {}
  videoMirrorRef.current = null;  clearInterval(videoTimerRef.current); videoTimerRef.current = null;
};

const resetVideo = () => {
  const rec = videoRecRef.current;
  const isActive = !!rec && (rec.state === 'recording' || rec.state === 'paused');

  if (isActive) {
    try { videoCancelRef.current = true; } catch {}
    try { rec.stop(); } catch {}
  } else {
    try { videoCancelRef.current = false; } catch {}
  }

  try { videoStreamRef.current?.getTracks?.().forEach(tr => tr.stop()); } catch {}
  try {
   if (videoMirrorRef.current?.__stopMirror) videoMirrorRef.current.__stopMirror();
  } catch {}
  videoRecRef.current = null;
  videoStreamRef.current = null;
  videoMirrorRef.current = null;
  if (pendingVideo && /^blob:/.test(pendingVideo)) {
    try { URL.revokeObjectURL(pendingVideo) } catch {}
  }

  setPendingVideo(null);
  setVideoOpen(false);
  setVideoState('idle');
  setVideoElapsed(0);
};

// === fullscreen overlay (и для видео, и для изображения) ===
const closeMediaOverlay = () => {
  try { setVideoOpen(false); } catch {}
  try { setOverlayMediaUrl(null); } catch {}
  try { setOverlayMediaKind('video'); } catch {}
  // если мы открывали overlay ради картинки — возвращаем видео-состояние в idle
  try {
    if (!pendingVideo && overlayMediaKind === 'image') setVideoState('idle');
  } catch {}
};

// зелёная галочка: НЕ отправляем пост сразу, а закрываем fullscreen и оставляем маленькое превью под композером
const acceptMediaFromOverlay = () => {
  closeMediaOverlay();
};

// крестик: для камеры (live/recording) — полный resetVideo; для preview выбранного файла — просто закрыть
const resetOrCloseOverlay = () => {
  if (videoState === 'live' || videoState === 'recording') {
    resetVideo();
    return;
  }
  closeMediaOverlay();
};
// =========================================================
// MODERATION (client): images + video frames -> /api/forum/moderate
// No native deps. All decoding/resizing done in browser via canvas.
// =========================================================

// Режимы: STRICT = review трактуем как block; BALANCED = review пропускаем
// Можно переключать через NEXT_PUBLIC_FORUM_MODERATION_MODE=STRICT|BALANCED
const FORUM_MODERATION_MODE =
  (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_FORUM_MODERATION_MODE) ||
  'BALANCED';

const isStrictModeration = String(FORUM_MODERATION_MODE || '').toUpperCase() === 'STRICT';

// Тост-хелпер: строго i18n-key + EN fallback (без RU прямых переводов)
const toastI18n = React.useCallback((kind, key, enFallback) => {
  const msg = (t?.(key) || enFallback || '').toString();
  try {
    if (kind === 'ok')   return toast?.ok?.(msg);
    if (kind === 'warn') return toast?.warn?.(msg);
    if (kind === 'err')  return toast?.err?.(msg);
    if (kind === 'info') return toast?.info?.(msg);
    return toast?.info?.(msg);
  } catch {}
}, [t, toast]);

const reasonKey = (reason) => {
  const r = String(reason || 'unknown').toLowerCase();
  if (r === 'porn') return 'forum_moderation_reason_porn';
  if (r === 'explicit_nudity') return 'forum_moderation_reason_explicit_nudity';
  if (r === 'sexual') return 'forum_moderation_reason_sexual';
  if (r === 'hentai') return 'forum_moderation_reason_hentai';
  if (r === 'violence') return 'forum_moderation_reason_violence';
  if (r === 'gore') return 'forum_moderation_reason_gore';
  return 'forum_moderation_reason_unknown';
};

const reasonFallbackEN = (reason) => {
  const r = String(reason || 'unknown').toLowerCase();
  if (r === 'porn') return 'Pornography / explicit sexual content';
  if (r === 'explicit_nudity') return 'Explicit nudity';
  if (r === 'sexual') return 'Adult / sexual content';
  if (r === 'hentai') return 'Hentai / explicit drawings';
  if (r === 'violence') return 'Violence';
  if (r === 'gore') return 'Gore / graphic content';
  return 'Restricted content';
};

// ---- Image normalize: any input -> JPEG blob via canvas (fast + predictable) ----
const fileToJpegBlob = React.useCallback(async (file, opts = {}) => {
  const maxWidth = Number(opts.maxWidth || 640);
  const quality  = Number(opts.quality ?? 0.82);

  // read as bitmap (GIF will usually give first frame - good enough for upload moderation)
  const src = await createImageBitmap(file);

  // scale
  const w0 = src.width || 1;
  const h0 = src.height || 1;

  let w = w0, h = h0;
  if (w0 > maxWidth) {
    w = maxWidth;
    h = Math.round((h0 * maxWidth) / w0);
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);

  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      'image/jpeg',
      Math.min(0.92, Math.max(0.6, quality))
    );
  });

  try { src.close?.(); } catch {}
  if (!blob) throw new Error('jpeg_encode_failed');

  return blob;
}, []);

// ---- Call server moderation with FormData(files[]) ----
const moderateViaApi = React.useCallback(async (blobs, meta = {}) => {
  // blobs: [{ blob, name, source? , timeSec? }]
  const fd = new FormData();
  for (const it of (blobs || [])) {
    if (!it?.blob) continue;
    fd.append('files', it.blob, it.name || `frame-${Date.now()}.jpg`);
  }

  // server meta (optional)
  if (meta?.source) fd.append('source', String(meta.source));
  if (meta?.clientRequestId) fd.append('clientRequestId', String(meta.clientRequestId));
  // server returns allow/block/review; STRICT/BALANCED applied on client
  try {
    const res = await fetch('/api/forum/moderate', { method: 'POST', body: fd, cache: 'no-store' });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j) {
      const errMsg = (j && j.error) ? String(j.error) : 'moderation_http_error';
      const e = new Error(errMsg);
      e.status = res.status;
      throw e;
    }
    return j;
  } catch (e) {
    throw e;
  }
}, []);

// ---- Image moderation (files[]) ----
const moderateImageFiles = React.useCallback(async (files) => {
  if (!Array.isArray(files) || !files.length) return { decision: 'allow', reason: 'unknown' };

  toastI18n('info', 'forum_moderation_checking', 'Checking content…');

  // normalize -> jpeg
  const pack = [];
  for (const f of files.slice(0, 20)) {
    const jpeg = await fileToJpegBlob(f, { maxWidth: 640, quality: 0.82 });
    pack.push({ blob: jpeg, name: (f.name || 'image').replace(/\.(png|jpe?g|webp|gif)$/i, '.jpg') });
  }

  const r = await moderateViaApi(pack, { source: 'image' });
  let decision = String(r?.decision || 'allow');
  const reason = String(r?.reason || 'unknown');

  // STRICT: review => block
  if (isStrictModeration && decision === 'review') decision = 'block';

  return { decision, reason, raw: r };
}, [toastI18n, fileToJpegBlob, moderateViaApi, isStrictModeration]);

// ---- Video frame extraction (browser) ----
const extractVideoFrames = React.useCallback(async (videoSource, opts = {}) => {
  const framesCount = Math.min(20, Math.max(10, Number(opts.framesCount || 14)));
  const minGapSec = Math.max(0.2, Number(opts.minGapSec || 0.6));
  const excludeHeadTail = Math.max(0, Math.min(0.15, Number(opts.excludeHeadTail ?? 0.05)));
  const maxWidth = Math.max(240, Math.min(960, Number(opts.maxWidth || 640)));
  const quality = Math.min(0.92, Math.max(0.6, Number(opts.quality ?? 0.82)));

  const url =
    (typeof videoSource === 'string')
      ? videoSource
      : URL.createObjectURL(videoSource);

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.src = url;

  // wait metadata
  await new Promise((resolve) => {
    const done = () => resolve();
    if (video.readyState >= 1) return done();
    video.addEventListener('loadedmetadata', done, { once: true });
    setTimeout(done, 1200); // fallback
  });

  const duration = Number(video.duration || 0);
  const vw = Number(video.videoWidth || 0);
  const vh = Number(video.videoHeight || 0);

  // fallback if duration is unavailable
  const effectiveDuration = (duration && Number.isFinite(duration) && duration > 0) ? duration : 5;

  // compute times
  const head = effectiveDuration * excludeHeadTail;
  const tail = effectiveDuration * (1 - excludeHeadTail);
  const span = Math.max(0.1, tail - head);

  const times = [];
  const tryAdd = (tSec) => {
    const t = Math.max(0, Math.min(effectiveDuration, tSec));
    for (const x of times) if (Math.abs(x - t) < minGapSec) return false;
    times.push(t);
    return true;
  };

  // base uniform + random jitter
  const baseN = framesCount;
  for (let i = 0; i < baseN; i++) {
    const p = (i + 0.5) / baseN;
    const base = head + span * p;
    const jitter = (Math.random() - 0.5) * Math.min(0.8, span / baseN);
    tryAdd(base + jitter);
  }

  // if too few due to minGap, relax by adding random
  let guard = 0;
  while (times.length < Math.min(framesCount, Math.max(5, Math.floor(baseN * 0.8))) && guard++ < 50) {
    const r = head + Math.random() * span;
    tryAdd(r);
  }

  times.sort((a, b) => a - b);

  // handle very short video
  if (effectiveDuration < 2.0 && times.length > 8) times.length = 8;

  // prepare canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  const out = [];

  const seekTo = (tSec) => new Promise((resolve) => {
    const onSeeked = () => resolve(true);
    video.currentTime = Math.max(0, Math.min(effectiveDuration, tSec));
    video.addEventListener('seeked', onSeeked, { once: true });
    // fallback if seeked doesn't fire
    setTimeout(() => resolve(false), 900);
  });

  // ensure can play frames
  try { await video.play().catch(() => null); } catch {}

  for (const tSec of times) {
    const okSeek = await seekTo(tSec);

    const w0 = (video.videoWidth || vw || 1);
    const h0 = (video.videoHeight || vh || 1);

    let w = w0, h = h0;
    if (w0 > maxWidth) {
      w = maxWidth;
      h = Math.round((h0 * maxWidth) / w0);
    }
    canvas.width = Math.max(1, w);
    canvas.height = Math.max(1, h);

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      });
      if (blob) out.push({ blob, timeSec: tSec, okSeek });
    } catch {
      // ignore individual frame
    }
  }

  // cleanup
  try { video.pause(); } catch {}
  try { video.removeAttribute('src'); video.load(); } catch {}
  try { video.remove(); } catch {}
  if (typeof videoSource !== 'string') {
    try { URL.revokeObjectURL(url); } catch {}
  }

  return out;
}, []);

// ---- Video moderation (extract N frames, send to same API) ----
const moderateVideoSource = React.useCallback(async (videoSource) => {
  toastI18n('info', 'forum_moderation_checking', 'Checking content…');

  // Extract frames
  let frames = [];
  try {
    frames = await extractVideoFrames(videoSource, {
      framesCount: 14,
      minGapSec: 0.6,
      excludeHeadTail: 0.05,
      maxWidth: 640,
      quality: 0.82,
    });
  } catch {
    frames = [];
  }

  // If cannot extract - STRICT blocks, BALANCED allows with warning/log
  if (!frames.length) {
    if (isStrictModeration) {
      return { decision: 'block', reason: 'unknown', raw: null, hard: true };
    }
    // balanced: allow + log
    try { console.warn('[moderation] video frames extraction failed -> allow (balanced)'); } catch {}
    return { decision: 'allow', reason: 'unknown', raw: null, hard: false };
  }

  const pack = frames.slice(0, 20).map((f, idx) => ({
    blob: f.blob,
    name: `frame-${idx + 1}.jpg`,
    timeSec: f.timeSec,
  }));

  const r = await moderateViaApi(pack, { source: 'video_frame' });

  let decision = String(r?.decision || 'allow');
  const reason = String(r?.reason || 'unknown');
  if (isStrictModeration && decision === 'review') decision = 'block';

  return { decision, reason, raw: r };
}, [toastI18n, extractVideoFrames, moderateViaApi, isStrictModeration]);

// отправлять можно, если есть текст ИЛИ хотя бы одна картинка
 const canSend = (String(text || '').trim().length > 0)
   || (pendingImgs.length > 0)
   || !!pendingAudio
   || !!pendingVideo;  // === composer helpers (images) ===
const IMG_LINE_RE = /^(\/uploads\/[A-Za-z0-9._\-\/]+?\.(webp|png|jpe?g|gif)$|https?:\/\/.+\.(webp|png|jpe?g|gif)(\?.*)?$)/i;

const hasImageLines = React.useMemo(() => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
  return lines.some(s => IMG_LINE_RE.test(s));
}, [text]);

  const createTopic = async (title, description, first) => {
     if (!rl.allowAction()) { toast.warn(t('forum_too_fast') || 'Слишком часто'); return; }
    const r = await requireAuthStrict(); if (!r) return;
    const uid = resolveProfileAccountId(r.asherId || r.accountId || '')
    const prof = safeReadProfile(uid) || {}
    const nickForSend = resolveNickForDisplay(uid, prof.nickname)
    const iconForSend = resolveIconForDisplay(uid, prof.icon)
    // лимиты по ТЗ
    const safeTitle = String(title||'')
    const safeDesc  = String(description||'').slice(0,90)
    const safeFirst = String(first||'').slice(0,400)

    // временные id (оптимизм)
    const tmpT = `tmp_t_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const tmpP = `tmp_p_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const isAdm = isBrowser() && localStorage.getItem('ql7_admin')==='1'
    // ссылки — только для админов (проверяем все поля)
    if (!isAdm) {
      const rawTitle = String(title || '');
      const rawDesc  = String(description || '');
      const rawFirst = String(first || '');
      if (hasAnyLink(rawTitle) || hasAnyLink(rawDesc) || hasAnyLink(rawFirst)) {
        toast.warn(t('forum_links_admin_only') || 'Ссылки в теме может добавлять только администратор');
        return;
      }
    }


    const t0 = {
      id: tmpT, title: safeTitle, description: safeDesc, ts: Date.now(),
      userId: uid, nickname: nickForSend,
      icon: iconForSend, isAdmin: isAdm, views: 0
    }
    const p0 = {
     id: tmpP, cid: tmpP, topicId: tmpT, parentId: null, text: safeFirst, ts: Date.now(),
      userId: uid, nickname: t0.nickname, icon: t0.icon, isAdmin: isAdm,
      likes: 0, dislikes: 0, views: 0, myReaction: null
    }

// оптимистично кладём в overlay
setOverlay(prev => ({
  ...prev,
  creates: {
    topics: [t0, ...(prev.creates.topics || [])],
    posts: [ ...(prev.creates.posts || []), p0 ],
  },
}))
setSel(t0)
toast.ok(t('forum_create_ok') ||'Тема создана')

   
    pushOp('create_topic', {
      title: safeTitle,
      description: safeDesc,
      nickname: t0.nickname,
      icon: t0.icon,
      cid: tmpT,
      id: tmpT,
    });
    pushOp('create_post', {
      topicId: tmpT,
      topicCid: tmpT,
      text: safeFirst,
      nickname: t0.nickname,
      icon: t0.icon,
      parentId: null,
      cid: tmpP,
      id: tmpP,
    });
  // жёсткая очистка и подтягиваем свежий снапшот
  try { setText(''); } catch {}
  try { setPendingImgs([]); } catch {}
  try { setPendingAudio(null); } catch {}
  try { resetVideo(); } catch {}
  try { setReplyTo(null); } catch {} 
  }


 // — защита от двойного нажатия/двух источников отправки
 const postingRef = React.useRef(false)

const createPost = async () => {
  if (postingRef.current) return;
  postingRef.current = true;
  // === Режим редактирования поста владельцем ===
  if (editPostId) {
    const _done = () => { postingRef.current = false; };
    try {
      const uid = (auth?.asherId || auth?.accountId || getForumUserId());
      const safeText = String(text || '').slice(0, 8000);
      if (!safeText.trim()) { _done(); return; }
      setOverlay(prev => ({
        ...prev,
        edits: { ...prev.edits, [String(editPostId)]: { text: safeText } },
      }));
      pushOp('edit_post', { id: String(editPostId), text: safeText });
      setEditPostId(null);
      try { setText(''); } catch {}
      try { toast?.ok?.('Изменено'); } catch {}
    } finally {
      _done();
    }
    return;
  }

  // === Обычный режим: создание поста ===
  const _fail = (msg) => {
    if (msg) { try { toast?.warn?.(msg) } catch {} }
    postingRef.current = false;
  };

  if (!rl.allowAction()) return _fail(t('forum_too_fast') || 'Слишком часто');
  // 0) VIDEO MODERATION (frames) BEFORE ANY UPLOAD
  if (pendingVideo) {
    try {
      // если pendingVideo = blob: -> достаём Blob и модерируем по кадрам
      if (/^blob:/.test(pendingVideo)) {
        const resp = await fetch(pendingVideo);
        const fileBlob = await resp.blob();

        const mod = await moderateVideoSource(fileBlob);

        if (mod?.decision === 'block') {
          toastI18n('warn', 'forum_video_blocked', 'Video rejected by community rules');
          toastI18n('info', reasonKey(mod?.reason), reasonFallbackEN(mod?.reason));
          try { resetVideo(); } catch {}
          return _fail();
        }

        if (mod?.decision === 'review') {
          // STRICT уже превратил review -> block в moderateVideoSource()
          // BALANCED: allow + лог
          try { console.warn('[moderation] video review -> allow (balanced)', mod?.reason, mod?.raw); } catch {}
        }
      }
    } catch (e) {
      console.error('[moderation] video check failed', e);
      // как в соцсетях: если модерация недоступна — сообщаем, но не валим всё подряд.
      // В STRICT можно блокировать, но мы уже сделали STRICT=block если кадры не извлеклись.
      toastI18n('err', 'forum_moderation_error', 'Moderation service is temporarily unavailable');
      toastI18n('info', 'forum_moderation_try_again', 'Please try again');
      return _fail();
    }
  }

  // 0) ВИДЕО: прямая загрузка в Vercel Blob через /api/forum/blobUploadUrl
  let videoUrlToSend = '';
  if (pendingVideo) {
    try {
      if (/^blob:/.test(pendingVideo)) {
        // получаем Blob из локального blob:-URL
        const resp = await fetch(pendingVideo);
        const fileBlob = await resp.blob(); // type: video/webm|mp4|quicktime
        const mime = String(fileBlob.type || '').split(';')[0].trim().toLowerCase();
        if (!/^video\/(mp4|webm|quicktime)$/.test(mime)) throw new Error('bad_type');
        if (fileBlob.size > 300 * 1024 * 1024) { try { toast?.err?.('Видео больше 300 МБ'); } catch {} ; return _fail(); }

        // имя с правильным расширением
        const ext = mime.includes('mp4') ? 'mp4' : (mime.includes('quicktime') ? 'mov' : 'webm');
        const name = `forum/video-${Date.now()}.${ext}`;

        // динамический импорт клиентского uploader
        const { upload } = await import('@vercel/blob/client');
        const result = await upload(name, fileBlob, {
          access: 'public',
          handleUploadUrl: '/api/forum/blobUploadUrl', // ← наш единственный роут
          multipart: true,                                // надёжно для больших файлов
          contentType: mime,
          onUploadProgress: (p) => { try { setVideoProgress?.(p.percentage || 0) } catch {} },
        });
        videoUrlToSend = result?.url || '';
        if (!videoUrlToSend) throw new Error('no_url');
      } else {
        // уже готовый https-URL
        videoUrlToSend = pendingVideo;
      }
    } catch (e) {
      console.error('video_client_upload_failed', e);
      try { toast?.err?.('Не удалось загрузить видео'); } catch {}
      return _fail();
    }
  }
  // 0b) аудио: blob -> https
  let audioUrlToSend = '';
  if (pendingAudio) {
    try {
      if (/^blob:/.test(pendingAudio)) {
        const resp = await fetch(pendingAudio);
        const blob = await resp.blob();
        const fd = new FormData();
        fd.append('file', blob, `voice-${Date.now()}.webm`);
        const up = await fetch('/api/forum/uploadAudio', { method:'POST', body: fd, cache:'no-store' });
        const uj = await up.json().catch(()=>null);
        audioUrlToSend = (uj && Array.isArray(uj.urls) && uj.urls[0]) ? uj.urls[0] : '';
      } else {
        audioUrlToSend = pendingAudio;
      }
    } catch { audioUrlToSend = ''; }
  }

  // 1) собираем текст
  const plain = (String(text || '').trim()
    || ((pendingImgs.length>0 || audioUrlToSend || videoUrlToSend) ? '\u200B' : '')
  ).slice(0,400);

  const body = [plain, ...pendingImgs,
    ...(audioUrlToSend ? [audioUrlToSend] : []),
    ...(videoUrlToSend ? [videoUrlToSend] : []),
  ].filter(Boolean).join('\n');

  if (!body || !sel?.id) return _fail();

  // 2) auth
  const r = await requireAuthStrict(); 
  if (!r) return _fail();
  const uid  = resolveProfileAccountId(r.asherId || r.accountId || '');
  const isAdm = (typeof window !== 'undefined') && localStorage.getItem('ql7_admin') === '1';
  const isVip = !!vipActive;

  // --- БЕЛЫЙ СПИСОК ДЛЯ НЕ-VIP/НЕ-АДМИНОВ ---
  if (!isAdm && !isVip && hasAnyLink(body)) {
    const sameHost = (typeof location !== 'undefined' ? location.host : '') || '';
    const URL_RE   = /https?:\/\/[^\s<>"')]+/gi;
    const ST_PREFIX = ['/vip-emoji/','/emoji/','/stickers/','/assets/emoji/','/Quest/'];
    const ST_EXT  = /\.(gif|png|webp|jpg|jpeg)$/i;
    const AUD_EXT = /\.(mp3|webm|ogg|wav|m4a)$/i;
    const VID_EXT = /\.(webm|mp4|mov|m4v|mkv)$/i;

    const extractUrls = (s='') => {
      const out = [];
      String(s||'').split('\n').forEach(ln => {
        const m = ln.match(URL_RE);
        if (m) out.push(...m);
        if (ln.startsWith('/')) out.push(ln.trim()); // относительные пути из /public
      });
      return out;
    };

    const isAllowed = (uStr) => {
      try {
        // относительный путь (статик /public)
        if (uStr.startsWith('/')) {
          if (ST_PREFIX.some(p => uStr.startsWith(p)) && ST_EXT.test(uStr)) return true;
          if ((/\/uploads?\//i.test(uStr) || /\/media?\//i.test(uStr)) && (AUD_EXT.test(uStr) || VID_EXT.test(uStr))) return true;
          if (uStr.startsWith('/_next/image')) return true; // фолбэк
          return false;
        }
        const u = new URL(uStr);

        // наш домен: стикеры и аплоады медиа
        if (sameHost && u.host === sameHost) {
          if (ST_PREFIX.some(p => u.pathname.startsWith(p)) && ST_EXT.test(u.pathname)) return true;
          if ((/\/uploads?\//i.test(u.pathname) || /\/media?\//i.test(u.pathname)) && (AUD_EXT.test(u.pathname) || VID_EXT.test(u.pathname))) return true;
        }

        // Vercel Blob / Storage: голос/видео после аплоада
        if (u.hostname.endsWith('vercel-storage.com') && (AUD_EXT.test(u.pathname) || VID_EXT.test(u.pathname))) return true;

        return false;
      } catch { return true; } // не валим по кривой строке
    };

    const justSticker = /^\[(VIP_EMOJI|STICKER):\/[^\]]+\]$/.test(String(body).trim());
    const urls = extractUrls(body);
    const forbidden = justSticker ? false : urls.some(u => !isAllowed(u));
    if (forbidden) {
      return _fail(t('forum_links_admin_vip_only') || 'Ссылки доступны только администратору и VIP');
    }
  }
  // --- /белый список ---

  // профиль
  const prof = safeReadProfile(uid) || {}
  const nickForSend = resolveNickForDisplay(uid, prof.nickname)
  const iconForSend = resolveIconForDisplay(uid, prof.icon)

  // родитель
  const parentId = (replyTo?.id) || (threadRoot?.id) || null;
  const isReply  = !!parentId;

  // OPTIMISTIC
  const tmpId = `tmp_p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const p = {
    id: tmpId,
    cid: tmpId,
    topicId: String(sel.id),
    parentId: parentId ? String(parentId) : null,
    text: body,
    ts: Date.now(),
    userId: uid,
    nickname: nickForSend,
    icon: iconForSend,
    isAdmin: isAdm,
    likes: 0, dislikes: 0, views: 0,
    myReaction: null,
  };
 
  setOverlay(prev => ({
    ...prev,
    creates: {
      ...prev.creates,
      posts: [ ...(prev.creates.posts || []), p ],
    },
  }));
 
  if (isReply) {
    const parentPost = (data?.posts || []).find(x => String(x.id) === String(parentId));
    setThreadRoot(parentPost || { id: String(parentId) });
    setTimeout(() => {
      try { document.querySelector('.body')?.scrollTo?.({ top: 9e9, behavior: 'smooth' }); } catch {}
    }, 60);
  }

  // батч на бэк
  pushOp('create_post', {
    topicId: sel.id,
    text: body,
    parentId,
    nickname: p.nickname,
    icon: p.icon,
    cid:  tmpId,
    id: tmpId,
  });

  setComposerActive(false);
  emitCreated(p.id, sel.id);
 
  // сброс UI
  setText('');
  setPendingImgs([]);
  try { if (pendingAudio && /^blob:/.test(pendingAudio)) URL.revokeObjectURL(pendingAudio) } catch {}
  setPendingAudio(null);
  setReplyTo(null);
  toast.ok(t('forum_post_sent') || 'Отправлено');
  postingRef.current = false;
 // ← важный сброс видео-оверлея и состояния после отправки
 try { resetVideo(); } catch {}
 try {
   if (pendingVideo && /^blob:/.test(pendingVideo)) URL.revokeObjectURL(pendingVideo);
 } catch {}
 try { setPendingVideo(null); } catch {}
 try { setVideoOpen(false); setVideoState('idle'); } catch {}
};


/* === REACT: поставить/снять лайк/дизлайк c оптимистикой === */
const reactMut = useCallback(async (post, kind) => {
  if (!rl.allowAction()) { if (toast?.warn) toast.warn(t('forum_too_fast') || 'Слишком часто'); return; }
  const r = await requireAuthStrict(); if (!r) return;

  if (!post?.id) return;
  const current = post.myReaction || null;
  const nextState = current === kind ? null : kind;
  const baseLikes = Number(post.likes ?? 0);
  const baseDislikes = Number(post.dislikes ?? 0);

  let likes = baseLikes;
  let dislikes = baseDislikes;
  if (current === 'like') likes = Math.max(0, likes - 1);
  if (current === 'dislike') dislikes = Math.max(0, dislikes - 1);
  if (nextState === 'like') likes += 1;
  if (nextState === 'dislike') dislikes += 1;

  setOverlay(prev => ({
    ...prev,
    reactions: {
      ...prev.reactions,
      [String(post.id)]: { state: nextState, likes, dislikes },
    },
  }));

  pushOp('set_reaction', { postId: String(post.id), state: nextState });
}, [auth, setOverlay]);


const FORUM_VIEW_TTL_SEC = VIEW_TTL_SEC
const getBucket = (ttl) => Math.floor(Date.now()/1000 / (ttl||1800))

const markViewPost = (postId) => {
  if(!isBrowser()) return
  const uid = auth.asherId || auth.accountId || ''
  if(!uid || !postId) return
  const bucket = getBucket(FORUM_VIEW_TTL_SEC)
  const key = `post:${postId}:viewed:${uid}:${bucket}`

if(!localStorage.getItem(key)){
  localStorage.setItem(key,'1')
  pendingViewsPostsRef.current.add(String(postId));
  setOverlay(prev => {
    const cur = (data?.posts || []).find(p => String(p.id) === String(postId));
    const base = Number(prev.views.posts[String(postId)] ?? cur?.views ?? 0);
    return {
      ...prev,
      views: {
        ...prev.views,
        posts: { ...prev.views.posts, [String(postId)]: base + 1 },
      },
    };
  });
}

}
// === Views by focus (>=60% visible) for ANY post card + prefetch videos around ===
useEffect(() => {
  if (!isBrowser()) return;
  if (!('IntersectionObserver' in window)) return;

  const FOCUS_RATIO = 0.5;
  const CARD_SELECTOR = 'article[data-forum-post-card="1"][data-forum-post-id]';

  // postId -> { el, t }
  const focused = new Map();

  const clearFocusedTimer = (postId) => {
    const rec = focused.get(postId);
    if (rec?.t) clearTimeout(rec.t);
    if (rec) rec.t = null;
  };

  // повторный view ровно на границе следующего TTL-бакета, пока пост в фокусе
  const scheduleNextBucketTick = (postId) => {
    clearFocusedTimer(postId);

    const ttl = Number(FORUM_VIEW_TTL_SEC || VIEW_TTL_SEC || 1800);
    const bucket = getBucket(ttl);
    const nextAtMs = (bucket + 1) * ttl * 1000;

    const delay = Math.max(250, nextAtMs - Date.now());
    const rec = focused.get(postId);
    if (!rec?.el) return;

    rec.t = setTimeout(() => {
      const cur = focused.get(postId);
      if (!cur?.el) return; // уже не в фокусе
      markViewPostRef.current?.(postId); // внутри уже TTL+LS дедуп
      scheduleNextBucketTick(postId);
    }, delay);
  };

  // префетчим видео на ±5 карточек вокруг текущей
  const prefetchVideosAround = (centerEl) => {
    try {
      const cards = Array.from(document.querySelectorAll(CARD_SELECTOR));
      const idx = cards.indexOf(centerEl);
      if (idx < 0) return;

      const from = Math.max(0, idx - 2);
      const to = Math.min(cards.length - 1, idx + 2);

       for (let i = from; i <= to; i++) {
         const card = cards[i];
         card
           .querySelectorAll('video[data-forum-video="post"]')
           .forEach((v) => {
             try {
               // ВАЖНО:
               // v.load() сбрасывает позицию (currentTime -> 0) и может заново дернуть сеть.
               // Поэтому:
               // 1) если видео уже начато (есть прогресс) — НЕ трогаем (сохраняем позицию и кэш)
               // 2) если метаданные уже есть (readyState >= 1) — НЕ дергаем load()
               const hasProgress =
                 Number.isFinite(v.currentTime) && v.currentTime > 0.05 && !v.ended;
               const hasMetadata = (v.readyState || 0) >= 1;

               // preload можно поднять до metadata, но без load() (чтобы не было сброса)
               v.preload = 'metadata';

               if (hasProgress || hasMetadata) return;

               // Только для совсем "пустых" — аккуратно просим метаданные
               v.load?.();
             } catch {}
           });
       }
    } catch {}
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        const postId = el.getAttribute('data-forum-post-id');
        if (!postId) continue;

        const ratio = entry.isIntersecting ? (entry.intersectionRatio || 0) : 0;
        const inFocus = ratio >= FOCUS_RATIO;

        if (inFocus) {
          if (!focused.has(postId)) focused.set(postId, { el, t: null });
          else focused.get(postId).el = el;

          // мгновенно считаем просмотр при попадании в фокус
          markViewPostRef.current?.(postId);

          // префетч медиа вокруг
          prefetchVideosAround(el);

          // и держим TTL-повторы, пока пост в фокусе
          scheduleNextBucketTick(postId);
        } else {
          clearFocusedTimer(postId);
          focused.delete(postId);
        }
      }
    },
    {
      threshold: [0, FOCUS_RATIO, 1],
      // оставляем твою “психологию фокуса” (как у видео): чуть тянем фокус к центру
      rootMargin: '0px 0px -20% 0px',
    }
  );

  const observeAll = () => {
    try {
      document.querySelectorAll(CARD_SELECTOR).forEach((el) => io.observe(el));
    } catch {}
  };

  observeAll();

  // DOM динамический (подгрузка/ветки/ответы) — периодически подцепляем новые карточки
  const tick = setInterval(observeAll, 900);

  return () => {
    clearInterval(tick);
    try { io.disconnect(); } catch {}
    for (const [postId] of focused) clearFocusedTimer(postId);
    focused.clear();
  };
}, [auth?.asherId, auth?.accountId]);

const markViewTopic = (topicId) => {
  if(!isBrowser()) return
  const uid = auth.asherId || auth.accountId || ''
  if(!uid || !topicId) return
  const bucket = getBucket(FORUM_VIEW_TTL_SEC || VIEW_TTL_SEC)
  const key = `topic:${topicId}:viewed:${uid}:${bucket}`

  try {
    if(!localStorage.getItem(key)){
      localStorage.setItem(key,'1')
      pendingViewsTopicsRef.current.add(String(topicId));
      setOverlay(prev => {
        const cur = (data?.topics || []).find(t => String(t.id) === String(topicId));
        const base = Number(prev.views.topics[String(topicId)] ?? cur?.views ?? 0);
        return {
          ...prev,
          views: {
            ...prev.views,
            topics: { ...prev.views.topics, [String(topicId)]: base + 1 },
          },
        };
      });
    }
  } catch {}
}
 // keep refs in sync so effects can call them safely
useEffect(() => { markViewPostRef.current  = markViewPost  }, [markViewPost]);

// Просмотр темы: раз в bucket; только отправка на бэк, БЕЗ локального инкремента
useEffect(() => { 
  const id = String(sel?.id || '');
  if (!id) return;
  markViewTopic(id);
}, [sel?.id]); 

  /* ---- эмодзи ---- */
  
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [emojiTab, setEmojiTab] = useState('emoji');
  const addEmoji = (e) => {
    if (typeof e === 'string' && e.startsWith('/')) {
      if (e.startsWith('/mozi/')) {
        setText(`[MOZI:${e}]`);
      } else {
        setText(`[VIP_EMOJI:${e}]`);
      }
    } else {
      setText(v => (v || '') + e);
    }
  };
/* ---- вложения (скрепка) — VIP gate ---- */
const fileInputRef = React.useRef(null);

const handleAttachClick = React.useCallback((e) => {
  e?.preventDefault?.(); 
  e?.stopPropagation?.();
  fileInputRef.current?.click();
}, []);

const onFilesChosen = React.useCallback(async (e) => {
  try {
    const picked = Array.from(e.target?.files || []);
    if (!picked.length) return;

    // разделяем на картинки и видео по mime/имени
    const imgFiles = picked.filter(f =>
      /^image\//i.test(String(f?.type || '')) ||
      /\.(png|jpe?g|webp|gif)$/i.test(String(f?.name || ''))
    );
    const vidFiles = picked.filter(f =>
      /^video\//i.test(String(f?.type || '')) ||
      /\.(mp4|webm|mov|m4v|mkv)$/i.test(String(f?.name || ''))
    );

  // сразу показываем тост (до модерации/загрузки), что медиа обрабатывается
  try {
    if (vidFiles.length) {
      toast?.info?.(t?.('forum_video_processing_wait') || 'Подождите, видео обрабатывается');
    } else if (imgFiles.length) {
      toast?.info?.(t?.('forum_image_processing_wait') || 'Подождите, изображение обрабатывается');
    }
  } catch {}
    if (!imgFiles.length && !vidFiles.length) {
      try {
        toast?.info?.(
          (t?.('forum_attach_info', { types: 'PNG, JPG, JPEG, WEBP, GIF, MP4, WEBM, MOV' }) ||
            'Allowed types: PNG, JPG, JPEG, WEBP, GIF, MP4, WEBM, MOV')
        );
      } catch {}
      return;
    }

    // =========================
    // 1) IMAGES: moderation -> /api/forum/upload
    // =========================
    if (imgFiles.length) {
      let modImg = null;
      try {
        modImg = await moderateImageFiles(imgFiles);
      } catch (err) {
        console.error('[moderation] image check failed', err);
        toastI18n('err', 'forum_moderation_error', 'Moderation service is temporarily unavailable');
        toastI18n('info', 'forum_moderation_try_again', 'Please try again');
        return;
      }

      if (modImg?.decision === 'block') {
        toastI18n('warn', 'forum_image_blocked', 'Image rejected by community rules');
        toastI18n('info', reasonKey(modImg?.reason), reasonFallbackEN(modImg?.reason));
        return;
      }

      if (modImg?.decision === 'review') {
        try { console.warn('[moderation] image review -> allow (balanced)', modImg?.reason, modImg?.raw); } catch {}
      }

      const fd = new FormData();
      for (const f of imgFiles.slice(0, 20)) fd.append('files', f, f.name);

      const res = await fetch('/api/forum/upload', { method: 'POST', body: fd, cache: 'no-store' });
      if (!res.ok) throw new Error('upload_failed');

      const up = await res.json().catch(() => ({ urls: [] }));
      const urls = Array.isArray(up?.urls) ? up.urls : [];
      if (urls.length) 
        setPendingImgs(prev => [...prev, ...urls]);
      // если загрузили ТОЛЬКО картинки — открываем fullscreen overlay (как для видео)
      if (!vidFiles.length && urls.length) {
        try { setOverlayMediaKind('image'); } catch {}
        try { setOverlayMediaUrl(urls[0]); } catch {}
        try { setVideoState('preview'); } catch {}   // используем preview-режим оверлея
        try { setVideoOpen(true); } catch {}
      }
    }

    // =========================
    // 2) VIDEOS: moderation (frames) -> Vercel Blob upload
    // =========================
    if (vidFiles.length) {
      // берём первое видео (multiple включён, но UX лучше 1 за раз)
      const vf = vidFiles[0];
      const mime = String(vf?.type || '').split(';')[0].trim().toLowerCase();
      const okMime = /^video\/(mp4|webm|quicktime)$/i.test(mime) || /\.(mp4|webm|mov)$/i.test(String(vf?.name || ''));
      if (!okMime) {
        try { toast?.warn?.(t?.('forum_video_bad_type') || 'Unsupported video type'); } catch {}
        return;
      }
      if (Number(vf.size || 0) > 300 * 1024 * 1024) {
        try { toast?.err?.(t?.('forum_video_too_big') || 'Video is larger than 300MB'); } catch {}
        return;
      }

      // MODERATION BEFORE UPLOAD (как у тебя в createPost для pendingVideo)
      try {
        const modV = await moderateVideoSource(vf);
        if (modV?.decision === 'block') {
          toastI18n('warn', 'forum_video_blocked', 'Video rejected by community rules');
          toastI18n('info', reasonKey(modV?.reason), reasonFallbackEN(modV?.reason));
          return;
        }
        if (modV?.decision === 'review') {
          try { console.warn('[moderation] video review -> allow (balanced)', modV?.reason, modV?.raw); } catch {}
        }
      } catch (e2) {
        console.error('[moderation] video check failed', e2);
        toastI18n('err', 'forum_moderation_error', 'Moderation service is temporarily unavailable');
        toastI18n('info', 'forum_moderation_try_again', 'Please try again');
        return;
      }

      // UPLOAD TO VERCEL BLOB (тот же роут, что у записи с камеры)
      try {
        const ext =
          /quicktime/i.test(mime) || /\.(mov)$/i.test(String(vf?.name || '')) ? 'mov'
          : /mp4/i.test(mime)     || /\.(mp4)$/i.test(String(vf?.name || '')) ? 'mp4'
          : 'webm';
        const name = `forum/video-${Date.now()}.${ext}`;

        const { upload } = await import('@vercel/blob/client');
        const result = await upload(name, vf, {
          access: 'public',
          handleUploadUrl: '/api/forum/blobUploadUrl',
          multipart: true,
          contentType: (mime || (ext === 'mp4' ? 'video/mp4' : (ext === 'mov' ? 'video/quicktime' : 'video/webm'))),
        });

        const url = result?.url || '';
        if (url) {
          setPendingVideo(url);
          // fullscreen overlay для загруженного видео
          try { setOverlayMediaKind('video'); } catch {}
          try { setOverlayMediaUrl(null); } catch {} // видео берём из pendingVideo
          try { setVideoState?.('preview'); } catch {}
          try { setVideoOpen?.(true); } catch {}
        } else {
          throw new Error('no_url');
        }   
   } catch (e3) {
        console.error('video_client_upload_failed', e3);
        try { toast?.err?.(t?.('forum_video_upload_failed') || 'Failed to upload video'); } catch {}
        return;
      }
    }

    // общий success toast (если что-то реально добавили)
    if (imgFiles.length || vidFiles.length) {
      try { toast?.success?.(t?.('forum_files_uploaded') || 'Files uploaded'); } catch {}
    }
  } catch (err) {
    console.error(err);
    try { toast?.error?.(t?.('forum_files_upload_failed') || 'Upload failed'); } catch {}
  } finally {
    if (e?.target) e.target.value = '';
  }
}, [t, toast, moderateImageFiles, moderateVideoSource, toastI18n, reasonKey, reasonFallbackEN]);

  /* ---- профиль (поповер у аватара) ---- */
  const idShown = resolveProfileAccountId(auth.asherId || auth.accountId || '')
  const profile = safeReadProfile(idShown)
  const nickShown = resolveNickForDisplay(idShown, profile?.nickname)
  const iconShown = resolveIconForDisplay(idShown, profile?.icon)
  const copyId = async () => { try{ await navigator.clipboard.writeText(idShown) }catch{} }

  const [profileOpen, setProfileOpen] = useState(false)
  const avatarRef = useRef(null)
// === VIDEO FEED: состояние + хелперы =====================
const [videoFeedOpen, setVideoFeedOpen] = React.useState(false);
const [videoFeed, setVideoFeed] = React.useState([]);
const [feedSort, setFeedSort] = React.useState('new'); // new/top/likes/views/replies
useEffect(() => {
  if (!videoFeedOpen) return;
  setVisibleVideoCount(VIDEO_PAGE_SIZE);
}, [videoFeedOpen, feedSort, starMode, starredAuthors]);
const visibleVideoFeed = React.useMemo(
  () => (videoFeed || []).slice(0, visibleVideoCount),
  [videoFeed, visibleVideoCount]
);
const videoHasMore = visibleVideoFeed.length < (videoFeed || []).length;
// ВАЖНО: в ленте нужно уметь находить ссылки внутри текста (даже если не отдельной строкой)
const FEED_URL_RE = /(https?:\/\/[^\s<>'")]+)/ig;

function extractUrlsFromText(text) {
  const s = String(text || '');
  if (!s) return [];
  const out = [];
 try {
    for (const m of s.matchAll(FEED_URL_RE)) {
      const u = String(m?.[1] || '').trim();
      if (u) out.push(u);
    }
  } catch {}
  return out;
}

function isVideoUrl(u) {
  const s = String(u || '').trim();
  if (!s) return false;

  // локальный превью
  if (/^blob:/i.test(s)) return true;
  // прямые видео по расширениям
  if (/\.(webm|mp4|mov|m4v|mkv)(?:$|[?#])/i.test(s)) return true;

  // filename=video.ext
  if (/[?&]filename=[^&#]+\.(webm|mp4|mov|m4v|mkv)(?:$|[&#])/i.test(s)) return true;

  // твои/публичные источники без расширения (vercel storage, upload endpoints и т.п.)
  if (/vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo/i.test(s)) return true;

  return false;
}

function isImageUrl(u) {
  const s = String(u || '').trim();
  if (!s) return false;
  return /\.(png|jpe?g|gif|webp|avif|svg)(?:$|[?#])/i.test(s);
}

function isAudioUrl(u) {
  const s = String(u || '').trim();
  if (!s) return false;
  // если нужно, webm можно оставить (у вас уже есть audio/webm записи)
  return /\.(ogg|mp3|m4a|wav|webm)(?:$|[?#])/i.test(s) || /\/uploads\/audio\//i.test(s) || /\/forum\/voice/i.test(s);
}

function isYouTubeUrl(u) {
  const s = String(u || '').trim();
  if (!s) return false;
  // watch?v= / youtu.be / shorts / embed
  return /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[A-Za-z0-9_-]{6,}/i.test(s);
}

function isTikTokUrl(u) {
  const s = String(u || '').trim();
  if (!s) return false;
  // ✅ только /@user/video/123.. (то, что реально умеем embed'ить)
  return /^(?:https?:\/\/)?(?:(?:www|m)\.)?tiktok\.com\/@[\w.\-]+\/video\/\d+(?:[?#].*)?$/i.test(s);
}


function isMediaUrl(u) {
  return isVideoUrl(u) || isImageUrl(u) || isAudioUrl(u) || isYouTubeUrl(u) || isTikTokUrl(u);
}

/** пост содержит медиа? (видео/аудио/картинки/YouTube/TikTok) */
function isMediaPost(p) {
  if (!p) return false;

  // явные поля (если у вас есть такие структуры)
  if (p.type === 'video' || p.type === 'audio' || p.type === 'image') return true;
  if (p.videoUrl || p.posterUrl || p.audioUrl || p.imageUrl) return true;
  if (p.mime && /^(video|audio|image)\//i.test(String(p.mime))) return true;
  if (p.media && (p.media.type === 'video' || p.media.type === 'audio' || p.media.type === 'image' || p.media.videoUrl || p.media.audioUrl || p.media.imageUrl)) return true;
 
  // контейнеры вложений
  if (Array.isArray(p.files) && p.files.some(f =>
    ['video','audio','image'].includes(String(f?.type || '').toLowerCase()) ||
    /^(video|audio|image)\//i.test(String(f?.mime || '')) ||
    isMediaUrl(f?.url)
  )) return true;

  if (Array.isArray(p.attachments) && p.attachments.some(a =>
    ['video','audio','image'].includes(String(a?.type || '').toLowerCase()) ||
    /^(video|audio|image)\//i.test(String(a?.mime || '')) ||
    a?.videoUrl || a?.audioUrl || a?.imageUrl || isMediaUrl(a?.url)
  )) return true;

  // текст/боди — вытаскиваем URL в любом месте строки
  const text = String(p.text ?? p.body ?? '').trim();
  if (text) {
    const urls = extractUrlsFromText(text);
    if (urls.some(isMediaUrl)) return true;
    // на всякий: если человек вставил прямую ссылку отдельной строкой
    const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (lines.some(isMediaUrl)) return true;
  }

  // html как запасной вариант
  if (
  typeof p.html === 'string' && (
    /<\s*video[\s>]/i.test(p.html) ||
    /<\s*img[\s>]/i.test(p.html) ||
    /<\s*audio[\s>]/i.test(p.html) ||
    /(?:youtube\.com|youtu\.be)/i.test(p.html) ||
    /tiktok\.com\/@[\w.\-]+\/video\/\d+/i.test(p.html) // ✅ только playable tiktok
  )
) return true;


  return false;
}

/** собрать все посты откуда только можно */
function gatherAllPosts(data, allPosts) {
  const pool = [];

  if (Array.isArray(allPosts)) pool.push(...allPosts);
  if (Array.isArray(data?.posts)) pool.push(...data.posts);
  if (Array.isArray(data?.messages)) pool.push(...data.messages);
  if (Array.isArray(data?.feed)) pool.push(...data.feed);

  if (Array.isArray(data?.topics)) {
    for (const t of data.topics) {
      if (Array.isArray(t?.posts)) pool.push(...t.posts);
      if (Array.isArray(t?.messages)) pool.push(...t.messages);
      if (Array.isArray(t?.feed)) pool.push(...t.feed);
    }
  }

  return pool;
}

/** построить и сохранить ленту видео */
function buildAndSetVideoFeed() {
  const pool = gatherAllPosts(data, allPosts);
  // ✅ единый id для постов/реплаев (иначе parentId не матчится с id)
  const pidOf = (x) => {
    const v = (x?.id ?? x?._id ?? x?.uuid ?? x?.key ?? null);
    return v == null ? '' : String(v);
  };

  const parentIdOf = (x) => {
    const v = (x?.parentId ?? x?._parentId ?? null);
    return v == null ? '' : String(v);
  };
  // мягкий дедуп по стабильному ключу, но без выкидывания «безидешных»
  const seen = new Set();
  const all = [];
  for (const p of pool) {
    if (!p) continue;
    const base = (p.id ?? p._id ?? p.uuid ?? p.key ?? null);
    const topic = (p.topicId ?? p.threadId ?? null);
    const key = base != null ? String(base) : (topic != null ? `${topic}:${String(base)}` : null);

    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    all.push(p);
  }

// replies count map: parentId -> count
const repliesMap = new Map();
for (const p of all) {
  const pid = parentIdOf(p);
  if (!pid) continue;
  repliesMap.set(pid, (repliesMap.get(pid) || 0) + 1);
}


  const score = (p) => {
    const likes = Number(p?.likes || 0);
    const views = Number(p?.views || 0);
    const replies = repliesMap.get(pidOf(p)) || 0;
    switch (feedSort) {
      case 'new':     return Number(p?.ts || 0);
      case 'likes':   return likes;
      case 'views':   return views;
      case 'replies': return replies;
      case 'top':
      default:
        return (likes * 2) + replies + Math.floor(views * 0.2);
    }
  };

const only = all
  .filter(isMediaPost)
  .sort((a,b) => (score(b) - score(a)) || (Number(b?.ts||0) - Number(a?.ts||0)));

// ✅ прокидываем количество ответов прямо в объект поста для UI
const onlyWithReplyCounts = only.map((p) => {
  const id = pidOf(p);
  const replyCount = id ? (repliesMap.get(id) || 0) : 0;
  return {
    ...p,
    replyCount,          // 👈 можно так (если в UI ждёшь replyCount)
    __repliesCount: replyCount, // 👈 и так (если хочешь безопасный резерв)
  };
});

const withStars = starredFirst(onlyWithReplyCounts, (p) => (p?.userId || p?.accountId));
setVideoFeed(withStars);

}

/** открыть ленту видео */
function openVideoFeed() {
  setVideoFeedOpen(true);
  try { setInboxOpen?.(false); } catch {}
  try { setSel?.(null); setThreadRoot?.(null); } catch {}
  try { setTopicFilterId?.(null); } catch {}
  try { requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' })); } catch {}
}

/** закрыть ленту видео */
function closeVideoFeed() {
  setVideoFeedOpen(false);
}

// авто-обновление ленты, когда лента открыта и что-то меняется в снапшоте
React.useEffect(() => {
  if (!videoFeedOpen) return;
  buildAndSetVideoFeed();
  // зависимости: любые сигналы обновления снапшота/постов у тебя в состоянии
}, [videoFeedOpen, data?.rev, data?.posts, data?.messages, data?.topics, allPosts, feedSort, starMode, starredAuthors]);

// [VIDEO_FEED:OPEN_THREAD] — открыть полноценную ветку из ленты
function openThreadFromPost(p){
  if (!p) return;
  try { setInboxOpen?.(false); } catch {}

  // находим тему, к которой относится пост
  const tt = (data?.topics || []).find(x => String(x.id) === String(p.topicId));
  if (!tt) return;

  // переключаемся в обычный режим ветки
  setSel(tt);
  setThreadRoot({ id: p.parentId || p.id }); // фокус на корневом/самом посте
  setVideoFeedOpen(false);

  // мягкий скролл к посту в открытой ветке
  setTimeout(() => {
    try { document.getElementById(`post_${p.id}`)?.scrollIntoView({ behavior:'smooth', block:'center' }) } catch {}
  }, 120);
}
// === QUESTS: вкладка квестов (полупассивный режим) ===
const [questOpen, setQuestOpen] = React.useState(false);
const [questSel,  setQuestSel]  = React.useState(null);   // текущая карточка квеста

// === QUEST ENV loader (client) ===
const [questEnv,  setQuestEnv]  = React.useState(null);
const [questMeta, setQuestMeta] = React.useState(null);

React.useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const r = await fetch('/api/quest/env', { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!alive) return;
      setQuestEnv(j?.env || {});
      setQuestMeta(j?.meta || null);  
      } catch {
      if (!alive) return;
      setQuestEnv({});
      setQuestMeta(null);    
}
  })();
  return () => { alive = false; };
}, []);
// Синхронизация локального прогресса с серверным: если на сервере пусто — чистим LS
React.useEffect(() => {
  (async () => {
    try {
      const res = await fetch('/api/quest/progress', { method: 'GET', cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      const serverEmpty = !j?.progress || Object.keys(j.progress).length === 0;
      if (serverEmpty) {
        try { localStorage.removeItem(QUEST_LS); } catch {}
        try { localStorage.removeItem(QUEST_TIMERS_LS); } catch {}
        setQuestProg({});
        setTaskTimers({});
      }
    } catch {}
  })();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [auth?.accountId, auth?.asherId]);

// === ENV helpers/flags for Quests (moved above to avoid TDZ) ===
const readEnv = React.useCallback((k, def='') => {
  try {
    if (questEnv && Object.prototype.hasOwnProperty.call(questEnv, k)) {
      const v = questEnv[k];
      return (v == null ? def : String(v));
    }
    const v = process?.env?.[k];
    return (v == null ? def : String(v));
  } catch { return def }
}, [questEnv]);

 // per-card toggles & media (ENV)
 const isCardEnabled  = (n) => (readEnv(`NEXT_PUBLIC_QUEST_CARD_${n}_ENABLED`, '1') === '1');
 const cardMediaExt   = (n) => (readEnv(`NEXT_PUBLIC_QUEST_CARD_${n}_MEDIA_EXT`, 'png') || 'png').toLowerCase(); // png|gif|mp4
 const cardMediaName  = (n) => (readEnv(`NEXT_PUBLIC_QUEST_CARD_${n}_MEDIA_NAME`, `q${n}`) || `q${n}`);
 // НОВОЕ: отдельное расширение для превью задач внутри карточки
 const taskMediaExt   = (n) => {
   const fallback = cardMediaExt(n);
   return (readEnv(`NEXT_PUBLIC_QUEST_CARD_${n}_TASK_MEDIA_EXT`, fallback) || fallback).toLowerCase();
 };
const QUEST_ENABLED = (readEnv('NEXT_PUBLIC_QUEST_ENABLED', '1') === '1');
// без верхнего предела по количеству карточек:
const QUEST_CARDS   = Math.max(0, Number(readEnv('NEXT_PUBLIC_QUEST_CARDS', '10')) || 10);
// Резолвер количества задач: per-card > глобальный > дефолт
const tasksPerCard = React.useCallback((n) => {
  // 1) per-card: NEXT_PUBLIC_QUEST_CARD_<n>_TASK_COUNT
  const kPer = `NEXT_PUBLIC_QUEST_CARD_${n}_TASK_COUNT`;
  const vPer = Number(readEnv(kPer, 'NaN'));
  if (Number.isFinite(vPer) && vPer > 0) return Math.max(1, vPer);
  // 2) global: NEXT_PUBLIC_QUEST_TASKS_PER_CARD (или легаси NEXT_PUBLIC_QUEST_TASKS)
  const vGlob1 = Number(readEnv('NEXT_PUBLIC_QUEST_TASKS_PER_CARD', 'NaN'));
  const vGlob2 = Number(readEnv('NEXT_PUBLIC_QUEST_TASKS', 'NaN'));
  const g = Number.isFinite(vGlob1) ? vGlob1 : vGlob2;
  return Math.max(1, Number.isFinite(g) ? g : 10);
}, [readEnv]);
// Конфигурация квестов из ENV (NEXT_PUBLIC_QUESTS — JSON) + дефолт
const QUESTS = React.useMemo(() => {
  // Ожидаемый формат NEXT_PUBLIC_QUESTS:
  // [{ id:"quest-1", i18nKey:"quest_card_1", rewardKey:"NEXT_PUBLIC_QUEST1_REWARD",
  //    cover:"/Quest/q1.png",
  //    tasks:[{ id:"t1", i18nKey:"quest_1_t1", urlKey:"NEXT_PUBLIC_QUEST1_T1_URL", cover:"/Quest/q1/1.png" }, ... x10] }, ... x10]
  try {
    const raw = readEnv('NEXT_PUBLIC_QUESTS', '');
    if (raw) {
      const j = JSON.parse(raw);
      if (Array.isArray(j) && j.length) return j;
    }
  } catch {}
  // Фолбэк: N карточек (по NEXT_PUBLIC_QUEST_CARDS) * M задач (по NEXT_PUBLIC_QUEST_TASKS)
   const mk = (n) => {
     const base = cardMediaName(n);        // по умолчанию q<n>
     const extCard  = cardMediaExt(n);     // формат обложки карточки (может быть mp4)
     const extTask  = taskMediaExt(n);     // НОВОЕ: формат превью задач (обычно png/gif/webp)
     const cover = `/Quest/${base}.${extCard}`;
     const coverType = (extCard === 'mp4' ? 'mp4' : (extCard === 'gif' ? 'gif' : 'img'));
    const M = tasksPerCard(n);
    return {
      id: `quest-${n}`,
      i18nKey: `quest_card_${n}`,
      rewardKey: `NEXT_PUBLIC_QUEST${n}_REWARD`,
      cover,
      coverType,
      tasks: Array.from({ length: M }, (_, i) => ({
        // id нам теперь не нужен для сервера — используем индекс 1..M
        id: String(i + 1),
        i18nKey: `quest_${n}_t${i+1}`,
        urlKey:  `NEXT_PUBLIC_QUEST${n}_T${i+1}_URL`,
        cover:   `/Quest/q${n}/${i+1}.${extTask}`,
      })),
    };
  };
  const all = Array.from({ length: QUEST_CARDS }, (_, i) => mk(i + 1));
  // Покарточное включение
 return all.filter((_, i) => isCardEnabled(i + 1));
}, [readEnv, tasksPerCard, QUEST_CARDS, cardMediaExt, cardMediaName]);

// Прогресс: LS-ключ зависит от пользователя
const meUid   = auth?.accountId || auth?.asherId || '';
const QUEST_LS = meUid ? `quest:v1:${meUid}` : `quest:v1:anonymous`;
const [claimFx, setClaimFx] = React.useState({ open:false, cardId:'', amount:'', pieces:[] });

const [questProg, setQuestProg] = React.useState(()=>{
  try { return JSON.parse(localStorage.getItem(QUEST_LS) || '{}') } catch { return {} }
});
const writeQuestProg = React.useCallback((patch)=>{
  setQuestProg(prev => {
    const next = typeof patch==='function' ? patch(prev) : ({ ...prev, ...patch });
    try { localStorage.setItem(QUEST_LS, JSON.stringify(next)) } catch {}
    return next;
  });
}, [QUEST_LS]);
// Пер-задачные таймеры в LS (по пользователю)
const QUEST_TIMERS_LS = meUid ? `questTimers:v1:${meUid}` : `questTimers:v1:anonymous`;
const [taskTimers, setTaskTimers] = React.useState(() => {
  try { return JSON.parse(localStorage.getItem(QUEST_TIMERS_LS) || '{}') } catch { return {} }
});
const writeTimers = React.useCallback((patch) => {
  setTaskTimers(prev => {
    const next = (typeof patch === 'function') ? patch(prev) : ({ ...prev, ...patch });
    try { localStorage.setItem(QUEST_TIMERS_LS, JSON.stringify(next)) } catch {}
    return next;
  });
}, [QUEST_TIMERS_LS]);
 // … рядом с остальными useCallback
// helper: нормализуем client cardId ("quest-1") -> server cardId ("1")
const normalizeCardId = React.useCallback((x) => {
  const m = String(x ?? '').match(/(\d+)$/);
  return m ? String(Number(m[1])) : String(x ?? '');
}, []);

// in-flight защита от дублей POST /api/quest/progress для задач
const taskPostInflightRef = React.useRef(new Set());


const openQuestCardChecked = React.useCallback(async (card) => {
  try {
    // 1) гарантируем UID
    let uid = auth?.accountId || auth?.asherId || ''
    if (!uid) {
      const ok = await (typeof requireAuthStrict === 'function' ? requireAuthStrict() : openAuth?.())
      if (!ok) return
      uid = auth?.accountId || auth?.asherId || ''
      if (!uid) return
    }

    // 2) нормализуем cardId -> "1" (та же функция, что и в markTaskDone)
    const serverCardId = normalizeCardId(card?.id)
    if (!serverCardId || serverCardId === '0') return

    // 3) запрос к статус-роуту
    const r = await fetch(`/api/quest/status?cardId=${encodeURIComponent(serverCardId)}`, {
      method: 'GET',
      headers: { 'x-forum-user': uid, 'cache-control': 'no-store' },
      cache: 'no-store',
    })
    const j = await r.json().catch(() => null)

    // 4) если уже собран — НЕ открываем, а фиксируем локально
    if (j?.ok && j.claimed) {
      writeQuestProg(prev => ({
        ...prev,
        [card.id]: {
          ...(prev[card.id] || {}),
          claimed: true,
          claimTs: Date.now(),
        },
      }))
      try { toast?.ok?.(t('quest_done') || 'Готово') } catch {}
      return
    }

    // 5) иначе открываем список заданий
    setQuestSel(card)
  } catch {
    // на сбой — пусть откроется, чтобы не «глохло» UI
    setQuestSel(card)
  }
}, [auth?.accountId, auth?.asherId, requireAuthStrict, openAuth, writeQuestProg, toast, t, setQuestSel, normalizeCardId])

// ← ДОБАВИТЬ: перечитываем прогресс/таймеры, если сменился LS-ключ (анон → юзер)
React.useEffect(() => {
  try { setQuestProg(JSON.parse(localStorage.getItem(QUEST_LS) || '{}')) } catch { setQuestProg({}) }
}, [QUEST_LS]);
React.useEffect(() => {
  try { setTaskTimers(JSON.parse(localStorage.getItem(QUEST_TIMERS_LS) || '{}')) } catch { setTaskTimers({}) }
}, [QUEST_TIMERS_LS]);
// 15s задержка на ЗАДАЧУ (по умолчанию используем NEXT_PUBLIC_QUEST_CLAIM_TASK_DELAY_MS или NEXT_PUBLIC_QUEST_CLAIM_DELAY_MS)
const TASK_DELAY_MS = React.useMemo(() => {
  // глобальный (клиентский) порядок источников
  const g1 = Number(readEnv?.('NEXT_PUBLIC_QUEST_TASK_DELAY_MS', 'NaN'));
  const g2 = Number(readEnv?.('NEXT_PUBLIC_QUEST_CLAIM_TASK_DELAY_MS', 'NaN'));
  const g3 = Number(readEnv?.('NEXT_PUBLIC_QUEST_CLAIM_DELAY_MS', 'NaN'));
  const pick = [g1, g2, g3].find(n => Number.isFinite(n) && n >= 0);
  return Math.max(0, pick ?? 15000);
}, [readEnv]);

const getTaskFirstTs = React.useCallback((qid, tid) => {
  const c = taskTimers?.[qid]; if (!c) return 0;
  return Number(c[tid] || 0);
}, [taskTimers]);
const getTaskRemainMs = React.useCallback((qid, tid) => {
  const ts = getTaskFirstTs(qid, tid);
  if (!ts) return TASK_DELAY_MS;
  return Math.max(0, TASK_DELAY_MS - (Date.now() - ts));
}, [getTaskFirstTs, TASK_DELAY_MS]);
const isTaskReady = React.useCallback((qid, tid) => getTaskRemainMs(qid, tid) <= 0, [getTaskRemainMs]);

const spawnCoins = React.useCallback((count=28) => {
  const out = [];
  for (let i=0;i<count;i++){
    const x = (Math.random()*80-40);  // -40..+40 vw от центра
    const delay = Math.random()*320;
    const size = 14 + Math.round(Math.random()*10);
    out.push({ id: `c${i}`, x, delay, size });
  }
  return out;
}, []);
// Сколько задач у КОНКРЕТНОЙ карточки
const getCardTotalTasks = React.useCallback((qid) => {
  // 1) из схемы QUESTS, если там есть tasks[]
  const card = QUESTS?.find(q => String(q.id) === String(qid));
  if (Array.isArray(card?.tasks) && card.tasks.length) return card.tasks.length;
  // 2) из ENV по номеру карточки (quest-<n>)
  const m = String(qid || '').match(/(\d+)$/);
  const idx = m ? Number(m[1]) : NaN;
  const perCard = Number(readEnv?.(`NEXT_PUBLIC_QUEST_CARD_${idx}_TASK_COUNT`, 'NaN'));
  if (Number.isFinite(perCard) && perCard > 0) return perCard;
  // 3) глобальный дефолт из ENV (как на сервере: NEXT_PUBLIC_QUEST_TASKS_PER_CARD, затем легаси NEXT_PUBLIC_QUEST_TASKS)
  const g1 = Number(readEnv?.('NEXT_PUBLIC_QUEST_TASKS_PER_CARD', 'NaN'));
  const g2 = Number(readEnv?.('NEXT_PUBLIC_QUEST_TASKS', 'NaN'));
  const global = Number.isFinite(g1) ? g1 : g2;
  return Math.max(1, Number.isFinite(global) && global > 0 ? global : 10);
}, [QUESTS, readEnv]);

// Пометить задачу выполненной + завести локальный таймер (tid = "1".."N")
const markTaskDone = React.useCallback(async (qid, tid) => {
  writeQuestProg(prev => {
    const cardPrev = { ...(prev[qid] || {}) };
    const done = new Set(cardPrev.done || []);
    done.add(String(tid)); // индекс
    const next = { ...cardPrev, done: Array.from(done), ts: Date.now() };
    // при переходе через «все задачи» — фиксируем момент готовности к клейму
    const total = getCardTotalTasks(qid);
    if ((cardPrev.done?.length || 0) < total && next.done.length >= total && !next.claimReadyTs) {
      next.claimReadyTs = Date.now();
    }
    return { ...prev, [qid]: next };
  });
  // таймер фиксируем ОДИН раз — при первом done этой задачи
  writeTimers(prev => {
    const card = { ...(prev[qid] || {}) };
    if (!card[String(tid)]) card[String(tid)] = Date.now(); // индекс
    return { ...prev, [qid]: card };
  });
  // === фоновый POST на сервер (не ломает локальную логику) ===
  try {
    // нужна авторизация: без uid сервер вернёт 401 — просто молча выходим
    const uid = auth?.accountId || auth?.asherId || '';   
     if (!uid) return;

    const serverCardId = normalizeCardId(qid);     // "quest-1" -> "1"
    const taskNum = String(tid);                   // "1".."N"
    if (!serverCardId || !taskNum) return;

    // антидубль (ключ на конкретную задачу)
    const flightKey = `${uid}::${serverCardId}::${taskNum}`;
    if (taskPostInflightRef.current.has(flightKey)) return;
    taskPostInflightRef.current.add(flightKey);

    const r = await fetch('/api/quest/progress', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forum-user': uid,
        'x-forum-vip': vipActive ? '1' : '0',
      },
      cache: 'no-store',
      body: JSON.stringify({ cardId: serverCardId, taskId: taskNum, accountId: uid }),
    });
    let j = null; try { j = await r.json(); } catch {}

    // если сервер вернул serverClaimable — «подтягиваем» claimReadyTs локально (без ожидания таймеров)
    if (j?.ok && j?.serverClaimable) {
      writeQuestProg(prev => {
        const card = { ...(prev[qid] || {}) };
        if (!card.claimReadyTs) card.claimReadyTs = Date.now();
        return { ...prev, [qid]: card };
      });
    }
  } catch {
    /* без шума — оффлайн/сбой сети не мешает UX */
  } finally {
    try {
      const uid = auth?.accountId || auth?.asherId || '';
      if (uid) {
        const serverCardId = normalizeCardId(qid);
        const flightKey = `${uid}::${serverCardId}::${String(tid)}`;
        taskPostInflightRef.current.delete(flightKey);
      }
    } catch {}
  }
}, [writeQuestProg, writeTimers, auth?.accountId, auth?.asherId, vipActive, normalizeCardId]);

// Выполнены все 10 задач?
const isCardCompleted = React.useCallback((qid) => {
  const card = questProg?.[qid];
  const total = getCardTotalTasks(qid);
  return !!(card && Array.isArray(card.done) && card.done.length >= total);
}, [questProg, getCardTotalTasks]);
// минимальная «пауза доверия» перед клеймом (мс)
const MIN_CLAIM_DELAY_MS = TASK_DELAY_MS; // единая точка из ENV
// достигнута ли готовность к клейму (10/10 и выдержана пауза)?
const isCardClaimable = React.useCallback((qid) => {
  const card = questProg?.[qid];
  const total = getCardTotalTasks(qid);            // ← реальное количество задач
  if (!card || !Array.isArray(card.done) || card.done.length < total) return false;
  const allIds = Array.from({ length: total }, (_, i) => String(i + 1)); // ← "1".."N"
  const allReady = allIds.every(tid => isTaskReady(qid, tid));
  if (!allReady) return false;
  const t = Number(card.claimReadyTs || 0);
  return !!t && (Date.now() - t) >= MIN_CLAIM_DELAY_MS;
}, [questProg, getCardTotalTasks, isTaskReady, MIN_CLAIM_DELAY_MS]);

React.useEffect(() => {
  // открываем FX только если одна из карточек дозрела до клейма
const entry = Object.entries(questProg||{}).find(([qid, v]) => {
  const total = getCardTotalTasks(qid);
  return Array.isArray(v?.done) && v.done.length >= total &&
         v.claimReadyTs && !v.claimed && (Date.now()-v.claimReadyTs) >= MIN_CLAIM_DELAY_MS;
});
  if (!entry) return;
  const [cardId] = entry;
  // читаем сумму из схемы квестов
  const qq = QUESTS.find(q => q.id === cardId);
  if (!qq) return;
  const base = (readEnv?.(qq.rewardKey, '') || '0').trim();
  if (!base || base === '0') return;
  const isVip = !!vipActive; // как в шапке
  const amount = isVip ? String(Number(base)*2) : base;

  setClaimFx({ open:true, cardId, amount, pieces: spawnCoins(28) });
}, [questProg, QUESTS, readEnv, vipActive, spawnCoins]);

// Открыть/закрыть вкладку квестов
const openQuests = React.useCallback(() => {
  // не открываем, если квесты отключены в ENV
  if (readEnv?.('NEXT_PUBLIC_QUEST_ENABLED', '1') !== '1') return;

  setInboxOpen(false);
  setVideoFeedOpen(false);
  setSel(null);
  setThreadRoot(null);
  setQuestOpen(true);

  requestAnimationFrame(() => {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  });
}, [readEnv]);

const closeQuests = React.useCallback(() => {
  setQuestSel(null);
  setQuestOpen(false);
}, []);
// конфиг рекламы
const adConf = getForumAdConf();

// clientId для детерминизма
const clientId =
  auth?.accountId ||
  auth?.asherId ||
  (typeof window !== 'undefined' && window.__forumClientId) ||
  'guest';

// гарантия, что interleaveAds всегда получит >0
const adEvery = adConf?.EVERY && adConf.EVERY > 0 ? adConf.EVERY : 1;



// одна сессия показа рекламы внутри одного тайм-слота (ROTATE_MIN)
const adSessionRef = useRef({
  bucket: null,
  used: new Set(),          // урлы, уже выданные слотам в текущем bucket (между разными слотами)
  bySlot: new Map(),        // slotKey -> url (стабильный выбор для каждого слота в рамках bucket)
});


// лог слотов (если нужно смотреть интерлив)
function debugAdsSlots(label, slots) {

  return slots;
}

// выбор урла для конкретного слота, без дублей в рамках одного ROTATE_MIN
function pickAdUrlForSlot(slotKey, slotKind) {
  if (!adConf) return null;

  const now = Date.now();
  const rotateMin = Number(adConf.ROTATE_MIN || 1);
  const periodMs = Math.max(1, rotateMin) * 60_000;
  const bucket = Math.floor(now / periodMs);

  const sess = adSessionRef.current;

  // Новый временной слот — полностью сбрасываем состояние
  if (sess.bucket !== bucket) {
    sess.bucket = bucket;
    sess.used = new Set();
    sess.bySlot = new Map();
  }

  // Если для этого слота уже выбрали урл в текущем bucket — возвращаем его как есть
  if (sess.bySlot && sess.bySlot.has(slotKey)) {
    const stable = sess.bySlot.get(slotKey);
    if (stable) {
      return stable;
    }
    // если по какой-то причине null/пусто — просто упадём ниже и переизберём
  }

  // Базовый выбор через детерминированный resolveCurrentAdUrl
  let url = resolveCurrentAdUrl(
    adConf,
    clientId,
    now,
    slotKey,
    AdsCoordinator
  );

  // Актуальный пул ссылок
  const links = (
    Array.isArray(adConf.LINKS) && adConf.LINKS.length
      ? adConf.LINKS
      : []
  ).filter(Boolean);

  // Если в этом bucket уже был такой url в другом слоте и есть альтернатива — попробуем другой
  if (url && sess.used.has(url) && links.length > 1) {
    const alt = links.find((candidate) => !sess.used.has(candidate));
    if (alt) {
      url = alt;
    }
  }

  if (!url) {
    return null;
  }

  // Фиксируем выбор:
  //  - в used, чтобы не дублировать между слотами в рамках bucket
  //  - в bySlot, чтобы не прыгать между рендерами
  sess.used.add(url);
  if (!sess.bySlot) {
    sess.bySlot = new Map();
  }
  sess.bySlot.set(slotKey, url);
  console.log('[ADS] slot_pick', { slotKey, slotKind, url });
  try {
 

  } catch {}

  return url;
}

  /* ---- render ---- */
  return (
<div
  className="forum_root space-y-4"
  data-view={sel ? 'thread' : 'topics'}
  style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} // <<< добавили
>
{/* --- FX: Coin Burst --- */}
<style jsx global>{`
 /* ===== Forum header row (LTR/RTL aware) ===== */
 .forumRowBar{
   display:flex; align-items:center; gap:10px;
   width:100%;
 }
 .forumRowBar .slot-left,
 .forumRowBar .slot-right{
   display:flex; align-items:center; gap:8px; flex:0 0 auto;
 }
 .forumRowBar .slot-center{
   flex:1 1 auto; display:flex; align-items:center; justify-content:center; min-width:0;
 }
 .forumRowBar .forumTotal{
   white-space:nowrap; opacity:.85;
 }
 /* keep badge on inbox button pinned visually */
 .forumRowBar .inboxBtn{ position:relative; }
 .forumRowBar .inboxBtn .inboxBadge{
   position:absolute; top:-6px; right:-6px;
 }
 /* RTL: зеркалим только порядок слотов, центр остаётся центром */
 [dir="rtl"] .forumRowBar{ direction:ltr; } /* чтобы иконки не переворачивались */
 [dir="rtl"] .forumRowBar .slot-left{ order:3; }
 [dir="rtl"] .forumRowBar .slot-center{ order:2; }
 [dir="rtl"] .forumRowBar .slot-right{ order:1; }

 @media (max-width:480px){
   .forumRowBar{ gap:8px; }
   .forumRowBar .forumTotal{ font-size:12px; }
 }
  @keyframes coin-pop { 0%{transform:scale(0.2);opacity:0} 60%{transform:scale(1.05);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes coin-fall {
    0%{ transform: translateY(-120vh) rotate(0deg); opacity:0 }
    15%{ opacity:1 }
    100%{ transform: translateY(120vh) rotate(720deg); opacity:0 }
  }
  .coinBurstOverlay{
    position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;
    z-index:9999; backdrop-filter: blur(2px);
  }
  .coinBurstBox{
    background: radial-gradient(ellipse at center, #1d1d1d 0%, #0e0e0e 60%, #000 100%);
    border:1px solid rgba(255,215,0,0.25);
    box-shadow:0 0 40px rgba(255,215,0,0.25), inset 0 0 40px rgba(255,215,0,0.08);
    border-radius:18px; padding:28px 24px; width:min(520px, 92vw); text-align:center; color:#ffd700; animation: coin-pop .35s ease-out;
  }
  .coinSum{ font-size:42px; font-weight:800; letter-spacing:0.5px; text-shadow:0 0 18px rgba(255,215,0,0.55); margin:8px 0 16px }
  .coinCongrats{ font-size:18px; color:#ffeaa7; opacity:0.95 }
  .coinBurstBox .btn{ margin-top:16px }
  .coinPiece{ position:fixed; top:0; left:50%; width:18px; height:18px; border-radius:50%;
    background: radial-gradient(circle at 30% 30%, #fff 0%, #ffe082 15%, #ffd54f 35%, #ffca28 60%, #d4a017 100%);
    box-shadow:0 0 12px rgba(255,215,0,0.6);
    animation: coin-fall 1.6s linear forwards;
  }
`} </style>

      <Styles />{toast.view}
       {/* Overlay камеры/плеера */}
<VideoOverlay
  open={videoOpen}
  state={
    !videoOpen
      ? 'hidden'
      : (videoState === 'recording'
          ? 'recording'
          : (videoState === 'preview' ? 'preview' : 'live'))
  }
  elapsed={videoElapsed}
  streamRef={videoStreamRef}
  previewUrl={overlayMediaUrl || pendingVideo}
  mediaKind={overlayMediaKind}
  onAccept={acceptMediaFromOverlay}
  onStart={startVideo}          // ← добавили
  onStop={stopVideo}
  onResetConfirm={resetOrCloseOverlay}
  t={t}
/>

<div
  className="grid2"
  style={{ display:'flex', flexDirection:'column', gridTemplateColumns: '1fr', flex: '1 1 auto', minHeight: 0 }}
>

  {/* ОДНА КОЛОНКА: если тема не выбрана — список тем; если выбрана — посты темы */}
  {!sel ? (
    /* === СПИСОК ТЕМ === */
    <section className="glass neon" style={{ display:'flex', flexDirection:'column', flex:'1 1 auto', minHeight: 0 }}>

{headHidden && !headPinned && isBrowser() && createPortal(
  <button
    type="button"
    className="headPeekBtn"
    aria-label={t('forum_show_header') || 'Show header'}
    onPointerDown={(e) => e.preventDefault()}
    onClick={() => { setHeadPinned(true); setHeadHidden(false); }}
  >
    <HeadChevronIcon dir="down" />
  </button>,
  document.body
)}

<div className={cls('head', headHidden && !headPinned && 'head--collapsed')}>
  {/* шапка */}
  <div className="headInner" style={{ width:'100%' }}>
    {headPinned && (
      <button
        type="button"
        className="headCollapseBtn"
        aria-label={t('forum_hide_header') || 'Hide header'}
        onClick={() => { setHeadPinned(false); setHeadHidden(true); }}
      >
        <HeadChevronIcon dir="up" />
      </button>
    )}
          <div style={{ position:'relative' }}>
            <button
              ref={avatarRef}
              className={cls('avaBig neon', (!nickShown || iconShown==='👤') && 'pulse')}
              title={nickShown || t('forum_account')}
              onClick={async()=>{
                openOnly(profileOpen ? null : 'profile')
                if (!profileOpen) return;

                setProfileOpen(v=>!v)
              }}>
              <AvatarEmoji userId={idShown} pIcon={iconShown} />
            </button>
<ProfilePopover
  anchorRef={avatarRef}
  open={profileOpen}
  onClose={()=>setProfileOpen(false)}
  t={t}
  auth={auth}
  vipActive={vipActive}
  onSaved={() => setProfileBump((x) => x + 1)}

  viewerId={viewerId}
  myFollowersCount={myFollowersCount}
  myFollowersLoading={myFollowersLoading}

  moderateImageFiles={moderateImageFiles}
  toastI18n={toastI18n}
  reasonKey={reasonKey}
  reasonFallbackEN={reasonFallbackEN}
/>
       
  {/* ник ВСЕГДА под аватаром */}
  <button
    className="nick-badge nick-animate avaNick"
    title={idShown||'—'}
    onClick={copyId}
    translate="no"
 >
    <span className="nick-text">{nickShown || t('forum_not_signed')}</span>
  </button>            
          </div>

  {/* ← ВОТ СЮДА ВСТАВЬ ПОПОВЕР */}
  {qcoinModalOpen && (
    <QCoinWithdrawPopover
      anchorRef={withdrawBtnRef}
      onClose={() => setQcoinModalOpen(false)}
      onOpenQuests={openQuests}
      t={t}
      questEnabled={QUEST_ENABLED}
      isAuthed={!!meUid}
    />
  )}


 <div className="min-w-0">
   <div
     className="qRowRight"
     style={{ '--qcoin-offset':'6px', '--qcoin-y': '10px', '--qcoin-scale':'1.15' }}  /* ← здесь настраиваешь */
   >
     <QCoinInline t={t} userKey={idShown} vipActive={vipActive} />
   </div>
 </div>
 

          {/* === НОВОЕ: правый встроенный контейнер управления === */}
          <div className="controls">
            {/* поиск + сорт */}
            <div className="search">
              <input
                className="searchInput"
                value={q}
                onChange={e=>{ setQ(e.target.value); openOnly('search') }}
                onFocus={()=>openOnly('search')}
                placeholder={t('forum_search_ph') || 'Поиск по темам и сообщениям…'}
              />
              <button className="iconBtn" aria-label="search" onClick={()=> openOnly(drop ? null : 'search')}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="iconBtn" title={t('forum_sort')||'Сортировка'} onClick={()=> openOnly(sortOpen ? null : 'sort')}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
{/* ⬇️ КВЕСТ-ИКОНКА МЕЖДУ СОРТИРОВКОЙ И VIP+ */}
<Image
  src="/click/quest.gif"
  unoptimized width={52} height={52}
  alt=""
  role="button"
  aria-label={t('quest_open') || 'Quests'}
  aria-disabled={!QUEST_ENABLED}
  tabIndex={QUEST_ENABLED ? 0 : -1}
  onClick={() => {
    try { window.dispatchEvent(new Event('qcoin:open')) } catch {}
          try { q.open?.() } catch {}
        }}
  // onClick={QUEST_ENABLED ? openQuests : undefined}
  onKeyDown={(e) => {
    if (!QUEST_ENABLED) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openQuests?.();
    }
  }}
  draggable={false}
  className={
    `questIconPure ${typeof questBtnClass !== 'undefined' ? questBtnClass : ''}`
  }
  style={{
    ['--quest-w']: '52px',   // меняй по желанию: '96px' | '3rem' | 'auto'
    ['--quest-h']: 'auto',
    ['--quest-cursor']: QUEST_ENABLED ? 'pointer' : 'default',
    ['--quest-y']: '-14px',
 }}
/>
{/* ⬆️ КОНЕЦ ВСТАВКИ */}
                {drop && q.trim() && (
                <div className="searchDrop" onMouseLeave={()=>setDrop(false)}>
                  {results.length===0 && <div className="meta px-1 py-1">{t('forum_search_empty') || 'Ничего не найдено'}</div>}
                  {results.map(r=>(
                    <button
                      key={`${r.k}:${r.id}`}
                      className="item w-full text-left mb-1"
                      onClick={()=>{
                        setDrop(false)
                        if(r.k==='t'){
                          const tt = (data.topics||[]).find(x=>x.id===r.id)
                          if(tt){ setTopicFilterId(tt.id); setSel(tt); setThreadRoot(null) }
                        }else{
                          const p = (data.posts||[]).find(x=>x.id===r.id)
                          if(p){
                            const tt = (data.topics||[]).find(x=>x.id===p.topicId)
if (tt) {
  setTopicFilterId(tt.id);
  // ✅ сразу открыть ветку ответов с заголовком = найденное сообщение
  openThreadForPost(p);
}

                          }
                        }
                      }}>
                      {r.k==='t'
                        ? (<div><div className="title">Тема: {r.title}</div>{r.desc && <div className="meta">{r.desc}</div>}</div>)
                        : (<div><div className="title">Сообщение</div><div className="meta">{r.text}</div></div>)
                      }
                    </button>
                  ))}
                </div>
              )}
{claimFx.open && (
  <div className="coinBurstOverlay" onClick={() => setClaimFx(s => ({ ...s, open: false }))}>
    {claimFx.pieces.map(p => (
      <div
        key={p.id}
        className="coinPiece"
        style={{ marginLeft: `${p.x}vw`, animationDelay: `${p.delay}ms`, width: p.size, height: p.size }}
      />
    ))}
    <div className="coinBurstBox" onClick={e => e.stopPropagation()}>
      <div className="coinCongrats">{t('quest_reward_claimed') || 'Награда зачислена'}</div>
      <div className="coinSum">+ {Number(claimFx.amount).toFixed(10)}</div>

      <button
        className="btn"
        onClick={async (e) => {
          const btn = e.currentTarget;
          if (btn.dataset.loading === '1') return;            // антидубль
          btn.dataset.loading = '1';

          if (!window.__claimingRef) window.__claimingRef = new Set();
          const claimKey = `${auth?.accountId || auth?.asherId || ''}::${claimFx.cardId}`;
          if (window.__claimingRef.has(claimKey)) return;
          window.__claimingRef.add(claimKey);

          const finish = (reset = true) => {
            if (reset) {
              setClaimFx({ open: false, cardId: '', amount: '', pieces: [] });
              try { lastClaimFxRef.current = { cardId: '', ts: Date.now() } } catch {}
            }
            btn.dataset.loading = '0';
            window.__claimingRef.delete(claimKey);
          };

          try {
            // 1) UID
            let uid = auth?.accountId || auth?.asherId || '';
            if (!uid) {
              const ok = await (typeof requireAuthStrict === 'function' ? requireAuthStrict() : openAuth?.());
              if (!ok) return finish(false);
              uid = auth?.accountId || auth?.asherId || '';
              if (!uid) return finish(false);
            }
            uid = String(uid).replace(/[^\x20-\x7E]/g, '');

            const clientCardId = claimFx.cardId;                 // "quest-1"
            const serverCardId = normalizeCardId(clientCardId);   // "1"                                                   // "1"
            if (!serverCardId || serverCardId === '0') return finish(false);
            const qq = QUESTS?.find(q => q.id === clientCardId);
            if (!qq || !qq.rewardKey) return finish(false);

           // ===== helpers
            const normalizeTaskId = (x) => {
              const s = String(x ?? '');
              const m = s.match(/(\d+)$/);
              return m ? String(Number(m[1])) : s;
            };
            const postTask = async (numStr) => {
              const common = {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-forum-user': uid,
                  'x-forum-vip': vipActive ? '1' : '0',
                },
                cache: 'no-store',
              };
            
              // сервер ждёт ЧИСЛОВОЙ cardId и ЧИСЛОВОЙ taskId
              const r = await fetch('/api/quest/progress', {                ...common,
                body: JSON.stringify({ cardId: serverCardId, taskId: numStr, accountId: uid }),
              });
              return r.ok;
            };

            // 2) синхронизация недостающих задач
            const progRes = await fetch('/api/quest/progress', {
              method: 'GET',
              headers: { 'x-forum-user': uid, 'x-forum-vip': vipActive ? '1' : '0' },
              cache: 'no-store',
            });
            let prog = {}; try { prog = await progRes.json(); } catch {}
            const serverCard = prog?.progress?.[serverCardId] || {};
            const serverDoneRaw = Array.isArray(serverCard.done) ? serverCard.done : [];
            const serverDone = new Set(serverDoneRaw.map(normalizeTaskId));

            const totalTasks = getCardTotalTasks(clientCardId);
            const allIds = Array.from({ length: totalTasks }, (_, i) => String(i + 1));
            const missing = allIds.filter(id => !serverDone.has(id));

            for (const id of missing) { try { await postTask(id); } catch {} }

            // 3) клейм
            const doClaim = async () => {
              const res = await fetch('/api/quest/progress', {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-forum-user': uid,
                  'x-forum-vip': vipActive ? '1' : '0',
                },
                cache: 'no-store',
                body: JSON.stringify({
                  cardId: serverCardId,
                  claim: true,
                  rewardKey: qq.rewardKey,
                  accountId: uid,
                }),              });
              let j = null; try { j = await res.json(); } catch {}
              return { res, j };
            };

            const { res, j } = await doClaim();

            // успех: 200/ok или 409/already_claimed
            if ((res.ok && j?.ok) || res.status === 409 || j?.error === 'already_claimed') {
             const allNumIds = Array.from({ length: getCardTotalTasks(clientCardId) }, (_, i) => String(i + 1));
              writeQuestProg(prev => {
                const card = { ...(prev[clientCardId] || {}) };
                card.claimed = true;
                card.claimTs = Date.now();
                // обеспечиваем числовые id
                if (!Array.isArray(card.done) || card.done.length < allNumIds.length) {
                  card.done = allNumIds.slice();
                } else {
                  card.done = card.done.map(normalizeTaskId);
                }
                if (!card.claimReadyTs) card.claimReadyTs = Date.now();
                return { ...prev, [clientCardId]: card };
              });
              if (j?.awarded != null) {
                try { toast.show({ type: 'ok', text: `+${Number(j.awarded).toFixed(10)} QCoin` }) } catch {}
              }
              finish(true);
              return;
            }

            const msg = j?.error || `http_${res?.status || 0}`;
            try { toast.show({ type: 'warn', text: msg }) } catch {}
            console.warn('[claim] status=', res?.status, 'json=', j);
            finish(false);
          } catch (err) {
            console.error('[claim] unexpected', err);
            try { toast.show({ type: 'warn', text: 'client_error' }) } catch {}
            finish(false);
          }
        }}
      >
        {t('quest_do') || 'Забрать'}
      </button>
    </div>
  </div>
)}



              {sortOpen && (
                <div className="sortDrop" onMouseLeave={()=>setSortOpen(false)}>

{[
  ['new',     t('forum_sort_new')     || 'Новые'],
  ['top',     t('forum_sort_top')     || 'Топ'],
  ['likes',   t('forum_sort_likes')   || 'Лайки'],
  ['views',   t('forum_sort_views')   || 'Просмотры'],
  ['replies', t('forum_sort_replies') || 'Ответы'],
].map(([k,txt])=>(
  <button
    key={k}
    className="item w-full text-left mb-1"
// [SORT_MENU:CLICK]
onClick={()=>{
  if (videoFeedOpen) setFeedSort(k);
  else if (sel) setPostSort(k);
  else setTopicSort(k);
  setSortOpen(false);
}}

  >
    {txt}
  </button>

))}

  {/* ⭐ Star-mode toggle (icon-only) */}
  <button
    type="button"
    className={`starModeBtn ${starMode ? 'on' : ''}`}
   onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setStarMode(v=>!v); }}

    title="Star mode: авторы, на которых вы подписаны — первыми"
    aria-pressed={starMode}
    aria-label="Star mode"
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path className="starPath" d="M12 2.6l2.9 6.2 6.8.6-5.1 4.4 1.6 6.6L12 16.9 5.8 20.4l1.6-6.6-5.1-4.4 6.8-.6L12 2.6Z" />
   </svg>
  </button> 
                </div>
              )}
           </div>
{/* ---- VIP+ ---- */}
<div className="vipWrap">
  <button
    ref={vipBtnRef}
    className={cls('iconBtn', vipActive ? 'vip' : 'vipGray', 'pulse', 'hoverPop')}
    title={t('forum_vip_plus') || 'VIP+'}
    onClick={()=> openOnly(vipOpen ? null : 'vip')}
  >
    VIP+
  </button>

  <VipPopover
    anchorRef={vipBtnRef}
    open={vipOpen}
    onClose={() => setVipOpen(false)}
    t={t}
    vipActive={vipActive}
    onPay={async () => {
      try {
        const accountId = auth?.accountId || auth?.asherId || '';
        if (!accountId) { 
          toast?.err?.(t('forum_need_auth') || 'Authorization required'); 
          return; 
        }

        // 1) Проверяем текущий статус через ТВОЮ ручку AI-квоты
        {
          const r0 = await fetch('/api/subscription/status', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ accountId }),
          });
          const j0 = await r0.json().catch(() => null);
          if (j0?.isVip) {
            // уже VIP — просто подсветим кнопку и закроем поповер
            try { setVipActive?.(true); } catch {}
            toast?.ok?.(t('forum_vip_already_active') || 'VIP already active');
            setVipOpen(false);
            return;
          }
        }

        // 2) Запускаем ТОТ ЖЕ платёж, что и для AI-квоты
        const r = await fetch('/api/pay/create', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ accountId }), // только accountId — без выдуманных полей
        });

        const j = await r.json().catch(() => null);
        if (j?.url) {
          // открываем NowPayments (как на бирже)
         openPaymentWindow(j.url);
          // 3) Короткий опрос статуса, пока webhook не запишет в базу
          const started = Date.now();
          let active = false;
          while (!active && Date.now() - started < 60_000) {
            await new Promise(r => setTimeout(r, 2000));
            const rs = await fetch('/api/subscription/status', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ accountId }),
            });
            const js = await rs.json().catch(() => null);
            active = !!js?.isVip;
          }

          if (active) {
            try { setVipActive?.(true); } catch {}
            toast?.ok?.(t('forum_vip_activated') || 'VIP activated');
          } else {
            // не успели получить webhook за минуту — просто сообщаем,
            // дальше подтянется твоим общим циклом/при следующем заходе
            toast?.warn?.(t('forum_vip_pending') || 'Payment pending…');
          }
        } else {
          toast?.err?.(t('forum_vip_pay_fail') || 'Payment init failed');
        }
      } catch {
        toast?.err?.(t('forum_vip_pay_fail') || 'Payment init failed');
      } finally {
        setVipOpen(false);
      }
    }}
  />
</div>
             {/* админ
            <div className="adminWrap">
              <button
                ref={adminBtnRef}
                className={cls('adminBtn', isAdmin ? 'adminOn' : 'adminOff', 'pulse', 'hoverPop')}
                onClick={()=> openOnly(adminOpen ? null : 'admin')}>
                {t('forum_admin')}
              </button>
              <AdminPopover
                anchorRef={adminBtnRef}
                open={adminOpen}
                onClose={()=>setAdminOpen(false)}
                t={t}
                isActive={isAdmin}
                onActivated={()=> setIsAdmin(true)}
                onDeactivated={()=> setIsAdmin(false)}
              />
            </div> */}
          </div>
        </div> 

 {/* ЕДИНАЯ ГОРИЗОНТАЛЬНАЯ ЛИНЕЙКА: ЛЕВО — ЦЕНТР — ПРАВО */}
  <div className="forumRowBar">

    <div className="slot-left">




        <button
        type="button"
        className="iconBtn inboxBtn"
        title={t('forum_inbox') || 'Ответы мне'}
        onClick={() => setInboxOpen(v => !v)}
        aria-pressed={inboxOpen}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
          <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {mounted && unreadCount > 0 && (
          <span className="inboxBadge" suppressHydrationWarning>{unreadCount}</span>
      )}
      </button>

     <button
    type="button"
    className="iconBtn inviteGifBtn"
    style={{
      width: INVITE_BTN_SIZE,
      height: INVITE_BTN_SIZE,
      padding: 0,
      marginRight: 8,
      transform: `translate(${INVITE_BTN_OFFSET_X}px, ${INVITE_BTN_OFFSET_Y}px)`,
    }}
    onClick={() => {
      try {
        window.dispatchEvent(new CustomEvent('invite:open'));
      } catch {}
    }}
    onMouseDown={(e) => e.preventDefault()}
    aria-label="Invite friends"
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: INVITE_GIF_SIZE,
        height: INVITE_GIF_SIZE,
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      <img
        src="/friends/invitation.gif"
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        draggable={false}
      />
    </span>
    </button> 
</div>


    <div className="slot-center">

  {/* Центр: быстрые действия (создать тему / открыть видео-ленту) */}
  <button
    type="button"
    className="iconBtn bigPlus"
        title={t('forum_create') || 'Создать'}
        aria-label={t('forum_create') || 'Создать'}
    onClick={() => {
  try { if (videoFeedOpen) closeVideoFeed?.() } catch {}
  try { setInboxOpen?.(false) } catch {}
  try { setReplyTo?.(null) } catch {}
  try { setThreadRoot?.(null) } catch {}
  // ✅ НЕ выходим из темы (иначе iPhone прыгает наверх)
  setTimeout(() => { try { window.__forumToggleCreateTopic?.() } catch {} }, 0)
}}
  >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
  </button>
           <button
    type="button"
    className="iconBtn bigPlus"
   title={t('forum_video_feed') || 'Видео'}
    aria-label={t('forum_video_feed') || 'Видео'}
    onClick={() => {
      if (videoFeedOpen) { try { closeVideoFeed?.() } catch {} ; return; }
      try { openVideoFeed?.() } catch {}
    }}
  >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="14" height="14" rx="3"></rect>
          <path d="M17 9l4-2v10l-4-2z" strokeLinejoin="round" />
        </svg>
  </button> 

    </div>
    <div className="slot-right">


      {/* Домой (иконка) */}
  <button
    type="button"
    className="iconBtn bigPlus"
    aria-label={t?.('forum_home') || 'На главную'}
    onClick={()=>{
    if (videoFeedOpen) { try{ closeVideoFeed?.() }catch{} }
    if (questOpen)     { try{ closeQuests?.() }catch{} }
    try{ setInboxOpen(false) }catch{};
    try{ setReplyTo(null) }catch{};
    try{ setThreadRoot(null) }catch{};
    try{ setSel(null) }catch{};
    setTimeout(()=>document.querySelector('[data-forum-topics-start="1"]')?.scrollIntoView({block:'start'}),0);
  }}
    title={t?.('forum_home') || 'На главную'}
  >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path d="M3 10l9-7 9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
  {/* Назад (иконка) */}
  <button
    type="button"
    className="iconBtn bigPlus"
    aria-label={t?.('forum_back') || 'Назад'}
      disabled={!videoFeedOpen && !inboxOpen && !questOpen}
    onClick={()=>{ 
      if (videoFeedOpen) { try{ closeVideoFeed?.() }catch{}; return; } 
      if (inboxOpen)    { try{ setInboxOpen(false) }catch{}; return; }
  if (questOpen) {
    // если внутри раздела квестов открыта карточка — просто закрываем её
    if (questSel) { try{ setQuestSel(null) }catch{}; return; }
    // иначе выходим из раздела квестов целиком
    try{ closeQuests?.() }catch{}; return;
  }     
 }}
       title={t?.('forum_back') || 'Назад'}
   
      >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
    </div>
  </div>
  <CreateTopicCard t={t} onCreate={createTopic} onOpenVideoFeed={openVideoFeed} />

      </div>
      
<div data-forum-topics-start="1" />
{videoFeedOpen ? (
  <>
{/* ВЕТКА-ЛЕНТА: медиа (видео/аудио/изображения) */}
<div className="meta mt-1">{t('') || ''}</div>
    <div className="grid gap-2 mt-2" suppressHydrationWarning>
{debugAdsSlots(
  'video',
  interleaveAds(
    visibleVideoFeed || [],
    adEvery,
    {
      isSkippable: (p) => !p || !p.id,
      getId: (p) => p?.id || `${p?.topicId || 'vf'}:${p?.ts || 0}`,
    }
  )
).map((slot) => {
  if (slot.type === 'item') {
    const p = slot.item;
    const parent = p?.parentId
      ? (data?.posts || []).find(x => String(x.id) === String(p.parentId))
      : null;

const openThreadHere = (clickP) => {
  // ✅ ветка открывается с заголовком = тот пост, по которому кликнули
  openThreadForPost(clickP || p, { closeInbox: true, closeVideoFeed: true });
};


    return (
      <div key={slot.key} id={`post_${p?.id || ''}`}>
<PostCard
  p={p}
  parentAuthor={parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : null}
  onReport={() => toast.ok(t('forum_report_ok'))}
  onOpenThread={openThreadHere}
  onReact={reactMut}
  isAdmin={isAdmin}
  onDeletePost={delPost}
  onOwnerDelete={delPostOwn}  
  onBanUser={banUser}
  onUnbanUser={unbanUser}
  isBanned={bannedSet.has(p?.accountId || p?.userId)}
  authId={viewerId}
  markView={markViewPost}
  t={t}
  isVideoFeed={true}   // ✅ NEW
    viewerId={viewerId}
  starredAuthors={starredAuthors}
  onToggleStar={toggleAuthorStar}
/>

      </div>
    );
  }

  const url = pickAdUrlForSlot(slot.key, 'video');
  if (!url) return null;

  return (
    <AdCard
      key={slot.key}
      url={url}
      slotKind="video"
      nearId={slot.nearId}
    />
  );
})}
      {videoHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer">
            {t?.('loading') || 'Loading…'}
          </div>
          <LoadMoreSentinel
            onVisible={() =>
              setVisibleVideoCount((c) =>
                Math.min(c + VIDEO_PAGE_SIZE, (videoFeed || []).length)
              )
            }
          />
        </div>
      )}
      {videoFeed?.length === 0 && (
        <div className="meta">
          {t('forum_search_empty') || 'Ничего не найдено'}
        </div>
      )}
    </div>


  </>
) : (questOpen && QUEST_ENABLED) ? (
  <>
    <div className="meta mt-1">{t('') || ''}</div>
    <QuestHub
      t={t}
      quests={QUESTS}
      questProg={questProg}
      isCardCompleted={isCardCompleted}
      isCardClaimable={isCardClaimable}
      readEnv={readEnv}
      vipActive={vipActive}
      getTaskRemainMs={getTaskRemainMs}     // ← добавили
      taskDelayMs={TASK_DELAY_MS}           // ← добавили      
      onOpenCard={openQuestCardChecked}
      onCloseCard={() => setQuestSel(null)}
      onMarkDone={(qid, tid) => markTaskDone(qid, tid)}
      selected={questSel}
    />
  </>


) : inboxOpen ? (
  <>
    <div className="meta mt-1">{t('forum_inbox_title') || 'Ответы на ваши сообщения'}</div>
    <div className="grid gap-2 mt-2" suppressHydrationWarning>
{debugAdsSlots(
  'inbox',
  interleaveAds(
    visibleRepliesToMe || [],
    adEvery,
    {
      isSkippable: (p) => !p || !p.id,
      getId: (p) => p?.id || `${p?.topicId || 'ib'}:${p?.ts || 0}`,
    }
  )
).map((slot) => {
  if (slot.type === 'item') {
    const p = slot.item;
    return (
      <div key={slot.key} id={`post_${p.id}`}>
        <PostCard
          p={p}
          parentAuthor={(() => {
            const parent = (data.posts || []).find(x => String(x.id) === String(p.parentId))
            return parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : ''
          })()}
          onReport={() => toast.ok(t('forum_report_ok'))}
onOpenThread={(clickP) => {
  // ✅ из любой карточки: открыть сразу ветку ответов по клику на счётчик
  openThreadForPost(clickP || p, { closeInbox: true });
}}

          onReact={reactMut}
          isAdmin={isAdmin}
          onDeletePost={delPost}
          onOwnerDelete={delPostOwn}          
          onBanUser={banUser}
          onUnbanUser={unbanUser}
          isBanned={bannedSet.has(p.accountId || p.userId)}
          authId={viewerId}
          markView={markViewPost}
          t={t}
            viewerId={viewerId}
  starredAuthors={starredAuthors}
  onToggleStar={toggleAuthorStar}
        />
      </div>
    );
  }

  const url = pickAdUrlForSlot(slot.key, 'inbox');
  if (!url) return null;

  return (
    <AdCard
      key={slot.key}
      url={url}
      slotKind="inbox"
      nearId={slot.nearId}
    />
  );
})}

      {repliesHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer">
            {t?.('loading') || 'Loading…'}
          </div>
          <LoadMoreSentinel
            onVisible={() =>
              setVisibleRepliesCount((c) =>
                Math.min(c + REPLIES_PAGE_SIZE, sortedRepliesToMe.length)
              )
            }
          />
        </div>
      )}
      {sortedRepliesToMe.length === 0 && (
        <div className="meta">
          {t('forum_inbox_empty') || 'Новых ответов нет'}
        </div>
      )}
    </div>

  </>
) : (
  <>
    
    <div className="grid gap-2 mt-2" suppressHydrationWarning>
      {(visibleTopics || []).map(x => {
          const agg = aggregates.get(x.id) || { posts:0, likes:0, dislikes:0, views:0 };
          return (
<TopicItem
  key={`t:${x.id}`}
  t={x}
  agg={agg}
  onOpen={(tt)=>{ setSel(tt); setThreadRoot(null) }}
  onView={markViewTopic}
  isAdmin={isAdmin}
  onDelete={delTopic}
  authId={viewerId}
  onOwnerDelete={delTopicOwn}
  viewerId={viewerId}
  starredAuthors={starredAuthors}
  onToggleStar={toggleAuthorStar}
/>

          )
        })}
    </div>
    {topicsHasMore && (
      <div className="loadMoreFooter">
        <div className="loadMoreShimmer">
          {t?.('loading') || 'Loading…'}
        </div>
        <LoadMoreSentinel
          onVisible={() =>
            setVisibleTopicsCount((c) =>
              Math.min(c + TOPIC_PAGE_SIZE, (sortedTopics || []).length)
            )
          }
        />
      </div>
    )}    
  </>
)}


<div
  className="body"
  ref={bodyRef}
  style={{ flex: '1 1 auto', minHeight: 0, height:'100%', overflowY: 'auto', WebkitOverflowScrolling:'touch' }}
>



</div>

    </section>
  ) : (
    /* === ВЫБРАННАЯ ТЕМА: посты + композер === */
    <section className="glass neon" style={{ display:'flex', flexDirection:'column', flex:'1 1 auto', minHeight: 0 }}>

{headHidden && !headPinned && isBrowser() && createPortal(
  <button
    type="button"
    className="headPeekBtn"
    aria-label={t('forum_show_header') || 'Show header'}
    onPointerDown={(e) => e.preventDefault()}
    onClick={() => { setHeadPinned(true); setHeadHidden(false); }}
  >
    <HeadChevronIcon dir="down" />
  </button>,
  document.body
)}

<div className={cls('head', headHidden && !headPinned && 'head--collapsed')}>
  {/* шапка */}
  <div className="headInner" style={{ width:'100%' }}>
    {headPinned && (
      <button
        type="button"
        className="headCollapseBtn"
        aria-label={t('forum_hide_header') || 'Hide header'}
        onClick={() => { setHeadPinned(false); setHeadHidden(true); }}
      >
        <HeadChevronIcon dir="up" />
      </button>
    )}
          <div style={{ position:'relative' }}>
            <button
              ref={avatarRef}
              className={cls('avaBig neon', (!nickShown || iconShown==='👤') && 'pulse')}
              title={nickShown || t('forum_account')}
              onClick={async()=>{
                openOnly(profileOpen ? null : 'profile')
                if (!profileOpen) return;

                setProfileOpen(v=>!v)
              }}>
              <AvatarEmoji userId={idShown} pIcon={iconShown} />
            </button>
<ProfilePopover
  anchorRef={avatarRef}
  open={profileOpen}
  onClose={()=>setProfileOpen(false)}
  t={t}
  auth={auth}
  vipActive={vipActive}
  onSaved={() => setProfileBump((x) => x + 1)}

  viewerId={viewerId}
  myFollowersCount={myFollowersCount}
  myFollowersLoading={myFollowersLoading}

  moderateImageFiles={moderateImageFiles}
  toastI18n={toastI18n}
  reasonKey={reasonKey}
  reasonFallbackEN={reasonFallbackEN}
/>
       
  {/* ник ВСЕГДА под аватаром */}
  <button
    className="nick-badge nick-animate avaNick"
    title={idShown||'—'}
    onClick={copyId}
    translate="no"
 >
    <span className="nick-text">{nickShown || t('forum_not_signed')}</span>
  </button>            
          </div>

  {/* ← ВОТ СЮДА ВСТАВЬ ПОПОВЕР */}
  {qcoinModalOpen && (
    <QCoinWithdrawPopover
      anchorRef={withdrawBtnRef}
      onClose={() => setQcoinModalOpen(false)}
      onOpenQuests={openQuests}
      t={t}
      questEnabled={QUEST_ENABLED}
      isAuthed={!!meUid}
    />
  )}


 <div className="min-w-0">
   <div
     className="qRowRight"
     style={{ '--qcoin-offset':'6px', '--qcoin-y': '10px', '--qcoin-scale':'1.15' }}  /* ← здесь настраиваешь */
   >
     <QCoinInline t={t} userKey={idShown} vipActive={vipActive} />
   </div>
 </div>
 

          {/* === НОВОЕ: правый встроенный контейнер управления === */}
          <div className="controls">
            {/* поиск + сорт */}
            <div className="search">
              <input
                className="searchInput"
                value={q}
                onChange={e=>{ setQ(e.target.value); openOnly('search') }}
                onFocus={()=>openOnly('search')}
                placeholder={t('forum_search_ph') || 'Поиск по темам и сообщениям…'}
              />
              <button className="iconBtn" aria-label="search" onClick={()=> openOnly(drop ? null : 'search')}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="iconBtn" title={t('forum_sort')||'Сортировка'} onClick={()=> openOnly(sortOpen ? null : 'sort')}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
{/* ⬇️ КВЕСТ-ИКОНКА МЕЖДУ СОРТИРОВКОЙ И VIP+ */}
<Image
  src="/click/quest.gif"
  unoptimized width={52} height={52}
  alt=""
  role="button"
  aria-label={t('quest_open') || 'Quests'}
  aria-disabled={!QUEST_ENABLED}
  tabIndex={QUEST_ENABLED ? 0 : -1}
  onClick={() => {
    try { window.dispatchEvent(new Event('qcoin:open')) } catch {}
          try { q.open?.() } catch {}
        }}
  // onClick={QUEST_ENABLED ? openQuests : undefined}
  onKeyDown={(e) => {
    if (!QUEST_ENABLED) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openQuests?.();
    }
  }}
  draggable={false}
  className={
    `questIconPure ${typeof questBtnClass !== 'undefined' ? questBtnClass : ''}`
  }
  style={{
    ['--quest-w']: '52px',   // меняй по желанию: '96px' | '3rem' | 'auto'
    ['--quest-h']: 'auto',
    ['--quest-cursor']: QUEST_ENABLED ? 'pointer' : 'default',
    ['--quest-y']: '-14px',
 }}
/>
{/* ⬆️ КОНЕЦ ВСТАВКИ */}
                {drop && q.trim() && (
                <div className="searchDrop" onMouseLeave={()=>setDrop(false)}>
                  {results.length===0 && <div className="meta px-1 py-1">{t('forum_search_empty') || 'Ничего не найдено'}</div>}
                  {results.map(r=>(
                    <button
                      key={`${r.k}:${r.id}`}
                      className="item w-full text-left mb-1"
                      onClick={()=>{
                        setDrop(false)
                        if(r.k==='t'){
                          const tt = (data.topics||[]).find(x=>x.id===r.id)
                          if(tt){ setTopicFilterId(tt.id); setSel(tt); setThreadRoot(null) }
                        }else{
                          const p = (data.posts||[]).find(x=>x.id===r.id)
                          if(p){
                            const tt = (data.topics||[]).find(x=>x.id===p.topicId)
if (tt) {
  setTopicFilterId(tt.id);
  // ✅ сразу открыть ветку ответов с заголовком = найденное сообщение
  openThreadForPost(p);
}

                          }
                        }
                      }}>
                      {r.k==='t'
                        ? (<div><div className="title">Тема: {r.title}</div>{r.desc && <div className="meta">{r.desc}</div>}</div>)
                        : (<div><div className="title">Сообщение</div><div className="meta">{r.text}</div></div>)
                      }
                    </button>
                  ))}
                </div>
              )}
{claimFx.open && (
  <div className="coinBurstOverlay" onClick={() => setClaimFx(s => ({ ...s, open: false }))}>
    {claimFx.pieces.map(p => (
      <div
        key={p.id}
        className="coinPiece"
        style={{ marginLeft: `${p.x}vw`, animationDelay: `${p.delay}ms`, width: p.size, height: p.size }}
      />
    ))}
    <div className="coinBurstBox" onClick={e => e.stopPropagation()}>
      <div className="coinCongrats">{t('quest_reward_claimed') || 'Награда зачислена'}</div>
      <div className="coinSum">+ {Number(claimFx.amount).toFixed(10)}</div>

      <button
        className="btn"
        onClick={async (e) => {
          const btn = e.currentTarget;
          if (btn.dataset.loading === '1') return;            // антидубль
          btn.dataset.loading = '1';

          if (!window.__claimingRef) window.__claimingRef = new Set();
          const claimKey = `${auth?.accountId || auth?.asherId || ''}::${claimFx.cardId}`;
          if (window.__claimingRef.has(claimKey)) return;
          window.__claimingRef.add(claimKey);

          const finish = (reset = true) => {
            if (reset) {
              setClaimFx({ open: false, cardId: '', amount: '', pieces: [] });
              try { lastClaimFxRef.current = { cardId: '', ts: Date.now() } } catch {}
            }
            btn.dataset.loading = '0';
            window.__claimingRef.delete(claimKey);
          };

          try {
            // 1) UID
            let uid = auth?.accountId || auth?.asherId || '';
            if (!uid) {
              const ok = await (typeof requireAuthStrict === 'function' ? requireAuthStrict() : openAuth?.());
              if (!ok) return finish(false);
              uid = auth?.accountId || auth?.asherId || '';
              if (!uid) return finish(false);
            }
            uid = String(uid).replace(/[^\x20-\x7E]/g, '');

            const clientCardId = claimFx.cardId;                 // "quest-1"
            const serverCardId = normalizeCardId(clientCardId);   // "1"                                                   // "1"
            if (!serverCardId || serverCardId === '0') return finish(false);
            const qq = QUESTS?.find(q => q.id === clientCardId);
            if (!qq || !qq.rewardKey) return finish(false);

           // ===== helpers
            const normalizeTaskId = (x) => {
              const s = String(x ?? '');
              const m = s.match(/(\d+)$/);
              return m ? String(Number(m[1])) : s;
            };
            const postTask = async (numStr) => {
              const common = {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-forum-user': uid,
                  'x-forum-vip': vipActive ? '1' : '0',
                },
                cache: 'no-store',
              };
            
              // сервер ждёт ЧИСЛОВОЙ cardId и ЧИСЛОВОЙ taskId
              const r = await fetch('/api/quest/progress', {                ...common,
                body: JSON.stringify({ cardId: serverCardId, taskId: numStr, accountId: uid }),
              });
              return r.ok;
            };

            // 2) синхронизация недостающих задач
            const progRes = await fetch('/api/quest/progress', {
              method: 'GET',
              headers: { 'x-forum-user': uid, 'x-forum-vip': vipActive ? '1' : '0' },
              cache: 'no-store',
            });
            let prog = {}; try { prog = await progRes.json(); } catch {}
            const serverCard = prog?.progress?.[serverCardId] || {};
            const serverDoneRaw = Array.isArray(serverCard.done) ? serverCard.done : [];
            const serverDone = new Set(serverDoneRaw.map(normalizeTaskId));

            const totalTasks = getCardTotalTasks(clientCardId);
            const allIds = Array.from({ length: totalTasks }, (_, i) => String(i + 1));
            const missing = allIds.filter(id => !serverDone.has(id));

            for (const id of missing) { try { await postTask(id); } catch {} }

            // 3) клейм
            const doClaim = async () => {
              const res = await fetch('/api/quest/progress', {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-forum-user': uid,
                  'x-forum-vip': vipActive ? '1' : '0',
                },
                cache: 'no-store',
                body: JSON.stringify({
                  cardId: serverCardId,
                  claim: true,
                  rewardKey: qq.rewardKey,
                  accountId: uid,
                }),              });
              let j = null; try { j = await res.json(); } catch {}
              return { res, j };
            };

            const { res, j } = await doClaim();

            // успех: 200/ok или 409/already_claimed
            if ((res.ok && j?.ok) || res.status === 409 || j?.error === 'already_claimed') {
             const allNumIds = Array.from({ length: getCardTotalTasks(clientCardId) }, (_, i) => String(i + 1));
              writeQuestProg(prev => {
                const card = { ...(prev[clientCardId] || {}) };
                card.claimed = true;
                card.claimTs = Date.now();
                // обеспечиваем числовые id
                if (!Array.isArray(card.done) || card.done.length < allNumIds.length) {
                  card.done = allNumIds.slice();
                } else {
                  card.done = card.done.map(normalizeTaskId);
                }
                if (!card.claimReadyTs) card.claimReadyTs = Date.now();
                return { ...prev, [clientCardId]: card };
              });
              if (j?.awarded != null) {
                try { toast.show({ type: 'ok', text: `+${Number(j.awarded).toFixed(10)} QCoin` }) } catch {}
              }
              finish(true);
              return;
            }

            const msg = j?.error || `http_${res?.status || 0}`;
            try { toast.show({ type: 'warn', text: msg }) } catch {}
            console.warn('[claim] status=', res?.status, 'json=', j);
            finish(false);
          } catch (err) {
            console.error('[claim] unexpected', err);
            try { toast.show({ type: 'warn', text: 'client_error' }) } catch {}
            finish(false);
          }
        }}
      >
        {t('quest_do') || 'Забрать'}
      </button>
    </div>
  </div>
)}



              {sortOpen && (
                <div className="sortDrop" onMouseLeave={()=>setSortOpen(false)}>

{[
  ['new',     t('forum_sort_new')     || 'Новые'],
  ['top',     t('forum_sort_top')     || 'Топ'],
  ['likes',   t('forum_sort_likes')   || 'Лайки'],
  ['views',   t('forum_sort_views')   || 'Просмотры'],
  ['replies', t('forum_sort_replies') || 'Ответы'],
].map(([k,txt])=>(
  <button
    key={k}
    className="item w-full text-left mb-1"
// [SORT_MENU:CLICK]
onClick={()=>{
  if (videoFeedOpen) setFeedSort(k);
  else if (sel) setPostSort(k);
  else setTopicSort(k);
  setSortOpen(false);
}}

  >
    {txt}
  </button>

))}

  {/* ⭐ Star-mode toggle (icon-only) */}
  <button
    type="button"
    className={`starModeBtn ${starMode ? 'on' : ''}`}
   onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setStarMode(v=>!v); }}

    title="Star mode: авторы, на которых вы подписаны — первыми"
    aria-pressed={starMode}
    aria-label="Star mode"
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path className="starPath" d="M12 2.6l2.9 6.2 6.8.6-5.1 4.4 1.6 6.6L12 16.9 5.8 20.4l1.6-6.6-5.1-4.4 6.8-.6L12 2.6Z" />
   </svg>
  </button> 
                </div>
              )}
           </div>
{/* ---- VIP+ ---- */}
<div className="vipWrap">
  <button
    ref={vipBtnRef}
    className={cls('iconBtn', vipActive ? 'vip' : 'vipGray', 'pulse', 'hoverPop')}
    title={t('forum_vip_plus') || 'VIP+'}
    onClick={()=> openOnly(vipOpen ? null : 'vip')}
  >
    VIP+
  </button>

  <VipPopover
    anchorRef={vipBtnRef}
    open={vipOpen}
    onClose={() => setVipOpen(false)}
    t={t}
    vipActive={vipActive}
    onPay={async () => {
      try {
        const accountId = auth?.accountId || auth?.asherId || '';
        if (!accountId) { 
          toast?.err?.(t('forum_need_auth') || 'Authorization required'); 
          return; 
        }

        // 1) Проверяем текущий статус через ТВОЮ ручку AI-квоты
        {
          const r0 = await fetch('/api/subscription/status', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ accountId }),
          });
          const j0 = await r0.json().catch(() => null);
          if (j0?.isVip) {
            // уже VIP — просто подсветим кнопку и закроем поповер
            try { setVipActive?.(true); } catch {}
            toast?.ok?.(t('forum_vip_already_active') || 'VIP already active');
            setVipOpen(false);
            return;
          }
        }

        // 2) Запускаем ТОТ ЖЕ платёж, что и для AI-квоты
        const r = await fetch('/api/pay/create', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ accountId }), // только accountId — без выдуманных полей
        });

        const j = await r.json().catch(() => null);
        if (j?.url) {
          // открываем NowPayments (как на бирже)
         openPaymentWindow(j.url);
          // 3) Короткий опрос статуса, пока webhook не запишет в базу
          const started = Date.now();
          let active = false;
          while (!active && Date.now() - started < 60_000) {
            await new Promise(r => setTimeout(r, 2000));
            const rs = await fetch('/api/subscription/status', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ accountId }),
            });
            const js = await rs.json().catch(() => null);
            active = !!js?.isVip;
          }

          if (active) {
            try { setVipActive?.(true); } catch {}
            toast?.ok?.(t('forum_vip_activated') || 'VIP activated');
          } else {
            // не успели получить webhook за минуту — просто сообщаем,
            // дальше подтянется твоим общим циклом/при следующем заходе
            toast?.warn?.(t('forum_vip_pending') || 'Payment pending…');
          }
        } else {
          toast?.err?.(t('forum_vip_pay_fail') || 'Payment init failed');
        }
      } catch {
        toast?.err?.(t('forum_vip_pay_fail') || 'Payment init failed');
      } finally {
        setVipOpen(false);
      }
    }}
  />
</div>
             {/* админ
            <div className="adminWrap">
              <button
                ref={adminBtnRef}
                className={cls('adminBtn', isAdmin ? 'adminOn' : 'adminOff', 'pulse', 'hoverPop')}
                onClick={()=> openOnly(adminOpen ? null : 'admin')}>
                {t('forum_admin')}
              </button>
              <AdminPopover
                anchorRef={adminBtnRef}
                open={adminOpen}
                onClose={()=>setAdminOpen(false)}
                t={t}
                isActive={isAdmin}
                onActivated={()=> setIsAdmin(true)}
                onDeactivated={()=> setIsAdmin(false)}
              />
            </div> */}
          </div>
        </div>        
  {/* ЕДИНАЯ ГОРИЗОНТАЛЬНАЯ ЛИНЕЙКА: ЛЕВО — ЦЕНТР — ПРАВО */}
  <div className="forumRowBar">

    <div className="slot-left"> 

      <button
        type="button"
        className="iconBtn inboxBtn"
        title={t('forum_inbox') || 'Ответы мне'}
        onClick={() => setInboxOpen(v => !v)}
        aria-pressed={inboxOpen}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
          <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {mounted && unreadCount > 0 && (
          <span className="inboxBadge" suppressHydrationWarning>{unreadCount}</span>
      )}
      </button>
 
     <button
    type="button"
    className="iconBtn inviteGifBtn"
    style={{
      width: INVITE_BTN_SIZE,
      height: INVITE_BTN_SIZE,
      padding: 0,
      marginRight: 8,
      transform: `translate(${INVITE_BTN_OFFSET_X}px, ${INVITE_BTN_OFFSET_Y}px)`,
    }}
    onClick={() => {
      try {
        window.dispatchEvent(new CustomEvent('invite:open'));
      } catch {}
    }}
    onMouseDown={(e) => e.preventDefault()}
    aria-label="Invite friends"
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: INVITE_GIF_SIZE,
        height: INVITE_GIF_SIZE,
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      <img
        src="/friends/invitation.gif"
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        draggable={false}
      />
    </span>
    </button> 
</div>


    <div className="slot-center">

  {/* Центр: быстрые действия (создать тему / открыть видео-ленту) */}
  <button
    type="button"
    className="iconBtn bigPlus"
        title={t('forum_create') || 'Создать'}
        aria-label={t('forum_create') || 'Создать'}
    onClick={() => {
  try { if (videoFeedOpen) closeVideoFeed?.() } catch {}
  try { setInboxOpen?.(false) } catch {}
  try { setReplyTo?.(null) } catch {}
  try { setThreadRoot?.(null) } catch {}
  try { setSel?.(null) } catch {}
  setTimeout(() => { try { window.__forumToggleCreateTopic?.() } catch {} }, 0)
}}

  >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
  </button>
 
        <button
    type="button"
    className="iconBtn bigPlus"
   title={t('forum_video_feed') || 'Видео'}
    aria-label={t('forum_video_feed') || 'Видео'}
    onClick={() => {
      if (videoFeedOpen) { try { closeVideoFeed?.() } catch {} ; return; }
      try { openVideoFeed?.() } catch {}
    }}
  >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="14" height="14" rx="3"></rect>
          <path d="M17 9l4-2v10l-4-2z" strokeLinejoin="round" />
        </svg>
  </button> 
    </div>
    <div className="slot-right">


      {/* Домой (иконка) */}
  <button
    type="button"
    className="iconBtn bigPlus"
    aria-label={t?.('forum_home') || 'На главную'}
    onClick={()=>{ 
      try{ setInboxOpen(false) }catch{};
      try{ setReplyTo(null) }catch{}; 
      try{ setThreadRoot(null) }catch{}; 
      try{ setSel(null) }catch{};
setTimeout(()=>document.querySelector('[data-forum-topics-start="1"]')?.scrollIntoView({block:'start'}),0);    
    }}
    title={t?.('forum_home') || 'На главную'}
  >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path d="M3 10l9-7 9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button> 
  {/* Назад (иконка) */}
  <button
    type="button"
    className="iconBtn bigPlus"
    aria-label={t?.('forum_back') || 'Назад'}
  onClick={()=>{
    if (inboxOpen)   { try{ setInboxOpen(false) }catch{}; return; }
    if (threadRoot)  { try{ setReplyTo(null) }catch{}; try{ setThreadRoot(null) }catch{}; return; }
    try{ setReplyTo(null) }catch{};
    try{ setSel(null) }catch{};
  }}
    title={t?.('forum_back') || 'Назад'}
  >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
    </div>
<CreateTopicCard t={t} onCreate={createTopic} onOpenVideoFeed={openVideoFeed} />

        </div>
<div data-forum-topics-start="1" />
  {/* Заголовок темы оставляем ниже, как был */}
  <div   className="
    topicTitle text-[#eaf4ff]
    !whitespace-normal break-words
    [overflow-wrap:anywhere]
    max-w-full"
 suppressHydrationWarning>
    <span className="whitespace-normal break-words [overflow-wrap:anywhere] [line-break:anywhere]">
      {threadRoot ? (t('forum_open_replies') || 'Ответы') : (sel?.title || '')}
    </span>
  </div>

{/* [INBOX:PANEL] — панель входящих ответов (та же логика, что и в списке тем) */}
{inboxOpen && (
  <div className="item mt-2">
    <div className="title">
      {t('forum_inbox_title') || 'Ответы на ваши сообщения'}
    </div>

    {sortedRepliesToMe.length === 0 ? (
      <div className="inboxEmpty">
        {t('forum_inbox_empty') || 'Пока нет ответов'}
      </div>
    ) : (
      <div className="inboxList">
        {visibleRepliesToMe.map(p => {
          // та же логика, что в верхнем инбоксе
          const tt = (data.topics || []).find(
            x => String(x.id) === String(p.topicId),
          );
          if (!tt) return null;

          const parentAuthor = (() => {
            const parent = (data.posts || []).find(
              x => String(x.id) === String(p.parentId),
            )
            return parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : ''
          })();

          return (
            <PostCard
              key={`inb:${p.id}`}
              p={p}
              parentAuthor={parentAuthor}
              onReport={() => toast.ok(t('forum_report_ok'))}
onOpenThread={(clickP) => {
  // ✅ из любой карточки: открыть сразу ветку ответов по клику на счётчик
  openThreadForPost(clickP || p, { closeInbox: true });
}}

  onReact={reactMut}
  isAdmin={isAdmin}
  onDeletePost={delPost}
  onOwnerDelete={delPostOwn}  
  onBanUser={banUser}
  onUnbanUser={unbanUser}
  isBanned={bannedSet.has(p.accountId || p.userId)}
  authId={viewerId}
  markView={markViewPost}
  t={t}
  viewerId={viewerId}
  starredAuthors={starredAuthors}
  onToggleStar={toggleAuthorStar}
/>
          );
        })}
        {repliesHasMore && (
          <div className="loadMoreFooter">
            <div className="loadMoreShimmer">
              {t?.('loading') || 'Loading…'}
            </div>
            <LoadMoreSentinel
              onVisible={() =>
                setVisibleRepliesCount((c) =>
                  Math.min(c + REPLIES_PAGE_SIZE, sortedRepliesToMe.length)
                )
              }
            />
          </div>
        )}        
      </div>
    )}
  </div>
)}


      </div>

      <div
  className="body"
  ref={bodyRef}
  style={{ flex: '1 1 auto', minHeight: 0, height:'100%', overflowY: 'auto', WebkitOverflowScrolling:'touch' }}
>


        <div className="grid gap-2">
{debugAdsSlots(
  'replies',
  interleaveAds(
    visibleFlat || [],
    adEvery,
    {
      isSkippable: (p) => !p || !p.id,
      getId: (p) => p?.id,
    }
  )
).map((slot) => {
  if (slot.type === 'item') {
    const p = slot.item;
    const parent = p.parentId
      ? allPosts.find(x => String(x.id) === String(p.parentId))
      : null;

    return (
      <div
        key={slot.key}
        id={`post_${p.id}`}
        style={{ marginLeft: (p._lvl || 0) * 18 }}
      >
<PostCard
  p={p}
  parentAuthor={parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : null}
  onReport={() => toast.ok(t('forum_report_ok'))}
  onReply={() => setReplyTo(p)}
  onOpenThread={(clickP) => { setThreadRoot(clickP); }}
  onReact={reactMut}
  isAdmin={isAdmin}
  onDeletePost={delPost}
  onOwnerDelete={delPostOwn}  
  onBanUser={banUser}
  onUnbanUser={unbanUser}
  isBanned={bannedSet.has(p.accountId || p.userId)}
  authId={viewerId}
  markView={markViewPost}
  t={t}
  viewerId={viewerId}
  starredAuthors={starredAuthors}
  onToggleStar={toggleAuthorStar}
/>

      </div>
    );
  }

  const url = pickAdUrlForSlot(slot.key, 'replies');
  if (!url) return null;

  return (
    <AdCard
      key={slot.key}
      url={url}
      slotKind="replies"
      nearId={slot.nearId}
    />
  );
})}
        {threadHasMore && (
          <div className="loadMoreFooter">
            <div className="loadMoreShimmer">
              {t?.('loading') || 'Loading…'}
            </div>
            <LoadMoreSentinel
              onVisible={() =>
                setVisibleThreadPostsCount((c) =>
                  Math.min(c + THREAD_PAGE_SIZE, (flat || []).length)
                )
              }
            />
          </div>
        )}
          {(!threadRoot && (flat || []).length === 0) && (
            <div className="meta">
              {t('forum_no_posts_yet') || 'Пока нет сообщений'}
            </div>
          )}
        </div>

      </div>
<div className="composeDock">
{/* нижний композер */}
<div className="composer" data-active={composerActive} ref={composerRef}>
  <div className="meta mb-2">
    {replyTo
      ? `${t('forum_reply_to')||'Ответ для'} ${resolveNickForDisplay(replyTo.userId || replyTo.accountId, replyTo.nickname)}`
      : threadRoot
        ? `${t('forum_replying_to')||'Ответ к'} ${resolveNickForDisplay(threadRoot.userId || threadRoot.accountId, threadRoot.nickname)}`
        : t('')}
  </div>


  {/* ВСТРОЕННЫЙ КОМПОЗЕР ВНУТРИ ПОЛЯ */}
  <div className="forumComposer">
    <div className="taWrap" data-active={composerActive}>

      {/* ЕДИНАЯ ГОРИЗОНТАЛЬНАЯ РЕЛЬСА (вместо боковых) */}
      <div className="topRail" role="toolbar" aria-label="Composer actions">
        <div className="railInner">
          {/* 1) Счётчик */}
          <div className="railItem">
            <div className="miniCounter" aria-live="polite">
              <span>{String(text || '').trim().length}</span>
              <span className="sep">/</span>
              <span className={(String(text || '').trim().length > 400) ? 'max over' : 'max'}>400</span>
            </div>
          </div>

          {/* 2) Скрепка */}
{/* 2) Скрепка */}
<div className="railItem">
  <button
    type="button"
    className="iconBtn ghost"
    aria-label={t('forum_attach') || 'Прикрепить'}
    title={t('forum_attach') || 'Прикрепить'}
    onClick={handleAttachClick}
  >
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M7 13.5l6.5-6.5a3.5 3.5 0 115 5L10 20a6 6 0 11-8.5-8.5"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  </button>
</div>


          {/* 3) Смайл */}
          <div className="railItem">
            <button
              type="button"
              className="iconBtn ghost"
              title={t('forum_more_emoji')}
              aria-label={t('forum_more_emoji')}
              onClick={()=>setEmojiOpen(v=>!v)}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill="none"/>
                <circle cx="9"  cy="10" r="1.2" fill="currentColor"/>
                <circle cx="15" cy="10" r="1.2" fill="currentColor"/>
                <path d="M8 14.5c1.2 1.2 2.8 1.8 4 1.8s2.8-.6 4-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

{/* 4) Видео */}
<div className="railItem">
  <button
    type="button"
    className={cls(
      'iconBtn camBtn',
      videoState==='recording' && 'rec',
      (videoState==='uploading') && 'disabled'
    )}
    aria-label={videoState==='recording' ? 'Stop' : (videoState==='preview' ? 'Снять заново' : 'Снять видео')}
    title={videoState==='recording' ? 'Stop' : (videoState==='preview' ? 'Снять заново' : 'Снять видео')}
    onClick={(e)=>{
      e.preventDefault();
      if (videoState==='uploading') return;

      try { setOverlayMediaKind('video'); } catch {}
      try { setOverlayMediaUrl(null); } catch {}
      try { setVideoOpen(true); } catch {}
      try { setVideoState('live'); } catch {}
      try { setComposerActive(false); } catch {}
      try { document.activeElement?.blur?.() } catch {}
    }}
  >
              {videoState==='recording'
                ? <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
                    <span style={{width:12,height:12,borderRadius:'50%',background:'#FF4D4F',display:'inline-block'}}/>
                    <b>REC</b>
                  </span>
                : (
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M7 7h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
                    <circle cx="12" cy="12" r="3" fill={videoState==='preview' ? '#3A7BFF' : 'currentColor'} />
                  </svg>
                )
              }
             
            </button>
          </div>

{/* 5) Голос */}
<div className="railItem">
  <button
    type="button"
    className={cls('iconBtn ghost micBtn', recState==='rec' && 'rec')}
    aria-label="Hold to record voice"
    onMouseDown={(e)=>{
      e.preventDefault();
      startRecord();
    }}
    onMouseUp={()=>{ if (recState==='rec') stopRecord(); }}
    onMouseLeave={()=>{ if (recState==='rec') stopRecord(); }}
    onTouchStart={(e)=>{
      e.preventDefault();
      startRecord();
    }}
    onTouchEnd={()=>{ if (recState==='rec') stopRecord(); }}
  >
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3Z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
          {recState === 'rec' && (
            <span className="micTimer" aria-live="polite">{fmtSec(recElapsed)}</span>
          )}    
  </button>
</div>

          {/* 6) Отправка */}
          <div className="railItem">
            <button
              type="button"
              className={cls(
                'iconBtn planeBtn',
                (postingRef.current || cooldownLeft>0 || !canSend || String(text||'').trim().length>400) && 'disabled'
              )}
              title={cooldownLeft>0 ? `${cooldownLeft}s` : (t('forum_send')||'Send')}
              aria-label={t('forum_send')||'Send'}
              disabled={postingRef.current || cooldownLeft>0 || !canSend || String(text||'').trim().length>400}
              onClick={async ()=>{
                if (postingRef.current || cooldownLeft>0) return;
                try{
                  setVideoState(s => (pendingVideo ? 'uploading' : s));
                  try { if (videoOpen) setVideoOpen(false); } catch {}
                  await createPost();
                  setCooldownLeft?.(10);
                  try { resetVideo(); } catch {}
                }finally{
                  try { setEmojiOpen(false) } catch {}
                }
              }}
            >
              <svg viewBox="0 0 24 24" className="plane" aria-hidden>
                <path d="M3 11.5l17-8.5-7.2 18.5-2.3-6.2-6.5-3.8z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* /единая рельса */}

      {/* поле ввода */}
      <textarea
        className="taInput"
        value={(/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/).test(text || '') ? '' : (text || '')}
        onChange={e=>{
          if ((/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/).test(text || '')) {
            setText(text);
          } else {
            setText(e.target.value.slice(0,400));
          }
        }}
        onFocus={() => setComposerActive(true)}
        readOnly={(/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/).test(text || '')}
        maxLength={400}
        placeholder={
          (/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/).test(text || '')
            ? (t('forum_more_emoji') || 'VIP emoji selected')
            : t('forum_composer_placeholder')
        }
      />

{/* превью VIP/MOZI эмодзи (если выбрано) */}
{(/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/.test(text || '')) && (
  <div className="vipComposerPreview">
    <Image
      src={(text || '').replace(/^\[(VIP_EMOJI|MOZI):(.*?)\]$/, '$2')}
      unoptimized width={64} height={64} alt=""
      className={
        (text || '').startsWith('[MOZI:')
          ? 'moziEmojiBig emojiPreviewBig'
          : 'vipEmojiBig emojiPreviewBig'
      }
    />
    <button
      type="button"
      className="vipRemove emojiRemoveBtn"
      title={t?.('forum_remove') || 'Убрать'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setText('');
      }}
    >
      ✕
    </button>
  </div>
)}

    </div>

    {/* превью вложений (оставляем как было) */}
    {pendingImgs.length > 0 && (
      <div className="attachPreviewRow mt-2" 
      style={{ maxWidth: 'min(50%, 320px)' }}>
        {pendingImgs.map((u, i) => (
          <button
            key={i}
            type="button"
            className="relative group shrink-0"
            title={t?.('forum_remove_attachment') || 'Убрать вложение'}
            onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setPendingImgs(prev => prev.filter((_,idx)=>idx!==i)); }}
          >
            <Image src={u} alt="" loading="lazy" unoptimized width={96} height={32} className="h-8 w-auto max-w-[96px] rounded-md ring-1 ring-white/10" />
            <span className="absolute -top-1 -right-1 hidden group-hover:inline-flex items-center justify-center text-[10px] leading-none px-1 rounded bg-black/70">❌</span>
          </button>
        ))}
      </div>
    )}

{pendingVideo && (
  <div className="attachPreviewRow mt-2">
    <div
      className="videoCard preview"
      style={{
        position: 'relative',
        maxWidth: 'min(70%, 420px)',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.12)',
        background: '#000',
      }}
    >
      {/* ВАЖНО: controls должны работать и НЕ открывать fullscreen */}
      <video
        src={pendingVideo}
        controls
        playsInline
        preload="metadata"
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: 220,
          display: 'block',
          objectFit: 'contain',
          background: '#000',
        }}
        onClick={(e) => {
          // чтобы клик по видео/контролам НЕ открывал оверлей
          e.stopPropagation();
        }}
      />

      {/* Кнопка “открыть fullscreen overlay” отдельно */}
      <button
        type="button"
        title={t?.('forum_open_fullscreen') || 'Открыть на весь экран'}
onClick={() => {
  // открываем ТОТ ЖЕ VideoOverlay, что и для камеры/превью
  try { setOverlayMediaKind?.('video'); } catch {}
  // pendingVideo уже пробрасывается в previewUrl через props, поэтому url можно не дублировать
  try { setOverlayMediaUrl?.(null); } catch {}
  try { setVideoState?.('preview'); } catch {}
  try { setVideoOpen?.(true); } catch {}
}}
        style={{
          position: 'absolute',
          right: 8,
          top: 8,
          width: 34,
          height: 34,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,.18)',
          background: 'rgba(0,0,0,.55)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⤢
      </button>

      {/* удалить видео */}
      <button
        type="button"
        title={t?.('forum_remove') || 'Убрать'}
        onClick={() => {
  // Должно вести себя как крестик внутри fullscreen-оверлея: полностью очищаем состояние видео.
  try {
    if (pendingVideo && /^blob:/i.test(String(pendingVideo))) {
      URL.revokeObjectURL(pendingVideo);
    }
  } catch {}
  try { setPendingVideo?.(null); } catch {}
  try { setOverlayMediaUrl?.(null); } catch {}
  try { setOverlayMediaKind?.('video'); } catch {}
  try { setVideoOpen?.(false); } catch {}
  try { setVideoState?.('idle'); } catch {}
  try { resetVideo?.(); } catch {}
}}

        style={{
          fontSize: '20px',
          position: 'absolute',
          left: 5,
          bottom: 170,
          width: 54,
          height: 54,
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.4)',
          background: 'rgba(0, 0, 0, 0.52)',
          color: '#ff0000ff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ❌
      </button>
    </div>
  </div>
)}

{pendingAudio && (
      <div className="attachPreviewRow mt-2">
        <div className="audioCard preview">
          <div className="audioIcon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3Z" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <audio controls src={pendingAudio} />
          <button type="button" className="audioRemove" title={t('forum_remove')||'Убрать'} onClick={()=> setPendingAudio(null)}>❌</button>
        </div>
      </div>
    )}

    {/* панель эмодзи — ниже поля (с вкладками) */}
    {emojiOpen && (
      <div
       className="emojiPanel"
        style={{
          maxHeight: 250,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          paddingRight: 4,
          marginTop: 6,
        }}
      >
        <div className="p-1">
          {/* две кнопки-фильтра: обычные Emoji и VIP (stickers) */}
          <div className="emojiTabs" style={{ display:'flex', gap:6, margin:'0 0 8px' }}>
            <button
              type="button"
              className="emojiTabBtn"
              aria-pressed={emojiTab==='emoji' ? 'true' : 'false'}
              onClick={() => setEmojiTab('emoji')}
              title={t?.('forum_tab_emoji') || 'Emoji'}
            >
              {t?.('forum_tab_emoji') || 'Emoji'}
            </button>
            <button
              type="button"
              className="emojiTabBtn"
              aria-pressed={emojiTab==='stickers' ? 'true' : 'false'}
              onClick={() => setEmojiTab('stickers')}
              title={t?.('forum_tab_stickers') || 'Stickers'}
            >
              {t?.('forum_tab_stickers') || 'Stickers'}
            </button>
          </div>

          {/* контент вкладок — только фильтрация, логика скролла неизменна */}
          {emojiTab === 'stickers' ? (
            <>
              <div className="emojiTitle">{t?.('forum_emoji_vip') || 'VIP / MOZI'}</div>
              <div className="emojiGrid">
                {VIP_EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="emojiBtn hoverPop"
                    onClick={() => { addEmoji(e); setEmojiOpen(false); }}
                    title=""
                  >
  {typeof e === 'string' && e.startsWith('/')
    ? <Image src={e} alt="" className="vipEmojiIcon" width={64} height={64} unoptimized />
    : <span className="vipEmojiIcon">{e}</span>}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {EMOJI.map((cat) => (
                <div key={cat.k} className="mb-2">
                  <div className="emojiTitle">{t?.(cat.title) || cat.k}</div>
                  <div className="emojiGrid">
                    {cat.list.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="emojiBtn"
                        onClick={() => addEmoji(e)}
                        title=""
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )}
  </div>

  {/* скрытый инпут для загрузки файлов */}
<input
  id="file-input"
  ref={fileInputRef}
  type="file"
  accept="image/*,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
  multiple
  style={{ display: 'none' }}
  onChange={onFilesChosen}
/>

  </div>
  {/* FAB: синяя кнопка с карандашом */}
  <button
    type="button"
    className="fabCompose"
    aria-label="Написать сообщение"
    title="Написать сообщение"
    onClick={() => setComposerActive(true)}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04c.39-.39.39-1.02 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.99-1.67z"/>
    </svg>
  </button> 
</div>{/* /composeDock */}
</section>
)}
</div>
</div>
)
};

function QuestHub({
  t,
  quests,
  questProg,
  isCardClaimable: isCardClaimableProp,
  readEnv,
  vipActive,
  onOpenCard, 
  onMarkDone,                  // (qid, tidString "1..N")
  selected,
  getTaskRemainMs,             // (qid, tidString) -> ms
  taskDelayMs = 15000
}) {
  /* === scoped стили «зелёной галки» === */
  const tickStyles = (
    <style jsx>{`
      .qTickDraw{ display:inline-block; width:22px; height:22px; position:relative; }
      .qTickDraw::before{
        content:''; position:absolute; inset:0;
        -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5L20 7"/></svg>') center/contain no-repeat;
                mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5L20 7"/></svg>') center/contain no-repeat;
        background:#2ecc71; filter: drop-shadow(0 0 6px rgba(46,204,113,.55));
        animation: qTickStroke .7s ease-out forwards;
      }
    /* Фолбэк для браузеров без CSS mask */
    @supports not ((-webkit-mask: url("")) or (mask: url(""))) {
      .qTickDraw{ width:auto; height:auto; }
      .qTickDraw::before{
        content:"✓";
        position:static;
        -webkit-mask:none; mask:none;
        background:none;
        color:#2ecc71;
        text-shadow:0 0 6px rgba(46,204,113,.55);
        font-weight:800;
      }
    }        
      @keyframes qTickStroke{
        from { clip-path: inset(0 100% 0 0); opacity:.6; transform:scale(.9) rotate(-6deg); }
        60%  { clip-path: inset(0 0 0 0); opacity:1; transform:scale(1.02) rotate(0deg); }
        to   { clip-path: inset(0 0 0 0); opacity:1; transform:scale(1); }
      }
    `}</style>
  );


  /* === общий тик раз в секунду, хук — всегда, работа только при открытой карточке === */
  const [__questTick, __setQuestTick] = React.useState(0);
  React.useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => __setQuestTick(x => (x + 1) & 1023), 1000);
    return () => clearInterval(id);
  }, [selected]);

  /* === утилиты === */
  const doubleDecimal = React.useCallback((s) => {
    try {
      const str = String(s ?? '0');
      const [i, f=''] = str.split('.');
      const n = BigInt((i || '0') + f);
      const d = (n * 2n).toString();
      return f ? (d.slice(0, -f.length) || '0') + '.' + d.slice(-f.length).padStart(f.length,'0') : d;
    } catch { return s }
  }, []);

  // сколько задач должно быть у карточки (ENV с покарточным оверрайдом)
  const getTotalTasks = React.useCallback((card) => {
    const idNum = Number(String(card?.id || '').match(/(\d+)$/)?.[1] || NaN);
    const perCardStr =
      (Number.isFinite(idNum) ? readEnv?.(`NEXT_PUBLIC_QUEST_CARD_${idNum}_TASK_COUNT`, '') : '') || '';
    const perCard = Number(perCardStr);

    const globalStr =
      readEnv?.('NEXT_PUBLIC_QUEST_TASKS_PER_CARD', readEnv?.('NEXT_PUBLIC_QUEST_TASKS', '10')) || '10';
    const global = Number(globalStr);

    if (Number.isFinite(perCard) && perCard > 0) return perCard;
    if (Array.isArray(card?.tasks) && card.tasks.length > 0) return card.tasks.length;
    return (Number.isFinite(global) && global > 0) ? global : 10;
  }, [readEnv]);

  const __questGetRemainMs = React.useCallback((qid, tid) => {
    try {
      if (typeof getTaskRemainMs === 'function') {
        const v = getTaskRemainMs(qid, tid);
        if (Number.isFinite(v) && v >= 0) return v;
      }
    } catch {}
    return Math.max(0, Number(taskDelayMs) || 15000);
  }, [getTaskRemainMs, taskDelayMs]);

  // локальная «можно клеймить?», если сверху не дали проп
  const claimDelayMsLocal = Math.max(0, Number(readEnv?.('NEXT_PUBLIC_QUEST_CLAIM_DELAY_MS', '0')) || 0);
  const isCardClaimableLocal = React.useCallback((qid) => {
    const card = questProg?.[qid];
    if (!card) return false;
    const total = getTotalTasks((quests || []).find(x => x?.id === qid) || {});
    const doneCount = Array.isArray(card.done) ? card.done.length : 0;
    if (doneCount < total) return false;
    const ts = Number(card.claimReadyTs || 0);
    return !!ts && (Date.now() - ts) >= claimDelayMsLocal;
  }, [questProg, quests, claimDelayMsLocal, getTotalTasks]);

  const canClaim = React.useCallback(
    (qid) => (typeof isCardClaimableProp === 'function'
      ? isCardClaimableProp(qid)
      : isCardClaimableLocal(qid)),
    [isCardClaimableProp, isCardClaimableLocal]
  );

  // ===== animated checkmark (no masks) =====
  function AnimatedCheckmark() {
    return (
      <>
        <style jsx>{`
          .cmrk {
            display:inline-flex; align-items:center; justify-content:center;
            width:42px; height:42px;
          }
          .cmrk svg { width:42px; height:42px; overflow:visible; }
          .cmrk .tick {
            fill:none; stroke:#2ecc71; stroke-width:3; stroke-linecap:round; stroke-linejoin:round;
            /* анимация прорисовки */
            stroke-dasharray: 28;
            stroke-dashoffset: 28;
            animation: cmrk-draw .40s ease-out forwards;
            filter: drop-shadow(0 0 6px rgba(46,204,113,.55));
          }
          @keyframes cmrk-draw { to { stroke-dashoffset: 0; } }
          /* уважение reduce-motion */
          @media (prefers-reduced-motion: reduce) {
            .cmrk .tick { animation: none; stroke-dashoffset: 0; }
          }
        `}</style>
        <span className="cmrk" aria-label="done" title="Готово">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path className="tick" d="M5 12.5l5 5L20 7.5" />
          </svg>
        </span>
      </>
    );
  }


  /* ===== Список карточек ===== */
  if (!selected) {
    return (
      <div className="questList mt-2" suppressHydrationWarning>
        {tickStyles}

        {/* стили для правого бейджа без absolute */}
        <style jsx>{`
          .qHeadRow{
            display:flex; align-items:center; gap:12px;
          }
          .qMid{
            flex: 1 1 auto; min-width:0;   /* даём середине сжиматься и переносить строки */
          }
          .qRight{
            flex: 0 0 auto; margin-left:auto;
            display:inline-flex; align-items:center; justify-content:center;
          }

          /* анимации/стили бейджей */
          .tag.warn{
            color:#ff4d4f; background:rgba(255,77,79,.12);
            border:1px solid rgba(255,77,79,.45);
            font-weight:800; letter-spacing:.2px;
            animation:qWarnPulse 1.6s ease-in-out infinite;
          }
          @keyframes qWarnPulse{
            0%,100%{ transform:scale(1) }
            50%    { transform:scale(1.08) }
          }
          .tag.ok{
            color:#17d673; background:rgba(23, 214, 115, 0.18);
            border:1px solid rgba(23, 214, 115, 0.78);
            animation:qOkPop .6s ease-out both, qOkGlow 2s ease-in-out infinite alternate;
          }
          @keyframes qOkPop{
            0%{ transform:scale(.84) rotate(-6deg); opacity:.75 }
            60%{ transform:scale(1.05) rotate(0deg); opacity:1 }
            100%{ transform:scale(1) }
          }
          @keyframes qOkGlow{
            0%  { box-shadow:0 0 0 rgba(23,214,115,0), 0 0 8px rgba(6, 184, 255, 1) }
            100%{ box-shadow:0 0 16px rgba(23, 214, 115, 0.22), 0 0 22px rgba(23,214,115,.15) }
          }

          /* на узких — мету позволяем переносить строки, правый бейдж остаётся на месте */
          @media (max-width: 520px){
            .questMeta{ white-space:normal }
          }
        `}</style>

        {quests.map((q) => {
          const done        = (questProg?.[q.id]?.done || []).length || 0;
          const reward      = readEnv?.(q.rewardKey, '') || '';
          const rewardShown = vipActive ? doubleDecimal(reward) : reward;
          const totalTasks  = getTotalTasks(q);
          const remain      = Math.max(0, totalTasks - done);
          const isClaimed = !!questProg?.[q.id]?.claimed;
          return (
            <button
              key={q.id}
              type="button"
              className="item qshine questItem hoverPop text-left"
              onClick={() => { if (!isClaimed) onOpenCard?.(q) }}
              aria-disabled={isClaimed}
              data-claimed={isClaimed ? '1' : '0'}
              title={t(q.i18nKey) || q.id}
            >
              <div className="questHead qHeadRow">
                {/* слева — обложка */}
                {q.cover ? (
                  q.coverType === 'mp4'
                    ? <video className="questThumb" src={q.cover} playsInline autoPlay muted loop preload="metadata" />
                    : <Image className="questThumb" src={q.cover} alt="" loading="lazy" unoptimized width={60} height={60} />
                ) : (<div className="avaMini">🗂️</div>)}

                {/* середина — тянется/переносится */}
                <div className="qMid min-w-0">
                  <div className="questTitle whitespace-normal break-words">
                    {t(q.i18nKey) || q.id}
                  </div>
                  <div className="questMeta">
                    {(t('quest_tasks_done') || 'Выполни')}
                    {reward ? (
                      <>
                        {' • '}{(t('quest_reward') || 'Награда')}: <span className="goldReward big">{rewardShown}</span>
                        <span
                          className={cls('qcoinX2', vipActive ? 'vip' : 'needVip', 'hoverPop')}
                          role="button"
                          tabIndex={0}
                          aria-label="x2 VIP"
                          title={vipActive
                            ? (t('forum_qcoin_x2_active') || '×2 за VIP — активно')
                            : (t('forum_qcoin_x2_get')    || 'Купить VIP+ чтобы получить ×2')}
                          onClick={() => { if (!vipActive) { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
                          onKeyDown={(e) => { if (!vipActive && (e.key === 'Enter' || e.key === ' ')) { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
                          suppressHydrationWarning
                          style={{ marginLeft: 8 }}
                        >×2</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* справа — бейдж/галочка, никогда не перекрывает контент */}
                <div className="qRight">
                  {questProg?.[q.id]?.claimed || canClaim(q.id) ? (
                    <span className="tag ok" title={t('quest_done') || 'Готово'}>✓</span>
                    // если хочешь — можно заменить на <AnimatedCheckmark />
                  ) : (
                    <span
                      className={cls('tag', 'warn')}
                      title={t('quest_tasks_left') || 'Осталось задач'}
                      aria-label="tasks-left"
                    >
                      {String(remain)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }




  /* ===== Детали выбранной карточки ===== */
  const q = selected;
  const doneSet = new Set((questProg?.[q.id]?.done || []).map(String));
  const reward = readEnv?.(q.rewardKey, '') || '';
  const rewardShown = vipActive ? doubleDecimal(reward) : reward;
  const totalTasks = getTotalTasks(q);
  const taskList = Array.isArray(q.tasks) ? q.tasks.slice(0, totalTasks) : [];

  return (
    <div className="item qshine">
      {tickStyles}

      {/* стили именно для списка задач выбранного квеста */}
      <style jsx>{`
        .questTaskHead{
          display:flex;
          align-items:flex-start;
          gap:.6rem;
        }
        /* левая колонка: фиксируем ширину = ширине иконки,
           чтобы маленький счётчик не мог её ужать */
        .questTaskIconCol{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:4px;
          width:98px;
          min-width:98px;
          flex:0 0 98px;
        }
      `}</style>

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-3">
          {q.cover ? (
            q.coverType === 'mp4'
              ? <video className="questThumb" src={q.cover} playsInline autoPlay muted loop preload="metadata" />
              : <Image className="questThumb" src={q.cover} alt="" loading="lazy" unoptimized width={60} height={60} />
          ) : (<div className="avaMini">🗂️</div>)}

          <div>
            <div className="title whitespace-normal break-words">
              {t(q.i18nKey) || q.id}
            </div>

            {reward && (
              <div className="meta">
                {(t('quest_reward') || 'Награда')}: <span className="goldReward">{rewardShown}</span>
                <span
                  className={cls('qcoinX2', vipActive ? 'vip' : 'needVip', 'hoverPop')}
                  role="button"
                  tabIndex={0}
                  aria-label="x2 VIP"
                  title={vipActive
                    ? (t('forum_qcoin_x2_active') || '×2 за VIP — активно')
                    : (t('forum_qcoin_x2_get')    || 'Купить VIP+ чтобы получить ×2')}
                  onClick={() => { if (!vipActive) { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
                  onKeyDown={(e) => { if (!vipActive && (e.key === 'Enter' || e.key === ' ')) { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
                  suppressHydrationWarning
                  style={{ marginLeft: 8 }}
                >×2</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="questTaskList">
        {taskList.map((task, idx) => {
          const tid = String(idx + 1);                           // унифицированный id задачи: "1..N"
          const url = readEnv?.(task.urlKey, '') || '';
          const isDone = doneSet.has(tid);

          return (
            <div key={task.id ?? `t:${idx}`} className="item qshine questTask" data-intensity="soft">
              <div className="questHead questTaskHead">
                {/* ЛЕВАЯ КОЛОНКА: иконка + Start/таймер/галка ПОД ней, фиксированной ширины */}
                <div className="questTaskIconCol">
                  {task.cover ? (
                    <Image
                      className="questThumb"
                      src={task.cover}
                      alt=""
                      unoptimized
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="avaMini">🏁</div>
                  )}

                  <div>
                    {isDone ? (
                      (() => {
                        const remain = Math.max(0, __questGetRemainMs(q.id, tid)); // страховка
                        if (remain > 0) {
                          const sec = Math.ceil(remain / 1000);
                          return (
                            <span
                              className="tag warn"
                              data-tick={__questTick}
                              title="Таймер"
                            >
                              {sec}s
                            </span>
                          );
                        }
                        return <AnimatedCheckmark key={`done:${q.id}:${tid}`} />;
                      })()
                    ) : (
                      url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nick-badge"
                          onClick={() => { setTimeout(() => onMarkDone?.(q.id, tid), 0); }}
                        >
                          {t('quest_do') || 'Сделать'}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="nick-badge"
                          onClick={() => { setTimeout(() => onMarkDone?.(q.id, tid), 0); }}
                        >
                          {t('quest_do') || 'Сделать'}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: текст задачи */}
                <div className="min-w-0">
                  <div className="title whitespace-normal break-words">
                    {t(task.i18nKey) || `${q.id} • ${idx + 1}`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



/* =========================================================
   Карточка создания темы
========================================================= */
function CreateTopicCard({ t, onCreate, onOpenVideoFeed }){
  const [open,setOpen] = useState(false)
  const [busy,setBusy] = useState(false)
  const [title,setTitle] = useState(''), [descr,setDescr] = useState(''), [first,setFirst] = useState('')
  // даём глобальный (но безопасный) хук для верхних кнопок в шапке
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fn = () => setOpen(true);
    window.__forumToggleCreateTopic = fn;
    return () => {
      try { if (window.__forumToggleCreateTopic === fn) delete window.__forumToggleCreateTopic; } catch {}
    };
  }, []);
  return (
<div className="createTopicRow mb-2">    
       {open && (
        <div className="item w-full mt-2">
          <div className="grid gap-2">
            <label className="block">
              <div className="meta mb-1">{t('forum_topic_title')}</div>
              <input
                className="input"
                value={title}
                onChange={e=>setTitle(e.target.value)}
                placeholder={t('forum_topic_title_ph')}
                maxLength={40}
              />
              <div className="charRow" aria-live="polite">
                <span className="charNow">{title.trim().length}</span>
                <span className="charSep">/</span>
                <span className={title.trim().length > 40 ? 'charMax charOver' : 'charMax'}>40</span>
              </div>  
            </label>
            <label className="block">
              <div className="meta mb-1">{t('forum_topic_desc')}</div>
              <textarea
                className="input textarea"
                value={descr}
                onChange={e=>setDescr(e.target.value)}
                placeholder={t('forum_topic_desc_ph')}
                maxLength={90}
              />
              <div className="charRow" aria-live="polite">
                <span className="charNow">{descr.trim().length}</span>
                <span className="charSep">/</span>
                <span className={descr.trim().length > 90 ? 'charMax charOver' : 'charMax'}>90</span>
              </div>

            </label>
            <label className="block">
              <div className="meta mb-1">{t('forum_topic_first_msg')}</div>
              <textarea
                className="ta"
                rows={6}
                value={first}
                onChange={e=>setFirst(e.target.value.slice(0,400))}
                maxLength={400}
                placeholder={t('forum_topic_first_msg_ph')}
              />
              {/* L85 → ВСТАВИТЬ СЮДА */}
              <div className="charRow" aria-live="polite">
                <span className="charNow">{first.trim().length}</span>
                <span className="charSep">/</span>
                <span className={first.trim().length > 400 ? 'charMax charOver' : 'charMax'}>400</span>
              </div>
            </label>
            <div className="flex items-center justify-end gap-2">
              <button className="btn btnGhost" onClick={()=>setOpen(false)}>{t('forum_cancel')}</button>
              <button
                className="btn"
                disabled={
                  busy
                  || !title.trim()
                  || !first.trim()
                  || title.trim().length > 40
                  || descr.trim().length > 90
                  || first.trim().length > 400
                }
                onClick={async()=>{
                  if (
                    busy
                    || !title.trim()
                    || !first.trim()
                    || title.trim().length > 40
                    || descr.trim().length > 90
                    || first.trim().length > 400
                  ) return;
                  setBusy(true)
                  try{
                    await onCreate?.(title.trim(), descr.trim(), first.trim())
                    setTitle(''); setDescr(''); setFirst(''); setOpen(false)
                  }finally{ setBusy(false) }
                }}>
                {busy ? (t('forum_creating')||'Создаю…') : t('forum_create')}
              </button>

            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2"> 
     </div>
    </div>
  )
} 