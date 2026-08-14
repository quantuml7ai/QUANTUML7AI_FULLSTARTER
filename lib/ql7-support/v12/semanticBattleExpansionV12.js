import { QL7_SUPPORT_SIMULATION_LANGUAGES_V11, QL7_SUPPORT_SIMULATION_TOPICS_V11 } from '../simulationOntologyV11.js'

export const QL7_SUPPORT_SEMANTIC_BATTLE_EXPANSION_VERSION_V12 = '12.0.0'

function str(value) { return String(value ?? '').trim() }
function hashInt(value) {
  let hash = 2166136261
  const text = String(value)
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
function pick(values, key) {
  const rows = Array.isArray(values) && values.length ? values : ['']
  return rows[hashInt(key) % rows.length]
}
function compact(value = '', max = 600) {
  return str(value).replace(/\s+/gu, ' ').slice(0, max).trim()
}

export const QL7_SUPPORT_BATTLE_INPUT_MODES_V12 = Object.freeze([
  'synonym_chain',
  'typo_noise',
  'slang_voice',
  'regional_dialect',
  'emotion_overlay',
  'code_switch',
  'negation_repair',
  'confusing_reference',
  'evidence_without_screenshot',
  'operator_handoff',
  'accessibility_context',
  'safety_boundary',
  'warm_social',
  'joke_request',
  'partnership_intake',
  'learning_self_calibration',
])

const TOPIC_SYNONYMS = Object.freeze({
  platform: ['QL7 ecosystem', 'Quantum L7 AI platform', 'платформа QL7', 'экосистема Quantum', '主平台', 'מערכת QL7'],
  homepage: ['home screen', 'CryptoRadar front page', 'главная', 'домашняя страница', '主页', 'דף הבית'],
  news: ['crypto news', 'market digest', 'новости рынка', 'крипто-лента', '市场新闻', 'חדשות שוק'],
  exchange: ['exchange terminal', 'trading screen', 'биржа', 'обменник', '交易所', 'בורסה'],
  exchange_ai: ['AI Box', 'AI analytics', 'ии-бокс', 'AI аналитика', 'AI 分析', 'תיבת AI'],
  battlecoin: ['BattleCoin', 'ten-minute battle', 'батлкоин', 'битва монет', '战斗币', 'באטלקוין'],
  battle_chat: ['Battle Chat', 'battle reactions', 'батл-чат', 'чат битвы', '战斗聊天', 'צאט קרב'],
  futures: ['futures', 'long and short', 'фьючерсы', 'плечо сделки', '期货', 'חוזים עתידיים'],
  academy: ['Quantum Academy', 'learning course', 'академия', 'урок QL7', '学院', 'אקדמיה'],
  academy_exam: ['academy exam', 'test attempt', 'экзамен академии', 'проверка знаний', '考试', 'מבחן'],
  gameverse: ['GameVerse', 'game world', 'геймверс', 'игровая зона', '游戏宇宙', 'גיימברס'],
  metastudio: ['MetaStudio', 'creator studio', 'метастудия', 'студия игр', '元工作室', 'מטאסטודיו'],
  metaverse: ['metaverse', 'virtual world', 'метавселенная', '3D пространство', '元宇宙', 'מטאוורס'],
  forum_feed: ['forum feed', 'post feed', 'лента форума', 'посты в ленте', '论坛动态', 'פיד פורום'],
  forum_threads: ['forum thread', 'topic replies', 'ветка форума', 'тред', '论坛主题', 'שרשור'],
  search: ['Quantum Search', 'site search', 'поиск', 'найти пост', '搜索', 'חיפוש'],
  geodetect: ['GeoDetect', 'location sorting', 'геосортировка', 'геолента', '地理排序', 'זיהוי מיקום'],
  media: ['forum media', 'video feed', 'медиа форума', 'qcast видео', '媒体流', 'מדיה בפורום'],
  moderation: ['moderation', 'appeal', 'жалоба', 'обжалование', '举报', 'דיווח'],
  metamarket: ['MetaMarket', 'gift marketplace', 'метамаркет', 'подарок предмета', '元市场', 'מטאמרקט'],
  quantum_family: ['Quantum Family', 'followers', 'подписчики', 'семья Quantum', '关注者', 'עוקבים'],
  profile: ['profile', 'nickname', 'профиль', 'аватар', '个人资料', 'פרופיל'],
  auth: ['login session', 'authorization', 'авторизация', 'сессия входа', '登录', 'אימות'],
  wallet: ['Quantum Wallet', 'wallet session', 'кошелёк', 'гаманець', '钱包', 'ארנק'],
  telegram: ['Telegram link', 'TMA mini app', 'телеграм привязка', 'мини-апп', '电报', 'טלגרם'],
  qcoin: ['QCoin balance', 'QCoin ledger', 'кьюкоин баланс', 'баланс монет', 'Q币余额', 'יתרת QCoin'],
  payments: ['payment invoice', 'top-up bill', 'платёж', 'инвойс оплаты', '付款', 'חשבונית'],
  vip: ['VIP subscription', 'premium status', 'вип подписка', 'VIP статус', 'VIP 订阅', 'מנוי VIP'],
  ads_packages: ['ad package', 'advertising bundle', 'рекламный пакет', 'пакет продвижения', '广告套餐', 'חבילת פרסום'],
  ads_campaigns: ['ad campaign', 'campaign metrics', 'рекламная кампания', 'показы и клики', '广告活动', 'קמפיין'],
  push: ['push notification', 'native alert', 'пуш уведомление', 'оповещение', '推送通知', 'התראה'],
  messenger: ['Quantum Messenger', 'direct message', 'личные сообщения', 'DM диалог', '私信', 'הודעות פרטיות'],
  quests: ['quest progress', 'reward task', 'квест', 'задание награды', '任务', 'משימה'],
  contact: ['operator contact', 'partnership request', 'контакт с оператором', 'партнёрство', '合作联系', 'שותפות'],
  privacy: ['privacy settings', 'personal data', 'приватность', 'персональные данные', '隐私', 'פרטיות'],
  security: ['account security', 'suspicious activity', 'безопасность аккаунта', 'подозрительная активность', '安全', 'אבטחה'],
  account_deletion: ['account deletion', 'data cleanup', 'удаление аккаунта', 'стереть профиль', '删除账户', 'מחיקת חשבון'],
  navigation: ['navigation', 'where to open', 'навигация', 'куда нажать', '导航', 'ניווט'],
  roadmap: ['roadmap', 'future plans', 'дорожная карта', 'планы развития', '路线图', 'מפת דרכים'],
  system_status: ['system status', 'runtime state', 'статус системы', 'работает ли сервис', '系统状态', 'סטטוס מערכת'],
  localization: ['Deep Translate', 'localization', 'перевод интерфейса', 'локализация', '翻译', 'תרגום'],
  accessibility: ['accessibility', 'screen reader', 'доступность', 'клавиатурная навигация', '无障碍', 'נגישות'],
  learning_governance: ['safe self-learning', 'dialogue improvement', 'самообучение поддержки', 'самокалибровка на диалогах', '安全自学习', 'למידה בטוחה'],
  support_system: ['QL7 Support', 'support assistant', 'поддержка QL7', 'саппорт', '支持系统', 'מערכת תמיכה'],
})

const LOCALE_STYLE = Object.freeze({
  en: {
    slang: ['pls', 'bro', 'idk how to explain this', 'my wording is messy'],
    emotion: ['I am worried', 'I am angry but want a real check', 'I am confused'],
    polite: ['please check calmly', 'could you verify this'],
    warm: ['hey bro, I like how you talk, but help me solve this too', 'can we keep it human and still useful'],
    joke: ['tell one small joke and then help with the support topic', 'a quick clean joke would help before the answer'],
    partner: ['I want to discuss partnership or investment with administration', 'this may be a strategic cooperation request'],
    learning: ['do you learn safely from real chats without one person breaking you', 'explain in simple words how you improve without copying one user'],
  },
  ru: {
    slang: ['плз', 'чёт не понимаю', 'саппорт, глянь', 'по-человечески объясни'],
    emotion: ['я нервничаю', 'я зол, но хочу проверку', 'я запутался'],
    polite: ['пожалуйста проверь спокойно', 'можно аккуратно сверить'],
    warm: ['привет брат, нравится как ты общаешься, но помоги и с делом', 'можем по-человечески и без холода'],
    joke: ['расскажи короткий анекдот и потом помоги по теме поддержки', 'лёгкая шутка перед ответом была бы в тему'],
    partner: ['хочу обсудить партнёрство или инвестиции с администрацией', 'это может быть стратегическое сотрудничество'],
    learning: ['ты безопасно учишься на реальных диалогах без риска сломаться от одного пользователя', 'объясни простыми словами как ты улучшаешься и не копируешь одного человека'],
  },
  uk: {
    slang: ['пліз', 'щось не розумію', 'підтримко, глянь', 'поясни людською мовою'],
    emotion: ['я хвилююся', 'я злюся, але хочу перевірку', 'я заплутався'],
    polite: ['будь ласка перевір спокійно', 'можна акуратно звірити'],
    warm: ['привіт брате, подобається живий тон, але допоможи й по суті', 'можемо людською мовою і без холоду'],
    joke: ['розкажи короткий жарт і потім допоможи з темою підтримки', 'легкий жарт перед відповіддю був би доречний'],
    partner: ['хочу обговорити партнерство або інвестиції з адміністрацією', 'це може бути стратегічна співпраця'],
    learning: ['ти безпечно навчаєшся на реальних діалогах без ризику зламатися від одного користувача', 'поясни простими словами як ти покращуєшся і не копіюєш одну людину'],
  },
  es: {
    slang: ['porfa', 'no sé cómo explicarlo', 'soporte mira esto', 'en palabras simples'],
    emotion: ['estoy preocupado', 'estoy molesto pero quiero una revisión', 'estoy confundido'],
    polite: ['por favor revisa con calma', 'puedes verificarlo'],
    warm: ['hola hermano, me gusta el tono humano, pero ayúdame también con esto', 'podemos hablar cálido y resolverlo'],
    joke: ['cuenta un chiste corto y luego ayúdame con soporte', 'una broma ligera antes de la respuesta estaría bien'],
    partner: ['quiero hablar de colaboración o inversión con la administración', 'esto puede ser una cooperación estratégica'],
    learning: ['aprendes de chats reales sin que una persona pueda romperte', 'explica en palabras simples cómo mejoras sin copiar a una sola persona'],
  },
  tr: {
    slang: ['lütfen bi bak', 'tam anlatamıyorum', 'destek kontrol et', 'basitçe açıkla'],
    emotion: ['endişeliyim', 'sinirliyim ama gerçek kontrol istiyorum', 'kafam karıştı'],
    polite: ['lütfen sakince kontrol et', 'bunu doğrular mısın'],
    warm: ['selam kardeşim, sıcak tonu seviyorum ama bu konuyu da çöz', 'insanca konuşup yine işe yarar kalalım'],
    joke: ['kısa bir şaka yap ve sonra destek konusuna yardım et', 'cevaptan önce hafif bir şaka iyi olur'],
    partner: ['yönetimle ortaklık veya yatırım konuşmak istiyorum', 'bu stratejik iş birliği olabilir'],
    learning: ['gerçek sohbetlerden güvenle öğreniyor musun ve tek kişi seni bozabilir mi', 'tek kişiyi kopyalamadan nasıl geliştiğini basitçe açıkla'],
  },
  ar: {
    slang: ['من فضلك شوف', 'لا أعرف كيف أشرح', 'الدعم تحقق', 'بكلام بسيط'],
    emotion: ['أنا قلق', 'أنا غاضب لكن أريد فحصاً حقيقياً', 'أنا مرتبك'],
    polite: ['يرجى التحقق بهدوء', 'هل يمكنك التأكد'],
    warm: ['مرحباً أخي، يعجبني الأسلوب الإنساني لكن ساعدني في الموضوع أيضاً', 'لنحافظ على دفء الحديث والفائدة معاً'],
    joke: ['احك نكتة قصيرة ثم ساعدني في موضوع الدعم', 'مزحة خفيفة قبل الإجابة ستكون لطيفة'],
    partner: ['أريد مناقشة شراكة أو استثمار مع الإدارة', 'قد يكون هذا طلب تعاون استراتيجي'],
    learning: ['هل تتعلم بأمان من الحوارات الحقيقية دون أن يكسر النظام مستخدم واحد', 'اشرح ببساطة كيف تتحسن دون نسخ شخص واحد'],
  },
  zh: {
    slang: ['麻烦看下', '我不太会说', '客服帮我查', '简单说'],
    emotion: ['我有点担心', '我很生气但想要真实检查', '我搞混了'],
    polite: ['请冷静核对', '可以帮我确认吗'],
    warm: ['你好朋友，我喜欢更有人味的交流，也请帮我解决这个问题', '我们可以保持温暖也保持有效'],
    joke: ['先讲一个短笑话，然后帮我处理支持问题', '回答前来个轻松笑话也不错'],
    partner: ['我想和管理团队讨论合作或投资', '这可能是一个战略合作请求'],
    learning: ['你会从真实对话安全学习吗 一个用户能破坏你吗', '用简单的话解释你如何改进而不是复制一个用户'],
  },
  he: {
    slang: ['בבקשה תבדוק', 'לא יודע להסביר טוב', 'תמיכה תראה', 'במילים פשוטות'],
    emotion: ['אני מודאג', 'אני כועס אבל רוצה בדיקה אמיתית', 'אני מבולבל'],
    polite: ['נא לבדוק ברוגע', 'אפשר לוודא את זה'],
    warm: ['שלום אחי, אני אוהב את הטון האנושי אבל תעזור גם בנושא הזה', 'אפשר לדבר חם ועדיין לפתור'],
    joke: ['ספר בדיחה קצרה ואז עזור לי בנושא התמיכה', 'בדיחה קלילה לפני התשובה תתאים'],
    partner: ['אני רוצה לדבר עם ההנהלה על שותפות או השקעה', 'זו יכולה להיות פנייה לשיתוף פעולה אסטרטגי'],
    learning: ['האם אתה לומד בבטחה מדיאלוגים אמיתיים בלי שמשתמש אחד ישבור אותך', 'הסבר בפשטות איך אתה משתפר בלי להעתיק אדם אחד'],
  },
})

function styleFor(locale = 'en') {
  const base = str(locale).toLowerCase().split(/[-_]/u)[0]
  return LOCALE_STYLE[base] || LOCALE_STYLE.en
}

function typo(value = '', key = '') {
  const source = str(value)
  if (source.length < 6) return source
  const mode = hashInt(`${key}:typo`) % 5
  if (mode === 0) return source.replace(/[aeiouаеёиоуыэюя]/iu, '')
  if (mode === 1) return source.replace(/\s+/u, '')
  if (mode === 2) return `${source.slice(0, 3)}${source[4] || ''}${source[3] || ''}${source.slice(5)}`
  if (mode === 3) return source.replace(/qcoin/iu, 'q cion').replace(/реклам/iu, 'реклм')
  return `${source}???`
}

export function getQl7SupportBattleExpansionStatsV12() {
  const coveredTopics = QL7_SUPPORT_SIMULATION_TOPICS_V11.filter((topic) => Array.isArray(TOPIC_SYNONYMS[topic]) && TOPIC_SYNONYMS[topic].length >= 4)
  const synonymTerms = Object.values(TOPIC_SYNONYMS).reduce((sum, rows) => sum + rows.length, 0)
  const styleTerms = Object.values(LOCALE_STYLE).reduce((sum, groups) => sum + Object.values(groups).reduce((inner, rows) => inner + rows.length, 0), 0)
  return Object.freeze({
    version: QL7_SUPPORT_SEMANTIC_BATTLE_EXPANSION_VERSION_V12,
    topicCount: QL7_SUPPORT_SIMULATION_TOPICS_V11.length,
    coveredTopicCount: coveredTopics.length,
    languageCount: QL7_SUPPORT_SIMULATION_LANGUAGES_V11.length,
    inputModeCount: QL7_SUPPORT_BATTLE_INPUT_MODES_V12.length,
    synonymTerms,
    styleTerms,
    semanticCombinationFloor: coveredTopics.length * QL7_SUPPORT_SIMULATION_LANGUAGES_V11.length * QL7_SUPPORT_BATTLE_INPUT_MODES_V12.length,
    readyForBattlePreflight: coveredTopics.length === QL7_SUPPORT_SIMULATION_TOPICS_V11.length && synonymTerms >= 250,
  })
}

export function buildQl7SupportBattleSemanticInputV12({ text = '', topic = '', locale = 'en', pairIndex = 0, scenarioId = '', turnIndex = 0 } = {}) {
  const cleanTopic = QL7_SUPPORT_SIMULATION_TOPICS_V11.includes(str(topic)) ? str(topic) : 'support_system'
  const key = `${scenarioId}:${pairIndex}:${turnIndex}:${cleanTopic}:${locale}`
  const mode = pick(QL7_SUPPORT_BATTLE_INPUT_MODES_V12, `${key}:mode`)
  const synonyms = TOPIC_SYNONYMS[cleanTopic] || TOPIC_SYNONYMS.support_system
  const synonym = pick(synonyms, `${key}:synonym`)
  const style = styleFor(locale)
  const slang = pick(style.slang, `${key}:slang`)
  const emotion = pick(style.emotion, `${key}:emotion`)
  const polite = pick(style.polite, `${key}:polite`)
  const warm = pick(style.warm || style.slang, `${key}:warm`)
  const joke = pick(style.joke || style.polite, `${key}:joke`)
  const partner = pick(style.partner || style.polite, `${key}:partner`)
  const learning = pick(style.learning || style.polite, `${key}:learning`)
  const original = compact(text)
  let expanded = original

  if (mode === 'synonym_chain') expanded = `${polite}: ${original}. I mean ${synonym}.`
  else if (mode === 'typo_noise') expanded = `${typo(original, key)} ${synonym}`
  else if (mode === 'slang_voice') expanded = `${slang}: ${original} / ${synonym}`
  else if (mode === 'regional_dialect') expanded = `${original}. Local wording: ${slang}; same topic: ${synonym}.`
  else if (mode === 'emotion_overlay') expanded = `${emotion}. ${original}. ${synonym}.`
  else if (mode === 'code_switch') expanded = `${original} / please verify ${synonym} / без лишних служебных данных`
  else if (mode === 'negation_repair') expanded = `Not the previous topic, I mean ${synonym}. ${original}`
  else if (mode === 'confusing_reference') expanded = `This thing from before, the one about ${synonym}; ${original}`
  else if (mode === 'evidence_without_screenshot') expanded = `${original}. I can describe what is visible in words and the approximate time. ${synonym}.`
  else if (mode === 'operator_handoff') expanded = `${original}. If this is material, pass the context to an operator. ${synonym}.`
  else if (mode === 'accessibility_context') expanded = `${original}. Also keep it readable for keyboard navigation and assistive flow. ${synonym}.`
  else if (mode === 'safety_boundary') expanded = `${emotion}; I still need a calm support answer, not a secret dump. ${original}. ${synonym}.`
  else if (mode === 'warm_social') expanded = `${warm}. ${original}. ${synonym}.`
  else if (mode === 'joke_request') expanded = cleanTopic === 'support_system'
    ? `${joke}. ${original}. ${synonym}.`
    : `${warm}. ${original}. ${synonym}.`
  else if (mode === 'partnership_intake') expanded = cleanTopic === 'contact'
    ? `${partner}. ${original}. ${synonym}.`
    : `${polite}: ${original}. ${synonym}.`
  else if (mode === 'learning_self_calibration') expanded = cleanTopic === 'learning_governance'
    ? `${learning}. ${original}. ${synonym}.`
    : `${polite}: ${original}. ${synonym}.`

  return Object.freeze({
    version: QL7_SUPPORT_SEMANTIC_BATTLE_EXPANSION_VERSION_V12,
    classifierOnly: false,
    actualQuestion: true,
    topic: cleanTopic,
    locale: str(locale) || 'en',
    mode,
    synonym,
    originalText: original,
    text: compact(expanded),
    signals: Object.freeze([mode, cleanTopic, str(locale).split(/[-_]/u)[0], synonym].filter(Boolean)),
  })
}

export function assertQl7SupportBattleExpansionReadyV12() {
  const stats = getQl7SupportBattleExpansionStatsV12()
  return Object.freeze({
    ok: stats.readyForBattlePreflight,
    stats,
    missingTopics: Object.freeze(QL7_SUPPORT_SIMULATION_TOPICS_V11.filter((topic) => !TOPIC_SYNONYMS[topic] || TOPIC_SYNONYMS[topic].length < 4)),
  })
}
