
const fs = require('fs')
const path = require('path')

const repoRoot = process.cwd()
const outputPath = path.join(repoRoot, 'PROJECT_TREE.md')
const ignoredTopDirs = ['.git', '.next', 'node_modules']
const sourceExts = new Set(['.js', '.jsx', '.mjs', '.cjs', '.json'])

function sortNatural(list) {
  return list.sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true }))
}

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
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile()) out.push(rel)
    }
  }

  walk(repoRoot)
  if (!out.includes('PROJECT_TREE.md')) out.push('PROJECT_TREE.md')
  return sortNatural(out)
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
  return Array.from(out).sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true }))
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
    app: 'основной каталог Next.js App Router: страницы, layout и API.',
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
    audit: 'JSON-артефакты аудитов и миграционных фаз.',
    components: 'общие React-компоненты всего проекта.',
    lib: 'общие библиотеки, кеши, middleware-хелперы и инфраструктурные утилиты.',
    public: 'статические ассеты, доступные по публичным URL.',
    tools: 'локальные скрипты аудита, генерации и техобслуживания.',
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
    if (layerMap[base]) return `каталог слоя ${layerMap[base]} внутри feature ${feature}.`
    if (feature && layer) return `каталог ${base} внутри feature ${feature}.`
  }

  if (parent === 'app/forum/shared') return `каталог shared-слоя форума: ${base}.`
  if (dirPath.startsWith('public/')) return `подкаталог статических ассетов public/${base}.`
  if (dirPath.startsWith('audit/')) return `группа audit-артефактов: ${base}.`
  if (dirPath.startsWith('tools/')) return `подкаталог инструментов: ${base}.`

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
    state: 'state-модуль',
    adapters: 'адаптер',
  }
  const featureLabel = featureMap[feature] || feature || 'feature'
  const layerLabel = layerMap[layer] || 'модуль'
  return `${layerLabel} подсистемы ${featureLabel}: ${base}.`
}

function describeFile(filePath) {
  const parts = filePath.split('/')
  const base = parts[parts.length - 1]
  const clean = splitName(base)

  if (/^PROJECT_(TREE|ROUTES|OWNERSHIP|DEPENDENCIES|RISKS)\.md$/i.test(base)) {
    return `${extLabel(filePath)} реестра проекта: ${clean}.`
  }
  if (filePath === 'README.md') return 'Markdown-документ верхнего уровня с общим описанием проекта.'
  if (filePath === 'package.json') return 'JSON-файл манифеста npm/pnpm: зависимости, скрипты и метаданные проекта.'
  if (filePath === 'pnpm-lock.yaml') return 'YAML-файл lockfile pnpm, фиксирует версии зависимостей.'
  if (filePath === 'pnpm-workspace.yaml') return 'YAML-файл конфигурации workspace pnpm.'
  if (filePath === 'jsconfig.json') return 'JSON-файл конфигурации JS/alias для редактора и Next.js.'
  if (filePath === 'next.config.mjs') return 'ESM-конфиг Next.js приложения.'
  if (filePath === 'next-env.d.ts') return 'TS-служебный файл, генерируемый Next.js для типового окружения.'
  if (filePath === '.env.local') return 'служебный-файл локальных переменных окружения разработчика.'
  if (filePath === '.env.local.example') return 'служебный-файл примера локальных переменных окружения.'
  if (filePath === '.eslintrc.json') return 'JSON-файл конфигурации ESLint.'
  if (filePath === '.gitignore') return 'служебный-файл правил исключения для Git.'
  if (filePath.startsWith('audit/')) return `${extLabel(filePath)} аудита/проверки состояния проекта.`
  if (filePath.startsWith('tools/')) return `${extLabel(filePath)} локального инструмента генерации, аудита или техобслуживания.`
  if (filePath.startsWith('public/')) return `${extLabel(filePath)} статического публичного ассета ${clean}.`
  if (filePath.startsWith('components/')) return `${extLabel(filePath)} общего компонента/провайдера ${clean}.`
  if (filePath.startsWith('lib/')) return `${extLabel(filePath)} общей библиотеки/инфраструктурного модуля ${clean}.`
  if (filePath.startsWith('app/forum/features/')) return classifyForumFeature(filePath)
  if (filePath.startsWith('app/forum/shared/')) return `${extLabel(filePath)} shared-слоя форума: ${clean}.`
  if (filePath.startsWith('app/forum/styles/modules/')) return `${extLabel(filePath)} модульного фрагмента стилей форума: ${clean}.`
  if (filePath.startsWith('app/forum/styles/')) return `${extLabel(filePath)} стилевого слоя форума: ${clean}.`
  if (filePath.startsWith('app/api/')) {
    if (base === 'route.js' || base === 'route.jsx') {
      const routePath = parts.slice(2, -1).join('/') || 'root'
      return `API-route ${routePath} для серверной логики Next.js.`
    }
    if (base.startsWith('_')) return `${extLabel(filePath)} внутреннего серверного хелпера API: ${clean}.`
    return `${extLabel(filePath)} серверного модуля API-зоны ${parts[2] || 'root'}: ${clean}.`
  }
  if (filePath.startsWith('app/')) {
    if (/\/(page|layout|loading|not-found|default)\.(js|jsx)$/.test(filePath)) {
      const segment = parts.slice(1, -1).join('/') || 'root'
      if (base.startsWith('page.')) return `Next.js страница маршрута /${segment === 'root' ? '' : segment}.`
      if (base.startsWith('layout.')) return `Next.js layout для сегмента /${segment === 'root' ? '' : segment}.`
      if (base.startsWith('loading.')) return `Next.js loading-состояние для сегмента /${segment === 'root' ? '' : segment}.`
      if (base.startsWith('not-found.')) return `Next.js not-found для сегмента /${segment === 'root' ? '' : segment}.`
      if (base.startsWith('default.')) return `Next.js default-слот для сегмента /${segment === 'root' ? '' : segment}.`
    }
    return `${extLabel(filePath)} сегмента ${parts[1] || 'root'}: ${clean}.`
  }
  return `${extLabel(filePath)} ${clean}.`
}

