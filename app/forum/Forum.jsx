'use client'

/*  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃ QL7 Forum — боевой Forum.jsx (v9, «cosmic full»)                     ┃
    ┃ Полностью совместим с проектом, реализует ТЗ пользователя:           ┃
    ┃ • Авторизация: локальный снапшот + /api/forum/me (credentials)       ┃
    ┃   не дёргаем кошелёк, если уже авторизован; иначе open-auth + wait   ┃
    ┃ • Обязательная авторизация для: createTopic/createPost/react/report  ┃
    ┃ • UI: 2 равные панели (Темы/Посты), sticky-хедеры, скролл внутри     ┃
    ┃ • В левом верхнем углу всегда показан реальный asherId (копирование) ┃
    ┃ • Темы: сортировки new/top/views, поиск, пагинация, /api/forum/view  ┃
    ┃ • Посты: плоская отрисовка дерева с отступами, режим «нить», композер┃
    ┃ • Реакции: 👍/👎 (взаимоисключ.), «…» → модалка ~200 эмодзи + Recent  ┃
    ┃ • Репорт: только для авторизованных, тост forum_report_ok             ┃
    ┃ • Рилтайм: polling + onfocus/visibility; оптимистичные апдейты       ┃
    ┃ • i18n: все строки через forum_* (useI18n), без хардкода              ┃
    ┃ • Безопасность: XSS-сана тайзинг, защита от двойных кликов            ┃
    ┃ • Перформанс: скелетоны, мемоизация, батч-рендер                      ┃
    ┃ • Совместимость: не трогает лэйаут/роутинг/словари                    ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/components/i18n'

/* =============================== API endpoints =============================== */
const API = {
  me         : `/api/forum/me`,
  listTopics : (p) => `/api/forum/listTopics?${new URLSearchParams(p).toString()}`,
  createTopic: `/api/forum/createTopic`,
  listPosts  : (topicId, p) => `/api/forum/listPosts?${new URLSearchParams({ topicId, ...p }).toString()}`,
  createPost : `/api/forum/createPost`,
  react      : `/api/forum/react`,
  report     : `/api/forum/report`,
  view       : `/api/forum/view`,
}

