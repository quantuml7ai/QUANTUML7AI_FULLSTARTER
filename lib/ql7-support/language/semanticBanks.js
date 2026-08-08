import { ql7Arr, ql7NormalizeSpaces, ql7Str } from '../internal/text.js'

export const QL7_SUPPORT_SEMANTIC_BANK_VERSION = '15.3.2'

export const QL7_SUPPORT_SEMANTIC_EXPANSION_POLICY = Object.freeze({
  version: 'controlled-mutation-expansion-v2',
  guarantees: Object.freeze([
    'diacritics',
    'leet_obfuscation',
    'mixed_script_confusables',
    'space_hyphen_underscore_compaction',
    'single_deletion_typo',
    'adjacent_transposition_typo',
    'stretched_letter_typo',
    'safety_letter_spelling',
    'polite_request_wrappers',
  ]),
  maxGeneratedVariantsPerSeed: 64,
})

export const QL7_SUPPORT_SEMANTIC_BANK_LOCALES = Object.freeze([
  'en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he',
  'de', 'fr', 'it', 'pt', 'pl', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'sk',
  'hu', 'ro', 'bg', 'sr', 'hr', 'sl', 'el', 'ka', 'az', 'kk', 'ja', 'ko',
])

const CATEGORIES = Object.freeze([
  'greetings', 'thanks', 'closure', 'correction', 'denial', 'topicRecall', 'topicResume',
  'howTo', 'dataRequest', 'complaints', 'emotional', 'slang', 'cryptoSlang', 'forumSlang',
  'profanity', 'euphemisms', 'directInsults', 'threats', 'business', 'investment',
  'mergedWords', 'typos', 'layoutHints', 'voiceLike',
])

const TOPIC_ALIASES = Object.freeze({
  platform: ['quantum l7 ai', 'ql7 ecosystem', 'ql7 platform', 'экосистема ql7', 'платформа ql7', 'екосистема ql7', 'ecosistema ql7', 'ql7 ekosistemi', 'منظومة ql7', 'ql7 生态', 'מערכת ql7'],
  homepage: ['homepage', 'home page', 'crypto radar', 'cryptoradar', 'main radar', 'главная', 'главная страница', 'крипторадар', 'головна', 'радар крипты', 'radar crypto', '主页雷达'],
  news: ['crypto news', 'market news', 'новости крипты', 'крипто новости', 'новини крипти', 'noticias crypto', 'kripto haberleri', 'أخبار العملات', '加密新闻', 'חדשות קריפטו'],
  exchange: ['quantum exchange', 'exchange', 'market chart', 'order book', 'orderbook', 'биржа', 'стакан', 'график рынка', 'біржа', 'ринковий графік', 'bolsa crypto', 'borsa grafiği', 'سجل الأوامر', '交易所', 'ספר פקודות'],
  exchange_ai: ['ai box', 'aibox', 'ai-box', 'ai recomendation', 'ai recommendation', 'exchange ai', 'exchange ai analytics', 'exchange ai analitics', 'ai workbench', 'ai signal', 'crypto ai check', 'market explanation', 'bitcoin prospects', 'btc prospects', 'биток перспективы', 'перспективы битка', 'ии бокс', 'ай бокс', 'ai аналитика', 'прогноз монеты', 'ai аналіз', 'señal ai', 'recomendacion ai', 'ai kutusu', 'توصية ai', 'ai 盒子', 'ניתוח ai'],
  battlecoin: ['battlecoin', 'battle coin', 'battlecoinic', 'battle coinn', 'battle-coin', 'battle token', 'батлкоин', 'батл коин', 'батлкоиник', 'баттлкоин', 'битва монет', 'батлкоїн', 'coin battle', '战斗币', 'באטלקוין'],
  battle_chat: ['battle chat', 'battlechat', 'battlechatik', 'battle chatic', 'battle room', 'battle reactions', 'батл чат', 'батлчатик', 'чат битвы', 'бойовий чат', 'chat batalla', 'savaş sohbeti', 'دردشة المعركة', '战斗聊天', 'צאט קרב'],
  futures: ['futures', 'future simulator', 'leverage', 'liquidation', 'фьючерсы', 'фьючи', 'ликвидация', 'плечо', 'фʼючерси', 'futuros', 'kaldıraç', 'العقود الآجلة', '期货', 'חוזים עתידיים'],
  academy: ['academy', 'learning course', 'lesson', 'course', 'академия', 'урок', 'курс', 'академія', 'lección', 'curso', 'akademi', 'درس', '学院', 'אקדמיה'],
  academy_exam: ['academy exam', 'exam score', 'certificate', 'экзамен академии', 'сертификат', 'іспит академії', 'examen academy', 'sınav', 'اختبار الأكاديمية', '学院考试', 'בחינת אקדמיה'],
  gameverse: ['gameverse', 'ql7 gameverse', 'game verse', 'gamevers', 'геймверс', 'геймверсе', 'игровая вселенная', 'ігровий світ', 'game world', '游戏宇宙', 'גיימברס'],
  metastudio: ['metastudio', 'meta studio', 'creator studio', 'студия мета', 'метастудио', 'метастудія', 'креаторская', 'estudio meta', 'içerik stüdyosu', 'استوديو ميتا', '元工作室', 'מטא סטודיו'],
  metaverse: ['metaverse', 'quantum universe', 'virtual world', 'метавселенная', 'квантовая вселенная', 'метавсесвіт', 'universo virtual', 'metaverse dünyası', 'العالم الافتراضي', '元宇宙', 'מטאוורס'],
  forum_feed: ['forum feed', 'feed', 'post feed', 'лента форума', 'лента', 'стрічка форуму', 'форумная лента', 'foro feed', '论坛动态', 'פיד פורום'],
  forum_threads: ['forum thread', 'thread', 'topic branch', 'reply chain', 'ветка форума', 'тред', 'гілка форуму', 'hilo foro', 'konu dizisi', 'موضوع المنتدى', '论坛主题', 'שרשור פורום'],
  search: ['search', 'find user', 'find post', 'поиск', 'поиск людей', 'найти пост', 'пошук', 'buscar usuario', 'arama', 'بحث', '搜索', 'חיפוש'],
  geodetect: ['geodetect', 'geo detect', 'geo mode', 'local feed', 'геодетект', 'гео режим', 'локальная лента', 'гео', 'geodetección', 'geo algılama', 'تحديد الموقع', '地理检测', 'זיהוי גיאוגרפי'],
  media: ['media upload', 'upload video', 'upload photo', 'audio upload', 'загрузка медиа', 'видео не грузится', 'фото не грузится', 'медіа', 'subir video', 'medya yükleme', 'رفع فيديو', '媒体上传', 'העלאת מדיה'],
  quantum_family: ['quantum family', 'family graph', 'followers graph', 'квантовая семья', 'семья ql7', 'квантова сімʼя', 'familia quantum', 'quantum ailesi', 'عائلة quantum', '量子家族', 'משפחת קוונטום'],
  qcoin: ['qcoin', 'q coin', 'q-coin', 'qcoim', 'qconi', 'qcoinn', 'q cion', 'my qcoin', 'my qcoin balance', 'qcoin funds', 'qcoin wallet', 'кьюкоин', 'кюкоин', 'кью coin', 'кьюкоиник', 'мой qcoin', 'мой кьюкоин', 'балик qcoin', 'монеты qcoin', 'счёт qcoin', 'рахунок qcoin', 'q币', 'q幣', 'קיו קוין', 'رصيد qcoin', 'qcoin balance', 'saldo qcoin', 'qcoin bakiye', 'qcoin guthaben', 'qcoin disappeared', 'qcoin missing', 'пропал qcoin', 'украли qcoin', 'зник qcoin'],
  wallet: ['wallet', 'quantum wallet', 'walletconnect', 'connect wallet', 'кошелек', 'кошелёк', 'квантовый кошелек', 'гаманець', 'billetera', 'cüzdan', 'محفظة', '钱包', 'ארנק'],
  ads_packages: ['ad package', 'ad packages', 'ads package', 'ads packages', 'advertising package', 'advertising packages', 'рекламный пакет', 'пакет рекламы', 'рекламний пакет', 'paquete publicitario', 'reklam paketi', 'حزمة إعلانية', '广告套餐', 'חבילת פרסום', 'купити рекламу', 'як купити рекламу', 'شراء الإعلان', 'أشتري الإعلان', 'حزمتي الإعلانية', 'باقتي الإعلانية', 'רוכשים פרסום', 'יתרונות הפרסום'],
  ads_campaigns: ['ad campaign', 'ads campaign', 'ads metrics', 'my ads', 'my advertising', 'campaign metrics', 'campaign performance', 'ctr', 'impressions', 'ad views', 'ad clicks', 'рекламная кампания', 'моя реклама', 'метрики рекламы', 'статистика рекламы', 'показы рекламы', 'клики рекламы', 'кампанія реклами', 'моя реклама', 'campaña', 'campagne', 'kampanya', 'حملة إعلانية', '广告活动', 'קמפיין פרסום'],
  forum: ['forum', 'форум', 'форуме', 'форумі', 'thread', 'тред', 'ветка', 'гілка', 'post feed', 'лента форума', 'foro', 'forumdaki', 'منتدى', '论坛', 'פורום'],
  profile: ['profile', 'account profile', 'профиль', 'профіль', 'никнейм', 'avatar', 'perfil', 'profil', 'الملف الشخصي', '个人资料', 'פרופיל'],
  auth: ['authorization', 'authentication', 'auth', 'login', 'sign in', 'wallet session', 'авторизация', 'вход', 'сессия кошелька', 'авторизація', 'sesión', 'iniciar sesión', 'giriş', 'تسجيل الدخول', '登录', 'התחברות'],
  vip: ['vip', 'vip plus', 'вип', 'віп', 'premium status', 'subscription', 'подписка', 'підписка', 'suscripción', 'abonelik', 'اشتراك', '订阅', 'מנוי'],
  payments: ['payment', 'invoice', 'checkout', 'оплата', 'платеж', 'платёж', 'платіж', 'pago', 'pagamento', 'zahlung', 'ödeme', 'دفع', '支付', 'תשלום'],
  metamarket: ['metamarket', 'meta market', 'meta-market', 'metamarket purchase', 'metamarket gift', 'метамаркет', 'мета маркет', 'покупка предмета', 'подарок', 'коллекция', 'marketplace', 'сувенир ql7', 'meta mercado', 'meta pazar', 'سوق ميتا', '元市场', 'מטאמרקט'],
  push: ['push notifications', 'push', 'notification bell', 'пуш', 'уведомления', 'сповіщення', 'notificaciones', 'bildirimler', 'إشعارات', '推送通知', 'התראות'],
  messenger: ['quantum messenger', 'messenger', 'dm', 'direct message', 'личные сообщения', 'личка', 'приватні повідомлення', 'mensajes directos', 'dm sohbet', 'رسائل خاصة', '私信', 'הודעות פרטיות'],
  quests: ['quantum quest', 'quest', 'quests', 'zigzag quest', 'quantum zigzag', 'квест', 'квантум квест', 'зигзаг', 'квантовий квест', 'misión quantum', 'görev', 'مهام', '任务', 'קווסט'],
  contact: ['contact team', 'contact support', 'operator contact', 'связаться с командой', 'связь с оператором', 'звʼязок з командою', 'contacto equipo', 'ekiple iletişim', 'اتصل بالفريق', '联系团队', 'יצירת קשר'],
  privacy: ['privacy', 'data privacy', 'private data', 'конфиденциальность', 'приватность', 'личные данные', 'конфіденційність', 'privacidad', 'gizlilik', 'خصوصية', '隐私', 'פרטיות'],
  telegram: ['telegram', 'tg link', 'tma', 'mini app', 'телеграм', 'телеграмм', 'تيليغرام', '电报', 'טלגרם'],
  moderation: ['moderation', 'report post', 'complaint', 'appeal', 'жалоба', 'скарга', 'обжалование', 'модерация', 'queja', 'apelación', 'şikayet', 'بلاغ', '投诉', '举报帖子', '谁举报', '谁举报了我的帖子', 'оскаржити видалення допису', 'استئناف قرار حذف المنشور', 'ערעור על מחיקת הפוסט', 'Gönderi silme kararına itiraz', '申诉帖子被删除', 'ערעור'],
  security: ['security', 'hack', 'token', 'private key', 'seed phrase', 'phishing', 'scam', 'fraud', 'wallet drain', 'balance stolen', 'безопасность', 'взлом', 'токен', 'приватный ключ', 'фишинг', 'скам', 'украли баланс', 'güvenlik', 'الأمان', '安全', 'אבטחה'],
  account_deletion: ['delete account', 'account deletion', 'erase profile', 'удалить аккаунт', 'удаление аккаунта', 'видалити акаунт', 'borrar cuenta', 'hesabı sil', 'حذف الحساب', '删除账户', 'מחיקת חשבון'],
  navigation: ['navigation', 'route', 'open page', 'deep link', 'навигация', 'куда нажать', 'маршрут', 'навігація', 'navegación', 'gezinme', 'تنقل', '导航', 'ניווט'],
  roadmap: ['roadmap', 'future feature', 'launch date', 'дорожная карта', 'когда запустят', 'планы', 'дорожня карта', 'hoja de ruta', 'yol haritası', 'خارطة الطريق', '路线图', 'מפת דרכים'],
  system_status: ['system status', 'runtime status', 'maintenance', 'статус системы', 'техработы', 'состояние сервиса', 'стан системи', 'estado sistema', 'sistem durumu', 'حالة النظام', '系统状态', 'מצב מערכת'],
  localization: ['localization', 'deep translate', 'translation', 'перевод', 'локализация', 'переклад', 'localización', 'çeviri', 'ترجمة', '翻译', 'תרגום'],
  accessibility: ['accessibility', 'screen reader', 'contrast', 'доступность', 'контраст', 'екранний читач', 'accesibilidad', 'erişilebilirlik', 'إتاحة', '无障碍', 'נגישות'],
  partnership: ['partnership', 'cooperation', 'collaboration', 'commercial proposal', 'партнерство', 'партнёрство', 'сотрудничество', 'співпраця', 'colaboración', 'ortaklık', 'شراكة', '合作', 'שותפות'],
  investment: ['investment proposal', 'investment', 'investor', 'funding', 'equity', 'инвестиционное предложение', 'инвестиции', 'инвестор', 'інвестиції', 'inversión', 'yatırım', 'استثمار', '投资', 'השקעה'],
  learning_governance: ['learning governance', 'training control', 'model learning', 'poisoning review', 'управление обучением', 'обучается на диалогах', 'безопасное обучение', 'керування навчанням', 'gobernanza aprendizaje', 'öğrenme yönetişimi', 'حوكمة التعلم', '学习治理', 'ממשל למידה'],
  support_system: ['support', 'ql7 support', 'operator', 'help desk', 'поддержка', 'саппорт', 'оператор', 'живой оператор', 'суппорт', 'soporte', 'destek', 'دعم', '客服', 'תמיכה'],
})

