'use client'
/**
 * Forum.jsx — боевой клиент форума (интерфейс как в исходнике, фикс хедера)
 *
 * Что изменено в этом файле по твоей просьбе:
 * 1) Добавлен контейнер .controls, в который помещены поиск, сортировки и кнопка админа.
 *    Этот контейнер встроен в header, не абсолютится, не плавает и не выезжает за границы.
 * 2) Переписаны стили .search: теперь это гибкий элемент (flex: 0 1 clamp(...)),
 *    который сжимается на узких экранах, сохраняя «миллиметр в миллиметр» расположение в блоке.
 * 3) Кнопка админа находится в той же строке, справа от поиска, и закреплена в рамках блока.
 * 4) Поповеры (результаты поиска/сортировки и мини-админ) позиционируются относительно своих якорей,
 *    но сами якоря встроены в .controls внутри хедера.
 * 5) ГЛАВНОЕ: при нехватке места .head переносит элементы на новую строку,
 *    а .controls автоматически становится НИЖЕ (под аватаром и ID) и растягивается на всю ширину.
 *
 * Важно: никакая логика форума, рендер тем/постов, реакции и т.д. не менялись, кроме антидубликатов.
 * Остальной код сохранён без изменений.
 */

import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { useI18n } from '../../components/i18n'

