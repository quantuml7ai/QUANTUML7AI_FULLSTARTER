import Link from 'next/link'
import { getTrustIdentityPath } from '../../lib/seo/trustIdentityRoutes.js'
import styles from './TrustIdentityArticle.module.css'

export default function TrustIdentityAboutTeaser({ content, lang = 'en' }) {
  const teaser = content?.aboutTeaser
  if (!teaser?.title || !teaser?.body || !teaser?.cta) return null

  return (
    <aside className={styles.aboutTeaser} aria-labelledby="ql7-about-trust-title" data-ql7-about-trust-premium="2">
      <div className={styles.aboutTeaserAura} aria-hidden="true" />
      <div className={styles.aboutTeaserTop}>
        <span className={styles.aboutTeaserOfficial}>{content.presentation.officialBadge}</span>
        <span className={styles.aboutTeaserVersion}>{content.version?.value}</span>
      </div>
      <div className={styles.aboutTeaserRail} aria-hidden="true"><span /></div>
      <div className={styles.aboutTeaserBody}>
        <div className={styles.aboutTeaserCopy}>
          <h2 id="ql7-about-trust-title">{teaser.title}</h2>
          <p>{teaser.body}</p>
        </div>
        <Link className={`${styles.primaryAction} ${styles.aboutTeaserAction}`} href={getTrustIdentityPath(lang)}>
          <span>{teaser.cta}</span>
          <span className={styles.actionArrow} aria-hidden="true">→</span>
        </Link>
      </div>
    </aside>
  )
}
