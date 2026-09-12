#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MARKER = 'QL7_TRUST_IDENTITY_LOCALIZED_ROOT_HTML_FINALIZER_V2'
const ROUTES = Object.freeze({
  en: Object.freeze({ route: '/en/trust-and-identity', dir: 'ltr' }),
  ru: Object.freeze({ route: '/ru/trust-and-identity', dir: 'ltr' }),
  uk: Object.freeze({ route: '/uk/trust-and-identity', dir: 'ltr' }),
  es: Object.freeze({ route: '/es/trust-and-identity', dir: 'ltr' }),
  tr: Object.freeze({ route: '/tr/trust-and-identity', dir: 'ltr' }),
  ar: Object.freeze({ route: '/ar/trust-and-identity', dir: 'rtl' }),
  zh: Object.freeze({ route: '/zh/trust-and-identity', dir: 'ltr' }),
})

function replaceAttr(tag, name, value) {
  const rx = new RegExp(`\\s${name}=(["'])[^"']*\\1`, 'i')
  if (rx.test(tag)) return tag.replace(rx, ` ${name}="${value}"`)
  return tag.replace(/^<html\b/i, `<html ${name}="${value}"`)
}

export function finalizeLocalizedTrustRootHtml({ root = ROOT } = {}) {
  const serverApp = path.join(root, '.next', 'server', 'app')
  if (!fs.existsSync(serverApp)) throw new Error(`${MARKER}:missing_server_app`)
  const rows = []
  for (const [lang, config] of Object.entries(ROUTES)) {
    const direct = path.join(serverApp, lang, 'trust-and-identity.html')
    let file = fs.existsSync(direct) ? direct : null
    if (!file) {
      const matches = []
      const walk = (dir) => {
        if (!fs.existsSync(dir)) return
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const abs = path.join(dir, entry.name)
          if (entry.isDirectory()) walk(abs)
          else if (entry.isFile() && entry.name === 'trust-and-identity.html') matches.push(abs)
        }
      }
      walk(serverApp)
      const suffix = `/${lang}/trust-and-identity.html`
      file = matches.find((entry) => entry.replace(/\\/g, '/').endsWith(suffix)) || null
    }
    if (!file) throw new Error(`${MARKER}:missing_html:${lang}`)

    const before = fs.readFileSync(file, 'utf8')
    const openTag = before.match(/<html\b[^>]*>/i)?.[0] || ''
    if (!openTag) throw new Error(`${MARKER}:missing_root_html_tag:${lang}`)

    let nextTag = replaceAttr(openTag, 'lang', lang)
    nextTag = replaceAttr(nextTag, 'dir', config.dir)
    const after = before.replace(openTag, nextTag)

    if (after === before && (!new RegExp(`\\blang=["']${lang}["']`, 'i').test(openTag) || !new RegExp(`\\bdir=["']${config.dir}["']`, 'i').test(openTag))) {
      throw new Error(`${MARKER}:mutation_failed:${lang}`)
    }

    fs.writeFileSync(file, after, 'utf8')
    const verify = fs.readFileSync(file, 'utf8')
    const verifyTag = verify.match(/<html\b[^>]*>/i)?.[0] || ''
    const langCount = [...verifyTag.matchAll(/\blang=(["'])[^"']*\1/gi)].length
    const dirCount = [...verifyTag.matchAll(/\bdir=(["'])[^"']*\1/gi)].length
    if (langCount !== 1 || dirCount !== 1) throw new Error(`${MARKER}:duplicate_root_attrs:${lang}`)
    if (!new RegExp(`\\blang=["']${lang}["']`, 'i').test(verifyTag)) throw new Error(`${MARKER}:lang_verify_failed:${lang}`)
    if (!new RegExp(`\\bdir=["']${config.dir}["']`, 'i').test(verifyTag)) throw new Error(`${MARKER}:dir_verify_failed:${lang}`)

    rows.push({
      lang,
      dir: config.dir,
      route: config.route,
      htmlFile: path.relative(root, file).replace(/\\/g, '/'),
      rootHtmlTag: verifyTag,
      bytes: Buffer.byteLength(verify, 'utf8'),
    })
  }
  if (rows.length !== 7) throw new Error(`${MARKER}:route_count`)
  process.stdout.write(`${MARKER}_OK ${JSON.stringify({ routes: rows })}\n`)
  return rows
}

const invokedDirectly = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false

if (invokedDirectly) {
  finalizeLocalizedTrustRootHtml()
}
