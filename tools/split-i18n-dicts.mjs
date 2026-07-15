#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { createHash } from 'node:crypto'

const ROOT = process.cwd()
const SOURCE_PATH = path.join(ROOT, 'components', 'i18n.source.js')
const OUTPUT_DIR = path.join(ROOT, 'components', 'i18n-dicts')
const SUPPORTED_LANGS = ['ru', 'en', 'zh', 'uk', 'ar', 'tr', 'es']
const DEFAULT_LANG = 'en'
const SPLIT_MARKER = 'const SUPPORTED_LANGS ='

function stripRuntimeImports(source) {
  return source
    .replace(/^['"]use client['"]\s*/m, '')
    .replace(/^import\s.+$/gm, '')
    .replace(/^const I18nContext =.+$/gm, '')
}

function hashDict(dict) {
  return createHash('sha256').update(JSON.stringify(dict)).digest('hex')
}

async function main() {
  const source = await fs.readFile(SOURCE_PATH, 'utf8')
  const markerIndex = source.indexOf(SPLIT_MARKER)
  if (markerIndex === -1) {
    throw new Error(`Unable to find split marker "${SPLIT_MARKER}" in ${SOURCE_PATH}`)
  }

  const evaluableSource = stripRuntimeImports(source.slice(0, markerIndex))
  const script = new vm.Script(
    `${evaluableSource}\nmodule.exports = { dict };`,
    { filename: SOURCE_PATH },
  )
  const sandbox = {
    module: { exports: {} },
    exports: {},
    process,
    console,
  }

  vm.createContext(sandbox)
  script.runInContext(sandbox, { timeout: 60_000 })

  const { dict } = sandbox.module.exports
  if (!dict || typeof dict !== 'object') {
    throw new Error('Failed to evaluate i18n source dictionary')
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const manifest = {}
  for (const lang of SUPPORTED_LANGS) {
    const langDict = dict[lang]
    if (!langDict || typeof langDict !== 'object') {
      throw new Error(`Missing dictionary for language "${lang}"`)
    }

    manifest[lang] = {
      keyCount: Object.keys(langDict).length,
      hash: hashDict(langDict),
    }

    const fileBody = `const dict = ${JSON.stringify(langDict, null, 2)}\n\nexport default dict\n`
    await fs.writeFile(path.join(OUTPUT_DIR, `${lang}.js`), fileBody, 'utf8')
  }

  const manifestBody = [
    `export const I18N_SUPPORTED_LANGS = ${JSON.stringify(SUPPORTED_LANGS)}`,
    `export const I18N_DEFAULT_LANG = ${JSON.stringify(DEFAULT_LANG)}`,
    `export const I18N_DICT_META = ${JSON.stringify(manifest, null, 2)}`,
    '',
  ].join('\n')

  await fs.writeFile(path.join(OUTPUT_DIR, 'manifest.js'), manifestBody, 'utf8')

  console.log(JSON.stringify({
    source: SOURCE_PATH,
    outputDir: OUTPUT_DIR,
    languages: SUPPORTED_LANGS.map((lang) => ({
      lang,
      ...manifest[lang],
    })),
  }, null, 2))
}

main().catch((error) => {
  console.error(String(error?.stack || error?.message || error))
  process.exit(1)
})
