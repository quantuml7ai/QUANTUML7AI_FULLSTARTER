import { classifyQl7SupportCatalogSubIntent, classifyQl7SupportCatalogTopic, normalizeQl7SupportTopic } from '../ecosystemCatalog.js'
import { normalizeQl7SupportInput } from '../language/normalizeInput.js'
import { normalizeQl7SupportLocale } from '../language/locales.js'
import { collectQl7SemanticSignals, QL7_SUPPORT_SEMANTIC_BANK_VERSION } from '../language/semanticBanks.js'
import { evaluateQl7SupportSafety } from '../safety/evaluateTurn.js'
import { assessQl7SupportEmotion } from './emotionAssessment.js'
import { ql7Arr, ql7StableHash, ql7Str } from '../internal/text.js'

export const QL7_SUPPORT_ANALYZE_TURN_VERSION='14.15.7'
const MATERIAL_HINT=/(?:баланс|qcoin|vip|реклам|(?:^|[^\p{L}\p{N}_])ads(?=$|[^\p{L}\p{N}_])|advertis|кампан|плат[её]ж|wallet|кошел|форум|forum|telegram|академ|academy|метамаркет|metamarket|battlecoin|профил|profile|авторизац|login|гео|media|медиа|удалить\s+аккаунт|delete\s+account|партн[её]р|инвест|support|поддержк|crypto|крипт|bitcoin|биткоин|биткойн|биток|битка|btc|ethereum|эфир|eth|курс|цена|price|прогноз|forecast|signal|сигнал|recommendation|рекомендац|ai\s*box|ai\s*quota|ai\s*workbench|exchange\s*ai|мошен|скам|scam|fraud|crime|криминал)/iu
const GRATITUDE=/^(?:спасибо|спс|благодарю|дякую|дякс|thanks|thank\s*you|thx|gracias|teşekkür(?:ler)?|sağol|شكرا|شكرًا|谢谢|多谢|תודה)[!?.\s\p{Extended_Pictographic}]*$/iu
const GREETING=/^(?:привет|прив|привіт|вітаю|дарова|здарова|здравствуйте|доброе\s+(?:утро|утречко)|добрый\s+(?:день|вечер)|hello|hi|hey|hola|buenas|merhaba|selam|مرحبا|أهلا|你好|嗨|שלום|היי)[!?.\s\p{Extended_Pictographic}]*$/iu
const FAREWELL=/^(?:пока|до\s+связи|до\s+свидания|увидимся|bye|goodbye|see\s+you|adiós|görüşürüz|مع\s+السلامة|إلى\s+اللقاء|再见|להתראות)[!?.\s\p{Extended_Pictographic}]*$/iu
const HUMOR=/(?:анекдот|пошути|шутк|жарт|розкажи\s+жарт|розсміш|рассмеш|прикол|мем|травани|joke|funny|make\s+me\s+laugh|tell\s+me\s+a\s+joke|broma|chiste|cuenta\s+un\s+chiste|şaka|نكتة|مزحة|قل\s+نكتة|笑话|讲个笑话|בדיחה|ספר\s+בדיחה|תצחיק)/iu
const HUMOR_FOLLOWUP=/^(?:ещ[её]|ещ[её]\s+одн[уа]|давай\s+ещ[её]|another|one\s+more|otra|otro|bir\s+tane\s+daha|واحدة\s+أخرى|再来一个|עוד\s+אחד)[!?.\s\p{Extended_Pictographic}]*$/iu
const WELLBEING=/(?:как\s+(?:ты|дела|настроение)|how\s+are\s+you|what'?s\s+up|cómo\s+estás|nasılsın|كيف\s+حال(?:ك)?|你好吗|מה\s+שלומך)/iu
const EMOTIONAL=/(?:мне\s+(?:плохо|тяжело|грустно|одиноко)|мені\s+(?:погано|важко|сумно|самотньо)|meni\s+pogano|hochetsya\s+pogovoriti|хоч(?:у|еться)\s+поговор(?:ить|ити)|просто\s+поговор|трав(?:ят|ля)|булл(?:ят|инг)|унижа(?:ют|ли)|боюсь\s+сорваться|сорв(?:усь|аться)|не\s+курю|брос(?:аю|ил|ила)\s+курить|алкогол|наркотик|расстал(?:ся|ась)|розійшл(?:ися|ась|ся)|бросил(?:а)?|покинув(?:ла)?|умер(?:ла)?|помер(?:ла)?|потерял(?:а)?\s+(?:близкого|друга|родного)|втратив(?:ла)?\s+(?:близького|друга|рідну)|i\s+feel\s+(?:sad|alone|awful|terrible)|we\s+broke\s+up|someone\s+died|need\s+to\s+talk|bully(?:ing|ied)|quit(?:ting)?\s+smoking|relapse|alcohol|drugs?|me\s+siento\s+(?:muy\s+)?(?:mal|triste)|(?:necesit\p{L}*|ncesito|nec(?:e)?sito)\s+hablar|acoso|dej[ée]\s+de\s+fumar|kendimi\s+(?:çok\s+)?kötü\s+hissediyorum|konuşmak\s+istiyorum|ayrıldık|zorbal|sigara|alkol|uyuşturucu|أشعر\s+(?:بالحزن|بالسوء)|أحتاج\s+إلى\s+الحديث|تنمر|تدخين|كحول|مخدرات|我(?:很)?(?:难过|难受|孤独)|想聊聊|霸凌|戒烟|酒精|毒品|אני\s+מרגיש\s+רע|אני\s+עצוב|צריך\s+לדבר|בריונות|עישון|אלכוהול|סמים)/iu
const TOPIC_RECALL=/(?:о\s+ч[её]м\s+мы\s+говорили|что\s+мы\s+обсуждали|про\s+що\s+ми\s+говорили|нагадай\s+тему|what\s+(?:did|were)\s+we\s+(?:talk|discuss)|remind\s+me\s+(?:the\s+)?topic|de\s+qu[eé]\s+habl[aá]bamos|ne\s+konuşuyorduk|عم\s+كنا\s+نتحدث|我们(?:刚才)?聊什么|על\s+מה\s+דיברנו)/iu
const TOPIC_RESUME=/(?:верн[её]мся|продолжим\s+тему|поверн[іи]мося|back\s+to\s+(?:it|that)|resume\s+(?:that|topic)|volvamos|ona\s+d[oö]nelim|لنعد\s+إلى|回到|נחזור\s+לזה)/iu
const CORRECTION=/^(?:(?:нет|ні|no|hayır|لا|不是|לא).{0,80}(?:имел(?:а)?\s+в\s+виду|маю\s+на\s+увазі|i\s+mean|me\s+refiero|demek\s+istedim|أقصد|我是说|התכוונתי)|не\s+то|я\s+имел(?:а)?\s+в\s+виду|исправление)/iu
const IDENTITY=/(?:кто\s+ты|что\s+ты\s+такое|расскажи\s+о\s+себе|who\s+are\s+you|what\s+are\s+you|quién\s+eres|sen\s+kimsin|من\s+أنت|你是谁|מי\s+אתה)/iu
const BALANCE=/(?:баланс|qcoin|юкоин|ucoin|мой\s+сч[её]т|how\s+much\s+qcoin|balance|יתרת|יתרה|رصيد|余额)/iu
const THEFT=/(?:украл(?:и|ися)?|пропал(?:и)?\s+(?:деньги|qcoin|баланс)|(?:qcoin|баланс).{0,24}(?:пропал|исчез|не\s+сходится)|зникл(?:и|о|а)?\s+(?:грош|грші|роші|кошти|qcoin|баланс)|зник.{0,12}(?:грош|грші|роші)|(?:qcoin|баланс).{0,24}(?:зник|не\s+сход)|(?:грош(?:і|ей)|грші|роші).{0,18}(?:зникл|пропал)|списал(?:и|ось)|списал(?:и|ося)|не\s+сходится\s+баланс|money.{0,18}(?:diappear|disapear|disappear|missing|gone)|(?:diappear|disapear|disappear|missing|gone).{0,18}(?:money|qcoin|balance)|(?:qcoin|balance|bakiye?m?d?e?n?).{0,32}(?:kaybol|diappear|disapear|disappear|missing|gone)|stole|balance\s+is\s+wrong|robbed|dinero.{0,18}(?:desapareci|falta|rob)|(?:desapareci|falta).{0,18}dinero|para.{0,18}(?:kaybol|çalın)|(?:kaybol|çalın).{0,18}(?:para|qcoin|bakiye)|(?:اختف|سرق).{0,24}(?:أموال|مال|رصيد)|(?:أموال|مال).{0,24}(?:اختف|سرق)|(?:钱|余额).{0,12}(?:不见|见了|消失|被盗)|(?:不见|消失).{0,12}(?:钱|余额)|qcoin.{0,18}钱见了|(?:כסף?|יתרה).{0,18}(?:נעלם|נעם|עלם|חסר|נגנב)|(?:נעלם|נעם|עלם|חסר).{0,18}(?:כסף?|יתרה))/iu
const ADS=/(?:реклам|рекламн|(?:^|[^\p{L}\p{N}_])ads(?=$|[^\p{L}\p{N}_])|(?:^|[^\p{L}\p{N}_])ad(?=\s+(?:packages?|campaigns?|metrics?|status|slots?|plans?|spend|views|clicks)\b)|advertis|\bcampaign\b|кампан|\bctr\b|показ|клик|impression|anuncio|publicidad|campaña|reklam|kampanya|إعلان|الإعلانات|حملة|广告|广告活动|פרסומ|פרסום|קמפיין)/iu
const NEG_ADS=/(?:не\s+(?:запрос\s+)?про\s+(?:ads?|реклам)|не\s+о\s+реклам|not\s+(?:a\s+request\s+)?about\s+ads?|no\s+es\s+(?:una\s+solicitud\s+de\s+)?publicidad|reklam\s+(?:isteği\s+)?değil|ليس\s+(?:طلبًا\s+)?عن\s+الإعلان|不是(?:关于)?广告(?:的请求)?|לא\s+(?:בקשה\s+)?על\s+פרסום)/iu
const VIP=/(?:\bvip\b|(?:^|[^\p{L}\p{N}_])(?:\u0432\u0438\u043f|\u0432\u0456\u043f)(?=$|[^\p{L}\p{N}_])|premium\s+status|vip\s+status)/iu
const VIP_STATUS_TYPO=/(?:¿?\s*mi\s+ip\s+est[aá]\s+activ[ao]\??|estado\s+de\s+mi\s+ip|situaci[oó]n\s+de\s+mi\s+ip|активен\s+ли\s+мой\s+ip\??|мой\s+ip\s+активен|هل\s+ip\s+نشط\??|ip\s+نشط|האם\s+ip\s+פעיל\??|ip\s+פעיל)/iu
const PACKAGE=/(?:пакет|тариф|elite|лімит|лимит|слот|(?:^|[^\p{L}\p{N}_])(?:packages?|plans?)(?=$|[^\p{L}\p{N}_])|paquete|paket|tarife|باقة|باقات|خطة|套餐|方案|חביל|חבילה|תוכנית)/iu
const METRICS=/(?:метрик|метрики|статистик|аналитик|ctr|показ|перегляд|клік|клик|views?|impressions?|métric|estadíst|clic|visualiz|metrik|istatistik|tıklama|görüntülen|مقاييس|إحصائ|نقر|مشاهد|指标|统计|点击|浏览|מדד|מדדים|סטטיסט|קליק|צפיות)/iu
const AMBIGUOUS_METRICS_TOKEN=/(?:^|[^\p{L}\p{N}_])(?:метрик(?:и|а)?|metriki|metrics?|m[eé]tricas?|estad[ií]sticas?|metrikler|istatistik|المقاييس|الإحصاءات|指标|统计|מדדים|סטטיסטיקה)(?=$|[^\p{L}\p{N}_])/iu
const PROMPT_INJECTION=/(?:игнорируй\s+(?:все\s+)?правил|раскрой\s+(?:classifier|классификатор|системн|внутренн)|show\s+(?:the\s+)?system\s+prompt|ignore\s+(?:all\s+)?(?:previous|system)\s+instructions|reveal\s+(?:the\s+)?(?:classifier|internal|system)|prompt\s*injection|忽略.*(?:规则|指令)|显示.*系统提示|تجاهل.*(?:القواعد|التعليمات)|اكشف.*(?:النظام|المصنف)|התעלם.*(?:הוראות|כללים)|חשוף.*(?:מערכת|מסווג))/iu
const REPORTED_SPEECH=/(?:пользователь\s+написал\s+цитату|reported\s+speech|quoted\s+text|цитата).{0,160}(?:не\s+моя\s+угроза|not\s+my\s+threat|это\s+цитата)/iu
const PRIVACY_ATTACK=/(?:raw\s+mongo|mongo\s+(?:documents?|документ)|приватн(?:ый|ий)\s+ключ|private\s+key|seed\s*phrase|auth\s*token|чуж(?:ие|і)\s+данн|other\s+users?['’]?\s+data|внутренн(?:ие|і)\s+коллекц|internal\s+collections?|原始.*(?:Mongo|文档)|私钥|他人数据|مفتاح\s+خاص|بيانات\s+الآخرين|מפתח\s+פרטי|נתונים\s+של\s+אחרים)/iu
const HOW_TO=/(?:как\s+(?:пользоваться|работает|открыть|создать|найти|сделать)|что\s+такое|що\s+таке|як\s+(?:цим\s+)?користуватися|для\s+чего|how\s+(?:to|does)|what\s+is|cómo\s+(?:usar|se\s+usa)|nasıl|كيف|如何|了解|解释|說明|说明|使用流程|何时使用|用途|איך)/iu
const STATUS=/(?:статус|состояние|стан|актив(?:ен|ний|ный|на|но|ні|на)?|akt(?:iv|yvn|yven)|aktyv|frnbdty|frnbdybq|доступен|работает\s+ли|status|active|available|activo|activa|activ[ao]|estado|situaci[oó]n|durum|aktif|حالة|نشط|نشطة|نش|شط|状态|激活|活|מצב|פעיל)/iu
const ROADMAP=/(?:когда|планируется|roadmap|в\s+будущем|coming|launch|released|ne\s+zaman|متى|什么时候|מתי)/iu
const BUSINESS=/(?:партн[её]р|сотруднич|співпрац|інвест|инвест|вложить|предложение\s+для\s+компании|partnership|partner|invest|collaborat|business\s+proposal|colaboraci[oó]n|ortakl[ıi]k|yat[ıi]r[ıi]m|合作|投资|الشراكة|استثمار|שותפות|השקעה)/iu
const INVESTMENT_SIGNAL=/(?:инвест|інвест|invest|investment|inversi[oó]n|влож|yat[ıi]r[ıi]m|مستثمر|استثمار|投资|השקעה)/iu
const CONTACT=/(?:связаться|контакт|телефон|email|почт|telegram|whatsapp|call\s+me|contact\s+me)/iu
const OPERATOR_REQUEST=/(?:жив(?:ой|ого)?\s+оператор|оператор(?:у|ом|а)?|опер(?:атор)?|саппорт\s+человек|человек(?:а)?\s+из\s+поддержки|менеджер|представител[ья]|свяж(?:и|ите|ись|итеcь|ите\s+меня|ите\s+нас)|хочу\s+(?:к\s+)?оператор|нужен\s+оператор|human\s+(?:agent|operator|support)|support\s+agent|talk\s+to\s+(?:a\s+)?human|contact\s+support|reach\s+(?:the\s+)?operator|representative|manager|call\s+me|agente\s+humano|operador|canl[ıi]\s+destek|m[üu]şteri\s+temsilcisi|موظف\s+بشري|الدعم\s+البشري|人工客服|联系客服|联系人工|נציג\s+אנושי|תמיכה\s+אנושית)/iu
const CONTACT_REFUSAL=/(?:без\s+контакт|не\s+хочу\s+остав|не\s+буду\s+остав|не\s+даю\s+контакт|пишите\s+(?:здесь|тут|в\s+dm|в\s+личк)|только\s+(?:тут|здесь|dm|в\s+личк)|через\s+(?:dm|личн|мессенджер)|no\s+(?:extra\s+)?contacts?|do\s+not\s+contact\s+outside|dm\s+only|message\s+me\s+here|solo\s+dm|sin\s+contactos|sadece\s+dm|buradan\s+yaz|لا\s+أريد\s+ترك\s+جهات|بدون\s+تواصل\s+خارجي|不要.*联系方式|只在这里|רק\s+כאן|בלי\s+פרטי\s+קשר)/iu
const CONTACT_CHANNEL_HINT=/(?:email|e-mail|почт|почта|телефон|phone|telegram|tg\b|whatsapp|wa\b|signal|discord|linkedin|skype|звонок|call|личк|dm\b|direct\s+message|messenger)/iu
const EMAIL_RE=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu
const TELEGRAM_RE=/(?:telegram|телеграм|tg|@)\s*[:=]?\s*(\B@[a-z0-9_]{5,32}\b)/iu
const PHONE_RE=/(?<![\w+])(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/u
const FORUM_THREADS_TOPIC=/(?:ветк(?:а|и|у|е|ой)?\s+форум|гілк(?:а|и|у|ою)?\s+форум|forum\s+thread|thread|тред|ветк|гілк|комментар|відповід|reply|replies)/iu
const FORUM_FEED_TOPIC=/(?:лент(?:а|ы|е|у)?\s+форум|стрічк(?:а|и|у|ою)?\s+форум|forum\s+feed|feed.{0,12}forum|карточк(?:а|и)?\s+пост)/iu
const FORUM_TOPIC=/(?:форум|forum|пост(?:ы|ов)?|топик(?:и|ов)?|тем(?:ы|а).{0,18}(?:форум|forum)|активност[ьи].{0,18}(?:форум|forum))/iu
const PROFILE_TOPIC=/(?:профил|profile|аккаунт.{0,18}(?:активност|рейтинг)|рейтинг.{0,18}(?:confidence|уверенн|довер)|confidence)/iu
const METAMARKET_TOPIC=/(?:метамаркет|metamarket|meta\s*market|подарк(?:и|ов).{0,18}(?:получ|отправ)|коллекци.{0,18}(?:meta|market))/iu
const TELEGRAM_TOPIC=/(?:telegram|телеграм|телеграмм|tg\b|связ(?:ь|ан).{0,18}(?:telegram|телеграм))/iu
const BATTLECOIN_TOPIC=/(?:battle\s*coin|battlecoin|баттл\s*коин|батл\s*коин|батлкоин|баттлкоин|ордер(?:а|ов)?|лонг|шорт|x\d{1,3}|leverage|long|short)/iu
const CRYPTO_ASSET=/(?:\b(?:btc|btcusdt|bitcoin|eth|ethusdt|ethereum|sol|solusdt|solana|ton|tonusdt|bnb|bnbusdt|xrp|xrpusdt|doge|dogeusdt|ada|adausdt|matic|pol|trx|link|ltc|near)\b|биткоин|биткойн|биток|битка|эфир(?:иум)?|солана|тонкоин|дог(?:е|икоин)?|крипт(?:а|о)|криптовалют|加密|比特币|以太坊|عملة|بيتكوين|קריפטו|ביטקוין)/iu
const CRYPTO_PRICE=/(?:курс|цен[ауые]|стоимост|сколько\s+стоит|прайс|\b(?:price|rate|quote|market|chart|ticker)\b|котиров|рынок|график|precio|cotizaci|fiyat|piyasa|سعر|قيمة|报价|价格|מחיר|שער)/iu
const AI_RECOMMENDATION=/(?:ai[-\s]?(?:box|workbench|recommendation|analytics|signal)|exchange\s*ai|ии[-\s]?(?:бокс|аналитик|рекомендац|сигнал)|ai\s*квот|квот[аы]\s+ai|прогноз|рекомендац|сигнал|таймфрейм|time\s*frame|timeframe|tf\b|analy[sz]e|analysis|تحليل|توصية|分析|建议|המלצ|ניתוח)/iu
const FINANCIAL_TIMEFRAME=/(?:\b(?:1m|3m|5m|15m|30m|1h|2h|4h|6h|12h|1d|1w)\b|\b\d{1,2}\s*(?:m|min|мин|минут|h|hour|час|d|day|день|дня)\b)/iu
const SCAM_CRIME=/(?:мошен|скам|развод|обман(?:ули|ул|а|ут)?|афер|криминал|преступ|взлом|фишинг|поддел|шантаж|fraud|scam|criminal|crime|phishing|extortion|blackmail|stolen|robbed|estafa|fraude|dolandır|sahte|احتيال|نصب|ابتزاز|诈骗|欺诈|犯罪|钓鱼|הונאה|פשע|סחיטה)/iu
const CRISIS_LANGUAGE=/(?:хочу\s+(?:умереть|не\s+жить)|не\s+хочу\s+жить|жить\s+не\s+хочу|нет\s+сил\s+жить|покончу\s+с\s+собой|убью\s+себя|сдела(?:ю|ть).{0,24}с\s+собой|что[-\s]?то.{0,28}с\s+собой|наврежу\s+себе|навредить\s+себе|причинить\s+себе\s+вред|само(?:вред|убий)|су[еиы]цид|накладу\s+на\s+себя\s+руки|выйти\s+в\s+окно|мені\s+(?:не\s+хочеться\s+жити|погано.{0,24}зробити\s+щось\s+із\s+собою)|не\s+хочу\s+жити|заподіяти\s+собі\s+шкоду|i\s+(?:want\s+to\s+die|do\s+not\s+want\s+to\s+live|don't\s+want\s+to\s+live|cant\s+go\s+on|can't\s+go\s+on)|kill\s+myself|hurt\s+myself|harm\s+myself|self[-\s]?harm|end\s+(?:it\s+all|my\s+life)|take\s+my\s+life|quiero\s+morir|no\s+quiero\s+vivir|hacerme\s+daño|suicid|kendime\s+zarar|ölmek\s+istiyorum|yaşamak\s+istemiyorum|انتحار|أريد\s+أن\s+أموت|أؤذي\s+نفسي|自杀|不想活|伤害自己|想死|להתאבד|לא\s+רוצה\s+לחיות|לפגוע\s+בעצמי)/iu
const QUANTUM_FAMILY_TOPIC=/(?:quantum\s*family|квантум\s*фем(?:е|и)ли|подписчик(?:и|ов)?|подписк(?:и|а|ок)|followers?|following|family\s+links)/iu
const MODERATION_TOPIC=/(?:модерац|жалоб(?:а|ы|у|ами)?|репорт(?:ы|ов)?|complaints?|reports?|moderation|бан|ban|flag|флаг)/iu
const GEODETECT_TOPIC=/(?:geo\s*detect|geodetect|гео(?:\s|-)?детект|геолокац|гео\s*контекст|локац|location|country|city|город|страна)/iu
const AMBIGUOUS=/^(?:метрики|метрика|статистика|статус|помоги|допоможи|проблема|не\s+работает|не\s+працює|help|metrics|status|problem|métricas|estadísticas|metrikler|istatistik|المقاييس|الإحصاءات|指标|统计|מדדים|סטטיסטיקה)[!?.\s]*$/iu
const DATA_ACTION=/(?:покаж|показать|проверь|провер|перевір|чекн|сколько|скільки|вывед|вывести|порах|рассчитай|посчитай|show|sho|check|verify|display|calculate|calc|how\s+much|what\s+is\s+my|muestra|verifica|calcula|g[öo]s?ter|kontrol|hesapla|اعرض|ارض|اعر|تحقق|احسب|显示|检查|计算|הצג|הצ|הג|בדוק|חשב|zeige|zeig|prüf|pruef|anzeigen|montre|affiche|mostra|mostre|poka[zż]|sprawd|zobraz|uk[aá]ž|ukaz|arat[aă]|mutasd)/iu
const KNOWLEDGE_OVERVIEW=/(?:what\s+is|about\s+|overview|purpose|user[-\s]?ready|how\s+to|safe\s+usage|current\s+user\s+steps|как\s+|что\s+такое|обзор|назначение|инструкц|зачем|для\s+чего|що\s+таке|як\s+)/iu

function hits(signals,category){return ql7Arr(signals?.categoryHits?.[category])}
function hasHit(signals,category){return hits(signals,category).length>0}
function topBankTopic(signals){return ql7Arr(signals?.topicWeights).slice().sort((a,b)=>Number(b.weight||0)-Number(a.weight||0))[0]?.topic||''}
function hasTopicSignal(signals,topic){return ql7Arr(signals?.topicWeights).some(row=>row.topic===topic&&Number(row.weight||0)>0)}
function hasMaterialSignal(text,signals){return MATERIAL_HINT.test(text)||TZ_ADS.test(text)||ql7Arr(signals?.topicWeights).some(row=>!['support_system'].includes(row.topic))}
function tokenCount(text=''){return (ql7Str(text).match(/[\p{L}\p{N}]+/gu)||[]).length}
const TZ_BALANCE=/(?:saldo(?:n|et|ni|en)?|salda|stanje(?:m|t|ta)?|kontostand|qcoin\s+(?:saldo|salda|stanje)|(?:saldo|salda|stanje).{0,18}qcoin)/iu
const TZ_THEFT=/(?:wallet\s+t(?:o|\u00f6)md|(?:pengar|penger|penge|rahat|novac|denar|qcoin|saldo|salda|stanje).{0,32}(?:f(?:o|\u00f6)rsvann|forsvant|forsvandt|mangler|saknas|borta|v(?:ae|\u00e6)k|katosi|kadonnut|puuttuu|nestao|nedostaje|ukraden|izginil|izginilo|manjka)|(?:f(?:o|\u00f6)rsvann|forsvant|forsvandt|mangler|saknas|borta|v(?:ae|\u00e6)k|katosi|kadonnut|puuttuu|nestao|nedostaje|ukraden|izginil|izginilo|manjka).{0,32}(?:pengar|penger|penge|rahat|novac|denar|qcoin|saldo|salda|stanje))/iu
const TYPO_THEFT=/(?:(?:зикл|знил)(?:и|о|а)?\s+(?:грош|грші|роші|кошти|qcoin|баланс)|(?:зикл|знил).{0,24}(?:грош|грші|роші|кошти|qcoin|баланс)|(?:грош(?:і|ей)|грші|роші|кошти|qcoin|баланс).{0,24}(?:зикл|знил))/iu
const TZ_ADS=/(?:annons(?:er)?|annonser|reklame|reklamer|reklama|kampanj(?:er)?|kampanje|kampanja|oglasi?|mainonta|advertenties?)/iu
const TZ_DATA_ACTION=/(?:\b(?:visa|vis|sjekk|tjek|kontroller(?:a)?|kontroll[ée]r|tarkista|provjeri|proveri|preveri)\b|n(?:a|\u00e4)yt(?:a|\u00e4)|prika(?:z|\u017e)i|poka(?:z|\u017e)i)/iu
const KEYBOARD_DATA_ACTION=/(?:gjrf\s*[;:]\s*b|gjrf[;:]?b|gjrfpf(?:nm|nt)?|ghjdth(?:m)?|gthtdbh|xtryb|crjkmrj|crjkmrb)/iu
const KEYBOARD_BALANCE=/(?:[,<]fkfyc|[,<]fkfys|balansu)/iu
const TRANSLIT_THEFT=/(?:znikl[yi]?.{0,32}(?:grosh|hrosh|grosi|kosht|qcoin|balans)|(?:grosh|hrosh|grosi|kosht|qcoin|balans).{0,32}znikl[yi]?)/iu
const KEYBOARD_THEFT=/(?:pybrkb?|pybrk).{0,40}(?:uhji[іi]?|uhjii|[,<]?\s*fkfyc[e]?|qcoin)|(?:uhji[іi]?|uhjii|[,<]?\s*fkfyc[e]?|qcoin).{0,40}(?:pybrkb?|pybrk)/iu
const NON_QUERY_NOISE_WORD=/^(?:dot|point|period|full\s+stop|pika|punkt|prick|tocka|to\u010dka|tacka|ta\u010dka)$/iu
function hasDataAction(text='',signals={}){return DATA_ACTION.test(text)||TZ_DATA_ACTION.test(text)||KEYBOARD_DATA_ACTION.test(text)||hasHit(signals,'dataRequest')}
function hasBalanceSignal(text=''){return BALANCE.test(text)||TZ_BALANCE.test(text)||KEYBOARD_BALANCE.test(text)}
function hasTheftSignal(text=''){return THEFT.test(text)||TZ_THEFT.test(text)||TYPO_THEFT.test(text)||TRANSLIT_THEFT.test(text)||KEYBOARD_THEFT.test(text)}
function hasAdsSignal(text='',signals={}){return (ADS.test(text)||TZ_ADS.test(text)||hasTopicSignal(signals,'ads_campaigns')||hasTopicSignal(signals,'ads_packages'))&&!NEG_ADS.test(text)}
function isNoiseInput(text=''){
 const source=ql7Str(text).trim()
 if(!source)return true
 const wordsOnly=source.toLowerCase().normalize('NFKC').replace(/[\p{P}\p{S}\p{Extended_Pictographic}\p{Emoji_Presentation}]+/gu,' ').replace(/\s+/gu,' ').trim()
 if(NON_QUERY_NOISE_WORD.test(wordsOnly))return true
 if(/^[\s\p{P}\p{S}\p{Extended_Pictographic}\p{Emoji_Presentation}]+$/u.test(source))return true
 const tokens=source.match(/[\p{L}\p{N}]+/gu)||[]
 if(!tokens.length)return true
 if(tokens.length===1){
  const token=tokens[0]
  if(/^(?:vip|ads|btc|eth|sol|ton|bnb|xrp|ada|ltc|qcoin|ip)$/iu.test(token))return false
  if(token.length<=2&&!GREETING.test(source)&&!GRATITUDE.test(source))return true
  if(token.length>=4&&token.length<=8&&/^[bcdfghjklmnpqrstvwxyz]{4,}$/iu.test(token))return true
 }
 return false
}
function isExplicitExchangeKnowledgeRequest(text='',anchorTopic=''){
 return anchorTopic==='exchange_ai'&&KNOWLEDGE_OVERVIEW.test(text)&&!(CRYPTO_PRICE.test(text)||FINANCIAL_TIMEFRAME.test(text))
}
function isExplicitQcoinDataRequest(text='',signals={}){
 const mention=hasBalanceSignal(text)||hasTopicSignal(signals,'qcoin')
 return hasTheftSignal(text)||(mention&&(STATUS.test(text)||hasDataAction(text,signals)))
}
function isExplicitVipDataRequest(text='',signals={}){
 const mention=VIP.test(text)||VIP_STATUS_TYPO.test(text)||hasTopicSignal(signals,'vip')
 return VIP_STATUS_TYPO.test(text)||(mention&&(STATUS.test(text)||hasDataAction(text,signals)))
}
function isExplicitAdsPackageDataRequest(text='',signals={}){
 const mention=(PACKAGE.test(text)&&(/elite/iu.test(text)||hasAdsSignal(text,signals)||hasTopicSignal(signals,'ads_packages')))||hasTopicSignal(signals,'ads_packages')
 return mention&&(STATUS.test(text)||hasDataAction(text,signals)||/(?:купить|buy|purchase|activate|активир|تفعيل|购买|הפעל)/iu.test(text))
}
function isExplicitAdsCampaignDataRequest(text='',signals={}){
 const mention=hasAdsSignal(text,signals)
 return mention&&(METRICS.test(text)||STATUS.test(text)||hasDataAction(text,signals))
}
function isVagueDomainMention(text='',signals={}){
 if(isNoiseInput(text))return false
 if(CRISIS_LANGUAGE.test(text)||SCAM_CRIME.test(text)||hasTheftSignal(text)||HOW_TO.test(text)||ROADMAP.test(text)||BUSINESS.test(text)||OPERATOR_REQUEST.test(text))return false
 const source=ql7Str(text)
 const explicitCatalogTopic=explicitCatalogTopicFor(source)
 if(explicitCatalogTopic&&explicitCatalogTopic!=='qcoin'&&(KNOWLEDGE_OVERVIEW.test(source)||/[:\uFF1A]/u.test(source)))return false
 const words=tokenCount(source)
 const market=extractMarketSignals(source)
 if(hasAdsSignal(source,signals)&&!isExplicitAdsCampaignDataRequest(source,signals)&&!isExplicitAdsPackageDataRequest(source,signals)&&words<=6)return true
 if((hasBalanceSignal(source)||hasTopicSignal(signals,'qcoin'))&&!isExplicitQcoinDataRequest(source,signals)&&words<=6)return true
 if((VIP.test(source)||hasTopicSignal(signals,'vip'))&&!isExplicitVipDataRequest(source,signals)&&words<=5)return true
 if(CRYPTO_ASSET.test(source)&&!market.active&&words<=8)return true
 return false
}
function extractContactSignals(text=''){
 const source=ql7Str(text)
 const emailSource=source.replace(/\s*@\s*/gu,'@').replace(/([A-Z0-9._%+-]+@[A-Z0-9.-]+)\.\s+([A-Z]{2,})/giu,'$1.$2')
 const email=emailSource.match(EMAIL_RE)?.[0]||''
 const phone=source.match(PHONE_RE)?.[0]?.replace(/\s+/gu,' ').trim()||''
 const telegram=source.match(TELEGRAM_RE)?.[1]||source.match(/\B@[a-z0-9_]{5,32}\b/iu)?.[0]||''
 const refused=CONTACT_REFUSAL.test(source)
 const offered=Boolean(email||phone||telegram||CONTACT_CHANNEL_HINT.test(source)&&/(?:мой|моя|мои|остав|свяж|пиши|пишите|write|contact|reach|call|email|telegram|phone|whatsapp|tg\b|мой\s+тг|mi|benim|هاتفي|بريدي|我的|שלי)/iu.test(source))
 const channels=Object.freeze([email?'email':'',phone?'phone':'',telegram?'telegram':'',CONTACT_CHANNEL_HINT.test(source)?'channel_hint':''].filter(Boolean))
 const preferred=email?'email':telegram?'telegram':phone?'phone':refused?'dm':(CONTACT_CHANNEL_HINT.test(source)?'declared_channel':'')
 return Object.freeze({offered,refused,consent:offered&&!refused,email,phone,telegram,preferred,channels})
}
function businessBriefReady(text='',signals={},contactSignals={}){
 const source=ql7Str(text)
 const detailHits=[
  /(?:цель|задач|предлож|иде[яи]|услов|бюджет|срок|масштаб|аудитор|интеграц|команд|бренд|компан|рынок|value|goal|budget|timeline|scale|audience|integration|company|brand|market|proposal|terms)/iu.test(source),
  /(?:партн|сотруднич|инвест|влож|collaborat|partner|invest|business|strategic|коммерч)/iu.test(source),
  Number(source.length)>90,
  ql7Arr(signals?.topicWeights).some(row=>['partnership','investment','contact'].includes(row.topic)&&Number(row.weight||0)>1),
  contactSignals.offered||contactSignals.refused,
 ]
 return detailHits.filter(Boolean).length>=2
}
const SYMBOL_ALIASES=Object.freeze([
 ['BTCUSDT',/(?:\bbtc(?:usdt)?\b|bitcoin|биткоин|биткойн|биток|битка|比特币|بيتكوين|ביטקוין)/iu],
 ['ETHUSDT',/(?:\beth(?:usdt)?\b|ethereum|эфир(?:иум)?|以太坊|إيثيريوم|אתריום)/iu],
 ['SOLUSDT',/(?:\bsol(?:usdt)?\b|solana|солана)/iu],
 ['TONUSDT',/(?:\bton(?:usdt)?\b|toncoin|тонкоин)/iu],
 ['BNBUSDT',/(?:\bbnb(?:usdt)?\b)/iu],
 ['XRPUSDT',/(?:\bxrp(?:usdt)?\b|ripple)/iu],
 ['DOGEUSDT',/(?:\bdoge(?:usdt)?\b|dogecoin|дог(?:е|икоин)?)/iu],
 ['ADAUSDT',/(?:\bada(?:usdt)?\b|cardano)/iu],
 ['LINKUSDT',/(?:\blink(?:usdt)?\b|chainlink)/iu],
 ['LTCUSDT',/(?:\bltc(?:usdt)?\b|litecoin)/iu],
])
function extractMarketSignals(text=''){
 const source=ql7Str(text)
 const symbol=SYMBOL_ALIASES.find(([,re])=>re.test(source))?.[0]||'BTCUSDT'
 const rawTimeframe=source.match(/\b(?:1m|3m|5m|15m|30m|1h|2h|4h|6h|12h|1d|1w)\b/iu)?.[0]?.toLowerCase()
 const numeric=source.match(/\b(\d{1,2})\s*(?:m|min|мин|минут)\b/iu)?.[1]
 const hour=source.match(/\b(\d{1,2})\s*(?:h|hour|час)\b/iu)?.[1]
 const day=source.match(/\b(\d{1,2})\s*(?:d|day|день|дня)\b/iu)?.[1]
 const timeframe=rawTimeframe|| (numeric?`${numeric}m`:hour?`${hour}h`:day?`${day}d`:'5m')
 const hasAsset=CRYPTO_ASSET.test(source)
 const hasPrice=CRYPTO_PRICE.test(source)
 const hasAi=AI_RECOMMENDATION.test(source)
 const hasTimeframe=FINANCIAL_TIMEFRAME.test(source)
 const wantsAi=hasAi
 const wantsPrice=hasPrice||(hasAsset&&hasTimeframe)
 const explicit=Boolean(hasAi||hasPrice||(hasAsset&&hasTimeframe))
 return Object.freeze({active:explicit,symbol,timeframe,hasAsset,hasPrice,hasAi,hasTimeframe,wantsAi,wantsPrice,requiresEntitlement:wantsAi||/прогноз|рекомендац|signal|сигнал|analysis|analy[sz]e|تحليل|توصية|分析|建议|המלצ/iu.test(source),sourceHash:ql7StableHash(`${symbol}:${timeframe}:${wantsAi}:${wantsPrice}`)})
}

function catalogLookupText(text=''){return ql7Str(text).replace(/^(?:about|sobre|acerca\s+de|про|о|щодо|关于|關於)\s+/iu,'').replace(/([\p{Script=Han}])\1(?=\p{Script=Han})/gu,'$1').trim()}
function explicitCatalogTopicFor(text=''){const source=ql7Str(text);const raw=ql7Str(classifyQl7SupportCatalogTopic(source,'')||classifyQl7SupportCatalogTopic(catalogLookupText(source),''));return raw?normalizeQl7SupportTopic(raw):''}
function explicitCatalogAnchorTopicFor(text=''){const source=ql7Str(text);if(!/[:：]/u.test(source))return'';const head=source.split(/[:：]/u)[0];if(!head||head.length>96)return'';const raw=ql7Str(classifyQl7SupportCatalogTopic(head,'')||classifyQl7SupportCatalogTopic(catalogLookupText(head),''));return raw?normalizeQl7SupportTopic(raw):''}
function safetySourceFor(normalized={},fallbackText=''){const primary=ql7Str(normalized.normalizedText);const original=ql7Str(normalized.originalText||fallbackText);return original&&original!==primary?`${primary}\n${original}`:primary}
function isProtectedBoundary(text=''){return PROMPT_INJECTION.test(text)||PRIVACY_ATTACK.test(text)}
function isAmbiguousMetricsRequest(text='',signals={}){
 if(!AMBIGUOUS_METRICS_TOKEN.test(text))return false
 const specific=(hasBalanceSignal(text)||VIP.test(text)||VIP_STATUS_TYPO.test(text)||PACKAGE.test(text)||FORUM_TOPIC.test(text)||PROFILE_TOPIC.test(text)||METAMARKET_TOPIC.test(text)||TELEGRAM_TOPIC.test(text)||BATTLECOIN_TOPIC.test(text)||CRYPTO_ASSET.test(text)||AI_RECOMMENDATION.test(text)||hasAdsSignal(text,signals))
 if(specific)return false
 const bankTopic=topBankTopic(signals)
 return !bankTopic||bankTopic==='support_system'||bankTopic==='ads_campaigns'
}
function messageActFor(text,ledger,signals){
 const contactSignals=extractContactSignals(text)
 const marketSignals=extractMarketSignals(text)
 const explicitCatalogTopic=explicitCatalogTopicFor(text)
 const explicitAnchorTopic=explicitCatalogAnchorTopicFor(text)
 const explicitCatalogBlocksMarketAi=explicitCatalogTopic==='metamarket'||(explicitCatalogTopic==='homepage'&&/cryptoradar/iu.test(text))
 if(CRISIS_LANGUAGE.test(text))return'emotional_support'
 if(REPORTED_SPEECH.test(text))return'reported_speech'
 if(isProtectedBoundary(text))return'security_boundary'
 if(marketSignals.active&&(marketSignals.wantsAi||marketSignals.wantsPrice)&&!explicitCatalogBlocksMarketAi&&!isExplicitExchangeKnowledgeRequest(text,explicitAnchorTopic||explicitCatalogTopic))return'ai_recommendation_request'
 if(SCAM_CRIME.test(text))return'incident_report'
 if((contactSignals.offered||contactSignals.refused)&&Number(ledger?.business?.intakeTurns||0)>0)return Number(ledger?.business?.operatorRequestTurns||0)>0?'human_operator_request':'business_proposal'
 if(EMOTIONAL.test(text)||hasHit(signals,'emotional'))return'emotional_support'
 if(isAmbiguousMetricsRequest(text,signals))return'ambiguous_request'
 if(HUMOR.test(text))return'humor_request'
 if(GRATITUDE.test(text)||hasHit(signals,'thanks'))return'gratitude';if(GREETING.test(text)||hasHit(signals,'greetings'))return'greeting';if(FAREWELL.test(text)||hasHit(signals,'closure'))return'farewell';if(HUMOR_FOLLOWUP.test(text)&&ledger?.social?.humorMode)return'humor_followup';if(TOPIC_RECALL.test(text)||hasHit(signals,'topicRecall'))return'topic_recall';if(TOPIC_RESUME.test(text)||hasHit(signals,'topicResume'))return'topic_resume';if(IDENTITY.test(text))return'identity_question';if(CORRECTION.test(text)||hasHit(signals,'correction'))return'correction';if(OPERATOR_REQUEST.test(text))return'human_operator_request';if(WELLBEING.test(text)&&!hasMaterialSignal(text,signals))return'wellbeing_question';if(BUSINESS.test(text)||hasHit(signals,'business')||hasHit(signals,'investment'))return'business_proposal';if(hasTheftSignal(text))return'incident_report';if(isNoiseInput(text))return'spam_or_noise';if(HOW_TO.test(text)||hasHit(signals,'howTo'))return'how_to_question';if(ROADMAP.test(text))return'roadmap_question';if(isExplicitQcoinDataRequest(text,signals)||isExplicitVipDataRequest(text,signals)||isExplicitAdsPackageDataRequest(text,signals)||isExplicitAdsCampaignDataRequest(text,signals)||hasHit(signals,'dataRequest'))return'personal_status_request';if(isVagueDomainMention(text,signals))return'ambiguous_request';if(AMBIGUOUS.test(text))return'ambiguous_request';return hasMaterialSignal(text,signals)?'informational_question':'small_talk'
}
function topicFor(text,act,previous,signals,originalText=''){
 const explicitCatalogTopic=explicitCatalogTopicFor(text)
 const explicitAnchorTopic=explicitCatalogAnchorTopicFor(text)||explicitCatalogAnchorTopicFor(originalText)
 const marketSignals=extractMarketSignals(text)
 if(act==='security_boundary')return'security'
 if(act==='reported_speech')return'support_system'
 if(act==='spam_or_noise')return'support_system'
 if(act==='ambiguous_request'&&isAmbiguousMetricsRequest(text,signals))return'support_system'
 if(act==='ambiguous_request'&&isVagueDomainMention(text,signals))return'support_system'
 if((CONTACT.test(text)||CONTACT_REFUSAL.test(text)||CONTACT_CHANNEL_HINT.test(text))&&Number(previous?.business?.intakeTurns||0)>0)return ['partnership','investment','contact'].includes(previous?.activeTopic)?previous.activeTopic:'contact'
 if(hasTheftSignal(text)||isExplicitQcoinDataRequest(text,signals))return'qcoin'
 if(isExplicitVipDataRequest(text,signals))return'vip'
 if(isExplicitAdsPackageDataRequest(text,signals))return'ads_packages'
 if(explicitAnchorTopic==='exchange_ai')return'exchange_ai'
 if(explicitAnchorTopic==='exchange'&&act==='ai_recommendation_request')return'exchange_ai'
 if(explicitAnchorTopic)return explicitAnchorTopic
 if(hasAdsSignal(text,signals))return PACKAGE.test(text)?'ads_packages':METRICS.test(text)?'ads_campaigns':'ads_campaigns'
 if(SCAM_CRIME.test(text)&&!hasTheftSignal(text))return'security'
 if(OPERATOR_REQUEST.test(text)&&!BUSINESS.test(text))return'contact'
 if(BUSINESS.test(text))return INVESTMENT_SIGNAL.test(text)?'investment':'partnership'
 if(explicitCatalogTopic==='metamarket'||(explicitCatalogTopic==='homepage'&&/cryptoradar/iu.test(text)))return explicitCatalogTopic
 if(act==='ai_recommendation_request'||marketSignals.active)return'exchange_ai'
 if(explicitCatalogTopic&&!['exchange','exchange_ai'].includes(explicitCatalogTopic))return explicitCatalogTopic
 if(IDENTITY.test(text))return'support_system';if(explicitCatalogTopic)return explicitCatalogTopic;if(BATTLECOIN_TOPIC.test(text))return'battlecoin';if(QUANTUM_FAMILY_TOPIC.test(text))return'quantum_family';if(MODERATION_TOPIC.test(text))return'moderation';if(GEODETECT_TOPIC.test(text))return'geodetect';if(METAMARKET_TOPIC.test(text))return'metamarket';if(TELEGRAM_TOPIC.test(text))return'telegram';if(FORUM_THREADS_TOPIC.test(text))return'forum_threads';if(FORUM_FEED_TOPIC.test(text))return'forum_feed';if(FORUM_TOPIC.test(text))return'forum';if(PROFILE_TOPIC.test(text))return'profile';
 if(act==='topic_recall')return'support_system';if(act==='topic_resume')return previous?.activeTopic||'support_system'
 const bankTopic=topBankTopic(signals);if(bankTopic)return normalizeQl7SupportTopic(bankTopic)
 if(act==='emotional_support'&&!hasMaterialSignal(text,signals))return'support_system'
 if(['gratitude','greeting','farewell','wellbeing_question','small_talk','emotional_support','humor_request','humor_followup'].includes(act))return previous?.activeTopic||'support_system'
 return previous?.activeTopic||'support_system'
}
function socialActFor(act){return ['gratitude','greeting','farewell','wellbeing_question','small_talk','emotional_support','humor_request','humor_followup','topic_recall','topic_resume','spam_or_noise'].includes(act)?act:'none'}
function intentList(text,topic,act,signals,contactSignals={}){const out=[];if(!['none','small_talk'].includes(act))out.push(act);if(hasMaterialSignal(text,signals)||['qcoin','ads_packages','ads_campaigns','partnership','investment','contact','exchange_ai','security'].includes(topic))out.push(`${topic}:${act}`);if(OPERATOR_REQUEST.test(text))out.push('human_operator_request');if(CONTACT.test(text)||contactSignals.offered)out.push('contact_offer');if(contactSignals.refused)out.push('contact_dm_only');if(CRYPTO_PRICE.test(text)||AI_RECOMMENDATION.test(text))out.push('market_ai_recommendation');if(SCAM_CRIME.test(text))out.push('security_fraud_crime');return [...new Set(out)]}
function confidenceFor(topic,act,text,signals={},margin=0){
 if(act==='spam_or_noise')return .18
 if(act==='ambiguous_request'||isVagueDomainMention(text,signals))return .46
 if(hasTheftSignal(text)||VIP_STATUS_TYPO.test(text)||SCAM_CRIME.test(text)||CRISIS_LANGUAGE.test(text))return .98
 if(isExplicitQcoinDataRequest(text,signals)||isExplicitVipDataRequest(text,signals)||isExplicitAdsPackageDataRequest(text,signals)||isExplicitAdsCampaignDataRequest(text,signals))return .96
 if(BUSINESS.test(text)||OPERATOR_REQUEST.test(text)||IDENTITY.test(text)||CRYPTO_PRICE.test(text)||AI_RECOMMENDATION.test(text))return .92
 if(act==='topic_recall')return .94
 if(topic==='support_system'&&act==='small_talk')return .72
 return Math.max(.72,Math.min(.98,.78+Math.min(.16,Number(margin||0)/20)))
}
const COMPONENT_KEYS=Object.freeze(['lexicalScore','phraseScore','ngramScore','entityScore','syntaxScore','messageActScore','emotionScore','urgencyScore','explicitSwitchScore','currentGoalScore','recentMaterialTopicScore','verifiedContextScore','negativeEvidencePenalty','contradictionPenalty','staleContextPenalty','quotedSpeechPenalty','unrelatedAdapterPenalty'])
function emptyScore(){return Object.fromEntries(COMPONENT_KEYS.map(k=>[k,0]))}
function scoreTotal(row){return COMPONENT_KEYS.reduce((sum,key)=>sum+Number(row.components?.[key]||0),0)}
function semanticScoreModel({text,topic,act,previous={},signals={},safety={}}){
 const rows=new Map(),positive=[],negative=[]
 const ensure=(candidate)=>{const normalized=normalizeQl7SupportTopic(candidate||'support_system');if(!rows.has(normalized))rows.set(normalized,{topic:normalized,components:emptyScore(),signals:[]});return rows.get(normalized)}
 const add=(candidate,key,value,signal)=>{const row=ensure(candidate);row.components[key]+=Number(value||0);if(signal)row.signals.push(signal);if(signal&&value>=0)positive.push({topic:row.topic,signal,component:key,value});else if(signal)negative.push({topic:row.topic,signal,component:key,value})}
 add(topic,'lexicalScore',2,'selected_topic_rule')
 for(const row of ql7Arr(signals.topicWeights)){add(row.topic,'lexicalScore',Number(row.weight||0),`bank:${ql7Arr(row.hits).join('|')}`);add(row.topic,'phraseScore',ql7Arr(row.hits).length,`phrase:${row.topic}`)}
 if(hasTheftSignal(text)){add('qcoin','urgencyScore',3,'theft_or_missing_money');add('qcoin','entityScore',2,'qcoin_ledger_entity')}
 if(hasBalanceSignal(text))add('qcoin','entityScore',4,'balance_entity')
 if(PACKAGE.test(text)&&/elite/iu.test(text))add('ads_packages','entityScore',5,'elite_package_entity')
 if(hasAdsSignal(text,signals))add(PACKAGE.test(text)?'ads_packages':'ads_campaigns','entityScore',4,'ads_entity')
 if(VIP.test(text)||VIP_STATUS_TYPO.test(text))add('vip','entityScore',4,'vip_entity')
 const explicitCatalogTopic=explicitCatalogTopicFor(text)
 if(explicitCatalogTopic)add(explicitCatalogTopic,'entityScore',5,'catalog_exact_label')
 const marketSignals=extractMarketSignals(text)
 if(marketSignals.active&&explicitCatalogTopic!=='metamarket'){add('exchange_ai','entityScore',4,'market_asset_or_price_entity');if(marketSignals.requiresEntitlement)add('exchange_ai','verifiedContextScore',2,'ai_quota_or_vip_required');if(FINANCIAL_TIMEFRAME.test(text))add('exchange_ai','syntaxScore',1.5,'timeframe_entity')}
 if(SCAM_CRIME.test(text)){add('security','urgencyScore',4,'fraud_crime_signal');add('support_system','messageActScore',1,'operator_review_context')}
 if(act==='security_boundary')add('security','urgencyScore',8,'protected_boundary')
 if(act==='spam_or_noise')add('support_system','explicitSwitchScore',7,'noise_shape_clarification')
 if(act==='ambiguous_request')add('support_system','explicitSwitchScore',6,'ambiguous_metrics_choice')
 if(CRISIS_LANGUAGE.test(text))add('support_system','urgencyScore',5,'self_harm_language')
 if(FORUM_TOPIC.test(text)||FORUM_THREADS_TOPIC.test(text)||FORUM_FEED_TOPIC.test(text))add(topic.startsWith('forum')?topic:'forum','entityScore',3,'forum_entity')
 if(PROFILE_TOPIC.test(text))add('profile','entityScore',3,'profile_entity')
 if(BATTLECOIN_TOPIC.test(text))add('battlecoin','entityScore',4,'battlecoin_entity')
 if(QUANTUM_FAMILY_TOPIC.test(text))add('quantum_family','entityScore',4,'quantum_family_entity')
 if(MODERATION_TOPIC.test(text))add('moderation','entityScore',4,'moderation_entity')
 if(GEODETECT_TOPIC.test(text))add('geodetect','entityScore',4,'geodetect_entity')
 if(METAMARKET_TOPIC.test(text))add('metamarket','entityScore',3,'metamarket_entity')
 if(TELEGRAM_TOPIC.test(text))add('telegram','entityScore',3,'telegram_entity')
 if(OPERATOR_REQUEST.test(text)){add('contact','messageActScore',5,'human_operator_request');add('support_system','urgencyScore',1,'human_support_requested')}
 if(BUSINESS.test(text)||hasHit(signals,'business')||hasHit(signals,'investment'))add(INVESTMENT_SIGNAL.test(text)||hasHit(signals,'investment')?'investment':'partnership','entityScore',4,'business_relationship_entity')
 if(CONTACT.test(text)||CONTACT_CHANNEL_HINT.test(text))add('contact','entityScore',2,'contact_channel_hint')
 if(['personal_status_request','incident_report'].includes(act))add(topic,'messageActScore',2,`act:${act}`)
 if(['how_to_question','roadmap_question','informational_question'].includes(act))add(topic,'syntaxScore',1.5,`question:${act}`)
 if(act==='topic_recall'){add('support_system','explicitSwitchScore',7,'topic_recall_over_stale_topic');if(previous.activeTopic)add(previous.activeTopic,'staleContextPenalty',-5,'stale_topic_rejected_for_recall')}
 if(act==='topic_resume'&&previous.activeTopic)add(previous.activeTopic,'explicitSwitchScore',3,'resume_previous_material_topic')
 if(act==='emotional_support'){add(topic,'emotionScore',3,'emotional_intent');if(!hasMaterialSignal(text,signals)){for(const candidate of ['qcoin','ads_packages','ads_campaigns','profile','vip'])add(candidate,'unrelatedAdapterPenalty',-3,'emotion_without_data_request')}}
 if(safety?.threat||safety?.selfHarm)add('support_system','urgencyScore',8,'critical_safety')
 if(previous.activeGoal&&topic===previous.activeTopic)add(topic,'currentGoalScore',.5,'active_goal_continuity')
 if(previous.activeTopic&&!['topic_recall','greeting','gratitude','farewell','small_talk','emotional_support'].includes(act))add(previous.activeTopic,'recentMaterialTopicScore',.35,'recent_material_context')
 if(NEG_ADS.test(text))add('ads_campaigns','negativeEvidencePenalty',-6,'negative_ads_evidence')
 const candidates=[...rows.values()].map(row=>Object.freeze({...row,total:Number(scoreTotal(row).toFixed(3)),components:Object.freeze(Object.fromEntries(Object.entries(row.components).map(([k,v])=>[k,Number(v.toFixed(3))]))),signals:Object.freeze(row.signals.slice(0,12))})).sort((a,b)=>b.total-a.total)
 const top=candidates[0]?.total||0,second=candidates[1]?.total||0,positiveTotal=candidates.reduce((sum,row)=>sum+Math.max(0,row.total),0)||1
 const entropy=Number(candidates.slice(0,6).reduce((sum,row)=>{const p=Math.max(0,row.total)/positiveTotal;return p>0?sum-(p*Math.log2(p)):sum},0).toFixed(3))
 return Object.freeze({topicCandidates:Object.freeze(candidates),topicScores:Object.freeze(Object.fromEntries(candidates.map(row=>[row.topic,row.components]))),positiveSignals:Object.freeze(positive.slice(0,32)),negativeSignals:Object.freeze(negative.slice(0,32)),rejectedCandidates:Object.freeze(candidates.slice(1,8).map(row=>({topic:row.topic,total:row.total,reason:'lower_weighted_score'}))),confidenceMargin:Number((top-second).toFixed(3)),semanticEntropy:entropy,clarificationRequired:act==='ambiguous_request'||(candidates.length>1&&top-second<1.25)})
}
export function analyzeQl7SupportTurn({text='',locale='en',previousContext={},baseAnalysis={},baseRoute={},baseTone={},baseAnalysisTrust=false,now=Date.now}={}){
 const normalized=normalizeQl7SupportInput({text,locale:normalizeQl7SupportLocale(locale)});const source=normalized.normalizedText;const semanticSource=source.replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}⚠️]+/gu,'').trim();const semanticSignals=collectQl7SemanticSignals(semanticSource,normalized.locale);const contactSignals=extractContactSignals(semanticSource);const marketSignals=extractMarketSignals(semanticSource);const scamCrimeSignal=SCAM_CRIME.test(semanticSource);const canonicalMessageAct=messageActFor(semanticSource,previousContext,semanticSignals);const messageAct=baseAnalysisTrust===true&&ql7Str(baseAnalysis?.messageAct)?ql7Str(baseAnalysis.messageAct):canonicalMessageAct;const canonicalTopic=topicFor(semanticSource,messageAct,previousContext,semanticSignals,normalized.originalText||text);const topic=normalizeQl7SupportTopic(baseAnalysisTrust===true&&ql7Str(baseAnalysis?.topic)?ql7Str(baseAnalysis.topic):canonicalTopic);const safety=evaluateQl7SupportSafety({text:safetySourceFor(normalized,text),priorLedger:previousContext,now,locale:normalized.locale});const effectiveMessageAct=safety.category==='insult_uncertain'?'boundary_clarification':safety.category==='insult_denied'?'boundary_denial':messageAct;const emotionAssessment=assessQl7SupportEmotion({text:source,locale:normalized.locale});
 const scoring=semanticScoreModel({text:semanticSource,topic,act:effectiveMessageAct,previous:previousContext,signals:semanticSignals,safety});const materialIntents=intentList(source,topic,effectiveMessageAct,semanticSignals,contactSignals);const subtopic=classifyQl7SupportCatalogSubIntent(topic,source)||(baseAnalysisTrust===true?ql7Str(baseAnalysis?.subIntent):'')||`${topic}_general`;const correction=effectiveMessageAct==='correction'?{text:source,replaces:ql7Str(previousContext?.activeTopic),appliedTopic:topic}:null
 const needsChoice=effectiveMessageAct==='ambiguous_request'||effectiveMessageAct==='spam_or_noise';const emotionalSupport=effectiveMessageAct==='emotional_support';const humor=['humor_request','humor_followup'].includes(effectiveMessageAct);const businessReady=businessBriefReady(semanticSource,semanticSignals,contactSignals);const relationshipSignal=messageAct==='business_proposal'||messageAct==='human_operator_request'||['partnership','investment','contact'].includes(topic)||BUSINESS.test(source)||hasHit(semanticSignals,'business')||hasHit(semanticSignals,'investment')
 const adapterGates=Object.freeze({qcoin:isExplicitQcoinDataRequest(semanticSource,semanticSignals),vip:isExplicitVipDataRequest(semanticSource,semanticSignals),ads_packages:isExplicitAdsPackageDataRequest(semanticSource,semanticSignals),ads_campaigns:isExplicitAdsCampaignDataRequest(semanticSource,semanticSignals),exchange_ai:effectiveMessageAct==='ai_recommendation_request'&&topic==='exchange_ai'&&(marketSignals.wantsAi||marketSignals.wantsPrice)})
 const adapterEligibility=Object.freeze({qcoin:['personal_status_request','incident_report'].includes(effectiveMessageAct)&&topic==='qcoin'&&adapterGates.qcoin,vip:effectiveMessageAct==='personal_status_request'&&topic==='vip'&&adapterGates.vip,ads_packages:effectiveMessageAct==='personal_status_request'&&topic==='ads_packages'&&adapterGates.ads_packages,ads_campaigns:effectiveMessageAct==='personal_status_request'&&topic==='ads_campaigns'&&adapterGates.ads_campaigns,payments:effectiveMessageAct==='personal_status_request'&&topic==='payments',exchange_ai:adapterGates.exchange_ai,mongoReadAllowed:((['personal_status_request','incident_report'].includes(effectiveMessageAct)&&((topic==='qcoin'&&adapterGates.qcoin)||(topic==='vip'&&adapterGates.vip)||(topic==='ads_packages'&&adapterGates.ads_packages)||(topic==='ads_campaigns'&&adapterGates.ads_campaigns)||['payments','profile','forum','forum_feed','forum_threads','metamarket','telegram','battlecoin','quantum_family','moderation','geodetect'].includes(topic)))||adapterGates.exchange_ai)&&!emotionalSupport&&!['topic_recall','spam_or_noise','ambiguous_request'].includes(effectiveMessageAct)})
 const primaryIntent=materialIntents[0]||effectiveMessageAct;const secondaryIntents=Object.freeze(materialIntents.slice(1));const deferredIntents=Object.freeze(emotionalSupport&&hasMaterialSignal(source,semanticSignals)?materialIntents.filter(v=>v!==primaryIntent):[])
 const analysis=Object.freeze({...baseAnalysis,language:normalized.locale,locale:normalized.locale,originalText:normalized.originalText,normalizedText:normalized.normalizedText,canonicalText:normalized.canonicalText,normalization:normalized,semanticBankVersion:QL7_SUPPORT_SEMANTIC_BANK_VERSION,semanticSignals,socialAct:socialActFor(effectiveMessageAct),materialIntents:Object.freeze(materialIntents),primaryIntent,secondaryIntents,deferredIntents,safetyIntent:safety.threat||safety.selfHarm?safety.category:'',emotionalIntent:emotionalSupport?'supportive_stabilization':'',dataIntent:adapterEligibility.mongoReadAllowed?topic:'',operatorIntent:safety.operatorRequired?'operator_review':messageAct==='human_operator_request'?'human_operator_requested':scamCrimeSignal?'security_fraud_crime_review':relationshipSignal?'relationship_intake':'',contactSignals,contactOffered:contactSignals.offered,contactRefused:contactSignals.refused,contactConsent:contactSignals.consent,contactChannels:contactSignals.channels,contactPreferred:contactSignals.preferred,businessIntent:relationshipSignal?'strategic_relationship':'',businessBriefReady:businessReady,relationshipSignal,marketIntent:adapterGates.exchange_ai?'crypto_ai_recommendation':'',marketSignals,scamCrimeSignal,topic,subtopic,subIntent:subtopic,messageAct:effectiveMessageAct,role:effectiveMessageAct,correction,rejectedHypothesis:correction?{topic:ql7Str(previousContext?.activeTopic),reason:'user_correction',text:source}:null,denial:effectiveMessageAct==='correction',emotion:emotionalSupport?'distress':humor?'playful':safety.frustration?'frustrated':relationshipSignal?'focused':scamCrimeSignal?'strict':'neutral',urgency:safety.threat||safety.selfHarm?'critical':hasTheftSignal(source)||scamCrimeSignal?'high':messageAct==='human_operator_request'?'medium':'normal',commercialIntent:relationshipSignal,safetyCategory:safety.category,safety,emotionAssessment,needsChoice,clarificationRequired:needsChoice||scoring.clarificationRequired,emotionalSupport,humor,adapterGates,requiresAdapter:adapterEligibility.mongoReadAllowed&&['qcoin','vip','ads_packages','ads_campaigns','payments','profile','forum','forum_feed','forum_threads','metamarket','telegram','battlecoin','quantum_family','moderation','geodetect','exchange_ai'].includes(topic),adapterEligibility,topicCandidates:scoring.topicCandidates,topicScores:scoring.topicScores,positiveSignals:scoring.positiveSignals,negativeSignals:scoring.negativeSignals,rejectedCandidates:scoring.rejectedCandidates,confidenceMargin:scoring.confidenceMargin,semanticEntropy:scoring.semanticEntropy,confidence:confidenceFor(topic,effectiveMessageAct,source,semanticSignals,scoring.confidenceMargin),fingerprint:ql7StableHash(`${normalized.fingerprint}:${topic}:${effectiveMessageAct}`)})
 const route=Object.freeze({...baseRoute,topic,messageAct:effectiveMessageAct,subIntent:subtopic,confidence:analysis.confidence,confidenceMargin:analysis.confidenceMargin,semanticEntropy:analysis.semanticEntropy,needsChoice,clarificationRequired:analysis.clarificationRequired,adapterEligibility,requiredAdapter:analysis.requiresAdapter?topic:''})
 const tone=Object.freeze({...baseTone,category:safety.category,taxonomyCategory:safety.category,severity:safety.severity,threat:safety.threat,safetyEscalation:safety.operatorRequired,profanityDetected:safety.insult,directedAtSupport:safety.insult})
 return Object.freeze({version:QL7_SUPPORT_ANALYZE_TURN_VERSION,locale:normalized.locale,normalization:normalized,safety,tone,route,analysis})
}
export const analyzeQl7SupportTurnV13=analyzeQl7SupportTurn
