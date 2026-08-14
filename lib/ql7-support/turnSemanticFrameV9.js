import { normalizeQl7SupportTopic } from './ecosystemCatalog.js'

function str(value) { return String(value ?? '').trim() }
function norm(value = '') {
  return str(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}
function has(pattern, text) { return pattern.test(text) }

const URL_RE = /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})(?:\S*)/iu
const EXPLAIN_RE = /(?:^|[^\p{L}\p{N}_])(?:что\s+(?:такое|значит|означает)|объясни|как\s+работает|what\s+(?:is|does)|explain|meaning|qué\s+es|que\s+significa|jak\s+korzystać|jak\s+działa|ಏನು|ಹೇಗೆ)(?=$|[^\p{L}\p{N}_])/iu
const METRIC_RE = /(?:метрик|аналитик|показ|просмотр|клик|ctr|impression|click|view|analytics|statysty|statystyk|kampani)/iu
const LAUNCH_RE = /(?:когда\s+(?:запуст|откро)|запустится|релиз|дата\s+запуск|when\s+will|launch|roadmap|uruchom|release)/iu
const THREAT_RE = /(?:убь[юе]|взорв|теракт|бомб(?:а|у|ой|ить)|взлома|хакну\s+(?:вас|тебя|систем)|вам\s+пизд|кибер\s*атак|cyber\s*attack|terror(?:ist)?\s+attack|bomb(?:ing)?|blow\s+up|attack\s+(?:the\s+)?system|kill\s+you|i\s+will\s+kill|i\s+will\s+hack|ich\s+hacke|ich\s+werde\s+(?:dich|euch|das\s+system)\s+hacken|terroranschlag|bombe|сделаю\s+.*атак|атака\s+на\s+систем|знищ|hack\s+(?:your|the)|matar|amenaza|سأفجر|تفجير|قنبلة|إرهاب|عملية\s+إرهابية|هجوماً?\s+إرهابياً?|هجوما?\s+إرهابيا?|ارتكب.{0,32}إرهاب|سأهاجم\s+النظام|أهاجم\s+النظام|هجوم\s+على\s+النظام|攻击系统|炸弹|恐怖袭击|פיגוע|פצצה|אתקוף\s+את\s+המערכת)/iu
const VIOLENCE_RE = /(?:я\s+убил|убил\s+и\s+съел|убью|взорв|теракт|бомб|сделаю\s+.*атак|взлома|хакну|kill|murder|terror|bomb|cyber\s*attack|سأهاجم|تفجير|قنبلة|هجوم|إرهاب|ارتكب.{0,32}إرهاب|攻击|炸弹|恐怖袭击|פיגוע|פצצה|אתקוף)/iu
const ABUSE_RE = /(?:идиот|дебил|хуй|пизд|сука|еба|homo|idiota|joder|puta|mierda|arschloch|schei(?:ss|ß)e|hurensohn|fick|ferrekte|skriuwmasine|oplichters|aptal|salak|siktir|غبي|أحمق|لعنة|حمار|操|妈的|טיפש|מטומטם|חרא|хуйло|ты\s+милый|a\s+ты\s+милый)/iu
const GIBBERISH_RE = /^(?:[a-zа-яёіЇєґ]{1,2}|[^\p{L}\p{N}]{1,16})$/iu

