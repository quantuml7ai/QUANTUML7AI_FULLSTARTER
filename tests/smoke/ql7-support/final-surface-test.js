import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('QL7 Support 777 final surface smoke', () => {
  test('ships premium clarification and complaint styles without duplicate branding', () => {
    const styles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    expect(styles).toMatch(/ql7SupportChoiceButton/u)
    expect(styles).toMatch(/ql7SupportDataTable/u)
    expect(styles).toMatch(/ql7SupportMetricGrid/u)
    expect(styles).toMatch(/ql7SupportRulesNotice/u)
    expect(styles).toMatch(/prefers-reduced-motion/u)
    expect(card).toMatch(/ql7SupportDataTable/u)
    expect(card).toMatch(/ql7SupportMetricGrid/u)
    expect(card).not.toMatch(/QL7SupportCardEyebrow|QL7 SUPPORT/u)
  })

  test('ships runtime countdown and shared DM media without network polling each second', () => {
    const styles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')
    const rail = read('app/forum/features/ui/components/ComposerActionRail.jsx')
    const panel = read('app/forum/features/dm/components/Ql7SupportComposerRuntimePanel.jsx')
    const media = read('app/forum/features/dm/components/DmMediaRenderer.jsx')
    expect(rail).toMatch(/Ql7SupportComposerRuntimePanel/u)
    expect(panel).toMatch(/ql7SupportRuntimeCountdown/u)
    const layout = read('app/forum/ForumLayout.jsx')
    expect(layout).toContain("useHeadStyle('ql7-support-global-styles', ql7SupportGlobalStyles)")
    expect(styles).toContain('max-width:32px!important')
    expect(styles).toContain('max-height:96px')
    expect(panel).toMatch(/aria-live="polite"/u)
    expect(rail).not.toMatch(/setInterval\([^)]*fetch/iu)
    expect(panel).not.toMatch(/setInterval\([^)]*fetch/iu)
    expect(media).toMatch(/data-dm-media-renderer/u)
  })
})
