import { describe, it, expect } from 'vitest'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('QL7 Support V8 browser presentation contracts', () => {
  it('renders semantic themes, rails, tables and metric grids from the mounted global Support stylesheet', () => {
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    const styles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')
    for (const token of ['data-ql7-support-theme', 'ql7SupportSectionRail', 'ql7SupportDataTable', 'ql7SupportMetricGrid']) expect(card).toContain(token)
    for (const token of ['complaint-amber', 'violation-crimson', 'payment-violet-gold', '@media(max-width:720px)', 'prefers-reduced-motion']) expect(styles).toContain(token)
  })

  it('composer runtime panel is globally mounted, explicitly sized and adaptive', () => {
    const component = read('app/forum/features/dm/components/Ql7SupportComposerRuntimePanel.jsx')
    const layout = read('app/forum/ForumLayout.jsx')
    const styles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')
    expect(component).toContain('ql7SupportRuntimeProgress')
    expect(component).toContain('ql7SupportRuntimeCountdown')
    expect(component).toContain('width="32"')
    expect(component).toContain('fill="none"')
    expect(layout).toContain("useHeadStyle('ql7-support-global-styles', ql7SupportGlobalStyles)")
    expect(styles).toContain('max-width:32px!important')
    expect(styles).toContain('max-height:96px')
    expect(styles).toContain(':has(.ql7SupportComposerRuntimePanel)')
  })

  it('keeps V2 cards readable without duplicate facts and metrics', () => {
    const presentation = read('lib/ql7-support/presentationV8.js')
    expect(presentation).toContain('normalizeLegacyTableMetricsV8')
    expect(presentation).toContain('localizeQl7ContentTypeV8')
    expect(presentation).toContain('normalizeTimelineV8')
    expect(presentation).not.toMatch(/\.\.\.normalizeMetricObjectV8\(card\?\.facts/)
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    expect(card).toContain('data-ql7-support-source-kind')
  })

  it('translates Support cards in-place instead of appending a raw text dump below the table', () => {
    const row = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
    const route = read('app/api/dm/support-card-translate/route.js')
    expect(row).toContain('translateQl7SupportCard({ card: supportCard, targetLocale: locale })')
    expect(row).toContain('card: translated?.card || supportCard')
    expect(row).toContain('const dmShowRawText = !!(dmTextBase && dmTextBase.trim() && !fromIsSupport)')
    expect(row).not.toContain('const dmShowRawText = !!(dmTextBase && dmTextBase.trim() && !supportCard)')
    expect(row).toContain('const supportRenderCard = supportCard && dmTrState?.isTranslated && dmTrState?.card ? dmTrState.card : supportCard')
    expect(route).toContain('validateQl7SupportCardAnyVersion')
    expect(route).toContain('forceProvider: true')
  })
})