const TOPIC_HINTS = Object.freeze([
  ['moderation', /(?:post\s+removed\s+after\s+reports?|appeal\s+(?:a\s+)?media\s+publishing\s+restriction|who\s+reported\s+the\s+post|пост\s+удалил\p{L}*\s+после\s+жалоб|допис\s+видалил\p{L}*\s+після\s+скарг|обжал\p{L}*\s+ограничен\p{L}*\s+публикац\p{L}*\s+медиа|оскарж\p{L}*\s+обмежен\p{L}*\s+публікац\p{L}*\s+медіа|кто\s+пожаловал\p{L}*\s+на\s+пост|хто\s+поскаржив\p{L}*\s+на\s+допис)/iu],
  ['roadmap', /(?:^|[^\p{L}\p{N}_])roadmap(?=$|[^\p{L}\p{N}_])|roadmap\s+and\s+future\s+plans|дорожн\p{L}*\s+карт/iu],
  ['wallet', /(?:quantum\s+wallet|кошел[её]к|walletconnect|cüzdan|محفظة|钱包|ארנק)/iu],
  ['news', /(?:crypto\s+news|market\s+news|крипто\s*новост|новост(?:и)?\s+крипт|أخبار\s+العملات|加密新闻|חדשות\s+קריפטו)/iu],
  ['quantum_family', /(?:quantum\s+family|квантум\s+фемили|followers?|подписчик|متابع|关注者|עוקבים)/iu],
  ['forum_threads', /(?:forum\s+threads?|thread|ветк(?:а|е|и)|论坛主题|שרשור)/iu],
  ['ads_packages', /(?:(?:ad|ads|advertising)\s+packages?|рекламн\p{L}*\s+пакет\p{L}*|пакет\p{L}*\s+реклам|广告套餐|חבילת\s+פרסום)/iu],
  ['contact', /(?:partnership|investment|investor|\binvest\b|business\s+contacts?|reach\s+the\s+operator|партн[её]р|инвестиц|інвестува|делов\p{L}*\s+контакт|бизнес[- ]предлож|合作|投资|שותף|השקעה)/iu],
  ['localization', /(?:deep\s+translate|localization|translation|локализац|перевод|翻译|תרגום)/iu],
  ['ads_campaigns', /(?:рекламн(?:ая|ой|ую)\s+кампан|ads?\s+campaign|ctr|impressions?|广告活动|קמפיין\s+פרסום)/iu],
  ['vip', /(?:vip|вип|premium\s+subscription|vip\s+subscription|اشتراك\s+vip|会员|וי\s*איי\s*פי)/iu],
  ['homepage', /(?:cryptoradar|crypto\s*radar|market\s*radar|крипто\s*радар|крипторадар|главн(?:ая|ой)\s+страниц|市场雷达)/iu],
  ['exchange_ai', /(?:exchange\s*ai|ai\s*(?:box|quota|analysis|signal)|ии\s+аналитик|ai\s+аналитик|ai\s*квот|сигнал)/iu],
  ['exchange', /(?:quantum\s+exchange|exchange|бирж|стакан|график|рынок|order\s*book)/iu],
  ['battlecoin', /(?:battle\s*coin|battlecoin|батлкоин|баттлкоин|ордер|лонг|шорт)/iu],
  ['battle_chat', /(?:battle\s+chat|батл\s*чат|баттл\s*чат|чат\s+битв)/iu],
  ['gameverse', /(?:game\s*verse|gameverse|ql7\s*(?:ai\s*)?game|геймверс)/iu],
  ['metaverse', /(?:метавселен|metaverse)/iu],
  ['metamarket', /(?:metamarket|метамаркет|marketplace|подар|gift)/iu],
  ['qcoin', /(?:qcoin|q\s*coin|кьюкоин|баланс|остаток|сколько\s+(?:у\s+меня|на\s+счету)|balance|saldo|رصيد|余额|יתרה)/iu],
  ['security', /(?:безопасност|security|взлом|парол|токен|seed|private\s+key)/iu],
])

const MULTI_INTENT_CONTINUATION_RE = /(?:also\s+(?:explain|tell)|tell\s+me\s+more[\s\S]{0,120}also|также\s+(?:объясни|расскажи)|розкажи[\s\S]{0,120}також|también\s+explica|explícalo[\s\S]{0,120}también|ayrıca[\s\S]{0,80}açıkla|bunu[\s\S]{0,120}ayrıca|أيضاً|أيضا|也请说明|也請說明|הסבר\s+גם)/iu
function hypothesisRows(intent = {}) { return Array.isArray(intent?.hypotheses) ? intent.hypotheses : [] }
function hasSecondaryIntent(intent = {}, previousTopic = '') {
  const previous = normalizeQl7SupportTopic(previousTopic)
  return hypothesisRows(intent).some((item) => {
    const topic = normalizeQl7SupportTopic(item?.topic)
    return Boolean(topic) && (!previous || topic !== previous)
  })
}
function namedTopicPosition(item = {}) {
  let best = Number.POSITIVE_INFINITY
  for (const evidence of Array.isArray(item?.matchedEvidence) ? item.matchedEvidence : []) {
    const match = /^named:[^@]+@(\d+)$/u.exec(str(evidence))
    if (match) best = Math.min(best, Number(match[1]))
  }
  return best
}
function namedTopics(intent = {}) {
  return hypothesisRows(intent)
    .map((item) => ({ topic: normalizeQl7SupportTopic(item?.topic), index: namedTopicPosition(item) }))
    .filter((item) => item.topic && Number.isFinite(item.index))
    .sort((a, b) => a.index - b.index || a.topic.localeCompare(b.topic))
}
function firstNamedTopic(intent = {}) { return namedTopics(intent)[0]?.topic || '' }
function containsTopic(intent = {}, topic = '') {
  const normalized = normalizeQl7SupportTopic(topic)
  return Boolean(normalized) && hypothesisRows(intent).some((item) => normalizeQl7SupportTopic(item?.topic) === normalized)
}

function detectTopic(text, fallback = '') {
  for (const [topic, pattern] of TOPIC_HINTS) {
    if (pattern.test(text)) return normalizeQl7SupportTopic(topic)
  }
  return normalizeQl7SupportTopic(fallback || 'support_system')
}

