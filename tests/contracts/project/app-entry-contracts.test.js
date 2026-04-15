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
})
