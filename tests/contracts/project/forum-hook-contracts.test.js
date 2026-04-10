import { describe, expect, it } from 'vitest'
import {
  basenameWithoutExtension,
  listProjectFiles,
  readRepoFile,
} from '../../support/projectSurface.js'

const forumHookFiles = listProjectFiles(
  'app/forum',
  (relPath) => /\/hooks\/use[A-Z][^/]*\.jsx?$/.test(relPath),
)

function findExportedHookNames(source) {
  const rx =
    /\bexport\s+(?:default\s+)?function\s+(use[A-Z][A-Za-z0-9_]*)\b|\bexport\s+(?:const|let|var)\s+(use[A-Z][A-Za-z0-9_]*)\b|\bexport\s*\{([^}]*)\}/g

  const names = new Set()
  let match

  while ((match = rx.exec(source)) !== null) {
    if (match[1]) names.add(match[1])
    if (match[2]) names.add(match[2])
    if (match[3]) {
      match[3]
        .split(',')
        .map((chunk) => chunk.trim())
        .forEach((chunk) => {
          const named = chunk.match(/\b(use[A-Z][A-Za-z0-9_]*)\b/)
          if (named?.[1]) names.add(named[1])
        })
    }
  }

  return Array.from(names)
}

describe('Forum hook contracts', () => {
  it('discovers the hook surface of the forum runtime', () => {
    expect(forumHookFiles.length).toBeGreaterThan(40)
  })

  it.each(forumHookFiles)('%s exports at least one hook symbol', (hookFile) => {
    const source = readRepoFile(hookFile)
    const hookName = basenameWithoutExtension(hookFile)
    const exportedHookNames = findExportedHookNames(source)

    expect(exportedHookNames.length).toBeGreaterThan(0)
    expect(hookName.startsWith('use')).toBe(true)
  })
})
