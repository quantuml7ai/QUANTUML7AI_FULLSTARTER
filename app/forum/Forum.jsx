'use client'

/*  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃ QL7 Forum — боевой Forum.jsx (v10 «anchored-emoji + ban + strict auth») ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/components/i18n'

/* ================================== API ================================== */
const API = {
  me         : `/api/forum/me`,
  listTopics : p => `/api/forum/listTopics?${new URLSearchParams(p)}`,
  createTopic: `/api/forum/createTopic`,
  listPosts  : (topicId, p) => `/api/forum/listPosts?${new URLSearchParams({ topicId, ...p })}`,
  createPost : `/api/forum/createPost`,
  react      : `/api/forum/react`,
  report     : `/api/forum/report`,
  view       : `/api/forum/view`,
}

/* ================================ Helpers ================================ */
const cls = (...xs) => xs.filter(Boolean).join(' ')
const STRIP_LINKS = /(https?:\/\/|www\.)[^\s<>"']+/gi
const sanitizeNoLinks = (s='') => s.replace(STRIP_LINKS, '')
const renderText = (s='') =>
  sanitizeNoLinks(s)
    .replace(/[<&]/g, m => (m === '<' ? '&lt;' : '&amp;'))
    .replace(/\n/g, '<br/>')
const shortId = (id) => id ? `${String(id).slice(0,4)}-${String(id).slice(-4)}` : '—'

/* ============================== Auth snapshot ============================== */
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
  const [auth,setAuth] = useState(()=>({ ...readAuthSnapshot(), banned:false }))
  const [checked,setChecked]=useState(false)

  const silentCheck = useCallback(async ()=>{
    try{
      const res = await fetch(API.me, { credentials:'include', cache:'no-store' })
      const data = await res.json().catch(()=> ({}))
      if (res.ok && data?.ok){
        const next = {
          accountId: data.accountId || data.user?.accountId || auth.accountId || null,
          asherId  : data.asherId   || data.user?.asherId   || auth.asherId   || null,
          banned   : !!(data.banned || data.user?.banned)
        }
        setAuth(next); setChecked(true); return next
      }
    }catch{}
    const snap = { ...readAuthSnapshot(), banned:false }
    setAuth(snap); setChecked(true); return snap
  },[auth.accountId,auth.asherId])

  useEffect(()=>{ silentCheck() },[silentCheck])

  // реагируем на глобальные события выхода/входа
  useEffect(()=>{
    const onLogout = ()=>{ const s = { accountId:null, asherId:null, banned:false }; setAuth(s) }
    const onAuthOk = ()=>{ silentCheck() }
    window.addEventListener('auth:logout', onLogout)
    window.addEventListener('auth:ok', onAuthOk)
    window.addEventListener('auth:success', onAuthOk)
    return ()=> {
      window.removeEventListener('auth:logout', onLogout)
      window.removeEventListener('auth:ok', onAuthOk)
      window.removeEventListener('auth:success', onAuthOk)
    }
  },[silentCheck])

  const openAuth = ()=>{
    try{ window.dispatchEvent(new CustomEvent('open-auth')) }catch{}
    try{
      const sels=['[data-auth-open]','.nav-auth-btn','#nav-auth-btn','[data-testid="auth-open"]']
      for (const s of sels){ const el=document.querySelector(s); if (el?.click){ el.click(); break } }
    }catch{}
  }

  const requireAuth = useCallback(async ()=>{
    const probe = await silentCheck()
    if (probe.accountId && probe.asherId && !probe.banned) return probe
    openAuth()
    return new Promise((resolve)=>{
      const finish = ()=> silentCheck().then(resolve)
      window.addEventListener('auth:ok', finish, { once:true })
      window.addEventListener('auth:success', finish, { once:true })
      setTimeout(finish, 120000)
    })
  },[silentCheck])

  return { ...auth, checked, requireAuth }
}

