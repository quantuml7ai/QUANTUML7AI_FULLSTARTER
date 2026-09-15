import { describe, expect, it } from 'vitest'
import {
  NON_INDEXED_PAGE_ROUTES,
  PUBLIC_INDEX_ROUTES,
  ROBOTS_DISALLOW_PATHS,
  SEO_SUPPORTED_LANGS,
  TRUST_IDENTITY_PUBLIC_ROUTES,
} from '../../../lib/seo/siteIndex.js'
import {
  buildMultilingualWebsiteStructuredData,
  SEO_LANGUAGE_DESCRIPTIONS,
} from '../../../lib/seo/structuredData.js'
import { I18N_SUPPORTED_LANGS } from '../../../components/i18n-dicts/manifest.js'
import robots from '../../../app/robots.js'
import sitemap from '../../../app/sitemap.js'
import {
  normalizeSiteOrigin,
  SITE_ORIGIN_ENV_KEY,
} from '../../../lib/seo/siteOrigin.js'
import {
  TRUST_IDENTITY_LANGS,
  TRUST_IDENTITY_PATHS_BY_LANG,
} from '../../../lib/seo/trustIdentityRoutes.js'
import { listProjectFiles, readRepoFile } from '../../support/projectSurface.js'

const pageFiles = listProjectFiles('app', (relPath) => /\/page\.(?:js|jsx|ts|tsx)$/i.test(relPath))
const classifiedEntries = [...PUBLIC_INDEX_ROUTES, ...NON_INDEXED_PAGE_ROUTES]
const classifiedPaths = classifiedEntries.map(({ path }) => path)
const classifiedPageFiles = [...new Set(classifiedEntries.map(({ pageFile }) => pageFile))].sort()

