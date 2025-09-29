'use client'

/* #############################################################
# NEWS FEED (CLIENT)
# тянет /api/news?page=N&pageSize=…&source=…&sort=…
# Публичные настройки читаем из process.env.NEXT_PUBLIC_*
############################################################# */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../components/i18n'

/* ==================== helpers ==================== */

const PUB = {
  PAGE_SIZE: Number(process.env.NEXT_PUBLIC_NEWS_PAGE_SIZE || 50),
  AUTO_REFRESH_SEC: Number(process.env.NEXT_PUBLIC_NEWS_RATE_WINDOW_SEC || 60),
}

function cn(...a) { return a.filter(Boolean).join(' ') }

function timeAgo(ts) {
  try {
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts)
    const diff = (Date.now() - d.getTime())/1000
    if (diff < 60) return `${Math.floor(diff)}s`
    if (diff < 3600) return `${Math.floor(diff/60)}m`
    if (diff < 86400) return `${Math.floor(diff/3600)}h`
    return d.toLocaleString()
  } catch { return '' }
}

async function getJSON(url, def = null) {
  try {
    const r = await fetch(url, { cache:'no-store' })
    if (!r.ok) return def
    return await r.json()
  } catch { return def }
}

/* ==================== компонент ==================== */

export default function NewsFeed() {
  const { t } = useI18n()

  // query state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PUB.PAGE_SIZE)
  const [source, setSource] = useState('all') // all|cryptopanic|newsapi|reddit|rss
  const [sort, setSort] = useState('time')    // time|relevance|hot

  // data
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // auto refresh
  const [auto, setAuto] = useState(true)
  const tickRef = useRef()

  // derived
  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize])
  const canPrev = page > 1
  const canNext = page < totalPages

  /* --------- fetch --------- */
  async function load() {
    setLoading(true); setError(null)
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      source,
      sort,
    })
    const data = await getJSON(`/api/news?${q.toString()}`, { ok:false, items:[], total:0 })
    if (!data?.ok) {
      setError('load_failed'); setItems([]); setTotal(0); setLoading(false); return
    }
    setItems(Array.isArray(data.items) ? data.items : [])
    setTotal(Number(data.total || 0))
    setLoading(false)
  }

  useEffect(() => { load() }, [page, pageSize, source, sort])

  useEffect(() => {
    if (!auto) return
    clearInterval(tickRef.current)
    tickRef.current = setInterval(() => load(), Math.max(10, PUB.AUTO_REFRESH_SEC) * 1000)
    return () => clearInterval(tickRef.current)
  }, [auto, page, pageSize, source, sort])

  /* --------- handlers --------- */
  function next() { if (canNext) setPage(p => p+1) }
  function prev() { if (canPrev) setPage(p => p-1) }
  function refresh() { load() }

  /* ==================== render ==================== */

  return (
    <section className="news glass">
      <div className="head">
        <div className="ttl">
          <h2>{t('news_title') || 'Новости'}</h2>
          <div className="sub">{t('news_seo_desc') || 'stream of crypto/macro/on-chain events'}</div>
        </div>

        <div className="ctrls">
          <select value={source} onChange={e=>{setPage(1);setSource(e.target.value)}}>
            <option value="all">{t('source_all') || 'All'}</option>
            <option value="cryptopanic">CryptoPanic</option>
            <option value="newsapi">NewsAPI</option>
            <option value="reddit">Reddit</option>
            <option value="rss">RSS</option>
          </select>

          <select value={sort} onChange={e=>{setPage(1);setSort(e.target.value)}}>
            <option value="time">{t('sort_time') || 'Newest'}</option>
            <option value="relevance">{t('sort_relevance') || 'Relevance'}</option>
            <option value="hot">{t('sort_hot') || 'Hot'}</option>
          </select>

          <select value={pageSize} onChange={e=>{setPage(1);setPageSize(Number(e.target.value)||50)}}>
            {[25,50,100].map(n=><option key={n} value={n}>{n}/page</option>)}
          </select>

          <label className="auto">
            <input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)} />
            <span>{t('auto_refresh') || 'Auto refresh'}</span>
          </label>

          <button className="btn" onClick={refresh} disabled={loading}>
            {loading ? (t('loading') || 'Loading…') : (t('refresh') || 'Refresh')}
          </button>
        </div>
      </div>

      {/* список */}
      <div className="grid">
        {items.map(n => (
          <article key={n.id || `${n.src}-${n.ts}`} className="card">
            <a className="cover" href={n.url} target="_blank" rel="noreferrer">
              {n.image
                ? <img src={n.image} alt={n.title || 'news'} loading="lazy"/>
                : <div className="ph" aria-hidden="true"/>}
            </a>

            <div className="body">
              <div className="meta">
                <span className={cn('badge', n.src)}>{n.src?.toUpperCase() || 'SRC'}</span>
                {!!n.lang && <span className="badge gray">{n.lang.toUpperCase()}</span>}
                <span className="time">{timeAgo(n.ts)}</span>
              </div>

              <a className="title" href={n.url} target="_blank" rel="noreferrer">
                {n.title || '(no title)'}
              </a>

              {!!n.summary && <p className="sum">{n.summary}</p>}

              {!!(n.tags && n.tags.length) && (
                <div className="tags">
                  {n.tags.slice(0,6).map(tag => <span key={tag} className="tag">#{tag}</span>)}
                </div>
              )}

              <div className="actions">
                <a className="btn sm" href={n.url} target="_blank" rel="noreferrer">{t('open')||'Open'}</a>
                {!!n.asset && <span className="asset">• {n.asset}</span>}
              </div>
            </div>
          </article>
        ))}

        {!loading && items.length===0 && (
          <div className="empty">
            {error ? (t('load_failed')||'load_failed') : (t('no_news')||'no_news')}
          </div>
        )}
      </div>

      {/* пагинация */}
      <div className="pager">
        <button className="btn sm" onClick={prev} disabled={!canPrev}>{t('prev')||'prev'}</button>
        <span className="pg">{page} / {totalPages}</span>
        <button className="btn sm" onClick={next} disabled={!canNext}>{t('next')||'next'}</button>
      </div>

      <style jsx>{`
        .glass{
          background:rgba(8,12,16,.45);
          border:1px solid rgba(0,255,255,.12);
          border-radius:16px;padding:14px;backdrop-filter:blur(6px)
        }
        .head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
        .ttl h2{margin:0;font-size:24px}
        .ttl .sub{opacity:.8;font-size:13px;margin-top:2px}
        .ctrls{display:flex;gap:8px;align-items:center}
        .ctrls select{
          background:rgba(255,255,255,.06);
          border:1px solid rgba(0,255,255,.18);
          border-radius:10px;padding:8px 10px
        }
        .auto{display:flex;gap:6px;align-items:center;opacity:.9}
        .btn{
          padding:9px 14px;border-radius:12px;border:1px solid rgba(0,255,255,.18);
          background:rgba(255,255,255,.06);
        }
        .btn.sm{padding:7px 10px;border-radius:10px}
        .grid{
          display:grid;gap:12px;
          grid-template-columns: repeat(2, minmax(0,1fr));
        }
        @media (max-width: 980px){
          .grid{grid-template-columns:minmax(0,1fr)}
        }
        .card{
          display:grid;grid-template-columns: 220px 1fr;gap:10px;
          background:rgba(0,0,0,.25);border:1px solid rgba(0,255,255,.12);
          border-radius:12px;overflow:hidden
        }
        @media (max-width: 720px){
          .card{grid-template-columns:1fr}
        }
        .cover{display:block;min-height:140px;background:rgba(255,255,255,.04)}
        .cover img{width:100%;height:100%;object-fit:cover;display:block}
        .ph{width:100%;height:100%;min-height:140px;background:linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.02))}
        .body{padding:10px;display:flex;flex-direction:column;gap:8px}
        .meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;opacity:.95}
        .badge{padding:4px 8px;border-radius:999px;background:rgba(0,255,255,.08);border:1px solid rgba(0,255,255,.18);font-size:12px}
        .badge.gray{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.18)}
        .time{margin-left:auto;opacity:.85;font-size:12px}
        .title{font-weight:700;line-height:1.25}
        .sum{opacity:.9;line-height:1.5;margin:0}
        .tags{display:flex;gap:6px;flex-wrap:wrap}
        .tag{font-size:12px;opacity:.9;background:rgba(255,255,255,.06);border:1px solid rgba(0,255,255,.14);padding:3px 6px;border-radius:8px}
        .actions{display:flex;gap:8px;align-items:center;margin-top:auto}
        .asset{opacity:.85}
        .empty{padding:18px;text-align:center;opacity:.85}
        .pager{display:flex;gap:10px;align-items:center;justify-content:center;margin-top:12px}
        .pg{opacity:.9}
      `}</style>
    </section>
  )
}
