import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import en from '../../../components/i18n-dicts/en.js'
import ru from '../../../components/i18n-dicts/ru.js'
import uk from '../../../components/i18n-dicts/uk.js'
import es from '../../../components/i18n-dicts/es.js'
import tr from '../../../components/i18n-dicts/tr.js'
import ar from '../../../components/i18n-dicts/ar.js'
import zh from '../../../components/i18n-dicts/zh.js'
import { I18N_DICT_META, I18N_SUPPORTED_LANGS } from '../../../components/i18n-dicts/manifest.js'
import {
  TRUST_IDENTITY_FAQ_IDS,
  TRUST_IDENTITY_LANGS,
  TRUST_IDENTITY_SECTION_IDS,
  auditTrustIdentityContent,
  getTrustIdentityContent,
} from '../../../lib/seo/trustIdentityContent.js'

const DICTS = { en, ru, uk, es, tr, ar, zh }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

function hashDict(dict) {
  return createHash('sha256').update(JSON.stringify(dict)).digest('hex')
}

function evaluateSourceDict() {
  const source = fs.readFileSync(path.join(root, 'components/i18n.source.js'), 'utf8')
  const marker = 'const SUPPORTED_LANGS ='
  const markerIndex = source.indexOf(marker)
  expect(markerIndex).toBeGreaterThan(0)
  const evaluable = source.slice(0, markerIndex)
    .replace(/^[\"']use client[\"']\s*/m, '')
    .replace(/^import\s.+$/gm, '')
    .replace(/^const I18nContext =.+$/gm, '')
  const sandbox = { module: { exports: {} }, exports: {}, process, console }
  vm.createContext(sandbox)
  new vm.Script(`${evaluable}\nmodule.exports = { dict };`, { filename: 'components/i18n.source.js' })
    .runInContext(sandbox, { timeout: 60_000 })
  return sandbox.module.exports.dict
}

function structure(value) {
  if (Array.isArray(value)) return value.map(structure)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, structure(value[key])]))
  }
  return typeof value
}

