#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const repoRoot = process.cwd()
const outputPath = path.join(repoRoot, 'PROJECT_OWNERSHIP.md')

function rel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/')
}

function listFiles(dir, exts = null) {
  if (!fs.existsSync(dir)) return []
  const out = []
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const abs = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(abs)
      } else if (entry.isFile()) {
        if (!exts || exts.includes(path.extname(entry.name).toLowerCase())) out.push(rel(abs))
      }
    }
  }
  walk(dir)
  return out.sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true }))
}

function topDirs(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true }))
}

function mdLinesForOwnership(title, ownerPath, responsibility, entryFiles, relatedPaths, notes = []) {
  const lines = []
  lines.push(`### ${title}`)
  lines.push('')
  lines.push(`- Зона: \`${ownerPath}\``)
  lines.push(`- Назначение: ${responsibility}`)
  lines.push(`- Точки входа: ${entryFiles.length ? entryFiles.map((v) => `\`${v}\``).join(', ') : 'нет явных root-entry файлов'}`)
  lines.push(`- Связанные зоны: ${relatedPaths.length ? relatedPaths.map((v) => `\`${v}\``).join(', ') : 'нет явных связей верхнего уровня'}`)
  if (notes.length) {
    lines.push(`- Примечания: ${notes.join(' ')}`)
  }
  lines.push('')
  return lines
}

function main() {
  const lines = []

  const appDirs = topDirs(path.join(repoRoot, 'app'))
  const apiDirs = topDirs(path.join(repoRoot, 'app', 'api'))
  const forumFeatureDirs = topDirs(path.join(repoRoot, 'app', 'forum', 'features'))
  const publicDirs = topDirs(path.join(repoRoot, 'public'))
  const componentFiles = listFiles(path.join(repoRoot, 'components'), ['.js', '.jsx'])
  const libFiles = listFiles(path.join(repoRoot, 'lib'), ['.js', '.jsx', '.mjs'])
  const toolFiles = listFiles(path.join(repoRoot, 'tools'), ['.js', '.mjs', '.ps1'])

  lines.push('# PROJECT_OWNERSHIP.md')
  lines.push('')
  lines.push('> Обязательное правило сопровождения:')
  lines.push('> Если меняется граница ответственности каталогов, появляются новые домены, переносятся модули между зонами или меняются entry points, этот файл обязан быть обновлен.')
  lines.push('> Рекомендуемый способ обновления: `node tools/generate-project-ownership.js`.')
  lines.push('')
  lines.push(`Сгенерировано автоматически: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('## Общий Принцип')
  lines.push('')
  lines.push('- `app/` владеет страницами, layout-слоем и серверными route handlers.')
  lines.push('- `app/api/` владеет backend/API-контуром.')
  lines.push('- `components/` владеет truly shared UI вне одного домена.')
  lines.push('- `lib/` владеет общей инфраструктурой и серверно-клиентскими библиотеками.')
  lines.push('- `app/forum/` владеет форумом, DM, media, qcoin, quests и их feature-oriented слоями.')
  lines.push('- `public/` владеет статическими ассетами.')
  lines.push('- `tools/` и `audit/` владеют аудитом, диагностикой и техобслуживанием.')
  lines.push('')

  lines.push('## App Ownership')
  lines.push('')
  for (const dir of appDirs.filter((v) => v !== 'api')) {
    const ownerPath = `app/${dir}`
    const entryFiles = listFiles(path.join(repoRoot, ownerPath), ['.js', '.jsx']).filter((file) => /\/(page|layout|loading|not-found|default)\./.test(file))
    let responsibility = ''
    if (dir === 'forum') responsibility = 'Форум, мессенджер, темы, посты, медиа, профиль, VIP, QCoin, quests и связанный экранный runtime.'
    else if (dir === 'ads') responsibility = 'Рекламный контур, рекламные страницы и связанный UI.'
    else if (dir === 'academy') responsibility = 'Академия, экзамены и образовательный UI.'
    else if (dir === 'exchange') responsibility = 'Exchange-раздел и связанный интерфейс обмена.'
    else if (dir === 'game') responsibility = 'Игровой раздел и его route-layer.'
    else if (dir === 'subscribe') responsibility = 'Подписочный/лендинговый контур.'
    else if (dir === 'tma') responsibility = 'TMA/Telegram Mini App страницы.'
    else if (dir === 'about' || dir === 'contact' || dir === 'privacy') responsibility = `Контентный раздел ${dir}.`
    else if (dir === 'components') responsibility = 'Локальные app-level компоненты.'
    else responsibility = `Route/domain слой сегмента ${dir}.`

    const related = dir === 'forum'
      ? ['app/forum/features', 'app/forum/shared', 'app/api/forum', 'app/api/dm', 'components', 'lib', 'public']
      : ['components', 'lib', 'public', 'app/api']

    lines.push(...mdLinesForOwnership(dir, ownerPath, responsibility, entryFiles.slice(0, 8), related))
  }

  lines.push('## API Ownership')
  lines.push('')
  for (const dir of apiDirs) {
    const ownerPath = `app/api/${dir}`
    const routeFiles = listFiles(path.join(repoRoot, ownerPath), ['.js', '.jsx']).filter((file) => /\/route\./.test(file))
    let responsibility = ''
    if (dir === 'forum') responsibility = 'Серверный контур форума: snapshot, mutate, report, moderation, uploads, subs, vip, stream.'
    else if (dir === 'dm') responsibility = 'Серверный контур личных сообщений: dialogs, thread, send, delete, seen, block.'
    else if (dir === 'profile') responsibility = 'Профиль, about, nick, avatar и batch-профили.'
    else if (dir === 'qcoin') responsibility = 'QCoin backend: balance, heartbeat, drop.'
    else if (dir === 'quest') responsibility = 'Серверный контур квестов.'
    else if (dir === 'pay' || dir === 'payments') responsibility = 'Платежный backend и webhook-и.'
    else if (dir === 'telegram' || dir === 'tma') responsibility = 'Интеграция Telegram/TMA.'
    else if (dir === 'ads') responsibility = 'API рекламы.'
    else if (dir === 'academy') responsibility = 'API академии.'
    else responsibility = `API-домен ${dir}.`

    const related = dir === 'forum'
      ? ['app/forum', 'lib', 'public', 'app/api/profile']
      : dir === 'dm'
        ? ['app/forum/features/dm', 'app/forum', 'app/api/profile', 'lib']
        : ['app', 'components', 'lib']

    lines.push(...mdLinesForOwnership(`API: ${dir}`, ownerPath, responsibility, routeFiles.slice(0, 10), related))
  }

  lines.push('## Forum Ownership')
  lines.push('')
  lines.push(...mdLinesForOwnership(
    'Forum Root',
    'app/forum',
    'Корневой composition, layout, styles и orchestration всего форума.',
    [
      'app/forum/Forum.jsx',
      'app/forum/ForumRoot.jsx',
      'app/forum/ForumHeaderPanel.jsx',
      'app/forum/layout.js',
      'app/forum/page.js',
    ],
    ['app/forum/features', 'app/forum/shared', 'app/api/forum', 'app/api/dm', 'lib', 'public'],
    ['Это главная интеграционная зона между UI, данными, API и shared-слоем форума.']
  ))

  for (const feature of forumFeatureDirs) {
    const ownerPath = `app/forum/features/${feature}`
    const entryFiles = listFiles(path.join(repoRoot, ownerPath), ['.js', '.jsx']).slice(0, 10)
    const responsibilityMap = {
      feed: 'Лента, темы, посты, replies, сортировки, composer и data runtime ленты.',
      media: 'Видео, аудио, embeds, lifecycle плееров, preview и trim/upload runtime.',
      dm: 'Quantum Messenger, диалоги, треды, cache, delete/block/seen и DM UI.',
      moderation: 'Жалобы, admin actions, media lock и moderation UI/logic.',
      profile: 'Профиль, avatar, about, VIP, popovers и profile sync.',
      qcoin: 'QCoin UI в форуме и клиентская логика баланса.',
      quests: 'Квесты, claim-flow, quest runtime и UI.',
      subscriptions: 'Подписки и social graph inside forum.',
      diagnostics: 'Perf/diag hooks и вспомогательные debug-механизмы.',
      ui: 'Общие UI-узлы форума, prop bundles и shell runtime-хуки.',
    }
    const related = []
    if (feature === 'feed') related.push('app/api/forum', 'app/forum/features/media', 'app/forum/features/profile', 'app/forum/shared')
    else if (feature === 'dm') related.push('app/api/dm', 'app/api/profile', 'app/forum/features/profile', 'app/forum/shared')
    else if (feature === 'profile') related.push('app/api/profile', 'app/forum/features/qcoin', 'app/forum/features/subscriptions', 'app/forum/shared')
    else if (feature === 'qcoin') related.push('app/api/qcoin', 'app/forum/features/profile', 'app/forum/shared')
    else if (feature === 'quests') related.push('app/api/quest', 'app/forum/features/qcoin', 'app/forum/shared')
    else if (feature === 'moderation') related.push('app/api/forum/report', 'app/api/forum/admin', 'app/forum/features/media', 'app/forum/shared')
    else related.push('app/forum/shared', 'app/api/forum', 'app/forum')

    lines.push(...mdLinesForOwnership(`Forum feature: ${feature}`, ownerPath, responsibilityMap[feature] || `Фича ${feature} внутри форума.`, entryFiles, related))
  }

  lines.push('## Shared Layers')
  lines.push('')
  lines.push(...mdLinesForOwnership(
    'Global Components',
    'components',
    'Переиспользуемые UI-компоненты и провайдеры верхнего уровня вне одного домена.',
    componentFiles.slice(0, 12),
    ['app', 'app/forum', 'lib', 'public'],
    ['Сюда входят i18n, wallet-хабы, top bar, визуальные FX и общие клиентские виджеты.']
  ))
  lines.push(...mdLinesForOwnership(
    'Infrastructure Libraries',
    'lib',
    'Глобальные библиотеки проекта: metadata, geo, subscriptions, forum-share, trim, redis, tma и бизнес-хелперы.',
    libFiles,
    ['app', 'app/api', 'components', 'app/forum'],
    ['Это не UI-слой; здесь должна жить инфраструктура и общая прикладная логика.']
  ))

  lines.push('## Static Assets Ownership')
  lines.push('')
  for (const dir of publicDirs) {
    lines.push(...mdLinesForOwnership(
      `public/${dir}`,
      `public/${dir}`,
      `Статические ассеты namespace ${dir}.`,
      listFiles(path.join(repoRoot, 'public', dir)).slice(0, 6),
      ['app', 'components', 'app/forum', 'styles/public URLs']
    ))
  }

  lines.push('## Tooling And Audit Ownership')
  lines.push('')
  lines.push(...mdLinesForOwnership(
    'Audit Artifacts',
    'audit',
    'JSON-артефакты проверок, фаз миграции и технических отчетов.',
    listFiles(path.join(repoRoot, 'audit'), ['.json']).slice(0, 12),
    ['tools', 'app/forum', 'app/api', 'manual verification']
  ))
  lines.push(...mdLinesForOwnership(
    'Tools',
    'tools',
    'Локальные генераторы и аудит-скрипты проекта.',
    toolFiles,
    ['audit', 'app', 'app/forum', 'app/api', 'components', 'lib']
  ))

  fs.writeFileSync(outputPath, `\uFEFF${lines.join('\n')}`, 'utf8')
  process.stdout.write(`Written ${path.basename(outputPath)}.\n`)
}

main()