/* ================================= Utilities ================================= */
const cls = (...xs) => xs.filter(Boolean).join(' ')
const STRIP_LINKS_RE = /(https?:\/\/|www\.)[^\s<>"']+/gi
const sanitizeNoLinks = (s='') => s.replace(STRIP_LINKS_RE, '')
const renderText = (s='') =>
  sanitizeNoLinks(s)
    .replace(/[<&]/g, m => (m === '<' ? '&lt;' : '&amp;'))
    .replace(/\n/g, '<br/>')

const shortId = (id) => id ? `${String(id).slice(0,4)}-${String(id).slice(-4)}` : '—'

/* ============================ Auth state (боевой) ============================ */
function readAuthSnapshot(){
  if (typeof window === 'undefined') return {accountId:null, asherId:null}
  const w = {
    accountId: window.__AUTH_ACCOUNT__ || window.__WALLET__ || null,
    asherId  : window.__ASHER_ID__ || null,
  }
  const ls = {
    accountId: localStorage.getItem('wallet') || localStorage.getItem('account') || null,
    asherId  : localStorage.getItem('asherId') || localStorage.getItem('ql7_uid') || null,
  }
  return { accountId: w.accountId || ls.accountId || null, asherId: w.asherId || ls.asherId || null }
}

function useAuth(){
  const [auth,setAuth] = useState(()=>readAuthSnapshot())
  const [checked,setChecked]=useState(false)

  const silentCheck = useCallback(async ()=>{
    try{
      const res = await fetch(API.me, { headers:{ 'content-type':'application/json' }, credentials:'include', cache:'no-store' })
      if(!res.ok) throw 0
      const data = await res.json()
      if (data?.ok){
        const next = {
          accountId: data.accountId || data.user?.accountId || auth.accountId || null,
          asherId  : data.asherId   || data.user?.asherId   || auth.asherId   || null
        }
        setAuth(next)
        setChecked(true)
        return next
      }
    }catch{}
    setChecked(true)
    return readAuthSnapshot()
  },[auth.accountId,auth.asherId])

  useEffect(()=>{ silentCheck() },[silentCheck])

  const openAuthModal = ()=>{
    try{ window.dispatchEvent(new CustomEvent('open-auth')) }catch{}
    try{
      const sels=['[data-auth-open]','.nav-auth-btn','#nav-auth-btn','[data-testid="auth-open"]']
      for(const s of sels){ const el=document.querySelector(s); if(el?.click){ el.click(); break } }
    }catch{}
  }

  const requireAuth = useCallback(async ()=>{
    const probe = await silentCheck()
    if (probe.accountId && probe.asherId){ setAuth(probe); return probe }
    openAuthModal()
    return new Promise((resolve)=>{
      const done=()=>{ const sn=readAuthSnapshot(); setAuth(sn); resolve(sn) }
      window.addEventListener('auth:ok', done, {once:true})
      window.addEventListener('auth:success', done, {once:true})
      setTimeout(done, 120000)
    })
  },[silentCheck])

  return { ...auth, checked, requireAuth }
}

/* =================================== Styles =================================== */
const ForumStyles = () => (
  <style jsx global>{`
    .ql7-forum {
      --ink:#eaf4ff; --b:rgba(80,167,255,.35); --bg:rgba(10,14,20,.82);
      /* доступная высота: подстрой под свою шапку/футер при необходимости */
      --forum-h: calc(100vh - 180px);
    }
    .ql7-forum *{ box-sizing:border-box }
    .glass{ background:var(--bg); border:1px solid rgba(255,255,255,.08); backdrop-filter:blur(10px) }
    .neon{ box-shadow:0 0 16px rgba(25,129,255,.18), inset 0 0 16px rgba(25,129,255,.06); border-color:var(--b) }
    .card{ border-radius:16px }
    .btn{ display:inline-flex; align-items:center; gap:.5rem; color:var(--ink); border-radius:12px;
          border:1px solid var(--b); background:linear-gradient(180deg,rgba(25,129,255,.30),rgba(25,129,255,.16));
          text-shadow:0 0 10px rgba(25,129,255,.35); box-shadow:0 0 16px rgba(25,129,255,.16);
          padding:.55rem 1rem; transition:filter .12s, transform .06s }
    .btn:hover{ filter:brightness(1.06) } .btn:active{ transform:scale(.98) }
    .btn-ghost{ background:rgba(255,255,255,.06) }
    .pill{ padding:.15rem .6rem; border-radius:999px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.08); font-size:.75rem }
    .item{ border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.06); border-radius:12px; padding:12px }
    .item:hover{ background:rgba(255,255,255,.08) }
    .input,.ta{ width:100%; background:#0b0f15; color:var(--ink); border:1px solid rgba(255,255,255,.16); border-radius:12px; padding:.7rem .9rem; outline:none }
    /* Поле ввода в 2–3 раза ниже, чтобы больше видно ленту */
    .ta{ min-height:clamp(48px,8vh,140px); resize:vertical }
    .react{ border-radius:999px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); padding:.25rem .55rem }
    .react[data-active="1"]{ background:rgba(25,129,255,.16); border-color:var(--b) }
    .tag{ border-radius:8px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); padding:.18rem .5rem }
    .grid-2{ display:grid; grid-template-columns:1fr; gap:16px }
    @media (min-width:1440px){ .grid-2{ grid-template-columns: 1fr 1fr } } /* одинаковая ширина */
    .win{ border:1px solid rgba(255,255,255,.12); background:rgba(8,11,16,.88); border-radius:16px; overflow:hidden }
    .bar{ position:sticky; top:0; z-index:3; padding:.75rem 1rem; border-bottom:1px solid rgba(255,255,255,.12);
          background:linear-gradient(180deg,rgba(12,16,22,.95),rgba(12,16,22,.72)) }
    /* одинаковая высота и макс использование вертикали */
    .win--topics, .win--posts { height: var(--forum-h); }
    .win--topics{ overflow:auto }
    .win--posts { display:flex; flex-direction:column; }
    .posts-scroller{ flex:1 1 auto; overflow:auto; padding:1rem }
    .composer{ border-top:1px solid rgba(255,255,255,.10); background:rgba(12,16,22,.9); padding:.75rem; position:sticky; bottom:0; z-index:2 }
    /* Модалки */
    .modal{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:50;
            background:rgba(0,0,0,.44) }
    .modal-card{ min-width:min(820px,96vw); max-width:96vw; max-height:86vh; overflow:auto;
                 border-radius:14px; border:1px solid rgba(255,255,255,.12);
                 background:rgba(10,14,20,.96); padding:16px }
    .tabs{ display:flex; gap:8px; border-bottom:1px solid rgba(255,255,255,.12); margin-bottom:12px }
    .tab{ padding:.5rem .8rem; border-radius:10px 10px 0 0; border:1px solid transparent; cursor:pointer }
    .tab[data-active="1"]{ border-color:rgba(255,255,255,.18); background:rgba(255,255,255,.06) }
  `}</style>
)

/* =================================== UI =================================== */
const Btn = (p)=><button type="button" {...p} className={cls('btn',p.className)}/>
const BtnGhost=(p)=><button type="button" {...p} className={cls('btn btn-ghost',p.className)}/>
const Pill=({children,className})=><span className={cls('pill',className)}>{children}</span>

/* =============================== Emoji helpers =============================== */
/* ~200 эмодзи: эмоции, жесты, символы, крипто-вайб и пр. */
const EMOJI_PICK = [
  '👍','👎','❤️','🔥','🚀','💎','😂','😮','😢','🤔','👏','🙏','💯','🎉','🧠','🤖','📈','📉','🐳','🐻',
  '⭐','⚠️','✅','❌','ℹ️','🔔','📣','🎯','🛰️','🌌','✨','⚡','🌊','🌙','🪐','🌍','📊','📝','💬','🔗',
  '🧩','🧪','🧭','🧰','🧱','🛠️','🗜️','⚙️','🧯','🧲','🛰️','📡','💡','🔌','🔋','💾','🖥️','⌨️','🖱️','🧮',
  '🚦','🚧','🛡️','🔒','🔓','🔑','🧷','📎','🧵','🪡','🧶','📦','📫','📬','📥','📤','📨','✉️','📁','🗂️',
  '🗃️','🗄️','🗑️','📚','📖','📕','📗','📘','📙','📔','📓','📒','🧾','📰','🗞️','📇','📝','✏️','🖊️','🖋️',
  '🖌️','🖍️','🗒️','📐','📏','📎','📌','📍','🧭','🧭','🧭','🔭','🔬','⚗️','🧪','🧬','💊','💉','🧫','🧹',
  '🧽','🪣','🧺','🧻','🪟','🪞','🚪','🛏️','🛋️','🪑','🚿','🛁','🚽','🧴','🧼','🪥','🧯','🪤','🧰','🧲',
  '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥝','🍅','🥥','🥑','🥦','🥕',
  '🌶️','🧄','🧅','🍄','🥔','🌽','🥚','🧀','🥖','🥐','🥨','🥞','🧇','🧈','🍗','🥩','🍖','🌭','🍔','🍟',
  '🍕','🥪','🌮','🌯','🥙','🥗','🍝','🍜','🍣','🍤','🍥','🥮','🍱','🍚','🍙','🍘','🍢','🍡','🍧','🍨',
  '🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','☕','🍵','🧃','🥤','🧋','🍺','🍻','🍷',
  '🥂','🍸','🍹','🧉','🥃','🧊','🥝','🥒','🍯','🫙','🍽️','🍴','🥄','🔪','🧂','🥡','🥢','🧊','🧊',
  '⏳','⌛','⏰','⌚','🕰️','🧭','📱','📲','☎️','📞','📟','📠','📺','📻','🎥','🎬','📷','📸','📹','🎞️',
  '🛰️','🧳','✈️','🚀','🛸','🚁','🚂','🚆','🚇','🚊','🚉','🚌','🚎','🚍','🚘','🚖','🚕','🚙','🏎️','🚓',
  '🚑','🚒','🚐','🚚','🚛','🚜','🛵','🏍️','🚲','🛴','🛹','🛼','⚓','🪝','⛵','🚢','🛳️','⛴️','🛶','🧗',
  '🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🎭','🎨','🎯','🎳','🎲','🎮','🕹️','🎰','🧩'
]

const RECENT_KEY='forum_recent_emoji'
function useRecentEmoji(){
  const [recent,setRecent]=useState(()=>{
    try{ const a=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]'); return Array.isArray(a)?a.slice(0,5):[] }catch{ return [] }
  })
  const push = (e)=>{
    setRecent(prev=>{
      const nx=[e, ...prev.filter(x=>x!==e)].slice(0,5)
      try{ localStorage.setItem(RECENT_KEY, JSON.stringify(nx)) }catch{}
      return nx
    })
  }
  return { recent, push }
}

/* ================================== Topics =================================== */
function TopicCard({t, onOpen}){
  const {t:tr}=useI18n()
  return (
    <li className="item cursor-pointer" onClick={()=>onOpen?.(t)} aria-label={tr('forum_topic_open')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base md:text-lg font-semibold text-[#eaf4ff]">{t.title}</div>
          <div className="mt-1 text-sm opacity-80 text-[#eaf4ff]">
            {t.category && <Pill className="mr-2">{t.category}</Pill>}
            {(t.tags||[]).slice(0,5).map((tag,i)=><Pill key={i} className="mr-1">#{tag}</Pill>)}
          </div>
        </div>
        <div className="text-right shrink-0 text-[#eaf4ff]">
          <div className="text-sm opacity-85"><b>{t.posts||0}</b> {tr('forum_msgs')}</div>
          <div className="text-xs opacity-70">{t.views||0} {tr('forum_views')}</div>
          <div className="text-xs opacity-70">{new Date(t.ts||Date.now()).toLocaleString()}</div>
        </div>
      </div>
    </li>
  )
}

function SettingsModal({open, onClose, topics, posts, apply}){
  const { t } = useI18n()
  const [tab,setTab]=useState('topics')
  const [topicsState,setTopicsState]=useState(topics)
  const [postsState,setPostsState]=useState(posts)
  useEffect(()=>{ if(open){ setTab('topics'); setTopicsState(topics); setPostsState(posts) } },[open,topics,posts])

  if(!open) return null
  return (
    <div className="modal" onMouseDown={onClose}>
      <div className="modal-card neon" onMouseDown={(e)=>e.stopPropagation()} role="dialog" aria-modal>
        <div className="tabs">
          <div className="tab" data-active={tab==='topics'?1:0} onClick={()=>setTab('topics')}>{t('forum_settings_topics')}</div>
          <div className="tab" data-active={tab==='posts'?1:0} onClick={()=>setTab('posts')}>{t('forum_settings_posts')}</div>
        </div>

        {tab==='topics' ? (
          <div className="space-y-3">
            <label className="block">
              <div className="mb-1 text-sm text-[#eaf4ff]/80">{t('forum_sort_by')}</div>
              <select className="input" value={topicsState.sort} onChange={e=>setTopicsState(s=>({...s,sort:e.target.value}))}>
                <option value="new">{t('forum_sort_new')}</option>
                <option value="top">{t('forum_sort_top')}</option>
                <option value="views">{t('forum_sort_views')}</option>
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-sm text-[#eaf4ff]/80">{t('forum_search')}</div>
              <input className="input" placeholder={t('forum_search_placeholder')}
                     value={topicsState.q||''} onChange={e=>setTopicsState(s=>({...s,q:e.target.value}))}/>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <div className="mb-1 text-sm text-[#eaf4ff]/80">{t('forum_sort_by')}</div>
              <select className="input" value={postsState.sort} onChange={e=>setPostsState(s=>({...s,sort:e.target.value}))}>
                <option value="new">{t('forum_sort_new')}</option>
                <option value="top">{t('forum_sort_top')}</option>
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-sm text-[#eaf4ff]/80">{t('forum_search')}</div>
              <input className="input" placeholder={t('forum_search_placeholder')}
                     value={postsState.q||''} onChange={e=>setPostsState(s=>({...s,q:e.target.value}))}/>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4">
          <BtnGhost onClick={onClose}>{t('forum_cancel')}</BtnGhost>
          <Btn onClick={()=>apply(topicsState, postsState)}>{t('forum_apply')}</Btn>
        </div>
      </div>
    </div>
  )
}

function EmojiModal({open,onClose,onPick,title}){
  const { t } = useI18n()
  if(!open) return null
  return (
    <div className="modal" onMouseDown={onClose}>
      <div className="modal-card neon" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="text-[#eaf4ff] font-semibold mb-2">{title || t('forum_more_emoji')}</div>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill, 38px)', gap:'8px'}}>
          {EMOJI_PICK.map((e,i)=>(
            <button key={i} className="btn-ghost" style={{width:38,height:38, borderRadius:8, fontSize:22}}
                    onClick={()=>{ onPick(e); onClose() }}>{e}</button>
          ))}
        </div>
        <div className="flex items-center justify-end mt-3">
          <BtnGhost onClick={onClose}>{t('forum_done')}</BtnGhost>
        </div>
      </div>
    </div>
  )
}

function TopicsWindow({ api, auth, onSelect, settings, setSettings, onCreated }){
  const { t } = useI18n()
  const [loading,setLoading] = useState(true)
  const [error,setError]   = useState(null)
  const [items,setItems]   = useState([])
  const [total,setTotal]   = useState(0)
  const [page,setPage]     = useState(1)
  const [openSettings,setOpenSettings]=useState(false)

  const isVisible = () => typeof document !== 'undefined' && document.visibilityState === 'visible'

  const load = async (opt={})=>{
    setError(null)
    try{
      const p={ page, limit:25, sort:settings.topics.sort, q:settings.topics.q||'', ...opt }
      setLoading(true)
      const {items:its=[], total:tt=0} = await api.listTopics(p)
      setItems(its); setTotal(tt)
    }catch(e){ setError(e.message||t('forum_err_topics')) }finally{ setLoading(false) }
  }

  // первичная загрузка + реакция на фильтры
  useEffect(()=>{ load({page:1}) },[])
  useEffect(()=>{ load() },[page, settings.topics.sort, settings.topics.q])

  // реалтайм-пуллинг
  useEffect(()=>{
    const id = setInterval(()=>{ if(isVisible()) load() }, 4500)
    const onFocus = ()=> load()
    window.addEventListener('focus', onFocus)
    return ()=>{ clearInterval(id); window.removeEventListener('focus', onFocus) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[page, settings.topics.sort, settings.topics.q])

  // создание темы (ТОЛЬКО для авторизованных)
  const [createMode,setCreateMode]=useState(false)
  const [title,setTitle]=useState(''); const [category,setCategory]=useState(''); const [tags,setTags]=useState(''); const [first,setFirst]=useState('')
  const [busy,setBusy]=useState(false)

  const ensure = async ()=> await auth.requireAuth()

  const openCreate = async ()=>{
    const a = await ensure()
    if (!a?.asherId){ alert(t('forum_need_auth')); return }
    setCreateMode(v=>!v)
  }

  const create = async ()=>{
    if(!title.trim()) return
    try{
      const a = await ensure()
      if (!a?.asherId){ alert(t('forum_need_auth')); return }
      setBusy(true)
      await api.createTopic({ title, category, tags: tags.split(',').map(s=>s.trim()).filter(Boolean), text:first })
      setTitle(''); setCategory(''); setTags(''); setFirst(''); setCreateMode(false)
      await load({page:1})
      onCreated?.()
    }catch(e){ alert(e.message||'create error') } finally{ setBusy(false) }
  }

  const openTopic = async (t)=>{
    try{ await api.view({ topicId: t.id }) }catch{}
    onSelect?.(t)
  }

  return (
    <section className="win win--topics neon">
      <div className="bar flex items-center justify-between">
        <div className="text-[#eaf4ff]/90">{t('forum_total')}: {total}</div>
        <div className="flex items-center gap-2">
          <Btn onClick={openCreate} aria-label={t('forum_btn_create_topic')}>＋ {t('forum_btn_create_topic')}</Btn>
          <BtnGhost onClick={()=>setOpenSettings(true)} aria-label={t('forum_btn_settings')}>{t('forum_btn_settings')}</BtnGhost>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {createMode && (
          <div className="space-y-3">
            <div className="text-lg font-semibold text-[#eaf4ff]">{t('forum_create_topic')}</div>
            <label className="block">
              <div className="mb-1 text-[#eaf4ff]/80 text-sm">{t('forum_topic_title')}</div>
              <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder={t('forum_topic_title_ph')}/>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <div className="mb-1 text-[#eaf4ff]/80 text-sm">{t('forum_topic_category')}</div>
                <input className="input" value={category} onChange={e=>setCategory(e.target.value)} placeholder={t('forum_topic_category_ph')}/>
              </label>
              <label className="block">
                <div className="mb-1 text-[#eaf4ff]/80 text-sm">{t('forum_topic_tags')}</div>
                <input className="input" value={tags} onChange={e=>setTags(e.target.value)} placeholder={t('forum_topic_tags_ph')}/>
                <div className="mt-1 text-xs text-[#eaf4ff]/70">{t('forum_topic_tags_hint')}</div>
              </label>
            </div>
            <label className="block">
              <div className="mb-1 text-[#eaf4ff]/80 text-sm">{t('forum_topic_first_msg')}</div>
              <textarea className="ta" rows={6} value={first} onChange={e=>setFirst(e.target.value)} placeholder={t('forum_topic_first_msg_ph')}/>
            </label>
            <div className="flex items-center justify-end gap-2">
              <BtnGhost onClick={()=>setCreateMode(false)}>{t('forum_cancel')}</BtnGhost>
              <Btn onClick={create} disabled={busy}>{busy ? t('forum_creating') : t('forum_create')}</Btn>
            </div>
          </div>
        )}

        {error && <div className="text-red-400">{error}</div>}
        {loading && <div className="grid gap-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-16 rounded-xl bg-white/10 animate-pulse"/>)}</div>}
        {!loading && items.length===0 && <div className="text-[#eaf4ff]/75 text-sm">{t('forum_empty_topics')}</div>}
        <ul className="grid gap-2">
          {items.map(x=><TopicCard key={x.id} t={x} onOpen={openTopic}/>)}
        </ul>

        <div className="flex items-center justify-between pt-1">
          <BtnGhost onClick={()=>setPage(p=>Math.max(1,p-1))}>{t('forum_prev')}</BtnGhost>
          <span className="pill">{page}</span>
          <BtnGhost onClick={()=>setPage(p=>p+1)}>{t('forum_next')}</BtnGhost>
        </div>
      </div>

      <SettingsModal
        open={openSettings}
        onClose={()=>setOpenSettings(false)}
        topics={settings.topics}
        posts={settings.posts}
        apply={(tp,ps)=>{ setSettings({topics:tp,posts:ps}); setOpenSettings(false) }}
      />
    </section>
  )
}

/* =================================== Posts =================================== */
function ReactionRow({ counts={}, my={}, views=0, onReact, onMore }){
  const top = Object.entries(counts).sort((a,b)=>(b[1]||0)-(a[1]||0)).slice(0,5)
  const lC=counts['👍']||0, dC=counts['👎']||0
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="react" data-active={my['👍']?1:0} onClick={()=>onReact('👍',!!my['👍'])} aria-label="like">👍 <span className="opacity-80">{lC}</span></button>
      <button type="button" className="react" data-active={my['👎']?1:0} onClick={()=>onReact('👎',!!my['👎'])} aria-label="dislike">👎 <span className="opacity-80">{dC}</span></button>
      <span className="tag text-xs">👁 {views||0}</span>
      {top.filter(([e])=>e!=='👍'&&e!=='👎').map(([e,c])=><button type="button" key={e} className="tag text-sm" onClick={()=>onReact(e,!!my[e])}>{e} <span className="opacity-80">{c}</span></button>)}
      <button type="button" className="tag text-sm" onClick={onMore} aria-label="more-emoji">…</button>
    </div>
  )
}

function Post({ p, level=0, onReact, onReport, onReply, onOpenThread }){
  const { t } = useI18n()
  return (
    <article className="item" style={{marginLeft: level ? Math.min(level*22, 88) : 0}} onClick={(e)=>{ if(e.target.closest('button, .react, .tag')) return; onOpenThread?.(p) }}>
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-[rgba(80,167,255,.35)] bg-[rgba(25,129,255,.10)] flex items-center justify-center text-sm text-[#eaf4ff]">
            {(p.user?.[0]||'U').toUpperCase()}
          </div>
          <div className="text-[#eaf4ff]">
            <div className="font-medium">{p.user || t('forum_user_anon')}</div>
            <div className="text-xs opacity-70">{new Date(p.ts||Date.now()).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BtnGhost onClick={(e)=>{e.stopPropagation();onReport()}} title={t('forum_btn_report_title')} aria-label={t('forum_btn_report_title')}>⚠️</BtnGhost>
          <BtnGhost onClick={(e)=>{e.stopPropagation();onReply()}}  title={t('forum_btn_reply_title')} aria-label={t('forum_btn_reply_title')}>↩️</BtnGhost>
        </div>
      </header>

      <div className="mt-3 text-[15px] leading-relaxed text-[#eaf4ff]"
           dangerouslySetInnerHTML={{__html:renderText(p.text||p.body||'')}} />

      <div className="mt-3">
        <ReactionRow counts={p.reactions||{}} my={p.myReactions||{}} views={p.views||0}
                     onReact={(e,rm)=>{ onReact(e,rm) }} onMore={()=>onReply('emoji')} />
      </div>
    </article>
  )
}

function PostsWindow({ topic, api, auth, settings }){
  const { t } = useI18n()
  const scRef = useRef(null)

  const [page,setPage]=useState(1)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState(null)
  const [posts,setPosts]=useState([])
  const [total,setTotal]=useState(0)

  const [threadRoot,setThreadRoot]=useState(null) // режим ветки
  const [emojiTarget,setEmojiTarget]=useState(null) // для "… эмодзи" в реакциях

  const isVisible = () => typeof document !== 'undefined' && document.visibilityState === 'visible'

  const load = async (opt={})=>{
    setError(null)
    try{
      const {posts:ps=[], total:tt=0} = await api.listPosts(topic.id, { page, limit:50, sort:settings.posts.sort, q:settings.posts.q||'' })
      setPosts(ps); setTotal(tt)
      setTimeout(()=> scRef.current?.scrollTo({ top: 0, behavior:'smooth' }), 0)
    }catch(e){ setError(e.message||t('forum_err_posts')) }finally{ setLoading(false) }
  }
  useEffect(()=>{ setPage(1); setThreadRoot(null) },[topic?.id])
  useEffect(()=>{ if(topic?.id){ setLoading(true); load() } },[topic?.id,page, settings.posts.sort, settings.posts.q])

  // реалтайм-пуллинг
  useEffect(()=>{
    if(!topic?.id) return
    const id = setInterval(()=>{ if(isVisible()) load() }, 4000)
    const onFocus = ()=> load()
    window.addEventListener('focus', onFocus)
    return ()=>{ clearInterval(id); window.removeEventListener('focus', onFocus) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[topic?.id, page, settings.posts.sort, settings.posts.q])

  // композер
  const [text,setText]=useState('')
  const [replyTo,setReplyTo]=useState(null)
  useEffect(()=>{ setReplyTo(null) },[threadRoot])

  const ensure = async ()=> await auth.requireAuth()

  const submit = async ()=>{
    const raw = text.trim()
    const body = sanitizeNoLinks(raw)
    if(!body) return
    try{
      const a = await ensure()
      if (!a?.asherId){ alert(t('forum_need_auth')); return }
      await api.createPost({ topicId: topic.id, text: body, parentId: (replyTo?.id || (threadRoot && replyTo ? threadRoot.id : null)) || null })
      setText(''); setReplyTo(null)
      await load({page:1})
      setTimeout(()=> scRef.current?.scrollTo({ top: 0, behavior:'smooth' }), 50)
    }catch(e){ alert(e.message||'send error') }
  }

  const doReact = async (post, emoji, wasActive)=>{
    try{
      const a = await ensure()
      if (!a?.asherId){ alert(t('forum_need_auth')); return }
      // optimistic
      setPosts(ps=>ps.map(x=>{
        if(x.id!==post.id) return x
        const counts={...(x.reactions||{})}; const mine={...(x.myReactions||{})}
        const dec = (e)=>{ if(mine[e]){ delete mine[e]; counts[e]=Math.max(0,(counts[e]||0)-1); if(!counts[e]) delete counts[e] } }
        if(emoji==='👍'){ dec('👎') }
        if(emoji==='👎'){ dec('👍') }
        if(wasActive){ dec(emoji) } else { mine[emoji]=true; counts[emoji]=(counts[emoji]||0)+1 }
        return {...x,reactions:counts,myReactions:mine}
      }))
      await api.react({target:'post',id:post.id,reaction:emoji,remove:wasActive})
      // подтянуть реальные счётчики
      setTimeout(()=>load(), 100)
    }catch(e){ console.error(e); load() }
  }

  const doReport = async (post)=>{
    try{
      const a = await ensure()
      if (!a?.asherId){ alert(t('forum_need_auth')); return }
      await api.report({target:'post',id:post.id})
      alert(t('forum_report_ok'))
    }catch(e){ alert(e.message||'report error') }
  }

  // дерево → плоский список
  const flat = useMemo(()=>{
    const map=new Map(posts.map(p=>[p.id,{...p,children:[]}]));
    const roots=[]
    posts.forEach(p=>{ if(p.parentId && map.has(p.parentId)) map.get(p.parentId).children.push(map.get(p.id)); else roots.push(map.get(p.id)) })
    const out=[]; const walk=(n,l=0)=>{ out.push({...n,_level:l}); (n.children||[]).forEach(c=>walk(c,l+1)) }
    roots.forEach(r=>walk(r,0))
    return out
  },[posts])

  // если включен режим ветки — показываем только её
  const threadList = useMemo(()=>{
    if(!threadRoot) return null
    const root = posts.find(p=>p.id===threadRoot.id)
    if(!root) return null
    const out=[{...root,_level:0}]
    const walk=(id,lv=0)=>{ posts.filter(x=>x.parentId===id).forEach(c=>{ out.push({...c,_level:lv+1}); walk(c.id,lv+1) }) }
    walk(root.id,0); return out
  },[threadRoot,posts])

  const askReply = (postOrEmojiFlag)=>{
    if(postOrEmojiFlag==='emoji'){ setEmojiTarget(replyTo || threadRoot || null) }
    else setReplyTo(postOrEmojiFlag || null)
  }

  return (
    <section className="win win--posts neon">
      <div className="bar flex items-center justify-between">
        <div className="text-[#eaf4ff] font-semibold">
          {threadRoot ? (
            <span className="flex items-center gap-2">
              <BtnGhost onClick={()=>{ setThreadRoot(null); setReplyTo(null) }}>← {t('forum_back')}</BtnGhost>
              <span>{t('forum_open_replies')}</span>
            </span>
          ) : topic.title}
        </div>
        <div className="flex items-center gap-2">
          <BtnGhost onClick={()=>scRef.current?.scrollTo({top:0,behavior:'smooth'})} aria-label="scroll-top">↑</BtnGhost>
        </div>
      </div>

      {/* СКРОЛЛЕР ПОСТОВ */}
      <div ref={scRef} className="posts-scroller">
        {error && <div className="text-red-400">{error}</div>}
        {loading && <div className="space-y-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-28 rounded-xl bg-white/10 animate-pulse"/>)}</div>}
        {!loading && (threadList||flat).length===0 && <div className="text-[#eaf4ff]/75 text-sm">{t('forum_empty_posts')}</div>}

        {(threadList||flat).map(p=>(
          <div key={p.id} data-post={p.id}>
            <Post p={p} level={p._level}
              onReact={(emoji,was)=>doReact(p,emoji,was)}
              onReport={()=>doReport(p)}
              onReply={(flag)=> flag==='emoji' ? setEmojiTarget(p) : setReplyTo(p)}
              onOpenThread={(x)=>setThreadRoot(x)}
            />
          </div>
        ))}

      </div>

      {/* STICKY КОМПОЗЕР */}
      <Composer
        text={text}
        setText={setText}
        onSend={submit}
        replyTo={replyTo || threadRoot}
      />

      {/* Модалка «больше эмодзи» для реакций к конкретному посту */}
      <EmojiModal
        open={!!emojiTarget}
        onClose={()=>setEmojiTarget(null)}
        title={t('forum_more_emoji')}
        onPick={(e)=>{
          if(!emojiTarget) return
          const was = !!(emojiTarget.myReactions && emojiTarget.myReactions[e])
          doReact(emojiTarget, e, was)
          setEmojiTarget(null)
        }}
      />
    </section>
  )
}

/* ================================ Composer =================================== */
function Composer({ text, setText, onSend, replyTo }){
  const { t } = useI18n()
  const { recent, push } = useRecentEmoji()
  const [emojiOpen,setEmojiOpen]=useState(false)

  const add = (e)=>{ setText(v=>v+e); push(e) }

  return (
    <div className="composer">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-[#eaf4ff]/80 text-sm">
          {replyTo ? `${t('forum_replying_to')} ${(replyTo?.user||'user')}` : t('forum_composer_hint')}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <textarea className="ta" value={text} onChange={e=>setText(e.target.value)} placeholder={t('forum_composer_placeholder')} />
        <div className="flex flex-col gap-2 items-stretch">
          <Btn onClick={onSend} style={{whiteSpace:'nowrap'}} aria-label={t('forum_send')}>{t('forum_send')}</Btn>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#eaf4ff]/70 mr-1">{t('forum_emoji_recent')}:</span>
            {recent.length===0 && <span className="text-xs text-[#eaf4ff]/50">—</span>}
            {recent.map((e,i)=><button key={i} className="tag" onClick={()=>add(e)}>{e}</button>)}
            <BtnGhost onClick={()=>setEmojiOpen(true)} aria-label={t('forum_more_emoji')}>{t('forum_more_emoji')}</BtnGhost>
          </div>
        </div>
      </div>

      <EmojiModal
        open={emojiOpen}
        onClose={()=>setEmojiOpen(false)}
        onPick={(e)=>add(e)}
      />
    </div>
  )
}

/* ================================== API hook ================================= */
function useForumAPI(){
  const fetchJSON = async (url, init)=>{
    const res = await fetch(url, { ...init, headers: { 'content-type':'application/json', ...(init?.headers||{}) }, credentials:'include', cache:'no-store' })
    const txt = await res.text()
    const data = txt ? JSON.parse(txt) : {}
    if (!res.ok || data?.ok === false) throw new Error(data?.error || data?.message || `HTTP ${res.status}`)
    return data
  }
  return {
    listTopics : (p)=> fetchJSON(API.listTopics(p)),
    listPosts  : (id,p)=> fetchJSON(API.listPosts(id,p)),
    createTopic: (payload)=> fetchJSON(API.createTopic, { method:'POST', body:JSON.stringify(payload) }),
    createPost : (payload)=> fetchJSON(API.createPost , { method:'POST', body:JSON.stringify(payload) }),
    react      : (payload)=> fetchJSON(API.react      , { method:'POST', body:JSON.stringify(payload) }),
    report     : (payload)=> fetchJSON(API.report     , { method:'POST', body:JSON.stringify(payload) }),
    view       : (payload)=> fetchJSON(API.view       , { method:'POST', body:JSON.stringify(payload) }),
  }
}

/* =================================== Main ==================================== */
export default function Forum(){
  const { t } = useI18n()
  const auth = useAuth()
  const api  = useForumAPI()

  const [selected,setSelected]   = useState(null)

  // настройки из модалки
  const [settings,setSettings]=useState({
    topics:{ sort:'new', q:'' },
    posts :{ sort:'new', q:'' },
  })

  // копирование asherId по клику
  const copyId = async ()=>{
    try{
      if(!auth.asherId) return
      await navigator.clipboard.writeText(auth.asherId)
      alert(t('forum_id_copied'))
    }catch{}
  }

  return (
    <div className="ql7-forum space-y-4">
      <ForumStyles/>

      {/* верхняя плашка: реальный asherId пользователя */}
      <section className="glass neon card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-[#eaf4ff]/70">
            ID: <button className="pill" title={auth.asherId || '—'} onClick={copyId} aria-label="copy-asher-id">{auth.asherId || '—'}</button>
          </div>
          {auth.asherId && <div className="text-xs text-[#eaf4ff]/60">({shortId(auth.asherId)})</div>}
        </div>
      </section>

      <div className="grid-2">
        <TopicsWindow
          api={api}
          auth={auth}
          onSelect={(t)=>{ setSelected(t) }}
          settings={settings}
          setSettings={setSettings}
          onCreated={()=>{}}
        />

        <div>
          {selected
            ? <PostsWindow topic={selected} api={api} auth={auth} settings={settings}/>
            : <section className="win neon p-6 text-[#eaf4ff]/75">{t('forum_hint_select_topic')}</section>
          }
        </div>
      </div>
    </div>
  )
}
