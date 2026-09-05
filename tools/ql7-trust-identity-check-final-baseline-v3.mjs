#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import en from '../components/i18n-dicts/en.js'
import ru from '../components/i18n-dicts/ru.js'
import uk from '../components/i18n-dicts/uk.js'
import es from '../components/i18n-dicts/es.js'
import tr from '../components/i18n-dicts/tr.js'
import ar from '../components/i18n-dicts/ar.js'
import zh from '../components/i18n-dicts/zh.js'
import { I18N_DICT_META, I18N_SUPPORTED_LANGS } from '../components/i18n-dicts/manifest.js'
import {
  OFFICIAL_QUANTUM_L7_CHANNELS,
  OFFICIAL_QUANTUM_L7_SAME_AS,
} from '../lib/brand/officialChannels.js'
import {
  TRUST_IDENTITY_FAQ_IDS,
  TRUST_IDENTITY_SECTION_IDS,
  auditTrustIdentityContent,
  getTrustIdentityContent,
} from '../lib/seo/trustIdentityContent.js'
import { buildTrustIdentityMetadata } from '../lib/seo/trustIdentityMetadata.js'
import {
  TRUST_IDENTITY_LANGS,
  TRUST_IDENTITY_PATHS_BY_LANG,
  TRUST_IDENTITY_X_DEFAULT_PATH,
  buildTrustIdentityAlternates,
} from '../lib/seo/trustIdentityRoutes.js'
import {
  QUANTUM_L7_ORGANIZATION_ID,
  buildQuantumOrganizationStructuredData,
  buildTrustIdentityPageStructuredData,
  serializeStructuredData,
} from '../lib/seo/trustIdentityStructuredData.js'
import { PUBLIC_INDEX_ROUTES, ROBOTS_DISALLOW_PATHS } from '../lib/seo/siteIndex.js'
import { SITE_ORIGIN } from '../lib/seo/siteOrigin.js'
import sitemap from '../app/sitemap.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MARKER = 'QL7_TRUST_IDENTITY_MULTILINGUAL_SEO_CHECK_FINAL_BASELINE_V3'
const BASE_ARCHIVE_SHA256 = '906CA331A89CA5094D8B13414F96D2268BFB8840A7DDD5C32C836A4082085469'
const DICTS = { en, ru, uk, es, tr, ar, zh }
const EXPECTED_CHANNELS = [
  'https://www.quantuml7ai.com/',
  'https://x.com/QL7Company',
  'https://www.instagram.com/quantuml7ai/',
  'https://www.tiktok.com/@ql7ai',
  'https://www.youtube.com/channel/UCXby6llW_TokAUGoOebFXhg',
  'https://t.me/l7universe',
  'https://t.me/l7ai_bot',
]
const EXPECTED_SAME_AS = EXPECTED_CHANNELS.slice(1, 6)

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^\uFEFF/, '')
}
function shaDict(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b) }

