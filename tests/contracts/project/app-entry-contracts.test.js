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
})
