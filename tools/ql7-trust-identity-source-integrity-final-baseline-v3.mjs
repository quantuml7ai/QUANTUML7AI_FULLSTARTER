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
import { TRUST_IDENTITY_LANGS } from '../lib/seo/trustIdentityRoutes.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MARKER = 'QL7_TRUST_IDENTITY_SOURCE_INTEGRITY_FINAL_BASELINE_V3'
const SOURCE_BASELINE_ARCHIVE_SHA256 = '906CA331A89CA5094D8B13414F96D2268BFB8840A7DDD5C32C836A4082085469'

function writeOptionalReport(result) {
  const index = process.argv.indexOf('--out')
  if (index < 0) return
  const raw = process.argv[index + 1]
  if (!raw) throw new Error('missing_value_for_--out')
  const out = path.resolve(process.cwd(), raw)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

const EXPECTED_CONTENT_SHA256 = '3d688b82ed3cc0441b504d0433c5b812812fec510c44fc97fb9ab6468c15b43a'
const DICTS = { en, ru, uk, es, tr, ar, zh }

const FILES = Object.freeze([
  'components/i18n.source.js',
  'components/i18n-dicts/en.js',
  'components/i18n-dicts/ru.js',
  'components/i18n-dicts/uk.js',
  'components/i18n-dicts/es.js',
  'components/i18n-dicts/tr.js',
  'components/i18n-dicts/ar.js',
  'components/i18n-dicts/zh.js',
  'components/i18n-dicts/manifest.js',
  'lib/brand/officialChannels.js',
  'lib/seo/trustIdentityRoutes.js',
  'lib/seo/trustIdentityContent.js',
  'lib/seo/trustIdentityMetadata.js',
  'lib/seo/trustIdentityStructuredData.js',
  'components/seo/QuantumOrganizationJsonLd.jsx',
  'components/trust/TrustIdentityArticle.jsx',
  'components/trust/TrustIdentityLanguageSwitcher.jsx',
  'components/trust/TrustIdentityAboutTeaser.jsx',
  'components/trust/TrustIdentityArticle.module.css',
  'components/TopBar.js',
  'app/about/page.js',
  'app/contact/page.js',
  'app/[lang]/trust-and-identity/page.js',
  'app/trust-and-identity/route.js',
  'lib/ql7-support/knowledge/officialIdentity.js',
  'docs/trust-identity-governance.md',
  'lib/seo/trustIdentityMachineIdentity.js',
  'lib/seo/structuredData.js',
  'public/.well-known/ql7-identity.json',
  'public/llms.txt',
  'app/globals.css',
])

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function inspectUtf8(rel) {
  const abs = path.join(ROOT, rel)
  const bytes = fs.readFileSync(abs)
  let text = ''
  let utf8 = true
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    utf8 = false
  }
  const bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
  const nul = bytes.includes(0)
  const replacement = utf8 && text.includes('\uFFFD')
  const bareCr = utf8 && /\r(?!\n)/.test(text)
  const trailingNewline = utf8 && (text.endsWith('\n') || text.length === 0)
  return Object.freeze({
    rel,
    size: bytes.length,
    sha256: sha256(bytes),
    utf8,
    bom,
    nul,
    replacement,
    bareCr,
    trailingNewline,
    ok: utf8 && !bom && !nul && !replacement && !bareCr && trailingNewline,
  })
}

const fileChecks = FILES.map(inspectUtf8)
const trustByLang = Object.fromEntries(TRUST_IDENTITY_LANGS.map((lang) => [lang, DICTS[lang]?.trust_identity]))
const canonicalJson = JSON.stringify(trustByLang)
const contentSha256 = sha256(Buffer.from(canonicalJson, 'utf8'))
const serialized = Object.fromEntries(TRUST_IDENTITY_LANGS.map((lang) => [lang, JSON.stringify(trustByLang[lang] || {})]))

