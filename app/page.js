// app/page.js

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'           // ← добавлено
import { useI18n } from '../components/i18n'
import HomeBetweenBlocksAd from './ads'
function AutoMedia({ 
  base,
  exts = ['mp4', 'webm', 'gif', 'webp', 'png', 'jpg', 'jpeg'],
  className,
  alt = '',
  imgProps = {},
  videoProps = {},
}) {
  const [src, setSrc] = useState(null)
  const [kind, setKind] = useState('img')

  useEffect(() => {
    let dead = false

    async function tryHead(url) {
      try {
        const controller = new AbortController()
        const t = setTimeout(() => controller.abort(), 3000)
        const r = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
        clearTimeout(t)
        if (r.ok) return true
      } catch {}
      return false
    }

    async function tryByte(url) {
      try {
        const controller = new AbortController()
        const t = setTimeout(() => controller.abort(), 3000)
        const r = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          cache: 'no-store',
          signal: controller.signal,
        })
        clearTimeout(t)
        if (r.ok) return true 
      } catch {}
      return false
    }

    async function pick() {
      for (const ext of exts) {
        const url = `${base}.${ext}` 
        const ok = (await tryHead(url)) || (await tryByte(url))
        if (ok) {
          if (dead) return
          setSrc(url)
          setKind(ext === 'mp4' || ext === 'webm' ? 'video' : 'img')
          return
        }
      }
    } 

    pick()
    return () => { dead = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, exts.join(',')]) // ← это место было подсвечено; см. вариант ниже

  // ── Вариант без предупреждения (если хотите совсем убрать хинт eslint):
  // const extsKey = Array.isArray(exts) ? exts.join(',') : ''
  // useEffect(..., [base, extsKey])

  if (!src) return null

  if (kind === 'video') {
    return (
      <video
        className={className}
        src={src}
        playsInline
        muted
        autoPlay
        loop
        controls={false}
        {...videoProps}
      />
    )
  }

  // ← заменено <img> на <Image/>
  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      sizes="100vw"
      width={0}
      height={0}
      style={{ width: '100%', height: 'auto' }}
      loading="lazy"
      {...imgProps} 
    />
  )
}
 
