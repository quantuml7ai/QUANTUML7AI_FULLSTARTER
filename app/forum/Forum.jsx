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

// ---- отображение имени/аватарки ---- 
const isBrowser = () => typeof window !== 'undefined'
const cls = (...xs) => xs.filter(Boolean).join(' ')
const shortId = id => id ? `${String(id).slice(0,6)}…${String(id).slice(-4)}` : '—'
const human = ts => new Date(ts || Date.now()).toLocaleString()
const now = () => Date.now()
const safeHtml = s => String(s || '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/(https?:\/\/[^\s<]+)(?=\s|$)/g,'<a target="_blank" rel="noreferrer noopener" href="$1">$1</a>')
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


/// короткий адрес для UI
// const shortAddr = (id) => {
//   if (!id) return '';
//   const s = String(id);
//   return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
// };
// // fallback на случай, если в api нет adminVerify
// const adminVerifyFetch = async (pass) => {
//   try {
//     const res = await fetch('/api/forum/admin/verify', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json', 'cache-control':'no-store' },
//       body: JSON.stringify({ pass: String(pass || '') })
//     });
//     return await res.json();
//   } catch (e) {
//     console.warn('adminVerify failed', e);
//     return null;
//   }
// };

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

/**
 * SSR-safe AvatarEmoji
 * — ВНЕШНИЙ ТЕГ ВСЕГДА <div> (совпадает на SSR и на первом CSR-рендере)
 * — На сервере и до mount рендерим только текст ssrFallback
 * — После mount, если icon — картинка, показываем <img> внутри того же <div>
 */
function AvatarEmoji({
  userId,
  pIcon,
  ssrFallback = '👤',
  clientFallback = '👽',
  className
}) {
  const [icon, setIcon] = React.useState(pIcon || ssrFallback);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const prof = safeReadProfile(userId);
    setIcon(pIcon || prof.icon || clientFallback);
  }, [userId, pIcon, clientFallback]);

  const s = String(icon || '');
  const looksLikeImg =
    /^\/|^https?:\/\//.test(s) ||
    /\.(gif|webp|apng|png|jpg|jpeg|avif|webm)$/i.test(s);

  // ⚠ внешний контейнер — <div>, чтобы совпадать с SSR-разметкой родителя
  return (
    <div className={className} suppressHydrationWarning>
      {mounted && looksLikeImg ? (
        <img
          src={s}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'inherit',
            display: 'block'
          }}
        />
      ) : (
        // до mount — только текст в том же <div>, чтобы не ломать гидрацию
        (s && !looksLikeImg ? s : ssrFallback)
      )}
    </div>
  );
}


/** сигнатуры для схлопывания дублей (tmp_* против пришедших с сервера) */
const sigTopic = (t) => `${(t.title||'').slice(0,80)}|${t.userId||t.accountId||''}|${Math.round((t.ts||0)/60000)}`
const sigPost  = (p) => `${(p.text||'').slice(0,120)}|${p.userId||p.accountId||''}|${p.topicId||''}|${p.parentId||''}|${Math.round((p.ts||0)/60000)}`
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

// вспомогательные (можешь оставить свои, если уже есть ИДЕНТИЧНЫЕ)
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
function setAdminToken(token){
  if (typeof window !== 'undefined') {
    try {
      window.__FORUM_ADMIN_TOKEN__ = String(token || '');
      localStorage.removeItem('forum_admin_token'); // старый способ — выключаем
    } catch {
      window.__FORUM_ADMIN_TOKEN__ = String(token || '');
    }
  }
}