const checks = {
  allFilesPresentAndUtf8: fileChecks.every((entry) => entry.ok),
  exactLocaleSet: JSON.stringify(TRUST_IDENTITY_LANGS) === JSON.stringify(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh']),
  allContentPresent: TRUST_IDENTITY_LANGS.every((lang) => trustByLang[lang] && typeof trustByLang[lang] === 'object'),
  canonicalContentFingerprint: contentSha256 === EXPECTED_CONTENT_SHA256,
  noContentReplacementChar: TRUST_IDENTITY_LANGS.every((lang) => !serialized[lang].includes('\uFFFD')),
  noContentPlaceholders: TRUST_IDENTITY_LANGS.every((lang) => !/\b(?:TODO|TBD|FIXME|placeholder|lorem ipsum)\b/i.test(serialized[lang])),
  noUrlsInsideTranslatedPayload: TRUST_IDENTITY_LANGS.every((lang) => !/https?:\/\//i.test(serialized[lang])),
  arabicScriptDepth: (serialized.ar.match(/[\u0600-\u06FF]/g) || []).length > 4000,
  chineseScriptDepth: (serialized.zh.match(/[\u3400-\u9FFF]/g) || []).length > 1500,
  noEnglishFallbackClone: TRUST_IDENTITY_LANGS.filter((lang) => lang !== 'en').every((lang) => serialized[lang] !== serialized.en),
  companyVoiceCore: TRUST_IDENTITY_LANGS.every((lang) => {
    const core = ['official-identity','independence','what-we-build','what-we-are-not','financial-integrity','human-values','ai-privacy-security','roadmap-maturity','user-choice','final-declaration']
    const rx = { en: /\b(?:we|our)\b/iu, ru: /(?:мы|наш)/iu, uk: /(?:ми|наш)/iu, es: /\b(?:somos|nuestro|nuestra|publicamos|construimos|desarrollamos|estamos|podemos|mantenemos)\b/iu, tr: /\b(?:biz|bizim|yayımlıyoruz|geliştiriyoruz|inşa ediyoruz|kullanıyoruz|tutuyoruz|veriyoruz)\b/iu, ar: /(?:نحن|نبني|ننشر|نستخدم|لدينا|نقدم|نحافظ|نرفض|نتبع)/u, zh: /我们/u }[lang]
    return rx.test(trustByLang[lang].hero.lead) && core.every((id) => rx.test(trustByLang[lang].sections.find((entry) => entry.id === id).paragraphs.join(' ')))
  }),
  premiumPresentationLocalized: TRUST_IDENTITY_LANGS.every((lang) => ['trustBadge','officialBadge','verifiedBadge','supportTextOnlyBadge','machineBadge','depthBadge'].every((key) => String(trustByLang[lang]?.presentation?.[key] || '').trim().length > 0)),
  supportTextOnlyBadgeDepth: TRUST_IDENTITY_LANGS.every((lang) => String(trustByLang[lang]?.presentation?.supportTextOnlyBadge || '').trim().length > 8),
  companyVoiceHeadings: TRUST_IDENTITY_LANGS.every((lang) => !/^(?:What Quantum L7 AI|Что строит Quantum L7 AI|Чем Quantum L7 AI|Що будує Quantum L7 AI|Чим Quantum L7 AI|Qué está construyendo Quantum L7 AI|Qué no es Quantum L7 AI|Quantum L7 AI ne|ما الذي تبنيه Quantum L7 AI|ما الذي ليست عليه Quantum L7 AI|Quantum L7 AI 正在|Quantum L7 AI 不)/u.test(trustByLang[lang].sections.find((entry) => entry.id === 'what-we-build').title + trustByLang[lang].sections.find((entry) => entry.id === 'what-we-are-not').title)),
  supportEvidenceTextOnly: TRUST_IDENTITY_LANGS.every((lang) => !/screenshot|screen\s*shot|attachment|upload\s+(?:a\s+)?file|скринш|знімок|вложен|прикріплен|captura|adjunt|ekran\s+görünt|dosya\s+yük|لقطة|مرفق|截图|截圖|附件/iu.test(JSON.stringify({ report: trustByLang[lang].reportImpersonation, impersonation: trustByLang[lang].sections.find((entry) => entry.id === 'impersonation') }))),
  reportDescriptionDepth: TRUST_IDENTITY_LANGS.every((lang) => String(trustByLang[lang]?.reportImpersonation?.description || '').length > 80),
  fiveLayerSemanticExpansion: TRUST_IDENTITY_LANGS.every((lang) => trustByLang[lang].sections.every((section) => Array.isArray(section.depth) && section.depth.length === 5 && section.depth.every((entry) => String(entry?.label || '').trim() && String(entry?.body || '').trim().length > (lang === 'zh' ? 180 : 500)))),
  heroSingleBrandArchitecture: TRUST_IDENTITY_LANGS.every((lang) => Array.isArray(trustByLang[lang]?.hero?.highlights) && trustByLang[lang].hero.highlights.length === 4 && !/QL7\s*[·.-]?\s*TRUST/i.test(JSON.stringify(trustByLang[lang].presentation))),
  machineIdentityLocalized: TRUST_IDENTITY_LANGS.every((lang) => Array.isArray(trustByLang[lang]?.machineIdentity?.principles) && trustByLang[lang].machineIdentity.principles.length === 5 && String(trustByLang[lang].machineIdentity.intro || '').length > 100),
}

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key)
const result = {
  ok: failed.length === 0,
  marker: MARKER,
  sourceBaselineArchiveSha256: SOURCE_BASELINE_ARCHIVE_SHA256,
  contentSha256,
  expectedContentSha256: EXPECTED_CONTENT_SHA256,
  checks,
  failed,
  files: fileChecks,
}

writeOptionalReport(result)
console.log(JSON.stringify(result, null, 2))
if (!result.ok) process.exit(1)
console.log(`${MARKER}_OK`)
