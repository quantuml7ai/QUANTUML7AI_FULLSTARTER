'use client'


import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { useI18n } from '../../components/i18n'
import { useRouter } from 'next/navigation'
import { broadcast as forumBroadcast } from './events/bus'

// хелперы для отправки событий (строки, защита от undefined)
function emitCreated(pId, tId) {
  try { forumBroadcast({ type: 'post_created', postId: String(pId), topicId: String(tId) }); } catch {}
}
function emitDeleted(pId, tId) {
  try { forumBroadcast({ type: 'post_deleted', postId: String(pId), topicId: String(tId) }); } catch {}
 
}

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
function BackToTopButton() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const scroller = document.querySelector('.forum_root .body');
    if (!scroller) return;
    const onScroll = () => setShow(scroller.scrollTop > 600);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      className="backToTop"
      onClick={() => {
        const scroller = document.querySelector('.forum_root .body');
        if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      aria-label="Back to top"
      title="Наверх"
    >
      ↑
    </button>
  );
}


function ensureClientId(){
  try{
    let v = localStorage.getItem('forum:cid')
    if(!v){ v = (crypto?.randomUUID?.() || `c_${Math.random().toString(36).slice(2)}${Date.now()}`); localStorage.setItem('forum:cid', v) }
    return v
  }catch{ return `c_${Date.now()}` }
}
// --- hydration-safe helpers (вставь выше разметки) ---
function safeReadProfile(userId) {
  if (typeof window === 'undefined' || !userId) return {};
  try { return JSON.parse(localStorage.getItem('profile:' + userId) || '{}'); }
  catch { return {}; }
}
// [VIP AVATAR FIX] выбираем, что показывать на карточках
function resolveIconForDisplay(userId, pIcon) {
  const prof = safeReadProfile(userId) || {};
  // приоритет: vipIcon (URL) → vipEmoji (эмодзи) → то, что пришло с сервера
  return prof.vipIcon || prof.vipEmoji || pIcon || '👤';
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

  // stock (s:N) → /avatars/N.webp
  if (iconId.startsWith('s:')) {
    const n = Math.max(0, parseInt(iconId.slice(2), 10) || 0)
    return `/avatars/${n}.webp`
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
  const h = [...String(userId)].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0)
  const i = Math.abs(h) % 8
  return `/avatars/${i}.webp`
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
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
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
const VIEW_TTL_SEC      = Number(CFG.FORUM_VIEW_TTL_SEC      ?? 1800);


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
  const [t,set] = useState(null)
  useEffect(()=>{ if(!t) return; const id = setTimeout(()=>set(null), 1800); return ()=>clearTimeout(id) },[t])
  return {
    view: t ? <div className="qft_toast_wrap"><div className={cls('qft_toast', t.kind)}>{t.msg}</div></div> : null,
    ok:(m)=>set({kind:'ok',msg:m}), warn:(m)=>set({kind:'warn',msg:m}), err:(m)=>set({kind:'err',msg:m}),
  }
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

  // Снимок базы (полный), поддерживает cache-bust b и подсказку rev
  async snapshot(q = {}) {
    try {
      const params = new URLSearchParams();
      if (q.b)   params.set('b',   String(q.b));
      if (q.rev) params.set('rev', String(q.rev));
      const url = '/api/forum/snapshot' + (params.toString() ? `?${params}` : '');
      const r   = await fetch(url, { cache: 'no-store' });

      const raw = await r.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      const topics = Array.isArray(data?.topics) ? data.topics : [];
      const posts  = Array.isArray(data?.posts)  ? data.posts  : [];
      // server -> 'banned'; поддерживаем обратную совместимость с 'bans'
      const bans   = Array.isArray(data?.banned) ? data.banned
                    : Array.isArray(data?.bans)  ? data.bans : [];
      const rev    = Number.isFinite(+data?.rev) ? +data.rev   : 0;
      const cursor = data?.cursor ?? null;

      // «пустой» ответ => можно делать жёсткий ресет
      const __reset = topics.length === 0 && posts.length === 0;

      return { ok: r.ok, status: r.status, topics, posts, bans, rev, cursor, __reset };
    } catch {
      return { ok:false, error:'network', topics:[], posts:[], bans:[], rev:0, cursor:null, __reset:false };
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
};

function initForumAutosnapshot({ intervalMs = 60000, debounceMs = 1000 } = {}) {
  if (!isBrowser()) return () => {};

  let last = 0;
  const doSnap = () => {
    const now = Date.now();
    if (now - last < debounceMs) return;       // простая защита от «дребезга»
    last = now;
    // bust: гарантируем полный снимок, даже если сервер кеширует
    api.snapshot({ b: Date.now() }).catch(() => {});
  };

  // Любое взаимодействие пользователя — триггерим снапшот (дёшево и сердито)
  const handler = () => doSnap();
  const evts = [
    'pointerdown','pointerup','click','keydown','wheel','scroll',
    'touchstart','visibilitychange','focus'
  ];

  evts.forEach((e) => window.addEventListener(e, handler, { passive: true }));

  // Параллельно — периодический «heartbeat», если надо
  const id = intervalMs ? setInterval(() => {
    api.snapshot().catch(() => {});
  }, intervalMs) : null;

  // снятие слушателей при размонтировании
  return () => {
    evts.forEach((e) => window.removeEventListener(e, handler));
    if (id) clearInterval(id);
  };
}

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

    ['pointerdown','keydown','wheel','touchstart'].forEach((e)=>{
      root.addEventListener(e, onAny, {passive:true});
    });
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onAny);

    return function(){
      ['pointerdown','keydown','wheel','touchstart'].forEach((e)=>{
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

/* --- header: ... --- */
.head{
  position:sticky; top:0; z-index:50; overflow:visible;
  display:flex; align-items:center; gap:12px; padding:12px 14px;
  border-bottom:1px solid rgba(255,255,255,.1);
  flex-wrap:wrap;
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
    .title{ font-size:1.08rem; font-weight:800; letter-spacing:.2px }
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
    .avaBig{ width:112px; height:112px; border-radius:34px; border:1px solid rgba(80,167,255,.45); display:grid; place-items:center; font-size:48px; background:rgba(25,129,255,.10) }
    .avaMini{ width:60px; height:60px; border-radius:10px; font-size:18px }
/* === AVATAR FILL (добавка) ============================= */

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
.sortDrop{ position:absolute; top:48px; right:-4px; width:220px; border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98); border-radius:12px; padding:6px; z-index:3000 }


    .adminWrap{ position:relative; flex:0 0 auto } /* справа от поиска, в рамках .controls */
    .adminBtn{ border:1px solid rgba(255,255,255,.16); border-radius:12px; padding:.55rem .8rem; font-weight:700; letter-spacing:.4px }
    .adminOff{ background:rgba(255,90,90,.10); border-color:rgba(255,120,120,.45); color:#ffb1a1 }
    .adminOn{ background:rgba(70,210,120,.12); border-color:rgba(110,240,170,.45); color:#baf7d6 }
    .pulse{ position:relative; overflow:hidden }
    .pulse::before,.pulse::after{
      content:''; position:absolute; inset:-20%; border-radius:16px; pointer-events:none;
      background:radial-gradient(50% 50% at 50% 50%, rgba(80,167,255,.35), rgba(80,167,255,0) 70%);
      animation:wv 2.4s infinite;
    }
    .pulse::after{ animation-delay:1.2s }
    @keyframes wv{ 0%{ transform:scale(.8); opacity:.55 } 70%{ transform:scale(1.25); opacity:.12 } 100%{ transform:scale(1.35); opacity:0 } }

    .qft_toast_wrap{ position:fixed; right:16px; bottom:16px; z-index:4000 }
    .qft_toast{ max-width:min(420px,90vw); padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(10,14,22,.94); color:#eaf4ff; box-shadow:0 10px 28px rgba(0,0,0,.45) }
    .qft_toast.ok{ border-color:rgba(70,220,130,.5) } .qft_toast.warn{ border-color:rgba(255,200,80,.5) } .qft_toast.err{ border-color:rgba(255,90,90,.5) }
    
    /* мини-поповеры */
    .adminPop, .profilePop{
      position:absolute; width: min(62vw, 360px);
      border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98);
      border-radius:12px; padding:10px; z-index:3200; box-shadow:0 10px 30px rgba(0,0,0,.45)
    }
    .profileList{ max-height:260px; overflow:auto; padding:4px; border:1px solid rgba(255,255,255,.08); border-radius:10px; background:rgba(255,255,255,.03) }

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
  transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;
  will-change: transform;
}
@media (hover:hover) {
  .hoverPop:hover {
    transform: translateY(-2px) scale(1.04);
    filter: saturate(1.15);
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
  position:absolute; right:-6px; top:-6px;
  font-size:12px; line-height:1;
  background:rgba(15,25,45,.9); border:1px solid rgba(140,170,255,.35);
  border-radius:8px; padding:2px 4px;
  box-shadow:0 0 10px rgba(90,120,255,.25);
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
  font-size:1.6em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight:800; padding:.20em .96em; border-radius:.36em;
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
  line-break: anywhere !important;     /* для очень длинных слитков */
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
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
  max-width: 100% !important;
}
.topicDesc, .topicDesc * {
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
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
.audioCard.preview{ max-width:min(90%, 520px); }

.audioIcon{
  width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center;
  color:#9fb7ff; opacity:.95;
}
.audioCard audio{ display:block; width:100%; color-scheme:dark; }
/* убираем серую плашку у Chromium */
.audioCard audio::-webkit-media-controls-panel{ background:transparent !important; }
.audioCard audio::-webkit-media-controls-enclosure{ background:transparent !important; }
.audioCard audio::-webkit-media-controls{ background:transparent !important; }

.audioRemove{
  position:absolute; top:6px; right:6px;
  width:18px; height:18px; border-radius:50%;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:12px; line-height:1;
  background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.12);
}
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
  gap: 8px;                     /* вертикальный зазор между строками */
}
.qcoinTop{
  display: inline-flex;
  align-items: center;
  gap: 22px;                     /* расстояние между Q COIN и ×2 */
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

/* движущийся «солнечный зайчик» */
.qshine::after{
  content:"";
  position:absolute; inset:-30%; pointer-events:none; border-radius:inherit;
  background:
    linear-gradient(115deg,
      rgba(255,255,255,0) 0%,
      rgba(255,240,200,.06) 35%,
      rgba(255,220,140,.17) 50%,
      rgba(255,240,200,.06) 65%,
      rgba(255,255,255,0) 100%);
  transform: translateX(-60%) rotate(8deg);
  mix-blend-mode: screen;
  filter: blur(.4px);
  animation: qshine-sweep 3.8s ease-in-out infinite;
  opacity:.66;
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
];



/* =========================================================
   маленькие поповеры
========================================================= */
function AdminPopover({ anchorRef, open, onClose, t, isActive, onActivated, onDeactivated }) {
  const [pass, setPass] = useState('');
  useEffect(() => { if (open) setPass(''); }, [open]);
  if (!open || !anchorRef?.current) return null;

  const top = anchorRef.current.offsetTop + anchorRef.current.offsetHeight + 8;
  const right = 0;

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
    <div className="adminPop" style={{ top, right }}>
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
  const top = (el.offsetTop || 0) + (el.offsetHeight || 0) + 8
  const right = -90
  return (
    <div className="adminPop" style={{ top, right }}>
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
<img
  src="/click/quest.gif"                             // твой файл из public/click/quest.gif
  alt=""                                             // без подписи; озвучку даём через aria-label
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
  className={`questIconPure ${questBtnClass}`}       // оставляем твой класс для расположения на странице
  style={{
    // Настрой размеры прямо тут:
    ['--quest-w']: '72px',   // можно '96px' | '3rem' | 'auto'
    ['--quest-h']: 'auto',
    ['--quest-cursor']: questEnabled ? 'pointer' : 'default',
    ['--quest-y']: '-14px',
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
return (
  <div className="qcoinRow qcoinCol">
    <div className="qcoinTop">
      <span className="qcoinLabel">Q COIN</span>
<span
  className={cls('qcoinX2', vipActive ? 'vip' : 'needVip', 'hoverPop')}
  role="button"
  tabIndex={0}
  aria-label="x2 VIP"
  title={vipActive ? (t('forum_qcoin_x2_active') || '×2 за VIP — активно') 
                   : (t('forum_qcoin_x2_get')    || 'Купить VIP+ чтобы получить ×2')}
  onClick={() => { try { window.dispatchEvent(new Event('vip:open')) } catch {} }}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
  suppressHydrationWarning
>×2</span>
    </div>

    <span
      ref={anchorRef}
      className={clsVal}
      onClick={() => { try{ window.dispatchEvent(new Event('qcoin:open')) }catch{}; try{ q.open?.() }catch{} }}
      style={{ cursor:'pointer' }}
      title={t('forum_qcoin_open_hint') || 'Открыть Q COIN'}
      suppressHydrationWarning
    >
      {Number((q.balanceDisplay ?? q.balance ?? 0)).toFixed(10)}
    </span>
  </div>
);

}


/** мини-поповер профиля рядом с аватаром */
function ProfilePopover({ anchorRef, open, onClose, t, auth, vipActive, onSaved }) {
  const uid = auth.asherId || auth.accountId || ''
  const readLocal = () => { try { return JSON.parse(localStorage.getItem('profile:' + uid) || 'null') } catch { return null } }
  const [nick, setNick] = useState(readLocal()?.nickname || '')
  const [icon, setIcon] = useState(readLocal()?.icon || ICONS[0])
    // валидация ника
  const [nickFree, setNickFree] = useState(null)   // null|true|false
  const [nickBusy, setNickBusy] = useState(false)  // идет проверка
  const [busy, setBusy] = useState(false)          // сохранение
  useEffect(() => { if (open) { const l = readLocal(); setNick(l?.nickname || ''); setIcon(l?.icon || ICONS[0]) } }, [open]) // eslint-disable-line
    // дебаунс-проверка ника в базе
  useEffect(() => {
    if (!open) return
    const val = String(nick || '').trim()
    if (!val) { setNickFree(null); setNickBusy(false); return }
    setNickBusy(true)
    const h = setTimeout(async () => {
      try {
        const r = await fetch(`/api/profile/check-nick?nick=${encodeURIComponent(val)}&uid=${encodeURIComponent(uid)}`)
        const j = await r.json().catch(() => null)
        setNickFree(!!j?.free)
      } catch { setNickFree(null) }
      finally { setNickBusy(false) }
    }, 300)
    return () => clearTimeout(h)
  }, [open, nick])

  if (!open || !anchorRef?.current) return null
  const top = (anchorRef.current.offsetTop || 0) + (anchorRef.current.offsetHeight || 0) + 8
  const left = (anchorRef.current.offsetLeft || 0)
  const save = async () => {
    const n = String(nick || '').trim()
    if (!n || nickFree === false || busy) return
    setBusy(true)
    try {
      // 1) атомарно записываем ник (бэк вернет 409, если занят)
      const r = await fetch('/api/profile/save-nick', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nick: n,
          accountId: uid,            // ← ПЕРЕДАЁМ UID
          asherId: uid               // ← на всякий случай, если роут читает это поле
        }),      })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) {
        if (j?.error === 'nick_taken') setNickFree(false)
        return
      }
      // 2) локально кешируем ник+иконку (иконку сохраняем по-старому)
      try { localStorage.setItem('profile:' + uid, JSON.stringify({ nickname: j.nick || n, icon })) } catch {}
      onSaved?.({ nickname: j.nick || n, icon })
      onClose?.()
    } finally { setBusy(false) }
  }
  return (
    <div className="profilePop" style={{ top, left }}>
      <div className="text-lg font-bold mb-2">{t('forum_account_settings')}</div>
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
          <div className="meta mb-1">{t('forum_profile_avatar')}</div>
<div className="profileList">
  {/* VIP блок (верхняя строка) */}
  <div className="p-1">
    <div className="emojiTitle">{t('') /* "VIP+ аватары" */}</div>
    <div className="iconWrap">
      {VIP_AVATARS.slice(0,100).map(src => (
        <button
          key={src}
          className={cls('avaMini', icon===src && 'tag', 'hoverPop')}
          onClick={()=>{ setIcon(src) }}
          title={vipActive ? '' : (t('forum_vip_only') || 'Только для VIP+')}
          style={{ position:'relative', width:40, height:40, padding:0 }}
        >
          <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }}/>
        </button>       
      ))}
    </div>
  </div>

  {/* разделитель между VIP и обычными */}
  <div style={{height:1,opacity:.12,background:'currentColor',margin:'6px 4px'}} />

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

function TopicItem({ t, agg, onOpen, isAdmin, onDelete, authId, onOwnerDelete }) {
  const { posts, likes, dislikes, views } = agg || {};
  return (
    <div className="item qshine cursor-pointer" onClick={() => onOpen?.(t)} style={{ position: 'relative' }}>
      <div className="flex flex-col gap-3">
        {/* верх: аватар → ник */}
        {(t.nickname || t.icon) && (
  <div className="topicUserRow">
    <div className="avaMini">
      <AvatarEmoji
        userId={t.userId || t.accountId}
        pIcon={resolveIconForDisplay(t.userId || t.accountId, t.icon)}
      />
    </div>
    <button
      type="button"
      className="nick-badge nick-animate"
      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
      title={t.userId || t.accountId || ''}
      style={{ flex: '0 1 auto', minWidth: 0 }}
    >
      <span className="nick-text">
        {t.nickname || shortId(t.userId || t.accountId || '')}
      </span>
    </button>
  </div>
        )}

        {/* контент: заголовок → описание → время */}
        <div className="min-w-0"> 
          <div
            className="
              topicTitle text-[#eaf4ff]
              !whitespace-normal break-words break-all
              [overflow-wrap:anywhere] [line-break:anywhere]
              max-w-full"
            
          >
            {t.title}
          </div>
 
          {t.description && (
            <div
              className="
                topicDesc text-[#eaf4ff]/75 text-sm
                !whitespace-normal break-words break-all
                [overflow-wrap:anywhere] [line-break:anywhere]
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
          <span className="tag">👁 <HydrateText value={formatCount(views)} /></span>
          <span className="tag">💬 <HydrateText value={formatCount(posts)} /></span>
          <span className="tag">👍 <HydrateText value={formatCount(likes)} /></span>
          <span className="tag">👎 <HydrateText value={formatCount(dislikes)} /></span>
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



function PostCard({
  p,
  parentAuthor,
  onReport, 
  onOpenThread,
  onReact,
  isAdmin,
  onDeletePost,
  onBanUser,
  onUnbanUser,
  isBanned,
  authId,
  markView,
  t, // локализация
}) {
  // сниппет текста родителя (до 40 символов)
  const parentSnippet = (() => {
    const raw = p?.parentText || p?._parentText || '';
    if (!raw) return null;
    const s = String(raw).replace(/\s+/g, ' ').trim();
    return s.length > 40 ? s.slice(0, 40) + '…' : s;
  })();

  // учёт просмотра
  useEffect(() => {
    if (!p?.id || !authId || typeof window === 'undefined') return;
    markView?.(p.id);
  }, [p?.id, authId, markView]);

  const [lightbox, setLightbox] = React.useState({ open:false, src:null, idx:0, list:[] });

  // безопасные числовые поля
  const views    = Number(p?.views ?? 0);
  const replies  = Number(
    p?.replies ?? p?.repliesCount ?? p?.childrenCount ?? p?.answers ?? p?.comments ?? 0
  );
  const likes    = Number(p?.likes ?? 0);
  const dislikes = Number(p?.dislikes ?? 0);

  const IMG_RE = /^(?:\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)|https?:\/\/[^\s]+?\.(?:webp|png|jpe?g|gif))(?:[?#].*)?$/i;
  // видео: blob: (локальный превью) или публичные ссылки /video-*.webm|.mp4 (и любые .mp4)
  const VIDEO_RE =
    /^(?:blob:[^\s]+|https?:\/\/[^\s]+(?:\/video-\d+\.(?:webm|mp4)|\.mp4)(?:[?#].*)?)$/i;

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

  const cleanedText = allLines.filter(s => {
    const t = s.trim();
    return !IMG_RE.test(t) && !VIDEO_RE.test(t) && !isAudioLine(t);
  }).join('\n');

  // ===== OWNER-меню (⋮) — только если владелец поста =====
  const isOwner = !!authId && (String(authId) === String(p?.userId || p?.accountId));
  const ownerEdit = (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('forum:edit', { detail: { postId: p.id, text: p.text } }));
    }
  };
  const ownerDelete = async (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    try {
      await fetch('/api/forum/own', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forum-user-id': String(authId || '') },
        body: JSON.stringify({ action: 'delete_post', postId: String(p.id) }),
      });
      // тут специально без локального удаления — снапшот/инкременты подтянут актуал
    } catch {}
  };

  return (
    <article
      className="item qshine"
      onClick={(e) => {
        if (e.target.closest('button,.tag,a,svg')) return;
        onOpenThread?.(p);
      }}
      role="article"
      aria-label="Пост форума"
      style={{ position: 'relative' }}
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
            userId={p.userId || p.accountId}
            pIcon={resolveIconForDisplay(p.userId || p.accountId, p.icon)}
          />
        </div>
        <span className="nick-badge nick-animate">
          <span className="nick-text truncate">
            {p.nickname || shortId((p.userId || p.accountId || ''))}
          </span>
        </span>
        {p.parentId && (
          <span className="tag ml-1" aria-label={t?.('forum_reply_to') || 'Ответ для'}>
            {(t?.('forum_reply_to') || 'ответ для') + ' '}
            {parentAuthor ? '@' + parentAuthor : '…'}
            {parentSnippet && <>: “{parentSnippet}”</>}
          </span>
        )}
      </div>

      {/* тело поста — крупные эмодзи (VIP/MOZI) как картинка, иначе очищенный текст */}
      {(/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/).test(p.text || '') ? (
        <div className="postBody emojiPostWrap">
          <img
            src={(p.text || '').replace(/^\[(VIP_EMOJI|MOZI):(.*?)\]$/, '$2')}
            alt=""
            className={
              (p.text || '').startsWith('[MOZI:')
                ? 'moziEmojiBig emojiPostBig'
                : 'vipEmojiBig emojiPostBig'
            }
          />
        </div>
      ) : (
        cleanedText.trim() && (
          <div
            className="text-[15px] leading-relaxed postBody whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: rich(cleanedText) }}
          />
        )
      )}

      {/* изображения: естественные пропорции, без квадратного кропа */}
      {imgLines.length > 0 && (
        <div className="postImages" style={{display:'grid', gap:8, marginTop:8}}>
          {imgLines.map((src, i) => (
            <figure key={i} className="imgWrap" style={{
              margin:0, padding:8, background:'rgba(10,16,28,.35)',
              border:'1px solid rgba(140,170,255,.25)', borderRadius:10, overflow:'hidden'
            }}
            onClick={(e)=>{ e.stopPropagation(); setLightbox({ open:true, src, idx:i, list:imgLines }); }}>
              <img src={src} alt="" loading="lazy" style={{ display:'block', width:'100%', height:'auto', objectFit:'contain', borderRadius:6 }}/>
            </figure>
          ))}
        </div>
      )}

      {/* видео: отдельные карточки с <video controls> */}
      {videoLines.length > 0 && (
        <div className="postVideo" style={{display:'grid', gap:8, marginTop:8}}>
          {videoLines.map((src, i) => (
            <div key={`v${i}`} className="videoCard" style={{
              margin:0, padding:8, background:'rgba(10,16,28,.35)',
              border:'1px solid rgba(140,170,255,.25)', borderRadius:10, overflow:'hidden'
            }}>
              <video
                src={src}
                controls
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  const w = v.videoWidth || 0;
                  const h = v.videoHeight || 0;
                  if (w && h) {
                    // даём карточке правильную высоту по реальному соотношению сторон
                    v.style.aspectRatio = `${w} / ${h}`;
                  }
                  v.style.height = 'auto';
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',           // вместо maxHeight
                  objectFit: 'contain',     // без кропа; если нужен кроп — поменяй на 'cover'
                  borderRadius: 6,
                  background: '#000'
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* аудио: «невидимая» ссылка → карточка с плеером */}
      {audioLines.length > 0 && (
        <div className="postAudio" style={{display:'grid', gap:8, marginTop:8}}>
          {audioLines.map((src, i) => (
            <div key={i} className="audioCard">
              <div className="audioIcon" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3Z" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <audio src={src} controls preload="metadata" />
            </div>
          ))}
        </div>
      )}

      {/* время создания — ниже контента */}
      <div className="meta mt-2" suppressHydrationWarning>
        <HydrateText value={human(p.ts)} />
      </div>

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
          👁 <HydrateText value={views} />
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
          👍 <HydrateText value={likes} />
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
    </article>
  );
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
function LivePreview({ streamRef }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    const s  = streamRef?.current;
    if (!el || !s) return;
    if (el.srcObject !== s) el.srcObject = s;
    el.muted = true; el.playsInline = true;
    el.play?.();
  }, [streamRef?.current]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12, background:'#000' }}
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
      } catch {}
    })();
  }, [open, st, streamRef]);
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

  // Torch / Flip
  const [torchOn, setTorchOn] = React.useState(false);
  const [facing, setFacing]   = React.useState('user');

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

  const flipCamera = async () => {
    try {
      const next = facing === 'user' ? 'environment' : 'user';
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: next } },
        audio: true,
      });
      try { streamRef?.current?.getTracks?.().forEach(tr => tr.stop()); } catch {}
      streamRef.current = ms;
      setFacing(next);
      setTimeout(calcAspectFromTrack, 0);
    } catch {}
  };

  const fmtTime = (sec) => {
    const m = Math.floor((sec||0) / 60);
    const s = String((sec||0) % 60).padStart(2,'0');
    return `${m}:${s}`;
  };

  if (!open) return null;

  // перехват кликов/скролла фоном (оверлей подложка)
  const stopAll = (e) => { e.preventDefault(); e.stopPropagation(); };

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
            <LivePreview streamRef={streamRef} />
          ) : (
            <video
              ref={previewVidRef}
              src={previewUrl || ''}
              controls
              playsInline
              onLoadedMetadata={onMeta}
              style={{ width:'100%', height:'100%', objectFit:'cover', background:'#000' }}
            />
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
          >
            <svg viewBox="0 0 24 24" className="ico">
              <path d="M9 7l-2-2H5a3 3 0 00-3 3v3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M15 17l2 2h2a3 3 0 003-3v-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
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
      onClick={pressComposerSend}
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
 .voCornerBL{ position:absolute; left: var(--vo-pad-x); display:flex; gap:10px; }

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


/* =========================================================
   Основной компонент
========================================================= */
export default function Forum(){
  const { t } = useI18n()
  const toast = useToast()
  const rl = useMemo(rateLimiter, [])
  /* ---- auth ---- */
  const [auth,setAuth] = useState(()=>readAuth())
  useEffect(()=>{
    const upd=()=>setAuth(readAuth())
    if(!isBrowser()) return
    window.addEventListener('auth:ok',upd)
    window.addEventListener('auth:success',upd)
    const id=setInterval(upd,3000)
    return ()=>{ window.removeEventListener('auth:ok',upd); window.removeEventListener('auth:success',upd); clearInterval(id) }
  },[])
    useEffect(() => {
    const stop = initForumAutosnapshot({
      intervalMs: 60000,   // ⬅️ можно 30000 (30 сек) если хочешь чаще
      debounceMs: 2000     // ⬅️ чтобы не спамить при частом скролле
    });
    return stop; // снимем слушатели при размонтировании
  }, []);
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
  const open = ()=> setQcoinModalOpen(true)
  window.addEventListener('qcoin:open', open)
  return ()=> window.removeEventListener('qcoin:open', open)
},[])


// VIP: открывать VipPopover по событию из бейджа ×2
React.useEffect(()=>{
  const openVip = () => setVipOpen(true)
  window.addEventListener('vip:open', openVip)
  return () => window.removeEventListener('vip:open', openVip)
},[])
  // === Режим редактирования поста (owner) ===
  const [editPostId, setEditPostId] = React.useState(null);
  React.useEffect(() => {
    const onEdit = (e) => {
      try {
        const d = e?.detail || {};
        if (d?.postId && typeof d?.text === 'string') {
          setEditPostId(String(d.postId));
          try { setText(String(d.text)); } catch {}
          try { document.getElementById('forum-composer')?.scrollIntoView({ behavior:'smooth', block:'center' }); } catch {}
          try { toast?.ok?.(t?.('forum_edit_mode') || 'Режим редактирования'); } catch {}

        }
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('forum:edit', onEdit);
      return () => window.removeEventListener('forum:edit', onEdit);
    }
  }, []);
/* ---- локальный снап и очередь ---- */
const [data,setData] = useState(()=>{
  if(!isBrowser()) return { topics:[], posts:[], bans:[], admins:[], rev:null }
  try{
    return JSON.parse(localStorage.getItem('forum:snap')||'null') || { topics:[], posts:[], bans:[], admins:[], rev:null }
  }catch{
    return { topics:[], posts:[], bans:[], admins:[], rev:null }
  }
})
const persist = (patch) => setData(prev => {
  const next = typeof patch==='function' ? patch(prev) : ({ ...prev, ...patch })
  try{ localStorage.setItem('forum:snap', JSON.stringify(next)) }catch{}
  return next
})
const withdrawBtnRef = useRef(null);

const [qcoinModalOpen, setQcoinModalOpen] = useState(false);

const clientId = useMemo(()=>ensureClientId(),[])

const [queue,setQueue] = useState(()=>{
  if(!isBrowser()) return []
  try{ return JSON.parse(localStorage.getItem('forum:queue')||'[]') }catch{ return [] }
})
const saveQueue = q => { setQueue(q); try{ localStorage.setItem('forum:queue', JSON.stringify(q)) }catch{} }
const pushOp = (type, payload) => {
  const cur = Array.isArray(queueRef.current) ? queueRef.current : [];
  const op  = { type, payload, opId: `${Date.now()}_${Math.random().toString(36).slice(2)}` };
  const next = [...cur, op];
  saveQueue(next);
}// всегда иметь «свежие» значения внутри async-кода (без устаревших замыканий)
const queueRef = useRef(queue);  useEffect(()=>{ queueRef.current = queue }, [queue])
const authRef  = useRef(auth);   useEffect(()=>{ authRef.current  = auth  }, [auth])
const busyRef=useRef(false), debRef=useRef(null)
const sendBatch = (immediate = false) => {
  if (busyRef.current) return;

  const run = async () => {
    // 1) берём честный снапшот очереди (не из устаревшего state)
    let snapshot = Array.isArray(queueRef.current) ? queueRef.current.slice() : [];
    // fallback: иногда setState ещё не применился — подстрахуемся локалстораджем
    if (!snapshot.length) {
      try { snapshot = JSON.parse(localStorage.getItem('forum:queue')||'[]') || [] } catch {}
    }
    if (!snapshot.length) return;

    busyRef.current = true;
    try {
      const userId = authRef.current?.accountId || authRef.current?.asherId || getForumUserId();
      const resp = await api.mutate({ ops: snapshot }, userId);

      if (resp && Array.isArray(resp.applied)) {
        // ✅ Мгновенно вливаем подтверждённые сущности из applied в локальный снапшот
       const applied = resp.applied || [];
        persist(prev => {
          const next = { ...prev };

          for (const it of applied) {
            // создание
            if (it.op === 'create_topic' && it.topic) {
              next.topics = [ ...(next.topics || []), it.topic ];
            }
            if (it.op === 'create_post' && it.post) {
              next.posts  = [ ...(next.posts  || []), it.post  ];
            }

            // удаление (на всякий случай поддержим и это)
            if (it.op === 'delete_topic' && it.id) {
              next.topics = (next.topics || []).filter(t => t.id !== it.id);
            }
            if (it.op === 'delete_post' && it.id) {
              next.posts  = (next.posts  || []).filter(p => p.id !== it.id);
            }

            // бан/разбан (если сервер это возвращает в applied)
            if (it.op === 'ban_user' && it.accountId) {
              const bans = new Set(next.bans || []);
              bans.add(it.accountId);
              next.bans = Array.from(bans);
            }
            if (it.op === 'unban_user' && it.accountId) {
              next.bans = (next.bans || []).filter(b => b !== it.accountId);
            }

            // === Точные просмотры из applied (теперь внутри цикла!) ===
            if (it.op === 'view_topic' && it.topicId != null) {
              const id = String(it.topicId);
              const views = Number(it.views ?? 0);
              if (Number.isFinite(views) && views >= 0) {
                next.topics = (next.topics || []).map(
                  t => String(t.id) === id ? { ...t, views } : t
                );
              }
            }
            if (it.op === 'view_post' && it.postId != null) {
              const id = String(it.postId);
              const views = Number(it.views ?? 0);
              if (Number.isFinite(views) && views >= 0) {
                next.posts = (next.posts || []).map(
                  p => String(p.id) === id ? { ...p, views } : p
                );
              }
            }         
          }
 // жёстко схлопнём tmp по cid, если бэк его вернул
const cids = new Set(
   (applied || [])
     .map(x => x.post?.cid)
     .filter(Boolean)
     .map(String)
 )
 if (cids.size) {
   next.posts = (next.posts || []).filter(p =>
     !(String(p.id).startsWith('tmp_p_') && cids.has(String(p.cid || '')))
   )
 }

          // Схлопываем tmp_* с реальными и убираем дубли по сигнатурам
          return dedupeAll(next);
        });

        // 2) Удаляем из очереди ТОЛЬКО те элементы, которые отправили
        const sentIds = new Set(snapshot.map(x => x.opId));
        const current = Array.isArray(queueRef.current) ? queueRef.current : [];
        const leftover = current.filter(x => !sentIds.has(x.opId));
        saveQueue(leftover);
        // если что-то осталось — мягко дотолкаем следующей итерацией
        if (leftover.length) setTimeout(() => sendBatch(true), 0);

        // опционально: локальный «хук» на ручной рефреш, если вернёшь функцию
        if (typeof refresh === 'function') await refresh();
      } else {
        // неуспех (напр., 400). Чтобы не застревать — выкидываем первую операцию.
        // На практике это часто невалидная react/view по tmp-id.
        saveQueue(snapshot.slice(1));
      }
    } catch (e) {
      console.error('sendBatch', e);
    } finally {
      busyRef.current = false;
    }
  };

  if (immediate) run();
  else {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(run, 650);
  }
};
// публичная «ручка» для планирования pull из любых эффектов
const schedulePullRef = React.useRef((/*delay, force*/) => {});
// === QCOIN: автопинг активности (CLIENT) ===
const activeRef  = React.useRef(false);
const visibleRef = React.useRef(true);

// отмечаем ручную активность в пределах форума
React.useEffect(()=>{
  const mark = ()=> { activeRef.current = true };
  const el = document.querySelector('.forum_root') || document.body;
  ['pointerdown','keydown','wheel','touchstart'].forEach(e => el.addEventListener(e, mark, { passive:true }));
  return ()=> ['pointerdown','keydown','wheel','touchstart'].forEach(e => el.removeEventListener(e, mark));
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
// [PERIODIC-PULL] — периодический пул даже при открытом SSE
React.useEffect(() => {
  const id = setInterval(() => {
    try { schedulePullRef.current(120, false); } catch {}
  }, 2 * 60 * 1000);  // каждые 2 минуты
  return () => clearInterval(id);
}, []);
// [TOUCH-PULL] — любой пользовательский жест внутри форума
React.useEffect(() => {
  const root = document.querySelector('.forum_root') || document.body;
  if (!root) return;
  const kick = () => { try { schedulePullRef.current(80, false); } catch {} };

  ['pointerdown','wheel','touchstart','keydown'].forEach(evt =>
    root.addEventListener(evt, kick, { passive: true })
  );
  return () => {
    ['pointerdown','wheel','touchstart','keydown'].forEach(evt =>
      root.removeEventListener(evt, kick)
    );
  };
}, []);
 
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

  function mergeDelta(prev, delta, cursor){
    const next = { ...prev }
    if(delta.topics){
      const map = new Map(prev.topics.map(x=>[x.id,x]))
      for(const d of delta.topics){ if(d._del) map.delete(d.id); else map.set(d.id, { ...(map.get(d.id)||{}), ...d }) }
      next.topics = Array.from(map.values())
    }
    if(delta.posts){
      const map = new Map(prev.posts.map(x=>[x.id,x]))
      for(const d of delta.posts){ if(d._del) map.delete(d.id); else map.set(d.id, { ...(map.get(d.id)||{}), ...d }) }
      next.posts = Array.from(map.values())
    }
    if(delta.bans)   next.bans   = delta.bans
    if(delta.admins) next.admins = delta.admins
    next.cursor = cursor ?? prev.cursor
    return dedupeAll(next)
  }
// === SILENT SYNC with cache-bust, backoff & hard-consistency ===
useEffect(() => {
  let stop = false;
  let pulling = false;
  let cooldownUntil = 0;         // до какого времени не дёргаем снапшот (бэк-офф)
  let debounceTimer = null;      // дебаунс для pull() после POST
  let bustRef = 0;               // volatile ключ для обхода микрокэша на сервере

  const BASE_INTERVAL = 60000;   // фолбэк-опрос (SSE-first; 60с достаточно) 
  const COOLDOWN_MS   = 60_000;  // пауза при превышении лимита
  const TMP_GRACE_MS  = 10_000;  // сколько держим неподтверждённые tmp_*

  const now = () => Date.now();
  const isOverLimit = (err) => /max requests limit exceeded/i.test(String(err?.message || err || ''));

// безопасное слияние снапшота с локальным состоянием (НЕ теряем данные на частичных снапах)
const safeMerge = (prev, r) => {
  const out = { ...prev };
  const hardReset = r && r.__reset === true;

  // ---- TOPICS ----
  if (Array.isArray(r.topics)) {
    const prevList = prev.topics || [];
    const prevById = new Map(prevList.map((t, i) => [String(t.id), { ...t, __idx: i }]));
    const srvList  = r.topics || [];
    const srvById  = new Map(srvList.map((t) => [String(t.id), t]));
    const srvIds   = new Set(Array.from(srvById.keys()));

    // Накат серверных полей поверх локальных
    for (const [id, srv] of srvById) {
      const base = prevById.get(id) || { __idx: 9e9 };
      prevById.set(id, { ...base, ...srv });
    }

    if (hardReset) {
      // Жёсткая замена: оставляем только то, что пришло с сервера (сохраняя старые индексы)
      out.topics = Array.from(prevById.entries())
        .filter(([id]) => srvIds.has(id))
        .sort((a, b) => a[1].__idx - b[1].__idx)
        .map(([, t]) => { const { __idx, ...rest } = t; return rest; });
    } else {
      // Частичный снап: никого не выкидываем. Обновляем существующих, новые — в конец.
      const used = new Set();
      const merged = [];

      // 1) Сохраняем порядок существующих
      for (const t of prevList) {
        const id = String(t.id);
        if (prevById.has(id)) {
          const v = prevById.get(id);
          const { __idx, ...rest } = v;   // ✅ исправление
          merged.push(rest);              // ✅ исправление
          used.add(id);
        }
      }
      // 2) Добавляем новые, которых не было
      for (const [id, v] of prevById.entries()) {
        if (!used.has(id) && srvIds.has(id)) {
          const { __idx, ...rest } = v;
          merged.push(rest);
        }
      }
      out.topics = merged;
    }
  }

  // ---- POSTS ----
  if (Array.isArray(r.posts)) {
    const prevList   = prev.posts || [];
    const srvList    = r.posts || [];
    const srvMap     = new Map(srvList.map(p => [String(p.id), p]));
    const mergedById = new Map(prevList.map(p => [String(p.id), { ...p }]));

// Накат серверных поверх локальных; ЖЁСТКАЯ КОНСИСТЕНЦИЯ по счётчикам
for (const [id, srv] of srvMap) {
  const loc = mergedById.get(id) || {};
  const likes    = Number(srv.likes    ?? 0);
  const dislikes = Number(srv.dislikes ?? 0);
  const views    = Number(srv.views    ?? 0);
  mergedById.set(id, { ...loc, ...srv, likes, dislikes, views, myReaction: (loc.myReaction ?? srv.myReaction ?? null) });
}

    if (hardReset) {
      // Только при полном ресете чистим отсутствующие; свежим tmp_* даём «льготу»
      const tnow = now();
      for (const [id, p] of Array.from(mergedById.entries())) {
        if (srvMap.has(id)) continue;
        if (String(id).startsWith('tmp_')) {
          const fresh = (tnow - Number(p.ts || tnow)) < TMP_GRACE_MS;
          if (fresh) continue;
        }
        mergedById.delete(id);
      }
    }
    // Иначе (частичный снап) — никого не удаляем: ждём, пока сервер пришлёт недостающие порции

    // Порядок: сохраняем старые позиции, новые серверные — в конец
    const used = new Set();
    const mergedList = [];
    for (const p of prevList) {
      const id = String(p.id);
      if (mergedById.has(id)) {
        mergedList.push(mergedById.get(id));
        used.add(id);
      }
    }
    for (const [id, p] of mergedById.entries()) {
      if (!used.has(id)) mergedList.push(p);
    }
    out.posts = mergedList;
  }

  if (Array.isArray(r.bans))   out.bans   = r.bans;
  if (Array.isArray(r.admins)) out.admins = r.admins;
  if (r.rev    !== undefined)  out.rev    = r.rev;
  if (r.cursor !== undefined)  out.cursor = r.cursor;

  // Схлопываем tmp_* и реальные дубли по сигнатурам/ID
  return dedupeAll(out);
};



  // один запрос снапшота; force=true — игнорируем cooldown (для подтверждения мутаций)
  const pull = async (force = false) => {
    if (pulling) return;
    if (!force && now() < cooldownUntil) return;

    pulling = true;
    try {
      // важно: прокидываем bustRef для обхода серверного микрокэша
      const r = await api.snapshot({ b: bustRef });
      if (r?.ok) persist(prev => safeMerge(prev, r));
    } catch (e) {
      if (isOverLimit(e)) {
        cooldownUntil = now() + COOLDOWN_MS;
        try { toast?.warn?.('Backend cooldown: Redis limit reached'); } catch {}
      } else {
        console.error('snapshot error:', e);
      }
    } finally {
      pulling = false;
    }
  };

  const schedulePull = (delay = 180, force = false) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { debounceTimer = null; pull(force); }, delay);
  };
   schedulePullRef.current = schedulePull;
  // основной цикл
  (async function loop(){
    schedulePull(80);
    while (!stop) {
    // Фолбэк: если SSE не подключён/не в readyState=1 — дёрнем pull()
    await new Promise(r => setTimeout(r, BASE_INTERVAL));
    try {
      const ok = typeof window !== 'undefined'
        && window.__forumSSE
        && Number(window.__forumSSE.readyState) === 1;   // 1 = OPEN
      if (!ok) await pull(false);
    } catch {}
    }
  })();

  // "пинки" по событиям среды
  const kick = () => schedulePull(80, false);
  window.addEventListener('focus', kick);
  window.addEventListener('online', kick);
  document.addEventListener('visibilitychange', kick);

  // перехват ЛЮБОГО POST на /api/forum/*: ставим bust и делаем форс-пул
  const _fetch = window.fetch;
  window.fetch = async (...args) => {
    const res = await _fetch(...args);
    try {
      const req    = args[0];
      const url    = typeof req === 'string' ? req : req?.url;
      const method = (typeof req === 'string' ? (args[1]?.method || 'GET') : (req.method || 'GET')).toUpperCase();
      if (method !== 'GET' && /\/api\/forum\//.test(String(url || ''))) {
        bustRef = Date.now();         // новый ключ кэша
        schedulePullRef.current(120, true);      // быстрый форс-пул для подтверждения мутации
      }
    } catch {}
    return res;
  };

  // кросс-вкладочный “пинок” (опционально, но полезно)
  let bc = null;
  try {
    bc = new BroadcastChannel('forum-sync');
    bc.onmessage = (ev) => { if (ev?.data === 'bump') schedulePull(120, true); };
  } catch {}

  return () => {
    stop = true;
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    window.removeEventListener('focus', kick);
    window.removeEventListener('online', kick);
    document.removeEventListener('visibilitychange', kick);
    window.fetch = _fetch;
    schedulePullRef.current = () => {}; // обнуляем ручку
    try { bc && bc.close(); } catch {}
  };
}, []);


// локальный shim: принудительное обновление страницы/данных
const router = useRouter();
const sseAliveRef = useRef(false)
const didManualKickRef = useRef(false)
const refresh = React.useCallback(() => {
  try { router.refresh?.(); } catch {}
}, [router]);

React.useEffect(() => {
  if (typeof window === 'undefined') return;

  // защитимся от двойного подключения в React StrictMode
  if (window.__forumSSE) { try { window.__forumSSE.close(); } catch {} }
  const es = new EventSource('/api/forum/events/stream', { withCredentials: false });
  window.__forumSSE = es;

  // === антидребезг + ограничение частоты ===
  const lastRefreshAtRef = { current: 0 };
  let debTimer = null;

  // базовая задержка и доп. задержки для «тяжёлых» событий
  const REFRESH_BASE_DELAY = 350; // было 160 → стало 350 мс
  const EXTRA_DELAY_BY_TYPE = {
    post_created: 250,
    topic_created: 250,
    post_deleted: 150,
    topic_deleted: 150,
    react: 0,
    view_post: 0,
    view_topic: 0,
    ban: 0,
    unban: 0,
    'profile.avatar': 0,
  };
  const MIN_INTERVAL_MS = 600; // не чаще, чем раз в 600 мс

  const scheduleRefresh = (evtType) => {
    const extra = EXTRA_DELAY_BY_TYPE[evtType] || 0;
    const delay = REFRESH_BASE_DELAY + extra;

    clearTimeout(debTimer);
    debTimer = setTimeout(() => {
      const now = Date.now();
      if (now - (lastRefreshAtRef.current || 0) < MIN_INTERVAL_MS) {
        // если слишком часто — докидаем паузу до MIN_INTERVAL_MS
        const leftover = MIN_INTERVAL_MS - (now - (lastRefreshAtRef.current || 0));
        setTimeout(() => {
          lastRefreshAtRef.current = Date.now();
          refresh?.();
        }, Math.max(60, leftover));
      } else {
        lastRefreshAtRef.current = now;
        refresh?.();
      }
    }, delay);
  };

es.onmessage = (e) => { 
  sseAliveRef.current = true 
  if (!e?.data) return; 
  if (e.data.startsWith(':')) return; 
 try { const evt = JSON.parse(e.data); 
  if (!evt?.type) return; 
    // --- [PROFILE AVATAR LIVE SYNC] ---
    // Если пришло событие обновления аватара — кладём в локальный профиль и мягко перерисовываем UI.
    if (evt.type === 'profile.avatar' && evt.accountId) {
      try {
        const key = 'profile:' + String(evt.accountId);
        const cur = JSON.parse(localStorage.getItem(key) || '{}');
        const next = { ...cur };
        // Поддерживаем возможные имена поля
        if (evt.icon)    next.icon = evt.icon;
        if (evt.avatar)  next.icon = evt.avatar;   // если бек шлёт "avatar" вместо "icon"
        if (evt.vipIcon) next.vipIcon = evt.vipIcon;

        localStorage.setItem(key, JSON.stringify(next));
      } catch { /* no-op */ }

      // Лёгкий рефреш компонентов, которые читают профиль
      scheduleRefresh('profile.avatar');
      return; // дальше ничего не делаем — снапшоты/ревизии не нужны для этого события
    }

    // --- [EVENTS REQUIRING SOFT REFRESH] ---
 const needRefresh = new Set(['topic_created','topic_deleted','post_created','post_deleted','react','view_post','view_topic','ban','unban']);
    if (needRefresh.has(evt.type)) {
       // игнорим «локальные» или временные id
  if (evt.local === true) return;
  if (String(evt.postId || '').startsWith('tmp_')) return;
  if (String(evt.topicId || '').startsWith('tmp_')) return; 
      scheduleRefresh(evt.type);
      return;
    }

    // ...ниже остаётся твоя существующая логика, если она есть (rev/snapshot и т.п.)


    // Тянем снапшот ТОЛЬКО если ревизия реально выросла
    const curRev = (() => {
      try { return (JSON.parse(localStorage.getItem('forum:snap') || '{}').rev) || 0; }
      catch { return 0; }
    })();
    const nextRev = Number(evt?.rev || 0);
    if (nextRev > curRev) {
      // Один запрос снапшота через готовый pull() → persist(safeMerge)
      // Немного подождём, чтобы схлопнуть серии событий
      schedulePullRef.current(120, true);
    }
   } catch {}
 };


let fallbackTimer = null;
es.onerror = () => { /* оставляем молча; fallback подтянет снапшот */ }

es.onopen = () => {
  // как только SSE поднялся — вырубаем fallback
  if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; }
};

return () => {
  try { es.close(); } catch {}
  if (window.__forumSSE === es) window.__forumSSE = null;
  if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; }
  clearTimeout(debTimer);
};
}, [refresh]);

  // Fallback: если SSE молчит — на первый gesture принудительно тянем снапшот
  useEffect(() => {
    if (typeof window === 'undefined') return
    function kickOnce() {
      if (didManualKickRef.current || sseAliveRef.current) return
      didManualKickRef.current = true
      // принудительно подтягиваем свежий снапшот и обновляем
      fetch('/api/forum/snapshot?kick=1', { cache: 'no-store' })
        .catch(() => null)
        .finally(() => router.refresh())
    }
    window.addEventListener('pointerdown', kickOnce, { once: true, capture: true })
    window.addEventListener('keydown',     kickOnce, { once: true, capture: true })
    return () => {
      try { window.removeEventListener('pointerdown', kickOnce, { capture: true }) } catch {}
      try { window.removeEventListener('keydown',     kickOnce, { capture: true }) } catch {}
    }
  }, [router])

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
    persist(prev => ({
      ...prev,
      topics: prev.topics.filter(x => x.id !== t.id),
      posts:  prev.posts.filter(p => p.topicId !== t.id),
    }))
    toast.ok('Topic removed')
    forumBroadcast({ type: 'post_deleted' }); // без id — просто триггерим перечитку

    if (typeof refresh === 'function') await refresh()   // ← добавили
  } else {
    console.error('adminDeleteTopic error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }
}


const delPost = async (p) => {
  if (!isAdmin) return
  const r = await api.adminDeletePost(p.id)
  if (r?.ok) {
    persist(prev => {
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

    if (typeof refresh === 'function') await refresh()   // ← добавили
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
    persist(prev => {
      const bans = new Set(prev.bans || [])
      bans.add(id)
      return { ...prev, bans: Array.from(bans) }
    })
    toast.ok(t('forum_banned_ok') || 'User banned')
    if (typeof refresh === 'function') await refresh()   // ← добавили
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
    persist(prev => {
      const bans = new Set(prev.bans || [])
      bans.delete(id)
      return { ...prev, bans: Array.from(bans) }
    })
    toast.ok(t('forum_unbanned_ok') || 'User unbanned')
    if (typeof refresh === 'function') await refresh()   // ← добавили
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

  const r = await api.ownerDeleteTopic(topic.id, uid);

  if (r?.ok) {
    persist(prev => {
      const posts  = (prev.posts  || []).filter(p => String(p.topicId) !== String(topic.id));
      const topics = (prev.topics || []).filter(x => String(x.id) !== String(topic.id));
      return { ...prev, posts, topics };
    });

    // поддержим оба варианта ключа (на случай старого словаря)
    toast.ok(t('forum_delete_ok') || 'Удалено');

    try { if (typeof refresh === 'function') await refresh(); } catch {}
  } else {
    toast.err(t('forum_error_delete') || 'Ошибка удаления');
  }
};


/* ---- выбор темы и построение данных ---- */
const [sel, setSel] = useState(null);


// [SORT_STATE:AFTER]
const [q, setQ] = useState('');
const [topicFilterId, setTopicFilterId] = useState(null);
const [topicSort, setTopicSort] = useState('top');   // сортировка тем
const [postSort,  setPostSort]  = useState('new');   // сортировка сообщений  ← ДОЛЖНА быть объявлена до flat
const [drop, setDrop] = useState(false);
const [sortOpen, setSortOpen] = useState(false);
// [INBOX:STATE] — безопасно для SSR (никакого localStorage в рендере)
const [inboxOpen, setInboxOpen] = useState(false);
const [mounted, setMounted] = useState(false);           // ← флаг «мы на клиенте»
useEffect(()=>{ setMounted(true) }, []);

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

// при смене темы выходим из веточного режима
useEffect(() => { setThreadRoot(null); }, [sel?.id]);

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

    // Множество забаненных (по userId/accountId)
  const bannedSet = useMemo(() => new Set(data.bans || []), [data.bans])

// ===== ПУНКТ 5: Агрегаты по темам (ЖЁСТКАЯ КОНСИСТЕНЦИЯ) =====
// views берём ТОЛЬКО из server topics; посты дают posts/likes/dislikes
const aggregates = useMemo(() => {
  const byTopic = new Map();

  // 1) Инициализируем views из data.topics
  for (const t of (data.topics || [])) {
    byTopic.set(String(t.id), {
      posts: 0,
      likes: 0,
      dislikes: 0,
      views: Number(t?.views ?? 0),
    });
  }

  // 2) Накидываем агрегацию по постам (без views!)
  for (const p of (data.posts || [])) {
    const tid = String(p.topicId);
    const a = byTopic.get(tid) || { posts: 0, likes: 0, dislikes: 0, views: 0 };
    a.posts    += 1;
    a.likes    += Number(p.likes    || 0);
    a.dislikes += Number(p.dislikes || 0);
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
    return topics.sort((a,b) => (score(b) - score(a)) || ((b.ts||0) - (a.ts||0)));
  }, [data.topics, aggregates, topicSort, topicFilterId]);


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
 const [pendingVideo, setPendingVideo] = useState(null); // blob: URL готового ролика (preview)
const videoCancelRef = useRef(false); // true => onstop не собирает blob (отмена)
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
const startVideo = async () => {
  // Разрешаем старт из idle, preview, live
  const badStates = new Set(['opening', 'recording', 'processing', 'uploading']);
  if (badStates.has(videoState)) return;

  try {
    // Оверлей может быть уже открыт — это ок
    setVideoOpen(true);
    setVideoState('opening');

    // не создаём лишний стрим, если уже есть
    let stream = videoStreamRef.current;
    const hasTracks = !!stream && (stream.getTracks?.().length || 0) > 0;

    if (!hasTracks) {
      try { videoCancelRef.current = false; } catch {}
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: { ideal: 'user' } },
        audio: true,
      });
      videoStreamRef.current = stream;
    }

// iOS Safari предпочитает H.264/AAC (mp4). Падаем на webm только если mp4 не поддержан.
const preferMp4 =
  /iPad|iPhone|iPod/i.test(navigator.userAgent) || /AppleWebKit/i.test(navigator.userAgent);

let mime = '';
if (preferMp4 && MediaRecorder.isTypeSupported?.('video/mp4;codecs=h264')) {
  mime = 'video/mp4;codecs=h264';
} else if (preferMp4 && MediaRecorder.isTypeSupported?.('video/mp4')) {
  mime = 'video/mp4';
} else if (MediaRecorder.isTypeSupported?.('video/webm;codecs=vp9')) {
  mime = 'video/webm;codecs=vp9';
} else if (MediaRecorder.isTypeSupported?.('video/webm;codecs=vp8')) {
  mime = 'video/webm;codecs=vp8';
} else {
  mime = 'video/webm';
}

    const mr = new MediaRecorder(stream, { mimeType: mime });
    videoChunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e?.data?.size) videoChunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      clearInterval(videoTimerRef.current); videoTimerRef.current = null;

      try {
        if (videoCancelRef.current) {
          // отмена — ничего не собираем
          videoChunksRef.current = [];
          setPendingVideo(null);
          setVideoState('idle');
          videoCancelRef.current = false;
          return;
        }

const detectedType =
  mr?.mimeType && mr.mimeType !== '' ? mr.mimeType
  : (videoChunksRef.current?.[0]?.type || '');

const safeType = detectedType || 'video/mp4'; // на iOS это самый безопасный дефолт
const blob = new Blob(videoChunksRef.current, { type: safeType });
const url  = URL.createObjectURL(blob);


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
  try { videoStreamRef.current?.getTracks?.().forEach(tr => tr.stop()); } catch {}
  clearInterval(videoTimerRef.current); videoTimerRef.current = null;
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
  videoRecRef.current = null; videoStreamRef.current = null;

  if (pendingVideo && /^blob:/.test(pendingVideo)) {
    try { URL.revokeObjectURL(pendingVideo) } catch {}
  }

  setPendingVideo(null);
  setVideoOpen(false);
  setVideoState('idle');
  setVideoElapsed(0);
};


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
    const uid = r.asherId || r.accountId || ''
    const prof = (()=>{ if(!isBrowser()) return {}; try{ return JSON.parse(localStorage.getItem('profile:'+uid)||'{}') }catch{return{}} })()

    // лимиты по ТЗ
    const safeTitle = String(title||'')
    const safeDesc  = String(description||'').slice(0,40)
    const safeFirst = String(first||'').slice(0,180)

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
      userId: uid, nickname: prof.nickname || shortId(uid),
      icon: prof.icon || '👤', isAdmin: isAdm, views: 0
    }
    const p0 = {
     id: tmpP, cid: tmpP, topicId: tmpT, parentId: null, text: safeFirst, ts: Date.now(),
      userId: uid, nickname: t0.nickname, icon: t0.icon, isAdmin: isAdm,
      likes: 0, dislikes: 0, views: 0, myReaction: null
    }

// оптимистично кладём в локальный снап
persist(prev => dedupeAll({ ...prev, topics:[t0, ...prev.topics], posts:[...prev.posts, p0] }))
setSel(t0)
toast.ok(t('forum_create_ok') ||'Тема создана')

   
    // 1) создаём тему на бэке
    const createTopicResp = await api.mutate({
      ops:[{ type:'create_topic', payload:{ title: safeTitle, description: safeDesc, nickname: t0.nickname, icon: t0.icon } }]
    }, uid)

    const realTopicId = createTopicResp?.applied?.find(x=>x.op==='create_topic')?.topic?.id
    if (!realTopicId) { if (typeof refresh === 'function') await refresh();
      return }

    // ремап tmp -> real локально
    persist(prev=>{
      const topics = prev.topics.map(x => x.id===tmpT ? { ...x, id:String(realTopicId) } : x)
      const posts  = prev.posts.map(x => x.topicId===tmpT ? { ...x, topicId:String(realTopicId) } : x)
      return dedupeAll({ ...prev, topics, posts })
    })

    // 2) создаём первый пост (отдельной операцией, уже с реальным topicId)
    await api.mutate({
      ops:[{ type:'create_post', payload:{ topicId:String(realTopicId), text:safeFirst, nickname:t0.nickname, icon:t0.icon, parentId:null, cid: tmpP } }]
    }, uid)
  // жёсткая очистка и подтягиваем свежий снапшот
  try { setText(''); } catch {}
  try { setPendingImgs([]); } catch {}
  try { setPendingAudio(null); } catch {}
  try { resetVideo(); } catch {}
  try { setReplyTo(null); } catch {}
    // подтянуть свежий снапшот
  if (typeof refresh === 'function') await refresh()
   postingRef.current = false; 
   return true;
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
      const r = await api.ownerEditPost(editPostId, safeText, uid);
      if (r?.ok) {
        // локально подменим текст
        persist(prev => ({
          ...prev,
          posts: (prev.posts || []).map(p => String(p.id) === String(editPostId) ? { ...p, text: safeText } : p)
        }));
        setEditPostId(null);
        try { setText(''); } catch {}
        try { toast?.ok?.('Изменено'); } catch {}
        try { if (typeof refresh === 'function') await refresh(); } catch {}
      } else {
        try { toast?.err?.(r?.error || 'Ошибка редактирования'); } catch {}
      }
    } finally {
      _done();
    }
    return;
  }

  // === Обычный режим: создание поста ===
  const _fail = (msg) => {
    if (msg) { try { toast?.warn?.(msg) } catch {} }
    postingRef.current = false;
   return false;  
  };

  if (!rl.allowAction()) return _fail(t('forum_too_fast') || 'Слишком часто');

  // 0) видео: blob -> https
  let videoUrlToSend = '';
  if (pendingVideo) {
    try {
      if (/^blob:/.test(pendingVideo)) {
        const resp = await fetch(pendingVideo);
 const blob = await resp.blob();
 const fd = new FormData();
 const mime = String(blob.type || '').toLowerCase();      // e.g. 'video/mp4' | 'video/webm' | 'video/quicktime'
 let ext = 'webm';
 if (mime.includes('mp4')) ext = 'mp4';
 else if (mime.includes('quicktime')) ext = 'mp4';        // iOS Safari часто так
 fd.append('file', blob, `video-${Date.now()}.${ext}`);
        const up = await fetch('/api/forum/uploadVideo', { method:'POST', body: fd, cache:'no-store' });
        const uj = await up.json().catch(()=>null);
        videoUrlToSend = (uj && Array.isArray(uj.urls) && uj.urls[0]) ? uj.urls[0] : '';
      } else {
        videoUrlToSend = pendingVideo;
      }
    } catch { videoUrlToSend = ''; }
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
  ).slice(0,180);

  const body = [plain, ...pendingImgs,
    ...(audioUrlToSend ? [audioUrlToSend] : []),
    ...(videoUrlToSend ? [videoUrlToSend] : []),
  ].filter(Boolean).join('\n');

  if (!body || !sel?.id) return _fail();

  // 2) auth
  const r = await requireAuthStrict(); 
  if (!r) return _fail();
  const uid  = r.asherId || r.accountId || '';
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
  const prof = (() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('profile:' + uid) || '{}'); }
    catch { return {}; }
  })();

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
    nickname: prof.nickname || shortId(uid),
    icon: prof.icon || '👤',
    isAdmin: isAdm,
    likes: 0, dislikes: 0, views: 0,
    myReaction: null,
  };
 
  persist(prev => {
    const next = { ...prev, posts: [ ...(prev.posts || []), p ] };
    if (isReply && Array.isArray(prev.posts)) {
      const pid = String(parentId);
      next.posts = next.posts.map(x => {
        if (String(x.id) !== pid) return x;
        const replies = Number(x.replies ?? x.repliesCount ?? 0) + 1;
        return { ...x, replies, repliesCount: replies };
      });
    }
    return dedupeAll(next);
  });
 
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
    cid:  tmpId 
  });
  sendBatch(true);
  setComposerActive(false);
  emitCreated(p.id, sel.id);

  // мягкий догон
  setTimeout(() => { try { if (typeof refresh === 'function') refresh(); } catch {} }, 200);

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
  // kind: 'like' | 'dislike'
  if (!post?.id) return;
  const uid = (auth?.asherId || auth?.accountId || (typeof getForumUserId==='function' ? getForumUserId() : 'web'));

  const current = post.myReaction || null;        // что стоит у пользователя сейчас
  const ops = [];

  if (current === kind) {
    // повторный клик по тому же — снимаем реакцию
    ops.push({ type: 'react', payload: { postId: String(post.id), kind, delta: -1 } });
  } else {
    // если стояло другое — сначала снимаем предыдущее
    if (current === 'like')     ops.push({ type: 'react', payload: { postId: String(post.id), kind: 'like',     delta: -1 } });
    if (current === 'dislike')  ops.push({ type: 'react', payload: { postId: String(post.id), kind: 'dislike',  delta: -1 } });
    // затем ставим новое
    ops.push({ type: 'react', payload: { postId: String(post.id), kind, delta: +1 } });
  }

  // --- оптимистическое обновление локального снапа ---
  persist(prev => {
    const posts = (prev.posts || []).map(p => {
      if (p.id !== post.id) return p;
      let likes    = Number(p.likes    ?? 0);
      let dislikes = Number(p.dislikes ?? 0);
      let myReaction = p.myReaction || null;

      if (current === kind) {
        // снимаем
        if (kind === 'like')    likes    = Math.max(0, likes - 1);
        if (kind === 'dislike') dislikes = Math.max(0, dislikes - 1);
        myReaction = null;
      } else {
        // переключение
        if (current === 'like')    likes    = Math.max(0, likes - 1);
        if (current === 'dislike') dislikes = Math.max(0, dislikes - 1);
        if (kind === 'like')       likes    = likes + 1;
        if (kind === 'dislike')    dislikes = dislikes + 1;
        myReaction = kind;
      }
      return { ...p, likes, dislikes, myReaction };
    });
    return { ...prev, posts };
  });

