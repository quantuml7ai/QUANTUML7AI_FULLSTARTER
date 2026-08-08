import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()

const SKIP_DIRS = new Set([
  '.git',
  '.next',
  '.turbo',
  '.vip',
  '.codex',
  '.codex_tmp',
  '.agents',
  'audit',
  'coverage',
  'node_modules',
  'public',
  'reports',
])

const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
])

const TEXT_FILENAMES = new Set([
  '.env.example',
  '.gitignore',
  'AGENTS.md',
  'package.json',
  'pnpm-lock.yaml',
])

const GENERATED_TEXT_ARTIFACT_PATTERNS = [
  /(?:^|\/)[^/]*\.report\.json$/i,
  /(?:^|\/)[^/]*\.audit\.report\.json$/i,
  /(?:^|\/)runtime-passport\.snapshot\.json$/i,
]

const BROKEN_ENCODING_PATTERNS = [
  {
    name: 'cyrillic_utf8_double_decoded_sequence',
    pattern: /(?:(?:\u0420[\u00A0-\u00BF\u0401\u0451\u0452-\u045F\u0490-\u0491])|(?:\u0421[\u0080-\u00BF\u0400-\u040F\u0450-\u045F])){2,}/u,
  },
  {
    name: 'smart_punctuation_double_decoded',
    pattern: /\u0432\u0402[\u2018-\u201D\u2039-\u203A\u20AC]?/u,
  },
  {
    name: 'latin1_utf8_artifact',
    pattern: /(?:\u00C2[\u0080-\u00BF\u00A0-\u00BF]|\u00D0[\u0080-\u00BF]|\u00D1[\u0080-\u00BF])/u,
  },
]

function isTextFile(file) {
  const normalized = file.replace(/\\/g, '/')
  if (GENERATED_TEXT_ARTIFACT_PATTERNS.some((pattern) => pattern.test(normalized))) return false
  const name = normalized.split('/').pop()
  if (TEXT_FILENAMES.has(name)) return true
  const dot = name.lastIndexOf('.')
  if (dot < 0) return false
  return TEXT_EXTENSIONS.has(name.slice(dot).toLowerCase())
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      yield* walk(full)
    } else if (stats.isFile() && isTextFile(full)) {
      yield full
    }
  }
}

describe('project text encoding contract', () => {
  test('distinguishes valid uppercase Cyrillic from mojibake byte artifacts', () => {
    const cyrillicPattern = BROKEN_ENCODING_PATTERNS.find(
      ({ name }) => name === 'cyrillic_utf8_double_decoded_sequence',
    )?.pattern

    expect(cyrillicPattern).toBeInstanceOf(RegExp)

    const validSamples = [
      [0x0424, 0x0410, 0x041a, 0x0422, 0x0418, 0x0427, 0x0415, 0x0421, 0x041a, 0x0418, 0x0419, 0x0020, 0x0410, 0x0423, 0x0414, 0x0418, 0x0422, 0x0020, 0x0422, 0x0415, 0x041a, 0x0423, 0x0429, 0x0415, 0x0413, 0x041e, 0x0020, 0x0421, 0x041e, 0x0421, 0x0422, 0x041e, 0x042f, 0x041d, 0x0418, 0x042f],
      [0x0420, 0x041e, 0x0421, 0x0421, 0x0418, 0x042f],
      [0x0421, 0x0422, 0x0410, 0x0422, 0x0423, 0x0421, 0x0020, 0x0421, 0x041e, 0x041e, 0x0411, 0x0429, 0x0415, 0x041d, 0x0418, 0x042f],
      [0x0420, 0x0406, 0x0412, 0x0415, 0x041d, 0x042c, 0x0020, 0x0421, 0x0418, 0x0421, 0x0422, 0x0415, 0x041c, 0x0418],
      [0x0421, 0x0401, 0x0421, 0x0422, 0x0420, 0x042b],
    ].map((codePoints) => String.fromCodePoint(...codePoints))

    for (const validText of validSamples) {
      expect(cyrillicPattern.test(validText)).toBe(false)
    }

    const brokenSamples = [
      [0x0420, 0x045f, 0x0421, 0x0402, 0x0420, 0x0451, 0x0420, 0x0406, 0x0420, 0x00b5],
      [0x0420, 0x00a4, 0x0420, 0x0452, 0x0420, 0x0459, 0x0420, 0x045e],
      [0x0420, 0x0455, 0x0421, 0x0403, 0x0420, 0x0455, 0x0421, 0x040f],
    ].map((codePoints) => String.fromCodePoint(...codePoints))

    for (const brokenText of brokenSamples) {
      expect(cyrillicPattern.test(brokenText)).toBe(true)
    }
  })

  test('keeps committed text files free from mojibake artifacts', () => {
    const offenders = []

    for (const file of walk(root)) {
      const rel = relative(root, file).replace(/\\/g, '/')
      const text = readFileSync(file, 'utf8')
      const lines = text.split(/\r?\n/)
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        for (const { name, pattern } of BROKEN_ENCODING_PATTERNS) {
          if (!pattern.test(line)) continue
          offenders.push({
            file: rel,
            line: index + 1,
            pattern: name,
            sample: line.slice(0, 160),
          })
          break
        }
      }
    }

    expect(offenders).toEqual([])
  }, 30000)
})
