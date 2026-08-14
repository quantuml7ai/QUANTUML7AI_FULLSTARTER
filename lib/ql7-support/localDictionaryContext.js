import crypto from 'node:crypto'
import en from '../../components/i18n-dicts/en.js'
import ru from '../../components/i18n-dicts/ru.js'
import uk from '../../components/i18n-dicts/uk.js'
import es from '../../components/i18n-dicts/es.js'
import tr from '../../components/i18n-dicts/tr.js'
import ar from '../../components/i18n-dicts/ar.js'
import zh from '../../components/i18n-dicts/zh.js'
import { normalizeQl7SupportLocale } from './adultLanguagePolicy.js'
import { buildQl7SupportDomainPlan, normalizeQl7SupportTopic } from './ecosystemCatalog.js'

const DICTS = Object.freeze({ en, ru, uk, es, tr, ar, zh })

const TOPIC_PREFIXES = Object.freeze({
  platform: ['hero_', 'about_', 'ecosystem_', 'qa_meta_'],
  homepage: ['hero_', 'home_', 'radar_', 'marquee', 'feature_'],
  news: ['news_', 'crypto_news'],
  exchange: ['exchange_', 'quantum_wallet_action_exchange'],
  exchange_ai: ['exchange_ai', 'ai_', 'qa_ai'],
  battlecoin: ['battlecoin_', 'battle_coin', 'battle_'],
  battle_chat: ['battle_chat', 'battle_'],
  futures: ['futures_', 'leverage_', 'liquidation_'],
  academy: ['academy_', 'course_', 'lesson_'],
  academy_exam: ['academy_exam', 'exam_', 'certificate_'],
  gameverse: ['game_', 'gameverse_', 'quantum_wallet_action_game'],
  metastudio: ['metastudio_', 'meta_studio', 'quantum_wallet_action_studio'],
  metaverse: ['metaverse_', 'quantum_universe', 'universe_'],
  forum_feed: ['forum_', 'feed_', 'post_'],
  forum_threads: ['thread_', 'comment_', 'reply_'],
  search: ['search_', 'filter_'],
  geodetect: ['geo_', 'country_', 'region_'],
  media: ['media_', 'image_', 'video_', 'audio_'],
  moderation: ['moderation_', 'report_', 'violation_', 'ban_', 'blocked_'],
  metamarket: ['metamarket_', 'quantum_wallet_action_meta'],
  quantum_family: ['quantum_family', 'family_'],
  profile: ['profile_', 'user_profile'],
  auth: ['auth_', 'login_', 'signup_', 'telegram_login'],
  wallet: ['quantum_wallet_', 'wallet_'],
  telegram: ['telegram_', 'miniapp_', 'mini_app'],
  qcoin: ['qcoin_', 'quantum_wallet_balance', 'quantum_wallet_topup', 'quantum_wallet_action_quest'],
  payments: ['payment_', 'invoice_', 'checkout_', 'nowpayments', 'topup_'],
  vip: ['vip_', 'premium_', 'sub_'],
  ads_packages: ['ads_package', 'ad_package', 'ads_'],
  ads_campaigns: ['ads_campaign', 'campaign_', 'ads_'],
  push: ['push_', 'notification_'],
  messenger: ['dm_', 'messenger_', 'chat_'],
  quests: ['quest_', 'quantum_wallet_action_quest'],
  contact: ['contact_'],
  privacy: ['privacy_', 'cookie_', 'gdpr_'],
  security: ['security_', 'safe_', 'abuse_', 'anti_spam'],
  account_deletion: ['account_deletion', 'delete_account', 'privacy_delete'],
  navigation: ['nav_', 'menu_', 'footer_'],
  roadmap: ['roadmap_', 'coming_soon', 'future_'],
  system_status: ['status_', 'maintenance_', 'runtime_'],
  localization: ['language_', 'locale_', 'i18n_', 'translation_'],
  accessibility: ['accessibility_', 'aria_'],
  support_system: ['support_', 'ql7_support_', 'contact_'],
})