function ResponsiveEmbed({ src, title = '' }) {
  if (!src) return null
  return (
    <div className="embed-wrap">
      <iframe
        src={src}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <style jsx>{`
        .embed-wrap {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          border-radius: 12px;
          overflow: hidden;
        }
        .embed-wrap :global(iframe) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  const { t } = useI18n() 
  const marqueeRef = useRef(null)

  useEffect(() => {
    if (marqueeRef.current) {
      marqueeRef.current.innerHTML += marqueeRef.current.innerHTML
    }
  }, [])
 
  const raw = t('home_blocks')
  const blocks = Array.isArray(raw) ? raw : []
 
  const content = []
  blocks.forEach((b, idx) => {
    content.push(
      <section className="panel" key={`b-${idx}`}>
        <h2>{b.title}</h2>
        {Array.isArray(b.paras) &&
          b.paras.map((p, i) => (
            <p className="prewrap" key={i}>{p}</p>
          ))}
        {Array.isArray(b.bullets) && b.bullets.length > 0 && (
          <ul className="bullets">
            {b.bullets.map((x, i) => (<li key={i}>• {x}</li>))}
          </ul>
        )}
      </section>
    )

    if (idx === 0) { 
  
      content.push(
        <section className="panel" key="live-bloomberg">
          <h2>Live: Bloomberg US</h2>
          <ResponsiveEmbed
            src={'https://www.bloomberg.com/live/us'}
            title="Bloomberg US — Live"
          />
        </section>
      )
 
      content.push(
        <figure className="panel" key="qc-shot">
          <AutoMedia
            base="/branding/qc_room"
            exts={['jpg']}
            className="quantum-shot"
            alt="Quantum L7 AI — quantum computing lab. We are the future of the industry."
            imgProps={{}}
            videoProps={{}}
          />
          <figcaption className="sr-only">
            Quantum L7 AI — We are the future of the industry
          </figcaption>
        </figure>
      )
    }
  })

  return (
    <div className="center-wrap">
      <section className="panel"> 
        <h1>{t('hero_title')}</h1>

        <AutoMedia
          base="/branding/telegram_card_tape_fixed"
          className="tg-tape"
          alt="Telegram card sample"
        />
        <p className="prewrap">{t('hero_subtitle')}</p>

        <div className="row">
          <a
            className="btn"
            href={t('links').bot}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('hero_cta')}
          </a>
          <Link className="qcoinLabel" href="/forum">
            {t('QCoin')}
          </Link>
        </div> 
      </section>

     {/* Реклама строго между hero (1-й блок) и первым блоком из home_blocks (2-й блок) */}
     <HomeBetweenBlocksAd key="home-ad-between-hero-and-block-1" />
   
      {content}
 
      <section className="marquee-wrap" aria-hidden="true">
        <div className="marquee" ref={marqueeRef}>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
        </div>
      </section>

      {/* ← заменено <img> на <Image/> в двух иконках */}
      <div className="icons-row"> 
        <Link
          href="/privacy"
          className="icon-link"
          aria-label="Privacy / Политика"
          style={{ '--size': '130px' }}
        >
          <Image
            className="click-icon"
            src="/click/policy.png"
            alt="Privacy"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>

        <Link
          href="/contact"
          className="icon-link"
          aria-label="Support / Поддержка"
          style={{ '--size': '130px' }}
        >
          <Image
            className="click-icon"
            src="/click/support.png"
            alt="Support"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>
      </div>

      <style jsx>{`
        .center-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%;}
        .panel { width:100%; max-width:960px; text-align:center; }
        .row { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
        .tg-tape { margin-top:16px; max-width:100%; height:auto; }
        .prewrap { white-space:pre-wrap; }
        .bullets { text-align:left; display:inline-block; margin:0 auto; }
        .live-grid { display:grid; grid-template-columns:1fr; gap:16px; margin-top:12px; }
        .live-col h3 { margin:0 0 8px 0; font-weight:600; }
        @media (min-width:720px){ .live-grid { grid-template-columns:1fr 1fr; } }

        .icons-row{
          width:100%; display:flex; align-items:center; justify-content:space-evenly;
          gap:24px; flex-wrap:wrap; padding:16px 0 8px;
        }
        .icon-link{ display:inline-block; line-height:0; cursor:pointer; outline:none; }
        .click-icon{
          width:var(--size, 120px); height:auto; display:block; user-select:none;
          pointer-events:none; background:transparent;
          animation: floatY 3s ease-in-out infinite, glow 2.4s ease-in-out infinite alternate;
        }
        .icon-link:hover .click-icon, .icon-link:focus-visible .click-icon{
          animation: floatY 3s ease-in-out infinite, glow-strong 1.6s ease-in-out infinite alternate, bounce .8s cubic-bezier(.22,1,.36,1);
        }
        @keyframes floatY{0%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(-2deg)}100%{transform:translateY(0) rotate(0deg)}}
        @keyframes glow{0%{filter:drop-shadow(0 2px 6px rgba(0,200,255,.18))}100%{filter:drop-shadow(0 10px 22px rgba(0,200,255,.45))}}
        @keyframes glow-strong{0%{filter:drop-shadow(0 4px 10px rgba(0,200,255,.28))}100%{filter:drop-shadow(0 14px 32px rgba(0,220,255,.7))}}
        @keyframes bounce{0%{transform:translateY(0) scale(1)}35%{transform:translateY(-16px) scale(1.06)}60%{transform:translateY(0) scale(.98)}85%{transform:translateY(-8px) scale(1.03)}100%{transform:translateY(0) scale(1)}
        }
        @media (prefers-reduced-motion:reduce){
          .click-icon{ animation:none; }
          .icon-link:hover .click-icon, .icon-link:focus-visible .click-icon{ animation:none; }
        }
      `}</style>
    </div>
  )
}
