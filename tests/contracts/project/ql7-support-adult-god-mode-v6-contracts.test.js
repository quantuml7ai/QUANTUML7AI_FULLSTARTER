import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('QL7 Support adult god-mode V6 contracts', () => {
  test('has explicit bounded layers and permanent architecture documentation', () => {
    for (const file of [
      'lib/ql7-support/adultLanguagePolicy.js', 'lib/ql7-support/intentHypothesisEngine.js',
      'lib/ql7-support/clarificationBudget.js', 'lib/ql7-support/knowledgeRegistry.js',
      'lib/ql7-support/diagnosticPresentation.js', 'lib/ql7-support/cardSchemaV2.js',
      'lib/ql7-support/adminReportComposer.js', 'lib/ql7-support/naturalLanguageRealizer.js',
      'QL7_SUPPORT_ARCHITECTURE_RU.md',
    ]) expect(fs.existsSync(path.join(root, file)), file).toBe(true)
    const doc = read('QL7_SUPPORT_ARCHITECTURE_RU.md')
    expect(doc).toContain('43 × 18 × 8 = 6192')
    expect(doc).toContain('read-only')
    expect(doc).toContain('Card Schema V2')
  })

  test('does not expose old mechanical response phrases', () => {
    const text = [read('lib/ql7-support/speechEngine.js'), read('lib/ql7-support/naturalLanguageRealizer.js'), read('app/forum/features/dm/components/Ql7SupportCard.js')].join('\n')
    expect(text).not.toMatch(/Я взял линию|Я отделил кейс|I have the line|Read-only result:|Rows found|Diagnostic branch/iu)
  })

  test('keeps Mongo thread decoding compatible with signed card V1 through V4', () => {
    const codec = read('lib/mongo/dm-read-domain-codec.cjs')
    expect(codec).toContain('[1, 2, 3, 4].includes(version)')
    expect(codec).toContain('ql7.support.card.v4')
    expect(codec).toContain('supportCardRejected')
  })

  test('passes the complete diagnostic presentation into the canonical signed surface builder', () => {
    const server = read('lib/ql7-support/server.js')
    expect(server).toContain('presentQl7SupportDiagnostic({ requestContext, diagnosticResult, locale })')
    expect(server).toContain('buildQl7SupportSurfaceSpecV13({')
    expect(server).toContain('diagnosticPresentation,')
    expect(server).toContain('return buildQl7SupportCardV4({')
    expect(server).not.toContain('diagnosticPresentation.card')
    expect(server).not.toContain('...presentation.card,')
  })

  test('ships standalone proof scripts without package changes', () => {
    for (const file of ['scripts/ql7-support-god-mode-self-test.mjs','scripts/ql7-support-god-mode-static-audit.mjs','scripts/ql7-support-god-mode-synthetic-matrix.mjs','scripts/ql7-support-god-mode-email-capture.mjs','scripts/ql7-support-god-mode-live-smoke.mjs']) expect(read(file)).toBeTruthy()
  })
})
