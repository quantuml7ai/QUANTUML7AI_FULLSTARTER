import { describe, expect, it } from 'vitest'
import { listProjectFiles, readRepoFile } from '../../support/projectSurface.js'

const routeFiles = listProjectFiles(
  'app/api',
  (relPath) => /\/route\.js$/i.test(relPath),
)

const handlerExportRx =
  /\bexport\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b|\bexport\s+const\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b|\bexport\s*\{[^}]*\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b[^}]*\}/m

describe('API route contracts', () => {
  it('discovers the repository route surface', () => {
    expect(routeFiles.length).toBeGreaterThan(25)
  })

  it.each(routeFiles)('%s exports at least one HTTP handler', (routeFile) => {
    const source = readRepoFile(routeFile)
    expect(source).toMatch(handlerExportRx)
  })

  it('keeps profile save route wired for one-time gender and birth-year persistence', () => {
    const source = readRepoFile('app/api/profile/save-nick/route.js')

    expect(source).toContain('gender')
    expect(source).toContain('birthYear')
    expect(source).toContain('invalid_gender')
    expect(source).toContain('invalid_birth_year')
  })

  it('keeps profile get route returning private identity fields only for the same account', () => {
    const source = readRepoFile('app/api/profile/get-profile/route.js')

    expect(source).toContain('includePrivateIdentity')
    expect(source).toContain('gender:')
    expect(source).toContain('birthYear:')
  })
})
