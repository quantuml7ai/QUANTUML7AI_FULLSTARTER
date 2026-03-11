#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const repoRoot = process.cwd()
const outputPath = path.join(repoRoot, 'PROJECT_TREE.md')
const ignoredTopDirs = ['.git', '.next', 'node_modules']
const sourceExts = new Set(['.js', '.jsx', '.mjs', '.cjs', '.json'])
const assetExts = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.ico', '.glb',
  '.gltf', '.bin', '.txt', '.json', '.woff', '.woff2', '.ttf', '.otf', '.pdf',
])

function readRepoFiles() {
  const out = []

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const abs = path.join(currentDir, entry.name)
      const rel = path.relative(repoRoot, abs).replace(/\\/g, '/')
      if (!rel) continue
      const topDir = rel.split('/')[0]
      if (ignoredTopDirs.includes(topDir)) continue
      if (entry.isDirectory()) {
        walk(abs)
      } else if (entry.isFile()) {
        out.push(rel)
      }
    }
  }

  walk(repoRoot)
  if (!out.includes('PROJECT_TREE.md')) out.push('PROJECT_TREE.md')
  return out.sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true }))
}

function buildFileSet(files) {
  return new Set(files)
}

function resolveLocalImport(fromFile, specifier, fileSet) {
  const fromDir = path.posix.dirname(fromFile)
  let base = null

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    base = path.posix.normalize(path.posix.join(fromDir, specifier))
  } else if (specifier.startsWith('@/')) {
    base = path.posix.normalize(specifier.slice(2))
  } else if (/^(app|components|lib|tools|public)\//.test(specifier)) {
    base = path.posix.normalize(specifier)
  } else {
    return null
  }

  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}/index.js`,
    `${base}/index.jsx`,
    `${base}/index.json`,
  ]

  return candidates.find((candidate) => fileSet.has(candidate)) || null
}

function extractDeps(filePath, fileSet) {
  const ext = path.posix.extname(filePath)
  if (!sourceExts.has(ext)) return []

  let text = ''
  try {
    text = fs.readFileSync(path.join(repoRoot, filePath), 'utf8')
  } catch {
    return []
  }

  const patterns = [
    /import\s+[^'"]*?\sfrom\s+['"]([^'"]+)['"]/g,
    /export\s+[^'"]*?\sfrom\s+['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  const out = new Set()
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text))) {
      const resolved = resolveLocalImport(filePath, match[1], fileSet)
      if (resolved && resolved !== filePath) out.add(resolved)
    }
  }
  return Array.from(out).sort()
}

function splitName(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extLabel(filePath) {
  const ext = path.posix.extname(filePath).toLowerCase()
  const map = {
    '.js': 'JS-файл',
    '.jsx': 'JSX-файл',
    '.mjs': 'ESM-конфиг/модуль',
    '.json': 'JSON-файл',
    '.md': 'Markdown-документ',
    '.yaml': 'YAML-файл',
    '.yml': 'YAML-файл',
    '.ts': 'TS-служебный файл',
    '.tsx': 'TSX-служебный файл',
    '.css': 'CSS-файл',
    '.png': 'PNG-ассет',
    '.jpg': 'JPG-ассет',
    '.jpeg': 'JPEG-ассет',
    '.webp': 'WEBP-ассет',
    '.gif': 'GIF-ассет',
    '.svg': 'SVG-ассет',
    '.mp3': 'MP3-ассет',
    '.wav': 'WAV-ассет',
    '.ogg': 'OGG-ассет',
    '.mp4': 'MP4-ассет',
    '.webm': 'WEBM-ассет',
    '.ico': 'ICO-ассет',
    '.glb': '3D-модель GLB',
    '.gltf': '3D-модель GLTF',
    '.bin': 'бинарный ассет',
    '.woff': 'шрифт WOFF',
    '.woff2': 'шрифт WOFF2',
    '.ttf': 'шрифт TTF',
    '.otf': 'шрифт OTF',
    '.pdf': 'PDF-документ',
  }
  return map[ext] || `${ext || 'служебный'}-файл`
}

function describeDir(dirPath) {
  const map = {
    'app': 'основной каталог Next.js App Router: страницы, layout и API.',
    'app/about': 'страница/ресурсы раздела About.',
    'app/academy': 'страницы и блоки академии.',
    'app/ads': 'страницы и модули рекламного раздела.',
    'app/api': 'серверные API-маршруты и их внутренние хелперы.',
    'app/api/_diag': 'служебная диагностика API.',
    'app/api/dm': 'серверный контур личных сообщений.',
    'app/api/forum': 'серверный контур форума: снапшоты, мутации, модерация, upload.',
    'app/api/profile': 'серверные маршруты профиля, ника и аватара.',
    'app/api/qcoin': 'серверные маршруты QCoin.',
    'app/api/quest': 'серверные маршруты квестов.',
    'app/components': 'локальные компоненты верхнего уровня внутри app.',
    'app/contact': 'страница контактов.',
    'app/exchange': 'страницы/виджеты exchange-раздела.',
    'app/forum': 'домен форума и мессенджера.',
    'app/forum/events': 'клиентские event-хелперы форума.',
    'app/forum/features': 'feature-oriented слой форума.',
    'app/forum/features/feed': 'подсистема ленты, тем, постов и композера.',
    'app/forum/features/media': 'подсистема медиа, плееров и preview.',
    'app/forum/features/dm': 'подсистема Quantum Messenger / DM.',
    'app/forum/features/profile': 'подсистема профиля, about, VIP и popover.',
    'app/forum/features/subscriptions': 'подсистема подписок/соцграфа.',
    'app/forum/features/qcoin': 'подсистема QCoin в форуме.',
    'app/forum/features/quests': 'подсистема квестов форума.',
    'app/forum/features/moderation': 'подсистема жалоб, модерации и admin UI.',
    'app/forum/features/diagnostics': 'подсистема диагностики и perf-наблюдения.',
    'app/forum/features/ui': 'общие UI-узлы и проп-бандлы форума.',
    'app/forum/shared': 'shared-слой форума: общие хуки, utils, storage, config.',
    'app/forum/styles': 'стили форума и их сборка.',
    'app/forum/styles/modules': 'модульные фрагменты стилевого слоя форума.',
    'app/game': 'страницы/компоненты игрового раздела.',
    'app/privacy': 'страница privacy/policy.',
    'app/subscribe': 'страницы подписки/лендинга.',
    'app/tma': 'Telegram Mini App связанные страницы.',
    'app/tma/auto': 'авто-страницы TMA.',
    'audit': 'JSON-артефакты аудитов и миграционных фаз.',
    'components': 'общие React-компоненты всего проекта.',
    'lib': 'общие библиотеки, кеши, middleware-хелперы и инфраструктурные утилиты.',
    'public': 'статические ассеты, доступные по публичным URL.',
    'tools': 'локальные скрипты аудита, генерации и техобслуживания.',
  }

  if (map[dirPath]) return map[dirPath]

  const parts = dirPath.split('/')
  const base = parts[parts.length - 1]
  const parent = parts.slice(0, -1).join('/')

  if (parent.startsWith('app/forum/features/')) {
    const feature = parts[3]
    const layer = parts[4]
    const layerMap = {
      components: 'компоненты',
      hooks: 'хуки',
      services: 'сервисы',
      utils: 'утилиты',
      constants: 'константы',
      docs: 'документация',
      state: 'состояния',
      adapters: 'адаптеры',
    }
    if (layerMap[base]) {
      return `каталог слоя ${layerMap[base]} внутри feature ${feature}.`
    }
    if (feature && layer) {
      return `каталог ${base} внутри feature ${feature}.`
    }
  }

  if (parent === 'app/forum/shared') {
    return `каталог shared-слоя форума: ${base}.`
  }

  if (dirPath.startsWith('public/')) {
    return `подкаталог статических ассетов public/${base}.`
  }

  if (dirPath.startsWith('audit/')) {
    return `группа audit-артефактов: ${base}.`
  }

  if (dirPath.startsWith('tools/')) {
    return `подкаталог инструментов: ${base}.`
  }

  return `каталог ${base}.`
}

function classifyForumFeature(filePath) {
  const parts = filePath.split('/')
  const feature = parts[3]
  const layer = parts[4]
  const base = splitName(parts[parts.length - 1])
  const featureMap = {
    feed: 'ленты/тем/постов',
    media: 'медиа',
    dm: 'DM/мессенджера',
    profile: 'профиля/VIP',
    subscriptions: 'подписок',
    qcoin: 'QCoin',
    quests: 'квестов',
    moderation: 'модерации',
    diagnostics: 'диагностики',
    ui: 'форумного UI',
  }
  const layerMap = {
    components: 'UI-компонент',
    hooks: 'хук',
    services: 'сервис',
    utils: 'утилита',
    constants: 'константа',
    docs: 'документ',
    state: 'модуль состояния',
    adapters: 'адаптер',
  }
  if (!feature || !layer) return null
  return `${layerMap[layer] || 'модуль'} ${base} домена ${featureMap[feature] || feature}.`
}

function describeFile(filePath, deps, reverseDeps) {
  const base = path.posix.basename(filePath)
  const ext = path.posix.extname(filePath)
  const parts = filePath.split('/')
  const parent = parts.slice(0, -1).join('/')
  const stem = splitName(base)

  const rootMap = {
    '.env.local': 'локальный runtime-конфиг и секреты окружения.',
    '.env.local.example': 'пример переменных окружения для локального запуска.',
    '.eslintrc.json': 'конфигурация ESLint для всего проекта.',
    '.gitignore': 'правила исключения файлов из Git.',
    'jsconfig.json': 'алиасы и baseUrl проекта для JS/JSX.',
    'next-env.d.ts': 'служебный файл Next.js для типовой совместимости среды.',
    'next.config.mjs': 'главная конфигурация Next.js сборки и рантайма.',
    'package.json': 'манифест пакета, npm/pnpm-скрипты и зависимости.',
    'pnpm-lock.yaml': 'lockfile pnpm с зафиксированными версиями зависимостей.',
    'pnpm-workspace.yaml': 'конфиг workspace для pnpm.',
    'README.md': 'корневая документация проекта.',
    'account-sync-audit.report.json': 'сводный JSON-отчет аудита синхронизации аккаунта.',
    'deep-audit.report.json': 'сводный JSON-отчет глубокого аудита проекта.',
    'effects-leak.report.json': 'JSON-отчет аудита утечек эффектов.',
    'forum-deps-audit.report.json': 'JSON-отчет аудита зависимостей форума.',
    'forum-diag.jsonl': 'потоковый лог диагностики форума в формате JSONL.',
    'heavy-audit.report.json': 'JSON-отчет тяжелого аудита hot-path зон.',
    'media-audit.report.json': 'JSON-отчет аудита медиа-подсистемы.',
    'runtime-hotspots.report.json': 'JSON-отчет по runtime-hotspots.',
  }

  let description = rootMap[filePath] || rootMap[base] || ''

  if (!description && filePath.startsWith('app/api/')) {
    if (base === 'route.js') {
      const endpoint = filePath.replace(/^app\/api\//, '').replace(/\/route\.js$/, '')
      description = `API-route ${endpoint || '/'} для серверной логики Next.js.`
    } else if (base.startsWith('_')) {
      description = `внутренний ${stem} для API-сегмента ${parent.replace(/^app\/api\//, '') || 'root'}.`
    }
  }

  if (!description && filePath.startsWith('app/forum/features/')) {
    description = classifyForumFeature(filePath)
  }

  if (!description && filePath.startsWith('app/forum/shared/')) {
    const layer = parts[3]
    const layerMap = {
      api: 'shared API-хелпер',
      components: 'shared UI-компонент',
      config: 'shared конфиг',
      constants: 'shared константа',
      docs: 'shared документ',
      hooks: 'shared хук',
      storage: 'shared storage-обертка',
      telemetry: 'shared телеметрия',
      utils: 'shared утилита',
    }
    description = `${layerMap[layer] || 'shared модуль'} ${stem} форума.`
  }

  if (!description && filePath.startsWith('app/forum/styles/')) {
    if (parts[3] === 'modules') {
      description = `модуль стилевой сборки форума: ${stem}.`
    } else {
      description = `файл стилевого слоя форума: ${stem}.`
    }
  }

  if (!description && filePath.startsWith('app/forum/')) {
    const exact = {
      'app/forum/Forum.jsx': 'тонкий entry-point экрана форума.',
      'app/forum/ForumRoot.jsx': 'корневой composition-root форума и мессенджера.',
      'app/forum/ForumHeaderPanel.jsx': 'компоновщик шапки форума с контролами, профилем, QCoin и VIP.',
      'app/forum/ForumLayout.jsx': 'layout-обвязка форума.',
      'app/forum/ForumProviders.jsx': 'провайдеры и контекстная сборка форума.',
      'app/forum/ForumAds.js': 'форумная интеграция рекламных/промо-блоков.',
    }
    description = exact[filePath] || `${extLabel(filePath)} ${stem} домена форума.`
  }

  if (!description && filePath.startsWith('app/')) {
    if (base === 'page.js') {
      description = `Next.js страница маршрута /${parts.slice(1, -1).join('/')}.`
    } else if (base === 'layout.js') {
      description = `Next.js layout для сегмента /${parts.slice(1, -1).join('/') || ''}.`
    } else if (base === 'loading.js') {
      description = `loading-состояние для маршрута /${parts.slice(1, -1).join('/')}.`
    } else if (base === 'not-found.js') {
      description = `not-found обработчик для сегмента /${parts.slice(1, -1).join('/')}.`
    } else {
      description = `${extLabel(filePath)} ${stem} сегмента ${parent.replace(/^app\//, '') || 'app'}.`
    }
  }

  if (!description && filePath.startsWith('components/')) {
    description = `общий React-компонент ${stem}, используемый вне одного домена.`
  }

  if (!description && filePath.startsWith('lib/')) {
    description = `общая библиотека/утилита ${stem} инфраструктурного слоя.`
  }

  if (!description && filePath.startsWith('public/')) {
    const publicDir = parent === 'public' ? '' : parent.replace(/^public\//, '')
    const publicScope = publicDir ? `public/${publicDir}` : 'public/'
    description = `${extLabel(filePath)} из ${publicScope}; статический ассет проекта.`
  }

  if (!description && filePath.startsWith('tools/')) {
    description = `локальный скрипт/инструмент ${stem} для аудита или техобслуживания.`
  }

  if (!description && filePath.startsWith('audit/')) {
    description = `JSON-артефакт аудита ${stem}.`
  }

  if (!description) {
    description = `${extLabel(filePath)} ${stem}.`
  }

  const imports = (deps.get(filePath) || []).slice(0, 3).map(shortPath)
  const usedBy = (reverseDeps.get(filePath) || []).slice(0, 3).map(shortPath)

  let links = ''
  if (filePath.startsWith('public/')) {
    links = ' Связи: подключается через public URL/стили; прямые модульные импорты обычно не используются.'
  } else if (filePath.startsWith('audit/')) {
    links = ' Связи: генерируется audit-скриптами из tools/ и служит для проверки регрессий.'
  } else if (imports.length || usedBy.length) {
    const chunks = []
    if (imports.length) chunks.push(`импортирует ${imports.join(', ')}`)
    if (usedBy.length) chunks.push(`используется в ${usedBy.join(', ')}`)
    links = ` Связи: ${chunks.join('; ')}.`
  } else if (filePath.startsWith('tools/')) {
    links = ' Связи: запускается вручную или из локального audit/workflow.'
  } else {
    links = ' Связи: явных локальных модульных связей не обнаружено или файл используется инфраструктурой/рантаймом.'
  }

  return `${capitalize(description)}${links}`
}