describe('SEO indexing governance contracts', () => {
  it('uses the project canonical URL variable and validates its shape', () => {
    const originSource = readRepoFile('lib/seo/siteOrigin.js')
    const envExample = readRepoFile('.env.local.example')

    expect(SITE_ORIGIN_ENV_KEY).toBe('NEXT_PUBLIC_SITE_URL')
    expect(originSource.indexOf('process.env.NEXT_PUBLIC_SITE_URL')).toBeLessThan(
      originSource.indexOf('process.env.NEXT_PUBLIC_SITE_ORIGIN'),
    )
    expect(envExample).toContain('NEXT_PUBLIC_SITE_URL=https://www.quantuml7ai.com')
    expect(normalizeSiteOrigin('https://www.quantuml7ai.com/')).toBe('https://www.quantuml7ai.com')
    expect(() => normalizeSiteOrigin('https://www.quantuml7ai.com/path?x=1#hash')).toThrow(
      /canonical HTTPS origin/,
    )
    expect(() => normalizeSiteOrigin('http://www.quantuml7ai.com')).toThrow(/HTTPS URL/)
    expect(() => normalizeSiteOrigin('not-a-url')).toThrow(/HTTPS URL/)
  })

  it('classifies every real page file and every public URL without duplicate path ownership', () => {
    expect(new Set(classifiedPaths).size).toBe(classifiedPaths.length)
    expect(classifiedPageFiles).toEqual([...pageFiles].sort())

    const dynamicTrustEntries = classifiedEntries.filter(
      (entry) => entry.pageFile === 'app/[lang]/trust-and-identity/page.js',
    )
    expect(dynamicTrustEntries).toHaveLength(7)
    expect(dynamicTrustEntries.map((entry) => entry.locale)).toEqual(TRUST_IDENTITY_LANGS)
    expect(dynamicTrustEntries.map((entry) => entry.path)).toEqual(
      TRUST_IDENTITY_LANGS.map((lang) => TRUST_IDENTITY_PATHS_BY_LANG[lang]),
    )
  })

  it('keeps every public indexed route backed by a page and metadata owner', () => {
    PUBLIC_INDEX_ROUTES.forEach(({ path, pageFile, metadataFile, metadataMode }) => {
      expect(pageFiles).toContain(pageFile)
      expect(() => readRepoFile(metadataFile)).not.toThrow()
      const metadataSource = readRepoFile(metadataFile)

      if (metadataMode === 'generated') {
        expect(metadataSource).toContain('generateMetadata')
        expect(metadataSource).toContain('buildTrustIdentityMetadata')
        const helper = readRepoFile('lib/seo/trustIdentityMetadata.js')
        expect(helper).toContain('description:')
        expect(helper).toContain('canonical: path')
        expect(helper).toContain('languages: buildTrustIdentityAlternates()')
        return
      }

      expect(metadataSource).toContain('export const metadata')
      expect(metadataSource).toContain('description:')
      expect(metadataSource).toContain('canonical:')
      expect(metadataSource).toContain(`'${path}'`)
    })
  })

  it('keeps every non-indexed page explicit and documented', () => {
    NON_INDEXED_PAGE_ROUTES.forEach(({ path, pageFile, metadataFile, reason }) => {
      expect(pageFiles).toContain(pageFile)
      expect(reason.trim().length).toBeGreaterThan(20)
      const metadataSource = readRepoFile(metadataFile)
      expect(metadataSource).toContain('index: false')
      expect(PUBLIC_INDEX_ROUTES.some((route) => route.path === path)).toBe(false)
    })
  })

  it('keeps sitemap and robots wired to the canonical route registry', () => {
    const sitemapSource = readRepoFile('app/sitemap.js')
    const robotsSource = readRepoFile('app/robots.js')

    expect(sitemapSource).toContain('PUBLIC_INDEX_ROUTES')
    expect(sitemapSource).toContain('toAbsoluteSiteUrl')
    expect(sitemapSource).toContain("lib/seo/siteOrigin")
    expect(sitemapSource).not.toContain('metadataCache')
    expect(robotsSource).toContain('ROBOTS_DISALLOW_PATHS')
    expect(robotsSource).toContain('SITE_ORIGIN')
    expect(robotsSource).toContain("lib/seo/siteOrigin")
    expect(robotsSource).not.toContain('metadataCache')
    expect(robotsSource).toContain('/sitemap.xml')

    expect(sitemap().map((entry) => new URL(entry.url).pathname)).toEqual(
      PUBLIC_INDEX_ROUTES.map(({ path }) => path),
    )
    const robotsOutput = robots()
    expect(robotsOutput.rules[0].disallow).toEqual([...ROBOTS_DISALLOW_PATHS])
    expect(robotsOutput.sitemap).toMatch(/\/sitemap\.xml$/)
  })

  it('does not expose blocked technical zones through the sitemap', () => {
    PUBLIC_INDEX_ROUTES.forEach(({ path }) => {
      ROBOTS_DISALLOW_PATHS.forEach((blockedPath) => {
        expect(path.startsWith(blockedPath)).toBe(false)
      })
    })
    expect(ROBOTS_DISALLOW_PATHS).toContain('/api/')
  })

  it('advertises language alternates only for the real Trust & Identity route family', () => {
    const rootLayout = readRepoFile('app/layout.js')
    expect(rootLayout).not.toMatch(/\blanguages\s*:/)
    expect(TRUST_IDENTITY_PUBLIC_ROUTES).toHaveLength(7)

    const trustSitemap = sitemap().filter((entry) =>
      /\/(?:en|ru|uk|es|tr|ar|zh)\/trust-and-identity$/.test(new URL(entry.url).pathname),
    )
    expect(trustSitemap).toHaveLength(7)
    for (const entry of trustSitemap) {
      expect(Object.keys(entry.alternates.languages)).toEqual([
        'en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'x-default',
      ])
    }
  })

  it('publishes exact crawler language signals for every Trust locale while preserving static root ownership', () => {
    const rootLayout = readRepoFile('app/layout.js')
    const nextConfig = readRepoFile('next.config.mjs')
    const finalizer = readRepoFile('tools/ql7-finalize-localized-trust-root-html.mjs')
    const bundleCheck = readRepoFile('tools/ql7-hevc-browser-bundle-check-v9.mjs')

    expect(rootLayout).not.toContain("from 'next/headers'")
    expect(rootLayout).toContain('<RootLocaleRuntime />')
    expect(nextConfig).toContain("key: 'Content-Language'")
    expect(nextConfig).toContain('QL7_TRUST_CONTENT_LANGUAGE_MUTABLE_NEXT_ROUTES_V2')
    expect(nextConfig).not.toContain('trustIdentityContentLanguageHeaders = Object.freeze')
    TRUST_IDENTITY_LANGS.forEach((lang) => {
      expect(nextConfig).toContain(`['/${lang}/trust-and-identity', '${lang}']`)
      expect(finalizer).toContain(`/${lang}/trust-and-identity`)
    })
    expect(finalizer).toContain("ar: Object.freeze({ route: '/ar/trust-and-identity', dir: 'rtl' })")
    expect(bundleCheck).toContain('finalizeLocalizedTrustRootHtml({ root })')
  })

  it('keeps Google Search Console ownership verification in root metadata', () => {
    const rootLayout = readRepoFile('app/layout.js')

    expect(rootLayout).toContain('verification:')
    expect(rootLayout).toContain('google:')
    expect(rootLayout).toContain('kqwdLNLkj1d8JnC_RM37P2SA4O4PBlEB3IbobzZgxEc')
  })

  it('publishes truthful multilingual discovery data for every dictionary language', () => {
    const rootLayout = readRepoFile('app/layout.js')
    const structuredData = buildMultilingualWebsiteStructuredData()
    const graphLanguages = structuredData['@graph'].map((entry) => entry.inLanguage).sort()

    expect([...SEO_SUPPORTED_LANGS].sort()).toEqual([...I18N_SUPPORTED_LANGS].sort())
    expect(Object.keys(SEO_LANGUAGE_DESCRIPTIONS).sort()).toEqual([...I18N_SUPPORTED_LANGS].sort())
    expect(graphLanguages).toEqual([...I18N_SUPPORTED_LANGS].sort())
    expect(new Set(Object.values(SEO_LANGUAGE_DESCRIPTIONS)).size).toBe(I18N_SUPPORTED_LANGS.length)
    Object.values(SEO_LANGUAGE_DESCRIPTIONS).forEach((description) => {
      expect(description.length).toBeGreaterThan(70)
    })
    expect(rootLayout).toContain('buildMultilingualWebsiteStructuredData')
    expect(rootLayout).toContain('QuantumOrganizationJsonLd')
    expect(rootLayout).toContain('name="google" content="notranslate"')
    expect(rootLayout).toContain('translate="no"')
    expect(rootLayout).toContain('notranslate')
  })

  it('keeps the mandatory indexing governance documented', () => {
    const agents = readRepoFile('AGENTS.md')
    const governance = readRepoFile('docs/seo-indexing-governance.md')

    expect(agents).toContain('SEO Indexing Governance Rules')
    expect(agents).toContain('Trust & Identity Governance Rules')
    expect(agents).toContain('lib/seo/siteIndex.js')
    expect(agents).toContain('pnpm test:codex')
    expect(governance).toContain('PUBLIC_INDEX_ROUTES')
    expect(governance).toContain('NON_INDEXED_PAGE_ROUTES')
    expect(governance).toContain('ROBOTS_DISALLOW_PATHS')
    expect(governance).toContain('/en/trust-and-identity')
  })
})
