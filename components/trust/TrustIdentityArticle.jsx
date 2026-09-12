import Link from 'next/link'
import { OFFICIAL_QUANTUM_L7_CHANNELS } from '../../lib/brand/officialChannels.js'
import { getTrustIdentityPath } from '../../lib/seo/trustIdentityRoutes.js'
import TrustIdentityLanguageSwitcher from './TrustIdentityLanguageSwitcher.jsx'
import styles from './TrustIdentityArticle.module.css'

function SectionBody({ section, content }) {
  const isChannels = section.id === 'official-channels'
  return (
    <>
      {section.paragraphs.map((paragraph, index) => (
        <p key={`${section.id}:p:${index}`}>{paragraph}</p>
      ))}

      {section.bullets.length > 0 ? (
        <ul className={styles.bulletList}>
          {section.bullets.map((bullet, index) => <li key={`${section.id}:b:${index}`}>{bullet}</li>)}
        </ul>
      ) : null}

      {isChannels ? (
        <>
          <div className={styles.channelGrid} data-ql7-official-channel-registry="1">
            {OFFICIAL_QUANTUM_L7_CHANNELS.map((channel) => (
              <a
                key={channel.id}
                className={styles.channelCard}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                data-channel-id={channel.id}
              >
                <span className={styles.channelLabel}>{content.channels.labels[channel.id] || channel.label}</span>
                <bdi className={styles.channelUrl}>{channel.url}</bdi>
                <span className={styles.channelArrow} aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <p className={styles.channelNotice}>{content.channels.unlistedNotice}</p>
        </>
      ) : null}

      <details className={styles.depthDisclosure} data-ql7-trust-depth="5">
        <summary>
          <span className={styles.depthSummaryText}>{content.presentation.depthBadge}</span>
          <span className={styles.depthSummaryCount}>05</span>
          <span className={styles.depthSummaryChevron} aria-hidden="true">⌄</span>
        </summary>
        <div className={styles.depthGrid}>
          {section.depth.map((item, index) => (
            <article className={styles.depthCard} key={`${section.id}:depth:${index}`}>
              <span className={styles.depthIndex}>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.label}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </details>
    </>
  )
}

export default function TrustIdentityArticle({ lang, content }) {
  const direction = lang === 'ar' ? 'rtl' : 'ltr'
  const reportHref = `/contact?reason=impersonation&lang=${encodeURIComponent(lang)}`

  return (
    <article
      className={styles.article}
      lang={lang}
      dir={direction}
      data-ql7-trust-identity="2026-08-14-v3"
      data-ql7-trust-locale={lang}
      data-ql7-trust-premium-surface="v3"
      data-ql7-trust-layout="hero-final-r8"
    >
      <header
        className={styles.heroFinalR8}
        data-ql7-trust-hero-flow="single-stack-r8"
        data-ql7-trust-hero-contract="meta-then-title-rail-copy"
      >
        <div className={styles.heroFinalAuraR8} aria-hidden="true" />

        <div
          className={styles.heroFinalMetaR8}
          data-ql7-trust-hero-meta="badge-highlights-selector-proof"
        >
          <div className={styles.heroFinalMetaLineR8}>
            <div className={styles.heroFinalStatementR8}>
              <span className={styles.heroFinalStatementDotR8} aria-hidden="true" />
              <span>{content.hero.kicker}</span>
            </div>

            <ul className={styles.heroFinalHighlightsR8} aria-label={content.presentation.officialBadge}>
              {content.hero.highlights.map((item, index) => (
                <li key={`hero-highlight:${index}`}><span aria-hidden="true" />{item}</li>
              ))}
            </ul>

            <TrustIdentityLanguageSwitcher
              lang={lang}
              label={content.navigation.switcherLabel}
              variant="hero-final-r8"
            />
          </div>

          <aside
            className={styles.heroFinalProofR8}
            aria-label={`${content.version.label}: ${content.version.value}`}
            data-ql7-trust-identity-table="r8"
          >
            <div className={styles.heroFinalProofTitleR8}>
              <span className={styles.heroFinalProofDotR8} aria-hidden="true" />
              <span>{content.presentation.verifiedBadge}</span>
            </div>
            <div className={styles.heroFinalStatusGridR8}>
              <div>
                <span>{content.version.label}</span>
                <strong>{content.version.value}</strong>
              </div>
              <div>
                <span>{content.version.reviewedLabel}</span>
                <strong>{content.version.reviewedAt}</strong>
              </div>
              <div>
                <span>URL</span>
                <strong><bdi>{getTrustIdentityPath(lang)}</bdi></strong>
              </div>
            </div>
          </aside>
        </div>

        <div
          className={styles.heroFinalBodyR8}
          data-ql7-trust-reading-flow="full-width-title-rail-copy-r8"
        >
          <h1>{content.hero.title}</h1>
          <div className={styles.heroFinalRailR8} aria-hidden="true"><span /></div>
          <p className={styles.heroFinalLeadR8}>{content.hero.lead}</p>
        </div>
      </header>

      <section
        className={styles.machinePanel}
        aria-labelledby="ql7-machine-identity-title"
        data-ql7-machine-identity="1"
        data-ql7-machine-flow="stacked"
      >
        <header className={styles.machineHeader}>
          <span className={styles.machineBadge}>{content.presentation.machineBadge}</span>
          <h2 id="ql7-machine-identity-title">{content.machineIdentity.title}</h2>
        </header>
        <div className={styles.machineRail} aria-hidden="true"><span /></div>
        <p className={styles.machineLead}>{content.machineIdentity.intro}</p>
        <ul className={styles.machinePrinciples}>
          {content.machineIdentity.principles.map((item, index) => <li key={`machine-principle:${index}`}>{item}</li>)}
        </ul>
        <p className={styles.machineNotice}>{content.machineIdentity.notice}</p>
        <nav className={styles.machineLinks} aria-label={content.machineIdentity.title}>
          <a href="/.well-known/ql7-identity.json"><span>{content.machineIdentity.manifest}</span><bdi>/.well-known/ql7-identity.json</bdi></a>
          <a href="/llms.txt"><span>{content.machineIdentity.llms}</span><bdi>/llms.txt</bdi></a>
          <a href="/sitemap.xml"><span>{content.machineIdentity.sitemap}</span><bdi>/sitemap.xml</bdi></a>
          <a href="/robots.txt"><span>{content.machineIdentity.robots}</span><bdi>/robots.txt</bdi></a>
        </nav>
      </section>

      <div className={styles.sectionStack}>
        {content.sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className={`${styles.sectionCard} ${section.id === 'financial-integrity' ? styles.financialCard : ''}`}
            data-ql7-trust-section-flow="stacked"
          >
            <header className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>{String(index + 1).padStart(2, '0')}</span>
              <h2>{section.title}</h2>
            </header>
            <div className={styles.sectionRail} aria-hidden="true"><span className={styles.sectionRailLine} /></div>
            <div className={styles.sectionContent}>
              <SectionBody section={section} content={content} />
            </div>
          </section>
        ))}
      </div>

      <section className={styles.safetyPanel} aria-labelledby="ql7-trust-safety-title">
        <header className={styles.safetyHeader}>
          <div className={styles.safetyIcon} aria-hidden="true">✓</div>
          <h2 id="ql7-trust-safety-title">{content.safetyChecklistTitle}</h2>
        </header>
        <div className={styles.panelRail} aria-hidden="true"><span /></div>
        <ul className={styles.checkGrid}>
          {content.safetyChecklist.map((item, index) => <li key={`safe:${index}`}>{item}</li>)}
        </ul>
      </section>

      <section className={styles.faqPanel} aria-labelledby="ql7-trust-faq-title">
        <header className={styles.panelHeading}>
          <span>{content.presentation.faqBadge}</span>
          <h2 id="ql7-trust-faq-title">{content.faqTitle}</h2>
        </header>
        <div className={styles.panelRail} aria-hidden="true"><span /></div>
        <div className={styles.faqList}>
          {content.faq.map((item) => (
            <details key={item.id} className={styles.faqItem} data-ql7-trust-faq="1">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.reportPanel} aria-labelledby="ql7-trust-report-title">
        <header className={styles.reportHeader}>
          <div className={styles.reportMark} aria-hidden="true">!</div>
          <div className={styles.reportTitleGroup}>
            <span className={styles.reportEyebrow}>{content.presentation.supportTextOnlyBadge}</span>
            <h2 id="ql7-trust-report-title">{content.reportImpersonation.label}</h2>
          </div>
        </header>
        <div className={styles.panelRail} aria-hidden="true"><span /></div>
        <div className={styles.reportBody}>
          <p>{content.reportImpersonation.description}</p>
          <ul className={styles.evidenceList}>
            {content.reportImpersonation.evidence.map((item, index) => <li key={`evidence:${index}`}>{item}</li>)}
          </ul>
          <Link className={`${styles.primaryAction} ${styles.reportAction}`} href={reportHref}>
            <span>{content.reportImpersonation.cta}</span>
            <span className={styles.actionArrow} aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer className={styles.versionFooter}>
        <div>
          <span>{content.version.label}</span>
          <strong>{content.version.value}</strong>
        </div>
        <div>
          <span>{content.version.reviewedLabel}</span>
          <strong>{content.version.reviewedAt}</strong>
        </div>
        <p>{content.version.updateNotice}</p>
      </footer>
    </article>
  )
}
