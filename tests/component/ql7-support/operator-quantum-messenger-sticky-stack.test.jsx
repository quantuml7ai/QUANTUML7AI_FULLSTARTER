import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

describe('QL7 Support operator / Quantum Messenger sticky stack', () => {
  test('pins the operator below the sticky Quantum Messenger title and tabs', () => {
    const inboxHeader = read('app/forum/features/dm/components/InboxTabsHeader.jsx')
    const pane = read('app/forum/features/dm/components/DmMessagesPane.jsx')
    const header = read('app/forum/features/dm/components/DmThreadHeader.jsx')
    const dmStyles = read('app/forum/styles/modules/dmStyles.js')
    const supportStyles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')

    expect(inboxHeader).toContain('data-ql7-quantum-messenger-sticky-owner="title-tabs"')
    expect(inboxHeader).toContain('data-ql7-quantum-messenger-sticky-measure="resize-observer-height"')
    expect(inboxHeader).toContain('new ResizeObserver(publishStickyStackHeight)')
    expect(inboxHeader).toContain('--ql7-quantum-messenger-sticky-height')
    expect(inboxHeader).not.toMatch(/addEventListener\(['"]scroll|requestAnimationFrame/u)

    expect(dmStyles).toContain('--ql7-quantum-messenger-sticky-top')
    expect(dmStyles).toContain('--ql7-quantum-messenger-sticky-height:92px')
    expect(dmStyles).toContain('--ql7-support-operator-sticky-gap:6px')
    expect(dmStyles).toContain('position:sticky; top:var(--ql7-quantum-messenger-sticky-top); z-index:48')
    expect(dmStyles).toContain('position:relative; top:auto')

    expect(pane).toContain('data-ql7-operator-sticky-slot="media-only"')
    expect(pane).toContain('data-ql7-operator-sticky-target="static-video-only"')
    expect(pane).toContain('data-ql7-operator-native-slot="identity-plate-right"')
    expect(pane).toContain('data-ql7-operator-native-fit="identity-plate-expands-to-media"')
    expect(pane).toContain('<Ql7SupportOperator')
    expect(header).not.toContain('<Ql7SupportOperator')

    expect(supportStyles).toContain(
      '--ql7-support-operator-sticky-top:calc(var(--ql7-quantum-messenger-sticky-top,0px) + var(--ql7-quantum-messenger-sticky-height,92px) + var(--ql7-support-operator-sticky-gap,6px))',
    )
    expect(supportStyles).toContain('top:var(--ql7-support-operator-sticky-top)')
    expect(supportStyles).toContain('position:relative!important;top:auto!important')
    expect(supportStyles).toContain('--ql7-support-operator-native-h:calc(var(--ql7-support-operator-slot-w)*9/16)')
    expect(supportStyles).toContain('min-height:max(64px,calc(var(--ql7-support-operator-native-h) + 16px))')
    expect(supportStyles).toContain('box-sizing:border-box')
    expect(supportStyles).not.toMatch(
      /\.dmThreadHeader\[data-support-thread="1"\]\{[^}]*position:sticky/su,
    )
  })
})