const STOPWORDS = Object.freeze(new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'into', 'from', 'will', 'your', 'you', 'are', 'not', 'just',
  'это', 'как', 'для', 'что', 'или', 'они', 'она', 'его', 'при', 'через', 'будет', 'может', 'если',
  'це', 'для', 'або', 'вони', 'буде', 'може', 'якщо',
  'una', 'para', 'con', 'que', 'por', 'los', 'las', 'del', 'como',
  'bir', 'ile', 'için', 'olan', 'gibi',
]))

const CAPABILITY_PATTERNS = Object.freeze([
  ['wallet_balance', /(?:wallet|balance|qcoin|кошел|баланс|гаманець|saldo|bakiye|رصيد|钱包|余额)/iu],
  ['payments', /(?:payment|invoice|top\s*up|checkout|pay|оплат|инвойс|пополн|плат|pago|factura|دفع|فاتورة|支付)/iu],
  ['ads_metrics', /(?:ads|campaign|impression|click|ctr|реклам|кампан|показ|клик|anuncio|campaña|إعلان|广告)/iu],
  ['profile_progress', /(?:profile|account|progress|rank|reputation|профил|аккаунт|прогресс|репутац|perfil|ملف|个人资料)/iu],
  ['chart_view', /(?:chart|candle|график|свеч[аеи]|gráfico|grafik|شمعة|图表|גרף)/iu],
  ['volume_liquidity', /(?:volume|liquidity|объ[её]м|ликвидност|volumen|hacim|سيولة|حجم|成交量|נזילות)/iu],
  ['order_book_depth', /(?:order\s*book|depth|стакан|заявк|libro\s+de\s+órdenes|emir\s+defteri|دفتر\s+الأوامر|订单簿|ספר\s+פקודות)/iu],
  ['market_analytics', /(?:exchange|market|chart|order\s*book|trading|бирж|рынок|график|mercado|السوق|交易)/iu],
  ['gameplay', /(?:game|quest|mission|achievement|loot|player|игр|квест|мисси|достижен|juego|مهمة|游戏|任务)/iu],
  ['digital_assets', /(?:metamarket|asset|nft|collection|item|ownership|актив|коллекц|предмет|propiedad|أصل|资产)/iu],
  ['privacy_security', /(?:privacy|security|cookie|abuse|violation|moderation|конфиденц|безопас|жалоб|наруш|privacidad|أمان|隐私)/iu],
  ['contact_team', /(?:contact|email|partner|investor|collaboration|связ|почт|партн|инвест|contacto|بريد|联系)/iu],
  ['roadmap', /(?:roadmap|launch|coming\s*soon|future|release|запуск|релиз|будущ|дорож|lanzamiento|خارطة|上线)/iu],
])