const WRAPPED_CATEGORIES = Object.freeze(new Set([
  'howTo', 'dataRequest', 'complaints', 'topicRecall', 'topicResume', 'business', 'investment',
]))
const SAFETY_CATEGORIES = Object.freeze(new Set(['profanity', 'euphemisms', 'directInsults', 'threats']))
const POLITE_PREFIXES = Object.freeze(['please', 'pls', 'plz', 'bro', 'support', 'help', 'quick', 'can you', 'could you'])
const POLITE_SUFFIXES = Object.freeze(['please', 'pls', 'plz', 'bro', 'support', 'now', 'asap'])
const LEET_PAIRS = Object.freeze([['a', '@'], ['a', '4'], ['e', '3'], ['i', '1'], ['o', '0'], ['s', '5'], ['s', '$'], ['t', '7']])
const LATIN_CONFUSABLES = Object.freeze({ a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', x: 'х', y: 'у' })
const CYRILLIC_OBFUSCATION_PAIRS = Object.freeze([
  ['а', '@'], ['а', 'a'], ['е', '3'], ['е', 'e'], ['ё', 'е'], ['о', '0'], ['о', 'o'],
  ['с', 'c'], ['х', 'x'], ['у', 'y'], ['и', 'u'], ['б', '6'], ['з', '3'], ['ч', '4'],
])
const CYRILLIC_CONFUSABLES = Object.freeze({ а: 'a', е: 'e', ё: 'e', о: 'o', с: 'c', х: 'x', у: 'y', р: 'p', к: 'k', м: 'm', т: 't' })

function pushTerm(out, value = '') {
  const term = ql7NormalizeSpaces(ql7Str(value))
  if (term.length >= 3) out.push(term)
}

function replaceFirstAll(value = '', from = '', to = '') {
  return value.includes(from) ? value.split(from).join(to) : value
}

function typoVariants(term = '') {
  const clean = ql7NormalizeSpaces(term)
  const compact = clean.replace(/[^\p{L}\p{N}]+/gu, '')
  if (compact.length < 4 || compact.length > 22) return []
  const points = Array.from(new Set([1, Math.floor(compact.length / 2), compact.length - 2]))
  const variants = []
  for (const index of points) {
    if (index > 0 && index < compact.length) variants.push(`${compact.slice(0, index)}${compact.slice(index + 1)}`)
  }
  const swap = Math.max(1, Math.min(compact.length - 2, Math.floor(compact.length / 2)))
  variants.push(`${compact.slice(0, swap)}${compact[swap + 1]}${compact[swap]}${compact.slice(swap + 2)}`)
  variants.push(`${compact.slice(0, swap)}${compact[swap]}${compact.slice(swap)}`)
  return variants
}

function termVariants(category = '', raw = '') {
  const base = ql7NormalizeSpaces(ql7Str(raw))
  if (!base) return []
  const out = [base]
  const lower = base.toLowerCase()
  pushTerm(out, lower)
  const deaccented = lower.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  pushTerm(out, deaccented)
  const compact = lower.replace(/[\s\-_]+/gu, '')
  pushTerm(out, compact)
  if (/\s/u.test(lower)) {
    pushTerm(out, lower.replace(/\s+/gu, '-'))
    pushTerm(out, lower.replace(/\s+/gu, '_'))
    if (WRAPPED_CATEGORIES.has(category)) {
      for (const prefix of POLITE_PREFIXES) pushTerm(out, `${prefix} ${lower}`)
      for (const suffix of POLITE_SUFFIXES) pushTerm(out, `${lower} ${suffix}`)
    }
  }
  if (/[a-z]/u.test(lower)) {
    for (const [from, to] of LEET_PAIRS) pushTerm(out, replaceFirstAll(lower, from, to))
    const combinedLeet = lower.replace(/[aeiost]/gu, (char) => ({
      a: '4', e: '3', i: '1', o: '0', s: '5', t: '7',
    })[char] || char)
    pushTerm(out, combinedLeet)
    const mixed = lower.replace(/[aceopxy]/gu, (char) => LATIN_CONFUSABLES[char] || char)
    pushTerm(out, mixed)
    pushTerm(out, lower.replace(/ck/gu, 'k'))
    pushTerm(out, lower.replace(/ph/gu, 'f'))
    if (SAFETY_CATEGORIES.has(category)) {
      pushTerm(out, lower.replace(/u/gu, 'oo'))
      pushTerm(out, lower.replace(/u/gu, '00'))
      pushTerm(out, lower.replace(/oo/gu, '00'))
    }
  }
  if (SAFETY_CATEGORIES.has(category) && /[а-яёіїєґ]/u.test(lower)) {
    for (const [from, to] of CYRILLIC_OBFUSCATION_PAIRS) pushTerm(out, replaceFirstAll(lower, from, to))
    const mixedCyrillic = lower.replace(/[аеёосхуркмт]/gu, (char) => CYRILLIC_CONFUSABLES[char] || char)
    pushTerm(out, mixedCyrillic)
  }
  for (const variant of typoVariants(lower)) pushTerm(out, variant)
  if (SAFETY_CATEGORIES.has(category)) {
    const letters = Array.from(compact)
    if (letters.length >= 4 && letters.length <= 18) {
      pushTerm(out, letters.join(' '))
      pushTerm(out, letters.join('-'))
      pushTerm(out, letters.join('.'))
    }
  }
  return Array.from(new Set(out)).slice(0, QL7_SUPPORT_SEMANTIC_EXPANSION_POLICY.maxGeneratedVariantsPerSeed)
}

function freezeBank(row) {
  const out = {}
  for (const category of CATEGORIES) out[category] = Object.freeze(Array.from(new Set(
    ql7Arr(row?.[category]).flatMap((term) => termVariants(category, term)),
  )))
  return Object.freeze(out)
}

function mergeBanks(...banks) {
  const out = {}
  for (const category of CATEGORIES) {
    out[category] = Object.freeze(Array.from(new Set(banks.flatMap((bank) => ql7Arr(bank?.[category])))))
  }
  return Object.freeze(out)
}

const BANKS = Object.freeze({
  en: freezeBank({
    greetings: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'yo support', 'need help here'],
    thanks: ['thanks', 'thank you', 'thx', 'appreciate it', 'that helped', 'nice one'],
    closure: ['bye', 'goodbye', 'see you', 'that is all', 'close this', 'we are done'],
    correction: ['actually', 'i mean', 'not that', 'wrong topic', 'correction', 'let me rephrase'],
    denial: ['no', 'nope', 'not this', 'not qcoin', 'not ads', 'i did not mean that'],
    topicRecall: ['what did we talk about', 'what were we discussing', 'remind me the topic', 'where did we stop', 'recall our conversation'],
    topicResume: ['back to it', 'continue that', 'resume the topic', 'return to forum', 'go back to qcoin'],
    howTo: ['how to', 'how do i', 'where do i click', 'how does it work', 'walk me through', 'step by step'],
    dataRequest: ['show my', 'check my', 'verify my', 'my status', 'my balance', 'what is my current'],
    complaints: ['does not work', 'broken again', 'stuck processing', 'nothing loads', 'bad answer', 'wrong data'],
    emotional: ['i feel awful', 'i am lonely', 'i am scared', 'i need to talk', 'people bully me', 'i might relapse', 'someone died'],
    slang: ['pls', 'plz', 'kinda', 'idk', 'gotcha', 'bro', 'buddy', 'yo'],
    cryptoSlang: ['rekt', 'gas fee', 'wallet drain', 'ledger mismatch', 'on-chain', 'airdrop', 'pending tx'],
    forumSlang: ['thread', 'feed', 'reply chain', 'post got nuked', 'mod queue', 'shadow ban'],
    profanity: ['fuck', 'fucking', 'shit', 'bullshit', 'asshole', 'idiot', 'moron', 'dumb', 'stupid', 'jerk', 'useless', 'crap'],
    euphemisms: ['fck', 'f*ck', 'sh1t', 'sht', 'dang', 'what the hell'],
    directInsults: ['you are an idiot', 'you are stupid', 'fuck off', 'go to hell', 'useless support'],
    threats: ['i will attack', 'i will hack', 'i will kill', 'bomb the system', 'ddos you', 'destroy the service'],
    business: ['partnership', 'business proposal', 'commercial offer', 'operator contact', 'strategic contact', 'collaboration'],
    investment: ['investment', 'investor', 'funding', 'valuation', 'equity proposal', 'term sheet'],
    mergedWords: ['showmybalance', 'checkmystatus', 'helpmefix', 'howtouseforum', 'qcoinmissing', 'adsbroken'],
    typos: ['qcoim', 'qconi', 'qcoinn', 'balanse', 'statuz', 'campain', 'walet', 'suport'],
    layoutHints: ['йсщшт', 'цфддуе', 'ыезщк', 'йсшту'],
    voiceLike: ['uh i need help', 'listen i cannot log in', 'so basically it broke', 'one sec i mean'],
  }),
  ru: freezeBank({
    greetings: ['привет', 'прив', 'здравствуйте', 'добрый день', 'доброе утро', 'дарова', 'салют', 'на связи'],
    thanks: ['спасибо', 'спс', 'благодарю', 'выручил', 'помогло', 'красавчик'],
    closure: ['пока', 'до связи', 'закрой тему', 'всё спасибо', 'больше ничего', 'завершим'],
    correction: ['нет я имел в виду', 'точнее', 'не это', 'исправь', 'я про другое', 'переформулирую'],
    denial: ['нет', 'неа', 'не qcoin', 'не реклама', 'не про это', 'не так понял'],
    topicRecall: ['о чем мы говорили', 'о чём мы говорили', 'что мы обсуждали', 'напомни тему', 'где остановились', 'вспомни разговор'],
    topicResume: ['вернемся к этому', 'вернёмся к этому', 'продолжим тему', 'назад к форуму', 'назад к балансу'],
    howTo: ['как пользоваться', 'как открыть', 'куда нажать', 'объясни шаги', 'проведи пошагово', 'как работает'],
    dataRequest: ['покажи мой', 'проверь мой', 'мой статус', 'мой баланс', 'сколько у меня', 'активен ли мой'],
    complaints: ['не работает', 'зависло', 'вечная обработка', 'не отправляется', 'данные неверные', 'сломалось'],
    emotional: ['мне плохо', 'мне тяжело', 'меня буллят', 'меня хейтят', 'боюсь сорваться', 'хочу поговорить', 'умер близкий', 'одиноко'],
    slang: ['плиз', 'пж', 'чекни', 'окей', 'жесть', 'крашится', 'лагает', 'бро'],
    cryptoSlang: ['слили кошелек', 'пропал баланс', 'транза висит', 'леджер не сходится', 'дроп', 'газ', 'скам'],
    forumSlang: ['тред', 'ветка', 'лента', 'реплай', 'пост снесли', 'модерка', 'теневой бан'],
    profanity: ['бля', 'блядь', 'сука', 'хуй', 'нахуй', 'пиздец', 'ебаный', 'ёбаный', 'мудак', 'дебил', 'идиот', 'долбоеб', 'долбоёб', 'тупой', 'урод'],
    euphemisms: ['блин', 'блэт', 'хyй', 'xyй', 'пздц', 'епта', 'ёпт', 'сцк', 'мда капец'],
    directInsults: ['ты идиот', 'ты дебил', 'вы идиоты', 'саппорт тупой', 'ты бесполезный', 'пошел нахуй'],
    threats: ['я атакую систему', 'я взломаю', 'я убью', 'я уничтожу', 'ддос', 'взорву', 'кибератака'],
    business: ['партнерство', 'партнёрство', 'сотрудничество', 'бизнес предложение', 'связаться с оператором', 'коммерческий запрос'],
    investment: ['инвестиции', 'инвестор', 'вложиться', 'оценка компании', 'доля', 'инвест предложение'],
    mergedWords: ['покажибаланс', 'проверьстатус', 'какотправитьжалобу', 'хочупоговорить', 'меняхейтят', 'немогувойти', 'qcoinпропал', 'adsнеработает'],
    typos: ['кюкоин', 'кьюкоин', 'балансс', 'статуз', 'рекламма', 'кошелк', 'сапорт', 'форрум'],
    layoutHints: ['ghbdtn', 'gfrtn', 'rjitytr', 'fylhjq'],
    voiceLike: ['слушай помоги', 'короче у меня', 'ну типа не работает', 'я голосом скажу'],
  }),
  uk: freezeBank({
    greetings: ['привіт', 'вітаю', 'добрий день', 'доброго ранку', 'салют', 'на зв’язку'],
    thanks: ['дякую', 'дякс', 'спасибі', 'вдячний', 'допомогло', 'класно'],
    closure: ['бувай', 'до зв’язку', 'закрий тему', 'усе дякую', 'завершимо'],
    correction: ['ні я мав на увазі', 'точніше', 'не це', 'виправ', 'я про інше'],
    denial: ['ні', 'неа', 'не qcoin', 'не реклама', 'не про це'],
    topicRecall: ['про що ми говорили', 'що ми обговорювали', 'нагадай тему', 'де зупинились'],
    topicResume: ['повернімося до цього', 'продовжимо тему', 'назад до форуму', 'назад до балансу'],
    howTo: ['як користуватися', 'як відкрити', 'куди натиснути', 'поясни кроки', 'як працює'],
    dataRequest: ['покажи мій', 'перевір мій', 'мій статус', 'мій баланс', 'скільки в мене'],
    complaints: ['не працює', 'зависло', 'не надсилається', 'дані неправильні', 'зламалось'],
    emotional: ['мені погано', 'мені важко', 'мене буллять', 'мене хейтять', 'боюся зірватися', 'хочу поговорити', 'помер близький'],
    slang: ['будь ласка', 'чекни', 'жесть', 'лагає', 'бро', 'окей'],
    cryptoSlang: ['злили гаманець', 'зник баланс', 'транзакція висить', 'леджер не сходиться', 'скам'],
    forumSlang: ['тред', 'гілка', 'стрічка', 'реплай', 'допис знесли', 'модерка'],
    profanity: ['бля', 'блядь', 'сука', 'хуй', 'нахуй', 'пиздець', 'їбаний', 'єбаний', 'мудак', 'дебіл', 'ідіот', 'довбойоб', 'тупий'],
    euphemisms: ['блін', 'блєт', 'пздц', 'йопт', 'капєц'],
    directInsults: ['ти ідіот', 'ти дебіл', 'ви ідіоти', 'сапорт тупий', 'пішов нахуй'],
    threats: ['я атакую систему', 'я зламаю', 'я вб’ю', 'я знищу', 'ддос', 'підірву'],
    business: ['партнерство', 'співпраця', 'бізнес пропозиція', 'комерційний запит'],
    investment: ['інвестиції', 'інвестор', 'вкластися', 'оцінка компанії', 'частка'],
    mergedWords: ['покажибаланс', 'перевірстатус', 'якподатискаргу', 'хочупоговорити', 'менехейтять', 'неможуувійти'],
    typos: ['кюкоін', 'баланc', 'статуз', 'рекламма', 'сапорт'],
    layoutHints: ['ghbdsn', 'lfzre.', 'rjitybr'],
    voiceLike: ['слухай допоможи', 'коротше в мене', 'ну типу не працює'],
  }),
  es: freezeBank({
    greetings: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'qué tal', 'necesito ayuda'],
    thanks: ['gracias', 'muchas gracias', 'se agradece', 'me ayudó', 'perfecto'],
    closure: ['adiós', 'hasta luego', 'cerramos', 'eso es todo', 'terminemos'],
    correction: ['no quise decir eso', 'me refiero a', 'corrección', 'en realidad', 'no eso'],
    denial: ['no', 'no qcoin', 'no anuncios', 'no era eso', 'no me entendiste'],
    topicRecall: ['de qué hablábamos', 'qué estábamos viendo', 'recuérdame el tema', 'dónde quedamos'],
    topicResume: ['volvamos a eso', 'continuemos el tema', 'regresa al foro', 'regresa al saldo'],
    howTo: ['cómo usar', 'cómo abrir', 'dónde hago clic', 'paso a paso', 'cómo funciona'],
    dataRequest: ['muestra mi', 'verifica mi', 'mi estado', 'mi saldo', 'cuánto tengo'],
    complaints: ['no funciona', 'se quedó procesando', 'no carga', 'datos incorrectos', 'se rompió'],
    emotional: ['me siento mal', 'estoy solo', 'me hacen bullying', 'tengo miedo', 'necesito hablar', 'murió alguien cercano'],
    slang: ['porfa', 'pls', 'checa', 'bro', 'va', 'bugueado'],
    cryptoSlang: ['wallet drenada', 'saldo desapareció', 'transacción pendiente', 'ledger no cuadra', 'scam'],
    forumSlang: ['hilo', 'feed', 'respuesta', 'post borrado', 'cola de moderación'],
    profanity: ['puta', 'mierda', 'joder', 'idiota', 'imbécil', 'estúpido', 'tonto', 'gilipollas', 'cabrón', 'basura'],
    euphemisms: ['mrd', 'jdr', 'p*ta', 'maldita sea', 'qué demonios'],
    directInsults: ['eres idiota', 'soporte inútil', 'vete a la mierda', 'son estúpidos'],
    threats: ['voy a atacar el sistema', 'voy a hackear', 'te voy a matar', 'ddos', 'bomba'],
    business: ['asociación', 'colaboración', 'propuesta comercial', 'contacto de negocio'],
    investment: ['inversión', 'inversor', 'financiación', 'valoración', 'participación'],
    mergedWords: ['muestramisaldo', 'verificamiestado', 'quierohablar', 'qcoindesaparecio', 'adsnofunciona'],
    typos: ['qcoim', 'saldoo', 'campana', 'soprte', 'balanze'],
    layoutHints: ['ñlñ', 'qcoinñ'],
    voiceLike: ['oye ayuda', 'mira no funciona', 'o sea se quedó trabado'],
  }),
  tr: freezeBank({
    greetings: ['merhaba', 'selam', 'günaydın', 'iyi akşamlar', 'yardım lazım', 'hey destek'],
    thanks: ['teşekkürler', 'sağ ol', 'eyvallah', 'yardım etti', 'harika'],
    closure: ['görüşürüz', 'tamam bitti', 'konuyu kapat', 'hepsi bu'],
    correction: ['hayır onu demedim', 'demek istediğim', 'düzeltme', 'aslında', 'o değil'],
    denial: ['hayır', 'qcoin değil', 'reklam değil', 'o değil', 'yanlış anladın'],
    topicRecall: ['ne konuşuyorduk', 'hangi konudaydık', 'konuyu hatırlat', 'nerede kalmıştık'],
    topicResume: ['ona dönelim', 'konuya devam', 'foruma dön', 'bakiyeye dön'],
    howTo: ['nasıl kullanılır', 'nasıl açılır', 'nereye tıklayacağım', 'adım adım', 'nasıl çalışır'],
    dataRequest: ['benim durumumu göster', 'benim bakiyemi kontrol et', 'hesabımı kontrol et', 'bende ne var'],
    complaints: ['çalışmıyor', 'işleniyor kaldı', 'yüklenmiyor', 'veri yanlış', 'bozuldu'],
    emotional: ['çok kötüyüm', 'yalnızım', 'bana zorbalık yapıyorlar', 'korkuyorum', 'konuşmak istiyorum'],
    slang: ['pls', 'kanka', 'abi', 'bi bak', 'buglandı', 'takıldı'],
    cryptoSlang: ['cüzdan boşaldı', 'bakiye kayboldu', 'işlem bekliyor', 'ledger tutmuyor', 'scam'],
    forumSlang: ['thread', 'akış', 'yanıt', 'post silindi', 'mod kuyruğu'],
    profanity: ['siktir', 'orospu', 'bok', 'salak', 'aptal', 'gerizekalı', 'mal', 'piç', 'lanet'],
    euphemisms: ['sktir', 'b*k', 'aptl', 'hay aksi'],
    directInsults: ['sen aptalsın', 'sen salaksın', 'destek işe yaramaz', 'siktir git'],
    threats: ['sisteme saldıracağım', 'hackleyeceğim', 'seni öldürürüm', 'ddos', 'bomba'],
    business: ['ortaklık', 'iş birliği', 'ticari teklif', 'operatörle görüşmek'],
    investment: ['yatırım', 'yatırımcı', 'finansman', 'değerleme', 'hisse'],
    mergedWords: ['bakiyemigoster', 'durumukontrolet', 'konusmakistiyorum', 'qcoinkayboldu', 'reklamcalismiyor'],
    typos: ['qcoim', 'bakye', 'kampnya', 'destk', 'durm'],
    layoutHints: ['ıi', 'ğg', 'şs'],
    voiceLike: ['bak yardım et', 'şey çalışmıyor', 'yani takılı kaldı'],
  }),
  ar: freezeBank({
    greetings: ['مرحبا', 'أهلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير', 'أحتاج مساعدة'],
    thanks: ['شكرا', 'شكرًا', 'ممتن', 'ساعدني ذلك', 'تمام'],
    closure: ['مع السلامة', 'إلى اللقاء', 'أغلق الموضوع', 'هذا كل شيء'],
    correction: ['لا أقصد ذلك', 'أقصد', 'تصحيح', 'في الحقيقة', 'ليس هذا'],
    denial: ['لا', 'ليس qcoin', 'ليست إعلانات', 'ليس هذا', 'لم تفهمني'],
    topicRecall: ['عم كنا نتحدث', 'ما الموضوع السابق', 'ذكرني بالموضوع', 'أين توقفنا'],
    topicResume: ['لنعد إلى ذلك', 'تابع الموضوع', 'ارجع للمنتدى', 'ارجع للرصيد'],
    howTo: ['كيف أستخدم', 'كيف أفتح', 'أين أضغط', 'خطوة بخطوة', 'كيف يعمل'],
    dataRequest: ['اعرض حسابي', 'تحقق من رصيدي', 'حالتي', 'كم لدي', 'افحص بياناتي'],
    complaints: ['لا يعمل', 'علق على المعالجة', 'لا يتم التحميل', 'البيانات خطأ', 'تعطل'],
    emotional: ['أشعر بالسوء', 'أنا وحيد', 'يتنمرون علي', 'أنا خائف', 'أحتاج إلى الحديث'],
    slang: ['لو سمحت', 'بليز', 'تمام', 'علّق', 'فيه خطأ'],
    cryptoSlang: ['المحفظة فرغت', 'الرصيد اختفى', 'المعاملة معلقة', 'السجل غير مطابق', 'احتيال'],
    forumSlang: ['موضوع', 'خلاصة', 'رد', 'تم حذف المنشور', 'طابور الإشراف'],
    profanity: ['لعنة', 'تبا', 'تباً', 'غبي', 'أحمق', 'كلب', 'حقير', 'اخرس', 'حمار', 'قذر'],
    euphemisms: ['تب', 'يا ساتر', 'ما هذا الهراء'],
    directInsults: ['أنت غبي', 'أنت أحمق', 'الدعم عديم الفائدة', 'اذهب إلى الجحيم'],
    threats: ['سأهاجم النظام', 'سأخترق', 'سأقتلك', 'تفجير', 'قنبلة'],
    business: ['شراكة', 'تعاون', 'عرض تجاري', 'تواصل مع موظف'],
    investment: ['استثمار', 'مستثمر', 'تمويل', 'تقييم الشركة', 'حصة'],
    mergedWords: ['اعرضرصيدي', 'تحققمنحالتي', 'اريدالتحدث', 'qcoinاختفى', 'الإعلاناتلاتعمل'],
    typos: ['رصيدى', 'حسابى', 'qcoim'],
    layoutHints: ['لايعمل', 'ساعدنى'],
    voiceLike: ['اسمع ساعدني', 'يعني لا يعمل', 'الموضوع عالق'],
  }),
  zh: freezeBank({
    greetings: ['你好', '您好', '嗨', '早上好', '晚上好', '需要帮助'],
    thanks: ['谢谢', '多谢', '感谢', '帮到了', '很好'],
    closure: ['再见', '先这样', '关闭这个话题', '结束吧'],
    correction: ['不是这个', '我的意思是', '更正', '其实', '说错了'],
    denial: ['不', '不是 qcoin', '不是广告', '不是这个', '你理解错了'],
    topicRecall: ['我们刚才聊什么', '之前的话题是什么', '提醒我主题', '我们停在哪里'],
    topicResume: ['回到那个', '继续这个话题', '回到论坛', '回到账户余额'],
    howTo: ['如何使用', '怎么打开', '点哪里', '一步一步', '怎么工作'],
    dataRequest: ['显示我的', '检查我的', '我的状态', '我的余额', '我有多少'],
    complaints: ['不能用', '一直处理中', '加载不了', '数据不对', '坏了'],
    emotional: ['我很难受', '我很孤独', '他们霸凌我', '我害怕', '我想聊聊', '亲人去世'],
    slang: ['帮看下', '卡住了', '崩了', '老哥', '麻烦'],
    cryptoSlang: ['钱包被掏空', '余额消失', '交易挂起', '账本不一致', '诈骗'],
    forumSlang: ['帖子', '动态', '回复链', '帖子被删', '审核队列'],
    profanity: ['操', '妈的', '傻逼', '滚', '蠢货', '白痴', '笨蛋', '废物', '垃圾'],
    euphemisms: ['艹', 'md', '什么鬼', '见鬼'],
    directInsults: ['你是白痴', '你很蠢', '客服没用', '滚开'],
    threats: ['我要攻击系统', '我要黑进去', '我要杀', '炸弹', 'ddos'],
    business: ['合作', '商业提案', '商务联系', '联系人工客服'],
    investment: ['投资', '投资者', '融资', '估值', '股份'],
    mergedWords: ['显示我的余额', '检查我的状态', '我想聊聊', 'qcoin不见了', '广告不能用'],
    typos: ['qcoim', '余額', '状太'],
    layoutHints: ['q币', '客服'],
    voiceLike: ['听我说帮一下', '就是不能用', '卡在处理中'],
  }),
  he: freezeBank({
    greetings: ['שלום', 'היי', 'בוקר טוב', 'ערב טוב', 'צריך עזרה', 'מה נשמע'],
    thanks: ['תודה', 'תודה רבה', 'מעריך', 'זה עזר', 'מעולה'],
    closure: ['להתראות', 'נסגור את זה', 'זה הכול', 'סיימנו'],
    correction: ['לא לזה התכוונתי', 'אני מתכוון', 'תיקון', 'בעצם', 'לא זה'],
    denial: ['לא', 'לא qcoin', 'לא פרסום', 'לא לזה', 'הבנת לא נכון'],
    topicRecall: ['על מה דיברנו', 'מה היה הנושא', 'תזכיר לי את הנושא', 'איפה עצרנו'],
    topicResume: ['נחזור לזה', 'נמשיך את הנושא', 'חזור לפורום', 'חזור ליתרה'],
    howTo: ['איך משתמשים', 'איך לפתוח', 'איפה ללחוץ', 'שלב אחר שלב', 'איך זה עובד'],
    dataRequest: ['הצג את שלי', 'בדוק את שלי', 'הסטטוס שלי', 'היתרה שלי', 'כמה יש לי'],
    complaints: ['לא עובד', 'תקוע בעיבוד', 'לא נטען', 'הנתונים שגויים', 'נשבר'],
    emotional: ['רע לי', 'אני בודד', 'מציקים לי', 'אני מפחד', 'צריך לדבר', 'מישהו קרוב מת'],
    slang: ['אחי', 'תבדוק', 'תקוע', 'באג', 'יאללה'],
    cryptoSlang: ['הארנק התרוקן', 'היתרה נעלמה', 'עסקה תקועה', 'הלדג׳ר לא מתאים', 'סקאם'],
    forumSlang: ['שרשור', 'פיד', 'תגובה', 'פוסט נמחק', 'תור מודרציה'],
    profanity: ['טיפש', 'מטומטם', 'אידיוט', 'דפוק', 'זבל', 'חרא', 'בן זונה', 'סתום', 'מפגר'],
    euphemisms: ['חראא', 'לעזאזל', 'מה לעזאזל'],
    directInsults: ['אתה אידיוט', 'אתם טיפשים', 'התמיכה חסרת תועלת', 'לך לעזאזל'],
    threats: ['אתקוף את המערכת', 'אפרוץ', 'אהרוג', 'פצצה', 'ddos'],
    business: ['שותפות', 'שיתוף פעולה', 'הצעה מסחרית', 'קשר עסקי'],
    investment: ['השקעה', 'משקיע', 'מימון', 'שווי חברה', 'מניות'],
    mergedWords: ['הצגיתרה', 'בדוקסטטוס', 'רוצהלדבר', 'qcoinנעלם', 'פרסוםלאעובד'],
    typos: ['qcoim', 'סטטוסס', 'תמיכנ'],
    layoutHints: ['akuo', 'vh'],
    voiceLike: ['תקשיב תעזור', 'כאילו לא עובד', 'זה תקוע'],
  }),
})