describe('Trust & Identity multilingual content', () => {
  test('has strict deep structural parity across seven complete locales', () => {
    expect(TRUST_IDENTITY_LANGS).toEqual(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh'])
    const audit = auditTrustIdentityContent()
    expect(audit.ok).toBe(true)
    expect(audit.languages).toHaveLength(7)
    const baseShape = structure(getTrustIdentityContent('en'))
    for (const lang of TRUST_IDENTITY_LANGS) {
      const content = getTrustIdentityContent(lang)
      expect(structure(content)).toEqual(baseShape)
      expect(content.sections.map((entry) => entry.id)).toEqual(TRUST_IDENTITY_SECTION_IDS)
      expect(content.faq.map((entry) => entry.id)).toEqual(TRUST_IDENTITY_FAQ_IDS)
      expect(content.sections).toHaveLength(13)
      expect(content.faq).toHaveLength(8)
      expect(content.safetyChecklist).toHaveLength(8)
      expect(content.version.value).toBe('2026-08-14-v3')
      expect(content.version.reviewedAt).toBe('2026-08-14')
      expect(content.presentation.trustBadge).toBeTruthy()
      expect(content.presentation.officialBadge).toBeTruthy()
      expect(content.presentation.verifiedBadge).toBeTruthy()
      expect(content.presentation.supportTextOnlyBadge).toBeTruthy()
      expect(content.presentation.machineBadge).toBeTruthy()
      expect(content.presentation.depthBadge).toBeTruthy()
      expect(content.hero.highlights).toHaveLength(4)
      expect(content.machineIdentity.principles).toHaveLength(5)
      content.sections.forEach((section) => {
        expect(section.depth).toHaveLength(5)
        section.depth.forEach((entry) => expect(entry.body.length).toBeGreaterThan(lang === 'zh' ? 180 : 500))
      })
    }
  })

  test('preserves full localized copy and does not hide official URLs in translations', () => {
    const english = JSON.stringify(getTrustIdentityContent('en'))
    for (const lang of TRUST_IDENTITY_LANGS) {
      const content = getTrustIdentityContent(lang)
      const serialized = JSON.stringify(content)
      expect(serialized).not.toMatch(/https?:\/\//i)
      expect(serialized).not.toMatch(/\b(?:TODO|lorem ipsum|placeholder)\b/i)
      expect(content.hero.title).toContain('Quantum L7 AI')
      expect(JSON.stringify(content.presentation)).not.toMatch(/QL7\s*[·.-]?\s*TRUST/i)
      expect(content.sections.find((entry) => entry.id === 'what-we-build').bullets.length).toBeGreaterThanOrEqual(14)
      if (lang !== 'en') expect(serialized).not.toBe(english)
    }
    expect((JSON.stringify(getTrustIdentityContent('ar')).match(/[\u0600-\u06FF]/g) || []).length).toBeGreaterThan(4000)
    expect((JSON.stringify(getTrustIdentityContent('zh')).match(/[\u3400-\u9FFF]/g) || []).length).toBeGreaterThan(1500)
  })

  test('keeps identity, finance, wallet, maturity and non-coercion safety concepts in every locale', () => {
    for (const lang of TRUST_IDENTITY_LANGS) {
      const content = getTrustIdentityContent(lang)
      const ids = Object.fromEntries(content.sections.map((entry) => [entry.id, entry]))
      expect(ids.independence.paragraphs.join(' ').length).toBeGreaterThan(250)
      expect(ids['financial-integrity'].paragraphs.join(' ').length).toBeGreaterThan(250)
      expect(ids['ai-privacy-security'].paragraphs.join(' ')).toMatch(/seed|私钥|助记|عبارة|özel|semilla|приват|приватн/iu)
      expect(ids['roadmap-maturity'].paragraphs.join(' ').length).toBeGreaterThan(180)
      expect(ids['user-choice'].paragraphs.join(' ').length).toBeGreaterThan(180)
      expect(content.faq.find((entry) => entry.id === 'seed-private-key').answer.length).toBeGreaterThan(40)
      const guaranteedProfitAnswer = content.faq.find((entry) => entry.id === 'guaranteed-profit').answer
      const guaranteedProfitSentences = guaranteedProfitAnswer
        .split(/[.!?\u3002\uFF01\uFF1F]+/u)
        .map((part) => part.trim())
        .filter(Boolean)
      expect(guaranteedProfitSentences).toHaveLength(3)
    }
  })


  test('uses company voice in core identity sections and keeps QL7 Support evidence text-only', () => {
    const voice = {
      en: /\b(?:we|our)\b/iu,
      ru: /(?:мы|наш)/iu,
      uk: /(?:ми|наш)/iu,
      es: /\b(?:somos|nuestro|nuestra|publicamos|construimos|desarrollamos|estamos|podemos|mantenemos)\b/iu,
      tr: /\b(?:biz|bizim|yayımlıyoruz|geliştiriyoruz|inşa ediyoruz|kullanıyoruz|tutuyoruz|veriyoruz)\b/iu,
      ar: /(?:نحن|نبني|ننشر|نستخدم|لدينا|نقدم|نحافظ|نرفض|نتبع)/u,
      zh: /我们/u,
    }
    const coreIds = ['official-identity', 'independence', 'what-we-build', 'what-we-are-not', 'financial-integrity', 'human-values', 'ai-privacy-security', 'roadmap-maturity', 'user-choice', 'final-declaration']
    const screenshotWords = /screenshot|screen\s*shot|attachment|upload\s+(?:a\s+)?file|скринш|знімок|вложен|прикріплен|captura|adjunt|ekran\s+görünt|dosya\s+yük|لقطة|مرفق|截图|截圖|附件/iu

    const companyVoiceHeadings = {
      en: ['Who we are', 'Our independence and non-affiliation', 'What we are building', 'What we are not'],
      ru: ['Кто мы', 'Наша независимость и отсутствие аффилированности', 'Что мы строим', 'Чем мы не являемся'],
      uk: ['Хто ми', 'Наша незалежність і відсутність афілійованості', 'Що ми будуємо', 'Чим ми не є'],
      es: ['Quiénes somos', 'Nuestra independencia y ausencia de afiliación', 'Qué estamos construyendo', 'Qué no somos'],
      tr: ['Biz kimiz', 'Bağımsızlığımız ve bağlantısızlığımız', 'Neler geliştiriyoruz', 'Ne değiliz'],
      ar: ['من نحن', 'استقلالنا وعدم ارتباطنا', 'ما الذي نبنيه', 'ما الذي لسنا عليه'],
      zh: ['我们是谁', '我们的独立性与无关联声明', '我们正在建设什么', '我们不是什么'],
    }

    for (const lang of TRUST_IDENTITY_LANGS) {
      const content = getTrustIdentityContent(lang)
      expect(content.hero.lead).toMatch(voice[lang])
      expect(content.sections.slice(0, 4).map((entry) => entry.title)).toEqual(companyVoiceHeadings[lang])
      expect(content.presentation.supportTextOnlyBadge.length, `${lang} presentation.supportTextOnlyBadge must stay > 8 characters`).toBeGreaterThan(8)
      for (const id of coreIds) {
        expect(content.sections.find((entry) => entry.id === id).paragraphs.join(' ')).toMatch(voice[lang])
      }
      expect(JSON.stringify(content.reportImpersonation)).not.toMatch(screenshotWords)
      expect(content.reportImpersonation.description.length, `${lang} reportImpersonation.description must stay > 80 characters`).toBeGreaterThan(80)
      expect(content.sections.find((entry) => entry.id === 'impersonation').paragraphs.join(' ')).not.toMatch(screenshotWords)
    }
  })

  test('keeps split dictionaries byte-content equivalent to i18n source and manifest hashes honest', () => {
    const sourceDict = evaluateSourceDict()
    expect([...I18N_SUPPORTED_LANGS].sort()).toEqual(['ar', 'en', 'es', 'ru', 'tr', 'uk', 'zh'])
    for (const lang of I18N_SUPPORTED_LANGS) {
      expect(DICTS[lang]).toEqual(sourceDict[lang])
      expect(I18N_DICT_META[lang].keyCount).toBe(Object.keys(DICTS[lang]).length)
      expect(I18N_DICT_META[lang].hash).toBe(hashDict(DICTS[lang]))
      expect(DICTS[lang].trust_identity).toBeTruthy()
    }
  })
})
