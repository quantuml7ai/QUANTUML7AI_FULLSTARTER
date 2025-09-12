'use client'

import { useI18n } from '../../components/i18n'

export default function About(){
  const { t } = useI18n()
  const paras = t('about_paragraphs')
  const bullets = t('about_bullets')
  return (
    <section className="panel">
      <h1>{t('about_title')}</h1>
      {paras.map((p,i)=><p key={i} style={{whiteSpace:'pre-line'}}>{p}</p>)}
      <ul className="bullets">
        {bullets.map((b,i)=><li key={i}>• {b}</li>)}
      </ul>
      <a className="btn" href={t('links').bot} target="_blank" rel="noreferrer">{t('tg_button')}</a>
    </section>
  )
}