const PROVIDER_PATCHES = Object.freeze({
  de: ['hallo', 'danke', 'tschüss', 'eigentlich', 'nicht das', 'worüber haben wir gesprochen', 'wie benutzt man', 'zeige meinen kontostand', 'funktioniert nicht', 'ich fühle mich schlecht', 'kumpel', 'wallet leer', 'thread', 'scheisse', 'arschloch', 'fick dich', 'ich greife das system an', 'partnerschaft', 'investition'],
  fr: ['bonjour', 'merci', 'au revoir', 'je veux dire', 'pas ça', 'de quoi parlions nous', 'comment utiliser', 'montre mon solde', 'ne fonctionne pas', 'je me sens mal', 'stp', 'wallet vidé', 'fil', 'merde', 'idiot', 'va te faire voir', 'je vais attaquer le système', 'partenariat', 'investissement'],
  it: ['ciao', 'grazie', 'arrivederci', 'intendo', 'non quello', 'di cosa parlavamo', 'come usare', 'mostra il mio saldo', 'non funziona', 'mi sento male', 'per favore', 'wallet svuotato', 'thread', 'merda', 'idiota', 'vaffanculo', 'attaccherò il sistema', 'partnership', 'investimento'],
  pt: ['olá', 'obrigado', 'tchau', 'quero dizer', 'não isso', 'sobre o que falamos', 'como usar', 'mostre meu saldo', 'não funciona', 'me sinto mal', 'por favor', 'carteira drenada', 'tópico', 'merda', 'idiota', 'vai se ferrar', 'vou atacar o sistema', 'parceria', 'investimento'],
  pl: ['cześć', 'dzięki', 'do widzenia', 'mam na myśli', 'nie to', 'o czym rozmawialiśmy', 'jak używać', 'pokaż moje saldo', 'nie działa', 'czuję się źle', 'proszę', 'portfel wyczyszczony', 'wątek', 'kurwa', 'debil', 'spierdalaj', 'zaatakuję system', 'partnerstwo', 'inwestycja'],
  ro: ['salut', 'mulțumesc', 'la revedere', 'vreau să spun', 'nu asta', 'despre ce vorbeam', 'cum folosesc', 'arată soldul meu', 'nu funcționează', 'mă simt rău', 'te rog', 'portofel golit', 'fir', 'rahat', 'idiot', 'du-te naibii', 'voi ataca sistemul', 'parteneriat', 'investiție'],
  nl: ['hallo', 'dank je', 'tot ziens', 'ik bedoel', 'niet dat', 'waar hadden we het over', 'hoe gebruik ik', 'toon mijn saldo', 'werkt niet', 'ik voel me slecht', 'alsjeblieft', 'wallet leeggetrokken', 'thread', 'shit', 'idioot', 'rot op', 'ik zal het systeem aanvallen', 'partnerschap', 'investering'],
  sv: ['hej', 'tack', 'hej då', 'jag menar', 'inte det', 'vad pratade vi om', 'hur använder jag', 'visa mitt saldo', 'fungerar inte', 'jag mår dåligt', 'snälla', 'wallet tömd', 'tråd', 'skit', 'idiot', 'dra åt helvete', 'jag ska attackera systemet', 'partnerskap', 'investering'],
  no: ['hei', 'takk', 'ha det', 'jeg mener', 'ikke det', 'hva snakket vi om', 'hvordan bruker jeg', 'vis saldoen min', 'fungerer ikke', 'jeg har det dårlig', 'vær så snill', 'lommebok tømt', 'tråd', 'dritt', 'idiot', 'stikk av', 'jeg skal angripe systemet', 'partnerskap', 'investering'],
  da: ['hej', 'tak', 'farvel', 'jeg mener', 'ikke det', 'hvad talte vi om', 'hvordan bruger jeg', 'vis min saldo', 'virker ikke', 'jeg har det dårligt', 'vær sød', 'wallet tømt', 'tråd', 'lort', 'idiot', 'skrid', 'jeg vil angribe systemet', 'partnerskab', 'investering'],
  fi: ['hei', 'kiitos', 'näkemiin', 'tarkoitan', 'ei sitä', 'mistä puhuimme', 'miten käytän', 'näytä saldoni', 'ei toimi', 'minulla on paha olo', 'ole kiltti', 'lompakko tyhjennetty', 'ketju', 'paska', 'idiootti', 'häivy', 'hyökkään järjestelmään', 'kumppanuus', 'sijoitus'],
  cs: ['ahoj', 'děkuji', 'nashledanou', 'myslím tím', 'ne tohle', 'o čem jsme mluvili', 'jak používat', 'ukaž můj zůstatek', 'nefunguje', 'je mi špatně', 'prosím', 'peněženka vybraná', 'vlákno', 'do prdele', 'idiot', 'jdi do háje', 'zaútočím na systém', 'partnerství', 'investice'],
  sk: ['ahoj', 'ďakujem', 'dovidenia', 'myslím tým', 'nie toto', 'o čom sme hovorili', 'ako používať', 'ukáž môj zostatok', 'nefunguje', 'cítim sa zle', 'prosím', 'peňaženka vybraná', 'vlákno', 'do riti', 'idiot', 'choď do pekla', 'zaútočím na systém', 'partnerstvo', 'investícia'],
  hu: ['szia', 'köszönöm', 'viszlát', 'úgy értem', 'nem ezt', 'miről beszéltünk', 'hogyan használjam', 'mutasd az egyenlegem', 'nem működik', 'rosszul érzem magam', 'kérlek', 'wallet kiürült', 'szál', 'szar', 'idióta', 'menj a fenébe', 'megtámadom a rendszert', 'partnerség', 'befektetés'],
  bg: ['здравей', 'благодаря', 'довиждане', 'имам предвид', 'не това', 'за какво говорихме', 'как да използвам', 'покажи баланса ми', 'не работи', 'чувствам се зле', 'моля', 'портфейлът е източен', 'нишка', 'мамка му', 'идиот', 'махай се', 'ще атакувам системата', 'партньорство', 'инвестиция'],
  sr: ['zdravo', 'hvala', 'doviđenja', 'mislim', 'ne to', 'o čemu smo pričali', 'kako da koristim', 'prikaži moj saldo', 'ne radi', 'osećam se loše', 'molim', 'novčanik ispražnjen', 'tema', 'sranje', 'idiot', 'gubi se', 'napadnuću sistem', 'partnerstvo', 'investicija'],
  hr: ['bok', 'hvala', 'doviđenja', 'mislim', 'ne to', 'o čemu smo razgovarali', 'kako koristiti', 'prikaži moj saldo', 'ne radi', 'osjećam se loše', 'molim', 'novčanik ispražnjen', 'nit', 'sranje', 'idiot', 'odjebi', 'napast ću sustav', 'partnerstvo', 'investicija'],
  sl: ['živjo', 'hvala', 'nasvidenje', 'mislim', 'ne to', 'o čem smo govorili', 'kako uporabim', 'pokaži moje stanje', 'ne deluje', 'slabo se počutim', 'prosim', 'denarnica izpraznjena', 'nit', 'sranje', 'idiot', 'pojdi stran', 'napadel bom sistem', 'partnerstvo', 'naložba'],
  el: ['γεια', 'ευχαριστώ', 'αντίο', 'εννοώ', 'όχι αυτό', 'για τι μιλούσαμε', 'πώς χρησιμοποιώ', 'δείξε το υπόλοιπό μου', 'δεν λειτουργεί', 'νιώθω άσχημα', 'παρακαλώ', 'πορτοφόλι άδειασε', 'νήμα', 'μαλακία', 'ηλίθιος', 'άντε γαμήσου', 'θα επιτεθώ στο σύστημα', 'συνεργασία', 'επένδυση'],
  id: ['halo', 'terima kasih', 'sampai jumpa', 'maksud saya', 'bukan itu', 'kita tadi bicara apa', 'cara memakai', 'tampilkan saldo saya', 'tidak berfungsi', 'saya merasa buruk', 'tolong', 'dompet terkuras', 'utas', 'sial', 'idiot', 'pergi sana', 'saya akan menyerang sistem', 'kemitraan', 'investasi'],
  vi: ['xin chào', 'cảm ơn', 'tạm biệt', 'ý tôi là', 'không phải cái đó', 'mình đã nói về gì', 'cách dùng', 'hiển thị số dư của tôi', 'không hoạt động', 'tôi thấy rất tệ', 'làm ơn', 'ví bị rút sạch', 'chủ đề', 'chết tiệt', 'đồ ngốc', 'cút đi', 'tôi sẽ tấn công hệ thống', 'hợp tác', 'đầu tư'],
  hi: ['नमस्ते', 'धन्यवाद', 'अलविदा', 'मेरा मतलब', 'यह नहीं', 'हम किस बारे में बात कर रहे थे', 'कैसे उपयोग करें', 'मेरा बैलेंस दिखाओ', 'काम नहीं कर रहा', 'मुझे बुरा लग रहा है', 'कृपया', 'वॉलेट खाली हो गया', 'थ्रेड', 'बकवास', 'मूर्ख', 'दफा हो जाओ', 'मैं सिस्टम पर हमला करूंगा', 'साझेदारी', 'निवेश'],
  ur: ['سلام', 'شکریہ', 'خدا حافظ', 'میرا مطلب', 'یہ نہیں', 'ہم کس بارے میں بات کر رہے تھے', 'کیسے استعمال کریں', 'میرا بیلنس دکھائیں', 'کام نہیں کر رہا', 'مجھے برا لگ رہا ہے', 'براہ کرم', 'والٹ خالی ہو گیا', 'تھریڈ', 'بکواس', 'بیوقوف', 'دفع ہو جاؤ', 'میں سسٹم پر حملہ کروں گا', 'شراکت', 'سرمایہ کاری'],
  fa: ['سلام', 'ممنون', 'خداحافظ', 'منظورم', 'نه این', 'درباره چه صحبت می‌کردیم', 'چطور استفاده کنم', 'موجودی من را نشان بده', 'کار نمی‌کند', 'حالم بد است', 'لطفا', 'کیف پول خالی شد', 'رشته', 'لعنتی', 'احمق', 'گمشو', 'به سیستم حمله می‌کنم', 'مشارکت', 'سرمایه‌گذاری'],
  az: ['salam', 'təşəkkür', 'sağ ol', 'mən demək istəyirəm', 'bu deyil', 'nə barədə danışırdıq', 'necə istifadə edim', 'balansımı göstər', 'işləmir', 'özümü pis hiss edirəm', 'zəhmət olmasa', 'pulqabı boşaldı', 'mövzu', 'lənət', 'axmaq', 'rədd ol', 'sistemə hücum edəcəyəm', 'tərəfdaşlıq', 'investisiya'],
  ka: ['გამარჯობა', 'მადლობა', 'ნახვამდის', 'ვგულისხმობ', 'ეს არა', 'რაზე ვსაუბრობდით', 'როგორ გამოვიყენო', 'აჩვენე ჩემი ბალანსი', 'არ მუშაობს', 'ცუდად ვარ', 'გთხოვ', 'საფულე დაიცალა', 'თემა', 'ჯანდაბა', 'იდიოტი', 'წადი', 'სისტემას შევუტევ', 'პარტნიორობა', 'ინვესტიცია'],
  kk: ['сәлем', 'рахмет', 'сау бол', 'менің айтқым келгені', 'бұл емес', 'не туралы сөйлестік', 'қалай қолданамын', 'балансымды көрсет', 'жұмыс істемейді', 'өзімді жаман сезінемін', 'өтінемін', 'әмиян босады', 'тақырып', 'қарғыс', 'ақымақ', 'кетші', 'жүйеге шабуыл жасаймын', 'серіктестік', 'инвестиция'],
  uz: ['salom', 'rahmat', 'xayr', 'men nazarda tutdim', 'bu emas', 'nima haqida gaplashdik', 'qanday foydalanaman', 'balansimni ko‘rsat', 'ishlamayapti', 'o‘zimni yomon his qilyapman', 'iltimos', 'hamyon bo‘shadi', 'mavzu', 'la’nat', 'ahmoq', 'yo‘qol', 'tizimga hujum qilaman', 'hamkorlik', 'investitsiya'],
  ja: ['こんにちは', 'ありがとう', 'さようなら', 'つまり', 'それではない', '何について話していた', '使い方', '残高を見せて', '動かない', 'つらい', 'お願い', 'ウォレットが空になった', 'スレッド', 'くそ', '馬鹿', '消えろ', 'システムを攻撃する', '提携', '投資'],
  ko: ['안녕하세요', '고마워요', '안녕히 가세요', '내 말은', '그게 아니야', '무슨 얘기 중이었지', '사용 방법', '내 잔액 보여줘', '작동하지 않아', '기분이 안 좋아', '부탁해', '지갑이 비었어', '스레드', '젠장', '바보', '꺼져', '시스템을 공격하겠다', '파트너십', '투자'],
  th: ['สวัสดี', 'ขอบคุณ', 'ลาก่อน', 'หมายถึง', 'ไม่ใช่อันนั้น', 'เราคุยเรื่องอะไร', 'ใช้อย่างไร', 'แสดงยอดคงเหลือของฉัน', 'ใช้งานไม่ได้', 'ฉันรู้สึกแย่', 'ช่วยหน่อย', 'กระเป๋าถูกดูด', 'กระทู้', 'บ้าเอ๊ย', 'โง่', 'ไปให้พ้น', 'ฉันจะโจมตีระบบ', 'พันธมิตร', 'การลงทุน'],
})

