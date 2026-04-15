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

  it('keeps marketing page metadata wired to absolute OG/Twitter image urls', () => {
    const rootLayout = readRepoFile('app/layout.js')
    const aboutLayout = readRepoFile('app/about/layout.js')
    const subscribeLayout = readRepoFile('app/subscribe/layout.js')
    const gameLayout = readRepoFile('app/game/layout.js')
    const forumLayout = readRepoFile('app/forum/layout.js')
    const academyLayout = readRepoFile('app/academy/layout.js')

    ;[
      rootLayout,
      aboutLayout,
      subscribeLayout,
      gameLayout,
      forumLayout,
      academyLayout,
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