function getAdminToken(){
  if (typeof window === 'undefined') return '';
  try {
    return window.__FORUM_ADMIN_TOKEN__ || localStorage.getItem('forum_admin_token') || '';
  } catch {
    return window.__FORUM_ADMIN_TOKEN__ || '';
  }
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
      const bans   = Array.isArray(data?.bans)   ? data.bans   : [];
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
      'x-forum-user-id': String(actorId || ''),
    };

    // если есть админ-токен — всегда прикладываем
    try {
      const adm = (typeof getAdminToken === 'function') ? getAdminToken() : '';
      if (adm) headers['x-admin-token'] = String(adm);
    } catch {}

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

    try { window.__lastMutate = () => ({ url, req:{ headers, body }, res:{ status:r.status, ok:r.ok, body: json ?? text } }); } catch {}

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
        'x-admin-token': typeof getAdminToken === 'function' ? getAdminToken() : '',
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
          'x-admin-token': typeof getAdminToken === 'function' ? getAdminToken() : '',
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
          'x-admin-token': typeof getAdminToken === 'function' ? getAdminToken() : '',
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
          'x-admin-token': typeof getAdminToken === 'function' ? getAdminToken() : '',
        },
        body: JSON.stringify({ accountId }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
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
  // 1) приоритет — то, что ты передал в пропсе userKey
  if (explicit && String(explicit).trim()) return String(explicit).trim();

  // 2) что уже кладёшь в окно/LS (как у тебя по проекту)
  try{
    const w = typeof window!=='undefined' ? window : {};
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
function useQCoinLive(userKey){
  const uid = String(userKey || '');

  // Константы модели
  const INC_PER_SEC = 1 / (365 * 24 * 60 * 60); // за 365 дней = 1
  const GRACE_MS    = 4 * 60 * 60 * 1000;      // 4 часа
  const SYNC_MS     = 10 * 60 * 1000;          // раз в 10 минут синк

  // Серверные значения (последний снимок)
  const [server, setServer] = React.useState({
    startedAt: Date.now(),
    lastActiveAt: Date.now(),
    lastConfirmAt: 0,
    seconds: 0,
    balance: 0,
    paused: !uid,                 // <-- без UID сразу пауза
    loading: !!uid,               // <-- грузимся только если есть UID
    modal: false,
    incPerSec: uid ? INC_PER_SEC : 0, // <-- без UID инкремент 0
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
          headers:{ 'x-forum-user-id': uid },
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
  }, [uid]);

  // Локальные события активности (любое действие в форуме)
  React.useEffect(function(){
    if (typeof window==='undefined') return;
    // можно не вешать листенеры, если нет UID — но оставим, это дёшево
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
              'x-forum-user-id': uid,
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
  }, [uid, server.paused, server.incPerSec, server.graceMs, server.lastConfirmAt]);

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
  --vip-emoji-size-sm: 32px;   /* на мобильных */
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
    .avaBig{ width:72px; height:72px; border-radius:14px; border:1px solid rgba(80,167,255,.45); display:grid; place-items:center; font-size:48px; background:rgba(25,129,255,.10) }
    .avaMini{ width:40px; height:40px; border-radius:10px; font-size:18px }

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
      position:absolute; width: min(92vw, 360px);
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
  display:inline-flex; align-items:center; gap:6px; margin-left:6px;
}

/* === Q COIN (инлайн + модалка) === */
.qcoinRow{ display:inline-flex; align-items:center; gap:10px; margin-left:10px; }

/* Золотая надпись с переливом и свечением */
.qcoinLabel{
  font-size:1.5em; font-weight:900; letter-spacing:.4px;
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
  50%{ text-shadow:0 0 .9rem rgba(255,215,0,.55), 0 0 .25rem rgba(255,255,190,.55) }
  100%{ text-shadow:0 0 .3rem rgba(255,215,0,.35), 0 0 .1rem rgba(255,255,180,.35) }
}

/* Само число — крупнее, с «стеклянной» подложкой */
.qcoinValue{
  font-size:1.2em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight:800; padding:.24em .36em; border-radius:.36em;
  border:1px solid rgba(255,255,255,.14);
  background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05));
  backdrop-filter: blur(6px);
}
.qcoinValue.live{ color:#ffd700 }
.qcoinValue.paused{ color:#ff8c8c; animation:blinkPause .9s steps(1) infinite }
@keyframes blinkPause{ 50%{ opacity:.45 } }

/* модалка */
.qcoinModal{
  position:fixed; inset:0; z-index:3500; display:grid; place-items:center;
  background:rgba(8,12,22,.8);
}
.qcoinCard{
  width:min(520px, 94vw); max-height:70vh; overflow:auto;
  border:1px solid rgba(255,255,255,.14); border-radius:14px;
  background:rgba(10,14,20,.96); padding:14px;
  box-shadow:0 10px 30px rgba(0,0,0,.45);
}
.qcoinCardHdr{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px }

/* гиф/аватар — х3 размер */
.qcoinMini{
  width:  clamp(108px, 12.6vw, 144px);  /* было 36–48px → стало ~108–144px */
  height: clamp(108px, 12.6vw, 144px);
  border-radius:10px;
  object-fit:cover;
  border:1px solid rgba(255,215,0,.4);
  flex:0 0 auto;
}

.qcoinPopBody{ max-height:50vh; overflow:auto; }
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
  const right = 0
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
function QCoinWithdrawPopover({ anchorRef, onClose, t }) {
  const [pos, setPos] = useState({ top: 0, left: 0, maxW: 520 });
  // позиционируем относительно ближайшего родителя с position:relative (section .glass)
  useEffect(() => {
    const btn = anchorRef?.current;
    if (!btn) return;

    const popParent = btn.closest('section'); // наша .glass
    const parentRect = popParent?.getBoundingClientRect?.() || { top: 0, left: 0, width: window.innerWidth };
    const r = btn.getBoundingClientRect();

    const gap = 8;
    const maxW = Math.min(520, parentRect.width - 16);
    let left = r.left - parentRect.left; // базово подгоняем к кнопке
    // стараемся не вылезать за правую границу
    if (left + maxW > parentRect.width) left = Math.max(8, parentRect.width - maxW - 8);

    setPos({ top: (r.bottom - parentRect.top) + gap, left, maxW });
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
      <div className="qcoinCard">
        <div className="qcoinCardHdr">
          <div className="flex items-center gap-3">
            <img src="/qcoind/mini.gif" alt="" className="qcoinMini" />
            <div>
              <div className="qcoinLabel" style={{fontSize:'1.05rem'}}>Q COIN</div>
              <div className="meta">{t('forum_qcoin_desc')}</div>
            </div>
          </div>
          <button className="btn btnGhost" onClick={onClose}>{t('forum_close')}</button>
        </div>

        <div className="qcoinPopBody">
          {/* тут потом добавишь длинное описание/скролл */}
          <div className="meta">{t('forum_qcoin_withdraw_note')||''}</div>
        </div>

<div className="flex items-center justify-end pt-3 gap-2">
  <a
    className="btn btnGhost"
    href="https://www.quantuml7ai.com/exchange"
    target="_blank"
    rel="noopener noreferrer"
  >
    {t('forum_qcoin_exchange') || 'Биржа'}
  </a>
  <button className="qcoinBtn" disabled>
    {t('forum_qcoin_withdraw')}
  </button>
</div>

      </div>
    </div>
  );
}


function QCoinInline({ t, userKey, anchorRef }) {
  const q = useQCoinLive(userKey)
  const clsVal = q.paused ? 'qcoinValue paused' : 'qcoinValue live'
  return (
    <div className="qcoinRow">
      <span className="qcoinLabel">Q COIN</span>
      <span
        ref={anchorRef}
        className={clsVal}
        onClick={() => { try{ window.dispatchEvent(new Event('qcoin:open')) }catch{}; try{ q.open?.() }catch{} }}
        style={{ cursor:'pointer' }}
        title={t('forum_qcoin_open_hint') || 'Открыть Q COIN'}
      >
        {Number((q.balanceDisplay ?? q.balance ?? 0)).toFixed(10)}
      </span>
    </div>
  )
}


/** мини-поповер профиля рядом с аватаром */
function ProfilePopover({ anchorRef, open, onClose, t, auth, vipActive, onSaved }) {
  const uid = auth.asherId || auth.accountId || ''
  const readLocal = () => { try { return JSON.parse(localStorage.getItem('profile:' + uid) || 'null') } catch { return null } }
  const [nick, setNick] = useState(readLocal()?.nickname || '')
  const [icon, setIcon] = useState(readLocal()?.icon || ICONS[0])
  useEffect(() => { if (open) { const l = readLocal(); setNick(l?.nickname || ''); setIcon(l?.icon || ICONS[0]) } }, [open]) // eslint-disable-line
  if (!open || !anchorRef?.current) return null
  const top = (anchorRef.current.offsetTop || 0) + (anchorRef.current.offsetHeight || 0) + 8
  const left = (anchorRef.current.offsetLeft || 0)
  const save = () => {
    try { localStorage.setItem('profile:' + uid, JSON.stringify({ nickname: nick.trim(), icon })) } catch { }
    onSaved?.({ nickname: nick.trim(), icon }); onClose?.()
  }
  return (
    <div className="profilePop" style={{ top, left }}>
      <div className="text-lg font-bold mb-2">{t('forum_account_settings')}</div>
      <div className="grid gap-2">
        <label className="block">
          <div className="meta mb-1">{t('forum_profile_nickname')}</div>
          <input className="input" value={nick} onChange={e => setNick(e.target.value)} placeholder={t('forum_profile_nickname_ph')} />
        </label>
        <div>
          <div className="meta mb-1">{t('forum_profile_avatar')}</div>
<div className="profileList">
  {/* VIP блок (верхняя строка) */}
  <div className="p-1">
    <div className="emojiTitle">{t('forum_avatar_vip') /* "VIP+ аватары" */}</div>
    <div className="iconWrap">
      {VIP_AVATARS.slice(0,100).map(src => (
        <button
          key={src}
          className={cls('avaMini', icon===src && 'tag', 'hoverPop')}
          onClick={()=>{
            if(vipActive){ setIcon(src) }
            else{
              toast?.warn?.(t('forum_vip_required') || 'VIP required');
              try{ setVipOpen?.(true) }catch{}
            }
          }}
          title={vipActive ? '' : (t('forum_vip_only') || 'Только для VIP+')}
          style={{ position:'relative', width:40, height:40, padding:0 }}
        >
          <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }}/>
          {!vipActive && <span aria-hidden style={{position:'absolute',right:-4,top:-4,fontSize:12}}>🔒</span>}
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
          <button className="btn" onClick={save}>{t('forum_save')}</button>
        </div>
      </div>
    </div>
  )
}


/* =========================================================
   UI: посты/темы
========================================================= */
 
function TopicItem({ t, agg, onOpen, isAdmin, onDelete }) {
  const { posts, likes, dislikes, views } = agg || {};
  return (
    <div className="item cursor-pointer" onClick={() => onOpen?.(t)}>
      <div className="flex items-start justify-between gap-3">
        {/* ВАЖНО: min-w-0 на колонке с текстом, чтобы flex разрешал сжатие */}
        <div className="min-w-0">
          {/* TITLE — уходим от класса .title и жёстко ломаем любые «слитки» */}
          <div
            className="
              topicTitle text-[#eaf4ff]
              !whitespace-normal break-words break-all
              [overflow-wrap:anywhere] [line-break:anywhere]
              max-w-full
            "
          >
            {t.title}
          </div>

          {/* DESCRIPTION */}
          {t.description && (
            <div
              className="
                topicDesc text-[#eaf4ff]/75 text-sm
                !whitespace-normal break-words break-all
                [overflow-wrap:anywhere] [line-break:anywhere]
                max-w-full
              "
            >
              {t.description}
            </div>
          )}

          <div className="meta">{human(t.ts)}</div>

          {(t.nickname || t.icon) && (
            <div className="flex items-center gap-2 mt-1">
              <div className="avaMini">
                <AvatarEmoji
  userId={t.userId || t.accountId}
  pIcon={resolveIconForDisplay(t.userId || t.accountId, t.icon)}
/>

              </div>
              {/* Ник можно оставить с truncate */}
              <span className="nick-badge nick-animate">
                <span className="nick-text truncate">
                  {t.nickname || shortId(t.userId || t.accountId || '')}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Правая колонка — не даём ей тянуть ширину */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="tag">👁 {views || 0}</span>
          <span className="tag">💬 {posts || 0}</span>
          <span className="tag">👍 {likes || 0}</span>
          <span className="tag">👎 {dislikes || 0}</span>
          {isAdmin && (
            <button
              className="tag"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(t);
              }}
            >
              🗑
            </button>
          )}
        </div>
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

  // клики по реакциям
  const like    = (e) => { e.preventDefault(); e.stopPropagation(); onReact?.(p, 'like'); };
  const dislike = (e) => { e.preventDefault(); e.stopPropagation(); onReact?.(p, 'dislike'); };

  // --- ТОЛЬКО ДЛЯ ИЗОБРАЖЕНИЙ: выделяем и вырезаем строки-URL картинок ---
  const IMG_RE = /^(?:\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)|https?:\/\/[^\s]+?\.(?:webp|png|jpe?g|gif))(?:\?.*)?$/i;
  const allLines   = String(p?.text || '').split(/\r?\n/);
  const imgLines   = allLines.map(s=>s.trim()).filter(s => IMG_RE.test(s));
  const cleanedText = allLines.filter(s => !IMG_RE.test(s.trim())).join('\n');

  return (
    <article
      className="item"
      onClick={(e) => {
        if (e.target.closest('button,.tag,a,svg')) return;
        onOpenThread?.(p);
      }}
      role="article"
      aria-label="Пост форума"
    >
      {/* шапка */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* мини-аватар */}
          <div className="avaMini">
            <AvatarEmoji
  userId={p.userId || p.accountId}
  pIcon={resolveIconForDisplay(p.userId || p.accountId, p.icon)}
/>

          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {/* НИК — красивый бейдж (для всех одинаково) */}
              <span className="nick-badge nick-animate">
                <span className="nick-text truncate">{p.nickname || shortId((p.userId || p.accountId || ''))}</span>
              </span>
              {p.parentId && (
                <span className="tag" aria-label={t?.('forum_reply_to') || 'Ответ для'}>
                  {(t?.('forum_reply_to') || 'ответ для') + ' '}
                  {parentAuthor ? '@' + parentAuthor : '…'}
                  {parentSnippet && <>: “{parentSnippet}”</>}
                </span>
              )}
            </div>
            <div className="meta truncate">{human(p.ts)}</div>
          </div>
        </div>

        {/* действия — ПЕРЕНЕСЕНО ВНИЗ В ОДНУ СТРОКУ СО СЧЁТЧИКАМИ */}
        <div className="flex items-center gap-2"></div>
      </div>

      {/* тело поста — VIP-эмодзи как картинка, иначе ОЧИЩЕННЫЙ текст без URL-строк */}
      {(/^\[VIP_EMOJI:\/[^\]]+\]$/).test(p.text || '') ? (
        <div className="postBody">
          <img
            src={(p.text || '').replace(/^\[VIP_EMOJI:(.*?)\]$/, '$1')}
            alt=""
            className="vipEmojiBig"
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

{/* нижняя полоса: СЧЁТЧИКИ + РЕАКЦИИ + (ПЕРЕНЕСЁННЫЕ) ДЕЙСТВИЯ — В ОДНУ СТРОКУ */}
<div
  className="mt-3 flex items-center gap-2 text-[13px] opacity-80"
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'nowrap',                // ← запрещаем перенос flex-элементов
    overflowX: 'auto',              // косметика для inline-частей
    overflowY: 'hidden', 
    WebkitOverflowScrolling: 'touch',               // ничего не выпадает
    fontSize: 'clamp(9px, 1.1vw, 13px)'// ← сильнее сжимаем на узких экранах
  }}
>
  <span className="tag" title={t?.('forum_views') || 'Просмотры'}>👁 {views}</span>

  <span
    className="tag cursor-pointer"
    title={t?.('forum_replies') || 'Ответы'}
    onClick={(e) => { e.stopPropagation(); onOpenThread?.(p); }}
  >
    💬 {replies}
  </span>

  <button
    type="button"
    className="btn btnGhost btnSm"
    title={t?.('forum_like') || 'Лайк'}
    onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onReact?.(p,'like'); }}
  >
    👍 {likes}
  </button>

  <button
    type="button"
    className="btn btnGhost btnSm"
    title={t?.('forum_dislike') || 'Дизлайк'}
    onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onReact?.(p,'dislike'); }}
  >
    👎 {dislikes}
  </button>

  {/* разделяем левый и правый края, но остаёмся в одном ряду */}
  <div style={{ flex: 1, minWidth: 8 }} />

  {/* действия (пожаловаться, ответить, бан/разбан, удалить) — справа в той же строке */}
  <button
    type="button"
    className="btn btnGhost btnSm"
    title={t?.('forum_report') || 'Пожаловаться'}
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReport?.(p); }}
  >⚠️</button>

  {isAdmin && (
    <>
      <button
        type="button"
        className="btn btnGhost btnSm"
        title={t?.('forum_delete') || 'Удалить'}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeletePost?.(p); }}
      >🗑</button>

      {isBanned ? (
        <button
          type="button"
          className="btn btnGhost btnSm tagOk"
          title={t?.('forum_unban') || 'Снять бан'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnbanUser?.(p); }}
        >✅</button>
      ) : (
        <button
          type="button"
          className="btn btnGhost btnSm tagDanger"
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
const pushOp = (type,payload) => saveQueue([ ...(queue||[]), { type, payload, opId:`${Date.now()}_${Math.random().toString(36).slice(2)}` } ])

const busyRef=useRef(false), debRef=useRef(null)
const sendBatch = (immediate = false) => {
  if (busyRef.current) return;

  const run = async () => {
    const ops = queue || [];
    if (ops.length === 0) return;

    busyRef.current = true;
    try {
      const userId = auth?.accountId || auth?.asherId || getForumUserId();
      const resp = await api.mutate({ ops }, userId);

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
          }

          // Схлопываем tmp_* с реальными и убираем дубли по сигнатурам
          return dedupeAll(next);
        });

        // успех — чистим очередь
        saveQueue([]);

        // опционально: локальный «хук» на ручной рефреш, если вернёшь функцию
        if (typeof refresh === 'function') await refresh();
      } else {
        // неуспех (напр., 400). Чтобы не застревать — выкидываем первую операцию.
        // На практике это часто невалидная react/view по tmp-id.
        saveQueue(ops.slice(1));
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
    try { schedulePull?.(120, false); } catch {}
  }, 2 * 60 * 1000);  // каждые 2 минуты
  return () => clearInterval(id);
}, []);
// [TOUCH-PULL] — любой пользовательский жест внутри форума
React.useEffect(() => {
  const root = document.querySelector('.forum_root') || document.body;
  if (!root) return;
  const kick = () => { try { schedulePull?.(80, false); } catch {} };

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
  const JITTER_MS     = 400;     // небольшой джиттер, чтобы рассинхронить вкладки
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

    // Накат серверных поверх локальных; счётчики не уменьшаем
    for (const [id, srv] of srvMap) {
      const loc = mergedById.get(id) || {};
      const likes    = Math.max(+srv.likes    || 0, +loc.likes    || 0);
      const dislikes = Math.max(+srv.dislikes || 0, +loc.dislikes || 0);
      const views    = Math.max(+srv.views    || 0, +loc.views    || 0);
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
        schedulePull(120, true);      // быстрый форс-пул для подтверждения мутации
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
    try { bc && bc.close(); } catch {}
  };
}, []);