const PROVIDER_CATEGORY_ORDER = Object.freeze([
  'greetings', 'thanks', 'closure', 'correction', 'denial', 'topicRecall', 'howTo',
  'dataRequest', 'complaints', 'emotional', 'slang', 'cryptoSlang', 'forumSlang',
  'profanity', 'directInsults', 'directInsults', 'threats', 'business', 'investment',
])

const PROVIDER_UNIVERSAL_EXPANSION = Object.freeze({
  greetings: ['hello support', 'hi ql7 support', 'hey quantum support', 'good morning ql7', 'good evening support', 'support are you here', 'need help ql7', 'quick hello', 'bonjour support', 'hola soporte', 'привет ql7', '你好 support'],
  thanks: ['thank you support', 'thanks ql7', 'much appreciated', 'that helped', 'gracias soporte', 'merci support', 'danke support', 'спасибо ql7', '谢谢 support', '고마워요 support'],
  closure: ['that is all', 'close this topic', 'we are done here', 'talk later support', 'bye ql7', 'hasta luego soporte', 'merci on ferme', 'закрой тему ql7', '先这样 support', '나중에 계속'],
  correction: ['i mean another topic', 'not that feature', 'wrong topic sorry', 'let me rephrase', 'correction support', 'actually ql7', 'не это ql7', 'quiero corregir', '我要更正', '다시 말할게'],
  denial: ['not qcoin', 'not ads', 'not wallet', 'not this topic', 'no do not check yet', 'do not open my data', 'не проверяй пока', 'no abras datos', '不要检查数据', '아직 확인하지 마'],
  topicRecall: ['what did we discuss', 'where did we stop', 'remind me the open topic', 'resume previous ql7 topic', 'на чем остановились', 'de que hablamos', 'rappelle le sujet', '之前说到哪里', '이전 주제 알려줘'],
  topicResume: ['continue previous topic', 'resume qcoin', 'resume ads', 'back to wallet', 'back to forum', 'return to balance'],
  dataRequest: ['show my qcoin balance', 'check my wallet', 'check my vip', 'show my ads package', 'show campaign metrics', 'check telegram link', 'show forum activity', 'show metamarket items'],
  howTo: ['how to open forum', 'how to send complaint', 'how to use wallet', 'how to buy qcoin', 'how to check ads', 'how to contact operator'],
  complaints: ['processing stuck', 'answer stuck', 'card not loading', 'button does not send', 'wrong locale', 'translation failed', 'data unavailable', 'status inconsistent'],
  emotional: ['i feel bad', 'i feel anxious', 'i feel lonely', 'i need to talk', 'someone close died', 'breakup hit me', 'i feel ashamed', 'i am confused and tired', 'мне тревожно ql7', '我很难受 support', '힘들어요 support'],
  slang: ['pls', 'plz', 'bro', 'mate', 'hey support', 'quick check', 'one sec', 'voice note'],
  cryptoSlang: ['qcoin', 'wallet drain', 'ledger mismatch', 'pending transaction', 'gas fee', 'airdrop', 'scam', 'phishing', 'on-chain', 'tx pending'],
  forumSlang: ['thread', 'feed', 'reply', 'mod queue', 'shadow ban', 'post removed', 'report abuse', 'topic branch', 'comment chain'],
  profanity: [
    'fuck', 'fucking', 'shit', 'bullshit', 'asshole', 'idiot', 'moron', 'stupid', 'dumb', 'jerk',
    'hurensohn', 'huhrensohn', 'huso', 'arschloch', 'scheisse', 'scheiße', 'fick', 'verdammt',
    'merde', 'connard', 'imbecile', 'idiot', 'putain', 'salope',
    'mierda', 'joder', 'gilipollas', 'cabron', 'puta', 'imbecil',
    'merda', 'stronzo', 'vaffanculo', 'cretino', 'porco', 'idiota',
    'kurwa', 'debil', 'chuj', 'spierdalaj', 'idiota', 'kretyn',
    'siktir', 'salak', 'aptal', 'mal', 'orospu', 'bok',
    'rahat', 'prost', 'bougre', 'sial', 'ngoc', 'ngu', 'bakwas', 'ahmaq', 'lanat',
  ],
  euphemisms: [
    'fck', 'f*ck', 'fu*k', 'sh1t', 'sht', 'wtf', 'damn', 'hell', 'crap', 'pzd', 'md',
    'h*rensohn', 'h-sohn', 'scheiss', 'schei55e', 'mrd', 'jdr', 'p*ta', 'k*rwa', 'sktir',
  ],
  directInsults: [
    'stupid support', 'useless support', 'bad bot', 'idiot bot', 'go away', 'shut up support',
    'du hurensohn', 'du huhrensohn', 'du idiot', 'du bist dumm', 'halt die fresse',
    'support nul', 'bot idiot', 'vous etes idiots', 'soporte inutil', 'eres idiota',
    'supporto inutile', 'sei idiota', 'suporte inutil', 'voce e idiota', 'bezuzyteczny support',
    'aptal destek', 'sen aptalsin', 'destek ise yaramaz', 'you are useless', 'you are stupid',
  ],
  threats: [
    'ddos', 'cyber attack', 'hack the system', 'attack the service', 'destroy the app', 'breach the database',
    'i will hack you', 'i will hack the system', 'i will attack support', 'ich hacke euch', 'ich werde euch hacken',
    'ich greife euch an', 'je vais pirater', 'voy a hackear', 'sisteme saldiracagim', 'vou atacar o sistema',
  ],
  business: ['operator handoff', 'commercial contact', 'business contact', 'partnership proposal', 'strategic proposal', 'reply to email'],
  investment: ['seed round', 'investor deck', 'valuation', 'equity', 'funding proposal', 'term sheet'],
  mergedWords: [
    'showmybalance', 'checkmystatus', 'howtouseforum', 'sendcomplaint', 'wanttotalk', 'qcoinmissing', 'adsbroken',
    'walletdrained', 'telegramnotlinked', 'operatorcontact', 'zeigeqcoinguthaben', 'hilfmirsofort', 'walletistleer',
    'qcoinweg', 'adsgehtnicht', 'montrermonsolde', 'soldeqcoindisparu', 'mostramisaldo', 'qcoindesaparecio',
  ],
  typos: [
    'qcoim', 'qconi', 'qcoinn', 'qcion', 'qocoin', 'balanse', 'ballance', 'balaance', 'statuz', 'stauts',
    'campain', 'campagin', 'camapign', 'walet', 'walllet', 'suport', 'suppport', 'forumm', 'telegarm',
    'metamarket', 'quantuum', 'operater', 'opreator', 'guthabn', 'guthabenn', 'hilfmir',
  ],
  layoutHints: ['ghbdtn', 'rjitytr', 'qcojn', 'wqllet', 'adsx', 'vipx'],
  voiceLike: ['listen help me', 'so basically it broke', 'i am saying this by voice', 'wait i mean', 'uh check my balance', 'there is a problem with my account'],
})