function shortPath(filePath) {
  return filePath
    .replace(/^app\/forum\//, 'forum/')
    .replace(/^app\//, 'app/')
}

function capitalize(text) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function makeTree(files) {
  const root = { type: 'dir', name: '', path: '', children: new Map() }
  for (const filePath of files) {
    const parts = filePath.split('/')
    let current = root
    let acc = ''
    parts.forEach((part, index) => {
      acc = acc ? `${acc}/${part}` : part
      const isFile = index === parts.length - 1
      if (!current.children.has(part)) {
        current.children.set(part, {
          type: isFile ? 'file' : 'dir',
          name: part,
          path: acc,
          children: new Map(),
        })
      }
      current = current.children.get(part)
    })
  }
  return root
}

function sortNodes(nodes) {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base', numeric: true })
  })
}

function buildTopLevelCounts(files) {
  const counts = new Map()
  for (const file of files) {
    const top = file.split('/')[0]
    counts.set(top, (counts.get(top) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'ru', { sensitivity: 'base', numeric: true }))
}

function renderTree(root, deps, reverseDeps) {
  const lines = []
  function walk(node, depth) {
    const indent = '  '.repeat(depth)
    if (node.path) {
      if (node.type === 'dir') {
        lines.push(`${indent}- ${node.name}/ — ${capitalize(describeDir(node.path))}`)
      } else {
        lines.push(`${indent}- ${node.name} — ${describeFile(node.path, deps, reverseDeps)}`)
      }
    }
    if (node.type === 'dir') {
      const children = sortNodes(Array.from(node.children.values()))
      for (const child of children) walk(child, node.path ? depth + 1 : depth)
    }
  }
  walk(root, 0)
  return lines
}

function main() {
  const files = readRepoFiles()
  const fileSet = buildFileSet(files)
  const topLevelCounts = buildTopLevelCounts(files)
  const deps = new Map()
  const reverseDeps = new Map()

  for (const file of files) {
    const fileDeps = extractDeps(file, fileSet)
    deps.set(file, fileDeps)
    for (const dep of fileDeps) {
      if (!reverseDeps.has(dep)) reverseDeps.set(dep, [])
      reverseDeps.get(dep).push(file)
    }
  }

  for (const [key, value] of reverseDeps.entries()) {
    reverseDeps.set(key, value.sort())
  }

  const tree = makeTree(files)
  const lines = []
  lines.push('# PROJECT_TREE.md')
  lines.push('')
  lines.push('> Обязательное правило сопровождения:')
  lines.push('> Любое изменение структуры проекта обязательно должно сопровождаться обновлением этого файла.')
  lines.push('> Это включает: добавление файлов, удаление файлов, переименование, перенос между папками и изменение назначения файла.')
  lines.push('> Если меняются связи файла с другими файлами настолько, что комментарий устаревает, комментарий тоже обязан быть обновлен.')
  lines.push('> Рекомендуемый способ обновления: `node tools/generate-project-tree.js`.')
  lines.push('')
  lines.push(`Сгенерировано автоматически: ${new Date().toISOString()}`)
  lines.push(`Файлов в реестре: ${files.length}`)
  lines.push('')
  lines.push('## Исключенные каталоги')
  lines.push('- `.git/` — служебные внутренние данные Git, не часть прикладного дерева проекта.')
  lines.push('- `.next/` — генерируемые артефакты Next.js сборки.')
  lines.push('- `node_modules/` — внешние зависимости менеджера пакетов, не авторский код репозитория.')
  lines.push('')
  lines.push('## Охват')
  lines.push('')
  lines.push('Этот файл описывает весь авторский репозиторий проекта, а не только форумный домен.')
  lines.push('Включены все прикладные страницы, layouts, API-маршруты, клиентские компоненты, серверные и инфраструктурные модули, public-ассеты, audit-артефакты и корневые конфиги.')
  lines.push('')
  for (const [name, count] of topLevelCounts) {
    lines.push(`- \`${name}\` — ${count} файлов`)
  }
  lines.push('')
  lines.push('## Дерево проекта')
  lines.push('')
  lines.push(...renderTree(tree, deps, reverseDeps))
  lines.push('')

  fs.writeFileSync(outputPath, `\uFEFF${lines.join('\n')}`, 'utf8')
  process.stdout.write(`Written ${path.basename(outputPath)} with ${files.length} files.\n`)
}

main()
