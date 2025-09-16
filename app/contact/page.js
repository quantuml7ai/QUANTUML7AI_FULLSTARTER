'use client'

import { useI18n } from '../../components/i18n'

export default function Contact(){
  const { t } = useI18n()
  const links = t('links')
  const lines = t('contact_lines')

  return (
    <section className="panel">
      <h1>{t('contact_title')}</h1>
      <p>{t('contact_sub')}</p>

      <div className="contact-grid">
        <div className="contact-card">
          <h3>Telegram Channel</h3>
          <p>{lines[0]}</p>
          <a className="btn" href={links.channel} target="_blank" rel="noreferrer">{t('nav_channel')}</a>
        </div>
        <div className="contact-card">
          <h3>Feedback / Support</h3>
          <p>{lines[1]}</p>
          <a className="btn" href={links.feedback} target="_blank" rel="noreferrer">Feedback Bot</a>
        </div>
        <div className="contact-card">
          <h3>Email</h3>
          <p>{lines[2]}</p>
          <a className="btn ghost" href={`mailto:${links.email}`}>Email</a>
        </div>
      </div>
    </section>
  )
}