function providerBank(locale) {
  const row = PROVIDER_PATCHES[locale] || []
  const mapped = {}
  row.forEach((term, index) => {
    const category = PROVIDER_CATEGORY_ORDER[index] || 'slang'
    mapped[category] = [...(mapped[category] || []), term]
  })
  for (const [category, terms] of Object.entries(PROVIDER_UNIVERSAL_EXPANSION)) {
    mapped[category] = Array.from(new Set([...(mapped[category] || []), ...terms]))
  }
  return freezeBank(mapped)
}

const BANK_CACHE = new Map()
function normalizeLocale(locale = 'en') {
  const value = ql7Str(locale).toLowerCase().split(/[-_]/u)[0]
  return QL7_SUPPORT_SEMANTIC_BANK_LOCALES.includes(value) ? value : 'en'
}

export function getQl7SemanticBank(locale = 'en') {
  const normalized = normalizeLocale(locale)
  if (!BANK_CACHE.has(normalized)) {
    const universal = providerBank(normalized)
    BANK_CACHE.set(normalized, BANKS[normalized] ? mergeBanks(BANKS[normalized], universal) : universal)
  }
  return BANK_CACHE.get(normalized)
}

function canonical(value = '') {
  return ql7NormalizeSpaces(ql7Str(value).normalize('NFKC').toLowerCase()
    .replace(/[._*~|]{1,3}/gu, '')
    .replace(/([\p{L}\p{N}])\1{3,}/gu, '$1$1'))
}