const REALIZER = Object.freeze({
  en: {
    leads: ['In Quantum L7 AI, this section is responsible for', 'Inside the ecosystem, this area carries', 'This QL7 direction is about'],
    middle: ['In practice, it connects', 'For a user, the useful layer is', 'Its working meaning is'],
    boundary: ['I will not invent a launch date; only confirmed runtime or roadmap evidence should be treated as a date.'],
    ask: ['For an exact account status I use the current verified session and aliases; no separate ID is needed from you.'],
  },
  ru: {
    leads: ['В Quantum L7 AI этот раздел отвечает за', 'Внутри экосистемы это направление помогает с', 'Это направление QL7 связано с'],
    middle: ['Практически он связывает', 'Для пользователя полезный слой здесь такой', 'Рабочий смысл раздела'],
    boundary: ['Дату запуска я не выдумываю: сроком можно считать только подтверждённый runtime или roadmap-факт.'],
    ask: ['Для точного статуса достаточно вашего подтверждённого входа и известных алиасов; отдельный ID от вас не нужен.'],
  },
  uk: {
    leads: ['У Quantum L7 AI цей розділ відповідає за', 'Усередині екосистеми цей напрям допомагає з', 'Цей напрям QL7 пов’язаний із'],
    middle: ['Практично він поєднує', 'Для користувача корисний шар тут такий', 'Робочий зміст розділу'],
    boundary: ['Дату запуску я не вигадую: строком можна вважати лише підтверджений runtime або roadmap-факт.'],
    ask: ['Для точного статусу достатньо вашого підтвердженого входу та alias; окремий ID від вас не потрібен.'],
  },
  es: {
    leads: ['En Quantum L7 AI, esta sección se encarga de', 'Dentro del ecosistema, esta área sostiene', 'Esta dirección de QL7 trata de'],
    middle: ['En la práctica conecta', 'Para el usuario, la capa útil es', 'El sentido operativo de la sección es'],
    boundary: ['No invento una fecha de lanzamiento: solo cuenta una evidencia confirmada de runtime o roadmap.'],
    ask: ['Para un estado exacto de tu cuenta reviso la sesión verificada y los alias; no te pido el ID.'],
  },
  tr: {
    leads: ['Quantum L7 AI içinde bu bölüm', 'Ekosistem içinde bu alan', 'Bu QL7 yönü'],
    middle: ['Pratikte şunları birbirine bağlar', 'Kullanıcı için faydalı katman', 'Bölümün çalışma anlamı'],
    boundary: ['Lansman tarihi uydurmam; tarih yalnızca doğrulanmış runtime veya roadmap kanıtıyla kabul edilir.'],
    ask: ['Hesabınızın kesin durumu için ID istemem; doğrulanmış oturumu ve aliasları kontrol ederim.'],
  },
  ar: {
    leads: ['في Quantum L7 AI هذا القسم مسؤول عن', 'داخل المنظومة يحمل هذا المسار', 'هذا اتجاه QL7 يدور حول'],
    middle: ['عملياً يربط بين', 'الطبقة المفيدة للمستخدم هنا هي', 'المعنى التشغيلي للقسم هو'],
    boundary: ['لا أختلق موعد إطلاق؛ التاريخ لا يُعد مؤكداً إلا بدليل runtime أو roadmap موثوق.'],
    ask: ['للحالة الدقيقة لحسابك أفحص الجلسة الموثقة والأسماء البديلة، ولا أطلب منك ID.'],
  },
  zh: {
    leads: ['在 Quantum L7 AI 中，这个页面负责', '在生态系统内部，这个区域承载', '这个 QL7 方向关注'],
    middle: ['实际使用中，它把这些部分连接起来', '对用户来说，最有用的层面是', '这个部分的工作含义是'],
    boundary: ['我不会编造上线日期；只有已确认的 runtime 或 roadmap 证据才能当作时间依据。'],
    ask: ['如果要查你的准确账户状态，我会读取已验证会话和别名，不会向你索要 ID。'],
  },
})

