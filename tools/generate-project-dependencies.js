#!/usr/bin/env node

const path = require('path')
const {
  repoRoot,
  readRepoFiles,
  buildDependencyMaps,
  categorizeFile,
  sortNatural,
  writeMarkdown,
} = require('./project-docs-shared')

const outputPath = path.join(repoRoot, 'PROJECT_DEPENDENCIES.md')

function topEdgesByZone(files, deps) {
  const edgeMap = new Map()

  for (const file of files) {
    const fromZone = categorizeFile(file)
    for (const dep of deps.get(file) || []) {
      const toZone = categorizeFile(dep)
      const key = `${fromZone} -> ${toZone}`
      edgeMap.set(key, (edgeMap.get(key) || 0) + 1)
    }
  }

  return Array.from(edgeMap.entries())
    .map(([key, count]) => {
      const [from, to] = key.split(' -> ')
      return { from, to, count }
    })
    .sort((a, b) => b.count - a.count || a.from.localeCompare(b.from, 'ru', { sensitivity: 'base', numeric: true }))
}

function topFilesByFanIn(reverseDeps) {
  return Array.from(reverseDeps.entries())
    .map(([file, consumers]) => ({ file, fanIn: consumers.length, consumers: consumers.slice(0, 8) }))
    .sort((a, b) => b.fanIn - a.fanIn || a.file.localeCompare(b.file, 'ru', { sensitivity: 'base', numeric: true }))
}

function zoneStats(files) {
  const map = new Map()
  for (const file of files) {
    const zone = categorizeFile(file)
    map.set(zone, (map.get(zone) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => a.zone.localeCompare(b.zone, 'ru', { sensitivity: 'base', numeric: true }))
}

function groupOutgoingByZone(files, deps) {
  const grouped = new Map()
  for (const file of files) {
    const fromZone = categorizeFile(file)
    if (!grouped.has(fromZone)) grouped.set(fromZone, new Map())
    const zoneMap = grouped.get(fromZone)
    for (const dep of deps.get(file) || []) {
      const toZone = categorizeFile(dep)
      zoneMap.set(toZone, (zoneMap.get(toZone) || 0) + 1)
    }
  }
  return Array.from(grouped.entries())
    .map(([zone, edgeMap]) => ({
      zone,
      edges: Array.from(edgeMap.entries())
        .map(([toZone, count]) => ({ toZone, count }))
        .sort((a, b) => b.count - a.count || a.toZone.localeCompare(b.toZone, 'ru', { sensitivity: 'base', numeric: true })),
    }))
    .sort((a, b) => a.zone.localeCompare(b.zone, 'ru', { sensitivity: 'base', numeric: true }))
}

function main() {
  const files = readRepoFiles()
  const sourceFiles = files.filter((file) => /\.(js|jsx|mjs|cjs|json)$/.test(file))
  const { deps, reverseDeps } = buildDependencyMaps(sourceFiles)
  const edges = topEdgesByZone(sourceFiles, deps)
  const fanIn = topFilesByFanIn(reverseDeps)
  const zones = zoneStats(sourceFiles)
  const groupedOutgoing = groupOutgoingByZone(sourceFiles, deps)

  const lines = []
  lines.push('# PROJECT_DEPENDENCIES.md')
  lines.push('')
  lines.push('> Обязательное правило сопровождения:')
  lines.push('> Если появляются новые крупные зависимости между доменами, меняются import-графы или переносится ownership между зонами, этот файл должен быть обновлен.')
  lines.push('> Рекомендуемый способ обновления: `node tools/generate-project-dependencies.js`.')
  lines.push('')
  lines.push(`Сгенерировано автоматически: ${new Date().toISOString()}`)
  lines.push(`Исходных файлов в анализе: ${sourceFiles.length}`)
  lines.push(`Локальных зависимостей: ${edges.reduce((sum, item) => sum + item.count, 0)}`)
  lines.push('')
  lines.push('## Охват')
  lines.push('')
  lines.push('- Локальные импорты между `app`, `components`, `lib`, `tools`, `public`.')
  lines.push('- Межзоновые зависимости по доменам и слоям.')
  lines.push('- Файлы с высоким fan-in, то есть большим радиусом поломки.')
  lines.push('')
  lines.push('## Размер Зон')
  lines.push('')
  for (const item of zones) {
    lines.push(`- \`${item.zone}\` — ${item.count} файлов`)
  }
  lines.push('')
  lines.push('## Топ Межзоновых Зависимостей')
  lines.push('')
  for (const edge of edges.slice(0, 50)) {
    lines.push(`- \`${edge.from}\` -> \`${edge.to}\` — ${edge.count} локальных импортов`)
  }
  lines.push('')
  lines.push('## Исходящие Зависимости По Зонам')
  lines.push('')
  for (const item of groupedOutgoing) {
    lines.push(`### ${item.zone}`)
    lines.push('')
    if (!item.edges.length) {
      lines.push('- Нет локальных исходящих импортов.')
      lines.push('')
      continue
    }
    for (const edge of item.edges.slice(0, 12)) {
      lines.push(`- \`${edge.toZone}\` — ${edge.count}`)
    }
    lines.push('')
  }
  lines.push('## Файлы С Высоким Fan-In')
  lines.push('')
  for (const item of fanIn.slice(0, 40)) {
    const consumers = item.consumers.length ? item.consumers.map((v) => `\`${v}\``).join(', ') : 'нет'
    lines.push(`- \`${item.file}\` — fan-in ${item.fanIn}; основные потребители: ${consumers}`)
  }
  lines.push('')
  lines.push('## Вывод')
  lines.push('')
  lines.push('- Файлы с высоким fan-in требуют особенно осторожных изменений.')
  lines.push('- Самые чувствительные зоны обычно находятся в `app/forum`, `app/api/*`, `components/i18n.js`, `lib/*` и корневых route/layout файлах.')

  writeMarkdown(outputPath, lines)
  process.stdout.write(`Written ${path.basename(outputPath)}.\n`)
}

main()
