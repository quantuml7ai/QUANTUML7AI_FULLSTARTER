#!/usr/bin/env node

const path = require('path')
const {
  repoRoot,
  readRepoFiles,
  buildDependencyMaps,
  categorizeFile,
  writeMarkdown,
} = require('./project-docs-shared')

const outputPath = path.join(repoRoot, 'PROJECT_DEPENDENCIES.md')

function compareRu(a, b) {
  return a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true })
}

function buildZoneStats(files) {
  const map = new Map()
  for (const file of files) {
    const zone = categorizeFile(file)
    map.set(zone, (map.get(zone) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => compareRu(a.zone, b.zone))
}

function buildZoneEdges(files, deps) {
  const map = new Map()
  for (const file of files) {
    const fromZone = categorizeFile(file)
    for (const dep of deps.get(file) || []) {
      const toZone = categorizeFile(dep)
      const key = `${fromZone} -> ${toZone}`
      map.set(key, (map.get(key) || 0) + 1)
    }
  }
  return Array.from(map.entries())
    .map(([key, count]) => {
      const [fromZone, toZone] = key.split(' -> ')
      return { fromZone, toZone, count }
    })
    .sort((a, b) => b.count - a.count || compareRu(a.fromZone, b.fromZone) || compareRu(a.toZone, b.toZone))
}

function buildFanIn(reverseDeps) {
  return Array.from(reverseDeps.entries())
    .map(([file, consumers]) => ({ file, count: consumers.length, consumers: consumers.slice(0, 8) }))
    .sort((a, b) => b.count - a.count || compareRu(a.file, b.file))
}

function buildFanOut(files, deps) {
  return files
    .map((file) => ({ file, count: (deps.get(file) || []).length, deps: (deps.get(file) || []).slice(0, 8) }))
    .sort((a, b) => b.count - a.count || compareRu(a.file, b.file))
}

function buildOutgoingByZone(files, deps) {
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
        .map(([target, count]) => ({ target, count }))
        .sort((a, b) => b.count - a.count || compareRu(a.target, b.target)),
    }))
    .sort((a, b) => compareRu(a.zone, b.zone))
}

function main() {
  const files = readRepoFiles()
  const sourceFiles = files.filter((file) => /\.(js|jsx|mjs|cjs|json)$/.test(file))
  const { deps, reverseDeps } = buildDependencyMaps(sourceFiles)
  const zoneStats = buildZoneStats(sourceFiles)
  const zoneEdges = buildZoneEdges(sourceFiles, deps)
  const fanIn = buildFanIn(reverseDeps)
  const fanOut = buildFanOut(sourceFiles, deps)
  const outgoingByZone = buildOutgoingByZone(sourceFiles, deps)

  const lines = []
  lines.push('# PROJECT_DEPENDENCIES.md')
  lines.push('')
  lines.push('> Обязательное правило сопровождения:')
  lines.push('> Если появляются новые крупные зависимости между доменами, меняются import-графы или переносится ownership между зонами, этот файл должен быть обновлен.')
  lines.push('> Рекомендуемый способ обновления: `node tools/generate-project-dependencies.js`.')
  lines.push('')
  lines.push(`Сгенерировано автоматически: ${new Date().toISOString()}`)
  lines.push(`Исходных файлов в анализе: ${sourceFiles.length}`)
  lines.push(`Локальных зависимостей: ${zoneEdges.reduce((sum, item) => sum + item.count, 0)}`)
  lines.push('')
  lines.push('## Охват')
  lines.push('')
  lines.push('- Локальные импорты между `app`, `components`, `lib`, `tools`, `public`.')
  lines.push('- Межзоновые зависимости по доменам и слоям.')
  lines.push('- Файлы с высоким fan-in и fan-out, то есть с высоким радиусом поломки.')
  lines.push('')
  lines.push('## Размер Зон')
  lines.push('')
  for (const item of zoneStats) {
    lines.push(`- \`${item.zone}\` — ${item.count} файлов`)
  }
  lines.push('')
  lines.push('## Топ Межзоновых Зависимостей')
  lines.push('')
  for (const edge of zoneEdges.slice(0, 50)) {
    lines.push(`- \`${edge.fromZone}\` -> \`${edge.toZone}\` — ${edge.count} локальных импортов`)
  }
  lines.push('')
  lines.push('## Исходящие Зависимости По Зонам')
  lines.push('')
  for (const item of outgoingByZone) {
    lines.push(`### ${item.zone}`)
    lines.push('')
    if (!item.edges.length) {
      lines.push('- Нет локальных исходящих импортов.')
      lines.push('')
      continue
    }
    for (const edge of item.edges.slice(0, 12)) {
      lines.push(`- \`${edge.target}\` — ${edge.count}`)
    }
    lines.push('')
  }
  lines.push('## Файлы С Высоким Fan-In')
  lines.push('')
  for (const item of fanIn.slice(0, 40)) {
    const consumers = item.consumers.length ? item.consumers.map((value) => `\`${value}\``).join(', ') : 'нет'
    lines.push(`- \`${item.file}\` — fan-in ${item.count}; основные потребители: ${consumers}`)
  }
  lines.push('')
  lines.push('## Файлы С Высоким Fan-Out')
  lines.push('')
  for (const item of fanOut.slice(0, 40)) {
    const targets = item.deps.length ? item.deps.map((value) => `\`${value}\``).join(', ') : 'нет'
    lines.push(`- \`${item.file}\` — fan-out ${item.count}; основные зависимости: ${targets}`)
  }
  lines.push('')
  lines.push('## Вывод')
  lines.push('')
  lines.push('- Файлы с высоким fan-in требуют особенно осторожных изменений, потому что влияют на большое число модулей.')
  lines.push('- Самые чувствительные зоны обычно находятся в `app/forum`, `app/api/*`, `components/i18n.js`, `lib/*` и корневых route/layout файлах.')
  lines.push('- Этот документ не заменяет код-ревью, но показывает, где радиус регрессии максимальный еще до ручной проверки.')

  writeMarkdown(outputPath, lines)
  process.stdout.write(`Written ${path.basename(outputPath)}.\n`)
}

main()
