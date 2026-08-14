import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

describe('QL7 Support 888 V8 final contracts', () => {
  it('uses the shared 32-locale production runtime and translates only unsupported fallback locales', () => {
    const manifest = read('components/i18n-dicts/manifest.js')
    const localePolicy = read('lib/ql7-support/language/responseLocalePolicy.js')
    const productionTurn = read('lib/ql7-support/runtime/productionTurn.js')
    const server = read('lib/ql7-support/server.js')
    expect(manifest).toContain('["ru","en","zh","uk","ar","tr","es"]')
    expect(localePolicy).toContain('QL7_SUPPORT_ALL_LOCALES.includes(requested)')
    expect(productionTurn).toContain('executeQl7SupportProductionTurn')
    expect(server).toContain('const responseLocale = productionTurn.localePolicy.locale')
    expect(server).toContain("const providerResponseLocale = productionTurn.localePolicy.supported")
    expect(server).toContain('localizeQl7SupportStructuredV8')
  })

  it('rewrites provider-backed localization through the canonical signed V4 writer', () => {
    const server = read('lib/ql7-support/server.js')
    const route = read('app/api/dm/support-card-translate/route.js')
    expect(server).toContain('unsignedTranslatedCard')
    expect(server).toContain('buildQl7SupportCardV4({ ...unsignedTranslatedCard')
    expect(route).toContain('buildQl7SupportCard({ ...unsigned, locale: targetLanguage })')
    expect(route).not.toContain('buildQl7SupportCardV3(')
  })

  it('keeps exactly one authoritative root Support architecture document', () => {
    const rootDocs = fs.readdirSync(root)
      .filter((name) => /^QL7_SUPPORT.*\.md$/u.test(name))
      .sort()
    expect(rootDocs).toContain('QL7_SUPPORT_ARCHITECTURE_RU.md')
    expect(rootDocs.filter((name) => !/CALIBRATION|TZ_RU/u.test(name))).toEqual(['QL7_SUPPORT_ARCHITECTURE_RU.md'])
    const doc = read('QL7_SUPPORT_ARCHITECTURE_RU.md')
    for (const marker of [
      'Conversation cognition',
      'Canonical Identity Graph',
      'Deep Translate',
      'Signed Card V3',
      'Complaint card',
      'Admin HTML report',
      'Learning governance',
      '43 × 18 × 8 = 6192',
      '43 × 24 × 8 = 8256',
      '43 × 32 × 7 = 9632',
      'read-only',
    ]) expect(doc, marker).toContain(marker)
  })

  it('has provider, multi-turn, visual, learning and email executable matrices', () => {
    for (const file of [
      'scripts/ql7-support-v8-provider-language-matrix.mjs',
      'scripts/ql7-support-v8-multi-turn-matrix.mjs',
      'scripts/ql7-support-v8-visual-theme-matrix.mjs',
      'scripts/ql7-support-v8-learning-governance-matrix.mjs',
      'scripts/ql7-support-v8-email-lifecycle.mjs',
    ]) expect(fs.existsSync(path.join(root, file)), file).toBe(true)
  })
})
