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
    const presentation = read('lib/ql7-support/presentation.js')
    expect(presentation).toContain('normalizeLegacyTableMetrics')
    expect(presentation).toContain('localizeQl7ContentType')
    expect(presentation).toContain('normalizeTimeline')
    expect(presentation).not.toMatch(/\.\.\.normalizeMetricObject\(card\?\.facts/)
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    expect(card).toContain('data-ql7-support-source-kind')
  })

  it('translates Support cards in-place from an owned committed delivery receipt instead of trusting a client card payload', () => {
    const row = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
    const route = read('app/api/dm/support-card-translate/route.js')

    expect(row).toContain('translateQl7SupportCard({ deliveryReceiptId, targetLocale: locale })')
    expect(row).not.toContain('translateQl7SupportCard({ card: supportCard')

    expect(route).toContain('CLIENT_SEMANTIC_FIELDS')
    expect(route).toContain('ql7_support_client_card_payload_forbidden')
    expect(route).toContain('ql7_support_delivery_receipts')
    expect(route).toMatch(/commitState\s*:\s*['"]committed['"]/u)
    expect(route).toMatch(/actorIdHash\s*:\s*sha\(canonicalAccountId\)/u)
    expect(route).toContain('validateQl7SupportCard')
    expect(route).toMatch(/localizeQl7SupportStructuredNative/u)
    expect(route).toMatch(/translateQl7SupportTextNative/u)
    expect(route).not.toMatch(/forceProvider|providerLocalization/u)

    expect(row).toContain('card: translated?.card || supportCard')
    expect(row).toContain('const dmShowRawText = !!(dmTextBase && dmTextBase.trim() && !fromIsSupport)')
    expect(row).not.toContain('const dmShowRawText = !!(dmTextBase && dmTextBase.trim() && !supportCard)')
    expect(row).toContain('const supportRenderCard = supportCard && dmTrState?.isTranslated && dmTrState?.card ? dmTrState.card : supportCard')
  })
})
