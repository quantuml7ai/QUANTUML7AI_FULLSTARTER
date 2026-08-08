import crypto from 'node:crypto'
import {
  buildQl7SupportDomainPlan,
  classifyQl7SupportCatalogSubIntent,
  classifyQl7SupportCatalogTopic,
  getQl7SupportTopicLabel,
  normalizeQl7SupportTopic,
} from './ecosystemCatalog.js'
import {
  composeQl7SupportControlReply,
  composeQl7SupportSemanticReply,
} from './speechEngine.js'
import { buildQl7SupportPremiumResponsePlan } from './responsePlan.js'

export const QL7_SUPPORT_CASE_COLLECTION = 'ql7_support_cases'

export const QL7_SUPPORT_CASE_STATUSES = Object.freeze([
  'opened',
  'awaiting_user',
  'collecting_context',
  'ready_for_diagnostic',
  'diagnosing',
  'diagnostic_completed',
  'healthy',
  'inconsistent',
  'partial',
  'awaiting_admin',
  'user_notified',
  'admin_notified',
  'resolved',
  'closed',
  'superseded',
])

export const QL7_SUPPORT_REPLY_ROLES = Object.freeze([
  'greeting',
  'informational_question',
  'problem_description',
  'answer_to_question',
  'correction',
  'confirmation',
  'denial',
  'additional_evidence',
  'status_request',
  'how_to_question',
  'why_question',
  'when_question',
  'appeal',
  'security_alert',
  'spam_or_noise',
  'gratitude',
  'conversation_close',
  'new_unrelated_issue',
])