// --- батч на сервер ---
try {
  const r = await api.mutate({ ops }, uid);

  // Барьер по rev: берём последний rev из применённых операций
  const lastRev = Number(
    (r?.applied || [])
      .map(x => x?.rev)
      .filter(v => Number.isFinite(v))
      .pop() || 0
  );

  // Мгновенно прогреваем снапшот с обходом микрокэша:
  // передаём уникальный bust (b=Date.now()) и hint по ревизии
  try {
    await api.snapshot({ b: Date.now(), rev: lastRev || undefined });
  } catch {}

  // После прогрева снапшота — мягкий UI-рефреш
  if (typeof refresh === 'function') await refresh();
} catch (e) {
  console.warn('react mutate failed', e);
}

}, [auth, persist]);


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
  // без оптимизма — только отправка на бэк
  pushOp('view_post', { postId: String(postId) })
  sendBatch(true)
}

}
 // keep refs in sync so effects can call them safely
useEffect(() => { markViewPostRef.current  = markViewPost  }, [markViewPost]);

// Просмотр темы: раз в bucket; только отправка на бэк, БЕЗ локального инкремента
useEffect(() => {
  if (!isBrowser()) return;
  const id = String(sel?.id || '');
  if (!id) return;

  const bucket = getBucket(FORUM_VIEW_TTL_SEC || VIEW_TTL_SEC); // одинаковый TTL, что и для постов
  const key = `topic:${id}:viewed:${bucket}`;

  try {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      pushOp('view_topic', { topicId: id });
      sendBatch(true); // сразу дожимаем батч, чтобы серверный views пришёл быстрее
    }
  } catch {
    // молча игнорируем сбой доступа к LS (Safari private / ITP)
  }
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
const fileRef = React.useRef(null);

const handleAttachClick = React.useCallback((e) => {
  e?.preventDefault?.(); e?.stopPropagation?.();
  if (!vipActive) {
    try { toast?.warn?.(t?.('forum_vip_only') || 'Функция доступна только VIP+'); } catch {}
    return;
  }
  fileRef.current?.click();
}, [vipActive, t]);

const onFilesChosen = React.useCallback(async (e) => {
  try{
    const files = Array.from(e.target?.files || [])
      .filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f.name || ''));

    if (files.length === 0) {
      try { toast?.info?.(t?.('forum_attach_info', { types: 'PNG, JPG, JPEG, WEBP, GIF' }) || 'Можно загружать: PNG, JPG, JPEG, WEBP, GIF'); } catch {}
      return;
    }

    const fd = new FormData();
    for (const f of files) fd.append('files', f, f.name);

    const res = await fetch('/api/forum/upload', { method:'POST', body: fd, cache:'no-store' });
    if (!res.ok) throw new Error('upload_failed');

    const data = await res.json().catch(() => ({ urls: [] }));
    const urls = Array.isArray(data?.urls) ? data.urls : [];

    if (urls.length) {
      // подставляем относительные пути в композер (по одному в строке)
      setPendingImgs(prev => [...prev, ...urls]);
      try { toast?.success?.(t?.('forum_files_uploaded') || 'Файлы загружены'); } catch {}
    }
  } catch(err) {
    console.error(err);
    try { toast?.error?.(t?.('forum_files_upload_failed') || 'Ошибка загрузки'); } catch {}
  } finally {
    if (e?.target) e.target.value = '';
  }
}, [t]);


  /* ---- профиль (поповер у аватара) ---- */
  const idShown = auth.asherId || auth.accountId || ''
  const profile = (()=>{ if(!isBrowser()) return null; try{ return JSON.parse(localStorage.getItem('profile:'+idShown)||'null') }catch{return null} })()
  const nickShown = profile?.nickname || (idShown ? shortId(idShown) : null)
  const iconShown = profile?.icon || '👤'
  const copyId = async () => { try{ await navigator.clipboard.writeText(idShown) }catch{} }

  const [profileOpen, setProfileOpen] = useState(false)
  const avatarRef = useRef(null)
