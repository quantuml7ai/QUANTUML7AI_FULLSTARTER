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

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../components/i18n'

/* =========================================================
   helpers
========================================================= */
const isBrowser = () => typeof window !== 'undefined'
const cls = (...xs) => xs.filter(Boolean).join(' ')
const shortId = id => id ? `${String(id).slice(0,6)}…${String(id).slice(-4)}` : '—'
const human = ts => new Date(ts || Date.now()).toLocaleString()
const now = () => Date.now()
const safeHtml = s => String(s || '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/(https?:\/\/[^\s<]+)(?=\s|$)/g,'<a target="_blank" rel="noreferrer" href="$1">$1</a>')
  .replace(/\n/g,'<br/>')
const rich = s => safeHtml(s).replace(/\*\*(.*?)\*\*/g,'<b>$1</b>').replace(/\*(.*?)\*/g,'<i>$1</i>')

const readAuth = () => ({
  accountId: isBrowser() && (window.__AUTH_ACCOUNT__ || localStorage.getItem('account') || localStorage.getItem('wallet')) || null,
  asherId:   isBrowser() && (window.__ASHER_ID__      || localStorage.getItem('asherId') || localStorage.getItem('ql7_uid')) || null,
})

async function openAuth(){
  try { window.dispatchEvent(new CustomEvent('open-auth')) } catch {}
  ;(document.querySelector('[data-auth-open]')||document.querySelector('#nav-auth-btn'))?.click?.()
  return new Promise(res=>{
    const done = () => res(readAuth())
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:ok', done, { once:true })
      window.addEventListener('auth:success', done, { once:true })
      setTimeout(done, 6000)
    } else {
      res(readAuth())
    }
  })
}

function ensureClientId(){
  try{
    let v = localStorage.getItem('forum:cid')
    if(!v){ v = (crypto?.randomUUID?.() || `c_${Math.random().toString(36).slice(2)}${Date.now()}`); localStorage.setItem('forum:cid', v) }
    return v
  }catch{ return `c_${Date.now()}` }
}

/** сигнатуры для схлопывания дублей (tmp_* против пришедших с сервера) */
const sigTopic = (t) => `${(t.title||'').slice(0,80)}|${t.userId||t.accountId||''}|${Math.round((t.ts||0)/60000)}`
const sigPost  = (p) => `${(p.text||'').slice(0,120)}|${p.userId||p.accountId||''}|${p.topicId||''}|${p.parentId||''}|${Math.round((p.ts||0)/60000)}`

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
   API (клиент)