const SUPPORTED_LANGS = Object.freeze(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'])
const DEFAULT_LANG = 'en'
const MAX_LAST_MESSAGES = 8
const MAX_REPLY_HISTORY = 16
const MAX_QUESTIONS = 3

function str(value) {
  return String(value ?? '').trim()
}

function lang(value) {
  const probe = str(value).toLowerCase().split(/[-_]/)[0]
  return SUPPORTED_LANGS.includes(probe) ? probe : DEFAULT_LANG
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex')
}

function shortHash(value) {
  return hash(value).slice(0, 16)
}

function uniq(list = []) {
  return Array.from(new Set((Array.isArray(list) ? list : []).map(str).filter(Boolean)))
}

function compact(value) {
  return str(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:./@#_-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textHas(source, pattern) {
  try { return pattern.test(source) } catch { return false }
}

function firstMatch(source, patterns = []) {
  for (const pattern of patterns) {
    const found = source.match(pattern)
    if (found?.[1]) return str(found[1])
  }
  return ''
}

function pickVariant(items = [], seed = '') {
  const list = Array.isArray(items) && items.length ? items : ['']
  const n = Number.parseInt(shortHash(seed || list.join('|')).slice(0, 8), 16)
  return list[n % list.length]
}

export function redactQl7SupportSecrets(text = '') {
  let out = str(text)
  const replacements = [
    [/\b(mongodb(?:\+srv)?:\/\/)[^\s]+/giu, '$1[redacted-mongo-uri]'],
    [/\b(redis:\/\/)[^\s]+/giu, '$1[redacted-redis-uri]'],
    [/\b(bearer)\s+[^\s,;]{3,}/giu, '$1 [redacted-token]'],
    [/\b(0x[a-f0-9]{64})\b/giu, '[secret-redacted]'],
    [/\b([a-z0-9+/]{32,}={0,2})\b/giu, (m) => (m.length >= 48 ? '[secret-redacted]' : m)],
    [/\b(seed phrase|mnemonic|private key|smtp_pass|redis token|mongo uri)\s*[:=]\s*[^\n\r]+/giu, '$1: [secret-redacted]'],
  ]
  for (const [pattern, replacement] of replacements) out = out.replace(pattern, replacement)
  return out
}

export function detectQl7SupportInputLanguage(text = '', selectedLocale = '') {
  const selected = lang(selectedLocale)
  const source = str(text)
  if (/[\u0590-\u05FF]/u.test(source)) return { selectedLocale: selected, detected: 'he', supported: false }
  if (/[\u0600-\u06FF]/u.test(source)) return { selectedLocale: selected, detected: 'ar', supported: true }
  if (/[\u4E00-\u9FFF]/u.test(source)) return { selectedLocale: selected, detected: 'zh', supported: true }
  if (/[іїєґІЇЄҐ]/u.test(source)) return { selectedLocale: selected, detected: 'uk', supported: true }
  if (/[а-яёА-ЯЁ]/u.test(source)) return { selectedLocale: selected, detected: 'ru', supported: true }
  return { selectedLocale: selected, detected: selected, supported: SUPPORTED_LANGS.includes(selected) }
}

const TOPIC_PATTERNS = Object.freeze([
  ['crypto_radar', /(crypto\s*radar|cryptoradar|радар|крипто\s*радар|крипторадар|сигнал|timeframe|таймфрейм|индикатор|indicator)/iu],
  ['battlecoin', /(battle\s*coin|battlecoin|битв[аы]\s*монет|баттл\s*коин|ордер|лонг|long|short|шорт|ставк|плеч|x100|истори[яи]\s*бат)/iu],
  ['battle_chat', /(battle\s*chat|баттл\s*чат|чат\s*битв|emoji|эмодзи|лайк|сообщени[ея]\s*в\s*чате)/iu],
  ['exchange', /(exchange|бирж|рынок|торг|откроется|открыти[ея]\s*бирж)/iu],
  ['metamarket', /(metamarket|meta\s*market|метамаркет|коллекц|подар|gift|nft|предмет)/iu],
  ['quantum_family', /(quantum\s*family|family|семь[яи]|рекомендац|подписчик|follow|фоллов)/iu],
  ['quantum_wallet', /(quantum\s*wallet|wallet|кошел|walletconnect|баланс|адрес|address)/iu],
  ['geodetect', /(geodetect|geo\s*detect|гео|геодетект|страна|регион|локал|privacy|приватн)/iu],
  ['forum', /(forum|форум|пост|тема|thread|тред|ветк|коммент|reply|ответ)/iu],
  ['search', /(search|поиск|найти|сортиров|geodetect\s*sort|фильтр)/iu],
  ['vip', /(vip|вип|x2|premium|премиум|преміум|подпис|підпис|subscription)/iu],
  ['ads', /(ads|advert|реклам|кампан|просмотр|клик|ctr|promotion|promote|метрик)/iu],
  ['qcoin', /(qcoin|q\s*coin|коин|монет|токен|зачисл|topup|invoice|инвойс|оплат|payment|платеж)/iu],
  ['media', /(media|медиа|фото|photo|image|изображ|video|видео|audio|аудио|upload|загруз|публикац|mp4|webp)/iu],
  ['account', /(аккаунт|account|login|авториз|вход|google|apple|telegram|телеграм|профил|profile|ник|nickname)/iu],
  ['security', /(seed|private|ключ|безопас|security|взлом|hack|парол|password|подозр|suspicious|токен|cookie)/iu],
  ['push', /(push|пуш|уведомлен|notification|badge|бейдж|конверт|unread|прочитан)/iu],
  ['learning_governance', /(self[-\s]?learning|self[-\s]?calibr|safe\s+learning|learning\s+governance|poisoning\s+guard|shadow|canary|rollback|самообуч|само.?калибр|учишься\s+на\s+диалог|обучение\s+поддержк|безопасн\w*\s+обуч|отравить\s+обуч|самонавч|самокалібр|自学习|自我校准|למידה\s+עצמית|כיול\s+עצמי|تعلم\s+ذاتي|معايرة\s+ذاتية)/iu],
  ['academy', /(academy|академ|обуч|курс|экзамен|exam|урок)/iu],
  ['payments', /(payment|оплат|invoice|инвойс|nowpayments|карта|чек|транзакц|transaction)/iu],
  ['moderation', /(жалоб|report|moder|модер|бан|block|правил|rules|удален|removed|наруш|boring|porn|violence)/iu],
  ['technical', /(bug|баг|ошиб|error|500|завис|лаг|slow|тормоз|crash|не работает|сломал|broken|runtime)/iu],
])

const SUB_INTENTS = Object.freeze({
  crypto_radar: [
    ['crypto_radar_not_loading', /(не груз|not load|blank|пуст|завис)/iu],
    ['crypto_radar_signal_meaning', /(сигнал|signal|направлен|direction|сила|strength)/iu],
    ['crypto_radar_timeframe', /(timeframe|таймфрейм|5m|15m|1h|день|недел)/iu],
    ['crypto_radar_data_delay', /(delay|задерж|не обнов)/iu],
    ['crypto_radar_overview', /(что такое|what is|объясн|как работает)/iu],
  ],
  battlecoin: [
    ['battlecoin_order_500', /(500|server error|ошибка\s*500)/iu],
    ['battlecoin_order_create_failed', /(созда|открыть|ставк|order).*(не|fail|ошиб)/iu],
    ['battlecoin_history_missing', /(истори|history).*(нет|missing|не видно)/iu],
    ['battlecoin_balance_mismatch', /(баланс|balance).*(не совп|wrong|mismatch)/iu],
    ['battlecoin_market_closed', /(закрыт|closed|когда откро)/iu],
    ['battlecoin_overview', /(что такое|как работает|объясн)/iu],
  ],
  battle_chat: [
    ['battle_chat_identity', /(аноним|anonymous|telegram|профил|ник)/iu],
    ['battle_chat_message_delivery', /(сообщени|message).*(не приш|не видно|delivery)/iu],
    ['battle_chat_reactions', /(лайк|heart|reaction|эмодзи|emoji)/iu],
  ],
  exchange: [
    ['exchange_availability', /(когда|when).*(откро|launch|бирж)/iu],
    ['exchange_maintenance', /(maintenance|тех|обслуж)/iu],
  ],
  media: [
    ['media_upload_failed', /(upload|загруз).*(fail|ошиб|завис|не)/iu],
    ['media_video_recording', /(record|запис|камера|camera|video|видео)/iu],
    ['media_image_processing', /(image|фото|изображ|webp|sharp)/iu],
  ],
  qcoin: [
    ['qcoin_payment_missing', /(оплат|payment|invoice|инвойс).*(нет|не приш|missing)/iu],
    ['qcoin_balance_mismatch', /(баланс|balance).*(не совп|wrong|mismatch)/iu],
    ['qcoin_credit_question', /(зачисл|credited|topup|купил|buy)/iu],
  ],
  vip: [
    ['vip_badge_inactive', /(badge|бейдж|x2|кнопк).*(не актив|сер|красн|inactive)/iu],
    ['vip_expiry_question', /(законч|expired|expires|продл|renew)/iu],
  ],
  ads: [
    ['ads_self_status', /(моя|мої|мой|сво[яи]|my|own).{0,24}(реклам|ads|campaign|кампан)|в каком состоянии.{0,60}(реклам|ads|campaign|кампан)/iu],
    ['ads_metrics_question', /(метрик|views|clicks|ctr|просмотр|клик)/iu],
    ['ads_expiry_question', /(законч|expires|final|summary)/iu],
  ],
  moderation: [
    ['moderation_report_threshold', /(жалоб|report|threshold|порог|boring)/iu],
    ['moderation_appeal', /(апел|appeal|обжал|вернуть|restore)/iu],
  ],
  security: [
    ['security_alert', /(взлом|hack|seed|private|token|cookie|подозр)/iu],
  ],
})

function classifyTopic(text, previousTopic = '') {
  const source = str(text)
  if (/[\u0590-\u05FF]/u.test(source)) {
    if (/(פרסומ|מודע|קמפיין)/u.test(source)) return 'ads'
    if (/(מטבע|qcoin|תשלום|חשבונית|ארנק)/iu.test(source)) return 'qcoin'
    if (/(שוק|מניות|ניתוח|קריפטו|אות|מחיר)/u.test(source)) return 'crypto_radar'
    if (/(חשבון|כניסה|טלגרם|פרופיל)/u.test(source)) return 'account'
  }
  for (const [topic, pattern] of TOPIC_PATTERNS) {
    if (textHas(source, pattern)) return topic
  }
  return classifyQl7SupportCatalogTopic(source, previousTopic) || str(previousTopic) || 'general'
}

function classifySubIntent(topic, text) {
  const list = SUB_INTENTS[topic] || []
  for (const [subIntent, pattern] of list) {
    if (textHas(text, pattern)) return subIntent
  }
  if (topic === 'crypto_radar') return 'crypto_radar_general'
  if (topic === 'battlecoin') return 'battlecoin_general'
  return classifyQl7SupportCatalogSubIntent(topic || 'general', text)
}

function classifyRole(text, previousContext = {}) {
  const source = compact(text)
  const raw = str(text)
  if (!source) return 'spam_or_noise'
  if (source.length <= 2) return 'spam_or_noise'
  if (/^(?:[¡¿]\s*)?(?:hello|hi|hey|привет|здравствуй|здравствуйте|здраствуйте|добрый\s+(?:день|вечер)|доброе\s+утро|привіт|вітаю|добрий\s+день|hola|buenas|merhaba|selam|مرحبا|مرحباً|أهلا|أهلاً|你好|您好|שלום)(?=$|[\s.,!?…:;،。！？])/iu.test(source) && source.split(/\s+/).length <= 4) return 'greeting'
  if (/^(спасибо|дякую|thanks|thank you|gracias|teşekkür|شكرا|谢谢)(?:$|\s)/iu.test(source)) return 'gratitude'
  if (/^(пока|закрыть|всё|решено|спасибо.+реш|close|resolved|done)(?:$|\s)/iu.test(source)) return 'conversation_close'
  if (/(статус|status|как продвига|есть новости|any update|что там|когда ответ)/iu.test(raw)) return 'status_request'
  if (/^(нет|неа|no|ні|hayır)(?:$|\s)/iu.test(source)) return 'denial'
  if (/^(другая проблема|другой вопрос|не это|this is a separate issue|separate issue|new issue|another issue|інша проблема)/iu.test(source)) return 'new_unrelated_issue'
  if (/(другая проблема|другой вопрос|не это|this is a separate issue|separate issue|new issue|another issue|інша проблема)/iu.test(raw)) return 'new_unrelated_issue'
  if (/^(да|yes|так|ага|верно|correct)(?:$|\s)/iu.test(source)) return 'confirmation'
  if (/(исправ|точнее|неправильно|коррек|correction|actually|на самом деле)/iu.test(raw)) return 'correction'
  if (/(seed|private key|приватн|взлом|hack|подозр|security|token|cookie)/iu.test(raw)) return 'security_alert'
  if (/[\u0590-\u05FF]/u.test(raw) && /^(מה|איך|כיצד|למה|מתי|האם)(?:$|\s)/u.test(source)) {
    if (/^(איך|כיצד)(?:$|\s)/u.test(source)) return 'how_to_question'
    if (/^למה(?:$|\s)/u.test(source)) return 'why_question'
    if (/^מתי(?:$|\s)/u.test(source)) return 'when_question'
    return 'informational_question'
  }
  if (/^(что|шо|що|what|que|qué|как|how|почему|why|когда|when|зачем|объясн|расскажи|что такое)/iu.test(source)) {
    if (/^(как|how)(?:$|\s)/iu.test(source)) return 'how_to_question'
    if (/^(почему|why)(?:$|\s)/iu.test(source)) return 'why_question'
    if (/^(когда|when)(?:$|\s)/iu.test(source)) return 'when_question'
    return 'informational_question'
  }
  const hasIncident = /(не работает|сломал|ошиб|error|500|завис|пропал|не приш|не видно|не могу|failed|broken|bug|crash|лаг|тормоз)/iu.test(raw)
  if (hasIncident) return 'problem_description'
  const expectedQuestion = str(previousContext?.currentQuestionCode)
  if (expectedQuestion && source.length <= 160) return 'answer_to_question'
  if (/(\d{2,}|invoice|order|campaign|post|скрин|сумм|вчера|сегодня|примерно|around|about)/iu.test(raw)) return 'additional_evidence'
  return source.length <= 6 ? 'spam_or_noise' : 'problem_description'
}

function singleToken(text = '') {
  const source = str(text)
  return /^[^\s,;:()<>[\]{}]+$/u.test(source) ? source : ''
}

function extractBareId(text = '') {
  const token = singleToken(text)
  if (!token) return ''
  if (/^0x[a-f0-9]{40}$/iu.test(token)) return ''
  if (/^0x[a-f0-9]{64}$/iu.test(token)) return ''
  if (/^[a-z0-9][a-z0-9_-]{5,79}$/iu.test(token)) return token
  return ''
}

function extractEntities(text = '', originalText = text) {
  const raw = str(originalText)
  const redacted = redactQl7SupportSecrets(str(text))
  const rawSafe = redactQl7SupportSecrets(raw)
  const walletAddress = firstMatch(rawSafe, [/\b(0x[a-f0-9]{40})\b/iu])
  const txCandidate = firstMatch(raw, [/\b(0x[a-f0-9]{64})\b/iu])
  const transactionHash = txCandidate && /\b(tx|hash|transaction|etherscan|bscscan|polygonscan|транзакц|хеш|хэш)\b/iu.test(raw)
    ? txCandidate
    : ''
  const amount = firstMatch(redacted, [
    /(?:amount|сумм[аы]|сума|на)\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)/iu,
    /\b([0-9]+(?:[.,][0-9]+)?)\s*(?:qcoin|q\s*coin|usd|usdt|btc|eth)\b/iu,
  ])
  const errorCode = firstMatch(redacted, [/\b(?:error|ошибка)?\s*(\d{3})\b/iu]).replace(/^\D+/u, '')
  const campaignId = firstMatch(redacted, [/\b(?:campaign|кампан|ads|package|пакет)\s*(?:id|#|:|-)?\s*([a-z0-9_-]{3,80})\b/iu])
  const accountId = firstMatch(redacted, [/\b(?:account|аккаунт|акаунт|uid|user)\s*(?:id|#|:|-)?\s*([a-z0-9_-]{3,80})\b/iu])
  const telegramId = firstMatch(redacted, [/\b(?:telegram|телеграм|tg)\s*(?:id|#|:|-)?\s*(\d{5,20})\b/iu])
  const nickname = firstMatch(redacted, [/\b(?:nick|nickname|ник|нік)\s*(?:=|:|-)?\s*(@?[a-z0-9_. -]{3,40})\b/iu]).trim()
  return {
    invoiceId: firstMatch(redacted, [/\b(?:invoice|инвойс|payment|pay|tx|transaction)[\s:#_-]*([a-z0-9_-]{4,80})\b/iu]),
    orderId: firstMatch(redacted, [/\b(?:order|ордер)\s*(?:id|#|:|-)\s*([a-z0-9_-]{4,80})\b/iu]),
    postId: firstMatch(redacted, [/\b(?:post|пост|thread|тред)[\s:#_-]*([a-z0-9_-]{3,80})\b/iu]),
    campaignId,
    packageId: campaignId && /\b(package|пакет)\b/iu.test(redacted) ? campaignId : '',
    accountId: accountId || walletAddress,
    walletAddress,
    transactionHash,
    telegramId,
    nickname,
    bareId: extractBareId(redacted),
    selfReference: /(мо(?:й|я|и|его|ей|ю)|сво[яи]|у\s+меня|my|own|mi|meu|мой).{0,48}(баланс|реклам|ads|campaign|кампан|подпис|підпис|vip|qcoin|wallet|кошел|гаманець|аккаунт|акаунт|профил|profile|battle|метамаркет|metamarket)|како(?:й|е)\s+состояни[ея]\s+мо(?:его|ей|й).{0,60}(баланс|аккаунт|профил|реклам|кампан|wallet|qcoin)|в каком состоянии.{0,100}(баланс|реклам|ads|campaign|кампан|подпис|vip|qcoin|wallet|аккаунт|профил)/iu.test(redacted),
    amount,
    errorCode,
    url: firstMatch(redacted, [/\b(https?:\/\/[^\s]{5,300})/iu]),
    dateHint: firstMatch(redacted, [/\b(вчера|сегодня|завтра|yesterday|today|tomorrow|\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\b/iu]),
    device: firstMatch(redacted, [/\b(iphone|айфон|android|андроид|desktop|десктоп|chrome|safari|telegram|tma|webview)\b/iu]),
    orderSide: /\b(long|лонг)\b/iu.test(redacted) ? 'long' : (/\b(short|шорт)\b/iu.test(redacted) ? 'short' : ''),
    hasSecret: redacted !== raw,
  }
}

function compactEntities(entities = {}) {
  const out = {}
  for (const [key, value] of Object.entries(entities || {})) {
    if (value === false || value === null || value === undefined || value === '') continue
    out[key] = value
  }
  return out
}

const QUESTION_TARGETS = Object.freeze({
  qcoin: ['amount', 'payment time', 'payment result'],
  battlecoin: ['symbol', 'side', 'error code', 'expected result'],
  battle_chat: ['message time', 'message context', 'device'],
  media: ['media type', 'device', 'stage', 'expected result'],
  ads: ['campaign name', 'budget/spend state', 'current result'],
  vip: ['payment time', 'expected active badge', 'subscription state'],
  moderation: ['post/comment context', 'moderation reason', 'visible notice'],
  auth: ['sign-in method', 'device', 'account alias'],
  account: ['sign-in method', 'device', 'account alias'],
  wallet: ['wallet alias', 'session state', 'device'],
  telegram: ['Telegram alias', 'linked wallet alias', 'device'],
  payments: ['amount', 'payment time', 'payment result'],
  general: ['current result', 'last action', 'approximate time', 'expected result'],
})

const QUESTION_TARGET_LABELS = Object.freeze({
  'current result': { en: 'what you see now', ru: 'что сейчас видно', uk: 'що зараз видно', es: 'lo que ves ahora', tr: 'şu an görünen bilgi', ar: 'ما يظهر الآن', zh: '现在看到的内容', he: 'מה שמופיע עכשיו' },
  'last action': { en: 'last action', ru: 'последнее действие', uk: 'остання дія', es: 'última acción', tr: 'son işlem', ar: 'آخر إجراء', zh: '最后操作', he: 'הפעולה האחרונה' },
  'approximate time': { en: 'approximate time', ru: 'примерное время', uk: 'приблизний час', es: 'hora aproximada', tr: 'yaklaşık zaman', ar: 'الوقت التقريبي', zh: '大致时间', he: 'זמן משוער' },
  'payment result': { en: 'payment result shown now', ru: 'что сейчас видно по оплате', uk: 'що зараз видно щодо оплати', es: 'resultado de pago que ves ahora', tr: 'şu an görünen ödeme sonucu', ar: 'نتيجة الدفع الظاهرة الآن', zh: '当前显示的付款结果', he: 'תוצאת התשלום שמופיעה עכשיו' },
  'budget/spend state': { en: 'budget/spend state', ru: 'состояние бюджета/расхода', uk: 'стан бюджету/витрат', es: 'estado de presupuesto/gasto', tr: 'bütçe/harcama durumu', ar: 'حالة الميزانية/الإنفاق', zh: '预算/支出状态', he: 'מצב תקציב/הוצאה' },
  'message context': { en: 'message context', ru: 'контекст сообщения', uk: 'контекст повідомлення', es: 'contexto del mensaje', tr: 'mesaj bağlamı', ar: 'سياق الرسالة', zh: '消息上下文', he: 'הקשר ההודעה' },
  'post/comment context': { en: 'post/comment context', ru: 'контекст поста/комментария', uk: 'контекст поста/коментаря', es: 'contexto de publicación/comentario', tr: 'gönderi/yorum bağlamı', ar: 'سياق المنشور/التعليق', zh: '帖子/评论上下文', he: 'הקשר הפוסט/התגובה' },
  'visible notice': { en: 'visible notice', ru: 'видимое уведомление', uk: 'видиме сповіщення', es: 'aviso visible', tr: 'görünen bildirim', ar: 'الإشعار الظاهر', zh: '可见通知', he: 'הודעה גלויה' },
  'wallet alias': { en: 'wallet alias', ru: 'алиас wallet', uk: 'аліас wallet', es: 'alias de wallet', tr: 'wallet aliası', ar: 'اسم wallet', zh: '钱包别名', he: 'כינוי wallet' },
  'Telegram alias': { en: 'Telegram alias', ru: 'алиас Telegram', uk: 'аліас Telegram', es: 'alias de Telegram', tr: 'Telegram aliası', ar: 'اسم Telegram', zh: 'Telegram 别名', he: 'כינוי Telegram' },
  'linked wallet alias': { en: 'linked wallet alias', ru: 'алиас связанного wallet', uk: 'аліас пов’язаного wallet', es: 'alias de wallet vinculado', tr: 'bağlı wallet aliası', ar: 'اسم wallet المرتبط', zh: '已关联钱包别名', he: 'כינוי wallet מקושר' },
  screen: { ru: 'раздел интерфейса', uk: 'розділ інтерфейсу', es: 'sección de interfaz', tr: 'arayüz bölümü', ar: 'قسم الواجهة', zh: '界面区域' },
  action: { ru: 'действие', uk: 'дія', es: 'acción', tr: 'işlem', ar: 'الإجراء', zh: '操作' },
  ID: { ru: 'служебная метка', uk: 'службова позначка', es: 'referencia segura', tr: 'güvenli referans', ar: 'مرجع آمن', zh: '安全参考' },
  time: { ru: 'время', uk: 'час', es: 'hora', tr: 'saat', ar: 'الوقت', zh: '时间' },
  'expected result': { ru: 'ожидаемый результат', uk: 'очікуваний результат', es: 'resultado esperado', tr: 'beklenen sonuç', ar: 'النتيجة المتوقعة', zh: '期望结果' },
  'invoice/payment ID': { ru: 'ориентир платежа', uk: 'орієнтир платежу', es: 'referencia de pago', tr: 'ödeme referansı', ar: 'مرجع الدفع', zh: '付款参考' },
  amount: { ru: 'сумма', uk: 'сума', es: 'importe', tr: 'tutar', ar: 'المبلغ', zh: '金额' },
  'payment time': { ru: 'время оплаты', uk: 'час оплати', es: 'hora de pago', tr: 'ödeme zamanı', ar: 'وقت الدفع', zh: '付款时间' },
  symbol: { ru: 'символ', uk: 'символ', es: 'símbolo', tr: 'sembol', ar: 'الرمز', zh: '交易符号' },
  side: { ru: 'направление', uk: 'напрям', es: 'dirección', tr: 'yön', ar: 'الاتجاه', zh: '方向' },
  'order ID': { ru: 'ориентир ордера', uk: 'орієнтир ордера', es: 'referencia de orden', tr: 'emir referansı', ar: 'مرجع الأمر', zh: '订单参考' },
  'error code': { ru: 'код ошибки', uk: 'код помилки', es: 'código de error', tr: 'hata kodu', ar: 'رمز الخطأ', zh: '错误代码' },
  'message time': { ru: 'время сообщения', uk: 'час повідомлення', es: 'hora del mensaje', tr: 'mesaj zamanı', ar: 'وقت الرسالة', zh: '消息时间' },
  'sender identity': { ru: 'личность отправителя', uk: 'особа відправника', es: 'identidad del remitente', tr: 'gönderen kimliği', ar: 'هوية المرسل', zh: '发送者身份' },
  device: { ru: 'устройство', uk: 'пристрій', es: 'dispositivo', tr: 'cihaz', ar: 'الجهاز', zh: '设备' },
  'media type': { ru: 'тип медиа', uk: 'тип медіа', es: 'tipo de media', tr: 'medya türü', ar: 'نوع الوسائط', zh: '媒体类型' },
  stage: { ru: 'этап', uk: 'етап', es: 'etapa', tr: 'aşama', ar: 'المرحلة', zh: '阶段' },
  'campaign/package ID': { ru: 'кампания или пакет', uk: 'кампанія або пакет', es: 'campaña o paquete', tr: 'kampanya veya paket', ar: 'الحملة أو الباقة', zh: '活动或套餐' },
  'campaign name': { ru: 'название кампании', uk: 'назва кампанії', es: 'nombre de campaña', tr: 'kampanya adı', ar: 'اسم الحملة', zh: '活动名称' },
  'expected active badge': { ru: 'ожидаемый активный бейдж', uk: 'очікуваний активний бейдж', es: 'badge activo esperado', tr: 'beklenen aktif rozet', ar: 'الشارة النشطة المتوقعة', zh: '期望激活徽章' },
  'subscription state': { ru: 'состояние подписки', uk: 'стан підписки', es: 'estado de suscripción', tr: 'abonelik durumu', ar: 'حالة الاشتراك', zh: '订阅状态' },
  'post/comment ID': { ru: 'пост или комментарий', uk: 'пост або коментар', es: 'publicación o comentario', tr: 'gönderi veya yorum', ar: 'المنشور أو التعليق', zh: '帖子或评论' },
  'moderation reason': { ru: 'причина модерации', uk: 'причина модерації', es: 'motivo de moderación', tr: 'moderasyon nedeni', ar: 'سبب الإشراف', zh: '审核原因' },
  'sign-in method': { ru: 'способ входа', uk: 'спосіб входу', es: 'método de acceso', tr: 'giriş yöntemi', ar: 'طريقة الدخول', zh: '登录方式' },
  'account alias': { ru: 'алиас аккаунта', uk: 'аліас акаунта', es: 'alias de cuenta', tr: 'hesap aliası', ar: 'اسم الحساب', zh: '账户别名' },
  'wallet address': { ru: 'адрес wallet', uk: 'адреса wallet', es: 'dirección wallet', tr: 'wallet adresi', ar: 'عنوان wallet', zh: '钱包地址' },
  'session state': { ru: 'состояние сессии', uk: 'стан сесії', es: 'estado de sesión', tr: 'oturum durumu', ar: 'حالة الجلسة', zh: '会话状态' },
  'Telegram account': { ru: 'Telegram аккаунт', uk: 'Telegram акаунт', es: 'cuenta Telegram', tr: 'Telegram hesabı', ar: 'حساب Telegram', zh: 'Telegram 账户' },
  'linked wallet': { ru: 'связанный wallet', uk: 'пов’язаний wallet', es: 'wallet vinculado', tr: 'bağlı wallet', ar: 'wallet المرتبط', zh: '已绑定钱包' },
})

const HEBREW_QUESTION_TARGET_LABELS = Object.freeze({
  'current result': 'מה שמופיע עכשיו',
  'last action': 'הפעולה האחרונה',
  'approximate time': 'זמן משוער',
  'expected result': 'התוצאה הצפויה',
  'payment result': 'תוצאת התשלום שמופיעה עכשיו',
  amount: 'סכום',
  'payment time': 'זמן התשלום',
  symbol: 'סימול',
  side: 'כיוון',
  'error code': 'קוד השגיאה',
  'message time': 'זמן ההודעה',
  'message context': 'הקשר ההודעה',
  device: 'מכשיר',
  'media type': 'סוג המדיה',
  stage: 'שלב',
  'campaign name': 'שם הקמפיין',
  'budget/spend state': 'מצב תקציב/הוצאה',
  'expected active badge': 'תג פעיל צפוי',
  'subscription state': 'מצב המינוי',
  'post/comment context': 'הקשר הפוסט/התגובה',
  'moderation reason': 'סיבת הפיקוח',
  'visible notice': 'הודעה גלויה',
  'sign-in method': 'שיטת כניסה',
  'account alias': 'כינוי חשבון',
  'wallet alias': 'כינוי wallet',
  'session state': 'מצב הסשן',
  'Telegram alias': 'כינוי Telegram',
  'linked wallet alias': 'כינוי wallet מקושר',
})

function questionTargetLabel(target, locale) {
  const value = str(target)
  const localeKey = lang(locale)
  if (localeKey === 'he' && HEBREW_QUESTION_TARGET_LABELS[value]) return HEBREW_QUESTION_TARGET_LABELS[value]
  return QUESTION_TARGET_LABELS[value]?.[localeKey] || value
}

function localizedQuestionFrame(locale, label, targets) {
  const l = lang(locale)
  const joined = targets.slice(0, 4).map((item) => questionTargetLabel(item, l)).join(', ')
  return {
    en: `Which ${label} detail should I use first: ${joined}?`,
    ru: `Какая деталь по направлению «${label}» важнее первой: ${joined}?`,
    uk: `Яка деталь за напрямом «${label}» важливіша першою: ${joined}?`,
    es: `¿Qué detalle de ${label} debo usar primero: ${joined}?`,
    tr: `${label} için önce hangi ayrıntıyı kullanayım: ${joined}?`,
    ar: `أي تفصيل عن ${label} أستخدم أولاً: ${joined}?`,
    zh: `请先说明 ${label} 的哪个细节：${joined}?`,
    he: `איזה פרט של ${label} כדאי להתחיל ממנו: ${joined}?`,
  }[l]
}

function chooseQuestion(topic, previousContext = {}) {
  const asked = new Set((Array.isArray(previousContext?.questionsAsked) ? previousContext.questionsAsked : []).map(str))
  const normalized = normalizeQl7SupportTopic(topic)
  const targets = QUESTION_TARGETS[normalized] || QUESTION_TARGETS.general
  const codeBase = `${normalized}_anchor`
  const allCodes = targets.map((_, index) => `${codeBase}_${index + 1}`)
  const code = allCodes.find((item) => !asked.has(item)) || codeBase
  const label = getQl7SupportTopicLabel(normalized, lang(previousContext?.selectedLocale))
  return {
    code,
    text: localizedQuestionFrame(previousContext?.selectedLocale, label, targets),
  }
}

function countClarifications(previousContext = {}) {
  const asked = Array.isArray(previousContext?.questionsAsked) ? previousContext.questionsAsked.length : 0
  return Math.max(0, asked)
}

function resolveStatus(role, topic, entities, previousContext = {}) {
  if (role === 'conversation_close') return 'closed'
  if (role === 'gratitude' || role === 'informational_question' || role === 'how_to_question' || role === 'why_question' || role === 'when_question' || role === 'greeting') return 'user_notified'
  if (role === 'security_alert') return 'awaiting_admin'
  if (countClarifications(previousContext) >= 3) return 'partial'
  const selfDiagnosticTopics = new Set([
    'ads',
    'ads_packages',
    'ads_campaigns',
    'vip',
    'qcoin',
    'account',
    'auth',
    'wallet',
    'telegram',
    'payments',
    'battlecoin',
    'battle_chat',
    'messenger',
    'metamarket',
    'profile',
    'push',
  ])
  const hasActionable = !!(
    entities.invoiceId ||
    entities.orderId ||
    entities.postId ||
    entities.campaignId ||
    entities.packageId ||
    entities.accountId ||
    entities.walletAddress ||
    entities.transactionHash ||
    entities.telegramId ||
    entities.nickname ||
    entities.bareId ||
    entities.errorCode ||
    entities.device ||
    entities.url ||
    (entities.selfReference && selfDiagnosticTopics.has(normalizeQl7SupportTopic(topic)))
  )
  if (hasActionable && topic !== 'general') return 'ready_for_diagnostic'
  return 'collecting_context'
}

export function analyzeQl7SupportRequest({
  text = '',
  locale = '',
  previousContext = {},
} = {}) {
  const cleanText = str(text)
  const redactedText = redactQl7SupportSecrets(cleanText)
  const language = detectQl7SupportInputLanguage(cleanText, locale || previousContext?.selectedLocale)
  const role = classifyRole(redactedText, previousContext)
  const previousTopic = str(previousContext?.previousTopic || previousContext?.topic)
  const topicRaw = role === 'greeting'
    ? 'greeting'
    : ['answer_to_question', 'confirmation', 'denial', 'additional_evidence'].includes(role) && previousTopic
    ? previousTopic
    : classifyTopic(redactedText, previousTopic)
  const topic = str(topicRaw) || 'general'
  const subIntent = classifySubIntent(topic, redactedText)
  const entities = compactEntities(extractEntities(redactedText, cleanText))
  const question = chooseQuestion(topic, { ...previousContext, selectedLocale: locale })
  const caseStatus = resolveStatus(role, topic, entities, previousContext)
  const missingSlots = ['ready_for_diagnostic', 'awaiting_admin', 'user_notified', 'closed'].includes(caseStatus)
    || ['informational_question', 'how_to_question', 'why_question', 'when_question', 'greeting', 'gratitude', 'conversation_close'].includes(role)
    ? []
    : [question.code]
  return {
    role,
    topic,
    subIntent,
    entities,
    missingSlots,
    currentQuestionCode: missingSlots.length ? question.code : '',
    currentQuestionText: missingSlots.length ? question.text : '',
    caseStatus,
    diagnosticStatus: caseStatus === 'ready_for_diagnostic' ? 'ready' : (caseStatus === 'partial' ? 'partial' : 'not_started'),
    selectedLocale: lang(locale || previousContext?.selectedLocale),
    detectedLanguage: language.detected,
    translationStatus: language.supported ? 'native' : 'pending_provider',
    translationRequired: !language.supported,
    responseLanguage: language.supported ? language.detected : lang(locale || previousContext?.selectedLocale),
    sanitizedText: redactedText,
    textHash: hash(redactedText),
    semanticFingerprint: shortHash([role, topic, subIntent, compact(redactedText).slice(0, 120)].join('|')),
    domainPlan: buildQl7SupportDomainPlan({ analysis: { topic }, locale }),
  }
}

const SAFE_ENTITY_LABELS = Object.freeze({
  invoiceId: 'Payment reference',
  paymentId: 'Payment reference',
  orderId: 'Order reference',
  postId: 'Post reference',
  campaignId: 'Campaign reference',
  packageId: 'Package reference',
  accountId: 'Account reference',
  walletAddress: 'Wallet',
  transactionHash: 'Transaction',
  telegramId: 'Telegram reference',
  nickname: 'Nickname',
  errorCode: 'Error code',
  device: 'Device',
  url: 'Page',
  bareId: 'Reference',
})

function knownFactsText(analysis, locale) {
  const l = lang(locale)
  const entries = Object.entries(analysis?.entities || {})
    .filter(([key, value]) => SAFE_ENTITY_LABELS[key] && value && value !== true)
  if (!entries.length) return ''
  const body = entries.map(([key, value]) => `${SAFE_ENTITY_LABELS[key]}: ${value}`).join(', ')
  const prefix = {
    en: 'Known detail',
    ru: 'Уже вижу деталь',
    uk: 'Вже бачу деталь',
    es: 'Detalle detectado',
    tr: 'Görülen ayrıntı',
    ar: 'تفصيل ظاهر',
    zh: '已识别细节',
  }[l] || 'Known detail'
  return `${prefix}: ${body}.`
}

export function buildQl7SupportPlannedReply({
  analysis,
  previousContext = {},
  locale = '',
  seed = '',
} = {}) {
  const a = analysis || analyzeQl7SupportRequest({ text: '', locale, previousContext })
  const plan = buildQl7SupportPremiumResponsePlan({
    analysis: a,
    route: {
      messageAct: a.messageAct || a.role,
      topic: a.topic,
      subIntent: a.subIntent,
      confidence: a.confidence,
      hypotheses: a.hypotheses || [],
      alternatives: a.alternatives || [],
      shouldClarify: a.shouldClarify === true,
      ambiguous: a.ambiguous === true,
      domainPlan: a.domainPlan,
    },
    memory: previousContext,
    locale: locale || a.selectedLocale,
    seed,
  })
  const safeText = redactQl7SupportSecrets(plan.text).replace(/\s+/g, ' ').trim()
  return {
    ...plan,
    text: safeText,
    semanticFingerprint: shortHash(`${plan.responseCode}:${safeText.toLowerCase().slice(0, 160)}`),
    textHash: hash(safeText),
    questionCode: a.currentQuestionCode || '',
    caseStatus: a.caseStatus,
    diagnosticStatus: a.diagnosticStatus,
    domainPlan: plan.domainPlan || buildQl7SupportDomainPlan({ analysis: a, locale: locale || a.selectedLocale }),
    transition: {
      fromStatus: str(previousContext?.caseStatus || previousContext?.status || 'opened') || 'opened',
      toStatus: a.caseStatus,
      reasonCode: plan.responseCode,
    },
  }
}

export function summarizeQl7SupportPreviousContext(caseDoc = {}) {
  const doc = caseDoc && typeof caseDoc === 'object' ? caseDoc : {}
  return {
    activeCaseId: str(doc.caseId || doc._id),
    previousTopic: str(doc.topic),
    previousSubIntent: str(doc.subIntent),
    previousEntities: doc.entities && typeof doc.entities === 'object' ? doc.entities : {},
    previousMissingSlots: Array.isArray(doc.missingSlots) ? doc.missingSlots : [],
    questionsAsked: Array.isArray(doc.questionsAsked) ? doc.questionsAsked : [],
    currentQuestionCode: str(doc.currentQuestionCode),
    lastUserMessages: Array.isArray(doc.lastUserMessages) ? doc.lastUserMessages : [],
    lastSupportReplies: Array.isArray(doc.lastSupportReplies) ? doc.lastSupportReplies : [],
    diagnosticStatus: str(doc.diagnosticStatus || 'not_started'),
    caseStatus: str(doc.caseStatus || doc.status || 'opened'),
    selectedLocale: str(doc.selectedLocale),
    detectedLanguages: Array.isArray(doc.detectedLanguages) ? doc.detectedLanguages : [],
    replyHistory: Array.isArray(doc.replyHistory) ? doc.replyHistory : [],
    status: str(doc.status || doc.caseStatus || 'opened'),
  }
}

export function buildQl7SupportCasePatch({
  caseId,
  userId,
  messageId,
  text,
  locale,
  analysis,
  replyPlan,
  previousCase = {},
  now,
} = {}) {
  const at = now || new Date().toISOString()
  const prev = summarizeQl7SupportPreviousContext(previousCase)
  const entities = { ...(prev.previousEntities || {}), ...(analysis?.entities || {}) }
  const questionsAsked = uniq([
    ...(prev.questionsAsked || []),
    analysis?.currentQuestionCode || '',
  ]).slice(-MAX_QUESTIONS)
  const lastUserMessages = [
    ...(prev.lastUserMessages || []),
    {
      messageId: str(messageId),
      textPreview: str(text).slice(0, 360),
      role: analysis?.role || 'problem_description',
      at,
    },
  ].slice(-MAX_LAST_MESSAGES)
  const lastSupportReplies = [
    ...(prev.lastSupportReplies || []),
    {
      responseCode: replyPlan?.responseCode || '',
      textHash: replyPlan?.textHash || '',
      at,
    },
  ].slice(-MAX_LAST_MESSAGES)
  const replyHistory = [
    ...(Array.isArray(previousCase?.replyHistory) ? previousCase.replyHistory : []),
    {
      replyId: `${str(caseId)}:${str(messageId)}:${replyPlan?.responseCode || 'reply'}`,
      responseCode: replyPlan?.responseCode || '',
      semanticFingerprint: replyPlan?.semanticFingerprint || '',
      textHash: replyPlan?.textHash || '',
      createdAt: at,
    },
  ].slice(-MAX_REPLY_HISTORY)
  const transitions = [
    ...(Array.isArray(previousCase?.statusTransitions) ? previousCase.statusTransitions : []),
    {
      ...(replyPlan?.transition || {}),
      triggeringMessageId: str(messageId),
      timestamp: at,
      revision: Number(previousCase?.revision || 0) + 1,
    },
  ].slice(-MAX_REPLY_HISTORY)
  return {
    caseId: str(caseId),
    userId: str(userId),
    topic: str(analysis?.topic || 'general') || 'general',
    subIntent: analysis?.subIntent || 'general_general',
    role: analysis?.role || 'problem_description',
    entities,
    missingSlots: Array.isArray(analysis?.missingSlots) ? analysis.missingSlots : [],
    questionsAsked,
    currentQuestionCode: analysis?.currentQuestionCode || '',
    lastUserMessages,
    lastSupportReplies,
    replyHistory,
    statusTransitions: transitions,
    diagnosticStatus: analysis?.diagnosticStatus || 'not_started',
    caseStatus: analysis?.caseStatus || 'collecting_context',
    selectedLocale: lang(locale),
    detectedLanguages: uniq([...(prev.detectedLanguages || []), analysis?.detectedLanguage || '']).slice(-8),
    translationStatus: analysis?.translationStatus || 'native',
    domainPlan: analysis?.domainPlan || buildQl7SupportDomainPlan({ analysis, locale }),
    active: !['closed', 'resolved', 'superseded'].includes(analysis?.caseStatus),
    updatedAt: at,
    revision: Number(previousCase?.revision || 0) + 1,
    storagePrimary: 'mongo',
  }
}

export function shouldStartNewQl7SupportCase(analysis = {}, previousCase = {}) {
  if (!previousCase || !previousCase._id) return true
  if (['closed', 'resolved', 'superseded'].includes(str(previousCase.caseStatus || previousCase.status))) return true
  if (analysis.role === 'new_unrelated_issue') return true
  const oldTopic = str(previousCase.topic)
  const nextTopic = str(analysis.topic)
  if (oldTopic && nextTopic && oldTopic !== nextTopic) {
    if (['answer_to_question', 'confirmation', 'denial', 'additional_evidence', 'correction'].includes(analysis.role)) return false
    return true
  }
  return false
}

export function createQl7SupportCaseId(userId = '', topic = '', messageId = '') {
  const uid = str(userId).toLowerCase() || 'user'
  const tp = str(topic).toLowerCase() || 'general'
  const mid = str(messageId) || String(Date.now())
  return `ql7case:${uid}:${tp}:${mid}`
}