// === VIDEO FEED: состояние + хелперы =====================
const [videoFeedOpen, setVideoFeedOpen] = React.useState(false);
const [videoFeed, setVideoFeed] = React.useState([]);

/** URL указывает на видео? — учитываем blob:, vercel-storage и классические расширения */
function isVideoUrl(url) {
  const s = String(url || '').trim();
  if (!s) return false;
  // одиночный токен
  if (!/^\S+$/.test(s)) return false;

  if (/^blob:/.test(s)) return true; // локальный превью

  // обычные расширения
  if (/\.(webm|mp4|mov|m4v|mkv)(?:$|[?#])/i.test(s)) return true;

  // filename=video.ext
  if (/[?&]filename=.*\.(webm|mp4|mov|m4v|mkv)(?:$|[&#])/i.test(s)) return true;

  // публичные vercel-storage / твои пути без расширений
  if (/vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo/i.test(s)) return true;

  return false;
}

/** пост содержит видео? — сканируем поля, вложения и КАЖДУЮ строку текста */
function isVideoPost(p) {
  if (!p) return false;

  // явные поля
  if (p.type === 'video') return true;
  if (p.videoUrl || p.posterUrl) return true;
  if (p.mime && String(p.mime).toLowerCase().startsWith('video/')) return true;
  if (p.media && (p.media.type === 'video' || p.media.videoUrl)) return true;

  // контейнеры вложений
  if (Array.isArray(p.files) && p.files.some(f =>
    f?.type === 'video' ||
    String(f?.mime || '').toLowerCase().startsWith('video/') ||
    isVideoUrl(f?.url)
  )) return true;

  if (Array.isArray(p.attachments) && p.attachments.some(a =>
    a?.type === 'video' ||
    String(a?.mime || '').toLowerCase().startsWith('video/') ||
    a?.videoUrl || isVideoUrl(a?.url)
  )) return true;

  // текст/боди — важно: ссылки идут КАЖДОЙ СВОЕЙ строкой
  const text = String(p.text ?? p.body ?? '').trim();
  if (text) {
    const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (lines.some(isVideoUrl)) return true;
  }

  // html как запасной вариант
  if (typeof p.html === 'string' && /<\s*video[\s>]/i.test(p.html)) return true;

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

  const only = all.filter(isVideoPost)
                  .sort((a,b) => Number(b?.ts || 0) - Number(a?.ts || 0));

  setVideoFeed(only);
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
}, [videoFeedOpen, data?.rev, data?.posts, data?.messages, data?.topics, allPosts]);

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
const readEnv = (k, def='') => {
  try {
    if (questEnv && Object.prototype.hasOwnProperty.call(questEnv, k)) {
      const v = questEnv[k];
      return (v == null ? def : String(v));
    }
    const v = process?.env?.[k];
    return (v == null ? def : String(v));
  } catch { return def }
};

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
  previewUrl={pendingVideo}
  onStart={startVideo}          // ← добавили
  onStop={stopVideo}
  onResetConfirm={resetVideo}
  t={t}
/>





      {/* шапка */}
      <section className="glass neon p-3" style={{ position:'relative', zIndex:40, overflow:'visible' }}>
        <div className="head" style={{ position:'relative', width:'100%' }}>
          <div style={{ position:'relative' }}>
            <button
              ref={avatarRef}
              className={cls('avaBig neon', (!nickShown || iconShown==='👤') && 'pulse')}
              title={nickShown || t('forum_account')}
              onClick={async()=>{
                const a = await requireAuthStrict();
                if (!a) return;
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
              onSaved={()=>{}}
            />
  {/* ник ВСЕГДА под аватаром */}
  <button
    className="nick-badge nick-animate avaNick"
    title={idShown||'—'}
    onClick={copyId}
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
     style={{ '--qcoin-offset':'6px', '--qcoin-y': '-15px', '--qcoin-scale':'1.15' }}  /* ← здесь настраиваешь */
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
                onChange={e=>{ setQ(e.target.value); setDrop(true) }}
                onFocus={()=>setDrop(true)}
                placeholder={t('forum_search_ph') || 'Поиск по темам и сообщениям…'}
              />
              <button className="iconBtn" aria-label="search" onClick={()=>setDrop(v=>!v)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="iconBtn" title={t('forum_sort')||'Сортировка'} onClick={()=>setSortOpen(v=>!v)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
{/* ⬇️ КВЕСТ-ИКОНКА МЕЖДУ СОРТИРОВКОЙ И VIP+ */}
<img
  src="/click/quest.gif"
  alt=""
  role="button"
  aria-label={t('quest_open') || 'Quests'}
  aria-disabled={!QUEST_ENABLED}
  tabIndex={QUEST_ENABLED ? 0 : -1}
  onClick={QUEST_ENABLED ? openQuests : undefined}
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
                            if(tt){ setTopicFilterId(tt.id); setSel(tt); setThreadRoot({ id:p.parentId||p.id }); setTimeout(()=>{ document.getElementById(`post_${p.id}`)?.scrollIntoView?.({behavior:'smooth', block:'center'}) }, 80) }
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
  if (sel) setPostSort(k); else setTopicSort(k);
  setSortOpen(false);
}}

  >
    {txt}
  </button>
))}

                </div>
              )}
            </div>
{/* ---- VIP+ ---- */}
<div className="vipWrap">
  <button
    ref={vipBtnRef}
    className={cls('iconBtn', vipActive ? 'vip' : 'vipGray', 'pulse', 'hoverPop')}
    title={t('forum_vip_plus') || 'VIP+'}
    onClick={() => setVipOpen(v => !v)}
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
          window.open(j.url, '_blank', 'noopener,noreferrer');

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


            {/* админ */}
            <div className="adminWrap">
              <button
                ref={adminBtnRef}
                className={cls('adminBtn', isAdmin ? 'adminOn' : 'adminOff', 'pulse', 'hoverPop')}
                onClick={()=>setAdminOpen(v=>!v)}>
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
            </div>
          </div>
        </div>
      </section>

<div
  className="grid2"
  style={{ display:'flex', flexDirection:'column', gridTemplateColumns: '1fr', flex: '1 1 auto', minHeight: 0 }}
>

  {/* ОДНА КОЛОНКА: если тема не выбрана — список тем; если выбрана — посты темы */}
  {!sel ? (
    /* === СПИСОК ТЕМ === */
    <section className="glass neon" style={{ display:'flex', flexDirection:'column', flex:'1 1 auto', minHeight: 0 }}>
<div className="head">
 {/* ЕДИНАЯ ГОРИЗОНТАЛЬНАЯ ЛИНЕЙКА: ЛЕВО — ЦЕНТР — ПРАВО */}
  <div className="forumRowBar">
    <div className="slot-left">
  {/* Назад (иконка) — в режиме videoFeedOpen закрывает видео-ленту */}
  <button
    type="button"
    className="iconBtn ghost"
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

  {/* Домой (иконка) */}
  <button
    type="button"
    className="iconBtn ghost"
    aria-label={t?.('forum_home') || 'На главную'}
    onClick={()=>{
    if (videoFeedOpen) { try{ closeVideoFeed?.() }catch{} }
    if (questOpen)     { try{ closeQuests?.() }catch{} }
    try{ setInboxOpen(false) }catch{};
    try{ setReplyTo(null) }catch{};
    try{ setThreadRoot(null) }catch{};
    try{ setSel(null) }catch{};
  }}
    title={t?.('forum_home') || 'На главную'}
  >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path d="M3 10l9-7 9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
</div>

    <div className="slot-center">
      <div className="forumTotal">
        {t('forum_total')}: {(data.topics||[]).length}
      </div>
    </div>
    <div className="slot-right">
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
    </div>
  </div>
      </div>
{videoFeedOpen ? (
  <>
{/* ВЕТКА-ЛЕНТА: медиа (видео/аудио/изображения) */}
<div className="meta mt-1">{t('') || ''}</div>
<div className="grid gap-2 mt-2" suppressHydrationWarning>
  {videoFeed.map((p) => {
    const parent = p?.parentId ? (data?.posts || []).find(x => String(x.id) === String(p.parentId)) : null;

    // локальный обработчик: открыть полноценную ветку по посту из ленты
    const openThreadHere = () => {
      try { setInboxOpen?.(false); } catch {}
      const tt = (data?.topics || []).find(x => String(x.id) === String(p?.topicId));
      if (!tt) return;
      try { setSel(tt); } catch {}
      try { setThreadRoot({ id: p?.parentId || p?.id }); } catch {}
      try { setVideoFeedOpen(false); } catch {}
      // мягкий скролл к посту
      setTimeout(() => {
        try { document.getElementById(`post_${p?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
      }, 120);
    };

    return (
      <div key={`vf:${p?.id ?? `${p?.topicId || 't'}:${p?.ts || Math.random()}`}`} id={`post_${p?.id || ''}`}>
        <PostCard
          p={p}
          parentAuthor={parent?.nickname || (parent ? shortId(parent.userId || '') : null)}
          onReport={() => toast.ok(t('forum_report_ok'))}
          onOpenThread={() => openThreadHere()}     
          onReact={reactMut}
          isAdmin={isAdmin}
          onDeletePost={delPost}
          onBanUser={banUser}
          onUnbanUser={unbanUser}
          isBanned={bannedSet.has(p?.accountId || p?.userId)}
          authId={auth.asherId || auth.accountId}
          markView={markViewPost}
          t={t}
        />
      </div>
    );
  })}
  {videoFeed.length === 0 && (
    <div className="meta">{t('forum_search_empty') || 'Ничего не найдено'}</div>
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
      {repliesToMe
        .slice()
        .sort((a,b) => Number(b.ts||0) - Number(a.ts||0))
        .map(p => (
          <div key={`ib:${p.id}`} id={`post_${p.id}`}>
            <PostCard
              p={p}
              parentAuthor={(data.posts||[]).find(x=>String(x.id)===String(p.parentId))?.nickname || ''}
              onReport={() => toast.ok(t('forum_report_ok'))}
              onOpenThread={(clickP) => {
                const tt = (data.topics||[]).find(t => String(t.id)===String(p.topicId));
                if (tt) { setSel(tt); setThreadRoot(clickP); setInboxOpen(false); }
              }}
              onReact={reactMut}
              isAdmin={isAdmin}
              onDeletePost={delPost}
              onBanUser={banUser}
              onUnbanUser={unbanUser}
              isBanned={bannedSet.has(p.accountId || p.userId)}
              authId={auth.asherId || auth.accountId}
              markView={markViewPost}
              t={t}
            />
          </div>
        ))}
      {repliesToMe.length === 0 && (
        <div className="meta">{t('forum_inbox_empty') || 'Новых ответов нет'}</div>
      )}
    </div>
  </>
) : (
  <>
    <CreateTopicCard t={t} onCreate={createTopic} onOpenVideoFeed={openVideoFeed} />
    <div className="grid gap-2 mt-2" suppressHydrationWarning>
      {(sortedTopics || [])
       .slice()
        .sort((a,b) => {
          const at = Number(a?.ts || 0), bt = Number(b?.ts || 0);
          if (bt !== at) return bt - at;
          return String(b?.id || '').localeCompare(String(a?.id || ''));
        })
        .map(x => {
          const agg = aggregates.get(x.id) || { posts:0, likes:0, dislikes:0, views:0 };
          return (
            <TopicItem
              key={`t:${x.id}`}
              t={x}
              agg={agg}
              onOpen={(tt)=>{ setSel(tt); setThreadRoot(null) }}
              isAdmin={isAdmin}
              onDelete={delTopic}
              authId={auth.asherId || auth.accountId}
              onOwnerDelete={delTopicOwn}
            />
          )
        })}
    </div>
  </>
)}

<div
  className="body"
  style={{ flex: '1 1 auto', minHeight: 0, height:'100%', overflowY: 'auto', WebkitOverflowScrolling:'touch' }}
>



</div>

    </section>
  ) : (
    /* === ВЫБРАННАЯ ТЕМА: посты + композер === */
    <section className="glass neon" style={{ display:'flex', flexDirection:'column', flex:'1 1 auto', minHeight: 0 }}>

 
       <div className="head">
  {/* ЕДИНАЯ ГОРИЗОНТАЛЬНАЯ ЛИНЕЙКА: ЛЕВО — ЦЕНТР — ПРАВО */}
  <div className="forumRowBar">
    <div className="slot-left">
  {/* Назад (иконка) */}
  <button
    type="button"
    className="iconBtn ghost"
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

  {/* Домой (иконка) */}
  <button
    type="button"
    className="iconBtn ghost"
    aria-label={t?.('forum_home') || 'На главную'}
    onClick={()=>{ 
      try{ setInboxOpen(false) }catch{};
      try{ setReplyTo(null) }catch{}; 
      try{ setThreadRoot(null) }catch{}; 
      try{ setSel(null) }catch{}; }}
    title={t?.('forum_home') || 'На главную'}
  >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path d="M3 10l9-7 9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
</div>


    <div className="slot-center">
      <div className="forumTotal">
        {/* в режиме темы выводим "Ответы" / заголовок, но всё равно центрируем */}
        {threadRoot ? (t('forum_open_replies') || 'Ответы') : (t('forum_total') + ': ' + (data.topics||[]).length)}
      </div>
    </div>
    <div className="slot-right">
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
    </div>

        </div>

  {/* Заголовок темы оставляем ниже, как был */}
  <div className="title mt-2 whitespace-normal break-words [overflow-wrap:anywhere] [line-break:anywhere] min-w-0" suppressHydrationWarning>
    <span className="whitespace-normal break-words [overflow-wrap:anywhere] [line-break:anywhere]">
      {threadRoot ? (t('forum_open_replies') || 'Ответы') : (sel?.title || '')}
    </span>
  </div>

{/* [INBOX:PANEL] — панель входящих ответов */}
{inboxOpen && (
  <div className="item mt-2">
    <div className="title">{t('forum_inbox_title') || 'Ответы на ваши сообщения'}</div>
    {repliesToMe.length === 0 ? (
      <div className="inboxEmpty">{t('forum_inbox_empty') || 'Пока нет ответов'}</div>
    ) : (
      <div className="inboxList">
        {repliesToMe.map(p => {
          const parent = (data.posts || []).find(x => String(x.id) === String(p.parentId));
          return (
            <div key={`inb:${p.id}`} className="item qshine" onClick={() => {
              // перейти в тему и открыть ветку
              const tt = (data.topics||[]).find(x => String(x.id) === String(p.topicId));
              if (tt) {
                setSel(tt);
                setThreadRoot({ id: p.parentId || p.id });
                // скролл к посту
                setTimeout(() => { try{ document.getElementById(`post_${p.id}`)?.scrollIntoView({behavior:'smooth', block:'center'}) }catch{} }, 120);
              }
            }}>
              {/* мини-«шапка», как в PostCard */}
              <div className="flex items-center gap-2 mb-1">
                <div className="avaMini">
                  <AvatarEmoji userId={p.userId || p.accountId} pIcon={resolveIconForDisplay(p.userId || p.accountId, p.icon)} />
                </div>
                <span className="nick-badge"><span className="nick-text truncate">{p.nickname || shortId(p.userId || p.accountId || '')}</span></span>
                <span className="meta"><HydrateText value={human(p.ts)} /></span>
              </div>
              {/* текст ответа (очищенный) + упоминание родителя */}
              <div className="meta">
                {t('forum_reply_to') || 'Ответ для'} @{parent?.nickname || shortId(parent?.userId || '')}
              </div>
              {(p.text||'').trim() && (
                <div className="postBody text-[15px] whitespace-pre-wrap break-words">{(p.text||'').slice(0,180)}</div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

      </div>

      <div
  className="body"
  style={{ flex: '1 1 auto', minHeight: 0, height:'100%', overflowY: 'auto', WebkitOverflowScrolling:'touch' }}
>


        <div className="grid gap-2">
          {flat.map(p=>{
            const parent = p.parentId ? allPosts.find(x => String(x.id) === String(p.parentId)) : null
            return (
              <div key={p.id} id={`post_${p.id}`} style={{ marginLeft: p._lvl*18 }}>
                <PostCard
                  p={p}
                  parentAuthor={parent?.nickname || (parent ? shortId(parent.userId || '') : null)}
                  onReport={() => toast.ok(t('forum_report_ok'))}
                  onReply={() => setReplyTo(p)}
                  onOpenThread={(clickP) => { setThreadRoot(clickP) }}
                  onReact={reactMut}
                  isAdmin={isAdmin}
                  onDeletePost={delPost}
                  onBanUser={banUser}
                  onUnbanUser={unbanUser}
                  isBanned={bannedSet.has(p.accountId || p.userId)}
                  authId={auth.asherId || auth.accountId}
                  markView={markViewPost}
                  t={t}
                />
              </div>
            )
          })}
          {(!threadRoot && flat.length===0) && <div className="meta">{t('forum_no_posts_yet') || 'Пока нет сообщений'}</div>}
        </div>
      </div>

{/* нижний композер */}
<div className="composer" data-active={composerActive} ref={composerRef}>
  <div className="meta mb-2">
    {replyTo
      ? `${t('forum_reply_to')||'Ответ для'} ${replyTo.nickname||shortId(replyTo.userId||'')}`
      : threadRoot
        ? `${t('forum_replying_to')||'Ответ к'} ${shortId(threadRoot.userId||'')}`
        : t('')}
  </div>
  <BackToTopButton />

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
              <span className={(String(text || '').trim().length > 180) ? 'max over' : 'max'}>180</span>
            </div>
          </div>

          {/* 2) Скрепка */}
          <div className="railItem">
            <button
              type="button"
              className="iconBtn ghost lockable"
              data-locked={!vipActive}
              aria-label={t('forum_attach') || 'Прикрепить'}
              title={t('forum_attach') || 'Прикрепить'}
              onClick={(e)=>{
                if (!vipActive){
                  try { toast?.warn?.(t?.('forum_vip_required') || 'VIP+ only') } catch {}
                  try { setVipOpen?.(true) } catch {}
                  return;
                }
                handleAttachClick(e);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M7 13.5l6.5-6.5a3.5 3.5 0 115 5L10 20a6 6 0 11-8.5-8.5"
                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"
                />
              </svg>
       {!vipActive && <span className="lockBadge" aria-hidden>🔒</span>}

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
                (videoState==='uploading') && 'disabled',
                !vipActive && 'locked'
              )}
              aria-label={videoState==='recording' ? 'Stop' : (videoState==='preview' ? 'Снять заново' : 'Снять видео')}
              title={videoState==='recording' ? 'Stop' : (videoState==='preview' ? 'Снять заново' : 'Снять видео')}
onClick={(e)=>{
  e.preventDefault();
  if (!vipActive){
    try { toast?.warn?.(t?.('forum_vip_required') || 'VIP+ only') } catch {}
    try { setVipOpen?.(true) } catch {}
    try { setComposerActive(false) } catch {}
    try { document.activeElement?.blur?.() } catch {}
    return;
  }
  if (videoState==='uploading') return;

  // ТОЛЬКО открыть оверлей и включить live-превью
  try { setVideoOpen(true); } catch {}
 
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
              {!vipActive && <span className="lockBadge" aria-hidden>🔒</span>}
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
                (postingRef.current || cooldownLeft>0 || !canSend || String(text||'').trim().length>180) && 'disabled'
              )}
              title={cooldownLeft>0 ? `${cooldownLeft}s` : (t('forum_send')||'Send')}
              aria-label={t('forum_send')||'Send'}
              disabled={postingRef.current || cooldownLeft>0 || !canSend || String(text||'').trim().length>180}
              onClick={async ()=>{
                if (postingRef.current || cooldownLeft>0) return;
                try{
                  setVideoState(s => (pendingVideo ? 'uploading' : s));
                  try { if (videoOpen) setVideoOpen(false); } catch {}
                  const ok = await createPost();
                  if (ok) {
                  setCooldownLeft?.(10);
                  try { resetVideo(); } catch {}
                  }
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
            setText(e.target.value.slice(0,180));
          }
        }}
        onFocus={() => setComposerActive(true)}
        readOnly={(/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/).test(text || '')}
        maxLength={180}
        placeholder={
          (/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/).test(text || '')
            ? (t('forum_more_emoji') || 'VIP emoji selected')
            : t('forum_composer_placeholder')
        }
      />

{/* превью VIP/MOZI эмодзи (если выбрано) */}
{(/^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/.test(text || '')) && (
  <div className="vipComposerPreview">
    <img
      src={(text || '').replace(/^\[(VIP_EMOJI|MOZI):(.*?)\]$/, '$2')}
      alt=""
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
      <div className="inline-flex items-center gap-2 mt-2 overflow-x-auto" style={{ maxWidth: 'min(50%, 320px)' }}>
        {pendingImgs.map((u, i) => (
          <button
            key={i}
            type="button"
            className="relative group shrink-0"
            title={t?.('forum_remove_attachment') || 'Убрать вложение'}
            onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setPendingImgs(prev => prev.filter((_,idx)=>idx!==i)); }}
          >
            <img src={u} alt="" loading="lazy" className="h-8 w-auto max-w-[96px] rounded-md ring-1 ring-white/10" />
            <span className="absolute -top-1 -right-1 hidden group-hover:inline-flex items-center justify-center text-[10px] leading-none px-1 rounded bg-black/70">✕</span>
          </button>
        ))}
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
          <button type="button" className="audioRemove" title={t('forum_remove')||'Убрать'} onClick={()=> setPendingAudio(null)}>✕</button>
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
                      ? <img src={e} alt="" className="vipEmojiIcon" />
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
    ref={fileRef}
    type="file"
    accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
    multiple
    style={{ display:'none' }}
    onChange={onFilesChosen}
  />
</div>

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
        const isClaimed = !!questProg?.[q.id]?.claimed
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
                  : <img className="questThumb" src={q.cover} alt="" loading="lazy" />
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

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-3">
          {q.cover ? (
            q.coverType === 'mp4'
              ? <video className="questThumb" src={q.cover} playsInline autoPlay muted loop preload="metadata" />
              : <img className="questThumb" src={q.cover} alt="" loading="lazy" />
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
              <div className="questHead">
                {task.cover ? (
                  <img className="questThumb" src={task.cover} alt="" loading="lazy" />
                ) : (
                  <div className="avaMini">🏁</div>
                )}

                <div className="min-w-0">
                  <div className="title whitespace-normal break-words">
                    {t(task.i18nKey) || `${q.id} • ${idx + 1}`}
                  </div>

                </div>

                <div className="right">
                  {isDone ? (
                    (() => {
const remain = Math.max(0, __questGetRemainMs(q.id, tid)); // ← страховка на отрицательные
if (remain > 0) {
                        const sec = Math.ceil(remain / 1000);
                        return <span className="tag warn" data-tick={__questTick} title="Таймер">{sec}s</span>;
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

  return (
    <div className="createTopicRow flex items-center justify-between gap-2 mb-2">
      <button
        type="button"
        className="iconBtn bigPlus"
        onClick={()=>setOpen(v=>!v)}
        title={t('forum_create') || 'Создать'}
        aria-label={t('forum_create') || 'Создать'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
      {/* [VIDEO_FEED:BUTTON] — камера рядом с плюсом */}
      <button
        type="button"
        className="iconBtn bigPlus"
         onClick={() => onOpenVideoFeed?.()}
        title={t('forum_video_feed') || 'Видео'}
        aria-label={t('forum_video_feed') || 'Видео'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="14" height="14" rx="3"></rect>
          <path d="M17 9l4-2v10l-4-2z" strokeLinejoin="round" />
        </svg>
      </button>     
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
                onChange={e=>setFirst(e.target.value.slice(0,180))}
                maxLength={180}
                placeholder={t('forum_topic_first_msg_ph')}
              />
              {/* L85 → ВСТАВИТЬ СЮДА */}
              <div className="charRow" aria-live="polite">
                <span className="charNow">{first.trim().length}</span>
                <span className="charSep">/</span>
                <span className={first.trim().length > 180 ? 'charMax charOver' : 'charMax'}>180</span>
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
                  || first.trim().length > 180
                }
                onClick={async()=>{
                  if (
                    busy
                    || !title.trim()
                    || !first.trim()
                    || title.trim().length > 40
                    || descr.trim().length > 90
                    || first.trim().length > 180
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