/* ================================= Styles ================================= */
const ForumStyles = () => (
  <style jsx global>{`
    .ql7-forum {
      --ink:#eaf4ff; --b:rgba(80,167,255,.35); --bg:rgba(10,14,20,.82);
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
    .ta{ min-height:clamp(48px,8vh,140px); resize:vertical } /* ниже в 2–3 раза */
    .react{ border-radius:999px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); padding:.25rem .55rem }
    .react[data-active="1"]{ background:rgba(25,129,255,.16); border-color:var(--b) }
    .tag{ border-radius:8px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); padding:.18rem .5rem }
    .grid-2{ display:grid; grid-template-columns:1fr; gap:16px }
    @media (min-width:1440px){ .grid-2{ grid-template-columns: 1fr 1fr } }
    .win{ border:1px solid rgba(255,255,255,.12); background:rgba(8,11,16,.88); border-radius:16px; overflow:hidden }
    .bar{ position:sticky; top:0; z-index:3; padding:.75rem 1rem; border-bottom:1px solid rgba(255,255,255,.12);
          background:linear-gradient(180deg,rgba(12,16,22,.95),rgba(12,16,22,.72)) }
    .win--topics, .win--posts { height: var(--forum-h); }
    .win--topics{ overflow:auto }
    .win--posts { display:flex; flex-direction:column; }
    .posts-scroller{ flex:1 1 auto; overflow:auto; padding:1rem }
    .composer{ border-top:1px solid rgba(255,255,255,.10); background:rgba(12,16,22,.9); padding:.75rem; position:sticky; bottom:0; z-index:2 }
    /* anchored emoji popover (узкая, 5 в ряд, вверх от кнопки) */
    .emoji-pop {
      position: fixed; z-index: 60; max-height: 240px; overflow:auto;
      background: rgba(10,14,20,.98); border:1px solid rgba(255,255,255,.14); border-radius:12px; padding:8px;
      width: 220px; /* 5 * 38 + gaps */
      box-shadow: 0 12px 32px rgba(0,0,0,.45), inset 0 0 10px rgba(25,129,255,.12);
    }
    .emoji-grid { display:grid; grid-template-columns: repeat(5, 38px); gap: 6px; }
    .emoji-btn { width:38px; height:38px; border-radius:8px; border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.05); font-size:22px; }
    .emoji-btn:hover { background:rgba(255,255,255,.10) }
  `}</style>
)

/* ================================= UI atoms ================================ */
const Btn = (p)=><button type="button" {...p} className={cls('btn',p.className)}/>
const BtnGhost=(p)=><button type="button" {...p} className={cls('btn btn-ghost',p.className)}/>
const Pill=({children,className})=><span className={cls('pill',className)}>{children}</span>

/* ============================ Emoji (recent + list) ============================ */
const EMOJI_PICK = [
  '👍','👎','❤️','🔥','🚀','💎','😂','😮','😢','🤔','👏','🙏','💯','🎉','🧠','🤖','📈','📉','🐳','🐻',
  '⭐','⚠️','✅','❌','ℹ️','🔔','📣','🎯','🛰️','🌌','✨','⚡','🌊','🌙','🪐','🌍','📊','📝','💬','🔗'
  // … (список можно расширить, но сетка и прокрутка уже есть)
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

/* =============================== Topics window =============================== */
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

/* ============================ Anchored Emoji Popover ============================ */
function EmojiPopover({ anchorEl, onClose, onPick, title }){
  const rect = anchorEl?.getBoundingClientRect?.()
  if (!anchorEl || !rect) return null
  const top = Math.max(8, rect.top - 8 - 240) // всплывает вверх
  const left = Math.min(Math.max(8, rect.left - 110 + rect.width/2), (typeof window!=='undefined'?window.innerWidth:1000) - 230)
  return (
    <div className="emoji-pop" style={{ top, left }} onMouseDown={(e)=>{e.stopPropagation();}}>
      <div className="text-[#eaf4ff] font-semibold mb-2">{title}</div>
      <div className="emoji-grid">
        {EMOJI_PICK.map((e,i)=>(
          <button key={i} className="emoji-btn" onClick={()=>{ onPick?.(e); onClose?.() }}>{e}</button>
        ))}
      </div>
    </div>
  )
}

/* ================================== Posts ================================== */
function ReactionRow({ counts={}, my={}, views=0, onReact, onMore, setMoreAnchor }){
  const top = Object.entries(counts).sort((a,b)=>(b[1]||0)-(a[1]||0)).slice(0,5)
  const lC=counts['👍']||0, dC=counts['👎']||0
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="react" data-active={my['👍']?1:0} onClick={()=>onReact('👍',!!my['👍'])} aria-label="like">👍 <span className="opacity-80">{lC}</span></button>
      <button type="button" className="react" data-active={my['👎']?1:0} onClick={()=>onReact('👎',!!my['👎'])} aria-label="dislike">👎 <span className="opacity-80">{dC}</span></button>
      <span className="tag text-xs">👁 {views||0}</span>
      {top.filter(([e])=>e!=='👍'&&e!=='👎').map(([e,c])=><button type="button" key={e} className="tag text-sm" onClick={()=>onReact(e,!!my[e])}>{e} <span className="opacity-80">{c}</span></button>)}
      <button
        type="button"
        className="tag text-sm"
        aria-label="more-emoji"
        onClick={(e)=>{ setMoreAnchor?.(e.currentTarget); onMore?.() }}
      >…</button>
    </div>
  )
}

