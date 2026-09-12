
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTrustIdentityContent } from '../../lib/seo/trustIdentityContent.js'
import {
  TRUST_IDENTITY_DEFAULT_LANG,
  getTrustIdentityPath,
  normalizeTrustIdentityLang,
} from '../../lib/seo/trustIdentityRoutes.js'
import styles from '../../components/trust/TrustIdentityArticle.module.css'

const SUPPORT_PATH = '/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support'

export default function Contact({ searchParams }) {
  const reason = String(searchParams?.reason || '').trim().toLowerCase()
  if (reason !== 'impersonation') {
    redirect('/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support')
  }

  const lang = normalizeTrustIdentityLang(searchParams?.lang) || TRUST_IDENTITY_DEFAULT_LANG
  const content = getTrustIdentityContent(lang)

  return (
    <main className={styles.contactShell} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} data-ql7-trust-contact-premium="1">
      <section className={styles.contactCard} aria-labelledby="ql7-contact-impersonation-title">
        <div className={styles.contactAura} aria-hidden="true" />
        <div className={styles.contactTopline}>
          <span className={styles.kicker}>{content.hero.kicker}</span>
          <span className={styles.contactMode}>{content.presentation.supportTextOnlyBadge}</span>
        </div>
        <h1 id="ql7-contact-impersonation-title">{content.reportImpersonation.label}</h1>
        <p className={styles.contactLead}>{content.reportImpersonation.description}</p>
        <div className={styles.contactEvidencePanel}>
          <ul className={styles.evidenceList}>
            {content.reportImpersonation.evidence.map((item, index) => (
              <li key={`contact-evidence:${index}`}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={styles.contactActions}>
          <Link className={`${styles.primaryAction} ${styles.contactPrimaryAction}`} href={SUPPORT_PATH}>
            <span>{content.reportImpersonation.cta}</span>
            <span className={styles.actionArrow} aria-hidden="true">→</span>
          </Link>
          <Link className={`${styles.primaryAction} ${styles.secondaryAction}`} href={getTrustIdentityPath(lang)}>
            {content.navigation.label}
          </Link>
        </div>
      </section>
    </main>
  )
}
