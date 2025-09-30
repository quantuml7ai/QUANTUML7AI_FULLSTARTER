'use client'

/* #############################################################
# NEWS FEED (CLIENT)
# GET /api/news?page=N&pageSize=…&source=…&sort=…
############################################################# */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../components/i18n'

/* ---------- публичные параметры ---------- */
const PUB = {
  PAGE_SIZE: Number(process.env.NEXT_PUBLIC_NEWS_PAGE_SIZE || 50),
  AUTO_REFRESH_SEC: Number(process.env.NEXT_PUBLIC_NEWS_RATE_WINDOW_SEC || 60),
}

const sourcesList = [
  { v: 'all', label: 'source_all' },
  { v: 'twitter', label: 'source_twitter' },
  { v: 'reddit', label: 'source_reddit' },
  { v: 'news', label: 'source_news' },
]

/* ==================== компонент ==================== */
export default function NewsFeed() {
  const { t } = useI18n?.() || { t: (k) => k }

  // controls
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PUB.PAGE_SIZE)
  const [source, setSource] = useState('all') // all|twitter|reddit|news
  const [sort, setSort] = useState('time')    // time|relevance|hot
  const [auto, setAuto] = useState(true)

  // data
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const tickRef = useRef()

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize))),
    [total, pageSize]
  )

  const load = async (opts = {}) => {
    const pg = opts.page ?? page
    const qs = new URLSearchParams({
      page: String(pg),
      pageSize: String(pageSize),
      source,
      sort,
    })
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/news?${qs}`, { cache: 'no-store' })
      const data = await r.json()
      if (data?.ok) {
        setItems(Array.isArray(data.items) ? data.items : [])
        setTotal(Number(data.total || 0))
        if (opts.page !== undefined) setPage(opts.page)
      } else {
        setError(data?.error || 'load_error')
      }
    } catch (e) {
      setError('load_error')
    } finally {
      setLoading(false)
    }
  }

  // первичная загрузка
  useEffect(() => {
    load({ page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, source, sort])

  // автообновление (мягкое, без сброса страницы)
  useEffect(() => {
    if (!auto) return
    const sec = Math.max(10, PUB.AUTO_REFRESH_SEC)
    tickRef.current = setInterval(() => {
      load({ page })
    }, sec * 1000)
    return () => { clearInterval(tickRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, page, pageSize, source, sort])

  const next = () => { if (page < totalPages) load({ page: page + 1 }) }
  const prev = () => { if (page > 1) load({ page: page - 1 }) }

  return (
    <section className="wrap">
      {/* ---------- ВЕРХНЯЯ ПОЛОСА: ужимаем и РАЗРЕШАЕМ перенос элементов панели ---------- */}
      <header className="head">
        <div className="titleSide">
          <div className="ttl">News</div>
          <div className="sub">multisource • paged</div>
        </div>

        <div className="controls" role="toolbar" aria-label="news toolbar">
          <label className="ctrl">
            <span className="sr">{t('source')}</span>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              title={t('source_all')}
            >
              {sourcesList.map(s => (
                <option key={s.v} value={s.v}>{t(s.label)}</option>
              ))}
            </select>
          </label>

          <label className="ctrl">
            <span className="sr">{t('sort')}</span>
            <select value={sort} onChange={e => setSort(e.target.value)} title="sort">
              <option value="time">sort_time</option>
              <option value="relevance">sort_relevance</option>
              <option value="hot">sort_hot</option>
            </select>
          </label>

          <label className="ctrl">
            <span className="sr">{t('page_size')}</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              title="page size"
            >
              {[10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
          </label>

          <label className="chk ctrl" title="auto refresh">
            <input
              type="checkbox"
              checked={auto}
              onChange={e => setAuto(e.target.checked)}
            />
            <span>auto_refresh</span>
          </label>

          <button className="btn" onClick={() => load()} disabled={loading}>
            {loading ? '…' : 'refresh'}
          </button>
        </div>
      </header>

      {/* ---------- список ---------- */}
      {error && <div className="empty">error: {String(error)}</div>}
      {!error && items.length === 0 && !loading && (
        <div className="empty">no items</div>
      )}

      <div className="grid">
        {items.map((it, i) => {
          const thumb = it?.image || it?.thumbnail || it?.media?.url || null
          return (
            <article key={it.id || i} className="card">
              <div className="row">
                <div className="badge">{(it.source || '').toUpperCase()}</div>
                <time className="time">{it.time || ''}</time>
              </div>

              {/* превью (если есть) */}
              {thumb && (
                <a
                  className="thumb"
                  href={it.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="open"
                >
                  <img src={thumb} alt="" loading="lazy" />
                </a>
              )}

              <a href={it.url} target="_blank" rel="noreferrer noopener" className="title">
                {it.title || ''}
              </a>

              {it.summary && <p className="sum">{it.summary}</p>}

              <div className="actions">
                <a className="btn sm" href={it.url} target="_blank" rel="noreferrer noopener">open</a>
                {it.asset && <span className="asset">{it.asset}</span>}
              </div>
            </article>
          )
        })}
      </div>

      {/* ---------- пагинация ---------- */}
      <div className="pager">
        <button className="btn sm" onClick={prev} disabled={page <= 1}>prev</button>
        <span className="pg">{page} / {totalPages}</span>
        <button className="btn sm" onClick={next} disabled={page >= totalPages}>next</button>
      </div>

      {/* ---------- стили ---------- */}
      <style jsx>{`
        .wrap{ padding:12px 12px 24px }

        /* Голова: разрешаем внутренний перенос у .controls */
        .head{
          display:flex; align-items:flex-start; gap:12px;
          padding:8px 10px 14px; border-radius:14px;
          background:rgba(6,10,16,.55); border:1px solid rgba(255,255,255,.08);
          overflow:hidden;
          flex-wrap:nowrap; /* заголовок и панель — в одной строке; переносится содержимое панели */
        }
        .titleSide{
          min-width:0;
          flex: 0 1 auto;
        }
        .ttl{ font-size:22px; font-weight:800; line-height:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
        .sub{ opacity:.8; font-size:13px; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }

        /* Панель: может занимать ВСЮ оставшуюся ширину и переносить элементы */
        .controls{
          margin-left:auto;
          flex: 1 1 560px;          /* занимает остаток места; можно сжать */
          min-width: 220px;         /* но не меньше */
          display:flex; align-items:center; gap:8px;
          flex-wrap: wrap;          /* <— РАЗРЕШАЕМ ПЕРЕНОС */
          overflow:visible;         /* ничего не обрезаем */
        }
        .ctrl{ flex: 0 0 auto; display:flex; align-items:center; gap:6px; white-space:nowrap }
        .ctrl select{
          height:36px; border-radius:10px; padding:0 10px;
          background:#0b1018; color:var(--ink, #e9f1ff);
          border:1px solid rgba(255,255,255,.16);
          max-width:180px;
        }
        .chk{ gap:6px; }
        .chk input{ width:16px; height:16px }

        .btn{
          height:36px; padding:0 12px; border-radius:10px;
          border:1px solid rgba(255,255,255,.18);
          background:transparent; color:var(--ink, #e9f1ff);
          flex: 0 0 auto;
        }
        .btn.sm{ height:30px; padding:0 10px; border-radius:9px }

        /* На узких — панель опускается НА СВОЙ второй ряд и тянется на 100% ширины */
        @media (max-width: 720px){
          .controls{ flex-basis: 100%; min-width:100%; order:2 }
          .titleSide{ order:1 }
        }
        @media (max-width: 560px){
          .head{ padding:8px }
          .controls{ gap:6px }
          .ctrl select{ height:32px; max-width:150px; padding:0 8px; font-size:13px }
          .btn{ height:32px; padding:0 10px; font-size:13px }
          .ttl{ font-size:18px }
          .sub{ font-size:12px }
        }

        /* список */
        .grid{
          display:grid; gap:14px;
          grid-template-columns: repeat(2,minmax(0,1fr));
        }
        @media (max-width: 860px){
          .grid{ grid-template-columns: 1fr }
        }

        .card{
          display:flex; flex-direction:column; gap:10px;
          padding:14px; border-radius:14px;
          background:rgba(9,14,20,.6); border:1px solid rgba(255,255,255,.08);
        }
        .row{ display:flex; align-items:center; gap:10px }
        .badge{
          font-size:11px; padding:3px 6px; border-radius:8px;
          background:rgba(0,255,255,.08); border:1px solid rgba(0,255,255,.14);
        }
        .time{ margin-left:auto; opacity:.85; font-size:12px; white-space:nowrap }

        /* превью в карточке */
        .thumb{
          display:block; width:100%; border-radius:12px; overflow:hidden;
          border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.02);
          margin:6px 0 4px;
        }
        .thumb img{
          display:block; width:100%; height:auto; /* всегда полностью видна, не обрезается */
          object-fit:contain; object-position:center;
        }

        .title{ font-weight:800; line-height:1.25; color:inherit; text-decoration:none }
        .sum{ opacity:.9; line-height:1.5; margin:0 }
        .actions{ display:flex; gap:8px; align-items:center; margin-top:auto }
        .asset{ opacity:.85 }
        .empty{ padding:18px; text-align:center; opacity:.85 }
        .pager{ display:flex; gap:10px; align-items:center; justify-content:center; margin-top:16px }
        .pg{ opacity:.9 }
        .sr{ position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden }
      `}</style>
    </section>
  )
}