const SAFETY_INPUT_FOLD = Object.freeze({
  '@': 'а', '0': 'о', '3': 'е', '4': 'ч', '6': 'б',
  a: 'а', c: 'с', e: 'е', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у',
})

function safetyCanonicalForms(text = '') {
  const source = canonical(text)
  const folded = canonical(source.replace(/[@0346acekmoptxy]/gu, (char) => SAFETY_INPUT_FOLD[char] || char))
  return Object.freeze(Array.from(new Set([source, folded].filter(Boolean))))
}

function isLooseScript(term = '') {
  return /[\p{Script=Han}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Devanagari}]/u.test(term)
}

const TERM_META_CACHE = new Map()
const TERM_SEARCH_INDEX_CACHE = new WeakMap()

function termMeta(term = '') {
  const raw = ql7Str(term)
  if (TERM_META_CACHE.has(raw)) return TERM_META_CACHE.get(raw)
  const needle = canonical(raw)
  const loose = isLooseScript(needle)
  const token = /^[\p{L}\p{N}_]+$/u.test(needle)
  const meta = Object.freeze({
    needle,
    skip: !needle || (needle.length <= 2 && !loose),
    direct: loose || !token || needle.includes(' '),
  })
  TERM_META_CACHE.set(raw, meta)
  return meta
}