function str(value) { return String(value ?? '').trim() }
function normalizeLocale(value = '') {
  const lang = normalizeQl7SupportLocale(value)
  return DICTS[lang] ? lang : 'en'
}
function pick(list = [], seed = '') {
  if (!Array.isArray(list) || !list.length) return ''
  const raw = crypto.createHash('sha256').update(str(seed) || `${Date.now()}:${Math.random()}`).digest('hex')
  return list[Number.parseInt(raw.slice(0, 8), 16) % list.length]
}
function cleanText(value = '') {
  return str(value)
    .replace(/https?:\/\/\S+/giu, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, ' ')
    .replace(/[*_`#>~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
function flatten(value, key = '', out = []) {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = cleanText(value)
    if (text) out.push({ key, text })
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${key}.${index}`, out))
    return out
  }
  if (value && typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) flatten(childValue, key ? `${key}.${childKey}` : childKey, out)
  }
  return out
}
function prefixesFor(topic = '') {
  const normalized = normalizeQl7SupportTopic(topic)
  const base = TOPIC_PREFIXES[normalized] || []
  return [...new Set([normalized, normalized.replace(/_/g, ''), ...base].filter(Boolean).map((item) => item.toLowerCase()))]
}
function scoreEntry(entry, prefixes = [], topic = '') {
  const key = str(entry.key).toLowerCase()
  const text = str(entry.text)
  let score = 0
  for (const prefix of prefixes) {
    if (key.startsWith(prefix)) score += 40
    else if (key.includes(prefix)) score += 16
  }
  if (key.includes(str(topic).replace(/_/g, ''))) score += 18
  if (/(?:title|subtitle|sub|description|desc|info|overview|about|hero|p\d+|section|faq|question|answer)/iu.test(key)) score += 14
  if (text.length >= 24 && text.length <= 900) score += 8
  if (text.length > 900) score += 3
  if (/^(?:close|cancel|ok|yes|no|back|next|send)$/iu.test(text)) score -= 40
  return score
}
function relevantEntries(dict = {}, topic = '', limit = 18) {
  const normalized = normalizeQl7SupportTopic(topic)
  const prefixes = prefixesFor(normalized)
  return flatten(dict)
    .map((entry) => ({ ...entry, score: scoreEntry(entry, prefixes, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
    .slice(0, limit)
}
function extractTerms(text = '', limit = 12) {
  const terms = new Map()
  const source = cleanText(text)
  for (const match of source.matchAll(/\b(?:Quantum\s+L7\s+AI|QL7\s+AI\s+GameVerse|GameVerse|QCoin|MetaMarket|MetaStudio|CryptoRadar|BattleCoin|Battle\s+Chat|Telegram|Wallet|Exchange|VIP|AI|NFT|DeFi|DAO|L7\s+Blockchain|Web3|multi-chain|cross-chain)\b/giu)) {
    const term = match[0].replace(/\s+/g, ' ').trim()
    terms.set(term, (terms.get(term) || 0) + 4)
  }
  for (const match of source.matchAll(/[\p{L}\p{N}][\p{L}\p{N}-]{4,}/gu)) {
    const word = match[0].toLowerCase()
    if (STOPWORDS.has(word) || /^\d+$/.test(word)) continue
    terms.set(match[0], (terms.get(match[0]) || 0) + 1)
  }
  return [...terms.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([term]) => term)
    .slice(0, limit)
}
function extractCapabilities(text = '') {
  const out = []
  for (const [code, pattern] of CAPABILITY_PATTERNS) {
    if (pattern.test(text)) out.push(code)
  }
  return out
}
function prioritizeCapabilities(capabilities = [], topic = '') {
  const priority = {
    exchange: ['chart_view', 'volume_liquidity', 'order_book_depth', 'market_analytics'],
    exchange_ai: ['chart_view', 'volume_liquidity', 'order_book_depth', 'market_analytics'],
    qcoin: ['wallet_balance', 'payments'],
    wallet: ['wallet_balance', 'payments', 'digital_assets'],
    payments: ['payments', 'wallet_balance'],
    ads_campaigns: ['ads_metrics', 'profile_progress'],
    ads_packages: ['ads_metrics', 'payments'],
    gameverse: ['gameplay', 'digital_assets', 'wallet_balance', 'roadmap'],
    metamarket: ['digital_assets', 'payments', 'gameplay'],
    privacy: ['privacy_security'],
    security: ['privacy_security'],
    moderation: ['privacy_security', 'profile_progress'],
    contact: ['contact_team', 'privacy_security'],
  }[normalizeQl7SupportTopic(topic)] || []
  const seen = new Set()
  const ordered = []
  for (const code of [...priority, ...capabilities]) {
    if (!capabilities.includes(code) || seen.has(code)) continue
    seen.add(code)
    ordered.push(code)
  }
  return ordered
}
function labelCapability(code = '', locale = 'en') {
  const labels = {
    wallet_balance: { en: 'wallet state and balance', ru: 'состояние кошелька и баланс', uk: 'стан гаманця і баланс', es: 'estado de wallet y saldo', tr: 'cüzdan durumu ve bakiye', ar: 'حالة المحفظة والرصيد', zh: '钱包状态与余额' },
    payments: { en: 'payments and invoices', ru: 'платежи и invoice', uk: 'платежі та invoice', es: 'pagos y facturas', tr: 'ödemeler ve faturalar', ar: 'المدفوعات والفواتير', zh: '支付与账单' },
    ads_metrics: { en: 'advertising metrics', ru: 'рекламные метрики', uk: 'рекламні метрики', es: 'métricas publicitarias', tr: 'reklam metrikleri', ar: 'مقاييس الإعلانات', zh: '广告指标' },
    profile_progress: { en: 'profile progress and reputation', ru: 'развитие профиля и репутацию', uk: 'розвиток профілю та репутацію', es: 'progreso del perfil y reputación', tr: 'profil ilerlemesi ve itibar', ar: 'تقدم الملف والسمعة', zh: '个人资料进度与声誉' },
    chart_view: { en: 'chart and candle context', ru: 'график и свечной контекст', uk: 'графік і свічковий контекст', es: 'gráfico y contexto de velas', tr: 'grafik ve mum bağlamı', ar: 'الرسم البياني وسياق الشموع', zh: '图表与K线语境' },
    volume_liquidity: { en: 'volume and liquidity', ru: 'объём и ликвидность', uk: 'обсяг і ліквідність', es: 'volumen y liquidez', tr: 'hacim ve likidite', ar: 'الحجم والسيولة', zh: '成交量与流动性' },
    order_book_depth: { en: 'order book depth', ru: 'стакан заявок', uk: 'глибину книги заявок', es: 'profundidad del libro de órdenes', tr: 'emir defteri derinliği', ar: 'عمق دفتر الأوامر', zh: '订单簿深度' },
    market_analytics: { en: 'market analytics', ru: 'рыночную аналитику', uk: 'ринкову аналітику', es: 'analítica de mercado', tr: 'piyasa analitiği', ar: 'تحليلات السوق', zh: '市场分析' },
    gameplay: { en: 'gameplay, quests and rewards', ru: 'игровой опыт, квесты и награды', uk: 'ігровий досвід, квести й нагороди', es: 'juego, misiones y recompensas', tr: 'oynanış, görevler ve ödüller', ar: 'اللعب والمهام والمكافآت', zh: '玩法、任务与奖励' },
    digital_assets: { en: 'digital assets and ownership', ru: 'цифровые активы и владение', uk: 'цифрові активи та володіння', es: 'activos digitales y propiedad', tr: 'dijital varlıklar ve sahiplik', ar: 'الأصول الرقمية والملكية', zh: '数字资产与所有权' },
    privacy_security: { en: 'privacy, safety and rules', ru: 'приватность, безопасность и правила', uk: 'приватність, безпеку й правила', es: 'privacidad, seguridad y reglas', tr: 'gizlilik, güvenlik ve kurallar', ar: 'الخصوصية والأمان والقواعد', zh: '隐私、安全与规则' },
    contact_team: { en: 'contact with the team', ru: 'связь с командой', uk: 'зв’язок із командою', es: 'contacto con el equipo', tr: 'ekiple iletişim', ar: 'التواصل مع الفريق', zh: '与团队联系' },
    roadmap: { en: 'future roadmap boundaries', ru: 'границы будущей дорожной карты', uk: 'межі майбутньої дорожньої карти', es: 'límites de la hoja de ruta futura', tr: 'gelecek yol haritası sınırları', ar: 'حدود خارطة الطريق المستقبلية', zh: '未来路线图边界' },
  }
  return labels[code]?.[locale] || labels[code]?.en || code.replace(/_/g, ' ')
}
function joinList(items = [], locale = 'en') {
  const list = items.filter(Boolean)
  if (!list.length) return ''
  if (list.length === 1) return list[0]
  const conj = ({ ru: ' и ', uk: ' і ', es: ' y ', tr: ' ve ', ar: ' و', zh: '、' }[locale] || ' and ')
  return `${list.slice(0, -1).join(', ')}${conj}${list.at(-1)}`
}

export function buildQl7LocalDictionaryContext({ topic = 'support_system', locale = 'en', limit = 18 } = {}) {
  const normalizedTopic = normalizeQl7SupportTopic(topic)
  const requestedLocale = normalizeQl7SupportLocale(locale)
  const sourceLocale = normalizeLocale(requestedLocale)
  const dict = DICTS[sourceLocale] || DICTS.en
  const entries = relevantEntries(dict, normalizedTopic, limit)
  const fallbackEntries = sourceLocale === 'en' ? [] : relevantEntries(DICTS.en, normalizedTopic, Math.max(6, Math.ceil(limit / 3)))
  const merged = [...entries, ...fallbackEntries.filter((item) => !entries.some((entry) => entry.key === item.key))]
  const corpus = merged.map((entry) => entry.text).join(' ')
  const plan = buildQl7SupportDomainPlan({ analysis: { topic: normalizedTopic }, locale: requestedLocale })
  const capabilities = prioritizeCapabilities(extractCapabilities(corpus), normalizedTopic)
  const terms = extractTerms(`${plan.label} ${plan.scope} ${corpus}`, 14)
  const evidenceDigest = crypto.createHash('sha256').update(JSON.stringify(merged.map(({ key, text }) => [key, text.slice(0, 240)]))).digest('hex')
  return Object.freeze({
    ok: merged.length > 0 || !!plan.scope,
    source: 'local_i18n_dictionary',
    topic: normalizedTopic,
    locale: requestedLocale,
    sourceLocale,
    label: plan.label,
    scope: plan.scope,
    keyCount: merged.length,
    keys: Object.freeze(merged.map((entry) => entry.key).slice(0, limit)),
    terms: Object.freeze(terms),
    capabilities: Object.freeze(capabilities),
    evidenceDigest,
    translationNeeded: sourceLocale !== requestedLocale,
  })
}

export function realizeQl7LocalDictionaryAnswer({
  topic = 'support_system',
  intent = 'overview',
  locale = 'en',
  seed = '',
  context = null,
} = {}) {
  const lang = normalizeQl7SupportLocale(locale)
  const copy = REALIZER[lang] || REALIZER.en
  const ctx = context || buildQl7LocalDictionaryContext({ topic, locale: lang })
  const capabilityLabels = (ctx.capabilities || []).map((code) => labelCapability(code, lang)).slice(0, 5)
  const termLabels = (ctx.terms || []).slice(0, 7)
  const lead = pick(copy.leads, `${seed}:lead:${ctx.evidenceDigest}`)
  const middle = pick(copy.middle, `${seed}:middle:${ctx.evidenceDigest}`)
  const mainList = joinList(capabilityLabels.length ? capabilityLabels : termLabels, lang)
  const termList = joinList(termLabels.slice(0, 6), lang)
  const wantsLaunch = ['when_question', 'roadmap_question'].includes(str(intent)) || (ctx.capabilities || []).includes('roadmap')
  const wantsStatus = ['personal_status_request', 'status_followup'].includes(str(intent))
  const parts = [
    `${lead} ${ctx.label}: ${mainList || ctx.scope}.`,
    termList ? `${middle} ${termList}.` : '',
    wantsLaunch ? copy.boundary : '',
    wantsStatus ? copy.ask : '',
  ].filter(Boolean)
  return Object.freeze({
    text: parts.join(' '),
    paragraphs: Object.freeze(parts),
    context: ctx,
  })
}

export function auditQl7LocalDictionaryContext() {
  const result = {}
  for (const topic of Object.keys(TOPIC_PREFIXES)) {
    const ctx = buildQl7LocalDictionaryContext({ topic, locale: 'en' })
    result[topic] = { ok: ctx.ok, keyCount: ctx.keyCount, sourceLocale: ctx.sourceLocale, evidenceDigest: ctx.evidenceDigest }
  }
  const missing = Object.entries(result).filter(([, value]) => value.ok !== true).map(([topic]) => topic)
  return Object.freeze({ ok: missing.length === 0, topics: Object.keys(result).length, missing: Object.freeze(missing), result: Object.freeze(result) })
}

export const QL7_SUPPORT_LOCAL_DICTIONARY_TOPIC_PREFIXES_V9 = TOPIC_PREFIXES
