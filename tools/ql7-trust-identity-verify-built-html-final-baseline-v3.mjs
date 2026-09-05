#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { OFFICIAL_QUANTUM_L7_CHANNELS } from '../lib/brand/officialChannels.js'
import { getTrustIdentityContent, TRUST_IDENTITY_SECTION_IDS } from '../lib/seo/trustIdentityContent.js'
import {
  TRUST_IDENTITY_LANGS,
  TRUST_IDENTITY_PATHS_BY_LANG,
  TRUST_IDENTITY_X_DEFAULT_PATH,
  getTrustIdentityAbsoluteUrl,
} from '../lib/seo/trustIdentityRoutes.js'
import { QUANTUM_L7_ORGANIZATION_ID } from '../lib/seo/trustIdentityStructuredData.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const NEXT_ROOT = path.join(ROOT, '.next')
const SERVER_APP = path.join(NEXT_ROOT, 'server', 'app')
const PRERENDER_MANIFEST = path.join(NEXT_ROOT, 'prerender-manifest.json')
const MARKER = 'QL7_TRUST_IDENTITY_BUILT_HTML_VERIFY_FINAL_BASELINE_V3'

function writeOptionalReport(result) {
  const index = process.argv.indexOf('--out')
  if (index < 0) return
  const raw = process.argv[index + 1]
  if (!raw) throw new Error('missing_value_for_--out')
  const out = path.resolve(process.cwd(), raw)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}


function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function htmlFileFor(lang) {
  const direct = path.join(SERVER_APP, lang, 'trust-and-identity.html')
  if (fs.existsSync(direct)) return direct
  const hits = []
  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile() && entry.name === 'trust-and-identity.html') hits.push(abs)
    }
  }
  walk(SERVER_APP)
  const normalizedNeedle = `/${lang}/trust-and-identity.html`
  return hits.find((entry) => entry.replace(/\\/g, '/').endsWith(normalizedNeedle)) || null
}

function count(source, rx) {
  return [...source.matchAll(rx)].length
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

const VISIBLE_STANDALONE_QL7_TRUST_PATTERN = /^QL7\s*[·.-]\s*TRUST$/i

function visibleTextSegments(html) {
  return String(html)
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, '\n')
    .replace(/<!--[\s\S]*?-->/g, '\n')
    .replace(/<[^>]+>/g, '\n')
    .split(/\r?\n/)
    .map((value) => decodeHtml(value).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function tagText(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeHtml(match[1].replace(/<[^>]+>/g, '')) : ''
}

function metaDescription(html) {
  const tag = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0] || ''
  const value = tag.match(/content="([^"]*)"/i)?.[1] ?? tag.match(/content='([^']*)'/i)?.[1] ?? ''
  return decodeHtml(value)
}

function getArticleTag(html) {
  return html.match(/<article\b[^>]*data-ql7-trust-identity="2026-08-14-v3"[^>]*>/i)?.[0]
    || html.match(/<article\b[^>]*>/i)?.[0]
    || ''
}

function getRootHtmlTag(html) {
  return html.match(/<html\b[^>]*>/i)?.[0] || ''
}

if (!fs.existsSync(PRERENDER_MANIFEST)) {
  console.error(`${MARKER}: missing ${path.relative(ROOT, PRERENDER_MANIFEST)}`)
  process.exit(1)
}
const manifest = JSON.parse(fs.readFileSync(PRERENDER_MANIFEST, 'utf8'))
const manifestRoutes = Object.keys(manifest.routes || {})
const manifestDynamicRoutes = Object.keys(manifest.dynamicRoutes || {})