function Post({ p, level=0, onReact, onReport, onReply, onOpenThread, setEmojiAnchor }){
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
        <ReactionRow
          counts={p.reactions||{}} my={p.myReactions||{}} views={p.views||0}
          onReact={(e,rm)=>{ onReact(e,rm) }}
          onMore={()=>onReply('emoji')}
          setMoreAnchor={setEmojiAnchor}
        />
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
  const [emojiTarget,setEmojiTarget]=useState(null)
  const [emojiAnchor,setEmojiAnchor]=useState(null)

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

  useEffect(()=>{
    if(!topic?.id) return
    const id = setInterval(()=>{ if(isVisible()) load() }, 4000)
    const onFocus = ()=> load()
    const onVis = ()=>{ if(document.visibilityState==='visible') load() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return ()=>{ clearInterval(id); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis) }
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
      if (a.banned){ alert(t('forum_banned')); return }
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
      if (a.banned){ alert(t('forum_banned')); return }
      // оптимистично
      const backup = posts
      setPosts(ps=>ps.map(x=>{
        if(x.id!==post.id) return x
        const counts={...(x.reactions||{})}; const mine={...(x.myReactions||{})}
        const dec = (e)=>{ if(mine[e]){ delete mine[e]; counts[e]=Math.max(0,(counts[e]||0)-1); if(!counts[e]) delete counts[e] } }
        if(emoji==='👍'){ dec('👎') }
        if(emoji==='👎'){ dec('👍') }
        if(wasActive){ dec(emoji) } else { mine[emoji]=true; counts[emoji]=(counts[emoji]||0)+1 }
        return {...x,reactions:counts,myReactions:mine}
      }))
      const ok = await api.react({target:'post',id:post.id,reaction:emoji,remove:wasActive}).catch(()=>null)
      if(!ok) setPosts(backup) // откат
      else setTimeout(()=>load(), 120)
    }catch(e){ console.error(e); load() }
  }

  const doReport = async (post)=>{
    try{
      const a = await ensure()
      if (!a?.asherId){ alert(t('forum_need_auth')); return }
      if (a.banned){ alert(t('forum_banned')); return }
      await api.report({target:'post',id:post.id})
      alert(t('forum_report_ok'))
    }catch(e){ alert(e.message||'report error') }
  }

  // дерево → плоский
  const flat = useMemo(()=>{
    const map=new Map(posts.map(p=>[p.id,{...p,children:[]}]))
    const roots=[]
    posts.forEach(p=>{ if(p.parentId && map.has(p.parentId)) map.get(p.parentId).children.push(map.get(p.id)); else roots.push(map.get(p.id)) })
    const out=[]; const walk=(n,l=0)=>{ out.push({...n,_level:l}); (n.children||[]).forEach(c=>walk(c,l+1)) }
    roots.forEach(r=>walk(r,0))
    return out
  },[posts])

  // режим «нить»
  const threadList = useMemo(()=>{
    if(!threadRoot) return null
    const root = posts.find(p=>p.id===threadRoot.id)
    if(!root) return null
    const out=[{...root,_level:0}]
    const walk=(id,lv=0)=>{ posts.filter(x=>x.parentId===id).forEach(c=>{ out.push({...c,_level:lv+1}); walk(c.id,lv+1) }) }
    walk(root.id,0); return out
  },[threadRoot,posts])

  const askReply = (what)=>{
    if(what==='emoji'){ setEmojiTarget(replyTo || threadRoot || null) }
    else setReplyTo(what || null)
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

      <div ref={scRef} className="posts-scroller">
        {error && <div className="text-red-400">{error}</div>}
        {loading && <div className="space-y-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-28 rounded-xl bg-white/10 animate-pulse"/>)}</div>}
        {!loading && (threadList||flat).length===0 && <div className="text-[#eaf4ff]/75 text-sm">{t('forum_empty_posts')}</div>}

        {(threadList||flat).map(p=>(
          <div key={p.id} data-post={p.id}>
            <Post
              p={p} level={p._level}
              onReact={(emoji,was)=>doReact(p,emoji,was)}
              onReport={()=>doReport(p)}
              onReply={(flag)=> flag==='emoji' ? setEmojiTarget(p) : setReplyTo(p)}
              onOpenThread={(x)=>setThreadRoot(x)}
              setEmojiAnchor={setEmojiAnchor}
            />
          </div>
        ))}
      </div>

      <Composer
        text={text}
        setText={setText}
        onSend={submit}
        replyTo={replyTo || threadRoot}
        disabled={auth.banned}
      />

      {emojiTarget && <EmojiPopover anchorEl={emojiAnchor} onClose={()=>{setEmojiTarget(null); setEmojiAnchor(null)}}
        onPick={(e)=>{
          const was = !!(emojiTarget.myReactions && emojiTarget.myReactions[e])
          doReact(emojiTarget, e, was)
          setEmojiTarget(null); setEmojiAnchor(null)
        }}
        title={t('forum_more_emoji')}
      />}
    </section>
  )
}

