import { describe, expect, it } from 'vitest'
import { listProjectFiles, readRepoFile } from '../../support/projectSurface.js'

const appEntryFiles = listProjectFiles(
  'app',
  (relPath) => /\/(?:page|layout|loading|error|not-found)\.jsx?$/i.test(relPath),
)

const defaultExportRx = /\bexport\s+default\b|\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/m

describe('App entry contracts', () => {
  it('discovers the app entry surface', () => {
    expect(appEntryFiles.length).toBeGreaterThan(10)
  })

  it.each(appEntryFiles)('%s exposes a default export', (entryFile) => {
    const source = readRepoFile(entryFile)
    expect(source).toMatch(defaultExportRx)
  })

  it('keeps forum early diagnostics gated by the master env flag in layout', () => {
    const source = readRepoFile('app/layout.js')

    expect(source).toContain('NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED')
    expect(source).toContain('forumEarlyDiagMasterEnabled ? (')
    expect(source).toContain('if (!flags || !flags.master) return;')
    expect(source).not.toContain('forumPath ||')
  })

  it('keeps Telegram Mini App vertical swipe collapse disabled globally', () => {
    const compat = readRepoFile('public/compat.js')
    const globals = readRepoFile('app/globals.css')

    expect(compat).toContain('function setupTmaSwipeGuard()')
    expect(compat).toContain('wa.disableVerticalSwipes()')
    expect(compat).toContain("'web_app_setup_swipe_behavior'")
    expect(compat).toContain('allow_vertical_swipe: false')
    expect(compat).toContain("document.documentElement.setAttribute('data-tma-swipe-lock', '1')")
    expect(globals).toContain('html[data-tma="1"][data-tma-swipe-lock="1"] body')
    expect(globals).toContain('overscroll-behavior: none')
    expect(globals).toContain('html[data-tma="1"] iframe')
    expect(globals).toContain('html[data-tma="1"] .recommendationsRail')
    expect(globals).toContain('html[data-tma="1"] .tradingview-widget-container')
  })

  it('keeps absolute preview metadata for home/about/subscribe/game', () => {
    const rootLayout = readRepoFile('app/layout.js')
    const aboutLayout = readRepoFile('app/about/layout.js')
    const subscribeLayout = readRepoFile('app/subscribe/layout.js')
    const gameLayout = readRepoFile('app/game/layout.js')

    ;[
      rootLayout,
      aboutLayout,
      subscribeLayout,
      gameLayout,
    ].forEach((source) => {
      expect(source).toContain('toAbsoluteSiteUrl(')
      expect(source).toContain("withAssetVersion('/metab/")
    })

    expect(rootLayout).toContain('metadataBase: new URL(SITE_ORIGIN)')
    expect(rootLayout).toContain("canonical: toAbsoluteSiteUrl('/')")
    expect(aboutLayout).toContain("canonical: toAbsoluteSiteUrl('/about')")
    expect(subscribeLayout).toContain("canonical: toAbsoluteSiteUrl('/subscribe')")
    expect(gameLayout).toContain("canonical: toAbsoluteSiteUrl('/game')")
  })
})