function dependencyNote(filePath, deps, reverseDeps) {
  const outgoing = deps.get(filePath) || []
  const incoming = reverseDeps.get(filePath) || []

  if (!outgoing.length && !incoming.length) {
    return 'Связи: явных локальных модульных связей не обнаружено или файл используется инфраструктурой/рантаймом.'
  }

  const parts = []
  if (outgoing.length) parts.push(`импортирует ${outgoing.slice(0, 4).join(', ')}`)
  if (incoming.length) parts.push(`используется в ${incoming.slice(0, 4).join(', ')}`)
  return `Связи: ${parts.join('; ')}.`
}

function buildStats(files) {
  const map = new Map()
  for (const file of files) {
    const top = file.split('/')[0]
    map.set(top, (map.get(top) || 0) + 1)
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru', { sensitivity: 'base', numeric: true }))
}

function buildTree(files) {
  const root = { dirs: new Map(), files: [] }
  for (const file of files) {
    const parts = file.split('/')
    let node = root
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      if (isFile) node.files.push(file)
      else {
        if (!node.dirs.has(part)) node.dirs.set(part, { path: parts.slice(0, i + 1).join('/'), dirs: new Map(), files: [] })
        node = node.dirs.get(part)
      }
    }
  }
  return root
}

function renderTree(node, deps, reverseDeps, lines, depth = 0) {
  const indent = '  '.repeat(depth)
  const dirEntries = Array.from(node.dirs.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru', { sensitivity: 'base', numeric: true }))
  const files = node.files.slice().sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true }))

  for (const [name, child] of dirEntries) {
    lines.push(`${indent}- ${name}/ — ${capitalize(describeDir(child.path))}`)
    renderTree(child, deps, reverseDeps, lines, depth + 1)
  }

  for (const file of files) {
    const base = path.posix.basename(file)
    const description = describeFile(file)
    const links = dependencyNote(file, deps, reverseDeps)
    lines.push(`${indent}- ${base} — ${capitalize(description)} ${links}`)
  }
}

function capitalize(text) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function main() {
  const files = readRepoFiles()
  const fileSet = buildFileSet(files)
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
    reverseDeps.set(key, value.sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true })))
  }

  const stats = buildStats(files)
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
  lines.push('')
  lines.push('- `.git/` — служебные внутренние данные Git, не часть прикладного дерева проекта.')
  lines.push('- `.next/` — генерируемые артефакты Next.js сборки.')
  lines.push('- `node_modules/` — внешние зависимости менеджера пакетов, не авторский код репозитория.')
  lines.push('')
  lines.push('## Охват')
  lines.push('')
  lines.push('Этот файл описывает весь авторский репозиторий проекта, а не только форумный домен.')
  lines.push('Включены все прикладные страницы, layouts, API-маршруты, клиентские компоненты, серверные и инфраструктурные модули, public-ассеты, audit-артефакты и корневые конфиги.')
  lines.push('')
  for (const [name, count] of stats) {
    lines.push(`- \`${name}\` — ${count} файлов`)
  }

  lines.push('')
  lines.push('## Дерево проекта')
  lines.push('')
  const tree = buildTree(files)
  renderTree(tree, deps, reverseDeps, lines)

  fs.writeFileSync(outputPath, `\uFEFF${lines.join('\n')}\n`, 'utf8')
  process.stdout.write(`Written ${path.basename(outputPath)}.\n`)
}

main()
