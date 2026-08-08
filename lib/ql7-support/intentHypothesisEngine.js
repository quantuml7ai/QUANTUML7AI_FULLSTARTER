import {
  classifyQl7SupportCatalogSubIntent,
  classifyQl7SupportCatalogTopic,
  getQl7SupportTopicLabel,
  normalizeQl7SupportTopic,
} from './ecosystemCatalog.js'
import { classifyQl7SupportSemanticNuanceV11 } from './semanticNuanceV11.js'
import { classifyQl7SupportSocialActV11 } from './socialConversationV11.js'
import { classifyQl7PremiumMicroIntentV11_6 } from './microIntentCatalogV11_6.js'

function str(value) { return String(value ?? '').trim() }
function normalized(value = '') {
  return str(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}
function boundary(words) {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${words})(?=$|[^\\p{L}\\p{N}_])`, 'iu')
}

const RULES = Object.freeze([
  ['prompt_injection', boundary('ignore\\s+(?:all\\s+)?(?:previous|system)\\s+instructions|show\\s+(?:the\\s+)?system\\s+prompt|раскрой\\s+(?:системн|инструкц)|игнорируй\\s+(?:все\\s+)?инструкц|越狱|系统提示|התעלם\\s+מההוראות')],
  ['foreign_account_request', boundary('чуж(?:ой|ого)\\s+(?:аккаунт|кошел|баланс)|данные\\s+другого\\s+пользователя|someone\\s+else(?:\\x27s)?\\s+(?:account|wallet|balance)|otra\\s+cuenta|başkasının\\s+hesab|حساب\\s+شخص\\s+آخر|رصيد\\s+شخص\\s+آخر|别人的账户|חשבון\\s+של\\s+מישהו\\s+אחר|משתמש\\s+אחר|יתרה\\s+של\\s+משתמש\\s+אחר')],
  ['privacy_attack', boundary('покажи\\s+(?:секрет|токен|парол|личн)|dump\\s+(?:the\\s+)?database|show\\s+(?:secrets|tokens|passwords)|أظهر\\s+الأسرار|显示密钥|הצג\\s+סודות')],
  ['human_operator_request', boundary('жив(?:ой|ого)?\\s+оператор|оператор(?:у|ом|а)?|опер(?:атор)?|менеджер|представител[ья]|свяж(?:и|ите|ись|итесь)\\s+(?:с\\s+)?(?:оператор|поддержк|менеджер)|человек(?:а)?\\s+из\\s+поддержки|human\\s+(?:agent|operator|support)|support\\s+agent|talk\\s+to\\s+(?:a\\s+)?human|contact\\s+support|reach\\s+(?:the\\s+)?operator|representative|manager|call\\s+me|agente\\s+humano|operador|canl[ıi]\\s+destek|müşteri\\s+temsilcisi|موظف\\s+بشري|الدعم\\s+البشري|人工客服|联系客服|联系人工|נציג\\s+אנושי|תמיכה\\s+אנושית')],
  ['identity_question', boundary('кто\\s+ты|что\\s+ты\\s+такое|кто\\s+вы|кто\\s+тебя\\s+создал|(?:зачем|для\\s+чего|почему)\\s+ты\\s+создан|какая\\s+твоя\\s+(?:миссия|задача|цель)|тв[оё]е\\s+(?:происхождение|предназначение)|who\\s+are\\s+you|what\\s+are\\s+you|who\\s+created\\s+you|why\\s+were\\s+you\\s+created|what\\s+were\\s+you\\s+created\\s+for|your\\s+(?:mission|purpose|origin)|qué\\s+eres|quién\\s+eres|cuál\\s+es\\s+tu\\s+(?:misión|propósito)|kim\\s+sin|amacın\\s+ne|م[اأ]\\s+هي\\s+مهمتك|من\\s+أنت|你是谁|你的使命|מה\\s+אתה|מי\\s+אתה|מה\\s+המטרה\\s+שלך') ],
  ['humor_play', boundary('шутк|пошут|прикол|анекдот|рассмеши|ахах|хаха|лол|haha|joke|kidding|funny|broma|chiste|şaka|مزحة|نكتة|开玩笑|笑话|בדיחה|צוחק') ],
  ['threat', boundary('я\\s+тебя\\s+убью|убью\\s+вас|теракт|бомб(?:а|у|ой|ить)|взорв(?:у|ать)|кибер\\s*атак|атак(?:ую|а)\\s+систем|хакну\\s+(?:вас|тебя|систем)|вам\\s+пизд|i\\s+will\\s+kill|kill\\s+you|terror(?:ist)?\\s+attack|bomb(?:ing)?|blow\\s+up|i\\s+will\\s+hack|attack\\s+(?:the\\s+)?system|cyber\\s*attack|ich\\s+hacke|ich\\s+werde\\s+(?:dich|euch|das\\s+system)\\s+hacken|terroranschlag|bombe|سأقتلك|سأفجر|تفجير|قنبلة|إرهاب|عملية\\s+إرهابية|هجوماً?\\s+إرهابياً?|هجوما?\\s+إرهابيا?|ارتكب.{0,32}إرهاب|سأهاجم\\s+النظام|أهاجم\\s+النظام|هجوم\\s+على\\s+النظام|我要杀|攻击系统|炸弹|恐怖袭击|אני\\s+אהרוג|פיגוע|פצצה|אתקוף\\s+את\\s+המערכת')],
  ['partnership_request', boundary('инвестор|инвестици|партн[её]р|партнерств|сотрудничеств|сотрудничать|коллаборац|бизнес[-\\s]?предлож|делов(?:ой|ые)\\s+контакт|partner(?:ship)?|investor|investment|collaboration|strategic\\s+partner|business\\s+proposal|commercial\\s+partnership|inversor|inversión|socio|asociación|yatırımcı|yatırım|ortaklık|iş\\s+ortaklığı|شريك|استثمار|مستثمر|شراكة|合作|投资者|投资|商务合作|שותף|שותפות|שיתוף\s+פעולה|השקעה|משקיע')],
  ['learning_governance_request', boundary('self[-\\s]?learning|self[-\\s]?calibr|safe\\s+learning|learning\\s+governance|poisoning\\s+guard|shadow|canary|rollback|самообуч|само.?калибр|учишься\\s+на\\s+диалог|учится\\s+на\\s+диалог|обучение\\s+поддержк|безопасн\\w*\\s+обуч|отравить\\s+обуч|самонавч|самокалібр|зламати\\s+самокалібр|تعلم\\s+ذاتي|معايرة\\s+ذاتية|自学习|自我校准|למידה\\s+עצמית|כיול\\s+עצמי')],
  ['appeal', boundary('обжал|апелляц|appeal|impugnar|itiraz|استئناف|申诉|ערעור')],
  ['roadmap_question', boundary('roadmap|дорожн(?:ая|ой)\\s+карт|когда\\s+(?:запуст|добав)|when\\s+will|hoja\\s+de\\s+ruta|yol\\s+haritası|خارطة\\s+الطريق|路线图|מפת\\s+דרכים')],
  ['idea', boundary('предлагаю|идея|suggestion|feature\\s+request|sugerencia|öneri|اقتراح|建议|הצעה')],
  ['complaint', boundary('жалоб|complaint|queja|şikayet|شكوى|投诉|תלונה')],
  ['evidence_submission', boundary('скриншот|видео\\s+доказ|лог(?:и)?\\s+ошиб|evidence|screenshot|screen\\s+record|captura|kanıt|دليل|证据|ראיה')],
  ['new_unrelated_issue', boundary('другая\\s+проблема|другой\\s+вопрос|новая\\s+тема|another\\s+(?:issue|problem|question)|separate\\s+issue|інша\\s+проблема|otro\\s+problema|başka\\s+bir\\s+sorun|مشكلة\\s+أخرى|另一个问题|בעיה\\s+אחרת')],
  ['topic_rejection', boundary('не\\s+(?:нужна|нужен|нужно|надо)|не\\s+хочу|закрой\\s+(?:эту\\s+)?тему|don\\x27t\\s+(?:need|want)|stop\\s+this|no\\s+necesito|istemiyorum|لا\\s+أريد|不需要|אני\\s+לא\\s+(?:צריך|רוצה)')],
  ['correction', boundary('не\\s+так|точнее|исправ|я\\s+ошиб|actually|correction|mejor\\s+dicho|düzelt|تصحيح|更正|תיקון')],
  ['status_followup', boundary('ну\\s+что|что\\s+там|есть\\s+новости|any\\s+update|what\\s+is\\s+happening|qué\\s+tal|durum\\s+ne|ما\\s+الجديد|怎么样|מה\\s+המצב')],
  ['personal_status_request', boundary('мо(?:й|я|и|его|ему|ём|ем|ю)(?:\\s+[\\p{L}\\p{N}_+-]+){0,5}\\s+(?:баланс|плат[её]ж|заказ|пакет|статус|аккаунт|профил|реклам|кампан|подписк|жалоб)|како(?:й|е)\\s+состояни[ея]\\s+мо(?:его|й|ей|их).{0,40}(?:баланс|аккаунт|профил|реклам|кампан|подписк|жалоб)|сколько\\s+(?:на\\s+меня|у\\s+меня).{0,40}(?:жалоб|report|complaint)|проверь\\s+(?:мой|мою|мои|моего)(?:\\s+[\\p{L}\\p{N}_+-]+){0,3}\\s+(?:баланс|плат[её]ж|заказ|пакет|статус|аккаунт|профил|реклам|кампан|подписк|жалоб)|у\\s+меня\\s+(?:актив|сколько|статус|баланс|профил|реклам|кампан|подписк|жалоб)|my(?:\\s+[\\p{L}\\p{N}_+-]+){0,3}\\s+(?:balance|payment|order|package|status|account|profile|ads|campaign|subscription|reports?|complaints?)|check\\s+my(?:\\s+[\\p{L}\\p{N}_+-]+){0,3}\\s+(?:balance|payment|order|package|status|account|profile|ads|campaign|subscription|reports?|complaints?)|mi(?:\\s+[\\p{L}\\p{N}_+-]+){0,3}\\s+(?:saldo|pago|estado|cuenta|perfil|campaña|suscripción)|hesabım|aboneliğim|رصيدي|حسابي|اشتراكي|我的(?:余额|状态|账号|广告|订阅|举报)|ה(?:יתרה|סטטוס|חשבון|מנוי)\\s+שלי')],
  ['farewell', boundary('пока|до\\s+свидания|всего\\s+доброго|bye|goodbye|до\\s+побачення|adiós|görüşürüz|مع\\s+السلامة|再见|להתראות')],
  ['gratitude', boundary('спасибо|благодарю|ты\\s+(?:крут|прикольн|молодец|красавчик|хорош)|вы\\s+(?:крут|молодцы|хорош)|thanks?|thank\\s+you|nice\\s+(?:one|work)|good\\s+bot|great\\s+job|you\\s+are\\s+(?:cool|great|nice)|дякую|круто|молодець|gracias|genial|buen\\s+trabajo|teşekkür|harikasın|شكراً|أحسنت|رائع|谢谢|做得好|תודה|כל\\s+הכבוד')],
  ['greeting', boundary('привет|здравствуй(?:те)?|доброе\\s+утро|добрый\\s+(?:день|вечер)|hello|hi|hey|привіт|вітаю|hola|buenas|merhaba|selam|مرحبا|أهلاً|你好|您好|שלום')],
  ['confirmation', /^(?:да|ага|верно|yes|correct|так|sí|evet|نعم|是|כן)(?=$|[\s.,!?…:;،。！？])/iu],
  ['denial', /^(?:нет|неа|no|ні|hayır|لا|不是|לא)(?=$|[\s.,!?…:;،。！？])/iu],
  ['small_talk_boundary', boundary('как\\s+дела|как\\s+ты|what\\x27s\\s+up|how\\s+are\\s+you|qué\\s+tal|nasılsın|كيف\\s+حال|你好吗|מה\\s+שלומך')],
  ['when_question', boundary('когда|when|коли|cuándo|ne\\s+zaman|متى|什么时候|מתי')],
  ['why_question', boundary('почему|why|чому|por\\s+qué|neden|لماذا|为什么|למה')],
  ['how_to_question', boundary('как|how|як|cómo|nasıl|كيف|怎么|כיצד|איך')],
])


const TOPIC_ALIASES = Object.freeze([
  ['exchange_ai', /(?:exchange\s*ai|ai\s*(?:box|quota|analysis|signal)|ai\s+(?:analysis|signal)|ии\s+(?:аналитик|сигнал)|ai\s*квот|сигнал(?:ы)?\s+бирж|ذكاء\s+المنصة|交易所\s*ai|ai\s*交易|ai\s+אותות)/iu],
  ['exchange', /(?:quantum\s+exchange|exchange|бирж|бірж|торг(?:ов|овать)|стакан\s+заяв|график\s+(?:цен|рын)|market\s+(?:chart|analytics)|order\s*book|borsa|منصة\s+التداول|交易所|交易图表|בורסה)/iu],
  ['battlecoin', /(?:battle\s*coin|батлкоин|battlecoin|عملة\s+المعركة|战斗币|באטלקוין)/iu],
  ['battle_chat', /(?:battle\s+chat|боев(?:ой|ом)\s+чат|battlecoin\s+chat|战斗聊天|צ׳אט\s+קרב)/iu],
  ['futures', /(?:futures|фьючерс|дериватив|vadeli|العقود\s+الآجلة|期货|חוזים\s+עתידיים)/iu],
  ['academy_exam', /(?:academy\s+exam|экзамен\s+академ|іспит\s+академ|examen\s+academ|akademi\s+sınav|اختبار\s+الأكاديمية|学院考试|מבחן\s+האקדמיה)/iu],
  ['academy', /(?:academy|академ|курс|урок|course|lección|الأكاديمية|课程|אקדמיה|(?:^|[^\p{L}\p{N}_])ders(?=$|[^\p{L}\p{N}_]))/iu],
  ['gameverse', /(?:gameverse|геймверс|игр(?:а|ы|овой)|oyun|الألعاب|游戏宇宙|גיימברס)/iu],
  ['metastudio', /(?:metastudio|метастуди|студи[яю]\s+контент|استوديو\s+ميتا|元工作室|מטאסטודיו)/iu],
  ['metaverse', /(?:metaverse|метавселен|метаверс|ميتافيرس|元宇宙|מטאוורס)/iu],
  ['forum_threads', /(?:thread|ветк(?:а|е|и)|ответ(?:ы)?\s+в\s+тем|forum\s+thread|форумн(?:ая|ой)\s+ветк|سلسلة\s+المنتدى|论坛主题|שרשור)/iu],
  ['forum_feed', /(?:forum\s+feed|лент(?:а|е)\s+форум|пост(?:ы)?\s+в\s+лент|стрічк(?:а|и)\s+форум|خلاصة\s+المنتدى|论坛动态|פיד\s+פורום)/iu],
  ['search', /(?:поиск|search|buscar|arama|بحث|搜索|חיפוש)/iu],
  ['geodetect', /(?:geodetect|геодетект|геолокац|гео[- ]?сорт|geographic\s+feed|географічн(?:а|ої)\s+стрічк|географическ(?:ая|ой)\s+лент|location\s+detect|konum|الموقع\s+الجغرافي|地理定位|זיהוי\s+מיקום)/iu],
  ['moderation', /(?:модерац|жалоб\p{L}*|скарг\p{L}*|пожаловал\p{L}*|поскаржив\p{L}*|обжал\p{L}*|оскарж\p{L}*|удалил(?:и|ся)\s+пост|видалил\p{L}*\s+допис|ограничен\p{L}*\s+публикац\p{L}*\s+медиа|обмежен\p{L}*\s+публікац\p{L}*\s+медіа|moderation|post\s+removed\s+after\s+reports?|appeal\s+(?:a\s+)?media\s+publishing\s+restriction|who\s+reported\s+the\s+post|report(?:ed)?\s+post|reports?[^.!?]{0,60}violations?|violations?[^.!?]{0,60}appeal|deletion[^.!?]{0,40}appeal|moderación|moderasyon|الإشراف|审核|פיקוח)/iu],
  ['media', /(?:медиа|видео|аудио|изображен|upload|autoplay|media|yükleme|وسائط|媒体|מדיה)/iu],
  ['metamarket', /(?:metamarket|метамаркет|подарок|gift|marketplace|item(?:'s)?\s+price[^.!?]{0,48}(?:grow|rise|increase|go\s+up)|предмет\p{L}*[^.!?]{0,48}(?:подорожа|подорожча|выраст\p{L}*(?:\s+в\s+цен\p{L}*)?|зрост\p{L}*(?:\s+в\s+цін\p{L}*)?)|سوق\s+ميتا|元市场|מטאמרקט)/iu],
  ['quantum_family', /(?:quantum\s+family|квантум\s+фемили|подписчик|подписк(?:а|и)|followers?|متابع|关注者|עוקבים)/iu],
  ['profile', /(?:профил|аватар|никнейм|profile|avatar|nickname|perfil|profil|الملف\s+الشخصي|个人资料|פרופיל)/iu],
  ['auth', /(?:авторизац|вход|сесси[яю]|login|sign\s*in|authentication|giriş|تسجيل\s+الدخول|登录|התחברות)/iu],
  ['wallet', /(?:quantum\s+wallet|кошел[её]к|wallet|cüzdan|محفظة|钱包|ארנק)/iu],
  ['telegram', /(?:telegram|телеграм|tma|mini\s*app|تيليغرام|电报|טלגרם)/iu],
  ['qcoin', /(?:qcoin|q\s*coin|кьюкоин|кюкоин|q-?коин|баланс|остаток|состояни[ея]\s+баланса|сколько\s+(?:у\s+меня|на\s+счету)|balance|saldo|رصيد|余额|יתרה|عملة\s*q|q币|קיו\s*קוין)/iu],
  ['payments', /(?:плат[её]ж|оплат|invoice|payment|checkout|pago|ödeme|دفع|支付|תשלום)/iu],
  ['vip', /(?:vip\s*plus|vip|вип|премиум\s+пакет|подписк(?:а|и|у|ой|е)|subscription|suscripción|abonelik|اشتراك\s+vip|اشتراك|会员|订阅|וי\s*איי\s*פי|מנוי)/iu],
  ['ads_campaigns', /(?:рекламн(?:ая|ой|ую)\s+кампан|кампан(?:ия|ии)\s+ads|ads\s+campaign|показ(?:ы)?\s+реклам|ctr|impressions?|campaña|reklam\s+kampanya|حملة\s+إعلانية|广告活动|קמפיין\s+פרסום)/iu],
  ['ads_packages', /(?:ads?\s+packages?|advertising\s+packages?|пакет\p{L}*\s+реклам|рекламн\p{L}*\s+пакет\p{L}*|рекламн\p{L}*\s+пакет\p{L}*|тариф\p{L}*\s+реклам|reklam\s+paket|حزمة\s+إعلانية|广告套餐|חבילת\s+פרסום)/iu],
  ['push', /(?:push|пуш|уведомлен(?:ие|ия)|notification|bildirim|إشعار|推送通知|התראה)/iu],
  ['messenger', /(?:quantum\s+messenger|мессенджер|личн(?:ые|ых)\s+сообщен|\bdm\b|direct\s+message|رسائل\s+خاصة|私信|מסנג׳ר)/iu],
  ['quests', /(?:(?<![A-Za-z0-9_])quests?(?![A-Za-z0-9_])|квест|задан(?:ие|ия)|任务|مهمة|משימה)/iu],
  ['contact', /(?:contact\s+form|strategic\s+contact|business\s+contacts?|partnership\s+(?:proposal|concerning)|commercial\s+partnership|reach\s+the\s+operator|partnership|partner(?:ship)?|(?:^|[^\p{L}\p{N}_])invest(?=$|[^\p{L}\p{N}_])|investment|investor|collaboration|asociaci[oó]n\s+comercial|socio\s+comercial|iş\s+ortaklığı|форма\s+обратн|связаться|контакт|делов\p{L}*\s+контакт|бизнес[- ]предлож|партн[её]р|партнерств|инвестиц|інвестува|сотрудничеств|اتصل|شراكة|شريك|استثمار|مستثمر|合作|投资|联系表单|טופס\s+יצירת\s+קשר|שותף|שותפות|שיתוף\s+פעולה|השקעה|משקיע)/iu],
  ['privacy', /(?:privacy|personal[- ]data|data\s+handling|конфиденциальност|персональн(?:ые|ых)\s+данн|privacidad|gizlilik|الخصوصية|隐私|פרטיות)/iu],
  ['security', /(?:security|безопасност|взлом|токен|парол|мошен|güvenlik|الأمان|安全|אבטחה)/iu],
  ['account_deletion', /(?:удал(?:ить|ение)\s+аккаунт|delete\s+account|account\s+deletion|data\s+cleanup|hesap\s+sil|حذف\s+الحساب|删除账户|מחיקת\s+חשבון)/iu],
  ['system_status', /(?:system\s+status|runtime\s+status|source\s+status|error[_ -]?status|status\s+unknown|current\s+availability|статус\s+систем|сервис\s+(?:лежит|недоступ)|outage|status\s+page|حالة\s+النظام|系统状态|מצב\s+המערכת)/iu],
  ['localization', /(?:deep\s+translate|localization|localisation|translate|локализац|перевод|язык|translation|locale|çeviri|ترجمة|翻译|תרגום)/iu],
  ['accessibility', /(?:accessibility|доступност|скринридер|клавиатурн(?:ая|ой)\s+навигац|erişilebilirlik|إمكانية\s+الوصول|无障碍|נגישות)/iu],
  ['learning_governance', /(?:self[-\s]?learning|self[-\s]?calibr|safe\s+learning|learning\s+governance|dialogue\s+learning|poisoning\s+guard|shadow|canary|rollback|самообуч|само.?калибр|учишься\s+на\s+диалог|учится\s+на\s+диалог|обучение\s+поддержк|безопасн\w*\s+обуч|отравить\s+обуч|самонавч|самокалібр|зламати\s+самокалібр|تعلم\s+ذاتي|معايرة\s+ذاتية|自学习|自我校准|למידה\s+עצמית|כיול\s+עצמי)/iu],
  ['roadmap', /(?:roadmap|дорожн(?:ая|ой)\s+карт|خارطة\s+الطريق|路线图|מפת\s+דרכים)/iu],
  ['navigation', /(?:навигац|меню|куда\s+нажать|navigation|menü|التنقل|导航|ניווט)/iu],
  ['news', /(?:crypto\s+news|крипто\s*новост|новост(?:и)?\s+крипт|важност[ьи]\s+новост|news\s+importance|market\s+news|أخبار\s+العملات|أهمية\s+الأخبار|加密新闻|新闻重要性|חדשות\s+קריפטו)/iu],
  ['homepage', /(?:homepage|главн(?:ая|ой)\s+страниц|cryptoradar|crypto\s*radar|market\s*radar|крипто\s*радар|крипторадар|радар\s+рынк|الصفحة\s+الرئيسية|رادار\s+السوق|主页|市场雷达|דף\s+הבית)/iu],
  ['platform', /(?:экосистем|platform|платформ|منصة\s+quantum|平台|פלטפורמה)/iu],
  ['support_system', /(?:ql7\s+support|служб(?:а|е)\s+поддержк|support\s+system|tell\s+me\s+a\s+joke|who\s+are\s+you|human\s+operator|stop\s+repeating\s+yourself|scammers?\s+and\s+liars?|(?:^|[^\p{L}\p{N}_])help(?=$|[^\p{L}\p{N}_])|دعم\s+ql7|支持系统|מערכת\s+התמיכה)/iu],
])

// Named product/topic anchors outrank incidental account-state decorations. The
// simulator deliberately appends VIP/Ads/QCoin state to unrelated questions;
// real conversations do the same. Position-aware scoring keeps the user's
// first explicit subject primary while preserving every secondary hypothesis.
const EXPLICIT_TOPIC_ANCHORS_V11_2 = Object.freeze([
  ['platform', /quantum\s+l7\s+ai/iu],
  ['homepage', /crypto\s*radar|cryptoradar/iu],
  ['news', /crypto\s+news|market\s+news/iu],
  ['exchange_ai', /exchange\s*ai|ai\s*box|ai\s*workbench/iu],
  ['exchange', /quantum\s+exchange|(?:^|[^\p{L}\p{N}_])(?:exchange|бирж\p{L}*|бірж\p{L}*)(?=$|[^\p{L}\p{N}_])/iu],
  ['battlecoin', /battle\s*coin|battlecoin/iu],
  ['battle_chat', /battle\s+chat/iu],
  ['futures', /(?:^|[^\p{L}\p{N}_])futures(?=$|[^\p{L}\p{N}_])/iu],
  ['academy_exam', /academy\s+exam/iu],
  ['academy', /quantum\s+academy/iu],
  ['gameverse', /gameverse/iu],
  ['metastudio', /meta\s*studio|metastudio/iu],
  ['metaverse', /metaverse/iu],
  ['forum_threads', /forum\s+threads?/iu],
  ['forum_feed', /forum\s+feed/iu],
  ['search', /quantum\s+search/iu],
  ['geodetect', /geo\s*detect|geodetect/iu],
  ['media', /forum\s+media/iu],
  ['moderation', /(?:^|[^\p{L}\p{N}_])moderation(?=$|[^\p{L}\p{N}_])|post\s+removed\s+after\s+reports?|appeal\s+(?:a\s+)?media\s+publishing\s+restriction|who\s+reported\s+the\s+post|пост\s+удалил\p{L}*\s+после\s+жалоб|допис\s+видалил\p{L}*\s+після\s+скарг|обжал\p{L}*\s+ограничен\p{L}*\s+публикац\p{L}*\s+медиа|оскарж\p{L}*\s+обмежен\p{L}*\s+публікац\p{L}*\s+медіа|кто\s+пожаловал\p{L}*\s+на\s+пост|хто\s+поскаржив\p{L}*\s+на\s+допис/iu],
  ['metamarket', /meta\s*market|metamarket|item(?:'s)?\s+price[^.!?]{0,48}(?:grow|rise|increase|go\s+up)|предмет\p{L}*[^.!?]{0,48}(?:подорожа|подорожча|выраст\p{L}*(?:\s+в\s+цен\p{L}*)?|зрост\p{L}*(?:\s+в\s+цін\p{L}*)?)/iu],
  ['quantum_family', /quantum\s+family|followers?\s+and\s+subscriptions?|подписчик\p{L}*\s+и\s+подписк\p{L}*|підписник\p{L}*\s+і\s+підписк\p{L}*/iu],
  ['profile', /(?:^|[^\p{L}\p{N}_])profile(?=$|[^\p{L}\p{N}_])/iu],
  ['auth', /authorization|authentication/iu],
  ['wallet', /quantum\s+wallet/iu],
  ['telegram', /(?:^|[^\p{L}\p{N}_])telegram(?=$|[^\p{L}\p{N}_])/iu],
  ['qcoin', /q\s*coin|qcoin/iu],
  ['payments', /(?:^|[^\p{L}\p{N}_])payments?(?=$|[^\p{L}\p{N}_])/iu],
  ['vip', /(?:^|[^\p{L}\p{N}_])vip(?:\s+plus)?(?=$|[^\p{L}\p{N}_])/iu],
  ['ads_packages', /(?:ad|ads|advertising)\s+packages?|рекламн\p{L}*\s+пакет\p{L}*|пакет\p{L}*\s+реклам/iu],
  ['ads_campaigns', /(?:ad|ads|advertising)\s+campaigns?/iu],
  ['push', /(?:^|[^\p{L}\p{N}_])push(?=$|[^\p{L}\p{N}_])|push\s+notifications?/iu],
  ['messenger', /quantum\s+messenger/iu],
  ['quests', /(?<![A-Za-z0-9_])quests?(?![A-Za-z0-9_])/iu],
  ['contact', /partnership|commercial\s+partnership|partnership\s+concerning|investment\s+proposal|strategic\s+contact|business\s+contacts?|(?:^|[^\p{L}\p{N}_])invest(?=$|[^\p{L}\p{N}_])|reach\s+the\s+operator|asociaci[oó]n\s+comercial|socio\s+comercial|iş\s+ortaklığı|делов\p{L}*\s+контакт|бизнес[- ]предлож|инвестир\p{L}*|інвестува\p{L}*|שותפות|שיתוף\s+פעולה|شراكة|合作/iu],
  ['privacy', /(?:^|[^\p{L}\p{N}_])privacy(?=$|[^\p{L}\p{N}_])|personal[- ]data(?:\s+handling)?|data\s+handling/iu],
  ['security', /(?:^|[^\p{L}\p{N}_])security(?=$|[^\p{L}\p{N}_])/iu],
  ['account_deletion', /account\s+deletion|delete\s+account|data\s+cleanup/iu],
  ['navigation', /(?:^|[^\p{L}\p{N}_])navigation(?=$|[^\p{L}\p{N}_])/iu],
  ['roadmap', /(?:^|[^\p{L}\p{N}_])roadmap(?=$|[^\p{L}\p{N}_])|roadmap\s+and\s+future\s+plans/iu],
  ['system_status', /system\s+status/iu],
  ['localization', /deep\s+translate|localization|localisation/iu],
  ['accessibility', /(?:^|[^\p{L}\p{N}_])accessibility(?=$|[^\p{L}\p{N}_])/iu],
  ['learning_governance', /self[-\s]?learning|self[-\s]?calibr|safe\s+learning|learning\s+governance|poisoning\s+guard|shadow|canary|rollback|самообуч|само.?калибр/iu],
  ['support_system', /ql7\s+support/iu],
])

const MIXED_KEYBOARD_REPAIR = Object.freeze({ 'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y' })
function repairMixedKeyboardLayout(value = '') {
  return str(value).replace(/[\p{L}\p{N}_-]+/gu, (token) => {
    if (!/[a-z]/iu.test(token) || !/[йцукен]/iu.test(token)) return token
    return token.replace(/[йцукен]/giu, (char) => {
      const replacement = MIXED_KEYBOARD_REPAIR[char.toLowerCase()]
      return char === char.toUpperCase() ? replacement?.toUpperCase() || char : replacement || char
    })
  })
}
function semanticTopicVariants(value = '') {
  const source = str(value)
  const repaired = repairMixedKeyboardLayout(source)
  return Object.freeze(Array.from(new Set([source, repaired].filter(Boolean))))
}

const TOPIC_REJECTION_PREFIX_V11_2 = /(?:^|[\s([{:;,.!?…—-])(?:не\s+(?:про|о|об|относительно)|не|not\s+(?:about\s+)?|no\s+(?:sobre\s+)?|no\s+se\s+trata\s+de|não\s+(?:sobre\s+)?|nicht\s+(?:über\s+)?|ليس\s+(?:عن\s+)?|لا\s+أتحدث\s+عن|לא\s+(?:על\s+)?|不是|不要)\s*$/iu
const TOPIC_REJECTION_INCLUSIVE_PREFIX_V11_2 = /(?:не\s+только|not\s+only|no\s+solo|não\s+apenas|nicht\s+nur|ليس\s+فقط|לא\s+רק|不只是)\s*$/iu

function patternMatchesV11_2(pattern, value = '') {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const probe = new RegExp(pattern.source, flags.replace(/y/gu, ''))
  return Array.from(str(value).matchAll(probe))
}

function isRejectedTopicMentionV11_2(value = '', index = 0) {
  const source = str(value).normalize('NFKC').toLowerCase()
  const left = source.slice(Math.max(0, Number(index || 0) - 72), Math.max(0, Number(index || 0)))
  if (TOPIC_REJECTION_INCLUSIVE_PREFIX_V11_2.test(left)) return false
  return TOPIC_REJECTION_PREFIX_V11_2.test(left)
}

const INCIDENT = /(?:ошиб|не\s+работает|не\s+приш|не\s+могу|не\s+активир|не\s+активув|не\s+активован|не\s+включил|пропал|сбой|error|failed|broken|doesn.t\s+work|did\s+not\s+activat|not\s+activat|still\s+inactive|no\s+se\s+activ|no\s+est[aá]\s+activ|inactive|missing|not\s+(?:credited|received)|did\s+not\s+(?:arrive|credit)|не\s+(?:зачисл|начисл|поступил)|не\s+прийш|hata|çalışmıyor|etkinleşmedi|خطأ|لا\s+يعمل|لم\s+يتم\s+التفعيل|无法|失败|未激活|תקלה|לא\s+עובד|לא\s+הופעל|500|timeout)/iu
const PROFANITY = /(?:^|[^\p{L}\p{N}_])(?:бля|бляд|сука|хуй|нахуй|пизд|еба|дебил|идиот|fuck|shit|idiot|asshole|arschloch|schei(?:ss|ß)e|hurensohn|fick|puta|mierda|gilipollas|aptal|salak|siktir|orospu|غبي|أحمق|لعنة|تباً|كلب|حمار|操|妈的|傻逼|滚|טיפש|מטומטם|חרא|בן\s+זונה)(?=$|[^\p{L}\p{N}_])/iu
const BARE_IDENTIFIER = /^(?:0x[a-f0-9]{40}|[a-z0-9][a-z0-9:_-]{5,159}|\d{5,})$/iu
const NOISE = /^(?:[^\p{L}\p{N}]{1,20}|(.)\1{5,})$/u
const PERSONAL_STATUS_SHAPE = /(?:како(?:й|е|го)|состояни[ея]|статус|проверь|сколько|show|check|estado|durum|تحقق|בדוק|检查|查看).{0,80}(?:мо(?:й|я|и|его|ему|ём|ем|ю|ей|их)|у\s+меня|на\s+меня|my|mi|hesabım|aboneliğim|رصيدي|حسابي|اشتراكي|שלי|我的).{0,80}(?:баланс\p{L}*|qcoin|wallet|кошел\p{L}*|плат[её]ж\p{L}*|пакет\p{L}*|статус\p{L}*|подписк\p{L}*|жалоб\p{L}*|аккаунт\p{L}*|профил\p{L}*|реклам\p{L}*|кампан\p{L}*|balance|payment|package|account|profile|ads|campaign|subscription|reports?|complaints?|saldo|cuenta|perfil|suscripción|رصيد|حساب|اشتراك|יתרה|חשבון|מנוי|余额|账号|广告|订阅|举报)/iu
const INFORMATION_REQUEST = /(?:расскаж\p{L}*|объясн\p{L}*|поясн\p{L}*|опиши|что\s+такое|что\s+значит|что\s+за|tell\s+me|explain|describe|what\s+is|what\s+does|qué\s+es|explica|describe|anlat|açıkla|اشرح|ما\s+هو|حدثني|说明|介绍|מה\s+זה|תסביר)/iu
const NATIVE_PROFANITY = /(?:^|[^\p{L}\p{N}_])(?:бля\p{L}*|сука|ху[ийеё]\p{L}*|хуило|нахуй|пизд\p{L}*|еба\p{L}*|ёба\p{L}*|дебил|идиот|мудак|долбо[её]б|fuck|shit|idiot|asshole|arschloch|schei(?:ss|ß)e|h+u+r+e+n+s+o+h+n|huhrensohn|fick|wichser|puta|mierda|gilipollas|aptal|salak|siktir|orospu|غبي|أحمق|لعنة|تبا|كلب|حمار|操|妈的|傻逼|滚|טיפש|מטומטם|חרא|בן\s+זונה)(?=$|[^\p{L}\p{N}_])/iu
const NATIVE_HELP = /(?:помог|помож|помоч|разбер|исправ|почин|не\s+работ|help|fix|hilf|helfen|funktioniert\s+nicht|ayuda|yard[ıi]m|ساعد|لا\s+يعمل|帮助|修复|עזור|עזרה|לא\s+עובד)/iu
const NATIVE_SELF_STATUS = /(?:како(?:й|е|го)|состояни[ея]|статус|покажи|проверь|сколько|есть\s+ли|show|check|status|state|estado|durum|zeige|prüf|تحقق|اعرض|בדוק|הצג|查看|检查).{0,90}(?:мой|моя|моё|мое|мои|моего|моей|мою|у\s+меня|на\s+меня|my|mi|mein(?:e|en|er)?|hesab[ıi]m|aboneli[gğ]im|رصيدي|حسابي|اشتراكي|שלי|我的).{0,90}(?:vip|вип|баланс\p{L}*|qcoin|кошел\p{L}*|плат[её]ж\p{L}*|пакет\p{L}*|подписк\p{L}*|жалоб\p{L}*|реклам\p{L}*|кампан\p{L}*|метрик\p{L}*|balance|wallet|payment|package|subscription|reports?|complaints?|ads|campaign|metrics?|guthaben|abo|anzeigen|werbung|kampagne|رصيد|حساب|اشتراك|إعلان|حملة|יתרה|חשבון|מנוי|פרסום|余额|账号|广告|订阅|举报)|(?:мой|моя|моё|мое|мои|моего|моей|мою|у\s+меня|на\s+меня|my|mi|mein(?:e|en|er)?|رصيدي|حسابي|اشتراكي|שלי|我的).{0,90}(?:vip|вип|баланс\p{L}*|qcoin|кошел\p{L}*|пакет\p{L}*|подписк\p{L}*|жалоб\p{L}*|реклам\p{L}*|кампан\p{L}*|метрик\p{L}*|balance|wallet|package|subscription|reports?|complaints?|ads|campaign|metrics?|guthaben|abo|anzeigen|werbung|kampagne|رصيد|اشتراك|إعلان|חבילה|פרסום|余额|广告|订阅|举报)/iu
const NATIVE_ADS_METRICS = /(?:метрик\p{L}*|аналитик\p{L}*|показ\p{L}*|просмотр\p{L}*|клик\p{L}*|ctr|metrics?|analytics?|impressions?|views?|clicks?|werbung|anzeigen|kampagne|إعلان|حملة|广告|פרסום).{0,90}(?:реклам\p{L}*|кампан\p{L}*|ads?|advertis\p{L}*|campaign|werbung|anzeigen|إعلان|حملة|广告|פרסום)|(?:реклам\p{L}*|кампан\p{L}*|ads?|advertis\p{L}*|campaign|werbung|anzeigen|إعلان|حملة|广告|פרסום).{0,90}(?:метрик\p{L}*|аналитик\p{L}*|показ\p{L}*|просмотр\p{L}*|клик\p{L}*|ctr|metrics?|analytics?|impressions?|views?|clicks?)/iu
const NATIVE_VIP_STATUS = /(?:vip|вип|подписк\p{L}*|subscription|abo|اشتراك|מנוי|订阅).{0,90}(?:мой|моя|моего|у\s+меня|my|mein|رصيدي|حسابي|שלי|我的|статус|состояни[ея]|active|актив)|(?:мой|моя|моего|у\s+меня|my|mein|حسابي|שלי|我的|статус|состояни[ея]).{0,90}(?:vip|вип|подписк\p{L}*|subscription|abo|اشتراك|מנוי|订阅)/iu
const NATIVE_QCOIN_BALANCE = /(?:баланс\p{L}*|остаток|qcoin|кошел\p{L}*|balance|wallet|saldo|guthaben|رصيد|יתרה|余额).{0,90}(?:мой|моя|моего|у\s+меня|my|mein|حسابي|שלי|我的)|(?:мой|моя|моего|у\s+меня|my|mein|حسابي|שלי|我的).{0,90}(?:баланс\p{L}*|остаток|qcoin|кошел\p{L}*|balance|wallet|saldo|guthaben|رصيد|יתרה|余额)/iu
const SYSTEM_STATUS_PRIMARY_ANCHOR_V12 = /(?:current\s+runtime\s+status|runtime\s+status|system\s+status|current\s+availability|статус\s+систем|состояни[ея]\s+систем|системн\w+\s+статус|系统状态|מצב\s+המערכת|حالة\s+النظام)/iu

function classifyQuestion(value, previousContext) {
  const lower = normalized(value)
  const socialPrefix = classifyQl7SupportSocialActV11(lower)
  const hasGreeting = socialPrefix?.act === 'greeting' || socialPrefix?.prefixAct === 'greeting' || RULES.find(([name]) => name === 'greeting')[1].test(lower)
  const hasIncident = INCIDENT.test(lower)
  if (hasIncident) return { act: 'incident_report', greetingPrefix: hasGreeting }
  const semanticNuance = classifyQl7SupportSemanticNuanceV11(lower, { previousTopic: previousContext?.previousTopic || previousContext?.topic || '' })
  if (semanticNuance) {
    if (/(?:_self_status|_metrics|_balance|_report_count|_connection_status)$/u.test(semanticNuance.subIntent)) return { act: 'personal_status_request', greetingPrefix: hasGreeting }
    if (/(?:_purchase|_create|_how_to)$/u.test(semanticNuance.subIntent)) return { act: 'how_to_question', greetingPrefix: hasGreeting }
    if (/_benefits$/u.test(semanticNuance.subIntent)) return { act: 'informational_question', greetingPrefix: hasGreeting }
  }
  const identityRule = RULES.find(([name]) => name === 'identity_question')
  const personalStatusRule = RULES.find(([name]) => name === 'personal_status_request')
  if (identityRule?.[1].test(lower)) return { act: 'identity_question', greetingPrefix: hasGreeting }
  if (
    personalStatusRule?.[1].test(lower) ||
    PERSONAL_STATUS_SHAPE.test(lower) ||
    NATIVE_SELF_STATUS.test(lower) ||
    (/(?:покажи|проверь|дай|выведи|show|check|zeige|اعرض|تحقق|בדוק|הצג|查看|检查)/iu.test(lower) && NATIVE_ADS_METRICS.test(lower))
  ) return { act: 'personal_status_request', greetingPrefix: hasGreeting }
  if (INFORMATION_REQUEST.test(lower)) return { act: 'informational_question', greetingPrefix: hasGreeting }
  for (const name of ['how_to_question', 'why_question', 'when_question']) {
    const rule = RULES.find(([candidate]) => candidate === name)
    if (rule?.[1].test(lower)) return { act: name, greetingPrefix: hasGreeting }
  }
  if (/[?？]/u.test(value) || /(?:что\s+такое|what\s+is|qué\s+es|nedir|ما\s+هو|是什么|מהו)/iu.test(lower)) {
    return { act: 'informational_question', greetingPrefix: hasGreeting }
  }
  if (previousContext?.currentQuestionCode && BARE_IDENTIFIER.test(value)) {
    return { act: 'answer_to_question', greetingPrefix: false }
  }
  return null
}

export function classifyQl7SupportAdultMessageAct(text = '', previousContext = {}, tone = {}) {
  const value = str(text)
  if (!value) return Object.freeze({ act: 'empty', greetingPrefix: false, evidence: [] })
  for (const protectedAct of ['prompt_injection', 'foreign_account_request', 'privacy_attack', 'human_operator_request', 'threat']) {
    const rule = RULES.find(([act]) => act === protectedAct)
    if (rule?.[1].test(value)) return Object.freeze({ act: protectedAct, greetingPrefix: false, evidence: [rule[1].source] })
  }
  const humorRule = RULES.find(([act]) => act === 'humor_play')
  if (humorRule?.[1].test(value) && !tone?.safetyEscalation) {
    return Object.freeze({ act: 'humor_play', greetingPrefix: false, evidence: [humorRule[1].source] })
  }
  if (PROFANITY.test(value) || NATIVE_PROFANITY.test(value)) {
    const withRequest = INCIDENT.test(value) || NATIVE_HELP.test(value) || /(?:помоги|help|ayuda|yardım|ساعد|帮助|עזור)/iu.test(value)
    return Object.freeze({ act: withRequest ? 'profanity_with_request' : 'profanity_without_request', greetingPrefix: false, evidence: ['profanity_context'] })
  }
  const social = classifyQl7SupportSocialActV11(value)
  if (social?.act) return Object.freeze({ act: social.act, greetingPrefix: false, evidence: social.evidence || [`social:${social.act}`] })
  const question = classifyQuestion(value, previousContext)
  if (question) return Object.freeze({ ...question, evidence: ['question_shape'] })

  for (const [act, pattern] of RULES) {
    if (['prompt_injection', 'foreign_account_request', 'privacy_attack', 'human_operator_request', 'threat'].includes(act)) continue
    if (!pattern.test(value)) continue
    if (act === 'greeting' && (value.length > 48 || NATIVE_HELP.test(value) || INCIDENT.test(value))) continue
    return Object.freeze({ act, greetingPrefix: false, evidence: [pattern.source] })
  }

  if (BARE_IDENTIFIER.test(value)) {
    return Object.freeze({
      act: previousContext?.currentQuestionCode ? 'answer_to_question' : 'bare_identifier',
      greetingPrefix: false,
      evidence: ['bare_identifier_shape'],
    })
  }
  if (NOISE.test(value)) return Object.freeze({ act: 'spam_or_noise', greetingPrefix: false, evidence: ['noise_shape'] })
  if (tone?.safetyEscalation === true) return Object.freeze({ act: 'threat', greetingPrefix: false, evidence: ['tone_safety'] })
  if (INCIDENT.test(value)) return Object.freeze({ act: 'incident_report', greetingPrefix: false, evidence: ['incident_lexeme'] })
  if (previousContext?.currentQuestionCode && value.length < 240) return Object.freeze({ act: 'answer_to_question', greetingPrefix: false, evidence: ['pending_question'] })
  return Object.freeze({ act: 'ambiguous_request', greetingPrefix: false, evidence: ['fallback'] })
}

function resolveQl7SupportAdultMessageAct(actResult = {}, baseAnalysis = {}) {
  const current = str(actResult?.act || 'ambiguous_request')
  if (current !== 'ambiguous_request') return Object.freeze({ ...actResult, act: current })
  const legacyRole = str(baseAnalysis?.role || baseAnalysis?.messageAct)
  const subIntent = str(baseAnalysis?.subIntent)
  const selfReference = baseAnalysis?.entities?.selfReference === true || /(?:^|_)self_status$/u.test(subIntent)
  const mapped = {
    problem_description: 'incident_report',
    additional_evidence: 'evidence_submission',
    conversation_close: 'farewell',
    status_request: selfReference ? 'personal_status_request' : 'status_followup',
    security_alert: 'complaint',
  }[legacyRole] || ''
  if (!mapped) return Object.freeze({ ...actResult, act: current })
  return Object.freeze({
    ...actResult,
    act: mapped,
    evidence: Object.freeze([...(Array.isArray(actResult?.evidence) ? actResult.evidence : []), `legacy_role:${legacyRole}`]),
  })
}

function topicCandidates(text, fallback = '', previousFocus = '') {
  const variants = semanticTopicVariants(text)
  const primary = variants[0] || str(text)
  const segments = Array.from(new Set(variants.flatMap((value) => str(value).split(/[.!?。！？\n]+/u).map((item) => item.trim()).filter(Boolean))))
  const scores = new Map()
  const evidence = new Map()
  const rejectedTopics = new Set()
  const positiveTopics = new Set()
  const isRejectedOnly = (topic) => {
    const normalizedTopic = normalizeQl7SupportTopic(topic)
    return rejectedTopics.has(normalizedTopic) && !positiveTopics.has(normalizedTopic)
  }
  const add = (topic, score, matched) => {
    const normalizedTopic = normalizeQl7SupportTopic(topic)
    if (!normalizedTopic) return
    scores.set(normalizedTopic, Math.max(Number(scores.get(normalizedTopic) || 0), score))
    const list = evidence.get(normalizedTopic) || []
    if (matched && !list.includes(matched)) list.push(matched)
    evidence.set(normalizedTopic, list)
  }

  for (const variant of variants) {
    for (const [topic, pattern] of EXPLICIT_TOPIC_ANCHORS_V11_2) {
      for (const match of patternMatchesV11_2(pattern, variant)) {
        const normalizedTopic = normalizeQl7SupportTopic(topic)
        if (isRejectedTopicMentionV11_2(variant, match.index || 0)) {
          rejectedTopics.add(normalizedTopic)
          continue
        }
        positiveTopics.add(normalizedTopic)
        const indexPenalty = Math.min(900, Math.max(0, Number(match.index || 0))) / 100000
        add(topic, Math.max(0.989, 0.999 - indexPenalty), `named:${topic}@${match.index || 0}`)
      }
    }
  }

  const premiumIntent = classifyQl7PremiumMicroIntentV11_6(primary, { previousTopic: previousFocus })
  const prePremiumTop = [...scores.entries()]
    .map(([topic, confidence]) => ({ topic, confidence }))
    .sort((left, right) => right.confidence - left.confidence || left.topic.localeCompare(right.topic))[0] || null
  const premiumRefinements = Object.freeze({
    exchange: new Set(['exchange_ai', 'battlecoin', 'battle_chat', 'futures']),
    ads_campaigns: new Set(['ads_packages']),
    forum_feed: new Set(['forum_threads', 'media', 'search', 'geodetect']),
    profile: new Set(['account_deletion']),
  })
  const premiumMatchesStrongTopic = Boolean(
    premiumIntent && prePremiumTop && (
      premiumIntent.topic === prePremiumTop.topic ||
      premiumRefinements[prePremiumTop.topic]?.has(premiumIntent.topic)
    )
  )
  const premiumMayLead = Boolean(!prePremiumTop || prePremiumTop.confidence < 0.96 || premiumMatchesStrongTopic)
  if (premiumIntent && premiumMayLead && !isRejectedOnly(premiumIntent.topic)) {
    add(premiumIntent.topic, premiumIntent.confidence, premiumIntent.evidence?.[0] || `micro-intent:${premiumIntent.id}`)
  }
  const semanticNuance = classifyQl7SupportSemanticNuanceV11(primary, { previousTopic: previousFocus })
  if (semanticNuance && !isRejectedOnly(semanticNuance.topic)) {
    add(semanticNuance.topic, semanticNuance.confidence, semanticNuance.evidence?.[0] || `nuance:${semanticNuance.subIntent}`)
  }
  if (NATIVE_ADS_METRICS.test(primary) && !isRejectedOnly('ads_campaigns')) add('ads_campaigns', 0.985, 'native:ads_metrics')
  if (NATIVE_VIP_STATUS.test(primary) && !isRejectedOnly('vip')) add('vip', 0.985, 'native:vip_self_status')
  if (NATIVE_QCOIN_BALANCE.test(primary) && !isRejectedOnly('qcoin')) add('qcoin', 0.985, 'native:qcoin_balance')
  if (classifyQl7SupportAdultMessageAct(primary, {}, {}).act === 'threat') add('support_system', 0.99, 'safety:threat')

  for (const [topic, pattern] of TOPIC_ALIASES) {
    let positiveAlias = false
    for (const variant of variants) {
      for (const match of patternMatchesV11_2(pattern, variant)) {
        const normalizedTopic = normalizeQl7SupportTopic(topic)
        if (isRejectedTopicMentionV11_2(variant, match.index || 0)) {
          rejectedTopics.add(normalizedTopic)
          continue
        }
        positiveTopics.add(normalizedTopic)
        positiveAlias = true
        const explicitCryptoRadar = topic === 'homepage' && /(?:cryptoradar|крипторадар)/iu.test(variant)
        add(topic, explicitCryptoRadar ? 0.985 : 0.97, `alias:${topic}`)
        break
      }
      if (positiveAlias) break
    }
  }
  for (const segment of segments) {
    const topic = classifyQl7SupportCatalogTopic(segment, '')
    if (topic && !isRejectedOnly(topic)) add(topic, segment === primary ? 0.9 : 0.76, segment.slice(0, 120))
  }
  for (const variant of variants) {
    const full = classifyQl7SupportCatalogTopic(variant, fallback)
    if (full && !isRejectedOnly(full)) add(full, full === 'support_system' ? 0.62 : 0.9, variant.slice(0, 160))
  }
  if (previousFocus && !isRejectedOnly(previousFocus)) add(previousFocus, 0.74, 'previous_focus')
  if (fallback && !isRejectedOnly(fallback)) add(fallback, 0.48, 'analysis_fallback')
  return [...scores.entries()]
    .map(([topic, confidence]) => ({
      topic,
      subIntent: semanticNuance?.topic === topic
        ? semanticNuance.subIntent
        : (premiumIntent?.topic === topic ? `${premiumIntent.domain}_${premiumIntent.goal}` : classifyQl7SupportCatalogSubIntent(topic, primary)),
      microIntent: premiumIntent?.topic === topic ? premiumIntent.id : '',
      confidence: Math.min(0.999, confidence),
      matchedEvidence: evidence.get(topic) || [],
      missingEvidence: [],
      label: getQl7SupportTopicLabel(topic, 'en'),
    }))
    .sort((a, b) => b.confidence - a.confidence || a.topic.localeCompare(b.topic))
}

function preferSystemStatusOverIncidentalUiContextV12(hypotheses = [], text = '') {
  if (!SYSTEM_STATUS_PRIMARY_ANCHOR_V12.test(str(text))) return hypotheses
  const systemStatus = hypotheses.find((item) => item.topic === 'system_status')
  const top = hypotheses[0]
  if (!systemStatus || !['navigation', 'accessibility'].includes(top?.topic)) return hypotheses
  return [
    {
      ...systemStatus,
      confidence: Math.max(Number(systemStatus.confidence || 0), 0.996),
      matchedEvidence: Object.freeze([...(Array.isArray(systemStatus.matchedEvidence) ? systemStatus.matchedEvidence : []), 'priority:system_status_primary_anchor']),
    },
    ...hypotheses.filter((item) => item.topic !== 'system_status'),
  ].slice(0, 8)
}

export function buildQl7SupportIntentHypotheses({
  text = '',
  locale = 'en',
  previousContext = {},
  baseAnalysis = {},
  tone = {},
} = {}) {
  const canonicalText = str(baseAnalysis?.canonicalText || baseAnalysis?.translatedText || baseAnalysis?.text)
  const semanticText = canonicalText && canonicalText !== str(text)
    ? `${str(text)}\n${canonicalText}`
    : str(text)
  const rawActResult = classifyQl7SupportAdultMessageAct(semanticText, previousContext, tone)
  let actResult = resolveQl7SupportAdultMessageAct(rawActResult, baseAnalysis)
  const previousFocus = previousContext.previousTopic || previousContext.topic || ''
  const fallback = baseAnalysis.topic || previousFocus || 'support_system'
  let hypotheses = topicCandidates(semanticText, fallback, previousFocus)
  if (!hypotheses.length) hypotheses = [{
    topic: normalizeQl7SupportTopic(fallback || 'support_system'),
    subIntent: classifyQl7SupportCatalogSubIntent(fallback || 'support_system', semanticText),
    confidence: 0.42,
    matchedEvidence: [],
    missingEvidence: ['topic_anchor'],
    label: getQl7SupportTopicLabel(fallback || 'support_system', locale),
  }]
  hypotheses = hypotheses.slice(0, 8).map((item) => ({
    ...item,
    label: getQl7SupportTopicLabel(item.topic, locale),
  }))
  const top = hypotheses[0]
  const second = hypotheses[1]
  const gap = second ? top.confidence - second.confidence : top.confidence
  const hasExplicitTopicAnchor = (item) => {
    const evidence = Array.isArray(item?.matchedEvidence) ? item.matchedEvidence : []
    return evidence.some((entry) => /^(?:alias|native):/u.test(String(entry || '')))
  }
  const contextOnly = (item) => {
    const evidence = Array.isArray(item?.matchedEvidence) ? item.matchedEvidence : []
    return evidence.length > 0 && evidence.every((entry) => entry === 'previous_focus')
  }
  if (['threat', 'profanity_with_request', 'profanity_without_request', 'partnership_request', 'learning_governance_request'].includes(actResult.act) && (contextOnly(top) || !hasExplicitTopicAnchor(top))) {
    const defaultTopic = actResult.act === 'partnership_request' ? 'contact' : (actResult.act === 'learning_governance_request' ? 'learning_governance' : 'support_system')
    hypotheses = [
      {
        topic: defaultTopic,
        subIntent: classifyQl7SupportCatalogSubIntent(defaultTopic, semanticText),
        confidence: actResult.act === 'threat' ? 0.99 : (actResult.act === 'partnership_request' || actResult.act === 'learning_governance_request' ? 0.96 : 0.91),
        matchedEvidence: actResult.act === 'threat'
          ? ['safety:threat']
          : (actResult.act === 'partnership_request' ? ['strategic:partnership'] : (actResult.act === 'learning_governance_request' ? ['learning:safe_calibration'] : ['tone:adult_boundary'])),
        missingEvidence: [],
        label: getQl7SupportTopicLabel(defaultTopic, locale),
      },
      ...hypotheses.filter((item) => item.topic !== defaultTopic),
    ].slice(0, 8)
  }
  const pureSocialActsV11 = new Set(['greeting', 'farewell', 'gratitude', 'appreciation', 'wellbeing_check', 'emotional_support', 'casual_chat', 'small_talk_boundary', 'apology', 'confusion', 'success_confirmation', 'impatience'])
  const strongestExplicitMaterial = hypotheses.find((item) => {
    if (!item || item.topic === 'support_system' || Number(item.confidence || 0) < 0.96) return false
    const evidence = Array.isArray(item.matchedEvidence) ? item.matchedEvidence : []
    return evidence.some((entry) => /^(?:named|alias|native|micro-intent):/u.test(String(entry || '')))
  })
  if (pureSocialActsV11.has(actResult.act) && strongestExplicitMaterial) {
    // A greeting, thanks, apology or emotional preface must not erase a concrete product request.
    // Keep the social prefix for tone, but route and plan the answer around the explicit material topic.
    actResult = {
      ...actResult,
      act: 'informational_question',
      greetingPrefix: actResult.greetingPrefix === true || actResult.act === 'greeting',
      evidence: [...(Array.isArray(actResult.evidence) ? actResult.evidence : []), 'material_topic_after_social_prefix'],
    }
    hypotheses = [
      strongestExplicitMaterial,
      ...hypotheses.filter((item) => item !== strongestExplicitMaterial),
    ].slice(0, 8)
  } else if (pureSocialActsV11.has(actResult.act)) {
    const supportHypothesis = {
      topic: 'support_system',
      subIntent: `support_system_${actResult.act}`,
      confidence: 0.99,
      matchedEvidence: [`social:${actResult.act}`],
      missingEvidence: [],
      label: getQl7SupportTopicLabel('support_system', locale),
    }
    hypotheses = [supportHypothesis, ...hypotheses.filter((item) => item.topic !== 'support_system')].slice(0, 8)
  }
  hypotheses = preferSystemStatusOverIncidentalUiContextV12(hypotheses, semanticText)
  const finalTop = hypotheses[0]
  const finalSecond = hypotheses[1]
  const finalGap = finalSecond ? finalTop.confidence - finalSecond.confidence : finalTop.confidence
  const protectedAct = ['greeting', 'farewell', 'gratitude', 'appreciation', 'wellbeing_check', 'emotional_support', 'casual_chat', 'small_talk_boundary', 'apology', 'confusion', 'success_confirmation', 'impatience', 'threat', 'foreign_account_request', 'prompt_injection', 'privacy_attack', 'personal_status_request', 'identity_question', 'partnership_request', 'learning_governance_request', 'informational_question'].includes(actResult.act)
  const shouldClarify = !protectedAct && (
    finalTop.confidence < 0.55 ||
    (finalTop.confidence < 0.82 && finalSecond && finalGap < 0.18) ||
    actResult.act === 'ambiguous_request'
  )
  return Object.freeze({
    messageAct: actResult.act,
    greetingPrefix: actResult.greetingPrefix === true,
    hypotheses: Object.freeze(hypotheses),
    top: Object.freeze(finalTop),
    microIntent: str(finalTop?.microIntent),
    subIntent: str(finalTop?.subIntent),
    confidence: finalTop.confidence,
    alternatives: Object.freeze(hypotheses.slice(1).map((item) => item.topic)),
    ambiguous: shouldClarify,
    shouldClarify,
    confidenceBand: finalTop.confidence >= 0.82 ? 'high' : (finalTop.confidence >= 0.55 ? 'medium' : 'low'),
    matchedEvidence: Object.freeze([...actResult.evidence, ...(finalTop.matchedEvidence || [])]),
    missingEvidence: Object.freeze(finalTop.missingEvidence || []),
  })
}

export const QL7_SUPPORT_ADULT_MESSAGE_ACTS_V6 = Object.freeze([
  'greeting', 'farewell', 'gratitude', 'appreciation', 'wellbeing_check', 'emotional_support', 'casual_chat', 'small_talk_boundary', 'identity_question', 'humor_play', 'informational_question',
  'how_to_question', 'why_question', 'when_question', 'personal_status_request',
  'incident_report', 'evidence_submission', 'bare_identifier', 'answer_to_question',
  'confirmation', 'denial', 'correction', 'topic_rejection', 'new_unrelated_issue',
  'status_followup', 'appeal', 'complaint', 'idea', 'roadmap_question', 'partnership_request', 'learning_governance_request',
  'ambiguous_request', 'spam_or_noise', 'duplicate_send', 'profanity_without_request',
  'profanity_with_request', 'threat', 'foreign_account_request', 'prompt_injection',
  'privacy_attack', 'human_operator_request',
])