function detectOperation(text = '', messageAct = '') {
  if (messageAct === 'threat' || THREAT_RE.test(text) || VIOLENCE_RE.test(text)) return 'safety_review'
  if (URL_RE.test(text)) return 'url_submission'
  if (GIBBERISH_RE.test(text)) return 'noise'
  if (messageAct === 'personal_status_request' || messageAct === 'status_followup') {
    return METRIC_RE.test(text) ? 'show_metrics' : 'check_status'
  }
  if (LAUNCH_RE.test(text) || messageAct === 'roadmap_question' || messageAct === 'when_question') return 'launch_status'
  if (EXPLAIN_RE.test(text) || ['informational_question', 'how_to_question', 'why_question'].includes(messageAct)) return 'explain'
  if (METRIC_RE.test(text)) return 'show_metrics'
  if (messageAct === 'greeting') return 'greeting'
  if (messageAct === 'gratitude') return 'gratitude'
  if (messageAct === 'profanity_without_request') return 'boundary'
  return 'support_intake'
}

function entitiesFromAnalysis(analysis = {}) {
  const src = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  const out = {}
  for (const [key, value] of Object.entries(src)) {
    if (value === null || value === undefined || value === '' || value === false) continue
    out[key] = value === true ? true : str(value).slice(0, 180)
  }
  return out
}

export function buildQl7SupportTurnSemanticFrameV9({
  text = '',
  canonicalText = '',
  locale = 'en',
  intent = {},
  baseAnalysis = {},
  previousContext = {},
  tone = {},
} = {}) {
  const source = norm([canonicalText, text].filter(Boolean).join('\n'))
  const messageAct = str(intent?.messageAct || baseAnalysis?.messageAct || baseAnalysis?.role || '')
  const previousTopic = normalizeQl7SupportTopic(previousContext?.previousTopic || previousContext?.topic || '')
  const rawIntentTopic = str(intent?.top?.topic || intent?.topic || '')
  const intentTopic = rawIntentTopic ? normalizeQl7SupportTopic(rawIntentTopic) : ''
  const hintedTopic = detectTopic(source, '')
  let topic = intentTopic || hintedTopic || normalizeQl7SupportTopic(baseAnalysis?.topic || previousTopic || 'support_system')

  // A continuation plus an explicit "also" clause is a compound request: keep
  // the established topic primary and expose the secondary topic through the
  // hypotheses. This prevents the first secondary mention from erasing the
  // conversation focus on every following turn.
  if (MULTI_INTENT_CONTINUATION_RE.test(source) && hasSecondaryIntent(intent, previousTopic)) {
    const namedRows = namedTopics(intent)
    const namedPrimary = namedRows[0]?.topic || ''
    const previousExplicitlyNamed = namedRows.some((item) => item.topic === previousTopic)
    // A deictic continuation with one named secondary keeps the established
    // focus. A compound request that explicitly names two or more topics uses
    // the first named topic, so a stale/ambiguous previous route cannot win.
    if (previousTopic && previousTopic !== 'support_system' && containsTopic(intent, previousTopic) && (previousExplicitlyNamed || namedRows.length < 2)) topic = previousTopic
    else topic = namedPrimary || intentTopic || hintedTopic || previousTopic || 'support_system'
  } else if ((!intentTopic || Number(intent?.confidence || 0) < 0.55) && hintedTopic) {
    topic = hintedTopic
  }

  if (topic === 'battle_chat' && /(?:батлкоин|баттлкоин|battle\s*coin|battlecoin)/iu.test(source) && !/(?:чат|chat|emoji|reaction)/iu.test(source)) {
    topic = 'battlecoin'
  }
  if (topic === 'security' && (THREAT_RE.test(source) || VIOLENCE_RE.test(source))) {
    topic = 'support_system'
  }

  const operation = detectOperation(source, messageAct)
  const socialRisk = THREAT_RE.test(source) || VIOLENCE_RE.test(source)
    ? 'threat'
    : (ABUSE_RE.test(source) || tone?.insult === true ? 'abuse' : '')
  const ownership = messageAct === 'personal_status_request'
    ? 'self'
    : /(?:мой|моя|мои|моего|моей|мою|свой|своя|свои|my|own|mi|meu|у\s+меня|moim|mej|ನನ್ನ|我的|حسابي|رصيدي)/iu.test(source)
    ? 'self'
    : (messageAct === 'foreign_account_request' ? 'foreign' : 'unknown')

  return Object.freeze({
    version: 9,
    locale: str(locale),
    topic,
    previousTopic,
    operation,
    messageAct,
    socialRisk,
    ownership,
    hasUrl: URL_RE.test(source),
    isNoise: GIBBERISH_RE.test(source),
    targetEntities: Object.freeze(entitiesFromAnalysis(baseAnalysis)),
    timeScope: /(?:week|недел|день|today|сегодня|за\s+всё|lifetime)/iu.test(source) ? 'explicit' : 'implicit',
    evidence: Object.freeze([
      topic ? `topic:${topic}` : '',
      operation ? `operation:${operation}` : '',
      socialRisk ? `social:${socialRisk}` : '',
      previousTopic ? `previous:${previousTopic}` : '',
    ].filter(Boolean)),
  })
}

export function ql7SupportContainsUserUrlV9(text = '') {
  return URL_RE.test(str(text))
}