const audit = auditTrustIdentityContent()
const contents = Object.fromEntries(TRUST_IDENTITY_LANGS.map((lang) => [lang, getTrustIdentityContent(lang)]))
const baseShape = {
  sections: contents.en.sections.map((entry) => entry.id),
  faq: contents.en.faq.map((entry) => entry.id),
  checklist: contents.en.safetyChecklist.length,
}
const metadata = Object.fromEntries(TRUST_IDENTITY_LANGS.map((lang) => [lang, buildTrustIdentityMetadata(lang)]))
const organization = buildQuantumOrganizationStructuredData()
const sitemapRows = sitemap()
const robotsSource = read('app/robots.js')
const i18nSource = read('components/i18n.source.js')
const routeSource = read('app/[lang]/trust-and-identity/page.js')
const redirectSource = read('app/trust-and-identity/route.js')
const articleSource = read('components/trust/TrustIdentityArticle.jsx')
const switcherSource = read('components/trust/TrustIdentityLanguageSwitcher.jsx')
const cssSource = read('components/trust/TrustIdentityArticle.module.css')
const rootLayout = read('app/layout.js')
const aboutSource = read('app/about/page.js')
const aboutTeaserSource = read('components/trust/TrustIdentityAboutTeaser.jsx')
const contactSource = read('app/contact/page.js')
const contactLayout = read('app/contact/layout.js')
const topBarSource = read('components/TopBar.js')
const languageSwitcherSource = read('components/LanguageSwitcher.js')
const supportRegistry = read('lib/ql7-support/knowledgeRegistry.js')
const supportKnowledge = read('lib/ql7-support/knowledge/officialIdentity.js')
const seoGovernance = read('docs/seo-indexing-governance.md')
const trustGovernance = read('docs/trust-identity-governance.md')
const agents = read('AGENTS.md')
const structuredSource = read('lib/seo/trustIdentityStructuredData.js')
const projectDocsShared = read('tools/project-docs-shared.js')
const projectTreeGenerator = read('tools/generate-project-tree.js')
const sourceIntegrityGate = read('tools/ql7-trust-identity-source-integrity-final-baseline-v3.mjs')
const builtHtmlVerifier = read('tools/ql7-trust-identity-verify-built-html-final-baseline-v3.mjs')
const qcoinDebugRoute = read('app/api/debug/qcoin/topup/grant/route.js')
const gitignoreSource = read('.gitignore')
const globalsSource = read('app/globals.css')
const machineIdentitySource = read('lib/seo/trustIdentityMachineIdentity.js')
const machineGeneratorSource = read('tools/generate-trust-identity-machine-surfaces.mjs')
const machineManifest = JSON.parse(read('public/.well-known/ql7-identity.json'))
const llmsSource = read('public/llms.txt')
const websiteStructuredSource = read('lib/seo/structuredData.js')
const rootLocaleRuntimeSource = read('components/seo/RootLocaleRuntime.jsx')
const i18nRuntimeSource = read('components/i18n.js')
const rootHtmlFinalizerSource = read('tools/ql7-finalize-localized-trust-root-html.mjs')
const nextConfigSource = read('next.config.mjs')
const hevcBundleCheckSource = read('tools/ql7-hevc-browser-bundle-check-v9.mjs')
const packageSource = read('package.json')
const packageJson = JSON.parse(packageSource)
const packageSha256 = createHash('sha256').update(packageSource).digest('hex')

