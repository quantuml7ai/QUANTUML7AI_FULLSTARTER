import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('QL7 Support adult god-mode surface smoke', () => {
  test('wires the new intelligence, presentation, card and email layers', () => {
    const server = read('lib/ql7-support/server.js')
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    const styles = read('app/forum/styles/modules/dmStyles.js')
    expect(server).toContain('runQl7SupportPremiumDiagnostic')
    expect(server).toContain('receiptFromQl7Diagnostic')
    expect(server).toContain('buildQl7SupportSurfaceSpec')
    expect(server).toContain('supportReplyCard')
    expect(card).toContain('const version = Number(card?.version)')
    expect(card).toContain('version >= 1 && version <= 4')
    expect(card).toContain('adaptQl7SupportCardForRender')
    expect(card).toContain('Ql7SupportChoiceCard')
    expect(card).not.toContain('card.source.adapterId')
    expect(styles).toContain('.ql7SupportChoiceGrid')
    expect(styles).toContain('.ql7SupportCardTableScroll')
  })

  test('keeps immutable package and lock delivery out of feature code', () => {
    expect(read('package.json')).not.toContain('"type": "module"')
    expect(fs.existsSync(path.join(root, 'QL7_SUPPORT_ARCHITECTURE_RU.md'))).toBe(true)
  })
})
