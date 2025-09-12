'use client'

import { useEffect, useRef } from 'react'
import { useI18n } from '../components/i18n'
import Link from 'next/link'

export default function Home(){
  const { t } = useI18n()
  const marqueeRef = useRef(null)
  useEffect(()=>{ if(marqueeRef.current){ marqueeRef.current.innerHTML += marqueeRef.current.innerHTML }},[])

  // был: const blocks = t('home_blocks')
  const blocks = Array.isArray(t('home_blocks')) ? t('home_blocks') : []

  return (
    <>
      <section className="panel">
        <h1>{t('hero_title')}</h1>
        <p>{t('hero_subtitle')}</p>
        <div className="row">
          <a className="btn" href={t('links').bot} target="_blank" rel="noopener noreferrer">{t('hero_cta')}</a>
          <Link className="btn ghost" href="/about">{t('hero_learn_more')}</Link>
        </div>
      </section>

      {blocks.map((b,idx)=>(
        <section className="panel" key={idx}>
          <h2>{b.title}</h2>
          {b.paras?.map((p,i)=><p key={i} style={{whiteSpace:'pre-line'}}>{p}</p>)}
          {b.bullets?.length ? (
            <ul className="bullets">{b.bullets.map((x,i)=><li key={i}>• {x}</li>)}</ul>
          ):null}
        </section>
      ))}

      <section className="marquee-wrap" aria-hidden="true">
        <div className="marquee" ref={marqueeRef}>
          <span>{t('marquee')}</span><span>{t('marquee')}</span><span>{t('marquee')}</span><span>{t('marquee')}</span>
        </div>
      </section>
    </>
  )
}