const checks = {
  marker: MARKER.endsWith('V3'),
  exactArchiveGuardDeclared: BASE_ARCHIVE_SHA256 === '906CA331A89CA5094D8B13414F96D2268BFB8840A7DDD5C32C836A4082085469',
  sevenLocales: same(TRUST_IDENTITY_LANGS, ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh']),
  i18nAudit: audit.ok && audit.languages.length === 7,
  contentVersion: TRUST_IDENTITY_LANGS.every((lang) => contents[lang].version.value === '2026-08-14-v3' && contents[lang].version.reviewedAt === '2026-08-14'),
  sectionParity: TRUST_IDENTITY_LANGS.every((lang) => same(contents[lang].sections.map((entry) => entry.id), baseShape.sections)) && same(baseShape.sections, TRUST_IDENTITY_SECTION_IDS),
  faqParity: TRUST_IDENTITY_LANGS.every((lang) => same(contents[lang].faq.map((entry) => entry.id), baseShape.faq)) && same(baseShape.faq, TRUST_IDENTITY_FAQ_IDS),
  checklistParity: TRUST_IDENTITY_LANGS.every((lang) => contents[lang].safetyChecklist.length === baseShape.checklist) && baseShape.checklist === 8,
  noTranslatedUrls: TRUST_IDENTITY_LANGS.every((lang) => !/https?:\/\//i.test(JSON.stringify(contents[lang]))),
  noPlaceholders: TRUST_IDENTITY_LANGS.every((lang) => !/\b(?:TODO|lorem ipsum|placeholder)\b/i.test(JSON.stringify(contents[lang]))),
  arScriptQuality: (JSON.stringify(contents.ar).match(/[\u0600-\u06FF]/g) || []).length > 4000,
  zhScriptQuality: (JSON.stringify(contents.zh).match(/[\u3400-\u9FFF]/g) || []).length > 1500,
  nonEnglishNotFallback: TRUST_IDENTITY_LANGS.filter((lang) => lang !== 'en').every((lang) => JSON.stringify(contents[lang]) !== JSON.stringify(contents.en)),
  splitManifestParity: I18N_SUPPORTED_LANGS.every((lang) => I18N_DICT_META[lang]?.keyCount === Object.keys(DICTS[lang]).length && I18N_DICT_META[lang]?.hash === shaDict(DICTS[lang]) && !!DICTS[lang].trust_identity),
  sourceMarker: i18nSource.includes('QL7_TRUST_IDENTITY_MULTILINGUAL_SEO_V1_BEGIN') && i18nSource.includes('QL7_TRUST_IDENTITY_MULTILINGUAL_SEO_V1_END'),
  officialChannelsExact: same(OFFICIAL_QUANTUM_L7_CHANNELS.map((entry) => entry.url), EXPECTED_CHANNELS),
  sameAsExact: same(OFFICIAL_QUANTUM_L7_SAME_AS, EXPECTED_SAME_AS),
  organizationIdentityRegistryPartitioned: organization.url === EXPECTED_CHANNELS[0] && same(organization.sameAs, EXPECTED_SAME_AS) && same(machineManifest.officialChannels.map((entry) => entry.url), EXPECTED_CHANNELS) && EXPECTED_CHANNELS.every((url) => llmsSource.includes(url)),
  dependencyManifestPinPreserved: packageSha256 === '8f68ba866c9ed8ffe76597bdfa9be6aab9b4250344e526a92d654cc7c1f833c5' && packageJson.scripts?.build === 'pnpm -s ql7:hevc:vendor && pnpm -s ql7:hevc:assets:check && next build && pnpm -s ql7:hevc:bundle:check',
  rootLocaleRawHtmlFinalization: rootHtmlFinalizerSource.includes('QL7_TRUST_IDENTITY_LOCALIZED_ROOT_HTML_FINALIZER_V2') && TRUST_IDENTITY_LANGS.every((lang) => rootHtmlFinalizerSource.includes(`/${lang}/trust-and-identity`)) && rootHtmlFinalizerSource.includes("replaceAttr(openTag, 'lang', lang)") && rootHtmlFinalizerSource.includes("replaceAttr(nextTag, 'dir', config.dir)") && builtHtmlVerifier.includes('rootHtmlLang:') && builtHtmlVerifier.includes('rootHtmlDir:') && builtHtmlVerifier.includes('rootHtmlLangUnique:') && builtHtmlVerifier.includes('rootHtmlDirUnique:'),
  rootLocalePostBuildHookWithoutPackageMutation: hevcBundleCheckSource.includes("import { finalizeLocalizedTrustRootHtml } from './ql7-finalize-localized-trust-root-html.mjs'") && hevcBundleCheckSource.includes('finalizeLocalizedTrustRootHtml({ root })') && packageJson.scripts?.['ql7:hevc:bundle:check'] === 'node tools/ql7-hevc-browser-bundle-check-v9.mjs',
  rootLocaleClientNavigationSync: rootLayout.includes("import RootLocaleRuntime from '../components/seo/RootLocaleRuntime'") && rootLayout.includes('<RootLocaleRuntime />') && rootLocaleRuntimeSource.includes("'use client'") && rootLocaleRuntimeSource.includes('usePathname') && rootLocaleRuntimeSource.includes('useI18n') && rootLocaleRuntimeSource.includes('resolveDocumentRootLocale(pathname, uiLang)') && rootLocaleRuntimeSource.includes("root.setAttribute('lang', next.lang)") && rootLocaleRuntimeSource.includes("root.setAttribute('dir', next.dir)") && rootLocaleRuntimeSource.includes('QL7_TRUST_IDENTITY_HYDRATED_ROOT_LOCALE_AUTHORITY_R13'),
  rootLocaleHydrationSingleWriterR13: !i18nRuntimeSource.includes("document.documentElement.setAttribute('lang'") && !i18nRuntimeSource.includes("document.documentElement.setAttribute('dir'") && rootLocaleRuntimeSource.includes('const { lang: uiLang } = useI18n()') && rootLocaleRuntimeSource.includes('TRUST_ROUTE_RE') && rootLocaleRuntimeSource.includes("root.setAttribute('lang', next.lang)") && rootLocaleRuntimeSource.includes("root.setAttribute('dir', next.dir)"),
  rootLocaleHydrationSingleWriterR14: rootLocaleRuntimeSource.includes('QL7_DOCUMENT_ROOT_LOCALE_SINGLE_WRITER_R14') && !languageSwitcherSource.includes('document.documentElement') && !languageSwitcherSource.includes("setAttribute('dir'") && !languageSwitcherSource.includes("setAttribute('lang'") && rootLocaleRuntimeSource.includes('if (match) return toTrustRootLocale(match[1])') && rootLocaleRuntimeSource.includes('return toAppRootLocale(uiLang)') && rootLocaleRuntimeSource.includes("return { lang: safeLang, dir: safeLang === 'ar' ? 'rtl' : 'ltr' }") && rootLocaleRuntimeSource.includes("return { lang: safeLang, dir: 'ltr' }"),
  topBarLanguageSwitchingPreservedR14: topBarSource.includes("import LanguageSwitcher from './LanguageSwitcher'") && topBarSource.includes('<LanguageSwitcher />') && languageSwitcherSource.includes("const { lang, setLang } = useI18n()") && languageSwitcherSource.includes("const ORDER = ['ru','en','zh','uk','ar','tr','es']") && languageSwitcherSource.includes('setLang(next)') && languageSwitcherSource.includes('setLang(prev)') && languageSwitcherSource.includes("FLAG = {") && languageSwitcherSource.includes("data-lang={lang}") && languageSwitcherSource.includes("onClick={goNext}") && languageSwitcherSource.includes("onKeyDown={onKeyDown}") && !languageSwitcherSource.includes('document.documentElement'),
  contentLanguageHeadersSeven: nextConfigSource.includes('trustIdentityContentLanguageHeaderPairs') && nextConfigSource.includes("key: 'Content-Language'") && TRUST_IDENTITY_LANGS.every((lang) => nextConfigSource.includes(`['/${lang}/trust-and-identity', '${lang}']`)),
  rootLayoutRemainsStatic: !rootLayout.includes("from 'next/headers'") && !rootLayout.includes('await headers(') && !rootLayout.includes('await cookies('),
  contentLanguageRoutesMutableForNext: nextConfigSource.includes('QL7_TRUST_CONTENT_LANGUAGE_MUTABLE_NEXT_ROUTES_V2') && nextConfigSource.includes('buildTrustIdentityContentLanguageHeaders()') && !nextConfigSource.includes('trustIdentityContentLanguageHeaders = Object.freeze'),
  topBarRegistryOnly: topBarSource.includes('OFFICIAL_QUANTUM_L7_CHANNELS') && EXPECTED_CHANNELS.slice(1, 6).every((url) => !topBarSource.includes(url)),
  routeServerComponent: !routeSource.includes("'use client'") && routeSource.includes('generateStaticParams') && routeSource.includes('dynamicParams = false') && routeSource.includes('notFound()'),
  articleServerSemantic: !articleSource.includes("'use client'") && !/\bfetch\s*\(|localStorage|sessionStorage|IntersectionObserver|<video|<canvas/i.test(articleSource),
  switcherOnlyClient: switcherSource.includes("'use client'") && switcherSource.includes('href={getTrustIdentityPath(itemLang)}') && switcherSource.includes('aria-current') && switcherSource.includes('data-ql7-trust-language-selector="1"') && switcherSource.includes('<details') && switcherSource.includes('<summary'),
  premiumUiBounds: cssSource.includes('width:min(100%,1180px)') && cssSource.includes('container-type:inline-size') && cssSource.includes('container-name:trustArticle') && cssSource.includes('@container trustArticle (max-width:980px)') && cssSource.includes('@container trustArticle (max-width:860px)') && cssSource.includes('@container trustArticle (max-width:560px)') && cssSource.includes('@media (max-width:760px)') && cssSource.includes('@media (prefers-reduced-motion:reduce)'),
  premiumSurfaceContract: articleSource.includes('data-ql7-trust-premium-surface="v3"') && articleSource.includes('content.presentation.verifiedBadge') && articleSource.includes('content.presentation.supportTextOnlyBadge') && articleSource.includes('content.presentation.machineBadge') && aboutTeaserSource.includes('data-ql7-about-trust-premium="2"') && aboutTeaserSource.includes('content.presentation.officialBadge') && contactSource.includes('data-ql7-trust-contact-premium="1"') && contactSource.includes('content.presentation.supportTextOnlyBadge'),
  heroFinalR8SourceOrder: articleSource.includes('data-ql7-trust-layout="hero-final-r8"') && articleSource.includes('data-ql7-trust-hero-flow="single-stack-r8"') && articleSource.includes('data-ql7-trust-hero-contract="meta-then-title-rail-copy"') && articleSource.includes('data-ql7-trust-hero-meta="badge-highlights-selector-proof"') && articleSource.includes('data-ql7-trust-identity-table="r8"') && articleSource.includes('data-ql7-trust-reading-flow="full-width-title-rail-copy-r8"') && articleSource.indexOf('heroFinalMetaR8') < articleSource.indexOf('heroFinalProofR8') && articleSource.indexOf('heroFinalProofR8') < articleSource.indexOf('heroFinalBodyR8') && articleSource.indexOf('heroFinalBodyR8') < articleSource.indexOf('heroFinalRailR8') && articleSource.indexOf('heroFinalRailR8') < articleSource.indexOf('heroFinalLeadR8'),
  heroFinalR8LegacyIsolation: articleSource.includes('className={styles.heroFinalR8}') && !articleSource.includes('className={styles.hero}') && !articleSource.includes('className={styles.heroUtilityRow}') && !articleSource.includes('className={styles.heroTitleBlock}') && !articleSource.includes('className={styles.heroProof}') && !articleSource.includes('className={styles.heroHighlights}') && !articleSource.includes('className={styles.lead}'),
  heroFinalR8NoReadingColumns: cssSource.includes('QL7 TRUST SEO222 HERO FINAL R8') && cssSource.includes('.heroFinalR8 {') && cssSource.includes('display:block;') && cssSource.includes('.heroFinalBodyR8 {') && cssSource.includes('width:100%;') && !cssSource.slice(cssSource.indexOf('QL7 TRUST SEO222 HERO FINAL R8')).includes('grid-template-areas:'),
  heroFinalR8AdaptiveMeta: cssSource.includes('.heroFinalMetaLineR8 {') && cssSource.includes('display:flex;') && cssSource.includes('flex-wrap:wrap;') && cssSource.includes('@container trustArticle (max-width:980px)') && cssSource.includes('@container trustArticle (max-width:680px)') && cssSource.includes('@container trustArticle (max-width:430px)'),
  heroFinalR8TextIntegrity: cssSource.includes('.heroFinalBodyR8 h1 {') && cssSource.includes('.heroFinalLeadR8 {') && cssSource.includes('overflow-wrap:break-word;') && cssSource.includes('word-break:normal;') && cssSource.includes('hyphens:none;') && cssSource.includes('@container trustArticle (min-width:1080px)') && cssSource.includes('white-space:nowrap;') && cssSource.includes('@container trustArticle (max-width:680px)') && cssSource.includes('white-space:normal;'),
  heroFinalR8SelectorOverlay: switcherSource.includes("variant = 'default'") && switcherSource.includes("variant === 'hero-final-r8'") && switcherSource.includes('data-ql7-trust-language-variant') && cssSource.includes('.heroFinalLanguageWrapR8 .languageMenu {') && cssSource.includes('position:absolute !important;') && cssSource.includes('z-index:9999 !important;') && cssSource.includes('max-height:min(66vh,440px) !important;'),
  heroFinalR8PremiumMetaAndRail: cssSource.includes('--hero-r8-gold:#f4d27a') && cssSource.includes('--hero-r8-violet:#a79aff') && cssSource.includes('--hero-r8-green:#67e4b5') && cssSource.includes('.heroFinalProofR8 {') && cssSource.includes('.heroFinalStatusGridR8 {') && cssSource.includes('.heroFinalRailR8 {') && cssSource.includes('.heroFinalHighlightsR8 li:nth-child(4)'),
  heroMobileCompactR9: cssSource.includes('QL7 TRUST SEO222 HERO MOBILE COMPACT R9') && cssSource.includes('@container trustArticle (max-width:680px)') && cssSource.includes('.heroFinalStatementR8 {') && cssSource.includes('flex:0 0 auto !important;') && cssSource.includes('.heroFinalLanguageWrapR8 {') && cssSource.includes('height:auto !important;') && cssSource.includes('grid-template-columns:minmax(48px,58px) minmax(0,1fr);') && cssSource.includes('@container trustArticle (max-width:430px)') && cssSource.includes('grid-template-columns:repeat(2,minmax(0,1fr));') && cssSource.includes('@container trustArticle (max-width:340px)'),

  premiumRailsV5: cssSource.includes('.sectionRail') && cssSource.includes('.sectionRailLine') && cssSource.includes('.machinePanel') && cssSource.includes('.depthDisclosure'),
  mobileSelectorOverlay: switcherSource.includes('data-ql7-trust-language-overlay="1"') && cssSource.includes('.heroFinalLanguageWrapR8 .languageMenu {') && cssSource.includes('position:absolute !important;'),
  footerTrustCtaAbsentEverywhere: topBarSource.includes('data-ql7-footer-trust-link="absent"') && !topBarSource.includes('ql7-social-trust-link') && !topBarSource.includes('getTrustIdentityPath') && !globalsSource.includes('.ql7-social-trust-link') && !aboutSource.includes('showTrustLink'),
  heroSingleBrandArchitecture: !articleSource.includes('heroEyebrow') && !switcherSource.includes('>QL7<') && !articleSource.includes('QL7 · TRUST') && TRUST_IDENTITY_LANGS.every((lang) => contents[lang].hero.highlights.length === 4 && !/QL7\s*[·.-]?\s*TRUST/i.test(JSON.stringify(contents[lang].presentation))),
  fiveLayerSemanticExpansion: TRUST_IDENTITY_LANGS.every((lang) => contents[lang].sections.every((section) => Array.isArray(section.depth) && section.depth.length === 5 && section.depth.every((entry) => String(entry.body || '').length > (lang === 'zh' ? 180 : 500)))),
  machineIdentityInfrastructure: machineIdentitySource.includes('buildTrustIdentityMachineManifest') && machineGeneratorSource.includes('QL7_TRUST_IDENTITY_MACHINE_SURFACES_V1_OK') && machineManifest.canonicalName === 'Quantum L7 AI' && machineManifest.canonicalOrigin === SITE_ORIGIN && machineManifest.organizationId === QUANTUM_L7_ORGANIZATION_ID && machineManifest.identityVersion === '2026-08-14-v3' && same(Object.keys(machineManifest.localizedIdentity), TRUST_IDENTITY_LANGS) && same(machineManifest.officialChannels.map((entry) => entry.url), EXPECTED_CHANNELS) && /similarity.*does not prove affiliation/i.test(machineManifest.disambiguationRule) && llmsSource.includes('Canonical name: Quantum L7 AI') && llmsSource.includes('/.well-known/ql7-identity.json'),
  websiteIdentityGraphStrengthened: websiteStructuredSource.includes("publisher: { '@id': `${SITE_ORIGIN}/#organization` }") && websiteStructuredSource.includes('identifier: `${SITE_ORIGIN}/#website-${lang}`'),
  companyVoiceCore: TRUST_IDENTITY_LANGS.every((lang) => { const rx = { en: /\b(?:we|our)\b/iu, ru: /(?:мы|наш)/iu, uk: /(?:ми|наш)/iu, es: /\b(?:somos|nuestro|nuestra|publicamos|construimos|desarrollamos|estamos|podemos|mantenemos)\b/iu, tr: /\b(?:biz|bizim|yayımlıyoruz|geliştiriyoruz|inşa ediyoruz|kullanıyoruz|tutuyoruz|veriyoruz)\b/iu, ar: /(?:نحن|نبني|ننشر|نستخدم|لدينا|نقدم|نحافظ|نرفض|نتبع)/u, zh: /我们/u }[lang]; return rx.test(contents[lang].hero.lead) && ['official-identity','independence','what-we-build','what-we-are-not','financial-integrity','human-values','ai-privacy-security','roadmap-maturity','user-choice','final-declaration'].every((id) => rx.test(contents[lang].sections.find((entry) => entry.id === id).paragraphs.join(' '))) }),
  premiumPresentationLocalized: TRUST_IDENTITY_LANGS.every((lang) => ['trustBadge','officialBadge','verifiedBadge','supportTextOnlyBadge','machineBadge','depthBadge'].every((key) => String(contents[lang]?.presentation?.[key] || '').trim().length > 0)),
  supportTextOnlyBadgeDepth: TRUST_IDENTITY_LANGS.every((lang) => String(contents[lang]?.presentation?.supportTextOnlyBadge || '').trim().length > 8),
  companyVoiceHeadings: TRUST_IDENTITY_LANGS.every((lang) => !/^(?:What Quantum L7 AI|Что строит Quantum L7 AI|Чем Quantum L7 AI|Що будує Quantum L7 AI|Чим Quantum L7 AI|Qué está construyendo Quantum L7 AI|Qué no es Quantum L7 AI|Quantum L7 AI ne|ما الذي تبنيه Quantum L7 AI|ما الذي ليست عليه Quantum L7 AI|Quantum L7 AI 正在|Quantum L7 AI 不)/u.test(contents[lang].sections.find((entry) => entry.id === 'what-we-build').title + contents[lang].sections.find((entry) => entry.id === 'what-we-are-not').title)),
  supportEvidenceTextOnly: TRUST_IDENTITY_LANGS.every((lang) => !/screenshot|screen\s*shot|attachment|upload\s+(?:a\s+)?file|скринш|знімок|вложен|прикріплен|captura|adjunt|ekran\s+görünt|dosya\s+yük|لقطة|مرفق|截图|截圖|附件/iu.test(JSON.stringify({ report: contents[lang].reportImpersonation, impersonation: contents[lang].sections.find((entry) => entry.id === 'impersonation') }))),
  reportDescriptionDepth: TRUST_IDENTITY_LANGS.every((lang) => String(contents[lang]?.reportImpersonation?.description || '').length > 80),
  sevenPublicRoutes: TRUST_IDENTITY_LANGS.every((lang) => PUBLIC_INDEX_ROUTES.some((entry) => entry.path === TRUST_IDENTITY_PATHS_BY_LANG[lang] && entry.pageFile === 'app/[lang]/trust-and-identity/page.js')),
  redirect308XDefault: TRUST_IDENTITY_X_DEFAULT_PATH === '/en/trust-and-identity' && redirectSource.includes('308') && !/geo|country|ip\b/i.test(redirectSource),
  metadataSelfCanonical: TRUST_IDENTITY_LANGS.every((lang) => metadata[lang]?.alternates?.canonical === TRUST_IDENTITY_PATHS_BY_LANG[lang]),
  metadataReciprocal: TRUST_IDENTITY_LANGS.every((lang) => same(Object.keys(metadata[lang]?.alternates?.languages || {}), ['en','ru','uk','es','tr','ar','zh','x-default'])),
  uniqueMetadata: new Set(TRUST_IDENTITY_LANGS.map((lang) => metadata[lang].title)).size === 7 && new Set(TRUST_IDENTITY_LANGS.map((lang) => metadata[lang].description)).size === 7,
  absoluteHreflang: Object.values(buildTrustIdentityAlternates({ absolute: true })).every((url) => /^https:\/\/www\.quantuml7ai\.com\//.test(url)),
  sitemapSevenAlternates: sitemapRows.filter((entry) => entry.alternates?.languages).length === 7 && TRUST_IDENTITY_LANGS.every((lang) => sitemapRows.some((entry) => new URL(entry.url).pathname === TRUST_IDENTITY_PATHS_BY_LANG[lang] && entry.alternates?.languages)),
  redirectNotInSitemap: !sitemapRows.some((entry) => new URL(entry.url).pathname === '/trust-and-identity'),
  robotsTechnical: same(ROBOTS_DISALLOW_PATHS, ['/api/']) && robotsSource.includes("allow: '/'") && robotsSource.includes('ROBOTS_DISALLOW_PATHS') && robotsSource.includes('/sitemap.xml') && !/guaranteed|seed phrase|telegram|social|Quantum AI/i.test(robotsSource),
  organizationStable: organization['@type'] === 'Organization' && organization['@id'] === `${SITE_ORIGIN}/#organization` && QUANTUM_L7_ORGANIZATION_ID === `${SITE_ORIGIN}/#organization`,
  organizationNoQuantumAiAlias: !organization.alternateName.includes('Quantum AI'),
  organizationNoInventedLegal: ['legalName','address','taxID','vatID','leiCode','numberOfEmployees','foundingDate'].every((key) => !(key in organization)),
  organizationVisibleParity: organization.description === contents.en.hero.lead && organization.disambiguatingDescription === contents.en.sections.find((entry) => entry.id === 'independence').paragraphs[0],
  aboutPageGraph: TRUST_IDENTITY_LANGS.every((lang) => {
    const graph = buildTrustIdentityPageStructuredData({ lang, content: contents[lang] })
    const page = graph['@graph'].find((entry) => entry['@type'] === 'AboutPage')
    return page?.inLanguage === lang && page?.['@id'] === `${SITE_ORIGIN}${TRUST_IDENTITY_PATHS_BY_LANG[lang]}#webpage` && page?.about?.['@id'] === QUANTUM_L7_ORGANIZATION_ID && page?.mainEntity?.['@id'] === QUANTUM_L7_ORGANIZATION_ID && page?.dateModified === '2026-08-14'
  }),
  structuredDataSafe: structuredSource.includes("replace(/</g, '\\\\u003c')") && !structuredSource.includes("'FAQPage'") && !structuredSource.includes("'QAPage'") && (() => { try { JSON.parse(serializeStructuredData(buildTrustIdentityPageStructuredData({ lang: 'en', content: contents.en }))); return true } catch { return false } })(),
  rootOrganizationInjected: rootLayout.includes('QuantumOrganizationJsonLd') && rootLayout.includes('buildMultilingualWebsiteStructuredData'),
  rootNotranslatePreserved: rootLayout.includes('translate="no"') && rootLayout.includes('className="notranslate"') && rootLayout.includes('name="google" content="notranslate"'),
  aboutH1AndTeaser: aboutSource.includes('<h1 className="about-page-title">{title}</h1>') && aboutSource.includes('TrustIdentityAboutTeaser') && !aboutSource.includes('trust_identity.sections.map'),
  contactBoundedNoindex: contactSource.includes("reason !== 'impersonation'") && contactSource.includes("/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support") && contactSource.includes('content.reportImpersonation.evidence') && contactLayout.includes('index: false'),
  supportOfficialIdentity: supportRegistry.includes("normalizedTopic === 'official_identity'") && supportRegistry.includes('buildQl7SupportOfficialIdentityKnowledge') && supportKnowledge.includes("topic: 'official_identity'") && supportKnowledge.includes('readOnly: true') && supportKnowledge.includes('OFFICIAL_QUANTUM_L7_CHANNELS'),
  docsGovernance: seoGovernance.includes('/en/trust-and-identity') && trustGovernance.includes('2026-08-14-v3') && trustGovernance.includes('Quantum AI') && agents.includes('Trust & Identity Governance Rules'),
  projectDocsArtifactHygiene: projectDocsShared.includes('QL7_TRUST_IDENTITY_MULTILINGUAL_SEO_FINAL_BASELINE') && projectTreeGenerator.includes('QL7_TRUST_IDENTITY_MULTILINGUAL_SEO_FINAL_BASELINE') && projectDocsShared.includes('final_baseline_trust_identity_v') && projectTreeGenerator.includes('final_baseline_trust_identity_v'),
  sourceIntegrityGatePresent: sourceIntegrityGate.includes('QL7_TRUST_IDENTITY_SOURCE_INTEGRITY_FINAL_BASELINE_V3') && sourceIntegrityGate.includes('TextDecoder') && sourceIntegrityGate.includes('fatal: true') && sourceIntegrityGate.includes('EXPECTED_CONTENT_SHA256'),
  builtHtmlVerifierPresent: builtHtmlVerifier.includes('QL7_TRUST_IDENTITY_BUILT_HTML_VERIFY_FINAL_BASELINE_V3') && builtHtmlVerifier.includes('prerender-manifest.json') && builtHtmlVerifier.includes('trust-and-identity.html') && builtHtmlVerifier.includes('#webpage') && builtHtmlVerifier.includes('eightFaqDetails') && builtHtmlVerifier.includes('fiveLayerDepthVisible') && builtHtmlVerifier.includes('machineIdentityPanelVisible'),
  builtHtmlVerifierVisibleTextIsolation: builtHtmlVerifier.includes('VISIBLE_STANDALONE_QL7_TRUST_PATTERN') && builtHtmlVerifier.includes('visibleTextSegments') && builtHtmlVerifier.includes('visibleSegments.some((segment)') && !builtHtmlVerifier.includes("!/QL7\\s*[·.-]\\s*TRUST/i.test(html)"),
  latestQcoinDebugCarrierRecognized: qcoinDebugRoute.includes('QL7_DEBUG_GRANTS_ENABLED') && qcoinDebugRoute.includes('QL7_DEBUG_GRANTS_ALLOW_REMOTE') && qcoinDebugRoute.includes('idempotencyKey') && gitignoreSource.includes('app/api/debug/qcoin/'),
  recommendationCarrierPreserved: read('lib/forum/forum-user-recommendation-pool.cjs').includes('followers-relation-profile-moderation-gate-v2') && read('tools/ql7-forum-user-recommendations-top500-check-final-baseline-v12.mjs').includes('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_CHECK_FINAL_BASELINE_V12'),
}

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key)
const result = {
  ok: failed.length === 0,
  marker: MARKER,
  baseArchiveSha256: BASE_ARCHIVE_SHA256,
  checks,
  failed,
  contract: {
    routeFamily: TRUST_IDENTITY_PATHS_BY_LANG,
    xDefault: TRUST_IDENTITY_X_DEFAULT_PATH,
    locales: TRUST_IDENTITY_LANGS,
    contentVersion: '2026-08-14-v3',
    reviewedAt: '2026-08-14',
    officialChannels: EXPECTED_CHANNELS,
    organizationId: QUANTUM_L7_ORGANIZATION_ID,
    databaseWrites: false,
    userDataWrites: false,
  },
}
console.log(JSON.stringify(result, null, 2))
if (!result.ok) process.exit(1)
console.log('QL7_TRUST_IDENTITY_MULTILINGUAL_SEO_CHECK_FINAL_BASELINE_V3_OK')