========================================================= */
const api = {
  // Снимок базы (вся лента, инкрементально через ?since=...)
  async snapshot(since) {
    try {
      const url = '/api/forum/snapshot' + (since ? `?since=${encodeURIComponent(since)}` : '')
      const r = await fetch(url, { cache: 'no-store' })
      // Если бэкенд вдруг вернул не JSON — ловим аккуратно
      const data = await r.json().catch(() => ({}))
      return data
    } catch (e) {
      return { ok: false, error: 'network' }
    }
  },
   // Мутации (батч операций)
  async mutate(batch){
    try{
      // кто актор — берём из batch или из auth
      const actorId =
        batch?.userId ||
        batch?.accountId ||
        batch?.asherId ||
        auth?.userId ||
        auth?.accountId ||
        auth?.asherId ||
        'guest'

      const headers = {
        'Content-Type': 'application/json',
        'x-forum-user-id': String(actorId),
      }

      const payload = {
        ...batch,
        userId: actorId,
        isAdmin: auth?.isAdmin ? 1 : 0,
      }

      const r = await fetch('/api/forum/mutate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      const json = await r.json()
      return json
    }catch(e){
      console.error('mutate error', e)
      toast?.error(e?.message || String(e))
      return null
    }
  },


  // Админ-подтверждение пароля (включение admin-режима в UI по локалстораджу — делаешь снаружи)
  async adminVerify(pass) {
    try {
      const r = await fetch('/api/forum/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
      })
      const data = await r.json().catch(() => ({}))
      return data
    } catch (e) {
      return { ok: false, error: 'network' }
    }
  },

  // Админ: удалить тему
  async adminDeleteTopic(id) {
    try {
      const r = await fetch('/api/forum/admin/deleteTopic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await r.json().catch(() => ({}))
      return data
    } catch (e) {
      return { ok: false, error: 'network' }
    }
  },

  // Админ: удалить пост (ветка удалится каскадно на сервере)
  async adminDeletePost(id) {
    try {
      const r = await fetch('/api/forum/admin/deletePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await r.json().catch(() => ({}))
      return data
    } catch (e) {
      return { ok: false, error: 'network' }
    }
  },
  // Админ: снять бан с пользователя
  async adminUnbanUser(accountId) {
    try {
      const r = await fetch('/api/forum/admin/unbanUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const data = await r.json().catch(() => ({}))
      return data
    } catch (e) {
      return { ok: false, error: 'network' }
    }
  },

  // Админ: бан пользователя
  async adminBanUser(accountId) {
    try {
      const r = await fetch('/api/forum/admin/banUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const data = await r.json().catch(() => ({}))
      return data
    } catch (e) {
      return { ok: false, error: 'network' }
    }
  },
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

    /* --- header: теперь переносит элементы при нехватке места --- */
    .head{
      position:sticky; top:0; z-index:50; overflow:visible;
      display:flex; align-items:center; gap:12px; padding:12px 14px;
      border-bottom:1px solid rgba(255,255,255,.1);
      flex-wrap:wrap; /* <— ключевой момент: разрешаем перенос на новую строку */
    }
    .body{ padding:12px; overflow:auto }

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
      display:flex; align-items:center; gap:8px; overflow:visible;
      /* Ключ: позволяем сжиматься и переноситься на следующую строку при нехватке места */
      flex: 1 1 clamp(420px, 48vw, 640px);
      min-width: 320px; /* но не меньше этого */
      order: 2;
    }

    /* Поиск встроен в .controls и сжимается по ширине на узких экранах */
    .search{
      position:relative;
      display:flex; align-items:center; gap:8px;
      z-index:60; overflow:visible;
      flex: 1 1 clamp(260px, 40vw, 560px); /* <— сжимается, но остаётся на своём месте */
    }
    .searchInput{ flex:1; height:40px; border-radius:12px; padding:.55rem .9rem; background:#0b1018; color:var(--ink); border:1px solid rgba(255,255,255,.16) }
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

    /* Немного поджать на очень узких вьюпортах:
       .controls уходит на СЛЕДУЮЩУЮ СТРОКУ и занимает 100% ширины (под аватаром и ID) */
    @media (max-width:860px){
      .controls{ order:3; flex: 1 1 100%; min-width: 100% }
      .search{ flex-basis: auto }
    }
    @media (max-width:560px){
      .head{ padding:10px }
      .controls{ order:3; flex: 1 1 100%; min-width:100% }
      .search{ flex-basis: 100% }
    }
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
function AdminPopover({ anchorRef, open, onClose, t, isActive, onActivated, onDeactivated }){
  const [pass,setPass] = useState('')
  useEffect(()=>{ if(open) setPass('') },[open])
  if(!open || !anchorRef?.current) return null
  const top = anchorRef.current.offsetTop + anchorRef.current.offsetHeight + 8
  const right = 0
  return (
    <div className="adminPop" style={{ top, right }}>
      {isActive ? (
        <div className="grid gap-2">
          <div className="meta">{t('forum_admin_active')}</div>
          <button
            className="btn"
            onClick={()=>{ try{ localStorage.removeItem('ql7_admin') }catch{}; onDeactivated?.(); onClose?.() }}>
            {t('forum_admin_exit')}
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <label className="block">
            <div className="meta mb-1">{t('forum_admin_pass')}</div>
            <input className="input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" />
          </label>
          <div className="flex items-center justify-end gap-2">
            <button className="btn btnGhost" onClick={onClose}>{t('forum_cancel')}</button>
            <button
              className="btn"
              onClick={async()=>{
                if(!pass.trim()) return
                const r = await api.adminVerify(pass.trim())
                if(r?.ok){ try{ localStorage.setItem('ql7_admin','1') }catch{}; onActivated?.(); onClose?.() }
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
function ProfilePopover({ anchorRef, open, onClose, t, auth, onSaved }){
  const uid = auth.asherId || auth.accountId || ''
  const readLocal = () => { try{ return JSON.parse(localStorage.getItem('profile:'+uid) || 'null') }catch{return null } }
  const [nick,setNick] = useState(readLocal()?.nickname || '')
  const [icon,setIcon] = useState(readLocal()?.icon || ICONS[0])
  useEffect(()=>{ if(open){ const l=readLocal(); setNick(l?.nickname||''); setIcon(l?.icon||ICONS[0]) } },[open]) // eslint-disable-line
  if(!open || !anchorRef?.current) return null
  const top = (anchorRef.current.offsetTop || 0) + (anchorRef.current.offsetHeight || 0) + 8
  const left = (anchorRef.current.offsetLeft || 0)
  const save = () => {
    try { localStorage.setItem('profile:'+uid, JSON.stringify({ nickname:nick.trim(), icon })) } catch {}
    onSaved?.({ nickname:nick.trim(), icon }); onClose?.()
  }
  return (
    <div className="profilePop" style={{ top, left }}>
      <div className="text-lg font-bold mb-2">{t('forum_account_settings')}</div>
      <div className="grid gap-2">
        <label className="block">
          <div className="meta mb-1">{t('forum_profile_nickname')}</div>
          <input className="input" value={nick} onChange={e=>setNick(e.target.value)} placeholder={t('forum_profile_nickname_ph')} />
        </label>
        <div>
          <div className="meta mb-1">{t('forum_profile_avatar')}</div>
          <div className="profileList">
            <div className="iconWrap p-1">
              {ICONS.map(ic=>(
                <button key={ic} className={cls('avaMini', icon===ic && 'tag')} onClick={()=>setIcon(ic)} title={ic} style={{width:40,height:40,fontSize:22}}>{ic}</button>
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
function ReactionStrip({ post, onReact }){
  const like = (post.reactions||{})['👍'] || 0
  const dis  = (post.reactions||{})['👎'] || 0
  const my   = post.myReaction || null
  const togg = e => onReact?.(my===e ? null : e)
  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      <span className="tag meta">↩️ {post.repliesCount||0}</span>
      <span className="tag meta">👁 {post.views||0}</span>
      <button className={cls('tag', my==='👍' && 'item')} onClick={()=>togg('👍')}>👍 {like}</button>
      <button className={cls('tag', my==='👎' && 'item')} onClick={()=>togg('👎')}>👎 {dis}</button>
    </div>
  )
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

function PostCard({ p, parentAuthor, onReport, onReply, onOpenThread, onReact, isAdmin, onDeletePost, onBanUser, onUnbanUser, isBanned, authId, markView }){

  useEffect(()=>{ // уникальный просмотр раз в сутки
    if(!p?.id || !authId || !isBrowser()) return
    const day = new Date().toISOString().slice(0,10)
    const key = `post:${p.id}:viewed:${authId}:${day}`
    if(!localStorage.getItem(key)){ localStorage.setItem(key,'1'); markView?.(p.id) }
  },[p?.id,authId,markView])

  return (
    <article className="item" onClick={e=>{ if(e.target.closest('button,.tag,a,svg')) return; onOpenThread?.(p) }}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 rounded-[10px] border grid place-items-center text-3xl bg-[rgba(25,129,255,.10)]">{p.icon || '👤'}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="nick truncate">{p.nickname || shortId(p.userId||'')}</div>
              {p.isAdmin && <span className="tag" style={{borderColor:'rgba(255,120,80,.55)',color:'#ffb1a1'}}>ADMIN</span>}
              {p.parentId && <span className="tag">ответ для {parentAuthor ? `@${parentAuthor}` : '…'}</span>}
            </div>
            <div className="meta truncate">{human(p.ts)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="tag" onClick={(e)=>{e.preventDefault();e.stopPropagation();onReport?.(p)}}>⚠️</button>
          <button className="tag" onClick={(e)=>{e.preventDefault();e.stopPropagation();onReply?.(p)}}>↩️</button>
          {isAdmin && (<>
            <button className="tag" onClick={(e)=>{e.preventDefault();e.stopPropagation();onDeletePost?.(p)}}>🗑</button>
            {isBanned ? (
              <button className="tag" title="Снять бан" onClick={(e)=>{e.preventDefault();e.stopPropagation();onUnbanUser?.(p)}}>✅</button>
            ) : (
              <button className="tag" title="Забанить" onClick={(e)=>{e.preventDefault();e.stopPropagation();onBanUser?.(p)}}>⛔</button>
            )}
          </>)}
        </div>
      </div>
      <div className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{__html:rich(p.text||'')}} />
      <div className="mt-3"><ReactionStrip post={p} onReact={(emoji)=>onReact?.(p,emoji)} /></div>
    </article>
  )
}


/* =========================================================
   Основной компонент
========================================================= */
export default function Forum(){
  const { t } = useI18n()
  const toast = useToast()

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
  const requireAuth = async () => { const cur=readAuth(); if(cur?.asherId||cur?.accountId){ setAuth(cur); return cur } const r=await openAuth(); setAuth(r); return r }

  /* ---- локальный снап и очередь ---- */
  const [data,setData] = useState(()=>{
    if(!isBrowser()) return {topics:[],posts:[],bans:[],admins:[],cursor:null}
    try{ return JSON.parse(localStorage.getItem('forum:snap')||'null') || {topics:[],posts:[],bans:[],admins:[],cursor:null} }catch{ return {topics:[],posts:[],bans:[],admins:[],cursor:null} }
  })
  const persist = (patch) => setData(prev => {
    const next = typeof patch==='function' ? patch(prev) : ({...prev, ...patch})
    try{ localStorage.setItem('forum:snap', JSON.stringify(next)) }catch{}
    return next
  })
  const clientId = useMemo(()=>ensureClientId(),[])
  const [queue,setQueue] = useState(()=>{ if(!isBrowser()) return []; try{ return JSON.parse(localStorage.getItem('forum:queue')||'[]') }catch{return[]} })
  const saveQueue = q => { setQueue(q); try{ localStorage.setItem('forum:queue', JSON.stringify(q)) }catch{} }
  const pushOp = (type,payload) => saveQueue([ ...(queue||[]), { type, payload, opId:`${Date.now()}_${Math.random().toString(36).slice(2)}` } ])

  const busyRef=useRef(false), debRef=useRef(null)
  const sendBatch = (immediate=false) => {
    if(busyRef.current) return
    const run = async () => {
      const ops = queue||[]; if(ops.length===0) return
      busyRef.current = true
      try{
        const r = await api.mutate({ clientId, baseCursor:data.cursor||null, ops })
        if(r?.ok){
          if(r.full){
            persist({ topics:r.topics||[], posts:r.posts||[], bans:r.bans||[], admins:r.admins||[], cursor:r.cursor||null })
          }else if(r.delta){
            persist(prev=>mergeDelta(prev, r.delta, r.cursor))
          }
          saveQueue([])
        }
      }catch{}finally{ busyRef.current=false }
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

  const refresh = async (forceFull=false) => {
    try{
      const r = await api.snapshot(forceFull ? null : data.cursor)
      if(r?.ok){
        if(r.full){ persist(dedupeAll({ topics:r.topics||[], posts:r.posts||[], bans:r.bans||[], admins:r.admins||[], cursor:r.cursor||null })) }
        else if(r.delta){ persist(prev=>mergeDelta(prev, r.delta, r.cursor)) }
      }
    }catch{}
  }
  useEffect(()=>{ refresh(!data.cursor) },[]) // старт
  useEffect(()=>{ const id=setInterval(()=>refresh(false), 8000); return ()=>clearInterval(id) },[data.cursor])

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
  const r = await api.adminBanUser(p.accountId || p.userId)
  if (r?.ok) {
    toast.ok('User banned')
  } else {
    console.error('adminBanUser error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }
}
const unbanUser = async (p) => {
  if (!isAdmin) return
  const r = await api.adminUnbanUser(p.accountId || p.userId)
  if (r?.ok) {
    toast.ok('User unbanned')
  } else {
    console.error('adminUnbanUser error:', r)
    toast.err(r?.error || 'Admin endpoint error')
  }
}


  /* ---- выбор темы и построение данных ---- */
  const [sel, setSel] = useState(null)

  // все посты темы
  const allPosts = useMemo(()=> sel?.id ? (data.posts||[]).filter(p=>p.topicId===sel.id) : [], [data.posts, sel?.id])

  // корневые — новые сверху
  const rootPosts = useMemo(()=> allPosts.filter(p=>!p.parentId).sort((a,b)=>b.ts-a.ts), [allPosts])

  // индекс для быстрых ссылок
  const idMap = useMemo(()=> new Map(allPosts.map(p => [p.id, { ...p, children: [] }])), [allPosts])
  useEffect(()=>{
    // связываем детей после построения idMap
    idMap.forEach(node => {
      if(node.parentId && idMap.has(node.parentId)){
        idMap.get(node.parentId).children.push(node)
      }
    })
  },[idMap])

  // режим ветки: выбранный корневой пост
  const [threadRoot, setThreadRoot] = useState(null)
  useEffect(()=>{ setThreadRoot(null) },[sel?.id])

  // плоский вывод для рендера правой колонки:
  // - если threadRoot == null → выводим ТОЛЬКО корневые (без детей);
  // - если выбран корень → выводим весь поддеревом с отступами.
  const flat = useMemo(()=>{
    if(!sel?.id) return []
    if(!threadRoot){
      return rootPosts.map(r => ({ ...r, _lvl:0, repliesCount:(idMap.get(r.id)?.children||[]).length })) // без рекурсии
    }
    const start = idMap.get(threadRoot.id)
    if(!start) return []
    const out=[]
    const cnt=(n)=> (n.children||[]).reduce((a,ch)=>a+1+cnt(ch),0)
    const walk=(n,l=0)=>{ out.push({ ...n, _lvl:l, repliesCount:cnt(n) }); (n.children||[]).forEach(c=>walk(c,l+1)) }
    walk(start,0)
    return out
  },[sel?.id, threadRoot, rootPosts, idMap])

  /* ---- агрегаты по темам ---- */
    // Множество забаненных (по userId/accountId)
  const bannedSet = useMemo(() => new Set(data.bans || []), [data.bans])

  const aggregates = useMemo(()=>{
    const byTopic=new Map()
    for(const p of (data.posts||[])){
      const a = byTopic.get(p.topicId) || { posts:0, likes:0, dislikes:0, views:0 }
      a.posts += 1
      a.likes += (p.reactions?.['👍']||0)
      a.dislikes += (p.reactions?.['👎']||0)
      a.views += (p.views||0)
      byTopic.set(p.topicId, a)
    }
    return byTopic
  },[data.posts])

  /* ---- сортировка тем ---- */
  const [topicSort, setTopicSort] = useState('new') // new/top/likes/views/replies
  const sortedTopics = useMemo(()=>{
    const topics = [...(data.topics||[])]
    const score = (t) => {
      const agg = aggregates.get(t.id) || { posts:0, likes:0, dislikes:0, views:0 }
      if(topicSort==='new') return t.ts||0
      if(topicSort==='likes') return agg.likes
      if(topicSort==='views') return agg.views
      if(topicSort==='replies') return agg.posts
      return agg.likes*2 + agg.posts + Math.floor(agg.views*0.2)
    }
    return topics.sort((a,b)=>(score(b)-score(a)) || (b.ts-a.ts))
  },[data.topics,aggregates,topicSort])

  /* ---- composer ---- */
  const [text,setText] = useState('')
  const [replyTo,setReplyTo] = useState(null)

  const createTopic = async (title, description, first) => {
    const r = await requireAuth(); if(!r) return
    const uid = r.asherId || r.accountId || ''
    const prof = (()=>{ if(!isBrowser()) return {}; try{ return JSON.parse(localStorage.getItem('profile:'+uid)||'{}') }catch{return{}} })()
    const tmpT = `tmp_t_${now()}_${Math.random().toString(36).slice(2)}`
    const tmpP = `tmp_p_${now()}_${Math.random().toString(36).slice(2)}`
    const isAdm = isBrowser() && localStorage.getItem('ql7_admin')==='1'
    const t0 = { id:tmpT, title, description, ts:now(), userId:uid, nickname:prof.nickname||shortId(uid), icon:prof.icon||'👤', isAdmin:isAdm, views:0 }
    const p0 = { id:tmpP, topicId:tmpT, parentId:null, text:first, ts:now(), userId:uid, nickname:t0.nickname, icon:t0.icon, isAdmin:isAdm, reactions:{}, myReaction:null, views:0 }
    persist(prev => dedupeAll({ ...prev, topics:[t0, ...prev.topics], posts:[...prev.posts, p0] }))
    pushOp('create_topic', { title, description, text:first||'', profile:{ nickname:t0.nickname, icon:t0.icon }, isAdmin:isAdm })
    sendBatch(true)
    setSel(t0)
    toast.ok('Тема создана')
  }

  const createPost = async () => {
    const body = text.trim(); if(!body || !sel?.id) return
    const r = await requireAuth(); if(!r) return
    const uid = r.asherId || r.accountId || ''
    const prof = (()=>{ if(!isBrowser()) return {}; try{ return JSON.parse(localStorage.getItem('profile:'+uid)||'{}') }catch{return{}} })()
    const tmpId = `tmp_p_${now()}_${Math.random().toString(36).slice(2)}`
    const isAdm = isBrowser() && localStorage.getItem('ql7_admin')==='1'
    const p = { id:tmpId, topicId:sel.id, parentId:replyTo?.id||null, text:body, ts:now(), userId:uid, nickname:prof.nickname||shortId(uid), icon:prof.icon||'👤', isAdmin:isAdm, reactions:{}, myReaction:null, views:0 }
    persist(prev => dedupeAll({ ...prev, posts:[...prev.posts, p] }))
    pushOp('create_post', { topicId:sel.id, parentId:replyTo?.id||null, text:body, isAdmin:isAdm })
    sendBatch(true)
    setText(''); setReplyTo(null)
    toast.ok('Отправлено')
  }

  const reactMut = async (post, emoji) => {
    const r = await requireAuth(); if(!r) return
    const next = emoji // (или null)
    persist(prev=>{
      const map = new Map(prev.posts.map(x=>[x.id,x])); const p = { ...(map.get(post.id)||{}) }
      const was = p.myReaction || null; p.myReaction = next; p.reactions = { ...(p.reactions||{}) }
      if(was) p.reactions[was] = Math.max(0, (p.reactions[was]||0)-1)
      if(next) p.reactions[next] = (p.reactions[next]||0)+1
      map.set(post.id, p); return dedupeAll({ ...prev, posts: Array.from(map.values()) })
    })
    pushOp('react', { topicId: sel.id, postId: post.id, emoji: next }); sendBatch()
  }

  const markViewPost = (postId) => {
    if(!isBrowser()) return
    const uid = auth.asherId || auth.accountId || ''
    if(!uid || !postId) return
    const day = new Date().toISOString().slice(0,10)
    const key = `post:${postId}:viewed:${uid}:${day}`
    if(!localStorage.getItem(key)){ localStorage.setItem(key,'1'); pushOp('view_post', { postId }); sendBatch() }
  }
  useEffect(()=>{
    if(!sel?.id || !isBrowser()) return
    const day = new Date().toISOString().slice(0,10)
    const key = `topic:${sel.id}:viewed:${day}`
    if(!localStorage.getItem(key)){ localStorage.setItem(key,'1'); pushOp('view_topic', { topicId: sel.id }); sendBatch() }
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
      <Styles/>{toast.view}

      {/* шапка */}
      <section className="glass neon p-3" style={{ position:'relative', zIndex:40, overflow:'visible' }}>
        <div className="head" style={{ position:'relative', width:'100%' }}>
          <div style={{ position:'relative' }}>
            <button
              ref={avatarRef}
              className={cls('avaBig neon', (!nickShown || iconShown==='👤') && 'pulse')}
              title={nickShown || t('forum_account')}
              onClick={async()=>{
                const ok = await requireAuth(); if(!ok) return
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
                  const parent = p.parentId ? allPosts.find(x=>x.id===p.parentId) : null
                  return (
                    <div key={p.id} id={`post_${p.id}`} style={{ marginLeft: p._lvl*18 }}>
                      <PostCard
                        p={p}
                        parentAuthor={parent?.nickname || (parent ? shortId(parent.userId||'') : null)}
                        onReport={()=>toast.ok(t('forum_report_ok'))}
                        onReply={()=>setReplyTo(p)}
                        onOpenThread={(clickP)=>{ if(!threadRoot){ setThreadRoot(clickP) } }}
                        onReact={(emoji)=>reactMut(p,emoji)}
                        isAdmin={isAdmin}
                        onDeletePost={delPost}
                        onBanUser={banUser}
                        onUnbanUser={unbanUser}
                        isBanned={bannedSet.has(p.accountId || p.userId)}
                        authId={auth.asherId||auth.accountId}
                        markView={markViewPost}
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
                <textarea className="ta" value={text} onChange={e=>setText(e.target.value)} placeholder={t('forum_composer_placeholder')}/>
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
}

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
              <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder={t('forum_topic_title_ph')}/>
            </label>
            <label className="block">
              <div className="meta mb-1">{t('forum_topic_desc')}</div>
              <textarea className="ta" rows={3} value={descr} onChange={e=>setDescr(e.target.value)} placeholder={t('forum_topic_desc_ph')}/>
            </label>
            <label className="block">
              <div className="meta mb-1">{t('forum_topic_first_msg')}</div>
              <textarea className="ta" rows={6} value={first} onChange={e=>setFirst(e.target.value)} placeholder={t('forum_topic_first_msg_ph')}/>
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
        <div className="tag">{t('forum_markets_badge') || 'BTC'}</div>
      </div>
    </div>
  )
}