/* =========================================================
   helpers
========================================================= */
// ---- отображение имени/аватарки ----
const displayName = (p) => (p?.nickname && String(p.nickname).trim()) || shortId(p?.userId || '');
const displayIcon  = (p) => (p?.icon && String(p.icon).trim()) || '👤';
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
// короткий адрес для UI
const shortAddr = (id) => {
  if (!id) return '';
  const s = String(id);
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
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

/**
 * Аватар-эмодзи без ошибок гидрации:
 * - SSR и первоначальный клиентский рендер = одинаковый fallback ('👤')
 * - после mount подменяем на локальный icon ('👽') или pIcon
 */
function AvatarEmoji({ userId, pIcon, ssrFallback = '👤', clientFallback = '👽' }) {
  // первый кадр на клиенте совпадает с SSR
  const [icon, setIcon] = React.useState(pIcon || ssrFallback);

  React.useEffect(() => {
    const prof = safeReadProfile(userId);
    setIcon(pIcon || prof.icon || clientFallback);
  }, [userId, pIcon]);

  return <span>{icon}</span>;
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
  // Снимок базы (полный или инкрементальный через ?since=…)
  async snapshot(since) {
    try {
      const url = '/api/forum/snapshot' + (since ? `?since=${encodeURIComponent(since)}` : '');
      const r = await fetch(url, { cache: 'no-store' });

      // попробуем как JSON; если не получилось — дадим пустой объект
      const raw = await r.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      // нормализация (чтобы в UI не было undefined/null)
      const topics = Array.isArray(data?.topics) ? data.topics : [];
      const posts  = Array.isArray(data?.posts)  ? data.posts  : [];
      const bans   = Array.isArray(data?.bans)   ? data.bans   : [];
      const rev    = Number.isFinite(+data?.rev) ? +data.rev   : 0;
      const cursor = data?.cursor ?? null;

      // флажок: сервер «пустой» => можно делать жёсткий ресет стейта
      const __reset = topics.length === 0 && posts.length === 0;

      return { ok: r.ok, status: r.status, topics, posts, bans, rev, cursor, __reset };
    } catch (e) {
      console.warn('snapshot failed:', e);
      return { ok: false, error: 'network', topics: [], posts: [], bans: [], rev: 0, cursor: null, __reset: false };
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


/* =========================================================
   КОНЕЦ API
========================================================= */

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
    .btnSm { padding: 2px 8px; font-size: 12px; line-height: 1; }

    /* --- header: теперь переносит элементы при нехватке места --- */
    .head{
      position:sticky; top:0; z-index:50; overflow:visible;
      display:flex; align-items:center; gap:12px; padding:12px 14px;
      border-bottom:1px solid rgba(255,255,255,.1);
      flex-wrap:wrap; /* <— ключевой момент: разрешаем перенос на новую строку */
    }
    .body{ padding:12px; overflow:auto }
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

    .composer{ position:sticky; bottom:0; z-index:5; border-top:1px solid rgba(255,255,255,.1); background:rgba(10,14,22,.96); padding:.8rem }

    .emojiPanel{ margin-top:10px; background:rgba(10,14,20,.98); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:10px; max-height:300px; overflow:auto }
    .emojiTitle{ font-size:.86rem; opacity:.8; margin:2px 2px 6px }
    .emojiGrid{ display:grid; grid-template-columns: repeat(auto-fit, 38px); gap:6px }
    .emojiBtn{ width:38px; height:38px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05); font-size:22px; color:#fff; transition: transform .06s }
    .emojiBtn:hover{ transform:translateY(-1px); background:rgba(255,255,255,.12) }
    .emojiOutline{ background:none; border:none; padding:0; width:38px; height:38px; display:inline-flex; align-items:center; justify-content:center; color:#eaf4ff }

    .iconWrap{ display:flex; flex-wrap:wrap; gap:10px }
    .avaBig{ width:72px; height:72px; border-radius:14px; border:1px solid rgba(80,167,255,.45); display:grid; place-items:center; font-size:48px; background:rgba(25,129,255,.10) }
    .avaMini{ width:24px; height:24px; border-radius:6px; border:1px solid rgba(80,167,255,.35); display:grid; place-items:center; font-size:14px; background:rgba(25,129,255,.08) }

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

/* вне медиа: фиксируем, что кнопки/чипы не сжимаются */
.iconBtn,
.sortWrap,
.adminWrap,
.adminBtn{ flex:0 0 auto; }

  `}</style>
)

/* =========================================================
   constants (иконки/эмодзи)
========================================================= */
const ICONS = '👦 👧 🧑 🧑‍🦱 🧑‍🦰 🧑‍🦳 🧑‍🦲 🧔 🧕 🧑‍🎓 🧑‍💻 🧑‍🚀 🕵️ 🦸 🦹 🧑‍✈️ 🧑‍🎤 🤖 👺 👻 👽 😼 😺 😾 🦊 🐼 🐻 🐨 🐯 🐸'.split(' ')
const EMOJI = [
  { k:'smileys', title:'forum_emoji_cat_smileys', list:'😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 😐 😑 😶 🙄 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥱 😤 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 🤯 😵‍💫 😴'.split(' ') },
  { k:'hands',   title:'forum_emoji_cat_hands',   list:'👍 👎 👊 ✊ 🤛 🤜 ✋ 🤚 🖐 🖖 👋 🤙 💪 🙏 🤝 👏 🙌 🤲 👐 🫶'.split(' ') },
  { k:'love',    title:'forum_emoji_cat_love',    list:'❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 💖 💗 💓 💞 💕 💘 💝 💟 ❣️ 💔 ❤️‍🔥 ❤️‍🩹'.split(' ') },
  { k:'finance', title:'forum_emoji_cat_finance', list:'💰 💴 💵 💶 💷 💸 💳 🧾 💹 📈 📉 💱 💲 🪙'.split(' ') },
  { k:'flags',   title:'forum_emoji_cat_flags',   list:'🏁 🚩 🏴 🏳️ 🇺🇸 🇬🇧 🇪🇺 🇨🇳 🇯🇵 🇰🇷 🇺🇦 🇵🇱 🇫🇷 🇩🇪'.split(' ') },
]

/* =========================================================
   маленькие поповеры
========================================================= */
function AdminPopover({ anchorRef, open, onClose, t, isActive, onActivated, onDeactivated }) {
  const [pass, setPass] = useState('')
  useEffect(() => { if (open) setPass('') }, [open])
  if (!open || !anchorRef?.current) return null
  const top = anchorRef.current.offsetTop + anchorRef.current.offsetHeight + 8
  const right = 0
  return (
    <div className="adminPop" style={{ top, right }}>
      {isActive ? (
        <div className="grid gap-2">
          <div className="meta">{t('forum_admin_active')}</div>
          <button
            className="btn"
            onClick={() => { try { localStorage.removeItem('ql7_admin') } catch { }; onDeactivated?.(); onClose?.() }}>
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
            <button
              className="btn"
              onClick={async () => {
                if (!pass.trim()) return
                const r = await api.adminVerify(pass.trim())
                if (r?.ok) { try { localStorage.setItem('ql7_admin', '1') } catch { }; onActivated?.(); onClose?.() }
              }}>
              {t('forum_activate')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** мини-поповер профиля рядом с аватаром */
function ProfilePopover({ anchorRef, open, onClose, t, auth, onSaved }) {
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
            <div className="iconWrap p-1">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  className={cls('avaMini', icon === ic && 'tag')}
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
/* === REACTION STRIP — ПОД ПОЛНУЮ ЗАМЕНУ === */
function ReactionStrip({ post, onReact }) {
  const likes    = Number(post?.likes ?? 0);
  const dislikes = Number(post?.dislikes ?? 0);
  const mine     = post?.myReaction || null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={cls('btn btnGhost btnSm', mine==='like' && 'tagOk')}
        title="👍"
        onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onReact?.('like'); }}
      >
        👍 {likes}
      </button>

      <button
        type="button"
        className={cls('btn btnGhost btnSm', mine==='dislike' && 'tagDanger')}
        title="👎"
        onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onReact?.('dislike'); }}
      >
        👎 {dislikes}
      </button>
    </div>
  );
}


function TopicItem({ t, agg, onOpen, isAdmin, onDelete }){
  const { posts, likes, dislikes, views } = agg || {}
  return (
    <div className="item cursor-pointer" onClick={()=>onOpen?.(t)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="title text-[#eaf4ff] truncate">{t.title}</div>
          {t.description && <div className="text-[#eaf4ff]/75 text-sm truncate">{t.description}</div>}
          <div className="meta">{human(t.ts)}</div>
          {(t.nickname||t.icon) && (
            <div className="flex items-center gap-2 mt-1">
              <div className="avaMini">{t.icon||'👤'}</div>
              <div className="nick text-sm truncate">{t.nickname||shortId(t.userId||t.accountId||'')}</div>
              {t.isAdmin && <span className="tag" style={{borderColor:'rgba(255,120,80,.55)',color:'#ffb1a1'}}>ADMIN</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="tag">👁 {views||0}</span>
          <span className="tag">💬 {posts||0}</span>
          <span className="tag">👍 {likes||0}</span>
          <span className="tag">👎 {dislikes||0}</span>
          {isAdmin && <button className="tag" onClick={(e)=>{e.preventDefault();e.stopPropagation();onDelete?.(t)}}>🗑</button>}
        </div>
      </div>
    </div>
  )
}

function PostCard({
  p,
  parentAuthor,
  onReport,
  onReply,
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
          <div className="w-10 h-10 rounded-[10px] border grid place-items-center text-2xl bg-[rgba(25,129,255,.10)]">
            <AvatarEmoji userId={p.userId} pIcon={p.icon} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="nick truncate">{p.nickname || shortId(p.userId || '')}</div>
              {p.isAdmin && (
                <span className="tag" style={{ borderColor: 'rgba(255,120,80,.55)', color: '#ffb1a1' }}>
                  ADMIN
                </span>
              )}
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

        {/* действия */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btnGhost btnSm"
            title={t?.('forum_report') || 'Пожаловаться'}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReport?.(p); }}
          >⚠️</button>

          <button
            type="button"
            className="btn btnGhost btnSm"
            title={t?.('forum_reply') || 'Ответить'}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReply?.(p); }}
          >↩️</button>

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
      </div>

      {/* тело поста — ОДИН раз */}
      <div
        className="text-[15px] leading-relaxed postBody whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: rich(p.text || '') }}
      />

      {/* нижняя полоса счётчиков + кнопки реакций */}
      <div className="mt-3 flex items-center gap-2 text-[13px] opacity-80">
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
          onClick={like}
        >
          👍 {likes}
        </button>

        <button
          type="button"
          className="btn btnGhost btnSm"
          title={t?.('forum_dislike') || 'Дизлайк'}
          onClick={dislike}
        >
          👎 {dislikes}
        </button>
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
const requireAuthStrict = async () => {
  const cur = readAuth();
  if (cur?.asherId || cur?.accountId) { setAuth(cur); return cur; }
  const r = await openAuth({ timeoutMs: 20000 });
  if (r?.asherId || r?.accountId) { setAuth(r); return r; }
  toast.warn(t('forum_auth_required') || 'Нужна авторизация');
  return null;
};

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

const clientId = useMemo(()=>ensureClientId(),[])

const [queue,setQueue] = useState(()=>{
  if(!isBrowser()) return []
  try{ return JSON.parse(localStorage.getItem('forum:queue')||'[]') }catch{ return [] }
})
const saveQueue = q => { setQueue(q); try{ localStorage.setItem('forum:queue', JSON.stringify(q)) }catch{} }
const pushOp = (type,payload) => saveQueue([ ...(queue||[]), { type, payload, opId:`${Date.now()}_${Math.random().toString(36).slice(2)}` } ])

const busyRef=useRef(false), debRef=useRef(null)
const sendBatch = (immediate=false) => {
  if(busyRef.current) return
  const run = async () => {
    const ops = queue || []
    if (ops.length === 0) return
    busyRef.current = true
    try{
      const userId = auth?.accountId || auth?.asherId || getForumUserId()
      const resp = await api.mutate({ ops }, userId)

      if (resp && Array.isArray(resp.applied)) {
        // успех — чистим очередь и обновляем снап
        saveQueue([])
        if (typeof refresh === 'function') await refresh()
      } else {
        // неуспех (например, 400). Чтобы не застревать: выкидываем первую опу.
        // На практике это будет невалидная react/view по tmp-id.
        saveQueue(ops.slice(1))
      }
    }catch(e){
      console.error('sendBatch', e)
    }finally{
      busyRef.current=false
    }
  }
  if(immediate) run()
  else { clearTimeout(debRef.current); debRef.current = setTimeout(run, 650) }
}



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
// === SILENT SYNC: мягкое докатывание без «прыжков» ===
useEffect(() => {
  let stop = false;

  // стабильное слияние сервера в локальный снап (сохраняем порядок и tmp)
  const silentMerge = (prev, r) => {
    const out = { ...prev };

    // --- TOPICS (без прыжков) ---
    if (Array.isArray(r.topics)) {
      const byIdPrev = new Map((prev.topics || []).map((t, i) => [String(t.id), { ...t, __idx:i }]));
      for (const t of r.topics) {
        const id = String(t.id);
        byIdPrev.set(id, { ...(byIdPrev.get(id) || { __idx: 9e9 }), ...t });
      }
      // сохраняем прежний порядок, новые в конец
      out.topics = Array.from(byIdPrev.values()).sort((a,b)=>a.__idx-b.__idx).map(({__idx, ...t})=>t);
    }

    // --- POSTS (главное: не дёргать и не терять tmp_*) ---
    if (Array.isArray(r.posts)) {
      const prevList = prev.posts || [];
      const srvMap   = new Map(r.posts.map(p => [String(p.id), p]));
      const order    = new Map(prevList.map((p, i) => [String(p.id), i])); // старые позиции

      // 1) обновляем/добавляем серверные поверх локальных
      const mergedById = new Map(prevList.map(p => [String(p.id), { ...p }]));
      for (const [id, srv] of srvMap) {
        const loc = mergedById.get(id) || {};
        // счётчики не «скачут» вниз: не уменьшаем ниже локального
        const likes    = Math.max(Number(srv.likes ?? 0),    Number(loc.likes ?? 0));
        const dislikes = Math.max(Number(srv.dislikes ?? 0), Number(loc.dislikes ?? 0));
        const views    = Math.max(Number(srv.views ?? 0),    Number(loc.views ?? 0));
        mergedById.set(id, { ...loc, ...srv, likes, dislikes, views, myReaction: (loc.myReaction ?? srv.myReaction ?? null) });
      }

      // 2) не подтверждённые tmp_* оставляем на месте до 10с (не мигают)
      const now = Date.now();
      for (const p of prevList) {
        const id = String(p.id);
        if (id.startsWith('tmp_') && !mergedById.has(id)) {
          const fresh = (now - Number(p.ts || now)) < 10_000;
          if (fresh) mergedById.set(id, p);
        }
      }

      // 3) строим список в СТАРОМ порядке; новые (которых не было) дописываем в конец
      const mergedList = [];
      // существующие — по прежним индексам
      for (const p of prevList) {
        const id = String(p.id);
        const found = mergedById.get(id);
        if (found) { mergedList.push(found); mergedById.delete(id); }
      }
      // новые серверные (которых не было) — в конец (без пересортировки)
      for (const p of mergedById.values()) mergedList.push(p);

      out.posts = mergedList;
    }

    if (Array.isArray(r.bans))   out.bans   = r.bans;
    if (Array.isArray(r.admins)) out.admins = r.admins;
    if (r.rev    !== undefined)  out.rev    = r.rev;
    if (r.cursor !== undefined)  out.cursor = r.cursor;

    return dedupeAll(out);
  };

  const pull = async () => {
    try {
      const r = await api.snapshot(); // внутри должен быть no-store
      if (r?.ok) persist(prev => silentMerge(prev, r));
    } catch {}
  };

  // — живой докат раз в 2 c (можешь поставить 1500–3000)
  (async function loop(){
    while (!stop) {
      await pull();
      await new Promise(r => setTimeout(r, 2000));
    }
  })();

  // — мгновенно при возврате фокуса/онлайна
  const kick = () => { pull(); };
  window.addEventListener('focus', kick);
  window.addEventListener('online', kick);
  document.addEventListener('visibilitychange', kick);

  // — после ЛЮБОГО POST на /api/forum/* (лайк/ответ/бан/удаление)
  const _fetch = window.fetch;
  window.fetch = async (...args) => {
    const res = await _fetch(...args);
    try {
      const req    = args[0];
      const url    = typeof req === 'string' ? req : req?.url;
      const method = (typeof req === 'string' ? (args[1]?.method || 'GET') : (req.method || 'GET')).toUpperCase();
      if (method !== 'GET' && /\/api\/forum\//.test(String(url || ''))) {
        setTimeout(pull, 180); // даём серверу применить
      }
    } catch {}
    return res;
  };

  return () => {
    stop = true;
    window.removeEventListener('focus', kick);
    window.removeEventListener('online', kick);
    document.removeEventListener('visibilitychange', kick);
    window.fetch = _fetch;
  };
}, []);

  //  const refresh = async () => {
  //    const r = await api.snapshot()
  //   if (r?.ok && r.full) {
  //     persist(dedupeAll({
  //       topics: r.topics || [],
  //       posts:  r.posts  || [],
  //       bans:   r.bans   || [],
  //       admins: r.admins || [],
  //       rev:    r.rev    || null,
  //     }))
  //   }
  // }

// useEffect(()=>{ refresh() },[]) 
// useEffect(()=>{ const id=setInterval(()=>refresh(), 8000); return ()=>clearInterval(id) },[])


/* ---- admin ---- */
const [adminOpen, setAdminOpen] = useState(false)
const adminBtnRef = useRef(null)
const isAdmin = isBrowser() && localStorage.getItem('ql7_admin') === '1'

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
    // локально обновляем список банов, чтобы кнопка сразу стала зелёной
    persist(prev => {
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
    persist(prev => {
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


/* ---- выбор темы и построение данных ---- */
const [sel, setSel] = useState(null);

// все посты выбранной темы (строго сравниваем как строки)
const allPosts = useMemo(() => (
  sel?.id ? (data.posts || []).filter(p => String(p.topicId) === String(sel.id)) : []
), [data.posts, sel?.id]);

// корневые посты (без parentId), новые сверху
const rootPosts = useMemo(
  () => allPosts.filter(p => !p.parentId).sort((a, b) => b.ts - a.ts),
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

  const walk = (n, level = 0) => {
    out.push({ ...n, _lvl: level, repliesCount: countDeep(n) });
    (n.children || []).forEach(c => walk(c, level + 1));
  };

  walk(start, 0);
  return out;
}, [sel?.id, threadRoot, rootPosts, idMap]);
// === END flat ===

  /* ---- агрегаты по темам ---- */
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


  /* ---- сортировка тем ---- */
  const [topicSort, setTopicSort] = useState('new') // new/top/likes/views/replies
// ===== ПУНКТ 5: Сортировка тем с использованием агрегатов =====
  const sortedTopics = useMemo(()=>{
    const topics = [...(data.topics || [])];
    const score = (t) => {
      const agg = aggregates.get(t.id) || { posts:0, likes:0, dislikes:0, views:0 };
      switch (topicSort) {
        case 'new':     return t.ts || 0;
        case 'likes':   return agg.likes;
        case 'views':   return agg.views;
        case 'replies': return agg.posts;
        case 'top':
        default:
          // смешанный скор: лайки главнее, затем кол-во постов и немного просмотров
          return (agg.likes * 2) + agg.posts + Math.floor(agg.views * 0.2);
      }
    };
    return topics.sort((a,b) => (score(b) - score(a)) || ((b.ts||0) - (a.ts||0)));
  }, [data.topics, aggregates, topicSort]);


  /* ---- composer ---- */
  const [text,setText] = useState('')
  const [replyTo,setReplyTo] = useState(null)

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
  const body = String(text || '').trim().slice(0, 180);
  if (!body || !sel?.id) return;

  const r = await requireAuthStrict(); if (!r) return;
  const uid  = r.asherId || r.accountId || '';
  const isAdm = (typeof window !== 'undefined') && localStorage.getItem('ql7_admin') === '1';

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
  pushOp('create_post', { topicId: sel.id, text: body, parentId, nickname: p.nickname });
  sendBatch(true);

  // 4) мягкий догон серверного состояния: убираем tmp_*, дотягиваем id/счётчики
  setTimeout(() => { try { if (typeof refresh === 'function') refresh(); } catch {} }, 200);

  // 5) сброс UI
  setText('');
  setReplyTo(null);
  toast.ok('Отправлено');
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
    // если хочешь мгновенно дотянуть серверные значения — дерни твой рефреш/снапшот:
    if (r && r.applied && typeof refresh === 'function') if (typeof refresh === 'function') await refresh();
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
      const map = new Map(prev.posts.map(x=>[x.id,x]))
      const p = { ...(map.get(postId)||{}) }
      p.views = (p.views||0)+1
      map.set(postId, p)
      return dedupeAll({ ...prev, posts: Array.from(map.values()) })
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


  /* ---- поиск/сортировки/поповеры ---- */
  const [q, setQ] = useState('')
  const [drop, setDrop] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const results = useMemo(()=>{
    const term = q.trim().toLowerCase(); if(!term) return []
    const ts = (data.topics||[])
      .filter(x => (x.title||'').toLowerCase().includes(term) || (x.description||'').toLowerCase().includes(term))
      .slice(0,20).map(x => ({ k:'t', id:x.id, title:x.title, desc:x.description }))
    const ps = (data.posts||[])
      .filter(p => (p.text||'').toLowerCase().includes(term))
      .slice(0,40).map(p => ({ k:'p', id:p.id, topicId:p.topicId, text:p.text.slice(0,140) }))
    return [...ts, ...ps]
  },[q, data])

  /* ---- эмодзи ---- */
  const [emojiOpen, setEmojiOpen] = useState(false)
  const addEmoji = e => setText(v=>v+e)

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
    <div className="forum_root space-y-4">
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
              {iconShown}
            </button>
            <ProfilePopover
              anchorRef={avatarRef}
              open={profileOpen}
              onClose={()=>setProfileOpen(false)}
              t={t}
              auth={auth}
              onSaved={()=>{}}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button className="tag" title={idShown||'—'} onClick={copyId}>{nickShown || t('forum_not_signed')}</button>
              {isAdmin && <span className="tag" style={{borderColor:'rgba(255,120,80,.55)',color:'#ffb1a1'}}>ADMIN</span>}
            </div>
            <div className="meta truncate">ID: {idShown || '—'}</div>
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
                          if(tt){ setSel(tt); setThreadRoot(null) }
                        }else{
                          const p = (data.posts||[]).find(x=>x.id===r.id)
                          if(p){
                            const tt = (data.topics||[]).find(x=>x.id===p.topicId)
                            if(tt){ setSel(tt); setThreadRoot({ id:p.parentId||p.id }); setTimeout(()=>{ document.getElementById(`post_${p.id}`)?.scrollIntoView?.({behavior:'smooth', block:'center'}) }, 80) }
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
                    <button key={k} className="item w-full text-left mb-1" onClick={()=>{ setTopicSort(k); setSortOpen(false) }}>{txt}</button>
                  ))}
                </div>
              )}
            </div>

            {/* админ */}
            <div className="adminWrap">
              <button
                ref={adminBtnRef}
                className={cls('adminBtn', isAdmin ? 'adminOn' : 'adminOff', 'pulse')}
                onClick={()=>setAdminOpen(v=>!v)}>
                {t('forum_admin')}
              </button>
              <AdminPopover
                anchorRef={adminBtnRef}
                open={adminOpen}
                onClose={()=>setAdminOpen(false)}
                t={t}
                isActive={isAdmin}
                onActivated={()=>{}}
                onDeactivated={()=>{}}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid2">
        {/* левая колонка — темы */}
        <section className="glass neon" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 215px)' }}>
          <div className="head"><div className="meta">{t('forum_total')}: {(data.topics||[]).length}</div></div>
          <div className="body">
            <CreateTopicCard t={t} onCreate={createTopic} />
            <div className="grid gap-2 mt-2">
              {sortedTopics.map(x=>{
                const agg=aggregates.get(x.id)||{posts:0,likes:0,dislikes:0,views:0}
                return <TopicItem key={x.id} t={x} agg={agg} onOpen={(tt)=>{ setSel(tt); setThreadRoot(null) }} isAdmin={isAdmin} onDelete={delTopic}/>
              })}
            </div>
          </div>
        </section>

        {/* правая колонка — сообщения и дерево */}
        {sel ? (
          <section className="glass neon" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 215px)' }}>
            <div className="head">
              <div className="title">
                {threadRoot
                  ? <button className="btn btnGhost" onClick={()=>{ setThreadRoot(null); setReplyTo(null) }}>← {t('forum_back')}</button>
                  : null}
                <span className="ml-2">{threadRoot ? (t('forum_open_replies')||'Ответы') : sel.title}</span>
              </div>
            </div>
            <div className="body">
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
            <div className="composer">
              <div className="meta mb-2">
                {replyTo ? `${t('forum_reply_to')||'Ответ для'} ${replyTo.nickname||shortId(replyTo.userId||'')}`
                  : threadRoot ? `${t('forum_replying_to')||'Ответ к'} ${shortId(threadRoot.userId||'')}`
                  : t('forum_composer_hint') }
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  className="ta"
                  value={text}
                  onChange={e=>setText(e.target.value.slice(0,180))}
                  maxLength={180}
                  placeholder={t('forum_composer_placeholder')}
                />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button className="btn" disabled={!text.trim()} onClick={createPost}>{t('forum_send')}</button>
                    <button className="emojiOutline" title={t('forum_more_emoji')} onClick={()=>setEmojiOpen(v=>!v)}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
                        <circle cx="9" cy="10" r="1.2" fill="currentColor"/>
                        <circle cx="15" cy="10" r="1.2" fill="currentColor"/>
                        <path d="M8 14.5c1.2 1.2 2.8 1.8 4 1.8s2.8-.6 4-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  {emojiOpen && (
                    <div className="emojiPanel">
                      {EMOJI.map(cat=>(
                        <div key={cat.k} className="mb-2">
                          <div className="emojiTitle">{t(cat.title)}</div>
                          <div className="emojiGrid">
                            {cat.list.map(e=><button key={e} className="emojiBtn" onClick={()=>addEmoji(e)}>{e}</button>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="glass neon p-6 meta flex items-center justify-center">{t('forum_hint_select_topic')}</section>
        )}
      </div>
    </div>
  )
};
/* =========================================================
   Карточка создания темы
========================================================= */
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
              />
            </label>
            <label className="block">
              <div className="meta mb-1">{t('forum_topic_desc')}</div>
              <textarea
                className="ta"
                rows={3}
                value={descr}
                onChange={e=>setDescr(e.target.value.slice(0,40))}
                maxLength={40}
                placeholder={t('forum_topic_desc_ph')}
              />
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
            </label>
            <div className="flex items-center justify-end gap-2">
              <button className="btn btnGhost" onClick={()=>setOpen(false)}>{t('forum_cancel')}</button>
              <button
                className="btn"
                disabled={busy || !title.trim() || !first.trim()}
                onClick={async()=>{
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
