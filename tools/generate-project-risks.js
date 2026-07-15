#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const {
  repoRoot,
  readRepoFiles,
  readSpecialAppFiles,
  buildDependencyMaps,
  categorizeFile,
  writeMarkdown,
} = require('./project-docs-shared')

const outputPath = path.join(repoRoot, 'PROJECT_RISKS.md')

function compareRu(a, b) {
  return a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true })
}

function topFanIn(reverseDeps, limit = 25) {
  return Array.from(reverseDeps.entries())
    .map(([file, consumers]) => ({ file, count: consumers.length }))
    .sort((a, b) => b.count - a.count || compareRu(a.file, b.file))
    .slice(0, limit)
}

function topFanOut(files, deps, limit = 25) {
  return files
    .map((file) => ({ file, count: (deps.get(file) || []).length }))
    .sort((a, b) => b.count - a.count || compareRu(a.file, b.file))
    .slice(0, limit)
}

function buildZoneRisk(files, deps) {
  const stats = new Map()
  for (const file of files) {
    const zone = categorizeFile(file)
    if (!stats.has(zone)) stats.set(zone, { zone, files: 0, outgoing: 0 })
    const item = stats.get(zone)
    item.files += 1
    item.outgoing += (deps.get(file) || []).length
  }
  return Array.from(stats.values())
    .map((item) => ({
      ...item,
      density: item.files ? Number((item.outgoing / item.files).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.density - a.density || b.outgoing - a.outgoing || compareRu(a.zone, b.zone))
}

function listCriticalDataFiles(files) {
  const patterns = [
    /^app\/api\/.*\/_db\.js$/,
    /^app\/api\/.*\/_utils\.js$/,
    /^app\/api\/.*\/route\.js$/,
    /^lib\/.*(Cache|cache|redis|metadata|forum|wallet|geo).*\.js$/,
    /^components\/i18n\.js$/,
    /^middleware\.js$/,
  ]
  return files.filter((file) => patterns.some((pattern) => pattern.test(file))).sort(compareRu)
}

function listRootConfigs(files) {
  const rootFiles = [
    'package.json',
    'next.config.mjs',
    'jsconfig.json',
    '.eslintrc.json',
    '.env.local.example',
    'README.md',
  ]
  return rootFiles.filter((file) => files.includes(file))
}

function classifyRouteRisk(file) {
  if (file.startsWith('app/api/')) return 'Изменение влияет на серверный контракт и клиентов, завязанных на endpoint.'
  if (file.includes('/layout.')) return 'Изменение влияет на layout-сборку и поведение целого маршрута/домена.'
  if (file.includes('/page.')) return 'Изменение влияет на экран/маршрут как на основную точку входа.'
  if (file.includes('/loading.')) return 'Изменение влияет на загрузочное состояние и UX-сценарии.'
  if (file.includes('/not-found.')) return 'Изменение влияет на fallback и ошибки сегмента.'
  if (file.includes('/default.')) return 'Изменение влияет на slot/fallback-сценарий сегмента.'
  return 'Изменение влияет на маршрутный runtime.'
}

function main() {
  const files = readRepoFiles()
  const sourceFiles = files.filter((file) => /\.(js|jsx|mjs|cjs|json)$/.test(file))
  const routeFiles = readSpecialAppFiles()
  const { deps, reverseDeps } = buildDependencyMaps(sourceFiles)
  const fanIn = topFanIn(reverseDeps)
  const fanOut = topFanOut(sourceFiles, deps)
  const zoneRisk = buildZoneRisk(sourceFiles, deps)
  const criticalDataFiles = listCriticalDataFiles(sourceFiles)
  const rootConfigs = listRootConfigs(files)

  const lines = []
  lines.push('# PROJECT_RISKS.md')
  lines.push('')
  lines.push('> Обязательное правило сопровождения:')
  lines.push('> Если меняются критические точки входа, серверные контракты, import-граф или ownership модулей, этот файл должен быть обновлен.')
  lines.push('> Рекомендуемый способ обновления: `node tools/generate-project-risks.js`.')
  lines.push('')
  lines.push(`Сгенерировано автоматически: ${new Date().toISOString()}`)
  lines.push(`Исходных файлов в анализе: ${sourceFiles.length}`)
  lines.push(`Route-aware файлов: ${routeFiles.length}`)
  lines.push('')
  lines.push('## Что Считается Риском')
  lines.push('')
  lines.push('- Файлы с большим числом потребителей.')
  lines.push('- Файлы с большим числом локальных зависимостей.')
  lines.push('- Route/layout/API entry points, влияющие на экранный или серверный поток.')
  lines.push('- DB/cache/config/i18n узлы, от которых зависят несколько доменов одновременно.')
  lines.push('')
  lines.push('## Критические Route И Runtime Entry Points')
  lines.push('')
  for (const file of routeFiles) {
    lines.push(`- \`${file}\` — ${classifyRouteRisk(file.replace(/\\/g, '/'))}`)
  }
  lines.push('')
  lines.push('## Файлы С Самым Высоким Fan-In')
  lines.push('')
  for (const item of fanIn) {
    lines.push(`- \`${item.file}\` — используют ${item.count} локальных модулей`)
  }
  lines.push('')
  lines.push('## Файлы С Самым Высоким Fan-Out')
  lines.push('')
  for (const item of fanOut) {
    lines.push(`- \`${item.file}\` — импортирует ${item.count} локальных модулей`)
  }
  lines.push('')
  lines.push('## Зоны С Повышенной Плотностью Связей')
  lines.push('')
  for (const item of zoneRisk.slice(0, 30)) {
    lines.push(`- \`${item.zone}\` — файлов: ${item.files}; исходящих связей: ${item.outgoing}; плотность: ${item.density}`)
  }
  lines.push('')
  lines.push('## Серверные И Инфраструктурные Хотспоты')
  lines.push('')
  for (const file of criticalDataFiles) {
    lines.push(`- \`${file}\``)
  }
  lines.push('')
  lines.push('## Корневые Конфиги И Документы Управления')
  lines.push('')
  for (const file of rootConfigs) {
    lines.push(`- \`${file}\``)
  }
  lines.push('')
  lines.push('## Практический Вывод')
  lines.push('')
  lines.push('- Перед изменениями в route/layout/API и high fan-in файлах нужен отдельный локальный аудит импорта и сценариев.')
  lines.push('- Перед изменениями в `app/api/**`, `lib/**`, `components/i18n.js` и `middleware.js` нужно ожидать междоменный эффект.')
  lines.push('- Этот файл нужен не для косметики, а чтобы быстро видеть зоны, где одно изменение чаще всего ломает несколько частей проекта.')

  writeMarkdown(outputPath, lines)
  process.stdout.write(`Written ${path.basename(outputPath)}.\n`)
}

main()