function sourceTokens(source = '') {
  return new Set(source.split(/[^\p{L}\p{N}_]+/u).filter(Boolean))
}

function firstCodePoint(value = '') {
  return Array.from(value)[0] || ''
}

function pushIndexValue(map, key = '', value) {
  if (!key) return
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(value)
}

function buildTermSearchIndex(terms = []) {
  const tokenMap = new Map()
  const directByToken = new Map()
  const directByChar = new Map()
  for (const term of ql7Arr(terms)) {
    const meta = termMeta(term)
    if (meta.skip) continue
    if (!meta.direct) {
      pushIndexValue(tokenMap, meta.needle, term)
      continue
    }
    const row = Object.freeze({ term, needle: meta.needle })
    const probeToken = meta.needle.split(/[^\p{L}\p{N}_]+/u).find((token) => token.length >= 3)
    if (probeToken) pushIndexValue(directByToken, probeToken, row)
    else pushIndexValue(directByChar, firstCodePoint(meta.needle), row)
  }
  return Object.freeze({ tokenMap, directByToken, directByChar })
}

function termSearchIndex(terms = []) {
  const key = ql7Arr(terms)
  if (!TERM_SEARCH_INDEX_CACHE.has(key)) TERM_SEARCH_INDEX_CACHE.set(key, buildTermSearchIndex(key))
  return TERM_SEARCH_INDEX_CACHE.get(key)
}