// локальный shim: принудительное обновление страницы/данных
const router = useRouter();
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
  if (!e?.data) return;
  if (e.data.startsWith(':')) return; // heartbeat
  try {
    const evt = JSON.parse(e.data);
    if (!evt?.type) return;

    const needRefresh = new Set([
      'topic_created','topic_deleted',
      'post_created','post_deleted',
      'react','view_post','view_topic',
      'ban','unban'
    ]);

    // Тянем снапшот ТОЛЬКО если ревизия реально выросла
    const curRev = (() => {
      try { return (JSON.parse(localStorage.getItem('forum:snap') || '{}').rev) || 0; }
      catch { return 0; }
    })();
    const nextRev = Number(evt?.rev || 0);
    if (nextRev > curRev) {
      // Один запрос снапшота через готовый pull() → persist(safeMerge)
      // Немного подождём, чтобы схлопнуть серии событий
      schedulePull(120, true);
    }
   } catch {}
 };


let fallbackTimer = null;
es.onerror = () => {
  // если SSE сломался — раз в 60с подтягиваем
  if (!fallbackTimer) {
    fallbackTimer = setInterval(() => { refresh?.(); }, 60000);
  }
};
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



/* ---- выбор темы и построение данных ---- */
const [sel, setSel] = useState(null);
// [SORT_STATE:AFTER]
const [q, setQ] = useState('');
const [topicFilterId, setTopicFilterId] = useState(null);
const [topicSort, setTopicSort] = useState('top');   // сортировка тем
const [postSort,  setPostSort]  = useState('new');   // сортировка сообщений  ← ДОЛЖНА быть объявлена до flat
const [drop, setDrop] = useState(false);
const [sortOpen, setSortOpen] = useState(false);

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
// === Навигация для одного блока (safe-версия, без чтения до инициализации) ===
const selRef = React.useRef(null);
const threadRootRef = React.useRef(null);

