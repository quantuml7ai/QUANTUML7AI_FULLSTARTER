import { describe, expect, test } from 'vitest'
import {
  PUBLIC_INDEX_ROUTES,
  ROBOTS_DISALLOW_PATHS,
  TRUST_IDENTITY_PUBLIC_ROUTES,
} from '../../../lib/seo/siteIndex.js'
import sitemap from '../../../app/sitemap.js'
import robots from '../../../app/robots.js'
import {
  OFFICIAL_QUANTUM_L7_CHANNELS,
  OFFICIAL_QUANTUM_L7_SAME_AS,
} from '../../../lib/brand/officialChannels.js'
import {
  TRUST_IDENTITY_LANGS,
  TRUST_IDENTITY_PATHS_BY_LANG,
  TRUST_IDENTITY_X_DEFAULT_PATH,
  buildTrustIdentityAlternates,
} from '../../../lib/seo/trustIdentityRoutes.js'
import { buildTrustIdentityMetadata } from '../../../lib/seo/trustIdentityMetadata.js'
import { getTrustIdentityContent } from '../../../lib/seo/trustIdentityContent.js'
import {
  QUANTUM_L7_ORGANIZATION_ID,
  buildQuantumOrganizationStructuredData,
  buildTrustIdentityPageStructuredData,
  serializeStructuredData,
} from '../../../lib/seo/trustIdentityStructuredData.js'
import { SITE_ORIGIN } from '../../../lib/seo/siteOrigin.js'
import { readRepoFile } from '../../support/projectSurface.js'

const EXPECTED_CHANNELS = [
  ['website', 'https://www.quantuml7ai.com/', false],
  ['x', 'https://x.com/QL7Company', true],
  ['instagram', 'https://www.instagram.com/quantuml7ai/', true],
  ['tiktok', 'https://www.tiktok.com/@ql7ai', true],
  ['youtube', 'https://www.youtube.com/channel/UCXby6llW_TokAUGoOebFXhg', true],
  ['telegram-channel', 'https://t.me/l7universe', true],
  ['telegram-bot', 'https://t.me/l7ai_bot', false],
]

