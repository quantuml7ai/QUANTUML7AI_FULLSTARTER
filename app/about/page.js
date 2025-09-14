'use client'

import { useI18n } from '../../components/i18n'

export default function AboutPage() {
  const { t } = useI18n()

  const title     = t('about_title')
  const parasAll  = t('about_paragraphs') || []
  const raw       = t('about_sections')   || []
  const bullets   = t('about_bullets')    || []
  const links     = t('links')            || {}

  // Превращаем {title, parasIdx} в {title, paras[]}
  const sections = raw.length
    ? raw.map((s) => ({
        title: s && s.title ? s.title : '',
        paras: Array.isArray(s?.paras)
          ? s.paras
          : (Array.isArray(s?.parasIdx) ? s.parasIdx.map((i) => parasAll[i]).filter(Boolean) : []),
      }))
    : [{ title: '', paras: parasAll }]

  return (
    <main className="container">
      <section className="panel">
        <h1>{title}</h1>

        <div className="about-sections">
          {sections.map((s, idx) => (
            <div className="about-block" key={idx}>
              {s.title ? <h3 className="about-block-title">{s.title}</h3> : null}
              {Array.isArray(s.paras) && s.paras.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ))}
        </div>

        {Array.isArray(bullets) && bullets.length > 0 && (
          <div className="about-block">
            <ul>
              {bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}

        {links?.bot && (
          <div style={{ marginTop: '1rem' }}>
            <a href={links.bot} target="_blank" rel="noreferrer" className="btn btn-primary">
              {t('tg_button')}
            </a>
          </div>
        )}
      </section>
    </main>
  )
}