React.useEffect(() => { selRef.current = sel }, [sel]);
React.useEffect(() => { threadRootRef.current = threadRoot }, [threadRoot]);

const goHome = React.useCallback(() => {
  try { setReplyTo(null); } catch {}
  try { setThreadRoot(null); } catch {}
  try { setSel(null); } catch {}
}, []);

const goBack = React.useCallback(() => {
  // если открыта ветка ответов — выходим из неё
  if (threadRootRef.current) {
    try { setReplyTo(null); } catch {}
    try { setThreadRoot(null); } catch {}
    return;
  }
  // иначе — из выбранной темы к списку тем
  if (selRef.current) {
    try { setReplyTo(null); } catch {}
    try { setSel(null); } catch {}
  }
}, []);

// === BEGIN flat (REPLACE WHOLE BLOCK) ===
const flat = useMemo(() => {
  if (!sel?.id) return [];

  // без ветки: только корни, repliesCount = число прямых детей
  if (!threadRoot) {
    return rootPosts.map(r => ({
      ...r,
      _lvl: 0,
      repliesCount: (idMap.get(String(r.id))?.children || []).length,
    }));
  }

  // выбрана ветка: обходим всё поддерево
  const start = idMap.get(String(threadRoot.id));
  if (!start) return [];

  const out = [];
  const countDeep = (n) =>
    (n.children || []).reduce((a, ch) => a + 1 + countDeep(ch), 0);

// [FLAT_WALK:AFTER]
// сравнение для постов по выбранному критерию
const postScore = (p) => {
  const ts   = Number(p.ts || 0);
  const lk   = Number(p.likes || 0);
  const vw   = Number(p.views || 0);
  const rc   = Number((p.children || []).length || 0);
  switch (postSort) {
    case 'likes':   return lk;
    case 'views':   return vw;
    case 'replies': return rc;
    case 'top':     return (lk * 2) + rc + Math.floor(vw * 0.2);
    case 'new':
    default:        return ts;
  }
};

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

 // ===== ПУНКТ 5: Агрегаты по темам из постов снапшота =====
  const aggregates = useMemo(()=>{
    const byTopic = new Map();
    for (const p of (data.posts || [])) {
      const a = byTopic.get(p.topicId) || { posts: 0, likes: 0, dislikes: 0, views: 0 };
      a.posts    += 1;
      a.likes    += (p.likes    || 0);
      a.dislikes += (p.dislikes || 0);
      a.views    += (p.views    || 0);
      byTopic.set(p.topicId, a);
    }
    return byTopic;
  }, [data.posts]);


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

// отправлять можно, если есть текст ИЛИ хотя бы одна картинка
const canSend = (String(text || '').trim().length > 0) || (pendingImgs.length > 0);
  // === composer helpers (images) ===
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
    const tmpT = `tmp_t_${now()}_${Math.random().toString(36).slice(2)}`
    const tmpP = `tmp_p_${now()}_${Math.random().toString(36).slice(2)}`
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
      id: tmpT, title: safeTitle, description: safeDesc, ts: now(),
      userId: uid, nickname: prof.nickname || shortId(uid),
      icon: prof.icon || '👤', isAdmin: isAdm, views: 0
    }
    const p0 = {
      id: tmpP, topicId: tmpT, parentId: null, text: safeFirst, ts: now(),
      userId: uid, nickname: t0.nickname, icon: t0.icon, isAdmin: isAdm,
      likes: 0, dislikes: 0, views: 0, myReaction: null
    }

// оптимистично кладём в локальный снап
persist(prev => dedupeAll({ ...prev, topics:[t0, ...prev.topics], posts:[...prev.posts, p0] }))
setSel(t0)
toast.ok('Тема создана')

   
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
      ops:[{ type:'create_post', payload:{ topicId:String(realTopicId), text:safeFirst, nickname:t0.nickname, parentId:null } }]
    }, uid)

    // подтянуть свежий снапшот
    if (typeof refresh === 'function') await refresh()
  }



  const createPost = async () => {
    if (!rl.allowAction()) { toast.warn(t('forum_too_fast') || 'Слишком часто'); return; }
const plain = (String(text || '').trim() || (pendingImgs.length > 0 ? '\u200B' : '')).slice(0,180);
// к тексту приклеиваем каждую картинку отдельной строкой
const body  = [plain, ...pendingImgs].filter(Boolean).join('\n');
if (!body || !sel?.id) return;



  const r = await requireAuthStrict(); if (!r) return;
  const uid  = r.asherId || r.accountId || '';
  const isAdm = (typeof window !== 'undefined') && localStorage.getItem('ql7_admin') === '1';
  const isVip = !!vipActive;
    if (!isAdm && !isVip && hasAnyLink(body)) {
    toast.warn(t('forum_links_admin_vip_only') || 'Ссылки доступны только администратору и VIP');
    return;
  }


  // локальный профиль (ник/иконка для моментального UI)
  const prof = (() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('profile:' + uid) || '{}'); }
    catch { return {}; }
  })();

  // если отвечаем — определяем родителя
  const parentId = (replyTo?.id) || (threadRoot?.id) || null;
  const isReply  = !!parentId;

  // --- OPTIMISTIC: tmp-пост сразу в UI ---
  const tmpId = `tmp_p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const p = {
    id: tmpId,
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

  // 1) мгновенно положили в локальный снап, инкрементнули счётчик у родителя
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

  // 2) если это ответ — сразу раскрываем ветку по РЕАЛЬНОМУ объекту родителя
  if (isReply) {
    const parentPost = (data?.posts || []).find(x => String(x.id) === String(parentId));
    setThreadRoot(parentPost || { id: String(parentId) });
    setTimeout(() => {
      try { document.querySelector('.body')?.scrollTo?.({ top: 9e9, behavior: 'smooth' }); } catch {}
    }, 60);
  }

  // 3) батч на бэкенд (как у тебя)
    pushOp('create_post', {
    topicId: sel.id,
    text: body,
    parentId,
    nickname: p.nickname,
    icon: p.icon
  });
  sendBatch(true);
  setComposerActive(false);    // свернуть инструменты
  emitCreated(p.id, sel.id);   // ← оповестить другие вкладки/клиентов

  // 4) мягкий догон серверного состояния: убираем tmp_*, дотягиваем id/счётчики
  setTimeout(() => { try { if (typeof refresh === 'function') refresh(); } catch {} }, 200);

  // 5) сброс UI
  setText('');
  setPendingImgs([]);
  setReplyTo(null);
  toast.ok(t('forum_post_sent') || 'Отправлено');
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
    // оптимистический инкремент views
persist(prev=>{
  const map = new Map((prev.posts || []).map(x => [x.id, x]));
  const p = { ...(map.get(postId) || {}) };
  p.views = (Number(p.views) || 0) + 1;
  map.set(postId, p);
  return dedupeAll({ ...prev, posts: Array.from(map.values()) });
})

    pushOp('view_post', { postId })
    sendBatch()
  }
}


useEffect(()=>{
  if(!sel?.id || !isBrowser()) return
  const bucket = getBucket(VIEW_TTL_SEC)
  const key = `topic:${sel.id}:viewed:${bucket}`
  if(!localStorage.getItem(key)){
    localStorage.setItem(key,'1')
    pushOp('view_topic', { topicId: sel.id })
    sendBatch()
  }
},[sel?.id]) // eslint-disable-line


  /* ---- эмодзи ---- */
  const [emojiOpen, setEmojiOpen] = useState(false)
  const addEmoji = (e) => {
  if (typeof e === 'string' && e.startsWith('/')) {
    // VIP: один крупный эмодзи
    setText(`[VIP_EMOJI:${e}]`);
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

  /* ---- render ---- */
  return (
<div
  className="forum_root space-y-4"
  data-view={sel ? 'thread' : 'topics'}
  style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} // <<< добавили
>

      <Styles />{toast.view}

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
          </div>

  {/* ← ВОТ СЮДА ВСТАВЬ ПОПОВЕР */}
  {qcoinModalOpen && (
    <QCoinWithdrawPopover
      anchorRef={withdrawBtnRef}
      onClose={() => setQcoinModalOpen(false)}
      t={t}
    />
  )}


<div className="min-w-0">
  <div className="flex items-center gap-2">
    <button
      className="nick-badge nick-animate"
      title={idShown||'—'}
      onClick={copyId}
    >
      <span className="nick-text truncate">
        {nickShown || t('forum_not_signed')}
      </span>
    </button>

    {isAdmin && (
      <span
        className="tag"
        style={{borderColor:'rgba(255,120,80,.55)', color:'#ffb1a1'}}
      >ADMIN</span>
    )}

{/* Q COIN inline справа от ника */}
<QCoinInline
  t={t}
  userKey={idShown} />



  </div>
  {/* <div className="meta truncate">ID: {idShown || '—'}</div> */}
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
        {/* ЕДИНЫЙ РЯД КНОПОК ВНУТРИ БЛОКА */}
        <div className="flex items-center justify-between gap-2">
          <div className="left flex items-center gap-2">
            <button type="button" className="btn" disabled onClick={()=>{}}>
              ← {t?.('forum_back') || 'Назад'}
            </button>
            <button type="button" className="btn btnGhost" onClick={()=>{ try{ setReplyTo(null) }catch{}; try{ setThreadRoot(null) }catch{}; try{ setSel(null) }catch{}; }}>
              ⌂ {t?.('forum_home') || 'На главную'}
            </button>
          </div>
          <div className="right flex items-center gap-2">

          </div>
        </div>

        <div className="meta mt-2">{t('forum_total')}: {(data.topics||[]).length}</div>
      </div>


<div
  className="body"
  style={{ flex: '1 1 auto', minHeight: 0, height:'100%', overflowY: 'auto', WebkitOverflowScrolling:'touch' }}
>

  <CreateTopicCard t={t} onCreate={createTopic} />
  <div className="grid gap-2 mt-2" suppressHydrationWarning>
    {(sortedTopics || [])
      .slice()                                              // не мутируем исходный
      .sort((a,b) => {                                     // стабильная сортировка: новые сверху
        const at = Number(a?.ts || 0), bt = Number(b?.ts || 0);
        if (bt !== at) return bt - at;
        return String(b?.id || '').localeCompare(String(a?.id || ''));
      })
      .map(x => {
        const agg = aggregates.get(x.id) || { posts:0, likes:0, dislikes:0, views:0 };
        return (
          <TopicItem
            key={`t:${x.id}`}                               // стабильный ключ
            t={x}
            agg={agg}
            onOpen={(tt)=>{ setSel(tt); setThreadRoot(null) }}
            isAdmin={isAdmin}
            onDelete={delTopic}
          />
        )
      })}
  </div>
</div>

    </section>
  ) : (
    /* === ВЫБРАННАЯ ТЕМА: посты + композер === */
    <section className="glass neon" style={{ display:'flex', flexDirection:'column', flex:'1 1 auto', minHeight: 0 }}>

 
       <div className="head">
        {/* ЕДИНЫЙ РЯД КНОПОК ВНУТРИ БЛОКА (без «Создать тему») */}
        <div className="flex items-center justify-between gap-2">
          <div className="left flex items-center gap-2">
            <button
              type="button"
              className="btn"
              onClick={()=>{ 
                if (threadRoot) { try{ setReplyTo(null) }catch{}; try{ setThreadRoot(null) }catch{}; }
                else            { try{ setReplyTo(null) }catch{}; try{ setSel(null) }catch{}; }
              }}
            >
              ← {t?.('forum_back') || 'Назад'}
            </button>

            <button
              type="button"
              className="btn btnGhost"
              onClick={()=>{ try{ setReplyTo(null) }catch{}; try{ setThreadRoot(null) }catch{}; try{ setSel(null) }catch{}; }}
            >
              ⌂ {t?.('forum_home') || 'На главную'}
            </button>
          </div>

          <div className="right" />
        </div>

<div
  className="title mt-2 whitespace-normal break-words [overflow-wrap:anywhere] [line-break:anywhere] min-w-0"
  suppressHydrationWarning
>
  <span className="whitespace-normal break-words [overflow-wrap:anywhere] [line-break:anywhere]">
    {threadRoot ? (t('forum_open_replies') || 'Ответы') : (sel?.title || '')}
  </span>
</div>


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
                : t('forum_composer_hint')}
          </div>
          <BackToTopButton />

          <div className="flex items-end gap-2 forumComposer">
            <textarea
              className="ta"
              style={{ minHeight: 60 }}  /* ↑ композер ниже (≈1.5–2x) */
              value={(/^\[VIP_EMOJI:\/[^\]]+\]$/).test(text || '') ? '' : (text || '')}
              onChange={e=>{
                if ((/^\[VIP_EMOJI:\/[^\]]+\]$/).test(text || '')) {
                  setText(text);
                } else {
                  setText(e.target.value.slice(0,180));
                }
              }}
              onFocus={() => setComposerActive(true)}
              readOnly={(/^\[VIP_EMOJI:\/[^\]]+\]$/).test(text || '')}
              maxLength={180}
              placeholder={
                (/^\[VIP_EMOJI:\/[^\]]+\]$/).test(text || '')
                  ? (t('forum_more_emoji') || 'VIP emoji selected')
                  : t('forum_composer_placeholder')
              }
            />

            {/* счётчик символов */}
            <div className="charRow" aria-live="polite">
              <span className="charNow">{String(text || '').trim().length}</span>
              <span className="charSep">/</span>
              <span className={(String(text || '').trim().length > 180) ? 'charMax charOver' : 'charMax'}>180</span>
            </div>

            {/* превью VIP-эмодзи */}
            {(/^\[VIP_EMOJI:\/[^\]]+\]$/).test(text || '') && (
              <div className="vipComposerPreview">
                <img
                  src={(text || '').replace(/^\[VIP_EMOJI:(.*?)\]$/, '$1')}
                  alt=""
                  className="vipEmojiBig"
                  style={{ width: 'var(--vip-emoji-size,48px)', height: 'var(--vip-emoji-size,48px)' }}
                />
              </div>
            )}
          </div>

          <div className="tools flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-nowrap">
              <button
                className="btn shrink-0"
                disabled={!canSend || String(text||'').trim().length > 180}
                onClick={async ()=>{ try { await createPost() } finally { try { setEmojiOpen(false) } catch {} } }}  /* ← автозакрытие панели эмодзи */
              >
                {t('forum_send')}
              </button>

              <button
                className="emojiOutline shrink-0"
                title={t('forum_more_emoji')}
                onClick={()=>setEmojiOpen(v=>!v)}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
                  <circle cx="9" cy="10" r="1.2" fill="currentColor"/>
                  <circle cx="15" cy="10" r="1.2" fill="currentColor"/>
                  <path d="M8 14.5c1.2 1.2 2.8 1.8 4 1.8s2.8-.6 4-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>

              {/* скрепка */}
              <button
                className="emojiOutline lockable shrink-0"
                data-locked={!vipActive}
                title={t('forum_attach') || 'Прикрепить'}
                onClick={handleAttachClick}
              >
                <svg className="clipSvg" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M7 13.5l6.5-6.5a3.5 3.5 0 115 5L10 20a6 6 0 11-8.5-8.5"
                        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {!vipActive && <span className="lockBadge" aria-hidden>🔒</span>}
              </button>

              {/* превью вложений */}
              {pendingImgs.length > 0 && (
                <div className="inline-flex items-center gap-2 ml-2 overflow-x-auto" style={{ maxWidth: 'min(50%, 320px)' }}>
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

              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
                multiple
                style={{ display:'none' }}
                onChange={onFilesChosen}
              />
            </div>

            {emojiOpen && (
              <div
                className="emojiPanel"
                style={{
                  maxHeight: 150,      /* ↓ панель ниже */
                  overflowY: 'auto',   /* скролл */
                  overscrollBehavior: 'contain',
                  paddingRight: 4,
                  marginTop: 6,
                }}
              >
                <div className="p-1">
                  <div className="emojiTitle">{t?.('forum_emoji_vip') || 'VIP+ emoji'}</div>
                  <div className="emojiGrid">
                    {VIP_EMOJI.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="emojiBtn hoverPop"
                        onClick={() => {
                          if (vipActive) { addEmoji(e); setEmojiOpen(false); }
                          else { try { toast?.warn?.(t?.('forum_vip_required') || 'VIP+ required'); } catch {}; try { setVipOpen?.(true); } catch {} }
                        }}
                        title={vipActive ? '' : (t?.('forum_vip_only') || 'VIP+ only')}
                      >
                        {typeof e === 'string' && e.startsWith('/') ? <img src={e} alt="" className="vipEmojiIcon" /> : <span className="vipEmojiIcon">{e}</span>}
                        {!vipActive && <span className="vipLock" aria-hidden>🔒</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{height:1,opacity:.1,background:'currentColor',margin:'6px 0'}} />

                {EMOJI.map((cat) => (
                  <div key={cat.k} className="mb-2">
                    <div className="emojiTitle">{t(cat.title)}</div>
                    <div className="emojiGrid">
                      {cat.list.map((e) => (
                        <button key={e} className="emojiBtn" onClick={() => addEmoji(e)}>{e}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

    </section>
  )}
</div>
</div>
)
};

/* =========================================================
   Карточка создания темы
========================================================= */
function CreateTopicCard({ t, onCreate }){
  const [open,setOpen] = useState(false)
  const [busy,setBusy] = useState(false)
  const [title,setTitle] = useState(''), [descr,setDescr] = useState(''), [first,setFirst] = useState('')

  return (
    <div className="flex items-center justify-between gap-2 mb-2">
     <button className="btn" onClick={()=>setOpen(v=>!v)}>{t('forum_create')}</button>
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