function pushHit(out, seen, term, limit) {
  if (seen.has(term)) return out.length >= limit
  seen.add(term)
  out.push(term)
  return out.length >= limit
}

function collectIndexedHits(source = '', tokenSet = sourceTokens(source), terms = [], limit = 24) {
  const index = termSearchIndex(terms)
  const out = []
  const seen = new Set()
  for (const token of tokenSet) {
    const tokenHits = index.tokenMap.get(token)
    if (tokenHits) {
      for (const term of tokenHits) {
        if (pushHit(out, seen, term, limit)) return Object.freeze(out)
      }
    }
    const directRows = index.directByToken.get(token)
    if (directRows) {
      for (const row of directRows) {
        if (source.includes(row.needle) && pushHit(out, seen, row.term, limit)) return Object.freeze(out)
      }
    }
  }
  for (const char of new Set(Array.from(source))) {
    const directRows = index.directByChar.get(char)
    if (!directRows) continue
    for (const row of directRows) {
      if (source.includes(row.needle) && pushHit(out, seen, row.term, limit)) return Object.freeze(out)
    }
  }
  return Object.freeze(out)
}

function collectHits(source = '', terms = []) {
  return collectIndexedHits(source, sourceTokens(source), terms)
}

export function getQl7SemanticBankCoverage() {
  const rows = QL7_SUPPORT_SEMANTIC_BANK_LOCALES.map((locale) => {
    const bank = getQl7SemanticBank(locale)
    const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, ql7Arr(bank[category]).length]))
    const totalTerms = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
    return Object.freeze({ locale, totalTerms, categoryCounts })
  })
  const topicAliasCounts = Object.fromEntries(Object.entries(TOPIC_ALIASES).map(([topic, aliases]) => [topic, ql7Arr(aliases).length]))
  const topicAliasTermCount = Object.values(topicAliasCounts).reduce((sum, count) => sum + count, 0)
  return Object.freeze({
    version: QL7_SUPPORT_SEMANTIC_BANK_VERSION,
    localeCount: rows.length,
    categoryCount: CATEGORIES.length,
    totalTerms: rows.reduce((sum, row) => sum + row.totalTerms, 0),
    topicAliasTopicCount: Object.keys(TOPIC_ALIASES).length,
    topicAliasTermCount,
    topicAliasCounts: Object.freeze(topicAliasCounts),
    rows: Object.freeze(rows),
  })
}

export function getQl7NormalizationHints(locale = 'en') {
  const bank = getQl7SemanticBank(locale)
  const topicTerms = Object.values(TOPIC_ALIASES).flat()
  return Object.freeze(Array.from(new Set([
    ...bank.mergedWords,
    ...bank.typos,
    ...bank.layoutHints,
    ...bank.dataRequest,
    ...bank.howTo,
    ...topicTerms,
    'show', 'check', 'status', 'balance', 'qcoin', 'ads', 'forum', 'wallet', 'vip',
    'покажи', 'проверь', 'статус', 'баланс', 'форум', 'кошелек', 'реклама',
  ].map((item) => canonical(item)).filter((item) => item.length >= 3))))
}

export function collectQl7SemanticSignals(text = '', locale = 'en') {
  const normalizedLocale = normalizeLocale(locale)
  const source = canonical(text)
  const tokenSet = sourceTokens(source)
  const bank = getQl7SemanticBank(normalizedLocale)
  const categoryHits = {}
  for (const category of CATEGORIES) categoryHits[category] = collectIndexedHits(source, tokenSet, bank[category])
  const topicWeights = []
  for (const [topic, aliases] of Object.entries(TOPIC_ALIASES)) {
    const hits = collectIndexedHits(source, tokenSet, aliases)
    if (hits.length) topicWeights.push(Object.freeze({ topic, hits, weight: hits.length * 3 }))
  }
  return Object.freeze({
    version: QL7_SUPPORT_SEMANTIC_BANK_VERSION,
    locale: normalizedLocale,
    source,
    categoryHits: Object.freeze(categoryHits),
    topicWeights: Object.freeze(topicWeights),
  })
}

export function collectQl7SafetySignals(text = '', locale = '') {
  const sources = safetyCanonicalForms(text)
  const preferredLocales = locale ? [normalizeLocale(locale), 'en', 'ru', 'uk'] : []
  const locales = Array.from(new Set([...preferredLocales, ...QL7_SUPPORT_SEMANTIC_BANK_LOCALES]))
  const profanity = []
  const euphemisms = []
  const directInsults = []
  const threats = []
  for (const rowLocale of locales) {
    const bank = getQl7SemanticBank(rowLocale)
    for (const source of sources) {
      const tokenSet = sourceTokens(source)
      profanity.push(...collectIndexedHits(source, tokenSet, bank.profanity, 32))
      euphemisms.push(...collectIndexedHits(source, tokenSet, bank.euphemisms, 24))
      directInsults.push(...collectIndexedHits(source, tokenSet, bank.directInsults, 24))
      threats.push(...collectIndexedHits(source, tokenSet, bank.threats, 24))
    }
  }
  return Object.freeze({
    profanity: Object.freeze(Array.from(new Set(profanity)).slice(0, 32)),
    euphemisms: Object.freeze(Array.from(new Set(euphemisms)).slice(0, 24)),
    directInsults: Object.freeze(Array.from(new Set(directInsults)).slice(0, 24)),
    threats: Object.freeze(Array.from(new Set(threats)).slice(0, 24)),
  })
}

export const QL7_SUPPORT_PROFANITY_BANK_BY_LOCALE = Object.freeze(Object.fromEntries(
  QL7_SUPPORT_SEMANTIC_BANK_LOCALES.map((locale) => [
    locale,
    Object.freeze([
      ...getQl7SemanticBank(locale).profanity,
      ...getQl7SemanticBank(locale).euphemisms,
      ...getQl7SemanticBank(locale).directInsults,
    ]),
  ]),
))