const localeProofs = []
for (const lang of TRUST_IDENTITY_LANGS) {
  const route = TRUST_IDENTITY_PATHS_BY_LANG[lang]
  const content = getTrustIdentityContent(lang)
  const file = htmlFileFor(lang)
  const exists = !!file && fs.existsSync(file)
  const bytes = exists ? fs.readFileSync(file) : Buffer.alloc(0)
  const html = bytes.toString('utf8')
  const articleTag = getArticleTag(html)
  const rootHtmlTag = getRootHtmlTag(html)
  const expectedDir = lang === 'ar' ? 'rtl' : 'ltr'
  const hreflangs = new Set([...html.matchAll(/hreflang=["']([^"']+)["']/gi)].map((match) => match[1].toLowerCase()))
  const expectedHreflangs = [...TRUST_IDENTITY_LANGS, 'x-default']
  const canonicalAbsolute = getTrustIdentityAbsoluteUrl(lang)
  const expectedOfficialUrls = OFFICIAL_QUANTUM_L7_CHANNELS.map((entry) => entry.url)
  const visibleSegments = visibleTextSegments(html)
  const checks = {
    routePrerendered: manifestRoutes.includes(route),
    htmlExists: exists,
    oneH1: count(html, /<h1\b/gi) === 1,
    rootHtmlLang: new RegExp(`\\blang=["']${lang}["']`, 'i').test(rootHtmlTag),
    rootHtmlDir: new RegExp(`\\bdir=["']${expectedDir}["']`, 'i').test(rootHtmlTag),
    rootHtmlLangUnique: count(rootHtmlTag, /\blang=(["'])[^"']*\1/gi) === 1,
    rootHtmlDirUnique: count(rootHtmlTag, /\bdir=(["'])[^"']*\1/gi) === 1,
    articleLang: new RegExp(`\\blang=["']${lang}["']`, 'i').test(articleTag),
    articleDir: new RegExp(`\\bdir=["']${expectedDir}["']`, 'i').test(articleTag),
    trustVersionMarker: articleTag.includes('data-ql7-trust-identity="2026-08-14-v3"'),
    metadataTitle: tagText(html, 'title') === content.meta.title,
    metadataDescription: metaDescription(html) === content.meta.description,
    heroTitleVisible: tagText(html, 'h1') === content.hero.title,
    heroLeadVisible: html.includes(content.hero.lead),
    versionVisible: html.includes('2026-08-14-v3') && html.includes('2026-08-14'),
    allSectionIds: TRUST_IDENTITY_SECTION_IDS.every((id) => new RegExp(`\\bid=["']${id}["']`, 'i').test(html)),
    officialRegistryVisible: expectedOfficialUrls.every((url) => html.includes(url)),
    eightFaqDetails: count(html, /<details\b[^>]*data-ql7-trust-faq=["']1["']/gi) === 8,
    premiumLanguageSelector: html.includes('data-ql7-trust-language-selector="1"'),
    premiumSurfaceMarker: articleTag.includes('data-ql7-trust-premium-surface="v3"'),
    heroFinalR8LayoutMarker: articleTag.includes('data-ql7-trust-layout="hero-final-r8"'),
    heroFinalR8FlowMarker: html.includes('data-ql7-trust-hero-flow="single-stack-r8"'),
    heroFinalR8ContractMarker: html.includes('data-ql7-trust-hero-contract="meta-then-title-rail-copy"'),
    heroFinalR8MetaMarker: html.includes('data-ql7-trust-hero-meta="badge-highlights-selector-proof"'),
    heroFinalR8IdentityTableMarker: html.includes('data-ql7-trust-identity-table="r8"'),
    heroFinalR8ReadingFlowMarker: html.includes('data-ql7-trust-reading-flow="full-width-title-rail-copy-r8"'),
    heroFinalR8LanguageVariantMarker: html.includes('data-ql7-trust-language-variant="hero-final-r8"'),
    languageOverlayMarker: html.includes('data-ql7-trust-language-overlay="1"'),
    machineStackedFlowMarker: html.includes('data-ql7-machine-flow="stacked"'),
    thirteenStackedSectionFlows: count(html, /data-ql7-trust-section-flow=["']stacked["']/gi) === 13,
    localizedPremiumBadges: [content.presentation.officialBadge, content.presentation.verifiedBadge, content.presentation.supportTextOnlyBadge, content.presentation.machineBadge].every((value) => html.includes(value)),
    companyVoiceHeadingsVisible: content.sections.slice(0, 4).every((section) => html.includes(section.title)),
    fiveLayerDepthVisible: count(html, /<details\b[^>]*data-ql7-trust-depth=["']5["']/gi) === 13,
    machineIdentityPanelVisible: html.includes('data-ql7-machine-identity="1"') && html.includes('/.well-known/ql7-identity.json') && html.includes('/llms.txt'),
    noDecorativeStandaloneQl7Trust: !visibleSegments.some((segment) => VISIBLE_STANDALONE_QL7_TRUST_PATTERN.test(segment)),
    canonicalSelf: html.includes(canonicalAbsolute) && new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']${canonicalAbsolute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html),
    reciprocalHreflang: expectedHreflangs.every((item) => hreflangs.has(item)),
    xDefaultEnglish: html.includes(getTrustIdentityAbsoluteUrl('en')) && TRUST_IDENTITY_X_DEFAULT_PATH === '/en/trust-and-identity',
    organizationJsonLd: html.includes('https://schema.org') && html.includes('Organization') && html.includes(QUANTUM_L7_ORGANIZATION_ID),
    aboutPageJsonLd: html.includes('AboutPage') && html.includes(`${canonicalAbsolute}#webpage`),
    noForbiddenStructuredTypes: !/(?:FAQPage|QAPage|InvestmentFund|BankOrCreditUnion|FinancialProduct)/.test(html),
  }
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key)
  localeProofs.push({
    lang,
    route,
    htmlFile: file ? path.relative(ROOT, file).replace(/\\/g, '/') : '',
    bytes: bytes.length,
    sha256: exists ? sha256(bytes) : '',
    checks,
    failed,
    ok: failed.length === 0,
  })
}

const globalChecks = {
  nextBuildPresent: fs.existsSync(NEXT_ROOT),
  prerenderManifestPresent: fs.existsSync(PRERENDER_MANIFEST),
  allSevenConcreteRoutesInManifest: TRUST_IDENTITY_LANGS.every((lang) => manifestRoutes.includes(TRUST_IDENTITY_PATHS_BY_LANG[lang])),
  noTrustRedirectAsPrerenderDocument: !manifestRoutes.includes('/trust-and-identity'),
  dynamicRouteDoesNotReplaceConcreteProof: !manifestDynamicRoutes.includes('/[lang]/trust-and-identity') || TRUST_IDENTITY_LANGS.every((lang) => manifestRoutes.includes(TRUST_IDENTITY_PATHS_BY_LANG[lang])),
  sevenLocaleHtmlProofs: localeProofs.length === 7 && localeProofs.every((entry) => entry.ok),
}
const failed = [
  ...Object.entries(globalChecks).filter(([, ok]) => !ok).map(([key]) => key),
  ...localeProofs.flatMap((entry) => entry.failed.map((key) => `${entry.lang}:${key}`)),
]
const result = {
  ok: failed.length === 0,
  marker: MARKER,
  checks: globalChecks,
  failed,
  manifest: {
    routes: manifestRoutes.filter((route) => route.includes('trust-and-identity')),
    dynamicRoutes: manifestDynamicRoutes.filter((route) => route.includes('trust-and-identity')),
  },
  locales: localeProofs,
}
writeOptionalReport(result)
console.log(JSON.stringify(result, null, 2))
if (!result.ok) process.exit(1)
console.log(`${MARKER}_OK`)
