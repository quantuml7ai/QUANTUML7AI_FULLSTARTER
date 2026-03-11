#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const repoRoot = process.cwd()
const appRoot = path.join(repoRoot, 'app')
const outputPath = path.join(repoRoot, 'PROJECT_ROUTES.md')

const specialFiles = new Set([
  'page.js', 'page.jsx',
  'layout.js', 'layout.jsx',
  'loading.js', 'loading.jsx',
  'not-found.js', 'not-found.jsx',
  'default.js', 'default.jsx',
  'route.js', 'route.jsx',
])

function walk(dir) {
  const out = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(abs))
    } else if (entry.isFile() && specialFiles.has(entry.name)) {
      out.push(abs)
    }
  }
  return out
}

function relApp(absPath) {
  return path.relative(repoRoot, absPath).replace(/\\/g, '/')
}

function normalizeSegment(segment) {
  if (!segment) return ''
  return segment
}

function makeRouteUrl(relPath) {
  const parts = relPath.replace(/^app\//, '').split('/')
  const file = parts.pop()
  let isApi = false
  if (parts[0] === 'api') {
    isApi = true
    parts.shift()
  }
  if (file.startsWith('page.') || file.startsWith('layout.') || file.startsWith('loading.') || file.startsWith('not-found.') || file.startsWith('default.')) {
    const route = '/' + parts.map(normalizeSegment).join('/')
    return route === '/' ? '/' : route.replace(/\/+/g, '/')
  }
  if (file.startsWith('route.')) {
    const route = '/' + (isApi ? `api/${parts.join('/')}` : parts.join('/'))
    return route === '/' ? '/' : route.replace(/\/+/g, '/')
  }
  return '/' + parts.join('/')
}

function routeKind(fileName, relPath) {
  if (fileName.startsWith('page.')) return 'page'
  if (fileName.startsWith('layout.')) return 'layout'
  if (fileName.startsWith('loading.')) return 'loading'
  if (fileName.startsWith('not-found.')) return 'not-found'
  if (fileName.startsWith('default.')) return 'default'
  if (fileName.startsWith('route.')) {
    return relPath.startsWith('app/api/') ? 'api-route' : 'route-handler'
  }
  return 'file'
}

function describeRoute(url, kind, relPath) {
  const clean = url === '/' ? 'корневого маршрута' : `маршрута \`${url}\``
  if (kind === 'page') return `страница ${clean}`
  if (kind === 'layout') return `layout ${clean}`
  if (kind === 'loading') return `loading-состояние ${clean}`
  if (kind === 'not-found') return `обработчик not-found для ${clean}`
  if (kind === 'default') return `default-слот ${clean}`
  if (kind === 'api-route') return `API-эндпоинт \`${url}\``
  if (kind === 'route-handler') return `route handler ${clean}`
  return `маршрутный файл ${clean}`
}

function topDomain(relPath) {
  const parts = relPath.replace(/^app\//, '').split('/')
  if (parts.length === 1) return 'root'
  if (parts[0] === 'api') return `api/${parts[1] || 'root'}`
  if (parts[0].startsWith('page.') || parts[0].startsWith('layout.') || parts[0].startsWith('loading.') || parts[0].startsWith('not-found.') || parts[0].startsWith('default.') || parts[0].startsWith('route.')) {
    return 'root'
  }
  return parts[0] || 'root'
}

function collectRouteInfo(files) {
  return files
    .map((absPath) => {
      const relPath = relApp(absPath)
      const fileName = path.basename(absPath)
      const url = makeRouteUrl(relPath)
      const kind = routeKind(fileName, relPath)
      return {
        relPath,
        url,
        kind,
        domain: topDomain(relPath),
        description: describeRoute(url, kind, relPath),
      }
    })
    .sort((a, b) => a.url.localeCompare(b.url, 'ru', { sensitivity: 'base', numeric: true }) || a.kind.localeCompare(b.kind))
}

function groupBy(list, keyFn) {
  const map = new Map()
  for (const item of list) {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru', { sensitivity: 'base', numeric: true }))
}

function renderSection(title, routes) {
  const lines = []
  lines.push(`## ${title}`)
  lines.push('')
  for (const [group, items] of groupBy(routes, (item) => item.domain)) {
    lines.push(`### ${group}`)
    lines.push('')
    for (const item of items) {
      lines.push(`- \`${item.url}\` — ${item.description}; файл: \`${item.relPath}\`; тип: \`${item.kind}\`.`)
    }
    lines.push('')
  }
  return lines
}

function main() {
  const all = collectRouteInfo(walk(appRoot))
  const appRoutes = all.filter((item) => item.kind !== 'api-route')
  const apiRoutes = all.filter((item) => item.kind === 'api-route')

  const lines = []
  lines.push('# PROJECT_ROUTES.md')
  lines.push('')
  lines.push('> Обязательное правило сопровождения:')
  lines.push('> Любое изменение маршрутов, страниц, layout-файлов, loading/not-found/default файлов и API-route файлов обязано сопровождаться обновлением этого файла.')
  lines.push('> Рекомендуемый способ обновления: `node tools/generate-project-routes.js`.')
  lines.push('')
  lines.push(`Сгенерировано автоматически: ${new Date().toISOString()}`)
  lines.push(`Всего route-aware файлов: ${all.length}`)
  lines.push(`Пользовательских route-сущностей: ${appRoutes.length}`)
  lines.push(`API-route сущностей: ${apiRoutes.length}`)
  lines.push('')
  lines.push('## Охват')
  lines.push('')
  lines.push('- Все страницы Next.js (`page.js|jsx`)')
  lines.push('- Все `layout`, `loading`, `not-found`, `default` файлы')
  lines.push('- Все route handlers, включая `app/api/**/route.js` и не-API `route.js`')
  lines.push('')
  lines.push(...renderSection('Пользовательские Маршруты И Route Handlers', appRoutes))
  lines.push(...renderSection('API Маршруты', apiRoutes))

  fs.writeFileSync(outputPath, `\uFEFF${lines.join('\n')}\n`, 'utf8')
  process.stdout.write(`Written ${path.basename(outputPath)} with ${all.length} route-aware files.\n`)
}

main()
