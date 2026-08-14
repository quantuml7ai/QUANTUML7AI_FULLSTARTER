import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const supportDir = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(supportDir, '../..')

const ignoredDirs = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  '.vercel',
  'coverage',
  'dist',
  'build',
  'out',
])

function walk(absDir, out = []) {
  if (!fs.existsSync(absDir)) return out
  const entries = fs.readdirSync(absDir, { withFileTypes: true })

  for (const entry of entries) {
    const absPath = path.join(absDir, entry.name)
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue
      walk(absPath, out)
      continue
    }
    out.push(absPath)
  }

  return out
}

export function toPosix(value) {
  return String(value || '').replace(/\\/g, '/')
}

export function listProjectFiles(startDir, predicate) {
  const absStart = path.join(repoRoot, startDir)
  return walk(absStart)
    .map((absPath) => toPosix(path.relative(repoRoot, absPath)))
    .filter((relPath) => (typeof predicate === 'function' ? predicate(relPath) : true))
    .sort((a, b) => a.localeCompare(b))
}

export function readRepoFile(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8').replace(/^\uFEFF/, '')
}

export function basenameWithoutExtension(relPath) {
  return path.posix.basename(relPath).replace(/\.[^.]+$/, '')
}