describe('Trust & Identity SEO contracts', () => {
  test('publishes exactly seven real indexable locale routes and keeps redirect out of sitemap', () => {
    expect(TRUST_IDENTITY_LANGS).toEqual(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh'])
    expect(TRUST_IDENTITY_PUBLIC_ROUTES).toHaveLength(7)
    expect(TRUST_IDENTITY_PUBLIC_ROUTES.map((entry) => entry.path)).toEqual(
      TRUST_IDENTITY_LANGS.map((lang) => TRUST_IDENTITY_PATHS_BY_LANG[lang]),
    )
    expect(PUBLIC_INDEX_ROUTES.some((entry) => entry.path === '/trust-and-identity')).toBe(false)
    expect(sitemap().some((entry) => new URL(entry.url).pathname === '/trust-and-identity')).toBe(false)
    expect(TRUST_IDENTITY_X_DEFAULT_PATH).toBe('/en/trust-and-identity')
    const redirectSource = readRepoFile('app/trust-and-identity/route.js')
    expect(redirectSource).toContain('308')
    expect(redirectSource).not.toMatch(/geo|country|ip\b/i)
  })

  test('keeps robots technical and allows every Trust route', () => {
    const out = robots()
    expect(out.rules[0].allow).toBe('/')
    expect(out.rules[0].disallow).toEqual([...ROBOTS_DISALLOW_PATHS])
    expect(ROBOTS_DISALLOW_PATHS).toEqual(['/api/'])
    TRUST_IDENTITY_PUBLIC_ROUTES.forEach(({ path }) => {
      expect(ROBOTS_DISALLOW_PATHS.some((blocked) => path.startsWith(blocked))).toBe(false)
    })
    const source = readRepoFile('app/robots.js')
    expect(source).not.toMatch(/guaranteed|investment|seed phrase|social|telegram|Quantum AI/i)
  })

  test('builds unique self-canonical metadata with reciprocal hreflang and x-default', () => {
    const titles = new Set()
    const descriptions = new Set()
    const expectedKeys = ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'x-default']
    for (const lang of TRUST_IDENTITY_LANGS) {
      const metadata = buildTrustIdentityMetadata(lang)
      expect(metadata.title).toBe(getTrustIdentityContent(lang).meta.title)
      expect(metadata.description).toBe(getTrustIdentityContent(lang).meta.description)
      expect(metadata.alternates.canonical).toBe(TRUST_IDENTITY_PATHS_BY_LANG[lang])
      expect(Object.keys(metadata.alternates.languages)).toEqual(expectedKeys)
      expect(metadata.alternates.languages[lang]).toBe(TRUST_IDENTITY_PATHS_BY_LANG[lang])
      expect(metadata.alternates.languages['x-default']).toBe('/en/trust-and-identity')
      expect(metadata.robots.index).toBe(true)
      expect(metadata.robots.follow).toBe(true)
      expect(metadata.robots.googleBot['max-image-preview']).toBe('large')
      expect(metadata.other['ql7-identity-manifest']).toBe(`${SITE_ORIGIN}/.well-known/ql7-identity.json`)
      expect(metadata.openGraph.url).toBe(TRUST_IDENTITY_PATHS_BY_LANG[lang])
      expect(metadata.twitter.title).toBe(metadata.title)
      titles.add(metadata.title)
      descriptions.add(metadata.description)
    }
    expect(titles.size).toBe(7)
    expect(descriptions.size).toBe(7)

    const absolute = buildTrustIdentityAlternates({ absolute: true })
    Object.values(absolute).forEach((url) => {
      expect(url.startsWith('https://www.quantuml7ai.com/')).toBe(true)
      expect(new URL(url).protocol).toBe('https:')
    })
  })

  test('adds reciprocal alternates to every Trust sitemap item and nowhere fabricates the redirect', () => {
    const items = sitemap()
    const trust = items.filter((entry) => entry.alternates?.languages)
    expect(trust).toHaveLength(7)
    const expected = buildTrustIdentityAlternates({ absolute: true })
    trust.forEach((entry) => expect(entry.alternates.languages).toEqual(expected))
  })

  test('publishes one truthful Organization identity and never aliases the brand as Quantum AI', () => {
    const org = buildQuantumOrganizationStructuredData()
    expect(org['@type']).toBe('Organization')
    expect(org['@id']).toBe(`${SITE_ORIGIN}/#organization`)
    expect(org['@id']).toBe(QUANTUM_L7_ORGANIZATION_ID)
    expect(org.url).toBe('https://www.quantuml7ai.com/')
    expect(org.name).toBe('Quantum L7 AI')
    expect(org.alternateName).toEqual(['QL7 AI', 'Quantum L7 AI Ecosystem'])
    expect(org.alternateName).not.toContain('Quantum AI')
    expect(org.sameAs).toEqual(OFFICIAL_QUANTUM_L7_SAME_AS)
    for (const forbidden of ['legalName', 'address', 'taxID', 'vatID', 'leiCode', 'numberOfEmployees', 'foundingDate']) {
      expect(org).not.toHaveProperty(forbidden)
    }
    expect(org.description).toBe(getTrustIdentityContent('en').hero.lead)
    expect(org.disambiguatingDescription).toBe(
      getTrustIdentityContent('en').sections.find((section) => section.id === 'independence').paragraphs[0],
    )
  })

  test('keeps approved visible channel registry exact and sameAs limited to organization profiles', () => {
    expect(OFFICIAL_QUANTUM_L7_CHANNELS.map((entry) => [entry.id, entry.url, entry.organizationSameAs])).toEqual(EXPECTED_CHANNELS)
    expect(OFFICIAL_QUANTUM_L7_SAME_AS).toEqual(EXPECTED_CHANNELS.filter(([, , sameAs]) => sameAs).map(([, url]) => url))
    expect(OFFICIAL_QUANTUM_L7_CHANNELS.find((entry) => entry.id === 'telegram-bot')?.organizationSameAs).toBe(false)
  })

  test('closes the crawler-facing locale root contract without making the app request-dynamic', () => {
    const rootLayout = readRepoFile('app/layout.js')
    const runtime = readRepoFile('components/seo/RootLocaleRuntime.jsx')
    const i18nRuntime = readRepoFile('components/i18n.js')
    const finalizer = readRepoFile('tools/ql7-finalize-localized-trust-root-html.mjs')
    const hevcPostBuild = readRepoFile('tools/ql7-hevc-browser-bundle-check-v9.mjs')
    const nextConfig = readRepoFile('next.config.mjs')
    const builtVerifier = readRepoFile('tools/ql7-trust-identity-verify-built-html-final-baseline-v3.mjs')
    const pkg = JSON.parse(readRepoFile('package.json'))
    const machine = JSON.parse(readRepoFile('public/.well-known/ql7-identity.json'))
    const llms = readRepoFile('public/llms.txt')

    expect(rootLayout).toContain("import RootLocaleRuntime from '../components/seo/RootLocaleRuntime'")
    expect(rootLayout).toContain('<RootLocaleRuntime />')
    expect(rootLayout).not.toContain("from 'next/headers'")
    expect(rootLayout).not.toContain('await headers(')

    expect(runtime).toContain("'use client'")
    expect(runtime).toContain('usePathname')
    expect(runtime).toContain('useI18n')
    expect(runtime).toContain('QL7_TRUST_IDENTITY_HYDRATED_ROOT_LOCALE_AUTHORITY_R13')
    expect(runtime).toContain('resolveDocumentRootLocale(pathname, uiLang)')
    expect(runtime).toContain('if (match) return toTrustRootLocale(match[1])')
    expect(runtime).toContain('return toAppRootLocale(uiLang)')
    expect(runtime).toContain("root.setAttribute('lang', next.lang)")
    expect(runtime).toContain("root.setAttribute('dir', next.dir)")
    expect(i18nRuntime).not.toContain("document.documentElement.setAttribute('lang'")
    expect(i18nRuntime).not.toContain("document.documentElement.setAttribute('dir'")
    expect(runtime).toContain("root.setAttribute('dir', next.dir)")

    expect(finalizer).toContain('QL7_TRUST_IDENTITY_LOCALIZED_ROOT_HTML_FINALIZER_V2')
    expect(finalizer).toContain("ar: Object.freeze({ route: '/ar/trust-and-identity', dir: 'rtl' })")
    TRUST_IDENTITY_LANGS.forEach((lang) => expect(finalizer).toContain(`/${lang}/trust-and-identity`))

    expect(hevcPostBuild).toContain("import { finalizeLocalizedTrustRootHtml } from './ql7-finalize-localized-trust-root-html.mjs'")
    expect(hevcPostBuild).toContain('finalizeLocalizedTrustRootHtml({ root })')
    expect(pkg.scripts.build).toBe('pnpm -s ql7:hevc:vendor && pnpm -s ql7:hevc:assets:check && next build && pnpm -s ql7:hevc:bundle:check')
    expect(pkg.scripts['ql7:hevc:bundle:check']).toBe('node tools/ql7-hevc-browser-bundle-check-v9.mjs')

    TRUST_IDENTITY_LANGS.forEach((lang) => {
      expect(nextConfig).toContain(`['/${lang}/trust-and-identity', '${lang}']`)
    })
    expect(nextConfig).toContain("key: 'Content-Language'")
    expect(nextConfig).toContain('QL7_TRUST_CONTENT_LANGUAGE_MUTABLE_NEXT_ROUTES_V2')
    expect(nextConfig).toContain('buildTrustIdentityContentLanguageHeaders()')
    expect(nextConfig).not.toContain('trustIdentityContentLanguageHeaders = Object.freeze')
    expect(builtVerifier).toContain('rootHtmlLang:')
    expect(builtVerifier).toContain('rootHtmlDir:')
    expect(builtVerifier).toContain('rootHtmlLangUnique:')
    expect(builtVerifier).toContain('rootHtmlDirUnique:')

    const org = buildQuantumOrganizationStructuredData()
    expect(org.url).toBe(EXPECTED_CHANNELS[0][1])
    expect(org.sameAs).toEqual(EXPECTED_CHANNELS.slice(1, 6).map(([, url]) => url))
    expect(machine.officialChannels.map((entry) => entry.url)).toEqual(EXPECTED_CHANNELS.map(([, url]) => url))
    EXPECTED_CHANNELS.forEach(([, url]) => expect(llms).toContain(url))
  })

  test('creates localized AboutPage + breadcrumb graphs pointing to the single Organization', () => {
    for (const lang of TRUST_IDENTITY_LANGS) {
      const content = getTrustIdentityContent(lang)
      const graph = buildTrustIdentityPageStructuredData({ lang, content })
      const page = graph['@graph'].find((entry) => entry['@type'] === 'AboutPage')
      const breadcrumb = graph['@graph'].find((entry) => entry['@type'] === 'BreadcrumbList')
      expect(page.inLanguage).toBe(lang)
      expect(page.url).toBe(`${SITE_ORIGIN}${TRUST_IDENTITY_PATHS_BY_LANG[lang]}`)
      expect(page['@id']).toBe(`${SITE_ORIGIN}${TRUST_IDENTITY_PATHS_BY_LANG[lang]}#webpage`)
      expect(page.about['@id']).toBe(QUANTUM_L7_ORGANIZATION_ID)
      expect(page.mainEntity['@id']).toBe(QUANTUM_L7_ORGANIZATION_ID)
      expect(page.dateModified).toBe('2026-08-14')
      expect(breadcrumb.itemListElement).toHaveLength(2)
      const parsed = JSON.parse(serializeStructuredData(graph))
      expect(parsed['@graph']).toHaveLength(2)
    }
    const structuredSource = readRepoFile('lib/seo/trustIdentityStructuredData.js')
    expect(structuredSource).not.toContain("'FAQPage'")
    expect(structuredSource).not.toContain("'QAPage'")
    expect(structuredSource).toContain("replace(/</g, '\\\\u003c')")
  })

  test('keeps About, Contact, footer and root Organization integration bounded', () => {
    const about = readRepoFile('app/about/page.js')
    const contact = readRepoFile('app/contact/page.js')
    const topbar = readRepoFile('components/TopBar.js')
    const aboutTeaser = readRepoFile('components/trust/TrustIdentityAboutTeaser.jsx')
    const layout = readRepoFile('app/layout.js')

    expect(about).toContain('<h1 className="about-page-title">{title}</h1>')
    expect(about).toContain('TrustIdentityAboutTeaser')
    expect(about).not.toContain('showTrustLink')
    expect(about).not.toContain('trust_identity.sections.map')
    expect(contact).toContain("reason !== 'impersonation'")
    expect(contact).toContain("/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support")
    expect(contact).toContain('content.reportImpersonation.evidence')
    expect(contact).toContain('data-ql7-trust-contact-premium="1"')
    expect(contact).toContain('content.presentation.supportTextOnlyBadge')
    expect(aboutTeaser).toContain('data-ql7-about-trust-premium="2"')
    expect(aboutTeaser).toContain('content.presentation.officialBadge')
    expect(topbar).toContain('OFFICIAL_QUANTUM_L7_CHANNELS')
    expect(topbar).not.toContain('ql7-social-trust-link')
    expect(topbar).not.toContain('getTrustIdentityPath')
    expect(topbar).toContain('data-ql7-footer-trust-link="absent"')
    expect(readRepoFile('app/globals.css')).not.toContain('.ql7-social-trust-link')
    EXPECTED_CHANNELS.slice(1, 6).forEach(([, url]) => expect(topbar).not.toContain(url))
    expect(layout).toContain('QuantumOrganizationJsonLd')
    expect(layout).toContain('translate="no"')
    expect(layout).toContain('notranslate')
  })


  test('publishes deterministic machine-readable identity surfaces without replacing canonical HTML', async () => {
    const machineSource = readRepoFile('lib/seo/trustIdentityMachineIdentity.js')
    const generator = readRepoFile('tools/generate-trust-identity-machine-surfaces.mjs')
    const manifest = JSON.parse(readRepoFile('public/.well-known/ql7-identity.json'))
    const llms = readRepoFile('public/llms.txt')
    expect(machineSource).toContain('buildTrustIdentityMachineManifest')
    expect(generator).toContain('QL7_TRUST_IDENTITY_MACHINE_SURFACES_V1_OK')
    expect(manifest.canonicalName).toBe('Quantum L7 AI')
    expect(manifest.canonicalOrigin).toBe(SITE_ORIGIN)
    expect(manifest.organizationId).toBe(QUANTUM_L7_ORGANIZATION_ID)
    expect(manifest.identityVersion).toBe('2026-08-14-v3')
    expect(Object.keys(manifest.localizedIdentity)).toEqual(TRUST_IDENTITY_LANGS)
    expect(manifest.officialChannels.map((entry) => entry.url)).toEqual(EXPECTED_CHANNELS.map(([, url]) => url))
    expect(manifest.disambiguationRule).toMatch(/similarity.*does not prove affiliation/i)
    expect(llms).toContain('Canonical name: Quantum L7 AI')
    expect(llms).toContain('/.well-known/ql7-identity.json')
    expect(llms).toContain('/en/trust-and-identity')
    expect(llms).toContain('text: the exact URL or handle')
    for (const lang of TRUST_IDENTITY_LANGS) {
      const content = getTrustIdentityContent(lang)
      expect(content.hero.highlights).toHaveLength(4)
      expect(content.machineIdentity.principles).toHaveLength(5)
      content.sections.forEach((section) => {
        expect(section.depth).toHaveLength(5)
        section.depth.forEach((entry) => expect(entry.body.length).toBeGreaterThan(lang === 'zh' ? 180 : 500))
      })
    }
  })

  test('isolates the first declaration block from legacy hero cascade and keeps one premium reading flow', () => {
    const article = readRepoFile('components/trust/TrustIdentityArticle.jsx')
    const switcher = readRepoFile('components/trust/TrustIdentityLanguageSwitcher.jsx')
    const css = readRepoFile('components/trust/TrustIdentityArticle.module.css')
    const r8 = css.slice(css.indexOf('QL7 TRUST SEO222 HERO FINAL R8'))

    expect(article).toContain('data-ql7-trust-layout="hero-final-r8"')
    expect(article).toContain('data-ql7-trust-hero-flow="single-stack-r8"')
    expect(article).toContain('data-ql7-trust-hero-contract="meta-then-title-rail-copy"')
    expect(article).toContain('data-ql7-trust-hero-meta="badge-highlights-selector-proof"')
    expect(article).toContain('data-ql7-trust-identity-table="r8"')
    expect(article).toContain('data-ql7-trust-reading-flow="full-width-title-rail-copy-r8"')

    expect(article).toContain('className={styles.heroFinalR8}')
    expect(article).not.toContain('className={styles.hero}')
    expect(article).not.toContain('className={styles.heroUtilityRow}')
    expect(article).not.toContain('className={styles.heroTitleBlock}')
    expect(article).not.toContain('className={styles.heroProof}')
    expect(article).not.toContain('className={styles.heroHighlights}')
    expect(article).not.toContain('className={styles.lead}')

    expect(article.indexOf('heroFinalMetaR8')).toBeLessThan(article.indexOf('heroFinalProofR8'))
    expect(article.indexOf('heroFinalProofR8')).toBeLessThan(article.indexOf('heroFinalBodyR8'))
    expect(article.indexOf('heroFinalBodyR8')).toBeLessThan(article.indexOf('heroFinalRailR8'))
    expect(article.indexOf('heroFinalRailR8')).toBeLessThan(article.indexOf('heroFinalLeadR8'))

    expect(switcher).toContain("variant = 'default'")
    expect(switcher).toContain("variant === 'hero-final-r8'")
    expect(switcher).toContain('data-ql7-trust-language-variant')

    expect(r8).toContain('.heroFinalR8 {')
    expect(r8).toContain('display:block;')
    expect(r8).toContain('.heroFinalMetaLineR8 {')
    expect(r8).toContain('display:flex;')
    expect(r8).toContain('flex-wrap:wrap;')
    expect(r8).toContain('.heroFinalBodyR8 {')
    expect(r8).toContain('.heroFinalBodyR8 h1 {')
    expect(r8).toContain('.heroFinalRailR8 {')
    expect(r8).toContain('.heroFinalLeadR8 {')
    expect(r8).toContain('.heroFinalLanguageWrapR8 .languageMenu {')
    expect(r8).toContain('position:absolute !important;')
    expect(r8).toContain('z-index:9999 !important;')
    expect(r8).toContain('@container trustArticle (min-width:1080px)')
    expect(r8).toContain('@container trustArticle (max-width:980px)')
    expect(r8).toContain('@container trustArticle (max-width:680px)')
    expect(r8).toContain('@container trustArticle (max-width:430px)')
    expect(r8).toContain('overflow-wrap:break-word;')
    expect(r8).toContain('word-break:normal;')
    expect(r8).toContain('hyphens:none;')
    expect(r8).not.toContain('grid-template-areas:')
  })

  test('removes inherited mobile flex-basis gaps from the isolated R8 hero', () => {
    const css = readRepoFile('components/trust/TrustIdentityArticle.module.css')
    const r9 = css.slice(css.indexOf('QL7 TRUST SEO222 HERO MOBILE COMPACT R9'))

    expect(r9).toContain('@container trustArticle (max-width:680px)')
    expect(r9).toContain('.heroFinalStatementR8 {')
    expect(r9).toContain('flex:0 0 auto !important;')
    expect(r9).toContain('height:auto !important;')
    expect(r9).toContain('.heroFinalLanguageWrapR8 {')
    expect(r9).toContain('min-height:0 !important;')
    expect(r9).toContain('grid-template-columns:minmax(48px,58px) minmax(0,1fr);')
    expect(r9).toContain('.heroFinalStatusGridR8 {')
    expect(r9).toContain('@container trustArticle (max-width:430px)')
    expect(r9).toContain('@container trustArticle (max-width:340px)')
  })

  test('keeps R14 document-root ownership singular without breaking TopBar language switching', () => {
    const rootRuntime = readRepoFile('components/seo/RootLocaleRuntime.jsx')
    const languageSwitcher = readRepoFile('components/LanguageSwitcher.js')
    const topBar = readRepoFile('components/TopBar.js')
    const i18nRuntime = readRepoFile('components/i18n.js')

    expect(rootRuntime).toContain('QL7_DOCUMENT_ROOT_LOCALE_SINGLE_WRITER_R14')
    expect(rootRuntime).toContain('if (match) return toTrustRootLocale(match[1])')
    expect(rootRuntime).toContain('return toAppRootLocale(uiLang)')
    expect(rootRuntime).toContain("return { lang: safeLang, dir: safeLang === 'ar' ? 'rtl' : 'ltr' }")
    expect(rootRuntime).toContain("return { lang: safeLang, dir: 'ltr' }")
    expect(rootRuntime).toContain("root.setAttribute('lang', next.lang)")
    expect(rootRuntime).toContain("root.setAttribute('dir', next.dir)")

    expect(i18nRuntime).not.toContain('document.documentElement')
    expect(languageSwitcher).not.toContain('document.documentElement')
    expect(languageSwitcher).toContain("const { lang, setLang } = useI18n()")
    expect(languageSwitcher).toContain("const ORDER = ['ru','en','zh','uk','ar','tr','es']")
    expect(languageSwitcher).toContain('setLang(next)')
    expect(languageSwitcher).toContain('setLang(prev)')
    expect(languageSwitcher).toContain('onClick={goNext}')
    expect(languageSwitcher).toContain('onKeyDown={onKeyDown}')
    expect(topBar).toContain("import LanguageSwitcher from './LanguageSwitcher'")
    expect(topBar).toContain('<LanguageSwitcher />')
  })

  test('keeps built HTML standalone-badge verification isolated to visible text nodes', () => {
    const verifier = readRepoFile('tools/ql7-trust-identity-verify-built-html-final-baseline-v3.mjs')
    expect(verifier).toContain('VISIBLE_STANDALONE_QL7_TRUST_PATTERN')
    expect(verifier).toContain('visibleTextSegments')
    expect(verifier).toContain('visibleSegments.some((segment)')
    expect(verifier).not.toContain("!/QL7\\s*[·.-]\\s*TRUST/i.test(html)")
  })

  test('keeps semantic content server-renderable and isolates client behavior to language navigation', () => {
    const article = readRepoFile('components/trust/TrustIdentityArticle.jsx')
    const switcher = readRepoFile('components/trust/TrustIdentityLanguageSwitcher.jsx')
    const route = readRepoFile('app/[lang]/trust-and-identity/page.js')

    expect(article).not.toContain("'use client'")
    expect(article).toContain('content.presentation.verifiedBadge')
    expect(article).toContain('content.presentation.supportTextOnlyBadge')
    expect(article).not.toMatch(/\bfetch\s*\(|localStorage|sessionStorage|IntersectionObserver|<video|<canvas/i)
    expect(switcher).toContain("'use client'")
    expect(switcher).toContain('href={getTrustIdentityPath(itemLang)}')
    expect(switcher).toContain("aria-current={itemLang === lang ? 'page' : undefined}")
    expect(switcher).toContain('data-ql7-trust-language-selector="1"')
    expect(switcher).toContain('<details')
    expect(switcher).toContain('<summary')
    expect(route).toContain('generateStaticParams')
    expect(route).toContain('dynamicParams = false')
    expect(route).toContain('notFound()')
  })
})
