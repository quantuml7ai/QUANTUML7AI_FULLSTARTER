import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

describe('QL7 Support canonical final contracts', () => {
  it('uses one shared 32-locale native production runtime without provider localization authority', () => {
    const manifest = read('components/i18n-dicts/manifest.js')
    const behavior = read('lib/ql7-support/config/behaviorManifest.js')
    const localePolicy = read('lib/ql7-support/language/responseLocalePolicy.js')
    const productionTurn = read('lib/ql7-support/runtime/productionTurn.js')
    expect(manifest).toContain('["ru","en","zh","uk","ar","tr","es"]')
    expect(behavior).toContain('QL7_SUPPORT_ALL_LOCALES')
    expect(behavior).toContain('QL7_SUPPORT_NATIVE_LOCALES')
    expect(behavior).not.toContain('QL7_SUPPORT_PROVIDER_LOCALES')
    expect(localePolicy).toContain('QL7_SUPPORT_ALL_LOCALES.includes(resolved.locale)')
    expect(localePolicy).toContain("kind:supported?'native':'unsupported'")
    expect(localePolicy).toContain('externalTranslationAllowed:false')
    expect(localePolicy).not.toContain("kind:'provider'")
    expect(productionTurn).toContain('executeQl7SupportProductionTurn')
    expect(productionTurn).toContain('if (!runtime.localePolicy.supported)')
    expect(productionTurn).toContain('localizeFinalDelivery')
    expect(productionTurn).toContain("error.code = 'support_locale_temporarily_unavailable'")
  })

  it('localizes native cards only from an owned committed delivery projection', () => {
    const route = read('app/api/dm/support-card-translate/route.js')
    const client = read('app/forum/features/dm/services/supportAuthClient.js')
    const card = read('lib/ql7-support/cardSchema.js')
    expect(route).toContain('CLIENT_SEMANTIC_FIELDS')
    expect(route).toContain('ql7_support_client_card_payload_forbidden')
    expect(route).toContain('ql7_support_delivery_receipts')
    expect(route).toMatch(/commitState\s*:\s*['"]committed['"]/u)
    expect(route).toMatch(/actorIdHash\s*:\s*sha\(canonicalAccountId\)/u)
    expect(route).toContain('loadOwnedCommittedDelivery')
    expect(route).toContain('rebuildQl7SupportTranslatedCard')
    expect(route).toMatch(/translationProjection\s*:\s*rebuilt\.translationProjection/u)
    expect(route).toMatch(/localizeQl7SupportStructuredNative/u)
    expect(route).toMatch(/translateQl7SupportTextNative/u)
    expect(route).not.toMatch(/forceProvider|providerLocalization/u)
    expect(route).toContain('commitQl7SupportIdempotency')
    expect(card).toContain('rebuildQl7SupportTranslatedCard')
    expect(card).toContain('translatedCardIntegrityHash')
    expect(route).not.toMatch(/(?:body|req(?:uest)?)\s*\.\s*(?:card|supportCard|sourceCard|translatedCard)\b/u)
    expect(client).toContain('deliveryReceiptId: sourceReceiptId')
    expect(route).not.toContain('buildQl7SupportPresentationCard(')
  })

  it('keeps exactly one substantive architecture plus one generated runtime map and no superseded root specs', () => {
    expect(fs.existsSync(path.join(root, 'QL7_SUPPORT_ARCHITECTURE_RU.md'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'QL7_SUPPORT_FULL_RUNTIME_MAP_AUDIT_RU.md'))).toBe(true)
    const architecture = read('QL7_SUPPORT_ARCHITECTURE_RU.md')
    for (const marker of ['QL7 Native Model','Knowledge Plane','Shared Composer Intelligence','Orange / Red message policy','Byte-exact rollback']) expect(architecture, marker).toContain(marker)
    for (const file of fs.readdirSync(root).filter(name => /(?:MASTER_TZ|FINAL_PRELAB_FULL_SCALE|FINAL_CUMULATIVE_CODE_CLOSURE|Обязательная директива)/u.test(name) && name.endsWith('.md'))) {
      expect(file).toBe('__no_superseded_root_spec__')
    }
  })

  it('has native-model, multi-turn, visual, learning and email executable matrices', () => {
    for (const file of [
      'scripts/ql7-support/native-model-failure-matrix.mjs',
      'scripts/ql7-support/live-semantic-regression-proof.mjs',
      'scripts/ql7-support/component-regression-proof.mjs',
      'scripts/ql7-support/learning-governance-proof.mjs',
      'scripts/ql7-support/smtp-proof.mjs',
    ]) expect(fs.existsSync(path.join(root, file)), file).toBe(true)
  })
})