/* ================================ Composer ================================= */
function Composer({ text, setText, onSend, replyTo, disabled }){
  const { t } = useI18n()
  const { recent, push } = useRecentEmoji()
  const [emojiOpen,setEmojiOpen]=useState(false)
  const anchorRef = useRef(null)

  const add = (e)=>{ if(disabled) return; setText(v=>v+e); push(e) }

  return (
    <div className="composer">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-[#eaf4ff]/80 text-sm">
          {disabled ? t('forum_banned') :
           replyTo ? `${t('forum_replying_to')} ${(replyTo?.user||'user')}` : t('forum_composer_hint')}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <textarea className="ta" value={text} disabled={disabled} onChange={e=>setText(e.target.value)} placeholder={t('forum_composer_placeholder')} />
        <div className="flex flex-col gap-2 items-stretch">
          <Btn onClick={onSend} disabled={disabled || !text.trim()} style={{whiteSpace:'nowrap'}} aria-label={t('forum_send')}>{t('forum_send')}</Btn>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#eaf4ff]/70 mr-1">{t('forum_emoji_recent')}:</span>
            {recent.length===0 && <span className="text-xs text-[#eaf4ff]/50">—</span>}
            {recent.map((e,i)=><button key={i} className="tag" disabled={disabled} onClick={()=>add(e)}>{e}</button>)}
            <BtnGhost ref={anchorRef} onClick={()=>setEmojiOpen(v=>!v)} aria-label={t('forum_more_emoji')}>{t('forum_more_emoji')}</BtnGhost>
          </div>
        </div>
      </div>

      {emojiOpen && <EmojiPopover anchorEl={anchorRef.current} onClose={()=>setEmojiOpen(false)} onPick={(e)=>add(e)} title={t('forum_more_emoji')} />}
    </div>
  )
}

/* ================================== Topics ================================== */
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

  useEffect(()=>{ load({page:1}) },[])
  useEffect(()=>{ load() },[page, settings.topics.sort, settings.topics.q])

  useEffect(()=>{
    const id = setInterval(()=>{ if(isVisible()) load() }, 4500)
    const onFocus = ()=> load()
    const onVis = ()=>{ if(document.visibilityState==='visible') load() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return ()=>{ clearInterval(id); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[page, settings.topics.sort, settings.topics.q])

  const [createMode,setCreateMode]=useState(false)
  const [title,setTitle]=useState(''); const [category,setCategory]=useState(''); const [tags,setTags]=useState(''); const [first,setFirst]=useState('')
  const [busy,setBusy]=useState(false)

  const ensure = async ()=> await auth.requireAuth()

  const openCreate = async ()=>{
    const a = await ensure()
    if (!a?.asherId){ alert(t('forum_need_auth')); return }
    if (a.banned){ alert(t('forum_banned')); return }
    setCreateMode(v=>!v)
  }

  const create = async ()=>{
    if(!title.trim()) return
    try{
      const a = await ensure()
      if (!a?.asherId){ alert(t('forum_need_auth')); return }
      if (a.banned){ alert(t('forum_banned')); return }
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
          <Btn onClick={openCreate} aria-label={t('forum_btn_create_topic')} disabled={auth.banned}>＋ {t('forum_btn_create_topic')}</Btn>
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

/* =================================== API hook =================================== */
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

/* =================================== Main =================================== */
export default function Forum(){
  const { t } = useI18n()
  const auth = useAuth()
  const api  = useForumAPI()

  const [selected,setSelected]   = useState(null)
  const [viewedFor,setViewedFor]=useState(null) // чтобы не слать /view повторно на ту же тему

  // настройки
  const [settings,setSettings]=useState({
    topics:{ sort:'new', q:'' },
    posts :{ sort:'new', q:'' },
  })

  // при выборе темы — слать view один раз
  useEffect(()=>{
    if(selected?.id && viewedFor !== selected.id){
      api.view({ topicId: selected.id }).catch(()=>{})
      setViewedFor(selected.id)
    }
  },[selected?.id, viewedFor, api])

  // копирование asherId
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
